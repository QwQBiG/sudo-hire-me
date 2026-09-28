import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const ready = initSqlJs({ locateFile: () => wasmUrl });
self.onmessage = async (event: MessageEvent<string>) => {
  let database;
  try {
    const SQL = await ready;
    self.postMessage({ kind: 'ready' });
    database = new SQL.Database();
    database.run(`CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);
      INSERT INTO students VALUES (1, 'Lin'), (2, 'Zhou'), (3, 'Xu');
      CREATE TABLE scores (student_id INTEGER, score INTEGER);
      INSERT INTO scores VALUES (1, 80), (1, 90), (2, 60);`);
    const results = [];
    let statements = 0,
      count = 0,
      characters = 0,
      truncated = false;
    for (const statement of database.iterateStatements(event.data)) {
      if (++statements > 20) throw new Error('每次最多执行 20 条 SQL 语句。');
      const columnNames = statement.getColumnNames();
      const columns = columnNames.slice(0, 30).map((name) => name.slice(0, 120));
      if (columns.length < columnNames.length) truncated = true;
      const rows = [];
      while (statement.step()) {
        if (count++ >= 100 || characters >= 30000) {
          truncated = true;
          break;
        }
        rows.push(
          statement
            .get()
            .slice(0, 30)
            .map((value) => {
              if (value instanceof Uint8Array) return `[BLOB ${value.length} bytes]`;
              if (typeof value !== 'string') return value;
              const limited = value.slice(0, Math.min(1000, Math.max(0, 30000 - characters)));
              characters += limited.length;
              if (limited.length < value.length) {
                truncated = true;
                return `${limited}…`;
              }
              return limited;
            }),
        );
      }
      if (columns.length) results.push({ columns, rows });
      if (truncated) break;
    }
    self.postMessage({ kind: 'result', results, truncated });
  } catch (error) {
    self.postMessage({ kind: 'error', text: (error as Error).message });
  } finally {
    database?.close();
  }
};
