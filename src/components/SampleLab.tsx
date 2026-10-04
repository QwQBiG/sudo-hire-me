import { lazy, Suspense, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import type { Lesson, LessonSummary } from '../types';

const Lab = lazy(() => import('./Lab').then((module) => ({ default: module.Lab })));

export function SampleLab({
  summary,
  reducedMotion,
}: {
  summary: LessonSummary;
  reducedMotion: boolean;
}) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLesson(null);
    setError(false);
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`${import.meta.env.BASE_URL}data/${summary.slug}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Lesson request failed');
        const data: Lesson = await response.json();
        if (
          data.slug !== summary.slug ||
          data.lab !== summary.lab ||
          !Array.isArray(data.sections)
        ) {
          throw new Error('Invalid lesson response');
        }
        if (active) setLesson(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [summary.slug, summary.lab, attempt]);
  if (error)
    return (
      <div className="sample-loading" role="status">
        <p>实验暂时没能加载</p>
        <button className="secondary" onClick={() => setAttempt((value) => value + 1)}>
          <RotateCcw size={16} />
          重新加载
        </button>
      </div>
    );
  const loading = (
    <div className="sample-loading" role="status">
      <span />
      正在打开 {summary.title}…
    </div>
  );
  if (!lesson) return loading;
  return (
    <ErrorBoundary key={`${summary.slug}:${attempt}`}>
      <Suspense fallback={loading}>
        <Lab lesson={lesson} reducedMotion={reducedMotion} />
      </Suspense>
    </ErrorBoundary>
  );
}
