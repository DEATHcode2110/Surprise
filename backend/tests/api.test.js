import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computePredictions } from '../predictionEngine.js';

test('Prediction Engine - empty cycles baseline', () => {
  const res = computePredictions([], '2026-07-28');
  assert.equal(res.averageCycleLength, 28);
  assert.equal(res.confidenceLevel, 'Low');
  assert.equal(res.pmsWindow.startDate, '2026-08-18');
});

test('Prediction Engine - historical cycles calculation', () => {
  const cycles = [
    { start_date: '2026-03-10', end_date: '2026-03-15' },
    { start_date: '2026-04-07', end_date: '2026-04-12' },
    { start_date: '2026-05-05', end_date: '2026-05-10' },
    { start_date: '2026-06-02', end_date: '2026-06-07' },
    { start_date: '2026-06-30', end_date: '2026-07-05' }
  ];

  const res = computePredictions(cycles, '2026-07-28');
  assert.equal(res.averageCycleLength, 28);
  assert.equal(res.confidenceLevel, 'High');
});
