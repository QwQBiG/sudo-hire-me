function alignUp(value, boundary) {
  return Math.ceil(value / boundary) * boundary;
}

export function layoutStruct(fields) {
  if (!Array.isArray(fields) || fields.length === 0 || fields.length > 8) {
    throw new RangeError('fields must contain 1 to 8 members');
  }
  const names = new Set();
  let offset = 0;
  let structureAlignment = 1;
  let internalPadding = 0;
  const members = [];
  const slots = [];

  for (const field of fields) {
    if (
      !field ||
      typeof field.name !== 'string' ||
      !/^[A-Za-z][A-Za-z0-9_]*$/.test(field.name) ||
      names.has(field.name) ||
      !Number.isInteger(field.size) ||
      field.size < 1 ||
      field.size > 16 ||
      !Number.isInteger(field.alignment) ||
      field.alignment < 1 ||
      field.alignment > 16 ||
      (field.alignment & (field.alignment - 1)) !== 0
    ) {
      throw new RangeError('Invalid member name, size, or alignment');
    }
    names.add(field.name);
    structureAlignment = Math.max(structureAlignment, field.alignment);
    const start = alignUp(offset, field.alignment);
    while (offset < start) {
      slots.push({ offset, kind: 'padding', field: null });
      internalPadding++;
      offset++;
    }
    members.push({ ...field, offset: start });
    for (let byte = 0; byte < field.size; byte++) {
      slots.push({ offset, kind: 'member', field: field.name });
      offset++;
    }
  }

  const usedBytes = offset;
  const size = alignUp(offset, structureAlignment);
  while (offset < size) {
    slots.push({ offset, kind: 'padding', field: null });
    offset++;
  }

  return {
    members,
    slots,
    size,
    usedBytes,
    alignment: structureAlignment,
    internalPadding,
    tailPadding: size - usedBytes,
  };
}
