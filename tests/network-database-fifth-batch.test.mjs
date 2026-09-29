import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReadinessState,
  readReadiness,
  sendReadinessData,
  waitReadiness,
} from '../src/domain/io-readiness.mjs';
import {
  closeFramingStream,
  createFramingState,
  framingChunks,
  pushFramingChunk,
} from '../src/domain/tcp-framing.mjs';
import { rangeBplus, searchBplus } from '../src/domain/bplus-tree.mjs';
import {
  appendWalRecord,
  beginWalChange,
  checkpointWal,
  commitWal,
  crashRecoverWal,
  createWalState,
} from '../src/domain/wal-workbench.mjs';

test('LT repeats unread readiness while ET needs a new input event', () => {
  let lt = sendReadinessData(createReadinessState('lt'), 3, 'ABCD');
  lt = waitReadiness(lt);
  lt = readReadiness(lt, 3, 2);
  assert.deepEqual(waitReadiness(lt).lastReady, [3]);
  let et = sendReadinessData(createReadinessState('et'), 3, 'ABCD');
  et = waitReadiness(et);
  et = readReadiness(et, 3, 2);
  assert.deepEqual(waitReadiness(et).lastReady, []);
  assert.deepEqual(waitReadiness(sendReadinessData(et, 3, 'E')).lastReady, [3]);
  const drainedBeforeWait = readReadiness(
    sendReadinessData(createReadinessState('et'), 4, 'XY'),
    4,
    99,
  );
  assert.deepEqual(waitReadiness(drainedBeforeWait).lastReady, []);
  assert.throws(() => readReadiness(et, 5, 2), /invalid/);
});

test('framing parses arbitrary read chunks and rejects truncated or oversized frames', () => {
  let state = createFramingState();
  for (const chunk of framingChunks) state = pushFramingChunk(state, chunk);
  assert.deepEqual(state.messages, ['CAT', 'OK']);
  assert.deepEqual(state.buffer, []);
  assert.equal(closeFramingStream(state).error, '');
  const partial = pushFramingChunk(createFramingState(), [0, 3, 67]);
  assert.match(closeFramingStream(partial).error, /不完整/);
  assert.match(pushFramingChunk(createFramingState(), [0, 9]).error, /上限/);
  assert.throws(() => pushFramingChunk(createFramingState(), [300]), /bytes/);
});

test('B+ tree follows the selected leaf and scans only the needed range', () => {
  assert.deepEqual(searchBplus(25).visited, ['root', 'middle']);
  assert.deepEqual(searchBplus(27).results, []);
  const range = rangeBplus(20, 45);
  assert.deepEqual(range.visited, ['root', 'middle', 'right']);
  assert.deepEqual(range.results, [20, 25, 30, 40, 45]);
  assert.throws(() => rangeBplus(45, 20), /invalid/);
});

test('WAL discards uncommitted log, replays committed log and checkpoints separately', () => {
  const pending = appendWalRecord(beginWalChange(createWalState()));
  assert.equal(crashRecoverWal(pending).disk, 100);
  const committed = commitWal(pending);
  assert.equal(committed.disk, 100);
  assert.equal(crashRecoverWal(committed).disk, 130);
  assert.equal(checkpointWal(committed).disk, 130);
  assert.throws(() => commitWal(createWalState()), /log/);
});
