import { useEffect, useId, useRef, useState } from 'react';
import {
  Braces,
  ChevronDown,
  Database,
  Play,
  RotateCcw,
  Square,
  TriangleAlert,
} from 'lucide-react';
import { runJavaScript } from '../runners/javascript';
import { Markdown } from '../components/Markdown';
import type { LabProps } from '../types';

interface Table {
  columns: string[];
  rows: (string | number | null)[][];
}
interface Output {
  kind: string;
  text: string;
}
export default function CodeLab({ lesson }: LabProps) {
  const sql = lesson.lab === 'sql';
  const usesPresetTables = /\b(?:students|scores)\b/i.test(lesson.code);
  const inputData = lesson.sections.find((section) =>
    ['看清输入数据', '输入数据'].includes(section.title),
  );
  const [code, setCode] = useState(lesson.code);
  const [showInputData, setShowInputData] = useState(false);
  const inputDataId = useId();
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<Output[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  const stopRef = useRef<(() => void) | null>(null);
  const runId = useRef(0);
  const active = state === 'loading' || state === 'running';
  useEffect(
    () => () => {
      runId.current++;
      stopRef.current?.();
    },
    [],
  );
  function cancel(message = '运行已停止。') {
    runId.current++;
    stopRef.current?.();
    stopRef.current = null;
    setState('idle');
    setOutput([{ kind: 'info', text: message }]);
    setTables([]);
  }
  function run() {
    stopRef.current?.();
    const id = ++runId.current;
    setState(sql ? 'loading' : 'running');
    setOutput([]);
    setTables([]);
    if (!sql) {
      let failed = false;
      stopRef.current = runJavaScript(code, (event) => {
        if (id !== runId.current) return;
        if (event.kind === 'done') setState(failed ? 'error' : 'done');
        else {
          if (event.kind === 'error') failed = true;
          setOutput((old) => [...old, { kind: event.kind, text: event.text ?? '' }]);
        }
      });
      return;
    }
    const worker = new Worker(new URL('../runners/sql.worker.ts', import.meta.url), {
      type: 'module',
    });
    const dispose = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const fail = (text: string) => {
      if (id !== runId.current) return;
      dispose();
      setState('error');
      setOutput([{ kind: 'error', text }]);
    };
    let timer = setTimeout(() => fail('SQLite 加载超过 60 秒，请检查网络后重试。'), 60000);
    stopRef.current = dispose;
    worker.onmessage = (event) => {
      if (id !== runId.current) return;
      if (event.data.kind === 'ready') {
        clearTimeout(timer);
        setState('running');
        timer = setTimeout(() => fail('SQL 运行超过 5 秒，已终止。'), 5000);
        return;
      }
      dispose();
      if (event.data.kind === 'error') {
        setState('error');
        setOutput([{ kind: 'error', text: event.data.text }]);
      } else {
        setState('done');
        setTables(event.data.results);
        if (event.data.truncated)
          setOutput([
            {
              kind: 'info',
              text: '输出已截断：最多 100 行、30 列，单元格 1000 字符，总文本 30000 字符。',
            },
          ]);
      }
    };
    worker.onerror = (event) => fail(event.message || 'SQLite 加载失败，请检查网络后重试。');
    worker.postMessage(code);
  }
  return (
    <section className="lab code-lab" aria-label={sql ? 'SQL 实验' : 'JavaScript 实验'}>
      <header className="lab-heading">
        <span>
          {sql ? <Database size={18} /> : <Braces size={18} />}
          {sql ? 'SQLITE PLAYGROUND' : 'JAVASCRIPT PLAYGROUND'}
        </span>
        <span className="lab-kind">真实运行</span>
      </header>
      {sql && usesPresetTables && (
        <div className="schema-strip">
          <code>students(id, name)</code>
          <code>scores(student_id, score)</code>
        </div>
      )}
      {sql && inputData && (
        <div className="schema-preview">
          <button
            type="button"
            aria-expanded={showInputData}
            aria-controls={inputDataId}
            onClick={() => setShowInputData((value) => !value)}
          >
            初始数据 <ChevronDown size={15} />
          </button>
          {showInputData && (
            <div id={inputDataId} className="schema-preview-body">
              <Markdown>{inputData.markdown}</Markdown>
            </div>
          )}
        </div>
      )}
      <div className="editor-heading">
        <span>{sql ? 'query.sql' : `${lesson.slug}.js`}</span>
        <div>
          <button
            className="icon-button"
            title="载入错误示例"
            aria-label="载入错误示例"
            disabled={active}
            onClick={() => {
              setCode(sql ? 'SELECT missing_column FROM students;' : 'const value = ;');
              setState('idle');
              setOutput([]);
              setTables([]);
            }}
          >
            <TriangleAlert size={15} />
          </button>
          <button
            className="icon-button"
            title="重置代码"
            aria-label="重置代码"
            onClick={() => {
              cancel('代码已重置。');
              setCode(lesson.code);
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div className="editor">
        <div ref={lineNumbersRef} className="line-numbers" aria-hidden="true">
          {code.split('\n').map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <textarea
          className="code-input"
          aria-label={sql ? 'SQL 代码' : 'JavaScript 代码'}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onScroll={(event) => {
            if (lineNumbersRef.current)
              lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={20000}
        />
      </div>
      <div className="code-controls">
        <span>
          {sql ? '每次运行使用初始数据 · SQLite' : '隔离 Worker · 无 DOM / 网络 · 2 秒上限'}
        </span>
        {active ? (
          <button className="run-button stop" onClick={() => cancel()}>
            <Square size={14} />
            停止
          </button>
        ) : (
          <button className="run-button" disabled={!code.trim()} onClick={run}>
            <Play size={15} />
            运行代码
          </button>
        )}
      </div>
      <div className="output">
        <div className="output-heading">
          <span>{sql ? 'RESULT' : 'CONSOLE'}</span>
          <span className={state === 'error' ? 'error-text' : ''}>
            {
              {
                idle: '等待运行',
                loading: '加载 SQLite…',
                running: '运行中…',
                done: '运行结束',
                error: '运行出错',
              }[state]
            }
          </span>
        </div>
        <div className="output-body" role="log" aria-live="polite">
          {state === 'idle' && !output.length && (
            <p className="output-placeholder">
              {sql ? '先预测查询返回哪些行，再执行查询。' : '先预测输出，再用运行结果验证。'}
            </p>
          )}
          {output.map((line, index) => (
            <pre className={line.kind === 'error' ? 'error-text' : ''} key={index}>
              <span className="output-prompt">›</span>
              {line.text}
            </pre>
          ))}
          {tables.map((table, index) => (
            <div className="result-table" key={index}>
              <table>
                <thead>
                  <tr>
                    {table.columns.map((column, i) => (
                      <th key={i}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell === null ? <i>NULL</i> : String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <small>{table.rows.length} 行</small>
            </div>
          ))}
          {state === 'done' && !output.length && !tables.length && (
            <p className="output-placeholder">执行完成，无输出。</p>
          )}
        </div>
      </div>
    </section>
  );
}
