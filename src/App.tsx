import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Menu,
  Terminal,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import catalog from '../.generated/lessons.json';
import { Sidebar } from './components/Sidebar';
import { LessonLoader } from './components/LessonLoader';
import { useProgress } from './hooks/useProgress';
import { freshLesson, MAX_PROGRESS_FILE_BYTES } from './domain/progress.mjs';
import type { LessonSummary } from './types';

const lessons = catalog as LessonSummary[];
const slugs = lessons.map((l) => l.slug);
const getRoute = () =>
  location.hash.replace(/^#\//, '').replace(/^lesson\//, '') || lessons[0].slug;

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [notice, setNotice] = useState('');
  const { progress, update, importProgress, setProgress, warning } = useProgress(slugs);
  const completed = lessons.filter((l) => progress.lessons[l.slug]?.passed).length;
  const lesson = lessons.find((l) => l.slug === route);
  const visibleLessons = lessons.filter(
    (item) =>
      (!subject || item.subject === subject) &&
      `${item.title}${item.subject}${item.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const navigate = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = progress.reducedMotion ? 'reduced' : 'full';
  }, [progress.reducedMotion]);
  useEffect(() => {
    document.title = `${lesson?.title ?? (route === 'review' ? '复习手册' : '关卡地图')} · sudo hire me`;
  }, [lesson, route]);
  function exportProgress() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sudo-hire-me-progress.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_PROGRESS_FILE_BYTES) {
      setNotice('文件过大，请选择有效的进度备份。');
      return;
    }
    try {
      importProgress(await file.text());
      setNotice('进度已导入。');
    } catch {
      setNotice('无法导入：文件格式、课程编号或版本不匹配。原进度未修改。');
    }
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        跳到正文
      </a>
      <Sidebar
        lessons={lessons}
        progress={progress}
        route={route}
        open={sidebar}
        query={query}
        setQuery={setQuery}
        subject={subject}
        setSubject={setSubject}
        close={() => setSidebar(false)}
        toggleMotion={() => setProgress((old) => ({ ...old, reducedMotion: !old.reducedMotion }))}
      />
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="icon-button menu-button"
              onClick={() => setSidebar(true)}
              aria-label="打开目录"
            >
              <Menu size={21} />
            </button>
            <Terminal size={16} />
            <span>基础训练</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{lesson?.title ?? (route === 'review' ? '复习手册' : '关卡地图')}</strong>
          </div>
          <div className="player-status">
            <span className="xp">
              <Trophy size={16} />
              {completed * 100}
              <small>XP</small>
            </span>
            <span className="topbar-divider" />
            <span className="completion">
              {completed} / {lessons.length} 关
            </span>
            <div className="mini-progress">
              <span style={{ width: `${(completed / lessons.length) * 100}%` }} />
            </div>
          </div>
        </header>
        {(notice || warning) && (
          <div className="notice" role="status">
            {notice || warning}
            {notice && (
              <button className="icon-button" aria-label="关闭提示" onClick={() => setNotice('')}>
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div id="main-content" className="main-content" tabIndex={-1}>
          {lesson ? (
            <LessonLoader
              key={lesson.slug}
              lesson={lesson}
              next={lessons[lessons.findIndex((item) => item.slug === lesson.slug) + 1]}
              prerequisites={lessons.filter((item) => lesson.prerequisites.includes(item.slug))}
              progress={progress.lessons[lesson.slug] ?? freshLesson()}
              reducedMotion={progress.reducedMotion}
              update={(patch) => update(lesson.slug, patch)}
            />
          ) : route === 'map' || route === 'review' ? (
            <div className="overview page-enter">
              <div className="eyebrow">
                {route === 'map' ? 'THE LEARNING PATH' : 'YOUR FIELD NOTES'}
              </div>
              <h1>{route === 'map' ? '从理解开始，一关一关来。' : '把知识，变成自己的表达。'}</h1>
              <p className="overview-intro">
                {route === 'map'
                  ? '计算机基础 · 数据结构与算法 · 操作系统 · 网络 · 数据库 · 编程语言 · 工程实践'
                  : '收藏、笔记与练习记录，回到仍值得再想一次的问题。'}
              </p>
              <div className="journey-stats">
                <div>
                  <strong>
                    {String(completed).padStart(2, '0')}
                    <span> / {String(lessons.length).padStart(2, '0')}</span>
                  </strong>
                  <small>通过挑战</small>
                </div>
                <div>
                  <strong>
                    {completed * 100}
                    <span> XP</span>
                  </strong>
                  <small>累计经验</small>
                </div>
                <div>
                  <strong>{lessons.filter((l) => progress.lessons[l.slug]?.read).length}</strong>
                  <small>已读原理</small>
                </div>
              </div>
              <div className="course-grid">
                {visibleLessons.map((item) => {
                  const record = progress.lessons[item.slug];
                  return (
                    <a
                      className={`course-card ${record?.passed ? 'completed' : ''}`}
                      key={item.slug}
                      href={`#/lesson/${item.slug}`}
                    >
                      <div className="course-top">
                        <span className="course-number">
                          {String(item.order + 1).padStart(2, '0')}
                        </span>
                        <span>
                          {record?.passed ? (
                            <>
                              <Check size={14} />
                              已通过
                            </>
                          ) : (
                            item.subject
                          )}
                        </span>
                      </div>
                      <h2>{item.title}</h2>
                      <p>{route === 'review' && record?.note ? record.note : item.description}</p>
                      <div className="course-bottom">
                        <span>
                          {route === 'review'
                            ? `${record?.bookmark ? '已收藏 · ' : ''}练习 ${record?.attempts ?? 0} 次`
                            : `${item.minutes} 分钟 · ${item.lab === 'walkthrough' ? '例题推演' : '交互实验'}`}
                        </span>
                        <ArrowRight size={19} />
                      </div>
                    </a>
                  );
                })}
              </div>
              {!visibleLessons.length && <p className="empty-courses">没有匹配的课程。</p>}
              <section className="backup-section">
                <div>
                  <h2>
                    <BookOpen size={19} />
                    学习存档
                  </h2>
                  <p>备份包含本浏览器中的笔记、收藏和练习记录。</p>
                </div>
                <div className="backup-actions">
                  <button className="secondary" onClick={exportProgress}>
                    <Download size={17} />
                    导出进度
                  </button>
                  <label className="secondary file-import">
                    <Upload size={17} />
                    导入进度
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => {
                        void importFile(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </section>
            </div>
          ) : (
            <section className="not-found">
              <h1>没有找到这一关</h1>
              <a className="primary" href="#/map">
                返回关卡地图 <ArrowRight size={18} />
              </a>
            </section>
          )}
        </div>
        <footer className="site-footer">
          <span>
            sudo hire me<span className="footer-dot">.</span>
          </span>
          <span>先理解，再表达。</span>
          <a
            href="https://github.com/QwQBiG/sudo-hire-me/tree/main/content/lessons"
            target="_blank"
            rel="noreferrer"
          >
            开放学习 · Markdown
          </a>
        </footer>
      </div>
    </>
  );
}
