import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Clock3, Download, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import type { DocumentSummary, LessonProgress } from '../types';

export function Document({
  document,
  documents,
  record,
  reducedMotion,
  update,
}: {
  document: DocumentSummary;
  documents: DocumentSummary[];
  record: LessonProgress;
  reducedMotion: boolean;
  update: (patch: Partial<LessonProgress>) => void;
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setBody('');
    setError(false);
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`${import.meta.env.BASE_URL}reading/${document.slug}.md`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Document request failed');
        const value = await response.text();
        if (active) setBody(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [document.slug, attempt]);
  const index = documents.findIndex((entry) => entry.slug === document.slug);
  const previous = documents[index - 1],
    next = documents[index + 1];
  return (
    <div className="document-layout">
      <article className="document">
        <a className="back-link" href="#/home">
          <ArrowLeft size={15} />
          全部文档
        </a>
        <header className="document-heading">
          <span className="eyebrow">{document.subject}</span>
          <h1>{document.title}</h1>
          <p>{document.description}</p>
          <div className="document-actions">
            <span>
              <Clock3 size={15} />
              {document.minutes} 分钟
            </span>
            <label>
              <input
                type="checkbox"
                checked={record.read}
                onChange={(event) => update({ read: event.currentTarget.checked })}
              />
              已读
            </label>
            <button
              className="icon-button"
              aria-pressed={record.bookmark}
              aria-label="收藏本课"
              title="收藏本课"
              onClick={() => update({ bookmark: !record.bookmark })}
            >
              <Bookmark size={17} fill={record.bookmark ? 'currentColor' : 'none'} />
            </button>
            <a
              className="icon-button"
              title="下载 Markdown"
              aria-label="下载 Markdown"
              download
              href={`${import.meta.env.BASE_URL}lessons/${document.slug}.md`}
            >
              <Download size={17} />
            </a>
          </div>
        </header>
        {error ? (
          <div className="empty" role="status">
            <p>文档暂时没能加载</p>
            <button className="secondary" onClick={() => setAttempt((value) => value + 1)}>
              <RotateCcw size={16} />
              重试
            </button>
          </div>
        ) : !body ? (
          <p role="status" className="empty">
            正在加载文档…
          </p>
        ) : (
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              components={{
                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                table: ({ node: _node, ...props }) => (
                  <div className="table-scroll">
                    <table {...props} />
                  </div>
                ),
                h2: ({ node, ...props }) => (
                  <h2 id={`section-${node?.position?.start.line}`} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 id={`section-${node?.position?.start.line}`} {...props} />
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        )}
        <nav className="document-next" aria-label="相邻课程">
          {previous ? (
            <a href={`#/lesson/${previous.slug}`}>
              <ArrowLeft size={17} />
              <span>
                <small>上一篇</small>
                {previous.title}
              </span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={`#/lesson/${next.slug}`}>
              <span>
                <small>下一篇</small>
                {next.title}
              </span>
              <ArrowRight size={17} />
            </a>
          )}
        </nav>
      </article>
      <aside className="document-rail">
        <details className="document-toc" open>
          <summary>本篇目录</summary>
          {document.headings.map((heading) => (
            <button
              key={heading.id}
              className={heading.depth === 3 ? 'nested' : ''}
              onClick={() => {
                window.document.getElementById(heading.id)?.scrollIntoView({
                  behavior:
                    reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'auto'
                      : 'smooth',
                  block: 'start',
                });
              }}
            >
              {heading.title}
            </button>
          ))}
        </details>
        <label className="document-notes">
          我的理解
          <textarea
            value={record.note}
            maxLength={5000}
            placeholder="用自己的话记下概念、例子和边界…"
            onChange={(event) => update({ note: event.target.value })}
          />
          <small>{record.note.length} / 5000</small>
        </label>
        {document.prerequisites.length > 0 && (
          <section className="prerequisites">
            <h2>先理解这些</h2>
            {document.prerequisites.map((slug) => (
              <a key={slug} href={`#/lesson/${slug}`}>
                {documents.find((entry) => entry.slug === slug)?.title}
                <ArrowRight size={14} />
              </a>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
