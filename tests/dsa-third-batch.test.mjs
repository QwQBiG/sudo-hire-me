import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLesson } from '../scripts/build-content.mjs';
import { createReversalState, listFromHead, stepReversal } from '../src/domain/linked-reversal.mjs';
import { beginEntrySearch, createCycleState, stepCycle } from '../src/domain/floyd-cycle.mjs';
import {
  choosePartition,
  createPartitionState,
  stepPartition,
} from '../src/domain/quick-partition.mjs';

test('reversal must save before rewiring and returns the new head', () => {
  let state = createReversalState();
  const wrong = stepReversal(state, 'rewire');
  assert.equal(wrong.phase, 'save');
  assert.equal(wrong.next.A, 'B');
  for (let count = 0; count < 4; count += 1) {
    state = stepReversal(state, 'save');
    state = stepReversal(state, 'rewire');
    state = stepReversal(state, 'advance');
  }
  assert.equal(state.phase, 'done');
  assert.equal(state.head, 'D');
  assert.deepEqual(listFromHead(state), ['D', 'C', 'B', 'A']);
  assert.deepEqual(state.next, { A: null, B: 'A', C: 'B', D: 'C' });
  assert.throws(() => stepReversal(state, 'save'), /finished/);
  assert.equal(createReversalState('empty').phase, 'done');
  let single = createReversalState('single');
  for (const action of ['save', 'rewire', 'advance']) single = stepReversal(single, action);
  assert.deepEqual(listFromHead(single), ['A']);
  assert.throws(() => createReversalState('missing'), /Unknown/);
});

test('Floyd detection meets inside the cycle then finds the entry', () => {
  let state = createCycleState();
  state = stepCycle(state);
  assert.deepEqual([state.slow, state.fast], ['B', 'C']);
  state = stepCycle(state);
  assert.deepEqual([state.slow, state.fast], ['C', 'E']);
  state = stepCycle(state);
  assert.deepEqual([state.slow, state.fast, state.phase], ['D', 'D', 'entry-ready']);
  assert.throws(() => stepCycle(state), /No movement/);
  state = beginEntrySearch(state);
  state = stepCycle(state);
  assert.deepEqual([state.seeker, state.fast], ['B', 'E']);
  state = stepCycle(state);
  assert.deepEqual([state.entry, state.phase], ['C', 'done']);
  let linear = createCycleState('linear');
  while (linear.phase !== 'done') linear = stepCycle(linear);
  assert.equal(linear.hasCycle, false);
  let self = stepCycle(createCycleState('self'));
  self = beginEntrySearch(self);
  assert.equal(self.entry, 'A');
  assert.equal(createCycleState('empty').hasCycle, false);
  assert.throws(() => createCycleState('unknown'), /Unknown/);
});

test('strict Lomuto partition preserves boundaries without fully sorting', () => {
  let state = createPartitionState();
  const wrong = choosePartition(state, 'small');
  assert.equal(wrong.j, 0);
  for (const choice of ['large', 'small', 'large', 'small']) {
    state = choosePartition(state, choice);
    assert.ok(state.values.slice(0, state.i).every((value) => value < state.pivot));
    assert.ok(state.values.slice(state.i, state.j).every((value) => value >= state.pivot));
  }
  assert.equal(state.phase, 'finalize');
  state = stepPartition(state);
  assert.deepEqual(state.values, [3, 2, 5, 8, 6]);
  assert.equal(state.pivotIndex, 2);
  assert.throws(() => stepPartition(state), /finished/);
  state = createPartitionState('duplicates');
  while (state.phase !== 'done') state = stepPartition(state);
  assert.deepEqual(state.values, [2, 1, 4, 4, 4]);
  assert.equal(state.pivotIndex, 2);
  state = createPartitionState('sorted');
  while (state.phase !== 'done') state = stepPartition(state);
  assert.equal(state.pivotIndex, 4);
  assert.throws(() => createPartitionState('unknown'), /Unknown/);
});

test('all eight lessons parse with answers and existing prerequisites', async () => {
  const slugs = [
    'linked-list-reversal',
    'linked-list-cycle',
    'stack-valid-parentheses',
    'binary-tree-level-order',
    'binary-search-tree-operations',
    'heap-top-k',
    'merge-sort',
    'quick-sort-partition',
  ];
  for (const slug of slugs) {
    const filename = `${slug}.md`;
    const raw = await readFile(new URL(`../content/lessons/${filename}`, import.meta.url), 'utf8');
    const lesson = parseLesson(raw, filename);
    assert.equal(lesson.slug, slug);
    assert.equal(lesson.quiz.options.length, 4);
    assert.ok(lesson.languageExamples?.variants.length >= 2);
    if (lesson.lab === 'walkthrough') assert.ok(lesson.steps.length >= 3);
    for (const prerequisite of lesson.prerequisites) {
      await readFile(new URL(`../content/lessons/${prerequisite}.md`, import.meta.url), 'utf8');
    }
  }
});
