import { useState } from 'react';
import { ArrowDown, ArrowRight, Eye, Unlink, MoveRight, Trash2, Undo2 } from 'lucide-react';
import { vectorMutation } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import type { LabProps } from '../../types';
import './expansion.css';
import './mechanics.css';

const initial = [10, 20, 30];
const names: Record<number, string> = { 0: 'begin()', 1: 'begin()+1', 3: '旧 end()' };
export default function VectorStorage({ lesson }: LabProps) {
  const [reserved, setReserved] = useState(false);
  const [index, setIndex] = useState(1);
  const [operation, setOperation] = useState<'push' | 'erase' | null>(null);
  const [inspected, setInspected] = useState(false);
  const mutation = operation ? vectorMutation(3, reserved ? 5 : 3, operation, index) : null;
  const values =
    operation === 'push' ? [10, 20, 30, 40] : operation === 'erase' ? [10, 30] : initial;
  const capacity = reserved || mutation?.reallocated ? 5 : 3;
  const block = mutation?.reallocated ? 'B' : 'A';
  const valid = mutation ? mutation.valid : true;
  const readable = valid && index < values.length;
  const rewind = () => {
    setOperation(null);
    setInspected(false);
  };
  const change = (next: 'push' | 'erase') => {
    setOperation(next);
    setInspected(false);
  };
  return (
    <Bench
      className="expansion vector-lab"
      title={lesson.title}
      subtitle="初始 size = 3。A、B 是示意存储区，不是真实地址；扩容倍率与精确 capacity 由实现决定。"
      onReset={() => {
        rewind();
        setReserved(false);
        setIndex(1);
      }}
    >
      <label className="exp-check">
        <input
          type="checkbox"
          checked={reserved}
          onChange={(event) => {
            setReserved(event.target.checked);
            rewind();
          }}
        />
        修改前 reserve(5)，本模型取 capacity = 5
      </label>
      <Choice
        label="保存的旧迭代器"
        value={String(index)}
        options={[
          ['0', 'begin() · 10'],
          ['1', 'begin()+1 · 20'],
          ['3', '旧 end() · 尾后'],
        ]}
        onChange={(value) => {
          setIndex(Number(value));
          rewind();
        }}
      />
      <div className="vector-handle">
        {valid ? <MoveRight size={20} /> : <Unlink size={20} />}
        <div>
          <small>修改前保存的句柄</small>
          <code>
            {names[index]} → A:{index}
          </code>
        </div>
        <b className={valid ? '' : 'vector-invalid'}>
          {operation
            ? valid
              ? '仍有效'
              : '已失效'
            : index === 3
              ? '尾后，不指向元素'
              : '指向原元素'}
        </b>
      </div>
      <div className="vector-scene">
        {mutation?.reallocated ? (
          <>
            <div className="vector-abandoned">
              <header>
                <b>旧存储区 A</b>
                <span>存储已释放；仅保留变化前示意</span>
              </header>
              <div
                className="vector-cells"
                style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
              >
                {initial.map((value, i) => (
                  <div key={i}>
                    <small>A:{i}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="vector-transfer">
              <ArrowDown size={20} />
              <span>搬移元素至新存储区；旧句柄不会自动指向 B</span>
            </div>
          </>
        ) : null}
        <div className="vector-current" key={block}>
          <header>
            <b>{mutation?.reallocated ? '新存储区 B' : '存储区 A'}</b>
            <span>
              <code>size {values.length}</code>
              <code>capacity {capacity}</code>
            </span>
          </header>
          <div
            className="vector-cells"
            style={{ gridTemplateColumns: `repeat(${capacity}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: capacity }, (_, i) => (
              <div
                key={i}
                className={`${i < values.length ? 'vector-live' : 'vector-empty'} ${block === 'A' && i === index ? (valid ? 'vector-selected' : 'vector-stale') : ''}`}
              >
                <small>
                  {block}:{i}
                </small>
                <strong
                  data-token-id={
                    values[i] === undefined ? undefined : `vector-${block}-${values[i]}`
                  }
                >
                  {values[i] ?? '·'}
                </strong>
                <span>{i < values.length ? '元素' : '未构造'}</span>
              </div>
            ))}
          </div>
          <div className="vector-boundary">
            <span>{values.length} 个有效元素</span>
            <code>
              新 end() → {block}:{values.length}
            </code>
          </div>
        </div>
      </div>
      <div className="exp-actions">
        <button disabled={operation !== null} onClick={() => change('push')}>
          <ArrowRight size={16} />
          push_back(40)
        </button>
        <button disabled={operation !== null} onClick={() => change('erase')}>
          <Trash2 size={16} />
          erase(begin()+1)
        </button>
        <button onClick={() => setInspected(true)}>
          <Eye size={16} />
          检查旧句柄
        </button>
        <button disabled={operation === null && !inspected} onClick={rewind}>
          <Undo2 size={16} />
          恢复修改前
        </button>
      </div>
      {inspected ? (
        <div className={`vector-inspection ${readable ? '' : 'vector-invalid'}`} role="status">
          <Eye size={18} />
          <span>
            {readable
              ? `句柄有效，当前指向 ${values[index]}。`
              : valid
                ? '这是尾后迭代器，本来就没有元素，不能解引用。'
                : '句柄已失效：模型拒绝解引用，没有实际执行未定义行为。'}
          </span>
        </div>
      ) : null}
      <Feedback good={!operation || valid}>
        {!operation
          ? 'capacity 中的空位不是元素；reserve 不会让 size 增大，旧 end() 也不能读取。'
          : mutation?.reallocated
            ? '容量已满，追加触发重新分配。所有旧元素迭代器与旧 end() 都失效。图中的新 capacity = 5 仅为示意，不是标准保证。'
            : operation === 'push'
              ? '未重新分配：原元素迭代器保留，但旧 end() 已失效。即使 A:3 现在有了 40，旧 end() 也不能当作合法元素迭代器使用。'
              : 'erase 删除 20，将 30 搬到 A:1。删除位置及之后的旧迭代器失效；A:1 仍有元素不代表旧句柄仍有效。'}
      </Feedback>
    </Bench>
  );
}
