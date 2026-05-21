type DashboardDateLanguage = 'sv' | 'en';

const dashboardDatePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2}))?$/;

const monthNames: Record<DashboardDateLanguage, readonly string[]> = {
  sv: [
    'januari',
    'februari',
    'mars',
    'april',
    'maj',
    'juni',
    'juli',
    'augusti',
    'september',
    'oktober',
    'november',
    'december',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

const unknownDateLabels: Record<DashboardDateLanguage, string> = {
  sv: 'okänt datum',
  en: 'unknown date',
};

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const normalized = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  const expected = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
  return normalized === expected;
}

export function formatDashboardCompletedDate(
  completedAt: unknown,
  language: DashboardDateLanguage,
): string {
  if (typeof completedAt !== 'string') return unknownDateLabels[language];

  const match = dashboardDatePattern.exec(completedAt.trim());
  if (!match) return unknownDateLabels[language];

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return unknownDateLabels[language];

  const monthName = monthNames[language][month - 1];
  if (!monthName) return unknownDateLabels[language];

  if (language === 'sv') return `${day} ${monthName} ${year}`;
  return `${monthName} ${day}, ${year}`;
}
