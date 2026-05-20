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

function extractNamedStyle(source, styleName) {
  const match = source.match(new RegExp(`${styleName}:\\s*\\{[\\s\\S]*?\\n  \\},`));
  assert.ok(match, `${styleName} style must exist`);
  return match[0];
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
      new RegExp(`${styleName}:\\s*\\{[\\s\\S]*?backgroundColor: colors\\.`),
      `${styleName} must keep a tokenized background color`,
    );
  }

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
          /\s+accessibilityLabel=\{accessibilityLabel\}\n\s+accessibilityRole="summary"\n\s+aria-label=\{accessibilityLabel\}\n/,
          '\n',
        ),
      }),
    /ActivityHeatmap ScrollView must keep its localized chart summary/,
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
