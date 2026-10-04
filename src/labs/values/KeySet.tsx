import { useState } from 'react';
import { ArrowRight, Plus, Search, KeyRound, Check, X } from 'lucide-react';
import type { LabProps } from '../../types';
import { createKeySet, changeKey, keyHash, keySetCommand } from '../../domain/value-contracts.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './values.css';

const objects = ['a', 'b', 'c'];
export default function KeySet({ lesson }: LabProps) {
  const [state, setState] = useState(() => createKeySet());
  const [target, setTarget] = useState('b');
  const probe = state.probe;
  const pairs = [
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'c'],
  ];
  const broken = pairs.some(
    ([a, b]) => state.values[a] === state.values[b] && keyHash(state, a) !== keyHash(state, b),
  );
  const stale = state.entries.some((e) => e.hash !== keyHash(state, e.object));
  const command = (action: string) =>
    setState((previous) => keySetCommand(previous, target, action));
  return (
    <Bench
      className="value-scene key-set"
      title={lesson.title}
      subtitle="Java 21 查找机制的教学表：4 桶，不扩容或树化。身份哈希指定为 A=1、B=5、C=9，非真实 JVM 输出。"
      onReset={() => {
        setState(createKeySet());
        setTarget('b');
      }}
    >
      <Choice
        label="hashCode 策略"
        value={state.policy}
        options={[
          ['value', '按 id 哈希'],
          ['constant', '恒定哈希 1'],
          ['identity', '身份哈希反例'],
        ]}
        onChange={(policy) => setState(createKeySet(policy, state.mutable))}
      />
      <label className="key-mutability">
        <input
          type="checkbox"
          checked={state.mutable}
          onChange={(e) => setState(createKeySet(state.policy, e.target.checked))}
        />
        可变键反例（切换会重建集合）
      </label>
      <div className="key-objects">
        {objects.map((object) => {
          const stored = state.entries.some((entry) => entry.object === object);
          return (
            <section key={object}>
              <header>
                <KeyRound size={17} />
                <b>{object.toUpperCase()} · Key</b>
                <small>独立对象</small>
              </header>
              <label>
                id = <b>{state.values[object]}</b>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={state.values[object]}
                  aria-label={`${object.toUpperCase()} 的 id`}
                  disabled={stored && !state.mutable}
                  onChange={(e) =>
                    setState((previous) => changeKey(previous, object, Number(e.target.value)))
                  }
                />
              </label>
              <code>hashCode = {keyHash(state, object)}</code>
              <span>
                {stored ? (state.mutable ? '已存入，字段可变' : '已存入，id 锁定') : '尚未存入'}
              </span>
            </section>
          );
        })}
      </div>
      <div className="key-equality">
        <code>
          A == B <b>false</b>
        </code>
        <code>
          A.equals(B) <b>{String(state.values.a === state.values.b)}</b>
        </code>
        <span>{broken ? '已出现相等对象不同哈希的反例' : '当前三对象未违反相等哈希约束'}</span>
      </div>
      <div className="key-controls">
        <Choice
          label="操作对象"
          value={target}
          options={objects.map((o) => [o, o.toUpperCase()] as const)}
          onChange={setTarget}
        />
        <button onClick={() => command('add')}>
          <Plus size={16} />
          add({target.toUpperCase()})
        </button>
        <button onClick={() => command('contains')}>
          <Search size={16} />
          contains({target.toUpperCase()})
        </button>
      </div>
      <div className="key-routing">
        <code>{probe ? `${probe.command}(${probe.object.toUpperCase()})` : '尚未操作集合'}</code>
        <ArrowRight size={17} />
        <code>{probe ? `hash = ${probe.hash}` : '计算 hashCode'}</code>
        <ArrowRight size={17} />
        <code>{probe ? `bucket = ${probe.hash} % 4 = ${probe.bucket}` : '桶编号 = hash % 4'}</code>
      </div>
      <div className="key-buckets" aria-label="集合当前存储的节点">
        {[0, 1, 2, 3].map((bucket) => (
          <section key={bucket} className={probe?.bucket === bucket ? 'queried' : ''}>
            <header>
              <b>bucket {bucket}</b>
              <small>{probe?.bucket === bucket ? '本次访问' : ' '}</small>
            </header>
            {state.entries
              .filter((e) => e.bucket === bucket)
              .map((entry) => (
                <div
                  key={entry.serial}
                  data-token-id={`key-node-${entry.serial}`}
                  className={entry.hash !== keyHash(state, entry.object) ? 'stale' : ''}
                >
                  <b>
                    {entry.object.toUpperCase()} · id {state.values[entry.object]}
                  </b>
                  <code>存入时 hash {entry.hash}</code>
                  <small>
                    {entry.hash !== keyHash(state, entry.object)
                      ? `当前 hash ${keyHash(state, entry.object)} ≠ 已存 hash`
                      : '哈希依据未改变'}
                  </small>
                </div>
              ))}
            {!state.entries.some((e) => e.bucket === bucket) ? <p>空</p> : null}
          </section>
        ))}
      </div>
      <div className="key-probes">
        <h4>桶内比较记录</h4>
        {probe ? (
          probe.visits.length ? (
            probe.visits.map((visit, index) => (
              <div key={index}>
                {visit.equal ? <Check size={15} /> : <X size={15} />}
                <code>
                  {visit.object.toUpperCase()} · storedHash {visit.storedHash}
                </code>
                <span>
                  {!visit.sameHash
                    ? '完整 hash 不同，跳过相等判断'
                    : visit.equal
                      ? visit.object === probe.object
                        ? '同一对象，命中'
                        : 'id 相等，命中'
                      : 'id 不相等，继续比较'}
                </span>
              </div>
            ))
          ) : (
            <p>目标桶为空，没有候选节点。</p>
          )
        ) : (
          <p>先加入 A，再用同值的 B 查找；还可加入不同值的 C 检查碰撞。</p>
        )}
      </div>
      <div className="key-result" role="status">
        <small>
          {probe ? `${probe.command}(${probe.object.toUpperCase()}) 返回（模型）` : '集合尚为空'}
        </small>
        <output>{probe ? String(probe.command === 'add' ? probe.added : probe.found) : '—'}</output>
        <code>size = {state.entries.length}</code>
      </div>
      <Feedback good={!broken && !stale}>
        {stale
          ? '节点保存存入时的 hash，不会因字段变化自动搬到新桶。当前 hash 已改变，查询可能找不到连同一个对象在内的旧节点。'
          : broken
            ? 'A、B 等对象可能按 id 相等却有不同完整哈希。同桶仍不足以命中；这组身份哈希是特意构造的反例，真实身份哈希不保证不同。'
            : state.policy === 'constant'
              ? '恒定哈希满足“相等对象同哈希”，但不相等的 id 仍各占一个节点；大量碰撞增加比较工作。'
              : probe?.command === 'add' && !probe.added
                ? 'add 返回 false 表示集合已有相等元素，不是操作异常。'
                : '先定位桶，再检查完整哈希与身份或 equals。相等值可复用已有节点，碰撞不等于重复。'}
      </Feedback>
      <p className="value-note">
        A、B、C 是不同对象。不可变模式在入集合前配置构造参数，存入后锁定；可变模式修改同一对象的
        id，不会自动重建集合节点。正文推荐使用 final id。
      </p>
    </Bench>
  );
}
