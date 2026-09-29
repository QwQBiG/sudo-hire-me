import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parseLesson, validatePrerequisites } from '../scripts/build-content.mjs';

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

const steps =
  '\n\n## 逐步推演\n\n### Read\n\nValue is 1.\n\n### Add\n\nValue is 2.\n\n### Write\n\nValue is 2.';

test('walkthrough extracts ordered Markdown steps without duplicating headings', () => {
  const lesson = parseLesson(fixture(body + steps, { lab: 'walkthrough' }), 'test-lesson.md');
  assert.deepEqual(
    lesson.steps.map((step) => step.title),
    ['Read', 'Add', 'Write'],
  );
  assert.equal(lesson.steps[1].markdown, 'Value is 2.');
});

test('walkthrough rejects missing, empty, too few or ambiguously prefaced steps', () => {
  for (const suffix of [
    '',
    steps.replace('Value is 2.\n\n### Write', '### Write'),
    steps.replace('### Write\n\nValue is 2.', ''),
    steps.replace('### Read', 'Unassigned paragraph\n\n### Read'),
  ]) {
    assert.throws(
      () => parseLesson(fixture(body + suffix, { lab: 'walkthrough' }), 'test-lesson.md'),
      /[Ww]alkthrough/,
    );
  }
});

test('language examples retain each Markdown variant and reject mismatched fences', () => {
  const examples = [
    '## 多语言示例',
    'The same small calculation in two languages.',
    '### C',
    `${fence}c`,
    'int answer = 1;',
    fence,
    'C keeps the result in an int.',
    '### Python 3',
    `${fence}python`,
    'answer = 1',
    fence,
  ].join('\n\n');
  const lesson = parseLesson(fixture(`${body}\n\n${examples}`), 'test-lesson.md');
  assert.equal(lesson.languageExamples.variants.length, 2);
  assert.match(lesson.languageExamples.variants[0].markdown, /C keeps the result/);
  assert.match(lesson.languageExamples.introduction, /same small calculation/);
  assert.throws(
    () =>
      parseLesson(
        fixture(`${body}\n\n${examples.replace(`${fence}python`, `${fence}javascript`)}`),
        'test-lesson.md',
      ),
    /Expected one Python 3 code block/,
  );
});

test('prerequisites allow a shared foundation and reject missing or cyclic references', () => {
  const nodes = [
    { slug: 'base', prerequisites: [] },
    { slug: 'left', prerequisites: ['base'] },
    { slug: 'right', prerequisites: ['base'] },
    { slug: 'end', prerequisites: ['left', 'right'] },
  ];
  assert.doesNotThrow(() => validatePrerequisites(nodes));
  assert.throws(
    () => validatePrerequisites([{ slug: 'base', prerequisites: ['absent'] }]),
    /Unknown prerequisite/,
  );
  assert.throws(
    () =>
      validatePrerequisites([
        { slug: 'a', prerequisites: ['b'] },
        { slug: 'b', prerequisites: ['a'] },
      ]),
    /Cyclic prerequisite/,
  );
});

test('quiz rejects repeated option labels and missing question text', () => {
  assert.throws(
    () => parseLesson(fixture(body.replace('- B. Second', '- A. Second')), 'test-lesson.md'),
    /Invalid quiz/,
  );
  assert.throws(
    () => parseLesson(fixture(body.replace('Which result is correct?', '')), 'test-lesson.md'),
    /Missing quiz prompt/,
  );
});

test('every course parses and prerequisites form an ordered learning path', async () => {
  const directory = new URL('../content/lessons/', import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md'));
  const lessons = await Promise.all(
    files.map(async (file) => parseLesson(await readFile(new URL(file, directory), 'utf8'), file)),
  );
  validatePrerequisites(lessons);
  assert.equal(new Set(lessons.map((lesson) => lesson.order)).size, lessons.length);
  const bySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  for (const lesson of lessons) {
    for (const slug of lesson.prerequisites)
      assert.ok(bySlug.get(slug).order < lesson.order, `${slug} before ${lesson.slug}`);
    assert.equal(new Set(lesson.quiz.options).size, 4);
    assert.ok(lesson.quiz.explanation.length > 30);
    if (lesson.subject !== '项目与面试表达') {
      assert.ok(
        lesson.sections.some((section) => /参考/.test(section.title)),
        `${lesson.slug} has references`,
      );
    }
    if (['javascript', 'sql'].includes(lesson.lab)) assert.ok(lesson.code.trim());
  }
});

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
  assert.throws(
    () => parseLesson(fixture(body, { lab: 'unknown' }), 'test-lesson.md'),
    /Invalid metadata in test-lesson\.md: lab:/,
  );
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
