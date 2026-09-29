import { useState } from 'react';
import { ScanSearch, Route } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  bplusLeaves,
  createBplusState,
  rangeBplus,
  searchBplus,
} from '../../domain/bplus-tree.mjs';
import './mechanism-labs.css';

export default function BplusTree() {
  const [state, setState] = useState(() => createBplusState());
  const [key, setKey] = useState(25);
  const [start, setStart] = useState(20);
  const [end, setEnd] = useState(45);
  const validKey = Number.isInteger(key);
  const validRange = Number.isInteger(start) && Number.isInteger(end) && start <= end;
  return (
    <Experiment
      title="B+ 树路径与叶链"
      subtitle="固定三片叶的概念树：先定位，再按键顺序走"
      className="bplus-lab"
      onReset={() => setState(createBplusState())}
    >
      <div className="bplus-tree">
        <div className="bplus-root" data-active={state.visited.includes('root')}>
          <small>根节点 · 分隔键</small>
          <strong>20 ｜ 40</strong>
        </div>
        <div className="bplus-branches" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="bplus-leaves">
          {bplusLeaves.map((leaf) => (
            <div key={leaf.id} data-active={state.visited.includes(leaf.id)}>
              <small>{leaf.id} 叶</small>
              <strong>{leaf.keys.join(' · ')}</strong>
            </div>
          ))}
        </div>
        <small className="bplus-chain">叶间顺序：左 → 中 → 右</small>
      </div>
      <div className="bplus-controls">
        <label>
          等值键{' '}
          <input
            type="number"
            value={key}
            onChange={(event) => setKey(Number(event.target.value))}
          />
        </label>
        <button disabled={!validKey} onClick={() => setState(searchBplus(key))}>
          <ScanSearch size={15} /> 查找
        </button>
        <label>
          下界{' '}
          <input
            type="number"
            value={start}
            onChange={(event) => setStart(Number(event.target.value))}
          />
        </label>
        <label>
          上界{' '}
          <input
            type="number"
            value={end}
            onChange={(event) => setEnd(Number(event.target.value))}
          />
        </label>
        <button disabled={!validRange} onClick={() => setState(rangeBplus(start, end))}>
          <Route size={15} /> 范围扫描
        </button>
      </div>
      <div className="mechanism-result" aria-live="polite">
        <strong>
          {state.mode === 'idle' ? '等待查询' : state.mode === 'equal' ? '等值查找' : '范围扫描'}
        </strong>
        <p>{state.message}</p>
        <small>
          经过：{state.visited.length ? state.visited.join(' → ') : '未开始'}　结果：
          {state.results.length ? state.results.join('、') : '空'}
        </small>
      </div>
    </Experiment>
  );
}
