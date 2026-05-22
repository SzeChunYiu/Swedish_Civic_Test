const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'reports/2026-05-15-10000-user-ux-simulation.json');
const markdownReportPath = path.join(repoRoot, 'reports/2026-05-15-10000-user-ux-simulation.md');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

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
  assert.deepEqual(report.topPainPoints, []);
  assert.equal(
    report.recommendationSummary,
    'No blocking synthetic UX pain point remains in the modeled study loop.',
  );
  assert.ok(
    report.users.every(
      (user) => !user.painPoints.includes('Ads should not interrupt focused studying or exams'),
    ),
  );
  assert.ok(report.averageSatisfaction >= 4);
  assert.ok(report.averageTaskCompletion >= 90);
});

test('UX simulation web ad preview evidence follows the shared banner copy', () => {
  const simulatorSource = readRepoFile('scripts/simulate-ux-users.js');
  const adBannerSource = readRepoFile('components/monetization/AdBanner.tsx');
  const adCopySource = readRepoFile('lib/monetization/adCopy.ts');
  const homeSource = readRepoFile('app/(tabs)/home.tsx');
  const mistakesSource = readRepoFile('app/(tabs)/mistakes.tsx');
  const profileSource = readRepoFile('app/(tabs)/profile.tsx');
  const progressBarSource = readRepoFile('components/ProgressBar.tsx');

  assert.match(
    simulatorSource,
    /has\('components\/monetization\/AdBanner\.tsx', \/WEB_AD_FALLBACK_CONSENT_DECISION\/\)/,
  );
  assert.match(simulatorSource, /has\('lib\/monetization\/adCopy\.ts', \/Sponsored ad preview\/\)/);
  assert.doesNotMatch(
    simulatorSource,
    /has\('components\/monetization\/AdBanner\.tsx', \/web preview/i,
  );
  assert.match(adBannerSource, /getAdBannerStatusLabel/);
  assert.match(adBannerSource, /copy\.previewHint/);
  assert.match(adCopySource, /previewHint: 'Sponsored ad preview\.'/);
  assert.match(adCopySource, /testStatus: 'AdMob test unit active - preview'/);
  assert.match(simulatorSource, /has\('components\/ProgressBar\.tsx', \/Animated\\\.timing\/\)/);
  assert.match(progressBarSource, /Animated\.timing/);
  assert.match(simulatorSource, /bookmarkedReviewQuestions/);
  assert.match(simulatorSource, /questionProgress\\\[question\\\.id\\\]\\\?\\\.bookmarked/);
  assert.match(mistakesSource, /bookmarkedReviewQuestions/);
  assert.match(mistakesSource, /questionProgress\[question\.id\]\?\.bookmarked/);
  assert.match(simulatorSource, /feedbackLinkAccessibilityLabel/);
  assert.match(homeSource, /feedbackTitle/);
  assert.match(homeSource, /href="\/mistakes"/);
  assert.match(simulatorSource, /openSettingsAccessibilityLabel/);
  assert.match(profileSource, /pathname: '\/settings'/);
});

test('10000-user UX simulation report is idempotent against committed evidence', () => {
  const beforeJsonText = fs.readFileSync(reportPath, 'utf8');
  const beforeMarkdownText = fs.readFileSync(markdownReportPath, 'utf8');
  const beforeReport = JSON.parse(beforeJsonText);

  assert.equal(beforeReport.generatedAt, '2026-05-15T20:52:47.523Z');
  assert.equal(beforeReport.featureEvidence.webAdPreviewSafe, true);
  assert.deepEqual(beforeReport.topPainPoints, []);
  assert.equal(
    beforeReport.recommendationSummary,
    'No blocking synthetic UX pain point remains in the modeled study loop.',
  );
  assert.match(
    beforeMarkdownText,
    /\| Segment\s+\| Users \| Avg satisfaction \|\n\| -+\s+\| -+: \| -+:\s+\|/,
  );
  assert.match(
    beforeMarkdownText,
    /\| Pain point \| Users affected \|\n\| ---------- \| -------------: \|\n\| None\s+\|\s+0 \|/,
  );
  assert.match(
    beforeMarkdownText,
    /- Recommendation: No blocking synthetic UX pain point remains in the modeled study loop\./,
  );

  execFileSync(process.execPath, ['scripts/simulate-ux-users.js'], {
    cwd: repoRoot,
    env: { ...process.env, NODE_OPTIONS: '--v8-pool-size=1' },
    stdio: 'pipe',
  });

  assert.equal(fs.readFileSync(reportPath, 'utf8'), beforeJsonText);
  assert.equal(fs.readFileSync(markdownReportPath, 'utf8'), beforeMarkdownText);
});
