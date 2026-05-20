export type Badge = {
  descriptionEn: string;
  descriptionSv: string;
  id: string;
  titleEn: string;
  titleSv: string;
};

type BadgeInput = {
  completedQuestionCount: number;
  currentStreak: number;
  level: number;
  wrongAnswerCount: number;
};

export const badgeCatalog: Record<string, Badge> = {
  first_practice: {
    descriptionEn: 'Answered your first practice question.',
    descriptionSv: 'Svarade på din första övningsfråga.',
    id: 'first_practice',
    titleEn: 'First practice',
    titleSv: 'Första övningen',
  },
  streak_3: {
    descriptionEn: 'Practiced on three days in a row.',
    descriptionSv: 'Övade tre dagar i rad.',
    id: 'streak_3',
    titleEn: 'Three-day streak',
    titleSv: 'Tre dagars svit',
  },
  level_2: {
    descriptionEn: 'Earned enough XP to reach level 2.',
    descriptionSv: 'Samlade tillräckligt med XP för att nå nivå 2.',
    id: 'level_2',
    titleEn: 'Level 2',
    titleSv: 'Nivå 2',
  },
  mistake_reviewer: {
    descriptionEn: 'Created at least one mistake review item.',
    descriptionSv: 'Skapade minst en fråga att repetera efter ett misstag.',
    id: 'mistake_reviewer',
    titleEn: 'Mistake reviewer',
    titleSv: 'Misstagsrepetition',
  },
};

export function getBadgeTitle(badge: Badge, language: 'sv' | 'en') {
  return language === 'en' ? badge.titleEn : badge.titleSv;
}

export function getBadgeDescription(badge: Badge, language: 'sv' | 'en') {
  return language === 'en' ? badge.descriptionEn : badge.descriptionSv;
}

export function deriveBadges({
  completedQuestionCount,
  currentStreak,
  level,
  wrongAnswerCount,
}: BadgeInput): Badge[] {
  const badges: Badge[] = [];

  if (completedQuestionCount >= 1) badges.push(badgeCatalog.first_practice);
  if (currentStreak >= 3) badges.push(badgeCatalog.streak_3);
  if (level >= 2) badges.push(badgeCatalog.level_2);
  if (wrongAnswerCount >= 1) badges.push(badgeCatalog.mistake_reviewer);

  return badges;
}
