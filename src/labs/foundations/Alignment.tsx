import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { layoutStruct } from '../../domain/alignment.mjs';
import './alignment.css';

type FieldName = 'tag' | 'value' | 'end';
const initialOrder: FieldName[] = ['tag', 'value', 'end'];
const fieldNames = { tag: 'tag · char', value: 'value · int', end: 'end · char' };

export default function Alignment() {
  const [order, setOrder] = useState<FieldName[]>(initialOrder);
  const [intAlignment, setIntAlignment] = useState<2 | 4>(4);
  const layout = layoutStruct(
    order.map((name) => ({
      name,
      size: name === 'value' ? 4 : 1,
      alignment: name === 'value' ? intAlignment : 1,
    })),
  );

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= order.length) return;
    setOrder((previous) => {
      const next = [...previous];
      [next[index], next[other]] = [next[other], next[index]];
      return next;
    });
  }

  return (
    <Experiment
      className="alignment-lab"
      title="给结构体的每个字节找位置"
      subtitle="教学 ABI：char 大小/对齐 1 字节，int 大小 4 字节；调整 int 对齐和成员顺序。"
      onReset={() => {
        setOrder(initialOrder);
        setIntAlignment(4);
      }}
    >
      <div className="alignment-controls">
        <div className="alignment-assumption">
          <strong>int 对齐</strong>
          <div role="group" aria-label="选择教学 ABI 中 int 的对齐字节数">
            {[2, 4].map((value) => (
              <button
                type="button"
                key={value}
                className={intAlignment === value ? 'active' : ''}
                aria-pressed={intAlignment === value}
                onClick={() => setIntAlignment(value as 2 | 4)}
              >
                {value} B
              </button>
            ))}
          </div>
        </div>
        <div className="alignment-fields">
          <strong>成员声明顺序</strong>
          <ol>
            {order.map((name, index) => (
              <li key={name}>
                <span className={`alignment-field-dot ${name}`} aria-hidden="true" />
                <span>{fieldNames[name]}</span>
                <div className="alignment-move">
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={`上移 ${name}`}
                    title={`上移 ${name}`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    aria-label={`下移 ${name}`}
                    title={`下移 ${name}`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="alignment-totals" aria-label="结构体大小与填充统计">
        <div>
          <span>sizeof</span>
          <strong>{layout.size} B</strong>
        </div>
        <div>
          <span>结构体对齐</span>
          <strong>{layout.alignment} B</strong>
        </div>
        <div>
          <span>内部填充</span>
          <strong>{layout.internalPadding} B</strong>
        </div>
        <div>
          <span>尾部填充</span>
          <strong>{layout.tailPadding} B</strong>
        </div>
      </div>
      <div className="alignment-map" key={`${order.join('-')}-${intAlignment}`}>
        {layout.slots.map((slot: { offset: number; kind: string; field: string | null }) => (
          <div
            key={slot.offset}
            className={`alignment-byte ${slot.kind === 'padding' ? 'padding' : slot.field}`}
            aria-label={`偏移 ${slot.offset}：${slot.kind === 'padding' ? '填充' : slot.field}`}
          >
            <small>{slot.offset}</small>
            <strong>
              {slot.kind === 'padding' ? '·' : slot.field === 'value' ? 'int' : slot.field}
            </strong>
          </div>
        ))}
      </div>
      <p className="alignment-offsets">
        {layout.members.map((member: { name: string; offset: number }) => (
          <span key={member.name}>
            <code>{member.name}</code> 从偏移 <strong>{member.offset}</strong> 开始
          </span>
        ))}
      </p>
      <p className="experiment-status" role="status">
        本假设下成员占 {layout.usedBytes - layout.internalPadding} B，填充共{' '}
        {layout.internalPadding + layout.tailPadding} B，结构体大小为 {layout.size} B。结果依赖当前
        ABI 假设，不是所有 C 平台的固定大小。
      </p>
    </Experiment>
  );
}
