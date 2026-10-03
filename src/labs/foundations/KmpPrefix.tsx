import { useState } from 'react';
import { ChevronsRight, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { createKmpState, stepKmp } from '../../domain/kmp-prefix.mjs';
import './advanced-algorithms.css';
import './foundations-quality.css';

const presets = [
  { key: 'match', label: '失配后命中' },
  { key: 'miss', label: '失配后未命中' },
  { key: 'exact', label: '完整直接命中' },
];

export default function KmpPrefix() {
  const [state, setState] = useState(() => createKmpState());
  const finish = () =>
    setState((current) => {
      let next = current;
      while (next.phase !== 'done') next = stepKmp(next);
      return next;
    });
  return (
    <Experiment
      title="失配时，文本指针留在原地"
      subtitle="先构造模式串的前缀表，再用它让模式位置回退；观察同一个文本字符如何重试。"
      onReset={() => setState(createKmpState(state.preset))}
    >
      <div className="advanced-presets" role="group" aria-label="KMP 文本预设">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.key}
            aria-pressed={state.preset === preset.key}
            onClick={() => setState(createKmpState(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="kmp-label">模式串 P / 前缀表 π</div>
      <div className="kmp-row" role="group" aria-label="模式串和已构造的前缀表">
        {[...state.pattern].map((char: string, index: number) => (
          <div
            className="kmp-cell"
            key={index}
            data-active={
              state.phase === 'prefix'
                ? index === state.buildIndex
                : state.phase === 'scan' && index === state.patternIndex
            }
            data-border={
              state.phase === 'prefix' &&
              (index < state.border ||
                (state.border > 0 &&
                  index >= state.buildIndex - state.border &&
                  index < state.buildIndex))
            }
          >
            <small>{index}</small>
            <strong>{char}</strong>
            <span>{state.prefix[index] ?? '?'}</span>
          </div>
        ))}
      </div>
      <div className="kmp-label">文本 T</div>
      <div className="kmp-row kmp-text" role="group" aria-label="文本与扫描位置">
        {[...state.text].map((char: string, index: number) => (
          <div
            className="kmp-cell"
            key={index}
            data-active={state.phase === 'scan' && index === state.textIndex}
            data-matched={state.matches.some(
              (start: number) => index >= start && index < start + state.pattern.length,
            )}
          >
            <small>{index}</small>
            <strong>{char}</strong>
            <span>{state.phase === 'scan' && index === state.textIndex ? 'i' : '\u00a0'}</span>
          </div>
        ))}
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          阶段{' '}
          <strong>
            {state.phase === 'prefix'
              ? '构造前缀表'
              : state.phase === 'scan'
                ? '扫描文本'
                : '匹配完成'}
          </strong>
        </span>
        <span>
          已找到 <strong>{state.matches.length}</strong> 个起点
        </span>
        <span>前缀表回退：π[j − 1]</span>
      </div>
      <div className="advanced-readout" aria-live="polite">
        <span>
          {state.phase === 'prefix' ? `构造 π[${state.buildIndex}]` : `文本 i=${state.textIndex}`}
        </span>
        <strong>
          {state.phase === 'prefix' ? `候选边界 ${state.border}` : `模式 j=${state.patternIndex}`}
        </strong>
        <span>命中起点：{state.matches.length ? state.matches.join('、') : '尚无'}</span>
      </div>
      <div className="experiment-controls advanced-actions">
        <button
          type="button"
          className="primary"
          disabled={state.phase === 'done'}
          onClick={() => setState((current) => stepKmp(current))}
        >
          <StepForward size={16} /> {state.phase === 'prefix' ? '计算下一项' : '匹配下一步'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.phase === 'done'}
          onClick={finish}
        >
          <ChevronsRight size={16} /> 完成推演
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.note}
      </p>
    </Experiment>
  );
}
