import { useState } from 'react';
import { ArrowDown, Cpu, Database, HardDrive, Play, RefreshCw } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

export default function Hardware({ lesson }: LabProps) {
  const slug = lesson.slug;
  const [mode, setMode] = useState('first');
  const [value, setValue] = useState(10);
  const [memory, setMemory] = useState(10);
  const [copies, setCopies] = useState<(number | null)[]>([10, 10]);
  const [ticks, setTicks] = useState(0);
  const [resident, setResident] = useState(false);
  const [hits, setHits] = useState(0);
  const [lastAccess, setLastAccess] = useState<'none' | 'hit' | 'miss'>('none');
  const [note, setNote] = useState('改变条件，然后发起一次访问。');
  function reset() {
    setValue(10);
    setMemory(10);
    setCopies([10, 10]);
    setTicks(0);
    setResident(false);
    setHits(0);
    setLastAccess('none');
    setNote('实验状态已重置。');
  }
  const pipeline = slug === 'cpu-pipeline-hazards';
  const polling = slug === 'interrupt-vs-polling';
  const hierarchy = slug === 'memory-hierarchy-basic';
  const coherence = slug === 'cache-coherence-basic';
  if (pipeline) {
    const stalls = mode === 'first' ? 2 : 0;
    const rows = ['ADD r1, r2, r3', 'SUB r4, r1, r5', 'AND r6, r4, r7'];
    const cycles = mode === 'first' ? 11 : 7;
    return (
      <Bench
        title="给相关指令安排时钟槽位"
        subtitle="简化五级顺序流水线；寄存器写回同拍可读，完整转发可消除这里的 ALU 数据停顿。"
        onReset={reset}
      >
        <Choice
          label="数据通路"
          value={mode}
          options={[
            ['first', '等待写回'],
            ['forward', '启用转发'],
          ]}
          onChange={(v) => {
            setMode(v);
            setTicks(0);
          }}
        />
        <div className="bench-scroll">
          <div className="pipeline-board">
            {rows.map((row, i) => (
              <div className="pipeline-row" key={row}>
                <code>{row}</code>
                {Array.from({ length: 11 }, (_, cycle) => {
                  const stage = cycle - i * (1 + stalls);
                  return (
                    <span
                      key={cycle}
                      className={`${stage >= 0 && stage < 5 ? 'occupied' : ''} ${cycle === ticks ? 'current' : ''}`}
                    >
                      {stage >= 0 && stage < 5 ? ['IF', 'ID', 'EX', 'MEM', 'WB'][stage] : '·'}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={ticks >= cycles - 1}
            onClick={() => setTicks((t) => t + 1)}
          >
            <Play size={16} /> 时钟 +1
          </button>
          <span className="bench-token">第 {ticks + 1} 拍</span>
        </div>
        <div className="quality-observation">
          <div>
            <small>本例完工时间</small>
            <output>{cycles} 拍</output>
          </div>
          <div>
            <small>相邻 RAW 等待</small>
            <output>{stalls} 拍 / 对</output>
          </div>
          <div>
            <small>与无转发相比节省</small>
            <output>{11 - cycles} 拍</output>
          </div>
        </div>
        <Feedback>
          {mode === 'first'
            ? '相邻指令需要前一条的结果，等待其 WB 后才能进入自己的 EX，表中以空槽简化表示延迟。完整停顿实现还会冻结前端级。'
            : '转发把 ALU 结果直接交给后继 EX。注意：load-use 相关仍可能需要停顿，这里没有加载指令。'}
        </Feedback>
      </Bench>
    );
  }
  if (polling)
    return (
      <Bench
        title="设备完成之前，CPU 在做什么"
        subtitle="设备在第 5 拍完成；轮询每拍检查，简化中断模型在完成时处理一次通知。"
        onReset={reset}
      >
        <Choice
          label="通知机制"
          value={mode}
          options={[
            ['first', '轮询'],
            ['interrupt', '中断'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="device-timeline">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={i < ticks ? 'elapsed' : ''}>
              <small>{i + 1}</small>
              <Cpu size={22} />
              <span>
                {i >= ticks
                  ? '未执行'
                  : mode === 'first' && i < 5
                    ? i === 4
                      ? '发现完成'
                      : '查询状态'
                    : mode === 'interrupt' && i === 4
                      ? '处理中断'
                      : '其他工作'}
              </span>
            </div>
          ))}
        </div>
        <div className="quality-observation">
          <div>
            <small>设备进度</small>
            <output>{Math.min(ticks, 5)} / 5 拍</output>
          </div>
          <div>
            <small>可做其他工作的时钟槽</small>
            <output>
              {mode === 'first' ? Math.max(0, ticks - 5) : ticks - (ticks >= 5 ? 1 : 0)}
            </output>
          </div>
        </div>
        <div className="bench-actions">
          <button className="primary" disabled={ticks === 8} onClick={() => setTicks((t) => t + 1)}>
            <Play size={16} /> 时钟 +1
          </button>
        </div>
        <Feedback>
          {ticks < 5 ? '设备尚未完成。' : '设备已完成。'} 当前为此设备检查 / 处理{' '}
          {mode === 'first' ? Math.min(ticks, 5) : ticks >= 5 ? 1 : 0}{' '}
          次。中断也有保存现场等成本；高事件速率下批处理与轮询可能更合适。
        </Feedback>
      </Bench>
    );
  if (hierarchy)
    return (
      <Bench
        title="让一次访问沿存储层级寻找数据"
        subtitle="固定缓存缺失 / 命中教学模型；层级时间使用相对单位，不代表某款硬件参数。"
        onReset={reset}
      >
        <div className="hierarchy-tower">
          {[
            ['寄存器', Cpu, '1'],
            ['L1 / L2 Cache', Cpu, '4 / 12'],
            ['主存', Database, '100'],
            ['外存', HardDrive, '10000'],
          ].map(([label, Icon, cost], i) => {
            const Symbol = Icon as typeof Cpu;
            return (
              <div
                key={String(label)}
                style={{ width: `${55 + i * 15}%` }}
                className={
                  (lastAccess === 'hit' && i === 1) || (lastAccess === 'miss' && i === 2)
                    ? 'active'
                    : ''
                }
              >
                <Symbol size={20} />
                <strong>{String(label)}</strong>
                <span>{String(cost)}</span>
              </div>
            );
          })}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setResident(true);
              setTicks(ticks + 1);
              setLastAccess(resident ? 'hit' : 'miss');
              if (resident) setHits(hits + 1);
              setNote(
                resident
                  ? '缓存命中，不需要再次访问主存。'
                  : '缓存缺失，从主存取回并填入缓存。这里的数据本来已在主存，不涉及外存缺页。',
              );
            }}
          >
            读取同一地址
          </button>
          <button
            className="secondary"
            onClick={() => {
              setResident(false);
              setNote('模拟该缓存行被替换，下次访问将缺失。');
            }}
          >
            逐出缓存行
          </button>
        </div>
        <div className="quality-observation">
          <div>
            <small>访问 / 命中 / 缺失</small>
            <output>
              {ticks} / {hits} / {ticks - hits}
            </output>
          </div>
          <div>
            <small>最近路径</small>
            <output>
              {lastAccess === 'none'
                ? '等待访问'
                : lastAccess === 'hit'
                  ? 'Cache → CPU'
                  : '主存 → Cache → CPU'}
            </output>
          </div>
          <div>
            <small>缓存驻留</small>
            <output>{resident ? '有效行' : '无目标行'}</output>
          </div>
        </div>
        <Feedback>{note}</Feedback>
      </Bench>
    );
  return (
    <Bench
      title={coherence ? '观察两个核心的缓存副本' : '写入后，哪一层已经拿到新值'}
      subtitle={
        coherence
          ? '简化写失效一致性模型，采用写直达；不等同于完整 MESI 状态机，也不保证多操作原子性。'
          : '固定写命中：写直达同步下层；写回标记脏行，在逐出时更新下层。'
      }
      onReset={reset}
    >
      {!coherence && (
        <Choice
          label="写策略"
          value={mode}
          options={[
            ['first', 'Write-through · 写直达'],
            ['back', 'Write-back · 写回'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
      )}
      <div className="cache-layers">
        <div className="cache-cores">
          {(coherence ? copies : [value]).map((n, i) => (
            <div key={i} className={`cache-core ${n === null ? 'invalid' : ''}`}>
              <Cpu size={24} />
              <span>Core {i} Cache</span>
              <strong>{n === null ? 'Invalid' : n}</strong>
              <small>{!coherence && value !== memory ? 'Dirty = 1' : '有效性由协议维护'}</small>
              {coherence && (
                <button
                  className="secondary"
                  onClick={() => {
                    setCopies((c) => c.map((v, j) => (j === i ? memory : v)));
                    setNote(
                      copies[i] === null
                        ? `Core ${i} 副本失效，从下层取得最新值 ${memory}。`
                        : '有效副本命中。',
                    );
                  }}
                >
                  读取
                </button>
              )}
            </div>
          ))}
        </div>
        <ArrowDown size={24} />
        <div className="cache-memory">
          <Database size={24} />
          <span>下层存储</span>
          <strong>{memory}</strong>
        </div>
      </div>
      <div className="bench-actions">
        <button
          className="primary"
          onClick={() => {
            const next = value + 1;
            setValue(next);
            if (coherence) {
              setMemory(next);
              setCopies([next, null]);
              setNote('Core 0 写入获得独占修改权限，使 Core 1 的旧副本失效。');
            } else if (mode === 'first') {
              setMemory(next);
              setNote('缓存和下层都更新了；本模型忽略写缓冲延迟。');
            } else setNote('只更新缓存并标记 Dirty，下层暂时保留旧值。');
          }}
        >
          Core 0 写入 +1
        </button>
        {!coherence && (
          <button
            className="secondary"
            onClick={() => {
              setMemory(value);
              setNote(value === memory ? '干净行，无需写回。' : '脏行逐出，先将新值写回下层。');
            }}
          >
            <RefreshCw size={16} /> 逐出并检查写回
          </button>
        )}
      </div>
      <div className="quality-path">
        <code>
          {coherence
            ? `Core 1：${copies[1] === null ? '失效，必须重新取值' : '有效副本'}`
            : `Dirty = ${value !== memory ? 1 : 0}`}
        </code>
        <span>→</span>
        <output>
          {coherence
            ? '一致性先维护副本有效性'
            : value !== memory
              ? '逐出前必须写回'
              : '下层已与缓存一致'}
        </output>
      </div>
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
