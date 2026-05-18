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

test('published question provenance stays explicit and UHR-only for current bank', () => {
  const summary = parseValidationSummary();
  const baseQuestions = fs.readFileSync(path.join(repoRoot, 'data/questions.ts'), 'utf8');
  const additionalQuestions = fs.readFileSync(
    path.join(repoRoot, 'data/additionalQuestions.ts'),
    'utf8',
  );
  const derivedQuestions = fs.readFileSync(
    path.join(repoRoot, 'lib/content/derivedQuestions.ts'),
    'utf8',
  );
  const questionText = fs.readFileSync(path.join(repoRoot, 'lib/quiz/questionText.ts'), 'utf8');

  assert.equal(summary.questionProvenanceValidated, summary.publishedQuestions);
  assert.equal(summary.externalQuestions, 0);
  assert.equal(summary.externalReferencesValidated, 0);
  assert.equal(summary.externalQuestionLabelsValidated, 0);
  assert.match(baseQuestions, /export const baseQuestions: PracticeQuestion\[\] = \[/);
  assert.match(baseQuestions, /provenance: 'uhr'/);
  assert.doesNotMatch(baseQuestions, /provenance: 'external'/);
  assert.match(
    additionalQuestions,
    /const uhrSourceMetadata: QuestionSourceMetadata = \{ provenance: 'uhr' \};/,
  );
  assert.doesNotMatch(additionalQuestions, /provenance: 'external'/);
  assert.match(derivedQuestions, /provenance: source\.provenance/);
  assert.match(derivedQuestions, /externalReference: source\.externalReference/);
  assert.match(questionText, /getQuestionProvenanceLabel/);
  assert.match(
    questionText,
    /Extern källa - utöver UHR-materialet \/ External source - beyond the UHR material/,
  );
});

test('question provenance parity rejects missing UHR provenance mapping', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("provenance: 'uhr',", '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /has invalid provenance undefined/);
});

test('question provenance parity rejects invalid external source URL', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "const uhrSourceMetadata: QuestionSourceMetadata = { provenance: 'uhr' };",
        "const uhrSourceMetadata: QuestionSourceMetadata = { provenance: 'external', externalReference: { publisher: 'Example publisher', title: 'Example title', locator: 'Example locator', url: 'http://example.com/source', accessedAt: '2026-05-18' } };",
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
    /externalReference\.url must be an HTTPS public URL/,
  );
});

test('question provenance parity rejects hidden external source label', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('{provenanceLabel ? <Text style={styles.provenanceLabel}>{provenanceLabel}</Text> : null}', 'null');
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
    /QuestionCard missing visible external provenance label for accessibility parity/,
  );
});
