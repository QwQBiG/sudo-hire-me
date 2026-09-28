import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Github,
  Map,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { LessonSummary, Progress } from '../types';

interface Props {
  lessons: LessonSummary[];
  progress: Progress;
  route: string;
  open: boolean;
  query: string;
  setQuery: (query: string) => void;
  close: () => void;
  toggleMotion: () => void;
}
export function Sidebar({
  lessons,
  progress,
  route,
  open,
  query,
  setQuery,
  close,
  toggleMotion,
}: Props) {
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 720px)').matches);
  const panel = useRef<HTMLElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const media = matchMedia('(max-width: 720px)');
    const changed = () => setMobile(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls = () =>
      Array.from(panel.current?.querySelectorAll<HTMLElement>('a, button, input') ?? []);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose.current();
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [open, mobile]);
  const filtered = lessons.filter((l) =>
    `${l.title}${l.subject}${l.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={close}
          aria-label="关闭目录遮罩"
          tabIndex={-1}
        />
      )}
      <aside
        ref={panel}
        inert={mobile && !open}
        className={`sidebar ${open ? 'is-open' : ''}`}
        aria-label="学习导航"
      >
        <a className="brand" href="#/map" onClick={close}>
          <Code2 size={25} />
          <span>
            sudo<span className="brand-light"> hire me</span>
            <i>_</i>
          </span>
        </a>
        <button className="mobile-close icon-button" onClick={close} aria-label="关闭目录">
          <X size={20} />
        </button>
        <div className="workspace-label">INTERVIEW / LEARNING SPACE</div>
        <nav className="primary-nav">
          <a className={route === 'map' ? 'active' : ''} href="#/map" onClick={close}>
            <Map size={18} />
            关卡地图<span>{String(lessons.length).padStart(2, '0')}</span>
          </a>
          <a className={route === 'review' ? 'active' : ''} href="#/review" onClick={close}>
            <BookOpen size={18} />
            复习手册
          </a>
        </nav>
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="查找知识点"
            aria-label="查找知识点"
          />
        </label>
        <div className="nav-section-title">
          基础训练 <span>{lessons.length} 关</span>
        </div>
        <nav className="lesson-nav" aria-label="课程目录">
          {filtered.map((lesson) => (
            <a
              key={lesson.slug}
              href={`#/lesson/${lesson.slug}`}
              className={route === lesson.slug ? 'active' : ''}
              onClick={close}
            >
              <span
                className={`nav-number ${progress.lessons[lesson.slug]?.passed ? 'passed' : ''}`}
              >
                {progress.lessons[lesson.slug]?.passed ? (
                  <Check size={14} />
                ) : (
                  String(lesson.order + 1).padStart(2, '0')
                )}
              </span>
              <span>
                <strong>{lesson.title}</strong>
                <small>{lesson.subject}</small>
              </span>
              <ChevronRight size={14} />
            </a>
          ))}
        </nav>
        {!filtered.length && <p className="nav-empty">没有找到相关课程</p>}
        <div className="sidebar-bottom">
          <div className="save-status">
            <span />
            进度保存在此浏览器
          </div>
          <button
            className="motion-toggle"
            aria-pressed={progress.reducedMotion}
            onClick={toggleMotion}
          >
            <Sparkles size={16} />
            减少动效
            <span className={`switch ${progress.reducedMotion ? 'on' : ''}`} />
          </button>
          <a href="https://github.com/QwQBiG/sudo-hire-me" target="_blank" rel="noreferrer">
            <Github size={17} />
            GitHub 仓库
            <ChevronRight size={15} />
          </a>
        </div>
      </aside>
    </>
  );
}
