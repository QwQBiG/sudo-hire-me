import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { hashBuckets } from '../../domain/foundations.mjs';
import './foundations.css';
import './foundations-quality.css';

const initial = [
  { key: 12, value: 'Lin' },
  { key: 7, value: 'Wu' },
  { key: 9, value: 'Xu' },
];

export default function Hash() {
  const [entries, setEntries] = useState(initial);
  const [capacity, setCapacity] = useState(5);
  const [key, setKey] = useState('17');
  const [value, setValue] = useState('Chen');
  const [query, setQuery] = useState<number | null>(null);
  const [message, setMessage] = useState('12 和 7 位于同一桶，但仍是两个不同的键。');
  const buckets = hashBuckets(entries, capacity);
  const numeric = Number(key);
  const valid = /^\d{1,3}$/.test(key);
  const insert = () => {
    const exists = entries.some((entry) => entry.key === numeric);
    setEntries(
      exists
        ? entries.map((entry) =>
            entry.key === numeric ? { key: numeric, value: value.trim() } : entry,
          )
        : [...entries, { key: numeric, value: value.trim() }],
    );
    setQuery(numeric);
    setMessage(
      `${numeric} % ${capacity} = ${numeric % capacity}；${exists ? '键相同，更新原值，条目数不变。' : '保留完整键，插入新条目。'}`,
    );
  };
  const search = () => {
    const bucket = buckets[numeric % capacity];
    const index = bucket.findIndex((entry) => entry.key === numeric);
    setQuery(numeric);
    setMessage(
      index < 0
        ? `桶 ${numeric % capacity} 中检查了 ${bucket.length} 个键，没有找到 ${numeric}。`
        : `在桶 ${numeric % capacity} 比较 ${index + 1} 个键后，找到 ${numeric} → ${bucket[index].value}。`,
    );
  };
  return (
    <Experiment
      title="冲突不是覆盖"
      subtitle="非负整数键、链地址法；h(k) = k % 桶数，按插入顺序比较完整键。"
      onReset={() => {
        setEntries(initial);
        setCapacity(5);
        setQuery(null);
        setKey('17');
        setValue('Chen');
        setMessage('12 和 7 位于同一桶，但仍是两个不同的键。');
      }}
    >
      <div className="experiment-controls">
        <label>
          键
          <input
            type="text"
            inputMode="numeric"
            value={key}
            maxLength={3}
            onChange={(e) => setKey(e.target.value)}
            aria-label="整数键 0 到 999"
          />
        </label>
        <label>
          值<input value={value} maxLength={10} onChange={(e) => setValue(e.target.value)} />
        </label>
        <button
          className="primary"
          disabled={
            !valid ||
            !value.trim() ||
            (entries.length >= 10 && !entries.some((entry) => entry.key === numeric))
          }
          onClick={insert}
        >
          <Plus size={16} />
          写入
        </button>
        <button className="secondary" disabled={!valid} onClick={search}>
          <Search size={16} />
          查找
        </button>
      </div>
      {!valid && (
        <p className="experiment-status" role="alert">
          键须为 0–999 的非负整数；当前输入不会执行查找或写入。
        </p>
      )}
      <div className="foundation-state-strip" aria-live="polite">
        <span>h(k) = k mod {capacity}</span>
        <span>
          已选桶 <strong>{query === null ? '—' : query % capacity}</strong>
        </span>
        <span>
          此桶链长 <strong>{query === null ? '—' : buckets[query % capacity].length}</strong>
        </span>
      </div>
      <div className="f-hash-buckets">
        {buckets.map((bucket, i) => (
          <div
            key={i}
            className={`f-hash-row ${query !== null && query % capacity === i ? 'active' : ''}`}
          >
            <strong className="f-bucket-index">{i}</strong>
            <ArrowRight size={17} />
            <div className="f-bucket-chain">
              {bucket.length ? (
                bucket.map((entry) => (
                  <span key={entry.key} className={entry.key === query ? 'matched' : ''}>
                    <b>{entry.key}</b>
                    <span>{entry.value}</span>
                  </span>
                ))
              ) : (
                <small>空</small>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="experiment-controls">
        <label>
          桶数
          <SelectField
            value={capacity}
            onChange={(e) => {
              setCapacity(Number(e.target.value));
              setQuery(null);
              setMessage('桶数改变，所有键按新的取余规则重新定位。');
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </SelectField>
        </label>
        <output>
          负载因子 α = {entries.length} / {capacity} = {(entries.length / capacity).toFixed(1)}
        </output>
      </div>
      <p className="experiment-status" aria-live="polite">
        {message}
        {entries.length === 10 ? ' 本轮最多 10 个不同键，仍可更新已有键。' : ''}
      </p>
    </Experiment>
  );
}
