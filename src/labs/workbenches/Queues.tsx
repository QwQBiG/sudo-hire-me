import { useState } from 'react';
import { Clock3, Plus, Server } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback, Meter } from './Bench';

export default function Queues({ lesson }: LabProps) {
  const s = lesson.slug;
  const back = s === 'backpressure-basics';
  const balance = s === 'load-balancing-basics';
  const bulk = s === 'bulkhead-failure-isolation';
  const [mode, setMode] = useState('first');
  const [running, setRunning] = useState<(string | null)[]>([null, null, null]);
  const [queue, setQueue] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [loads, setLoads] = useState([0, 0, 0]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [arrival, setArrival] = useState(5);
  const [capacity, setCapacity] = useState(2);
  const [note, setNote] = useState('增加请求，观察处理位置、等待空间与拒绝结果。');
  function reset() {
    setRunning([null, null, null]);
    setQueue([]);
    setCount(0);
    setRejected(0);
    setLoads([0, 0, 0]);
    setCompleted([]);
    setNote('服务队列已清空。');
  }
  const title = back
    ? '让上游速度服从下游容量'
    : balance
      ? '给下一条请求选择服务实例'
      : bulk
        ? '隔离慢服务占据的工作槽'
        : '线程都忙时，新任务去哪儿';
  if (back)
    return (
      <Bench
        title={title}
        subtitle="离散时间模型：每拍先消费，再生成；有界缓冲区容量 8。"
        onReset={reset}
      >
        <Choice
          label="过载处理"
          value={mode}
          options={[
            ['first', '超过容量直接丢弃'],
            ['pressure', '背压：暂停多余生产'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="bench-controls">
          <label>
            上游计划生成 {arrival} / 拍
            <input
              type="range"
              min={1}
              max={8}
              value={arrival}
              onChange={(e) => setArrival(Number(e.target.value))}
            />
          </label>
          <label>
            下游最多消费 {capacity} / 拍
            <input
              type="range"
              min={1}
              max={5}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="pressure-flow">
          <div>
            <small>上游</small>
            <strong>{arrival}</strong>
          </div>
          <div className="pipe-tube">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={i < queue.length ? 'full' : ''}>
                {i < queue.length ? '●' : '·'}
              </span>
            ))}
          </div>
          <div>
            <small>下游</small>
            <strong>{capacity}</strong>
          </div>
        </div>
        <button
          className="primary"
          onClick={() => {
            const remaining = Math.max(0, queue.length - capacity);
            const accepted = Math.min(arrival, 8 - remaining);
            setQueue(Array.from({ length: remaining + accepted }, (_, i) => String(i)));
            setCount(count + 1);
            setRejected(rejected + arrival - accepted);
            setNote(
              mode === 'first'
                ? `本拍生成 ${arrival}，放入 ${accepted}，丢弃 ${arrival - accepted}。`
                : `本拍只允许生成 ${accepted}，其余 ${arrival - accepted} 个生产意图被延后，不是生成后丢弃。`,
            );
          }}
        >
          <Clock3 size={16} />
          运行一拍
        </button>
        <Meter
          label={`${count} 拍累计${mode === 'first' ? '丢弃' : '延后生产'} ${rejected}`}
          value={queue.length}
          max={8}
        />
        <Feedback>{note} 长期到达率超过服务率时，增大缓冲区只能推迟过载。</Feedback>
      </Bench>
    );
  if (balance)
    return (
      <Bench
        title={title}
        subtitle="固定三个实例；连接由手动完成事件释放，演示调度决策而非预测真实延迟。"
        onReset={reset}
      >
        <Choice
          label="调度策略"
          value={mode}
          options={[
            ['first', '轮询 Round Robin'],
            ['least', '最少连接'],
          ]}
          onChange={setMode}
        />
        <div className="server-fleet">
          {loads.map((n, i) => (
            <div key={i}>
              <Server size={28} />
              <span>Instance {String.fromCharCode(65 + i)}</span>
              <strong>{n}</strong>
              <small>活跃连接</small>
              <button
                className="secondary"
                disabled={!n}
                onClick={() => setLoads((xs) => xs.map((v, j) => (j === i ? v - 1 : v)))}
              >
                完成一个连接
              </button>
            </div>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              const target = mode === 'first' ? count % 3 : loads.indexOf(Math.min(...loads));
              setLoads((xs) => xs.map((v, i) => (i === target ? v + 1 : v)));
              setCount(count + 1);
              setNote(
                `本次选择 ${String.fromCharCode(65 + target)}。${mode === 'first' ? '仅按轮次，不检查它当前有多忙。' : '检查活跃连接数；相同时本例优先较前实例。连接少也不一定意味着 CPU 工作量少。'}`,
              );
            }}
          >
            <Plus size={16} />
            分配新连接
          </button>
        </div>
        <Feedback>{note}</Feedback>
      </Bench>
    );
  function submit(kind = 'job') {
    const id = `${kind === 'slow' ? 'A' : kind === 'fast' ? 'B' : 'J'}${count + 1}`;
    setCount(count + 1);
    const indexes =
      bulk && mode === 'isolate' ? (kind === 'slow' ? [0, 1] : [2]) : bulk ? [0, 1, 2] : [0, 1];
    const free = indexes.find((i) => running[i] === null);
    if (free !== undefined) {
      setRunning((xs) => xs.map((v, i) => (i === free ? id : v)));
      setNote(`${id} 获得一个工作槽。`);
    } else if (!bulk && queue.length < 4) {
      setQueue([...queue, id]);
      setNote(`${id} 进入有界等待队列。`);
    } else {
      setRejected(rejected + 1);
      setNote(`${id} 当前无法获得容量，触发拒绝 / 上游限流。`);
    }
  }
  function finish(index: number) {
    const done = running[index];
    if (done) setCompleted((jobs) => [...jobs, done].slice(-8));
    const next = queue[0] ?? null;
    setRunning((xs) => xs.map((v, i) => (i === index ? next : v)));
    setQueue(queue.slice(1));
    setNote(next ? `旧任务完成，等待的 ${next} 立即接替。` : '旧任务完成，工作槽空闲。');
  }
  return (
    <Bench
      title={title}
      subtitle={
        bulk
          ? '慢下游 A 的任务一直占槽，直到手动完成；可比较共用池与 A/B 独立额度。'
          : '固定 2 个工作线程、等待队列容量 4；点击运行任务即可模拟完成。'
      }
      onReset={reset}
    >
      {bulk && (
        <Choice
          label="资源边界"
          value={mode}
          options={[
            ['first', '共用 3 个槽'],
            ['isolate', 'A 最多 2，B 独享 1'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
      )}
      <div className="worker-slots">
        {running.slice(0, bulk ? 3 : 2).map((job, i) => (
          <button key={i} disabled={!job} onClick={() => finish(i)} className={job ? 'busy' : ''}>
            <Server size={27} />
            <small>
              {bulk && mode === 'isolate' ? (i === 2 ? 'B 专用' : 'A 专用') : `Worker ${i + 1}`}
            </small>
            <strong data-token-id={job ?? undefined}>{job ?? '空闲'}</strong>
            <div className="worker-process" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>{job ? '点击完成' : '等待任务'}</span>
          </button>
        ))}
      </div>
      {!bulk && (
        <>
          <div className="bench-label">等待队列 · {queue.length} / 4</div>
          <div className="bench-tokens">
            {Array.from({ length: 4 }, (_, i) => (
              <span
                className={`bench-token ${queue[i] ? 'active' : ''}`}
                key={queue[i] ?? `empty-${i}`}
                data-token-id={queue[i]}
              >
                {queue[i] ?? '·'}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="bench-actions">
        <button className="primary" onClick={() => submit(bulk ? 'slow' : 'job')}>
          <Plus size={16} />
          {bulk ? '慢下游 A 请求' : '新任务'}
        </button>
        {bulk && (
          <button className="secondary" onClick={() => submit('fast')}>
            快下游 B 请求
          </button>
        )}
      </div>
      <div className="completed-jobs">
        <div className="bench-label">
          已完成 · {completed.length}
          {completed.length === 8 ? '（最近 8 个）' : ''}
        </div>
        <div className="bench-tokens">
          {completed.length ? (
            completed.map((job) => (
              <span className="bench-token done" key={job} data-token-id={job}>
                {job}
              </span>
            ))
          ) : (
            <span className="queue-empty">等待任务完成</span>
          )}
        </div>
      </div>
      <Feedback good={!rejected}>
        {note} 累计拒绝 {rejected} 次。
      </Feedback>
    </Bench>
  );
}
