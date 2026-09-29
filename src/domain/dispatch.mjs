const sounds = {
  Animal: '动物叫声',
  Dog: '汪',
  Cat: '喵',
};

export const dispatchTypes = Object.keys(sounds);

export function resolveJavaDispatch(actualType, declaredType) {
  if (!Object.hasOwn(sounds, actualType) || !Object.hasOwn(sounds, declaredType)) {
    throw new RangeError('Unknown Java demo type');
  }
  if (declaredType !== 'Animal' && declaredType !== actualType) {
    throw new RangeError('The declared type cannot refer to this object');
  }

  return {
    actualType,
    declaredType,
    declaration: `${declaredType} pet = new ${actualType}();`,
    overrideSignature: 'speak()',
    overrideTarget: `${actualType}.speak()`,
    overrideResult: sounds[actualType],
    overloadArgumentType: declaredType,
    overloadTarget: `feed(${declaredType})`,
  };
}
