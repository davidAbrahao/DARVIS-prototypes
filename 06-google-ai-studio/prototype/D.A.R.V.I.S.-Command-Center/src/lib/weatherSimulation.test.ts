import test from 'node:test';
import assert from 'node:assert/strict';
import { getSimulatedWeatherForLocation } from './weatherSimulation';

test('getSimulatedWeatherForLocation returns current metrics and 3-day outlook', () => {
  const ref = new Date('2026-11-17T18:00:00Z');
  const data = getSimulatedWeatherForLocation('sao-paulo', ref);

  assert.equal(data.locationName, 'São Paulo, SP');
  assert.equal(data.isSimulated, true);
  assert.equal(typeof data.currentTemp, 'number');
  assert.ok(data.conditionLabel.length > 0);
  assert.equal(data.outlook.length, 3);
  assert.equal(data.outlook[0].weekday, 'Amanhã');
  assert.ok(data.outlook.every((day) => day.tempMax >= day.tempMin));
});

test('getSimulatedWeatherForLocation falls back to sao-paulo for unknown location', () => {
  const data = getSimulatedWeatherForLocation('cidade-inexistente');
  assert.equal(data.locationId, 'sao-paulo');
  assert.equal(data.outlook.length, 3);
});
