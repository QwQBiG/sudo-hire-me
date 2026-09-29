import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptCas, createCasState, refreshCas } from '../src/domain/cas-workbench.mjs';
import {
  consumeBounded,
  createBoundedQueueState,
  produceBounded,
  retryBounded,
} from '../src/domain/bounded-queue.mjs';
import {
  advanceTokenTime,
  createTokenBucketState,
  requestTokens,
} from '../src/domain/token-bucket.mjs';

test('CAS stale expectation fails until refreshed', () => {
  let state = createCasState();
  state = attemptCas(state, 'A');
  assert.equal(state.value, 1);
  state = attemptCas(state, 'B');
  assert.equal(state.value, 1);
  assert.match(state.message, /失败/);
  state = refreshCas(state, 'B');
  assert.deepEqual(state.drafts.B, { expected: 1, next: 2 });
  state = attemptCas(state, 'B');
  assert.equal(state.value, 2);
  assert.throws(() => attemptCas(state, 'C'), /unknown/);
});

test('bounded queue keeps blocked item outside until consumer frees a slot', () => {
  let state = createBoundedQueueState();
  state = produceBounded(produceBounded(state));
  assert.deepEqual(state.queue, ['A', 'B']);
  state = produceBounded(state);
  assert.equal(state.pending, 'C');
  assert.deepEqual(state.queue, ['A', 'B']);
  assert.deepEqual(retryBounded(state).queue, ['A', 'B']);
  state = consumeBounded(state);
  assert.deepEqual(state.consumed, ['A']);
  state = retryBounded(state);
  assert.deepEqual(state.queue, ['B', 'C']);
  assert.equal(state.pending, null);
  const empty = consumeBounded(createBoundedQueueState());
  assert.match(empty.message, /为空/);
});

test('token bucket allows a burst, rejects overflow and caps refill', () => {
  let state = requestTokens(createTokenBucketState(), 5);
  assert.equal(state.allowed, 4);
  assert.equal(state.rejected, 1);
  assert.equal(state.tokens, 0);
  state = advanceTokenTime(state, 1);
  assert.equal(state.tokens, 1);
  state = requestTokens(state);
  assert.equal(state.allowed, 5);
  state = advanceTokenTime(state, 10);
  assert.equal(state.tokens, 4);
  assert.throws(() => advanceTokenTime(state, 0), /invalid/);
  assert.throws(() => requestTokens(state, -1), /invalid/);
});
