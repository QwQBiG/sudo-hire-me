import test from 'node:test';
import assert from 'node:assert/strict';
import { createBfsState, stepBfs, canStepBfs, pathToTarget } from '../src/domain/graph-bfs.mjs';
import { lowerBoundDatasets, lowerBoundFrames } from '../src/domain/lower-bound.mjs';

test('BFS marks vertices on enqueue and reconstructs a shortest unweighted path', () => {
  const initial = createBfsState();
  const afterA = stepBfs(initial);
  assert.deepEqual(initial.queue, ['A']);
  assert.deepEqual(afterA.queue, ['B', 'C']);
  assert.deepEqual(afterA.visited, ['A', 'B', 'C']);
  const afterB = stepBfs(afterA);
  assert.deepEqual(afterB.queue, ['C', 'D', 'E']);
  const afterC = stepBfs(afterB);
  assert.deepEqual(afterC.queue, ['D', 'E']);
  assert.deepEqual(afterC.ignored, ['A', 'E']);
  assert.equal(afterC.distances.D, 2);
  let state = afterC;
  while (canStepBfs(state)) state = stepBfs(state);
  assert.deepEqual(state.processed, ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepEqual(pathToTarget(state), ['A', 'B', 'D', 'F']);
  assert.equal(state.distances.F, 3);
  assert.throws(() => stepBfs(state), /empty/);
});

test('BFS distinguishes an unreachable vertex from a start-equals-target case', () => {
  let state = createBfsState('A', 'X');
  while (canStepBfs(state)) state = stepBfs(state);
  assert.equal(pathToTarget(state), null);
  assert.equal(state.visited.includes('X'), false);
  state = createBfsState('X', 'X');
  assert.deepEqual(pathToTarget(state), ['X']);
  state = stepBfs(state);
  assert.deepEqual(state.queue, []);
  assert.deepEqual(state.processed, ['X']);
  assert.throws(() => createBfsState('missing', 'A'), /Unknown/);
});

test('lower bound returns insertion position, not a false exact match', () => {
  const data = lowerBoundDatasets.duplicates;
  const equal = lowerBoundFrames(data, 3);
  assert.equal(equal.index, 1);
  assert.equal(equal.found, true);
  assert.deepEqual(
    equal.frames.map(({ left, right }) => [left, right]),
    [
      [0, 6],
      [0, 3],
      [0, 1],
      [1, 1],
    ],
  );
  assert.equal(equal.frames[1].mid, 3);
  const absent = lowerBoundFrames(data, 4);
  assert.equal(absent.index, 4);
  assert.equal(absent.found, false);
  assert.equal(lowerBoundFrames(data, 0).index, 0);
  assert.equal(lowerBoundFrames(data, 10).index, data.length);
  assert.deepEqual(data, [1, 3, 3, 3, 7, 9]);
});

test('every lower-bound frame preserves the half-open partition invariant', () => {
  for (const data of Object.values(lowerBoundDatasets)) {
    for (const target of [-1, 1, 3, 4, 9, 20]) {
      const { frames, index, found } = lowerBoundFrames(data, target);
      for (const { left, right } of frames) {
        assert.ok(data.slice(0, left).every((value) => value < target));
        assert.ok(data.slice(right).every((value) => value >= target));
        assert.ok(left <= right);
      }
      assert.equal(
        index,
        data.findIndex((value) => value >= target) < 0
          ? data.length
          : data.findIndex((value) => value >= target),
      );
      assert.equal(found, index < data.length && data[index] === target);
      assert.equal(frames.at(-1).done, true);
    }
  }
  assert.throws(() => lowerBoundFrames([2, 1], 1), /nondecreasing/);
  assert.throws(() => lowerBoundFrames([1, NaN], 1), /finite/);
  assert.throws(() => lowerBoundFrames(Array(2), 1), /finite/);
  assert.throws(() => lowerBoundFrames([1], Infinity), /finite/);
});
