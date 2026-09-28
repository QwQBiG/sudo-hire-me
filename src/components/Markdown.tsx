import { lazy, Suspense } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeBlock = lazy(() =>
  import('./CodeBlock').then((module) => ({ default: module.CodeBlock })),
);
const components: Components = {
  pre: ({ node, children }) => {
    const code = node?.children[0];
    if (code?.type !== 'element' || code.tagName !== 'code') return <pre>{children}</pre>;
    const classes = code.properties.className;
    const language = Array.isArray(classes)
      ? String(classes.find((value) => String(value).startsWith('language-')) ?? '').replace(
          'language-',
          '',
        )
      : '';
    const value = code.children.map((child) => (child.type === 'text' ? child.value : '')).join('');
    return (
      <Suspense
        fallback={
          <pre>
            <code>{value}</code>
          </pre>
        }
      >
        <CodeBlock code={value} language={language} />
      </Suspense>
    );
  },
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
