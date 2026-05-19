const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const componentPath = path.join(repoRoot, 'components/ResultSummary.tsx');

function readSource() {
  return fs.readFileSync(componentPath, 'utf8');
}

function assertResultSummaryFallbackParity(source) {
  const requiredRules = [
    [
      /import \{ useSettingsStore, type AppLanguage \} from '\.\.\/lib\/storage\/settingsStore';/,
      'settings language import',
    ],
    [/type ResultSummaryCopy = \{/, 'copy contract type'],
    [/const resultSummaryCopy: Record<AppLanguage, ResultSummaryCopy> = \{/, 'copy table'],
    [/resultBadgeLabel: 'Övningsresultat'/, 'Swedish result badge fallback'],
    [/scoreLabel: 'Poäng'/, 'Swedish score fallback'],
    [/strong: 'Starkt övningsresultat'/, 'Swedish strong status fallback'],
    [/review: 'Behöver repeteras'/, 'Swedish review status fallback'],
    [/`\$\{correctCount\}\/\$\{totalCount\} rätt`/, 'Swedish metric fallback'],
    [/`\$\{percent\} procent rätt`/, 'Swedish progress fallback'],
    [/resultBadgeLabel: 'Practice result'/, 'English result badge fallback'],
    [/scoreLabel: 'Score'/, 'English score fallback'],
    [/strong: 'Strong practice result'/, 'English strong status fallback'],
    [/review: 'Needs review'/, 'English review status fallback'],
    [/`\$\{correctCount\}\/\$\{totalCount\} correct`/, 'English metric fallback'],
    [/`\$\{percent\} percent correct`/, 'English progress fallback'],
    [/languageOverride\?: AppLanguage;/, 'language override prop'],
    [
      /const settingsLanguage = useSettingsStore\(\(state\) => state\.language\);/,
      'settings language read',
    ],
    [/const language = languageOverride \?\? settingsLanguage;/, 'language resolution'],
    [/const copy = resultSummaryCopy\[language\];/, 'copy table lookup'],
    [
      /const resolvedStatusLabel =\s+statusLabel \?\? \(status \? copy\.statusLabels\[status\] : copy\.resultBadgeLabel\);/,
      'localized status default',
    ],
    [
      /const resolvedMetricLabel = metricLabel \?\? copy\.metricLabel\(safeCorrect, safeTotal\);/,
      'localized metric default',
    ],
    [/const percentAccessibilityLabel = copy\.percentLabel\(percent\);/, 'localized percent label'],
    [
      /const progressLabel = progressAccessibilityLabel \?\? copy\.progressLabel\(percent\);/,
      'localized progress label',
    ],
    [/const resolvedScoreLabel = scoreLabel \?\? copy\.scoreLabel;/, 'localized score default'],
    [/accessibilityLabel=\{percentAccessibilityLabel\}/, 'percent accessibility label forwarding'],
    [
      /<ProgressBar[\s\S]*languageOverride=\{language\}[\s\S]*progress=\{percent \/ 100\}/,
      'nested progress language forwarding',
    ],
    [
      /<Button[\s\S]*languageOverride=\{language\}[\s\S]*variant=\{action\.variant \?\? 'secondary'\}/,
      'nested action language forwarding',
    ],
    [/\{resolvedScoreLabel\}/, 'visible score label fallback'],
    [
      /<PillBadge variant=\{badgeVariant\}>\{resolvedStatusLabel\}<\/PillBadge>/,
      'status badge label',
    ],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `ResultSummary missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /resultBadgeLabel = 'Practice result'|scoreLabel = 'Score'/,
    'ResultSummary should not keep English defaults in parameter destructuring',
  );

  const unsupportedFragments = [
    ['pass', 'ing', 'Percent'].join(''),
    ['pass', 'ing', 'Line'].join(''),
    ['Gräns för ', 'godkänt'].join(''),
    ['Passing ', 'line'].join(''),
    ['God', 'känt'].join(''),
    ['Pass', 'ed'].join(''),
    '75' + '%',
  ];

  for (const fragment of unsupportedFragments) {
    assert.doesNotMatch(
      source,
      new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `ResultSummary should not expose unsupported mock-exam score-source copy: ${fragment}`,
    );
  }
}

test('ResultSummary fallback labels follow the selected settings language', () => {
  assertResultSummaryFallbackParity(readSource());
});

test('ResultSummary fallback parity rejects Swedish copy drift', () => {
  const mutatedSource = readSource().replace(
    "resultBadgeLabel: 'Övningsresultat'",
    "resultBadgeLabel: 'Practice result'",
  );

  assert.throws(
    () => assertResultSummaryFallbackParity(mutatedSource),
    /Swedish result badge fallback/,
  );
});

test('ResultSummary fallback parity rejects nested progress language drift', () => {
  const mutatedSource = readSource().replace('        languageOverride={language}\n', '');

  assert.throws(
    () => assertResultSummaryFallbackParity(mutatedSource),
    /nested progress language forwarding/,
  );
});
