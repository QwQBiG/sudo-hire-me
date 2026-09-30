import { useState } from 'react';
import { Database as DatabaseIcon, KeyRound, Plus } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback, Meter } from './Bench';

const titles: Record<string, string> = {
  'database-normalization': '改一次客户信息，会漏掉几处副本',
  'composite-index-order': '重新排列索引列，观察可定位区间',
  'database-index-selectivity': '多少次回表会抵消索引收益',
  'database-join-algorithms': '为同一个连接选择不同执行路径',
  'database-mvcc-basic': '让两个事务读到各自可见的版本',
  'database-connection-pool': '借出连接，归还给下一个请求',
};
export default function Database({ lesson }: LabProps) {
  const s = lesson.slug;
  const [mode, setMode] = useState('first');
  const [city, setCity] = useState('杭州');
  const [cities, setCities] = useState(['杭州', '杭州', '上海']);
  const [age, setAge] = useState(25);
  const [matches, setMatches] = useState(3);
  const [versions, setVersions] = useState([{ id: 1, value: 100 }]);
  const [snapshot, setSnapshot] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [leases, setLeases] = useState<(string | null)[]>([null, null, null]);
  const [waiting, setWaiting] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [note, setNote] = useState('改变数据或执行策略，观察结果与成本。');
  function reset() {
    setCity('杭州');
    setCities(['杭州', '杭州', '上海']);
    setMatches(3);
    setVersions([{ id: 1, value: 100 }]);
    setSnapshot(null);
    setPending(false);
    setLeases([null, null, null]);
    setWaiting([]);
    setCount(0);
    setNote('数据已恢复。');
  }
  let body;
  if (s === 'database-normalization')
    body = (
      <>
        <Choice
          label="存储结构"
          value={mode}
          options={[
            ['first', '订单重复保存客户城市'],
            ['normalized', '拆为客户表与订单表'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <label>
          客户 C1 新城市
          <input value={city} maxLength={12} onChange={(e) => setCity(e.target.value)} />
        </label>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setCities((xs) =>
                xs.map((v, i) => (i === 0 || (mode === 'normalized' && i === 1) ? city : v)),
              );
              setNote(
                mode === 'first'
                  ? '只更新了订单 O1，O2 仍保存旧城市，出现更新异常。'
                  : '只更新客户 C1 的一行，订单通过客户键关联，观察到同一城市。',
              );
            }}
          >
            更新一行
          </button>
        </div>
        {mode === 'normalized' && (
          <div className="database-relation">
            <KeyRound size={18} />
            <code>Customer(C1, {cities[0]}) ← Order.customer_id</code>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>订单</th>
              <th>客户键</th>
              <th>{mode === 'first' ? '重复保存的城市' : '连接查询得到的城市'}</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((value, i) => (
              <tr key={i}>
                <td>O{i + 1}</td>
                <td>{i < 2 ? 'C1' : 'C2'}</td>
                <td className={i < 2 && cities[0] !== cities[1] ? 'bench-false' : ''}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="object-caption">
          固定函数依赖：customer_id →
          city。此例演示传递依赖造成的冗余；完整范式判断还需列出候选键与全部函数依赖。
        </p>
      </>
    );
  else if (s === 'composite-index-order') {
    const rows = [
      ['杭州', 20],
      ['杭州', 25],
      ['杭州', 30],
      ['上海', 20],
      ['上海', 25],
      ['上海', 30],
    ] as [string, number][];
    const sorted = [...rows].sort((a, b) =>
      mode === 'first'
        ? a[0].localeCompare(b[0], 'zh') || a[1] - b[1]
        : a[1] - b[1] || a[0].localeCompare(b[0], 'zh'),
    );
    body = (
      <>
        <Choice
          label="索引列顺序"
          value={mode}
          options={[
            ['first', '(city, age)'],
            ['age', '(age, city)'],
          ]}
          onChange={setMode}
        />
        <div className="bench-controls">
          <label>
            city =<input value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            age ≥ {age}
            <input
              type="range"
              min={20}
              max={31}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="index-leaves">
          {sorted.map(([c, a], i) => {
            const candidate = mode === 'first' ? c === city && a >= age : a >= age;
            const hit = c === city && a >= age;
            return (
              <div key={i} className={hit ? 'hit' : candidate ? 'candidate' : ''}>
                <small>叶子条目 {i}</small>
                <b>{mode === 'first' ? `${c} | ${a}` : `${a} | ${c}`}</b>
                <span>{hit ? '结果' : candidate ? '范围内再过滤' : '范围外'}</span>
              </div>
            );
          })}
        </div>
        <Feedback>
          {mode === 'first'
            ? 'city 等值前缀定位到一段，再在该段内按 age 范围扫描。'
            : '先按 age 范围扫描，city 在这个范围内不保证形成单一更窄连续区间，仍可能参与过滤。具体优化取决于数据库。'}
        </Feedback>
      </>
    );
  } else if (s === 'database-index-selectivity') {
    const indexCost = 2 + matches * 4;
    body = (
      <>
        <label>
          20 行中匹配 {matches} 行
          <input
            type="range"
            min={0}
            max={20}
            value={matches}
            onChange={(e) => setMatches(Number(e.target.value))}
          />
        </label>
        <div className="selectivity-page">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className={i < matches ? 'match' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
        <div className="bench-grid">
          <div className="bench-stat">
            <small>索引定位 2 + 每次回表 4</small>
            <strong>{indexCost} 单位</strong>
          </div>
          <div className="bench-stat">
            <small>顺序扫描，每行 1</small>
            <strong>20 单位</strong>
          </div>
        </div>
        <Feedback>
          {indexCost < 20
            ? '当前模型更适合索引路径。'
            : indexCost === 20
              ? '两种路径在当前模型成本相同。'
              : '当前模型中逐行回表比顺序扫描更贵。'}{' '}
          成本系数是假设值，用来隔离选择性影响，不是数据库优化器真实公式；覆盖索引、缓存与数据分布都会改变结果。
        </Feedback>
      </>
    );
  } else if (s === 'database-join-algorithms')
    body = (
      <>
        <Choice
          label="连接算法"
          value={mode}
          options={[
            ['first', '嵌套循环'],
            ['hash', '哈希连接'],
          ]}
          onChange={(v) => {
            setMode(v);
            setCount(0);
          }}
        />
        <div className="join-tables">
          <div>
            <div className="bench-label">左表 A</div>
            {[1, 1, 3].map((k, i) => (
              <span key={i}>
                A{i + 1} · key={k}
              </span>
            ))}
          </div>
          <div className="join-operator">⋈</div>
          <div>
            <div className="bench-label">右表 B</div>
            {[1, 2, 3].map((k, i) => (
              <span key={i}>
                B{i + 1} · key={k}
              </span>
            ))}
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setCount(count + 1);
              setNote(
                mode === 'first'
                  ? '逐对比较 3×3=9 次，产生 A1-B1、A2-B1、A3-B3。'
                  : '构建 3 个右表哈希条目，探测 3 个左表键，产生相同的 3 条结果；不代表只有 6 条底层 CPU 指令。',
              );
            }}
          >
            执行等值连接
          </button>
        </div>
        {count > 0 && (
          <>
            <pre className="bench-code">
              A1 ↔ B1{String.fromCharCode(10)}A2 ↔ B1{String.fromCharCode(10)}A3 ↔ B3
            </pre>
            <div className="bench-stat">
              <small>{mode === 'first' ? '键比较次数' : '构建 + 探测次数'}</small>
              <strong>{mode === 'first' ? '9' : '3 + 3'}</strong>
            </div>
          </>
        )}
      </>
    );
  else if (s === 'database-mvcc-basic') {
    const current = versions.at(-1)!;
    const visible =
      mode === 'first' || snapshot === null ? current : versions.find((v) => v.id === snapshot)!;
    body = (
      <>
        <Choice
          label="读者隔离级别"
          value={mode}
          options={[
            ['first', 'Read Committed'],
            ['repeatable', 'Repeatable Read'],
          ]}
          onChange={(v) => {
            setMode(v);
            setSnapshot(null);
            setNote('开启新的读者事务。');
          }}
        />
        <div className="version-chain">
          {versions.map((v) => (
            <div key={v.id} className={v.id === visible.id ? 'visible' : ''}>
              <small>已提交 v{v.id}</small>
              <strong>{v.value}</strong>
              <span>
                {v.id === visible.id
                  ? '本次读取可见'
                  : v.id > visible.id
                    ? '快照之后提交'
                    : '更早的版本'}
              </span>
            </div>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              if (snapshot === null) setSnapshot(current.id);
              setNote(
                `读者读取 ${visible.value}。${mode === 'first' ? '每条语句重新取得快照。' : '后续读取保持第一次查询建立的事务快照。'}`,
              );
            }}
          >
            读者 SELECT
          </button>
          <button
            className="secondary"
            disabled={pending || versions.length >= 6}
            onClick={() => {
              setPending(true);
              setNote(`写者准备将值更新为 ${current.value + 20}，尚未提交，读者不能看到这个新值。`);
            }}
          >
            写者 UPDATE
          </button>
          <button
            className="secondary"
            disabled={!pending}
            onClick={() => {
              setVersions([...versions, { id: current.id + 1, value: current.value + 20 }]);
              setPending(false);
              setNote('写者提交新版本。读者能否看到它取决于自己的快照范围。');
            }}
          >
            写者 COMMIT
          </button>
        </div>
        <p className="object-caption">
          采用 PostgreSQL 普通 SELECT 的快照规则作简化示例；不模拟锁定读取、更新冲突或可串行化检测。
        </p>
      </>
    );
  } else
    body = (
      <>
        <div className="pool-slots">
          {leases.map((lease, i) => (
            <button
              key={i}
              disabled={!lease}
              onClick={() => {
                setLeases((xs) => xs.map((v, j) => (j === i ? (waiting[0] ?? null) : v)));
                if (waiting.length) setWaiting(waiting.slice(1));
                setNote(
                  waiting.length
                    ? `连接 C${i + 1} 归还后立即交给 ${waiting[0]}，复用同一物理连接。`
                    : `C${i + 1} 已归还空闲池。`,
                );
              }}
            >
              <DatabaseIcon size={26} />
              <strong>C{i + 1}</strong>
              <span>{lease ?? '空闲'}</span>
              <small>{lease ? '点击归还' : '等待借出'}</small>
            </button>
          ))}
        </div>
        <div className="bench-label">等待队列</div>
        <div className="bench-tokens">
          {waiting.map((id) => (
            <span className="bench-token" key={id}>
              {id}
            </span>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={waiting.length >= 6}
            onClick={() => {
              const id = `R${count + 1}`;
              setCount(count + 1);
              const free = leases.indexOf(null);
              if (free >= 0) {
                setLeases((xs) => xs.map((v, i) => (i === free ? id : v)));
                setNote(`${id} 借用 C${free + 1}，用完必须归还。`);
              } else {
                setWaiting([...waiting, id]);
                setNote('池内 3 条连接都已借出，新请求排队；不会自动无限增加数据库连接。');
              }
            }}
          >
            <Plus size={16} />
            新请求
          </button>
        </div>
        <Meter label="已借出连接" value={leases.filter(Boolean).length} max={3} />
      </>
    );
  return (
    <Bench
      title={titles[s]}
      subtitle="可观察的数据与执行策略模型；不连接外部数据库。"
      onReset={reset}
    >
      {body}
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
