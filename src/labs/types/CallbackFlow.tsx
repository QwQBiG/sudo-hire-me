import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, Minus, Pause, Play, StepForward, RotateCcw } from 'lucide-react';
import type { LabProps } from '../../types';
import { callbackFlow } from '../../domain/type-flow.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './type-scenes.css';

export default function CallbackFlow({ lesson }: LabProps) {
  const [text, setText] = useState('[2,3,4,5]'),
    [rule, setRule] = useState('even');
  const [threshold, setThreshold] = useState(3),
    [signature, setSignature] = useState(true);
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false);
  const generation = useRef(0);
  const result = callbackFlow(text, rule, threshold, step, signature);
  const active = playing && result.valid && signature && step < result.total;
  const name = rule === 'even' ? 'is_even' : rule === 'over3' ? 'over_three' : 'over_limit';
  const flowName = rule === 'context' ? 'count_with_context' : 'count_if';
  const rewind = () => {
    generation.current++;
    setStep(0);
    setPlaying(false);
  };
  useEffect(() => {
    if (!active) return;
    const token = generation.current;
    const timer = window.setTimeout(() => {
      // Reject an event queued before a pause, restart or input change.
      if (token === generation.current) setStep((s) => Math.min(result.total, s + 1));
    }, 550);
    return () => window.clearTimeout(timer);
  }, [active, step, result.total]);
  return (
    <Bench
      className="type-scene callback-flow"
      title={lesson.title}
      subtitle="C 同步筛选计数的调用模型，不执行用户代码。每项分别进入谓词、返回并更新计数；动画速度不代表执行耗时。"
      onReset={() => {
        rewind();
        setText('[2,3,4,5]');
        setRule('even');
        setThreshold(3);
        setSignature(true);
      }}
    >
      <Choice
        label="筛选函数的回调"
        value={rule}
        options={[
          ['even', 'is_even'],
          ['over3', 'over_three'],
          ['context', 'over_limit + context'],
        ]}
        onChange={(next) => {
          rewind();
          setRule(next);
        }}
      />
      <label className="type-input">
        整数数组（JSON，最多 8 项，-99 到 99）
        <input
          value={text}
          maxLength={240}
          onChange={(e) => {
            rewind();
            setText(e.target.value);
          }}
        />
      </label>
      {rule === 'context' ? (
        <label className="callback-threshold">
          limit <b>{threshold}</b>
          <input
            type="range"
            min={-9}
            max={9}
            value={threshold}
            aria-label="回调阈值"
            onChange={(e) => {
              rewind();
              setThreshold(Number(e.target.value));
            }}
          />
        </label>
      ) : null}
      <label className="callback-signature">
        <input
          type="checkbox"
          checked={!signature}
          onChange={(e) => {
            rewind();
            setSignature(!e.target.checked);
          }}
        />
        签名错误反例：传入 double wrong(double)
      </label>
      <div className={`callback-binding ${signature ? '' : 'blocked'}`}>
        <small>{rule === 'context' ? '带上下文的接口版本' : '期望的函数指针类型'}</small>
        <code>{rule === 'context' ? 'int (*test)(int, const void *)' : 'int (*test)(int)'}</code>
        <span>{signature ? `test 指向 ${name}` : '签名不匹配；不能当作合法调用'}</span>
      </div>
      <div className="callback-controls">
        <button
          disabled={!result.valid || !signature || result.total === 0}
          aria-label={active ? '暂停回调演示' : '播放回调演示'}
          onClick={() => {
            generation.current++;
            if (step === result.total) setStep(0);
            setPlaying(!active);
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? '暂停' : '播放'}
        </button>
        <button
          disabled={active || !result.valid || !signature || step === result.total}
          onClick={() => setStep((s) => s + 1)}
          aria-label="推进一次调用事件"
          title="进入谓词或处理返回"
        >
          <StepForward size={17} />
        </button>
        <button onClick={rewind} aria-label="重放当前输入" title="重放当前输入">
          <RotateCcw size={17} />
        </button>
        <span>
          {result.completed} / {result.items.length} 项已返回
        </span>
      </div>
      <div className="callback-rail" aria-label="数组元素的回调状态">
        {result.items.map((item, index) => {
          const record = result.records[index],
            current = index === result.completed && result.phase === 'predicate';
          return (
            <div
              key={index}
              className={`${record ? 'returned' : ''} ${record?.matched ? 'matched' : ''} ${current ? 'calling' : ''}`}
            >
              <small>a[{index}]</small>
              <strong>{String(item)}</strong>
              <span>
                {record ? record.matched ? <Check size={14} /> : <Minus size={14} /> : null}
                {record ? String(Number(record.matched)) : current ? '调用中' : '未调用'}
              </span>
            </div>
          );
        })}
        {!result.items.length ? (
          <p>
            {!result.valid
              ? result.error
              : !signature
                ? '签名不匹配：没有合法调用'
                : '空数组：循环零次，计数返回 0'}
          </p>
        ) : null}
      </div>
      <div className="callback-runtime">
        <div className="callback-stack" aria-label="逻辑调用位置">
          <div>
            <small>发起者</small>
            <code>main()</code>
            <span>
              {!result.valid || !signature
                ? '尚无合法调用'
                : result.phase === 'done'
                  ? '收到最终计数'
                  : `等待 ${flowName} 返回`}
            </span>
          </div>
          <ArrowDown size={16} />
          <div className={result.phase === 'loop' || result.phase === 'ready' ? 'focused' : ''}>
            <small>通用遍历</small>
            <code>
              {flowName}(a, n, test{rule === 'context' ? ', &limit' : ''})
            </code>
            <span>
              {!result.valid || !signature
                ? '未进入循环'
                : result.phase === 'done'
                  ? '循环结束，返回 count'
                  : `i = ${result.completed}；决定何时调用 test`}
            </span>
          </div>
          <ArrowDown size={16} />
          <div className={result.phase === 'predicate' ? 'focused' : ''}>
            <small>传入的谓词</small>
            <code>
              {name}({result.phase === 'predicate' ? result.current : 'x'}
              {rule === 'context' ? ', &limit' : ''})
            </code>
            <span>
              {rule === 'even' ? 'x % 2 == 0' : `x > ${rule === 'over3' ? 3 : threshold}`}
            </span>
          </div>
        </div>
        <div className="callback-counter">
          <small>{flowName} 的局部计数</small>
          <output data-readout>{result.count}</output>
          <span>
            {result.phase === 'predicate' ? '谓词尚未返回，不提前加一' : '仅对非零返回值加一'}
          </span>
          <code>return {result.phase === 'done' ? result.count : '—'}</code>
        </div>
      </div>
      <div className="callback-returns">
        <h4>已经完成的返回</h4>
        {result.records.length ? (
          result.records.map((record) => (
            <div key={record.index}>
              <code>
                {name}({record.value}
                {rule === 'context' ? ', &limit' : ''}) → {Number(record.matched)}
              </code>
              <span>count = {record.count}</span>
            </div>
          ))
        ) : (
          <p>尚无谓词返回。</p>
        )}
      </div>
      <Feedback good={result.valid && signature}>
        {!result.valid
          ? '输入解析失败，不应当成循环正常返回 0。'
          : !signature
            ? '函数指针的参数和返回类型必须兼容；不能靠强制转换使错误签名的调用变安全。这里展示规则，不是编译器诊断。'
            : result.phase === 'predicate'
              ? `${flowName} 把当前元素交给传入函数；规则执行完返回，遍历才能继续。回调不必异步。`
              : rule === 'context'
                ? 'C 函数指针本身不捕获 limit；此接口另传有效的上下文指针，谓词显式读取它。'
                : '两种规则都可能计数为 2，但匹配的元素不同；复用的是遍历，不是判断规则。'}
      </Feedback>
    </Bench>
  );
}
