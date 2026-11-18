import { useCallback, useEffect, useState } from 'react';
import { INITIAL_DARVIS_STATE } from '../data/seedData';
import { toHabitDateKey, toggleHabitCompletionForDate } from '../lib/dailyHabits';
import type {
  AuditLogEntry,
  ChatMessage,
  DailyHabit,
  DarvisState,
  GoalDomain,
  KnowledgeNote,
  LongTermGoal,
  MemoryCategory,
  MemoryItem,
  ModuleId,
  ProjectItem,
  ProposedAction,
  SystemSettings,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../types/darvis';

const STORAGE_KEY = 'darvis_os_state_v1';

function loadInitialState(): DarvisState {
  if (typeof window === 'undefined') return INITIAL_DARVIS_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DARVIS_STATE;
    const parsed = JSON.parse(raw) as Partial<DarvisState>;
    return {
      ...INITIAL_DARVIS_STATE,
      ...parsed,
      trainingRoutines:
        parsed.trainingRoutines ?? INITIAL_DARVIS_STATE.trainingRoutines,
      trainingHistory:
        parsed.trainingHistory ?? INITIAL_DARVIS_STATE.trainingHistory,
      dailyHabits:
        parsed.dailyHabits ?? INITIAL_DARVIS_STATE.dailyHabits,
      longTermGoals:
        parsed.longTermGoals ?? INITIAL_DARVIS_STATE.longTermGoals,
      settings: {
        ...INITIAL_DARVIS_STATE.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return INITIAL_DARVIS_STATE;
  }
}

function createLog(
  actor: AuditLogEntry['actor'],
  action: string,
  module: ModuleId,
  details: string,
  severity: AuditLogEntry['severity'] = 'info'
): AuditLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    module,
    details,
    severity,
  };
}

export function useDarvisStore() {
  const [state, setState] = useState<DarvisState>(() => loadInitialState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [state]);

  const addMemory = useCallback(
    (input: {
      title: string;
      content: string;
      category: MemoryCategory;
      tags: string[];
      projectId?: string;
      source?: MemoryItem['source'];
    }) => {
      const now = new Date().toISOString();
      const newMemory: MemoryItem = {
        id: `mem-${Date.now()}`,
        title: input.title.trim(),
        content: input.content.trim(),
        category: input.category,
        tags: input.tags,
        projectId: input.projectId,
        source: input.source ?? 'Manual',
        createdAt: now,
        updatedAt: now,
        isDemo: false,
      };
      setState((prev) => ({
        ...prev,
        memories: [newMemory, ...prev.memories],
        auditLog: [
          createLog(
            input.source === 'Assistente IA' ? 'D.A.R.V.I.S. IA' : 'Usuário',
            'Memória registrada',
            'memory',
            `"${newMemory.title}" em ${newMemory.category}`
          ),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const deleteMemory = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.memories.find((m) => m.id === id);
      return {
        ...prev,
        memories: prev.memories.filter((m) => m.id !== id),
        auditLog: target
          ? [
              createLog(
                'Usuário',
                'Memória removida',
                'memory',
                `Removida "${target.title}"`,
                'warning'
              ),
              ...prev.auditLog,
            ]
          : prev.auditLog,
      };
    });
  }, []);

  const addTask = useCallback(
    (input: {
      title: string;
      category: string;
      priority: TaskPriority;
      dueDate: string;
      projectId?: string;
    }) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: input.title.trim(),
        category: input.category.trim() || 'Geral',
        priority: input.priority,
        status: 'pendente',
        dueDate: input.dueDate || new Date().toISOString().slice(0, 10),
        projectId: input.projectId,
        isDemo: false,
      };
      setState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        auditLog: [
          createLog('Usuário', 'Tarefa criada', 'management', `"${newTask.title}"`),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === id);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        auditLog: target
          ? [
              createLog(
                'Usuário',
                'Status de tarefa atualizado',
                'management',
                `"${target.title}" -> ${status}`
              ),
              ...prev.auditLog,
            ]
          : prev.auditLog,
      };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === id);
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        auditLog: target
          ? [
              createLog('Usuário', 'Tarefa removida', 'management', `"${target.title}"`, 'warning'),
              ...prev.auditLog,
            ]
          : prev.auditLog,
      };
    });
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shopping: prev.shopping.map((s) =>
        s.id === id ? { ...s, purchased: !s.purchased } : s
      ),
    }));
  }, []);

  const addShoppingItem = useCallback(
    (name: string, category: string, estimatedCost: number) => {
      setState((prev) => ({
        ...prev,
        shopping: [
          {
            id: `shop-${Date.now()}`,
            name: name.trim(),
            category: category.trim() || 'Geral',
            estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : 0,
            purchased: false,
            isDemo: false,
          },
          ...prev.shopping,
        ],
        auditLog: [
          createLog('Usuário', 'Item de compra adicionado', 'management', name.trim()),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const addFinanceEntry = useCallback(
    (input: {
      description: string;
      amount: number;
      type: 'receita' | 'despesa';
      category: string;
    }) => {
      setState((prev) => ({
        ...prev,
        finances: [
          {
            id: `fin-${Date.now()}`,
            description: input.description.trim(),
            amount: Math.abs(input.amount),
            type: input.type,
            category: input.category.trim() || 'Pessoal',
            date: new Date().toISOString().slice(0, 10),
            isDemo: false,
          },
          ...prev.finances,
        ],
        auditLog: [
          createLog(
            'Usuário',
            'Lançamento financeiro registrado',
            'management',
            `${input.type === 'receita' ? '+' : '-'} R$ ${Math.abs(input.amount).toFixed(2)} · ${input.description}`
          ),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const toggleProjectMilestone = useCallback((projectId: string, milestoneId: string) => {
    setState((prev) => {
      const proj = prev.projects.find((p) => p.id === projectId);
      const ms = proj?.milestones.find((m) => m.id === milestoneId);
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                updatedAt: new Date().toISOString().slice(0, 10),
                milestones: p.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, completed: !m.completed } : m
                ),
              }
        ),
        auditLog:
          proj && ms
            ? [
                createLog(
                  'Usuário',
                  'Etapa de projeto atualizada',
                  'projects',
                  `${proj.name}: "${ms.title}" (${!ms.completed ? 'concluída' : 'reaberta'})`
                ),
                ...prev.auditLog,
              ]
            : prev.auditLog,
      };
    });
  }, []);

  const addProject = useCallback(
    (input: { name: string; objective: string; phase: string; firstMilestone: string }) => {
      const today = new Date().toISOString().slice(0, 10);
      const newProject: ProjectItem = {
        id: `proj-${Date.now()}`,
        name: input.name.trim(),
        objective: input.objective.trim(),
        status: 'ativo',
        phase: input.phase.trim() || 'Planejamento Inicial',
        milestones: input.firstMilestone.trim()
          ? [{ id: `ms-${Date.now()}`, title: input.firstMilestone.trim(), completed: false }]
          : [],
        pendingItems: [],
        history: [{ id: `h-${Date.now()}`, date: today, note: 'Projeto criado no sistema.' }],
        updatedAt: today,
        isDemo: false,
      };
      setState((prev) => ({
        ...prev,
        projects: [newProject, ...prev.projects],
        auditLog: [
          createLog('Usuário', 'Projeto criado', 'projects', newProject.name),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const addProjectMilestone = useCallback((projectId: string, title: string) => {
    if (!title.trim()) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              updatedAt: new Date().toISOString().slice(0, 10),
              milestones: [
                ...p.milestones,
                { id: `ms-${Date.now()}`, title: title.trim(), completed: false },
              ],
            }
      ),
    }));
  }, []);

  const saveNote = useCallback(
    (note: { id?: string; title: string; folder: string; content: string; tags: string[] }) => {
      const today = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        if (note.id) {
          return {
            ...prev,
            notes: prev.notes.map((n) =>
              n.id === note.id
                ? {
                    ...n,
                    title: note.title.trim(),
                    folder: note.folder.trim() || '00-Inbox',
                    content: note.content,
                    tags: note.tags,
                    updatedAt: today,
                    isDemo: false,
                  }
                : n
            ),
            auditLog: [
              createLog('Usuário', 'Nota atualizada', 'knowledge', `"${note.title.trim()}"`),
              ...prev.auditLog,
            ],
          };
        }
        const created: KnowledgeNote = {
          id: `note-${Date.now()}`,
          title: note.title.trim(),
          folder: note.folder.trim() || '00-Inbox',
          content: note.content,
          tags: note.tags,
          updatedAt: today,
          syncStatus: 'simulated',
          isDemo: false,
        };
        return {
          ...prev,
          notes: [created, ...prev.notes],
          auditLog: [
            createLog('Usuário', 'Nota criada', 'knowledge', `"${created.title}"`),
            ...prev.auditLog,
          ],
        };
      });
    },
    []
  );

  const simulateAutomation = useCallback((automationId: string) => {
    setState((prev) => {
      const target = prev.automations.find((a) => a.id === automationId);
      if (!target) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        automations: prev.automations.map((a) =>
          a.id === automationId
            ? { ...a, lastRunAt: now, runCount: a.runCount + 1 }
            : a
        ),
        auditLog: [
          createLog(
            'Sistema',
            'Simulação de automação executada',
            'automations',
            `Rotina "${target.name}" executada em modo de simulação local.`
          ),
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const appendChatMessage = useCallback((msg: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, msg],
    }));
  }, []);

  const resolveProposedAction = useCallback(
    (messageId: string, actionId: string, decision: 'approved' | 'rejected') => {
      setState((prev) => {
        let executedAction: ProposedAction | undefined;
        const updatedMessages = prev.chatMessages.map((msg) => {
          if (msg.id !== messageId || !msg.proposedActions) return msg;
          return {
            ...msg,
            proposedActions: msg.proposedActions.map((act) => {
              if (act.id !== actionId) return act;
              executedAction = act;
              return { ...act, status: decision };
            }),
          };
        });

        if (!executedAction || executedAction.status !== 'pending') {
          return { ...prev, chatMessages: updatedMessages };
        }

        if (decision === 'rejected') {
          return {
            ...prev,
            chatMessages: updatedMessages,
            auditLog: [
              createLog(
                'Usuário',
                'Ação sugerida recusada',
                'assistant',
                `Recusada: ${executedAction.label}`,
                'warning'
              ),
              ...prev.auditLog,
            ],
          };
        }

        const now = new Date().toISOString();
        const nextTasks = [...prev.tasks];
        const nextMemories = [...prev.memories];
        const nextNotes = [...prev.notes];

        if (executedAction.type === 'create_task') {
          nextTasks.unshift({
            id: `task-${Date.now()}`,
            title: executedAction.payload.title,
            category: executedAction.payload.category || 'Assistente IA',
            priority: executedAction.payload.priority || 'media',
            status: 'pendente',
            dueDate: executedAction.payload.dueDate || now.slice(0, 10),
            isDemo: false,
          });
        } else if (executedAction.type === 'create_memory') {
          nextMemories.unshift({
            id: `mem-${Date.now()}`,
            title: executedAction.payload.title,
            content: executedAction.payload.content || executedAction.payload.title,
            category:
              (executedAction.payload.category as MemoryCategory) || 'Contexto Pessoal',
            tags: ['assistente'],
            source: 'Assistente IA',
            createdAt: now,
            updatedAt: now,
            isDemo: false,
          });
        } else if (executedAction.type === 'create_note') {
          nextNotes.unshift({
            id: `note-${Date.now()}`,
            title: executedAction.payload.title,
            folder: executedAction.payload.category || '00-Inbox',
            content: executedAction.payload.content || `# ${executedAction.payload.title}`,
            tags: ['assistente'],
            updatedAt: now.slice(0, 10),
            syncStatus: 'simulated',
            isDemo: false,
          });
        }

        return {
          ...prev,
          tasks: nextTasks,
          memories: nextMemories,
          notes: nextNotes,
          chatMessages: updatedMessages,
          auditLog: [
            createLog(
              'Usuário',
              'Ação de IA aprovada e executada',
              'assistant',
              `Aprovada: ${executedAction.label}`,
              'approval'
            ),
            ...prev.auditLog,
          ],
        };
      });
    },
    []
  );

  const toggleTrainingExercise = useCallback(
    (routineId: string, exerciseId: string) => {
      setState((prev) => ({
        ...prev,
        trainingRoutines: prev.trainingRoutines.map((routine) =>
          routine.id !== routineId
            ? routine
            : {
                ...routine,
                exercises: routine.exercises.map((ex) =>
                  ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
                ),
              }
        ),
      }));
    },
    []
  );

  const addTrainingExercise = useCallback(
    (routineId: string, input: { name: string; sets: string; load: string }) => {
      const trimmed = input.name.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        trainingRoutines: prev.trainingRoutines.map((routine) =>
          routine.id !== routineId
            ? routine
            : {
                ...routine,
                exercises: [
                  ...routine.exercises,
                  {
                    id: `ex-${Date.now()}`,
                    name: trimmed,
                    sets: input.sets.trim() || '3x10',
                    load: input.load.trim() || 'Corporal',
                    completed: false,
                  },
                ],
              }
        ),
        auditLog: [
          createLog('Usuário', 'Exercício adicionado ao treino', 'training', trimmed),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const resetTrainingRoutine = useCallback((routineId: string) => {
    setState((prev) => ({
      ...prev,
      trainingRoutines: prev.trainingRoutines.map((routine) =>
        routine.id !== routineId
          ? routine
          : {
              ...routine,
              exercises: routine.exercises.map((ex) => ({ ...ex, completed: false })),
            }
      ),
    }));
  }, []);

  const logTrainingSession = useCallback(
    (input: {
      routineId: string;
      routineName: string;
      durationSeconds: number;
      exercisesCompleted: number;
      totalExercises: number;
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        trainingHistory: [
          {
            id: `tlog-${Date.now()}`,
            routineName: input.routineName,
            completedAt: now,
            durationSeconds: input.durationSeconds,
            exercisesCompleted: input.exercisesCompleted,
            totalExercises: input.totalExercises,
            notes: input.notes?.trim() || undefined,
          },
          ...prev.trainingHistory,
        ],
        trainingRoutines: prev.trainingRoutines.map((routine) =>
          routine.id !== input.routineId
            ? routine
            : {
                ...routine,
                exercises: routine.exercises.map((ex) => ({ ...ex, completed: false })),
              }
        ),
        auditLog: [
          createLog(
            'Usuário',
            'Sessão de treino concluída',
            'training',
            `${input.routineName} (${input.exercisesCompleted}/${input.totalExercises} exercícios)`
          ),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<SystemSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
      auditLog: [
        createLog(
          'Usuário',
          'Configurações atualizadas',
          'settings',
          `Parâmetros alterados: ${Object.keys(patch).join(', ')}`
        ),
        ...prev.auditLog,
      ],
    }));
  }, []);

  const toggleDailyHabit = useCallback((habitId: string, dateKey = toHabitDateKey()) => {
    setState((prev) => {
      const target = prev.dailyHabits.find((h) => h.id === habitId);
      if (!target) return prev;
      const wasCompleted = target.completedDates.includes(dateKey);
      return {
        ...prev,
        dailyHabits: prev.dailyHabits.map((h) =>
          h.id !== habitId
            ? h
            : {
                ...h,
                completedDates: toggleHabitCompletionForDate(h.completedDates, dateKey),
              }
        ),
        auditLog: [
          createLog(
            'Usuário',
            wasCompleted ? 'Hábito diário desmarcado' : 'Hábito diário concluído',
            'dashboard',
            `"${target.title}" (${dateKey})`
          ),
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const addDailyHabit = useCallback(
    (input: { title: string; category: string; targetLabel: string }) => {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) return;
      const newHabit: DailyHabit = {
        id: `habit-${Date.now()}`,
        title: trimmedTitle,
        category: input.category.trim() || 'Rotina',
        targetLabel: input.targetLabel.trim() || 'Diário',
        completedDates: [],
        isDemo: false,
      };
      setState((prev) => ({
        ...prev,
        dailyHabits: [...prev.dailyHabits, newHabit],
        auditLog: [
          createLog('Usuário', 'Hábito diário adicionado', 'dashboard', `"${newHabit.title}"`),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const deleteDailyHabit = useCallback((habitId: string) => {
    setState((prev) => {
      const target = prev.dailyHabits.find((h) => h.id === habitId);
      if (!target) return prev;
      return {
        ...prev,
        dailyHabits: prev.dailyHabits.filter((h) => h.id !== habitId),
        auditLog: [
          createLog('Usuário', 'Hábito diário removido', 'dashboard', `"${target.title}"`, 'warning'),
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const toggleLongTermGoalMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setState((prev) => {
        const targetGoal = prev.longTermGoals.find((g) => g.id === goalId);
        if (!targetGoal) return prev;

        if (targetGoal.linkedProjectId) {
          const linkedProj = prev.projects.find(
            (p) => p.id === targetGoal.linkedProjectId
          );
          if (linkedProj) {
            const ms = linkedProj.milestones.find((m) => m.id === milestoneId);
            return {
              ...prev,
              projects: prev.projects.map((p) =>
                p.id !== linkedProj.id
                  ? p
                  : {
                      ...p,
                      updatedAt: new Date().toISOString().slice(0, 10),
                      milestones: p.milestones.map((m) =>
                        m.id === milestoneId ? { ...m, completed: !m.completed } : m
                      ),
                    }
              ),
              auditLog: ms
                ? [
                    createLog(
                      'Usuário',
                      'Marco de meta/projeto atualizado',
                      'dashboard',
                      `${targetGoal.title}: "${ms.title}" (${!ms.completed ? 'concluído' : 'reaberto'})`
                    ),
                    ...prev.auditLog,
                  ]
                : prev.auditLog,
            };
          }
        }

        const targetMs = targetGoal.milestones.find((m) => m.id === milestoneId);
        return {
          ...prev,
          longTermGoals: prev.longTermGoals.map((g) =>
            g.id !== goalId
              ? g
              : {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, completed: !m.completed } : m
                  ),
                }
          ),
          auditLog: targetMs
            ? [
                createLog(
                  'Usuário',
                  'Marco de meta atualizado',
                  'dashboard',
                  `${targetGoal.title}: "${targetMs.title}" (${!targetMs.completed ? 'concluído' : 'reaberto'})`
                ),
                ...prev.auditLog,
              ]
            : prev.auditLog,
        };
      });
    },
    []
  );

  const addLongTermGoal = useCallback(
    (input: {
      title: string;
      domain: GoalDomain;
      horizon: string;
      firstMilestone: string;
    }) => {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) return;
      const newGoal: LongTermGoal = {
        id: `goal-${Date.now()}`,
        title: trimmedTitle,
        domain: input.domain,
        horizon: input.horizon.trim() || '2027',
        milestones: input.firstMilestone.trim()
          ? [
              {
                id: `gm-${Date.now()}`,
                title: input.firstMilestone.trim(),
                completed: false,
              },
            ]
          : [],
        isDemo: false,
      };
      setState((prev) => ({
        ...prev,
        longTermGoals: [newGoal, ...prev.longTermGoals],
        auditLog: [
          createLog('Usuário', 'Meta de longo prazo criada', 'dashboard', `"${newGoal.title}"`),
          ...prev.auditLog,
        ],
      }));
    },
    []
  );

  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      chatMessages: INITIAL_DARVIS_STATE.chatMessages,
      auditLog: [
        createLog('Usuário', 'Sessão de chat reiniciada', 'assistant', 'Histórico limpo.'),
        ...prev.auditLog,
      ],
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    setState(INITIAL_DARVIS_STATE);
  }, []);

  return {
    state,
    addMemory,
    deleteMemory,
    addTask,
    updateTaskStatus,
    deleteTask,
    toggleShoppingItem,
    addShoppingItem,
    addFinanceEntry,
    toggleProjectMilestone,
    addProject,
    addProjectMilestone,
    saveNote,
    simulateAutomation,
    appendChatMessage,
    resolveProposedAction,
    toggleTrainingExercise,
    addTrainingExercise,
    resetTrainingRoutine,
    logTrainingSession,
    toggleDailyHabit,
    addDailyHabit,
    deleteDailyHabit,
    toggleLongTermGoalMilestone,
    addLongTermGoal,
    updateSettings,
    clearChat,
    resetDemoData,
  };
}
