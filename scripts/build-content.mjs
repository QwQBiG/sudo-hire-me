import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { z } from 'zod';

const root = fileURLToPath(new URL('../', import.meta.url));
const lessonSchema = z
  .object({
    slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
    title: z.string().min(2),
    description: z.string().min(10),
    subject: z.string().min(2),
    order: z.number().int().nonnegative(),
    minutes: z.number().int().positive(),
    lab: z.enum(['bits', 'binary-search', 'process', 'javascript', 'sql', 'ownership']),
    objectives: z.array(z.string()).min(2).max(4),
    prerequisites: z.array(z.string()).default([]),
  })
  .strict();

const plainText = (node) => node.value ?? (node.children ?? []).map(plainText).join('');

const sourceOf = (nodes, source) =>
  nodes.length
    ? source.slice(nodes[0].position.start.offset, nodes.at(-1).position.end.offset)
    : '';

function extractQuiz(section, filename, source) {
  if (!section) throw new Error(`Missing quiz in ${filename}`);
  const paragraphs = section.nodes.filter((node) => node.type === 'paragraph');
  const lines = section.nodes.flatMap((node) =>
    node.type === 'list' ? node.children.map(plainText) : plainText(node).split('\n'),
  );
  const options = lines.filter((line) => /^[A-D][.、]\s/.test(line));
  const answerNode = paragraphs.find((node) => /(?:正确)?答案[：:]\s*[A-D]/.test(plainText(node)));
  const match = answerNode && plainText(answerNode).match(/(?:正确)?答案[：:]\s*([A-D])/);
  if (options.length !== 4 || !match) throw new Error(`Invalid quiz in ${filename}`);
  const answerIndex = section.nodes.indexOf(answerNode);
  return {
    prompt: plainText(paragraphs[0]),
    options: options.map((option) => option.replace(/^[A-D][.、]\s*/, '')),
    answer: match[1].charCodeAt(0) - 65,
    explanation: sourceOf(section.nodes.slice(answerIndex), source),
  };
}

export function parseLesson(raw, filename) {
  const { data, content } = matter(raw);
  const metadata = lessonSchema.parse(data);
  if (filename !== `${metadata.slug}.md`) throw new Error(`Slug does not match ${filename}`);
  const ast = unified().use(remarkParse).parse(content);
  const validateNode = (node) => {
    if (node.type === 'html') throw new Error(`Raw HTML is not allowed in ${filename}`);
    for (const child of node.children ?? []) validateNode(child);
  };
  validateNode(ast);
  const sections = [];
  let current;
  for (const node of ast.children) {
    if (node.type === 'heading' && node.depth === 2) {
      current = { title: node.children.map((child) => child.value ?? '').join(''), nodes: [] };
      sections.push(current);
    } else if (current) current.nodes.push(node);
  }
  const answer = sections.find((section) => section.title === '面试回答');
  if (!answer) throw new Error(`Missing interview answer in ${filename}`);
  if (!answer.nodes.length) throw new Error(`Empty interview answer in ${filename}`);
  if (new Set(sections.map((section) => section.title)).size !== sections.length) {
    throw new Error(`Duplicate section title in ${filename}`);
  }
  const sectionsJson = sections.map(({ title, nodes }) => ({
    title,
    markdown: sourceOf(nodes, content),
  }));
  const codeSection = sections.find((section) => section.title === '实验代码');
  const code = codeSection?.nodes.find((node) => node.type === 'code');
  const quiz = extractQuiz(
    sections.find((section) => section.title === '选择题'),
    filename,
    content,
  );
  return {
    ...metadata,
    quiz,
    sections: sectionsJson,
    code: code?.value ?? '',
    source: filename,
    markdown: content,
  };
}

export async function buildContent() {
  const directory = path.join(root, 'content/lessons');
  const files = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort();
  const lessons = await Promise.all(
    files.map(async (file) =>
      parseLesson(await readFile(path.join(directory, file), 'utf8'), file),
    ),
  );
  lessons.sort((a, b) => a.order - b.order);
  const slugs = new Set(lessons.map((lesson) => lesson.slug));
  if (slugs.size !== lessons.length) throw new Error('Duplicate lesson slug');
  if (new Set(lessons.map((lesson) => lesson.order)).size !== lessons.length) {
    throw new Error('Duplicate lesson order');
  }
  for (const lesson of lessons) {
    for (const prerequisite of lesson.prerequisites) {
      if (!slugs.has(prerequisite) || prerequisite === lesson.slug) {
        throw new Error(`Invalid prerequisite in ${lesson.slug}`);
      }
    }
  }
  await mkdir(path.join(root, '.generated'), { recursive: true });
  await mkdir(path.join(root, 'public/lessons'), { recursive: true });
  await mkdir(path.join(root, 'public/data'), { recursive: true });
  await writeFile(
    path.join(root, '.generated/lessons.json'),
    `${JSON.stringify(
      lessons.map(({ quiz, sections, code, markdown, ...summary }) => summary),
      null,
      2,
    )}\n`,
    'utf8',
  );
  await Promise.all(
    lessons.map(async ({ markdown, ...lesson }) => {
      await writeFile(
        path.join(root, 'public/data', `${lesson.slug}.json`),
        `${JSON.stringify(lesson)}\n`,
        'utf8',
      );
    }),
  );
  await Promise.all(
    files.map((file) =>
      copyFile(path.join(directory, file), path.join(root, 'public/lessons', file)),
    ),
  );
  return lessons;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lessons = await buildContent();
  console.log(`Validated ${lessons.length} lessons and exported Markdown.`);
}
