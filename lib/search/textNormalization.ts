export function normalizeSearchResultLimit(
  limit: unknown,
  defaultLimit: number,
): number | undefined {
  const safeDefault = Number.isInteger(defaultLimit) && defaultLimit >= 0 ? defaultLimit : 0;
  if (limit === Number.POSITIVE_INFINITY) return undefined;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit >= 0) return limit;
  return safeDefault;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
