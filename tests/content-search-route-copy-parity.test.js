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

test('search route copy follows the persisted settings language and local question search', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');
  const searchSource = fs.readFileSync(path.join(repoRoot, 'lib/search/questionSearch.ts'), 'utf8');

  assert.equal(summary.searchRouteCopyLabelsValidated, 38);
  assert.equal(summary.searchRouteCopyParityValidated, true);
  assert.equal(summary.questionSearchRuntimeCasesValidated, 4);
  assert.equal(summary.questionSearchRuntimeParityValidated, true);
  assert.match(source, /const searchCopy: Record<AppLanguage, SearchCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = searchCopy\[language\];/);
  assert.match(source, /searchQuestions\(\{ chapters, language, query: trimmedQuery, questions/);
  assert.match(source, /Sök efter frågor, svar, förklaringar, taggar eller kapitel/);
  assert.match(source, /Search questions, answers, explanations, tags, or chapters/);
  assert.match(source, /Öppna quizfrågan: \$\{questionTitle\}/);
  assert.match(source, /Open quiz question: \$\{questionTitle\}/);
  assert.match(source, /<QuestionDisclaimer language=\{language\} \/>/);
  assert.match(source, /pathname: '\/quiz\/\[sessionId\]'/);
  assert.match(source, /href=\{`\/chapter\/\$\{result\.chapter\.id\}`\}/);
  assert.match(searchSource, /export function searchQuestions/);
  assert.match(searchSource, /normalizeSearchText/);
});

test('search route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/search.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = searchCopy[language];', 'const copy = searchCopy.en;');
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
    /search route must select copy from settings language/,
  );
});

test('search route copy parity rejects placeholder-only screen copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/search.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Sök frågor', 'Question search is coming');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /search route must replace placeholder/);
});

test('search route copy parity rejects missing Swedish copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/search.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Sök i frågebanken'", "'Search the question bank'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /search route is missing sv copy/);
});
