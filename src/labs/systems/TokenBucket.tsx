import { useState } from 'react';
import { FastForward, Send } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  advanceTokenTime,
  createTokenBucketState,
  requestTokens,
  tokenCapacity,
} from '../../domain/token-bucket.mjs';
import './resilience-labs.css';

export default function TokenBucket() {
  const [state, setState] = useState(() => createTokenBucketState());
  return (
    <Experiment
      title="令牌桶准入台"
      subtitle="容量 4 · 每秒补 1 · 每次请求消耗 1"
      className="token-bucket-lab"
      onReset={() => setState(createTokenBucketState())}
    >
      <div className="bucket-meter">
        <div className="bucket-vessel" aria-label={`当前 ${state.tokens} 枚令牌`}>
          {Array.from({ length: tokenCapacity }, (_, index) => (
            <span key={index} data-filled={index < state.tokens} />
          ))}
        </div>
        <div>
          <small>t = {state.time} 秒</small>
          <strong>
            {state.tokens} / {tokenCapacity}
          </strong>
          <span>剩余令牌</span>
        </div>
      </div>
      <div className="resilience-actions">
        <button onClick={() => setState((s) => requestTokens(s, 1))}>
          <Send size={15} /> 发 1 次请求
        </button>
        <button onClick={() => setState((s) => requestTokens(s, 4))}>
          <Send size={15} /> 突发 4 次
        </button>
        <button onClick={() => setState((s) => advanceTokenTime(s, 1))}>
          <FastForward size={15} /> 过 1 秒
        </button>
        <button onClick={() => setState((s) => advanceTokenTime(s, 10))}>
          <FastForward size={15} /> 过 10 秒
        </button>
      </div>
      <div className="bucket-counts">
        <span>
          累计放行 <strong>{state.allowed}</strong>
        </span>
        <span>
          累计拒绝 <strong>{state.rejected}</strong>
        </span>
      </div>
      <div className="resilience-result" aria-live="polite">
        <strong>本轮结果</strong>
        <p>{state.message}</p>
      </div>
    </Experiment>
  );
}
