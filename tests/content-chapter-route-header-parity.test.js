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

test('chapter route title, missing state, and question section stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');

  assert.equal(summary.chapterRouteHeadersValidated, 3);
  assert.equal(summary.chapterRouteHeaderParityValidated, true);
  assert.equal(summary.chapterRouteCopyLabelsValidated, 14);
  assert.equal(summary.chapterRouteCopyParityValidated, true);
  assert.match(source, /type ChapterRouteCopy =/);
  assert.match(source, /const chapterRouteCopy: Record<AppLanguage, ChapterRouteCopy>/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = chapterRouteCopy\[language\];/);
  assert.match(source, /chapterTitle: \(chapter\) => chapter\.nameSv/);
  assert.match(source, /chapterTitle: \(chapter\) => chapter\.nameEn/);
  assert.match(source, /chapterDescription: \(chapter\) => chapter\.descriptionSv/);
  assert.match(source, /chapterDescription: \(chapter\) => chapter\.descriptionEn/);
  assert.match(source, /Kapitlet hittades inte/);
  assert.match(source, /Övningsfrågor \(\$\{count\}\)/);
  assert.match(source, /Starta frågepass för \$\{chapterTitle\}/);
  assert.doesNotMatch(source, new RegExp(['Starta', 'kapitelövning'].join(' ')));
  assert.match(source, /Chapter not found/);
  assert.match(source, /Practice questions \(\$\{count\}\)/);
  assert.match(source, /Start quiz for \$\{chapterTitle\}/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.missingTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{chapterTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.practiceQuestionsTitle\(chapterQuestions\.length\)\}\s*<\/Text>/,
  );
  assert.match(source, /UHRReferenceCard language=\{language\}/);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
});

test('chapter route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = chapterRouteCopy[language];', 'const copy = chapterRouteCopy.en;');
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
    /chapter route must select copy from settings language/,
  );
});

test('chapter route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Tillbaka till kapitellistan'", "'Back to chapter list'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /chapter route is missing sv copy/);
});

test('chapter route header parity rejects an unheadered question section title', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>',
        '<Text style={styles.sectionTitle}>',
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
    /chapter route title and section text must expose accessibilityRole="header"/,
  );
});
