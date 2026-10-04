import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CarFront,
  Cog,
  Play,
  Undo2,
} from 'lucide-react';
import type { LabProps } from '../../types';
import { initialShapeContract, resizeShape, carDelegation } from '../../domain/oop-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './oop-scenes.css';

export default function ShapeContract({ lesson }: LabProps) {
  const [scene, setScene] = useState('subtype');
  const [kind, setKind] = useState('square');
  const [width, setWidth] = useState(2),
    [height, setHeight] = useState(3);
  const [history, setHistory] = useState(() => [initialShapeContract()]);
  const [engine, setEngine] = useState('fuel');
  const [call, setCall] = useState<'start' | 'move' | null>(null);
  const state = history[history.length - 1];
  const match =
    state.expected.width === state.actual.width && state.expected.height === state.actual.height;
  const result = call ? carDelegation(engine, call) : null;
  const reset = () => {
    setScene('subtype');
    setKind('square');
    setWidth(2);
    setHeight(3);
    setHistory([initialShapeContract()]);
    setEngine('fuel');
    setCall(null);
  };
  const resize = (dimension: 'width' | 'height', value: number) =>
    setHistory((previous) => [
      ...previous.slice(-15),
      resizeShape(previous[previous.length - 1], kind, dimension, value),
    ]);
  return (
    <Bench
      className="oop-scene shape-contract"
      title={lesson.title}
      onReset={reset}
      subtitle="Java 示例的行为模型：矩形契约要求独立设置宽高；数学分类不自动证明这份可变 API 可替代。"
    >
      <Choice
        label="类型关系"
        value={scene}
        options={[
          ['subtype', '继承 · 可替代性'],
          ['composition', '组合 · 委托'],
        ]}
        onChange={setScene}
      />
      {scene === 'subtype' ? (
        <>
          <Choice
            label="作为 Rectangle 使用的对象"
            value={kind}
            options={[
              ['square', '可变 Square 子类'],
              ['rectangle', '普通 Rectangle'],
            ]}
            onChange={(value) => {
              setKind(value);
              setHistory([initialShapeContract()]);
            }}
          />
          <div className="shape-inputs">
            {[
              { id: 'width', label: '宽度', value: width, update: setWidth },
              { id: 'height', label: '高度', value: height, update: setHeight },
            ].map(({ id, label, value, update }) => (
              <label key={id}>
                <span>
                  {label} <b>{value}</b>
                </span>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={value}
                  onChange={(event) => update(Number(event.target.value))}
                  aria-label={label}
                />
              </label>
            ))}
          </div>
          <div className="oop-controls">
            <button onClick={() => resize('width', width)}>
              <Play size={15} />
              setWidth({width})
            </button>
            <button onClick={() => resize('height', height)}>
              <Play size={15} />
              setHeight({height})
            </button>
            <button
              disabled={history.length === 1}
              onClick={() => setHistory((previous) => previous.slice(0, -1))}
            >
              <Undo2 size={15} />
              撤销 setter
            </button>
          </div>
          <div className="shape-comparison">
            {[state.expected, state.actual].map((shape, index) => (
              <section key={index} className={index === 1 && !match ? 'violated' : ''}>
                <header>
                  <b>
                    {index === 0
                      ? '父契约预期'
                      : kind === 'square'
                        ? 'Square 实际状态'
                        : 'Rectangle 实际状态'}
                  </b>
                  <small>{index === 0 ? '另一维保持不变' : '模型结果'}</small>
                </header>
                <div className="shape-plane">
                  <div
                    className="shape-geometry"
                    style={{
                      width: `calc(var(--shape-unit) * ${shape.width})`,
                      height: `calc(var(--shape-unit) * ${shape.height})`,
                    }}
                  >
                    <span>
                      {shape.width} × {shape.height}
                    </span>
                  </div>
                </div>
                <div className="shape-dimensions">
                  <code>
                    w={shape.width}, h={shape.height}
                  </code>
                  <output aria-label={index === 0 ? '预期面积' : '实际面积'}>
                    {shape.width * shape.height}
                  </output>
                  <small>面积 / 单位²</small>
                </div>
              </section>
            ))}
          </div>
          <div className="shape-verdict">
            <code>最近调用：{state.command}</code>
            <b>{match ? '本次观察符合契约' : '独立 setter 的后置条件被破坏'}</b>
          </div>
          <Feedback good={match}>
            {match
              ? '相同宽高的一个状态只能说明这次观察相同，不能证明所有操作都满足父契约。'
              : `父契约要求 (${state.expected.width}, ${state.expected.height})，对象却变成 (${state.actual.width}, ${state.actual.height})。违反的是独立修改的行为约定，不是“正方形在数学上属于矩形”。`}
          </Feedback>
          <div className="shape-alternative">
            <h4>如果调用方只需要 area()</h4>
            <div>
              <code>Rectangle(w,h)</code>
              <ArrowRight size={16} />
              <b>Area.area()</b>
              <ArrowLeft size={16} />
              <code>Square(side)</code>
            </div>
            <p>
              分别实现面积能力，不必让可变正方形继承独立宽高 setter。这个接口不承诺两个
              setter，因此没有继承该契约。
            </p>
          </div>
        </>
      ) : (
        <>
          <Choice
            label="构造时注入的发动机"
            value={engine}
            options={[
              ['fuel', 'Engine'],
              ['electric', 'ElectricEngine'],
            ]}
            onChange={(value) => {
              setEngine(value);
              setCall(null);
            }}
          />
          <div className="car-relations">
            <div className={call === 'move' ? 'visited' : ''}>
              <small>继承的类型</small>
              <b>Vehicle</b>
              <code>move()</code>
            </div>
            <div className="car-is-a">
              <ArrowUp size={18} />
              <span>Car is-a Vehicle</span>
            </div>
            <div className={call ? 'visited' : ''}>
              <CarFront size={32} />
              <b>new Car(engine)</b>
              <code>private final Engine engine</code>
            </div>
            <div className="car-has-a">
              <ArrowDown size={18} />
              <span>Car has-a Engine</span>
            </div>
            <div className={call === 'start' ? 'visited' : ''}>
              <Cog size={28} />
              <b>{engine === 'fuel' ? 'Engine' : 'ElectricEngine'}</b>
              <code>start()</code>
            </div>
          </div>
          <div className="oop-controls">
            <button onClick={() => setCall('start')}>
              <Play size={15} />
              Car.start()
            </button>
            <button onClick={() => setCall('move')}>
              <Play size={15} />
              Vehicle ref.move()
            </button>
          </div>
          <div className="car-call-path">
            <code>{call === 'move' ? 'Vehicle ref = car' : 'Car car = new Car(engine)'}</code>
            <ArrowRight size={18} />
            <code>{result?.target ?? '尚未调用'}</code>
            <output>{result?.value ?? '—'}</output>
          </div>
          <Feedback>
            {call === 'move'
              ? 'Car 作为 Vehicle 使用，调用继承的 move()；这不是发动机部件上的调用。'
              : call === 'start'
                ? '先进入 Car.start()，再委托到持有的 Engine 对象。汽车有发动机，不代表汽车是发动机。'
                : '两条边分别表示类型承诺与部件依赖。选择发动机配置不改变 Car extends Vehicle 这个类关系。'}
          </Feedback>
          <p className="oop-boundary">
            切换配置代表重新构造 Car；示例中的 private final
            引用不被替换。不同发动机返回不同文本，但本例共同提供 start() 能力。
          </p>
        </>
      )}
    </Bench>
  );
}
