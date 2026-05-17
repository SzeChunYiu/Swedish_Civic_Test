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
  assert.match(source, /const progressPercent = Math\.round\(clampedProgress \* 100\);/);
  assert.match(
    source,
    /const progressAccessibilityLabel = `\$\{progressPercent\} percent complete`;/,
  );
  assert.match(source, /aria-label=\{progressAccessibilityLabel\}/);
  assert.match(source, /aria-valuemax=\{100\}/);
  assert.match(source, /aria-valuemin=\{0\}/);
  assert.match(source, /aria-valuenow=\{progressPercent\}/);
  assert.match(source, /accessibilityLabel=\{progressAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityValue=\{\{ min: 0, max: 100, now: progressPercent \}\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('metric card groups value, label, and helper into one accessible summary', () => {
  const source = read('components/ui/MetricCard.tsx');

  assert.match(source, /accessibilityLabel\?: string/);
  assert.match(source, /const metricAccessibilityLabel =/);
  assert.match(source, /accessibilityLabel \?\? `\$\{label\}: \$\{value\}/);
  assert.match(source, /accessible/);
  assert.match(source, /aria-label=\{metricAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{metricAccessibilityLabel\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('badge preserves a readable accessibility label when visual text is uppercased', () => {
  const source = read('components/ui/Badge.tsx');

  assert.match(source, /accessibilityLabel\?: string/);
  assert.match(source, /const badgeAccessibilityLabel =/);
  assert.match(source, /typeof children === 'string' \|\| typeof children === 'number'/);
  assert.match(source, /String\(children\)/);
  assert.match(source, /aria-label=\{badgeAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{badgeAccessibilityLabel\}/);
  assert.match(source, /textTransform: 'uppercase'/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('button derives an accessibility label from plain text children by default', () => {
  const source = read('components/ui/Button.tsx');

  assert.match(source, /accessibilityLabel,/);
  assert.match(source, /accessibilityHint,/);
  assert.match(source, /const buttonAccessibilityLabel =/);
  assert.match(source, /const buttonAccessibilityHintId =/);
  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /typeof children === 'string' \|\| typeof children === 'number'/);
  assert.match(source, /String\(children\)/);
  assert.match(source, /aria-busy=\{mergedAccessibilityState\.busy === true\}/);
  assert.match(source, /aria-checked=\{mergedAccessibilityState\.checked\}/);
  assert.match(source, /aria-describedby=\{buttonAccessibilityHintId\}/);
  assert.match(source, /aria-disabled=\{mergedAccessibilityState\.disabled === true\}/);
  assert.match(source, /aria-expanded=\{mergedAccessibilityState\.expanded\}/);
  assert.match(source, /aria-label=\{buttonAccessibilityLabel\}/);
  assert.match(source, /aria-selected=\{mergedAccessibilityState\.selected\}/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{buttonAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(source, /accessibilityState=\{mergedAccessibilityState\}/);
  assert.match(source, /nativeID=\{buttonAccessibilityHintId\}/);
  assert.match(source, /accessibilityHintText/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('screen scaffold exposes page and section titles as headers', () => {
  const source = read('components/ui/ScreenShell.tsx');

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('compliance scaffold exposes legal page headings as headers', () => {
  const legalPageSource = read('components/compliance/LegalPage.tsx');
  const complianceLinksSource = read('components/compliance/ComplianceLinks.tsx');

  assert.match(legalPageSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(legalPageSource, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.match(complianceLinksSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.doesNotMatch(legalPageSource, /#[0-9a-fA-F]{6}|rgba?\(/);
  assert.doesNotMatch(complianceLinksSource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings route exposes page and section titles as headers', () => {
  const source = read('app/settings.tsx');
  const sectionHeaderMatches = source.match(
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/g,
  );

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /Question language/);
  assert.match(source, /Audio/);
  assert.match(source, /Daily goal/);
  assert.equal(sectionHeaderMatches?.length, 3);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings controls mirror selected and checked state to web aria attributes', () => {
  const source = read('app/settings.tsx');

  assert.match(source, /aria-selected=\{language === value\}/);
  assert.match(source, /accessibilityState=\{\{ selected: language === value \}\}/);
  assert.match(source, /aria-checked=\{audioEnabled\}/);
  assert.match(source, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(source, /aria-selected=\{dailyGoalAnswers === goal\}/);
  assert.match(source, /accessibilityState=\{\{ selected: dailyGoalAnswers === goal \}\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings route remains scrollable on narrow mobile viewports', () => {
  const source = read('app/settings.tsx');

  assert.match(source, /import \{ Pressable, ScrollView, StyleSheet, Text, View \}/);
  assert.match(
    source,
    /<ScrollView style=\{styles\.container\} contentContainerStyle=\{styles\.content\}>/,
  );
  assert.match(source, /<\/ScrollView>/);
  assert.match(source, /content: \{\n\s+flexGrow: 1,/);
  assert.match(source, /paddingBottom: space\[10\]/);
  assert.doesNotMatch(source, /<View style=\{styles\.container\}>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('onboarding route exposes its primary title as a header', () => {
  const source = read('app/onboarding.tsx');

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(source, /Start studying/);
  assert.match(source, /Adjust settings/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('onboarding route remains scrollable on narrow mobile viewports', () => {
  const source = read('app/onboarding.tsx');

  assert.match(source, /import \{ ScrollView, StyleSheet, Text, View \}/);
  assert.match(
    source,
    /<ScrollView style=\{styles\.container\} contentContainerStyle=\{styles\.content\}>/,
  );
  assert.match(source, /<\/ScrollView>/);
  assert.match(source, /content: \{\n\s+flexGrow: 1,/);
  assert.match(source, /paddingBottom: space\[10\]/);
  assert.doesNotMatch(source, /<View style=\{styles\.container\}>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('card scaffold groups labelled surfaces for accessibility', () => {
  const source = read('components/ui/Card.tsx');

  assert.match(source, /accessible,/);
  assert.match(source, /accessibilityHint,/);
  assert.match(source, /accessibilityLabel,/);
  assert.match(source, /accessibilityRole,/);
  assert.match(source, /const cardAccessibilityHintId =/);
  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /const groupedForAccessibility =/);
  assert.match(source, /accessible \?\? Boolean\(accessibilityLabel \|\| accessibilityRole\)/);
  assert.match(source, /aria-describedby=\{cardAccessibilityHintId\}/);
  assert.match(source, /aria-label=\{accessibilityLabel\}/);
  assert.match(source, /accessible=\{groupedForAccessibility\}/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(source, /nativeID=\{cardAccessibilityHintId\}/);
  assert.match(source, /accessibilityHintText/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice screen adds bookmark controls backed by progress storage', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /toggleBookmark/);
  assert.match(source, /bookmarked/);
  assert.match(source, /aria-selected=\{isBookmarked\}/);
  assert.match(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
});

test('practice and routed quiz screens expose primary titles as headers', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const routedQuizSource = read('app/quiz/[sessionId].tsx');
  const quizHeaderMatches = routedQuizSource.match(
    /<Text accessibilityRole="header" style=\{styles\.title\}>/g,
  );

  assert.match(practiceSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(practiceSource, /\{copy\.questionTitle\(questionNumber\)\}/);
  assert.equal(quizHeaderMatches?.length, 2);
  assert.match(practiceSource, /type PracticeCopy =/);
  assert.match(practiceSource, /const practiceCopy: Record<AppLanguage, PracticeCopy>/);
  assert.match(practiceSource, /Fråga \$\{questionNumber\}/);
  assert.match(practiceSource, /Question \$\{questionNumber\}/);
  assert.match(routedQuizSource, /type QuizSessionCopy =/);
  assert.match(routedQuizSource, /const quizSessionCopy: Record<AppLanguage, QuizSessionCopy>/);
  assert.match(routedQuizSource, /Det finns inga quizfrågor ännu\./);
  assert.match(routedQuizSource, /Quizpass \$\{currentSessionId\}/);
  assert.match(routedQuizSource, /\{copy\.emptyTitle\}/);
  assert.match(routedQuizSource, /\{copy\.sessionTitle\(normalizedSessionId\)\}/);
  assert.doesNotMatch(practiceSource, /#[0-9a-fA-F]{6}|rgba?\(/);
  assert.doesNotMatch(routedQuizSource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice shell copy follows Swedish and English settings language', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(source, /const copy = practiceCopy\[language\]/);
  assert.match(source, /5-minutersövning/);
  assert.match(source, /Besvarade frågor: \$\{count\}/);
  assert.match(source, /Bokmärk den här frågan/);
  assert.match(source, /Ta bort bokmärket från den här frågan/);
  assert.match(source, /Poäng/);
  assert.match(source, /Nästa fråga/);
  assert.match(source, /Försök igen med den här övningsfrågan/);
  assert.match(source, /5-minute practice/);
  assert.match(source, /Completed questions: \$\{count\}/);
  assert.match(source, /\{copy\.scoreLabel\}: \{currentScore\.correct\}\/\{currentScore\.total\}/);
  assert.match(source, /accessibilityLabel=\{copy\.bookmarkAccessibilityLabel\(isBookmarked\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.nextQuestionAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.tryAgainAccessibilityLabel\}/);
});

test('routed quiz shell copy follows Swedish and English settings language', () => {
  const source = read('app/quiz/[sessionId].tsx');

  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(source, /const copy = quizSessionCopy\[language\]/);
  assert.match(source, /Tillbaka till övning/);
  assert.match(source, /Besvara frågan och gå sedan igenom den källbaserade återkopplingen\./);
  assert.match(source, /Poäng/);
  assert.match(source, /Försök igen med den här quizfrågan/);
  assert.match(source, /Back to Practice/);
  assert.match(source, /Answer the routed question, then review the source-backed feedback\./);
  assert.match(source, /\{copy\.scoreLabel\}: \{score\.correct\}\/\{score\.total\}/);
  assert.match(source, /accessibilityLabel=\{copy\.tryAgainAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.backToPracticeAccessibilityLabel\}/);
});

test('home daily goal uses local-day answer progress instead of lifetime completions', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /countAnswersForLocalDate/);
  assert.match(source, /countAnswersForLocalDate\(questionProgress\)/);
  assert.doesNotMatch(source, /completedQuestionIds\.length,\s*dailyGoalAnswers/);
});

test('practice answer flow requires explicit next question after feedback', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /getPracticeQuestionForSession/);
  assert.match(source, /activeQuestionId/);
  assert.match(source, /selectOption\(question\.id,\s*optionId\)/);
  assert.match(source, /advanceQuestion/);
  assert.match(source, /Next question/);
  assert.match(source, /\{copy\.nextQuestion\}/);
});

test('practice locks answer options after feedback is visible', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const answerOptionSource = read('components/quiz/AnswerOption.tsx');

  assert.match(answerOptionSource, /disabled\?: boolean/);
  assert.match(answerOptionSource, /disabled=\{disabled\}/);
  assert.match(practiceSource, /disabled=\{hasSelectedAnswer\}/);
});

test('practice and routed quiz answer options expose selected state', () => {
  const answerOptionSource = read('components/quiz/AnswerOption.tsx');
  const practiceSource = read('app/(tabs)/practice.tsx');
  const routedQuizSource = read('app/quiz/[sessionId].tsx');

  assert.match(answerOptionSource, /selected = false/);
  assert.match(answerOptionSource, /selected\?: boolean/);
  assert.match(answerOptionSource, /accessibilityState=\{\{ disabled, selected \}\}/);
  assert.match(practiceSource, /selected=\{hasSelectedAnswer && selectedOptionId === option\.id\}/);
  assert.match(routedQuizSource, /selected=\{selectedOptionId === option\.id\}/);
});

test('answer option feedback remains available in the accessibility label', () => {
  const source = read('components/quiz/AnswerOption.tsx');

  assert.match(source, /language = 'sv'/);
  assert.match(source, /function getOptionLabel/);
  assert.match(source, /language === 'en' \? option\.textEn : option\.textSv/);
  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /\$\{label\}, \$\{resultLabel\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Select answer \$\{label\}`\}/);
});

test('question card groups prompt and translation into an accessible summary', () => {
  const source = read('components/quiz/QuestionCard.tsx');

  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(source, /function getSourceCitation\(question\?: PracticeQuestion\)/);
  assert.match(source, /`Difficulty: \$\{difficulty\}`/);
  assert.match(source, /`Question: \$\{questionText\}`/);
  assert.match(source, /English translation:/);
  assert.match(source, /`Source citation: \$\{sourceCitation\}`/);
  assert.match(source, /Källa\/Source: Sverige i fokus/);
  assert.match(source, /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.question\}>/);
  assert.match(source, /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('chapter card groups title, translation, status, and description into an accessible summary', () => {
  const source = read('components/learning/ChapterCard.tsx');

  assert.match(source, /type ChapterCardCopy =/);
  assert.match(source, /const chapterCardCopy: Record<AppLanguage, ChapterCardCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const copy = chapterCardCopy\[language\]/);
  assert.match(source, /\$\{completedCount\}\/\$\{questionCount\} besvarade/);
  assert.match(source, /\$\{completedCount\}\/\$\{questionCount\} practiced/);
  assert.match(source, /innehåll planerat/);
  assert.match(source, /Content queued/);
  assert.match(source, /const title = chapter\?\.nameSv \?\? copy\.chapterUnavailable/);
  assert.match(source, /const chapterAccessibilityLabel =/);
  assert.match(source, /copy\.accessibilityLabel\.chapter\(title\)/);
  assert.match(source, /copy\.accessibilityLabel\.englishName\(chapter\.nameEn\)/);
  assert.match(source, /copy\.accessibilityLabel\.status\(status\)/);
  assert.match(source, /copy\.accessibilityLabel\.description\(chapter\.descriptionSv\)/);
  assert.match(source, /<Card accessibilityLabel=\{chapterAccessibilityLabel\} elevated/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('learn route chapter links announce chapter progress', () => {
  const source = read('app/(tabs)/learn.tsx');

  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(source, /type LearnRouteCopy =/);
  assert.match(source, /const learnRouteCopy: Record<AppLanguage, LearnRouteCopy>/);
  assert.match(source, /const routeCopy = learnRouteCopy\[language\]/);
  assert.match(source, /Studieväg/);
  assert.match(source, /Bläddra bland kapitel med tydliga nästa steg/);
  assert.match(source, /13 samhällsområden/);
  assert.match(source, /Learning path/);
  assert.match(source, /Browse chapters with a clear next step/);
  assert.match(source, /13 civic areas/);
  assert.match(source, /eyebrow=\{routeCopy\.eyebrow\}/);
  assert.match(source, /title=\{routeCopy\.title\}/);
  assert.match(source, /subtitle=\{routeCopy\.subtitle\}/);
  assert.match(source, /title=\{routeCopy\.sectionTitle\}/);
  assert.match(source, /subtitle=\{routeCopy\.sectionSubtitle\}/);
  assert.match(source, /const chapterLinkCopy: Record<AppLanguage, ChapterLinkCopy>/);
  assert.match(source, /const copy = chapterLinkCopy\[language\]/);
  assert.match(source, /function getChapterLinkAccessibilityLabel/);
  assert.match(source, /Öppna kapitel \$\{nameSv\}/);
  assert.match(source, /Engelskt namn: \$\{nameEn\}/);
  assert.match(source, /Framsteg: \$\{progressLabel\}/);
  assert.match(source, /\$\{completedCount\} av \$\{questionCount\} frågor besvarade/);
  assert.match(source, /Open chapter \$\{nameSv\}/);
  assert.match(source, /English name: \$\{nameEn\}/);
  assert.match(source, /Progress: \$\{progressLabel\}/);
  assert.match(source, /\$\{completedCount\} of \$\{questionCount\} questions practiced/);
  assert.match(source, /copy: ChapterLinkCopy/);
  assert.match(source, /copy\.progressLabel\(completedCount, questionCount\)/);
  assert.match(source, /copy\.accessibilityLabel\(\{ nameSv, nameEn, progressLabel \}\)/);
  assert.match(source, /accessibilityLabel=\{getChapterLinkAccessibilityLabel/);
  assert.match(source, /language=\{language\}/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Open chapter \$\{chapter\.nameSv\}`\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('quiz feedback cards expose accessible summaries', () => {
  const explanationSource = read('components/quiz/ExplanationPanel.tsx');
  const referenceSource = read('components/quiz/UHRReferenceCard.tsx');

  assert.match(explanationSource, /explanationEn/);
  assert.match(explanationSource, /language = 'sv'/);
  assert.match(
    explanationSource,
    /const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy>/,
  );
  assert.match(explanationSource, /Förklaring saknas för den här frågan\./);
  assert.match(
    explanationSource,
    /const explanation =[\s\S]*language === 'en' && explanationEn \? explanationEn : \(explanationSv \?\? copy\.fallback\);/,
  );
  assert.match(explanationSource, /const panelAccessibilityLabel =/);
  assert.match(explanationSource, /`\$\{copy\.accessibilityLabelPrefix\}: \$\{explanation\}`/);
  assert.match(explanationSource, /<Card accessibilityLabel=\{panelAccessibilityLabel\}>/);
  assert.match(explanationSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(explanationSource, /\{copy\.title\}/);
  assert.doesNotMatch(explanationSource, /#[0-9a-fA-F]{6}|rgba?\(/);

  assert.match(
    referenceSource,
    /const uhrReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy>/,
  );
  assert.match(referenceSource, /UHR-källa/);
  assert.match(referenceSource, /Ungefär sida/);
  assert.match(referenceSource, /const referenceAccessibilityLabel =/);
  assert.match(
    referenceSource,
    /`\$\{copy\.accessibilityLabelPrefix\}: \$\{label\}\. \$\{pageLabel\}`/,
  );
  assert.match(referenceSource, /<Card accessibilityLabel=\{referenceAccessibilityLabel\}>/);
  assert.match(referenceSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(referenceSource, /\{copy\.title\}/);
  assert.doesNotMatch(referenceSource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('question disclaimer exposes the non-official warning as an accessible summary', () => {
  const source = read('components/quiz/QuestionDisclaimer.tsx');

  assert.match(source, /useSettingsStore/);
  assert.match(source, /type AppLanguage/);
  assert.match(source, /const disclaimerCopy: Record<AppLanguage, QuestionDisclaimerCopy>/);
  assert.match(source, /Oberoende studieverktyg/);
  assert.match(source, /inte riktiga provfrågor/);
  assert.match(source, /Study disclaimer/);
  assert.match(source, /const disclaimerAccessibilityLabel =/);
  assert.match(source, /\$\{copy\.accessibilityLabelPrefix\}: \$\{copy\.text\}/);
  assert.match(source, /accessibilityHint=\{copy\.accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{disclaimerAccessibilityLabel\}/);
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

  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy>/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /bookmarkedQuestions/);
  assert.match(source, /Bokmärkta frågor/);
  assert.match(source, /Bookmarked questions/);
  assert.match(source, /Sparad för fokuserad repetition/);
  assert.match(source, /Saved for focused review/);
  assert.match(source, /\{copy\.bookmarkedTitle\}/);
  assert.match(source, /\{copy\.bookmarkedMeta\}/);
});

test('mistakes screen exposes page and review section headings as headers', () => {
  const source = read('app/(tabs)/mistakes.tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.emptyTitle\}>/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /\{copy\.mistakeTitle\}/);
  assert.match(source, /\{copy\.emptyTitle\}/);
  assert.equal(headerMatches?.length, 4);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('chapter detail route exposes page and question section headings as headers', () => {
  const source = read('app/chapter/[chapterId].tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /Kapitlet hittades inte/);
  assert.match(source, /Övningsfrågor \(\$\{count\}\)/);
  assert.match(source, /Chapter not found/);
  assert.match(source, /Practice questions \(\$\{count\}\)/);
  assert.equal(headerMatches?.length, 3);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.match(source, /\{copy\.missingTitle\}/);
  assert.match(source, /\{copy\.practiceQuestionsTitle\(chapterQuestions\.length\)\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('mistakes screen teaches with explanations before source references', () => {
  const source = read('app/(tabs)/mistakes.tsx');

  assert.match(source, /useSettingsStore/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /ExplanationPanel/);
  assert.match(source, /question\.explanationEn/);
  assert.match(source, /question\.explanationSv/);
  assert.match(source, /language=\{language\}/);
  assert.match(source, /question, explanation, source reference/);
  assert.match(source, /<ExplanationPanel[\s\S]*<UHRReferenceCard/);
});

test('native ads use Google Mobile Ads while web keeps a safe preview component', () => {
  const webSource = read('components/monetization/AdBanner.tsx');
  const nativeSource = read('components/monetization/AdBanner.native.tsx');

  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(webSource, /web preview/);
  assert.match(webSource, /const placementLabel = placement\.replaceAll\('_', ' '\);/);
  assert.match(webSource, /const REMOVE_ADS_ACCESSIBILITY_HINT =/);
  assert.match(
    webSource,
    /accessibilityHint=\{`Sponsored ad preview\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`\}/,
  );
  assert.match(webSource, /const accessibilityLabel = `Google AdMob: \$\{placementLabel\}/);
  assert.match(webSource, /\$\{adStatusLabel\}\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`/);
  assert.match(webSource, /<Card[\s\S]*accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(nativeSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /accessible/);
  assert.match(nativeSource, /const REMOVE_ADS_ACCESSIBILITY_HINT =/);
  assert.match(
    nativeSource,
    /accessibilityHint=\{`Sponsored ad banner\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`\}/,
  );
  assert.match(
    nativeSource,
    /accessibilityLabel=\{`Google AdMob banner: \$\{placementLabel\}\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`\}/,
  );
  assert.match(nativeSource, /<BannerAd/);
});

test('native ad preview card exposes a grouped accessibility summary', () => {
  const source = read('components/monetization/NativeAdCard.tsx');

  assert.match(source, /const REMOVE_ADS_ACCESSIBILITY_HINT =/);
  assert.match(
    source,
    /accessibilityHint=\{`Sponsored ad preview\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`\}[\s\S]*accessibilityLabel=\{`Test native ad: Sponsored study placement\. AdMob test placement preview\. Keep out of timed exams\. \$\{REMOVE_ADS_ACCESSIBILITY_HINT\}`\}/,
  );
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('premium banner announces Remove Ads purchase status changes', () => {
  const source = read('components/monetization/PremiumBanner.tsx');

  assert.match(source, /const statusMessage = getStatusMessage/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /accessibilityLabel=\{`Remove Ads status: \$\{statusMessage\}`\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
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

test('home screen exposes dashboard card titles as headers', () => {
  const source = read('app/(tabs)/home.tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /Today&apos;s goal/);
  assert.match(source, /UX updates from simulated study sessions/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.goalLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.feedbackTitle\}>/);
  assert.equal(headerMatches?.length, 2);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
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
  assert.match(webSource, /accessibilityLabel=\{LAUNCH_SPONSOR_DIALOG_LABEL\}/);
  assert.match(webSource, /accessibilityViewIsModal/);
  assert.doesNotMatch(webSource, /aria-modal=\{true\}/);
  assert.doesNotMatch(webSource, /role="dialog"/);
  assert.match(webSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
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

test('English support reaches quiz options, explanations, and exam review text', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const quizSource = read('app/quiz/[sessionId].tsx');
  const examSource = read('app/(tabs)/exam.tsx');
  const examGeneratorSource = read('lib/quiz/examGenerator.ts');

  assert.match(
    practiceSource,
    /const language = useSettingsStore\(\(state\) => state\.language\);/,
  );
  assert.match(practiceSource, /language=\{language\}[\s\S]*option=\{option\}/);
  assert.match(practiceSource, /explanationEn=\{question\.explanationEn\}/);
  assert.match(practiceSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(quizSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(quizSource, /language=\{language\}[\s\S]*option=\{option\}/);
  assert.match(quizSource, /explanationEn=\{question\.explanationEn\}/);
  assert.match(quizSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(examSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(examSource, /language === 'en' \? option\.textEn : option\.textSv/);
  assert.match(examSource, /language === 'en' \? item\.questionEn : item\.questionSv/);
  assert.match(
    examSource,
    /language === 'en' \? item\.selectedOptionTextEn : item\.selectedOptionTextSv/,
  );
  assert.match(examSource, /explanationEn=\{item\.explanationEn\}/);
  assert.match(examSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(examGeneratorSource, /questionEn: question\.questionEn/);
  assert.match(examGeneratorSource, /selectedOptionTextEn: selectedOption\?\.textEn/);
  assert.match(examGeneratorSource, /correctOptionTextEn: correctOption\?\.textEn/);
  assert.match(examGeneratorSource, /explanationEn: question\.explanationEn/);
});

test('exam route exposes page and review section headings as headers', () => {
  const source = read('app/(tabs)/exam.tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /Mock exam/);
  assert.match(source, /Exam access/);
  assert.match(source, /Exam result/);
  assert.match(source, /Next exam/);
  assert.match(source, /Chapter breakdown/);
  assert.match(source, /Question review/);
  assert.match(source, /Progress/);
  assert.equal(headerMatches?.length, 8);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('exam controls mirror selected and disabled state to web aria attributes', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /aria-disabled=\{!canStartAccessibleExam \|\| startingAccessibleExam\}/);
  assert.match(
    source,
    /aria-disabled=\{!completionRecorded \|\| !canStartAccessibleExam \|\| startingAccessibleExam\}/,
  );
  assert.match(source, /aria-selected=\{isSelected\}/);
  assert.match(source, /aria-disabled=\{!canSubmit\}/);
  assert.match(source, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(source, /accessibilityState=\{\{ disabled: !canSubmit \}\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('exam results are final after submission', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /Submitted results are final/);
  assert.doesNotMatch(source, /Back to exam answers/);
  assert.doesNotMatch(source, /Back to answers/);
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
