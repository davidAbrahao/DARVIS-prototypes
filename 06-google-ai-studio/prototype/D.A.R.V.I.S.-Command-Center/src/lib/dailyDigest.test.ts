import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDailyDigest, formatDailyDigestText } from './dailyDigest';
import { INITIAL_DARVIS_STATE } from '../data/seedData';
import type { CommitmentItem, ProjectItem, TaskItem } from '../types/darvis';

test('computeDailyDigest summarizes seed state completed tasks, active milestones, and priorities', () => {
  const ref = new Date(2026, 10, 17, 9, 30, 0); // 2026-11-17
  const digest = computeDailyDigest({
    tasks: INITIAL_DARVIS_STATE.tasks,
    projects: INITIAL_DARVIS_STATE.projects,
    commitments: INITIAL_DARVIS_STATE.commitments,
    userName: INITIAL_DARVIS_STATE.settings.userName,
    referenceDate: ref,
  });

  assert.equal(digest.dateKey, '2026-11-17');
  assert.equal(digest.dateLabel, '17 nov 2026');
  assert.equal(digest.completedTasks.count, 1);
  assert.equal(digest.completedTasks.total, INITIAL_DARVIS_STATE.tasks.length);
  assert.equal(digest.completedTasks.items[0].title, 'Revisar orçamento mensal de infraestrutura Cloud');

  assert.equal(digest.activeMilestones.activeProjectsCount, 1);
  assert.equal(digest.activeMilestones.completedMilestones, 3);
  assert.equal(digest.activeMilestones.totalMilestones, 5);
  assert.equal(digest.activeMilestones.pendingMilestones, 2);
  assert.equal(digest.activeMilestones.items[0].projectName, 'D.A.R.V.I.S. Core Platform');
  assert.equal(
    digest.activeMilestones.items[0].nextMilestone,
    'Backend FastAPI + PostgreSQL (Fase 2/3)'
  );

  assert.ok(digest.upcomingPriorities.count >= 4);
  assert.equal(
    digest.upcomingPriorities.items[0].title,
    'Validar protótipo navegável da Fase 1 do D.A.R.V.I.S.'
  );
  assert.ok(digest.summaryHeadline.includes('1 tarefa concluída'));
  assert.ok(digest.summaryHeadline.includes('2 marcos pendentes'));
});

test('computeDailyDigest prioritizes overdue and today tasks before distant low-priority tasks', () => {
  const ref = new Date(2026, 10, 17, 10, 0, 0);
  const tasks: TaskItem[] = [
    {
      id: 't-low-later',
      title: 'Limpar arquivos antigos',
      category: 'Manutenção',
      priority: 'baixa',
      status: 'pendente',
      dueDate: '2026-11-28',
    },
    {
      id: 't-high-today',
      title: 'Revisar entrega principal',
      category: 'Core',
      priority: 'alta',
      status: 'em_andamento',
      dueDate: '2026-11-17',
    },
    {
      id: 't-overdue',
      title: 'Corrigir webhook expirado',
      category: 'Infra',
      priority: 'media',
      status: 'pendente',
      dueDate: '2026-11-16',
    },
  ];

  const commitments: CommitmentItem[] = [
    {
      id: 'c-today',
      title: 'Daily operacional',
      dateTime: '2026-11-17 · 14:00',
      location: 'Google Meet',
      category: 'Operação',
    },
  ];

  const digest = computeDailyDigest({
    tasks,
    projects: [],
    commitments,
    userName: 'David Rodrigues',
    referenceDate: ref,
  });

  assert.equal(digest.upcomingPriorities.items[0].title, 'Revisar entrega principal');
  assert.equal(digest.upcomingPriorities.items[0].scheduleLabel, 'Hoje');
  assert.equal(digest.upcomingPriorities.items[1].title, 'Corrigir webhook expirado');
  assert.equal(digest.upcomingPriorities.items[1].scheduleLabel, 'Atrasada (1d)');
  assert.ok(
    digest.upcomingPriorities.items.some(
      (item) => item.kind === 'commitment' && item.title === 'Daily operacional' && item.isUrgent
    )
  );
});

test('computeDailyDigest handles completed active projects and completely empty state', () => {
  const ref = new Date(2026, 10, 17, 8, 0, 0);
  const finishedActiveProject: ProjectItem[] = [
    {
      id: 'proj-done',
      name: 'Gateway Cloudflare',
      objective: 'Publicar gateway',
      status: 'ativo',
      phase: 'Fase 4',
      milestones: [
        { id: 'm1', title: 'Configurar worker', completed: true },
        { id: 'm2', title: 'Validar rotas', completed: true },
      ],
      pendingItems: [],
      history: [],
      updatedAt: '2026-11-17',
    },
  ];

  const doneDigest = computeDailyDigest({
    tasks: [],
    projects: finishedActiveProject,
    commitments: [],
    userName: 'David',
    referenceDate: ref,
  });

  assert.equal(doneDigest.activeMilestones.items[0].percentage, 100);
  assert.equal(doneDigest.activeMilestones.items[0].nextMilestone, null);
  assert.equal(doneDigest.activeMilestones.pendingMilestones, 0);

  const emptyDigest = computeDailyDigest({
    tasks: [],
    projects: [],
    commitments: [],
    userName: 'David',
    referenceDate: ref,
  });

  assert.equal(emptyDigest.completedTasks.count, 0);
  assert.equal(emptyDigest.activeMilestones.items.length, 0);
  assert.equal(emptyDigest.upcomingPriorities.items.length, 0);
  assert.equal(
    emptyDigest.summaryHeadline,
    'Nenhuma atividade registrada para o resumo de hoje.'
  );
});

test('formatDailyDigestText produces structured plain-text briefing for clipboard', () => {
  const digest = computeDailyDigest({
    tasks: INITIAL_DARVIS_STATE.tasks,
    projects: INITIAL_DARVIS_STATE.projects,
    commitments: INITIAL_DARVIS_STATE.commitments,
    userName: INITIAL_DARVIS_STATE.settings.userName,
    referenceDate: new Date(2026, 10, 17, 9, 0, 0),
  });

  const text = formatDailyDigestText(digest);
  assert.ok(text.includes('D.A.R.V.I.S. — Daily Digest (17 nov 2026)'));
  assert.ok(text.includes('1. Tarefas Concluídas (1/4):'));
  assert.ok(text.includes('[x] Revisar orçamento mensal de infraestrutura Cloud'));
  assert.ok(text.includes('2. Marcos de Projetos Ativos (3/5):'));
  assert.ok(text.includes('D.A.R.V.I.S. Core Platform (60% · 3/5)'));
  assert.ok(text.includes('3. Prioridades do Dia'));
});
