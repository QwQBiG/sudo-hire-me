import test from 'node:test';
import assert from 'node:assert/strict';
import { routeFromHash, continueLesson, hasStudyRecord } from '../src/domain/navigation.mjs';
import { freshLesson, freshProgress } from '../src/domain/progress.mjs';

const lessons = [
  { slug: 'first', subject: '计算机基础', prerequisites: [] },
  { slug: 'second', subject: '计算机基础', prerequisites: ['first'] },
  { slug: 'optional', subject: 'JavaScript 选修', prerequisites: [] },
];

test('home is the default route while existing lesson and overview links remain valid', () => {
  for (const hash of ['', '#', '#/']) assert.equal(routeFromHash(hash), 'home');
  assert.equal(routeFromHash('#/home'), 'home');
  assert.equal(routeFromHash('#/map'), 'map');
  assert.equal(routeFromHash('#/review'), 'review');
  assert.equal(routeFromHash('#/lesson/first'), 'first');
  assert.equal(routeFromHash('#first'), 'first');
  assert.equal(routeFromHash('#/unknown'), 'unknown');
});

test('continuation validates saved slugs and respects prerequisite completion', () => {
  const progress = freshProgress();
  assert.equal(continueLesson(lessons, progress, 'missing').slug, 'first');
  assert.equal(continueLesson(lessons, progress, 'second').slug, 'second');
  progress.lessons.first = { ...freshLesson(), passed: true };
  assert.equal(continueLesson(lessons, progress, 'first').slug, 'second');
  progress.lessons.second = { ...freshLesson(), passed: true };
  assert.equal(continueLesson(lessons, progress, 'second').slug, 'second');
  assert.equal(continueLesson([], progress, null), undefined);
});

test('only meaningful saved activity counts as a study record', () => {
  assert.equal(hasStudyRecord(undefined), false);
  assert.equal(hasStudyRecord(freshLesson()), false);
  for (const patch of [
    { read: true },
    { passed: true },
    { attempts: 1 },
    { bookmark: true },
    { note: '笔记' },
  ]) {
    assert.equal(hasStudyRecord({ ...freshLesson(), ...patch }), true);
  }
});
