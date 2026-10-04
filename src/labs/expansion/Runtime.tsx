import { useState } from 'react';
import { ArrowRight, Play, Plus, Trash2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { gilTimeline } from '../../domain/gil-timeline.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';
import './mechanics.css';

export default function Runtime({ lesson }: LabProps) {
  const [cursor, setCursor] = useState(0),
    [closed, setClosed] = useState(false);
  const [mode, setMode] = useState('gil'),
    [tick, setTick] = useState(0);
  const [frames, setFrames] = useState(1),
    [root, setRoot] = useState(true),
    [collected, setCollected] = useState(false);
  const [items, setItems] = useState([1, 2]),
    [snapshot, setSnapshot] = useState<number[]>([1, 2]),
    [view, setView] = useState('readonly');
  const reset = () => {
    setCursor(0);
    setClosed(false);
    setTick(0);
    setFrames(1);
    setRoot(true);
    setCollected(false);
    setItems([1, 2]);
    setSnapshot([1, 2]);
  };
  const slug = lesson.slug;
  const lanes = gilTimeline(mode, tick);
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="调度与生命周期教学模型；输出是当前规则的结果，不是 Python/JVM 的实时执行日志。"
      onReset={reset}
    >
      {slug === 'python-iterators-generators' ? (
        <>
          <div className="exp-tape">
            {[0, 1, 2].map((n) => (
              <div key={n} className={n < cursor ? 'consumed' : ''}>
                <small>yield 第 {n + 1} 次</small>
                <strong>{n * n}</strong>
                <span>{n < cursor ? '已取走' : '尚未执行'}</span>
              </div>
            ))}
          </div>
          <div className="exp-counter">
            <small>生成器状态</small>
            <strong>{closed ? 'Closed' : cursor ? 'Suspended' : 'Created'}</strong>
            <span>
              {closed
                ? 'next() → StopIteration'
                : cursor
                  ? `上次产出 ${(cursor - 1) ** 2}，暂停在 yield 后`
                  : '创建对象还没有执行函数体'}
            </span>
          </div>
          <div className="exp-actions">
            <button
              disabled={closed}
              onClick={() => (cursor < 3 ? setCursor(cursor + 1) : setClosed(true))}
            >
              <Play size={16} />
              next(generator)
            </button>
            <button
              onClick={() => {
                setCursor(0);
                setClosed(false);
              }}
            >
              <Plus size={16} />
              新建生成器
            </button>
          </div>
          <Feedback>
            同一个迭代器只会向前消费，不会因再次 for 循环自动重置。第三次 yield
            后，还需再请求一次才能观察函数返回与 StopIteration。
          </Feedback>
        </>
      ) : slug === 'python-gil-concurrency' ? (
        <>
          <Choice
            label="执行环境"
            value={mode}
            options={[
              ['gil', '普通 CPython · CPU 字节码'],
              ['free', '可选 free-threaded 构建'],
              ['io', 'I/O 等待时释放 GIL'],
            ]}
            onChange={(v) => {
              setMode(v);
              setTick(0);
            }}
          />
          <div className="gil-clock">
            <span>观测拍 {tick} / 8</span>
            <b>
              {!tick
                ? '尚未调度'
                : mode === 'free'
                  ? '无 GIL · 模型允许同时执行'
                  : `本拍 GIL 执行权：线程 ${mode === 'io' || tick % 2 === 0 ? 'B' : 'A'}`}
            </b>
          </div>
          <div className="gil-timeline">
            {['线程 A', '线程 B'].map((name, i) => (
              <div key={name} data-thread={i}>
                <header>
                  <b>{name}</b>
                  <span>
                    执行字节码 <strong>{lanes[i].cpu}</strong> 拍
                  </span>
                </header>
                <div className="gil-beats" aria-label={`${name}的逐拍状态`}>
                  {lanes[i].cells.map((cell, beat) => (
                    <div key={beat} className={`${cell} ${beat === tick - 1 ? 'current' : ''}`}>
                      <small>{beat + 1}</small>
                      <b>
                        {cell === 'cpu'
                          ? '执行'
                          : cell === 'io'
                            ? 'I/O'
                            : cell === 'waiting'
                              ? '等待'
                              : '·'}
                      </b>
                    </div>
                  ))}
                </div>
                <p>
                  {lanes[i].current === 'cpu'
                    ? '本拍执行 Python 字节码'
                    : lanes[i].current === 'io'
                      ? '等待 I/O，已释放 GIL；CPU 执行拍数没有增加'
                      : lanes[i].current === 'waiting'
                        ? '等待 GIL 执行权；CPU 执行拍数没有增加'
                        : '就绪，尚未开始'}
                </p>
              </div>
            ))}
          </div>
          <div className="exp-actions">
            <button disabled={tick === 8} onClick={() => setTick(tick + 1)}>
              <Play size={16} />
              推进一个调度拍
            </button>
          </div>
          <Feedback>
            {mode === 'gil'
              ? '两个线程可以并发推进，但普通 CPython 中这里只允许一个线程执行 Python 字节码。'
              : mode === 'free'
                ? '模型假设有足够核心允许两线程同时执行；真实并行还取决于扩展兼容性和对象竞争。无 GIL 不代表无需同步。'
                : '本例 A 在八拍内始终等待 I/O，B 持续计算。等待重叠不证明两个 CPU 密集线程能并行执行字节码。'}{' '}
            交替顺序与等长调度拍都是示意，不是 CPython 的真实切换周期，也不用于速度预测。
          </Feedback>
        </>
      ) : slug === 'java-jvm-memory' ? (
        <>
          <div className="exp-memory">
            <div>
              <h4>线程私有 · JVM 栈</h4>
              {Array.from({ length: frames }, (_, i) => (
                <div key={i} className="active">
                  frame {i + 1} · {root && !collected ? '引用指向 User' : '无 User 根引用'}
                </div>
              ))}
              <button disabled={frames === 3} onClick={() => setFrames(frames + 1)}>
                <Plus size={16} />
                调用方法
              </button>
              <button disabled={frames === 1} onClick={() => setFrames(frames - 1)}>
                <Trash2 size={16} />
                方法返回
              </button>
            </div>
            <div>
              <h4>共享 · 堆对象</h4>
              <div className={collected ? 'blocked' : root ? 'active' : ''}>
                {collected ? '已回收（模型）' : 'User 对象'}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={root}
                  disabled={collected}
                  onChange={(e) => setRoot(e.target.checked)}
                />
                仍有可达根引用
              </label>
              <button disabled={root || collected} onClick={() => setCollected(true)}>
                <Trash2 size={16} />
                执行模型中的 GC
              </button>
            </div>
          </div>
          <Feedback>
            引用是局部变量中的值；被引用对象不是因此就在栈中。栈帧返回不直接等于对象析构。这里不模拟
            JIT 逃逸分析、GC 时机或真实堆布局。
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="接收者视角"
            value={view}
            options={[
              ['readonly', 'List · 只读视图'],
              ['snapshot', 'toList() · 快照'],
            ]}
            onChange={setView}
          />
          <div className="exp-circuit">
            <div className="active">
              <small>val source: MutableList</small>
              <strong>[{items.join(', ')}]</strong>
            </div>
            <ArrowRight />
            <div>
              <small>{view === 'readonly' ? 'val view: List' : 'val snapshot: List'}</small>
              <strong>[{(view === 'readonly' ? items : snapshot).join(', ')}]</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button
              disabled={items.length === 5}
              onClick={() => setItems([...items, items.length + 1])}
            >
              <Plus size={16} />
              source.add(...)
            </button>
            <button onClick={() => setSnapshot([...items])}>
              <Plus size={16} />
              重新获取快照
            </button>
          </div>
          <Feedback>
            val 禁止给变量重新赋值，不禁止修改 MutableList。List 接口没有
            add，但可与可变集合共享同一对象；toList() 隔离此例的集合结构，不深拷贝可变元素。
          </Feedback>
        </>
      )}
    </Bench>
  );
}
