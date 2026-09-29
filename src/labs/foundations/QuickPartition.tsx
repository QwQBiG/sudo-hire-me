import { useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  choosePartition,
  createPartitionState,
  stepPartition,
} from '../../domain/quick-partition.mjs';
import './pointer-workbenches.css';

const presets = [
  { key: 'mixed', label: '一般输入' },
  { key: 'duplicates', label: '重复值' },
  { key: 'sorted', label: '已排序' },
];

export default function QuickPartition() {
  const [state, setState] = useState(() => createPartitionState());
  const pivotIndex = state.pivotIndex ?? -1;
  return (
    <Experiment
      title="把 pivot 放到自己的位置"
      subtitle="按 Lomuto 分区：左侧严格小于 pivot，右侧不小于 pivot；每次先猜当前值归哪边。"
      onReset={() => setState(createPartitionState(state.preset))}
    >
      <div className="pointer-presets" role="group" aria-label="分区数组预设">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.key}
            aria-pressed={state.preset === preset.key}
            onClick={() => setState(createPartitionState(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="partition-array" role="group" aria-label="当前数组与分区边界">
        {state.values.map((value: number, index: number) => {
          const phase =
            state.phase === 'done'
              ? index === pivotIndex
                ? 'pivot'
                : index < pivotIndex
                  ? 'small'
                  : 'large'
              : index === state.values.length - 1 && state.phase !== 'done'
                ? 'pivot'
                : index < state.i
                  ? 'small'
                  : index < state.j
                    ? 'large'
                    : 'unknown';
          return (
            <div
              className="partition-cell"
              key={index}
              data-phase={phase}
              data-current={state.phase === 'scan' && state.j === index}
            >
              <small>{index}</small>
              <strong>{value}</strong>
              <span>{index === state.i && state.phase !== 'done' ? 'i' : '\u00a0'}</span>
            </div>
          );
        })}
      </div>
      <div className="partition-legend">
        <span>小于区 [0,{state.i})</span>
        <span>
          {state.phase === 'done' ? `pivot 已就位：${state.pivotIndex}` : `待检查 j=${state.j}`}
        </span>
        <span>pivot={state.pivot}</span>
      </div>
      <div className="experiment-controls pointer-actions">
        <button
          type="button"
          className="secondary"
          disabled={state.phase !== 'scan'}
          onClick={() => setState((current) => choosePartition(current, 'small'))}
        >
          <Check size={16} /> 严格小于
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.phase !== 'scan'}
          onClick={() => setState((current) => choosePartition(current, 'large'))}
        >
          <Check size={16} /> 不小于
        </button>
        <button
          type="button"
          className="primary"
          disabled={state.phase !== 'finalize'}
          onClick={() => setState((current) => stepPartition(current))}
        >
          <ArrowLeftRight size={16} /> pivot 入位
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.feedback || state.note}
      </p>
      {state.phase === 'done' && (
        <p className="pointer-outcome">
          pivot 下标 {state.pivotIndex}；分区完成，不等于整数组已排序。
        </p>
      )}
    </Experiment>
  );
}
