import { useEffect, useRef, useState } from 'react';
import { Play, Square, FlaskConical } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

type Result = { query: string; rows: { name: string; role: string }[] };
export default function SqlParameters({ lesson }: LabProps) {
  const [username, setUsername] = useState('alice'),
    [mode, setMode] = useState('bound');
  const [result, setResult] = useState<Result | null>(null),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    worker.current?.terminate();
    worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);
  const reset = () => {
    cancel();
    setResult(null);
    setNote('');
    setBusy(false);
  };
  const run = () => {
    reset();
    setBusy(true);
    setNote('加载 SQLite…');
    let active: Worker;
    try {
      active = new Worker(new URL('../../runners/sql-parameters.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (error) {
      setBusy(false);
      setNote(`运行器初始化失败：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    worker.current = active;
    const finish = () => {
      cancel();
      setBusy(false);
    };
    const deadline = (milliseconds: number, message: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (worker.current === active) {
          setNote(message);
          finish();
        }
      }, milliseconds);
    };
    active.onmessage = (
      event: MessageEvent<{ kind: string; query: string; rows: Result['rows']; text: string }>,
    ) => {
      if (worker.current !== active) return;
      if (event.data.kind === 'ready') {
        setNote('执行 SQLite 查询…');
        deadline(5000, '查询执行超过 5 秒，已停止。');
        return;
      }
      if (event.data.kind === 'result') {
        setResult({ query: event.data.query, rows: event.data.rows });
        setNote(
          `SQLite 实际返回 ${event.data.rows.length} 行；参数绑定模式把输入视为数据而非 SQL 结构。`,
        );
      } else setNote(`SQLite 错误：${event.data.text}`);
      finish();
    };
    active.onerror = () => {
      if (worker.current === active) {
        setNote('运行器加载失败，请重试。');
        finish();
      }
    };
    deadline(60000, '引擎加载超过 60 秒，已停止。');
    active.postMessage({ username, parameterized: mode === 'bound' });
  };
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="真实 SQLite 沙箱；只有 alice/bob 两行虚构数据，每次执行创建全新数据库。"
      onReset={reset}
    >
      <Choice
        label="查询构造"
        value={mode}
        options={[
          ['bound', 'prepare + bind'],
          ['concat', '危险字符串拼接'],
        ]}
        onChange={(v) => {
          reset();
          setMode(v);
        }}
      />
      <label className="exp-input">
        查询用户名
        <input
          aria-label="查询用户名"
          maxLength={120}
          value={username}
          onChange={(e) => {
            reset();
            setUsername(e.target.value);
          }}
        />
      </label>
      <div className="exp-actions">
        <button
          onClick={() => {
            reset();
            setUsername("' OR 1=1 --");
          }}
        >
          <FlaskConical size={16} />
          填入注入样例
        </button>
        <button
          onClick={
            busy
              ? () => {
                  reset();
                  setNote('已停止；本次数据库不保留。');
                }
              : run
          }
        >
          {busy ? <Square size={16} /> : <Play size={16} />}
          {busy ? '停止查询' : '执行查询'}
        </button>
      </div>
      {result && (
        <>
          <pre className="exp-output">
            {result.query}
            {mode === 'bound' ? `\n参数 1 = ${JSON.stringify(username)}` : ''}
          </pre>
          <div className="exp-sql-results">
            <table>
              <thead>
                <tr>
                  <th>name</th>
                  <th>role</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.rows.length && <p>0 行匹配</p>}
          </div>
        </>
      )}
      <Feedback good={!note.includes('错误') && !note.includes('失败') && !note.includes('超过')}>
        {note ||
          '先查询 alice，再填入注入样例，对比两种模式。这里演示检索条件绕过，不是一个登录系统。'}
      </Feedback>
    </Bench>
  );
}
