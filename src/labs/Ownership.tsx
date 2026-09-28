import { useState } from 'react';
import { ArrowRight, Box, RotateCcw } from 'lucide-react';

export default function Ownership() {
  const [operation, setOperation] = useState<'move' | 'borrow' | 'clone'>('move');
  const [applied, setApplied] = useState(false);
  const statements = { move: 'let b = a;', borrow: 'let b = &a;', clone: 'let b = a.clone();' };
  const explanation = {
    move: 'b 持有原值；a 不能再使用被移出的 String。字符串并未因此销毁。',
    borrow: 'b 是共享引用。a 仍持有字符串，b 不负责释放原字符串。',
    clone: 'b 持有独立的 String 副本。对这两个字符串之一的修改不影响另一个。',
  };
  return (
    <section className="lab" aria-label="所有权模型">
      <header className="lab-heading">
        <span>
          <Box size={18} />
          OWNERSHIP
        </span>
        <span className="lab-kind">规则推演 · 非编译执行</span>
      </header>
      <div className="lab-toolbar">
        <div className="segmented">
          {(['move', 'borrow', 'clone'] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={operation === mode}
              onClick={() => {
                setOperation(mode);
                setApplied(false);
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="ownership-board">
        <div className={`binding ${applied && operation === 'move' ? 'moved' : ''}`}>
          <small>绑定 a</small>
          <strong>String</strong>
          <span>{applied && operation === 'move' ? '已移出' : '拥有者'}</span>
        </div>
        <div className="ownership-connection">
          <span>{applied ? operation : 'owns'}</span>
          <ArrowRight size={27} />
        </div>
        <div className="string-buffer">
          <small>字符串内容</small>
          <code>h e l l o</code>
          <span>{applied && operation === 'move' ? '由 b 持有' : '由 a 持有'}</span>
        </div>
        {applied && (
          <div className={`binding new-binding ${operation === 'borrow' ? 'borrowed' : ''}`}>
            <small>绑定 b</small>
            <strong>{operation === 'borrow' ? '&String' : 'String'}</strong>
            <span>
              {operation === 'clone'
                ? '独立内容：hello'
                : operation === 'borrow'
                  ? '共享借用'
                  : '新拥有者'}
            </span>
          </div>
        )}
      </div>
      <div className="ownership-code">
        <code>
          let a = String::from("hello");
          <br />
          {applied ? statements[operation] : '// 等待下一步'}
        </code>
      </div>
      <p className="step-explanation" aria-live="polite">
        {applied ? explanation[operation] : 'a 持有字符串。选择一种操作，再观察使用权限如何变化。'}
      </p>
      {applied && operation === 'move' && (
        <div className="reference-error">
          <span>若此时使用 a：参考编译诊断</span>
          <code>error[E0382]: borrow of moved value: `a`</code>
        </div>
      )}
      <footer className="lab-footer">
        <button
          className="icon-button"
          title="重置"
          aria-label="重置所有权实验"
          onClick={() => setApplied(false)}
        >
          <RotateCcw size={16} />
        </button>
        <button className="lab-button" disabled={applied} onClick={() => setApplied(true)}>
          推演 {operation} <ArrowRight size={16} />
        </button>
      </footer>
    </section>
  );
}
