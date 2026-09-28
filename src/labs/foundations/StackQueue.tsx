import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Plus } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { containerAction } from '../../domain/foundations.mjs';
import './foundations.css';

export default function StackQueue() {
  const [stack, setStack] = useState<string[]>(['A', 'B', 'C']);
  const [queue, setQueue] = useState<string[]>(['A', 'B', 'C']);
  const [value, setValue] = useState('D');
  const [output, setOutput] = useState({ stack: '', queue: '' });
  const add = () => {
    setStack(containerAction(stack, 'stack', 'add', value.trim()).values);
    setQueue(containerAction(queue, 'queue', 'add', value.trim()).values);
    if (/^[A-Z]$/.test(value)) {
      setValue(String.fromCharCode(65 + ((value.charCodeAt(0) - 64) % 26)));
    }
  };
  const remove = (kind: 'stack' | 'queue') => {
    const result = containerAction(kind === 'stack' ? stack : queue, kind, 'remove');
    if (kind === 'stack') setStack(result.values);
    else setQueue(result.values);
    setOutput({ ...output, [kind]: result.removed ?? '' });
  };
  return (
    <Experiment
      title="同样入场，不同顺序离开"
      subtitle="两个独立的有界容器，容量均为 6；展示抽象顺序，不模拟底层分配。"
      onReset={() => {
        setStack(['A', 'B', 'C']);
        setQueue(['A', 'B', 'C']);
        setOutput({ stack: '', queue: '' });
        setValue('D');
      }}
    >
      <div className="experiment-controls">
        <label>
          下一项
          <input
            value={value}
            maxLength={4}
            onChange={(e) => setValue(e.target.value)}
            aria-label="加入的元素"
          />
        </label>
        <button
          className="primary"
          disabled={!value.trim() || stack.length >= 6 || queue.length >= 6}
          onClick={add}
        >
          <Plus size={17} />
          同时加入
        </button>
        <span>{stack.length >= 6 || queue.length >= 6 ? '至少一个容器已满' : '最多 4 个字符'}</span>
      </div>
      <div className="f-containers">
        <section>
          <h3>
            栈 <small>后进先出 LIFO</small>
          </h3>
          <div className="f-stack-vessel" aria-label="栈，底部到顶部">
            {stack.map((item, i) => (
              <div key={i} className={i === stack.length - 1 ? 'top' : ''}>
                <span>{item}</span>
                {i === stack.length - 1 && <small>栈顶</small>}
              </div>
            ))}
            {!stack.length && <span className="f-empty">空栈</span>}
          </div>
          <button className="secondary" disabled={!stack.length} onClick={() => remove('stack')}>
            <ArrowUpFromLine size={17} />
            pop
          </button>
          <output aria-live="polite">返回：{output.stack || '尚未移除'}</output>
        </section>
        <section>
          <h3>
            队列 <small>先进先出 FIFO</small>
          </h3>
          <div className="f-queue-vessel" aria-label="队列，从队头到队尾">
            {queue.map((item, i) => (
              <div key={i} className={i === 0 ? 'front' : ''}>
                <span>{item}</span>
                <small>{i === 0 ? '队头' : i === queue.length - 1 ? '队尾' : ''}</small>
              </div>
            ))}
            {!queue.length && <span className="f-empty">空队列</span>}
          </div>
          <button className="secondary" disabled={!queue.length} onClick={() => remove('queue')}>
            <ArrowDownToLine size={17} />
            dequeue
          </button>
          <output aria-live="polite">返回：{output.queue || '尚未移除'}</output>
        </section>
      </div>
      <p className="experiment-status">
        栈下一项：{stack.at(-1) ?? '空'}；队列下一项：{queue[0] ?? '空'}。查看下一项不移除元素，pop
        / dequeue 才会改变容器。
      </p>
    </Experiment>
  );
}
