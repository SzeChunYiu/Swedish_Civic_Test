export interface CanonicalUtcTimestamp {
  epochMs: number;
  iso: string;
}

export const CANONICAL_UTC_ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function parseCanonicalUtcIsoTimestamp(value: unknown): CanonicalUtcTimestamp | null {
  if (typeof value !== 'string') return null;
  if (!CANONICAL_UTC_ISO_TIMESTAMP_PATTERN.test(value)) return null;

  const parsed = new Date(value);
  const epochMs = parsed.getTime();
  if (!Number.isFinite(epochMs)) return null;
  if (parsed.toISOString() !== value) return null;

  return { epochMs, iso: value };
}

export function isCanonicalUtcIsoTimestamp(value: unknown): value is string {
  return parseCanonicalUtcIsoTimestamp(value) !== null;
}
