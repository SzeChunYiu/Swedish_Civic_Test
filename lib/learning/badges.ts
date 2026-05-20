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
    description: 'Answer your first practice question.',
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
    description: 'Practice three days in a row.',
    titleSv: 'Tre dagars svit',
    titleEn: 'Three-day streak',
    descriptionSv: 'Öva tre dagar i rad.',
    descriptionEn: 'Practice three days in a row.',
    lockedHintSv: 'Öva tre dagar i rad för att låsa upp märket.',
    lockedHintEn: 'Practice three days in a row to unlock this badge.',
  },
  level_2: {
    id: 'level_2',
    title: 'Level 2',
    description: 'Earn enough XP to reach level 2.',
    titleSv: 'Nivå 2',
    titleEn: 'Level 2',
    descriptionSv: 'Samla tillräckligt med XP för att nå nivå 2.',
    descriptionEn: 'Earn enough XP to reach level 2.',
    lockedHintSv: 'Fortsätt öva tills du når nivå 2.',
    lockedHintEn: 'Keep practicing until you reach level 2.',
  },
  mistake_reviewer: {
    id: 'mistake_reviewer',
    title: 'Mistake reviewer',
    description: 'Create at least one mistake review item.',
    titleSv: 'Misstagsrepetition',
    titleEn: 'Mistake reviewer',
    descriptionSv: 'Skapa minst en fråga att repetera från dina misstag.',
    descriptionEn: 'Create at least one mistake review item.',
    lockedHintSv: 'Svara fel på en fråga för att starta misstagsrepetition.',
    lockedHintEn: 'Answer one question incorrectly to start mistake review.',
  },
};

export function getAllBadges(): Badge[] {
  return badgeOrder.map((id) => badgeCatalog[id]);
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
  const copy =
    language === 'en'
      ? {
          answered: (count: number) => `${Math.min(count, 1)}/1 questions answered`,
          mistakes: (count: number) => `${Math.min(count, 1)}/1 mistake review items`,
          level: (level: number) => `Level ${Math.min(level, 2)}/2`,
          ready: 'Unlocked',
          streak: (count: number) => `${Math.min(count, 3)}/3 streak days`,
        }
      : {
          answered: (count: number) => `${Math.min(count, 1)}/1 frågor besvarade`,
          mistakes: (count: number) => `${Math.min(count, 1)}/1 misstagsfrågor`,
          level: (level: number) => `Nivå ${Math.min(level, 2)}/2`,
          ready: 'Upplåst',
          streak: (count: number) => `${Math.min(count, 3)}/3 svitdagar`,
        };

  switch (badge.id) {
    case 'first_practice':
      return input.completedQuestionCount >= 1
        ? copy.ready
        : copy.answered(input.completedQuestionCount);
    case 'streak_3':
      return input.currentStreak >= 3 ? copy.ready : copy.streak(input.currentStreak);
    case 'level_2':
      return input.level >= 2 ? copy.ready : copy.level(input.level);
    case 'mistake_reviewer':
      return input.wrongAnswerCount >= 1 ? copy.ready : copy.mistakes(input.wrongAnswerCount);
  }

  return copy.ready;
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
