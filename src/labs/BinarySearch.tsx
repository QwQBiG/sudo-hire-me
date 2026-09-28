import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, GitBranch, Pause, Play, RotateCcw } from 'lucide-react';
import { binarySearchSteps } from '../domain/search.mjs';
import type { LabProps } from '../types';

export default function BinarySearch({ reducedMotion }: LabProps) {
  const [values, setValues] = useState([2, 5, 8, 12, 16, 23, 38]);
  const [target, setTarget] = useState(16);
  const [input, setInput] = useState(values.join(', '));
  const [targetInput, setTargetInput] = useState('16');
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = binarySearchSteps(values, target);
  const step = steps[index];
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = setTimeout(() => {
      setIndex(Math.min(index + 1, steps.length - 1));
      if (index + 1 >= steps.length - 1) setPlaying(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [playing, reducedMotion, steps.length, index]);
  function apply() {
    try {
      if (!input.trim() || input.split(',').some((part) => !part.trim()) || !targetInput.trim())
        throw Error('请输入完整数字。');
      const next = input.split(',').map(Number);
      const nextTarget = Number(targetInput);
      binarySearchSteps(next, nextTarget);
      setValues(next);
      setTarget(nextTarget);
      setIndex(0);
      setPlaying(false);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const message =
    step.comparison === 'found'
      ? `命中：a[${step.mid}] = ${target}，返回下标 ${step.mid}。`
      : step.comparison === 'missing'
        ? 'left > right，区间为空。返回 -1。'
        : step.comparison === 'right'
          ? `${step.value} < ${target}，下一步 left = mid + 1。`
          : `${step.value} > ${target}，下一步 right = mid - 1。`;
  return (
    <section className="lab" aria-label="二分查找实验">
      <header className="lab-heading">
        <span>
          <GitBranch size={18} />
          BINARY SEARCH
        </span>
        <span className="lab-kind">算法推演</span>
      </header>
      <div className="search-inputs">
        <label>
          升序数组
          <input value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <label>
          查找目标
          <input
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
          />
        </label>
        <button onClick={apply} className="lab-button">
          应用
        </button>
      </div>
      {error && (
        <p className="lab-error" role="alert">
          {error}
        </p>
      )}
      <div className="array-scroll">
        <div className="array-board">
          {values.map((value, i) => (
            <div
              key={i}
              className={`array-item ${i < step.left || i > step.right ? 'eliminated' : ''} ${i === step.mid ? 'current' : ''} ${step.comparison === 'found' && i === step.mid ? 'found' : ''}`}
            >
              <span className="array-pointer">
                {i === step.mid
                  ? 'mid'
                  : i === step.left
                    ? 'left'
                    : i === step.right
                      ? 'right'
                      : ''}
              </span>
              <strong>{value}</strong>
              <span>{i}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="search-variables">
        <span>
          left <b>{step.left}</b>
        </span>
        <span>
          mid <b>{step.mid < 0 ? '—' : step.mid}</b>
        </span>
        <span>
          right <b>{step.right}</b>
        </span>
      </div>
      <p className="step-explanation" aria-live="polite">
        {message}
      </p>
      <footer className="lab-footer">
        <div className="playback">
          <button
            className="icon-button"
            aria-label="重置推演"
            title="重置"
            onClick={() => {
              setIndex(0);
              setPlaying(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="icon-button"
            disabled={index === 0}
            aria-label="上一步"
            title="上一步"
            onClick={() => {
              setIndex(index - 1);
              setPlaying(false);
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            className="icon-button"
            disabled={reducedMotion || index === steps.length - 1}
            aria-label={playing ? '暂停' : '自动推演'}
            title={reducedMotion ? '减少动效模式下请手动步进' : playing ? '暂停' : '自动推演'}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            className="icon-button"
            disabled={index === steps.length - 1}
            aria-label="下一步"
            title="下一步"
            onClick={() => {
              setIndex(index + 1);
              setPlaying(false);
            }}
          >
            <ArrowRight size={17} />
          </button>
        </div>
        <span>
          步骤 {index + 1} / {steps.length}
        </span>
      </footer>
    </section>
  );
}
