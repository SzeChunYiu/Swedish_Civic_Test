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
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityValue=\{\{ min: 0, max: 100, now: Math\.round/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('metric card groups value, label, and helper into one accessible summary', () => {
  const source = read('components/ui/MetricCard.tsx');

  assert.match(source, /accessibilityLabel\?: string/);
  assert.match(source, /const metricAccessibilityLabel =/);
  assert.match(source, /accessibilityLabel \?\? `\$\{label\}: \$\{value\}/);
  assert.match(source, /accessible/);
  assert.match(source, /accessibilityLabel=\{metricAccessibilityLabel\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('badge preserves a readable accessibility label when visual text is uppercased', () => {
  const source = read('components/ui/Badge.tsx');

  assert.match(source, /accessibilityLabel\?: string/);
  assert.match(source, /const badgeAccessibilityLabel =/);
  assert.match(source, /typeof children === 'string' \|\| typeof children === 'number'/);
  assert.match(source, /String\(children\)/);
  assert.match(source, /accessibilityLabel=\{badgeAccessibilityLabel\}/);
  assert.match(source, /textTransform: 'uppercase'/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('button derives an accessibility label from plain text children by default', () => {
  const source = read('components/ui/Button.tsx');

  assert.match(source, /accessibilityLabel,/);
  assert.match(source, /const buttonAccessibilityLabel =/);
  assert.match(source, /typeof children === 'string' \|\| typeof children === 'number'/);
  assert.match(source, /String\(children\)/);
  assert.match(source, /accessibilityLabel=\{buttonAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(source, /accessibilityState=\{mergedAccessibilityState\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('screen scaffold exposes page and section titles as headers', () => {
  const source = read('components/ui/ScreenShell.tsx');

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('card scaffold groups labelled surfaces for accessibility', () => {
  const source = read('components/ui/Card.tsx');

  assert.match(source, /accessible,/);
  assert.match(source, /accessibilityLabel,/);
  assert.match(source, /accessibilityRole,/);
  assert.match(source, /const groupedForAccessibility =/);
  assert.match(source, /accessible \?\? Boolean\(accessibilityLabel \|\| accessibilityRole\)/);
  assert.match(source, /accessible=\{groupedForAccessibility\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
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

test('answer option feedback remains available in the accessibility label', () => {
  const source = read('components/quiz/AnswerOption.tsx');

  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /\$\{label\}, \$\{resultLabel\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Select answer \$\{label\}`\}/);
});

test('question card groups prompt and translation into an accessible summary', () => {
  const source = read('components/quiz/QuestionCard.tsx');

  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(source, /`Difficulty: \$\{difficulty\}`/);
  assert.match(source, /`Question: \$\{questionText\}`/);
  assert.match(source, /English translation:/);
  assert.match(source, /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('chapter card groups title, translation, status, and description into an accessible summary', () => {
  const source = read('components/learning/ChapterCard.tsx');

  assert.match(source, /const title = chapter\?\.nameSv \?\? 'Chapter unavailable'/);
  assert.match(source, /const chapterAccessibilityLabel =/);
  assert.match(source, /`Chapter: \$\{title\}`/);
  assert.match(source, /`English name: \$\{chapter\.nameEn\}`/);
  assert.match(source, /`Status: \$\{status\}`/);
  assert.match(source, /`Description: \$\{chapter\.descriptionSv\}`/);
  assert.match(source, /<Card accessibilityLabel=\{chapterAccessibilityLabel\} elevated/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('quiz feedback cards expose accessible summaries', () => {
  const explanationSource = read('components/quiz/ExplanationPanel.tsx');
  const referenceSource = read('components/quiz/UHRReferenceCard.tsx');

  assert.match(explanationSource, /const panelAccessibilityLabel =/);
  assert.match(explanationSource, /`Explanation: \$\{explanationSv\}`/);
  assert.match(explanationSource, /<Card accessibilityLabel=\{panelAccessibilityLabel\}>/);
  assert.doesNotMatch(explanationSource, /#[0-9a-fA-F]{6}|rgba?\(/);

  assert.match(referenceSource, /const referenceAccessibilityLabel =/);
  assert.match(referenceSource, /`UHR reference: \$\{label\}\. \$\{pageLabel\}`/);
  assert.match(referenceSource, /<Card accessibilityLabel=\{referenceAccessibilityLabel\}>/);
  assert.doesNotMatch(referenceSource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('question disclaimer exposes the non-official warning as an accessible summary', () => {
  const source = read('components/quiz/QuestionDisclaimer.tsx');

  assert.match(source, /const disclaimerAccessibilityLabel =/);
  assert.match(source, /`Study disclaimer: \$\{disclaimerText\}`/);
  assert.match(source, /<Card accessibilityLabel=\{disclaimerAccessibilityLabel\}>/);
  assert.match(source, /Independent study tool/);
  assert.match(source, /Not official/);
  assert.match(source, /not real exam questions/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('celebration burst keeps decorative particles out of the accessibility tree', () => {
  const source = read('components/quiz/CelebrationBurst.tsx');

  assert.match(source, /accessibilityElementsHidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /Animated\.timing/);
  assert.match(source, /motion\.duration\.slow \* 2/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
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
  assert.match(webSource, /const placementLabel = placement\.replaceAll\('_', ' '\);/);
  assert.match(webSource, /<Card accessibilityLabel=\{`Google AdMob: \$\{placementLabel\}/);
  assert.match(nativeSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /accessible/);
  assert.match(nativeSource, /accessibilityLabel=\{`Google AdMob banner: \$\{placementLabel\}`\}/);
  assert.match(nativeSource, /<BannerAd/);
});

test('native ad preview card exposes a grouped accessibility summary', () => {
  const source = read('components/monetization/NativeAdCard.tsx');

  assert.match(
    source,
    /<Card accessibilityLabel="Test native ad: Sponsored study placement\. AdMob test placement preview\. Keep out of timed exams\.">/,
  );
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('premium banner announces Remove Ads purchase status changes', () => {
  const source = read('components/monetization/PremiumBanner.tsx');

  assert.match(source, /const statusMessage = getStatusMessage/);
  assert.match(source, /accessibilityLabel=\{`Remove Ads status: \$\{statusMessage\}`\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /Ads are disabled on this device\./);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('user-facing scaffold fallbacks do not expose placeholder copy', () => {
  const fallbackFiles = [
    'components/learning/ChapterCard.tsx',
    'components/learning/AudioButton.tsx',
    'components/learning/Flashcard.tsx',
    'components/monetization/NativeAdCard.tsx',
    'components/quiz/ExplanationPanel.tsx',
    'components/quiz/QuestionCard.tsx',
    'components/quiz/UHRReferenceCard.tsx',
  ];

  for (const file of fallbackFiles) {
    assert.doesNotMatch(read(file), /placeholder/i, `${file} should not render placeholder copy`);
  }

  assert.match(read('components/learning/ChapterCard.tsx'), /Chapter unavailable/);
  assert.match(read('components/learning/AudioButton.tsx'), /Audio unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /Study prompt unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /Answer unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /accessibilityLabel/);
  assert.doesNotMatch(read('components/learning/Flashcard.tsx'), /front\s*=\s*['"]Front/);
  assert.doesNotMatch(read('components/learning/Flashcard.tsx'), /back\s*=\s*['"]Back/);
  assert.match(read('components/monetization/NativeAdCard.tsx'), /AdMob test placement preview/);
  assert.match(read('components/quiz/ExplanationPanel.tsx'), /Explanation unavailable/);
  assert.match(read('components/quiz/QuestionCard.tsx'), /Question unavailable/);
  assert.match(read('components/quiz/UHRReferenceCard.tsx'), /Source reference unavailable/);
});

test('audio button disables playback when speech text is unavailable', () => {
  const source = read('components/learning/AudioButton.tsx');

  assert.match(source, /const speechText = text\.trim\(\);/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /Audio unavailable/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityState=\{\{ disabled: !canPlayAudio \}\}/);
  assert.match(source, /disabled=\{!canPlayAudio\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(source, /speakSwedish\(speechText\)/);
  assert.doesNotMatch(source, /speakSwedish\(text\)/);
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
  assert.match(
    nativeSource,
    /try \{[\s\S]*AppOpenAd\.createForAdRequest[\s\S]*Promise\.resolve\(appOpenAd\.show\(\)\)\.catch\(\(\) => undefined\)[\s\S]*appOpenAd\.load\(\);[\s\S]*launchPopupShownThisRuntime = true;[\s\S]*\} catch \{[\s\S]*unsubscribe\?\.\(\);[\s\S]*return undefined;/,
  );
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
