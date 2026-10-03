import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Play, ListChecks } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { debugCases, runMaxCase } from '../../domain/practice.mjs';
import './practice.css';
import './practice-quality.css';

type Run = ReturnType<typeof runMaxCase>;
export default function DebugLab() {
  const [fixed, setFixed] = useState(false);
  const [selected, setSelected] = useState(1);
  const [result, setResult] = useState<Run | null>(null);
  const [suite, setSuite] = useState<Run[]>([]);
  const [focused, setFocused] = useState(0);
  const comparison = result?.trace[focused];
  const clear = () => {
    setResult(null);
    setSuite([]);
  };
  const reset = () => {
    setFixed(false);
    setSelected(1);
    clear();
  };
  const source = fixed
    ? 'if (values.length === 0) return null;\nlet best = values[0];\nfor (let i = 1; i < values.length; i++) {\n  if (values[i] > best) best = values[i];\n}\nreturn best;'
    : 'let best = 0;\nfor (const value of values) {\n  if (value > best) best = value;\n}\nreturn best;';
  return (
    <Experiment
      className="practice-lab"
      title="让边界用例暴露错误"
      subtitle="真实运行固定的最大值纯函数，输入限于五组有限数字数组；空数组约定返回 null。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <div className="practice-segment" aria-label="函数版本">
          <button
            aria-pressed={!fixed}
            onClick={() => {
              setFixed(false);
              clear();
            }}
          >
            错误版本
          </button>
          <button
            aria-pressed={fixed}
            onClick={() => {
              setFixed(true);
              clear();
            }}
          >
            修复版本
          </button>
        </div>
        <label>
          输入用例
          <SelectField
            value={selected}
            onChange={(event) => {
              setSelected(Number(event.target.value));
              clear();
            }}
          >
            {debugCases.map((item, i) => (
              <option key={item.label} value={i}>
                {item.label} {JSON.stringify(item.values)}
              </option>
            ))}
          </SelectField>
        </label>
      </div>
      <div className="practice-debug-source">
        <small>maxOrNull(values)</small>
        <pre>
          <code>{source}</code>
        </pre>
      </div>
      <div className="experiment-controls">
        <button
          onClick={() => {
            setResult(runMaxCase(selected, fixed));
            setSuite([]);
            setFocused(0);
          }}
        >
          <Play size={16} />
          运行用例
        </button>
        <button
          onClick={() => {
            setSuite(debugCases.map((_, i) => runMaxCase(i, fixed)));
            setResult(runMaxCase(selected, fixed));
            setFocused(0);
          }}
        >
          <ListChecks size={16} />
          运行全部测试
        </button>
      </div>
      {comparison && (
        <div className="practice-variable-board" aria-live="polite">
          <div>
            <small>value</small>
            <strong>{comparison.value === null ? '—' : comparison.value}</strong>
            <span>{focused === 0 ? '初始化' : '本轮候选值'}</span>
          </div>
          <div>
            <small>best</small>
            <strong data-readout>{String(comparison.best)}</strong>
            <span>本轮结束后的值</span>
          </div>
          <div>
            <small>判断</small>
            <strong>{focused === 0 ? '初值' : comparison.updated ? '更新' : '保留'}</strong>
            <span>
              {focused === 0
                ? fixed
                  ? '取首元素'
                  : '错误地取 0'
                : comparison.updated
                  ? '候选值更大'
                  : '候选值不更大'}
            </span>
          </div>
        </div>
      )}
      {result && result.trace.length > 0 && (
        <div className="practice-trace experiment-scene" aria-label="最大值变量变化">
          {result.trace.map((entry, i) => (
            <button
              key={i}
              aria-pressed={focused === i}
              onClick={() => setFocused(i)}
              className={entry.updated ? 'is-updated' : ''}
            >
              <small>{i === 0 ? '初始化' : `比较 ${entry.value}`}</small>
              <strong>{String(entry.best)}</strong>
              <span>best</span>
            </button>
          ))}
        </div>
      )}
      {result && result.trace.length === 0 && (
        <p className="experiment-output">
          values.length === 0，直接返回 null；未初始化 best，也未进入循环。
        </p>
      )}
      {suite.length > 0 && (
        <ul className="practice-test-suite">
          {suite.map((run, i) => (
            <li key={i}>
              <span>{debugCases[i].label}</span>
              <strong className={run.passed ? 'practice-pass' : 'practice-fail'}>
                {run.passed ? 'PASS' : 'FAIL'}
              </strong>
              <code>{String(run.actual)}</code>
            </li>
          ))}
        </ul>
      )}
      <p className="experiment-status" aria-live="polite">
        {result
          ? `预期 ${String(result.expected)}，实际 ${String(result.actual)}。${result.passed ? '该用例通过，但单个用例不能证明所有输入都正确。' : selected === 3 ? '空数组应单独返回 null，错误版本却返回了初值 0。' : '用例失败：0 不是输入中的候选值，错误来自初始化。'}`
          : `输入 ${JSON.stringify(debugCases[selected].values)}，预期最大值为 ${String(debugCases[selected].expected)}。${fixed ? '非空数组以首元素初始化。' : '当前版本把 best 初始化为 0。'}`}
      </p>
    </Experiment>
  );
}
