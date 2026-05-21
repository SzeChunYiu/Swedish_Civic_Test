const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function validateContentSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-countdown-banner-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function runFocusedCountdownValidationWithExamDatePatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('scripts/validate-content.js', '--focus-countdown-banner-parity');
const search = ${JSON.stringify(search)};
const replacement = ${JSON.stringify(replacement)};
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/examDate.ts')) {
    const source = String(contents);
    if (!source.includes(search)) {
      throw new Error('countdown study-plan mutation fixture did not find target source');
    }
    return source.replace(search, replacement);
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('countdown banner keeps citizenship rules and civic test dates separate', () => {
  const summary = validateContentSummary();

  assert.equal(summary.citizenshipRulesEffectiveDateValidated, '2026-06-06');
  assert.equal(summary.civicKnowledgeTestFirstSittingDateValidated, '2026-08-15');
  assert.equal(summary.civicKnowledgeTestDeadlineDateValidated, '2026-08-17');
  assert.equal(summary.citizenshipTimelineSourceUrlsValidated, 4);
  assert.equal(summary.citizenshipTimelineDateParityValidated, true);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);
  assert.equal(summary.countdownBannerHomeMountRulesValidated, 2);
  assert.equal(summary.countdownBannerHomeMountParityValidated, true);
  assert.equal(summary.studyPlanRuntimeCasesValidated, 6);
  assert.equal(summary.studyPlanRuntimeParityValidated, true);
  assert.equal(Object.hasOwn(summary, 'homeRouteCopyParityValidated'), false);
  assert.equal(Object.hasOwn(summary, 'chapters'), false);

  const countdownBanner = fs.readFileSync(
    path.join(repoRoot, 'components/ui/CountdownBanner.tsx'),
    'utf8',
  );
  assert.doesNotMatch(countdownBanner, /The new civic knowledge test takes effect/i);
  assert.doesNotMatch(countdownBanner, /Det nya samhällskunskapstestet träder i kraft/i);
  assert.match(countdownBanner, /New citizenship rules apply from/);
  assert.match(countdownBanner, /The first civic-knowledge test sitting is on/);
  assert.match(countdownBanner, /Nya medborgarskapsregler gäller från/);
  assert.match(countdownBanner, /Första provomgången i samhällskunskap hålls/);
  assert.doesNotMatch(countdownBanner, /UHR has\s+confirmed/);
  assert.doesNotMatch(countdownBanner, /UHR har\s+bekräftat/);
  assert.match(countdownBanner, /CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE/);
  assert.match(countdownBanner, /Stockholm/);
  assert.doesNotMatch(countdownBanner, /expected in August 2026/i);
  assert.doesNotMatch(countdownBanner, /väntas starta i augusti 2026/i);
  assert.doesNotMatch(countdownBanner, /government deadline for the first step/i);
  assert.doesNotMatch(countdownBanner, /Regeringens tidsgräns för första steget/i);
  assert.match(countdownBanner, /CITIZENSHIP_TIMELINE_SOURCE_URLS/);
  assert.doesNotMatch(
    countdownBanner,
    /<View\\s+accessibilityLabel=\\{resolvedAccessibilityLabel\\}/,
  );
  assert.match(countdownBanner, /accessibilityRole="alert"/);
  assert.match(countdownBanner, /accessibilitySummary/);
  assert.match(countdownBanner, /Officiella datumkällor:/);
  assert.match(countdownBanner, /Official date sources:/);
  assert.match(countdownBanner, /Migrationsverket/);
  assert.match(countdownBanner, /UHR/);
  assert.doesNotMatch(countdownBanner, /Regeringen/);
  assert.match(countdownBanner, /target="_blank"/);
  assert.match(countdownBanner, /minHeight: space\[6\]/);
  assert.match(countdownBanner, /minWidth: space\[6\]/);

  const homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  assert.match(homeRoute, /import \{ CountdownBanner \}/);
  assert.match(homeRoute, /<CountdownBanner language=\{language\} \/>/);
});

test('validate:content rejects removing the Home countdown banner mount', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('scripts/validate-content.js', '--focus-countdown-banner-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return String(contents).replace('<CountdownBanner language={language} />', '');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Home route must mount CountdownBanner with the selected language/,
  );
});

test('countdown banner parity rejects collapsing the civic test deadline into the rules date', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('scripts/validate-content.js', '--focus-countdown-banner-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/examDate.ts')) {
    return String(contents).replace(
      "new Date('2026-08-17T00:00:00Z')",
      "new Date('2026-06-06T00:00:00Z')",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /civic knowledge test deadline must be 2026-08-17|civic knowledge test deadline must stay after the citizenship rules date/,
  );
});

test('countdown banner parity rejects tentative August-only test copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('scripts/validate-content.js', '--focus-countdown-banner-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/components/ui/CountdownBanner.tsx')) {
    return String(contents).replace(
      'The first civic-knowledge test sitting is on',
      'The civic-knowledge test is expected in August 2026; the first sitting is',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CountdownBanner must state timeline facts neutrally|CountdownBanner missing timeline copy or constant/,
  );
});

test('countdown banner parity rejects source-authority phrasing in learner copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('scripts/validate-content.js', '--focus-countdown-banner-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/components/ui/CountdownBanner.tsx')) {
    return String(contents).replace(
      'The first civic-knowledge test sitting is on',
      ['UHR has', 'confirmed that the first civic-knowledge test sitting is'].join(' '),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CountdownBanner must state timeline facts neutrally/,
  );
});

test('countdown banner parity rejects unsafe study-plan date formatting', () => {
  const result = runFocusedCountdownValidationWithExamDatePatch(
    "  if (!isFiniteDate(target)) return language === 'sv' ? 'datum saknas' : 'date unavailable';",
    '  // Mutation fixture: invalid dates fall through to locale formatting.',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /study plan runtime failed: invalid dates use safe fallbacks/,
  );
});

test('countdown banner parity rejects study-plan string and fractional count coercion', () => {
  const result = runFocusedCountdownValidationWithExamDatePatch(
    [
      'function normalizeNonNegativeInteger(value: unknown): number {',
      "  return typeof value === 'number' &&",
      '    Number.isFinite(value) &&',
      '    Number.isInteger(value) &&',
      '    value >= 0',
      '    ? value',
      '    : 0;',
      '}',
    ].join('\n'),
    [
      'function normalizeNonNegativeInteger(value: unknown): number {',
      '  const numericValue = Number(value);',
      '  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;',
      '}',
    ].join('\n'),
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /study plan runtime failed: (string|fractional) counts do not coerce into progress/,
  );
});

test('countdown banner parity rejects preserving unknown study intensity values', () => {
  const result = runFocusedCountdownValidationWithExamDatePatch(
    [
      'function normalizeStudyIntensity(value: unknown): StudyIntensity {',
      "  if (value === 'casual' || value === 'regular' || value === 'serious') return value;",
      "  return 'regular';",
      '}',
    ].join('\n'),
    [
      'function normalizeStudyIntensity(value: unknown): StudyIntensity {',
      "  if (value === 'casual' || value === 'regular' || value === 'serious') return value;",
      '  return value;',
      '}',
    ].join('\n'),
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /study plan runtime failed: NaN dates and unknown intensity normalize/,
  );
});
