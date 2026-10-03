import { useState } from 'react';
import { ArrowRight, LockKeyhole, Scan, Pencil } from 'lucide-react';
import type { LabProps } from '../../types';
import { pointerPermission } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function CMechanics({ lesson }: LabProps) {
  const [kind, setKind] = useState('pointee');
  const [target, setTarget] = useState(0);
  const [values, setValues] = useState([10, 20]);
  const [note, setNote] = useState('选择声明，分别尝试修改指针和被指向的值。');
  const [scan, setScan] = useState(0);
  const [innerNul, setInnerNul] = useState(false);
  const [storage, setStorage] = useState('auto');
  const [calls, setCalls] = useState(0);
  const [counter, setCounter] = useState(0);
  const [linkage, setLinkage] = useState('external');
  const [linked, setLinked] = useState(false);
  const reset = () => {
    setTarget(0);
    setValues([10, 20]);
    setScan(0);
    setCalls(0);
    setCounter(0);
    setLinked(false);
    setNote('状态已重置。');
  };
  const bytes = innerNul ? ['a', '\\0', 'b', '\\0'] : ['a', 'b', 'c', '\\0'];
  const length = innerNul ? 1 : 3;
  const act = (action: string) => {
    if (!pointerPermission(kind, action))
      return setNote('编译期拒绝：当前 const 限制不允许此操作；未修改任何值。');
    if (action === 'rebind') setTarget(1 - target);
    else setValues(values.map((v, i) => (i === target ? v + 1 : v)));
    setNote(action === 'rebind' ? '指针可以重新指向另一对象。' : '可以通过此指针修改 int 对象。');
  };
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="C11 规则模型；不执行无效指针访问，也不假装调用本地编译器。"
      onReset={reset}
    >
      {lesson.slug === 'c-const-pointer' ? (
        <>
          <Choice
            label="const 声明"
            value={kind}
            options={[
              ['pointee', 'const int *p'],
              ['pointer', 'int * const p'],
              ['both', 'const int * const p'],
            ]}
            onChange={(v) => {
              setKind(v);
              reset();
            }}
          />
          <div className="exp-circuit">
            <div>
              <LockKeyhole />
              <small>指针 p</small>
              <strong>→ {target === 0 ? 'a' : 'b'}</strong>
            </div>
            <ArrowRight />
            {values.map((value, i) => (
              <div key={i} className={target === i ? 'active' : ''}>
                <small>对象 {i === 0 ? 'a' : 'b'}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="exp-actions">
            <button onClick={() => act('write')}>
              <Pencil size={16} />
              *p += 1
            </button>
            <button onClick={() => act('rebind')}>
              <ArrowRight size={16} />
              改变 p 指向
            </button>
          </div>
          <Feedback good={!note.startsWith('编译期拒绝')}>{note}</Feedback>
        </>
      ) : lesson.slug === 'c-sizeof-strlen' ? (
        <>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={innerNul}
              onChange={(e) => {
                setInnerNul(e.target.checked);
                setScan(0);
              }}
            />
            在索引 1 放入 NUL（Null Character）
          </label>
          <div className="exp-tape">
            {bytes.map((byte, i) => (
              <div key={i} className={scan === i ? 'active' : i < scan ? 'consumed' : ''}>
                <small>地址 +{i}</small>
                <strong>{byte}</strong>
                <span>{i === length ? '终止字符' : '数组字节'}</span>
              </div>
            ))}
          </div>
          <div className="exp-equation">
            <span>
              sizeof array = <b>4 B</b>
            </span>
            <span>
              strlen = <b>{scan === length ? length : '扫描中'}</b>
            </span>
          </div>
          <div className="exp-actions">
            <button disabled={scan === length} onClick={() => setScan(scan + 1)}>
              <Scan size={16} />
              扫描下一个字节
            </button>
          </div>
          <Feedback>
            {scan === length
              ? `遇到第一个 NUL，strlen 返回 ${length}；数组占用仍是 4 字节。`
              : 'sizeof 数组不扫描内容；strlen 必须读取字符，直到第一个 NUL。'}
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="局部变量存储期"
            value={storage}
            options={[
              ['auto', '自动局部变量'],
              ['static', 'static 局部变量'],
            ]}
            onChange={(v) => {
              setStorage(v);
              reset();
            }}
          />
          <div className="exp-counter">
            <small>函数已调用 {calls} 次</small>
            <strong>{counter}</strong>
            <span>
              {storage === 'static'
                ? '静态存储期 · 值跨调用保留'
                : '自动存储期 · 每次进入初始化为 0'}
            </span>
          </div>
          <div className="exp-actions">
            <button
              onClick={() => {
                setCalls(calls + 1);
                setCounter(storage === 'static' ? counter + 1 : 1);
              }}
            >
              <Pencil size={16} />
              调用 counter()
            </button>
          </div>
          <Choice
            label="文件作用域符号"
            value={linkage}
            options={[
              ['external', 'int total = 1;'],
              ['internal', 'static int total = 1;'],
            ]}
            onChange={(v) => {
              setLinkage(v);
              setLinked(false);
            }}
          />
          <div className="exp-circuit">
            <div>
              <small>a.c · 定义</small>
              <strong>total</strong>
            </div>
            <ArrowRight />
            <div className={linked && linkage === 'internal' ? 'blocked' : ''}>
              <small>b.c · extern 声明</small>
              <strong>
                {linked ? (linkage === 'external' ? '链接到定义' : '无法访问内部符号') : '待链接'}
              </strong>
            </div>
          </div>
          <div className="exp-actions">
            <button onClick={() => setLinked(true)}>
              <ArrowRight size={16} />
              解析跨文件引用
            </button>
          </div>
          <Feedback good={!linked || linkage === 'external'}>
            存储期回答“存在多久”，链接属性回答“不同声明是否指向同一实体”。extern
            声明不会把内部链接定义变成公共符号。
          </Feedback>
        </>
      )}
    </Bench>
  );
}
