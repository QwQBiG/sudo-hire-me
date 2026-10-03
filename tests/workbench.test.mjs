import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { parseLesson } from '../scripts/build-content.mjs';
import { workbenchFor, workbenchGroups } from '../src/domain/workbench-catalog.mjs';
import { applyAccount, MAX_BALANCE } from '../src/domain/account-workbench.mjs';

test('all mechanism lessons have an explicit unique mapping and no text paginator', async () => {
  const directory = new URL('../content/lessons/', import.meta.url);
  const names = (await readdir(directory)).filter((name) => name.endsWith('.md'));
  const lessons = await Promise.all(
    names.map(async (name) => parseLesson(await readFile(new URL(name, directory), 'utf8'), name)),
  );
  const mapped = Object.values(workbenchGroups).flat();
  assert.equal(new Set(mapped).size, mapped.length);
  assert.equal(mapped.length, lessons.filter((lesson) => lesson.lab === 'workbench').length);
  for (const lesson of lessons) {
    assert.notEqual(lesson.lab, 'walkthrough');
    assert.equal(Boolean(workbenchFor(lesson.slug)), lesson.lab === 'workbench', lesson.slug);
  }
  assert.equal(workbenchFor('unregistered-lesson'), undefined);
});

test('account rejects invalid withdrawals and overflow without changing balance', () => {
  for (const amount of [-1, 0, 120, 1.5, NaN]) {
    const result = applyAccount(100, 'withdraw', amount, true);
    assert.equal(result.accepted, false);
    assert.equal(result.balance, 100);
  }
  assert.equal(applyAccount(MAX_BALANCE, 'deposit', 1, true).balance, MAX_BALANCE);
  const deposited = applyAccount(100, 'deposit', 50, true);
  assert.equal(applyAccount(deposited.balance, 'withdraw', 80, true).balance, 70);
  assert.equal(applyAccount(100, 'withdraw', 100, true).balance, 0);
});

test('private field without checked methods can break the account invariant', () => {
  assert.equal(applyAccount(100, 'withdraw', 120, false).balance, -20);
  assert.equal(applyAccount(MAX_BALANCE, 'deposit', 1, false).balance, -2147483648);
});
