import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { LessonView } from './LessonView';
import type { Lesson, LessonSummary, LessonProgress } from '../types';

interface Props {
  lesson: LessonSummary;
  next?: LessonSummary;
  progress: LessonProgress;
  reducedMotion: boolean;
  update: (patch: Partial<LessonProgress>) => void;
}
export function LessonLoader(props: Props) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let canceled = false;
    setError(false);
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`${import.meta.env.BASE_URL}data/${props.lesson.slug}.json`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Lesson request failed');
        const data: Lesson = await response.json();
        if (data.slug !== props.lesson.slug || !Array.isArray(data.sections) || !data.quiz) {
          throw new Error('Invalid lesson response');
        }
        if (!canceled) setLesson(data);
      })
      .catch(() => {
        if (!canceled) setError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      canceled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [props.lesson.slug, attempt]);
  if (error)
    return (
      <section className="not-found">
        <h1>课程暂时没能加载</h1>
        <p>请检查网络，再试一次。</p>
        <button className="secondary" onClick={() => setAttempt(attempt + 1)}>
          <RotateCcw size={17} />
          重新加载
        </button>
      </section>
    );
  if (!lesson)
    return (
      <div className="lesson-loading" role="status">
        正在加载 {props.lesson.title}…
      </div>
    );
  return <LessonView {...props} lesson={lesson} />;
}
