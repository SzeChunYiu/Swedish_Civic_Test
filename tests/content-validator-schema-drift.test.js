const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runValidateContent() {
  const result = spawnSync(process.execPath, ['scripts/validate-content.js', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return {
    status: result.status,
    output: `${result.stdout}\n${result.stderr}`,
  };
}

test('content validator schema expectations track current persisted release contracts', () => {
  const { status, output } = runValidateContent();

  assert.equal(status, 0, output);
  const summaryMatch = output.match(/\{[\s\S]*\}/);
  assert.ok(summaryMatch, 'validate:content --json should print a summary object');
  const summary = JSON.parse(summaryMatch[0]);
  assert.equal(summary.practiceRouteCopyParityValidated, true);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.equal(summary.practiceSessionStoreFieldsValidated, 10);
  assert.equal(summary.practiceSessionStoreSchemaParityValidated, true);
  assert.equal(summary.practiceSessionStoreRuntimeParityValidated, true);

  const staleSchemaDriftMessages = [
    /types\/content\.ts Chapter\.nameText type is LocalizedContentTextOverrides, expected LocalizedContentText/,
    /NativePurchaseProviderOptions fields are \["loadIap","platform","purchaseTimeoutMs","receiptValidator"\], expected \["loadIap","platform","purchaseTimeoutMs"\]/,
    /RewardedExtraExamAdOptions fields are \["confirmReward","entitlements","requestNonPersonalizedAdsOnly","timeoutMs","webConsentDecision"\], expected \["entitlements","requestNonPersonalizedAdsOnly","timeoutMs"\]/,
    /SettingsState fields are \["language","audioEnabled","dailyGoalAnswers","includeSupplementaryQuestions","hasSeenAboutTheTest","persistenceWarning"/,
    /setLanguage must persist through languageKey/,
    /QuestionProgress fields are \["questionId","seenCount","correctCount","wrongCount","correctStreak","lastAnsweredAt","nextReviewAt","confidenceRating","bookmarked"\], expected/,
    /types\/progress\.ts Confidence union could not be read/,
    /types\/progress\.ts UserQuestionProgress missing confidence/,
    /ProgressState\.recordAnswer type is \(questionId: string, isCorrect: boolean, confidenceRating\?: ConfidenceRating, options\?: \{ awardXp\?: boolean \}\) => void, expected \(questionId: string, isCorrect: boolean\) => void/,
    /progress storage must use the stable progress MMKV id/,
    /readProgress must read persisted JSON through progressStateKey/,
    /readProgress must normalize parsed persisted JSON/,
    /writeProgress must persist JSON through progressStateKey/,
    /PracticeSessionState fields are \["answerXpAwardedKey","activeQuestionId","selectedOptionId","shuffleSessionId","markAnswerXpAwarded"/,
  ];

  for (const message of staleSchemaDriftMessages) {
    assert.doesNotMatch(output, message);
  }
});
