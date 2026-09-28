import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, WrapText } from 'lucide-react';
import { highlightCode } from '../domain/highlight.mjs';

type Token = ReturnType<typeof highlightCode>[number];
function renderToken(token: Token, index: number): ReactNode {
  if (token.type === 'text') return token.value;
  if (token.type !== 'element') return null;
  return (
    <span key={index} className={String(token.properties.className ?? '').replaceAll(',', ' ')}>
      {token.children.map(renderToken)}
    </span>
  );
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [wrapped, setWrapped] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const tokens = useMemo(() => highlightCode(code, language), [code, language]);
  const count = code.replace(/\n$/, '').split('\n').length;
  return (
    <figure className={`code-block ${wrapped ? 'wrap-code' : ''}`}>
      <figcaption>
        <span className="code-language">{language || 'text'}</span>
        <span className="code-line-count">{count} 行</span>
        <div className="code-tools">
          <button
            className="icon-button"
            aria-label="代码自动换行"
            title="代码自动换行"
            aria-pressed={wrapped}
            onClick={() => setWrapped(!wrapped)}
          >
            <WrapText size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={collapsed ? '展开代码' : '折叠代码'}
            title={collapsed ? '展开代码' : '折叠代码'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label="复制代码"
            title={copyState === 'copied' ? '已复制' : '复制代码'}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopyState('copied');
              } catch {
                setCopyState('error');
              }
            }}
          >
            {copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <span className="sr-only" role="status">
          {copyState === 'copied'
            ? '代码已复制'
            : copyState === 'error'
              ? '复制失败，请选中代码复制。'
              : ''}
        </span>
      </figcaption>
      {!collapsed && (
        <div className="code-block-body">
          {!wrapped && (
            <div className="code-gutter" aria-hidden="true">
              {Array.from({ length: count }, (_, index) => (
                <span key={index}>{index + 1}</span>
              ))}
            </div>
          )}
          <pre tabIndex={0} aria-label={`${language || 'text'} 代码`}>
            <code>{tokens.map(renderToken)}</code>
          </pre>
        </div>
      )}
    </figure>
  );
}
