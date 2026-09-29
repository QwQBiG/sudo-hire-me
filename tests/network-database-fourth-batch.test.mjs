import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessState, advanceProcessState } from '../src/domain/process-state.mjs';
import { createTlbState, accessTlb, loadTlbPage3 } from '../src/domain/tlb.mjs';
import { createIoBufferState, advanceIoBuffer } from '../src/domain/io-buffer.mjs';

test('process states require the event source state and wake into ready', () => {
  let state = createProcessState();
  assert.equal(advanceProcessState(state, 'wake').phase, 'new');
  for (const action of ['admit', 'dispatch', 'block']) state = advanceProcessState(state, action);
  assert.equal(state.phase, 'blocked');
  state = advanceProcessState(state, 'wake');
  assert.equal(state.phase, 'ready');
  state = advanceProcessState(advanceProcessState(state, 'dispatch'), 'exit');
  assert.equal(state.phase, 'terminated');
  assert.throws(() => advanceProcessState(state, 'unknown'), /未知/);
});

test('two-entry TLB separates hits, replacement, faults and invalid pages', () => {
  let state = createTlbState();
  const kinds = [];
  for (const address of [12, 268, 15, 524, 12]) {
    state = accessTlb(state, address);
    kinds.push(state.last.kind);
  }
  assert.deepEqual(kinds, ['miss', 'miss', 'hit', 'miss', 'hit']);
  assert.deepEqual(
    state.entries.map((entry) => entry.page),
    [2, 0],
  );
  assert.equal(state.hits, 2);
  state = accessTlb(state, 780);
  assert.equal(state.last.kind, 'fault');
  state = accessTlb(loadTlbPage3(state), 780);
  assert.equal(state.last.physical, 9 * 256 + 12);
  assert.equal(accessTlb(state, 1030).last.kind, 'invalid');
  assert.throws(() => accessTlb(state, 1280), /0 到 1279/);
});

test('stdio flush and file sync advance different durability layers', () => {
  let state = advanceIoBuffer(createIoBufferState(), 'fprintf');
  state = advanceIoBuffer(state, 'fsync');
  assert.equal(state.disk, '');
  state = advanceIoBuffer(state, 'fflush');
  assert.equal(state.user, '');
  assert.equal(state.dirty, true);
  state = advanceIoBuffer(state, 'fsync');
  assert.equal(state.disk, 'ABC');
  assert.equal(advanceIoBuffer(state, 'crash').disk, 'ABC');
  const direct = advanceIoBuffer(createIoBufferState(), 'write');
  assert.equal(advanceIoBuffer(direct, 'crash').disk, '');
  assert.equal(advanceIoBuffer(direct, 'fsync').disk, 'ABC');
  assert.throws(() => advanceIoBuffer(state, 'unknown'), /未知/);
});
