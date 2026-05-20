const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('mock exam access TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const rewardedExamSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedExam.ts'),
    'utf8',
  );

  assert.equal(summary.mockExamAccessTypeUnionsValidated, 1);
  assert.equal(summary.mockExamAccessTypeInterfacesValidated, 6);
  assert.equal(summary.mockExamAccessTypeSchemaParityValidated, true);
  assert.match(rewardedExamSource, /export type MockExamAccessReason =/);
  assert.match(rewardedExamSource, /\| 'access_read_failed'/);
  assert.match(rewardedExamSource, /accessReadFailed\?: boolean;/);
  assert.match(rewardedExamSource, /export type MockExamAccessDecision = \{/);
  assert.match(rewardedExamSource, /completedMockExamSessionIdsByDate: Record<string, string\[]>;/);
  assert.match(rewardedExamSource, /placement: typeof REWARDED_EXTRA_EXAM_PLACEMENT;/);
  assert.match(rewardedExamSource, /export interface MockExamAccessStorage/);
  assert.match(rewardedExamSource, /getItemAsync\(key: string\): Promise<string \| null>;/);
});

test('mock exam access schema parity rejects credit optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/rewardedExam.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('rewardedExtraExamCredits?: number;', 'rewardedExtraExamCredits: number;');
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
    /lib\/monetization\/rewardedExam\.ts MockExamAccessState\.rewardedExtraExamCredits optional=false, expected true/,
  );
});
