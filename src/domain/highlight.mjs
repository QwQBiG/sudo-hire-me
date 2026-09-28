import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import sql from 'highlight.js/lib/languages/sql';
import rust from 'highlight.js/lib/languages/rust';
import cpp from 'highlight.js/lib/languages/cpp';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import http from 'highlight.js/lib/languages/http';

const highlighter = createLowlight({
  javascript,
  typescript,
  sql,
  rust,
  cpp,
  bash,
  python,
  json,
  http,
});
const aliases = { js: 'javascript', ts: 'typescript', c: 'cpp', sh: 'bash', shell: 'bash' };

/** @returns {import('hast').RootContent[]} */
export function highlightCode(code, language) {
  const name = Object.hasOwn(aliases, language) ? aliases[language] : language;
  if (!highlighter.registered(name) || code.length > 30000) {
    return [{ type: 'text', value: code }];
  }
  return highlighter.highlight(name, code).children;
}
