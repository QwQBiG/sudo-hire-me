import { useState } from 'react';
import { Eye, Link2, Plus, Trash2, Unlink2 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { createLifetimeState, stepLifetime } from '../../domain/lifetime.mjs';
import './lifetime.css';

const actionNames: Record<string, string> = {
  allocate: '分配一块内存',
  alias: 'q = p',
  'drop-p': 'p = NULL',
  'drop-q': 'q = NULL',
  'free-p': 'free(p)',
  'free-q': 'free(q)',
  'read-p': '尝试读 *p',
  'read-q': '尝试读 *q',
};

function message(state: ReturnType<typeof createLifetimeState>) {
  if (!state.lastAction) return '尚未分配。先创建一块动态内存，再观察指针与目标的状态。';
  if (state.leaked) return '分配仍存在，但 p、q 均不再保存可用于释放的地址：这是内存泄漏。';
  if (state.lastOutcome === 'allocated') return '分配成功：p 指向一个值为 7 的教学对象，q 仍为空。';
  if (state.lastOutcome === 'aliased') return 'q 复制了 p 保存的指向，两者现在指向同一块分配。';
  if (state.lastOutcome === 'freed') return '这块分配已结束；所有旧别名都不能再安全访问目标。';
  if (state.lastOutcome === 'safe') return '当前指针仍指向活着的对象；教学模型里的读取结果为 7。';
  if (state.lastOutcome === 'dangling')
    return '这是释放后使用：模型拒绝读取，不假设程序会返回 7 或立刻崩溃。';
  if (state.lastOutcome === 'null') return '当前指针为空，不能解引用；模型没有执行读取。';
  return '只改变了一个指针变量；目标是否仍分配需看右侧资源状态。';
}

export default function Lifetime() {
  const [state, setState] = useState(createLifetimeState);
  const run = (action: string) => setState((previous) => stepLifetime(previous, action));
  const allocated = state.phase === 'allocated';

  return (
    <Experiment
      className="lifetime-lab"
      title="沿时间线追踪一块动态内存"
      subtitle="固定单线程 C 教学模型。p 和 q 是指针变量，方框是同一块 malloc 对象；无效操作只显示风险。"
      onReset={() => setState(createLifetimeState())}
    >
      <div className="lifetime-scene">
        <div className="lifetime-handles">
          {(['p', 'q'] as const).map((name) => (
            <div className={`lifetime-handle ${state[name]}`} key={name}>
              <code>{name}</code>
              <span>
                {state[name] === 'live'
                  ? '指向目标'
                  : state[name] === 'dangling'
                    ? '旧别名，不可用'
                    : 'NULL'}
              </span>
            </div>
          ))}
        </div>
        <div className={`lifetime-block ${state.phase} ${state.leaked ? 'leaked' : ''}`}>
          <small>malloc 对象</small>
          <strong>
            {state.phase === 'empty' ? '未分配' : state.phase === 'freed' ? '已释放' : '值 7'}
          </strong>
          <span>
            {state.leaked
              ? '已失去所有可释放路径'
              : allocated
                ? '仍处于分配状态'
                : '不能访问旧目标'}
          </span>
        </div>
      </div>
      <div className="lifetime-actions" aria-label="资源生命周期操作">
        <div>
          <button type="button" disabled={state.phase !== 'empty'} onClick={() => run('allocate')}>
            <Plus size={15} />
            分配
          </button>
          <button
            type="button"
            disabled={!allocated || state.p !== 'live' || state.q !== 'null'}
            onClick={() => run('alias')}
          >
            <Link2 size={15} />q = p
          </button>
          <button type="button" disabled={state.p === 'null'} onClick={() => run('drop-p')}>
            <Unlink2 size={15} />p = NULL
          </button>
          <button type="button" disabled={state.q === 'null'} onClick={() => run('drop-q')}>
            <Unlink2 size={15} />q = NULL
          </button>
        </div>
        <div>
          <button
            type="button"
            disabled={!allocated || state.p !== 'live'}
            onClick={() => run('free-p')}
          >
            <Trash2 size={15} />
            free(p)
          </button>
          <button
            type="button"
            disabled={!allocated || state.q !== 'live'}
            onClick={() => run('free-q')}
          >
            <Trash2 size={15} />
            free(q)
          </button>
          <button type="button" disabled={state.phase === 'empty'} onClick={() => run('read-p')}>
            <Eye size={15} />
            尝试读 *p
          </button>
          <button type="button" disabled={state.phase === 'empty'} onClick={() => run('read-q')}>
            <Eye size={15} />
            尝试读 *q
          </button>
        </div>
      </div>
      <div className="lifetime-timeline">
        <strong>操作顺序</strong>
        <ol>
          {state.history.length === 0 ? (
            <li className="empty">等待第一步</li>
          ) : (
            state.history.map((action: string, index: number) => (
              <li key={index}>{actionNames[action]}</li>
            ))
          )}
        </ol>
      </div>
      <p className={`experiment-status ${state.leaked ? 'lifetime-warning' : ''}`} role="status">
        {message(state)} 这里只判断生命周期状态，不进行真实的无效内存访问。
      </p>
    </Experiment>
  );
}
