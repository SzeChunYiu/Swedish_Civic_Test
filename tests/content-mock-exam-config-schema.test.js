const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function assertMockExamConfigPanelA11ySeparation(source) {
  assert.match(
    source,
    /a non-interactive summary header with[\s\S]*`accessibilityRole="summary"`/,
    'MockExamConfigPanel should document that summary semantics live on the header',
  );
  assert.match(
    source,
    /const resolvedPanelAccessibilityLabel =\s+accessibilityLabel \?\?\s+getPanelAccessibilityLabel\(/,
    'MockExamConfigPanel should resolve one summary label for the non-interactive header',
  );
  assert.match(
    source,
    /<Surface[\s\S]*accessibilityRole="none"[\s\S]*\{\.\.\.surfaceProps\}[\s\S]*accessible=\{false\}[\s\S]*>/,
    'MockExamConfigPanel outer Surface must not be the labelled grouped element',
  );
  assert.match(
    source,
    /<View\s+accessible\s+accessibilityLabel=\{resolvedPanelAccessibilityLabel\}\s+accessibilityRole=\{accessibilityRole\}\s+style=\{styles\.header\}/,
    'MockExamConfigPanel should put the summary label on the non-interactive header',
  );
  assert.match(source, /accessibilityRole="adjustable"/, 'steppers must remain adjustable');
  assert.match(
    source,
    /accessibilityActions=\{stepperAccessibilityActions\}/,
    'adjustable steppers must expose increment and decrement accessibility actions',
  );
  assert.match(
    source,
    /\{ name: 'decrement', label: decrementAccessibilityLabel \}/,
    'adjustable steppers should expose the decrement action with localized copy',
  );
  assert.match(
    source,
    /\{ name: 'increment', label: incrementAccessibilityLabel \}/,
    'adjustable steppers should expose the increment action with localized copy',
  );
  assert.match(
    source,
    /onAccessibilityAction=\{handleAccessibilityAction\}/,
    'adjustable steppers must handle screen-reader action gestures',
  );
  assert.match(
    source,
    /case 'decrement':[\s\S]*if \(canDecrement\) onChange\?\.\(getNextValue\(value, step, -1, min, max\)\);/,
    'decrement accessibility actions should use the same clamped step path as the visible control',
  );
  assert.match(
    source,
    /case 'increment':[\s\S]*if \(canIncrement\) onChange\?\.\(getNextValue\(value, step, 1, min, max\)\);/,
    'increment accessibility actions should use the same clamped step path as the visible control',
  );
  assert.match(source, /accessibilityRole="checkbox"/, 'chapter chips must remain checkboxes');
  assert.match(
    source,
    /accessibilityState=\{\{ checked: selected, disabled \}\}/,
    'chapter checkbox state must stay explicit',
  );
  assert.doesNotMatch(
    source,
    /<Surface\b[^>]*accessibilityLabel=/,
    'outer Surface should not keep the panel accessibility label around controls',
  );
  assert.doesNotMatch(
    source,
    /<View\s+accessibilityLabel=\{resolvedChaptersLabel\}\s+accessibilityRole="summary"\s+style=\{styles\.chips\}/,
    'chapter checkbox group should not be a labelled summary wrapper',
  );
}

test('default mock exam config stays UHR-based and ad-free during exams', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const configSource = fs.readFileSync(path.join(repoRoot, 'data/mockExamConfig.ts'), 'utf8');

  assert.equal(summary.mockExamConfigTypeFieldsValidated, 5);
  assert.equal(summary.mockExamConfigTypeSchemaParityValidated, true);
  assert.equal(summary.mockExamConfigExactSchemaKeysValidated, true);
  assert.equal(summary.mockExamConfigValidated, true);
  assert.equal(summary.nativeMockExamComponentCopyLabelsValidated, 4);
  assert.equal(summary.nativeMockExamComponentLegalCopyValidated, true);
  assert.match(configSource, /export interface MockExamConfig/);
  assert.match(configSource, /sourceScope: 'uhr_based';/);
  assert.equal(config.sourceScope, 'uhr_based');
  assert.equal(config.showExplanationsDuringExam, false);
  assert.equal(config.adsAllowedDuringExam, false);
  assert.ok(Number.isInteger(config.questionCount));
  assert.ok(config.questionCount > 0);
  assert.ok(config.questionCount <= summary.publishedQuestions);
  assert.ok(Number.isInteger(config.durationMinutes));
  assert.ok(config.durationMinutes > 0);

  const configPanelSource = fs.readFileSync(
    path.join(repoRoot, 'components/MockExamConfigPanel.tsx'),
    'utf8',
  );
  assert.match(configPanelSource, /startLabel: 'Starta övningsprov'/);
  assert.match(configPanelSource, /startLabel: 'Start mock exam'/);
});

test('mock exam config panel uses unofficial practice-result copy', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'components/MockExamConfigPanel.tsx'), 'utf8');
  const unsupportedFragments = [
    ['pass', 'ing', 'Percent'].join(''),
    ['pass', 'ing', 'Label'].join(''),
    ['Gräns för ', 'godkänt'].join(''),
    ['Pass', 'ing line'].join(''),
    '75' + '%',
  ];

  assert.match(source, /scoreModeLabel: 'Övningsresultat'/);
  assert.match(source, /scoreModeLabel: 'Practice result'/);
  assert.match(source, /sourceScopeLabel: 'UHR-baserade frågor'/);
  assert.match(source, /sourceScopeLabel: 'UHR-based questions'/);
  assert.match(source, /<PillBadge variant="accent">\{resolvedSourceScopeLabel\}<\/PillBadge>/);
  assert.match(source, /<PillBadge>\{resolvedScoreModeLabel\}<\/PillBadge>/);

  for (const fragment of unsupportedFragments) {
    assert.doesNotMatch(
      source,
      new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `MockExamConfigPanel should not expose unsupported score-source copy: ${fragment}`,
    );
  }

  assert.doesNotMatch(source, /Resultat är övning/);
});

test('mock exam config panel separates summary semantics from controls', () => {
  assertMockExamConfigPanelA11ySeparation(
    fs.readFileSync(path.join(repoRoot, 'components/MockExamConfigPanel.tsx'), 'utf8'),
  );
});

test('mock exam config panel a11y separation rejects grouped summary regressions', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'components/MockExamConfigPanel.tsx'), 'utf8');
  const groupedPanel = source
    .replace('accessibilityRole="none"', 'accessibilityRole={accessibilityRole}')
    .replace('{...surfaceProps}\n      accessible={false}', '{...surfaceProps}');
  const groupedChapters = source.replace(
    '<View style={styles.chips}>',
    '<View\n          accessibilityLabel={resolvedChaptersLabel}\n          accessibilityRole="summary"\n          style={styles.chips}\n        >',
  );
  const missingStepperActions = source.replace(
    '\n      accessibilityActions={stepperAccessibilityActions}',
    '',
  );
  const missingStepperActionHandler = source.replace(
    '\n      onAccessibilityAction={handleAccessibilityAction}',
    '',
  );

  assert.throws(
    () => assertMockExamConfigPanelA11ySeparation(groupedPanel),
    /outer Surface must not be the labelled grouped element/,
  );
  assert.throws(
    () => assertMockExamConfigPanelA11ySeparation(groupedChapters),
    /chapter checkbox group should not be a labelled summary wrapper/,
  );
  assert.throws(
    () => assertMockExamConfigPanelA11ySeparation(missingStepperActions),
    /must expose increment and decrement accessibility actions/,
  );
  assert.throws(
    () => assertMockExamConfigPanelA11ySeparation(missingStepperActionHandler),
    /must handle screen-reader action gestures/,
  );
});

test('mock exam config TypeScript schema parity rejects optional field drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/mockExamConfig.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('durationMinutes: number;', 'durationMinutes?: number;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /MockExamConfig\.durationMinutes optional=true, expected false/,
  );
});

test('mock exam config exact schema rejects internal field leakage', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/mockExamConfig.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '  adsAllowedDuringExam: false,\\n};',
        "  adsAllowedDuringExam: false,\\n  debugNotes: 'internal QA field',\\n};",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /defaultMockExamConfig\.debugNotes is not part of MockExamConfig schema/,
  );
});
