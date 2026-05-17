const dayInMs = 24 * 60 * 60 * 1000;

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toUtcDateKey(new Date(date.getTime() - dayInMs));
}

export function calculateStreak(days: string[] = [], today = getLocalDateKey()): number {
  const uniqueDays = new Set(days.map((day) => day.slice(0, 10)));
  let cursor = uniqueDays.has(today) ? today : previousDateKey(today);
  let streak = 0;

  while (uniqueDays.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }

  return streak;
}
