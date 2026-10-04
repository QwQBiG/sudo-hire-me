import { useState } from 'react';
import { ArrowRight, Plus, Trash2, Link, Unlink } from 'lucide-react';
import type { LabProps } from '../../types';
import { referenceState } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function CppMechanics({ lesson }: LabProps) {
  const [strong, setStrong] = useState(1),
    [weak, setWeak] = useState(0);
  const [owner, setOwner] = useState('shared');
  const [expression, setExpression] = useState('x');
  const [reference, setReference] = useState('mutable');
  const [attempted, setAttempted] = useState(false);
  const reset = () => {
    setStrong(1);
    setWeak(0);
    setAttempted(false);
  };
  const state = referenceState(strong, weak);
  const category =
    expression === 'x' || expression === 'named'
      ? 'lvalue'
      : expression === 'move'
        ? 'xvalue'
        : 'prvalue';
  const bind =
    reference === 'const' ||
    (reference === 'mutable' ? category === 'lvalue' : category !== 'lvalue');
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="C++17 表达式与资源规则模型；不对已失效迭代器执行解引用。"
      onReset={reset}
    >
      {lesson.slug === 'cpp-smart-pointers' ? (
        <>
          <Choice
            label="所有权模式"
            value={owner}
            options={[
              ['unique', 'unique_ptr'],
              ['shared', 'shared_ptr / weak_ptr'],
            ]}
            onChange={(v) => {
              setOwner(v);
              reset();
            }}
          />
          <div className="exp-ownership">
            <div>
              <small>强拥有者</small>
              <strong>{strong}</strong>
              {Array.from({ length: strong }, (_, i) => (
                <span key={i}>owner {i + 1}</span>
              ))}
            </div>
            <ArrowRight />
            <div className={state.valueAlive ? 'active' : 'blocked'}>
              <small>管理的对象</small>
              <strong>{state.valueAlive ? '存活' : '已析构'}</strong>
            </div>
            <div>
              <small>弱观察者</small>
              <strong>{weak}</strong>
              <span>不延长对象生命</span>
            </div>
          </div>
          <div className="exp-actions">
            <button
              disabled={owner === 'unique' || strong === 0 || strong === 4}
              onClick={() => setStrong(strong + 1)}
            >
              <Plus size={16} />
              复制强引用
            </button>
            <button disabled={!strong} onClick={() => setStrong(strong - 1)}>
              <Trash2 size={16} />
              释放强引用
            </button>
            <button
              disabled={owner === 'unique' || !strong || weak === 4}
              onClick={() => setWeak(weak + 1)}
            >
              <Link size={16} />
              创建弱引用
            </button>
            <button disabled={!weak} onClick={() => setWeak(weak - 1)}>
              <Unlink size={16} />
              释放弱引用
            </button>
          </div>
          <Feedback good={state.valueAlive}>
            {state.valueAlive
              ? '最后一个强拥有者释放时才析构对象。'
              : '对象已析构，weak_ptr::lock() 无法让它复活。'}{' '}
            控制块{state.controlAlive ? '仍有句柄关联' : '已无句柄关联'}。unique_ptr
            不能复制，可移动；本图不把线程安全扩展到对象内部。
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="表达式"
            value={expression}
            options={[
              ['x', 'x'],
              ['literal', '42'],
              ['move', 'std::move(x)'],
              ['named', '具名 int&& r：表达式 r'],
            ]}
            onChange={(v) => {
              setExpression(v);
              setAttempted(false);
            }}
          />
          <Choice
            label="目标引用"
            value={reference}
            options={[
              ['mutable', 'int&'],
              ['const', 'const int&'],
              ['rvalue', 'int&&'],
            ]}
            onChange={(v) => {
              setReference(v);
              setAttempted(false);
            }}
          />
          <div className="exp-circuit">
            <div className="active">
              <small>表达式值类别</small>
              <strong>{category}</strong>
            </div>
            <ArrowRight />
            <div className={attempted ? (bind ? 'active' : 'blocked') : ''}>
              <small>初始化引用</small>
              <strong>{attempted ? (bind ? '允许绑定' : '编译拒绝') : '?'}</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button onClick={() => setAttempted(true)}>
              <Link size={16} />
              检查绑定
            </button>
          </div>
          <Feedback good={!attempted || bind}>
            这里的 x/r 均为非 const int。std::move
            只转换值类别，不搬移资源；具名右值引用变量在表达式中是左值。
          </Feedback>
        </>
      )}
    </Bench>
  );
}
