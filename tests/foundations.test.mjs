import test from 'node:test';
import assert from 'node:assert/strict';
import {
  memoryLayout,
  cpuState,
  cacheTrace,
  operationCounts,
  arrayInsertion,
  containerAction,
  hashBuckets,
  factorialTrace,
  treeTraversal,
} from '../src/domain/foundations.mjs';

test('byte addressing preserves element width and address boundaries', () => {
  const cells = memoryLayout(4);
  assert.equal(cells.length, 12);
  assert.deepEqual(cells[8], { address: 108, element: 2, offset: 0 });
  assert.equal(cells.at(-1).address, 111);
  assert.throws(() => memoryLayout(0), RangeError);
});

test('LOAD ADDI STORE modify only their destinations', () => {
  assert.deepEqual(cpuState(0), { pc: 0, r1: 0, source: 7, destination: 0 });
  assert.deepEqual(cpuState(1), { pc: 4, r1: 7, source: 7, destination: 0 });
  assert.deepEqual(cpuState(2), { pc: 8, r1: 10, source: 7, destination: 0 });
  assert.deepEqual(cpuState(3), { pc: 12, r1: 10, source: 7, destination: 10 });
  assert.equal(cpuState(3, 99, 20).destination, 119);
  assert.throws(() => cpuState(4), RangeError);
});

test('cache line reuse and LRU eviction follow access order', () => {
  const local = cacheTrace([0, 1, 0, 4]);
  assert.deepEqual(
    local.map((item) => item.hit),
    [false, true, true, false],
  );
  const pressure = cacheTrace([0, 4, 0, 8, 4]);
  assert.equal(pressure[3].evicted, 1);
  assert.deepEqual(pressure[3].resident, [0, 2]);
  assert.equal(pressure[4].hit, false);
  assert.throws(() => cacheTrace([16]), RangeError);
});

test('operation counts are exact for the stated loop bodies', () => {
  assert.deepEqual(operationCounts(4), {
    constant: 1,
    halving: 3,
    linear: 4,
    pairs: 6,
    square: 16,
  });
  assert.equal(operationCounts(1).pairs, 0);
  assert.equal(operationCounts(64).square, 4096);
  assert.throws(() => operationCounts(1.5), RangeError);
});

test('array insertion moves backward and supports the ends', () => {
  assert.deepEqual(arrayInsertion(1, 1).slots, [10, 20, 30, 30]);
  assert.deepEqual(arrayInsertion(1, 3).slots, [10, 15, 20, 30]);
  assert.deepEqual(arrayInsertion(0, 4).slots, [15, 10, 20, 30]);
  assert.deepEqual(arrayInsertion(3, 1).slots, [10, 20, 30, 15]);
  assert.throws(() => arrayInsertion(3, 2), RangeError);
});

test('stack and queue remove from different ends with explicit bounds', () => {
  assert.equal(containerAction(['A', 'B'], 'stack', 'remove').removed, 'B');
  assert.equal(containerAction(['A', 'B'], 'queue', 'remove').removed, 'A');
  assert.deepEqual(containerAction([], 'queue', 'add', 'C').values, ['C']);
  assert.throws(() => containerAction([], 'queue', 'remove'), RangeError);
  assert.throws(() => containerAction(Array(6).fill('A'), 'stack', 'add', 'B'), RangeError);
});

test('hash collisions retain unequal keys, duplicate keys update, resizing rehashes', () => {
  const entries = [
    { key: 12, value: 'Lin' },
    { key: 7, value: 'Wu' },
    { key: 7, value: 'New' },
  ];
  assert.deepEqual(hashBuckets(entries, 5)[2], [
    { key: 12, value: 'Lin' },
    { key: 7, value: 'New' },
  ]);
  assert.deepEqual(hashBuckets(entries, 10)[7], [{ key: 7, value: 'New' }]);
  assert.throws(() => hashBuckets([{ key: -1, value: '' }], 5), RangeError);
});

test('factorial stack expands to base case then returns with independent frames', () => {
  const trace = factorialTrace(4);
  assert.deepEqual(trace[5].frames, [4, 3, 2, 1, 0]);
  assert.equal(trace.at(-1).result, 24);
  assert.deepEqual(trace.at(-1).frames, []);
  assert.equal(factorialTrace(0).at(-1).result, 1);
  assert.throws(() => factorialTrace(-1), RangeError);
});

test('binary tree traversal uses node position, not alphabetical sorting', () => {
  assert.deepEqual(treeTraversal('pre'), ['A', 'B', 'D', 'E', 'C', 'F']);
  assert.deepEqual(treeTraversal('in'), ['D', 'B', 'E', 'A', 'C', 'F']);
  assert.deepEqual(treeTraversal('post'), ['D', 'E', 'B', 'F', 'C', 'A']);
  assert.throws(() => treeTraversal('breadth'), TypeError);
});
