import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { schedulingJobs, simulateScheduling } from '../../domain/scheduling.mjs';
import './scheduling.css';
import './systems-quality.css';

const initialBursts = [5, 2, 1];

export default function Scheduling() {
  const [bursts, setBursts] = useState(initialBursts);
  const [policy, setPolicy] = useState<'fcfs' | 'rr'>('rr');
  const [quantum, setQuantum] = useState(2);
  const [revealed, setRevealed] = useState(0);
  const result = useMemo(
    () => simulateScheduling(bursts, policy, quantum),
    [bursts, policy, quantum],
  );
  const current = result.slices[revealed - 1];

  function updateBurst(index: number, delta: number) {
    setBursts((previous) =>
      previous.map((value, i) => (i === index ? Math.max(1, Math.min(8, value + delta)) : value)),
    );
    setRevealed(0);
  }

  function reset() {
    setBursts(initialBursts);
    setPolicy('rr');
    setQuantum(2);
    setRevealed(0);
  }

  return (
    <Experiment
      title="就绪队列调度台"
      subtitle="A、B、C 同时到达；单核、无 I/O，忽略切换开销。"
      onReset={reset}
      className="scheduling-lab"
    >
      <div className="sched-controls">
        <div className="sched-policy" role="group" aria-label="调度策略">
          <button
            aria-pressed={policy === 'fcfs'}
            onClick={() => {
              setPolicy('fcfs');
              setRevealed(0);
            }}
          >
            FCFS
          </button>
          <button
            aria-pressed={policy === 'rr'}
            onClick={() => {
              setPolicy('rr');
              setRevealed(0);
            }}
          >
            RR
          </button>
        </div>
        <div className="sched-quantum" role="group" aria-label="RR 时间片">
          <span>时间片</span>
          {[1, 2, 3, 4].map((value) => (
            <button
              key={value}
              aria-pressed={quantum === value}
              disabled={policy === 'fcfs'}
              onClick={() => {
                setQuantum(value);
                setRevealed(0);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="sched-jobs" aria-label="任务运行时间">
        {schedulingJobs.map((job, index) => (
          <div className="sched-job" key={job}>
            <span className={`sched-job-mark sched-job-${job.toLowerCase()}`}>{job}</span>
            <span>运行 {bursts[index]} 单位</span>
            <div className="sched-stepper">
              <button
                aria-label={`减少任务 ${job} 运行时间`}
                title="减少运行时间"
                disabled={bursts[index] === 1}
                onClick={() => updateBurst(index, -1)}
              >
                <Minus size={15} />
              </button>
              <button
                aria-label={`增加任务 ${job} 运行时间`}
                title="增加运行时间"
                disabled={bursts[index] === 8}
                onClick={() => updateBurst(index, 1)}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sched-stage">
        <div className="sched-stage-heading">
          <strong>CPU 时间线</strong>
          <span>
            {revealed} / {result.slices.length} 段
          </span>
        </div>
        <div className="sched-current-queue" aria-label="最近运行段与下一轮就绪队列">
          <span>最近运行</span>
          <b data-running={Boolean(current?.queue.length)}>{current?.job ?? '尚未开始'}</b>
          <span>下一轮就绪</span>
          {(current?.queue ?? schedulingJobs).map((job) => (
            <b key={job}>{job}</b>
          ))}
          {current?.queue.length === 0 && <span>全部任务结束</span>}
        </div>
        <div className="sched-scroll">
          <div
            className="sched-timeline"
            style={{
              gridTemplateColumns: result.slices
                .map((slice) => `${slice.end - slice.start}fr`)
                .join(' '),
              minWidth: Math.max(460, result.slices.length * 66),
            }}
            aria-label={`${policy} 调度的 CPU 时间线`}
          >
            {result.slices.map((slice, index) => (
              <div
                className={`sched-slice sched-slice-${slice.job.toLowerCase()}`}
                data-visible={index < revealed}
                data-current={index === revealed - 1}
                key={`${slice.job}-${slice.start}`}
              >
                <strong>{slice.job}</strong>
                <small>
                  {slice.start}–{slice.end}
                </small>
              </div>
            ))}
          </div>
        </div>
        <div className="sched-trace" aria-live="polite">
          {current ? (
            <>
              <strong>
                {current.job} 运行 [{current.start}, {current.end})
              </strong>
              <span>
                剩余 {current.remaining}；下一轮就绪队列：{current.queue.join(' → ') || '空'}
              </span>
            </>
          ) : (
            <>
              <strong>时刻 0，队列 A → B → C</strong>
              <span>选择“下一段”观察谁先取得 CPU。</span>
            </>
          )}
        </div>
        <div className="sched-actions">
          <button disabled={revealed === 0} onClick={() => setRevealed((value) => value - 1)}>
            <ArrowLeft size={16} />
            上一段
          </button>
          <button
            disabled={revealed === result.slices.length}
            onClick={() => setRevealed((value) => value + 1)}
          >
            下一段
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="sched-metrics">
        <strong>本轮结果</strong>
        <div className="sched-table-scroll">
          <table>
            <thead>
              <tr>
                <th>任务</th>
                <th>首次运行</th>
                <th>完成</th>
                <th>等待</th>
                <th>周转</th>
                <th>响应</th>
              </tr>
            </thead>
            <tbody>
              {result.metrics.map((row) => (
                <tr key={row.job}>
                  <th>{row.job}</th>
                  <td>{row.first}</td>
                  <td>{row.completion}</td>
                  <td>{row.waiting}</td>
                  <td>{row.turnaround}</td>
                  <td>{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>等待 = 周转 − 运行时间；所有任务都在时刻 0 到达。</p>
      </div>
    </Experiment>
  );
}
