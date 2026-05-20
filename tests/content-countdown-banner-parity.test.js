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
  assert.equal(summary.civicKnowledgeTestFirstSittingDateValidated, '2026-08-15');
  assert.equal(summary.civicKnowledgeTestDeadlineDateValidated, '2026-08-17');
  assert.equal(summary.citizenshipTimelineSourceUrlsValidated, 4);
  assert.equal(summary.citizenshipTimelineDateParityValidated, true);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);

  const countdownBanner = fs.readFileSync(
    path.join(repoRoot, 'components/ui/CountdownBanner.tsx'),
    'utf8',
  );
  assert.doesNotMatch(countdownBanner, /The new civic knowledge test takes effect/i);
  assert.doesNotMatch(countdownBanner, /Det nya samhällskunskapstestet träder i kraft/i);
  assert.doesNotMatch(countdownBanner, /expected in August 2026/i);
  assert.doesNotMatch(countdownBanner, /väntas starta i augusti 2026/i);
  assert.doesNotMatch(countdownBanner, /no later than/i);
  assert.doesNotMatch(countdownBanner, /senast/);
  assert.match(countdownBanner, /New citizenship rules apply from/);
  assert.match(countdownBanner, /The first civic-knowledge test will be held on/);
  assert.match(countdownBanner, /15 August 2026|firstSittingDate/);
  assert.match(countdownBanner, /Nya medborgarskapsregler gäller från/);
  assert.match(countdownBanner, /Första samhällskunskapsprovet genomförs den/);
  assert.match(countdownBanner, /15 augusti 2026|firstSittingDate/);
  assert.match(countdownBanner, /Stockholm/);
});

test('countdown banner parity rejects moving the first civic test sitting to the assignment deadline', () => {
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
      "new Date('2026-08-15T00:00:00Z')",
      "new Date('2026-08-17T00:00:00Z')",
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
    /first civic knowledge test sitting must be 2026-08-15|first civic knowledge sitting must stay after the citizenship rules date and before the assignment deadline/,
  );
});

test('countdown banner parity rejects reverting to month-and-deadline copy', () => {
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
      .replace(
        'Första samhällskunskapsprovet genomförs den \${firstSittingDate} i Stockholm.',
        'Samhällskunskapsprovet väntas starta i augusti 2026, senast \${testDeadline}.',
      )
      .replace(
        'The first civic-knowledge test will be held on \${firstSittingDate} in Stockholm.',
        'The civic-knowledge test is expected in August 2026, no later than \${testDeadline}.',
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
    /CountdownBanner missing timeline copy or constant|CountdownBanner still uses stale civic knowledge test timeline copy/,
  );
});
