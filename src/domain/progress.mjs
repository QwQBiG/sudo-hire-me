/** @returns {import('../types').Progress} */
export const freshProgress = () => ({ version: 1, lessons: {}, reducedMotion: false });
export const freshLesson = () => ({
  read: false,
  passed: false,
  attempts: 0,
  bookmark: false,
  note: '',
});

export function parseProgress(raw, slugs) {
  if (typeof raw !== 'string' || raw.length > 100000) throw new Error('进度文件过大或格式不正确。');
  const data = JSON.parse(raw);
  if (
    !data ||
    data.version !== 1 ||
    typeof data.reducedMotion !== 'boolean' ||
    !data.lessons ||
    typeof data.lessons !== 'object' ||
    Array.isArray(data.lessons) ||
    Object.keys(data).some((key) => !['version', 'lessons', 'reducedMotion'].includes(key))
  ) {
    throw new Error('不支持的进度格式。');
  }
  const result = freshProgress();
  result.reducedMotion = data.reducedMotion;
  for (const [slug, item] of Object.entries(data.lessons)) {
    if (
      ['__proto__', 'constructor', 'prototype'].includes(slug) ||
      !slugs.includes(slug) ||
      !item ||
      typeof item !== 'object' ||
      typeof item.read !== 'boolean' ||
      typeof item.passed !== 'boolean' ||
      typeof item.bookmark !== 'boolean' ||
      typeof item.note !== 'string' ||
      item.note.length > 5000 ||
      !Number.isInteger(item.attempts) ||
      item.attempts < 0 ||
      item.attempts > 100000 ||
      Object.keys(item).some(
        (key) => !['read', 'passed', 'attempts', 'bookmark', 'note'].includes(key),
      )
    ) {
      throw new Error('进度包含不合法的课程记录。');
    }
    result.lessons[slug] = {
      read: item.read,
      passed: item.passed,
      attempts: item.attempts,
      bookmark: item.bookmark,
      note: item.note,
    };
  }
  return result;
}
