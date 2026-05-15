const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'reports/2026-05-15-10000-user-ux-simulation.json');

test('10000-user UX simulation report exists and covers diverse feedback-driven improvements', () => {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  assert.equal(report.simulatedUserCount, 10000);
  assert.equal(report.users.length, 10000);
  assert.equal(new Set(report.users.map((user) => user.story)).size, 10000);
  assert.ok(report.users.every((user) => user.background && user.review));
  assert.equal(report.featureEvidence.animatedProgress, true);
  assert.equal(report.featureEvidence.bookmarkPractice, true);
  assert.equal(report.featureEvidence.bookmarkReview, true);
  assert.equal(report.featureEvidence.googleAdsNative, true);
  assert.equal(report.featureEvidence.homeFeedbackCard, true);
  assert.equal(report.featureEvidence.webAdPreviewSafe, true);
  assert.ok(report.averageSatisfaction >= 4);
  assert.ok(report.averageTaskCompletion >= 90);
});
