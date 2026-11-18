import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBestHabitStreak,
  computeHabitStreak,
  computeHabitsSummary,
  getRecentDaysWindow,
  toggleHabitCompletionForDate,
} from './dailyHabits';
import type { DailyHabit } from '../types/darvis';

test('computeHabitStreak calculates active streak ending today or yesterday', () => {
  const ref = new Date(2026, 10, 17, 19, 0, 0); // 2026-11-17

  // Completed today + 2 prior consecutive days -> 3
  assert.equal(
    computeHabitStreak(['2026-11-15', '2026-11-16', '2026-11-17'], ref),
    3
  );

  // Completed yesterday + day before, pending today -> 2
  assert.equal(
    computeHabitStreak(['2026-11-15', '2026-11-16'], ref),
    2
  );

  // Gap of 2 days (missed yesterday and today) -> 0
  assert.equal(
    computeHabitStreak(['2026-11-13', '2026-11-14', '2026-11-15'], ref),
    0
  );

  // Empty -> 0
  assert.equal(computeHabitStreak([], ref), 0);
});

test('computeBestHabitStreak finds longest consecutive run across history', () => {
  assert.equal(
    computeBestHabitStreak([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-10',
      '2026-11-11',
    ]),
    4
  );
  assert.equal(computeBestHabitStreak([]), 0);
});

test('toggleHabitCompletionForDate toggles date idempotently and keeps dates sorted', () => {
  const added = toggleHabitCompletionForDate(['2026-11-15'], '2026-11-17');
  assert.deepEqual(added, ['2026-11-15', '2026-11-17']);

  const removed = toggleHabitCompletionForDate(added, '2026-11-15');
  assert.deepEqual(removed, ['2026-11-17']);
});

test('getRecentDaysWindow builds 7-day rolling window ending on referenceDate', () => {
  const ref = new Date(2026, 10, 17, 9, 0, 0);
  const window = getRecentDaysWindow(7, ref);
  assert.equal(window.length, 7);
  assert.equal(window[0].dateKey, '2026-11-11');
  assert.equal(window[6].dateKey, '2026-11-17');
  assert.equal(window[6].isToday, true);
});

test('computeHabitsSummary computes completion rate, topStreak, and 7-day history', () => {
  const ref = new Date(2026, 10, 17, 19, 0, 0);
  const habits: DailyHabit[] = [
    {
      id: 'h1',
      title: 'Hidratação',
      category: 'Saúde',
      targetLabel: '2,5L',
      completedDates: ['2026-11-15', '2026-11-16', '2026-11-17'],
    },
    {
      id: 'h2',
      title: 'Leitura',
      category: 'Conhecimento',
      targetLabel: '20 min',
      completedDates: ['2026-11-16'],
    },
  ];

  const summary = computeHabitsSummary(habits, ref);
  assert.equal(summary.todayKey, '2026-11-17');
  assert.equal(summary.completedTodayCount, 1);
  assert.equal(summary.totalHabits, 2);
  assert.equal(summary.completionRate, 50);
  assert.equal(summary.topStreak, 3);
  assert.equal(summary.items[0].completedToday, true);
  assert.equal(summary.items[0].streak, 3);
  assert.deepEqual(summary.items[0].weekHistory, [false, false, false, false, true, true, true]);
  assert.equal(summary.items[1].completedToday, false);
  assert.equal(summary.items[1].streak, 1);

  const empty = computeHabitsSummary([], ref);
  assert.equal(empty.completionRate, 0);
  assert.equal(empty.topStreak, 0);
});
