import test from 'node:test';
import assert from 'node:assert/strict';
import { assessTraceClaim, visibleTraceEvents } from '../src/domain/log-trace.mjs';

test('request filter preserves only events for selected request', () => {
  const events = visibleTraceEvents('R17');
  assert.equal(events.length, 5);
  assert.ok(events.every((event) => event.request === 'R17'));
});

test('assessment distinguishes evidence from unproven cause', () => {
  assert.equal(assessTraceClaim('supported').supported, true);
  assert.equal(assessTraceClaim('all-failed').supported, false);
  assert.equal(assessTraceClaim('validated').supported, false);
});

test('invalid request or claim is rejected', () => {
  assert.throws(() => visibleTraceEvents('R00'), /未知请求/);
  assert.throws(() => assessTraceClaim('mystery'), /未知结论/);
});
