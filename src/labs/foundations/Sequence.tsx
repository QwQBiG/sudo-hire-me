import { useState } from 'react';
import { ArrowRight, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { arrayInsertion } from '../../domain/foundations.mjs';
import './foundations.css';

export default function Sequence() {
  const [index, setIndex] = useState(1);
  const [arrayStep, setArrayStep] = useState(0);
  const [linkStep, setLinkStep] = useState(0);
  const state = arrayInsertion(index, arrayStep);
  const reset = () => {
    setArrayStep(0);
    setLinkStep(0);
  };
  const predecessor = index === 0 ? 'head' : ['A', 'B', 'C'][index - 1];
  const successor = ['A', 'B', 'C', 'null'][index];
  const linked = ['A', 'B', 'C'];
  if (linkStep === 2) linked.splice(index, 0, 'N');
  return (
    <Experiment
      title="插入 15：搬数据，还是接链接？"
      subtitle="数组容量为 4，原长度为 3；链表前驱已知，不包含定位与内存分配成本。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          插入下标
          <select
            value={index}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              reset();
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <option key={i} value={i}>
                {i}
                {i === 0 ? ' · 头部' : i === 3 ? ' · 尾部' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="f-sequence-comparison">
        <section>
          <h3>
            连续数组 <small>Array</small>
          </h3>
          <div className="f-array-slots">
            {state.slots.map((value, i) => (
              <div key={i} className={state.done && i === index ? 'inserted' : ''}>
                <small>[{i}]</small>
                <strong>{value ?? '空'}</strong>
              </div>
            ))}
          </div>
          <p className="f-action-code">
            <code>
              {state.done
                ? 'length = 4'
                : arrayStep < 3 - index
                  ? `a[${3 - arrayStep}] = a[${2 - arrayStep}]`
                  : `a[${index}] = 15`}
            </code>
          </p>
          <button
            className="secondary"
            disabled={state.done}
            onClick={() => setArrayStep(arrayStep + 1)}
          >
            <StepForward size={16} />
            {state.done ? '数组插入完成' : arrayStep < 3 - index ? '搬移一个元素' : '写入 15'}
          </button>
          <p>
            已搬移 <strong>{state.moves}</strong> 个旧元素
          </p>
        </section>
        <section>
          <h3>
            单链表 <small>Singly Linked List</small>
          </h3>
          <div className="f-chain" aria-label="链表逻辑顺序">
            <span>head</span>
            <ArrowRight size={17} />
            {linked.map((name) => (
              <div className="f-chain-item" key={name}>
                <span className={name === 'N' ? 'inserted' : ''}>
                  {name}
                  <strong>{{ A: 10, B: 20, C: 30, N: 15 }[name]}</strong>
                </span>
                <ArrowRight size={17} />
              </div>
            ))}
            <span>null</span>
          </div>
          <div className="f-new-node">
            {linkStep < 2 ? (
              <>
                <b>N · 15</b>
                <ArrowRight size={17} />
                <code>{linkStep === 1 ? successor : '未接入'}</code>
              </>
            ) : (
              <span>N 已接入，原节点数据未搬移</span>
            )}
          </div>
          <p className="f-action-code">
            <code>
              {linkStep === 0
                ? `N.next = ${index === 0 ? 'head' : `${predecessor}.next`}`
                : linkStep === 1
                  ? `${index === 0 ? 'head' : `${predecessor}.next`} = N`
                  : '链接更新完成'}
            </code>
          </p>
          <button
            className="secondary"
            disabled={linkStep === 2}
            onClick={() => setLinkStep(linkStep + 1)}
          >
            <StepForward size={16} />
            {linkStep === 2 ? '链表插入完成' : '修改一条链接'}
          </button>
          <p>
            已修改 <strong>{linkStep}</strong> 条链接
          </p>
        </section>
      </div>
      <p className="experiment-status" aria-live="polite">
        下标 {index} 处插入：数组需要搬移 {3 - index} 个元素，链表修改 2 条链接。这里已知前驱；只有
        head 时，仍可能先花 O(n) 查找。
      </p>
    </Experiment>
  );
}
