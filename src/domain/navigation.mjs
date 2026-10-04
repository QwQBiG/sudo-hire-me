export const STARTER_SUBJECT = '__starter__';
const starterFoundations = new Set(['binary-representation', 'memory-units', 'cpu-execution']);

/** @param {import('../types').LessonSummary} lesson */
export const isStarterLesson = (lesson) =>
  starterFoundations.has(lesson.slug) || lesson.subject === '编程基础与面向对象';

export function routeFromHash(hash) {
  return hash.replace(/^#\/?/, '').replace(/^lesson\//, '') || 'home';
}

/**
 * The resume record is a validated slug, independent of the progress backup schema.
 * @param {import('../types').LessonSummary[]} lessons
 * @param {import('../types').Progress} progress
 * @param {unknown} lastVisited
 */
export function continueLesson(lessons, progress, lastVisited) {
  const previous = lessons.find((lesson) => lesson.slug === lastVisited);
  if (previous && !progress.lessons[previous.slug]?.passed) return previous;
  return (
    lessons.find(
      (lesson) =>
        lesson.subject !== 'JavaScript 选修' &&
        !progress.lessons[lesson.slug]?.passed &&
        lesson.prerequisites.every((slug) => progress.lessons[slug]?.passed),
    ) ??
    previous ??
    lessons[0]
  );
}

/** @param {import('../types').LessonProgress | undefined} record */
export function hasStudyRecord(record) {
  return Boolean(
    record && (record.read || record.passed || record.attempts || record.bookmark || record.note),
  );
}
