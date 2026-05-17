const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('progress bar uses tokenized animated motion and exposes progress to assistive tech', () => {
  const source = read('components/ui/ProgressBar.tsx');

  assert.match(source, /Animated\.timing/);
  assert.match(source, /motion\.duration\.slow/);
  assert.match(source, /accessibilityLabel/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice screen adds bookmark controls backed by progress storage', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /toggleBookmark/);
  assert.match(source, /bookmarked/);
  assert.match(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
});

test('practice answer flow requires explicit next question after feedback', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /getPracticeQuestionForSession/);
  assert.match(source, /activeQuestionId/);
  assert.match(source, /selectOption\(question\.id,\s*optionId\)/);
  assert.match(source, /advanceQuestion/);
  assert.match(source, /Next question/);
});

test('practice locks answer options after feedback is visible', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const answerOptionSource = read('components/quiz/AnswerOption.tsx');

  assert.match(answerOptionSource, /disabled\?: boolean/);
  assert.match(answerOptionSource, /disabled=\{disabled\}/);
  assert.match(practiceSource, /disabled=\{hasSelectedAnswer\}/);
});

test('mistakes screen has a bookmarked-question review section', () => {
  const source = read('app/(tabs)/mistakes.tsx');

  assert.match(source, /bookmarkedQuestions/);
  assert.match(source, /Bookmarked questions/);
  assert.match(source, /Saved for focused review/);
});

test('mistakes screen teaches with explanations before source references', () => {
  const source = read('app/(tabs)/mistakes.tsx');

  assert.match(source, /ExplanationPanel/);
  assert.match(source, /question\.explanationSv/);
  assert.match(source, /question, explanation, source reference/);
  assert.match(source, /<ExplanationPanel[\s\S]*<UHRReferenceCard/);
});

test('native ads use Google Mobile Ads while web keeps a safe preview component', () => {
  const webSource = read('components/monetization/AdBanner.tsx');
  const nativeSource = read('components/monetization/AdBanner.native.tsx');

  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(webSource, /web preview/);
  assert.match(nativeSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /<BannerAd/);
});

test('user-facing scaffold fallbacks do not expose placeholder copy', () => {
  const fallbackFiles = [
    'components/learning/ChapterCard.tsx',
    'components/monetization/NativeAdCard.tsx',
    'components/quiz/ExplanationPanel.tsx',
    'components/quiz/QuestionCard.tsx',
    'components/quiz/UHRReferenceCard.tsx',
  ];

  for (const file of fallbackFiles) {
    assert.doesNotMatch(read(file), /placeholder/i, `${file} should not render placeholder copy`);
  }

  assert.match(read('components/learning/ChapterCard.tsx'), /Chapter unavailable/);
  assert.match(read('components/monetization/NativeAdCard.tsx'), /AdMob test placement preview/);
  assert.match(read('components/quiz/ExplanationPanel.tsx'), /Explanation unavailable/);
  assert.match(read('components/quiz/QuestionCard.tsx'), /Question unavailable/);
  assert.match(read('components/quiz/UHRReferenceCard.tsx'), /Source reference unavailable/);
});

test('home screen surfaces the 10000-learner feedback loop and review action', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /10,000-learner feedback pass/);
  assert.match(source, /Review saved questions/);
  assert.match(source, /href="\/mistakes"/);
});

test('launch popup ad has native app-open implementation and safe web preview', () => {
  const layoutSource = read('app/_layout.tsx');
  const webSource = read('components/monetization/LaunchPopupAd.tsx');
  const nativeSource = read('components/monetization/LaunchPopupAd.native.tsx');

  assert.match(layoutSource, /useRemoveAdsEntitlements/);
  assert.match(layoutSource, /entitlementsReady/);
  assert.match(layoutSource, /<LaunchPopupAd entitlements=\{monetizationEntitlements\} \/>/);
  assert.match(webSource, /launchPopupShownThisRuntime/);
  assert.match(webSource, /Modal/);
  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /AppOpenAd/);
  assert.match(nativeSource, /launchPopupShownThisRuntime/);
});

test('exam results include per-question explanations and UHR sources', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /buildExamReviewItems/);
  assert.match(source, /Question review/);
  assert.match(source, /Selected answer/);
  assert.match(source, /Correct answer/);
  assert.match(source, /<ExplanationPanel/);
  assert.match(source, /<UHRReferenceCard/);
});

test('exam auto-submits at timeout and explains unanswered scoring', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /shouldAutoSubmitExam/);
  assert.match(source, /setSubmitted\(true\)/);
  assert.match(source, /Time expired/);
  assert.match(source, /Unanswered questions count as incorrect/);
});

test('exam chapter breakdown uses chapter names instead of raw ids only', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /buildExamChapterBreakdownItems/);
  assert.match(source, /data\/chapters/);
  assert.match(source, /chapter\.chapterNameSv/);
  assert.match(source, /chapter\.chapterId/);
});
