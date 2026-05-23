const unsafeImportedMapKeys = new Set(['__proto__', 'constructor', 'prototype']);
const invisibleFormatCharacters =
  /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff\uffa0]/g;

export function normalizeImportedMapKeyForSafety(key: string): string {
  return key.normalize('NFKC').replace(invisibleFormatCharacters, '');
}

export function isSafeImportedMapKey(key: string): boolean {
  return !unsafeImportedMapKeys.has(normalizeImportedMapKeyForSafety(key));
}
