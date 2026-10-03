import { useState } from 'react';
import { ArrowLeft, Bookmark, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { createReversalState, listFromHead, stepReversal } from '../../domain/linked-reversal.mjs';
import './pointer-workbenches.css';
import { MechanismLinks } from './MechanismLinks';

interface ReversalState {
  preset: string;
  nodes: string[];
  next: Record<string, string | null>;
  head: string | null;
  prev: string | null;
  curr: string | null;
  saved: string | null;
  phase: string;
  count: number;
  feedback: string;
  note: string;
}

const presets = [
  { key: 'four', label: '四节点' },
  { key: 'single', label: '单节点' },
  { key: 'empty', label: '空链表' },
];

export default function LinkedReversal() {
  const [state, setState] = useState<ReversalState>(() => createReversalState());
  const reversed = listFromHead(state);
  const act = (action: string) => setState((current) => stepReversal(current, action));
  return (
    <Experiment
      title="把 next 一个个反向接回去"
      subtitle="每个节点必须完成保存、重连、推进三步；错误操作只提示，不会丢失链表。"
      onReset={() => setState(createReversalState(state.preset))}
    >
      <div className="pointer-presets" role="group" aria-label="链表长度">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.key}
            aria-pressed={state.preset === preset.key}
            onClick={() => setState(createReversalState(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <MechanismLinks
        nodes={state.nodes}
        links={state.next}
        active={[state.curr, state.prev]}
        label={`当前 next 链接：${state.nodes.map((node) => `${node} 指向 ${state.next[node] ?? 'null'}`).join('；')}`}
      />
      <div className="reverse-nodes" role="group" aria-label="节点与当前 next 链接">
        {state.nodes.length ? (
          state.nodes.map((node) => (
            <div
              className="reverse-node"
              key={node}
              data-current={state.curr === node}
              data-previous={state.prev === node}
              data-saved={state.saved === node}
            >
              <span>{node}</span>
              <strong>next → {state.next[node] ?? 'null'}</strong>
              <small>
                {state.curr === node
                  ? 'curr'
                  : state.prev === node
                    ? 'prev'
                    : state.saved === node
                      ? 'saved'
                      : '\u00a0'}
              </small>
            </div>
          ))
        ) : (
          <p>head → null</p>
        )}
      </div>
      <div className="reverse-registers" aria-live="polite">
        <span>
          prev <strong>{state.prev ?? 'null'}</strong>
        </span>
        <span>
          curr <strong>{state.curr ?? 'null'}</strong>
        </span>
        <span>
          saved <strong>{state.saved ?? 'null'}</strong>
        </span>
      </div>
      <div className="reverse-result">
        <span>已反转部分</span>
        <strong>{reversed.length ? `${reversed.join(' → ')} → null` : 'null'}</strong>
        {state.phase === 'done' && <small>新 head = {state.head ?? 'null'}</small>}
      </div>
      <div className="experiment-controls pointer-actions">
        <button
          type="button"
          className="secondary"
          disabled={state.phase === 'done'}
          onClick={() => act('save')}
        >
          <Bookmark size={16} /> 保存后继
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.phase === 'done'}
          onClick={() => act('rewire')}
        >
          <ArrowLeft size={16} /> 重连 next
        </button>
        <button
          type="button"
          className="primary"
          disabled={state.phase === 'done'}
          onClick={() => act('advance')}
        >
          <StepForward size={16} /> 推进指针
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.feedback || state.note}
      </p>
    </Experiment>
  );
}
