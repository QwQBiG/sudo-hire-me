import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { z } from 'zod';

const root = fileURLToPath(new URL('../', import.meta.url));
const schema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  title: z.string().min(2),
  description: z.string().min(10),
  subject: z.string().min(2),
  order: z.number().int().nonnegative(),
  minutes: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
});
const text = (node) => node.value ?? (node.children ?? []).map(text).join('');

export function parseDocument(raw, filename) {
  const { data, content } = matter(raw);
  const metadata = schema.parse(data);
  if (`${metadata.slug}.md` !== filename) throw new Error('Course filename and slug differ.');
  const tree = unified().use(remarkParse).parse(content);
  const headings = tree.children
    .filter((node) => node.type === 'heading' && [2, 3].includes(node.depth))
    .map((node) => ({
      id: `section-${node.position.start.line}`,
      title: text(node),
      depth: node.depth,
    }));
  return { metadata: { ...metadata, headings }, content };
}

export async function buildDocs() {
  const source = path.join(root, 'content/lessons');
  const names = (await readdir(source)).sort();
  if (!names.length || names.some((name) => !/^[a-z][a-z0-9-]+\.md$/.test(name)))
    throw new Error('Invalid course filename.');
  const manifest = JSON.parse(await readFile(path.join(root, '.docs-export.json'), 'utf8'));
  const hashes = new Map(manifest.files.map((file) => [file.path, file.sha256]));
  const documents = [];
  for (const name of names) {
    if (!(await lstat(path.join(source, name))).isFile())
      throw new Error('Non-regular course file.');
    const raw = await readFile(path.join(source, name), 'utf8');
    const hash = createHash('sha256').update(raw).digest('hex');
    if (hashes.get(`content/lessons/${name}`) !== hash)
      throw new Error(`Export digest differs: ${name}`);
    documents.push({ ...parseDocument(raw, name), raw });
  }
  const catalog = documents.map((document) => document.metadata).sort((a, b) => a.order - b.order);
  if (
    catalog.length !== manifest.count ||
    new Set(catalog.map((row) => row.slug)).size !== catalog.length ||
    new Set(catalog.map((row) => row.order)).size !== catalog.length
  )
    throw new Error('Invalid course identities.');
  const bySlug = new Map(catalog.map((row) => [row.slug, row]));
  const visited = new Set(),
    active = new Set();
  function visit(slug) {
    if (active.has(slug) || !bySlug.has(slug)) throw new Error(`Invalid prerequisite: ${slug}`);
    if (visited.has(slug)) return;
    active.add(slug);
    for (const required of bySlug.get(slug).prerequisites) visit(required);
    active.delete(slug);
    visited.add(slug);
  }
  for (const row of catalog) visit(row.slug);
  for (const directory of ['.generated', 'public/lessons', 'public/reading']) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  await writeFile(
    path.join(root, '.generated/documents.json'),
    `${JSON.stringify(catalog)}\n`,
    'utf8',
  );
  for (const document of documents) {
    await writeFile(
      path.join(root, 'public/lessons', `${document.metadata.slug}.md`),
      document.raw,
      'utf8',
    );
    await writeFile(
      path.join(root, 'public/reading', `${document.metadata.slug}.md`),
      document.content,
      'utf8',
    );
  }
  return catalog;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Validated ${(await buildDocs()).length} free documents.`);
}
