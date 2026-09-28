import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/runners/sql.worker.ts', import.meta.url), 'utf8');
const workerAst = ts.createSourceFile('sql.worker.ts', source, ts.ScriptTarget.Latest, true);
const scriptAst = ts.factory.updateSourceFile(
  workerAst,
  workerAst.statements.filter((statement) => !ts.isImportDeclaration(statement)),
);
const compiled = ts.transpileModule(ts.createPrinter().printFile(scriptAst), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function createWorker() {
  const initialization = deferred();
  const messages = [];
  const events = [];
  // This database is a protocol stub; the tests do not execute SQLite queries.
  class Database {
    constructor() {
      events.push('create');
    }
    run() {
      events.push('seed');
    }
    *iterateStatements() {
      events.push('query');
      let pending = true;
      yield {
        getColumnNames: () => ['value'],
        get: () => [1],
        step: () => {
          const hasRow = pending;
          pending = false;
          return hasRow;
        },
      };
    }
    close() {
      events.push('close');
    }
  }
  const worker = {
    postMessage(message) {
      messages.push(structuredClone(message));
      events.push(message.kind);
    },
  };
  vm.runInNewContext(
    compiled.outputText,
    {
      initSqlJs: (options) => {
        assert.equal(options.locateFile(), 'mock-sql.wasm');
        return initialization.promise;
      },
      wasmUrl: 'mock-sql.wasm',
      self: worker,
      exports: {},
    },
    { timeout: 1000, filename: 'sql.worker.protocol.js' },
  );
  return {
    initialization,
    messages,
    events,
    sqlModule: { Database },
    run: () => worker.onmessage({ data: 'SELECT 1;' }),
  };
}

test('SQL worker emits no ready or result while initialization is pending', async () => {
  const worker = createWorker();
  const execution = worker.run();
  await Promise.resolve();
  assert.deepEqual(worker.messages, []);
  assert.deepEqual(worker.events, []);
  worker.initialization.resolve(worker.sqlModule);
  await execution;
});

test('SQL worker emits ready before result and closes the database', async () => {
  const worker = createWorker();
  const execution = worker.run();
  worker.initialization.resolve(worker.sqlModule);
  await execution;
  assert.deepEqual(worker.messages, [
    { kind: 'ready' },
    { kind: 'result', results: [{ columns: ['value'], rows: [[1]] }], truncated: false },
  ]);
  assert.deepEqual(worker.events, ['ready', 'create', 'seed', 'query', 'result', 'close']);
});

test('SQL worker reports initialization rejection without emitting ready', async () => {
  const worker = createWorker();
  const execution = worker.run();
  worker.initialization.reject(new Error('Initialization unavailable'));
  await execution;
  assert.deepEqual(worker.messages, [{ kind: 'error', text: 'Initialization unavailable' }]);
  assert.deepEqual(worker.events, ['error']);
});
