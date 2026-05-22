export type WeeklyRecapDateRangeLanguage = 'sv' | 'en';

type ParsedDateKey = {
  day: number;
  month: number;
  year: number;
  date: Date;
};

function parseDateKey(dateKey: string): ParsedDateKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { day, month, year, date };
}

function monthName(date: Date, language: WeeklyRecapDateRangeLanguage): string {
  return new Intl.DateTimeFormat(language === 'sv' ? 'sv-SE' : 'en-US', {
    month: 'long',
  }).format(date);
}

export function formatWeeklyRecapDateRange(
  startDateKey: string,
  endDateKey: string,
  language: WeeklyRecapDateRangeLanguage,
): string {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  if (!start || !end) return `${startDateKey} - ${endDateKey}`;

  const startMonth = monthName(start.date, language);
  const endMonth = monthName(end.date, language);
  const sameYear = start.year === end.year;
  const sameMonth = sameYear && start.month === end.month;

  if (language === 'sv') {
    if (sameMonth) return `${start.day}-${end.day} ${endMonth} ${end.year}`;
    if (sameYear) return `${start.day} ${startMonth} - ${end.day} ${endMonth} ${end.year}`;
    return `${start.day} ${startMonth} ${start.year} - ${end.day} ${endMonth} ${end.year}`;
  }

  if (sameMonth) return `${endMonth} ${start.day}-${end.day}, ${end.year}`;
  if (sameYear) return `${startMonth} ${start.day} - ${endMonth} ${end.day}, ${end.year}`;
  return `${startMonth} ${start.day}, ${start.year} - ${endMonth} ${end.day}, ${end.year}`;
}
