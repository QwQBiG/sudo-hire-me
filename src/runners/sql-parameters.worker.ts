import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const ready = initSqlJs({ locateFile: () => wasmUrl });
self.onmessage = async (event: MessageEvent<unknown>) => {
  let database: InstanceType<Awaited<typeof ready>['Database']> | undefined;
  let statement: ReturnType<NonNullable<typeof database>['prepare']> | undefined;
  try {
    const input = event.data as { username?: unknown; parameterized?: unknown };
    if (
      !input ||
      typeof input.username !== 'string' ||
      input.username.length > 120 ||
      typeof input.parameterized !== 'boolean'
    )
      throw new Error('Invalid bounded input');
    const SQL = await ready;
    self.postMessage({ kind: 'ready' });
    database = new SQL.Database();
    database.run(
      "CREATE TABLE demo_users(name TEXT, role TEXT); INSERT INTO demo_users VALUES('alice','reader'),('bob','admin');",
    );
    const query = input.parameterized
      ? 'SELECT name, role FROM demo_users WHERE name = ?'
      : `SELECT name, role FROM demo_users WHERE name = '${input.username}'`;
    statement = database.prepare(query);
    if (input.parameterized) statement.bind([input.username]);
    const rows: unknown[] = [];
    while (statement.step() && rows.length < 10) rows.push(statement.getAsObject());
    self.postMessage({ kind: 'result', query, rows });
  } catch (error) {
    self.postMessage({
      kind: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  } finally {
    statement?.free();
    database?.close();
  }
};
