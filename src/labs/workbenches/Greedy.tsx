import { useState } from 'react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';
import './workbench-quality.css';

const activities = [
  { name: 'A', start: 0, end: 5 },
  { name: 'B', start: 1, end: 2 },
  { name: 'C', start: 2, end: 3 },
  { name: 'D', start: 3, end: 4 },
  { name: 'E', start: 4, end: 5 },
];
export default function Greedy(_props: LabProps) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState('每次选择不与已选活动重叠的一项，试着安排尽可能多的活动。');
  const selected = activities.filter((x) => chosen.includes(x.name));
  function applyRule(rule: 'start' | 'finish') {
    const ordered = [...activities].sort((a, b) =>
      rule === 'start' ? a.start - b.start : a.end - b.end || a.start - b.start,
    );
    let end = -Infinity;
    const result: string[] = [];
    for (const activity of ordered) {
      if (activity.start < end) continue;
      result.push(activity.name);
      end = activity.end;
    }
    setChosen(result);
    setNote(
      `${rule === 'start' ? '最早开始' : '最早结束'}规则得到 ${result.join(' → ')}，共 ${result.length} 项。`,
    );
  }
  const overlap = (a: (typeof activities)[number]) =>
    selected.some((b) => a.start < b.end && b.start < a.end);
  function choose(a: (typeof activities)[number]) {
    if (chosen.includes(a.name)) {
      setChosen(chosen.filter((n) => n !== a.name));
      setNote(`移除 ${a.name}，它占据的时间可重新分配。`);
    } else if (overlap(a)) {
      setNote(`${a.name} 与已选活动重叠，不能共用这间会议室。`);
    } else {
      setChosen([...chosen, a.name]);
      setNote(`已安排 ${a.name}。较早结束的活动通常为后续留下更多时间。`);
    }
  }
  return (
    <Bench
      title="在同一间会议室安排最多活动"
      subtitle="半开区间 [start, end)，相邻端点允许衔接；目标只计算活动数量。"
      onReset={() => {
        setChosen([]);
        setNote('日程已清空。');
      }}
    >
      <div className="schedule-axis">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
      <div className="schedule-lanes">
        {activities.map((a) => (
          <div className="schedule-lane" key={a.name}>
            <button
              className={chosen.includes(a.name) ? 'chosen' : overlap(a) ? 'conflict' : ''}
              style={{ left: `${a.start * 20}%`, width: `${(a.end - a.start) * 20}%` }}
              onClick={() => choose(a)}
              aria-pressed={chosen.includes(a.name)}
              aria-label={`活动 ${a.name}，区间 ${a.start} 到 ${a.end}${overlap(a) && !chosen.includes(a.name) ? '，与当前安排冲突' : ''}`}
            >
              <strong>{a.name}</strong>
              <span>
                {a.start}—{a.end}
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="bench-actions">
        <button className="secondary" onClick={() => applyRule('start')}>
          比较：最早开始
        </button>
        <button className="primary" onClick={() => applyRule('finish')}>
          比较：最早结束
        </button>
      </div>
      <div className="bench-grid">
        <div className="bench-stat">
          <small>已选活动</small>
          <strong>{chosen.length} / 4</strong>
        </div>
        <div className="bench-stat">
          <small>当前日程</small>
          <strong>
            {selected
              .sort((a, b) => a.start - b.start)
              .map((x) => x.name)
              .join(' → ') || '空'}
          </strong>
        </div>
      </div>
      <Feedback>
        {chosen.length === 4
          ? '达到最优数量 4：B、C、D、E。按结束时间从早到晚选择兼容活动，可以用交换论证证明这一问题的最优性。'
          : note + ' 先选耗时很长的 A，再比较先选 B 的结果。'}
      </Feedback>
    </Bench>
  );
}
