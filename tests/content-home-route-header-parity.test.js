const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { runFocusedValidatorMutation } = require('./helpers/focusedValidatorMutation.cjs');

const repoRoot = path.resolve(__dirname, '..');
const homeRoutePath = 'app/(tabs)/home.tsx';

function parseFocusedHomeRouteSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-home-route-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused home route validation should print JSON summary');
  return JSON.parse(match[0]);
}

function parseFocusedHomeMistakeReviewSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-home-sv-mistake-review-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused home copy validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('home route title and dashboard card headings stay accessible as headers', () => {
  const summary = parseFocusedHomeRouteSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.homeRouteHeadersValidated, 5);
  assert.equal(summary.homeRouteHeaderParityValidated, true);
  assert.equal(summary.homeRouteCopyLabelsValidated, 96);
  assert.equal(summary.homeRouteCopyParityValidated, true);
  assert.match(source, /type HomeCopy =/);
  assert.match(source, /const homeCopy: Record<AppLanguage, HomeCopy>/);
  assert.match(source, /const copy = homeCopy\[language\]/);
  assert.match(source, /computeReadinessFromQuestionProgress/);
  assert.match(
    source,
    /const today = useMemo\(\(\) => new Date\(`\$\{todayKey\}T12:00:00`\), \[todayKey\]\);/,
  );
  assert.match(source, /const completedToday = useMemo\(/);
  assert.match(
    source,
    /const dailyChallenge = useMemo\([\s\S]*buildDailyChallenge\(\{ bank: questions, now: today \}\)/,
  );
  assert.match(
    source,
    /const chapterQuestionIndex = useMemo\(\(\) => buildChapterQuestionIndex\(questions\), \[\]\);/,
  );
  assert.match(
    source,
    /const readinessQuestionBankIndex = useMemo\(\(\) => buildReadinessQuestionBankIndex\(questions\), \[\]\);/,
  );
  assert.match(
    source,
    /findWeakChapterIds\(questions, questionProgress, 0\.6, chapterQuestionIndex\)/,
  );
  assert.match(source, /questionBankIndex: readinessQuestionBankIndex,/);
  assert.match(
    source,
    /const mockExamSessions = useProgressStore\(\(state\) => state\.mockExamSessions\);/,
  );
  assert.match(
    source,
    /const studyPlanTestDateIso = useSettingsStore\(\(state\) => state\.studyPlanTestDateIso\);/,
  );
  assert.match(source, /formatExamDate\(studyPlanDate, language\)/);
  assert.match(source, /daysUntil\(studyPlanDate, today\)/);
  assert.match(source, /Din studieplan/);
  assert.match(source, /Your study plan/);
  assert.match(source, /href="\/study-plan"/);
  assert.match(
    source,
    /accessibilityLabel=\{copy\.studyPlanAccessibilityLabel\(studyPlanSummary\)\}/,
  );
  assert.match(
    source,
    /const streakFreezeState = useProgressStore\(\(state\) => state\.streakFreezeState\);/,
  );
  assert.match(
    source,
    /const setStreakFreezeState = useProgressStore\(\(state\) => state\.setStreakFreezeState\);/,
  );
  assert.match(source, /calculateStreakWithFreeze\(\{/);
  assert.match(source, /freezeBannerCopy\(streakWithFreeze, language\)/);
  assert.match(source, /helper=\{dayStreakHelper\}/);
  assert.match(source, /<Badge tone="warm">\{copy\.streakFreezeBadge\}<\/Badge>/);
  assert.match(source, /\$\{count\} svitskydd redo/);
  assert.match(source, /\$\{count\} streak freeze ready/);
  assert.match(source, /Svitskydd/);
  assert.match(source, /Streak freeze/);
  assert.match(source, /mockExamSessions,/);
  assert.match(source, /const readinessVerdict = copy\.readinessVerdicts\[readiness\.verdict\]/);
  assert.match(source, /Studieöversikt/);
  assert.match(source, /Study dashboard/);
  assert.match(source, /En tydlig väg för svensk samhällskunskap/);
  assert.match(source, /A focused path for Swedish civic knowledge/);
  assert.doesNotMatch(source, /svenska samhällskunskaper|samhällskunskaper/i);
  assert.match(source, /Förberedelsesignal/);
  assert.match(source, /Preparation signal/);
  assert.match(source, /Gå till övningsprovet/);
  assert.match(source, /gå till övningsprovet när steget är klart/);
  assert.doesNotMatch(source, /\bmock\s*-?\s*prov(?:et)?\b/i);
  assert.doesNotMatch(source, /Redoindikator|Readiness indicator|Provredo|Exam readiness/);
  assert.match(source, /<ScreenShell[\s\S]*title=\{copy\.title\}/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.studyLoopTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.goalLabel\}>/);
  assert.match(source, /\{copy\.dailyGoalTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.readinessTitle\}>/);
  assert.match(source, /\{copy\.readinessTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.feedbackTitle\}>/);
  assert.match(source, /\{copy\.feedbackTitle\}/);
  assert.doesNotMatch(
    source,
    /<Text style=\{styles\.(?:goalLabel|readinessTitle|feedbackTitle)\}>/,
  );
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
});

test('home source-trust row links learners to sources without unsupported rating copy', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const socialProofRow = fs.readFileSync(
    path.join(repoRoot, 'components/ui/SocialProofRow.tsx'),
    'utf8',
  );

  assert.match(homeSource, /<SocialProofRow language=\{language\} \/>/);
  assert.match(socialProofRow, /import \{ RouteLink \} from '\.\/RouteLink';/);
  assert.doesNotMatch(socialProofRow, /from 'expo-router';/);
  assert.match(socialProofRow, /href="\/sources"/);
  assert.match(socialProofRow, /<RouteLink[\s\S]*accessibilityLabel=\{rowAccessibilityLabel\}/);
  assert.match(socialProofRow, /Källor och transparens/);
  assert.match(socialProofRow, /Sources and transparency/);
  assert.match(socialProofRow, /Öppna källor och transparens/);
  assert.match(socialProofRow, /Open sources and transparency/);
  assert.match(socialProofRow, /useThemeColors\(\)/);
  assert.match(socialProofRow, /function createStyles\(themeColors: ThemeColors\)/);
  assert.doesNotMatch(socialProofRow, /Excellent|Utmärkt|5 of 5|5 av 5|★★★★★/);
});

test('home route copy parity rejects unreachable flashcard promises', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace(
        'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
        'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal. Flashcards kommer snart.',
      ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route must not advertise flashcards until the feature is reachable/,
  );
});

test('home route copy parity rejects harsh Swedish mistake-review wording', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-sv-mistake-review-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source
        .replace(
          'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
          'Växla mellan tidsatta övningsprov, bokmärken, felspårning, ljud och förberedelsesignal.',
        )
        .replace('genomgång av frågor du missat', 'repetition av misstag'),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route Swedish missed-question review copy must use natural learner wording/,
  );
});

test('home route copy parity accepts natural Swedish missed-question review wording', () => {
  const summary = parseFocusedHomeMistakeReviewSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.equal(summary.homeRouteSwedishMistakeReviewCopyNaturalnessValidated, true);
  assert.match(source, /genomgång av frågor du missat/);
  assert.match(source, /missade frågor/);
  assert.doesNotMatch(source, /felspårning|repetition av misstag|upprepning av misstag/i);
});

test('home route copy parity rejects internal benchmark phrases in learner copy', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace("'Smart study habits'", JSON.stringify('Optimized study loop')),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route learner copy must not expose internal benchmark phrase/,
  );
});

test('home route copy parity rejects unsupported readiness prediction wording', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source
        .replace('Preparation signal', 'Readiness indicator')
        .replace('Förberedelsesignal', 'Redoindikator'),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route preparation signal copy must not expose official-readiness wording/,
  );
});

test('home route copy parity rejects Swedish samhällskunskaper plural subject wording', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace(
        'const homeCopy: Record<AppLanguage, HomeCopy> = {',
        'const homeCopy: Record<AppLanguage, HomeCopy> = { /* svenska samhällskunskaper */',
      ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route Swedish subject copy must use natural singular samhällskunskap wording/,
  );
});

test('home route copy parity rejects guided path chapter drift', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source
        .replace("chapterRange: 'Kapitel 10-13'", "chapterRange: 'Kapitel 10-99'")
        .replace("chapterRange: 'Chapters 10-13'", "chapterRange: 'Chapters 10-99'"),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route guided path must finish with chapters 10-13/,
  );
});

test('home route copy parity rejects Swedish mockprov wording', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-sv-native-mock-exam-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source
        .replace('Gå till övningsprovet', 'Gå till mockprov')
        .replaceAll(
          'gå till övningsprovet när steget är klart',
          'gå till mockprov när steget är klart',
        ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route Swedish native copy must use övningsprov/,
  );
});

test('home route copy parity rejects duplicate timed-exam accessible labels', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source
        .replace(
          'Starta ett tidsatt övningsprov från snabbåtgärderna',
          'Starta ett tidsatt övningsprov från kortet Förberedelsesignal',
        )
        .replace(
          'Start a timed practice exam from quick actions',
          'Start a timed practice exam from the Preparation signal card',
        ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route is missing .*quick actions|home route is missing .*snabbåtgärderna/,
  );
});

test('home route header parity rejects unheadered dashboard card titles', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace(
        '<Text accessibilityRole="header" style={styles.feedbackTitle}>',
        '<Text style={styles.feedbackTitle}>',
      ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route card headings must expose accessibilityRole="header"/,
  );
});

test('home route copy parity rejects bypassing the settings language', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace('const copy = homeCopy[language];', 'const copy = homeCopy.en;'),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route must select copy from settings language/,
  );
});

test('home route copy parity rejects missing Swedish shell copy', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) => source.replace("'Starta övning'", "'Start practice'"),
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /home route is missing sv copy/);
});

test('home route copy parity rejects synthetic learner feedback copy', () => {
  const result = runFocusedValidatorMutation({
    focusFlag: '--focus-home-route-copy',
    targetFile: homeRoutePath,
    mutateSource: (source) =>
      source.replace(
        'Smart study habits',
        ['Smart study habits with simulated', ' learners'].join(''),
      ),
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /home route contains synthetic learner feedback copy/,
  );
});
