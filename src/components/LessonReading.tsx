import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, ListTree } from 'lucide-react';
import type { Lesson } from '../types';
import { LanguageExamples } from './LanguageExamples';
import { Markdown } from './Markdown';

export function LessonReading({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const sections = lesson.sections.filter(
    (section) => !['面试回答', '选择题', '开放题'].includes(section.title),
  );
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const headings = [...(root.current?.querySelectorAll<HTMLElement>('h2[data-section]') ?? [])];
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = headings.reduce(
        (last, heading, index) => (heading.getBoundingClientRect().top <= 210 ? index : last),
        0,
      );
      setActive(passed);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [lesson.slug]);
  const jump = (index: number) => {
    const target = root.current?.querySelector<HTMLElement>(`h2[data-section="${index}"]`);
    if (!target) return;
    setActive(index);
    setExpanded(false);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="reading" ref={root}>
      <div className="reading-toolbar">
        <button
          className="reading-directory"
          aria-expanded={expanded}
          aria-controls="reading-directory"
          onClick={() => setExpanded(!expanded)}
        >
          <ListTree size={17} />
          <span>本课目录</span>
          <ChevronDown size={15} />
        </button>
        <span className="reading-location">
          <b>{String(active + 1).padStart(2, '0')}</b> / {String(sections.length).padStart(2, '0')}
          <span>{sections[active]?.title}</span>
        </span>
        <div className="reading-jump">
          <button
            className="icon-button"
            title="上一节"
            aria-label="上一节"
            disabled={active === 0}
            onClick={() => jump(active - 1)}
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            title="下一节"
            aria-label="下一节"
            disabled={active >= sections.length - 1}
            onClick={() => jump(active + 1)}
          >
            <ArrowDown size={17} />
          </button>
        </div>
        <div className="reading-position" aria-hidden="true">
          <i style={{ width: `${((active + 1) / Math.max(sections.length, 1)) * 100}%` }} />
        </div>
      </div>
      {expanded && (
        <nav id="reading-directory" className="reading-index" aria-label="本课目录">
          {sections.map((section, index) => (
            <button
              key={section.title}
              aria-current={active === index ? 'location' : undefined}
              onClick={() => jump(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {section.title}
            </button>
          ))}
        </nav>
      )}
      {sections.map((section, index) => (
        <section key={section.title}>
          <h2 id={`reading-${index}`} data-section={index} tabIndex={-1}>
            <span className="reading-section-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            {section.title}
          </h2>
          {section.title === '多语言示例' && lesson.languageExamples ? (
            <LanguageExamples examples={lesson.languageExamples} />
          ) : (
            <Markdown>{section.markdown}</Markdown>
          )}
        </section>
      ))}
      <button className="primary" onClick={onComplete}>
        <Check size={17} />
        已读，进入挑战
      </button>
    </div>
  );
}
