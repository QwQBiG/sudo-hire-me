import { useState } from 'react';
import { ArrowDown, Braces, Check, LockKeyhole, GitCompareArrows } from 'lucide-react';
import type { LabProps } from '../../types';
import { genericFlow, displayTyped } from '../../domain/type-flow.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './type-scenes.css';

const examples: Record<string, string> = {
  int: '[2,3]',
  text: '["a","b"]',
  point: '[{"x":2,"y":3},{"x":1,"y":9}]',
};
const names: Record<string, string> = { int: 'i32', text: '&str', point: 'Point' };
export default function GenericFlow({ lesson }: LabProps) {
  const [type, setType] = useState('int'),
    [text, setText] = useState(examples.int);
  const [operation, setOperation] = useState('first'),
    [ordered, setOrdered] = useState(false);
  const result = genericFlow(text, type, operation, ordered),
    concrete = names[type];
  const blocked = !result.permitted;
  const reset = () => {
    setType('int');
    setText(examples.int);
    setOperation('first');
    setOrdered(false);
  };
  return (
    <Bench
      className="type-scene generic-flow"
      title={lesson.title}
      subtitle="Rust 类型规则模型，未调用编译器。最多 8 项同类型数据；first 与 max_ref 都返回输入元素的引用。"
      onReset={reset}
    >
      <div className="generic-controls">
        <Choice
          label="元素类型"
          value={type}
          options={[
            ['int', 'i32'],
            ['text', '&str'],
            ['point', 'Point'],
          ]}
          onChange={(next) => {
            setType(next);
            setText(examples[next]);
          }}
        />
        <Choice
          label="泛型函数"
          value={operation}
          options={[
            ['first', 'first<T>'],
            ['max', 'max_ref<T: Ord>'],
          ]}
          onChange={setOperation}
        />
      </div>
      <label className="type-input">
        同类型数组（JSON）
        <input value={text} maxLength={240} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="type-presets">
        <button onClick={() => setText(examples[type])}>
          <Braces size={15} /> 示例数据
        </button>
        <button onClick={() => setText('[]')}>
          <code>[]</code> 空数组
        </button>
      </div>
      {type === 'point' ? (
        <label className="point-order">
          <input type="checkbox" checked={ordered} onChange={(e) => setOrdered(e.target.checked)} />
          Point 提供 Ord：先 x，再 y（字典序）
        </label>
      ) : null}
      <div className={`generic-gate ${blocked ? 'blocked' : ''}`} aria-label="类型参数与所需能力">
        <div>
          <small>具体类型</small>
          <code>T = {concrete}</code>
        </div>
        <div>
          <small>当前函数的约束</small>
          <code>{operation === 'first' ? '不要求 Ord' : 'T: Ord'}</code>
        </div>
        <div>
          {blocked ? <LockKeyhole size={18} /> : <Check size={18} />}
          <span>
            {blocked ? '约束不满足，不能调用' : operation === 'first' ? '没有比较操作' : '可以比较'}
          </span>
        </div>
      </div>
      <div className="generic-template">
        <code>
          {operation === 'first'
            ? 'fn first<T>(items: &[T]) -> Option<&T>'
            : 'fn max_ref<T: Ord>(items: &[T]) -> Option<&T>'}
        </code>
        <ArrowDown size={18} />
        <code>
          items: &amp;[{concrete}] → Option&lt;&amp;{concrete}&gt;
        </code>
      </div>
      <div className="typed-slots" aria-label="输入切片与选中的元素">
        {result.valid ? (
          result.items.length ? (
            result.items.map((item, index) => (
              <div key={index} className={index === result.index ? 'selected' : ''}>
                <small>
                  items[{index}] · {concrete}
                </small>
                <code>{displayTyped(item)}</code>
                <span>
                  {index === result.index
                    ? '返回引用指向这里'
                    : operation === 'first'
                      ? '不需要读取'
                      : '候选元素'}
                </span>
              </div>
            ))
          ) : (
            <p>长度为 0；没有可供引用的元素</p>
          )
        ) : (
          <p>{result.error}</p>
        )}
      </div>
      <div
        className={`generic-reference ${blocked || !result.valid ? 'blocked' : ''}`}
        role="status"
      >
        <small>模型结果</small>
        <output data-readout>
          {!result.valid
            ? '输入解析失败'
            : blocked
              ? 'Ord 约束不满足'
              : result.index < 0
                ? 'None'
                : `Some(&items[${result.index}])`}
        </output>
        <code>{result.value !== null ? displayTyped(result.value) : '没有借出元素引用'}</code>
      </div>
      {operation === 'max' && result.valid && result.permitted ? (
        <div className="generic-comparisons">
          <h4>
            <GitCompareArrows size={16} /> 比较证据 <small>{result.trace.length} 次</small>
          </h4>
          {result.trace.length ? (
            result.trace.map((row) => (
              <div key={row.index}>
                <code>
                  items[{row.index}] {row.order > 0 ? '>' : row.order < 0 ? '<' : '='} items[
                  {row.comparedWith}]
                </code>
                <span>当前选择 items[{row.selected}]</span>
              </div>
            ))
          ) : (
            <p>
              {result.items.length
                ? '只有一个元素，不需要比较。'
                : '空切片没有元素；满足约束后正常返回 None。'}
            </p>
          )}
        </div>
      ) : null}
      <Feedback good={result.valid && result.permitted}>
        {!result.valid
          ? '这是输入格式不符合所选类型，不是泛型把混合数组自动转换成了同一种类型。'
          : blocked
            ? 'first 可以读取没有 Ord 的 Point；max_ref 要求 Ord，即使数组为空也不能跳过类型约束。'
            : result.index < 0
              ? '类型与约束都有效，但没有第一个或最大元素，所以返回 None。'
              : operation === 'first'
                ? '只借出首项的引用，不比较、不复制；不需要给 T 添加 Ord、Copy 或 Clone。'
                : type === 'text'
                  ? '按 Rust 字符串的 UTF-8 字节字典序比较，不按长度，也不是本地化字母排序。'
                  : type === 'point'
                    ? 'Point 的顺序是显式约定的先 x 后 y；不是比较到原点的距离。'
                    : 'max_ref 返回最大值所在元素的引用；与 Rust Iterator::max 一致，并列时选择最后一个。'}
      </Feedback>
      <p className="type-note">
        图中编号是切片索引，不是内存地址；模型不表示 Java 类型擦除或 C++ 模板的编译实现。
      </p>
    </Bench>
  );
}
