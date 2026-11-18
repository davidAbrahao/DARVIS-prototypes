import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLongTermGoals } from './longTermGoals';
import { INITIAL_DARVIS_STATE } from '../data/seedData';
import type { LongTermGoal } from '../types/darvis';

test('evaluateLongTermGoals resolves linked project milestones and standalone milestones', () => {
  const summary = evaluateLongTermGoals(
    INITIAL_DARVIS_STATE.longTermGoals,
    INITIAL_DARVIS_STATE.projects
  );

  assert.equal(summary.totalGoals, 4);
  assert.equal(summary.completedGoals, 0);

  const darvisGoal = summary.items.find((i) => i.goal.id === 'goal-darvis-platform');
  assert.ok(darvisGoal);
  assert.equal(darvisGoal.isProjectLinked, true);
  assert.equal(darvisGoal.linkedProjectName, 'D.A.R.V.I.S. Core Platform');
  assert.equal(darvisGoal.completedCount, 3);
  assert.equal(darvisGoal.totalCount, 5);
  assert.equal(darvisGoal.percentage, 60);
  assert.equal(darvisGoal.nextMilestone, 'Backend FastAPI + PostgreSQL (Fase 2/3)');

  const finGoal = summary.items.find((i) => i.goal.id === 'goal-financial-reserve');
  assert.ok(finGoal);
  assert.equal(finGoal.isProjectLinked, false);
  assert.equal(finGoal.completedCount, 2);
  assert.equal(finGoal.totalCount, 4);
  assert.equal(finGoal.percentage, 50);

  // Total across 4 goals: 3/5 + 2/4 + 2/4 + 1/3 = 8/16 = 50%
  assert.equal(summary.completedMilestones, 8);
  assert.equal(summary.totalMilestones, 16);
  assert.equal(summary.overallPercentage, 50);
});

test('evaluateLongTermGoals supports domain filtering while keeping overall totals intact', () => {
  const financeOnly = evaluateLongTermGoals(
    INITIAL_DARVIS_STATE.longTermGoals,
    INITIAL_DARVIS_STATE.projects,
    'Finanças'
  );

  assert.equal(financeOnly.items.length, 1);
  assert.equal(financeOnly.items[0].goal.domain, 'Finanças');
  assert.equal(financeOnly.totalGoals, 4);
});

test('evaluateLongTermGoals handles completed goals and empty input cleanly', () => {
  const doneGoal: LongTermGoal[] = [
    {
      id: 'g-done',
      title: 'Meta concluída',
      domain: 'Conhecimento',
      horizon: '2026',
      milestones: [
        { id: 'm1', title: 'Etapa 1', completed: true },
        { id: 'm2', title: 'Etapa 2', completed: true },
      ],
    },
  ];

  const doneSummary = evaluateLongTermGoals(doneGoal, []);
  assert.equal(doneSummary.completedGoals, 1);
  assert.equal(doneSummary.overallPercentage, 100);
  assert.equal(doneSummary.items[0].isCompleted, true);
  assert.equal(doneSummary.items[0].nextMilestone, null);

  const emptySummary = evaluateLongTermGoals([], []);
  assert.equal(emptySummary.totalGoals, 0);
  assert.equal(emptySummary.overallPercentage, 0);
  assert.equal(emptySummary.items.length, 0);
});
