const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('learning ChapterCard keeps visible progress and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/learning/ChapterCard.tsx'),
    'utf8',
  );

  assert.equal(summary.chapterCardAccessibilityRulesValidated, 27);
  assert.equal(summary.chapterCardAccessibilityParityValidated, true);
  assert.match(source, /const chapterCardCopy: Record<AppLanguage, ChapterCardCopy> = \{/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /progressPresentationOnly = false,/);
  assert.match(source, /progressPresentationOnly\?: boolean;/);
  assert.match(source, /const copy = chapterCardCopy\[language\];/);
  assert.match(source, /innehåll planerat/);
  assert.match(source, /Content queued/);
  assert.match(source, /\$\{completedCount\}\/\$\{questionCount\} besvarade/);
  assert.match(source, /\$\{completedCount\}\/\$\{questionCount\} practiced/);
  assert.match(source, /language === 'en'\s*\?\s*chapter\.nameEn\s*:\s*chapter\.nameSv/);
  assert.match(
    source,
    /const secondaryName = chapter \? \(language === 'en' \? chapter\.nameSv : chapter\.nameEn\) : null;/,
  );
  assert.match(
    source,
    /language === 'en'\s*\?\s*chapter\.descriptionEn\s*:\s*chapter\.descriptionSv/,
  );
  assert.match(source, /const chapterAccessibilityLabel =/);
  assert.match(source, /copy\.accessibilityLabel\.chapter\(title\)/);
  assert.match(source, /copy\.accessibilityLabel\.secondaryName\(secondaryName\)/);
  assert.match(source, /copy\.accessibilityLabel\.status\(status\)/);
  assert.match(source, /copy\.accessibilityLabel\.description\(description\)/);
  assert.match(source, /accessibilitySummary\?: boolean/);
  assert.match(source, /accessibilitySummary = true/);
  assert.match(source, /accessible=\{accessibilitySummary\}/);
  assert.match(
    source,
    /accessibilityLabel=\{accessibilitySummary \? chapterAccessibilityLabel : undefined\}/,
  );
  assert.match(source, /<Text style=\{styles\.title\}>\{title\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.subtitle\}>\{secondaryName\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.description\}>\{description\}<\/Text>/);
  assert.match(
    source,
    /<ProgressBar\s+language=\{language\}\s+presentationOnly=\{progressPresentationOnly\}\s+progress=\{progress\}\s+\/>/,
  );
});

test('ChapterCard accessibility parity rejects settings-language bypass', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/ChapterCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = chapterCardCopy[language];', 'const copy = chapterCardCopy.sv;');
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
    /ChapterCard missing settings language copy selection for accessibility parity/,
  );
});

test('ChapterCard accessibility parity rejects status summary drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/ChapterCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('copy.accessibilityLabel.status(status)', "'Progress hidden'");
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
    /ChapterCard missing progress status in accessibility summary for accessibility parity/,
  );
});

test('ChapterCard accessibility parity rejects dropped progress presentation passthrough', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/ChapterCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('        presentationOnly={progressPresentationOnly}\\n', '');
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
    /ChapterCard missing visible progress bar for accessibility parity/,
  );
});
