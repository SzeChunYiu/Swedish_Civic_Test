const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function requireTsModule(relativePath) {
  const previousTsExtension = require.extensions['.ts'];

  require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    module._compile(output, filename);
  };

  try {
    return require(path.join(repoRoot, relativePath));
  } finally {
    if (previousTsExtension) {
      require.extensions['.ts'] = previousTsExtension;
    } else {
      delete require.extensions['.ts'];
    }
  }
}

test('search route surfaces localized glossary results', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');

  assert.equal(summary.glossaryTerms >= 30, true);
  assert.equal(summary.glossaryMinimumTermsValidated, true);
  assert.equal(summary.glossaryChapterLinksValidated, summary.glossaryTerms);
  assert.equal(summary.searchRouteCopyLabelsValidated, 30);
  assert.equal(summary.searchRouteCopyParityValidated, true);
  assert.match(source, /const searchCopy: Record<AppLanguage, SearchCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = searchCopy\[language\];/);
  assert.match(source, /searchGlossary\(query, language, 8\)/);
  assert.match(source, /getGlossaryChapterLabel\(term, language\)/);
  assert.match(source, /Sök i ordlistan/);
  assert.match(source, /Search the glossary/);
  assert.match(source, /Ordlisteträffar/);
  assert.match(source, /Glossary results/);
  assert.match(
    source,
    /accessibilityLabel=\{copy\.resultAccessibilityLabel\(primaryTerm, chapterLabel\)\}/,
  );
});

test('search helper finds core civic glossary terms in both languages', () => {
  const { searchGlossary } = requireTsModule('lib/learning/glossarySearch.ts');

  assert.equal(searchGlossary('riksdag', 'sv', 5)[0].id, 'riksdag');
  assert.equal(searchGlossary('municipality', 'en', 5)[0].id, 'kommun');
  assert.equal(searchGlossary('grundlag', 'sv', 5)[0].id, 'grundlag');
  assert.equal(searchGlossary('citizenship', 'en', 5)[0].id, 'medborgarskap');
  assert.equal(searchGlossary('region', 'sv', 5)[0].id, 'region');
  assert.equal(searchGlossary('zzzzzz', 'en', 5).length, 0);
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

test('glossary validation rejects an empty glossary', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/glossary.ts')) {
    return [
      "import type { GlossaryTerm } from '../types/content';",
      '',
      'export const glossaryTerms: GlossaryTerm[] = [];',
      '',
    ].join('\\n');
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
    /glossaryTerms must include at least 30 UHR-backed terms/,
  );
});
