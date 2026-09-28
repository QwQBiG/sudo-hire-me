import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightCode } from '../src/domain/highlight.mjs';

const text = (nodes) =>
  nodes.map((node) => (node.type === 'text' ? node.value : text(node.children ?? []))).join('');
test('highlighting preserves source text and recognizes language aliases', () => {
  const source = 'const label = "<script>not markup</script>";\nconsole.log(label);';
  const result = highlightCode(source, 'js');
  assert.equal(text(result), source);
  assert.ok(result.some((node) => node.type === 'element'));
  assert.deepEqual(result, highlightCode(source, 'javascript'));
});
test('unknown languages and oversized code remain literal text', () => {
  for (const [source, language] of [
    ['<img onerror=alert(1)>', 'unknown'],
    ['x'.repeat(30001), 'js'],
  ]) {
    assert.deepEqual(highlightCode(source, language), [{ type: 'text', value: source }]);
  }
});
test('prototype property names are treated as unknown languages', () => {
  for (const language of ['constructor', 'toString', '__proto__']) {
    assert.deepEqual(highlightCode('literal text', language), [
      { type: 'text', value: 'literal text' },
    ]);
  }
});
