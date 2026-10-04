import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildDocs, parseDocument } from '../scripts/build-docs.mjs';
import { assertPublicFiles } from '../scripts/check-boundary.mjs';

test('all exported documents retain identities and valid headings', async () => {
  const documents = await buildDocs();
  assert.equal(documents.length, 233);
  assert.equal(new Set(documents.map((document) => document.slug)).size, 233);
  assert.ok(documents.every((document) => document.headings.length > 0));
  const first = documents.find((document) => document.slug === 'binary-representation');
  assert.equal(first.subject, '计算机基础');
  assert.ok(!('lab' in first) && !('quiz' in first));
});
test('Markdown AST does not treat a heading inside code as a document heading', async () => {
  const raw = await readFile(
    new URL('../content/lessons/binary-representation.md', import.meta.url),
    'utf8',
  );
  const parsed = parseDocument(
    `${raw}\n\n\`\`\`text\n## fake heading\n\`\`\`\n`,
    'binary-representation.md',
  );
  assert.ok(!parsed.metadata.headings.some((heading) => heading.title === 'fake heading'));
  assert.throws(() => parseDocument(raw, 'other.md'), /differ/);
});
test('public whitelist accepts only documents and the reader', () => {
  assert.doesNotThrow(() =>
    assertPublicFiles(['src/components/Document.tsx', 'content/lessons/binary-representation.md']),
  );
  for (const file of [
    'src/labs/Bits.tsx',
    'src/runners/sql.worker.ts',
    'server/payments.ts',
    '.env',
    'public/data/paid.json',
    '../secret.md',
  ]) {
    assert.throws(() => assertPublicFiles([file]), /whitelist/);
  }
});
test('artifact whitelist rejects stale runtimes and payment files', () => {
  assert.doesNotThrow(() =>
    assertPublicFiles(
      [
        'index.html',
        'assets/index-safe.js',
        'assets/Document-safe.js',
        'reading/binary-representation.md',
      ],
      true,
    ),
  );
  for (const file of ['assets/sql.wasm', 'assets/CodeLab.js', 'data/paid.json', 'private.zip']) {
    assert.throws(() => assertPublicFiles([file], true), /whitelist/);
  }
});
