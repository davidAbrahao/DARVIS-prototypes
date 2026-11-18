import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiContextPrompt,
  calculateProjectProgress,
  computeDashboardMetrics,
  computeTaskInsights,
  filterMemories,
  filterTasks,
  getContextualGreeting,
  parseAiActionProposals,
} from './darvisLogic';
import { INITIAL_DARVIS_STATE } from '../data/seedData';

test('getContextualGreeting adapts to morning, afternoon, and night', () => {
  assert.equal(getContextualGreeting(8, 'David Rodrigues').greeting, 'Bom dia, David');
  assert.equal(getContextualGreeting(15, 'David Rodrigues').greeting, 'Boa tarde, David');
  assert.equal(getContextualGreeting(21, 'David Rodrigues').greeting, 'Boa noite, David');
});

test('calculateProjectProgress computes percentage and handles empty milestones', () => {
  assert.deepEqual(calculateProjectProgress([]), {
    completed: 0,
    total: 0,
    percentage: 0,
  });

  assert.deepEqual(
    calculateProjectProgress([
      { id: '1', title: 'A', completed: true },
      { id: '2', title: 'B', completed: false },
      { id: '3', title: 'C', completed: true },
    ]),
    { completed: 2, total: 3, percentage: 67 }
  );
});

test('filterMemories filters by category and search query across fields', () => {
  const all = INITIAL_DARVIS_STATE.memories;
  const tech = filterMemories(all, '', 'Conhecimento Técnico');
  assert.ok(tech.length >= 1);
  assert.ok(tech.every((m) => m.category === 'Conhecimento Técnico'));

  const byTag = filterMemories(all, 'obsidian', 'Todas');
  assert.ok(byTag.length >= 1);
  assert.ok(
    byTag.some(
      (m) =>
        m.title.toLowerCase().includes('obsidian') ||
        m.content.toLowerCase().includes('obsidian') ||
        m.tags.some((t) => t.toLowerCase().includes('obsidian'))
    )
  );
});

test('filterTasks filters by status, priority, and text query', () => {
  const tasks = INITIAL_DARVIS_STATE.tasks;
  const highPending = filterTasks(tasks, 'pendente', 'alta', '');
  assert.ok(highPending.every((t) => t.status === 'pendente' && t.priority === 'alta'));
});

test('computeDashboardMetrics calculates accurate counts and monthly balance', () => {
  const metrics = computeDashboardMetrics(INITIAL_DARVIS_STATE);
  assert.equal(
    metrics.pendingTasks + metrics.completedTasks,
    INITIAL_DARVIS_STATE.tasks.length
  );
  assert.equal(metrics.totalMemories, INITIAL_DARVIS_STATE.memories.length);
  assert.equal(metrics.totalNotes, INITIAL_DARVIS_STATE.notes.length);
});

test('buildAiContextPrompt respects injectMemoryContext flag', () => {
  const enabled = buildAiContextPrompt(INITIAL_DARVIS_STATE);
  assert.ok(enabled.includes('MEMÓRIAS PERSISTENTES ATIVAS'));

  const disabled = buildAiContextPrompt({
    ...INITIAL_DARVIS_STATE,
    settings: { ...INITIAL_DARVIS_STATE.settings, injectMemoryContext: false },
  });
  assert.ok(disabled.includes('desativado'));
});

test('parseAiActionProposals extracts structured actions and cleans text', () => {
  const raw = `Posso registrar essa tarefa para você.\n\n[DARVIS_ACTION]{"type":"create_task","label":"Criar Tarefa: Revisar FastAPI","payload":{"title":"Revisar endpoints FastAPI","category":"Engenharia","priority":"alta","dueDate":"2026-11-20"}}[/DARVIS_ACTION]\n\nConfirme abaixo para executar.`;
  const parsed = parseAiActionProposals(raw);
  assert.equal(parsed.actions.length, 1);
  assert.equal(parsed.actions[0].type, 'create_task');
  assert.equal(parsed.actions[0].payload.title, 'Revisar endpoints FastAPI');
  assert.equal(parsed.actions[0].status, 'pending');
  assert.ok(!parsed.cleanText.includes('[DARVIS_ACTION]'));
  assert.ok(parsed.cleanText.includes('Confirme abaixo'));
});

test('computeTaskInsights computes completion rate, overdue, and upcoming deadlines', () => {
  const ref = new Date(2026, 10, 17, 12, 0, 0); // 2026-11-17 local
  const summary = computeTaskInsights(
    [
      {
        id: '1',
        title: 'Atrasada',
        category: 'Core',
        priority: 'alta',
        status: 'pendente',
        dueDate: '2026-11-15',
      },
      {
        id: '2',
        title: 'Amanhã',
        category: 'Core',
        priority: 'alta',
        status: 'em_andamento',
        dueDate: '2026-11-18',
      },
      {
        id: '3',
        title: 'Distante',
        category: 'Core',
        priority: 'baixa',
        status: 'pendente',
        dueDate: '2026-11-30',
      },
      {
        id: '4',
        title: 'Concluída',
        category: 'Core',
        priority: 'media',
        status: 'concluida',
        dueDate: '2026-11-10',
      },
    ],
    ref
  );

  assert.equal(summary.totalTasks, 4);
  assert.equal(summary.completedTasks, 1);
  assert.equal(summary.completionRate, 25);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.dueSoonCount, 1);
  assert.equal(summary.upcomingDeadlines.length, 3);
  assert.equal(summary.upcomingDeadlines[0].title, 'Atrasada');
  assert.equal(summary.upcomingDeadlines[0].urgencyLabel, 'Atrasada (2d)');
  assert.equal(summary.upcomingDeadlines[1].urgencyLabel, 'Em 1d');

  const empty = computeTaskInsights([], ref);
  assert.equal(empty.completionRate, 0);
  assert.equal(empty.upcomingDeadlines.length, 0);
});
