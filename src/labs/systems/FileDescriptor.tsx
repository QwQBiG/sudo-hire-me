import { useState } from 'react';
import { Copy, FilePlus2, FolderOpen, ScanText, X } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { advanceDescriptor, createDescriptorState } from '../../domain/file-descriptor.mjs';
import './file-descriptor.css';
import './systems-quality.css';

const commands = [
  { action: 'open-note', label: 'open(note.txt)', icon: FolderOpen },
  { action: 'dup3', label: 'dup(3)', icon: Copy },
  { action: 'read3', label: 'read(3, 2)', icon: ScanText },
  { action: 'read4', label: 'read(4, 2)', icon: ScanText },
  { action: 'close3', label: 'close(3)', icon: X },
  { action: 'open-other', label: 'open(other.txt)', icon: FilePlus2 },
] as const;

export default function FileDescriptor() {
  const [state, setState] = useState(() => createDescriptorState());
  const descriptions = Object.entries(state.descriptions).filter(([id]) => id.startsWith('F'));

  return (
    <Experiment
      title="fd 数字怎样连到打开文件"
      subtitle="单进程教学表：0、1、2 已占用；note.txt 内容 ABCDE，other.txt 内容 xyz。"
      onReset={() => setState(createDescriptorState())}
      className="fd-lab"
    >
      <div className="fd-layout">
        <div className="fd-panel">
          <h4>当前进程 · 描述符表</h4>
          <div className="fd-column-heading">
            <span>fd</span>
            <span>引用的打开文件描述</span>
          </div>
          <div className="fd-slots">
            {Array.from({ length: 7 }, (_, fd) => {
              const id = state.slots[fd];
              const shared =
                id && Object.values(state.slots).filter((value) => value === id).length > 1;
              return (
                <div className="fd-slot" data-open={!!id} data-shared={!!shared} key={fd}>
                  <strong>{fd}</strong>
                  <span>{id ? `${id} · ${state.descriptions[id].label}` : '空位'}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="fd-panel fd-objects">
          <h4>打开文件描述 · 文件偏移</h4>
          {descriptions.length ? (
            descriptions.map(([id, description]) => {
              const references = Object.values(state.slots).filter((value) => value === id).length;
              return (
                <div className="fd-object" key={id}>
                  <div>
                    <strong>{id}</strong>
                    <span>{description.label}</span>
                    <small>{references} 个 fd 引用</small>
                  </div>
                  <div className="fd-offset">
                    <small>偏移</small>
                    <strong>{description.offset}</strong>
                    <code>{description.content}</code>
                    <div
                      className="system-tokens"
                      aria-label={`文件内容，当前偏移 ${description.offset}`}
                    >
                      {[...description.content].map((byte, index) => (
                        <span
                          key={index}
                          data-consumed={index < description.offset}
                          data-current={index === description.offset}
                        >
                          {byte}
                        </span>
                      ))}
                      <span data-current={description.offset === description.content.length}>
                        EOF
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="fd-empty">尚未打开本实验的文件。</p>
          )}
        </div>
      </div>

      <div className="fd-actions" aria-label="文件描述符操作">
        {commands.map(({ action, label, icon: Icon }) => (
          <button key={action} onClick={() => setState((old) => advanceDescriptor(old, action))}>
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <p className="experiment-status fd-status" role="status">
        {state.message}
      </p>
      {state.events.length > 0 && (
        <ol className="fd-events" aria-label="最近的文件操作">
          {state.events.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ol>
      )}
    </Experiment>
  );
}
