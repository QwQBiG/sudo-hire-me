import { useState } from 'react';
import { ArrowRight, Code2, Plus, Trash2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function ZigMemory({ lesson }: LabProps) {
  const [allocated, setAllocated] = useState(false),
    [returned, setReturned] = useState(false);
  const [defer, setDefer] = useState(true),
    [oom, setOom] = useState(false);
  const [type, setType] = useState('i32'),
    [known, setKnown] = useState('compile'),
    [called, setCalled] = useState(false);
  const reset = () => {
    setAllocated(false);
    setReturned(false);
    setCalled(false);
  };
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="Zig 0.15.2 规则模型；分配与专门化可视化，不是在浏览器内运行 Zig 编译器。"
      onReset={reset}
    >
      {lesson.slug === 'zig-allocator-ownership' ? (
        <>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={defer}
              disabled={allocated || returned}
              onChange={(e) => setDefer(e.target.checked)}
            />
            分配成功后登记 defer allocator.free(buf)
          </label>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={oom}
              disabled={allocated || returned}
              onChange={(e) => setOom(e.target.checked)}
            />
            注入分配失败：OutOfMemory
          </label>
          <div className="exp-circuit">
            <div>
              <small>函数作用域</small>
              <strong>{returned ? '已退出' : '执行中'}</strong>
            </div>
            <ArrowRight />
            <div className={allocated ? 'active' : ''}>
              <small>allocator 所管理的资源</small>
              <strong>{allocated ? '16 字节仍占用' : '未占用'}</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button
              disabled={allocated || returned}
              onClick={() => (oom ? setReturned(true) : setAllocated(true))}
            >
              <Plus size={16} />
              try alloc(16)
            </button>
            <button
              disabled={!allocated || returned}
              onClick={() => {
                setReturned(true);
                if (defer) setAllocated(false);
              }}
            >
              <Trash2 size={16} />
              从函数返回
            </button>
          </div>
          <Feedback good={!returned || !allocated}>
            {returned && allocated
              ? '退出时没有释放；复制一个 slice 不会自动产生另一个资源拥有者。'
              : returned && oom
                ? '分配失败，没有资源可释放；try 将错误交给调用者。'
                : returned
                  ? 'defer 在作用域退出时释放资源；不能把这段已释放内存的 slice 返回给外部使用。'
                  : 'allocator 明确由调用者提供；资源归属和释放契约仍由代码约定。'}{' '}
            此处没有模拟任意内存地址或真实泄漏检测器。
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="类型实参"
            value={type}
            options={[
              ['i32', 'i32'],
              ['f64', 'f64'],
            ]}
            onChange={(v) => {
              setType(v);
              setCalled(false);
            }}
          />
          <Choice
            label="类型何时可知"
            value={known}
            options={[
              ['compile', '编译期已知'],
              ['runtime', '试图运行时选择 type'],
            ]}
            onChange={(v) => {
              setKnown(v);
              setCalled(false);
            }}
          />
          <div className="exp-circuit">
            <div>
              <Code2 />
              <small>twice(comptime T: type, x: T)</small>
              <strong>T = {type}</strong>
            </div>
            <ArrowRight />
            <div className={called ? (known === 'compile' ? 'active' : 'blocked') : ''}>
              <small>编译器处理</small>
              <strong>
                {called ? (known === 'compile' ? `twice(${type}, ...)` : '编译拒绝') : '待检查'}
              </strong>
            </div>
          </div>
          <div className="exp-actions">
            <button onClick={() => setCalled(true)}>
              <Code2 size={16} />
              检查类型实参
            </button>
          </div>
          <Feedback good={!called || known === 'compile'}>
            {known === 'compile'
              ? 'T 必须在编译期已知，x 仍可在运行时输入。comptime 不代表函数的每次调用都在编译期完成。'
              : '运行时整数/枚举可以选择分支，但不能直接成为要求编译期已知的 type 实参。可用显式分支选择已编译的不同实例。'}
          </Feedback>
        </>
      )}
    </Bench>
  );
}
