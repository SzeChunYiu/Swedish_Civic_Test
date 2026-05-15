const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runPreflight(options = {}) {
  const result = spawnSync(
    process.execPath,
    ['scripts/release-preflight.js', '--json', ...(options.args || [])],
    {
      encoding: 'utf8',
      env: { ...process.env, ...(options.env || {}) },
    },
  );
  if (options.expectedStatus !== undefined) {
    assert.equal(result.status, options.expectedStatus, result.stderr || result.stdout);
  }
  return JSON.parse(result.stdout);
}

function writeFakeReleaseCommands(tmpDir, options = {}) {
  const fakeNpm = path.join(tmpDir, 'npm');
  const fakeNpx = path.join(tmpDir, 'npx');
  const fakeGit = path.join(tmpDir, 'git');

  fs.writeFileSync(
    fakeNpm,
    [
      '#!/bin/sh',
      'if [ "$1 $2 $3" = "exec -- expo-doctor" ]; then echo "17/17 checks passed. No issues detected!"; exit 0; fi',
      'if [ "$1 $2" = "run release:web-export-smoke" ]; then echo "Web export smoke passed"; exit 0; fi',
      'if [ "$1 $2" = "run release:native-prebuild-smoke" ]; then echo "Android and iOS native prebuild smoke passed"; exit 0; fi',
      'echo "unexpected npm command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  fs.writeFileSync(
    fakeNpx,
    [
      '#!/bin/sh',
      'if [ "$1 $2 $3" = "--yes eas-cli@18.13.0 --version" ]; then echo "eas-cli/18.13.0 test"; exit 0; fi',
      'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "expo-user"; exit 0; fi',
      'echo "unexpected npx command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  fs.writeFileSync(
    fakeGit,
    [
      '#!/bin/sh',
      'if [ "$1 $2" = "status --porcelain" ]; then',
      options.gitStatusPorcelain
        ? `  printf '%s\\n' '${options.gitStatusPorcelain.replace(/'/g, "'\\''")}'`
        : '  exit 0',
      '  exit 0',
      'fi',
      'echo "unexpected git command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
}

function writeAllReadyEvidence(evidencePath, overrides = {}) {
  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        gates: {
          'android-device-audio': {
            status: 'READY',
            evidence:
              'Android Pixel 8 physical-device audio smoke passed; build https://expo.dev/build/android-ready',
          },
          'ios-device-audio': {
            status: 'READY',
            evidence:
              'iPhone 15 TestFlight audio smoke passed; build https://appstoreconnect.apple.com/testflight-ready',
          },
          'store-records': {
            status: 'READY',
            evidence:
              'App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; Support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and Privacy Policy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ entered in both stores; real ads deferred.',
          },
          'privacy-review': {
            status: 'READY',
            evidence:
              'Apple privacy labels and Google Play Data safety reviewed against EAS build version 1.0.0; Google Mobile Ads SDK test configuration and REAL_ADS_ENABLED_FOR_V1=false verified; no analytics, crash reporting, purchases, or real ads enabled.',
          },
          'public-urls': {
            status: 'READY',
            evidence:
              'Support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and Privacy Policy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ verified over HTTPS and entered in both store records.',
          },
          'device-screenshots': {
            status: 'READY',
            evidence:
              'Final screenshots captured from accepted device tooling and recorded at https://example.com/final-store-screenshots/manifest.json.',
          },
          submission: {
            status: 'READY',
            evidence:
              'TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; post-launch report https://example.com/monitoring/v1-week1 recorded.',
          },
          ...overrides,
        },
      },
      null,
      2,
    ),
  );
}

function createFinalScreenshotManifest(options = {}) {
  const relativeDir = path.join(
    'reports',
    'final-store-screenshots',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const routes = ['/home', '/learn', '/practice', '/exam', '/profile'];
  const screenshots = routes.map((route, index) => {
    const file = `${String(index + 1).padStart(2, '0')}-${route.replace('/', '')}.png`;
    fs.writeFileSync(path.join(absoluteDir, file), `fake png ${route}`);
    return {
      id: route.slice(1),
      route,
      platform: index % 2 === 0 ? 'ios' : 'android',
      device: index % 2 === 0 ? 'iPhone 15' : 'Pixel 8',
      captureMethod: index % 2 === 0 ? 'device' : 'accepted store tooling',
      sourceBuild: index % 2 === 0 ? 'TestFlight build 100' : 'EAS Android build 100',
      pixelWidth: index % 2 === 0 ? 1290 : 1080,
      pixelHeight: index % 2 === 0 ? 2796 : 2400,
      locale: 'sv-SE',
      file,
    };
  });

  const manifest = {
    status: 'final-device',
    screenshots,
    ...options.manifest,
  };
  const manifestPath = path.join(absoluteDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return {
    relativePath: path.join(relativeDir, 'manifest.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

function createDeviceAudioEvidence(platform, options = {}) {
  const relativeDir = path.join(
    'reports',
    'device-smoke',
    `test-${platform}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'passed',
    platform,
    device: platform === 'android' ? 'Pixel 8 / Android 15' : 'iPhone 15 / iOS 18',
    sourceBuild:
      platform === 'android' ? 'EAS Android preview build android-100' : 'TestFlight build ios-100',
    checks: [
      { id: 'sv-se-question-audio', result: 'passed' },
      { id: 'audio-button-state', result: 'passed' },
      { id: 'speech-engine-unavailable', result: 'passed' },
      { id: 'onboarding', result: 'passed' },
      { id: 'practice-answer-flow', result: 'passed' },
      { id: 'mock-exam-no-ads', result: 'passed' },
      { id: 'progress-restart', result: 'passed' },
      { id: 'privacy-legal-pages', result: 'passed' },
    ],
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, `${platform}-audio.json`);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, `${platform}-audio.json`),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

function createStoreRecordEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'store-records',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'ready',
    bundleIdentifier: 'com.billyyiu.swedishcivictest',
    appStoreConnectUrl: 'https://appstoreconnect.apple.com/apps/1234567890/appstore',
    googlePlayConsoleUrl: 'https://play.google.com/console/u/0/developers/123/app/497123',
    supportUrl: 'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/',
    privacyUrl: 'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/',
    adMob: {
      status: 'deferred-real-ads-disabled',
      note: 'REAL_ADS_ENABLED_FOR_V1=false',
    },
    listingMetadata: {
      appStoreListingReviewed: true,
      appStoreListingPath: 'publishing/app-store-listing.md',
      googlePlayListingReviewed: true,
      googlePlayListingPath: 'publishing/google-play-listing.md',
      matchesStoreRecords: true,
    },
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'store-records.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'store-records.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

function createSubmissionEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'submission',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'submitted',
    testFlightBuild: {
      buildNumber: '100',
      processingStatus: 'processed',
      betaReviewStatus: 'approved',
      url: 'https://appstoreconnect.apple.com/apps/1234567890/testflight/ios/100',
    },
    googlePlayInternal: {
      trackUrl: 'https://play.google.com/console/u/0/developers/123/app/497123/tracks/internal',
      versionCode: 100,
      testerGroup: 'internal-testers',
    },
    productionSubmissions: [
      {
        platform: 'ios',
        submissionId: 'ios-submit-100',
        reviewStatus: 'submitted',
      },
      {
        platform: 'android',
        submissionId: 'android-submit-100',
        reviewStatus: 'submitted',
      },
    ],
    monitoringReport: 'reports/monitoring/v1-week1.md',
    ...options.evidence,
  };

  if (options.createMonitoringReport !== false) {
    const monitoringPath = path.join(repoRoot, evidence.monitoringReport);
    fs.mkdirSync(path.dirname(monitoringPath), { recursive: true });
    fs.writeFileSync(
      monitoringPath,
      options.monitoringReportContent ||
        [
          '# v1 week-one monitoring',
          '',
          '- First-week window: 2026-05-16 through 2026-05-23.',
          '- Crash reports: none open in App Store Connect or Google Play Console.',
          '- Content/support reports: none open from support email or store reports.',
          '- Store reviews/ratings: no urgent review issues requiring a hotfix.',
          '- Decision: continue monitoring the launch and keep release notes current.',
          '',
        ].join('\n'),
    );
  }

  const evidencePath = path.join(absoluteDir, 'submission.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'submission.json'),
    cleanup: () => {
      fs.rmSync(absoluteDir, { recursive: true, force: true });
      if (options.createMonitoringReport !== false) {
        fs.rmSync(path.join(repoRoot, evidence.monitoringReport), { force: true });
      }
    },
  };
}

function createPrivacyReviewEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'privacy-review',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'reviewed',
    reviewedBuild: {
      id: 'EAS build ios-100/android-100',
      version: '1.0.0',
      commit: 'abcdef1',
    },
    applePrivacyLabels: {
      reviewed: true,
      path: 'publishing/privacy-labels.md',
      matchesBinary: true,
    },
    googlePlayDataSafety: {
      reviewed: true,
      path: 'publishing/google-play-data-safety.md',
      matchesBinary: true,
    },
    googleMobileAds: {
      sdkPresent: true,
      testAppIds: true,
      realAdsEnabled: false,
      gate: 'REAL_ADS_ENABLED_FOR_V1=false',
    },
    disabledSdks: {
      analytics: true,
      crashReporting: true,
      purchases: true,
      realAds: true,
    },
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'privacy-review.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'privacy-review.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

test('release preflight fails closed on external launch blockers', () => {
  const report = runPreflight({ expectedStatus: 1 });
  assert.equal(report.status, 'BLOCKED');
  assert.equal(report.readyForSubmission, false);

  const gateIds = new Set(report.gates.map((gate) => gate.id));
  for (const id of [
    'local-validation',
    'expo-doctor',
    'web-export',
    'native-prebuild',
    'eas-auth',
    'android-device-audio',
    'ios-device-audio',
    'store-records',
    'privacy-review',
    'public-urls',
    'device-screenshots',
  ]) {
    assert.ok(gateIds.has(id), `${id} should be represented`);
  }

  const blocked = report.gates.filter((gate) => gate.status === 'BLOCKED');
  assert.ok(blocked.length >= 5, 'external blockers should remain explicit');
  assert.match(report.nextActions.join('\n'), /Expo\/EAS/i);
});

test('release preflight can pass after recorded external evidence and EAS auth are ready', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 0,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  assert.equal(report.status, 'READY_FOR_STORE_SUBMISSION');
  assert.equal(report.readyForSubmission, true);
  assert.equal(
    report.gates.every((gate) => gate.status === 'READY'),
    true,
  );
});

test('release preflight blocks stale public URL evidence when live check fails', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-public-url-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_PUBLIC_URLS: JSON.stringify(['http://127.0.0.1:9/not-reachable']),
    },
  });

  const publicUrls = report.gates.find((gate) => gate.id === 'public-urls');
  assert.equal(publicUrls.status, 'BLOCKED');
  assert.match(publicUrls.evidence, /live URL check failed/i);
});

test('release preflight blocks READY manual gates with weak evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-weak-evidence-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'android-device-audio': {
      status: 'READY',
      evidence: 'done',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const androidAudio = report.gates.find((gate) => gate.id === 'android-device-audio');
  assert.equal(androidAudio.status, 'BLOCKED');
  assert.match(androidAudio.evidence, /marked READY/i);
  assert.match(androidAudio.evidence, /Android/i);
  assert.match(androidAudio.evidence, /audio/i);
});

test('release preflight blocks READY manual gates with contradictory placeholder evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-placeholder-evidence-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'android-device-audio': {
      status: 'READY',
      evidence: 'Android audio smoke passed on Pixel build TBD.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const androidAudio = report.gates.find((gate) => gate.id === 'android-device-audio');
  assert.equal(androidAudio.status, 'BLOCKED');
  assert.match(androidAudio.evidence, /placeholder/i);
  assert.match(androidAudio.evidence, /TBD/i);
});

test('release preflight blocks web-draft screenshots as final device screenshot evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-web-draft-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'device-screenshots': {
      status: 'READY',
      evidence:
        'Web-draft screenshots captured from browser and recorded in reports/2026-05-15-uiux-screenshots/manifest.json for store listing.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const screenshots = report.gates.find((gate) => gate.id === 'device-screenshots');
  assert.equal(screenshots.status, 'BLOCKED');
  assert.match(screenshots.evidence, /web-draft/i);
  assert.match(screenshots.evidence, /not final/i);
});

test('release preflight blocks store records without support and privacy URL entry evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-url-entry-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'store-records': {
      status: 'READY',
      evidence:
        'App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; real ads deferred.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const storeRecords = report.gates.find((gate) => gate.id === 'store-records');
  assert.equal(storeRecords.status, 'BLOCKED');
  assert.match(storeRecords.evidence, /Support URL/i);
  assert.match(storeRecords.evidence, /Privacy Policy URL/i);
});

test('release preflight blocks generic submission evidence without concrete IDs or URLs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-submission-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    submission: {
      status: 'READY',
      evidence:
        'TestFlight, Google Play internal, production submission, and monitoring evidence recorded.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const submission = report.gates.find((gate) => gate.id === 'submission');
  assert.equal(submission.status, 'BLOCKED');
  assert.match(submission.evidence, /TestFlight build/i);
  assert.match(submission.evidence, /Google Play internal track URL/i);
  assert.match(submission.evidence, /production submission ID/i);
  assert.match(submission.evidence, /monitoring report/i);
});

test('release preflight blocks local submission evidence missing production submissions', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-submission-json-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const submissionEvidence = createSubmissionEvidence({
    evidence: {
      productionSubmissions: [
        {
          platform: 'ios',
          submissionId: 'ios-submit-100',
          reviewStatus: 'submitted',
        },
      ],
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      submission: {
        status: 'READY',
        evidence: `TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; monitoring report reports/monitoring/v1-week1.md recorded; reports in ${submissionEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const submission = report.gates.find((gate) => gate.id === 'submission');
    assert.equal(submission.status, 'BLOCKED');
    assert.match(submission.evidence, /local artifact content/i);
    assert.match(submission.evidence, /android production submission/i);
  } finally {
    submissionEvidence.cleanup();
  }
});

test('release preflight accepts valid local submission evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-submission-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const submissionEvidence = createSubmissionEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      submission: {
        status: 'READY',
        evidence: `TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; monitoring report reports/monitoring/v1-week1.md recorded; reports in ${submissionEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    assert.equal(report.gates.find((gate) => gate.id === 'submission').status, 'READY');
  } finally {
    submissionEvidence.cleanup();
  }
});

test('release preflight blocks dirty release worktrees', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-dirty-worktree-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir, {
    gitStatusPorcelain: ' M app/index.tsx\n?? untracked-release-file.txt',
  });

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const worktree = report.gates.find((gate) => gate.id === 'git-worktree-clean');
  assert.equal(worktree.status, 'BLOCKED');
  assert.match(worktree.evidence, /uncommitted/i);
  assert.match(worktree.evidence, /app\/index\.tsx/i);
  assert.match(worktree.evidence, /untracked-release-file\.txt/i);
});

test('release preflight blocks READY screenshot evidence with a missing local artifact path', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-missing-shot-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'device-screenshots': {
      status: 'READY',
      evidence:
        'Final screenshots captured from accepted device tooling and recorded in reports/final-store-screenshots/manifest.json.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const screenshots = report.gates.find((gate) => gate.id === 'device-screenshots');
  assert.equal(screenshots.status, 'BLOCKED');
  assert.match(screenshots.evidence, /referenced local artifact/i);
  assert.match(screenshots.evidence, /reports\/final-store-screenshots\/manifest\.json/i);
});

test('release preflight blocks local device audio evidence missing required checks', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-audio-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const audioEvidence = createDeviceAudioEvidence('android', {
    evidence: {
      checks: [{ id: 'sv-se-question-audio', result: 'passed' }],
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'android-device-audio': {
        status: 'READY',
        evidence: `Android Pixel 8 physical-device audio smoke passed; EAS build android-100; reports in ${audioEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const androidAudio = report.gates.find((gate) => gate.id === 'android-device-audio');
    assert.equal(androidAudio.status, 'BLOCKED');
    assert.match(androidAudio.evidence, /local artifact content/i);
    assert.match(androidAudio.evidence, /mock-exam-no-ads/i);
    assert.match(androidAudio.evidence, /privacy-legal-pages/i);
  } finally {
    audioEvidence.cleanup();
  }
});

test('release preflight accepts valid local device audio evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-audio-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const androidEvidence = createDeviceAudioEvidence('android');
  const iosEvidence = createDeviceAudioEvidence('ios');

  try {
    writeAllReadyEvidence(evidencePath, {
      'android-device-audio': {
        status: 'READY',
        evidence: `Android Pixel 8 physical-device audio smoke passed; EAS build android-100; reports in ${androidEvidence.relativePath}.`,
      },
      'ios-device-audio': {
        status: 'READY',
        evidence: `iPhone 15 TestFlight audio smoke passed; TestFlight build ios-100; reports in ${iosEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    assert.equal(report.gates.find((gate) => gate.id === 'android-device-audio').status, 'READY');
    assert.equal(report.gates.find((gate) => gate.id === 'ios-device-audio').status, 'READY');
  } finally {
    androidEvidence.cleanup();
    iosEvidence.cleanup();
  }
});

test('release preflight blocks local screenshot manifests that are not final device evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-invalid-shot-manifest-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const manifest = createFinalScreenshotManifest({
    manifest: {
      status: 'web-draft-only',
      note: 'browser web-draft screenshots are not final evidence',
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'device-screenshots': {
        status: 'READY',
        evidence: `Final screenshots captured from accepted device tooling and recorded in ${manifest.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const screenshots = report.gates.find((gate) => gate.id === 'device-screenshots');
    assert.equal(screenshots.status, 'BLOCKED');
    assert.match(screenshots.evidence, /local artifact content/i);
    assert.match(screenshots.evidence, /final-device/i);
    assert.match(screenshots.evidence, /web-draft/i);
  } finally {
    manifest.cleanup();
  }
});

test('release preflight blocks final screenshot manifests missing store metadata', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-shot-metadata-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const manifest = createFinalScreenshotManifest({
    manifest: {
      screenshots: [
        {
          id: 'home',
          route: '/home',
          platform: 'ios',
          device: 'iPhone 15',
          captureMethod: 'device',
          sourceBuild: 'TestFlight build 100',
          file: '01-home.png',
        },
        {
          id: 'learn',
          route: '/learn',
          platform: 'android',
          device: 'Pixel 8',
          captureMethod: 'accepted store tooling',
          sourceBuild: 'EAS Android build 100',
          pixelWidth: 1080,
          pixelHeight: 2400,
          locale: 'sv-SE',
          file: '02-learn.png',
        },
        {
          id: 'practice',
          route: '/practice',
          platform: 'ios',
          device: 'iPhone 15',
          captureMethod: 'device',
          sourceBuild: 'TestFlight build 100',
          pixelWidth: 1290,
          pixelHeight: 2796,
          locale: 'sv-SE',
          file: '03-practice.png',
        },
        {
          id: 'exam',
          route: '/exam',
          platform: 'android',
          device: 'Pixel 8',
          captureMethod: 'accepted store tooling',
          sourceBuild: 'EAS Android build 100',
          pixelWidth: 1080,
          pixelHeight: 2400,
          locale: 'sv-SE',
          file: '04-exam.png',
        },
        {
          id: 'profile',
          route: '/profile',
          platform: 'ios',
          device: 'iPhone 15',
          captureMethod: 'device',
          sourceBuild: 'TestFlight build 100',
          pixelWidth: 1290,
          pixelHeight: 2796,
          locale: 'sv-SE',
          file: '05-profile.png',
        },
      ],
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'device-screenshots': {
        status: 'READY',
        evidence: `Final screenshots captured from accepted device tooling and recorded in ${manifest.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const screenshots = report.gates.find((gate) => gate.id === 'device-screenshots');
    assert.equal(screenshots.status, 'BLOCKED');
    assert.match(screenshots.evidence, /pixelWidth/i);
    assert.match(screenshots.evidence, /pixelHeight/i);
    assert.match(screenshots.evidence, /locale/i);
  } finally {
    manifest.cleanup();
  }
});

test('release preflight accepts a valid local final screenshot manifest', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-shot-manifest-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const manifest = createFinalScreenshotManifest();

  try {
    writeAllReadyEvidence(evidencePath, {
      'device-screenshots': {
        status: 'READY',
        evidence: `Final screenshots captured from accepted device tooling and recorded in ${manifest.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const screenshots = report.gates.find((gate) => gate.id === 'device-screenshots');
    assert.equal(screenshots.status, 'READY');
    assert.match(screenshots.evidence, /final-store-screenshots/i);
  } finally {
    manifest.cleanup();
  }
});

test('release preflight blocks READY submission evidence with a missing local monitoring report', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-missing-monitoring-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    submission: {
      status: 'READY',
      evidence:
        'TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; monitoring report reports/monitoring/v1-week1.md recorded.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const submission = report.gates.find((gate) => gate.id === 'submission');
  assert.equal(submission.status, 'BLOCKED');
  assert.match(submission.evidence, /referenced local artifact/i);
  assert.match(submission.evidence, /reports\/monitoring\/v1-week1\.md/i);
});

test('release preflight blocks local submission evidence with incomplete monitoring report content', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-thin-monitoring-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const submissionEvidence = createSubmissionEvidence({
    monitoringReportContent: '# v1 week-one monitoring\n\nNo launch incidents recorded.\n',
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      submission: {
        status: 'READY',
        evidence: `TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; monitoring report reports/monitoring/v1-week1.md recorded; reports in ${submissionEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const submission = report.gates.find((gate) => gate.id === 'submission');
    assert.equal(submission.status, 'BLOCKED');
    assert.match(submission.evidence, /monitoringReport content/i);
    assert.match(submission.evidence, /crash reports/i);
    assert.match(submission.evidence, /content\/support reports/i);
    assert.match(submission.evidence, /reviews\/ratings/i);
  } finally {
    submissionEvidence.cleanup();
  }
});

test('release preflight blocks store record evidence without exact public URLs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-exact-url-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'store-records': {
      status: 'READY',
      evidence:
        'App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; Support URL and Privacy Policy URL entered in both stores; real ads deferred.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const storeRecords = report.gates.find((gate) => gate.id === 'store-records');
  assert.equal(storeRecords.status, 'BLOCKED');
  assert.match(storeRecords.evidence, /expected Support URL/i);
  assert.match(
    storeRecords.evidence,
    /https:\/\/babbloo-studio\.github\.io\/Swedish_Civic_Test-public-site\/support\//i,
  );
  assert.match(
    storeRecords.evidence,
    /https:\/\/babbloo-studio\.github\.io\/Swedish_Civic_Test-public-site\/privacy\//i,
  );
});

test('release preflight blocks local store record evidence missing store URLs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-record-json-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const storeEvidence = createStoreRecordEvidence({
    evidence: {
      appStoreConnectUrl: '',
      googlePlayConsoleUrl: '',
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-records': {
        status: 'READY',
        evidence: `App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; Support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and Privacy Policy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ entered in both stores; real ads deferred; reports in ${storeEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const storeRecords = report.gates.find((gate) => gate.id === 'store-records');
    assert.equal(storeRecords.status, 'BLOCKED');
    assert.match(storeRecords.evidence, /local artifact content/i);
    assert.match(storeRecords.evidence, /appStoreConnectUrl/i);
    assert.match(storeRecords.evidence, /googlePlayConsoleUrl/i);
  } finally {
    storeEvidence.cleanup();
  }
});

test('release preflight blocks local store record evidence without listing metadata review', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-listing-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const storeEvidence = createStoreRecordEvidence({
    evidence: {
      listingMetadata: {
        appStoreListingReviewed: false,
        appStoreListingPath: 'publishing/app-store-listing.md',
        googlePlayListingReviewed: true,
        googlePlayListingPath: 'publishing/google-play-listing.md',
        matchesStoreRecords: true,
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-records': {
        status: 'READY',
        evidence: `App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; Support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and Privacy Policy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ entered in both stores; real ads deferred; reports in ${storeEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const storeRecords = report.gates.find((gate) => gate.id === 'store-records');
    assert.equal(storeRecords.status, 'BLOCKED');
    assert.match(storeRecords.evidence, /listingMetadata/i);
    assert.match(storeRecords.evidence, /appStoreListingReviewed/i);
  } finally {
    storeEvidence.cleanup();
  }
});

test('release preflight accepts valid local store record evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-store-record-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const storeEvidence = createStoreRecordEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-records': {
        status: 'READY',
        evidence: `App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; Support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and Privacy Policy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ entered in both stores; real ads deferred; reports in ${storeEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    assert.equal(report.gates.find((gate) => gate.id === 'store-records').status, 'READY');
  } finally {
    storeEvidence.cleanup();
  }
});

test('release preflight blocks privacy review evidence without binary and ad sdk posture', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-privacy-review-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {
    'privacy-review': {
      status: 'READY',
      evidence: 'Apple privacy labels and Google Play Data safety reviewed.',
    },
  });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const privacyReview = report.gates.find((gate) => gate.id === 'privacy-review');
  assert.equal(privacyReview.status, 'BLOCKED');
  assert.match(privacyReview.evidence, /generated binary or build/i);
  assert.match(privacyReview.evidence, /ad SDK/i);
});

test('release preflight blocks local privacy review evidence with real ads enabled', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-privacy-json-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const privacyEvidence = createPrivacyReviewEvidence({
    evidence: {
      googleMobileAds: {
        sdkPresent: true,
        testAppIds: true,
        realAdsEnabled: true,
        gate: 'REAL_ADS_ENABLED_FOR_V1=true',
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'privacy-review': {
        status: 'READY',
        evidence: `Apple privacy labels and Google Play Data safety reviewed against EAS build version 1.0.0; Google Mobile Ads SDK test configuration and REAL_ADS_ENABLED_FOR_V1=false verified; no analytics, crash reporting, purchases, or real ads enabled; reports in ${privacyEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const privacyReview = report.gates.find((gate) => gate.id === 'privacy-review');
    assert.equal(privacyReview.status, 'BLOCKED');
    assert.match(privacyReview.evidence, /local artifact content/i);
    assert.match(privacyReview.evidence, /realAdsEnabled/i);
  } finally {
    privacyEvidence.cleanup();
  }
});

test('release preflight accepts valid local privacy review evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-privacy-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const privacyEvidence = createPrivacyReviewEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'privacy-review': {
        status: 'READY',
        evidence: `Apple privacy labels and Google Play Data safety reviewed against EAS build version 1.0.0; Google Mobile Ads SDK test configuration and REAL_ADS_ENABLED_FOR_V1=false verified; no analytics, crash reporting, purchases, or real ads enabled; reports in ${privacyEvidence.relativePath}.`,
      },
    });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    assert.equal(report.gates.find((gate) => gate.id === 'privacy-review').status, 'READY');
  } finally {
    privacyEvidence.cleanup();
  }
});
