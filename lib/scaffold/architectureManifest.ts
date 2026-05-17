export type ArchitectureScaffoldArea = 'app' | 'components' | 'data' | 'lib' | 'types';

export type ArchitectureScaffoldFile = {
  readonly file: string;
  readonly area: ArchitectureScaffoldArea;
  readonly purpose: string;
};

export const architectureScaffoldDirectories = [
  'app',
  'components',
  'data',
  'lib',
  'types',
] as const satisfies readonly ArchitectureScaffoldArea[];

export const architectureTabRouteFiles = [
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
] as const;

export const architectureScaffoldFiles = [
  {
    file: 'app/_layout.tsx',
    area: 'app',
    purpose: 'Root Expo Router stack, app shell, and global placements',
  },
  {
    file: 'app/index.tsx',
    area: 'app',
    purpose: 'Initial route redirect into the primary tab shell',
  },
  {
    file: 'app/onboarding.tsx',
    area: 'app',
    purpose: 'First-run learning setup route',
  },
  {
    file: 'app/(tabs)/_layout.tsx',
    area: 'app',
    purpose: 'Primary tab navigator scaffold',
  },
  {
    file: 'app/(tabs)/home.tsx',
    area: 'app',
    purpose: 'Home tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/learn.tsx',
    area: 'app',
    purpose: 'Learn tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/practice.tsx',
    area: 'app',
    purpose: 'Practice tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/exam.tsx',
    area: 'app',
    purpose: 'Exam tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/mistakes.tsx',
    area: 'app',
    purpose: 'Mistakes tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/profile.tsx',
    area: 'app',
    purpose: 'Profile tab route required by the architecture',
  },
  {
    file: 'app/chapter/[chapterId].tsx',
    area: 'app',
    purpose: 'Chapter detail route for learning and quiz entry',
  },
  {
    file: 'app/quiz/[sessionId].tsx',
    area: 'app',
    purpose: 'Routed quiz session surface',
  },
  {
    file: 'app/settings.tsx',
    area: 'app',
    purpose: 'Settings route for local preferences',
  },
  {
    file: 'components/ui/Button.tsx',
    area: 'components',
    purpose: 'Shared button primitive',
  },
  {
    file: 'components/ui/Card.tsx',
    area: 'components',
    purpose: 'Shared card primitive',
  },
  {
    file: 'components/ui/ProgressBar.tsx',
    area: 'components',
    purpose: 'Shared progress indicator primitive',
  },
  {
    file: 'components/quiz/QuestionCard.tsx',
    area: 'components',
    purpose: 'Quiz prompt display component',
  },
  {
    file: 'components/quiz/AnswerOption.tsx',
    area: 'components',
    purpose: 'Quiz answer option component',
  },
  {
    file: 'components/quiz/ExplanationPanel.tsx',
    area: 'components',
    purpose: 'Quiz answer explanation component',
  },
  {
    file: 'components/quiz/UHRReferenceCard.tsx',
    area: 'components',
    purpose: 'Source reference display component',
  },
  {
    file: 'components/learning/ChapterCard.tsx',
    area: 'components',
    purpose: 'Chapter list item component',
  },
  {
    file: 'components/learning/Flashcard.tsx',
    area: 'components',
    purpose: 'Learning flashcard component',
  },
  {
    file: 'components/learning/AudioButton.tsx',
    area: 'components',
    purpose: 'Swedish text-to-speech trigger component',
  },
  {
    file: 'components/monetization/AdBanner.tsx',
    area: 'components',
    purpose: 'Ad banner placement component',
  },
  {
    file: 'components/monetization/PremiumBanner.tsx',
    area: 'components',
    purpose: 'Remove Ads and premium upsell component',
  },
  {
    file: 'data/chapters.ts',
    area: 'data',
    purpose: 'Bundled chapter metadata',
  },
  {
    file: 'data/questions.ts',
    area: 'data',
    purpose: 'Bundled published question bank',
  },
  {
    file: 'data/glossary.ts',
    area: 'data',
    purpose: 'Bundled glossary entries',
  },
  {
    file: 'data/mockExamConfig.ts',
    area: 'data',
    purpose: 'Mock exam generation defaults',
  },
  {
    file: 'lib/quiz/examGenerator.ts',
    area: 'lib',
    purpose: 'Mock exam generation and scoring helpers',
  },
  {
    file: 'lib/quiz/scoring.ts',
    area: 'lib',
    purpose: 'Quiz answer scoring helpers',
  },
  {
    file: 'lib/quiz/answerValidation.ts',
    area: 'lib',
    purpose: 'Quiz answer correctness and feedback helpers',
  },
  {
    file: 'lib/learning/spacedRepetition.ts',
    area: 'lib',
    purpose: 'Local review scheduling helpers',
  },
  {
    file: 'lib/learning/mastery.ts',
    area: 'lib',
    purpose: 'Chapter mastery calculation helpers',
  },
  {
    file: 'lib/learning/streaks.ts',
    area: 'lib',
    purpose: 'Local study streak helpers',
  },
  {
    file: 'lib/storage/progressStore.ts',
    area: 'lib',
    purpose: 'Local progress persistence store',
  },
  {
    file: 'lib/storage/settingsStore.ts',
    area: 'lib',
    purpose: 'Local settings persistence store',
  },
  {
    file: 'lib/audio/speak.ts',
    area: 'lib',
    purpose: 'Swedish speech runtime helpers',
  },
  {
    file: 'lib/monetization/ads.ts',
    area: 'lib',
    purpose: 'Ad placement and ad-unit decisions',
  },
  {
    file: 'lib/monetization/premium.ts',
    area: 'lib',
    purpose: 'Premium and Remove Ads entitlement decisions',
  },
  {
    file: 'lib/localization/strings.ts',
    area: 'lib',
    purpose: 'Localized app copy registry',
  },
  {
    file: 'lib/localization/language.ts',
    area: 'lib',
    purpose: 'Supported language metadata',
  },
  {
    file: 'types/content.ts',
    area: 'types',
    purpose: 'Content data contracts',
  },
  {
    file: 'types/progress.ts',
    area: 'types',
    purpose: 'Progress data contracts',
  },
  {
    file: 'types/monetization.ts',
    area: 'types',
    purpose: 'Monetization data contracts',
  },
] as const satisfies readonly ArchitectureScaffoldFile[];

export type ArchitectureScaffoldDirectory = (typeof architectureScaffoldDirectories)[number];
export type ArchitectureScaffoldFilePath = (typeof architectureScaffoldFiles)[number]['file'];
