const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('progress question schema stays in parity with persisted progress records', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const progressTypes = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );

  assert.equal(summary.progressQuestionFieldsValidated, 8);
  assert.equal(summary.progressQuestionSchemaParityValidated, true);
  assert.equal(summary.progressTypeUnionsValidated, 2);
  assert.equal(summary.progressTypeInterfacesValidated, 4);
  assert.equal(summary.progressTypeSchemaParityValidated, true);
  assert.equal(summary.progressStoreFieldsValidated, 12);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.match(progressTypes, /export interface UserQuestionProgress/);
  assert.match(
    progressTypes,
    /export type QuizMode = 'study' \| 'exam' \| 'mistakes' \| 'challenge';/,
  );
  assert.match(progressTypes, /export interface QuizSession/);
  assert.match(progressTypes, /questionProgress: Record<string, UserQuestionProgress>;/);
  assert.match(progressStore, /export type QuestionProgress = \{/);
  assert.match(progressStore, /export type MockExamProgress = \{/);
  assert.match(progressStore, /type ProgressState = PersistedProgress & \{/);
  assert.match(progressStore, /questionProgress: Record<string, QuestionProgress>;/);
  assert.match(progressStore, /completedQuestionIds: string\[\];/);
  assert.match(progressStore, /mockExamSessions: MockExamProgress\[\];/);
  assert.match(progressStore, /streakFreezeState: StreakFreezeState;/);
  assert.match(progressStore, /recordMockExamSession: \(session: MockExamProgressInput\) => void;/);
  assert.match(
    progressStore,
    /setStreakFreezeState: \(streakFreezeState: StreakFreezeState\) => void;/,
  );
  assert.match(
    progressStore,
    /progressStorage\?\.set\(progressStateKey, JSON\.stringify\(progress\)\);/,
  );
});

test('progress type schema parity rejects session optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/progress.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('score?: number;', 'score: number;');
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
    /types\/progress\.ts QuizSession\.score optional=false, expected true/,
  );
});

test('progress store schema parity rejects persisted field optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/storage/progressStore.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('answerDates: string[];', 'answerDates?: string[];');
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
    /ProgressState\.answerDates optional=true, expected false/,
  );
});
