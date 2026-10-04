import { useState, type CSSProperties } from 'react';
import { ArrowRight, Search, Check, Minus } from 'lucide-react';
import type { LabProps } from '../../types';
import { firstEvenModel, readEvenModel } from '../../domain/value-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './values.css';

const examples = [
  ['eight', '[1,3,8]'],
  ['none', '[1,3]'],
  ['zero', '[1,3,0]'],
] as const;
export default function OptionalSearch({ lesson }: LabProps) {
  const [text, setText] = useState('[1,3,0]');
  const [mode, setMode] = useState('match');
  const [run, setRun] = useState(0);
  const [performed, setPerformed] = useState(false);
  const result = firstEvenModel(text),
    read = readEvenModel(result, mode);
  const edit = (value: string) => {
    setText(value);
    setPerformed(false);
  };
  return (
    <Bench
      className="value-scene optional-search"
      title={lesson.title}
      subtitle="整数查找的规则模型；最多 10 个 -99 到 99 的整数。顺序动画不代表实际运行时间。"
      onReset={() => {
        setText('[1,3,0]');
        setMode('match');
        setRun(0);
        setPerformed(false);
      }}
    >
      <div className="value-presets" role="group" aria-label="查找输入示例">
        {examples.map(([id, value]) => (
          <button key={id} aria-pressed={text === value} onClick={() => edit(value)}>
            <code>{value}</code>
          </button>
        ))}
      </div>
      <div className="even-input">
        <label>
          整数数组（JSON）
          <input value={text} maxLength={120} onChange={(e) => edit(e.target.value)} />
        </label>
        <button
          onClick={() => {
            setRun((n) => n + 1);
            setPerformed(true);
          }}
        >
          <Search size={16} />
          查找偶数
        </button>
      </div>
      <div className="even-strip" key={run} aria-label="从左到右检查偶数">
        {result.valid ? (
          result.items.length ? (
            result.items.map((value, index) => {
              const visited = performed && (result.index < 0 || index <= result.index),
                found = performed && index === result.index;
              return (
                <div
                  key={index}
                  className={`${visited ? 'visited' : ''} ${found ? 'found' : ''}`}
                  style={{ '--visit-delay': `${index * 80}ms` } as CSSProperties}
                >
                  <small>index {index}</small>
                  <strong>{value}</strong>
                  <span>
                    {found ? <Check size={13} /> : visited ? <Minus size={13} /> : null}
                    {found ? '偶数' : visited ? '奇数' : '未检查'}
                  </span>
                </div>
              );
            })
          ) : (
            <p>空数组：没有可检查的元素</p>
          )
        ) : (
          <p>{result.error}</p>
        )}
      </div>
      <div className="option-payload" aria-label="查找的原始结果">
        <small>查找结果保留“是否存在”</small>
        <div className={performed && result.valid && result.index >= 0 ? 'selected' : ''}>
          <b>Some</b>
          <span>存在真实值</span>
          <output>{performed && result.valid && result.index >= 0 ? result.value : '—'}</output>
        </div>
        <div className={performed && result.valid && result.index < 0 ? 'selected' : ''}>
          <b>None</b>
          <span>没有结果</span>
          <Minus size={22} />
        </div>
      </div>
      <Choice
        label="调用方如何处理 Option"
        value={mode}
        options={[
          ['match', 'match 分支'],
          ['fallback', 'unwrap_or(0)'],
          ['unwrap', 'unwrap()'],
        ]}
        onChange={setMode}
      />
      <div className={`option-consumer ${performed && !read.ok ? 'failed' : ''}`} role="status">
        <code>
          {performed
            ? result.valid
              ? result.index >= 0
                ? `Some(${result.value})`
                : 'None'
              : '输入解析失败'
            : '尚未查找'}
        </code>
        <ArrowRight size={18} />
        <output>{performed ? read.output : '—'}</output>
      </div>
      {performed ? (
        <Feedback good={read.ok}>
          {!result.valid
            ? '输入格式错误属于失败，不应把它伪装成“正常查找但没有结果”。'
            : mode === 'fallback'
              ? 'None 和 Some(0) 经 unwrap_or(0) 都得到 0，原来的存在信息已经丢失；这是默认值策略的取舍。'
              : mode === 'unwrap' && result.index < 0
                ? 'None 没有内部值；Rust unwrap() 会 panic。本模型展示失败，不在浏览器执行 Rust。'
                : result.value === 0
                  ? '确实找到偶数 0，它是 Some(0)，不能因为值是零就判断为缺失。'
                  : result.index < 0
                    ? 'match 明确处理 None 分支；没有结果与找到零是不同情况。'
                    : '已经找到第一个偶数，后面的元素不再检查；当前结果确实存在。'}
        </Feedback>
      ) : (
        <p className="value-note">查找不到偶数是正常缺失；不能用合法的 0 兼任“没找到”的标记。</p>
      )}
    </Bench>
  );
}
