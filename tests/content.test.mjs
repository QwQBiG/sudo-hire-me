import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLesson } from '../scripts/build-content.mjs';

const fence = String.fromCharCode(96).repeat(3);
const metadata = {
  slug: 'test-lesson',
  title: 'Test lesson',
  description: 'A complete example lesson.',
  subject: 'Foundations',
  order: 0,
  minutes: 10,
  lab: 'javascript',
  objectives: ['Explain the result', 'Run the example'],
  prerequisites: [],
};
const body = [
  '# Test lesson',
  '## 面试回答',
  'A concise interview answer.',
  '## 原理',
  `${fence}text`,
  'Not executable.',
  fence,
  '## 实验代码',
  `${fence}javascript`,
  'console.log(42);',
  fence,
  '## 选择题',
  'Which result is correct?',
  '- A. First',
  '- B. Second',
  '- C. Third',
  '- D. Fourth',
  '',
  '**答案：B。** The second option follows from the example.',
].join('\n\n');
const fixture = (content = body, overrides = {}) =>
  `---\n${JSON.stringify({ ...metadata, ...overrides })}\n---\n${content}\n`;

test('parseLesson returns metadata, interview sections, executable code and quiz', () => {
  const lesson = parseLesson(fixture(), 'test-lesson.md');
  assert.equal(lesson.slug, 'test-lesson');
  assert.equal(lesson.source, 'test-lesson.md');
  assert.equal(lesson.sections[0].title, '面试回答');
  assert.match(lesson.sections[0].markdown, /concise interview answer/);
  assert.equal(lesson.code.trim(), 'console.log(42);');
  assert.equal(lesson.quiz.prompt, 'Which result is correct?');
  assert.deepEqual(lesson.quiz.options, ['First', 'Second', 'Third', 'Fourth']);
  assert.equal(lesson.quiz.answer, 1);
  assert.match(lesson.quiz.explanation, /second option follows/);
});

test('parseLesson reads plain paragraph choices as well as Markdown list choices', () => {
  const plain = body.replace(/^- ([A-D]\.)/gm, '$1');
  const quiz = parseLesson(fixture(plain), 'test-lesson.md').quiz;
  assert.deepEqual(quiz.options, ['First', 'Second', 'Third', 'Fourth']);
  assert.equal(quiz.answer, 1);
});

test('parseLesson supports a conceptual lesson without executable code', () => {
  const conceptual = body.replace('## 实验代码', '## 示例');
  assert.equal(parseLesson(fixture(conceptual), 'test-lesson.md').code, '');
});

test('parseLesson rejects mismatched filenames and invalid metadata', () => {
  assert.throws(() => parseLesson(fixture(), 'another-lesson.md'), /Slug does not match/);
  for (const override of [
    { minutes: 0 },
    { order: -1 },
    { lab: 'unknown' },
    { objectives: [] },
    { unsupported: true },
    { slug: '../escape' },
  ]) {
    assert.throws(() => parseLesson(fixture(body, override), 'test-lesson.md'));
  }
});

test('parseLesson rejects missing interview answers, incomplete quizzes and raw HTML', () => {
  assert.throws(
    () => parseLesson(fixture(body.replace('## 面试回答', '## Other')), 'test-lesson.md'),
    /Missing interview answer/,
  );
  assert.throws(
    () => parseLesson(fixture(body.replace('## 选择题', '## Other')), 'test-lesson.md'),
    /Missing quiz/,
  );
  assert.throws(
    () => parseLesson(fixture(body.replace('- D. Fourth', '')), 'test-lesson.md'),
    /Invalid quiz/,
  );
  assert.throws(
    () => parseLesson(fixture(body.replace('答案：B', '答案：E')), 'test-lesson.md'),
    /Invalid quiz/,
  );
  assert.throws(
    () => parseLesson(fixture(`${body}\n\n<script>alert(1)</script>`), 'test-lesson.md'),
    /Raw HTML is not allowed/,
  );
});

test('parseLesson rejects raw HTML nested inside a blockquote', () => {
  const nested = `${body}\n\n> <script>alert(1)</script>`;
  assert.throws(() => parseLesson(fixture(nested), 'test-lesson.md'), /Raw HTML is not allowed/);
});

test('parseLesson rejects duplicate second-level section titles', () => {
  for (const title of ['面试回答', '原理']) {
    const duplicate = `${body}\n\n## ${title}\n\nAnother section with the same title.`;
    assert.throws(
      () => parseLesson(fixture(duplicate), 'test-lesson.md'),
      /Duplicate section title/,
    );
  }
});

const expected = [
  ['binary-representation', 0, 'bits', true],
  ['binary-search', 1, 'binary-search', true],
  ['process-thread', 2, 'process', false],
  ['javascript-event-loop', 2, 'javascript', true],
  ['sql-join', 1, 'sql', true],
  ['rust-ownership', 3, 'ownership', false],
];

for (const [slug, answer, lab, executable] of expected) {
  test(`published lesson ${slug} exposes a usable interview answer and four-option quiz`, async () => {
    const filename = `${slug}.md`;
    const raw = await readFile(new URL(`../content/lessons/${filename}`, import.meta.url), 'utf8');
    const lesson = parseLesson(raw, filename);
    assert.equal(lesson.lab, lab);
    assert.equal(lesson.quiz.options.length, 4);
    assert.equal(new Set(lesson.quiz.options).size, 4);
    assert.equal(lesson.quiz.answer, answer);
    assert.ok(lesson.quiz.prompt.length > 10);
    assert.ok(lesson.quiz.explanation.length > 30);
    assert.ok(lesson.sections.find((section) => section.title === '面试回答').markdown.length > 50);
    assert.equal(Boolean(lesson.code.trim()), executable);
    assert.match(lesson.markdown, /https:\/\//);
  });
}
