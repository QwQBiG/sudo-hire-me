import assert from 'node:assert/strict';
import test from 'node:test';
import { accessCacheLine, createCacheMapping } from '../src/domain/cache-mapping.mjs';
import { createPredictor, observeBranch } from '../src/domain/branch-predict.mjs';
import {
  advanceDma,
  configureDma,
  createDmaTransfer,
  doCpuWork,
  notifyDma,
} from '../src/domain/dma-transfer.mjs';

test('same four cache slots have direct-mapped conflicts but two-way hits', () => {
  const trace = (ways) =>
    [0, 4, 0, 4].reduce((state, line) => accessCacheLine(state, line), createCacheMapping(ways));
  assert.deepEqual([trace(1).hits, trace(1).misses], [0, 4]);
  assert.deepEqual([trace(2).hits, trace(2).misses], [2, 2]);
  assert.equal(createCacheMapping(1).sets[0].length, 0);
  assert.throws(() => createCacheMapping(3), RangeError);
  assert.throws(() => accessCacheLine(createCacheMapping(), 8), RangeError);
});

test('two-bit predictor resists one unexpected outcome after strongly taken', () => {
  const outcomes = [true, true, true, false, true];
  const one = outcomes.reduce((state, taken) => observeBranch(state, taken), createPredictor(1));
  const two = outcomes.reduce((state, taken) => observeBranch(state, taken), createPredictor(2));
  assert.deepEqual([one.correct, two.correct], [2, 3]);
  assert.equal(two.history[3].after, 2);
  assert.equal(two.history[4].predicted, true);
  assert.equal(createPredictor(2).total, 0);
  assert.throws(() => observeBranch(createPredictor(), 'T'), TypeError);
});

test('DMA device progress is independent of CPU work and notification follows completion', () => {
  const idle = createDmaTransfer(2);
  assert.throws(() => advanceDma(idle), Error);
  const started = configureDma(idle);
  const working = doCpuWork(started);
  assert.deepEqual([working.cpuWork, working.moved], [1, 0]);
  assert.throws(() => notifyDma(working), Error);
  const half = advanceDma(working);
  const complete = advanceDma(half);
  assert.deepEqual([complete.phase, complete.moved], ['completed', 2]);
  assert.equal(notifyDma(complete).phase, 'notified');
  assert.equal(idle.phase, 'idle');
  assert.throws(() => createDmaTransfer(9), RangeError);
});
