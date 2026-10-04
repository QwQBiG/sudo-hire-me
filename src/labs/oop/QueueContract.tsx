import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Plus, Undo2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { createQueueContract, queueContractCommand } from '../../domain/oop-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './oop-scenes.css';

export default function QueueContract({ lesson }: LabProps) {
  const [history, setHistory] = useState(() => [createQueueContract()]);
  const [value, setValue] = useState('A');
  const [inside, setInside] = useState(true);
  const state = history[history.length - 1];
  const last = state.records.at(-1);
  const run = (action: 'enqueue' | 'dequeue') =>
    setHistory((previous) => [
      ...previous.slice(-23),
      queueContractCommand(previous[previous.length - 1], action, value),
    ]);
  return (
    <Bench
      className="oop-scene queue-contract"
      title={lesson.title}
      subtitle="同一 FIFO 契约，独立更新数组与链式模型。容量均为 4，非阻塞、无并发；节点编号不是内存地址。"
      onReset={() => {
        setHistory([createQueueContract()]);
        setValue('A');
        setInside(true);
      }}
    >
      <div className="oop-controls">
        <Choice
          label="入队的元素"
          value={value}
          options={['A', 'B', 'C', 'D'].map((item) => [item, item] as const)}
          onChange={setValue}
        />
        <button onClick={() => run('enqueue')}>
          <Plus size={16} />
          enqueue({value})
        </button>
        <button onClick={() => run('dequeue')}>
          <ArrowRight size={16} />
          dequeue()
        </button>
        <button
          title="撤销最后一次操作，最多保留 23 步"
          aria-label="撤销队列操作"
          disabled={history.length === 1}
          onClick={() => setHistory((previous) => previous.slice(0, -1))}
        >
          <Undo2 size={16} />
        </button>
      </div>
      <div className="queue-abstract">
        <div>
          <small>调用方依赖的抽象状态</small>
          <b>
            队首 <ArrowRight size={14} /> 队尾
          </b>
        </div>
        <div>
          {state.logical.length ? (
            state.logical.map((item, i) => <span key={i}>{item}</span>)
          ) : (
            <span className="empty">空队列</span>
          )}
        </div>
        <code>size = {state.size}</code>
      </div>
      <label className="oop-toggle">
        <input type="checkbox" checked={inside} onChange={(e) => setInside(e.target.checked)} />
        显示内部表示
      </label>
      {inside ? (
        <div className="queue-representations">
          <section>
            <header>
              <b>ArrayQueue</b>
              <small>循环数组 · 固定槽位</small>
            </header>
            <div className="queue-ring">
              {state.slots.map((item, i) => (
                <div key={i} className={item ? 'occupied' : ''}>
                  <small>slot {i}</small>
                  <strong data-readout data-token-id={item ? `array-q-${item.id}` : undefined}>
                    {item?.value ?? '·'}
                  </strong>
                  <span>{i === state.head ? 'head' : ''}</span>
                </div>
              ))}
            </div>
            <div className="queue-cursors">
              <code>head = {state.head}</code>
              <code>tail = {(state.head + state.size) % 4}</code>
            </div>
            <p>出队后清空槽位并前移 head；head 与 tail 重合时，靠 size 区分空与满。</p>
          </section>
          <section>
            <header>
              <b>LinkedQueue</b>
              <small>节点与 next 关系</small>
            </header>
            <div className="queue-linked">
              {state.nodes.length ? (
                state.nodes.map((node) => (
                  <div key={node.id} data-token-id={`linked-q-${node.id}`}>
                    <small>node {node.id}</small>
                    <strong data-readout>{node.value}</strong>
                    <code>next → {node.next ?? 'null'}</code>
                  </div>
                ))
              ) : (
                <div className="queue-no-node">head → null</div>
              )}
            </div>
            <div className="queue-cursors">
              <code>head → {state.nodes[0]?.id ?? 'null'}</code>
              <code>tail → {state.nodes.at(-1)?.id ?? 'null'}</code>
            </div>
            <p>出队后 head 指向原 next；空队列没有节点。此模型同样限制容量，便于比较边界。</p>
          </section>
        </div>
      ) : null}
      <div className="queue-observations" aria-label="同一调用的结果">
        {[
          ['ArrayQueue', last?.array],
          ['LinkedQueue', last?.linked],
          ['从尾部出队的错误实现', last?.lifo],
        ].map(([name, result], i) => (
          <div key={name} className={i === 2 && state.violated ? 'violated' : ''}>
            <small>{name}</small>
            <output>{result ?? '尚未调用'}</output>
            <span>
              {i === 2 && state.violated
                ? '已观察到违约'
                : i === 2
                  ? '尚未暴露顺序错误'
                  : '遵守本模型的契约'}
            </span>
          </div>
        ))}
      </div>
      <div className="oop-ledger">
        <h4>
          最近的调用证据 <small>最多 8 条</small>
        </h4>
        {state.records.length ? (
          <div className="oop-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>操作</th>
                  <th>契约预期</th>
                  <th>数组</th>
                  <th>链式</th>
                  <th>错误实现</th>
                </tr>
              </thead>
              <tbody>
                {state.records.map((record, i) => (
                  <tr key={i}>
                    <td>
                      <code>{record.command}</code>
                    </td>
                    <td>{record.expected}</td>
                    <td>{record.array}</td>
                    <td>{record.linked}</td>
                    <td className={record.lifo !== record.expected ? 'mismatch' : ''}>
                      {record.lifo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>还没有调用。入队 A、B 后，第一次出队应该得到 A。</p>
        )}
      </div>
      <Feedback good={!state.violated && last?.accepted !== false}>
        {last?.accepted === false
          ? '队列已满，三种模型都返回 Full，内部元素没有改变；拒绝条件也是契约的一部分。'
          : state.violated
            ? '同样叫 dequeue()，从尾部取值仍违背这里的 FIFO 契约。方法名与签名相同，不等于行为可替代。'
            : last?.expected === 'None'
              ? '空队列返回 None；不是空字符串，也没有取出虚构元素。'
              : '数组位置与链式节点不同，但相同操作序列得到相同结果。抽象约定行为，封装保护内部表示。'}
      </Feedback>
      <div className="oop-boundary">
        <ArrowUpRight size={16} />
        本课明确要求 FIFO；Java Queue 接口本身也允许优先级等其他排序规则，不能只凭接口名推出 FIFO。
      </div>
    </Bench>
  );
}
