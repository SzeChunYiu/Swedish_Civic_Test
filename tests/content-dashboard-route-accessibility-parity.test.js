const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const sourcePaths = {
  activity: 'components/dashboard/ActivityHeatmap.tsx',
  dashboard: 'app/dashboard.tsx',
  chapters: 'components/dashboard/PerChapterProgressBars.tsx',
  e2e: 'tests/e2e/dashboard-route.spec.ts',
  history: 'components/dashboard/MockExamHistoryCard.tsx',
  sparkline: 'components/dashboard/StreakXpSparkline.tsx',
  stats: 'lib/learning/dashboardStats.ts',
  studyPlan: 'app/study-plan.tsx',
};

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadSources(overrides = {}) {
  return Object.fromEntries(
    Object.entries(sourcePaths).map(([key, relativePath]) => [
      key,
      overrides[key] ?? read(relativePath),
    ]),
  );
}

function extractNamedStyle(source, styleName) {
  const match = source.match(new RegExp(`${styleName}:\\s*\\{[\\s\\S]*?\\n\\s*\\},`));
  assert.ok(match, `${styleName} style must exist`);
  return match[0];
}

function assertDashboardAccessibilitySeparation(sources) {
  assert.doesNotMatch(
    sources.dashboard,
    /createDashboardProEntitlements|advancedAnalyticsUnlocked|proAnalyticsPlaceholder|hasProEntitlement|ProTierEntitlements/,
    'Dashboard must not keep unreachable Pro entitlement placeholders in the free route',
  );
  assert.doesNotMatch(
    sources.dashboard,
    /display:\s*'none'/,
    'Dashboard must not hide dead placeholder surfaces',
  );
  assert.match(
    sources.dashboard,
    /const summaryAccessibilityLabel = copy\.summaryAccessibilityLabel\(/,
    'Dashboard must compute a standalone summary label',
  );
  assert.match(
    sources.dashboard,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{summaryAccessibilityLabel\}\s*<\/Text>/,
    'Dashboard summary label must render outside the visual card',
  );
  assert.match(
    sources.e2e,
    /seedNonEmptyDashboardProgress/,
    'Dashboard e2e must keep a seeded non-empty progress fixture',
  );
  assert.match(
    sources.e2e,
    /currentProgressStateStorageKey/,
    'Dashboard e2e must write the current progress storage key through the shared browser helper',
  );
  assert.match(
    sources.e2e,
    /answerHistory:\s*\[/,
    'Dashboard e2e seed must include dated answer history',
  );
  assert.match(
    sources.e2e,
    /questionProgress:\s*\{/,
    'Dashboard e2e seed must include hydrated question progress',
  );
  assert.match(
    sources.e2e,
    /totalXp:\s*420/,
    'Dashboard e2e seed must include XP for the non-empty sparkline/level surface',
  );
  assert.match(
    sources.e2e,
    /streakFreezeState:\s*\{/,
    'Dashboard e2e seed must include streak state for the non-empty streak surface',
  );
  assert.match(
    sources.e2e,
    /mockExamSessions:\s*\[/,
    'Dashboard e2e seed must include a valid mock exam session',
  );
  assert.match(
    sources.e2e,
    /expectNonEmptyProgressVisible/,
    'Dashboard e2e must assert the non-empty rendered dashboard surface',
  );
  assert.match(
    sources.dashboard,
    /<Card[\s\S]{0,180}style=\{styles\.summaryCard\}>[\s\S]*?<Link[\s\S]*?accessibilityLabel=\{copy\.homeLinkAccessibilityLabel\}[\s\S]*?accessibilityRole="link"/,
    'Dashboard Home link must remain an independent labelled link inside the visual card',
  );
  assert.match(
    sources.dashboard,
    /const studyPlanTestDateIso = useSettingsStore\(\(state\) => state\.studyPlanTestDateIso\);/,
    'Dashboard must read the locally stored study-plan test date',
  );
  assert.match(
    sources.dashboard,
    /href="\/study-plan"/,
    'Dashboard study-plan card must link to the detail route',
  );
  assert.match(
    sources.dashboard,
    /accessibilityLabel=\{copy\.studyPlan\.accessibilityLabel\(studyPlanSummary\)\}/,
    'Dashboard study-plan link must carry a route-specific label',
  );
  assert.match(
    sources.studyPlan,
    /useProLifetimeEntitlements\(\)/,
    'Study-plan detail route must read Pro Lifetime entitlements',
  );
  assert.match(
    sources.studyPlan,
    /hasProEntitlement\(entitlements\)/,
    'Study-plan detail route must keep Pro gating in the detail route',
  );
  assert.match(
    sources.studyPlan,
    /isProRuntimeScopeEnabled\(\)/,
    'Study-plan detail route must respect the release scope gate',
  );
  assert.match(
    sources.studyPlan,
    /generateStudyPlanWeeklyBreakdown\(/,
    'Study-plan detail route must render the generated weekly breakdown',
  );
  assert.match(sources.studyPlan, /questionTargetMet/);
  assert.match(sources.studyPlan, /mockTargetMet/);
  assert.doesNotMatch(
    sources.studyPlan,
    /\b(behind|missed days|guilt|skuld|efter)\b/i,
    'Study-plan detail copy must avoid guilt or behind-language',
  );
  assert.doesNotMatch(
    sources.dashboard,
    /<Card[\s\S]{0,180}accessibilityLabel=\{summaryAccessibilityLabel\}[\s\S]{0,900}<Link/,
    'Dashboard summary Card must not group the Home link',
  );
  assert.doesNotMatch(
    sources.dashboard,
    /<Card[\s\S]{0,180}accessibilityRole="summary"[\s\S]{0,900}<Link/,
    'Dashboard summary Card must not expose a grouped summary role around the Home link',
  );

  assert.match(
    sources.chapters,
    /<Card[\s\S]{0,120}style=\{styles\.card\}>/,
    'PerChapterProgressBars must keep a visual card surface',
  );
  assert.match(
    sources.chapters,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{accessibilityLabel\}\s*<\/Text>/,
    'PerChapterProgressBars must expose a standalone section summary',
  );
  assert.match(
    sources.chapters,
    /<View[\s\S]*?aria-label=\{copy\.sortGroupAccessibilityLabel\}[\s\S]*?accessibilityLabel=\{copy\.sortGroupAccessibilityLabel\}[\s\S]*?accessibilityRole="radiogroup"[\s\S]*?style=\{styles\.sortRow\}/,
    'PerChapterProgressBars sort control must expose a localized radiogroup',
  );
  assert.match(
    sources.chapters,
    /<Pressable[\s\S]*?aria-checked=\{selected\}[\s\S]*?accessibilityLabel=\{copy\.sortAccessibilityLabel\(label\)\}[\s\S]*?accessibilityRole="radio"[\s\S]*?accessibilityState=\{\{ checked: selected \}\}/,
    'PerChapterProgressBars sort options must expose radio checked semantics',
  );
  assert.match(
    sources.chapters,
    /function getSortKeyboardTarget\([\s\S]*?ArrowRight[\s\S]*?ArrowDown[\s\S]*?ArrowLeft[\s\S]*?ArrowUp[\s\S]*?Home[\s\S]*?End/,
    'PerChapterProgressBars sort radios must map arrow/Home/End keys',
  );
  assert.match(
    sources.chapters,
    /const sortOptionRefs = useRef<Record<ChapterSortMode, FocusableElement \| null>>/,
    'PerChapterProgressBars sort radios must keep focus refs',
  );
  assert.match(
    sources.chapters,
    /sortOptionRefs\.current\[nextMode\]\?\.focus\?\.\(\)/,
    'PerChapterProgressBars sort keyboard selection must move focus to the checked radio',
  );
  assert.match(
    sources.chapters,
    /onKeyDown: handleSortKeyDown[\s\S]*?tabIndex: selected \? 0 : -1/,
    'PerChapterProgressBars sort radios must expose web arrow-key handling and roving tabIndex',
  );
  assert.doesNotMatch(
    sources.chapters,
    /accessibilityRole="button"[\s\S]{0,240}accessibilityState=\{\{\s*selected\s*\}\}/,
    'PerChapterProgressBars sort options must not remain selected buttons',
  );
  assert.doesNotMatch(
    sources.chapters,
    /aria-selected=\{selected\}|accessibilityState=\{\{\s*selected\s*\}\}/,
    'PerChapterProgressBars sort options must not leak selected state',
  );
  assert.match(
    sources.chapters,
    /<Link[\s\S]*?accessibilityLabel=\{copy\.linkLabel\(chapterName\)\}[\s\S]*?accessibilityRole="link"/,
    'PerChapterProgressBars chapter rows must remain independently reachable links',
  );
  assert.match(
    sources.chapters,
    /const coverageGap = 1 - ratio\(bar\.coverage\);/,
    'PerChapterProgressBars weakness sorting must use bounded coverage ratios',
  );
  assert.doesNotMatch(
    sources.chapters,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/,
    'PerChapterProgressBars parent Card must not group sort buttons or chapter links',
  );
  assert.match(
    sources.stats,
    /function normalizedChapterQuestionCount\(questionCount: number\): number \{[\s\S]*Number\.isInteger\(questionCount\)[\s\S]*questionCount >= 0/,
    'Dashboard per-chapter stats must require finite non-negative integer question counts',
  );
  assert.match(
    sources.stats,
    /coverage:\s*safeRatio\(bucket\.questionIds\.size, questionCount\)/,
    'Dashboard per-chapter coverage must clamp malformed or undersized totals',
  );
  assert.match(
    sources.stats,
    /answer\.isCorrect === true/,
    'Dashboard selectors must count correct answers only from strict boolean true',
  );
  assert.match(
    sources.chapters,
    /const coverageGap = 1 - ratio\(bar\.coverage\);/,
    'PerChapterProgressBars weakness sort must sanitize coverage before ranking',
  );

  assert.match(
    sources.activity,
    /<Card[\s\S]{0,120}style=\{styles\.card\}>/,
    'ActivityHeatmap must keep a visual card surface',
  );
  assert.match(
    sources.activity,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{accessibilityLabel\}\s*<\/Text>/,
    'ActivityHeatmap must expose a standalone chart summary',
  );
  assert.match(
    sources.activity,
    /<ScrollView[\s\S]*?accessibilityLabel=\{accessibilityLabel\}[\s\S]*?accessibilityRole="summary"[\s\S]*?aria-label=\{accessibilityLabel\}[\s\S]*?horizontal/,
    'ActivityHeatmap ScrollView must keep its localized chart summary',
  );
  assert.match(
    sources.activity,
    /accessibilityLabel=\{copy\.dayLabel\(bin\.date, bin\.count\)\}/,
    'ActivityHeatmap cells must use localized per-day answer labels',
  );
  assert.match(
    sources.dashboard,
    /dayLabel: \(date, answers\) => `\$\{date\}: \$\{formatDashboardAnswerCount\('sv', answers\)\}`/,
    'Dashboard Swedish activity copy must label heatmap cells as answers',
  );
  assert.match(
    sources.dashboard,
    /dayLabel: \(date, answers\) => `\$\{date\}: \$\{formatDashboardAnswerCount\('en', answers\)\}`/,
    'Dashboard English activity copy must label heatmap cells as answers',
  );
  assert.match(
    sources.activity,
    /legend:\s*\{[\s\S]*?high: string;[\s\S]*?low: string;[\s\S]*?medium: string;[\s\S]*?none: string;[\s\S]*?title: string;/,
    'ActivityHeatmap copy must include visible legend labels',
  );
  assert.match(
    sources.activity,
    /const legendItems: \{ label: string; style: HeatStyle \}\[] = \[/,
    'ActivityHeatmap must derive visible legend items from localized copy',
  );
  assert.match(sources.activity, /copy\.legend\.none/);
  assert.match(sources.activity, /copy\.legend\.low/);
  assert.match(sources.activity, /copy\.legend\.medium/);
  assert.match(sources.activity, /copy\.legend\.high/);
  assert.match(
    sources.activity,
    /<View style=\{styles\.legend\}>[\s\S]*?<Text style=\{styles\.legendTitle\}>\{copy\.legend\.title\}<\/Text>[\s\S]*?legendItems\.map/,
    'ActivityHeatmap must render a visible heatmap legend',
  );
  assert.match(
    sources.activity,
    /style=\{\[styles\.legendSwatch, styles\[item\.style\]\]\}/,
    'ActivityHeatmap legend swatches must reuse tokenized heat styles',
  );
  assert.match(
    sources.activity,
    /<Text style=\{styles\.legendText\}>\{item\.label\}<\/Text>/,
    'ActivityHeatmap legend must include non-color text cues',
  );
  assert.doesNotMatch(
    sources.activity,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/,
    'ActivityHeatmap parent Card must not group the horizontal ScrollView',
  );
  assert.match(
    sources.dashboard,
    /title: 'Aktivitetsskala'/,
    'Swedish heatmap legend title is required',
  );
  assert.match(sources.dashboard, /none: 'Inga svar'/, 'Swedish heatmap zero label is required');
  assert.match(sources.dashboard, /low: 'Låg aktivitet'/, 'Swedish heatmap low label is required');
  assert.match(
    sources.dashboard,
    /medium: 'Medelaktivitet'/,
    'Swedish heatmap medium label is required',
  );
  assert.match(
    sources.dashboard,
    /high: 'Hög aktivitet'/,
    'Swedish heatmap high label is required',
  );
  assert.match(
    sources.dashboard,
    /title: 'Activity scale'/,
    'English heatmap legend title is required',
  );
  assert.match(sources.dashboard, /none: 'No answers'/, 'English heatmap zero label is required');
  assert.match(sources.dashboard, /low: 'Low activity'/, 'English heatmap low label is required');
  assert.match(
    sources.dashboard,
    /medium: 'Medium activity'/,
    'English heatmap medium label is required',
  );
  assert.match(
    sources.dashboard,
    /high: 'High activity'/,
    'English heatmap high label is required',
  );

  const legendSwatchStyle = extractNamedStyle(sources.activity, 'legendSwatch');
  assert.match(
    legendSwatchStyle,
    /height: space\[[^\]]+\]/,
    'ActivityHeatmap legend swatches must use token height',
  );
  assert.match(
    legendSwatchStyle,
    /width: space\[[^\]]+\]/,
    'ActivityHeatmap legend swatches must use token width',
  );
  assert.doesNotMatch(
    legendSwatchStyle,
    /backgroundColor|#[0-9a-fA-F]{6}|rgba?\(|height:\s*\d|width:\s*\d/,
    'ActivityHeatmap legend swatches must avoid hardcoded color or size values',
  );
  for (const styleName of ['heatZero', 'heatSoft', 'heatMedium', 'heatStrong']) {
    assert.match(
      sources.activity,
      new RegExp(`${styleName}:\\s*\\{[\\s\\S]*?backgroundColor: themeColors\\.`),
      `${styleName} must keep a theme-token background color`,
    );
  }

  assert.match(
    sources.sparkline,
    /<Card accessibilityLabel=\{accessibilityLabel\} accessibilityRole="summary" style=\{styles\.card\}>/,
    'Non-interactive sparkline can keep a concise grouped summary',
  );
  assert.match(sources.sparkline, /copy\.emptyState/);
  assert.match(sources.sparkline, /aria-label=\{accessibilityLabel\}/);
  assert.match(
    sources.sparkline,
    /dayLabel: \(date: string, xp: number\) => string;/,
    'StreakXpSparkline copy must include localized per-day XP labels',
  );
  assert.match(
    sources.sparkline,
    /accessibilityLabel=\{copy\.dayLabel\(point\.date, point\.xp\)\}/,
    'StreakXpSparkline day tracks must use localized per-day XP labels',
  );
  assert.doesNotMatch(
    sources.sparkline,
    /accessibilityLabel=\{`\$\{point\.date\}: \$\{point\.xp\}`\}/,
    'StreakXpSparkline must not expose raw numeric-only per-day labels',
  );
  assert.match(
    sources.sparkline,
    /point\.xp > 0 \? \([\s\S]*<View style=\{\[styles\.barFill, \{ height: `\$\{fillPercent\}%` \}\]\} \/>[\s\S]*\) : null/,
    'StreakXpSparkline must leave zero-XP tracks empty while keeping positive bars visible',
  );
  assert.match(
    sources.dashboard,
    /dayLabel: \(date, xp\) => `Den \$\{date\}: \$\{xp\} XP`/,
    'Dashboard Swedish XP sparkline labels must include the XP unit in natural wording',
  );
  assert.match(
    sources.dashboard,
    /dayLabel: \(date, xp\) => `\$\{xp\} XP on \$\{date\}`/,
    'Dashboard English XP sparkline labels must include the XP unit in natural wording',
  );

  assert.match(
    sources.dashboard,
    /<MockExamHistoryCard[\s\S]*?bestScore=\{summary\.bestMockScore\}[\s\S]*?copy=\{copy\.mockHistory\}[\s\S]*?entries=\{mockHistoryEntries\}/,
    'Dashboard must render mock history from selector output and summary best score',
  );
  assert.match(
    sources.history,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{accessibilityLabel\}\s*<\/Text>/,
    'MockExamHistoryCard must expose a standalone section summary',
  );
  assert.match(
    sources.history,
    /<Card style=\{styles\.card\}>/,
    'MockExamHistoryCard visual card must not group the Exam link',
  );
  assert.match(
    sources.history,
    /<Link[\s\S]*?accessibilityLabel=\{copy\.examLinkAccessibilityLabel\}[\s\S]*?accessibilityRole="link"[\s\S]*?href="\/exam"/,
    'MockExamHistoryCard must keep an independent labelled Exam link',
  );
  assert.doesNotMatch(
    sources.history,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}[\s\S]{0,1200}<Link/,
    'MockExamHistoryCard Card must not group the Exam link',
  );
  assert.match(sources.history, /formatDuration\(entry\.durationMs\)/);
  assert.match(
    sources.history,
    /const trendEntries = scoredEntries\.slice\(-trendMockLimit\);/,
    'MockExamHistoryCard trend must use the latest bounded scored entries',
  );
  assert.match(
    sources.history,
    /const hasTrend = trendEntries\.length >= 2;/,
    'MockExamHistoryCard must render trend chrome only for multiple scored attempts',
  );
  assert.match(
    sources.history,
    /accessibilityLabel=\{copy\.trendPointAccessibilityLabel\(/,
    'MockExamHistoryCard trend bars must keep localized per-attempt labels',
  );
  assert.match(
    sources.history,
    /const completedDate = copy\.formatCompletedDate\(entry\.completedAt\);/,
    'MockExamHistoryCard trend and recent labels must format completed dates before display',
  );
  assert.doesNotMatch(
    sources.history,
    /completedAt\.slice\(0,\s*10\)|function completedDate/,
    'MockExamHistoryCard accessibility labels must not expose raw completedAt date slices',
  );
  assert.match(
    sources.history,
    /<Text style=\{styles\.trendSummary\}>\s*\{trendSummary\}\s*<\/Text>/,
    'MockExamHistoryCard trend must expose a hidden trend summary',
  );
  assert.match(
    sources.history,
    /height: `\$\{Math\.max\(8, scorePercent\)\}%`/,
    'MockExamHistoryCard trend bars must be bounded by score percent',
  );
  assert.match(sources.history, /scoreTrendChart/);
  assert.match(sources.history, /backgroundColor: themeColors\.accent/);
  assert.match(sources.dashboard, /title: 'Övningsprov över tid'/);
  assert.match(sources.dashboard, /title: 'Mock exam history'/);
  assert.match(sources.dashboard, /trendLabel: 'Resultattrend'/);
  assert.match(sources.dashboard, /trendLabel: 'Score trend'/);
  assert.match(sources.dashboard, /examLinkAccessibilityLabel: 'Öppna övningsprovet'/);
  assert.match(sources.dashboard, /examLinkAccessibilityLabel: 'Open the mock exam'/);
  assert.match(
    sources.dashboard,
    /sortGroupAccessibilityLabel: 'Sortera kapitelframsteg'/,
    'Swedish chapter-progress sort group label is required',
  );
  assert.match(
    sources.dashboard,
    /sortGroupAccessibilityLabel: 'Sort chapter progress'/,
    'English chapter-progress sort group label is required',
  );

  assert.match(sources.dashboard, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.chapters, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.activity, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.history, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.history, /trendSummary:\s*\{[\s\S]*?position: 'absolute'/);
}

test('dashboard accessibility summaries do not group interactive descendants', () => {
  assertDashboardAccessibilitySeparation(loadSources());
});

test('dashboard accessibility parity rejects a grouped Home-link summary card', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        dashboard: sources.dashboard.replace(
          '<Card style={styles.summaryCard}>',
          '<Card accessibilityLabel={summaryAccessibilityLabel} accessibilityRole="summary" style={styles.summaryCard}>',
        ),
      }),
    /Dashboard summary Card must not group the Home link/,
  );
});

test('dashboard accessibility parity rejects grouped chapter controls', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        chapters: sources.chapters.replace(
          '<Card style={styles.card}>',
          '<Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>',
        ),
      }),
    /PerChapterProgressBars parent Card must not group sort buttons or chapter links/,
  );
});

test('dashboard accessibility parity rejects an unlabelled chapter sort group', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        chapters: sources.chapters.replace(
          /\s+aria-label=\{copy\.sortGroupAccessibilityLabel\}\n\s+accessibilityLabel=\{copy\.sortGroupAccessibilityLabel\}\n\s+accessibilityRole="radiogroup"\n/,
          '\n',
        ),
      }),
    /PerChapterProgressBars sort control must expose a localized radiogroup/,
  );
});

test('dashboard accessibility parity rejects selected-button chapter sort controls', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        chapters: sources.chapters
          .replace('aria-checked={selected}', 'aria-selected={selected}')
          .replace('accessibilityRole="radio"', 'accessibilityRole="button"')
          .replace(
            'accessibilityState={{ checked: selected }}',
            'accessibilityState={{ selected }}',
          ),
      }),
    /PerChapterProgressBars sort options must expose radio checked semantics|PerChapterProgressBars sort options must not remain selected buttons|PerChapterProgressBars sort options must not leak selected state/,
  );
});

test('dashboard accessibility parity rejects chapter sort radios without keyboard navigation', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        chapters: sources.chapters
          .replace('onKeyDown: handleSortKeyDown', 'onPressIn: undefined')
          .replace('tabIndex: selected ? 0 : -1', 'tabIndex: 0')
          .replace('sortOptionRefs.current[nextMode]?.focus?.();', ''),
      }),
    /PerChapterProgressBars sort keyboard selection must move focus to the checked radio|PerChapterProgressBars sort radios must expose web arrow-key handling and roving tabIndex/,
  );
});

test('dashboard accessibility parity rejects grouped heatmap scrolling', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        activity: sources.activity.replace(
          '<Card style={styles.card}>',
          '<Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>',
        ),
      }),
    /ActivityHeatmap parent Card must not group the horizontal ScrollView/,
  );
});

test('dashboard accessibility parity rejects an unlabelled heatmap ScrollView', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        activity: sources.activity.replace(
          /\s+accessibilityLabel=\{accessibilityLabel\}\n\s+accessibilityRole="summary"\n\s+aria-label=\{accessibilityLabel\}\n/,
          '\n',
        ),
      }),
    /ActivityHeatmap ScrollView must keep its localized chart summary/,
  );
});

test('dashboard accessibility parity rejects grouped mock history links', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        history: sources.history.replace(
          '<Card style={styles.card}>',
          '<Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>',
        ),
      }),
    /MockExamHistoryCard visual card must not group the Exam link/,
  );
});

test('dashboard accessibility parity rejects unlabelled mock history trend bars', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        history: sources.history.replace(
          'accessibilityLabel={copy.trendPointAccessibilityLabel(',
          'accessibilityLabel={String(',
        ),
      }),
    /trend bars must keep localized per-attempt labels/,
  );
});

test('dashboard accessibility parity rejects missing mock history trend summary', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        history: sources.history.replace(
          '<Text style={styles.trendSummary}>{trendSummary}</Text>',
          '',
        ),
      }),
    /trend must expose a hidden trend summary/,
  );
});

test('dashboard accessibility parity rejects a missing visible heatmap legend', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        activity: sources.activity.replace('<View style={styles.legend}>', '<View>'),
      }),
    /ActivityHeatmap must render a visible heatmap legend/,
  );
});

test('dashboard accessibility parity rejects missing localized legend copy', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        dashboard: sources.dashboard.replace("high: 'High activity',", "high: 'High',"),
      }),
    /English heatmap high label is required/,
  );
});

test('dashboard accessibility parity rejects hardcoded heatmap legend swatch sizing', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertDashboardAccessibilitySeparation({
        ...sources,
        activity: sources.activity.replace('height: space[1.5],', 'height: 12,'),
      }),
    /ActivityHeatmap legend swatches must use token height/,
  );
});
