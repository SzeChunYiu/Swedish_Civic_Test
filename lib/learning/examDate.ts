export const EXAM_REFORM_DATE = new Date('2026-06-06T00:00:00Z');

export function daysUntil(target: Date, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

export function formatExamDate(target: Date, language: 'sv' | 'en'): string {
  return target.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
