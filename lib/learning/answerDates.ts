const FUTURE_ANSWER_TOLERANCE_MS = 5 * 60 * 1000;

export function validAnswerTimestampMs(value: unknown, now: Date = new Date()): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const timestamp = Date.parse(trimmed);
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
