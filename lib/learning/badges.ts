export type Badge = {
  id: string;
  titleSv: string;
  titleEn: string;
  descriptionSv: string;
  descriptionEn: string;
};

export type BadgeLanguage = 'sv' | 'en';

type BadgeInput = {
  completedQuestionCount: number;
  currentStreak: number;
  level: number;
  wrongAnswerCount: number;
};

export const badgeCatalog: Record<string, Badge> = {
  first_practice: {
    id: 'first_practice',
    titleSv: 'Första övningen',
    titleEn: 'First practice',
    descriptionSv: 'Du har besvarat din första övningsfråga.',
    descriptionEn: 'Answered your first practice question.',
  },
  streak_3: {
    id: 'streak_3',
    titleSv: 'Tre dagars svit',
    titleEn: 'Three-day streak',
    descriptionSv: 'Du har övat tre dagar i rad.',
    descriptionEn: 'Practiced on three days in a row.',
  },
  level_2: {
    id: 'level_2',
    titleSv: 'Nivå 2',
    titleEn: 'Level 2',
    descriptionSv: 'Du har samlat tillräckligt med XP för att nå nivå 2.',
    descriptionEn: 'Earned enough XP to reach level 2.',
  },
  mistake_reviewer: {
    id: 'mistake_reviewer',
    titleSv: 'Misstagsrepetition',
    titleEn: 'Mistake reviewer',
    descriptionSv: 'Du har skapat minst en misstagsrepetition.',
    descriptionEn: 'Created at least one mistake review item.',
  },
};

export function getBadgeTitle(badge: Badge, language: BadgeLanguage): string {
  return language === 'sv' ? badge.titleSv : badge.titleEn;
}

export function getBadgeDescription(badge: Badge, language: BadgeLanguage): string {
  return language === 'sv' ? badge.descriptionSv : badge.descriptionEn;
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
