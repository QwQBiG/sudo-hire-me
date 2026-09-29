import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { sortingFrames, sortingDatasets } from '../src/domain/sorting.mjs';
import { removeMinFrames } from '../src/domain/heap.mjs';
import { replacementFrames, referenceTrace } from '../src/domain/replacement.mjs';
import { calculateSubnet } from '../src/domain/subnet.mjs';
import {
  createWindowState,
  advanceWindow,
  canSend,
  canDeliver,
  canRetransmit,
  windowSequence,
} from '../src/domain/tcp-window.mjs';

const labels = (frame) => frame.values.map(({ key, tag }) => `${key}${tag}`);

test('equal keys keep their order in insertion sort but not minimum-swap selection sort', () => {
  const insertion = sortingFrames('insertion', 'equal');
  const selection = sortingFrames('selection', 'equal');
  assert.deepEqual(labels(insertion.at(-1)), ['1', '2a', '2b', '3']);
  assert.deepEqual(labels(selection.at(-1)), ['1', '2b', '2a', '3']);
  assert.deepEqual(labels(insertion[1]), ['2a', '2b', '1', '3']);
  assert.deepEqual(labels(selection[1]), ['1', '2b', '2a', '3']);
  assert.deepEqual(
    sortingDatasets.equal.map(({ key, tag }) => `${key}${tag}`),
    ['2a', '2b', '1', '3'],
  );
});

test('sorting steps cover sorted and reverse inputs without corrupting frame history', () => {
  for (const dataset of ['equal', 'sorted', 'reversed']) {
    for (const method of ['insertion', 'selection']) {
      const frames = sortingFrames(method, dataset);
      assert.equal(frames.length, 4);
      assert.deepEqual(
        frames.at(-1).values.map(({ key }) => key),
        [...sortingDatasets[dataset].map(({ key }) => key)].sort((a, b) => a - b),
      );
      assert.equal(frames[0].comparisons, 0);
    }
  }
  assert.equal(sortingFrames('insertion', 'sorted').at(-1).changes, 0);
  assert.equal(sortingFrames('selection', 'reversed').at(-1).comparisons, 6);
  assert.match(sortingFrames('selection', 'sorted')[1].note, /无需交换/);
  assert.throws(() => sortingFrames('unknown', 'equal'));
});

test('the executable insertion-sort example preserves equal-key order', async () => {
  const markdown = await readFile(
    new URL('../content/lessons/sorting-stability.md', import.meta.url),
    'utf8',
  );
  const source = markdown.match(/```javascript\n([\s\S]*?)\n```/)?.[1];
  assert.ok(source);
  const result = runInNewContext(
    `${source}\ninsertionSort([{key:2,tag:'a'},{key:2,tag:'b'},{key:1,tag:''}])`,
    {},
    { timeout: 1000 },
  );
  assert.deepEqual(
    Array.from(result, ({ key, tag }) => `${key}${tag}`),
    ['1', '2a', '2b'],
  );
});

test('lost first TCP segment holds the fixed window; later data cannot pass the gap', () => {
  let state = createWindowState(4, true);
  state = advanceWindow(state, 'send');
  assert.deepEqual(state.queue, []);
  state = advanceWindow(state, 'send');
  assert.deepEqual(state.queue, [1]);
  assert.equal(canSend(state), false);
  state = advanceWindow(state, 'deliver');
  assert.equal(state.acked, 0);
  assert.deepEqual(state.received, [1]);
  assert.match(state.events.at(-1), /ACK 1000/);
  assert.equal(canRetransmit(state), true);
  state = advanceWindow(state, 'retransmit');
  assert.deepEqual(state.queue, [0]);
  state = advanceWindow(state, 'deliver');
  assert.equal(state.acked, 2);
  assert.match(state.events.at(-1), /ACK 1004/);
  assert.equal(canSend(state), true);
  for (let i = 0; i < 2; i++) {
    state = advanceWindow(state, 'send');
    state = advanceWindow(state, 'deliver');
  }
  assert.equal(state.acked, 4);
  assert.equal(windowSequence(state.acked), 1008);
  assert.equal(canDeliver(state), false);
});

test('two-byte window blocks the second segment until an ACK; no-loss route completes', () => {
  let state = createWindowState(2, false);
  state = advanceWindow(state, 'send');
  assert.equal(canSend(state), false);
  assert.equal(canRetransmit(state), false);
  state = advanceWindow(state, 'deliver');
  assert.equal(state.acked, 1);
  assert.equal(canSend(state), true);
  for (let i = 1; i < 4; i++) {
    state = advanceWindow(state, 'send');
    state = advanceWindow(state, 'deliver');
  }
  assert.equal(state.acked, 4);
  assert.deepEqual(state.attempts, [1, 1, 1, 1]);
  assert.throws(() => createWindowState(3));
  assert.throws(() => advanceWindow(state, 'invalid'));
});

test('removing heap root restores the invariant without changing the input preset', () => {
  const { removed, frames } = removeMinFrames();
  assert.equal(removed, 2);
  assert.deepEqual(frames.at(-1).values, [3, 4, 5, 8, 6, 7]);
  for (const [index, value] of frames.at(-1).values.entries()) {
    for (const child of [2 * index + 1, 2 * index + 2]) {
      if (child < frames.at(-1).values.length) assert.ok(value <= frames.at(-1).values[child]);
    }
  }
  assert.deepEqual(removeMinFrames().frames[0].values, [2, 4, 3, 8, 6, 5, 7]);
  assert.throws(() => removeMinFrames('missing'));
});

test('FIFO and LRU make different victim choices on one trace and reject invalid models', () => {
  const fifo = replacementFrames('FIFO');
  const lru = replacementFrames('LRU');
  assert.equal(fifo.length, referenceTrace.length + 1);
  assert.equal(fifo[5].victim, 1);
  assert.equal(lru[5].victim, 2);
  assert.equal(fifo.at(-1).faults, 6);
  assert.equal(lru.at(-1).faults, 5);
  assert.throws(() => replacementFrames('random'));
  assert.throws(() => replacementFrames('LRU', 0));
});

test('IPv4 subnet calculation exposes network and broadcast boundaries', () => {
  const subnet26 = calculateSubnet('192.168.10.37', 26);
  assert.equal(subnet26.mask, '255.255.255.192');
  assert.equal(subnet26.network, '192.168.10.0');
  assert.equal(subnet26.broadcast, '192.168.10.63');
  assert.equal(subnet26.usableHosts, 62);
  assert.equal(calculateSubnet('192.168.10.37', 27).network, '192.168.10.32');
  assert.throws(() => calculateSubnet('192.168.10.256', 26));
  assert.throws(() => calculateSubnet('192.168.10.37', 31));
});
