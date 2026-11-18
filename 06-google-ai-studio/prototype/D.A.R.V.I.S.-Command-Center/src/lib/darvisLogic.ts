import type {
  DarvisState,
  MemoryItem,
  ProjectMilestone,
  ProposedAction,
  TaskItem,
} from '../types/darvis';

export function getContextualGreeting(hour: number, userName: string): {
  greeting: string;
  periodLabel: string;
} {
  const firstName = userName.trim().split(/\s+/)[0] || 'David';
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Bom dia, ${firstName}`,
      periodLabel: 'Ciclo matinal · Foco em prioridades',
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      greeting: `Boa tarde, ${firstName}`,
      periodLabel: 'Ciclo operacional · Execução em andamento',
    };
  }
  return {
    greeting: `Boa noite, ${firstName}`,
    periodLabel: 'Ciclo noturno · Revisão e consolidação',
  };
}

export function calculateProjectProgress(milestones: ProjectMilestone[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = milestones.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = milestones.filter((m) => m.completed).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function filterMemories(
  memories: MemoryItem[],
  query: string,
  category: string
): MemoryItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return memories.filter((item) => {
    const matchesCategory = category === 'Todas' || item.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      item.title,
      item.content,
      item.category,
      item.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function filterTasks(
  tasks: TaskItem[],
  statusFilter: string,
  priorityFilter: string,
  query: string
): TaskItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesStatus = statusFilter === 'todas' || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'todas' || task.priority === priorityFilter;
    if (!matchesStatus || !matchesPriority) return false;
    if (!normalizedQuery) return true;
    return (
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function computeDashboardMetrics(state: DarvisState) {
  const pendingTasks = state.tasks.filter((t) => t.status !== 'concluida').length;
  const highPriorityTasks = state.tasks.filter(
    (t) => t.status !== 'concluida' && t.priority === 'alta'
  ).length;
  const completedTasks = state.tasks.filter((t) => t.status === 'concluida').length;
  const activeProjects = state.projects.filter((p) => p.status === 'ativo').length;
  const totalMemories = state.memories.length;
  const totalNotes = state.notes.length;
  const monthlyBalance = state.finances.reduce((acc, item) => {
    return item.type === 'receita' ? acc + item.amount : acc - item.amount;
  }, 0);

  return {
    pendingTasks,
    highPriorityTasks,
    completedTasks,
    activeProjects,
    totalMemories,
    totalNotes,
    upcomingCommitments: state.commitments.length,
    monthlyBalance,
  };
}

export function buildAiContextPrompt(state: DarvisState): string {
  if (!state.settings.injectMemoryContext) {
    return 'Contexto de memória desativado pelo usuário para esta sessão.';
  }

  const recentMemories = state.memories
    .slice(0, 8)
    .map((m) => `- [${m.category}] ${m.title}: ${m.content}`)
    .join('\n');

  const openTasks = state.tasks
    .filter((t) => t.status !== 'concluida')
    .slice(0, 8)
    .map((t) => `- (${t.priority}) ${t.title} [prazo: ${t.dueDate}]`)
    .join('\n');

  const activeProjects = state.projects
    .filter((p) => p.status === 'ativo' || p.status === 'planejamento')
    .map((p) => {
      const prog = calculateProjectProgress(p.milestones);
      return `- ${p.name} (${p.phase}, ${prog.percentage}%): ${p.objective}`;
    })
    .join('\n');

  return [
    'MEMÓRIAS PERSISTENTES ATIVAS:',
    recentMemories || '(Nenhuma memória registrada)',
    '',
    'TAREFAS PENDENTES:',
    openTasks || '(Nenhuma tarefa pendente)',
    '',
    'PROJETOS ATIVOS:',
    activeProjects || '(Nenhum projeto ativo)',
  ].join('\n');
}

export function parseAiActionProposals(rawText: string): {
  cleanText: string;
  actions: ProposedAction[];
} {
  const actions: ProposedAction[] = [];
  const blockRegex = /\[DARVIS_ACTION\]([\s\S]*?)\[\/DARVIS_ACTION\]/g;

  let index = 0;
  const cleanText = rawText
    .replace(blockRegex, (_match, jsonBody: string) => {
      try {
        const parsed = JSON.parse(jsonBody.trim());
        if (
          parsed &&
          typeof parsed.type === 'string' &&
          parsed.payload &&
          typeof parsed.payload.title === 'string'
        ) {
          index += 1;
          actions.push({
            id: `act-${Date.now()}-${index}`,
            type: parsed.type,
            label:
              typeof parsed.label === 'string'
                ? parsed.label
                : parsed.type === 'create_task'
                ? 'Criar Tarefa'
                : parsed.type === 'create_memory'
                ? 'Registrar Memória'
                : 'Criar Nota de Conhecimento',
            payload: {
              title: parsed.payload.title,
              content: parsed.payload.content,
              category: parsed.payload.category,
              priority: parsed.payload.priority,
              dueDate: parsed.payload.dueDate,
            },
            status: 'pending',
          });
        }
      } catch {
        // Ignore malformed JSON blocks gracefully
      }
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanText, actions };
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  priority: TaskItem['priority'];
  dueDate: string;
  daysRemaining: number;
  urgencyLabel: string;
}

export interface TaskInsightsSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingDeadlines: UpcomingDeadlineItem[];
}

function toIsoDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeTaskInsights(
  tasks: TaskItem[],
  referenceDate: Date = new Date()
): TaskInsightsSummary {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'concluida').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'em_andamento').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pendente').length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const todayKey = toIsoDateKey(referenceDate);
  const todayMidnight = new Date(`${todayKey}T00:00:00Z`).getTime();
  const msPerDay = 86_400_000;

  const openTasks = tasks
    .filter((t) => t.status !== 'concluida' && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate))
    .map((task) => {
      const dueMidnight = new Date(`${task.dueDate}T00:00:00Z`).getTime();
      const daysRemaining = Math.round((dueMidnight - todayMidnight) / msPerDay);
      const urgencyLabel =
        daysRemaining < 0
          ? `Atrasada (${Math.abs(daysRemaining)}d)`
          : daysRemaining === 0
          ? 'Vence hoje'
          : `Em ${daysRemaining}d`;

      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        daysRemaining,
        urgencyLabel,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueCount = openTasks.filter((t) => t.daysRemaining < 0).length;
  const dueSoonCount = openTasks.filter(
    (t) => t.daysRemaining >= 0 && t.daysRemaining <= 7
  ).length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    completionRate,
    overdueCount,
    dueSoonCount,
    upcomingDeadlines: openTasks.slice(0, 3),
  };
}

