import { useState } from 'react';
import { ArrowRight, Check, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { LabProps } from '../../types';
import { kotlinNullModel } from '../../domain/value-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './values.css';

const samples = [
  ['hi', 'hi', false],
  ['empty', '', false],
  ['null', 'hi', true],
  ['literal', 'null', false],
  ['surrogate', '\uD83D\uDE00', false],
] as const;
const operators = [
  ['safe', '?.length'],
  ['elvis', '?.length ?: fallback'],
  ['bang', '!!.length'],
] as const;
export default function KotlinNull({ lesson }: LabProps) {
  const [text, setText] = useState('hi'),
    [missing, setMissing] = useState(false),
    [mode, setMode] = useState('elvis'),
    [fallback, setFallback] = useState(0);
  const result = kotlinNullModel(text, missing, mode, fallback);
  return (
    <Bench
      className="value-scene kotlin-null"
      title={lesson.title}
      subtitle="Kotlin/JVM 规则模型，不是实际编译执行。String.length 统计 UTF-16 代码单元；空字符串是存在的值。"
      onReset={() => {
        setText('hi');
        setMissing(false);
        setMode('elvis');
        setFallback(0);
      }}
    >
      <div className="value-presets" role="group" aria-label="可空字符串示例">
        {samples.map(([id, value, isNull]) => (
          <button
            key={id}
            aria-pressed={missing ? isNull : !isNull && text === value}
            onClick={() => {
              setText(value);
              setMissing(isNull);
            }}
          >
            <code>{id === 'surrogate' ? 'U+1F600' : isNull ? 'null' : JSON.stringify(value)}</code>
          </button>
        ))}
      </div>
      <div className="nullable-input">
        <label>
          String 内容（空文本不是 null）
          <input
            value={text}
            maxLength={40}
            disabled={missing}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label>
          <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} />
          输入为 null
        </label>
      </div>
      <div className={`nullable-source ${missing ? 'absent' : ''}`}>
        <small>val text: String?</small>
        <code>{result.input}</code>
        <span>{missing ? '没有 String 对象' : '存在 String 对象'}</span>
      </div>
      <div className="utf16-units">
        <header>
          <b>UTF-16 代码单元</b>
          <span>length = {result.length ?? '不可读取'}</span>
        </header>
        <div>
          {result.units.length ? (
            result.units.map((unit, index) => (
              <span key={index}>
                <small>{index}</small>
                <code>{unit}</code>
              </span>
            ))
          ) : (
            <p>{missing ? 'null：不访问长度或内容' : '空字符串：0 个代码单元'}</p>
          )}
        </div>
      </div>
      <Choice label="观察的运算符" value={mode} options={operators} onChange={setMode} />
      <label className="nullable-default">
        fallback <b>{fallback}</b>
        <input
          type="range"
          min={0}
          max={9}
          value={fallback}
          aria-label="fallback"
          onChange={(e) => setFallback(Number(e.target.value))}
        />
      </label>
      <div className="nullable-lanes" aria-label="同一输入经过三种运算符">
        {operators.map(([id, label]) => {
          const lane = kotlinNullModel(text, missing, id, fallback);
          return (
            <div key={id} className={`${mode === id ? 'focused' : ''} ${!lane.ok ? 'failed' : ''}`}>
              <code>{label}</code>
              <ArrowRight size={17} />
              <span>
                {id === 'bang'
                  ? missing
                    ? '断言失败，不读取 length'
                    : '断言通过，读取 length'
                  : missing
                    ? '安全调用跳过 length'
                    : '读取 length'}
              </span>
              <ArrowRight size={17} />
              <output>{lane.output}</output>
            </div>
          );
        })}
      </div>
      <div className={`fallback-gate ${result.fallbackUsed ? 'used' : ''}`}>
        <span>{result.fallbackUsed ? <Check size={16} /> : <ShieldCheck size={16} />}</span>
        <b>
          {mode === 'elvis'
            ? result.fallbackUsed
              ? 'fallback 被求值'
              : 'fallback 未求值'
            : '当前表达式没有默认分支'}
        </b>
        <code>
          {mode === 'elvis'
            ? `text?.length ?: ${fallback}`
            : mode === 'safe'
              ? 'text?.length'
              : 'text!!.length'}
        </code>
      </div>
      <Feedback good={result.ok}>
        {!result.ok
          ? '!! 是非空断言；null 触发异常，并没有被转成空字符串。'
          : !missing && text.length === 0
            ? '空字符串的 length 是 0，不是 null；Elvis 不会因结果为 0 而使用 fallback。'
            : mode === 'elvis'
              ? result.fallbackUsed
                ? '安全调用产生 null，Elvis 才求值右侧。改变默认值可观察这一分支。'
                : '左侧已有长度结果，Elvis 不求值右侧。'
              : '安全调用与非空断言的失败语义不同；都不能把 null 与字符串 "null" 混为一谈。'}
      </Feedback>
      <p className="value-note">
        <TriangleAlert size={15} />
        平台类型和智能转换仍有各自边界；本模型不覆盖 Java 互操作或共享可变属性。
      </p>
    </Bench>
  );
}
