import { useState } from 'react';
import { ArrowRight, Layers3, RotateCcw } from 'lucide-react';

const scenarios = {
  interleaved: [
    ['A', '读取', 0],
    ['B', '读取', 0],
    ['A', '写回', 1],
    ['B', '写回', 1],
  ],
  serial: [
    ['A', '读取', 0],
    ['A', '写回', 1],
    ['B', '读取', 1],
    ['B', '写回', 2],
  ],
} as const;
export default function Process() {
  const [mode, setMode] = useState<'interleaved' | 'serial'>('interleaved');
  const [step, setStep] = useState(0);
  const history = scenarios[mode].slice(0, step);
  const count = [...history].reverse().find((item) => item[1] === '写回')?.[2] ?? 0;
  const last = history.at(-1);
  return (
    <section className="lab" aria-label="线程交错实验">
      <header className="lab-heading">
        <span>
          <Layers3 size={18} />
          THREAD SCHEDULER
        </span>
        <span className="lab-kind">简化模型 · 非实际调度</span>
      </header>
      <div className="lab-toolbar">
        <div className="segmented">
          <button
            aria-pressed={mode === 'interleaved'}
            onClick={() => {
              setMode('interleaved');
              setStep(0);
            }}
          >
            交错执行
          </button>
          <button
            aria-pressed={mode === 'serial'}
            onClick={() => {
              setMode('serial');
              setStep(0);
            }}
          >
            顺序执行
          </button>
        </div>
        <span className="muted-light">两次 count + 1</span>
      </div>
      <div className="thread-board">
        <div className="shared-memory">
          <small>进程 · 共享地址空间</small>
          <span>
            count <strong key={count}>{count}</strong>
          </span>
          <div>代码 / 堆 / 全局数据</div>
        </div>
        <div className="thread-lanes">
          {['A', 'B'].map((name) => (
            <div className={`thread-lane ${last?.[0] === name ? 'active' : ''}`} key={name}>
              <span>线程 {name}</span>
              <small>独立的栈 / 寄存器上下文</small>
              <code>
                local = {history.find((item) => item[0] === name && item[1] === '读取')?.[2] ?? '?'}
              </code>
            </div>
          ))}
        </div>
      </div>
      <div className="execution-log" aria-live="polite">
        {history.length ? (
          history.map(([thread, action, value], index) => (
            <div key={index}>
              <span>{index + 1}</span>
              <b>线程 {thread}</b>
              <code>
                {action === '读取' ? `local = count // ${value}` : `count = local + 1 // ${value}`}
              </code>
            </div>
          ))
        ) : (
          <p>初始值为 0。两条线程分别读取、计算并写回。</p>
        )}
      </div>
      {step === 4 && (
        <p className="step-explanation">
          {mode === 'interleaved'
            ? '两次加一，结果却是 1：两个线程都从 0 开始计算，后一次写回覆盖了前一次。'
            : '本次顺序执行得到 2，但一次正确结果不能证明并发代码始终正确。'}
        </p>
      )}
      <footer className="lab-footer">
        <button
          className="icon-button"
          aria-label="重置线程实验"
          title="重置"
          onClick={() => setStep(0)}
        >
          <RotateCcw size={16} />
        </button>
        <span>步骤 {step} / 4</span>
        <button className="lab-button" disabled={step === 4} onClick={() => setStep(step + 1)}>
          执行一步 <ArrowRight size={16} />
        </button>
      </footer>
    </section>
  );
}
