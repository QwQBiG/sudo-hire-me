import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { arrayContexts, describeArrayContext } from '../../domain/array-decay.mjs';
import './array-decay.css';

type Context = 'array' | 'parameter' | 'element-step' | 'array-step';

export default function ArrayDecay() {
  const [count, setCount] = useState(3);
  const [context, setContext] = useState<Context>('array');
  const result = describeArrayContext(context, count, 4, 8);
  const byteCount = count * 4;

  return (
    <Experiment
      className="array-decay-lab"
      title="同一个数组，四种表达式"
      subtitle="教学假设：sizeof(int)=4 字节、sizeof(int *)=8 字节。改变元素数，观察数组大小和指针步长如何分开变化。"
      onReset={() => {
        setCount(3);
        setContext('array');
      }}
    >
      <div className="array-decay-controls">
        <span>int a[{count}]</span>
        <div role="group" aria-label="元素个数">
          <button
            type="button"
            onClick={() => setCount(Math.max(1, count - 1))}
            disabled={count === 1}
            aria-label="减少一个元素"
          >
            −
          </button>
          <strong>{count}</strong>
          <button
            type="button"
            onClick={() => setCount(Math.min(6, count + 1))}
            disabled={count === 6}
            aria-label="增加一个元素"
          >
            +
          </button>
        </div>
      </div>
      <div
        className="array-decay-memory"
        role="img"
        aria-label={`${count} 个 int 元素，每个 4 字节，共 ${byteCount} 字节`}
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="array-decay-element">
            <span>a[{index}]</span>
            <div>
              {[0, 1, 2, 3].map((byte) => (
                <i key={byte} title={`a[${index}] 的第 ${byte + 1} 字节`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {(context === 'element-step' || context === 'array-step') && (
        <div
          className="foundation-pointer-stride"
          aria-label={`指针加一的跨度为 ${result.result} 字节`}
        >
          <span>{context === 'element-step' ? 'a' : '&a'}</span>
          <div style={{ width: `${(Number(result.result) / byteCount) * 100}%` }}>
            <i />
            <strong>+1 = 跨 {result.result} B</strong>
          </div>
        </div>
      )}
      <div className="array-decay-expressions" role="group" aria-label="选择要观察的 C 表达式">
        {arrayContexts.map((item) => (
          <button
            key={item.id}
            type="button"
            className={context === item.id ? 'active' : ''}
            aria-pressed={context === item.id}
            onClick={() => setContext(item.id as Context)}
          >
            <code>{item.label}</code>
          </button>
        ))}
      </div>
      <div className="array-decay-result">
        <div>
          <small>表达式</small>
          <code>{result.expression}</code>
        </div>
        <div>
          <small>相关类型</small>
          <code>{result.type}</code>
        </div>
        <div>
          <small>结果</small>
          <strong>
            {result.result} {result.unit}
          </strong>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {result.reason} 这个演示只比较类型与跨度，不表示实际地址数值。
      </p>
    </Experiment>
  );
}
