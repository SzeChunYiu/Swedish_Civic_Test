const FUTURE_ANSWER_TOLERANCE_MS = 5 * 60 * 1000;
const ANSWER_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2}))?$/;

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const normalized = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  const expected = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
  return normalized === expected;
}

export function validAnswerTimestampMs(value: unknown, now: Date = new Date()): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const match = ANSWER_DATE_PATTERN.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return null;

  const timestamp = match[0].includes('T') ? Date.parse(trimmed) : Date.UTC(year, month - 1, day);
  if (!Number.isFinite(timestamp)) return null;

  const nowTimestamp = now.getTime();
  if (Number.isFinite(nowTimestamp) && timestamp > nowTimestamp + FUTURE_ANSWER_TOLERANCE_MS) {
    return null;
  }

  return timestamp;
}

export function validAnswerDate(value: unknown, now: Date = new Date()): Date | null {
  const timestamp = validAnswerTimestampMs(value, now);
  return timestamp === null ? null : new Date(timestamp);
}
