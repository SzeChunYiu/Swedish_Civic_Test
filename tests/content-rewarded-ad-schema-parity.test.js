const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('rewarded ad TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const rewardedAdSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
    'utf8',
  );

  assert.equal(summary.rewardedAdTypeUnionsValidated, 1);
  assert.equal(summary.rewardedAdTypeInterfacesValidated, 3);
  assert.equal(summary.rewardedAdTypeSchemaParityValidated, true);
  assert.match(rewardedAdSource, /export type RewardedExtraExamAdStatus =/);
  assert.match(rewardedAdSource, /export type RewardedExtraExamReward = \{/);
  assert.match(
    rewardedAdSource,
    /export type RewardedExtraExamRewardConfirmation = \(\) => boolean \| Promise<boolean>;/,
  );
  assert.match(rewardedAdSource, /confirmReward\?: RewardedExtraExamRewardConfirmation;/);
  assert.match(rewardedAdSource, /reward\?: RewardedExtraExamReward;/);
  assert.match(rewardedAdSource, /status: RewardedExtraExamAdStatus;/);
  assert.match(rewardedAdSource, /timeoutMs\?: number;/);
});

test('rewarded ad schema parity rejects reward optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/rewardedAd.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('reward?: RewardedExtraExamReward;', 'reward: RewardedExtraExamReward;');
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
    /lib\/monetization\/rewardedAd\.ts RewardedExtraExamAdResult\.reward optional=false, expected true/,
  );
});
