import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { memoryLayout } from '../../domain/foundations.mjs';
import './foundations.css';
import './foundations-quality.css';

export default function Memory() {
  const [width, setWidth] = useState(4);
  const [selected, setSelected] = useState(1);
  const [base, setBase] = useState(100);
  const cells = memoryLayout(width, 3, base);
  const start = base + selected * width;
  return (
    <Experiment
      title="给每一个字节找到地址"
      subtitle="按字节寻址；3 个等宽元素连续存放，不含填充。"
      onReset={() => {
        setWidth(4);
        setSelected(1);
        setBase(100);
      }}
    >
      <div className="experiment-controls">
        <label>
          元素宽度
          <SelectField value={width} onChange={(e) => setWidth(Number(e.target.value))}>
            {[1, 2, 4, 8].map((n) => (
              <option key={n} value={n}>
                {n} B
              </option>
            ))}
          </SelectField>
        </label>
        <label>
          起始地址
          <SelectField value={base} onChange={(e) => setBase(Number(e.target.value))}>
            {[0, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
        </label>
      </div>
      <div className="f-memory-address">
        <span>低地址</span>
        <span>高地址</span>
      </div>
      <div className="f-memory-grid" aria-label="按字节划分的内存">
        {cells.map((cell) => (
          <button
            key={cell.address}
            className={`f-byte f-color-${cell.element} ${selected === cell.element ? 'selected' : ''}`}
            onClick={() => setSelected(cell.element)}
            aria-pressed={selected === cell.element}
            data-offset={cell.offset}
            aria-label={`地址 ${cell.address}，元素 a[${cell.element}] 的第 ${cell.offset + 1} 字节`}
          >
            <small>{cell.address}</small>
            <strong>a[{cell.element}]</strong>
            <span>{cell.offset === 0 ? '起点' : `+${cell.offset}`}</span>
          </button>
        ))}
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <code>&amp;a[{selected}]</code>
        <span>
          → 起点 <strong>{start}</strong>
        </span>
        <span>
          末字节 <strong>{start + width - 1}</strong>
        </span>
        <span>
          跨度 <strong>{width} B</strong>
        </span>
      </div>
      <div className="f-address-equation" aria-live="polite">
        <span>
          {base}
          <small>起始地址</small>
        </span>
        <b>+</b>
        <span>
          {selected}
          <small>下标</small>
        </span>
        <b>×</b>
        <span>
          {width}
          <small>字节 / 元素</small>
        </span>
        <b>=</b>
        <span className="f-result">
          {start}
          <small>a[{selected}] 起点</small>
        </span>
      </div>
      <div className="experiment-metrics">
        <div className="metric">
          <span>选中元素占用</span>
          <strong>
            {start}..{start + width - 1}
          </strong>
        </div>
        <div className="metric">
          <span>数组总容量</span>
          <strong>
            {3 * width} B / {24 * width} bit
          </strong>
        </div>
        <div className="metric">
          <span>数组之后的地址</span>
          <strong>{base + 3 * width}</strong>
        </div>
      </div>
      <p className="experiment-status">
        一个地址对应一个字节。a[{selected}] 的起点是 {start}，但整个元素占 {width} 个字节。
      </p>
    </Experiment>
  );
}
