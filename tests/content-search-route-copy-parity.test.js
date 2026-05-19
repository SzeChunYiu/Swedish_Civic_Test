const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const searchRoutePath = path.join(repoRoot, 'app/search.tsx');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function runValidationWithSearchRouteMutation(searchValue, replacementValue) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const searchValue = ${JSON.stringify(searchValue)};
const replacementValue = ${JSON.stringify(replacementValue)};
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/search.tsx')) {
    return originalReadFileSync.call(this, filePath, ...args).replace(searchValue, replacementValue);
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('search route copy parity is part of content validation', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(searchRoutePath, 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(summary.searchRouteCopyParityValidated, true);
  assert.ok(summary.searchRouteCopyParityCasesValidated >= 60);
  assert.match(
    packageJson.scripts['test:content'],
    /tests\/content-search-route-copy-parity\.test\.js/,
  );
  assert.match(source, /type SearchRouteCopy = \{/);
  assert.match(source, /const searchRouteCopy: Record<AppLanguage, SearchRouteCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = searchRouteCopy\[language\];/);
  assert.match(source, /Rensa sökning/);
  assert.match(source, /Clear search/);
  assert.match(source, /accessibilityLabel=\{copy\.searchInputAccessibilityLabel\}/);
  assert.match(source, /placeholder=\{copy\.searchPlaceholder\}/);
  assert.match(source, /copy\.filteredSummary\(filteredTerms\.length, termsWithChapters\.length\)/);
  assert.match(source, /copy\.allTermsSummary\(termsWithChapters\.length\)/);
  assert.match(source, /accessibilityLabel=\{copy\.openChapterAccessibilityLabel\(chapterName\)\}/);
  assert.match(source, /href=\{`\/chapter\/\$\{term\.chapterId\}`\}/);
  assert.match(source, /glossaryTermMatchesQuery\(term, chapter, normalizedQuery\)/);
});

test('search route copy parity rejects bypassing the settings language', () => {
  const result = runValidationWithSearchRouteMutation(
    'const copy = searchRouteCopy[language];',
    'const copy = searchRouteCopy.en;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /search route must select copy from settings language/,
  );
});

test('search route copy parity rejects missing Swedish clear copy', () => {
  const result = runValidationWithSearchRouteMutation("'Rensa sökning'", "'Clear search'");

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /search route is missing sv copy/);
});

test('search route copy parity rejects dropped input accessibility copy', () => {
  const result = runValidationWithSearchRouteMutation(
    'accessibilityLabel={copy.searchInputAccessibilityLabel}',
    'accessibilityLabel={copy.searchLabel}',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /search input must expose localized accessibility copy/,
  );
});

test('search route copy parity rejects unlocalized chapter link copy', () => {
  const result = runValidationWithSearchRouteMutation(
    'accessibilityLabel={copy.openChapterAccessibilityLabel(chapterName)}',
    'accessibilityLabel={chapterName}',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /chapter links must expose localized accessibility copy/,
  );
});

test('search route copy parity rejects bypassing the glossary result contract', () => {
  const result = runValidationWithSearchRouteMutation(
    'glossaryTermMatchesQuery(term, chapter, normalizedQuery)',
    'normalizeSearchText(term.termSv).includes(normalizedQuery)',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /search route must use the glossary result matching contract/,
  );
});
