import { useId, useState } from 'react';
import { ArrowRight, Box, Link2, Scissors, Trash2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';

const setups: Record<string, { title: string; names: string[]; intro: string }> = {
  'oop-classes-objects': {
    title: '同一张蓝图，两份实例状态',
    names: ['accountA', 'accountB'],
    intro: '改变一个实例的字段，观察另一实例是否跟着变化。',
  },
  'oop-static-instance-members': {
    title: '字段究竟属于谁',
    names: ['instanceA', 'instanceB'],
    intro: '实例字段各自保存；静态字段放在类这一层。',
  },
  'shallow-deep-copy': {
    title: '复制外壳，还是复制整张对象图',
    names: ['original', 'copy'],
    intro: '外层对象和内部列表是两层不同的身份。',
  },
  'mutability-aliasing': {
    title: '沿着引用找到被改写的对象',
    names: ['first', 'alias'],
    intro: '两个名字可以指向同一个可变对象；重新绑定与修改内容不同。',
  },
  'function-arguments': {
    title: '把参数放进调用帧',
    names: ['caller', 'parameter'],
    intro: '教学模型：复制整数值，或复制指向对象的地址。修改参数与修改所指内容分别观察。',
  },
  'pointer-reference-basics': {
    title: '改指针，还是改它指向的值',
    names: ['p', 'q'],
    intro: '箭头表示指向关系；对象编号不是实际内存地址。',
  },
  'java-gc-references': {
    title: '断开局部变量，对象就能回收吗',
    names: ['local', 'staticCache'],
    intro: '简化强引用可达性模型；回收动作只演示资格，不代表 JVM 的执行时机。',
  },
};

export default function Objects({ lesson }: LabProps) {
  const markerId = useId();
  const config = setups[lesson.slug];
  const gc = lesson.slug === 'java-gc-references';
  const statics = lesson.slug === 'oop-static-instance-members';
  const copying = lesson.slug === 'shallow-deep-copy';
  const [mode, setMode] = useState('alias');
  const [refs, setRefs] = useState<(number | null)[]>([
    0,
    lesson.slug === 'oop-classes-objects' || statics ? 1 : 0,
  ]);
  const [values, setValues] = useState<(number | null)[]>([10, 10]);
  const [shared, setShared] = useState(0);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState(config.intro);
  const nested = copying && mode !== 'deep';
  function reset(nextMode = mode) {
    setRefs([
      0,
      nextMode === 'value' ||
      nextMode === 'deep' ||
      lesson.slug === 'oop-classes-objects' ||
      statics
        ? 1
        : 0,
    ]);
    setValues([10, 10]);
    setShared(0);
    setActive(0);
    setNote(config.intro);
  }
  function mutate() {
    const target = refs[active];
    if (target === null || values[target] === null) {
      setNote('没有有效引用，不能访问对象。先将变量绑定到存活的对象。');
      return;
    }
    setValues((all) => all.map((value, i) => (i === target ? (value ?? 0) + 1 : value)));
    setNote(
      `${config.names[active]} 沿箭头写入对象 #${target + 1}。${refs[0] === refs[1] ? '另一个名字指向同一个对象，所以也能看到新值。' : '另一对象保持原值。'}`,
    );
  }
  return (
    <Bench title={config.title} subtitle={config.intro} onReset={() => reset()}>
      {!gc && !statics && lesson.slug !== 'oop-classes-objects' && (
        <Choice
          label="复制方式"
          value={mode}
          options={
            copying
              ? [
                  ['alias', '浅拷贝：共享内部列表'],
                  ['deep', '深拷贝：独立内部列表'],
                ]
              : [
                  ['alias', '共享所指对象'],
                  ['value', '复制值到独立对象'],
                ]
          }
          onChange={(value) => {
            setMode(value);
            reset(value);
          }}
        />
      )}
      <div className="object-map">
        <div className="object-roots">
          <div className="bench-label">{gc ? 'GC Roots 可达路径' : '变量 / 调用帧'}</div>
          {config.names.map((name, i) => (
            <button
              className={`object-reference ${active === i ? 'selected' : ''}`}
              aria-pressed={active === i}
              aria-label={`选择引用 ${name}`}
              key={name}
              onClick={() => setActive(i)}
            >
              <code>{name}</code>
              <ArrowRight size={18} />
              <b>{refs[i] === null ? 'null' : `#${refs[i]! + 1}`}</b>
            </button>
          ))}
        </div>
        <svg
          className="object-cables"
          viewBox="0 0 100 248"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7" fill="none" stroke="context-stroke" strokeWidth="1.3" />
            </marker>
          </defs>
          {refs.map((target, index) =>
            target === null ? null : (
              <path
                key={index}
                className={active === index ? 'selected' : ''}
                d={`M0 ${86 + index * 112} C50 ${86 + index * 112},50 ${86 + target * 112},100 ${86 + target * 112}`}
                markerEnd={`url(#${markerId})`}
                fill="none"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
        </svg>
        <div className="object-heap">
          <div className="bench-label">
            <Box size={16} /> {copying ? '内部列表' : '对象存储'}
          </div>
          {values.map((value, i) => (
            <button
              key={i}
              disabled={value === null}
              aria-label={`将 ${config.names[active]} 绑定到对象 ${i + 1}`}
              className={`object-cell ${refs[active] === i ? 'pointed' : ''} ${value === null ? 'collected' : ''}`}
              onClick={() => {
                setRefs((all) => all.map((ref, index) => (index === active ? i : ref)));
                setNote(
                  `${config.names[active]} 现在指向 #${i + 1}；这次只改变引用，没有改写对象内容。`,
                );
              }}
            >
              <small>对象 #{i + 1}</small>
              <strong>{value === null ? '已回收' : copying ? `[${value}]` : value}</strong>
              <span>{config.names.filter((_, n) => refs[n] === i).join(' · ') || '无根引用'}</span>
            </button>
          ))}
        </div>
      </div>
      {copying && (
        <p className="object-caption">
          外层 original 与 copy 的身份不同。
          {nested ? '两条箭头汇聚到同一内部列表。' : '内部列表也各自独立。'}
        </p>
      )}
      {statics && (
        <div className="object-static">
          <span>Class · static total</span>
          <strong>{shared}</strong>
          <button
            className="secondary"
            onClick={() => {
              setShared((v) => v + 1);
              setNote('静态字段只存一份，两个实例经同一个类观察到相同 total。');
            }}
          >
            修改类字段 +1
          </button>
        </div>
      )}
      <div className="bench-actions">
        <button className="primary" onClick={mutate}>
          <Link2 size={16} /> 所指内容 +1
        </button>
        <button
          className="secondary"
          onClick={() => {
            setRefs((all) => all.map((v, i) => (i === active ? null : v)));
            setNote(`${config.names[active]} 已断开。对象是否仍被引用，要检查其他箭头。`);
          }}
        >
          <Scissors size={16} /> 断开 {config.names[active]}
        </button>
        {gc && (
          <button
            className="secondary"
            onClick={() => {
              const unreachable = values
                .map((v, i) => (v !== null && !refs.includes(i) ? i : -1))
                .filter((i) => i >= 0);
              setValues((all) => all.map((v, i) => (unreachable.includes(i) ? null : v)));
              setNote(
                unreachable.length
                  ? `回收不可达对象 ${unreachable.map((i) => '#' + (i + 1)).join('、')}。`
                  : '所有存活对象仍可从根到达，不能回收。静态缓存也会保持强引用。',
              );
            }}
          >
            <Trash2 size={16} /> 检查可回收对象
          </button>
        )}
      </div>
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
