const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function makeGatesFile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-gates-writer-'));
  const gatesPath = path.join(tmpDir, 'release-gates.json');
  fs.writeFileSync(
    gatesPath,
    JSON.stringify(
      {
        schemaVersion: 1,
        description: 'test gate file',
        gates: {
          'android-device-audio': {
            status: 'BLOCKED',
            evidence: 'No Android evidence recorded.',
          },
          'public-urls': {
            status: 'READY',
            evidence: 'Support URL and Privacy Policy URL ready.',
          },
        },
      },
      null,
      2,
    ),
  );
  return gatesPath;
}

test('release gate writer updates existing gate evidence without hand-editing JSON', () => {
  const gatesPath = makeGatesFile();

  const result = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence',
      'Android Pixel 8 audio smoke passed; build https://expo.dev/build/android-123',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /android-device-audio/i);
  const updated = JSON.parse(fs.readFileSync(gatesPath, 'utf8'));
  assert.equal(updated.gates['android-device-audio'].status, 'READY');
  assert.equal(
    updated.gates['android-device-audio'].evidence,
    'Android Pixel 8 audio smoke passed; build https://expo.dev/build/android-123',
  );
});

test('release gate writer refuses unknown gates and empty READY evidence', () => {
  const gatesPath = makeGatesFile();

  const unknown = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'not-a-real-gate',
      '--status',
      'BLOCKED',
      '--evidence',
      'blocked',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr || unknown.stdout, /Unknown gate/i);

  const emptyReady = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence',
      '   ',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(emptyReady.status, 1);
  assert.match(emptyReady.stderr || emptyReady.stdout, /READY evidence/i);
});

test('release gate writer accepts longer evidence from a file', () => {
  const gatesPath = makeGatesFile();
  const evidenceFile = path.join(path.dirname(gatesPath), 'android-evidence.txt');
  fs.writeFileSync(
    evidenceFile,
    [
      'Android Pixel 8 physical-device audio smoke passed.',
      'Build URL: https://expo.dev/build/android-456',
      'Tester: release operator',
      '',
    ].join('\n'),
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence-file',
      evidenceFile,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = JSON.parse(fs.readFileSync(gatesPath, 'utf8'));
  assert.match(updated.gates['android-device-audio'].evidence, /Android Pixel 8/);
  assert.match(
    updated.gates['android-device-audio'].evidence,
    /https:\/\/expo\.dev\/build\/android-456/,
  );
});

test('release evidence stub command creates gate-specific non-secret evidence files', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-stub-'));
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'store-records'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const outputPath = path.join(tmpRoot, 'reports/store-records/store-records.json');
  const stub = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:evidence-stub'],
    'node scripts/create-release-evidence-stub.js',
  );
  assert.match(result.stdout, /store-records/i);
  assert.equal(stub.gate, 'store-records');
  assert.equal(stub.status, 'blocked');
  assert.equal(stub.bundleIdentifier, 'com.billyyiu.almostswedish');
  assert.equal(stub.packageName, 'com.billyyiu.almostswedish');
  assert.match(stub.supportUrl, /szechunyiu.github.io/);
  assert.match(stub.privacyUrl, /szechunyiu.github.io/);
  assert.equal(stub.privacyPolicyUrl, undefined);
  assert.equal(stub.accountOwnership.appleBundleIdReviewed, false);
  assert.equal(stub.adMob.realAdsEnabled, true);
  assert.equal(stub.listingMetadata.appStoreListingPath, 'publishing/app-store-listing.md');

  const secondRun = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'store-records'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(secondRun.status, 1);
  assert.match(secondRun.stderr || secondRun.stdout, /already exists/i);
});

function createStub(tmpRoot, gate, relativePath) {
  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', gate],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, new RegExp(gate));
  return JSON.parse(fs.readFileSync(path.join(tmpRoot, relativePath), 'utf8'));
}

test('release evidence stub templates match current release-preflight artifact schemas', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-schema-stubs-'));
  const stubs = {
    eas: createStub(
      tmpRoot,
      'eas-build-artifacts',
      'reports/eas-build-artifacts/eas-build-artifacts.json',
    ),
    androidAudio: createStub(tmpRoot, 'android-device-audio', 'reports/device-smoke/android.json'),
    iosAudio: createStub(tmpRoot, 'ios-device-audio', 'reports/device-smoke/ios.json'),
    storeRecords: createStub(tmpRoot, 'store-records', 'reports/store-records/store-records.json'),
    storeCredentials: createStub(
      tmpRoot,
      'store-credentials',
      'reports/store-credentials/store-credentials.json',
    ),
    storePolicy: createStub(
      tmpRoot,
      'store-policy-questionnaires',
      'reports/store-policy-questionnaires/store-policy-questionnaires.json',
    ),
    privacy: createStub(tmpRoot, 'privacy-review', 'reports/privacy-review/privacy-review.json'),
    ownerApproval: createStub(
      tmpRoot,
      'release-owner-approval',
      'reports/release-owner-approval/release-owner-approval.json',
    ),
    screenshots: createStub(
      tmpRoot,
      'device-screenshots',
      'reports/final-store-screenshots/manifest.json',
    ),
    submission: createStub(tmpRoot, 'submission', 'reports/submission/submission.json'),
  };

  assert.equal(stubs.eas.status, 'blocked');
  assert.equal(stubs.eas.android.artifactType, 'apk');
  assert.equal(stubs.eas.ios.artifactType, 'ipa');
  assert.equal(stubs.eas.android.buildId.startsWith('pending-'), true);
  assert.equal(stubs.eas.ios.buildUrl.startsWith('pending-'), true);

  for (const [platform, stub] of [
    ['android', stubs.androidAudio],
    ['ios', stubs.iosAudio],
  ]) {
    assert.equal(stub.status, 'pending');
    assert.equal(stub.platform, platform);
    assert.equal(stub.sourceBuild, 'pending-eas-build-url-or-id');
    assert.deepEqual(
      stub.checks.map((check) => check.id),
      [
        'sv-se-question-audio',
        'audio-button-state',
        'speech-engine-unavailable',
        'onboarding',
        'practice-answer-flow',
        'mock-exam-no-ads',
        'progress-restart',
        'privacy-legal-pages',
      ],
    );
    assert.ok(stub.checks.every((check) => check.result === 'pending' && check.notes));
    assert.deepEqual(stub.artifacts, []);
    assert.equal(stub.buildIdOrUrl, undefined);
    assert.equal(stub.buildIdOrTestFlightUrl, undefined);
    assert.equal(stub.proofArtifact, undefined);
  }

  assert.equal(stubs.storeRecords.bundleIdentifier, 'com.billyyiu.almostswedish');
  assert.equal(stubs.storeRecords.packageName, 'com.billyyiu.almostswedish');
  assert.equal(
    stubs.storeRecords.privacyUrl,
    'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/',
  );
  assert.equal(stubs.storeRecords.privacyPolicyUrl, undefined);
  assert.equal(stubs.storeRecords.accountOwnership.googlePackageNameReviewed, false);
  assert.equal(stubs.storeRecords.adMob.realAdsEnabled, true);
  assert.match(stubs.storeRecords.adMob.appAdsTxtPublisherLine, /^google\.com, pub-\d+, DIRECT,/);
  assert.equal(
    stubs.storeRecords.listingMetadata.googlePlayListingPath,
    'publishing/google-play-listing.md',
  );

  assert.equal(stubs.storeCredentials.status, 'blocked');
  assert.equal(stubs.storeCredentials.appStoreConnect, undefined);
  assert.equal(stubs.storeCredentials.googlePlay, undefined);
  assert.equal(stubs.storeCredentials.ios.appleId, 'pending-apple-id-email');
  assert.equal(stubs.storeCredentials.ios.credentialsSource, 'pending-secure-source-outside-git');
  assert.equal(stubs.storeCredentials.android.packageName, 'com.billyyiu.almostswedish');
  assert.match(stubs.storeCredentials.android.serviceAccountEmail, /iam\.gserviceaccount\.com$/);

  assert.equal(stubs.storePolicy.status, 'pending-review');
  assert.equal(stubs.storePolicy.googlePlay, undefined);
  assert.equal(stubs.storePolicy.apple.noOfficialAffiliationClaims, false);
  assert.equal(stubs.storePolicy.apple.usesNonExemptEncryption, false);
  assert.equal(stubs.storePolicy.google.noGovernmentAffiliationClaims, false);
  assert.equal(stubs.storePolicy.google.containsRealMoneyGambling, false);
  assert.ok(stubs.storePolicy.evidenceBasis.includes('reports/store-records/store-records.json'));

  assert.equal(stubs.privacy.status, 'blocked');
  assert.equal(stubs.privacy.binaryBuildIdOrUrl, undefined);
  assert.equal(stubs.privacy.reviewedBuild.version, '1.0.0');
  assert.equal(stubs.privacy.applePrivacyLabels.path, 'publishing/privacy-labels.md');
  assert.equal(stubs.privacy.googlePlayDataSafety.path, 'publishing/google-play-data-safety.md');
  assert.equal(stubs.privacy.googleMobileAds.realAdsEnabled, true);
  assert.equal(stubs.privacy.disabledSdks.analytics, true);

  assert.equal(stubs.ownerApproval.status, 'blocked');
  assert.equal(stubs.ownerApproval.approved, undefined);
  assert.equal(stubs.ownerApproval.approvedForStoreSubmission, undefined);
  assert.equal(stubs.ownerApproval.releaseDecision, 'pending-owner-decision');
  assert.equal(stubs.ownerApproval.evidenceReport, 'reports/release-evidence-2026-05-15.md');
  assert.deepEqual(stubs.ownerApproval.checkedGates, []);

  assert.equal(stubs.screenshots.status, 'blocked');
  assert.equal(
    stubs.screenshots.screenshotStatus,
    'pending-final-device-or-accepted-store-tooling',
  );
  assert.equal(stubs.screenshots.contentReview.mockExamShowsNoAds, false);
  assert.deepEqual(stubs.screenshots.screenshots, []);

  assert.equal(stubs.submission.status, 'blocked');
  assert.equal(stubs.submission.testFlightBuild.buildNumber, 'pending-testflight-build-number');
  assert.equal(
    stubs.submission.googlePlayInternal.trackUrl,
    'pending-google-play-internal-track-url',
  );
  assert.equal(stubs.submission.googlePlayInternalTrackUrl, undefined);
  assert.deepEqual(
    stubs.submission.productionSubmissions.map((submission) => submission.platform),
    ['ios', 'android'],
  );
  assert.equal(stubs.submission.monitoringReport, 'reports/monitoring/v1-week1.md');
  assert.equal(stubs.submission.monitoringReportPath, undefined);

  const serialized = JSON.stringify(stubs);
  assert.doesNotMatch(serialized, /com\.billyyiu\.swedishcivictest/);
  assert.doesNotMatch(serialized, /\bTBD\b/);
});

test('release evidence stub command creates all missing blocked manual templates', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-stubs-all-'));
  const tmpReports = path.join(tmpRoot, 'reports');
  fs.mkdirSync(path.join(tmpReports, 'store-records'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, 'reports/release-gates.json'),
    path.join(tmpReports, 'release-gates.json'),
  );
  fs.writeFileSync(
    path.join(tmpReports, 'store-records/store-records.json'),
    `${JSON.stringify({ gate: 'store-records', keep: 'existing owner draft' }, null, 2)}\n`,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--all'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:evidence-stubs-all'],
    'node scripts/create-release-evidence-stub.js --all',
  );
  assert.match(result.stdout, /Created eas-build-artifacts evidence stub/i);
  assert.match(result.stdout, /Skipped store-records evidence stub/i);
  assert.equal(
    fs.existsSync(path.join(tmpReports, 'eas-build-artifacts/eas-build-artifacts.json')),
    true,
  );
  assert.equal(fs.existsSync(path.join(tmpReports, 'submission/submission.json')), true);
  assert.equal(
    fs.existsSync(
      path.join(tmpReports, 'store-policy-questionnaires/store-policy-questionnaires.json'),
    ),
    false,
  );
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(tmpReports, 'store-records/store-records.json'), 'utf8')),
    { gate: 'store-records', keep: 'existing owner draft' },
  );
});

test('release evidence stub command rejects unknown gates', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-stub-unknown-'));
  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'not-a-gate'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /Unknown gate/i);
});

test('release evidence stub list stays synchronized with blocked manual gates', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--list'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const rows = JSON.parse(result.stdout);
  const gates = JSON.parse(fs.readFileSync(path.join(repoRoot, 'reports/release-gates.json')));
  const blockedManualGates = Object.entries(gates.gates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate)
    .sort();

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(rows.map((row) => row.gate).sort(), blockedManualGates);
  assert.equal(
    rows.some((row) => row.gate === 'public-urls'),
    false,
  );
  for (const row of rows) {
    assert.match(row.path, /^reports\//);
    assert.ok(
      ['blocked', 'pending', 'pending-review'].includes(row.status),
      `${row.gate} should list an intentionally blocked or pending draft status`,
    );
  }
});

test('release evidence index command summarizes stub readiness for blocked manual gates', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-index-'));
  const reportPath = path.join(tmpRoot, 'evidence-index.md');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  fs.mkdirSync(path.join(tmpRoot, 'reports/store-records'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpRoot, 'reports/store-records/store-records.json'),
    `${JSON.stringify({ gate: 'store-records', status: 'blocked' }, null, 2)}\n`,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/write-release-evidence-index.js', '--root', tmpRoot, '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const report = fs.readFileSync(reportPath, 'utf8');

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:evidence-index'],
    'node scripts/write-release-evidence-index.js --out reports/release-evidence-index-latest.md',
  );
  assert.match(result.stdout, /Release evidence index BLOCKED/i);
  assert.match(report, /# Release evidence index/);
  assert.match(report, /\| `store-records` \| BLOCKED \| exists \|/);
  assert.match(report, /\| `eas-build-artifacts` \| BLOCKED \| missing \|/);
  assert.match(report, /npm run release:evidence-stub -- --gate eas-build-artifacts/);
  assert.doesNotMatch(report, /`public-urls`/);
});

test('release owner action packet lists only remaining external blockers', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-owner-action-packet-'));
  const reportPath = path.join(tmpRoot, 'owner-action-packet.md');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  const result = spawnSync(
    process.execPath,
    ['scripts/write-release-owner-action-packet.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:owner-action-packet'],
    'node scripts/write-release-owner-action-packet.js',
  );

  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /# Release owner action packet/);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /Remaining owner actions \| 10/);
  assert.match(report, /npm run release:evidence-stubs-all/);
  assert.match(report, /`eas-auth`/);
  assert.match(report, /EXPO_TOKEN/);
  assert.match(report, /`store-records`/);
  assert.match(report, /App Store Connect/);
  assert.match(report, /Google Play Console/);
  assert.match(report, /non-SzeChunYiu accounts\/remotes/);
  assert.doesNotMatch(report, /`store-policy-questionnaires`/);
  assert.match(report, /SzeChunYiu\/Swedish_Civic_Test/);
});
