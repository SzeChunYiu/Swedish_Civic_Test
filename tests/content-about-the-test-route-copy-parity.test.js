const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const forbiddenCompact = ['mock', 'prov'].join('');
const forbiddenHyphenated = ['mock', '-provet'].join('');
const scanRoots = ['app', 'components', 'lib', 'scripts', 'tests'];
const scanExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function collectScanFiles(relativeRoot) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  const stats = fs.statSync(absoluteRoot);

  if (stats.isFile()) return [absoluteRoot];

  const collected = [];
  fs.readdirSync(absoluteRoot, { withFileTypes: true }).forEach((entry) => {
    const absolutePath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      collected.push(...collectScanFiles(path.relative(repoRoot, absolutePath)));
      return;
    }
    if (entry.isFile() && scanExtensions.has(path.extname(entry.name))) {
      collected.push(absolutePath);
    }
  });
  return collected;
}

function sourceContainsForbiddenTerm(source, term) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escapedTerm}(?![\\p{L}\\p{N}_])`, 'iu').test(source);
}

test('about-the-test route copy stays localized and uses natural Swedish exam wording', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');

  assert.equal(summary.aboutTheTestRouteCopyLabelsValidated, 34);
  assert.equal(summary.aboutTheTestRouteCopyParityValidated, true);
  assert.equal(summary.swedishMockExamWordingNaturalnessValidated, true);
  assert.match(source, /const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = \{/);
  assert.match(source, /const copy = aboutTheTestCopy\[language\];/);
  assert.match(source, /Övningsprovet visar bara UHR-frågor/);
  assert.match(source, /The mock exam only shows UHR questions/);
  assert.match(source, /<QuestionDisclaimer \/>/);

  const forbiddenTerms = [forbiddenCompact, forbiddenHyphenated];
  const offendingFiles = [];
  scanRoots.forEach((root) => {
    collectScanFiles(root).forEach((filePath) => {
      const text = fs.readFileSync(filePath, 'utf8');
      if (forbiddenTerms.some((term) => sourceContainsForbiddenTerm(text, term))) {
        offendingFiles.push(path.relative(repoRoot, filePath));
      }
    });
  });
  assert.deepEqual(offendingFiles, []);
});

test('about-the-test copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = aboutTheTestCopy[language];', 'const copy = aboutTheTestCopy.en;');
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
    /about-the-test route must select copy from settings language/,
  );
});

test('about-the-test copy parity rejects the old Swedish compound wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const forbiddenHyphenated = ${JSON.stringify(forbiddenHyphenated)};
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Övningsprovet visar bara UHR-frågor', forbiddenHyphenated + ' visar bara UHR-frågor');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /legacy Swedish mock-exam wording/);
});

test('app-facing copy scan rejects the old compact Swedish compound', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const forbiddenCompact = ${JSON.stringify(forbiddenCompact)};
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Gör ett övningsprov', 'Gör ett ' + forbiddenCompact);
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /legacy Swedish mock-exam wording/);
});
