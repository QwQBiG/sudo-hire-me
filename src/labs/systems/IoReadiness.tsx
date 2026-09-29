import { useState } from 'react';
import { ArrowDownToLine, Radio, Send } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  createReadinessState,
  readReadiness,
  sendReadinessData,
  waitReadiness,
} from '../../domain/io-readiness.mjs';
import './mechanism-labs.css';

export default function IoReadiness() {
  const [state, setState] = useState(() => createReadinessState());
  const mode = state.mode;
  return (
    <Experiment
      title="双 fd 就绪观察台"
      subtitle="发送新数据 → 等待通知 → 只读部分或排空"
      className="readiness-lab"
      onReset={() => setState(createReadinessState(mode))}
    >
      <div className="mechanism-modes" role="group" aria-label="就绪通知模式">
        {(['lt', 'et'] as const).map((next) => (
          <button
            key={next}
            aria-pressed={mode === next}
            onClick={() => setState(createReadinessState(next))}
          >
            {next === 'lt' ? '水平触发 LT' : '边缘触发 ET'}
          </button>
        ))}
      </div>
      <div className="readiness-grid">
        {([3, 4] as const).map((fd) => (
          <section className="readiness-fd" key={fd} data-ready={state.lastReady.includes(fd)}>
            <header>
              <strong>fd {fd}</strong>
              <small>{state.buffers[fd].length} 字节待读</small>
            </header>
            <code>{state.buffers[fd] || '∅'}</code>
            <div className="mechanism-actions">
              <button
                onClick={() => setState((s) => sendReadinessData(s, fd, fd === 3 ? 'ABCD' : 'XY'))}
              >
                <Send size={14} /> 送入 {fd === 3 ? 'ABCD' : 'XY'}
              </button>
              <button onClick={() => setState((s) => readReadiness(s, fd, 2))}>
                <ArrowDownToLine size={14} /> 读 2 字节
              </button>
              <button onClick={() => setState((s) => readReadiness(s, fd, 99))}>
                <ArrowDownToLine size={14} /> 排空
              </button>
            </div>
          </section>
        ))}
      </div>
      <button className="mechanism-primary" onClick={() => setState(waitReadiness)}>
        <Radio size={16} /> 等待本轮就绪通知
      </button>
      <div className="mechanism-result" aria-live="polite">
        <strong>
          {mode === 'lt'
            ? 'LT：有数据就可重复报告'
            : 'ET：新输入产生事件；部分读取本身不产生新事件'}
        </strong>
        <p>{state.message}</p>
        <small>
          本轮：
          {state.lastReady.length ? state.lastReady.map((fd) => `fd ${fd}`).join('、') : '无通知'}
        </small>
      </div>
    </Experiment>
  );
}
