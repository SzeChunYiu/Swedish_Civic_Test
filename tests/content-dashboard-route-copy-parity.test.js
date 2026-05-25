const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const sourcePaths = {
  dashboard: 'app/dashboard.tsx',
  dashboardSummaryCopy: 'lib/learning/dashboardSummaryCopy.ts',
  dashboardE2e: 'tests/e2e/dashboard-route.spec.ts',
  dashboardDateFormat: 'lib/learning/dashboardDateFormat.ts',
  history: 'components/dashboard/MockExamHistoryCard.tsx',
  profile: 'app/(tabs)/profile.tsx',
  uiEffects: 'scripts/ui-effects.test.js',
};

function loadSources(overrides = {}) {
  return Object.fromEntries(
    Object.entries(sourcePaths).map(([key, relativePath]) => [
      key,
      overrides[key] ?? read(relativePath),
    ]),
  );
}

function loadTs(relativePath) {
  const source = read(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', output)(mod, mod.exports);
  return mod.exports;
}

function assertNaturalSwedishDashboardCopy(sources) {
  const learnerAndRenderedCopy = [sources.dashboard, sources.profile, sources.dashboardE2e].join(
    '\n',
  );

  assert.doesNotMatch(
    learnerAndRenderedCopy,
    /Kapitelprogress|kapitelprogress|XP-linjen/,
    'dashboard/profile copy and guards must not pin Swenglish dashboard terms',
  );
  assert.match(sources.dashboard, /title: 'Kapitelframsteg'/);
  assert.match(
    sources.dashboard,
    /emptyState: 'När du har svarat på frågor visas dina kapitelframsteg här\.'/,
  );
  assert.match(sources.dashboard, /emptyState: 'XP-kurvan visas när du börjar få rätt svar\.'/);
  assert.match(
    sources.profile,
    /dashboardSubtitle: 'Aktivitet, kapitelframsteg och XP visas på en egen sida\.'/,
  );
  assert.match(sources.uiEffects, /Aktivitet, kapitelframsteg och XP visas på en egen sida/);
  assert.match(sources.dashboardE2e, /chapterProgressTitle: 'Kapitelframsteg'/);
  assert.match(sources.dashboard, /title: 'Progress dashboard'/);
  assert.match(sources.dashboard, /title: 'Chapter progress'/);
  assert.match(sources.dashboard, /title: 'Streak and XP'/);
  assert.match(sources.dashboard, /title: 'Övningsprov över tid'/);
  assert.match(sources.dashboard, /title: 'Mock exam history'/);
  assert.match(sources.dashboard, /trendLabel: 'Resultattrend'/);
  assert.match(sources.dashboard, /trendLabel: 'Score trend'/);
  assert.match(sources.dashboard, /procentenheter/);
  assert.match(sources.dashboard, /recent scored/);
  assert.match(sources.dashboard, /examLink: 'Gå till övningsprov'/);
  assert.match(sources.dashboard, /examLink: 'Go to mock exam'/);
  assert.match(sources.dashboard, /emptyState:\s*'Genomför ett övningsprov/);
  assert.match(sources.dashboard, /emptyState:\s*'Finish a mock exam/);
  assert.match(sources.dashboardE2e, /mockHistoryTitle: 'Övningsprov över tid'/);
  assert.match(sources.dashboardE2e, /mockHistoryTitle: 'Mock exam history'/);
  assert.match(sources.dashboardE2e, /mockHistoryTrendLabel: 'Resultattrend'/);
  assert.match(sources.dashboardE2e, /mockHistoryTrendLabel: 'Score trend'/);
}

function assertDashboardSummaryPluralization() {
  const {
    formatDashboardActiveDayCount,
    formatDashboardAnswerCount,
    formatDashboardMockExamCount,
    formatDashboardStreakCount,
    formatDashboardSummaryAccessibilityLabel,
    formatDashboardSummaryLine,
  } = loadTs('lib/learning/dashboardSummaryCopy.ts');

  const cases = [
    {
      accessibilityLabel:
        'Framstegsöversikt: 0 svar den här veckan, 0 kapitel provade, 0 olösta misstag.',
      language: 'sv',
      line: '0 svar den här veckan · 0 kapitel provade · 0 olösta misstag',
      values: [0, 0, 0],
    },
    {
      accessibilityLabel:
        'Framstegsöversikt: 1 svar den här veckan, 1 kapitel provat, 1 olöst misstag.',
      language: 'sv',
      line: '1 svar den här veckan · 1 kapitel provat · 1 olöst misstag',
      values: [1, 1, 1],
    },
    {
      accessibilityLabel:
        'Framstegsöversikt: 2 svar den här veckan, 2 kapitel provade, 2 olösta misstag.',
      language: 'sv',
      line: '2 svar den här veckan · 2 kapitel provade · 2 olösta misstag',
      values: [2, 2, 2],
    },
    {
      accessibilityLabel:
        'Progress dashboard: 0 answers this week, 0 chapters tried, 0 unresolved mistakes.',
      language: 'en',
      line: '0 answers this week · 0 chapters tried · 0 unresolved mistakes',
      values: [0, 0, 0],
    },
    {
      accessibilityLabel:
        'Progress dashboard: 1 answer this week, 1 chapter tried, 1 unresolved mistake.',
      language: 'en',
      line: '1 answer this week · 1 chapter tried · 1 unresolved mistake',
      values: [1, 1, 1],
    },
    {
      accessibilityLabel:
        'Progress dashboard: 2 answers this week, 2 chapters tried, 2 unresolved mistakes.',
      language: 'en',
      line: '2 answers this week · 2 chapters tried · 2 unresolved mistakes',
      values: [2, 2, 2],
    },
  ];

  for (const { accessibilityLabel, language, line, values } of cases) {
    assert.equal(formatDashboardSummaryLine(language, ...values), line);
    assert.equal(formatDashboardSummaryAccessibilityLabel(language, ...values), accessibilityLabel);
  }

  assert.equal(formatDashboardAnswerCount('sv', 1), '1 svar');
  assert.equal(formatDashboardAnswerCount('en', 1), '1 answer');
  assert.equal(formatDashboardAnswerCount('en', 2), '2 answers');
  assert.equal(formatDashboardActiveDayCount('sv', 1), '1 aktiv dag');
  assert.equal(formatDashboardActiveDayCount('sv', 2), '2 aktiva dagar');
  assert.equal(formatDashboardActiveDayCount('en', 1), '1 active day');
  assert.equal(formatDashboardActiveDayCount('en', 2), '2 active days');
  assert.equal(formatDashboardMockExamCount('sv', 1), '1 övningsprov');
  assert.equal(formatDashboardMockExamCount('en', 1), '1 mock exam');
  assert.equal(formatDashboardMockExamCount('en', 2), '2 mock exams');
  assert.equal(formatDashboardStreakCount('sv', 1), '1 dags svit');
  assert.equal(formatDashboardStreakCount('sv', 2), '2 dagars svit');
  assert.equal(formatDashboardStreakCount('en', 1), '1-day streak');
  assert.equal(formatDashboardStreakCount('en', 2), '2-day streak');
}

function assertLocalizedMockHistoryDates(sources) {
  assert.match(sources.dashboard, /formatDashboardCompletedDate\(completedAt, 'sv'\)/);
  assert.match(sources.dashboard, /formatDashboardCompletedDate\(completedAt, 'en'\)/);
  assert.match(sources.history, /formatCompletedDate: \(completedAt: string\) => string;/);
  assert.match(sources.history, /copy\.formatCompletedDate\(entry\.completedAt\)/);
  assert.doesNotMatch(
    sources.history,
    /completedAt\.slice\(0,\s*10\)|function completedDate/,
    'MockExamHistoryCard must not expose raw completedAt date slices',
  );
  assert.match(sources.dashboardDateFormat, /'maj'/);
  assert.match(sources.dashboardDateFormat, /'May'/);
  assert.match(sources.dashboardDateFormat, /'okänt datum'/);
  assert.match(sources.dashboardDateFormat, /'unknown date'/);
  assert.match(sources.dashboardE2e, /20 maj 2026/);
  assert.match(sources.dashboardE2e, /May 20, 2026/);
  assert.doesNotMatch(
    sources.dashboardE2e,
    /Trendpunkt 2 av 2: 84% den 2026-05-20|Trend point 2 of 2: 84% on 2026-05-20/,
    'Dashboard browser fixture must not keep raw mock-history dates',
  );
}

test('dashboard summary count copy is singular and plural in Swedish and English', () => {
  const sources = loadSources();

  assert.match(sources.dashboard, /formatDashboardSummaryLine\('sv'/);
  assert.match(sources.dashboard, /formatDashboardSummaryLine\('en'/);
  assert.match(sources.dashboard, /formatDashboardSummaryAccessibilityLabel\(\s*'sv'/);
  assert.match(sources.dashboard, /formatDashboardSummaryAccessibilityLabel\(\s*'en'/);
  assert.match(sources.dashboard, /formatDashboardActiveDayCount\(/);
  assert.match(sources.dashboard, /formatDashboardAnswerCount\(/);
  assert.match(sources.dashboard, /formatDashboardMockExamCount\(/);
  assert.match(sources.dashboard, /formatDashboardStreakCount\(/);
  assert.doesNotMatch(sources.dashboard, /chapters tried, \$\{unresolved\} unresolved mistakes/);
  assert.doesNotMatch(sources.dashboard, /\$\{activeDays\} aktiva dagar/);
  assert.doesNotMatch(sources.dashboard, /\$\{activeDays\} active days/);
  assert.doesNotMatch(sources.dashboard, /\$\{attemptCount\} mock exams/);
  assert.doesNotMatch(sources.dashboard, /\$\{currentStreak\} dagars svit/);
  assertDashboardSummaryPluralization();
});

test('dashboard and profile Swedish copy uses natural study-dashboard terms', () => {
  assertNaturalSwedishDashboardCopy(loadSources());
});

test('dashboard mock history uses localized completed dates', () => {
  const sources = loadSources();
  const { formatDashboardCompletedDate } = loadTs('lib/learning/dashboardDateFormat.ts');

  assertLocalizedMockHistoryDates(sources);
  assert.equal(formatDashboardCompletedDate('2026-05-20T12:00:00.000Z', 'sv'), '20 maj 2026');
  assert.equal(formatDashboardCompletedDate('2026-05-20T12:00:00.000Z', 'en'), 'May 20, 2026');
  assert.equal(formatDashboardCompletedDate('2026-02-30T12:00:00.000Z', 'sv'), 'okänt datum');
  assert.equal(formatDashboardCompletedDate('not-a-date', 'en'), 'unknown date');
});

test('dashboard copy guard rejects Swenglish chapter-progress wording', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertNaturalSwedishDashboardCopy({
        ...sources,
        dashboard: sources.dashboard.replace('Kapitelframsteg', 'Kapitelprogress'),
      }),
    /Swenglish dashboard terms/,
  );
});

test('dashboard copy guard rejects old profile dashboard subtitle wording', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertNaturalSwedishDashboardCopy({
        ...sources,
        profile: sources.profile.replace(
          'Aktivitet, kapitelframsteg och XP visas på en egen sida.',
          'Aktivitet, kapitelprogress och XP visas på en egen sida.',
        ),
      }),
    /Swenglish dashboard terms/,
  );
});

test('dashboard copy guard rejects old XP line wording', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertNaturalSwedishDashboardCopy({
        ...sources,
        dashboard: sources.dashboard.replace('XP-kurvan', 'XP-linjen'),
      }),
    /Swenglish dashboard terms/,
  );
});

test('dashboard mock-history date guard rejects raw ISO slices', () => {
  const sources = loadSources();

  assert.throws(
    () =>
      assertLocalizedMockHistoryDates({
        ...sources,
        history: `${sources.history}\nfunction completedDate(entry) { return entry.completedAt.slice(0, 10); }\n`,
      }),
    /raw completedAt date slices/,
  );
});
