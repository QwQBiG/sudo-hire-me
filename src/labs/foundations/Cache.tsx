import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { cacheTrace } from '../../domain/foundations.mjs';
import './foundations.css';
import './foundations-quality.css';

const patterns: Record<string, number[]> = {
  顺序访问: [0, 1, 2, 3, 4, 5, 6, 7],
  重复访问: [0, 1, 0, 4],
  跨行访问: [0, 4, 8, 12, 0, 4],
};

export default function Cache() {
  const [accesses, setAccesses] = useState<number[]>([]);
  const [pattern, setPattern] = useState('重复访问');
  const trace = cacheTrace(accesses);
  const current = trace.at(-1);
  const hits = trace.filter((item) => item.hit).length;
  const resident = current?.resident ?? [];
  const next = patterns[pattern][accesses.length];
  const access = (index: number) => setAccesses((previous) => [...previous, index].slice(0, 24));
  return (
    <Experiment
      title="亲手制造一次命中"
      subtitle="每元素 4 B、每行 16 B；两行全相联缓存，采用最近最少使用替换（Least Recently Used，LRU）。"
      onReset={() => setAccesses([])}
    >
      <div className="experiment-controls">
        <label>
          访问序列
          <SelectField
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setAccesses([]);
            }}
          >
            {Object.keys(patterns).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </SelectField>
        </label>
        <button className="primary" onClick={() => access(next)} disabled={next === undefined}>
          <StepForward size={17} />
          {next === undefined ? '序列结束' : `读 a[${next}]`}
        </button>
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          主存行 <strong>{current?.block ?? '—'}</strong>
        </span>
        <span>
          本次{' '}
          <strong>{current ? (current.hit ? 'HIT：无需装入' : 'MISS：整行装入') : '未访问'}</strong>
        </span>
        <span>
          淘汰 <strong>{current?.evicted ?? '无'}</strong>
        </span>
      </div>
      <div className="f-cache-memory" aria-label="主存中的数组元素">
        {[0, 1, 2, 3].map((block) => (
          <div
            key={block}
            className={`f-cache-block ${resident.includes(block) ? 'resident' : ''}`}
          >
            <span>
              第 {block} 行 · {block * 16}..{block * 16 + 15}
            </span>
            <div>
              {[0, 1, 2, 3].map((offset) => {
                const i = block * 4 + offset;
                return (
                  <button
                    key={i}
                    disabled={accesses.length >= 24}
                    aria-label={`读取 a[${i}]`}
                    className={current?.index === i ? 'active' : ''}
                    onClick={() => access(i)}
                  >
                    a[{i}]
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="f-cache-resident">
        <span>缓存 · 旧 → 新</span>
        {[0, 1].map((slot) => (
          <div
            key={resident[slot] ?? `empty-${slot}`}
            className={resident[slot] === undefined ? 'empty' : 'loaded'}
          >
            {resident[slot] === undefined ? '空行' : `第 ${resident[slot]} 行`}
            <small>
              {slot === resident.length - 1
                ? '最近使用'
                : resident.length === 2
                  ? '下次优先淘汰'
                  : ''}
            </small>
          </div>
        ))}
      </div>
      <div className="f-access-history" aria-label="访问结果">
        {trace.length ? (
          trace.map((item, i) => (
            <span key={i} className={item.hit ? 'hit' : 'miss'}>
              <b>{item.index}</b>
              {item.hit ? 'HIT' : 'MISS'}
            </span>
          ))
        ) : (
          <span>尚未读取</span>
        )}
      </div>
      <div className="experiment-metrics">
        <div className="metric">
          <span>命中 / 访问</span>
          <strong>
            {hits} / {trace.length}
          </strong>
        </div>
        <div className="metric">
          <span>命中率</span>
          <strong>
            {trace.length ? `${Math.round((hits / trace.length) * 100)}%` : '尚无访问'}
          </strong>
        </div>
      </div>
      <p className="experiment-status" aria-live="polite">
        {current
          ? `a[${current.index}] 位于第 ${current.block} 行：${current.hit ? '命中，整行已经在缓存中' : '缺失，需要加载整行'}${current.evicted === null ? '。' : `，替换最久未使用的第 ${current.evicted} 行。`}`
          : '缓存初始为空，第一次访问任意一行都会缺失。'}
        {accesses.length === 24 ? ' 本轮已达 24 次访问上限。' : ''}
      </p>
    </Experiment>
  );
}
