import { useState, type ReactNode } from 'react';
import { Check, Copy, WrapText } from 'lucide-react';

export function CodeBlock({ children }: { children: ReactNode }) {
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  return (
    <figure className={`code-block ${wrap ? 'wrapped' : ''}`}>
      <figcaption>
        <span>CODE</span>
        <div>
          <button
            aria-label="代码自动换行"
            title="代码自动换行"
            aria-pressed={wrap}
            onClick={() => setWrap((old) => !old)}
          >
            <WrapText size={16} />
          </button>
          <button
            aria-label="复制代码"
            title="复制代码"
            onClick={async (event) => {
              const code =
                event.currentTarget.closest('figure')?.querySelector('code')?.textContent ?? '';
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setError('');
              } catch {
                setError('未能复制，请选择代码文本。');
              }
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </figcaption>
      <pre>{children}</pre>
      {error && <p role="status">{error}</p>}
    </figure>
  );
}
