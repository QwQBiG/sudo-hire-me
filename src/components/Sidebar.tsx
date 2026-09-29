import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Github,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { SelectField } from './SelectField';
import type { LessonSummary, Progress } from '../types';

interface Props {
  lessons: LessonSummary[];
  progress: Progress;
  route: string;
  open: boolean;
  collapsed: boolean;
  toggleCollapsed: () => void;
  query: string;
  setQuery: (query: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  close: () => void;
  toggleMotion: () => void;
}
export function Sidebar({
  lessons,
  progress,
  route,
  open,
  collapsed,
  toggleCollapsed,
  query,
  setQuery,
  subject,
  setSubject,
  close,
  toggleMotion,
}: Props) {
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 720px)').matches);
  const [expandedSubject, setExpandedSubject] = useState('');
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
      Array.from(panel.current?.querySelectorAll<HTMLElement>('a, button, input, select') ?? []);
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
  const subjects = [...new Set(lessons.map((item) => item.subject))];
  const activeSubject = lessons.find((item) => item.slug === route)?.subject;
  useEffect(() => {
    setExpandedSubject(activeSubject ?? '');
  }, [activeSubject]);
  const filtered = lessons.filter(
    (l) =>
      (!subject || l.subject === subject) &&
      `${l.title}${l.subject}${l.description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const searching = Boolean(query.trim() || subject);
  const lessonLink = (lesson: LessonSummary) => (
    <a
      key={lesson.slug}
      href={`#/lesson/${lesson.slug}`}
      className={route === lesson.slug ? 'active' : ''}
      aria-current={route === lesson.slug ? 'page' : undefined}
      onClick={close}
    >
      <span className={`nav-number ${progress.lessons[lesson.slug]?.passed ? 'passed' : ''}`}>
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
        <div className="sidebar-header">
          <a
            className="brand"
            href="#/map"
            onClick={close}
            aria-label="sudo hire me，关卡地图"
            title="关卡地图"
          >
            <Code2 size={25} />
            <span>
              sudo<span className="brand-light"> hire me</span>
              <i>_</i>
            </span>
          </a>
          <button
            className="desktop-collapse icon-button"
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <button className="mobile-close icon-button" onClick={close} aria-label="关闭目录">
          <X size={20} />
        </button>
        <div className="workspace-label">INTERVIEW / LEARNING SPACE</div>
        <nav className="primary-nav">
          <a
            className={route === 'map' ? 'active' : ''}
            href="#/map"
            onClick={close}
            title="关卡地图"
            aria-label="关卡地图"
          >
            <Map size={18} />
            <span className="nav-label">关卡地图</span>
            <span>{String(lessons.length).padStart(2, '0')}</span>
          </a>
          <a
            className={route === 'review' ? 'active' : ''}
            href="#/review"
            onClick={close}
            title="复习手册"
            aria-label="复习手册"
          >
            <BookOpen size={18} />
            <span className="nav-label">复习手册</span>
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
        <label className="subject-filter">
          <span className="sr-only">筛选主题</span>
          <SelectField
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            aria-label="筛选主题"
          >
            <option value="">全部主题</option>
            {subjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </label>
        <div className="nav-section-title">
          {searching ? '筛选结果' : '按主题学习'} <span>{filtered.length} 关</span>
        </div>
        <nav className="lesson-nav" aria-label="课程目录">
          {searching
            ? filtered.map(lessonLink)
            : subjects.map((name) => {
                const entries = lessons.filter((item) => item.subject === name);
                const passed = entries.filter((item) => progress.lessons[item.slug]?.passed).length;
                const expanded = expandedSubject === name;
                return (
                  <div className="lesson-group" key={name}>
                    <button
                      type="button"
                      className="lesson-group-toggle"
                      aria-expanded={expanded}
                      onClick={() => setExpandedSubject(expanded ? '' : name)}
                    >
                      <span>{name}</span>
                      <span className="lesson-group-count">
                        {passed}/{entries.length}
                      </span>
                      <ChevronDown size={15} />
                    </button>
                    {expanded && <div className="lesson-group-list">{entries.map(lessonLink)}</div>}
                  </div>
                );
              })}
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
