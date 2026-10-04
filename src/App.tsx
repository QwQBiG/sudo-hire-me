import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Download,
  Menu,
  Search,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import catalog from '../.generated/lessons.json';
import { Sidebar } from './components/Sidebar';
import { SelectField } from './components/SelectField';
import { LessonLoader } from './components/LessonLoader';
import { Home } from './components/Home';
import { useProgress } from './hooks/useProgress';
import { freshLesson, MAX_PROGRESS_FILE_BYTES } from './domain/progress.mjs';
import {
  STARTER_SUBJECT as starterSubject,
  isStarterLesson,
  routeFromHash,
  hasStudyRecord,
} from './domain/navigation.mjs';
import type { LessonSummary } from './types';

const lessons = catalog as LessonSummary[];
const slugs = lessons.map((l) => l.slug);
const getRoute = () => routeFromHash(location.hash);

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [sidebar, setSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sudo-hire-me:sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [mapSubject, setMapSubject] = useState(starterSubject);
  const [mapStatus, setMapStatus] = useState('all');
  const [reviewStatus, setReviewStatus] = useState('all');
  const [catalogLimit, setCatalogLimit] = useState(24);
  const [lastVisited, setLastVisited] = useState(() => {
    try {
      const slug = localStorage.getItem('sudo-hire-me:last-lesson') ?? '';
      return slugs.includes(slug) ? slug : '';
    } catch {
      return '';
    }
  });
  const [notice, setNotice] = useState('');
  const { progress, update, importProgress, setProgress, warning } = useProgress(slugs);
  const completed = lessons.filter((l) => progress.lessons[l.slug]?.passed).length;
  const lesson = lessons.find((l) => l.slug === route);
  const pageTitle =
    lesson?.title ??
    (route === 'home'
      ? '学习首页'
      : route === 'review'
        ? '复习手册'
        : route === 'map'
          ? '课程目录'
          : '未找到课程');
  const visibleLessons = lessons.filter(
    (item) =>
      (!subject || item.subject === subject) &&
      (route !== 'review' ||
        (hasStudyRecord(progress.lessons[item.slug]) &&
          (reviewStatus === 'all' ||
            (reviewStatus === 'bookmarked' && progress.lessons[item.slug]?.bookmark) ||
            (reviewStatus === 'notes' && progress.lessons[item.slug]?.note) ||
            (reviewStatus === 'pending' && !progress.lessons[item.slug]?.passed)))) &&
      (route !== 'map' ||
        mapStatus === 'all' ||
        (mapStatus === 'passed') === !!progress.lessons[item.slug]?.passed) &&
      (route !== 'map' ||
        query.trim() ||
        subject ||
        !mapSubject ||
        (mapSubject === starterSubject ? isStarterLesson(item) : item.subject === mapSubject)) &&
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
    try {
      localStorage.setItem('sudo-hire-me:sidebar-collapsed', sidebarCollapsed ? '1' : '0');
    } catch {
      // The navigation still works when browser storage is unavailable.
    }
  }, [sidebarCollapsed]);
  useEffect(() => {
    document.title = `${pageTitle} · sudo hire me`;
  }, [pageTitle]);
  useEffect(() => {
    setCatalogLimit(24);
  }, [route, query, subject, mapSubject, mapStatus, reviewStatus]);
  useEffect(() => {
    if (!lesson) return;
    setLastVisited(lesson.slug);
    try {
      localStorage.setItem('sudo-hire-me:last-lesson', lesson.slug);
    } catch {
      // Resume links remain usable during this session without storage.
    }
  }, [lesson]);
  function browse(name = '') {
    setSubject('');
    setMapSubject(name || '');
    setMapStatus('all');
    if (name) setQuery('');
    location.hash = '#/map';
  }
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
    <div
      className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} route-${lesson ? 'lesson' : route}`}
    >
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
        collapsed={sidebarCollapsed}
        toggleCollapsed={() => setSidebarCollapsed((value) => !value)}
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
            <a className="topbar-home" href="#/home" aria-label="返回学习首页" title="学习首页">
              <Code2 size={19} />
            </a>
            <a className="breadcrumb-home" href="#/home">
              学习空间
            </a>
            <span className="breadcrumb-separator">/</span>
            <strong>{pageTitle}</strong>
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
          {route === 'home' ? (
            <Home
              lessons={lessons}
              progress={progress}
              lastVisited={lastVisited}
              query={query}
              setQuery={setQuery}
              browse={browse}
            />
          ) : lesson ? (
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
              <h1>{route === 'map' ? '课程目录' : '复习手册'}</h1>
              <p className="overview-intro">
                {route === 'map'
                  ? '从基础概念，到能解释、能操作、能回答。'
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
              <div className="catalog-toolbar">
                <label className="catalog-search">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="搜索目录"
                    placeholder="搜索知识点、课程或主题"
                  />
                </label>
                <span>{visibleLessons.length} 课</span>
                {(query ||
                  subject ||
                  (route === 'map' ? mapStatus !== 'all' : reviewStatus !== 'all')) && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setQuery('');
                      setSubject('');
                      setMapStatus('all');
                      setReviewStatus('all');
                    }}
                  >
                    清除筛选
                  </button>
                )}
              </div>
              {route === 'map' && !query.trim() && !subject && (
                <label className="map-subject-control">
                  <span>学习主题</span>
                  <SelectField
                    value={mapSubject}
                    onChange={(event) => setMapSubject(event.target.value)}
                    aria-label="学习主题"
                  >
                    <option value={starterSubject}>从零开始</option>
                    {[...new Set(lessons.map((item) => item.subject))].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="">全部主题</option>
                  </SelectField>
                  <span>{visibleLessons.length} 关</span>
                </label>
              )}
              {route === 'map' && (
                <div className="map-status-filter" role="group" aria-label="挑战状态">
                  {[
                    ['all', '全部'],
                    ['pending', '未通过'],
                    ['passed', '已通过'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={mapStatus === value}
                      onClick={() => setMapStatus(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {route === 'review' && (
                <div className="map-status-filter" role="group" aria-label="复习记录类型">
                  {[
                    ['all', '全部记录'],
                    ['pending', '待巩固'],
                    ['bookmarked', '收藏'],
                    ['notes', '笔记'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={reviewStatus === value}
                      onClick={() => setReviewStatus(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="course-grid">
                {visibleLessons.slice(0, catalogLimit).map((item) => {
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
                            : `${item.minutes} 分钟 · 交互实验`}
                        </span>
                        <ArrowRight size={19} />
                      </div>
                    </a>
                  );
                })}
              </div>
              {visibleLessons.length > 0 && (
                <div className="catalog-more">
                  <span aria-live="polite">
                    已显示 {Math.min(catalogLimit, visibleLessons.length)} / {visibleLessons.length}{' '}
                    课
                  </span>
                  {catalogLimit < visibleLessons.length && (
                    <button
                      className="secondary"
                      onClick={() => setCatalogLimit((value) => value + 24)}
                    >
                      显示更多
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              )}
              {!visibleLessons.length && (
                <div className="empty-courses">
                  <p>{route === 'review' ? '没有匹配的复习记录。' : '没有匹配的课程。'}</p>
                  <a className="secondary" href="#/home">
                    回到学习首页
                    <ArrowRight size={16} />
                  </a>
                </div>
              )}
              {route === 'review' && (
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
              )}
            </div>
          ) : (
            <section className="not-found">
              <h1>没有找到这一关</h1>
              <a className="primary" href="#/home">
                返回学习首页 <ArrowRight size={18} />
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
    </div>
  );
}
