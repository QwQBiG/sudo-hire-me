import test from 'node:test';
import assert from 'node:assert/strict';
import { syscallFrames } from '../src/domain/syscall.mjs';
import { createDescriptorState, advanceDescriptor } from '../src/domain/file-descriptor.mjs';

test('ordinary call stays in user mode; a ready read crosses modes without switching threads', () => {
  assert.deepEqual(
    syscallFrames('function').map((frame) => frame.mode),
    ['user', 'user', 'user'],
  );
  const read = syscallFrames('read', false);
  assert.deepEqual(
    read.map((frame) => frame.mode),
    ['user', 'kernel', 'kernel', 'user'],
  );
  assert.ok(read.every((frame) => frame.thread === 'A' && frame.switches === 0));
});

test('blocking read may switch away and later return, but the mode switch alone is not a context switch', () => {
  const frames = syscallFrames('read', true);
  assert.deepEqual(
    frames
      .filter((frame) => frame.phase === 'switch' || frame.phase === 'resume')
      .map((frame) => frame.thread),
    ['B', 'A'],
  );
  assert.equal(frames.at(-1).switches, 2);
  assert.throws(() => syscallFrames('unknown'), /未知调用类型/);
  assert.throws(() => syscallFrames('read', 'yes'), /布尔值/);
});

test('dup creates a new descriptor sharing the same open-file offset', () => {
  let state = createDescriptorState();
  state = advanceDescriptor(state, 'open-note');
  assert.equal(state.slots[3], 'F1');
  state = advanceDescriptor(state, 'dup3');
  assert.equal(state.slots[4], 'F1');
  state = advanceDescriptor(state, 'read3');
  assert.equal(state.descriptions.F1.offset, 2);
  state = advanceDescriptor(state, 'read4');
  assert.match(state.message, /"CD"/);
  assert.equal(state.descriptions.F1.offset, 4);
  state = advanceDescriptor(state, 'close3');
  assert.equal(state.slots[3], undefined);
  assert.equal(state.slots[4], 'F1');
  assert.equal(state.descriptions.F1.offset, 4);
});

test('descriptor model keeps state on invalid read and reports its bounded teaching table', () => {
  let state = createDescriptorState();
  const invalid = advanceDescriptor(state, 'read3');
  assert.equal(invalid.slots[3], undefined);
  assert.match(invalid.message, /未打开/);
  for (let i = 0; i < 4; i++) state = advanceDescriptor(state, 'open-note');
  const full = advanceDescriptor(state, 'open-note');
  assert.equal(Object.keys(full.slots).length, Object.keys(state.slots).length);
  assert.match(full.message, /都已占用/);
  assert.throws(() => advanceDescriptor(state, 'unknown'), /未知/);
});
