import { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Clock3,
  Download,
  FlaskConical,
  Flag,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Trophy,
} from 'lucide-react';
import { Markdown } from './Markdown';
import { Lab } from './Lab';
import { LessonReading } from './LessonReading';
import { Quiz } from './Quiz';
import type { Lesson, LessonProgress, LessonSummary } from '../types';

interface Props {
  lesson: Lesson;
  next?: LessonSummary;
  prerequisites: LessonSummary[];
  progress: LessonProgress;
  reducedMotion: boolean;
  update: (patch: Partial<LessonProgress>) => void;
}
export function LessonView({
  lesson,
  next,
  prerequisites,
  progress,
  reducedMotion,
  update,
}: Props) {
  const [tab, setTab] = useState<'lab' | 'read' | 'quiz'>('lab');
  const [copied, setCopied] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const answer = lesson.sections.find((s) => s.title === '面试回答')?.markdown ?? '';
  const beginner =
    lesson.sections.find((s) => s.title.includes('从零')) ??
    lesson.sections.find(
      (s) =>
        !['面试回答', '选择题', '开放题', '实验代码', '多语言示例', '逐步推演'].includes(s.title),
    ) ??
    lesson.sections[0];
  return (
    <div className={`lesson-page page-enter ${toolsOpen ? '' : 'tools-hidden'}`}>
      <a className="lesson-directory-link text-button" href="#/map">
        <BookOpen size={15} />
        课程目录
        <ArrowRight size={14} />
      </a>
      <header className="lesson-title">
        <div className="eyebrow">
          <span className="level-tag">LEVEL {String(lesson.order + 1).padStart(2, '0')}</span>
          {lesson.subject}
          <span className="duration">
            <Clock3 size={13} />
            {lesson.minutes} 分钟
          </span>
        </div>
        <h1>
          {lesson.title}
          <span className="title-dot">.</span>
        </h1>
        <p>{lesson.description}</p>
        <div className="title-actions">
          <button
            className="icon-button"
            onClick={() => setToolsOpen((value) => !value)}
            aria-expanded={toolsOpen}
            aria-controls="lesson-tools"
            aria-label={toolsOpen ? '收起学习工具' : '展开学习工具'}
            title={toolsOpen ? '收起学习工具' : '展开学习工具'}
          >
            {toolsOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
          </button>
          <button
            className={`icon-button ${progress.bookmark ? 'bookmarked' : ''}`}
            aria-label={progress.bookmark ? '取消收藏' : '收藏本课'}
            title={progress.bookmark ? '取消收藏' : '收藏本课'}
            aria-pressed={progress.bookmark}
            onClick={() => update({ bookmark: !progress.bookmark })}
          >
            <Bookmark size={19} fill={progress.bookmark ? 'currentColor' : 'none'} />
          </button>
          <a
            className="icon-button"
            href={`${import.meta.env.BASE_URL}lessons/${lesson.source}`}
            download
            title="下载 Markdown"
            aria-label="下载 Markdown"
          >
            <Download size={19} />
          </a>
        </div>
      </header>
      <div className="lesson-columns">
        <main className="lesson-content">
          <section className="interview-answer">
            <div className="section-heading">
              <h2>
                <MessageSquare size={17} />
                面试这样说
              </h2>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(answer);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="text-button"
              >
                {copied ? '已复制' : '复制回答'}
              </button>
            </div>
            <Markdown>{answer}</Markdown>
          </section>
          <div className="lesson-tabs" role="tablist" aria-label="学习方式">
            {(
              [
                ['lab', FlaskConical, '动手理解'],
                ['read', BookOpen, '原理详解'],
                ['quiz', Flag, '挑战自测'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  const ids = ['lab', 'read', 'quiz'] as const;
                  const current = ids.indexOf(id);
                  const target =
                    event.key === 'ArrowRight'
                      ? (current + 1) % 3
                      : event.key === 'ArrowLeft'
                        ? (current + 2) % 3
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? 2
                            : -1;
                  if (target < 0) return;
                  event.preventDefault();
                  setTab(ids[target]);
                  document.getElementById(`tab-${ids[target]}`)?.focus();
                }}
              >
                <Icon size={17} />
                {label}
                {id === 'quiz' && progress.passed && <Check size={14} />}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="tab-panel"
            key={tab}
          >
            {tab === 'lab' && (
              <>
                <Lab lesson={lesson} reducedMotion={reducedMotion} />
                <section className="understanding">
                  <span className="eyebrow">BEHIND THE ANSWER</span>
                  <h2>{beginner.title}</h2>
                  <Markdown>{beginner.markdown}</Markdown>
                  <button className="text-button" onClick={() => setTab('read')}>
                    继续理解全部原理 <ArrowRight size={16} />
                  </button>
                </section>
                <button className="primary" onClick={() => setTab('quiz')}>
                  准备好了，去挑战 <ArrowRight size={17} />
                </button>
              </>
            )}
            {tab === 'read' && (
              <LessonReading
                lesson={lesson}
                onComplete={() => {
                  update({ read: true });
                  setTab('quiz');
                }}
              />
            )}
            {tab === 'quiz' && (
              <Quiz
                lesson={lesson}
                note={progress.note}
                passed={progress.passed}
                onNoteChange={(note) => update({ note })}
                onAnswer={(correct) =>
                  update({ attempts: progress.attempts + 1, passed: progress.passed || correct })
                }
              />
            )}
          </div>
          <footer className="lesson-next">
            <span>{progress.passed ? '本关挑战已通过' : '理解，比记住答案更重要。'}</span>
            {next && (
              <a href={`#/lesson/${next.slug}`}>
                下一关：{next.title}
                <ArrowRight size={17} />
              </a>
            )}
          </footer>
        </main>
        <aside className="lesson-rail" id="lesson-tools" hidden={!toolsOpen} aria-label="学习工具">
          {prerequisites.length > 0 && (
            <div className="rail-section prerequisite-links">
              <h2>
                <BookOpen size={16} />
                先理解这些
              </h2>
              {prerequisites.map((item) => (
                <a key={item.slug} href={`#/lesson/${item.slug}`}>
                  {item.title}
                  <ArrowRight size={14} />
                </a>
              ))}
            </div>
          )}
          <div className="rail-section">
            <h2>
              <Flag size={16} />
              本关目标
            </h2>
            <ol>
              {lesson.objectives.map((objective, index) => (
                <li key={objective}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {objective}
                </li>
              ))}
            </ol>
          </div>
          <div className="rail-section">
            <h2>
              <Trophy size={16} />
              学习记录
            </h2>
            <p className="record-row">
              <span>原理阅读</span>
              <b>{progress.read ? '已读' : '待阅读'}</b>
            </p>
            <p className="record-row">
              <span>关卡挑战</span>
              <b className={progress.passed ? 'text-accent' : ''}>
                {progress.passed ? '已通过' : '待挑战'}
              </b>
            </p>
            <p className="record-row">
              <span>练习次数</span>
              <b>{progress.attempts}</b>
            </p>
          </div>
          <div className="rail-section note-section">
            <label htmlFor="lesson-note">我的理解</label>
            <textarea
              id="lesson-note"
              maxLength={5000}
              value={progress.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder="用自己的话记下来…"
            />
            <small>{progress.note.length} / 5000</small>
          </div>
          <a
            className="source-link"
            href={`https://github.com/QwQBiG/sudo-hire-me/blob/main/content/lessons/${lesson.source}`}
            target="_blank"
            rel="noreferrer"
          >
            阅读 Markdown 原文 <ArrowRight size={14} />
          </a>
        </aside>
      </div>
    </div>
  );
}
