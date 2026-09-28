import test from 'node:test';
import assert from 'node:assert/strict';
import {
  translateAddress,
  initialRace,
  advanceRace,
  requestLock,
  isDeadlocked,
  transportDelivery,
  dnsQuery,
  cacheRequest,
  forwardingFrame,
  httpMessage,
  tcpPackets,
} from '../src/domain/systems.mjs';

test('paging preserves offsets and supports page preparation without making illegal pages legal', () => {
  assert.equal(translateAddress(2500).physical, 5572);
  assert.equal(translateAddress(3500).kind, 'fault');
  assert.equal(translateAddress(3500, true).physical, 9644);
  assert.equal(translateAddress(4095, true).physical, 10239);
  assert.equal(translateAddress(7168, true).kind, 'illegal');
  assert.equal(translateAddress(1024, false, true).kind, 'protection');
  assert.equal(translateAddress(-1).kind, 'invalid');
  assert.equal(translateAddress(8192).kind, 'invalid');
});

test('manual scheduling exhibits lost updates without changing the input state', () => {
  let state = initialRace();
  const initial = state;
  const original = structuredClone(state);
  for (const thread of [0, 1, 0, 1, 0, 1]) state = advanceRace(state, thread, false);
  assert.equal(state.shared, 1);
  assert.deepEqual(initial, original);
  assert.deepEqual(state.phases, [3, 3]);
  assert.equal(advanceRace(state, 0, false).shared, 1);
  assert.throws(() => advanceRace(state, 3, false), RangeError);
});

test('mutex blocks an early read and preserves both increments', () => {
  let state = advanceRace(initialRace(), 0, true);
  state = advanceRace(state, 1, true);
  assert.equal(state.phases[1], 0);
  for (const thread of [0, 0, 1, 1, 1]) state = advanceRace(state, thread, true);
  assert.equal(state.shared, 2);
  assert.equal(state.owner, -1);
});

test('opposite lock acquisition forms a wait cycle while ordered acquisition rejects Y first', () => {
  let state = { owners: [-1, -1], waiting: [-1, -1] };
  for (const [thread, lock] of [
    [0, 0],
    [1, 1],
    [0, 1],
    [1, 0],
  ])
    state = requestLock(state.owners, state.waiting, thread, lock, false);
  assert.equal(isDeadlocked(state.owners, state.waiting), true);
  assert.deepEqual(requestLock([-1, -1], [-1, -1], 1, 1, true).owners, [-1, -1]);
  assert.equal(isDeadlocked([0, -1], [-1, 0]), false);
});

test('TCP buffers gaps, reorders and deduplicates while UDP preserves arrival and duplication', () => {
  assert.equal(transportDelivery([2, 0], true).output, 'hel');
  assert.equal(transportDelivery([2, 0, 1, 1], true).output, 'helloworld');
  assert.equal(transportDelivery([2, 0, 0], false).output, 'orld | hel | hel');
  assert.deepEqual(transportDelivery([2, 0], true).missing, [1]);
});

test('DNS expiry uses a strict boundary and authoritative answers return through the resolver', () => {
  assert.equal(dnsQuery('answer', 120).ttl, 180);
  assert.equal(dnsQuery('answer', 299).hit, true);
  assert.equal(dnsQuery('answer', 300).hit, false);
  assert.deepEqual(dnsQuery('none', 0).path.slice(-3), ['权威服务器', '递归解析器', '客户端']);
  assert.equal(dnsQuery('delegation', 0).path.includes('根服务器'), false);
  assert.throws(() => dnsQuery('none', -1), RangeError);
});

test('cache request distinguishes fresh reuse, stale validation and new representations', () => {
  assert.equal(cacheRequest(null, 1, 0, 'max-age').status, '200');
  assert.equal(cacheRequest(1, 2, 59, 'max-age').network, false);
  assert.equal(cacheRequest(1, 1, 60, 'max-age').status, '304');
  assert.equal(cacheRequest(1, 2, 60, 'max-age').cachedVersion, 2);
  assert.equal(cacheRequest(1, 1, 0, 'no-cache').status, '304');
  assert.equal(cacheRequest(null, 1, 0, 'no-store').cachedVersion, null);
  assert.throws(() => cacheRequest(1, 1, -2, 'max-age'), RangeError);
});

test('routing changes link addresses and drops an expiring IPv4 packet', () => {
  assert.equal(forwardingFrame(0, 64).destination, 'MAC-R入口');
  assert.equal(forwardingFrame(1, 64).destination, 'MAC-S');
  assert.equal(forwardingFrame(1, 64).ttl, 63);
  assert.equal(forwardingFrame(1, 1).dropped, true);
  assert.throws(() => forwardingFrame(1, 0), RangeError);
});

test('HEAD has no response body but can describe the corresponding GET representation length', () => {
  assert.equal(httpMessage('GET', true).body.length, 8);
  assert.equal(httpMessage('HEAD', true).length, 8);
  assert.equal(httpMessage('HEAD', false).body, '');
  assert.equal(httpMessage('GET', false).status, '404 Not Found');
});

test('TCP SYN and FIN consume sequence space while pure ACK does not', () => {
  const messages = tcpPackets(1000, 5000);
  assert.equal(messages[2].text, 'ACK seq=1001 ack=5001');
  assert.equal(messages[6].text, 'ACK seq=1002 ack=5002');
  assert.equal(messages[2].beforeServer, 'SYN-RECEIVED');
  assert.equal(messages[6].beforeServer, 'LAST-ACK');
  assert.equal(messages[6].client, 'TIME-WAIT');
  assert.throws(() => tcpPackets(-1, 5000), RangeError);
});
