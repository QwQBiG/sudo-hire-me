import { useState } from 'react';
import { Check, FlaskConical, Play, X } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  boundaryCandidates,
  evaluateBoundaryTests,
  expectedClamp,
} from '../../domain/boundary-tests.mjs';
import type { LabProps } from '../../types';
import './boundary-tests.css';

export default function BoundaryTests(_props: LabProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [ran, setRan] = useState(false);
  const results = ran ? evaluateBoundaryTests(selected) : [];
  const caught = results.filter((item) => item.failures.length > 0).length;
  const toggle = (value: number) => {
    setSelected((old) =>
      old.includes(value)
        ? old.filter((item) => item !== value)
        : [...old, value].sort((a, b) => a - b),
    );
    setRan(false);
  };
  return (
    <Experiment
      className="boundary-tests-lab"
      title="用最少的输入找到边界错误"
      subtitle="目标函数把输入限制到 0～10。挑选输入，看看它们能发现哪些隐藏的错误实现。"
      onReset={() => {
        setSelected([]);
        setRan(false);
      }}
    >
      <div className="boundary-rule" aria-label="函数约束">
        <div>
          <small>INPUT</small>
          <strong>任意整数 n</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>EXPECTED</small>
          <strong>小于 0 得 0；大于 10 得 10；其余不变</strong>
        </div>
      </div>
      <div className="boundary-controls">
        <div className="boundary-control-heading">
          <h4>
            <FlaskConical size={17} /> 选择测试输入
          </h4>
          <span>{selected.length} 项已选</span>
        </div>
        <div className="boundary-candidates" aria-label="候选测试输入">
          {boundaryCandidates.map((value) => (
            <button
              key={value}
              type="button"
              className={selected.includes(value) ? 'is-selected' : ''}
              aria-pressed={selected.includes(value)}
              onClick={() => toggle(value)}
            >
              <span>n = {value}</span>
              <small>期望 {expectedClamp(value)}</small>
            </button>
          ))}
        </div>
        <button
          className="boundary-run"
          type="button"
          disabled={!selected.length}
          onClick={() => setRan(true)}
        >
          <Play size={16} fill="currentColor" /> 运行所选用例
        </button>
      </div>
      <div className="boundary-results" aria-live="polite">
        {ran ? (
          <>
            <div className="boundary-result-heading">
              <strong>发现 {caught} / 3 种错误实现</strong>
              <span>{caught === 3 ? '三个关键边界都覆盖到了' : '试试边界值或边界之外的输入'}</span>
            </div>
            <div className="boundary-result-grid">
              {results.map((item) => (
                <section key={item.id} className={item.failures.length ? 'is-caught' : ''}>
                  <span
                    className="boundary-result-icon"
                    aria-label={item.failures.length ? '已发现' : '未发现'}
                  >
                    {item.failures.length ? <Check size={16} /> : <X size={16} />}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.failures.length ? item.description : '当前输入没有暴露这个错误。'}</p>
                    {item.failures[0] && (
                      <code>
                        n={item.failures[0].input}：期望 {item.failures[0].expected}，实际{' '}
                        {item.failures[0].actual}
                      </code>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="boundary-empty">
            普通输入能证明基本路径可用；边界和越界输入才能检验约束是否真正成立。
          </p>
        )}
      </div>
    </Experiment>
  );
}
