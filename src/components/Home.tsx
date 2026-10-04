import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Flag,
  FlaskConical,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react';
import { continueLesson, hasStudyRecord } from '../domain/navigation.mjs';
import { decodeByte } from '../domain/search.mjs';
import { explorationTopics, TopicExplorer } from './TopicExplorer';
import type { LessonSummary, Progress } from '../types';

const firstSlugs = [
  'binary-representation',
  'memory-units',
  'cpu-execution',
  'program-compile-run',
];
const languageOrder = [
  'C 语言机制',
  'C++ 语言机制',
  'Python 3 语言机制',
  'Rust 语言机制',
  'Zig 语言机制',
  'Java 语言机制',
  'Kotlin 语言机制',
  '编程语言',
];

interface Props {
  lessons: LessonSummary[];
  progress: Progress;
  lastVisited: string;
  query: string;
  setQuery: (value: string) => void;
  browse: (subject?: string) => void;
}

export function Home({ lessons, progress, lastVisited, query, setQuery, browse }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const next = continueLesson(lessons, progress, lastVisited);
  const completed = lessons.filter((item) => progress.lessons[item.slug]?.passed).length;
  const read = lessons.filter((item) => progress.lessons[item.slug]?.read).length;
  const saved = lessons.filter((item) => progress.lessons[item.slug]?.bookmark).length;
  const revisit = lessons.filter((item) => hasStudyRecord(progress.lessons[item.slug])).slice(0, 3);
  const matches = query.trim()
    ? lessons
        .filter((item) =>
          `${item.title} ${item.subject} ${item.description}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 5)
    : [];
  const languages = [...new Set(lessons.map((item) => item.subject))]
    .filter(
      (subject) =>
        !explorationTopics.some(({ name }) => name === subject) && subject !== 'JavaScript 选修',
    )
    .sort((a, b) => languageOrder.indexOf(a) - languageOrder.indexOf(b));
  const optionalCount = lessons.filter((item) => item.subject === 'JavaScript 选修').length;
  return (
    <div className="home-page page-enter">
      <header className="home-heading">
        <div>
          <span className="eyebrow">YOUR LEARNING WORKSPACE</span>
          <h1>
            sudo hire me<span className="title-dot">_</span>
          </h1>
          <p>计算机基础与面试学习</p>
        </div>
        <form
          className="home-search"
          role="search"
          onFocus={() => setSearchOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            browse();
          }}
        >
          <label>
            <Search size={19} />
            <input
              aria-label="搜索课程"
              placeholder="今天想理解什么？"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchOpen(false);
              }}
            />
          </label>
          <button className="icon-button" aria-label="查看全部搜索结果" title="查看全部搜索结果">
            <ArrowRight size={19} />
          </button>
          {query.trim() && searchOpen && (
            <div className="home-search-results" aria-label="课程搜索结果">
              {matches.length ? (
                matches.map((item) => (
                  <a href={`#/lesson/${item.slug}`} key={item.slug}>
                    <span>
                      {item.title}
                      <small>{item.subject}</small>
                    </span>
                    <ArrowRight size={15} />
                  </a>
                ))
              ) : (
                <p>没有找到相关课程</p>
              )}
            </div>
          )}
        </form>
      </header>
      <div className="home-stats" aria-label="学习概览">
        {[
          { value: lessons.length, label: '课程', Icon: BookOpen },
          { value: completed, label: '通过挑战', Icon: Trophy },
          { value: read, label: '已读原理', Icon: Check },
          { value: saved, label: '收藏', Icon: Bookmark },
        ].map(({ value, label, Icon }) => (
          <div key={label}>
            <Icon size={17} />
            <strong>{String(value).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="home-launch" aria-label="开始学习">
        {next && (
          <div className="home-continue">
            <span className="eyebrow">
              {lastVisited && hasStudyRecord(progress.lessons[lastVisited])
                ? '继续探索'
                : '下一次理解，从这里开始'}
            </span>
            <div className="continue-meta">
              <span>{next.subject}</span>
              <span>{next.minutes} 分钟</span>
            </div>
            <h2>{next.title}</h2>
            <p>{next.description}</p>
            <div className="continue-checklist">
              <span className={progress.lessons[next.slug]?.read ? 'done' : ''}>
                <BookOpen size={15} />
                理解原理
              </span>
              <span>
                <FlaskConical size={15} />
                动手实验
              </span>
              <span className={progress.lessons[next.slug]?.passed ? 'done' : ''}>
                <Flag size={15} />
                挑战自测
              </span>
            </div>
            <div className="continue-actions">
              <a className="primary" href={`#/lesson/${next.slug}`}>
                {lastVisited === next.slug ? '继续这一课' : '开始这一课'}
                <ArrowRight size={17} />
              </a>
              <button className="text-button" onClick={() => browse()}>
                浏览全部课程
                <ArrowRight size={15} />
              </button>
              <button
                className="text-button"
                aria-expanded={warmupOpen}
                aria-controls="home-warmup"
                onClick={() => setWarmupOpen((open) => !open)}
              >
                <FlaskConical size={16} />
                二进制热身
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="home-warmup" id="home-warmup" hidden={!warmupOpen}>
        {warmupOpen && <BinaryWarmup />}
      </div>
      <TopicExplorer lessons={lessons} progress={progress} browse={browse} />
      <section className="home-section">
        <div className="home-section-title">
          <h2>从零起步</h2>
          <button className="text-button" onClick={() => browse('__starter__')}>
            查看基础路线
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="starter-links">
          {firstSlugs.map((slug, index) => {
            const item = lessons.find((lesson) => lesson.slug === slug);
            return (
              item && (
                <a key={slug} href={`#/lesson/${slug}`}>
                  <span className="starter-number">
                    {progress.lessons[slug]?.passed ? (
                      <Check size={18} />
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.minutes} 分钟</small>
                  </span>
                  <ArrowRight size={16} />
                </a>
              )
            );
          })}
        </div>
      </section>
      <section className="home-section home-languages">
        <div className="home-section-title">
          <h2>语言机制</h2>
          <span>C / C++ / Python 3 / Rust / Zig / Java / Kotlin</span>
        </div>
        <div>
          {languages.map((name) => (
            <button key={name} onClick={() => browse(name)}>
              {name.replace(' 语言机制', '')}
              <span>{lessons.filter((item) => item.subject === name).length}</span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
        <details className="optional-topic">
          <summary>JavaScript 选修 · {optionalCount} 课</summary>
          <button className="text-button" onClick={() => browse('JavaScript 选修')}>
            查看选修课程
            <ArrowRight size={15} />
          </button>
        </details>
      </section>
      <section className="home-section home-revisit">
        <div className="home-section-title">
          <h2>回到你的记录</h2>
          <a className="text-button" href="#/review">
            复习手册
            <ArrowRight size={16} />
          </a>
        </div>
        {revisit.length ? (
          <div className="revisit-links">
            {revisit.map((item) => (
              <a key={item.slug} href={`#/lesson/${item.slug}`}>
                <BookOpen size={17} />
                <span>{item.title}</span>
                <small>{progress.lessons[item.slug]?.passed ? '已通过' : '继续理解'}</small>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        ) : (
          <p className="home-empty">还没有学习记录。选一课开始，收藏、笔记和挑战结果会留在这里。</p>
        )}
      </section>
    </div>
  );
}

function BinaryWarmup() {
  const [bits, setBits] = useState('00001010');
  const [mission, setMission] = useState<number | null>(null);
  const targets = [42, 138, 255];
  const { unsigned, signed } = decodeByte(bits);
  const target = mission === null ? null : targets[mission];
  const solved = target !== null && unsigned === target;
  const weights = [...bits]
    .map((bit, index) => (bit === '1' ? 2 ** (7 - index) : 0))
    .filter(Boolean);
  return (
    <div className={`binary-warmup ${solved ? 'mission-solved' : ''}`}>
      <div className="warmup-heading">
        <h2>
          <FlaskConical size={17} />
          二进制热身
        </h2>
        <button
          className="icon-button"
          aria-label="重置二进制热身"
          title="重置"
          onClick={() => setBits('00001010')}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="warmup-mode" role="group" aria-label="热身模式">
        <button aria-pressed={mission === null} onClick={() => setMission(null)}>
          自由探索
        </button>
        <button aria-pressed={mission !== null} onClick={() => setMission(0)}>
          小挑战
        </button>
        <span>8 BIT</span>
      </div>
      {target !== null && (
        <div className="warmup-mission">
          <span>
            拼出无符号整数 <b>{target}</b>
          </span>
          <span className="mission-status" role="status">
            {solved ? (
              <>
                <Check size={14} />
                匹配成功
              </>
            ) : unsigned < target ? (
              `还差 ${target - unsigned}`
            ) : (
              `超出 ${unsigned - target}`
            )}
          </span>
        </div>
      )}
      <div className="warmup-bits" role="group" aria-label="8 位二进制开关">
        {[...bits].map((bit, index) => (
          <button
            key={index}
            aria-label={`第 ${7 - index} 位，权重 ${2 ** (7 - index)}`}
            aria-pressed={bit === '1'}
            onClick={() =>
              setBits((old) =>
                [...old]
                  .map((value, position) =>
                    position === index ? (value === '1' ? '0' : '1') : value,
                  )
                  .join(''),
              )
            }
          >
            <small>{2 ** (7 - index)}</small>
            <span>{bit}</span>
          </button>
        ))}
      </div>
      <div className="warmup-result" aria-live="polite">
        <span>
          无符号整数<strong key={unsigned}>{unsigned}</strong>
        </span>
        <span>
          8 位补码<strong>{signed}</strong>
        </span>
      </div>
      <p className="warmup-equation">
        {weights.length ? weights.join(' + ') : '0'} = {unsigned}
      </p>
      {target !== null && (
        <button
          className="warmup-next text-button"
          disabled={!solved}
          onClick={() => {
            setMission(((mission ?? 0) + 1) % targets.length);
            setBits('00000000');
          }}
        >
          下一题
          <ArrowRight size={15} />
        </button>
      )}
      <a href="#/lesson/binary-representation" className="text-button">
        为什么最高位会影响符号？
        <ArrowRight size={15} />
      </a>
    </div>
  );
}
