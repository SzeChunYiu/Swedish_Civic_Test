export const SEARCH_QUERY_MAX_LENGTH = 120;

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

export function getFirstSearchParamValue(value: string | string[] | undefined): string {
  const firstValue = Array.isArray(value) ? value[0] : value;

  return typeof firstValue === 'string' ? firstValue : '';
}

export function normalizeSearchQueryInput(value: string): string {
  return value.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

export function normalizeSearchQueryParam(value: string | string[] | undefined): string | null {
  const normalizedValue = getFirstSearchParamValue(value).trim();
  if (!normalizedValue || normalizedValue.length > SEARCH_QUERY_MAX_LENGTH) return null;

  return normalizedValue;
}

export function normalizeSearchQueryParamPair({
  q,
  query,
}: {
  q?: string | string[];
  query?: string | string[];
}): string | null {
  if (getFirstSearchParamValue(q).length > 0) return normalizeSearchQueryParam(q);

  return normalizeSearchQueryParam(query);
}
