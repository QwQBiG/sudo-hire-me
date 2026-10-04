import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQueueContract,
  queueContractCommand,
  initialShapeContract,
  resizeShape,
  javaRoleCall,
  javaRoleConstruction,
  carDelegation,
} from '../src/domain/oop-contracts.mjs';

test('independent queue representations preserve FIFO while a same-named stack breaks it', () => {
  let state = createQueueContract();
  state = queueContractCommand(state, 'enqueue', 'A');
  state = queueContractCommand(state, 'enqueue', 'B');
  state = queueContractCommand(state, 'dequeue');
  assert.deepEqual(state.records.at(-1), {
    command: 'dequeue()',
    expected: 'A',
    array: 'A',
    linked: 'A',
    lifo: 'B',
    accepted: true,
  });
  assert.equal(state.violated, true);
});
test('ring wraparound, linked next pointers and empty/full results agree across bounded sequences', () => {
  const check = (state, depth) => {
    const ordered = Array.from(
      { length: state.size },
      (_, i) => state.slots[(state.head + i) % 4].value,
    );
    assert.deepEqual(ordered, state.logical);
    assert.deepEqual(
      state.nodes.map((n) => n.value),
      state.logical,
    );
    assert.equal(state.slots.filter(Boolean).length, state.size);
    state.nodes.forEach((node, i) => assert.equal(node.next, state.nodes[i + 1]?.id ?? null));
    const record = state.records.at(-1);
    if (record) {
      assert.equal(record.array, record.expected);
      assert.equal(record.linked, record.expected);
    }
    if (!depth) return;
    for (const [action, value] of [
      ['enqueue', 'A'],
      ['enqueue', 'B'],
      ['dequeue', 'A'],
    ])
      check(queueContractCommand(state, action, value), depth - 1);
  };
  check(createQueueContract(), 7);
});
test('rejected enqueue and empty dequeue do not alter storage, and snapshots stay immutable', () => {
  let full = createQueueContract();
  for (const value of ['A', 'B', 'C', 'D']) full = queueContractCommand(full, 'enqueue', value);
  const before = structuredClone(full);
  const rejected = queueContractCommand(full, 'enqueue', 'A');
  assert.deepEqual(full, before);
  for (const key of ['logical', 'slots', 'nodes', 'head', 'size', 'serial'])
    assert.deepEqual(rejected[key], full[key]);
  assert.equal(rejected.records.at(-1).accepted, false);
  const empty = queueContractCommand(createQueueContract(), 'dequeue');
  assert.equal(empty.head, 0);
  assert.equal(empty.records.at(-1).array, 'None');
  assert.throws(() => queueContractCommand(full, 'enqueue', ''), RangeError);
  assert.throws(() => queueContractCommand(full, 'pop'), RangeError);
});
test('mutable square violates independent setter postconditions, not mathematics', () => {
  const before = initialShapeContract();
  let state = resizeShape(before, 'square', 'width', 2);
  assert.deepEqual(before, initialShapeContract());
  assert.deepEqual(state.expected, { width: 2, height: 1 });
  assert.deepEqual(state.actual, { width: 2, height: 2 });
  state = resizeShape(state, 'square', 'height', 3);
  assert.equal(state.expected.width * state.expected.height, 6);
  assert.equal(state.actual.width * state.actual.height, 9);
  const rectangle = resizeShape(
    resizeShape(before, 'rectangle', 'width', 2),
    'rectangle',
    'height',
    3,
  );
  assert.deepEqual(rectangle.actual, rectangle.expected);
  assert.throws(() => resizeShape(before, 'square', 'width', 0), RangeError);
  assert.throws(() => resizeShape(before, 'toString', 'width', 2), RangeError);
});
test('static reference type limits members but the same concrete object selects implementations', () => {
  assert.deepEqual(javaRoleCall('Area', 'area'), {
    allowed: true,
    value: 9,
    implementation: 'Square.area()',
  });
  assert.equal(javaRoleCall('Area', 'color').allowed, false);
  assert.equal(javaRoleCall('Shape', 'area').allowed, false);
  assert.equal(javaRoleCall('Shape', 'color', 4, 'blue').value, 'blue');
  assert.equal(javaRoleCall('Shape', 'kind').value, 'square');
  for (const method of ['area', 'color', 'kind'])
    assert.equal(javaRoleCall('Square', method).allowed, true);
  assert.throws(() => javaRoleCall('constructor', 'area'), RangeError);
  assert.throws(() => javaRoleCall('Square', 'area', 9), RangeError);
});
test('abstract bases initialize subclass state but cannot be directly instantiated', () => {
  assert.equal(javaRoleConstruction('Area').allowed, false);
  assert.equal(javaRoleConstruction('Shape').allowed, false);
  assert.equal(javaRoleConstruction('Square').allowed, true);
  assert.throws(() => javaRoleConstruction('toString'), RangeError);
});
test('class inheritance and delegated engine calls remain different execution paths', () => {
  assert.deepEqual(carDelegation('fuel', 'start'), {
    target: 'Engine.start()',
    value: 'engine on',
  });
  assert.equal(carDelegation('electric', 'start').value, 'electric engine on');
  assert.equal(carDelegation('electric', 'move').target, 'Vehicle.move()');
  assert.throws(() => carDelegation('toString', 'start'), RangeError);
});
