import { useState } from 'react';
import { ChevronsRight, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  chosenKnapsackItems,
  createKnapsackState,
  knapsackCapacity,
  knapsackItems,
  stepKnapsack,
} from '../../domain/knapsack-grid.mjs';
import './advanced-algorithms.css';

export default function KnapsackGrid() {
  const [state, setState] = useState(() => createKnapsackState());
  const [focused, setFocused] = useState<{ row: number; capacity: number } | null>(null);
  const active = focused && state.dp[focused.row][focused.capacity] !== null ? focused : state.last;
  const item = active?.row ? knapsackItems[active.row - 1] : null;
  const skip = item && active ? state.dp[active.row - 1][active.capacity] : null;
  const take =
    item && active && active.capacity >= item.weight
      ? item.value + state.dp[active.row - 1][active.capacity - item.weight]!
      : null;

  const reset = () => {
    setState(createKnapsackState());
    setFocused(null);
  };
  const finish = () =>
    setState((current) => {
      let next = current;
      while (!next.done) next = stepKnapsack(next);
      return next;
    });

  return (
    <Experiment
      title="每格只从上一行取答案"
      subtitle="容量沿横轴，已考虑的物品沿纵轴；点选已填格子可回看不选/选的两个来源。"
      onReset={reset}
    >
      <div className="knapsack-items">
        {knapsackItems.map((entry) => (
          <span key={entry.name}>
            <strong>{entry.name}</strong> 重 {entry.weight} / 值 {entry.value}
          </span>
        ))}
      </div>
      <div className="knapsack-table-wrap">
        <table className="knapsack-table">
          <thead>
            <tr>
              <th scope="col">物品 / 容量</th>
              {Array.from({ length: knapsackCapacity + 1 }, (_, w) => (
                <th scope="col" key={w}>
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.dp.map((row: (number | null)[], i: number) => (
              <tr key={i}>
                <th scope="row">{i === 0 ? '无' : `前 ${i} 件`}</th>
                {row.map((value, w) => (
                  <td
                    key={w}
                    data-current={!state.done && state.row === i && state.capacity === w}
                    data-focused={Boolean(active && active.row === i && active.capacity === w)}
                  >
                    <button
                      type="button"
                      disabled={value === null}
                      aria-label={`前 ${i} 件、容量 ${w}：${value ?? '未计算'}`}
                      onClick={() => setFocused({ row: i, capacity: w })}
                    >
                      {value ?? '·'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="advanced-readout" aria-live="polite">
        {active && item ? (
          <>
            <span>
              dp[{active.row}][{active.capacity}]，物品 {item.name}
            </span>
            <strong>
              max(不选 {skip}, {take === null ? '放不下' : `选 ${take}`}) ={' '}
              {state.dp[active.row][active.capacity]}
            </strong>
          </>
        ) : (
          <span>第 0 行与容量 0 已初始化为 0。</span>
        )}
      </div>
      <div className="experiment-controls advanced-actions">
        <button
          type="button"
          className="primary"
          disabled={state.done}
          onClick={() => {
            setFocused(null);
            setState((current) => stepKnapsack(current));
          }}
        >
          <StepForward size={16} /> 计算下一格
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.done}
          onClick={() => {
            setFocused(null);
            finish();
          }}
        >
          <ChevronsRight size={16} /> 填完表
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.note}
      </p>
      {state.done && (
        <p className="advanced-result">
          最大价值 {state.dp[knapsackItems.length][knapsackCapacity]}；选择{' '}
          {chosenKnapsackItems(state).join(' + ')}。
        </p>
      )}
    </Experiment>
  );
}
