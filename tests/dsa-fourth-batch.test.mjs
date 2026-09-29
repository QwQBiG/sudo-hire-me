import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLesson } from '../scripts/build-content.mjs';
import { createKmpState, stepKmp } from '../src/domain/kmp-prefix.mjs';
import {
  chosenKnapsackItems,
  createKnapsackState,
  stepKnapsack,
} from '../src/domain/knapsack-grid.mjs';
import {
  createDijkstraState,
  dijkstraPath,
  expectedDijkstraVertex,
  settleDijkstra,
} from '../src/domain/dijkstra-path.mjs';

test('KMP builds the proper-prefix table and rechecks text after fallback', () => {
  let state = createKmpState();
  while (state.phase === 'prefix') state = stepKmp(state);
  assert.deepEqual(state.prefix, [0, 0, 1, 2, 3, 0, 1]);
  while (!(state.phase === 'scan' && state.textIndex === 5 && state.patternIndex === 5)) {
    state = stepKmp(state);
  }
  state = stepKmp(state);
  assert.equal(state.last.kind, 'fallback');
  assert.equal(state.textIndex, 5);
  assert.equal(state.patternIndex, 3);
  while (state.phase !== 'done') state = stepKmp(state);
  assert.deepEqual(state.matches, [2]);
  assert.throws(() => stepKmp(state), /finished/);
  for (const [preset, expected] of [
    ['miss', []],
    ['exact', [0]],
  ]) {
    state = createKmpState(preset);
    while (state.phase !== 'done') state = stepKmp(state);
    assert.deepEqual(state.matches, expected);
  }
  assert.throws(() => createKmpState('unknown'), /Unknown/);
});

test('0/1 knapsack fills from previous rows and reconstructs A+B', () => {
  let state = createKnapsackState();
  assert.throws(() => chosenKnapsackItems(state), /Complete/);
  assert.deepEqual(state.dp[0], [0, 0, 0, 0, 0, 0]);
  while (!state.done) state = stepKnapsack(state);
  assert.deepEqual(state.dp, [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 3, 3, 3, 3],
    [0, 0, 3, 4, 4, 7],
    [0, 0, 3, 4, 5, 7],
  ]);
  assert.deepEqual(chosenKnapsackItems(state), ['A', 'B']);
  assert.throws(() => stepKnapsack(state), /finished/);
});

test('Dijkstra settles the smallest finite label and leaves X unreachable', () => {
  let state = createDijkstraState();
  const wrong = settleDijkstra(state, 'B');
  assert.deepEqual(wrong.settled, []);
  assert.equal(wrong.distances.B, Infinity);
  const order = [];
  while (!state.done) {
    const vertex = expectedDijkstraVertex(state);
    order.push(vertex);
    state = settleDijkstra(state, vertex);
  }
  assert.deepEqual(order, ['A', 'C', 'B', 'D', 'E']);
  assert.deepEqual(state.distances, { A: 0, B: 3, C: 1, D: 4, E: 7, X: Infinity });
  assert.deepEqual(dijkstraPath(state), ['A', 'C', 'B', 'D', 'E']);
  assert.equal(dijkstraPath(state, 'X'), null);
  assert.throws(() => settleDijkstra(state, 'X'), /finished/);
  assert.throws(() => createDijkstraState('missing'), /Unknown/);
  assert.throws(() => dijkstraPath(state, 'missing'), /Unknown/);
});

test('six advanced algorithm lessons parse with examples, quizzes and valid prerequisites', async () => {
  const slugs = [
    'hash-collisions-resizing',
    'string-pattern-kmp',
    'dynamic-programming-knapsack',
    'dynamic-programming-lcs',
    'graph-shortest-path-dijkstra',
    'amortized-dynamic-array',
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
