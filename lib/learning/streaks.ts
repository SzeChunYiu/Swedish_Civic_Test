const dayInMs = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toDateKey(new Date(date.getTime() - dayInMs));
}

export function calculateStreak(days: string[] = [], today = toDateKey(new Date())): number {
  const uniqueDays = new Set(days.map((day) => day.slice(0, 10)));
  let cursor = uniqueDays.has(today) ? today : previousDateKey(today);
  let streak = 0;

  while (uniqueDays.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }

  return streak;
}
