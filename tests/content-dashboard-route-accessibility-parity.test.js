const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const sourcePaths = {
  activity: 'components/dashboard/ActivityHeatmap.tsx',
  dashboard: 'app/dashboard.tsx',
  chapters: 'components/dashboard/PerChapterProgressBars.tsx',
  sparkline: 'components/dashboard/StreakXpSparkline.tsx',
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

function assertDashboardAccessibilitySeparation(sources) {
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
    sources.dashboard,
    /<Card[\s\S]{0,180}style=\{styles\.summaryCard\}>[\s\S]*?<Link[\s\S]*?accessibilityLabel=\{copy\.homeLinkAccessibilityLabel\}[\s\S]*?accessibilityRole="link"/,
    'Dashboard Home link must remain an independent labelled link inside the visual card',
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
    /<Pressable[\s\S]*?accessibilityLabel=\{copy\.sortAccessibilityLabel\(label\)\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected \}\}/,
    'PerChapterProgressBars sort controls must remain independently reachable buttons',
  );
  assert.match(
    sources.chapters,
    /<Link[\s\S]*?accessibilityLabel=\{copy\.linkLabel\(chapterName\)\}[\s\S]*?accessibilityRole="link"/,
    'PerChapterProgressBars chapter rows must remain independently reachable links',
  );
  assert.doesNotMatch(
    sources.chapters,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/,
    'PerChapterProgressBars parent Card must not group sort buttons or chapter links',
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
  assert.doesNotMatch(
    sources.activity,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/,
    'ActivityHeatmap parent Card must not group the horizontal ScrollView',
  );

  assert.match(
    sources.sparkline,
    /<Card accessibilityLabel=\{accessibilityLabel\} accessibilityRole="summary" style=\{styles\.card\}>/,
    'Non-interactive sparkline can keep a concise grouped summary',
  );
  assert.match(sources.sparkline, /copy\.emptyState/);
  assert.match(sources.sparkline, /aria-label=\{accessibilityLabel\}/);

  assert.match(sources.dashboard, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.chapters, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
  assert.match(sources.activity, /accessibilitySummary:\s*\{[\s\S]*?position: 'absolute'/);
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
          '          accessibilityLabel={accessibilityLabel}\n          accessibilityRole="summary"\n          aria-label={accessibilityLabel}\n',
          '',
        ),
      }),
    /ActivityHeatmap ScrollView must keep its localized chart summary/,
  );
});
