const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'reports/2026-05-15-10000-user-ux-simulation.json');
const markdownReportPath = path.join(repoRoot, 'reports/2026-05-15-10000-user-ux-simulation.md');
const reportFileName = '2026-05-15-10000-user-ux-simulation.json';
const markdownReportFileName = '2026-05-15-10000-user-ux-simulation.md';

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function makeTempOutputDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sct-ux-sim-'));
}

function runSimulatorWithTempOutput({
  featureEvidenceOverrides,
  generatedAt,
  outputDir,
  userCount = 120,
}) {
  execFileSync(process.execPath, ['scripts/simulate-ux-users.js'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_OPTIONS: '--v8-pool-size=1',
      UX_SIM_GENERATED_AT: generatedAt,
      UX_SIM_OUTPUT_DIR: outputDir,
      UX_SIM_USER_COUNT: String(userCount),
      ...(featureEvidenceOverrides
        ? { UX_SIM_FEATURE_EVIDENCE_OVERRIDES: JSON.stringify(featureEvidenceOverrides) }
        : {}),
    },
    stdio: 'pipe',
  });
}

function readTempReport(outputDir) {
  return JSON.parse(fs.readFileSync(path.join(outputDir, reportFileName), 'utf8'));
}

function readTempMarkdown(outputDir) {
  return fs.readFileSync(path.join(outputDir, markdownReportFileName), 'utf8');
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

test('UX simulation temp output preserves existing generatedAt and canonical markdown', () => {
  const outputDir = makeTempOutputDir();
  const beforeCommittedJson = fs.readFileSync(reportPath, 'utf8');
  const beforeCommittedMarkdown = fs.readFileSync(markdownReportPath, 'utf8');
  const existingGeneratedAt = '2026-05-15T20:52:47.523Z';

  fs.writeFileSync(
    path.join(outputDir, reportFileName),
    `${JSON.stringify({
      generatedAt: existingGeneratedAt,
    })}\n`,
  );

  runSimulatorWithTempOutput({
    generatedAt: '2099-01-01T00:00:00.000Z',
    outputDir,
  });

  const report = readTempReport(outputDir);
  const markdown = readTempMarkdown(outputDir);

  assert.equal(report.generatedAt, existingGeneratedAt);
  assert.equal(report.simulatedUserCount, 120);
  assert.match(markdown, new RegExp(`Generated: ${existingGeneratedAt}`));
  assert.match(
    markdown,
    /\| Segment\s+\| Users \| Avg satisfaction \|\n\| -+\s+\| -+: \| -+:\s+\|/,
  );
  assert.match(
    markdown,
    /\| Pain point \| Users affected \|\n\| ---------- \| -------------: \|\n\| None\s+\|\s+0 \|/,
  );
  assert.equal(fs.readFileSync(reportPath, 'utf8'), beforeCommittedJson);
  assert.equal(fs.readFileSync(markdownReportPath, 'utf8'), beforeCommittedMarkdown);
});

test('UX simulation temp output uses a fresh generatedAt only when no prior report exists', () => {
  const outputDir = makeTempOutputDir();

  runSimulatorWithTempOutput({
    generatedAt: '2030-01-01T00:00:00.000Z',
    outputDir,
  });

  assert.equal(readTempReport(outputDir).generatedAt, '2030-01-01T00:00:00.000Z');

  runSimulatorWithTempOutput({
    generatedAt: '2031-01-01T00:00:00.000Z',
    outputDir,
  });

  assert.equal(readTempReport(outputDir).generatedAt, '2030-01-01T00:00:00.000Z');
});

test('UX simulation temp output can mutate feature evidence without dirtying committed reports', () => {
  const outputDir = makeTempOutputDir();
  const beforeCommittedJson = fs.readFileSync(reportPath, 'utf8');
  const beforeCommittedMarkdown = fs.readFileSync(markdownReportPath, 'utf8');

  runSimulatorWithTempOutput({
    featureEvidenceOverrides: {
      audioSupport: false,
      bookmarkPractice: false,
      bookmarkReview: false,
      homeNextAction: false,
      webAdPreviewSafe: false,
    },
    generatedAt: '2032-01-01T00:00:00.000Z',
    outputDir,
  });

  const report = readTempReport(outputDir);
  const markdown = readTempMarkdown(outputDir);
  const painPointLabels = report.topPainPoints.map((painPoint) => painPoint.label);

  assert.equal(report.featureEvidence.audioSupport, false);
  assert.equal(report.featureEvidence.bookmarkPractice, false);
  assert.equal(report.featureEvidence.bookmarkReview, false);
  assert.equal(report.featureEvidence.homeNextAction, false);
  assert.equal(report.featureEvidence.webAdPreviewSafe, false);
  assert.ok(painPointLabels.includes('Needs read-aloud support for Swedish question text'));
  assert.ok(painPointLabels.includes('Wants a way to save hard questions for later'));
  assert.ok(painPointLabels.includes('Needs clearer next step after each session'));
  assert.ok(painPointLabels.includes('Ads should not interrupt focused studying or exams'));
  assert.equal(
    report.recommendationSummary,
    'Address the top unresolved synthetic UX pain points before release.',
  );
  assert.match(markdown, /\| Needs read-aloud support for Swedish question text\s+\|\s+\d+ \|/);
  assert.match(markdown, /Address the top unresolved synthetic UX pain points before release\./);
  assert.equal(fs.readFileSync(reportPath, 'utf8'), beforeCommittedJson);
  assert.equal(fs.readFileSync(markdownReportPath, 'utf8'), beforeCommittedMarkdown);
});
