import { useState } from 'react';
import { ArrowDown, ArrowUp, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { factorialTrace } from '../../domain/foundations.mjs';
import './foundations.css';
import './foundations-quality.css';

export default function Recursion() {
  const [n, setN] = useState(4);
  const [step, setStep] = useState(0);
  const trace = factorialTrace(n);
  const current = trace[step];
  const done = step === trace.length - 1;
  const nextAction = trace[step + 1]?.action;
  return (
    <Experiment
      title="每一次调用都有自己的 n"
      subtitle="阶乘调用栈教学模型，n = 0..7；每一步进入或返回一个栈帧。"
      onReset={() => setStep(0)}
    >
      <div className="experiment-controls">
        <label>
          factorial(n)
          <input
            type="range"
            min="0"
            max="7"
            value={n}
            onChange={(e) => {
              setN(Number(e.target.value));
              setStep(0);
            }}
          />
          <output>{n}</output>
        </label>
        <button className="primary" disabled={done} onClick={() => setStep(step + 1)}>
          {nextAction === 'call' ? (
            <ArrowDown size={16} />
          ) : nextAction === 'return' ? (
            <ArrowUp size={16} />
          ) : (
            <StepForward size={16} />
          )}
          {done ? '全部返回' : nextAction === 'call' ? '进入下一层' : '返回上一层'}
        </button>
      </div>
      <div
        className="foundation-capacity recursion"
        aria-label={`活跃调用深度 ${current.frames.length}`}
      >
        {Array.from({ length: n + 1 }, (_, i) => (
          <i key={i} data-used={i < current.frames.length} />
        ))}
      </div>
      <div className="f-recursion-scene">
        <div className="f-call-stack" aria-label="活跃调用栈">
          {current.frames.length ? (
            current.frames.map((value, i) => (
              <div
                key={value}
                className={i === current.frames.length - 1 ? 'active' : ''}
                style={{ marginLeft: `${i * 7}px` }}
              >
                <code>factorial({value})</code>
                <span>
                  {value === 0
                    ? '基本情况：返回 1'
                    : i === current.frames.length - 1 && current.result !== null
                      ? `${value} × ${current.result}`
                      : `${value} × 等待结果`}
                </span>
              </div>
            ))
          ) : (
            <span className="f-empty">{done ? '所有栈帧已退出' : '调用栈为空'}</span>
          )}
        </div>
        <div className="f-recursion-result">
          <span>最近一次返回值</span>
          <strong>{current.result ?? '?'}</strong>
          <span>
            {current.action === 'return' ? `来自 factorial(${current.value})` : '内层还没有返回'}
          </span>
          <div className="f-recursion-depth">
            活跃深度 <b>{current.frames.length}</b>
            <small>最大深度 {n + 1}</small>
          </div>
        </div>
      </div>
      <p className="experiment-status" aria-live="polite">
        {current.action === 'ready'
          ? `准备计算 ${n}!，先调用 factorial(${n})。`
          : current.action === 'call'
            ? `进入 factorial(${current.value})。${current.value === 0 ? '到达基本情况，不再递归。' : '保留当前参数，等待更小问题返回。'}`
            : `factorial(${current.value}) 返回 ${current.result}。${done ? `最终 ${n}! = ${current.result}。` : '退出这一层，外层继续完成自己的乘法。'}`}
      </p>
    </Experiment>
  );
}
