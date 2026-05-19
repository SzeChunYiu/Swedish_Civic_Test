const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function validateContentSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('countdown banner keeps citizenship rules and civic test dates separate', () => {
  const summary = validateContentSummary();

  assert.equal(summary.citizenshipRulesEffectiveDateValidated, '2026-06-06');
  assert.equal(summary.civicKnowledgeTestDeadlineDateValidated, '2026-08-17');
  assert.equal(summary.citizenshipTimelineSourceUrlsValidated, 3);
  assert.equal(summary.citizenshipTimelineDateParityValidated, true);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);
  assert.equal(summary.citizenshipTimelineSourceAffordanceLinksValidated, 3);
  assert.equal(summary.countdownBannerTimelineSourceAffordanceParityValidated, true);

  const countdownBanner = fs.readFileSync(
    path.join(repoRoot, 'components/ui/CountdownBanner.tsx'),
    'utf8',
  );
  assert.doesNotMatch(countdownBanner, /The new civic knowledge test takes effect/i);
  assert.doesNotMatch(countdownBanner, /Det nya samhällskunskapstestet träder i kraft/i);
  assert.match(countdownBanner, /New citizenship rules apply from/);
  assert.match(countdownBanner, /The civic-knowledge test is expected in August 2026/);
  assert.match(countdownBanner, /Nya medborgarskapsregler gäller från/);
  assert.match(countdownBanner, /Samhällskunskapsprovet väntas starta i augusti 2026/);
  assert.match(countdownBanner, /Official sources/);
  assert.match(countdownBanner, /Officiella källor/);
  assert.match(countdownBanner, /accessibilityRole="link"/);
  assert.match(countdownBanner, /CITIZENSHIP_TIMELINE_SOURCE_URLS\[sourceKey\]/);
  assert.match(countdownBanner, /rulesEffectiveDate/);
  assert.match(countdownBanner, /civicKnowledgeTestStart/);
  assert.match(countdownBanner, /civicKnowledgeTestDeadline/);
});

test('countdown banner parity rejects collapsing the civic test deadline into the rules date', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/examDate.ts')) {
    return String(contents).replace(
      "new Date('2026-08-17T00:00:00Z')",
      "new Date('2026-06-06T00:00:00Z')",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /civic knowledge test deadline must be 2026-08-17|civic knowledge test deadline must stay after the citizenship rules date/,
  );
});

test('countdown banner parity rejects removing the visible official-source affordance', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/components/ui/CountdownBanner.tsx')) {
    return String(contents)
      .replace('accessibilityRole="link"', 'accessibilityRole="button"')
      .replace('Official sources', 'Timeline note')
      .replace('Officiella källor', 'Tidslinje');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CountdownBanner missing timeline source affordance/,
  );
});

test('countdown banner parity rejects replacing official source URLs with internal paths', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/examDate.ts')) {
    return String(contents).replace('https://www.uhr.se/medborgarskapsprovet/', '#/sources');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /citizenship timeline source URL civicKnowledgeTestStart must be https:\/\/www\.uhr\.se\/medborgarskapsprovet\//,
  );
});
