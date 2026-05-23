const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('progress bar uses tokenized animated motion and exposes progress to assistive tech', () => {
  const source = read('components/ProgressBar.tsx');
  const adapterSource = read('components/ui/ProgressBar.tsx');

  assert.match(source, /Animated\.timing/);
  assert.match(source, /motion\.duration\.slow/);
  assert.match(source, /type AppLanguage \} from '\.\.\/lib\/storage\/settingsStore';/);
  assert.match(source, /const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = \{/);
  assert.match(source, /`\$\{progressPercent\} procent klart`/);
  assert.match(source, /`\$\{progressPercent\} percent complete`/);
  assert.match(source, /const progressPercent = Math\.round\(clampedProgress \* 100\);/);
  assert.match(source, /const copy = progressBarCopy\[language\];/);
  assert.match(
    source,
    /const progressAccessibilityLabel = copy\.progressLabel\(progressPercent\);/,
  );
  assert.match(source, /aria-label=\{resolvedAccessibilityLabel\}/);
  assert.match(source, /aria-valuemax=\{100\}/);
  assert.match(source, /aria-valuemin=\{0\}/);
  assert.match(source, /aria-valuenow=\{progressPercent\}/);
  assert.match(source, /aria-valuetext=\{resolvedAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{resolvedAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(
    source,
    /accessibilityValue=\{\{[\s\S]*min:\s*0,[\s\S]*max:\s*100,[\s\S]*now:\s*progressPercent,[\s\S]*text:\s*resolvedAccessibilityLabel,[\s\S]*\.\.\.accessibilityValue,[\s\S]*\}\}/,
  );
  assert.match(adapterSource, /ProgressBar as RootProgressBar/);
  assert.match(adapterSource, /languageOverride=\{language\}/);
  assert.doesNotMatch(adapterSource, /Animated\.timing|new Animated\.Value|useReducedMotion/);
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

test('provenance badge source note uses tokenized toggle feedback', () => {
  const source = read('components/quiz/ProvenanceBadge.tsx');

  assert.match(source, /const showSourceNote = \(\) => \{/);
  assert.match(source, /setFocused\(true\);/);
  assert.match(source, /setSourceNoteVisible\(true\);/);
  assert.match(source, /const hideSourceNote = \(\) => \{/);
  assert.match(source, /setFocused\(false\);/);
  assert.match(source, /const toggleSourceNote = \(\) => \{/);
  assert.match(source, /setSourceNoteVisible\(\(visible\) => !visible\);/);
  assert.match(source, /clearFocusRevealTimeout\(\);/);
  assert.match(source, /onBlur=\{hideSourceNote\}/);
  assert.match(source, /onFocus=\{showSourceNote\}/);
  assert.match(source, /onPress=\{toggleSourceNote\}/);
  assert.match(source, /accessibilityLabel=\{`\$\{copy\.accessibilityPrefix\}: \$\{label\}`\}/);
  assert.match(source, /accessibilityState=\{\{ expanded: sourceNoteVisible \}\}/);
  assert.match(source, /aria-controls=\{sourceNoteVisible \? sourceNoteId : undefined\}/);
  assert.match(source, /aria-describedby=\{sourceNoteVisible \? sourceNoteId : undefined\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /nativeID=\{sourceNoteId\}/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /pressed && !reduceMotion \? styles\.badgePressed : null/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('button derives an accessibility label from plain text children by default', () => {
  const source = read('components/Button.tsx');

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/ui/Button.tsx')),
    false,
    'components/ui/Button.tsx should stay retired; motion and accessibility checks target components/Button.tsx',
  );
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
  assert.match(source, /android_ripple=\{android_ripple \?\? \{ color: themeColors\.focusSoft/);
  assert.match(source, /hitSlop=\{hitSlop \?\? space\[0\.5\]\}/);
  assert.match(source, /style=\{\(\{ pressed \}\) => \[/);
  assert.match(
    source,
    /pressed && !isPressDisabled && !reduceMotion \? styles\.pressedMotion : null/,
  );
  assert.match(source, /pressed && !isPressDisabled \? styles\[`\$\{variant\}Pressed`\] : null/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /borderRadius: radius\.button/);
  assert.match(source, /backgroundColor: themeColors\.accentActive/);
  assert.match(source, /nativeID=\{buttonAccessibilityHintId\}/);
  assert.match(source, /accessibilityHintText/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('language picker future-language rows are disabled instead of selectable', () => {
  const source = read('components/ui/LanguagePicker.tsx');

  assert.match(source, /if \(!option\.available\) return;/);
  assert.match(source, /disabled=\{!opt\.available\}/);
  assert.match(source, /accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/);
  assert.match(
    source,
    /pressed && opt\.available[\s\S]*styles\.rowPressedReducedMotion[\s\S]*styles\.rowPressed/,
  );
  assert.doesNotMatch(
    source,
    /const handleSelect = \(option: LocaleOption\) => \{[\s\S]*setOpen\(false\);[\s\S]*if \(!option\.available\) return;/,
  );
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
  const disclaimerSource = read('app/disclaimer.tsx');
  const privacySource = read('app/privacy.tsx');
  const sourcesSource = read('app/sources.tsx');
  const supportSource = read('app/support.tsx');
  const termsSource = read('app/terms.tsx');

  assert.match(legalPageSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(legalPageSource, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.match(legalPageSource, /useSettingsStore, type AppLanguage/);
  assert.match(legalPageSource, /type LegalPageCopy =/);
  assert.match(legalPageSource, /const legalPageCopy: Record<AppLanguage, LegalPageCopy>/);
  assert.match(legalPageSource, /const settingsLanguage = useSettingsStore/);
  assert.match(legalPageSource, /const copy = legalPageCopy\[language \?\? settingsLanguage\]/);
  assert.match(legalPageSource, /defaultBackLabel: '← Tillbaka till profil'/);
  assert.match(legalPageSource, /defaultBackAccessibilityLabel: 'Tillbaka till profil'/);
  assert.match(legalPageSource, /defaultBackLabel: '← Back to Profile'/);
  assert.match(legalPageSource, /defaultBackAccessibilityLabel: 'Back to profile'/);
  assert.match(legalPageSource, /const resolvedBackLabel = backLabel \?\? copy\.defaultBackLabel;/);
  assert.match(legalPageSource, /accessibilityLabel=\{resolvedBackAccessibilityLabel\}/);
  assert.match(legalPageSource, /\{resolvedBackLabel\}/);
  assert.match(complianceLinksSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(complianceLinksSource, /type ComplianceLinksCopy =/);
  assert.match(
    complianceLinksSource,
    /const complianceLinksCopy: Record<AppLanguage, ComplianceLinksCopy>/,
  );
  assert.match(
    complianceLinksSource,
    /const copy = complianceLinksCopy\[language \?\? settingsLanguage\]/,
  );
  assert.match(complianceLinksSource, /Juridik och källor/);
  assert.match(complianceLinksSource, /Legal and sources/);
  assert.match(complianceLinksSource, /Öppna \$\{label\}/);
  assert.match(complianceLinksSource, /Open \$\{label\}/);
  assert.match(complianceLinksSource, /accessibilityLabel=\{copy\.openLabel\(link\.label\)\}/);
  assert.match(disclaimerSource, /const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy>/);
  assert.match(
    disclaimerSource,
    /const language = useSettingsStore\(\(state\) => state\.language\);/,
  );
  assert.match(disclaimerSource, /const copy = disclaimerCopy\[language\];/);
  assert.match(disclaimerSource, /<LegalPage[\s\S]*title=\{copy\.title\}/);
  assert.match(disclaimerSource, /Ansvarsfriskrivning/);
  assert.match(disclaimerSource, /Oberoende studieverktyg/);
  assert.match(disclaimerSource, /Disclaimer/);
  assert.match(disclaimerSource, /Independent study tool/);
  assert.match(privacySource, /const privacyCopy: Record<AppLanguage, PrivacyRouteCopy>/);
  assert.match(privacySource, /const copy = privacyCopy\[language\];/);
  assert.match(privacySource, /<LegalPage[\s\S]*title=\{copy\.title\}/);
  assert.match(privacySource, /Integritetspolicy/);
  assert.match(privacySource, /Konto är valfritt/);
  assert.match(privacySource, /Privacy policy/);
  assert.match(privacySource, /Account optional/);
  assert.match(privacySource, /Supabase and Google sign-in/);
  assert.match(sourcesSource, /const sourcesCopy: Record<AppLanguage, SourcesRouteCopy>/);
  assert.match(sourcesSource, /const copy = sourcesCopy\[language\];/);
  assert.match(sourcesSource, /<LegalPage[\s\S]*title=\{copy\.title\}/);
  assert.match(sourcesSource, /openEducationMaterialAccessibilityLabel/);
  assert.match(sourcesSource, /openAuthorityBoundarySourceAccessibilityLabel/);
  assert.match(
    sourcesSource,
    /<UhrEducationMaterialLink href=\{UHR_EDUCATION_MATERIAL_URL\} language=\{language\} \/>/,
  );
  assert.match(sourcesSource, /<UhrAuthorityBoundaryLink language=\{language\} \/>/);
  assert.match(sourcesSource, /Källor/);
  assert.match(sourcesSource, /Primärt studiematerial/);
  assert.match(sourcesSource, /Sources/);
  assert.match(sourcesSource, /Primary study material/);
  assert.match(supportSource, /const supportCopy: Record<AppLanguage, SupportRouteCopy>/);
  assert.match(supportSource, /const copy = supportCopy\[language\];/);
  assert.match(supportSource, /<LegalPage[\s\S]*title=\{copy\.title\}/);
  assert.match(supportSource, /accessibilityLabel=\{copy\.openSupportPageAccessibilityLabel\}/);
  assert.match(supportSource, /Support och återkoppling/);
  assert.match(supportSource, /Vad du kan rapportera/);
  assert.match(supportSource, /Support and feedback/);
  assert.match(supportSource, /What to report/);
  assert.match(termsSource, /const termsCopy: Record<AppLanguage, TermsRouteCopy>/);
  assert.match(termsSource, /const copy = termsCopy\[language\];/);
  assert.match(termsSource, /<LegalPage[\s\S]*title=\{copy\.title\}/);
  assert.match(termsSource, /Användarvillkor/);
  assert.match(termsSource, /Studieändamål/);
  assert.match(termsSource, /Terms of use/);
  assert.match(termsSource, /Study purpose/);
  assert.doesNotMatch(legalPageSource, /#[0-9a-fA-F]{6}|rgba?\(/);
  assert.doesNotMatch(complianceLinksSource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings route exposes page and section titles as headers', () => {
  const source = read('app/settings.tsx');
  const sectionHeaderMatches = source.match(
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/g,
  );

  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /\{copy\.studyLanguageTitle\}/);
  assert.match(source, /Inställningar/);
  assert.match(source, /Settings/);
  assert.match(source, /Studiespråk/);
  assert.match(source, /Study language/);
  assert.match(source, /Dagligt mål/);
  assert.match(source, /Tema/);
  assert.match(source, /Importera studiedata/);
  assert.match(source, /Audio/);
  assert.equal(sectionHeaderMatches?.length, 6);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings controls mirror selected and checked state to web aria attributes', () => {
  const source = read('app/settings.tsx');

  assert.match(source, /type SettingsCopy =/);
  assert.match(source, /const settingsCopy: Record<AppLanguage, SettingsCopy>/);
  assert.match(source, /const copy = settingsCopy\[language\]/);
  assert.match(source, /aria-checked=\{language === value\}/);
  assert.match(source, /accessibilityLabel=\{copy\.languageAccessibilityLabel\(label\)\}/);
  assert.match(source, /accessibilityState=\{\{ checked: language === value \}\}/);
  assert.match(source, /aria-checked=\{audioEnabled\}/);
  assert.match(
    source,
    /accessibilityLabel=\{[\s\S]*audioEnabled[\s\S]*\? copy\.disableAudioAccessibilityLabel[\s\S]*: copy\.enableAudioAccessibilityLabel[\s\S]*\}/,
  );
  assert.match(source, /\{audioEnabled \? copy\.audioEnabledLabel : copy\.audioDisabledLabel\}/);
  assert.match(source, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(source, /aria-checked=\{dailyGoalAnswers === goal\}/);
  assert.match(source, /accessibilityLabel=\{copy\.setDailyGoalAccessibilityLabel\(goal\)\}/);
  assert.match(source, /accessibilityState=\{\{ checked: dailyGoalAnswers === goal \}\}/);
  assert.match(source, /Svenska/);
  assert.match(source, /Engelskt stöd/);
  assert.match(source, /Byt studiespråk till \$\{label\}/);
  assert.match(source, /Set study language to \$\{label\}/);
  assert.match(source, /\$\{answerCount\} svar per dag/);
  assert.match(source, /\$\{answerCount\} answers per day/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('settings route remains scrollable on narrow mobile viewports', () => {
  const source = read('app/settings.tsx');

  assert.match(
    source,
    /import\s+\{[\s\S]*ScrollView,[\s\S]*StyleSheet,[\s\S]*Text,[\s\S]*TextInput,[\s\S]*View[\s\S]*\}\s+from 'react-native';/,
  );
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

  assert.match(source, /type OnboardingCopy =/);
  assert.match(source, /const onboardingCopy: Record<AppLanguage, OnboardingCopy> = \{/);
  assert.match(source, /const copy = onboardingCopy\[language\];/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /Förbered dig lugnt för samhällskunskapsprovet/);
  assert.match(source, /genomgång av frågor du missat/);
  assert.doesNotMatch(source, /repetition av misstag|upprepning av misstag/i);
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(source, /Börja studera/);
  assert.match(source, /Start studying/);
  assert.match(source, /Justera inställningar/);
  assert.match(source, /Adjust settings/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('onboarding route remains scrollable on narrow mobile viewports', () => {
  const source = read('app/onboarding.tsx');

  assert.match(
    source,
    /import\s+\{[\s\S]*Pressable,[\s\S]*ScrollView,[\s\S]*StyleSheet,[\s\S]*Text,[\s\S]*View[\s\S]*\}\s+from 'react-native';/,
  );
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
  assert.match(source, /const resolvedAccessibilityRole =/);
  assert.match(
    source,
    /accessibilityRole \?\? \(groupedForAccessibility \? 'summary' : undefined\)/,
  );
  assert.match(source, /aria-describedby=\{cardAccessibilityHintId\}/);
  assert.match(source, /aria-label=\{accessibilityLabel\}/);
  assert.match(source, /accessible=\{groupedForAccessibility\}/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{resolvedAccessibilityRole\}/);
  assert.match(source, /nativeID=\{cardAccessibilityHintId\}/);
  assert.match(source, /accessibilityHintText/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice screen adds bookmark controls backed by progress storage', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /toggleBookmark/);
  assert.match(source, /bookmarked/);
  assert.match(source, /aria-pressed=\{isBookmarked\}/);
  assert.doesNotMatch(source, /aria-selected=\{isBookmarked\}/);
  assert.match(
    source,
    /const bookmarkAccessibilityState =\s*Platform\.OS === 'web' \? undefined : \{ selected: isBookmarked \};/,
  );
  assert.match(source, /accessibilityState=\{bookmarkAccessibilityState\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
});

test('practice header controls keep accessible targets and token feedback', () => {
  const source = read('app/(tabs)/practice.tsx');
  const hitSlopMatches = source.match(/hitSlop=\{space\[1\]\}/g) ?? [];

  assert.match(source, /type PracticeHeaderControl = 'bookmark' \| 'supplementary' \| 'sources';/);
  assert.match(
    source,
    /const \[focusedHeaderControl, setFocusedHeaderControl\] = useState<PracticeHeaderControl \| null>/,
  );
  assert.match(source, /<View style=\{styles\.headerControls\}>/);
  assert.ok(hitSlopMatches.length >= 3);
  assert.match(source, /style=\{\(\{ pressed \}\) => \[/);
  assert.match(
    source,
    /focusedHeaderControl === 'bookmark' \? styles\.headerControlFocused : null/,
  );
  assert.match(
    source,
    /focusedHeaderControl === 'supplementary' \? styles\.headerControlFocused : null/,
  );
  assert.match(source, /focusedHeaderControl === 'sources' \? styles\.headerControlFocused : null/);
  assert.match(
    source,
    /pressed[\s\S]*styles\.headerControlPressedReducedMotion[\s\S]*styles\.headerControlPressed/,
  );
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /minWidth: space\[6\]/);
  assert.match(source, /backgroundColor: colors\.focusSoft/);
  assert.match(source, /borderColor: colors\.focus/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice and routed quiz screens expose primary titles as headers', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const routedQuizSource = read('app/quiz/[sessionId].tsx');
  const quizHeaderMatches = routedQuizSource.match(
    /<Text accessibilityRole="header" style=\{styles\.title\}>/g,
  );

  assert.match(practiceSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(practiceSource, /\{copy\.questionTitle\(questionNumber\)\}/);
  assert.equal(quizHeaderMatches?.length, 3);
  assert.match(practiceSource, /type PracticeCopy =/);
  assert.match(practiceSource, /const practiceCopy: Record<AppLanguage, PracticeCopy>/);
  assert.match(practiceSource, /Fråga \$\{questionNumber\}/);
  assert.match(practiceSource, /Question \$\{questionNumber\}/);
  assert.match(routedQuizSource, /type QuizSessionCopy =/);
  assert.match(routedQuizSource, /const quizSessionCopy: Record<AppLanguage, QuizSessionCopy>/);
  assert.match(routedQuizSource, /Det finns inga övningsfrågor ännu\./);
  assert.match(routedQuizSource, /Frågepass \$\{currentSessionId\}/);
  assert.match(routedQuizSource, /\{copy\.emptyTitle\}/);
  assert.match(
    routedQuizSource,
    /const sessionTitle =[\s\S]*copy\.sessionTitle\(normalizedSessionId\);/,
  );
  assert.match(routedQuizSource, /\{sessionTitle\}/);
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
  assert.match(source, /Försök igen med den här frågan/);
  assert.match(source, /Back to Practice/);
  assert.match(source, /Answer the routed question, then review the source-backed feedback\./);
  assert.match(source, /\{copy\.scoreLabel\}: \{score\.correct\}\/\{score\.total\}/);
  assert.match(source, /accessibilityLabel=\{copy\.tryAgainAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.backToPracticeAccessibilityLabel\}/);
});

test('routed quiz answer state resets when the route-entry shuffle seed changes', () => {
  const source = read('app/quiz/[sessionId].tsx');

  assert.match(
    source,
    /const routedQuizShuffleSessionId = useRoutedQuizShuffleSessionId\(normalizedSessionId\);/,
  );
  assert.match(
    source,
    /shuffleQuestionOptionsForSession\(\s*pickedQuestion,\s*routedQuizShuffleSessionId\s*\)/,
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{\n\s+setSelectedOptionId\(null\);\n\s+setSelectedConfidenceRating\(null\);\n\s+\}, \[routedQuizShuffleSessionId, question\?\.id\]\);/,
  );
  assert.doesNotMatch(source, /\}, \[normalizedSessionId, question\?\.id\]\);/);
  assert.doesNotMatch(
    source,
    /shuffleQuestionOptionsForSession\(\s*pickedQuestion,\s*normalizedSessionId\s*\)/,
  );
  assert.doesNotMatch(source, /\}, \[question\?\.id\]\);/);
});

test('home daily goal uses local-day answer progress instead of lifetime completions', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /countAnswersForLocalDate/);
  assert.doesNotMatch(source, /const answerHistory = useProgressStore/);
  assert.match(source, /questionProgress,/);
  assert.doesNotMatch(source, /countAnswersForLocalDate\(questionProgress\)/);
  assert.doesNotMatch(source, /completedQuestionIds\.length,\s*dailyGoalAnswers/);
});

test('practice answer flow requires explicit next question after feedback', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /getPracticeQuestionForSession/);
  assert.match(source, /activeQuestionId/);
  assert.match(source, /shuffleSessionId/);
  assert.match(source, /selectOption\(question\.id,\s*optionId\)/);
  assert.match(source, /shuffleQuestionOptionsForSession\(rawQuestion,\s*shuffleSessionId\)/);
  assert.doesNotMatch(
    source,
    /shuffleQuestionOptionsForSession\(rawQuestion,\s*['"]practice-session['"]\)/,
  );
  assert.match(source, /advanceQuestion/);
  assert.match(source, /Next question/);
  assert.match(source, /\{copy\.nextQuestion\}/);
});

test('practice locks answer options after feedback is visible', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const answerOptionSource = read('components/quiz/AnswerOption.tsx');

  assert.match(answerOptionSource, /disabled\?: boolean/);
  assert.match(answerOptionSource, /disabled=\{optionDisabled\}/);
  assert.match(practiceSource, /disabled=\{hasSelectedAnswer \|\| isStruck\}/);
});

test('practice and routed quiz answer options expose selected state', () => {
  const answerOptionSource = read('components/quiz/AnswerOption.tsx');
  const practiceSource = read('app/(tabs)/practice.tsx');
  const routedQuizSource = read('app/quiz/[sessionId].tsx');

  assert.match(answerOptionSource, /selected = false/);
  assert.match(answerOptionSource, /selected\?: boolean/);
  assert.match(
    answerOptionSource,
    /accessibilityState=\{\{ disabled: optionDisabled, selected \}\}/,
  );
  assert.match(practiceSource, /selected=\{hasSelectedAnswer && selectedOptionId === option\.id\}/);
  assert.match(routedQuizSource, /selected=\{selectedOptionId === option\.id\}/);
});

test('answer option feedback remains available in the accessibility label', () => {
  const source = read('components/quiz/AnswerOption.tsx');

  assert.match(source, /import \{ useState \} from 'react';/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/);
  assert.match(source, /Välj svaret \$\{label\}/);
  assert.match(source, /Select answer \$\{label\}/);
  assert.match(source, /Eliminate answer \$\{label\}/);
  assert.match(source, /Restore answer \$\{label\}/);
  assert.match(source, /function getOptionLabel/);
  assert.match(source, /import \{ getQuestionOptionText \}/);
  assert.match(source, /return getQuestionOptionText\(option, language\);/);
  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /\$\{label\}, \$\{resultLabel\}/);
  assert.match(source, /\$\{label\}, \$\{copy\.struckStateLabel\}/);
  assert.match(source, /copy\.selectAccessibilityLabel\(label\)/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Select answer \$\{label\}`\}/);
});

test('answer option strikeout control exposes keyboard focus and pressed state', () => {
  const source = read('components/quiz/AnswerOption.tsx');
  const e2eSource = read('tests/e2e/practice-feedback.spec.ts');

  assert.match(source, /const \[strikeoutFocused, setStrikeoutFocused\] = useState\(false\);/);
  assert.match(source, /onFocus=\{\(\) => setStrikeoutFocused\(true\)\}/);
  assert.match(source, /onBlur=\{\(\) => setStrikeoutFocused\(false\)\}/);
  assert.match(source, /strikeoutFocused \? styles\.strikeoutButtonFocused : null/);
  assert.match(source, /strikeoutButtonFocused: \{/);
  assert.match(source, /borderColor: colors\.focus/);
  assert.match(source, /aria-pressed=\{struck\}/);
  assert.match(source, /pressed\s*\?\s*reduceMotion/);
  assert.match(e2eSource, /practice strikeout controls support keyboard focus, Space, and Enter/);
  assert.match(e2eSource, /focusByKeyboard\(page, eliminateWrongAnswer/);
  assert.match(e2eSource, /page\.keyboard\.down\('Space'\)/);
  assert.match(e2eSource, /page\.keyboard\.press\('Enter'\)/);
  assert.match(e2eSource, /toHaveAttribute\('aria-pressed', 'true'\)/);
  assert.match(
    e2eSource,
    /getByRole\('button', \{ name: \/Eliminate answer\|Restore answer\/ \}\)/,
  );
});

test('question card groups prompt and translation into an accessible summary', () => {
  const source = read('components/quiz/QuestionCard.tsx');
  const helperSource = read('lib/quiz/questionText.ts');

  assert.match(source, /import type \{ AppLanguage \}/);
  assert.match(source, /const questionCardCopy: Record<AppLanguage, QuestionCardCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const copy = questionCardCopy\[language\]/);
  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(
    source,
    /difficultyValueLabels: Record<PracticeQuestion\['difficulty'\] \| 'practice', string>/,
  );
  assert.match(source, /easy: 'Lätt'/);
  assert.match(source, /medium: 'Medel'/);
  assert.match(source, /hard: 'Svår'/);
  assert.match(source, /practice: 'Övning'/);
  assert.match(source, /easy: 'Easy'/);
  assert.match(source, /medium: 'Medium'/);
  assert.match(source, /hard: 'Hard'/);
  assert.match(source, /practice: 'Practice'/);
  assert.match(source, /const difficultyLabel = copy\.difficultyValueLabels\[difficulty\];/);
  assert.match(source, /getQuestionDisplayText\(question, language\)/);
  assert.match(
    source,
    /const questionTranslation = getQuestionTranslationText\(question, language\);/,
  );
  assert.match(source, /const sourceCitation = getQuestionSourceCitation\(question, language\);/);
  assert.match(source, /difficultyLabel: 'Svårighetsgrad'/);
  assert.match(source, /questionLabel: 'Fråga'/);
  assert.match(source, /secondaryLabel: 'Engelsk översättning'/);
  assert.match(source, /sourceCitationLabel: 'Källhänvisning'/);
  assert.match(source, /difficultyLabel: 'Difficulty'/);
  assert.match(source, /\$\{copy\.difficultyLabel\}: \$\{difficultyLabel\}/);
  assert.match(source, /\$\{copy\.questionLabel\}: \$\{questionText\}/);
  assert.match(
    source,
    /questionTranslation \? `\$\{copy\.secondaryLabel\}: \$\{questionTranslation\}` : null/,
  );
  const questionAccessibilityLabelBlock =
    source.match(/const questionAccessibilityLabel = \[[\s\S]*?\]\s*\.filter\(Boolean\)/)?.[0] ??
    '';
  assert.doesNotMatch(
    questionAccessibilityLabelBlock,
    /\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}/,
  );
  assert.match(
    source,
    /accessibilityLabel=\{`\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}`\}/,
  );
  assert.match(source, /Engelsk översättning/);
  assert.match(source, /Swedish original/);
  assert.match(helperSource, /Källa: Sverige i fokus/);
  assert.match(helperSource, /Source: Sverige i fokus/);
  assert.doesNotMatch(helperSource, /Källa\/Source/);
  assert.match(helperSource, /stripSourceAuthorityPhrasing/);
  assert.match(helperSource, /Enligt UHR-materialet/);
  assert.match(helperSource, /According to the UHR material/);
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
  assert.match(source, /language === 'en'\s*\?\s*chapter\.nameEn\s*:\s*chapter\.nameSv/);
  assert.match(
    source,
    /const secondaryName = chapter \? \(language === 'en' \? chapter\.nameSv : chapter\.nameEn\) : null/,
  );
  assert.match(
    source,
    /language === 'en'\s*\?\s*chapter\.descriptionEn\s*:\s*chapter\.descriptionSv/,
  );
  assert.match(source, /const chapterAccessibilityLabel =/);
  assert.match(source, /copy\.accessibilityLabel\.chapter\(title\)/);
  assert.match(source, /copy\.accessibilityLabel\.secondaryName\(secondaryName\)/);
  assert.match(source, /copy\.accessibilityLabel\.status\(status\)/);
  assert.match(source, /copy\.accessibilityLabel\.description\(description\)/);
  assert.match(source, /accessibilityMode\?: 'summary' \| 'presentation'/);
  assert.match(source, /const shouldGroupForAccessibility = accessibilityMode === 'summary';/);
  assert.match(
    source,
    /const shouldHideNestedAccessibility = accessibilityMode === 'presentation';/,
  );
  assert.match(source, /accessibilityElementsHidden=\{shouldHideNestedAccessibility\}/);
  assert.match(
    source,
    /accessibilityLabel=\{shouldGroupForAccessibility \? chapterAccessibilityLabel : undefined\}/,
  );
  assert.match(
    source,
    /importantForAccessibility=\{shouldHideNestedAccessibility \? 'no-hide-descendants' : undefined\}/,
  );
  assert.match(source, /<Text style=\{styles\.subtitle\}>\{secondaryName\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.description\}>\{description\}<\/Text>/);
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
  assert.match(source, /Öppna kapitel \$\{primaryName\}/);
  assert.match(source, /Engelskt namn: \$\{secondaryName\}/);
  assert.match(source, /Framsteg: \$\{progressLabel\}/);
  assert.match(source, /\$\{completedCount\} av \$\{questionCount\} frågor besvarade/);
  assert.match(source, /Open chapter \$\{primaryName\}/);
  assert.match(source, /Swedish name: \$\{secondaryName\}/);
  assert.match(source, /Progress: \$\{progressLabel\}/);
  assert.match(source, /\$\{completedCount\} of \$\{questionCount\} questions practiced/);
  assert.match(source, /copy: ChapterLinkCopy/);
  assert.match(source, /copy\.progressLabel\(completedCount, questionCount\)/);
  assert.match(source, /const primaryName = language === 'en' \? nameEn : nameSv/);
  assert.match(source, /const secondaryName = language === 'en' \? nameSv : nameEn/);
  assert.match(
    source,
    /copy\.accessibilityLabel\(\{ primaryName, secondaryName, progressLabel \}\)/,
  );
  assert.match(source, /accessibilityLabel=\{getChapterLinkAccessibilityLabel/);
  assert.match(source, /language=\{language\}/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Open chapter \$\{chapter\.nameSv\}`\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('quiz feedback cards expose accessible summaries', () => {
  const explanationSource = read('components/quiz/ExplanationPanel.tsx');
  const referenceSource = read('components/quiz/UHRReferenceCard.tsx');

  assert.match(explanationSource, /explanationEn/);
  assert.match(explanationSource, /explanationText\?: Partial<LocalizedContentText>/);
  assert.match(explanationSource, /language = 'sv'/);
  assert.match(
    explanationSource,
    /const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy>/,
  );
  assert.match(explanationSource, /Förklaring saknas för den här frågan\./);
  assert.match(
    explanationSource,
    /const localizedExplanation = explanationText\?\.\[language\] \?\? explanationText\?\.sv;/,
  );
  assert.match(explanationSource, /const explanation =[\s\S]*localizedExplanation \?\?/);
  assert.match(
    explanationSource,
    /language === 'en' && explanationEn \? explanationEn : \(explanationSv \?\? copy\.fallback\)/,
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
  assert.match(source, /import \{ DisclaimerBanner \} from '\.\.\/DisclaimerBanner';/);
  assert.match(source, /<DisclaimerBanner/);
  assert.match(source, /accessibilityHint=\{copy\.accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{disclaimerAccessibilityLabel\}/);
  assert.match(source, /message=\{copy\.text\}/);
  assert.match(source, /title=\{copy\.title\}/);
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
  assert.match(source, /bookmarkedReviewQuestions/);
  assert.match(source, /Bokmärkta frågor/);
  assert.match(source, /Bookmarked questions/);
  assert.match(source, /Sparad till senare övning/);
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

test('mistakes screen reviews selected wrong answers and correct answers', () => {
  const source = read('app/(tabs)/mistakes.tsx');
  const practiceSource = read('app/(tabs)/practice.tsx');
  const quizSource = read('app/quiz/[sessionId].tsx');
  const reviewStoreSource = read('lib/storage/mistakeReviewStore.ts');

  assert.match(source, /useMistakeReviewStore/);
  assert.match(source, /const wrongAnswerReviews = useMistakeReviewStore/);
  assert.match(source, /wrongAnswerReviews\[question\.id\]/);
  assert.match(source, /selectedOptionTextEn/);
  assert.match(source, /selectedOptionTextSv/);
  assert.match(source, /question\.correctOptionId/);
  assert.match(source, /\{copy\.selectedWrongAnswerLabel\}/);
  assert.match(source, /\{copy\.correctAnswerLabel\}/);
  assert.match(source, /Ditt senaste svar/);
  assert.match(source, /Your latest wrong answer/);
  assert.match(source, /Rätt svar/);
  assert.match(source, /Correct answer/);
  assert.match(source, /accessibilityLabel=\{copy\.answerReviewAccessibilityLabel\(/);
  assert.match(practiceSource, /recordWrongAnswerReview/);
  assert.match(quizSource, /recordWrongAnswerReview/);
  assert.match(reviewStoreSource, /export type MistakeAnswerReview = \{/);
  assert.match(reviewStoreSource, /wrongAnswerReviews: Record<string, MistakeAnswerReview>/);
  assert.match(reviewStoreSource, /const mistakeReviewStorageId = 'mistake-review';/);
  assert.match(reviewStoreSource, /createMMKV\(\{ id: mistakeReviewStorageId \}\)/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('native ads use Google Mobile Ads while web keeps a safe preview component', () => {
  const webSource = read('components/monetization/AdBanner.tsx');
  const nativeSource = read('components/monetization/AdBanner.native.tsx');
  const copySource = read('lib/monetization/adCopy.ts');

  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(webSource, /useSettingsStore/);
  assert.match(webSource, /const copy = adBannerCopy\[language\]/);
  assert.match(webSource, /const placementLabel = copy\.placementLabels\[placement\];/);
  assert.match(webSource, /getAdBannerStatusLabel/);
  assert.match(webSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(webSource, /const accessibilityLabel = copy\.accessibilityLabel/);
  assert.match(
    webSource,
    /accessibilityHint=\{`\$\{copy\.previewHint\} \$\{copy\.removeAdsHint\}`\}/,
  );
  assert.match(webSource, /<Card[\s\S]*accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(nativeSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /useSettingsStore/);
  assert.match(nativeSource, /accessible/);
  assert.match(nativeSource, /const copy = adBannerCopy\[language\]/);
  assert.match(nativeSource, /const placementLabel = copy\.placementLabels\[placement\];/);
  assert.match(nativeSource, /getAdBannerStatusLabel/);
  assert.match(nativeSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(nativeSource, /const accessibilityLabel = copy\.accessibilityLabel/);
  assert.match(
    nativeSource,
    /const accessibilityLabel = copy\.accessibilityLabel\(placementLabel, adStatusLabel\);/,
  );
  assert.doesNotMatch(
    nativeSource,
    /accessibilityLabel=\{copy\.accessibilityLabel\(placementLabel, copy\.liveStatus\)\}/,
  );
  assert.match(nativeSource, /const unitId = getPlatformAdUnitId\(placement, Platform\.OS\);/);
  assert.match(
    nativeSource,
    /shouldShowAd\([\s\S]*placement,[\s\S]*resolvedEntitlements,[\s\S]*mobileAdsConsent\.decision\.consentDecision,[\s\S]*Platform\.OS,[\s\S]*\)/,
  );
  assert.match(
    nativeSource,
    /accessibilityHint=\{`\$\{copy\.previewHint\} \$\{copy\.removeAdsHint\}`\}/,
  );
  assert.match(nativeSource, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(nativeSource, /<BannerAd/);
  assert.match(copySource, /const adBannerCopy: Record<AppLanguage, AdBannerCopy>/);
  assert.match(copySource, /home_banner: 'Annons på startsidan'/);
  assert.match(copySource, /chapter_list_banner: 'Annons i kapitellistan'/);
  assert.match(copySource, /Döljs när Ta bort annonser är aktivt/);
  assert.match(copySource, /home_banner: 'Home banner'/);
  assert.match(copySource, /AdMob test unit active - preview/);
  assert.doesNotMatch(copySource, /web preview|webbförhandsvisning/);
});

test('native ad preview card exposes a grouped accessibility summary', () => {
  const source = read('components/monetization/NativeAdCard.tsx');
  const nativeSource = read('components/monetization/NativeAdCard.native.tsx');
  const copySource = read('lib/monetization/adCopy.ts');

  assert.match(source, /useSettingsStore/);
  assert.match(source, /const resultsNativeUnit = getAdUnit\('results_native'\);/);
  assert.match(
    source,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(nativeSource, /const resultsNativeUnit = getAdUnit\('results_native'\);/);
  assert.match(
    nativeSource,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(
    source,
    /<Card accessibilityHint=\{copy\.hint\} accessibilityLabel=\{copy\.accessibilityLabel\}>/,
  );
  assert.match(source, /\{copy\.eyebrow\}/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /\{copy\.meta\}/);
  assert.match(copySource, /getNativeAdCardCopy/);
  assert.match(copySource, /live:\s*\{[\s\S]*?eyebrow: 'Ad'/);
  assert.match(copySource, /live:\s*\{[\s\S]*?eyebrow: 'Annons'/);
  assert.match(copySource, /test:\s*\{[\s\S]*?eyebrow: 'Test native ad'/);
  assert.match(copySource, /Inbyggd testannons/);
  assert.match(copySource, /Annons i resultatvyn/);
  assert.match(copySource, /Förhandsvisning av AdMob-testplacering/);
  assert.match(copySource, /Döljs när Ta bort annonser är aktivt/);
  assert.match(copySource, /Test native ad/);
  assert.match(copySource, /Results ad/);
  assert.match(copySource, /AdMob test placement preview/);
  const liveCopyBlocks = Array.from(
    copySource.matchAll(/live:\s*\{([\s\S]*?)\n    \},\n    test:/g),
    (match) => match[1],
  );
  assert.equal(liveCopyBlocks.length, 2);
  for (const liveCopyBlock of liveCopyBlocks) {
    assert.doesNotMatch(
      liveCopyBlock,
      /Test native ad|Inbyggd testannons|AdMob test placement preview|AdMob-testplacering/,
    );
  }
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
  assert.doesNotMatch(copySource, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('premium banner announces Remove Ads purchase status changes', () => {
  const source = read('components/monetization/PremiumBanner.tsx');
  const homeSource = read('app/(tabs)/home.tsx');
  const profileSource = read('app/(tabs)/profile.tsx');

  assert.match(source, /type PremiumBannerCopy =/);
  assert.match(source, /const premiumBannerCopy: Record<AppLanguage, PremiumBannerCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const copy = premiumBannerCopy\[language\]/);
  assert.match(source, /const statusMessage = getStatusMessage/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /accessibilityLabel=\{copy\.statusAccessibilityLabel\(statusMessage\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.buyAccessibilityLabel\(resolvedPriceLabel\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /Ta bort annonser/);
  assert.match(source, /Köp Ta bort annonser för \$\{price\}/);
  assert.match(source, /Återställ köp av Ta bort annonser/);
  assert.match(source, /tidsatta övningsprov i appen redan är annonsfria/);
  assert.match(source, /Tidsatta övningsprov i appen är redan annonsfria/);
  assert.doesNotMatch(
    source,
    /\bprov(?:et)?\s+(?:är|förblir)\s+(?:alltid\s+|redan\s+)?annonsfri(?:tt|a)?\b/i,
  );
  assert.match(source, /Köpet bekräftades, men annonsfri status kunde inte sparas/);
  assert.match(source, /Annonser är avstängda på den här enheten\./);
  assert.match(source, /Remove Ads/);
  assert.match(source, /Buy Remove Ads for \$\{price\}/);
  assert.match(source, /Restore Remove Ads purchase/);
  assert.match(source, /Purchase was confirmed, but ad-free status could not be saved/);
  assert.match(source, /Ads are disabled on this device\./);
  assert.match(homeSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(homeSource, /language=\{language\}/);
  assert.match(profileSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(profileSource, /language=\{language\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('profile shell copy follows Swedish and English settings language', () => {
  const source = read('app/(tabs)/profile.tsx');

  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /<ScreenShell[\s\S]*title=\{copy\.title\}/);
  assert.match(source, /<SectionHeader title=\{copy\.studySetupTitle\}/);
  assert.match(source, /<SectionHeader title=\{copy\.badgesTitle\}/);
  assert.match(source, /accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}/);
  assert.match(source, /Lokal profil/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Studieinställningar/);
  assert.match(source, /Märken/);
  assert.match(source, /Inga märken ännu/);
  assert.match(source, /Ändra mål, språk och ljud/);
  assert.match(source, /Öppna inställningar för dagligt mål, språk och ljud/);
  assert.match(source, /Framstegsöversikt/);
  assert.match(source, /Svitskydd/);
  assert.match(source, /Progress without an account/);
  assert.match(source, /Study setup/);
  assert.match(source, /No badges yet/);
  assert.match(source, /Adjust goal, language, and audio/);
  assert.match(source, /Open settings for daily goal, language, and audio/);
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
  assert.match(read('components/learning/AudioButton.tsx'), /Ljud saknas/);
  assert.match(read('components/learning/AudioButton.tsx'), /Audio is unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /Studiefråga saknas/);
  assert.match(read('components/learning/Flashcard.tsx'), /Svar saknas/);
  assert.match(read('components/learning/Flashcard.tsx'), /Study prompt unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /Answer unavailable/);
  assert.match(read('components/learning/Flashcard.tsx'), /accessibilityLabel/);
  assert.doesNotMatch(read('components/learning/Flashcard.tsx'), /front\s*=\s*['"]Front/);
  assert.doesNotMatch(read('components/learning/Flashcard.tsx'), /back\s*=\s*['"]Back/);
  assert.match(read('lib/monetization/adCopy.ts'), /AdMob test placement preview/);
  assert.match(read('lib/monetization/adCopy.ts'), /Förhandsvisning av AdMob-testplacering/);
  assert.match(read('components/quiz/ExplanationPanel.tsx'), /Explanation unavailable/);
  assert.match(read('lib/quiz/questionText.ts'), /Fråga saknas/);
  assert.match(read('lib/quiz/questionText.ts'), /Question unavailable/);
  assert.match(read('components/quiz/UHRReferenceCard.tsx'), /Source reference unavailable/);
});

test('audio button disables playback when speech text is unavailable', () => {
  const source = read('components/learning/AudioButton.tsx');

  assert.match(source, /const speechText = typeof text === 'string' \? text\.trim\(\) : '';/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /Lyssna på den svenska frågan och svaren/);
  assert.match(source, /Listen to the Swedish question and answers/);
  assert.match(source, /Audio is unavailable/);
  assert.match(source, /const accessibilityLabel = label;/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityState=\{\{ busy: isSpeaking, disabled: !canPlayAudio \}\}/);
  assert.match(source, /disabled=\{!canPlayAudio\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(source, /speakSwedish\(speechText,/);
  assert.doesNotMatch(source, /speakSwedish\(text\)/);
});

test('home screen surfaces focused review copy and review action', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /Focused review/);
  assert.match(source, /Fokuserad repetition/);
  assert.match(source, /Keep track of what needs review/);
  assert.match(source, /Håll koll på det som behöver övas/);
  assert.match(source, /Review saved and missed questions/);
  assert.match(source, /Repetera sparade och missade frågor/);
  assert.match(source, /href="\/mistakes"/);
});

test('home screen uses natural Swedish missed-question review copy', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /genomgång av frågor du missat/);
  assert.match(source, /missade frågor/);
  assert.doesNotMatch(source, /felspårning|repetition av misstag|upprepning av misstag/i);
  assert.match(source, /href="\/mistakes"/);
});

test('home shell copy follows Swedish and English settings language', () => {
  const source = read('app/(tabs)/home.tsx');

  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(source, /type HomeCopy =/);
  assert.match(source, /const homeCopy: Record<AppLanguage, HomeCopy>/);
  assert.match(source, /const copy = homeCopy\[language\]/);
  assert.match(source, /<ScreenShell[\s\S]*title=\{copy\.title\}/);
  assert.match(source, /accessibilityLabel=\{copy\.startPracticeAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.browseChaptersAccessibilityLabel\}/);
  assert.match(source, /<MetricCard[\s\S]*label=\{copy\.levelMetric\}/);
  assert.match(source, /helper=\{copy\.questionsHelper\(chapters\.length\)\}/);
  assert.match(source, /<Badge tone="blue">\{copy\.feedbackBadge\}<\/Badge>/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.studyLoopTitle\}/);
  assert.match(source, /copy\.studyLoopItems\[index\]/);
  assert.match(source, /\{itemCopy\.label\}/);
  assert.match(source, /\{itemCopy\.lesson\}/);
  assert.match(source, /Studieöversikt/);
  assert.match(source, /Studera lugnt, ett samhällsbegrepp i taget/);
  assert.match(source, /Starta den rekommenderade övningen/);
  assert.match(source, /Smarta studievanor/);
  assert.match(source, /Prepare calmly, one civic concept at a time/);
  assert.match(source, /Start the recommended practice session/);
  assert.match(source, /Smart study habits/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('home screen exposes dashboard card titles as headers', () => {
  const source = read('app/(tabs)/home.tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /\{copy\.dailyGoalTitle\}/);
  assert.match(source, /\{copy\.readinessTitle\}/);
  assert.match(source, /\{copy\.feedbackTitle\}/);
  assert.match(source, /\{copy\.rewardedExamHeading\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.goalLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.readinessTitle\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.rewardedExamTitle\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.feedbackTitle\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.rewardedExamTitle\}>/);
  assert.equal(headerMatches?.length, 5);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('profile dashboard CTA keeps natural Swedish dashboard copy', () => {
  const source = read('app/(tabs)/profile.tsx');

  assert.match(source, /Aktivitet, kapitelframsteg och XP visas på en egen sida/);
  assert.doesNotMatch(source, /Kapitelprogress|kapitelprogress|XP-linjen/);
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
  assert.match(webSource, /useSettingsStore, type AppLanguage/);
  assert.match(webSource, /type LaunchPopupAdCopy =/);
  assert.match(webSource, /const launchPopupAdCopy: Record<AppLanguage, LaunchPopupAdCopy>/);
  assert.match(webSource, /dialogAccessibilityLabel: 'Startannons'/);
  assert.match(webSource, /closeAccessibilityLabel: 'Stäng startannons'/);
  assert.match(webSource, /closeLabel: 'Fortsätt studera'/);
  assert.match(webSource, /dialogAccessibilityLabel: 'Launch sponsor ad'/);
  assert.match(webSource, /closeAccessibilityLabel: 'Close launch sponsor ad'/);
  assert.match(webSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(webSource, /const copy = launchPopupAdCopy\[language\];/);
  assert.match(webSource, /accessibilityLabel=\{copy\.dialogAccessibilityLabel\}/);
  assert.match(webSource, /accessibilityViewIsModal/);
  assert.doesNotMatch(webSource, /aria-modal=\{true\}/);
  assert.doesNotMatch(webSource, /role="dialog"/);
  assert.match(webSource, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(webSource, /\{copy\.title\}/);
  assert.match(webSource, /\{unit\?\.testOnly \? copy\.testBody : copy\.liveBody\}/);
  assert.match(webSource, /accessibilityLabel=\{copy\.closeAccessibilityLabel\}/);
  assert.match(webSource, /\{copy\.closeLabel\}/);
  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /AppOpenAd/);
  assert.match(nativeSource, /launchPopupShownThisRuntime/);
  assert.match(
    webSource,
    /import \{ deferFirstRunAboutModalForLaunchSession \} from '\.\/launchPopupSession';/,
  );
  assert.match(nativeSource, /deferFirstRunAboutModalForLaunchSession,/);
  assert.match(
    nativeSource,
    /const nativeLaunchPopupUnitId = getPlatformAdUnitId\('app_open_launch', Platform\.OS\);/,
  );
  assert.match(
    nativeSource,
    /const launchPopupAdUnitId =[\s\S]*shouldShowLaunchPopupAd[\s\S]*\? nativeLaunchPopupUnitId/,
  );
  assert.match(nativeSource, /platform: Platform\.OS,/);
  assert.match(
    nativeSource,
    /if \(launchPopupAdUnitId\) \{[\s\S]*deferFirstRunAboutModalForLaunchSession\(\);[\s\S]*\}/,
  );
  assert.match(
    nativeSource,
    /clearFirstRunAboutModalDeferralForLaunchSession,[\s\S]*deferFirstRunAboutModalForLaunchSession,/,
  );
  assert.match(
    nativeSource,
    /const unsubscribeLoadListeners = \(\) => \{[\s\S]*unsubscribe\?\.\(\);[\s\S]*unsubscribeError\?\.\(\);[\s\S]*unsubscribe = undefined;[\s\S]*unsubscribeError = undefined;[\s\S]*\};/,
  );
  assert.match(
    nativeSource,
    /const finishLoadAttempt = \(\) => \{[\s\S]*clearLoadTimeout\(\);[\s\S]*launchPopupLoadInFlight = false;[\s\S]*attemptSettled = true;[\s\S]*\};/,
  );
  assert.match(
    nativeSource,
    /try \{[\s\S]*AppOpenAd\.createForAdRequest\(launchPopupAdUnitId,[\s\S]*launchPopupLoadInFlight = true;[\s\S]*addAdEventListener\(AdEventType\.LOADED,[\s\S]*launchPopupShownThisRuntime = true;[\s\S]*finishLoadAttempt\(\);[\s\S]*didReachShowPath = true;[\s\S]*Promise\.resolve\(appOpenAd\.show\(\)\)\.catch\(\(\) => undefined\)[\s\S]*addAdEventListener\(AdEventType\.ERROR,[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*loadTimeout = setTimeout\(\(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*appOpenAd\.load\(\);[\s\S]*return \(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*\} catch \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*return undefined;/,
  );
});

test('first-run about modal uses natural Swedish guide accessibility copy', () => {
  const source = read('components/onboarding/FirstRunAboutTheTestModal.tsx');
  const staleGuideLabel = ['Öppna om-', 'provet-', 'guiden'].join('');

  assert.match(source, /open: 'Läs guiden'/);
  assert.match(source, /openAccessibilityLabel: 'Öppna guiden om medborgarskapsprovet'/);
  assert.match(source, /openAccessibilityLabel: 'Open the about-the-test guide'/);
  assert.match(source, /accessibilityLabel=\{copy\.openAccessibilityLabel\}/);
  assert.doesNotMatch(source, new RegExp(staleGuideLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(source, /Öppna\s+om-[\s\S]*provet-[\s\S]*guiden/);
});

test('exam results include per-question explanations and UHR sources', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /type ExamRouteCopy =/);
  assert.match(source, /const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = \{/);
  assert.match(source, /buildExamReviewItems/);
  assert.match(source, /questionReviewTitle: 'Frågegenomgång'/);
  assert.match(source, /questionReviewTitle: 'Question review'/);
  assert.match(source, /selectedAnswerLabel: 'Valt svar'/);
  assert.match(source, /selectedAnswerLabel: 'Selected answer'/);
  assert.match(source, /correctAnswerLabel: 'Rätt svar'/);
  assert.match(source, /correctAnswerLabel: 'Correct answer'/);
  assert.match(source, /\{copy\.questionReviewTitle\}/);
  assert.match(source, /\{copy\.selectedAnswerLabel\}/);
  assert.match(source, /\{copy\.correctAnswerLabel\}/);
  assert.match(source, /<ExplanationPanel/);
  assert.match(source, /<UHRReferenceCard/);
});

test('English support reaches quiz options, explanations, and exam review text', () => {
  const practiceSource = read('app/(tabs)/practice.tsx');
  const quizSource = read('app/quiz/[sessionId].tsx');
  const examSource = read('app/(tabs)/exam.tsx');
  const answerValidationSource = read('lib/quiz/answerValidation.ts');
  const examGeneratorSource = read('lib/quiz/examGenerator.ts');

  assert.match(
    practiceSource,
    /const language = useSettingsStore\(\(state\) => state\.language\);/,
  );
  assert.match(practiceSource, /<QuestionCard question=\{question\} language=\{language\} \/>/);
  assert.match(practiceSource, /<AudioButton[\s\S]*language=\{language\}[\s\S]*\/>/);
  assert.match(practiceSource, /getAnswerOptionFeedback\([\s\S]*language,[\s\S]*\);/);
  assert.match(practiceSource, /language=\{language\}[\s\S]*option=\{option\}/);
  assert.match(practiceSource, /explanationEn=\{question\.explanationEn\}/);
  assert.match(practiceSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(quizSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(quizSource, /<QuestionCard question=\{question\} language=\{language\} \/>/);
  assert.match(quizSource, /<AudioButton[\s\S]*language=\{language\}[\s\S]*\/>/);
  assert.match(quizSource, /getAnswerOptionFeedback\([\s\S]*language,[\s\S]*\);/);
  assert.match(quizSource, /language=\{language\}[\s\S]*option=\{option\}/);
  assert.match(quizSource, /explanationEn=\{question\.explanationEn\}/);
  assert.match(quizSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(answerValidationSource, /en: \{[\s\S]*correct: 'Correct'/);
  assert.match(answerValidationSource, /correctAnswer: 'Correct answer'/);
  assert.match(answerValidationSource, /wrong: 'Wrong'/);

  assert.match(examSource, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(examSource, /const copy = examRouteCopy\[language\];/);
  assert.match(examSource, /language === 'en' \? option\.textEn : option\.textSv/);
  assert.match(examSource, /getQuestionDisplayText\(question, language\)/);
  assert.match(examSource, /getQuestionDisplayText\(item, language\)/);
  assert.match(
    examSource,
    /language === 'en' \? item\.selectedOptionTextEn : item\.selectedOptionTextSv/,
  );
  assert.match(examSource, /language === 'en' \? chapter\.chapterNameEn : chapter\.chapterNameSv/);
  assert.match(examSource, /answerAccessibilityLabel: \(optionText, questionNumber\) =>/);
  assert.match(examSource, /explanationEn=\{item\.explanationEn\}/);
  assert.match(examSource, /<UHRReferenceCard language=\{language\}/);

  assert.match(examGeneratorSource, /questionEn: question\.questionEn/);
  assert.match(
    examGeneratorSource,
    /selectedOptionTextEn: selectedOption[\s\S]*\? getQuestionOptionText\(selectedOption, 'en'\)/,
  );
  assert.match(
    examGeneratorSource,
    /correctOptionTextEn: correctOption[\s\S]*\? getQuestionOptionText\(correctOption, 'en'\)/,
  );
  assert.match(
    examGeneratorSource,
    /explanationEn: getQuestionExplanationText\(question, 'en', question\.explanationEn\)/,
  );
});

test('exam route exposes page and review section headings as headers', () => {
  const source = read('app/(tabs)/exam.tsx');
  const headerMatches = source.match(/<Text accessibilityRole="header" style=\{styles\./g);

  assert.match(source, /\{copy\.mockExamTitle\}/);
  assert.match(source, /\{copy\.accessTitle\}/);
  assert.match(source, /\{copy\.examResultTitle\}/);
  assert.match(source, /\{copy\.nextExamTitle\}/);
  assert.match(source, /\{copy\.chapterBreakdownTitle\}/);
  assert.match(source, /\{copy\.questionReviewTitle\}/);
  assert.match(source, /\{copy\.progressTitle\}/);
  assert.match(source, /mockExamTitle: 'Övningsprov'/);
  assert.match(source, /mockExamTitle: 'Mock exam'/);
  assert.match(source, /chapterBreakdownTitle: 'Kapitelöversikt'/);
  assert.match(source, /chapterBreakdownTitle: 'Chapter breakdown'/);
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
  assert.match(source, /aria-checked=\{isSelected\}/);
  assert.match(source, /aria-disabled=\{!canSubmit\}/);
  assert.match(
    source,
    /accessibilityLabel=\{copy\.answerAccessibilityLabel\(optionText, index \+ 1\)\}/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.submitAccessibilityLabel\}/);
  assert.match(source, /accessibilityState=\{\{ checked: isSelected \}\}/);
  assert.match(source, /accessibilityState=\{\{ disabled: !canSubmit \}\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('exam results are final after submission', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /resultNote:\s*'Skickade resultat är slutgiltiga/);
  assert.match(source, /resultNote: 'Submitted results are final/);
  assert.match(source, /\{copy\.resultNote\}/);
  assert.doesNotMatch(source, /Back to exam answers/);
  assert.doesNotMatch(source, /Back to answers/);
});

test('exam auto-submits at timeout and explains unanswered scoring', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /shouldAutoSubmitExam/);
  assert.match(source, /setSubmitted\(true\)/);
  assert.match(source, /timeExpiredBadge: 'Tiden gick ut'/);
  assert.match(source, /timeExpiredBadge: 'Time expired'/);
  assert.match(source, /Obesvarade frågor räknas som fel/);
  assert.match(source, /Unanswered questions count as incorrect/);
});

test('exam chapter breakdown uses chapter names instead of raw ids only', () => {
  const source = read('app/(tabs)/exam.tsx');

  assert.match(source, /buildExamChapterBreakdownItems/);
  assert.match(source, /data\/chapters/);
  assert.match(source, /chapter\.chapterNameSv/);
  assert.match(source, /chapter\.chapterNameEn/);
  assert.match(source, /chapter\.chapterId/);
});
