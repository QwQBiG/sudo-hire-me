import test from 'node:test';
import assert from 'node:assert/strict';
import {
  firstEvenModel,
  readEvenModel,
  kotlinNullModel,
  createKeySet,
  keySetCommand,
  changeKey,
  keyHash,
} from '../src/domain/value-contracts.mjs';

test('first-even result preserves zero, negative values, absence and an empty array', () => {
  for (const [text, index, value] of [
    ['[1,3,8,2]', 2, 8],
    ['[1,3,0]', 2, 0],
    ['[1,-2,4]', 1, -2],
    ['[1,3]', -1, null],
    ['[]', -1, null],
  ]) {
    const result = firstEvenModel(text);
    assert.equal(result.valid, true);
    assert.equal(result.index, index);
    assert.equal(result.value, value);
  }
});
test('parse errors remain errors rather than being converted to absence', () => {
  for (const text of [
    '',
    '[1,,2]',
    '[null]',
    '[true]',
    '["2"]',
    '[1.2]',
    '[100]',
    '{}',
    '[0,0,0,0,0,0,0,0,0,0,0]',
  ]) {
    const result = firstEvenModel(text);
    assert.equal(result.valid, false);
    assert.equal(readEvenModel(result, 'fallback').branch, 'error');
  }
  assert.equal(readEvenModel(firstEvenModel('[1,3,0]'), 'unwrap').output, '0');
  assert.equal(readEvenModel(firstEvenModel('[1,3]'), 'unwrap').ok, false);
  assert.equal(readEvenModel(firstEvenModel('[1,3]'), 'fallback').output, '0');
  assert.throws(() => readEvenModel(firstEvenModel('[]'), 'unknown'), RangeError);
});
test('Kotlin null, empty text and literal null text stay distinct in every operator', () => {
  for (const mode of ['safe', 'elvis', 'bang']) {
    assert.equal(kotlinNullModel('', false, mode, 9).output, '0');
    assert.equal(kotlinNullModel('null', false, mode, 9).output, '4');
    assert.equal(kotlinNullModel('', false, mode, 9).fallbackUsed, false);
  }
  assert.equal(kotlinNullModel('hi', true, 'safe').output, 'null');
  assert.equal(kotlinNullModel('hi', true, 'elvis', 9).output, '9');
  assert.equal(kotlinNullModel('hi', true, 'bang').ok, false);
  assert.throws(() => kotlinNullModel('', false, 'elvis', 10), RangeError);
});
test('Kotlin JVM length counts UTF-16 code units including a surrogate pair', () => {
  assert.deepEqual(kotlinNullModel('\uD83D\uDE00', false, 'safe').units, ['D83D', 'DE00']);
  assert.equal(kotlinNullModel('e\u0301', false, 'safe').output, '2');
  assert.deepEqual(kotlinNullModel('\uD83D\uDE00', true, 'safe').units, []);
});
test('equal value keys deduplicate while constant hashing keeps unequal keys distinct', () => {
  for (const policy of ['value', 'constant']) {
    let state = keySetCommand(createKeySet(policy), 'a', 'add');
    state = keySetCommand(state, 'b', 'contains');
    assert.equal(state.probe.found, true);
    state = keySetCommand(state, 'b', 'add');
    assert.equal(state.probe.added, false);
    state = keySetCommand(state, 'c', 'add');
    assert.equal(state.probe.added, true);
    assert.equal(state.entries.length, 2);
    if (policy === 'constant') assert.equal(state.probe.visits[0].equal, false);
  }
});
test('different full hashes in one bucket skip equality and expose a broken contract', () => {
  let state = keySetCommand(createKeySet('identity'), 'a', 'add');
  state = keySetCommand(state, 'b', 'contains');
  assert.equal(state.values.a, state.values.b);
  assert.equal(state.probe.bucket, 1);
  assert.equal(state.probe.found, false);
  assert.deepEqual(state.probe.visits, [
    { object: 'a', storedHash: 1, sameHash: false, equal: false },
  ]);
});
test('mutable keys retain stored hashes; the same object can miss after a hash-changing edit', () => {
  const before = keySetCommand(createKeySet('value', true), 'a', 'add');
  let after = changeKey(before, 'a', 8);
  assert.equal(before.values.a, 7);
  assert.equal(after.entries[0].hash, 7);
  assert.equal(keyHash(after, 'a'), 8);
  after = keySetCommand(after, 'a', 'contains');
  assert.equal(after.probe.found, false);
  const stable = changeKey(keySetCommand(createKeySet('constant', true), 'a', 'add'), 'a', 8);
  assert.equal(keySetCommand(stable, 'a', 'contains').probe.found, true);
  assert.throws(() => changeKey(keySetCommand(createKeySet(), 'a', 'add'), 'a', 8), /immutable/);
  assert.throws(() => keyHash(before, 'constructor'), RangeError);
  assert.throws(() => changeKey(before, 'a', 16), RangeError);
  assert.throws(() => keySetCommand(before, 'a', 'remove'), RangeError);
});

test('all bounded value pairs respect deduplication with value and constant hashes', () => {
  for (const policy of ['value', 'constant']) {
    for (let a = 0; a <= 15; a++)
      for (let b = 0; b <= 15; b++) {
        const configured = changeKey(changeKey(createKeySet(policy), 'a', a), 'b', b);
        const stored = keySetCommand(configured, 'a', 'add');
        const queried = keySetCommand(stored, 'b', 'contains');
        const inserted = keySetCommand(stored, 'b', 'add');
        assert.equal(queried.probe.found, a === b);
        assert.equal(inserted.entries.length, a === b ? 1 : 2);
        assert.equal(stored.entries.length, 1);
        assert.equal(configured.entries.length, 0);
      }
  }
});
