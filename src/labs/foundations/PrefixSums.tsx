import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { buildPrefix, prefixValues, rangeSum } from '../../domain/prefix-sums.mjs';
import './algorithm-labs.css';

const prefix = buildPrefix(prefixValues);

export default function PrefixSums() {
  const [left, setLeft] = useState(1);
  const [right, setRight] = useState(4);
  const selected = prefixValues.slice(left, right);
  const answer = rangeSum(prefix, left, right);

  return (
    <Experiment
      title="用两个边界切出一段和"
      subtitle="下方边界位置对应前缀表；任意半开区间 [L, R) 都可即时查询。"
      onReset={() => {
        setLeft(1);
        setRight(4);
      }}
    >
      <div className="algo-array prefix-array" role="group" aria-label="原数组的下标与选中区间">
        {prefixValues.map((value, index) => (
          <button
            type="button"
            key={index}
            className="algo-cell"
            data-phase={index >= left && index < right ? 'in-window' : 'idle'}
            title={`将左边界设为 ${index}`}
            aria-label={`a[${index}] = ${value}；左边界设为 ${index}`}
            onClick={() => {
              setLeft(index);
              if (right < index) setRight(index);
            }}
          >
            <small>a[{index}]</small>
            <strong>{value}</strong>
            <span>{index >= left && index < right ? '计入' : '\u00a0'}</span>
          </button>
        ))}
      </div>
      <div className="prefix-boundaries" aria-label="前缀和边界">
        {prefix.map((value, index) => (
          <button
            type="button"
            key={index}
            className="prefix-boundary"
            data-left={index === left}
            data-right={index === right}
            aria-label={`边界 ${index}，前缀和 ${value}；将右边界设为 ${index}`}
            title={`将右边界设为 ${index}`}
            onClick={() => {
              setRight(index);
              if (left > index) setLeft(index);
            }}
          >
            <span>{index}</span>
            <strong>
              P[{index}]={value}
            </strong>
          </button>
        ))}
      </div>
      <div className="experiment-controls algo-controls prefix-sliders">
        <label>
          左边界 L：{left}
          <input
            type="range"
            min="0"
            max={prefixValues.length}
            value={left}
            onChange={(event) => setLeft(Math.min(Number(event.target.value), right))}
          />
        </label>
        <label>
          右边界 R：{right}
          <input
            type="range"
            min="0"
            max={prefixValues.length}
            value={right}
            onChange={(event) => setRight(Math.max(Number(event.target.value), left))}
          />
        </label>
      </div>
      <div className="algo-readout prefix-equation" role="status">
        <span>
          区间 [{left}, {right})：{selected.length ? selected.join(' + ') : '空区间'}
        </span>
        <strong>
          P[{right}] − P[{left}] = {prefix[right]} − {prefix[left]} = {answer}
        </strong>
      </div>
      <p className="algo-footnote">
        P[i] 是前 i 个元素的和。减去 P[L]，剩下的正好是从 L 到 R−1 的元素；负数也适用。
      </p>
    </Experiment>
  );
}
