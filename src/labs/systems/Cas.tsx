import { useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { attemptCas, createCasState, refreshCas } from '../../domain/cas-workbench.mjs';
import './resilience-labs.css';

export default function Cas() {
  const [state, setState] = useState(() => createCasState());
  return (
    <Experiment
      title="A / B 原子交换台"
      subtitle="两个参与者先同时读到 0；失败者必须刷新期望值"
      className="cas-lab"
      onReset={() => setState(createCasState())}
    >
      <div className="cas-value">
        <small>共享计数器</small>
        <strong>{state.value}</strong>
      </div>
      <div className="cas-actors">
        {(['A', 'B'] as const).map((actor) => (
          <section key={actor}>
            <header>参与者 {actor}</header>
            <code>
              CAS({state.drafts[actor].expected}, {state.drafts[actor].next})
            </code>
            <div className="resilience-actions">
              <button onClick={() => setState((s) => attemptCas(s, actor))}>
                <Zap size={15} /> 尝试交换
              </button>
              <button onClick={() => setState((s) => refreshCas(s, actor))}>
                <RefreshCw size={15} /> 重新读取
              </button>
            </div>
          </section>
        ))}
      </div>
      <div className="resilience-result" aria-live="polite">
        <strong>最近操作</strong>
        <p>{state.message}</p>
      </div>
      <ol className="cas-history">
        {state.history.map((entry, index) => (
          <li key={`${index}-${entry}`}>{entry}</li>
        ))}
      </ol>
    </Experiment>
  );
}
