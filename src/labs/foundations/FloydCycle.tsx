import { useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { beginEntrySearch, createCycleState, stepCycle } from '../../domain/floyd-cycle.mjs';
import './pointer-workbenches.css';

const presets = [
  { key: 'cyclic', label: '尾部接回 C' },
  { key: 'linear', label: '无环链' },
  { key: 'self', label: '自环' },
  { key: 'empty', label: '空链表' },
];

export default function FloydCycle() {
  const [state, setState] = useState(() => createCycleState());
  const reset = () => setState(createCycleState(state.preset));
  return (
    <Experiment
      title="快慢指针会在哪里碰面"
      subtitle="先判断有没有环；相遇后把一个指针送回头节点，两者同速寻找入口。"
      onReset={reset}
    >
      <div className="pointer-presets" role="group" aria-label="链表结构">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.key}
            aria-pressed={state.preset === preset.key}
            onClick={() => setState(createCycleState(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="cycle-nodes" role="group" aria-label="链表节点和后继">
        {state.nodes.length ? (
          state.nodes.map((node: string) => (
            <div
              className="cycle-node"
              key={node}
              data-slow={state.slow === node}
              data-fast={state.fast === node}
              data-entry={state.entry === node}
            >
              <span>{node}</span>
              <strong>→ {state.next[node] ?? 'null'}</strong>
              <small>
                {[
                  state.slow === node ? '慢' : '',
                  state.fast === node ? '快' : '',
                  state.seeker === node ? '头侧' : '',
                ]
                  .filter(Boolean)
                  .join(' / ') || '\u00a0'}
              </small>
            </div>
          ))
        ) : (
          <p>head → null</p>
        )}
      </div>
      <div className="cycle-readout" aria-live="polite">
        <span>
          检测轮次 <strong>{state.ticks}</strong>
        </span>
        <span>
          慢 <strong>{state.slow ?? 'null'}</strong>
        </span>
        <span>
          快 / 环内侧 <strong>{state.fast ?? 'null'}</strong>
        </span>
        {state.phase === 'locate' && (
          <span>
            头侧 <strong>{state.seeker}</strong>
          </span>
        )}
      </div>
      <div className="experiment-controls pointer-actions">
        <button
          type="button"
          className="primary"
          disabled={state.phase !== 'detect' && state.phase !== 'locate'}
          onClick={() => setState((current) => stepCycle(current))}
        >
          <StepForward size={16} /> {state.phase === 'locate' ? '同速前进一步' : '慢一步，快两步'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.phase !== 'entry-ready'}
          onClick={() => setState((current) => beginEntrySearch(current))}
        >
          <RotateCcw size={16} /> 重置一个到 head
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.note}
      </p>
      {state.phase === 'done' && (
        <p className="pointer-outcome">
          {state.hasCycle ? `有环，入口 ${state.entry}` : '无环，快指针到达链尾。'}
        </p>
      )}
    </Experiment>
  );
}
