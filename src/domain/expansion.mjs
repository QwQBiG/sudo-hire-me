export function cacheAccess(keys, key, capacity, policy = 'lru') {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) throw new RangeError('capacity');
  if (
    !Array.isArray(keys) ||
    keys.length > capacity ||
    new Set(keys).size !== keys.length ||
    keys.some((item) => typeof item !== 'string' || !/^[A-F]$/.test(item))
  )
    throw new RangeError('cache state');
  if (!['lru', 'fifo'].includes(policy) || !/^[A-F]$/.test(key))
    throw new RangeError('cache input');
  const hit = keys.includes(key);
  const next = hit && policy === 'fifo' ? [...keys] : [...keys.filter((item) => item !== key), key];
  const evicted = next.length > capacity ? next.shift() : null;
  return { keys: next, hit, evicted };
}

export function nextGreater(values) {
  if (
    !Array.isArray(values) ||
    values.length > 12 ||
    values.some((v) => !Number.isInteger(v) || v < 0 || v > 20)
  )
    throw new RangeError('values');
  const stack = [],
    answers = values.map(() => -1),
    frames = [];
  for (let i = 0; i < values.length; i++) {
    const popped = [];
    while (stack.length && values[stack.at(-1)] < values[i]) {
      const index = stack.pop();
      answers[index] = values[i];
      popped.push(index);
    }
    stack.push(i);
    frames.push({ index: i, stack: [...stack], answers: [...answers], popped });
  }
  return { answers, frames };
}

export function pointerPermission(kind, action) {
  const permissions = { pointee: ['rebind'], pointer: ['write'], both: [] };
  if (!Object.hasOwn(permissions, kind) || !['write', 'rebind'].includes(action))
    throw new RangeError('pointer rule');
  return permissions[kind].includes(action);
}

export function creationMode(requested, mask) {
  if (![requested, mask].every((n) => Number.isInteger(n) && n >= 0 && n <= 0o777))
    throw new RangeError('mode');
  return requested & ~mask & 0o777;
}

export function referenceState(strong, weak) {
  if (![strong, weak].every((n) => Number.isInteger(n) && n >= 0 && n <= 8))
    throw new RangeError('reference count');
  return {
    valueAlive: strong > 0,
    controlAlive: strong + weak > 0,
    canUpgrade: strong > 0 && weak > 0,
  };
}

export function threadTraits(kind) {
  const traits = {
    String: [true, true],
    Rc: [false, false],
    Cell: [true, false],
    RefCell: [true, false],
    Arc: [true, true],
    ArcRefCell: [false, false],
  };
  if (!Object.hasOwn(traits, kind)) throw new RangeError('type');
  const [send, sync] = traits[kind];
  return { send, sync };
}

export function accessDecision(signedIn, role, ownResource) {
  if (typeof signedIn !== 'boolean' || typeof ownResource !== 'boolean')
    throw new RangeError('policy input');
  if (!['reader', 'editor', 'admin'].includes(role)) throw new RangeError('role');
  if (!signedIn) return 401;
  return role === 'admin' || (role === 'editor' && ownResource) ? 200 : 403;
}

export function vectorMutation(size, capacity, operation, index) {
  if (
    ![size, capacity, index].every(Number.isInteger) ||
    size < 0 ||
    capacity < size ||
    index < 0 ||
    index > size
  )
    throw new RangeError('vector');
  if (operation === 'push')
    return {
      size: size + 1,
      reallocated: size === capacity,
      valid: size < capacity && index < size,
    };
  // The lesson erases begin()+1; index denotes the saved iterator, not the erased position.
  if (operation === 'erase' && size > 1)
    return { size: size - 1, reallocated: false, valid: index < 1 };
  throw new RangeError('operation');
}
