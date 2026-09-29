import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { accessCacheLine, createCacheMapping } from '../../domain/cache-mapping.mjs';
import './cache-mapping.css';

interface CacheEntry {
  line: number;
  lastUsed: number;
}
interface CacheState {
  ways: number;
  sets: CacheEntry[][];
  clock: number;
  hits: number;
  misses: number;
  last: null | {
    line: number;
    setIndex: number;
    tag: number;
    hit: boolean;
    evicted: number | null;
  };
}

export default function CacheMapping() {
  const [state, setState] = useState<CacheState>(() => createCacheMapping());
  const last = state.last;

  function changeWays(ways: 1 | 2) {
    setState(createCacheMapping(ways));
  }

  return (
    <Experiment
      className="cache-mapping-lab"
      title="四个槽位怎样安放主存行"
      subtitle="固定 4 个缓存行槽位，主存行 0–7。直接映射为 4 组×1 路，二路组相联为 2 组×2 路；组内满时按 LRU 淘汰。"
      onReset={() => setState(createCacheMapping(state.ways))}
    >
      <div className="cache-mapping-modes" role="group" aria-label="选择缓存映射方式">
        <button
          type="button"
          className={state.ways === 1 ? 'active' : ''}
          aria-pressed={state.ways === 1}
          onClick={() => changeWays(1)}
        >
          直接映射
        </button>
        <button
          type="button"
          className={state.ways === 2 ? 'active' : ''}
          aria-pressed={state.ways === 2}
          onClick={() => changeWays(2)}
        >
          二路组相联
        </button>
      </div>
      <div className="cache-mapping-access" role="group" aria-label="访问主存行">
        {Array.from({ length: 8 }, (_, line) => (
          <button key={line} type="button" onClick={() => setState(accessCacheLine(state, line))}>
            <small>主存行</small>
            <strong>{line}</strong>
          </button>
        ))}
      </div>
      <div
        className={`cache-mapping-sets ${state.ways === 2 ? 'two-way' : ''}`}
        aria-label="当前缓存组"
      >
        {state.sets.map((set, index) => (
          <div key={index} className={last?.setIndex === index ? 'recent' : ''}>
            <span>组 {index}</span>
            <div>
              {Array.from({ length: state.ways }, (_, way) => (
                <strong key={way}>{set[way] ? `行 ${set[way].line}` : '空'}</strong>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="cache-mapping-score">
        <span>
          命中 <strong>{state.hits}</strong>
        </span>
        <span>
          缺失 <strong>{state.misses}</strong>
        </span>
      </div>
      <p className="experiment-status" role="status">
        {last
          ? `主存行 ${last.line} → 组 ${last.setIndex}、标记 ${last.tag}：${last.hit ? '命中' : `缺失${last.evicted === null ? '，装入空槽' : `，淘汰行 ${last.evicted}`}`}。`
          : '试试 0、4、0、4：比较两种映射是否发生持续冲突。'}
      </p>
    </Experiment>
  );
}
