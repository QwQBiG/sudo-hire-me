import { useState } from 'react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

export default function Concurrency({ lesson }: LabProps) {
  const ordering = lesson.slug === 'memory-ordering-visibility';
  const [mode, setMode] = useState('first');
  const [stock, setStock] = useState(1);
  const [checked, setChecked] = useState([false, false]);
  const [used, setUsed] = useState([false, false]);
  const [written, setWritten] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState(
    ordering
      ? '先写 data，再发布 ready，最后让读者观察。'
      : '库存只有 1。让两个线程先检查，再分别扣减，观察复合操作是否仍安全。',
  );
  function reset() {
    setStock(1);
    setChecked([false, false]);
    setUsed([false, false]);
    setWritten(false);
    setVisible(false);
    setReady(false);
    setNote('线程状态已重置。');
  }
  if (ordering)
    return (
      <Bench
        title="发布标记与发布数据之间的关系"
        subtitle="C++ 对照模型：data 和 ready 都是原子变量，relaxed 允许不同原子的旧值组合；正文 Go 原子操作为顺序一致语义，不能套用这里的 relaxed 结果。"
        onReset={reset}
      >
        <Choice
          label="同步约束"
          value={mode}
          options={[
            ['first', 'relaxed：仅各自原子'],
            ['synchronized', 'release / acquire'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="memory-order-lanes">
          <section>
            <h4>写者</h4>
            <code>data.store(42)</code>
            <button
              className="secondary"
              disabled={written}
              onClick={() => {
                setWritten(true);
                setNote('写者已经执行 data=42；该写与另一个原子的可见顺序仍需同步关系约束。');
              }}
            >
              写入 data
            </button>
            <code>ready.store(true)</code>
            <button
              className="secondary"
              disabled={!written || ready}
              onClick={() => {
                setReady(true);
                if (mode === 'synchronized') setVisible(true);
                setNote(
                  mode === 'synchronized'
                    ? 'release 发布；当 acquire 读到这个 true 时，先前数据写入受 happens-before 约束。'
                    : 'relaxed 不建立这条跨原子的同步关系。本模型保留一种允许的数据旧值观察。',
                );
              }}
            >
              发布 ready
            </button>
          </section>
          <section>
            <h4>读者可观察值</h4>
            <strong>ready = {String(ready)}</strong>
            <strong>data = {visible ? 42 : 0}</strong>
            <button
              className="primary"
              onClick={() =>
                setNote(
                  ready
                    ? visible
                      ? '读到 ready=true 和 data=42。'
                      : '读到 ready=true，但另一个原子的值仍为 0，这种组合没有被 relaxed 禁止。'
                    : 'ready 仍为 false，不能认为数据已发布。',
                )
              }
            >
              读取 ready 与 data
            </button>
            {mode === 'first' && (
              <button
                className="secondary"
                disabled={!written}
                onClick={() => {
                  setVisible(true);
                  setNote('选择另一种允许观察：数据也已可见。relaxed 不保证一定读旧值。');
                }}
              >
                让数据写入可见
              </button>
            )}
          </section>
        </div>
        <div className={`quality-path ${mode === 'synchronized' && ready ? 'synchronized' : ''}`}>
          <code className={written ? '' : 'inactive'}>data.store(42)</code>
          <span>→</span>
          <code className={ready ? '' : 'inactive'}>
            ready.store(true, {mode === 'first' ? 'relaxed' : 'release'})
          </code>
          <span>→</span>
          <output className={mode === 'first' ? 'blocked' : ''}>
            {mode === 'first' ? '无跨原子同步边' : 'acquire 读到此 true → data 写入 happens-before'}
          </output>
        </div>
        <Feedback>{note}</Feedback>
      </Bench>
    );
  return (
    <Bench
      title="单次原子，不代表整段业务原子"
      subtitle="库存计数器的每次访问都是原子的；演示检查再扣减造成的逻辑竞态，无非原子 data race。"
      onReset={reset}
    >
      <Choice
        label="库存协议"
        value={mode}
        options={[
          ['first', '先 load 检查，再 fetch_sub'],
          ['cas', 'CAS 比较并扣减'],
        ]}
        onChange={(v) => {
          setMode(v);
          reset();
        }}
      />
      <div className="inventory-number">
        <span>库存</span>
        <strong className={stock < 0 ? 'bench-false' : ''}>{stock}</strong>
      </div>
      <div className="kernel-processes">
        {[0, 1].map((t) => (
          <div key={t}>
            <small>线程 T{t + 1}</small>
            <span>检查：{checked[t] ? '当时有货' : '尚未检查'}</span>
            <button
              className="secondary"
              disabled={checked[t] || used[t]}
              onClick={() => {
                if (stock <= 0) return setNote('当前无货，检查不通过。');
                setChecked((xs) => xs.map((v, i) => (i === t ? true : v)));
                setNote(`T${t + 1} 读到库存 ${stock}，但这次读取没有替它保留库存。`);
              }}
            >
              检查库存
            </button>
            <button
              className="primary"
              disabled={!checked[t] || used[t]}
              onClick={() => {
                setUsed((xs) => xs.map((v, i) => (i === t ? true : v)));
                if (mode === 'cas' && stock !== 1)
                  return setNote('CAS 期望 1，实际已是 0，扣减失败且不修改库存。');
                setStock(stock - 1);
                setNote(
                  mode === 'cas'
                    ? '比较与更新构成一次原子条件修改。'
                    : '原子扣减执行成功，但旧的检查结果可能早已失效，业务库存会变成负数。',
                );
              }}
            >
              尝试扣减
            </button>
          </div>
        ))}
      </div>
      <div className="quality-observation">
        <div>
          <small>已检查的线程</small>
          <output>{checked.filter(Boolean).length} / 2</output>
        </div>
        <div>
          <small>已尝试的扣减</small>
          <output>{used.filter(Boolean).length} / 2</output>
        </div>
        <div>
          <small>业务不变量 stock ≥ 0</small>
          <output className={stock < 0 ? 'warning' : ''}>{stock >= 0 ? '保持' : '被破坏'}</output>
        </div>
      </div>
      <Feedback good={stock >= 0}>{note}</Feedback>
    </Bench>
  );
}
