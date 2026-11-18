import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildQuickCaptureDefaults,
  getDeterministicLocalFocus,
  isDailyFocusFreshForDate,
  parseDailyFocusPayload,
  toLocalDateKey,
} from './dailyFocus';

test('toLocalDateKey formats YYYY-MM-DD in local calendar date', () => {
  const sample = new Date(2026, 10, 17, 18, 30, 0);
  assert.equal(toLocalDateKey(sample), '2026-11-17');
});

test('isDailyFocusFreshForDate checks matching dateKey and non-empty affirmation', () => {
  assert.equal(
    isDailyFocusFreshForDate(
      {
        dateKey: '2026-11-17',
        affirmation: 'Mantenha foco nas prioridades do dia.',
        focusTag: 'Foco',
        source: 'gemini',
        generatedAt: '2026-11-17T08:00:00.000Z',
      },
      '2026-11-17'
    ),
    true
  );

  assert.equal(
    isDailyFocusFreshForDate(
      {
        dateKey: '2026-11-16',
        affirmation: 'Mantenha foco.',
        focusTag: 'Foco',
        source: 'gemini',
        generatedAt: '2026-11-16T08:00:00.000Z',
      },
      '2026-11-17'
    ),
    false
  );

  assert.equal(isDailyFocusFreshForDate(null, '2026-11-17'), false);
});

test('getDeterministicLocalFocus produces consistent daily affirmation with user first name', () => {
  const first = getDeterministicLocalFocus('2026-11-17', 'David Abrahão Rodrigues');
  const second = getDeterministicLocalFocus('2026-11-17', 'David Abrahão Rodrigues');
  assert.equal(first.affirmation, second.affirmation);
  assert.equal(first.source, 'local');
  assert.ok(first.affirmation.startsWith('David, '));
});

test('parseDailyFocusPayload parses JSON with optional fences and falls back to plain text', () => {
  const jsonPayload = '```json\n{"affirmation":"Conclua o mais importante primeiro.","focusTag":"Clareza"}\n```';
  assert.deepEqual(parseDailyFocusPayload(jsonPayload), {
    affirmation: 'Conclua o mais importante primeiro.',
    focusTag: 'Clareza',
  });

  assert.deepEqual(parseDailyFocusPayload('  "Avance com consistência hoje."  '), {
    affirmation: 'Avance com consistência hoje.',
    focusTag: 'Foco do Dia',
  });

  assert.equal(parseDailyFocusPayload('   '), null);
});

test('buildQuickCaptureDefaults returns domain defaults for each quick action type', () => {
  const meeting = buildQuickCaptureDefaults('meeting_note', '2026-11-17');
  assert.equal(meeting.defaultFolder, '02-Reuniões');
  assert.equal(meeting.heading, 'Registrar Nota de Reunião');

  const task = buildQuickCaptureDefaults('quick_task', '2026-11-17');
  assert.equal(task.defaultPriority, 'alta');
  assert.equal(task.defaultDueDate, '2026-11-17');

  const thought = buildQuickCaptureDefaults('thought', '2026-11-17');
  assert.equal(thought.defaultMemoryCategory, 'Projetos & Ideias');
});
