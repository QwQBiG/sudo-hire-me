import { useState } from 'react';
import { Cpu, File, Folder, Lock, Play, Plus, Unlink } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';

const titles: Record<string, string> = {
  'context-switch': '把 CPU 现场存回正确的进程',
  'scheduler-starvation-priority': '让等待中的任务得到一次 CPU',
  'process-vs-thread-resources': '同一进程里的共享与独立',
  'interrupt-exception-trap': '把事件送入对应的处理入口',
  'mutex-vs-semaphore': '把有限的资源许可分出去',
  'condition-variable': '收到通知后，条件真的成立吗',
  'copy-on-write': '第一次写入才分裂的物理页',
  'file-system-inode': '删除文件名之后，数据还在吗',
  'ipc-pipe': '让字节穿过一个有界管道',
};
export default function Kernel({ lesson }: LabProps) {
  const s = lesson.slug;
  const [active, setActive] = useState(0);
  const [registers, setRegisters] = useState([0, 100]);
  const [global, setGlobal] = useState(0);
  const [mode, setMode] = useState('first');
  const [owners, setOwners] = useState<number[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [flag, setFlag] = useState(false);
  const [count, setCount] = useState(0);
  const [names, setNames] = useState(['report.txt', 'backup.txt']);
  const [note, setNote] = useState('操作资源，观察所有相关位置的状态。');
  function reset() {
    setActive(0);
    setRegisters([0, 100]);
    setGlobal(0);
    setOwners([]);
    setQueue([]);
    setLog([]);
    setFlag(false);
    setCount(0);
    setNames(['report.txt', 'backup.txt']);
    setNote('状态已重置。');
  }
  const title = titles[s];
  function record(text: string) {
    setNote(text);
    setLog((xs) => [text, ...xs].slice(0, 5));
  }
  let body;
  if (s === 'context-switch' || s === 'process-vs-thread-resources')
    body = (
      <>
        <Choice
          label="执行上下文"
          value={String(active)}
          options={[
            ['0', s === 'context-switch' ? '进程 P1' : '线程 T1'],
            ['1', s === 'context-switch' ? '进程 P2' : '线程 T2'],
          ]}
          onChange={(v) => {
            setActive(Number(v));
            record(
              s === 'context-switch'
                ? `保存当前寄存器现场，恢复 P${Number(v) + 1} 的 PC 与寄存器。`
                : '切换线程后，局部栈独立，但进程内堆对象仍共享。',
            );
          }}
        />
        <div className="kernel-processes">
          {registers.map((r, i) => (
            <div key={i} className={active === i ? 'active' : ''}>
              <Cpu size={24} />
              <small>
                {s === 'context-switch' ? 'PCB / 保存现场' : '独立线程栈'} {i + 1}
              </small>
              <strong>
                {s === 'context-switch' ? 'PC' : 'local'} = {r}
              </strong>
              <span>{active === i ? '正在 CPU 上运行' : '等待调度'}</span>
            </div>
          ))}
        </div>
        {s === 'process-vs-thread-resources' && (
          <div className="kernel-shared">
            <span>进程共享堆</span>
            <strong>{global}</strong>
            <small>另一个进程的私有地址空间不因此改变</small>
          </div>
        )}
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setRegisters((xs) =>
                xs.map((n, i) => (i === active ? n + (s === 'context-switch' ? 4 : 1) : n)),
              );
              record('只更新当前上下文的局部状态。');
            }}
          >
            当前 {s === 'context-switch' ? 'PC +4' : 'local +1'}
          </button>
          {s === 'process-vs-thread-resources' && (
            <button
              className="secondary"
              onClick={() => {
                setGlobal(global + 1);
                record('同进程两个线程都能观察这个共享对象。并发访问仍需要同步。');
              }}
            >
              共享 heap +1
            </button>
          )}
        </div>
      </>
    );
  else if (s === 'scheduler-starvation-priority')
    body = (
      <>
        <label>
          <input
            type="checkbox"
            checked={flag}
            onChange={(e) => {
              setFlag(e.target.checked);
              setQueue([]);
              setCount(0);
            }}
          />
          启用 aging：每等待一拍优先级 +1
        </label>
        <div className="kernel-processes">
          <div>
            <small>持续到达的短任务 H</small>
            <strong>priority = 5</strong>
          </div>
          <div>
            <small>等待中的任务 L</small>
            <strong>priority = {flag ? Math.min(count, 6) : 0}</strong>
          </div>
        </div>
        <div className="bench-tokens">
          {queue.map((n, i) => (
            <span className={`bench-token ${n ? 'done' : ''}`} key={i}>
              {n ? 'L' : 'H'}
            </span>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={queue.includes(1) || queue.length >= 14}
            onClick={() => {
              const low = flag && count >= 5;
              setQueue([...queue, low ? 1 : 0]);
              setCount(count + 1);
              record(
                low
                  ? 'L 的优先级提升到可竞争水平，获得 CPU。'
                  : '新来的 H 优先级更高，L 又等待一拍。',
              );
            }}
          >
            <Play size={16} />
            到达 H 并调度
          </button>
        </div>
      </>
    );
  else if (s === 'interrupt-exception-trap')
    body = (
      <>
        <div className="interrupt-vector">
          {[
            ['设备完成', '异步外部中断', '事件来自设备，通常与当前指令没有因果关系。'],
            ['除数为零', '同步处理器异常', '异常由当前指令触发，处理器按体系结构提供异常现场。'],
            ['执行系统调用', '主动进入内核', '用户程序请求内核服务，经受控入口切换特权级。'],
          ].map(([event, kind, why]) => (
            <button
              key={event}
              onClick={() => {
                setActive(['设备完成', '除数为零', '执行系统调用'].indexOf(event));
                setFlag(true);
                record(`${kind}：${why}`);
              }}
            >
              <Cpu size={23} />
              <strong>{event}</strong>
              <span>{kind}</span>
            </button>
          ))}
        </div>
        <div className="kernel-shared">
          <small>事件处理入口</small>
          <strong>
            {flag
              ? ['设备中断处理程序', '同步异常处理程序', '系统调用处理程序'][active]
              : '等待事件'}
          </strong>
        </div>
      </>
    );
  else if (s === 'mutex-vs-semaphore') {
    const permits = mode === 'first' ? 1 : 2;
    body = (
      <>
        <Choice
          label="同步原语"
          value={mode}
          options={[
            ['first', '互斥锁：1 个拥有者'],
            ['semaphore', '信号量：2 个许可'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="permit-rack">
          {Array.from({ length: permits }, (_, i) => (
            <div key={i} className={owners[i] !== undefined ? 'occupied' : ''}>
              <Lock size={26} />
              <strong>{owners[i] === undefined ? '空闲' : `T${owners[i] + 1}`}</strong>
            </div>
          ))}
        </div>
        <div className="bench-actions">
          {[0, 1, 2].map((n) => (
            <button
              className="secondary"
              key={n}
              onClick={() => {
                if (owners.includes(n)) return record('本模型不允许同一线程重复获取。');
                if (owners.length >= permits) return record(`T${n + 1} 暂时阻塞，许可不足。`);
                setOwners([...owners, n]);
                record(`T${n + 1} 获得${mode === 'first' ? '锁' : '一个许可'}。`);
              }}
            >
              T{n + 1} 获取
            </button>
          ))}
          <button
            className="primary"
            disabled={!owners.length}
            onClick={() => {
              setOwners(owners.slice(1));
              record(
                mode === 'first'
                  ? '由拥有者解锁。互斥锁有拥有关系。'
                  : '归还一个许可。信号量通常不强制由获取者归还，适合计数与通知。',
              );
            }}
          >
            归还资源
          </button>
        </div>
      </>
    );
  } else if (s === 'condition-variable')
    body = (
      <>
        <div className="kernel-processes">
          <div>
            <small>消费者</small>
            <strong>{flag ? '已唤醒 / 待检查' : '等待条件'}</strong>
            <span>while (queue.empty()) wait()</span>
          </div>
          <div>
            <small>受同一互斥锁保护的队列</small>
            <strong>{queue.length} 个元素</strong>
            <div className="bench-tokens">
              {queue.map((n, i) => (
                <span className="bench-token" key={i}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="secondary"
            onClick={() => {
              setFlag(true);
              record('线程被唤醒，但队列仍可能为空。通知不携带“条件永久成立”的保证。');
            }}
          >
            仅发送通知
          </button>
          <button
            className="secondary"
            onClick={() => {
              setQueue([...queue, count + 1]);
              setCount(count + 1);
              setFlag(true);
              record('生产者持锁入队后通知。消费者仍需重新获得锁并检查谓词。');
            }}
          >
            <Plus size={16} />
            生产并通知
          </button>
          <button
            className="primary"
            onClick={() => {
              if (!flag) return record('消费者仍在等待，wait 已释放互斥锁。');
              if (!queue.length) {
                setFlag(false);
                return record('while 检查发现队列为空，继续 wait，不能弹出不存在的元素。');
              }
              setQueue(queue.slice(1));
              setFlag(false);
              record('重新持锁检查队列非空，取走一个元素。');
            }}
          >
            持锁重查并消费
          </button>
        </div>
      </>
    );
  else if (s === 'copy-on-write')
    body = (
      <>
        <div className="kernel-processes">
          {[0, 1].map((p) => (
            <div key={p}>
              <small>进程 P{p + 1} 页表</small>
              <strong>→ {owners.includes(p) ? `私有页 ${p + 1}` : '共享物理页 S'}</strong>
              <span>值 {owners.includes(p) ? registers[p] : 10}</span>
              <button
                className="secondary"
                onClick={() => {
                  if (!owners.includes(p)) setOwners([...owners, p]);
                  setRegisters((xs) =>
                    xs.map((n, i) => (i === p ? (owners.includes(p) ? n : 10) + 1 : n)),
                  );
                  record(
                    `P${p + 1} 写入触发${owners.includes(p) ? '已有私有页更新' : '写保护缺页处理，复制页面并改写自己的映射'}。另一进程内容不变。`,
                  );
                }}
              >
                P{p + 1} 写入 +1
              </button>
            </div>
          ))}
        </div>
        <div className="kernel-shared">
          <span>不同的可达物理页</span>
          <strong>{owners.length + (owners.length < 2 ? 1 : 0)}</strong>
        </div>
      </>
    );
  else if (s === 'file-system-inode')
    body = (
      <>
        <div className="inode-map">
          <div>
            <div className="bench-label">
              <Folder size={16} />
              目录项
            </div>
            {names.map((n) => (
              <button
                className="inode-name"
                key={n}
                onClick={() => {
                  setNames(names.filter((x) => x !== n));
                  record('unlink 删除这个名字；其他硬链接和已打开描述符仍引用同一文件。');
                }}
              >
                <File size={18} />
                {n}
                <Unlink size={14} />
              </button>
            ))}
          </div>
          <div className="inode-record">
            <small>inode #42</small>
            <strong>nlink = {names.length}</strong>
            <span>打开引用：{flag ? 1 : 0}</span>
            <span>{names.length || flag ? '数据仍可访问' : '已无引用，可释放存储'}</span>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={!names.length}
            onClick={() => {
              setFlag(true);
              record('打开文件后，描述符保持对打开文件对象的引用。');
            }}
          >
            打开文件
          </button>
          <button
            className="secondary"
            disabled={!flag}
            onClick={() => {
              setFlag(false);
              record('关闭最后一个打开引用；若 nlink 也为 0，文件可被回收。');
            }}
          >
            关闭描述符
          </button>
        </div>
      </>
    );
  else
    body = (
      <>
        <div className="pipe-tube">
          {Array.from({ length: 8 }, (_, i) => (
            <span className={queue[i] !== undefined ? 'full' : ''} key={i}>
              {queue[i] ?? '·'}
            </span>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={flag}
            onClick={() => {
              if (queue.length > 5)
                return record('剩余空间不足，本模型将 3 字节写请求阻塞，暂不写入。');
              setQueue([...queue, count, count + 1, count + 2]);
              setCount(count + 3);
              record('写入三个字节；管道是字节流，不保留应用消息边界。');
            }}
          >
            写入 3 字节
          </button>
          <button
            className="secondary"
            onClick={() => {
              if (!queue.length)
                return record(
                  flag
                    ? '所有写端已关闭且缓冲为空：read 返回 0，表示 EOF。'
                    : '写端仍开着，空管道上的阻塞读取等待数据。',
                );
              record(`读出 ${queue.slice(0, 2).join(', ')}。一次 read 不必对应一次 write。`);
              setQueue(queue.slice(2));
            }}
          >
            读取至多 2 字节
          </button>
          <button
            className="secondary"
            disabled={flag}
            onClick={() => {
              setFlag(true);
              record('关闭全部写端；缓冲中的剩余数据仍能被读取，读尽后才返回 EOF。');
            }}
          >
            关闭全部写端
          </button>
        </div>
      </>
    );
  return (
    <Bench
      title={title}
      subtitle="固定小规模状态模型；每个按钮代表一次明确的系统事件。"
      onReset={reset}
    >
      {body}
      <Feedback>{note}</Feedback>
      <ol className="bench-log">
        {log.map((line, i) => (
          <li key={i}>
            <code>{log.length - i}</code>
            {line}
          </li>
        ))}
      </ol>
    </Bench>
  );
}
