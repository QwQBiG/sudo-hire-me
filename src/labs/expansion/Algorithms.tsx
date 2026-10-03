import { useState } from 'react';
import { ArrowRight, Play, Plus } from 'lucide-react';
import type { LabProps } from '../../types';
import { cacheAccess, nextGreater } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function Algorithms({ lesson }: LabProps) {
  const [keys, setKeys] = useState<string[]>([]);
  const [policy, setPolicy] = useState('lru');
  const [capacity, setCapacity] = useState(3);
  const [note, setNote] = useState('缓存为空。点击一个键访问它。');
  const [cursor, setCursor] = useState(0);
  const [duplicate, setDuplicate] = useState(false);
  const [left, setLeft] = useState(false);
  const [operator, setOperator] = useState('and');
  const [executed, setExecuted] = useState(false);
  const [bug, setBug] = useState(false);
  const slug = lesson.slug;
  const reset = () => {
    setKeys([]);
    setCursor(0);
    setExecuted(false);
    setNote('实验已重置。');
  };
  const access = (key: string) => {
    const result = cacheAccess(keys, key, capacity, policy);
    setKeys(result.keys);
    setNote(
      `${key}：${result.hit ? '命中' : '未命中'}${result.evicted ? `；淘汰 ${result.evicted}` : ''}。左侧最早淘汰，右侧最新。`,
    );
  };
  const values = duplicate ? [2, 2, 3, 2, 4] : [2, 1, 3, 2, 4];
  const trace = nextGreater(values);
  const frame = cursor > 0 ? trace.frames[cursor - 1] : null;
  const sum = [2, 4, 6].slice(0, cursor).reduce((a, b, i) => a + (bug && i === 1 ? 0 : b), 0);
  const expected = [2, 4, 6].slice(0, cursor).reduce((a, b) => a + b, 0);
  const callRight = operator === 'and' ? left : !left;
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="有界教学模型；改变输入，观察状态与规则是否一致。"
      onReset={reset}
    >
      {slug === 'lru-cache' ? (
        <>
          <Choice
            label="淘汰策略"
            value={policy}
            options={[
              ['lru', 'LRU 最近使用'],
              ['fifo', 'FIFO 进入顺序'],
            ]}
            onChange={(v) => {
              setPolicy(v);
              reset();
            }}
          />
          <label className="exp-range">
            容量 <b>{capacity}</b>
            <input
              aria-label="缓存容量"
              type="range"
              min="1"
              max="5"
              value={capacity}
              onChange={(e) => {
                setCapacity(Number(e.target.value));
                reset();
              }}
            />
          </label>
          <div className="exp-cache" aria-label="缓存队列">
            {Array.from({ length: capacity }, (_, i) => (
              <div
                key={keys[i] ?? `empty-${i}`}
                data-token-id={keys[i] ? `cache-${keys[i]}` : undefined}
                className={keys[i] ? 'occupied' : ''}
              >
                <small>{i === 0 ? '最早淘汰' : i === capacity - 1 ? '最新' : '缓存槽'}</small>
                <strong>{keys[i] ?? '—'}</strong>
              </div>
            ))}
          </div>
          <div className="exp-actions">
            {'ABCDEF'.split('').map((key) => (
              <button key={key} onClick={() => access(key)}>
                <Plus size={15} />
                访问 {key}
              </button>
            ))}
          </div>
          <Feedback>{note}</Feedback>
        </>
      ) : slug === 'monotonic-stack' ? (
        <>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={duplicate}
              onChange={(e) => {
                setDuplicate(e.target.checked);
                setCursor(0);
              }}
            />
            加入相等元素，寻找严格更大值
          </label>
          <div className="exp-bars">
            {values.map((value, index) => (
              <div key={index} className={frame?.index === index ? 'active' : ''}>
                <i style={{ height: `${value * 26}px` }}>{value}</i>
                <small>索引 {index}</small>
                <b>{frame ? frame.answers[index] : -1}</b>
              </div>
            ))}
          </div>
          <div className="exp-stack">
            <span>等待答案的索引</span>
            {frame?.stack.map((index: number) => (
              <b key={index}>
                {index} · 值 {values[index]}
              </b>
            ))}
          </div>
          <div className="exp-actions">
            <button disabled={cursor === values.length} onClick={() => setCursor(cursor + 1)}>
              <Play size={16} />
              处理 {cursor < values.length ? `索引 ${cursor}` : '完成'}
            </button>
          </div>
          <Feedback>
            {frame
              ? `当前值 ${values[frame.index]}；弹出索引 ${frame.popped.length ? frame.popped.join('、') : '无'}。-1 表示尚未找到；遍历完成后表示不存在。`
              : '每个柱子下面显示答案值。栈保存索引，较小元素遇到更大值时立即结算。'}
          </Feedback>
        </>
      ) : slug === 'loop-invariants' ? (
        <>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={bug}
              onChange={(e) => {
                setBug(e.target.checked);
                setCursor(0);
              }}
            />
            制造错误：跳过 a[1]
          </label>
          <div className="exp-tape">
            {[2, 4, 6].map((n, i) => (
              <div key={i} className={i < cursor ? 'consumed' : ''}>
                <small>a[{i}]</small>
                <strong>{n}</strong>
                <span>{i < cursor ? (bug && i === 1 ? '跳过' : '已累加') : '待处理'}</span>
              </div>
            ))}
          </div>
          <div className="exp-equation">
            <span>i = {cursor}</span>
            <ArrowRight />
            <strong>sum = {sum}</strong>
            <span>前缀和 = {expected}</span>
          </div>
          <div className="exp-actions">
            <button disabled={cursor === 3} onClick={() => setCursor(cursor + 1)}>
              <Play size={16} />
              执行一次循环
            </button>
          </div>
          <Feedback good={sum === expected}>
            {sum === expected
              ? '不变式成立：sum 等于 a[0..i) 的和。'
              : '不变式已被破坏：不是最后答案碰巧正确就能证明循环正确。'}
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="左表达式"
            value={String(left)}
            options={[
              ['false', '左侧 false'],
              ['true', '左侧 true'],
            ]}
            onChange={(v) => {
              setLeft(v === 'true');
              setExecuted(false);
            }}
          />
          <Choice
            label="逻辑运算"
            value={operator}
            options={[
              ['and', '&& 与'],
              ['or', '|| 或'],
            ]}
            onChange={(v) => {
              setOperator(v);
              setExecuted(false);
            }}
          />
          <div className="exp-circuit">
            <div className="active">
              <small>left()</small>
              <strong>{String(left)}</strong>
            </div>
            <ArrowRight />
            <div className={executed && callRight ? 'active' : 'blocked'}>
              <small>right() 返回 true</small>
              <strong>{executed ? (callRight ? '调用 1 次' : '调用 0 次') : '等待执行'}</strong>
            </div>
            <ArrowRight />
            <div>
              <small>结果</small>
              <strong>{executed ? String(operator === 'and' ? left : true) : '?'}</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button onClick={() => setExecuted(true)}>
              <Play size={16} />
              求值
            </button>
          </div>
          <Feedback>
            {executed
              ? callRight
                ? '左侧不足以决定结果，因此右侧执行。'
                : '左侧已决定结果，右侧连副作用也不会发生。'
              : '本实验只演示内建布尔逻辑；Python and/or 返回操作数，C++ 重载运算符另有规则。'}
          </Feedback>
        </>
      )}
    </Bench>
  );
}
