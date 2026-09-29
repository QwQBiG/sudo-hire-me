import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import initSqlJs from 'sql.js';
import { advanceArp, createArpState } from '../src/domain/arp.mjs';

test('ARP resolves the destination MAC only for on-link delivery', () => {
  let state = createArpState('192.168.10.50', 27);
  state = advanceArp(state, 'route');
  assert.equal(state.direct, true);
  assert.equal(state.nextHop, '192.168.10.50');
  state = advanceArp(state, 'request');
  assert.match(state.events.at(-1), /192\.168\.10\.50/);
  state = advanceArp(state, 'reply');
  state = advanceArp(state, 'send');
  assert.equal(state.phase, 'sent');
  assert.match(state.events.at(-1), /02:00:00:00:00:50/);
});

test('ARP resolves the gateway while the remote IP destination stays unchanged', () => {
  let state = createArpState('192.168.10.50', 28, true);
  state = advanceArp(state, 'route');
  assert.equal(state.direct, false);
  assert.equal(state.nextHop, '192.168.10.33');
  assert.equal(state.cache[state.nextHop], '02:00:00:00:00:33');
  const invalid = advanceArp(state, 'request');
  assert.equal(invalid.phase, 'route');
  state = advanceArp(state, 'send');
  assert.match(state.events.at(-1), /MAC 目的 02:00:00:00:00:33；IP 目的 192\.168\.10\.50/);
  assert.throws(() => createArpState('192.168.10.50', 31));
  assert.throws(() => createArpState('192.168.10.99', 27));
  assert.throws(() => advanceArp(state, 'unknown'));
});

async function lessonSql(slug) {
  const markdown = await readFile(
    new URL(`../content/lessons/${slug}.md`, import.meta.url),
    'utf8',
  );
  const code = markdown.match(/## 实验代码\s+```sql\n([\s\S]*?)\n```/)?.[1];
  assert.ok(code, `${slug} needs an executable first SQL block`);
  return code;
}

async function database() {
  const wasmBinary = await readFile(
    new URL('../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url),
  );
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();
  db.run(`CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);
    INSERT INTO students VALUES (1, 'Lin'), (2, 'Zhou'), (3, 'Xu');
    CREATE TABLE scores (student_id INTEGER, score INTEGER);
    INSERT INTO scores VALUES (1, 80), (1, 90), (2, 60);`);
  return db;
}

test('SQLite constraints lesson runs and each invalid write is rejected', async () => {
  const db = await database();
  try {
    const results = db.exec(await lessonSql('sql-constraints'));
    assert.equal(results[0].values[0][0], 1);
    assert.deepEqual(results.at(-1).values, [
      [10, 'lin@example.test', 100, 1],
      [11, null, 0, 2],
      [12, null, 80, 1],
    ]);
    assert.throws(
      () => db.run("INSERT INTO staff VALUES (10, 'other@example.test', 'Duplicate', 10, 1)"),
      /UNIQUE constraint failed/,
    );
    assert.throws(
      () => db.run("INSERT INTO staff VALUES (13, 'lin@example.test', 'Duplicate', 10, 1)"),
      /UNIQUE constraint failed/,
    );
    assert.throws(
      () => db.run("INSERT INTO staff VALUES (13, 'new@example.test', NULL, 10, 1)"),
      /NOT NULL constraint failed/,
    );
    assert.throws(
      () => db.run("INSERT INTO staff VALUES (13, 'new@example.test', 'New', -1, 1)"),
      /CHECK constraint failed/,
    );
    assert.throws(
      () => db.run("INSERT INTO staff VALUES (13, 'new@example.test', 'New', 0, 99)"),
      /FOREIGN KEY constraint failed/,
    );
  } finally {
    db.close();
  }
});

test('SQLite window lesson retains all rows and distinguishes ranking ties', async () => {
  const db = await database();
  try {
    const results = db.exec(await lessonSql('sql-window-functions'));
    assert.deepEqual(results.at(-1).values, [
      [1, 1, 80, 3, 86.67, 3, 3],
      [2, 1, 90, 3, 86.67, 1, 1],
      [4, 1, 90, 3, 86.67, 2, 1],
      [3, 2, 60, 2, 67.5, 2, 2],
      [5, 2, 75, 2, 67.5, 1, 1],
    ]);
  } finally {
    db.close();
  }
});

test('composite-index example initializes six rows and both plans execute', async () => {
  const markdown = await readFile(
    new URL('../content/lessons/composite-index-order.md', import.meta.url),
    'utf8',
  );
  const code = markdown.match(/## 在 SQLite 中核对计划[\s\S]*?```sql\n([\s\S]*?)\n```/)?.[1];
  assert.ok(code);
  const db = await database();
  try {
    const plans = db.exec(code);
    assert.equal(plans.length, 2);
    assert.deepEqual(db.exec("SELECT id FROM results WHERE dept = 'A' AND score >= 80")[0].values, [
      [2],
      [3],
    ]);
  } finally {
    db.close();
  }
});
