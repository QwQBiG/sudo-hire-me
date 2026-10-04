import test from 'node:test';
import assert from 'node:assert/strict';
import {
  typedInput,
  genericFlow,
  callbackFlow,
  createPoint,
  movePoint,
  pointWindow,
} from '../src/domain/type-flow.mjs';

test('typed inputs reject mixed types, invalid points and invalid Unicode', () => {
  for (const [text, type] of [
    ['[1,"2"]', 'int'],
    ['[true]', 'int'],
    ['[100]', 'int'],
    ['[1.2]', 'int'],
    ['["123456789"]', 'text'],
    ['["\\ud800"]', 'text'],
    ['[{"x":1}]', 'point'],
    ['[{"x":1,"y":2,"z":3}]', 'point'],
    ['null', 'int'],
    ['[1,2,3,4,5,6,7,8,9]', 'int'],
  ])
    assert.equal(typedInput(text, type).valid, false);
  assert.equal(typedInput('["\\ud83d\\ude00"]', 'text').valid, true);
  assert.equal(typedInput('[]', 'point').valid, true);
  assert.throws(() => typedInput('[]', 'any'), RangeError);
});

test('first needs no ordering and returns a reference index rather than a copied value', () => {
  const result = genericFlow('[{"x":2,"y":3},{"x":0,"y":9}]', 'point', 'first');
  assert.equal(result.permitted, true);
  assert.equal(result.index, 0);
  assert.equal(result.value, result.items[0]);
  assert.equal(result.trace.length, 0);
  assert.equal(genericFlow('[]', 'int', 'first').index, -1);
  assert.equal(genericFlow('[2,3]', 'int', 'first').value, 2);
});

test('max requires ordering even for an empty Point slice, and returns the last tied maximum', () => {
  assert.equal(genericFlow('[]', 'point', 'max').permitted, false);
  const numbers = genericFlow('[2,3,3]', 'int', 'max');
  assert.equal(numbers.index, 2);
  assert.equal(numbers.trace[1].order, 0);
  const points = genericFlow('[{"x":2,"y":3},{"x":2,"y":4},{"x":1,"y":99}]', 'point', 'max', true);
  assert.equal(points.index, 1);
  assert.equal(genericFlow('[]', 'point', 'max', true).index, -1);
  assert.throws(() => genericFlow('[]', 'int', 'sort'), RangeError);
});

test('Rust string comparison follows UTF-8 byte order, not JavaScript UTF-16 ordering', () => {
  const result = genericFlow('["\\ue000","\\ud800\\udc00"]', 'text', 'max');
  assert.equal(result.index, 1);
  assert.equal(genericFlow('["a","aa","b"]', 'text', 'max').index, 2);
  assert.equal(genericFlow('["","a",""]', 'text', 'max').index, 1);
});

test('callback calls and returns are distinct; only a completed return changes the count', () => {
  assert.equal(callbackFlow('[2,3,4,5]', 'even', 3, 0).phase, 'ready');
  const entered = callbackFlow('[2,3,4,5]', 'even', 3, 1);
  assert.equal(entered.phase, 'predicate');
  assert.equal(entered.count, 0);
  assert.equal(entered.current, 2);
  const returned = callbackFlow('[2,3,4,5]', 'even', 3, 2);
  assert.equal(returned.phase, 'loop');
  assert.equal(returned.count, 1);
  assert.equal(returned.current, 3);
  for (const rule of ['even', 'over3']) {
    const done = callbackFlow('[2,3,4,5]', rule, 3, 8);
    assert.equal(done.phase, 'done');
    assert.equal(done.count, 2);
    assert.deepEqual(
      done.records.filter((r) => r.matched).map((r) => r.value),
      rule === 'even' ? [2, 4] : [4, 5],
    );
  }
});

test('callback context, empty input, parse failures and signature rejection keep different meanings', () => {
  assert.equal(callbackFlow('[2,3,4,5]', 'context', 4, 8).count, 1);
  assert.equal(callbackFlow('[]', 'even').phase, 'done');
  assert.equal(callbackFlow('[2,"x"]', 'even').phase, 'error');
  assert.equal(callbackFlow('[]', 'even', 3, 0, false).phase, 'blocked');
  assert.throws(() => callbackFlow('[2]', 'even', 3, 3), RangeError);
  assert.throws(() => callbackFlow('[]', 'even', 10), RangeError);
});

test('direction branches modify one Point component, retain unknown inputs and immutable snapshots', () => {
  const start = createPoint();
  for (const [direction, x, y] of [
    [0, 2, 4],
    [1, 3, 3],
    [2, 2, 2],
    [3, 1, 3],
    [99, 2, 3],
  ]) {
    const next = movePoint(start, direction);
    assert.deepEqual(next.point, { x, y });
    assert.equal(next.records[0].accepted, direction !== 99);
    assert.deepEqual(start.point, { x: 2, y: 3 });
    assert.equal(start.records.length, 0);
  }
  assert.equal(movePoint(createPoint(20, 0), 1).records[0].accepted, false);
  assert.throws(() => movePoint(start, -1), RangeError);
});

test('coordinate camera always contains the Point, with a bounded movement ledger', () => {
  for (let x = -20; x <= 20; x++)
    for (let y = -20; y <= 20; y++) {
      const view = pointWindow({ x, y });
      assert.ok(x >= view.minX && x <= view.maxX && y >= view.minY && y <= view.maxY);
      assert.equal(view.maxX - view.minX, 8);
    }
  let state = createPoint();
  for (let i = 0; i < 30; i++) state = movePoint(state, 99);
  assert.equal(state.records.length, 12);
});
