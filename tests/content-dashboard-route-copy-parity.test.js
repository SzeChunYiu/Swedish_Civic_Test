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
