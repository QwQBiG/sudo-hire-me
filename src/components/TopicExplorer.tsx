import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  CircuitBoard,
  Code2,
  Cpu,
  Database,
  Flag,
  FlaskConical,
  Layers3,
  Maximize2,
  Minimize2,
  Network,
  Terminal,
} from 'lucide-react';
import { SampleLab } from './SampleLab';
import type { LessonSummary, Progress } from '../types';

export const explorationTopics = [
  { name: '计算机基础', Icon: Cpu, tone: 'rose', sample: 'binary-representation' },
  { name: '编程基础与面向对象', Icon: Braces, tone: 'blue', sample: 'oop-polymorphism' },
  { name: '数据结构与算法', Icon: Layers3, tone: 'violet', sample: 'sorting-stability' },
  { name: '操作系统', Icon: Terminal, tone: 'blue', sample: 'process-state-transitions' },
  { name: '计算机网络', Icon: Network, tone: 'rose', sample: 'tcp-connection' },
  { name: '数据库', Icon: Database, tone: 'amber', sample: 'database-indexes' },
  { name: '并发与系统设计', Icon: CircuitBoard, tone: 'violet', sample: 'atomic-cas-basics' },
  { name: '工程实践', Icon: Code2, tone: 'amber', sample: 'git-basics' },
  { name: '项目与面试表达', Icon: Flag, tone: 'blue', sample: 'personal-contribution-evidence' },
] as const;

export function TopicExplorer({
  lessons,
  progress,
  browse,
}: {
  lessons: LessonSummary[];
  progress: Progress;
  browse: (subject: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const topic = explorationTopics[selected];
  const entries = lessons.filter((lesson) => lesson.subject === topic.name);
  const sample = entries.find((lesson) => lesson.slug === topic.sample);
  const passed = entries.filter((lesson) => progress.lessons[lesson.slug]?.passed).length;
  return (
    <section className="home-section home-explorer" aria-labelledby="explorer-title">
      <div className="home-section-title">
        <div>
          <span className="eyebrow">EXPLORE / 09</span>
          <h2 id="explorer-title">探索实验室</h2>
        </div>
        <button className="text-button" onClick={() => browse(topic.name)}>
          主题课程 <ArrowRight size={16} />
        </button>
      </div>
      <div className={`explorer-layout ${expanded ? 'expanded' : ''}`}>
        <div
          className="explorer-topics"
          id="explorer-topics"
          hidden={expanded}
          role="group"
          aria-label="选择实验主题"
        >
          {explorationTopics.map(({ name, Icon, tone }, index) => (
            <button
              key={name}
              className={`explorer-topic tone-${tone}`}
              aria-pressed={selected === index}
              aria-controls="explorer-stage"
              onClick={() => setSelected(index)}
            >
              <span className="explorer-number">{String(index + 1).padStart(2, '0')}</span>
              <Icon size={18} />
              <span className="explorer-name">{name}</span>
              <ArrowRight size={14} />
            </button>
          ))}
          <div className="explorer-count">
            <BookOpen size={15} />
            {entries.length} 课<span>{passed} 已通过</span>
          </div>
        </div>
        <div className={`explorer-workspace tone-${topic.tone}`} id="explorer-stage">
          <header className="explorer-stage-heading">
            <span>
              <FlaskConical size={16} />
              实验现场
            </span>
            <div className="explorer-stage-tools">
              <span>{topic.name}</span>
              <button
                className="icon-button"
                aria-pressed={expanded}
                aria-controls="explorer-stage"
                aria-label="放大实验区"
                title={expanded ? '恢复主题导航' : '放大实验区'}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>
          <div className="explorer-stage-content" key={topic.name}>
            {sample && <SampleLab summary={sample} reducedMotion={progress.reducedMotion} />}
          </div>
          {sample && (
            <div className="explorer-lesson-link">
              <div>
                <small>继续理解</small>
                <strong>{sample.title}</strong>
              </div>
              <a className="secondary" href={`#/lesson/${sample.slug}`}>
                进入课程 <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="explorer-reading" aria-label={`${topic.name}入门课程`}>
        {entries.slice(0, 3).map((lesson, index) => (
          <a key={lesson.slug} href={`#/lesson/${lesson.slug}`}>
            <span className="explorer-reading-index">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{lesson.title}</strong>
              <small>{lesson.minutes} 分钟</small>
            </span>
            {progress.lessons[lesson.slug]?.passed ? <Check size={17} /> : <ArrowRight size={17} />}
          </a>
        ))}
      </div>
    </section>
  );
}
