import { useState } from 'react';
import { ArrowRight, Minimize2 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { createWindowState, stepWindow } from '../../domain/sliding-window.mjs';
import './algorithm-labs.css';

interface WindowState {
  target: number;
  values: number[];
  left: number;
  right: number;
  sum: number;
  best: { left: number; right: number; length: number } | null;
  history: { left: number; right: number; sum: number; action: string }[];
  feedback: string;
  done: boolean;
  next: 'expand' | 'shrink' | null;
  note: string;
}

export default function SlidingWindow() {
  const [state, setState] = useState<WindowState>(() => createWindowState());
  const [targetText, setTargetText] = useState('7');
  const valid =
    /^\d+$/.test(targetText.trim()) &&
    Number.isSafeInteger(Number(targetText)) &&
    Number(targetText) > 0;

  const finish = () =>
    setState((current) => {
      let next = current;
      while (!next.done) next = stepWindow(next, next.next);
      return next;
    });

  return (
    <Experiment
      title="让窗口按条件伸缩"
      subtitle="右端取新元素；达标后左端继续试探。所有元素均为正整数。"
      onReset={() => setState(createWindowState(state.target))}
    >
      <div className="experiment-controls algo-controls">
        <label>
          至少达到的和
          <input
            type="number"
            min="1"
            step="1"
            value={targetText}
            aria-invalid={!valid}
            onChange={(event) => {
              const value = event.target.value;
              setTargetText(value);
              if (
                /^\d+$/.test(value.trim()) &&
                Number.isSafeInteger(Number(value)) &&
                Number(value) > 0
              ) {
                setState(createWindowState(Number(value)));
              }
            }}
          />
        </label>
        <div className="algo-segments" role="group" aria-label="目标预设">
          {[7, 11, 20].map((target) => (
            <button
              type="button"
              key={target}
              aria-pressed={state.target === target}
              onClick={() => {
                setTargetText(String(target));
                setState(createWindowState(target));
              }}
            >
              ≥ {target}
            </button>
          ))}
        </div>
      </div>
      <div className="algo-array" role="group" aria-label="连续数组与当前窗口">
        {state.values.map((value: number, index: number) => (
          <div
            key={index}
            className="algo-cell"
            data-phase={index >= state.left && index < state.right ? 'in-window' : 'idle'}
            data-best={Boolean(state.best && index >= state.best.left && index < state.best.right)}
          >
            <small>{index}</small>
            <strong>{value}</strong>
            <span>
              {index === state.left && index < state.right
                ? '左端'
                : index === state.right - 1
                  ? '右端'
                  : '\u00a0'}
            </span>
          </div>
        ))}
      </div>
      <div className="algo-readout" aria-live="polite">
        <span>
          窗口 [{state.left}, {state.right})
        </span>
        <strong>
          {state.sum} / {state.target}
        </strong>
        <span>
          {state.best
            ? `最短 ${state.best.length} 个：下标 [${state.best.left}, ${state.best.right})`
            : '尚无达标区间'}
        </span>
      </div>
      <div className="experiment-controls algo-actions">
        <button
          type="button"
          className="secondary"
          disabled={state.done || !valid}
          onClick={() => setState((current) => stepWindow(current, 'expand'))}
        >
          <ArrowRight size={16} /> 扩张右端
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.done || !valid}
          onClick={() => setState((current) => stepWindow(current, 'shrink'))}
        >
          <Minimize2 size={16} /> 收缩左端
        </button>
        <button type="button" className="primary" disabled={state.done || !valid} onClick={finish}>
          算出最短长度
        </button>
      </div>
      <p className="experiment-status" role="status">
        {!valid ? '目标必须是正的安全整数。' : state.feedback || state.note}
      </p>
      <p className="algo-footnote">
        窗口每端只向右移动：当前共操作 {state.history.length} 次；
        {state.done ? (state.best ? `最短长度 ${state.best.length}` : '无达标区间') : '尚可继续'}。
      </p>
    </Experiment>
  );
}
