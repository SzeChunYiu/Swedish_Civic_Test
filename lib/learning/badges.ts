export type Badge = {
  id: string;
  title: string;
  description: string;
};

type BadgeInput = {
  completedQuestionCount: number;
  currentStreak: number;
  level: number;
  wrongAnswerCount: number;
};

export const badgeCatalog: Record<string, Badge> = {
  first_practice: {
    id: 'first_practice',
    title: 'First practice',
    description: 'Answered your first practice question.',
  },
  streak_3: {
    id: 'streak_3',
    title: 'Three-day streak',
    description: 'Practiced on three days in a row.',
  },
  level_2: {
    id: 'level_2',
    title: 'Level 2',
    description: 'Earned enough XP to reach level 2.',
  },
  mistake_reviewer: {
    id: 'mistake_reviewer',
    title: 'Mistake reviewer',
    description: 'Created at least one mistake review item.',
  },
};

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
