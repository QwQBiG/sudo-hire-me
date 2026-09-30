import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLesson } from '../scripts/build-content.mjs';
import { createPointerState, movePointer } from '../src/domain/two-pointers.mjs';
import { createWindowState, stepWindow } from '../src/domain/sliding-window.mjs';
import { buildPrefix, rangeSum, prefixValues } from '../src/domain/prefix-sums.mjs';
import {
  areConnected,
  componentGroups,
  createUnionState,
  findRoot,
  unionSets,
} from '../src/domain/union-find.mjs';

test('two pointers accepts only the move justified by sorted order', () => {
  let state = createPointerState();
  assert.deepEqual(state.values, [1, 2, 4, 6, 8, 11]);
  const wrong = movePointer(state, 'left');
  assert.equal(wrong.left, 0);
  assert.equal(wrong.right, 5);
  state = movePointer(state, 'right');
  assert.deepEqual([state.left, state.right], [0, 4]);
  state = movePointer(state, 'left');
  assert.deepEqual(state.pair, [1, 4]);
  assert.equal(state.done, true);
  assert.throws(() => movePointer(state, 'left'), /finished/);
  state = createPointerState('signed', 6);
  state = movePointer(state, 'left');
  assert.deepEqual(state.pair, [1, 5]);
  state = createPointerState('sorted', 20);
  while (!state.done) state = movePointer(state, 'left');
  assert.equal(state.pair, null);
  assert.throws(() => createPointerState('missing', 5), /known/);
});

test('positive sliding window records shortest interval before shrinking', () => {
  let state = createWindowState(7);
  const wrong = stepWindow(state, 'shrink');
  assert.equal(wrong.left, 0);
  assert.equal(wrong.right, 0);
  while (!state.done) state = stepWindow(state, state.next);
  assert.deepEqual(state.best, { left: 2, right: 4, length: 2 });
  assert.equal(state.history.filter((frame) => frame.action === 'expand').length, 6);
  assert.ok(state.history.length <= state.values.length * 2);
  assert.throws(() => stepWindow(state, 'expand'), /finished/);
  state = createWindowState(20);
  while (!state.done) state = stepWindow(state, state.next);
  assert.equal(state.best, null);
  assert.throws(() => createWindowState(0), /positive/);
});

test('prefix sums preserve half-open ranges including negatives and empty range', () => {
  const prefix = buildPrefix(prefixValues);
  assert.deepEqual(prefix, [0, 2, 1, 4, 8, 6]);
  assert.equal(rangeSum(prefix, 1, 4), 6);
  assert.equal(rangeSum(prefix, 2, 5), 5);
  assert.equal(rangeSum(prefix, 3, 3), 0);
  assert.equal(rangeSum(prefix, 0, 5), 6);
  assert.throws(() => rangeSum(prefix, 4, 3), /half-open/);
  assert.throws(() => buildPrefix([Number.MAX_SAFE_INTEGER, 1]), /safe integer/);
});

test('union-find merges by size, compresses paths and ignores same-set union', () => {
  let state = createUnionState();
  state = unionSets(state, 0, 1);
  state = unionSets(state, 2, 3);
  state = unionSets(state, 0, 2);
  assert.equal(state.components, 3);
  assert.deepEqual(state.parent, [0, 0, 0, 2, 4, 5]);
  const found = findRoot(state, 3);
  assert.equal(found.root, 0);
  assert.deepEqual(found.state.path, [3, 2, 0]);
  assert.equal(found.state.parent[3], 0);
  assert.deepEqual(componentGroups(found.state), [[0, 1, 2, 3], [4], [5]]);
  assert.equal(areConnected(found.state, 3, 4).connected, false);
  assert.equal(areConnected(found.state, 0, 3).connected, true);
  assert.equal(unionSets(found.state, 1, 3).components, 3);
  assert.throws(() => findRoot(state, -1), /outside/);
});

test('all eight lessons parse with answers, valid prerequisites and genuine walkthroughs', async () => {
  const slugs = [
    'two-pointers-basic',
    'sliding-window-basic',
    'prefix-sums-basic',
    'graph-dfs',
    'topological-sort',
    'union-find-basic',
    'greedy-basics',
    'backtracking-basics',
  ];
  for (const slug of slugs) {
    const filename = `${slug}.md`;
    const raw = await readFile(new URL(`../content/lessons/${filename}`, import.meta.url), 'utf8');
    const lesson = parseLesson(raw, filename);
    assert.equal(lesson.slug, slug);
    assert.equal(lesson.quiz.options.length, 4);
    assert.ok(lesson.languageExamples?.variants.length >= 2);
    if (lesson.lab === 'workbench') assert.ok(lesson.steps.length >= 3);
    for (const prerequisite of lesson.prerequisites) {
      await readFile(new URL(`../content/lessons/${prerequisite}.md`, import.meta.url), 'utf8');
    }
  }
});
