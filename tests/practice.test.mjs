import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queryIndex,
  indexLeaves,
  newTransaction,
  transact,
  newGitState,
  gitAction,
  gitStatus,
  snapshotDiff,
  debugCases,
  runMaxCase,
  newIsolation,
  isolationAction,
} from '../src/domain/practice.mjs';

test('index locates all leaf keys and avoids table lookups for covering queries', () => {
  indexLeaves.flat().forEach((value, index) => {
    assert.equal(queryIndex(value).row, index + 1);
    assert.equal(queryIndex(value).leaf, Math.floor(index / 4));
    assert.equal(queryIndex(value).lookups, 1);
    assert.equal(queryIndex(value, true).lookups, 0);
  });
  assert.equal(queryIndex(42).found, false);
  assert.equal(queryIndex(42).lookups, 0);
  assert.equal(queryIndex(0).leaf, 0);
  assert.equal(queryIndex(100).leaf, 3);
  assert.throws(() => queryIndex(101), RangeError);
  assert.throws(() => queryIndex(2.5), RangeError);
});

test('transaction commits complete transfers and rolls back intermediate updates', () => {
  const initial = newTransaction();
  let state = transact(initial, 'begin', 300);
  state = transact(state, 'debit');
  assert.deepEqual(state.draft, [700, 500]);
  assert.deepEqual(state.committed, [1000, 500]);
  assert.equal(transact(state, 'commit'), state);
  assert.equal(transact(state, 'debit'), state);
  assert.deepEqual(transact(state, 'rollback').committed, [1000, 500]);
  state = transact(transact(state, 'credit'), 'commit');
  assert.deepEqual(state.committed, [700, 800]);
  assert.equal(state.draft, null);
  assert.deepEqual(initial.committed, [1000, 500]);
});

test('constraint error preserves prior state and requires application rollback', () => {
  let state = transact(newTransaction(), 'begin', 1200);
  state = transact(state, 'debit');
  assert.equal(state.stage, 'failed');
  assert.deepEqual(state.draft, [1000, 500]);
  assert.equal(transact(state, 'credit'), state);
  assert.equal(transact(state, 'commit'), state);
  assert.equal(transact(state, 'rollback').draft, null);
  assert.throws(() => transact(newTransaction(), 'begin', -1), RangeError);
});

test('git commits staged B while working C remains unstaged', () => {
  let state = gitAction(newGitState(), 'edit', 'version B');
  state = gitAction(state, 'stage');
  state = gitAction(state, 'edit', 'version C');
  assert.equal(gitStatus(state), 'MM');
  state = gitAction(state, 'commit');
  assert.equal(state.head, 'version B');
  assert.equal(state.working, 'version C');
  assert.equal(gitStatus(state), ' M');
  assert.equal(gitAction(state, 'commit'), state);
  assert.throws(() => gitAction(state, 'edit', 'x'.repeat(101)), RangeError);
});

test('fixed maximum function passes all cases; original fails negative and empty inputs', () => {
  debugCases.forEach((_, i) => assert.equal(runMaxCase(i, true).passed, true));
  assert.equal(runMaxCase(0, false).passed, true);
  assert.equal(runMaxCase(1, false).actual, 0);
  assert.equal(runMaxCase(1, false).passed, false);
  assert.equal(runMaxCase(3, false).passed, false);
  assert.deepEqual(
    runMaxCase(1, true).trace.map((entry) => entry.best),
    [-8, -3, -3],
  );
  assert.throws(() => runMaxCase(99, true), RangeError);
});

test('snapshot comparison prefixes each line and preserves blank lines and EOF distinction', () => {
  assert.deepEqual(snapshotDiff('first\nsecond\n', 'first\nnew\n'), [
    { kind: 'removed', text: '- first' },
    { kind: 'removed', text: '- second' },
    { kind: 'added', text: '+ first' },
    { kind: 'added', text: '+ new' },
  ]);
  assert.deepEqual(snapshotDiff('', 'one\n\ntwo'), [
    { kind: 'added', text: '+ one' },
    { kind: 'added', text: '+ ' },
    { kind: 'added', text: '+ two' },
    { kind: 'note', text: '\\ No newline at end of file' },
  ]);
  assert.deepEqual(snapshotDiff('one\n', ''), [{ kind: 'removed', text: '- one' }]);
  assert.deepEqual(snapshotDiff('same', 'same'), []);
  assert.deepEqual(snapshotDiff('', ''), []);
  assert.throws(() => snapshotDiff('x'.repeat(101), ''), RangeError);
});

test('fixed empty input returns before initialization, while original still initializes best', () => {
  assert.deepEqual(runMaxCase(3, true), { actual: null, expected: null, passed: true, trace: [] });
  assert.deepEqual(runMaxCase(3, false).trace, [{ value: null, best: 0, updated: false }]);
  assert.equal(runMaxCase(3, false).passed, false);
});

test('both isolation models hide uncommitted writes; repeatable read preserves first snapshot', () => {
  for (const mode of ['read-committed', 'repeatable-read']) {
    let state = newIsolation(mode);
    state = isolationAction(state, 'read');
    state = isolationAction(state, 'write');
    state = isolationAction(state, 'read');
    assert.deepEqual(state.reads, [100, 100]);
    state = isolationAction(state, 'commit');
    state = isolationAction(state, 'read');
    assert.equal(state.reads.at(-1), mode === 'read-committed' ? 120 : 100);
  }
  const late = isolationAction(isolationAction(newIsolation('repeatable-read'), 'write'), 'commit');
  assert.deepEqual(isolationAction(late, 'read').reads, [120]);
  assert.throws(() => newIsolation('invalid'), RangeError);
});

test('isolation does not infer a post-commit read from two earlier reads', () => {
  for (const mode of ['read-committed', 'repeatable-read']) {
    let state = newIsolation(mode);
    for (const action of ['read', 'read', 'write', 'commit'])
      state = isolationAction(state, action);
    assert.equal(state.readAfterCommit, false);
    assert.deepEqual(state.reads, [100, 100]);
    state = isolationAction(state, 'read');
    assert.equal(state.readAfterCommit, true);
    assert.equal(state.reads.at(-1), mode === 'read-committed' ? 120 : 100);
  }
});

test('SQLite grouping lesson examples produce the documented rows and error', async () => {
  const { default: initSqlJs } = await import('sql.js');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  try {
    db.run(
      'CREATE TABLE scores(student_id INTEGER, score INTEGER); INSERT INTO scores VALUES (1,80),(1,90),(2,60);',
    );
    const result = (sql) => db.exec(sql)[0]?.values ?? [];
    assert.deepEqual(
      result(
        'SELECT student_id, COUNT(*), COUNT(score), ROUND(AVG(score),1) FROM scores GROUP BY student_id HAVING COUNT(*)>=2 ORDER BY student_id;',
      ),
      [[1, 2, 2, 85]],
    );
    assert.deepEqual(
      result(
        'SELECT student_id, AVG(score) FROM scores WHERE score>=90 GROUP BY student_id ORDER BY student_id;',
      ),
      [[1, 90]],
    );
    assert.deepEqual(
      result(
        'SELECT student_id, AVG(score) FROM scores GROUP BY student_id HAVING AVG(score)>=80 ORDER BY student_id;',
      ),
      [[1, 85]],
    );
    assert.throws(
      () =>
        db.exec('SELECT student_id, COUNT(*) FROM scores WHERE COUNT(*)>=2 GROUP BY student_id;'),
      /misuse of aggregate/,
    );
    assert.deepEqual(result('SELECT COUNT(DISTINCT student_id) FROM scores;'), [[2]]);
    db.run('INSERT INTO scores VALUES (1,NULL);');
    assert.deepEqual(
      result(
        'SELECT student_id,COUNT(*),COUNT(score),AVG(score) FROM scores GROUP BY student_id ORDER BY student_id;',
      ),
      [
        [1, 3, 2, 85],
        [2, 1, 1, 60],
      ],
    );
    assert.deepEqual(result('SELECT COUNT(*), AVG(score) FROM scores WHERE 0;'), [[0, null]]);
    assert.deepEqual(
      result('SELECT student_id, AVG(score) FROM scores WHERE 0 GROUP BY student_id;'),
      [],
    );
  } finally {
    db.close();
  }
});

test('SQLite default constraint ABORT leaves a transaction open for explicit rollback', async () => {
  const { default: initSqlJs } = await import('sql.js');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  try {
    db.run(
      'CREATE TABLE accounts(id INTEGER PRIMARY KEY,balance INTEGER CHECK(balance>=0)); INSERT INTO accounts VALUES (1,1000),(2,500); BEGIN;',
    );
    assert.throws(
      () => db.run('UPDATE accounts SET balance=balance-1200 WHERE id=1;'),
      /CHECK constraint failed/,
    );
    assert.deepEqual(db.exec('SELECT balance FROM accounts ORDER BY id;')[0].values, [
      [1000],
      [500],
    ]);
    db.run('ROLLBACK;');
    assert.deepEqual(db.exec('SELECT balance FROM accounts ORDER BY id;')[0].values, [
      [1000],
      [500],
    ]);
  } finally {
    db.close();
  }
});
