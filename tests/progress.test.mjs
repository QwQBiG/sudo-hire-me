import test from 'node:test';
import assert from 'node:assert/strict';
import { freshLesson, freshProgress, parseProgress } from '../src/domain/progress.mjs';

const slugs = ['binary-search', 'binary-representation'];
const encode = (lessons = {}, overrides = {}) =>
  JSON.stringify({ version: 1, lessons, reducedMotion: false, ...overrides });

test('fresh progress and lessons have independent mutable state', () => {
  const first = freshProgress();
  const second = freshProgress();
  first.lessons['binary-search'] = freshLesson();
  assert.deepEqual(second, { version: 1, lessons: {}, reducedMotion: false });
  const lesson = freshLesson();
  lesson.read = true;
  assert.equal(freshLesson().read, false);
});

test('progress import accepts empty progress and preserves supported fields', () => {
  assert.deepEqual(parseProgress(encode(), slugs), freshProgress());
  const lesson = {
    read: true,
    passed: true,
    attempts: 4,
    bookmark: true,
    note: 'Review boundaries',
  };
  const raw = encode({ 'binary-search': lesson }, { reducedMotion: true });
  const imported = parseProgress(raw, slugs);
  assert.deepEqual(imported, JSON.parse(raw));
});

test('progress import accepts documented numeric and note limits', () => {
  for (const attempts of [0, 100000]) {
    const lesson = { ...freshLesson(), attempts, note: 'x'.repeat(5000) };
    assert.equal(
      parseProgress(encode({ 'binary-search': lesson }), slugs).lessons['binary-search'].attempts,
      attempts,
    );
  }
});

test('progress import rejects malformed envelopes and unsupported versions', () => {
  for (const raw of [
    undefined,
    null,
    {},
    '',
    '{',
    'null',
    '[]',
    'x'.repeat(100001),
    encode({}, { version: 2 }),
    encode({}, { reducedMotion: 0 }),
    encode({}, { lessons: [] }),
    encode({}, { lessons: null }),
    encode({}, { extra: true }),
  ]) {
    assert.throws(() => parseProgress(raw, slugs));
  }
});

test('progress import rejects unknown courses and incomplete lesson records', () => {
  assert.throws(() => parseProgress(encode({ missing: freshLesson() }), slugs));
  for (const item of [null, [], {}, { read: true }, 'done']) {
    assert.throws(() => parseProgress(encode({ 'binary-search': item }), slugs));
  }
});

test('progress import rejects invalid field types and out-of-range values', () => {
  for (const override of [
    { read: 1 },
    { passed: 'yes' },
    { bookmark: null },
    { note: 4 },
    { note: 'x'.repeat(5001) },
    { attempts: -1 },
    { attempts: 1.5 },
    { attempts: 100001 },
    { attempts: '1' },
    { extra: true },
  ]) {
    const lesson = { ...freshLesson(), ...override };
    assert.throws(() => parseProgress(encode({ 'binary-search': lesson }), slugs));
  }
});

test('progress import rejects prototype-related keys at every supported level', () => {
  const record = JSON.stringify(freshLesson());
  const attacks = [
    `{"version":1,"lessons":{},"reducedMotion":false,"__proto__":{"polluted":true}}`,
    `{"version":1,"lessons":{"__proto__":${record}},"reducedMotion":false}`,
    `{"version":1,"lessons":{"constructor":${record}},"reducedMotion":false}`,
    encode({
      'binary-search': JSON.parse(
        `{"read":false,"passed":false,"attempts":0,` +
          `"bookmark":false,"note":"","__proto__":{"polluted":true}}`,
      ),
    }),
  ];
  for (const raw of attacks) assert.throws(() => parseProgress(raw, slugs));
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
});

test('reserved course names are rejected even if supplied in an allowlist', () => {
  for (const slug of ['__proto__', 'constructor', 'prototype']) {
    const lessons = Object.fromEntries([[slug, freshLesson()]]);
    assert.throws(() => parseProgress(encode(lessons), [slug]));
  }
  assert.equal(Object.hasOwn(Object.prototype, 'read'), false);
});
