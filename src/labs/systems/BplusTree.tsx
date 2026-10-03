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
import './systems-quality.css';

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
      onReset={() => {
        setState(createBplusState());
        setKey(25);
        setStart(20);
        setEnd(45);
      }}
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
              <div className="system-tokens" aria-label={`${leaf.id} 叶中的键`}>
                {leaf.keys.map((value) => (
                  <span key={value} data-current={state.results.includes(value)}>
                    {value}
                  </span>
                ))}
              </div>
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
            value={Number.isFinite(key) ? key : ''}
            aria-invalid={!validKey}
            onChange={(event) => setKey(event.target.valueAsNumber)}
          />
        </label>
        <button disabled={!validKey} onClick={() => setState(searchBplus(key))}>
          <ScanSearch size={15} /> 查找
        </button>
        <label>
          下界{' '}
          <input
            type="number"
            value={Number.isFinite(start) ? start : ''}
            aria-invalid={!validRange}
            onChange={(event) => setStart(event.target.valueAsNumber)}
          />
        </label>
        <label>
          上界{' '}
          <input
            type="number"
            value={Number.isFinite(end) ? end : ''}
            aria-invalid={!validRange}
            onChange={(event) => setEnd(event.target.valueAsNumber)}
          />
        </label>
        <button disabled={!validRange} onClick={() => setState(rangeBplus(start, end))}>
          <Route size={15} /> 范围扫描
        </button>
      </div>
      {(!validKey || !validRange) && (
        <p className="experiment-status" role="alert">
          查找键必须为整数；范围上下界必须为整数，且下界不能大于上界。
        </p>
      )}
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
