import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { callWithList, defaultListState } from '../../domain/mutable-default.mjs';
import './mutable-default.css';

interface CallRecord {
  value: number;
  explicit: boolean;
  result: number[];
}

interface DefaultListState {
  shared: number[];
  history: CallRecord[];
}

export default function MutableDefault() {
  const [state, setState] = useState<DefaultListState>(defaultListState());
  const [value, setValue] = useState(1);
  const last = state.history.at(-1);

  function invoke(explicit: boolean) {
    setState(callWithList(state, value, explicit));
    setValue((current) => Math.min(9, current + 1));
  }

  return (
    <Experiment
      className="mutable-default-lab"
      title="默认列表只创建一次"
      subtitle="固定函数 add(x, acc=[])。省略 acc 会复用默认对象；显式传 [] 会新建本次调用使用的列表。"
      onReset={() => {
        setState(defaultListState());
        setValue(1);
      }}
    >
      <div className="mutable-default-code">
        <code>def add(x, acc=[]):</code>
        <code> acc.append(x)</code>
        <code> return list(acc)</code>
      </div>
      <div className="mutable-default-controls">
        <label htmlFor="mutable-default-value">本次 x</label>
        <input
          id="mutable-default-value"
          type="number"
          min="0"
          max="9"
          value={value}
          onChange={(event) => setValue(Math.max(0, Math.min(9, Number(event.target.value) || 0)))}
        />
        <button type="button" onClick={() => invoke(false)}>
          <code>add({value})</code>
        </button>
        <button type="button" onClick={() => invoke(true)}>
          <code>add({value}, [])</code>
        </button>
      </div>
      <div className="mutable-default-shared">
        <span>定义时创建的默认列表</span>
        <strong>[{state.shared.join(', ')}]</strong>
      </div>
      <ol className="mutable-default-history" aria-label="调用记录">
        {state.history.map((call, index) => (
          <li key={index}>
            <code>
              #{index + 1} add({call.value}
              {call.explicit ? ', []' : ''})
            </code>
            <span>→ [{call.result.join(', ')}]</span>
          </li>
        ))}
      </ol>
      <p className="experiment-status" role="status">
        {last
          ? `${last.explicit ? '显式新列表与默认对象无关' : '省略参数，复用了同一个默认列表'}；本次返回 [${last.result.join(', ')}]。`
          : '尚未调用；两个按钮会展示两条不同的对象路径。'}
      </p>
    </Experiment>
  );
}
