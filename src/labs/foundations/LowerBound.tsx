import { SelectField } from '../../components/SelectField';
import { useState, type CSSProperties } from 'react';
import { StepBack, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { lowerBoundDatasets, lowerBoundFrames } from '../../domain/lower-bound.mjs';
import './lower-bound.css';

const names = {
  duplicates: '重复值：1、3、3、3、7、9',
  unique: '无重复：2、5、8、12、16',
  empty: '空数组',
};

export default function LowerBound() {
  const [dataset, setDataset] = useState<keyof typeof lowerBoundDatasets>('duplicates');
  const [targetText, setTargetText] = useState('3');
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'boundary' | 'exact'>('boundary');
  const values = lowerBoundDatasets[dataset];
  const target = Number(targetText);
  const valid = targetText.trim() !== '' && Number.isFinite(target);
  const result = valid ? lowerBoundFrames(values, target) : null;
  const frame = result?.frames[step];
  const reset = () => setStep(0);
  const finished = Boolean(frame?.done);
  const outcome =
    !result || !frame
      ? '输入有限数值目标后开始推演。'
      : !finished
        ? '继续缩小待判断区间，结果尚未确定。'
        : mode === 'boundary'
          ? `下界是下标 ${result.index}；这是插入位置。`
          : result.found
            ? `精确命中：第一个等于 ${target} 的下标是 ${result.index}。`
            : `精确查找未命中（-1）；下界仍为 ${result.index}。`;

  return (
    <Experiment
      title="把边界夹到同一个位置"
      subtitle="中点颜色和下标状态随每轮比较变化；右端 n 可以是答案，但不是可读取的元素。"
      onReset={reset}
    >
      <div className="experiment-controls lb-controls">
        <label>
          有序输入
          <SelectField
            value={dataset}
            onChange={(event) => {
              setDataset(event.target.value as keyof typeof lowerBoundDatasets);
              reset();
            }}
          >
            {Object.entries(names).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </SelectField>
        </label>
        <label>
          目标值
          <input
            type="number"
            step="any"
            value={targetText}
            onChange={(event) => {
              setTargetText(event.target.value);
              reset();
            }}
          />
        </label>
      </div>
      <div className="lb-mode" role="group" aria-label="查看结果类型">
        <button
          type="button"
          aria-pressed={mode === 'boundary'}
          onClick={() => setMode('boundary')}
        >
          下界位置
        </button>
        <button type="button" aria-pressed={mode === 'exact'} onClick={() => setMode('exact')}>
          精确查找
        </button>
      </div>
      {frame && result ? (
        <>
          <div
            className="lb-numberline"
            style={{ '--lb-count': values.length + 1 } as CSSProperties}
            data-empty={values.length === 0}
            aria-label={`数组 ${values.join('、') || '空'}，右端位置 ${values.length}`}
          >
            {values.map((value: number, index: number) => {
              const phase =
                index < frame.left ? 'small' : index >= frame.right ? 'qualified' : 'unknown';
              return (
                <div
                  className="lb-cell"
                  key={index}
                  data-phase={phase}
                  data-probed={frame.mid === index}
                >
                  <small>下标 {index}</small>
                  <strong>{value}</strong>
                  <span>
                    {frame.mid === index
                      ? '本轮比较'
                      : phase === 'small'
                        ? '已排除'
                        : phase === 'qualified'
                          ? '不小于目标'
                          : '待判断'}
                  </span>
                </div>
              );
            })}
            <div
              className="lb-cell lb-end"
              data-answer={finished && result.index === values.length}
            >
              <small>下标 {values.length}</small>
              <strong>末端</strong>
              <span>不能读取</span>
            </div>
          </div>
          <div className="lb-state">
            <div>
              <small>左边界</small>
              <strong>{frame.left}</strong>
            </div>
            <span aria-label="半开区间">[left, right)</span>
            <div>
              <small>右边界</small>
              <strong>{frame.right}</strong>
            </div>
            <div>
              <small>已比较</small>
              <strong>{step}</strong>
            </div>
          </div>
          <p className="lb-decision">{frame.note}</p>
          <div className="experiment-controls lb-actions">
            <button
              className="secondary"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <StepBack size={16} /> 上一轮
            </button>
            <button
              className="primary"
              disabled={finished}
              onClick={() => setStep((current) => Math.min(result.frames.length - 1, current + 1))}
            >
              <StepForward size={16} /> 比较中点
            </button>
          </div>
        </>
      ) : (
        <p className="lb-invalid">目标值不能为空，且必须是有限数值。</p>
      )}
      <p className="experiment-status lb-outcome" role="status">
        {outcome}
      </p>
    </Experiment>
  );
}
