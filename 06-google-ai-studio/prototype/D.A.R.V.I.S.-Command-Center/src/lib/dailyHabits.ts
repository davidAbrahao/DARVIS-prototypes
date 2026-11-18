import type { DailyHabit } from '../types/darvis';

export interface HabitDaySlot {
  dateKey: string;
  shortLabel: string;
  isToday: boolean;
}

export interface EvaluatedHabit {
  habit: DailyHabit;
  completedToday: boolean;
  streak: number;
  bestStreak: number;
  weekHistory: boolean[];
}

export interface DailyHabitsSummary {
  todayKey: string;
  completedTodayCount: number;
  totalHabits: number;
  completionRate: number;
  topStreak: number;
  daySlots: HabitDaySlot[];
  items: EvaluatedHabit[];
}

const WEEKDAY_SINGLE_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function toHabitDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, deltaDays: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + deltaDays);
  return next;
}

function parseHabitDateKey(key: string): Date | null {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function computeHabitStreak(
  completedDates: string[],
  referenceDate: Date = new Date()
): number {
  if (completedDates.length === 0) return 0;
  const completedSet = new Set(completedDates);
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const todayKey = toHabitDateKey(today);
  const yesterday = addDays(today, -1);
  const yesterdayKey = toHabitDateKey(yesterday);

  let cursor: Date;
  if (completedSet.has(todayKey)) {
    cursor = today;
  } else if (completedSet.has(yesterdayKey)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (completedSet.has(toHabitDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function computeBestHabitStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const uniqueSorted = Array.from(new Set(completedDates)).sort();
  let best = 0;
  let current = 0;
  let previousDate: Date | null = null;

  for (const key of uniqueSorted) {
    const parsed = parseHabitDateKey(key);
    if (!parsed) continue;
    if (previousDate) {
      const diffDays = Math.round(
        (parsed.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      current = diffDays === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    if (current > best) best = current;
    previousDate = parsed;
  }

  return best;
}

export function getRecentDaysWindow(
  daysCount = 7,
  referenceDate: Date = new Date()
): HabitDaySlot[] {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const slots: HabitDaySlot[] = [];

  for (let offset = -(daysCount - 1); offset <= 0; offset += 1) {
    const dayDate = addDays(today, offset);
    slots.push({
      dateKey: toHabitDateKey(dayDate),
      shortLabel: WEEKDAY_SINGLE_LETTERS[dayDate.getDay()] ?? 'D',
      isToday: offset === 0,
    });
  }

  return slots;
}

export function toggleHabitCompletionForDate(
  completedDates: string[],
  dateKey: string
): string[] {
  const set = new Set(completedDates);
  if (set.has(dateKey)) {
    set.delete(dateKey);
  } else {
    set.add(dateKey);
  }
  return Array.from(set).sort();
}

export function computeHabitsSummary(
  habits: DailyHabit[],
  referenceDate: Date = new Date()
): DailyHabitsSummary {
  const todayKey = toHabitDateKey(referenceDate);
  const daySlots = getRecentDaysWindow(7, referenceDate);

  let completedTodayCount = 0;
  let topStreak = 0;

  const items: EvaluatedHabit[] = habits.map((habit) => {
    const completedSet = new Set(habit.completedDates);
    const completedToday = completedSet.has(todayKey);
    if (completedToday) completedTodayCount += 1;

    const streak = computeHabitStreak(habit.completedDates, referenceDate);
    const bestStreak = Math.max(streak, computeBestHabitStreak(habit.completedDates));
    if (streak > topStreak) topStreak = streak;

    const weekHistory = daySlots.map((slot) => completedSet.has(slot.dateKey));

    return {
      habit,
      completedToday,
      streak,
      bestStreak,
      weekHistory,
    };
  });

  const totalHabits = habits.length;
  const completionRate =
    totalHabits === 0 ? 0 : Math.round((completedTodayCount / totalHabits) * 100);

  return {
    todayKey,
    completedTodayCount,
    totalHabits,
    completionRate,
    topStreak,
    daySlots,
    items,
  };
}
