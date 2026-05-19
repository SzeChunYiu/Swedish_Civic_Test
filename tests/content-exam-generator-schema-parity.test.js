const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('exam generator TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const examGeneratorSource = fs.readFileSync(
    path.join(repoRoot, 'lib/quiz/examGenerator.ts'),
    'utf8',
  );

  assert.equal(summary.examGeneratorTypeAliasesValidated, 1);
  assert.equal(summary.examGeneratorTypeInterfacesValidated, 6);
  assert.equal(summary.examGeneratorTypeSchemaParityValidated, true);
  assert.match(examGeneratorSource, /export type ExamAnswerMap = Record<string, string>;/);
  assert.match(examGeneratorSource, /export type ExamResult = \{/);
  assert.match(examGeneratorSource, /chapterBreakdown: ExamChapterResult\[\];/);
  assert.match(examGeneratorSource, /export type ExamReviewItem = \{/);
  assert.match(examGeneratorSource, /questionEn: string;/);
  assert.match(examGeneratorSource, /selectedOptionTextEn: string;/);
  assert.match(examGeneratorSource, /correctOptionTextEn: string;/);
  assert.match(examGeneratorSource, /explanationEn: string;/);
  assert.match(examGeneratorSource, /uhrReference: PracticeQuestion\['uhrReference'\];/);
  assert.match(examGeneratorSource, /export type ExamAutoSubmitState = \{/);
  assert.match(examGeneratorSource, /examActive: boolean;/);
});

test('exam generator schema parity rejects review item optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/examGenerator.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('selectedOptionTextSv: string;', 'selectedOptionTextSv?: string;');
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
    /lib\/quiz\/examGenerator\.ts ExamReviewItem\.selectedOptionTextSv optional=true, expected false/,
  );
});

test('exam generator schema parity rejects missing bilingual review fields', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/examGenerator.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('  questionEn: string;\\n', '');
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
    /lib\/quiz\/examGenerator\.ts ExamReviewItem fields are .*questionEn/,
  );
});
