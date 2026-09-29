import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { createPointerState, movePointer } from '../../domain/two-pointers.mjs';
import './algorithm-labs.css';

const presets = [
  { key: 'sorted', label: '非负数组', target: 10 },
  { key: 'signed', label: '含负数', target: 6 },
] as const;

interface PointerState {
  dataset: string;
  target: number;
  values: number[];
  left: number;
  right: number;
  done: boolean;
  pair: number[] | null;
  note: string;
  history: { left: number; right: number; sum: number; direction: string }[];
  feedback: string;
}

export default function TwoPointers() {
  const [state, setState] = useState<PointerState>(() => createPointerState());
  const [targetText, setTargetText] = useState('10');
  const valid = /^-?\d+$/.test(targetText.trim()) && Number.isSafeInteger(Number(targetText));
  const currentSum =
    state.done && !state.pair ? null : state.values[state.left] + state.values[state.right];

  return (
    <Experiment
      title="每次排除一整排候选"
      subtitle="先比较两端之和，再决定移动哪一端；错误移动不会改变数组状态。"
      onReset={() => setState(createPointerState(state.dataset, state.target))}
    >
      <div className="experiment-controls algo-controls">
        <div className="algo-segments" role="group" aria-label="有序数组预设">
          {presets.map((preset) => (
            <button
              type="button"
              key={preset.key}
              aria-pressed={state.dataset === preset.key}
              onClick={() => {
                setTargetText(String(preset.target));
                setState(createPointerState(preset.key, preset.target));
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label>
          目标和
          <input
            type="number"
            step="1"
            value={targetText}
            aria-invalid={!valid}
            onChange={(event) => {
              const value = event.target.value;
              setTargetText(value);
              if (/^-?\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value))) {
                setState(createPointerState(state.dataset, Number(value)));
              }
            }}
          />
        </label>
      </div>
      <div className="algo-array" role="group" aria-label="有序数组与两端指针">
        {state.values.map((value: number, index: number) => (
          <div
            key={index}
            className="algo-cell"
            data-phase={index < state.left || index > state.right ? 'excluded' : 'active'}
            data-pointer={index === state.left ? 'left' : index === state.right ? 'right' : ''}
          >
            <small>{index}</small>
            <strong>{value}</strong>
            <span>{index === state.left ? 'L' : index === state.right ? 'R' : '\u00a0'}</span>
          </div>
        ))}
      </div>
      <div className="algo-readout" aria-live="polite">
        <span>当前比较</span>
        <strong>
          {currentSum === null
            ? '无候选'
            : `${state.values[state.left]} + ${state.values[state.right]} = ${currentSum}`}
        </strong>
        <span>目标 {state.target}</span>
      </div>
      <div className="experiment-controls algo-actions">
        <button
          type="button"
          className="secondary"
          disabled={state.done || !valid}
          onClick={() => setState((current) => movePointer(current, 'left'))}
        >
          <ArrowRight size={16} /> 左指针右移
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.done || !valid}
          onClick={() => setState((current) => movePointer(current, 'right'))}
        >
          <ArrowLeft size={16} /> 右指针左移
        </button>
      </div>
      <p className="experiment-status" role="status">
        {!valid ? '请输入安全整数目标。' : state.feedback || state.note}
      </p>
      <p className="algo-footnote">
        已安全排除 {state.history.length} 次；
        {state.pair
          ? `答案下标 (${state.pair.join(', ')})`
          : state.done
            ? '没有两个不同下标构成目标和'
            : '尚未结束'}
        。
      </p>
    </Experiment>
  );
}
