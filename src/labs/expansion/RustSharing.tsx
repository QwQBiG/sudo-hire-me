import { useState } from 'react';
import { ArrowRight, Link, Plus, Trash2, Unlink } from 'lucide-react';
import type { LabProps } from '../../types';
import { referenceState, threadTraits } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function RustSharing({ lesson }: LabProps) {
  const [kind, setKind] = useState('Rc');
  const [strong, setStrong] = useState(1),
    [weak, setWeak] = useState(0);
  const [note, setNote] = useState('创建弱引用，然后释放所有强引用，观察升级是否还能成功。');
  const traits = threadTraits(kind),
    state = referenceState(strong, weak);
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="安全 Rust 类型规则模型；泛型载荷固定为 String 或 i32，不演示 unsafe 手写标记。"
      onReset={() => {
        setStrong(1);
        setWeak(0);
        setNote('已重置。');
      }}
    >
      {lesson.slug === 'rust-send-sync' ? (
        <>
          <Choice
            label="待检查类型"
            value={kind}
            options={[
              ['String', 'String'],
              ['Rc', 'Rc<String>'],
              ['Cell', 'Cell<i32>'],
              ['RefCell', 'RefCell<i32>'],
              ['Arc', 'Arc<String>'],
              ['ArcRefCell', 'Arc<RefCell<i32>>'],
            ]}
            onChange={setKind}
          />
          <div className="exp-gates">
            <div className={traits.send ? 'active' : 'blocked'}>
              <small>Send</small>
              <strong>{traits.send ? '可跨线程移动' : '拒绝移动'}</strong>
              <span>转交值的所有权</span>
            </div>
            <div className={traits.sync ? 'active' : 'blocked'}>
              <small>Sync</small>
              <strong>{traits.sync ? '可跨线程共享 &T' : '拒绝共享 &T'}</strong>
              <span>T: Sync ⇔ &T: Send</span>
            </div>
          </div>
          <Feedback good={traits.send && traits.sync}>
            {kind === 'ArcRefCell'
              ? 'Arc 的引用计数是原子的，但 RefCell 的借用计数没有线程同步；套 Arc 不会自动让载荷线程安全。'
              : kind === 'Cell' || kind === 'RefCell'
                ? '可以把这个对象整体移交给另一线程；不能同时把共享引用发给多个线程。'
                : kind === 'Rc'
                  ? 'Rc 使用非原子引用计数，不允许这些跨线程传递。'
                  : '此处载荷支持 Send + Sync。Arc<T> 的相关实现仍要求 T 满足对应边界。'}
          </Feedback>
        </>
      ) : (
        <>
          <div className="exp-ownership">
            <div>
              <small>Rc / Arc 强引用</small>
              <strong>{strong}</strong>
            </div>
            <ArrowRight />
            <div className={state.valueAlive ? 'active' : 'blocked'}>
              <small>载荷</small>
              <strong>{state.valueAlive ? 'Alive' : 'Dropped'}</strong>
            </div>
            <div>
              <small>Weak 观察者</small>
              <strong>{weak}</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button disabled={!strong || strong === 4} onClick={() => setStrong(strong + 1)}>
              <Plus size={16} />
              clone 强引用
            </button>
            <button disabled={!strong} onClick={() => setStrong(strong - 1)}>
              <Trash2 size={16} />
              drop 强引用
            </button>
            <button disabled={!strong || weak === 4} onClick={() => setWeak(weak + 1)}>
              <Link size={16} />
              downgrade
            </button>
            <button disabled={!weak} onClick={() => setWeak(weak - 1)}>
              <Unlink size={16} />
              drop Weak
            </button>
            <button
              disabled={!weak || strong === 4}
              onClick={() => {
                if (state.canUpgrade) setStrong(strong + 1);
                setNote(
                  state.canUpgrade
                    ? 'upgrade() → Some，新建了一个强引用。'
                    : 'upgrade() → None，载荷不会复活。',
                );
              }}
            >
              <ArrowRight size={16} />
              upgrade
            </button>
          </div>
          <Feedback good={state.valueAlive}>
            {note} 当前显式弱句柄 {weak}，不包含实现中的隐式弱计数。Rc/Arc clone 不复制载荷。
          </Feedback>
        </>
      )}
    </Bench>
  );
}
