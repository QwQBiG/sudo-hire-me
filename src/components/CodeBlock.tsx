import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Copy, WrapText } from 'lucide-react';
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
  const [wrapped, setWrapped] = useState(() => matchMedia('(max-width: 720px)').matches);
  const [collapsed, setCollapsed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copiedCode, setCopiedCode] = useState('');
  const visibleCopyState = copiedCode === code ? copyState : 'idle';
  const bodyId = useId();
  const body = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, left: false, right: false });
  const tokens = useMemo(() => highlightCode(code, language), [code, language]);
  const count = code.replace(/\n$/, '').split('\n').length;
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const measure = () =>
      setScroll({
        overflow: element.scrollWidth > element.clientWidth + 1,
        left: element.scrollLeft > 1,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [code, wrapped, collapsed]);
  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [copyState, code]);
  const pan = (direction: number) => {
    const reduced =
      document.documentElement.dataset.motion === 'reduced' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.current?.scrollBy({
      left: direction * body.current.clientWidth * 0.7,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };
  return (
    <figure className={`code-block ${wrapped ? 'wrap-code' : ''}`}>
      <figcaption>
        <span className="code-language">{language || 'text'}</span>
        <span className="code-line-count">{count} 行</span>
        <div className="code-tools">
          {!wrapped && !collapsed && scroll.overflow && (
            <>
              <button
                className="icon-button"
                title="向左查看代码"
                aria-label="向左查看代码"
                disabled={!scroll.left}
                onClick={() => pan(-1)}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="icon-button"
                title="向右查看代码"
                aria-label="向右查看代码"
                disabled={!scroll.right}
                onClick={() => pan(1)}
              >
                <ArrowRight size={16} />
              </button>
            </>
          )}
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
            aria-controls={bodyId}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label="复制代码"
            title={visibleCopyState === 'copied' ? '已复制' : '复制代码'}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopiedCode(code);
                setCopyState('copied');
              } catch {
                setCopiedCode(code);
                setCopyState('error');
              }
            }}
          >
            {visibleCopyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <span className="sr-only" role="status">
          {visibleCopyState === 'copied'
            ? '代码已复制'
            : visibleCopyState === 'error'
              ? '复制失败，请选中代码复制。'
              : ''}
        </span>
      </figcaption>
      {!collapsed && (
        <div
          id={bodyId}
          ref={body}
          className="code-block-body"
          tabIndex={0}
          aria-label={`${language || 'text'} 代码`}
        >
          {!wrapped && (
            <div className="code-gutter" aria-hidden="true">
              {Array.from({ length: count }, (_, index) => (
                <span key={index}>{index + 1}</span>
              ))}
            </div>
          )}
          <pre>
            <code>{tokens.map(renderToken)}</code>
          </pre>
        </div>
      )}
    </figure>
  );
}
