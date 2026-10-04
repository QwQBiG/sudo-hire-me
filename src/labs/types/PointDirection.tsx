import { useState, type CSSProperties } from 'react';
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Crosshair, Send, Undo2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { createPoint, movePoint, pointWindow, directions } from '../../domain/type-flow.mjs';
import { Bench, Feedback } from '../workbenches/Bench';
import './type-scenes.css';

const arrows = [ArrowUp, ArrowRight, ArrowDown, ArrowLeft];
export default function PointDirection({ lesson }: LabProps) {
  const [history, setHistory] = useState(() => [createPoint()]);
  const [x, setX] = useState(2),
    [y, setY] = useState(3),
    [raw, setRaw] = useState('99');
  const state = history[history.length - 1],
    last = state.records.at(-1),
    view = pointWindow(state.point);
  const validRaw = /^\d{1,2}$/.test(raw);
  const move = (direction: number) =>
    setHistory((previous) => [
      ...previous.slice(-23),
      movePoint(previous[previous.length - 1], direction),
    ]);
  const left = ((state.point.x - view.minX + 0.5) / 9) * 100;
  const top = ((view.maxY - state.point.y + 0.5) / 9) * 100;
  return (
    <Bench
      className="type-scene point-direction"
      title={lesson.title}
      subtitle="C 坐标更新模型，不是内存布局。正 x 向右，正 y 向上；坐标限制 -20 到 20，观察窗口跟随移动。"
      onReset={() => {
        setHistory([createPoint()]);
        setX(2);
        setY(3);
        setRaw('99');
      }}
    >
      <div className="point-origin">
        <label>
          初始 x <b>{x}</b>
          <input
            type="range"
            min={-4}
            max={4}
            value={x}
            aria-label="初始 x"
            onChange={(e) => setX(Number(e.target.value))}
          />
        </label>
        <label>
          初始 y <b>{y}</b>
          <input
            type="range"
            min={-4}
            max={4}
            value={y}
            aria-label="初始 y"
            onChange={(e) => setY(Number(e.target.value))}
          />
        </label>
        <button onClick={() => setHistory([createPoint(x, y)])}>
          <Crosshair size={16} /> 设置起点
        </button>
      </div>
      <div className="point-playfield">
        <div className="point-map">
          <header>
            <code>
              struct Point p = {'{'} {state.point.x}, {state.point.y} {'}'}
            </code>
            <span>
              <ArrowUp size={13} /> y
            </span>
          </header>
          <div
            className="point-grid"
            role="img"
            aria-label={`坐标图：当前 x=${state.point.x}，y=${state.point.y}`}
          >
            {Array.from({ length: 81 }, (_, index) => {
              const cx = view.minX + (index % 9),
                cy = view.maxY - Math.floor(index / 9);
              const visited = state.records.some(
                (r) => r.accepted && r.after.x === cx && r.after.y === cy,
              );
              return (
                <span
                  key={index}
                  className={`${cx === 0 || cy === 0 ? 'axis' : ''} ${visited ? 'visited' : ''}`}
                >
                  {cx === view.minX ? (
                    <small>{cy}</small>
                  ) : cy === view.minY ? (
                    <small>{cx}</small>
                  ) : null}
                </span>
              );
            })}
            <div
              className="point-marker"
              style={{ '--point-left': `${left}%`, '--point-top': `${top}%` } as CSSProperties}
            >
              <Crosshair size={22} />
            </div>
          </div>
          <footer>
            <span>
              x: {view.minX} … {view.maxX}
            </span>
            <span>
              y: {view.minY} … {view.maxY}
            </span>
            <span>
              x <ArrowRight size={13} />
            </span>
          </footer>
        </div>
        <div className="point-console">
          <div className="point-pad" role="group" aria-label="方向控制">
            {directions.map((direction, index) => {
              const Icon = arrows[index];
              return (
                <button
                  key={direction.name}
                  className={`direction-${direction.name.toLowerCase()}`}
                  aria-label={`移动 ${direction.name}`}
                  title={`${direction.name} = ${direction.value}`}
                  onClick={() => move(direction.value)}
                >
                  <Icon size={21} />
                  <code>{direction.name}</code>
                </button>
              );
            })}
            <div>
              <code>enum</code>
              <span>0 … 3</span>
            </div>
          </div>
          <div className="point-record" aria-label="结构体字段更新">
            <h4>同一份 struct Point</h4>
            {(['x', 'y'] as const).map((field) => (
              <div
                key={field}
                className={last && last.before[field] !== state.point[field] ? 'changed' : ''}
              >
                <code>p.{field}</code>
                <span>{last?.before[field] ?? state.point[field]}</span>
                <ArrowRight size={15} />
                <output data-readout>{state.point[field]}</output>
              </div>
            ))}
          </div>
          <button
            className="point-undo icon-button"
            title="撤销移动，最多保留 23 步"
            aria-label="撤销坐标移动"
            disabled={history.length === 1}
            onClick={() => setHistory((previous) => previous.slice(0, -1))}
          >
            <Undo2 size={18} />
          </button>
        </div>
      </div>
      <div className="point-branches" aria-label="枚举分支与更新规则">
        {directions.map((direction) => (
          <div
            key={direction.value}
            className={last?.accepted && last.direction === direction.value ? 'selected' : ''}
          >
            <small>{direction.value}</small>
            <code>case {direction.name}</code>
            <b>
              {direction.dx
                ? `${direction.dx > 0 ? '++' : '--'}p->x`
                : `${direction.dy > 0 ? '++' : '--'}p->y`}
            </b>
          </div>
        ))}
      </div>
      <div className="point-raw">
        <label>
          外部方向整数（0 … 99）
          <input
            inputMode="numeric"
            value={raw}
            maxLength={2}
            onChange={(e) => setRaw(e.target.value)}
          />
        </label>
        <button disabled={!validRaw} onClick={() => move(Number(raw))}>
          <Send size={16} /> 提交整数
        </button>
        <span>
          {validRaw
            ? Number(raw) <= 3
              ? `已命名：${directions[Number(raw)].name}`
              : '无命名方向，进入 default'
            : '需要 0 到 99 的整数'}
        </span>
      </div>
      <Feedback good={last?.accepted !== false}>
        {last
          ? last.accepted
            ? `${last.name} 只改变 ${last.before.x !== last.after.x ? 'x' : 'y'}；通过 p 的指针更新调用者的原记录。`
            : last.reason
          : '从 (2,3) 选择 EAST，预期 (3,3)。结构体组合字段；枚举命名可选方向，两者可以一起使用。'}
      </Feedback>
      <div className="point-ledger">
        <h4>最近 4 次移动</h4>
        {state.records.length ? (
          state.records.slice(-4).map((record, index) => (
            <div key={index}>
              <code>
                {record.name === 'UNKNOWN' ? `default (${record.direction})` : record.name}
              </code>
              <span>
                ({record.before.x},{record.before.y}) → ({record.after.x},{record.after.y})
              </span>
              <small>{record.accepted ? '更新记录' : '保持原值'}</small>
            </div>
          ))
        ) : (
          <p>尚未移动。</p>
        )}
      </div>
      <p className="type-note">
        格子展示坐标，不表示 struct 连续字节或 enum 的大小；超过演示范围被拒绝，不代表真实 C
        自动检查整数溢出。
      </p>
    </Bench>
  );
}
