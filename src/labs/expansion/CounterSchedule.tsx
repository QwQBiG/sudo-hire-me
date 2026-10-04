import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Play, Square, Undo2, Check, Cpu } from 'lucide-react';
import {
  advanceCounter,
  counterEnabled,
  counterOutcomes,
  createCounter,
  type CounterStrategy,
} from '../../domain/counter-schedule.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import type { LabProps } from '../../types';
import './expansion.css';
import './mechanics.css';

const operations = ['读取', '计算', '写入'];
export default function CounterSchedule({ lesson }: LabProps) {
  const [strategy, setStrategy] = useState<CounterStrategy>('volatile');
  const [history, setHistory] = useState(() => [createCounter()]);
  const [replay, setReplay] = useState<number[]>([]);
  const state = history[history.length - 1];
  const playing = history.length - 1 < replay.length;
  const complete = state.threads.every((t) => t.phase === 3);
  const outcomes = counterOutcomes(strategy);
  const reset = (next = strategy) => {
    setReplay([]);
    setHistory([createCounter(next)]);
  };
  useEffect(() => {
    if (!playing) return;
    const thread = replay[history.length - 1];
    const timer = window.setTimeout(() => {
      setHistory((previous) => [
        ...previous,
        advanceCounter(previous[previous.length - 1], thread),
      ]);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [playing, replay, history.length]);
  const start = (order: number[]) => {
    setHistory([createCounter(strategy)]);
    setReplay(order);
  };
  return (
    <Bench
      className="expansion schedule-lab"
      title={lesson.title}
      onReset={() => reset()}
      subtitle="两线程各递增一次的交错模型；线程内部顺序固定，调度顺序由你选择。不是 JVM 实时运行。"
    >
      <Choice
        label="计数器实现"
        value={strategy}
        options={[
          ['volatile', 'volatile · 读改写可交错'],
          ['locked', 'synchronized · 同一把锁'],
          ['atomic', 'AtomicInteger · 原子递增'],
        ]}
        onChange={(value) => {
          const next = value as CounterStrategy;
          setStrategy(next);
          reset(next);
        }}
      />
      <div className="schedule-register">
        <div>
          <Cpu size={18} />
          <span>
            共享计数器 <code>count</code>
          </span>
        </div>
        <output aria-label="共享计数器值">{state.count}</output>
        <span className={complete && state.count !== 2 ? 'schedule-loss' : ''}>
          {complete ? (state.count === 2 ? '两次更新都保留' : '一次更新被覆盖') : '目标最终值 2'}
        </span>
        <div className="schedule-lock">
          <LockKeyhole size={16} />
          {strategy === 'locked'
            ? state.owner === null
              ? '监视器空闲'
              : `线程 ${state.owner ? 'B' : 'A'} 持锁`
            : strategy === 'atomic'
              ? '一次递增不可拆开交错'
              : '可见性 ≠ 复合操作原子性'}
        </div>
      </div>
      <div className="schedule-threads">
        {state.threads.map((thread, id) => {
          const blocked = strategy === 'locked' && state.owner !== null && state.owner !== id;
          return (
            <div
              className={`schedule-thread ${blocked ? 'waiting' : ''}`}
              key={id}
              data-thread={id}
            >
              <header>
                <b>线程 {id ? 'B' : 'A'}</b>
                <span>{thread.phase === 3 ? '已完成' : blocked ? '等待同一监视器' : '可调度'}</span>
              </header>
              <div className="schedule-local">
                <small>
                  {strategy === 'atomic' ? (
                    '递增返回值'
                  ) : (
                    <>
                      线程局部值 <code>local</code>
                    </>
                  )}
                </small>
                <strong>{thread.local ?? '—'}</strong>
              </div>
              <div className="schedule-program">
                {(strategy === 'atomic' ? ['incrementAndGet'] : operations).map(
                  (operation, index) => (
                    <span
                      key={operation}
                      className={
                        thread.phase === 3 || index < thread.phase
                          ? 'done'
                          : index === thread.phase
                            ? 'current'
                            : ''
                      }
                    >
                      {thread.phase === 3 || index < thread.phase ? (
                        <Check size={13} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                      {operation}
                    </span>
                  ),
                )}
              </div>
              <button
                disabled={playing || !counterEnabled(state, id)}
                onClick={() => {
                  setReplay([]);
                  setHistory((previous) => [
                    ...previous,
                    advanceCounter(previous[previous.length - 1], id),
                  ]);
                }}
              >
                <Play size={15} />
                调度线程 {id ? 'B' : 'A'}
                <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="exp-actions">
        {playing ? (
          <button onClick={() => setReplay([])}>
            <Square size={15} />
            停止回放
          </button>
        ) : (
          <>
            <button onClick={() => start(strategy === 'atomic' ? [0, 1] : [0, 0, 0, 1, 1, 1])}>
              <Play size={15} />
              回放串行调度
            </button>
            {strategy === 'volatile' ? (
              <button onClick={() => start([0, 1, 0, 1, 0, 1])}>
                <Play size={15} />
                重现覆盖写
              </button>
            ) : null}
          </>
        )}
        <button
          disabled={playing || history.length === 1}
          onClick={() => {
            setReplay([]);
            setHistory((previous) => previous.slice(0, -1));
          }}
          title="撤销最后一次调度"
        >
          <Undo2 size={15} />
          撤销
        </button>
      </div>
      <div className="schedule-evidence">
        <div className="schedule-trace">
          <h4>
            执行证据 <small>{state.events.length} 条操作</small>
          </h4>
          {state.events.length ? (
            <ol>
              {state.events.map((event, index) => (
                <li key={index} data-thread={event.thread}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <b>{event.thread ? 'B' : 'A'}</b>
                  <code>{event.operation}</code>
                  <small>count = {event.count}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p>count = 0；A、B 都尚未读取。</p>
          )}
        </div>
        <div className="schedule-outcomes">
          <h4>全部模型交错</h4>
          {outcomes.map((result) => (
            <div key={result.value}>
              <span>
                最终值 <b>{result.value}</b>
              </span>
              <strong>{result.schedules}</strong>
              <small>条合法调度</small>
            </div>
          ))}
          <p>固定两线程与操作粒度的穷举数量，不是运行概率，也不覆盖全部 Java 内存模型行为。</p>
        </div>
      </div>
      <Feedback good={!complete || state.count === 2}>
        {complete
          ? strategy === 'atomic'
            ? '两次 incrementAndGet() 各自作为整体执行，返回 1、2；跨字段不变量仍不能由单个原子计数器自动保证。'
            : strategy === 'locked'
              ? '同一把监视器锁覆盖完整读、改、写，第二个线程在第一次递增完成后才能读取，最终得到 2。'
              : state.count === 2
                ? '这次得到 2；一次正确输出并不能证明 volatile count++ 对所有交错安全。'
                : 'A、B 都读到了旧值，各自算出 1，后写入覆盖前写入；volatile 没有把递增变成原子操作。'
          : state.events.at(-1)
            ? `最近操作：线程 ${state.events.at(-1)!.thread ? 'B' : 'A'} ${state.events.at(-1)!.operation}。`
            : strategy === 'atomic'
              ? 'incrementAndGet() 把递增作为原子更新；显示的是递增返回值，不暴露可交错的局部计算步骤。'
              : '读取只复制到线程局部值，计算也不修改共享 count；只有写入才改变它。'}
      </Feedback>
    </Bench>
  );
}
