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
    [/passingLineLabel: 'Gräns för godkänt'/, 'Swedish passing-line fallback'],
    [/scoreLabel: 'Poäng'/, 'Swedish score fallback'],
    [/pass: 'Godkänt'/, 'Swedish pass status fallback'],
    [/review: 'Behöver repeteras'/, 'Swedish review status fallback'],
    [/`\$\{correctCount\}\/\$\{totalCount\} rätt`/, 'Swedish metric fallback'],
    [/`\$\{percent\} procent rätt`/, 'Swedish progress fallback'],
    [/passingLineLabel: 'Passing line'/, 'English passing-line fallback'],
    [/scoreLabel: 'Score'/, 'English score fallback'],
    [/pass: 'Passed'/, 'English pass status fallback'],
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
      /const resolvedStatusLabel = statusLabel \?\? copy\.statusLabels\[resolvedStatus\];/,
      'localized status default',
    ],
    [
      /const resolvedMetricLabel = metricLabel \?\? copy\.metricLabel\(safeCorrect, safeTotal\);/,
      'localized metric default',
    ],
    [
      /const resolvedPassingLineText = passingLineLabel \?\? copy\.passingLineLabel;/,
      'localized passing-line default',
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
    [/\{resolvedPassingLineText\}/, 'visible passing-line fallback'],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `ResultSummary missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /passingLineLabel = 'Passing line'|scoreLabel = 'Score'/,
    'ResultSummary should not keep English defaults in parameter destructuring',
  );
}

test('ResultSummary fallback labels follow the selected settings language', () => {
  assertResultSummaryFallbackParity(readSource());
});

test('ResultSummary fallback parity rejects Swedish copy drift', () => {
  const mutatedSource = readSource().replace(
    "passingLineLabel: 'Gräns för godkänt'",
    "passingLineLabel: 'Passing line'",
  );

  assert.throws(
    () => assertResultSummaryFallbackParity(mutatedSource),
    /Swedish passing-line fallback/,
  );
});

test('ResultSummary fallback parity rejects nested progress language drift', () => {
  const mutatedSource = readSource().replace('        languageOverride={language}\n', '');

  assert.throws(
    () => assertResultSummaryFallbackParity(mutatedSource),
    /nested progress language forwarding/,
  );
});
