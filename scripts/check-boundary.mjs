import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const publicFiles = new Set([
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.prettierrc.json',
  '.docs-export.json',
  '.github/workflows/pages.yml',
  'AGENTS.md',
  'README.md',
  'docs/CATALOG.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'public/favicon.svg',
  'scripts/build-docs.mjs',
  'scripts/check-boundary.mjs',
  'src/main.tsx',
  'src/App.tsx',
  'src/types.ts',
  'src/styles.css',
  'src/hooks/useProgress.ts',
  'src/domain/progress.mjs',
  'src/components/Catalog.tsx',
  'src/components/Document.tsx',
  'src/components/CodeBlock.tsx',
  'src/components/MemoryTools.tsx',
  'tests/progress.test.mjs',
  'tests/docs.test.mjs',
]);
export function assertPublicFiles(files, artifact = false) {
  for (const file of files) {
    const safe = artifact
      ? ['index.html', 'favicon.svg'].includes(file) ||
        /^assets\/(index|Document)-[a-zA-Z0-9_-]+\.(js|css)$/.test(file) ||
        /^(lessons|reading)\/[a-z][a-z0-9-]+\.md$/.test(file)
      : publicFiles.has(file) || /^content\/lessons\/[a-z][a-z0-9-]+\.md$/.test(file);
    if (!safe) throw new Error(`Outside public whitelist: ${file}`);
  }
}
export async function listFiles(directory, ignore = new Set()) {
  const result = [];
  async function walk(folder, prefix = '') {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      if (!prefix && ignore.has(item.name)) continue;
      const name = `${prefix}${item.name}`;
      if (item.isSymbolicLink()) throw new Error(`Symlink in public tree: ${name}`);
      if (item.isDirectory()) await walk(path.join(folder, item.name), `${name}/`);
      else result.push(name);
    }
  }
  await walk(directory);
  return result.sort();
}
export async function checkBoundary() {
  const tree = await listFiles(root, new Set(['.git', 'node_modules', 'dist', '.generated']));
  assertPublicFiles(
    tree.filter((file) => !/^(public\/lessons|public\/reading)\/[a-z][a-z0-9-]+\.md$/.test(file)),
  );
  const built = await listFiles(path.join(root, 'dist'));
  assertPublicFiles(built, true);
  console.log(`Public boundary verified: ${built.length} artifact files.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await checkBoundary();
