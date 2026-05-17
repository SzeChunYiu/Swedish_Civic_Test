const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const architectureExpectedExports = {
  'components/compliance/ComplianceLinks.tsx': ['ComplianceLinks'],
  'components/compliance/LegalPage.tsx': ['LegalPage', 'LegalSection'],
  'components/ui/Badge.tsx': ['Badge'],
  'components/ui/Button.tsx': ['Button'],
  'components/ui/Card.tsx': ['Card'],
  'components/ui/MetricCard.tsx': ['MetricCard'],
  'components/ui/ProgressBar.tsx': ['ProgressBar'],
  'components/ui/ScreenShell.tsx': ['ScreenShell', 'SectionHeader'],
  'components/quiz/QuestionCard.tsx': ['QuestionCard'],
  'components/quiz/AnswerOption.tsx': ['AnswerOption'],
  'components/quiz/CelebrationBurst.tsx': ['CelebrationBurst'],
  'components/quiz/ExplanationPanel.tsx': ['ExplanationPanel'],
  'components/quiz/QuestionDisclaimer.tsx': ['QuestionDisclaimer'],
  'components/quiz/UHRReferenceCard.tsx': ['UHRReferenceCard'],
  'components/learning/ChapterCard.tsx': ['ChapterCard'],
  'components/learning/Flashcard.tsx': ['Flashcard'],
  'components/learning/AudioButton.tsx': ['AudioButton'],
  'components/monetization/AdBanner.native.tsx': ['AdBanner'],
  'components/monetization/AdBanner.tsx': ['AdBanner'],
  'components/monetization/LaunchPopupAd.native.tsx': ['LaunchPopupAd'],
  'components/monetization/LaunchPopupAd.tsx': ['LaunchPopupAd'],
  'components/monetization/NativeAdCard.tsx': ['NativeAdCard'],
  'components/monetization/PremiumBanner.tsx': ['PremiumBanner'],
  'data/chapters.ts': ['chapters'],
  'data/questions.ts': ['questions'],
  'data/glossary.ts': ['glossaryTerms'],
  'data/mockExamConfig.ts': ['defaultMockExamConfig'],
  'lib/quiz/examGenerator.ts': ['generateExam', 'scoreExam'],
  'lib/quiz/scoring.ts': ['scoreAnswers'],
  'lib/quiz/answerValidation.ts': ['isCorrectAnswer', 'getAnswerOptionFeedback'],
  'lib/learning/spacedRepetition.ts': ['spacedRepetitionSchedule', 'getNextReviewAt'],
  'lib/learning/mastery.ts': ['calculateMastery'],
  'lib/learning/streaks.ts': ['getLocalDateKey', 'calculateStreak'],
  'lib/storage/progressStore.ts': ['useProgressStore'],
  'lib/storage/settingsStore.ts': ['useSettingsStore'],
  'lib/audio/speak.ts': ['buildQuestionSpeechText', 'speakSwedish'],
  'lib/monetization/ads.ts': ['adsConfig', 'getAdUnit', 'shouldShowAd'],
  'lib/monetization/premium.ts': ['premiumConfig', 'hasAdsDisabled'],
  'lib/localization/strings.ts': ['strings'],
  'lib/localization/language.ts': ['supportedLanguages'],
  'types/content.ts': ['Chapter', 'PracticeQuestion', 'UHRReference'],
  'types/progress.ts': ['QuizSession', 'UserProgress'],
  'types/monetization.ts': ['AdPlacement', 'MonetizationState'],
};

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exportedNamePattern(exportName) {
  return new RegExp(
    `export\\s+(?:declare\\s+)?(?:async\\s+)?(?:function|const|let|var|type|interface|class)\\s+${exportName}\\b|export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
  );
}

test('architecture scaffold files expose expected public exports', () => {
  const missingExports = Object.entries(architectureExpectedExports).flatMap(
    ([relativePath, exportNames]) => {
      const source = readText(relativePath);

      return exportNames
        .filter((exportName) => !exportedNamePattern(exportName).test(source))
        .map((exportName) => `${relativePath}:${exportName}`);
    },
  );

  assert.deepEqual(missingExports, []);
});
