import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBoundaryTests } from '../src/domain/boundary-tests.mjs';

test('edge inputs distinguish all three faulty implementations', () => {
  const result = evaluateBoundaryTests([-1, 0, 10]);
  assert.deepEqual(
    result.map((item) => item.failures[0]?.input),
    [-1, 0, 10],
  );
});

test('ordinary input does not expose boundary faults', () => {
  assert.ok(evaluateBoundaryTests([5]).every((item) => item.failures.length === 0));
});

test('invalid candidate is rejected', () => {
  assert.throws(() => evaluateBoundaryTests([Infinity]), /候选输入/);
});
