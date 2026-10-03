import { useState } from 'react';
import { ArrowRight, Box, RotateCcw } from 'lucide-react';
import './foundations/foundations-quality.css';

export default function Ownership() {
  const [operation, setOperation] = useState<'move' | 'borrow' | 'clone'>('move');
  const [applied, setApplied] = useState(false);
  const [inspection, setInspection] = useState('');
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
                setInspection('');
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="foundation-ownership" data-mode={applied ? operation : 'ready'}>
        <svg viewBox="0 0 600 230" preserveAspectRatio="none" aria-hidden="true">
          {!(applied && operation === 'move') && <path d="M190 60 C280 60 320 60 405 60" />}
          {applied && (
            <path
              className={operation === 'borrow' ? 'borrow-link' : ''}
              d={
                operation === 'clone'
                  ? 'M190 170 C280 170 320 170 405 170'
                  : 'M190 170 C290 170 315 60 405 60'
              }
            />
          )}
        </svg>
        <div className={`foundation-binding ${applied && operation === 'move' ? 'moved' : ''}`}>
          <small>绑定 a · String</small>
          <strong>{applied && operation === 'move' ? '已移出' : '拥有者'}</strong>
          <span>{applied && operation === 'move' ? '原绑定不可再读' : '持有原缓冲区'}</span>
        </div>
        <div className="foundation-buffer">
          <small>原缓冲区 · 教学标识 #1</small>
          <code>h e l l o</code>
          <span>由 {applied && operation === 'move' ? 'b' : 'a'} 负责释放</span>
        </div>
        <div
          className={`foundation-binding ${!applied ? 'empty' : operation === 'borrow' ? 'borrowed' : ''}`}
        >
          <small>绑定 b · {applied && operation === 'borrow' ? '&String' : 'String'}</small>
          <strong>{!applied ? '尚未创建' : operation === 'borrow' ? '共享引用' : '拥有者'}</strong>
          <span>
            {!applied
              ? '等待操作'
              : operation === 'clone'
                ? '持有独立副本'
                : operation === 'borrow'
                  ? '不负责释放原值'
                  : '接收原缓冲区'}
          </span>
        </div>
        <div className={`foundation-buffer ${applied && operation === 'clone' ? '' : 'empty'}`}>
          <small>
            {applied && operation === 'clone' ? '独立缓冲区 · 教学标识 #2' : '未创建第二个缓冲区'}
          </small>
          <code>{applied && operation === 'clone' ? 'h e l l o' : '—'}</code>
          <span>
            {applied && operation === 'clone' ? '由 b 负责释放' : 'move / borrow 不复制字符串内容'}
          </span>
        </div>
      </div>
      <div className="ownership-code">
        <code>
          let a = String::from("hello");
          <br />
          {applied ? statements[operation] : '// 等待下一步'}
        </code>
      </div>
      <div className="foundation-search-cases" role="group" aria-label="尝试读取绑定">
        <button
          onClick={() =>
            setInspection(
              applied && operation === 'move'
                ? '读取 a 被拒绝：String 已移出，参考诊断 E0382。'
                : '读取 a：hello。a 仍拥有原值。',
            )
          }
        >
          尝试读取 a
        </button>
        <button
          disabled={!applied}
          onClick={() =>
            setInspection(
              `读取 b：hello。${operation === 'clone' ? '来自独立副本。' : operation === 'borrow' ? '经共享引用读取原值。' : '来自接收的原值。'}`,
            )
          }
        >
          尝试读取 b
        </button>
      </div>
      {inspection && (
        <p className="foundation-state-strip" role="status">
          {inspection}
        </p>
      )}
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
          onClick={() => {
            setApplied(false);
            setInspection('');
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="lab-button"
          disabled={applied}
          onClick={() => {
            setApplied(true);
            setInspection('');
          }}
        >
          推演 {operation} <ArrowRight size={16} />
        </button>
      </footer>
    </section>
  );
}
