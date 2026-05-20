const unsafeImportedMapKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function isSafeImportedMapKey(key: string): boolean {
  return !unsafeImportedMapKeys.has(key);
}
