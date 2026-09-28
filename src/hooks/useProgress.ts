import { useEffect, useState } from 'react';
import { freshLesson, freshProgress, parseProgress } from '../domain/progress.mjs';
import type { LessonProgress, Progress } from '../types';

const KEY = 'sudo-hire-me:progress:v1';
export function useProgress(slugs: string[]) {
  const [loaded] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return { progress: saved ? parseProgress(saved, slugs) : freshProgress(), blocked: false };
    } catch {
      return { progress: freshProgress(), blocked: true };
    }
  });
  const [progress, setProgress] = useState<Progress>(loaded.progress);
  const [blocked, setBlocked] = useState(loaded.blocked);
  const [warning, setWarning] = useState(
    loaded.blocked
      ? '无法读取旧进度，原记录未覆盖。当前练习可导出备份；导入有效备份后恢复自动保存。'
      : '',
  );
  useEffect(() => {
    if (blocked) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
      setWarning('');
    } catch {
      setWarning('浏览器未能保存进度，请导出备份。');
    }
  }, [progress, blocked]);
  function update(slug: string, patch: Partial<LessonProgress>) {
    setProgress((old) => ({
      ...old,
      lessons: {
        ...old.lessons,
        [slug]: { ...freshLesson(), ...old.lessons[slug], ...patch },
      },
    }));
  }
  function importProgress(raw: string) {
    const valid = parseProgress(raw, slugs);
    setProgress(valid);
    setBlocked(false);
    setWarning('');
  }
  return { progress, update, importProgress, setProgress, warning };
}
