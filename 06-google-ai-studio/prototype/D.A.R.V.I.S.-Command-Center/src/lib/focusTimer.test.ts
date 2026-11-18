import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTimerProgress,
  FOCUS_MODES,
  formatCountdown,
  getFocusStatusMessage,
} from './focusTimer';

test('FOCUS_MODES defines standard 25-minute Pomodoro duration', () => {
  assert.equal(FOCUS_MODES.pomodoro.durationSeconds, 1500);
  assert.equal(FOCUS_MODES.short_break.durationSeconds, 300);
  assert.equal(FOCUS_MODES.long_break.durationSeconds, 900);
});

test('formatCountdown formats seconds into MM:SS with zero padding and floor clamping', () => {
  assert.equal(formatCountdown(1500), '25:00');
  assert.equal(formatCountdown(65), '01:05');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-12), '00:00');
});

test('calculateTimerProgress calculates elapsed percentage between 0 and 100', () => {
  assert.equal(calculateTimerProgress(1500, 1500), 0);
  assert.equal(calculateTimerProgress(750, 1500), 50);
  assert.equal(calculateTimerProgress(0, 1500), 100);
  assert.equal(calculateTimerProgress(10, 0), 0);
});

test('getFocusStatusMessage returns explicit status text for each state', () => {
  assert.ok(getFocusStatusMessage('idle', 'pomodoro').includes('25 min'));
  assert.ok(getFocusStatusMessage('running', 'pomodoro').includes('ativa'));
  assert.ok(getFocusStatusMessage('paused', 'pomodoro').includes('Pausado'));
  assert.ok(getFocusStatusMessage('completed', 'pomodoro').includes('concluído'));
});
