import type { AppLanguage } from '../storage/settingsStore';

export type BadgeId = 'first_practice' | 'streak_3' | 'level_2' | 'mistake_reviewer';

export type Badge = {
  id: BadgeId;
  title: string;
  description: string;
  titleSv: string;
  titleEn: string;
  descriptionSv: string;
  descriptionEn: string;
  lockedHintSv: string;
  lockedHintEn: string;
};

export type BadgeInput = {
  completedQuestionCount: number;
  currentStreak: number;
  level: number;
  wrongAnswerCount: number;
};

const badgeOrder: BadgeId[] = ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'];

export const badgeCatalog: Record<BadgeId, Badge> = {
  first_practice: {
    id: 'first_practice',
    title: 'First practice',
    description: 'Answered your first practice question.',
    titleSv: 'Första övningen',
    titleEn: 'First practice',
    descriptionSv: 'Svara på din första övningsfråga.',
    descriptionEn: 'Answer your first practice question.',
    lockedHintSv: 'Svara på en fråga för att låsa upp märket.',
    lockedHintEn: 'Answer one question to unlock this badge.',
  },
  streak_3: {
    id: 'streak_3',
    title: 'Three-day streak',
    description: 'Practiced on three days in a row.',
    titleSv: 'Tre dagars svit',
    titleEn: 'Three-day streak',
    descriptionSv: 'Öva tre dagar i rad.',
    descriptionEn: 'Practice on three days in a row.',
    lockedHintSv: 'Fortsätt med korta pass tills sviten når tre dagar.',
    lockedHintEn: 'Keep short sessions going until the streak reaches three days.',
  },
  level_2: {
    id: 'level_2',
    title: 'Level 2',
    description: 'Earned enough XP to reach level 2.',
    titleSv: 'Nivå 2',
    titleEn: 'Level 2',
    descriptionSv: 'Samla tillräckligt med XP för att nå nivå 2.',
    descriptionEn: 'Earn enough XP to reach level 2.',
    lockedHintSv: 'Läs förklaringar och svara rätt för att samla XP.',
    lockedHintEn: 'Read explanations and answer correctly to build XP.',
  },
  mistake_reviewer: {
    id: 'mistake_reviewer',
    title: 'Mistake reviewer',
    description: 'Created at least one mistake review item.',
    titleSv: 'Misstagsrepetition',
    titleEn: 'Mistake reviewer',
    descriptionSv: 'Skapa minst en fråga att repetera efter ett fel svar.',
    descriptionEn: 'Create at least one review item after a wrong answer.',
    lockedHintSv: 'Ett fel svar lägger till en fråga i repetitionsflödet.',
    lockedHintEn: 'A wrong answer adds a question to the review flow.',
  },
};

export function getAllBadges(): Badge[] {
  return badgeOrder.map((badgeId) => badgeCatalog[badgeId]);
}

export function getBadgeTitle(badge: Badge, language: AppLanguage): string {
  return language === 'en' ? badge.titleEn : badge.titleSv;
}

export function getBadgeDescription(badge: Badge, language: AppLanguage): string {
  return language === 'en' ? badge.descriptionEn : badge.descriptionSv;
}

export function getBadgeLockedHint(badge: Badge, language: AppLanguage): string {
  return language === 'en' ? badge.lockedHintEn : badge.lockedHintSv;
}

export function getBadgeProgressHint(
  badge: Badge,
  input: BadgeInput,
  language: AppLanguage,
): string {
  switch (badge.id) {
    case 'first_practice':
      return language === 'en'
        ? `${Math.min(input.completedQuestionCount, 1)}/1 question answered`
        : `${Math.min(input.completedQuestionCount, 1)}/1 fråga besvarad`;
    case 'streak_3':
      return language === 'en'
        ? `${Math.min(input.currentStreak, 3)}/3 streak days`
        : `${Math.min(input.currentStreak, 3)}/3 svitdagar`;
    case 'level_2':
      return language === 'en'
        ? `Current level ${Math.min(input.level, 2)}/2`
        : `Aktuell nivå ${Math.min(input.level, 2)}/2`;
    case 'mistake_reviewer':
      return language === 'en'
        ? `${Math.min(input.wrongAnswerCount, 1)}/1 mistake review item`
        : `${Math.min(input.wrongAnswerCount, 1)}/1 fråga i repetition`;
  }
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
