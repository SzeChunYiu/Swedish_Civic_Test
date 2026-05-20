const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const sourcePaths = {
  dashboard: 'app/dashboard.tsx',
  dashboardE2e: 'tests/e2e/dashboard-route.spec.ts',
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
  assert.match(sources.dashboard, /title: 'Aktivitetsskala'/);
  assert.match(sources.dashboard, /low: 'Låg aktivitet'/);
  assert.match(sources.dashboard, /medium: 'Medelaktivitet'/);
  assert.match(sources.dashboard, /high: 'Hög aktivitet'/);
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
  assert.match(sources.dashboard, /title: 'Activity scale'/);
  assert.match(sources.dashboard, /low: 'Low activity'/);
  assert.match(sources.dashboard, /medium: 'Medium activity'/);
  assert.match(sources.dashboard, /high: 'High activity'/);
}

test('dashboard and profile Swedish copy uses natural study-dashboard terms', () => {
  assertNaturalSwedishDashboardCopy(loadSources());
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
