import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Code2,
  Github,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import catalog from '../.generated/documents.json';
import { Catalog } from './components/Catalog';
import { MemoryTools } from './components/MemoryTools';
import { useProgress } from './hooks/useProgress';
import { freshLesson } from './domain/progress.mjs';
import type { DocumentSummary } from './types';

const documents = catalog as DocumentSummary[];
const Document = lazy(() =>
  import('./components/Document').then((module) => ({ default: module.Document })),
);
const slugs = documents.map((document) => document.slug);
const subjects = [...new Set(documents.map((document) => document.subject))];
function route() {
  try {
    return decodeURIComponent(location.hash.replace(/^#\/lesson\//, ''));
  } catch {
    return 'invalid-route';
  }
}

export default function App() {
  const [slug, setSlug] = useState(route);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 900px)').matches);
  const [collapsed, setCollapsed] = useState(false);
  const selected = documents.find((document) => document.slug === slug);
  const [expanded, setExpanded] = useState(selected?.subject ?? subjects[0]);
  const { progress, update, importProgress, setProgress, warning } = useProgress(slugs);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 900px)');
    const changed = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    const changed = () => {
      setSlug(route());
      setOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (selected) setExpanded(selected.subject);
    document.title = `${selected?.title ?? '面试基础文档'} · sudo hire me`;
  }, [selected]);
  useEffect(() => {
    document.documentElement.dataset.motion = progress.reducedMotion ? 'reduced' : 'full';
  }, [progress.reducedMotion]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () =>
      [...(sidebar.current?.querySelectorAll<HTMLElement>('a,button,input') ?? [])].filter(
        (element) => element.getClientRects().length,
      );
    controls()[0]?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab') return;
      const items = controls(),
        first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keys);
      previous?.focus();
    };
  }, [open]);
  const filtered = documents.filter((document) =>
    `${document.title} ${document.description} ${document.subject} ${document.headings.map((heading) => heading.title).join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  const knownHome = ['', '#/home', '#/map', '#/review'].includes(slug);
  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''} ${open ? 'menu-open' : ''}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        跳到内容
      </a>
      {open && <button className="backdrop" aria-label="关闭导航" onClick={() => setOpen(false)} />}
      <aside
        className="sidebar"
        ref={sidebar}
        inert={mobile && !open}
        aria-hidden={mobile && !open}
        aria-label="课程导航"
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
      >
        <div className="brand-row">
          <a className="brand" href="#/home" onClick={() => setOpen(false)}>
            <Code2 size={24} />
            <span>
              sudo hire me<i>_</i>
            </span>
          </a>
          <button
            className="icon-button desktop"
            aria-label={collapsed ? '展开导航' : '收起导航'}
            title={collapsed ? '展开导航' : '收起导航'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            className="icon-button mobile"
            aria-label="关闭导航"
            onClick={() => setOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <span className="brand-caption">INTERVIEW / FREE DOCUMENTS</span>
        <a
          className={`directory-link ${knownHome ? 'active' : ''}`}
          href="#/home"
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          title="全部文档"
        >
          <BookOpen size={19} />
          <span>全部文档</span>
          <small>{documents.length}</small>
        </a>
        <nav className="nav-contents" aria-label="主题分类">
          {subjects.map((subject, index) => (
            <div className="subject-group" key={subject}>
              <button
                className="subject-toggle"
                aria-expanded={expanded === subject}
                aria-controls={`group-${index}`}
                onClick={() => setExpanded(expanded === subject ? '' : subject)}
              >
                <span>{subject}</span>
                <ChevronDown size={15} />
              </button>
              <div id={`group-${index}`} hidden={expanded !== subject}>
                {documents
                  .filter((document) => document.subject === subject)
                  .map((document) => (
                    <a
                      className={slug === document.slug ? 'active' : ''}
                      href={`#/lesson/${document.slug}`}
                      key={document.slug}
                      onClick={() => setOpen(false)}
                    >
                      <span>{String(document.order + 1).padStart(2, '0')}</span>
                      {document.title}
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="nav-bottom">
          <label title="减弱动效">
            <Sparkles size={16} />
            <span>减弱动效</span>
            <input
              type="checkbox"
              checked={progress.reducedMotion}
              onChange={(event) =>
                setProgress((old) => ({ ...old, reducedMotion: event.currentTarget.checked }))
              }
            />
          </label>
          <a href="https://github.com/QwQBiG/sudo-hire-me" title="GitHub 文档">
            <Github size={17} />
            <span>GitHub 文档</span>
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile"
            aria-label="打开导航"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <a className="top-brand" href="#/home">
            <Code2 size={19} />
            <span>文档阅读</span>
          </a>
          <label className="search">
            <Search size={17} />
            <input
              aria-label="搜索文档"
              placeholder="查找概念或课程"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (selected) location.hash = '/home';
              }}
            />
          </label>
          <MemoryTools progress={progress} importProgress={importProgress} />
        </header>
        {warning && (
          <p className="notice" role="status">
            {warning}
          </p>
        )}
        <main className="main" id="main" tabIndex={-1}>
          {selected ? (
            <Suspense
              fallback={
                <p className="empty" role="status">
                  正在打开文档…
                </p>
              }
            >
              <Document
                key={slug}
                document={selected}
                documents={documents}
                record={progress.lessons[slug] ?? freshLesson()}
                reducedMotion={progress.reducedMotion}
                update={(patch) => update(slug, patch)}
              />
            </Suspense>
          ) : knownHome ? (
            <Catalog documents={filtered} progress={progress} query={query} />
          ) : (
            <section className="empty">
              <h1>没有找到这篇文档</h1>
              <a href="#/home">返回课程目录</a>
            </section>
          )}
        </main>
        <footer>
          <span>sudo hire me_</span>
          <a href="https://github.com/QwQBiG/sudo-hire-me/tree/main/content/lessons">
            Markdown 原文
          </a>
        </footer>
      </div>
    </div>
  );
}
