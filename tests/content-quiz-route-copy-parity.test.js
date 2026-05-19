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

test('routed quiz shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');

  assert.equal(summary.quizRouteCopyLabelsValidated, 16);
  assert.equal(summary.quizRouteCopyParityValidated, true);
  assert.match(source, /const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = quizSessionCopy\[language\];/);
  assert.match(source, /Tillbaka till övning/);
  assert.match(source, /Session \$\{currentSessionId\}/);
  assert.match(source, /Försök igen med den här quizfrågan/);
  assert.match(source, /Try this quiz question again/);
  assert.match(source, /<QuestionDisclaimer language=\{language\} \/>/);
  assert.match(source, /<QuestionCard question=\{question\} language=\{language\} \/>/);
  assert.match(source, /<UHRReferenceCard language=\{language\}/);
});

test('routed quiz copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = quizSessionCopy[language];', 'const copy = quizSessionCopy.en;');
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
    /quiz route must select copy from settings language/,
  );
});

test('routed quiz copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.'",
        "'Answer the routed question, then review the source-backed feedback.'",
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
  assert.match(`${result.stdout}\n${result.stderr}`, /quiz route is missing sv copy/);
});

test('routed quiz copy parity rejects missing localized disclaimer wiring', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<QuestionDisclaimer language={language} />', '<QuestionDisclaimer />');
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
    /routed quiz disclaimer must receive settings language/,
  );
});
