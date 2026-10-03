import { useState } from 'react';
import { ArrowRight, Play, Pencil, Save } from 'lucide-react';
import type { LabProps } from '../../types';
import { creationMode } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function Unix({ lesson }: LabProps) {
  const [parent, setParent] = useState(true),
    [child, setChild] = useState('running'),
    [reaped, setReaped] = useState(false);
  const [requested, setRequested] = useState(0o666),
    [mask, setMask] = useState(0o022);
  const [mapping, setMapping] = useState('shared'),
    [memory, setMemory] = useState(10),
    [pageCache, setPageCache] = useState(10),
    [disk, setDisk] = useState(10),
    [mapped, setMapped] = useState(true);
  const mode = creationMode(requested, mask);
  const reset = () => {
    setParent(true);
    setChild('running');
    setReaped(false);
    setMemory(10);
    setPageCache(10);
    setDisk(10);
    setMapped(true);
  };
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle="Linux 进程与映射教学模型；文件权限排除 ACL，映射排除设备与远程文件系统。"
      onReset={reset}
    >
      {lesson.slug === 'linux-zombie-orphan' ? (
        <>
          <div className="exp-process-tree">
            <div className={parent ? 'active' : 'blocked'}>
              <small>原父进程</small>
              <strong>{parent ? 'Running' : 'Exited'}</strong>
            </div>
            <ArrowRight />
            <div className={child === 'running' ? 'active' : reaped ? 'blocked' : ''}>
              <small>{parent ? '子进程' : '被收养的子进程'}</small>
              <strong>{reaped ? '已回收' : child === 'running' ? 'Running' : 'Zombie'}</strong>
              <span>父关系：{parent ? '原父进程' : '最近 subreaper 或命名空间 init'}</span>
            </div>
          </div>
          <div className="exp-actions">
            <button disabled={child !== 'running'} onClick={() => setChild('exited')}>
              <Play size={16} />
              子进程退出
            </button>
            <button disabled={!parent} onClick={() => setParent(false)}>
              <Play size={16} />
              原父进程退出
            </button>
            <button disabled={child === 'running' || reaped} onClick={() => setReaped(true)}>
              <Play size={16} />
              当前父进程 wait()
            </button>
          </div>
          <Feedback>
            {reaped
              ? '退出状态已读取，内核回收进程记录。'
              : child === 'exited'
                ? '已经退出但尚未被等待：这是僵尸，不执行代码；kill 不能代替父进程回收。'
                : !parent
                  ? '父进程退出、子进程仍运行：这是孤儿，不等于僵尸。收养不会直接终止子进程。'
                  : '先让父或子退出，比较两个概念。'}{' '}
            模型保留显式 wait 按钮；真实 init/subreaper 会按其实现安排回收。
          </Feedback>
        </>
      ) : lesson.slug === 'linux-permissions-umask' ? (
        <>
          <Choice
            label="创建请求"
            value={String(requested)}
            options={[
              [String(0o666), '普通文件 0666'],
              [String(0o777), '目录 0777'],
            ]}
            onChange={(v) => setRequested(Number(v))}
          />
          <Choice
            label="umask"
            value={String(mask)}
            options={[
              [String(0o022), '0022'],
              [String(0o077), '0077'],
              [String(0o027), '0027'],
            ]}
            onChange={(v) => setMask(Number(v))}
          />
          <div className="exp-permissions">
            {['owner', 'group', 'other'].map((who, row) => (
              <div key={who}>
                <b>{who}</b>
                {['r', 'w', 'x'].map((permission, col) => {
                  const bit = 1 << (8 - row * 3 - col);
                  return (
                    <span key={permission} className={mode & bit ? 'active' : 'blocked'}>
                      {permission}
                      <small>{requested & bit ? (mask & bit ? '被掩掉' : '保留') : '未请求'}</small>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="exp-equation">
            <code>
              {requested.toString(8).padStart(4, '0')} &amp; ~{mask.toString(8).padStart(4, '0')}
            </code>
            <ArrowRight />
            <strong>{mode.toString(8).padStart(4, '0')}</strong>
          </div>
          <Feedback>
            umask 只能去掉请求中的权限，不会增加执行位，也不是八进制减法。目录 x
            表示可穿过目录；目录 w 通常结合 x 才能创建或删除目录项。
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="映射模式"
            value={mapping}
            options={[
              ['shared', 'MAP_SHARED'],
              ['private', 'MAP_PRIVATE'],
            ]}
            onChange={(v) => {
              setMapping(v);
              reset();
            }}
          />
          <div className="exp-circuit">
            <div className={mapped ? 'active' : 'blocked'}>
              <small>进程映射</small>
              <strong>{mapped ? memory : '解除映射'}</strong>
            </div>
            <ArrowRight />
            <div>
              <small>文件页缓存</small>
              <strong>{pageCache}</strong>
            </div>
            <ArrowRight />
            <div>
              <small>本模型的写回值</small>
              <strong>{disk}</strong>
            </div>
          </div>
          <div className="exp-actions">
            <button
              disabled={!mapped}
              onClick={() => {
                setMemory(memory + 1);
                if (mapping === 'shared') setPageCache(memory + 1);
              }}
            >
              <Pencil size={16} />
              写入映射
            </button>
            <button
              disabled={!mapped || mapping === 'private' || pageCache === disk}
              onClick={() => setDisk(pageCache)}
            >
              <Save size={16} />
              msync(MS_SYNC)
            </button>
            <button disabled={!mapped} onClick={() => setMapped(false)}>
              <Play size={16} />
              munmap()
            </button>
          </div>
          <Feedback>
            {mapping === 'private'
              ? '首次写入形成进程私有副本，不把这次修改提交给文件；其他共享映射仍看文件页缓存。'
              : '共享映射修改可在共享页上可见，但可见性、同步协议和持久化是不同问题。'}{' '}
            munmap 不是“保证落盘”；图中写回是概念模型，不保证掉电持久性。
          </Feedback>
        </>
      )}
    </Bench>
  );
}
