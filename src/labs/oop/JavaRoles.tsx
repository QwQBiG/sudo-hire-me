import { useState } from 'react';
import { ArrowRight, Check, Play, X, Box } from 'lucide-react';
import type { LabProps } from '../../types';
import { javaRoleCall, javaRoleConstruction } from '../../domain/oop-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './oop-scenes.css';

export default function JavaRoles({ lesson }: LabProps) {
  const [type, setType] = useState('Area');
  const [side, setSide] = useState(3),
    [color, setColor] = useState('red');
  const [method, setMethod] = useState<string | null>(null);
  const [construct, setConstruct] = useState<string | null>(null);
  const result = method ? javaRoleCall(type, method, side, color) : null;
  const creation = construct ? javaRoleConstruction(construct) : null;
  const clear = () => {
    setMethod(null);
    setConstruct(null);
  };
  return (
    <Bench
      className="oop-scene java-roles"
      title={lesson.title}
      subtitle="Java 21、同一包内访问。切换引用指向同一个 Square；修改构造参数会重新建模对象。成员检查不是实际 javac 输出。"
      onReset={() => {
        setType('Area');
        setSide(3);
        setColor('red');
        clear();
      }}
    >
      <div className="roles-settings">
        <label>
          Square 的边长 <b>{side}</b>
          <input
            type="range"
            min={1}
            max={8}
            value={side}
            aria-label="Square 的边长"
            onChange={(e) => {
              setSide(Number(e.target.value));
              clear();
            }}
          />
        </label>
        <div className="roles-colors" role="group" aria-label="Shape 中的 color 字段">
          {['red', 'blue', 'pink'].map((c) => (
            <button
              key={c}
              className={`color-${c}`}
              aria-label={`color = ${c}`}
              aria-pressed={color === c}
              title={c}
              onClick={() => {
                setColor(c);
                clear();
              }}
            >
              {color === c ? <Check size={14} /> : null}
            </button>
          ))}
        </div>
      </div>
      <Choice
        label="引用的静态类型"
        value={type}
        options={[
          ['Area', 'Area · 接口'],
          ['Shape', 'Shape · 抽象类'],
          ['Square', 'Square · 具体类'],
        ]}
        onChange={(value) => {
          setType(value);
          clear();
        }}
      />
      <div className="roles-inspector">
        <div className="roles-reference">
          <small>静态类型决定可用契约</small>
          <code>{type} ref = square;</code>
          <div>
            {['area', 'color', 'kind'].map((m) => (
              <span key={m} className={javaRoleCall(type, m).allowed ? 'allowed' : 'unavailable'}>
                {javaRoleCall(type, m).allowed ? <Check size={14} /> : <X size={14} />}
                <code>{m}()</code>
              </span>
            ))}
          </div>
        </div>
        <ArrowRight className="roles-arrow" size={24} />
        <div className="roles-object">
          <header>
            <Box size={19} />
            <b>同一个 Square 对象</b>
          </header>
          <div className="roles-parent">
            <small>Shape 构造器初始化的状态</small>
            <code>private final color = "{color}"</code>
          </div>
          <div>
            <small>Square 自己保存的状态</small>
            <code>private final side = {side}</code>
          </div>
          <div
            className={`roles-shape color-${color}`}
            style={{
              width: `calc(var(--role-unit) * ${side})`,
              height: `calc(var(--role-unit) * ${side})`,
            }}
            aria-label={`边长 ${side} 的正方形`}
          />
        </div>
      </div>
      <div className="oop-controls" aria-label="检查方法调用">
        {['area', 'color', 'kind'].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMethod(m);
              setConstruct(null);
            }}
          >
            <Play size={15} />
            ref.{m}()
          </button>
        ))}
      </div>
      <div className={`roles-result ${result && !result.allowed ? 'violated' : ''}`} role="status">
        <code>{method ? `ref.${method}()` : '尚未调用方法'}</code>
        <ArrowRight size={18} />
        <div>
          <small>
            {result
              ? result.allowed
                ? `执行 ${result.implementation}`
                : `${type} 契约没有 ${method}()`
              : '成员查找先检查静态类型'}
          </small>
          <output>
            {result ? (result.allowed ? String(result.value) : '编译期成员检查拒绝（模型）') : '—'}
          </output>
        </div>
      </div>
      <div className="roles-construction">
        <h4>构造检查</h4>
        <div className="oop-controls">
          {['Area', 'Shape', 'Square'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setConstruct(t);
                setMethod(null);
              }}
            >
              <Box size={15} />
              new {t}(...)
            </button>
          ))}
        </div>
        {creation ? (
          <Feedback good={creation.allowed}>
            {creation.reason}。
            {creation.allowed
              ? '这个检查不创建第二个可操作实例。'
              : '不能把“有构造初始化规则”误解成“可以直接 new 抽象类型”。'}
          </Feedback>
        ) : null}
      </div>
      {!creation ? (
        <Feedback good={!result || result.allowed}>
          {result && !result.allowed
            ? '对象确实还是 Square，但不能仅凭实际对象拥有某方法就越过引用静态类型的成员契约。'
            : method === 'kind'
              ? 'Shape 声明抽象 kind()，实际 Square 提供覆盖实现，返回 square。'
              : method === 'color'
                ? 'color() 是 Shape 的具体方法，读取由 Shape 构造器初始化的实例字段；字段不是接口 Area 保存的。'
                : '切换引用类型不创建新对象。接口表达面积能力，抽象类可保存共同实例状态；两者不是强弱版本关系。'}
        </Feedback>
      ) : null}
    </Bench>
  );
}
