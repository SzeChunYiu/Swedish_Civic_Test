const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'docs/localization/review-packets/ui-preview-v8');
const targetLocales = ['ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk', 'zh-Hans', 'zh-Hant'];
const expectedHeader = [
  'locale',
  'ui_path',
  'surface',
  'target_text',
  'placeholders',
  'source_style_guide',
  'source_phrasebook',
  'review_focus',
  'native_review_status',
  'reviewer_notes',
].join('\t');

function readTsv(locale) {
  return fs
    .readFileSync(path.join(outputRoot, `${locale}.tsv`), 'utf8')
    .trimEnd()
    .split('\n');
}

test('UI preview v8 native-review packets are reproducible', () => {
  cp.execFileSync('node', ['scripts/export-ui-preview-review-packets.js', '--check'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
});

test('UI preview v8 native-review packets cover every blocked picker preview locale', () => {
  const readme = fs.readFileSync(path.join(outputRoot, 'README.md'), 'utf8');
  assert.match(readme, /preview-only app UI copy review packets/);
  assert.match(readme, /Do not use these packets to enable a locale/);

  for (const locale of targetLocales) {
    const lines = readTsv(locale);
    assert.equal(lines[0], expectedHeader, `${locale} header`);
    assert.ok(lines.length > 80, `${locale} should expose substantial UI copy for review`);

    const body = lines.slice(1).join('\n');
    const requiredPathGroups = [
      ['settings.title'],
      ['languagePicker.comingSoonTitle', 'languagePicker.comingSoon'],
      ['studyEntryPoints.feedback.explanationTitle', 'quizFeedback.explanationPanel.title'],
      [
        'studyEntryPoints.mockExam.localPracticeNote',
        'mockExamAndMistakes.mockExamConfig.localSaveLabel',
      ],
      ['studyEntryPoints.learning.lockedReleaseNote', 'dashboardAndLearning.learning.title'],
      [
        'complianceAndMonetization.privacy.dataBoundary.body',
        'complianceAndMonetization.privacy.localProgressStorage.body',
      ],
      ['complianceAndMonetization.monetization.removeAdsBodyTemplate'],
      [
        'remainingHighFrequencyRoutes.aboutTheTest.independenceBody',
        'remainingHighFrequencyRoutes.aboutTheTest.sections.independence.body',
      ],
      [
        'remainingHighFrequencyRoutes.sources.subtitle',
        'remainingHighFrequencyRoutes.sources.title',
      ],
      ['remainingHighFrequencyRoutes.search.emptyBody'],
    ];

    for (const pathGroup of requiredPathGroups) {
      const hasAnyPath = pathGroup.some((requiredPath) =>
        new RegExp(`\\t${requiredPath}\\t`).test(body),
      );
      assert.ok(hasAnyPath, `${locale} missing one of ${pathGroup.join(' / ')}`);
    }

    assert.match(body, /pending_native_review/);
    assert.doesNotMatch(body, /releaseGate\tallowed/);
  }
});

test('UI preview v8 review export rejects unsupported pass or passport promises', () => {
  const result = cp.spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/localization/arUiPreview.ts')) {
    return String(contents).replace(
      "هذا الإصدار قيد الإعداد.",
      "passport guarantee for passing the official citizenship test",
    );
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-ui-preview-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /unsupported outcome claim.*ar.*languagePicker\.comingSoonTitle/i,
  );
});

test('UI preview v8 review export rejects unlocalized civic terms in preview copy', () => {
  const result = cp.spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/localization/soUiPreview.ts')) {
    return String(contents).replace(
      'Raadi dimoqraadiyad, degmo, daryeel bulsho…',
      'Raadi dimoqraadiyad, kommun, välfärd…',
    );
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-ui-preview-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /unlocalized civic term.*so.*searchPlaceholder/i,
  );
});

test('UI preview v8 review export rejects unblocked preview readiness gates', () => {
  const result = cp.spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/docs/localization/readiness.json')) {
    const readiness = JSON.parse(String(contents));
    readiness.locales.ar.appAvailable = true;
    readiness.locales.ar.releaseGate = 'allowed';
    return JSON.stringify(readiness);
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-ui-preview-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /ar readiness must remain fail-closed/i);
});

test('UI preview v8 review export rejects malformed placeholder syntax', () => {
  const result = cp.spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/localization/arUiPreview.ts')) {
    return String(contents).replace('{label}', '\${label}');
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-ui-preview-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /malformed placeholder.*ar.*settings\.languageAccessibilityLabelTemplate/i,
  );
});

test('UI preview v8 review export rejects missing reviewer guidance files', () => {
  const result = cp.spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/localization/arUiPreview.ts')) {
    return String(contents).replace(
      "sourceStyleGuide: 'docs/localization/sample-corpus/ar/style-guide.md'",
      "sourceStyleGuide: 'docs/localization/sample-corpus/ar/missing-style-guide.md'",
    );
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-ui-preview-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /ar sourceStyleGuide file missing/i);
});
