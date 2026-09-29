export const stringObjects = Object.freeze([
  Object.freeze({ id: 'A', value: 'go' }),
  Object.freeze({ id: 'B', value: 'go' }),
  Object.freeze({ id: 'C', value: 'hi' }),
]);

const byId = Object.fromEntries(stringObjects.map((object) => [object.id, object]));

export function compareStringObjects(leftId, rightId) {
  if (!Object.hasOwn(byId, leftId) || !Object.hasOwn(byId, rightId)) {
    throw new RangeError('Unknown string object');
  }
  const left = byId[leftId];
  const right = byId[rightId];
  return {
    left,
    right,
    sameObject: left.id === right.id,
    sameContent: left.value === right.value,
  };
}
