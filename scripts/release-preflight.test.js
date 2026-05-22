const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const publicUrls = require('../config/publicUrls.json');
const supportUrl = publicUrls.support;
const privacyUrl = publicUrls.privacy;
const appAdsTxtUrl = publicUrls.appAdsTxt;
const adMobAppId = 'ca-app-pub-1234567890123456~1234567890';
const appAdsSellerLine = 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function staleNativeIdentifierPattern() {
  return new RegExp(['com', 'billyyiu', 'swedishcivictest'].join('\\.'), 'i');
}

function oldRealAdsEnvFlagPattern() {
  return new RegExp(['REAL_ADS', 'ENABLED_FOR_V1'].join('_'), 'i');
}

function staleDisabledAdsDecisionPattern() {
  return /real[-\s]+ads[-\s]+disabled|keep\s+real\s+ads\s+disabled/i;
}

function disabledGoogleMobileAdsPattern() {
  return new RegExp(['disabled', 'Google Mobile Ads'].join('\\s+'), 'i');
}

function staleDeferredRealAdsStatusPattern() {
  return new RegExp(['deferred', 'real', 'ads', 'disabled'].join('[-\\s]+'), 'i');
}

function staleCurrentReleaseAdEvidencePattern() {
  const oldFlag = ['REAL_ADS', 'ENABLED_FOR_V1'].join('_');
  return new RegExp(
    [
      ['AdMob', 'is', 'deferred'].join('\\s+'),
      ['real ads? remain', 'disabled'].join('\\s+'),
      'real ads? (?:is|are)\\s+disabled',
      'keep\\s+real\\s+ads\\s+disabled',
      ['deferred', 'real', 'ads', 'disabled'].join('[-\\s]+'),
      ['disabled', 'Google Mobile Ads'].join('\\s+'),
      `${oldFlag}\\s*=\\s*false`,
    ].join('|'),
    'i',
  );
}

function assertNoStaleCurrentReleaseAdEvidence(value) {
  assert.doesNotMatch(JSON.stringify(value), staleCurrentReleaseAdEvidencePattern());
  assert.doesNotMatch(JSON.stringify(value), oldRealAdsEnvFlagPattern());
}

function storeRecordReadyEvidence(extra = '') {
  return [
    `App Store Connect and Google Play Console records exist for com.billyyiu.almostswedish.`,
    `Support URL ${supportUrl} and Privacy Policy URL ${privacyUrl} entered in both stores.`,
    `AdMob app ${adMobAppId} is configured for ad-supported v1.0 and app-ads.txt is reviewed.`,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function storePolicyReadyEvidence(extra = '') {
  return [
    'Apple age rating/export compliance/content rights/no-official-affiliation review completed.',
    'Google Play content rating, target audience, Google Mobile Ads ads declaration, ATT/UMP consent disclosures, and Remove Ads IAP questionnaire reviewed.',
    'Real-money gambling and government-affiliation claims are absent.',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function privacyReviewReadyEvidence(extra = '') {
  return [
    'Apple privacy labels and Google Play Data safety reviewed against EAS build version 1.0.0.',
    'Google Mobile Ads SDK real-ad path and EXPO_PUBLIC_REAL_ADS_ENABLED=true verified.',
    'Remove Ads non-consumable in-app purchase at 29 SEK reviewed.',
    'App Tracking Transparency and UMP consent disclosures reviewed.',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function removeAdsDeviceQaReadyEvidence(extra = '') {
  return [
    'Android EAS preview build and iOS EAS preview/TestFlight build Remove Ads device QA passed.',
    'AdMob test ads rendered on study screens before purchase.',
    'Remove Ads purchase disables ads.',
    'Remove Ads entitlement persists after relaunch.',
    'Restore purchase works.',
    'ATT prompt exercised and UMP consent prompt exercised.',
    'No ad renders on mock exam screens.',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('checked-in local evidence stubs keep blocked current ad-supported shape', () => {
  const storeRecords = readJson('reports/store-records/store-records.json');
  const privacyReview = readJson('reports/privacy-review/privacy-review.json');
  const releaseGates = readJson('reports/release-gates.json');
  const storePolicyQuestionnaires = readJson(
    'reports/store-policy-questionnaires/store-policy-questionnaires.json',
  );
  const storeRecordsSource = fs.readFileSync(
    path.join(repoRoot, 'reports/store-records/store-records.json'),
    'utf8',
  );
  const privacyReviewSource = fs.readFileSync(
    path.join(repoRoot, 'reports/privacy-review/privacy-review.json'),
    'utf8',
  );
  const currentReleaseEvidenceSources = [
    storeRecordsSource,
    privacyReviewSource,
    read('reports/release-gates.json'),
    read('reports/store-policy-questionnaires/store-policy-questionnaires.json'),
    read('publishing/post-eas-auth-runbook.md'),
  ];

  assert.equal(storeRecords.status, 'blocked');
  assert.equal(storeRecords.bundleIdentifier, 'com.billyyiu.almostswedish');
  assert.equal(storeRecords.packageName, 'com.billyyiu.almostswedish');
  assert.equal(storeRecords.supportUrl, supportUrl);
  assert.equal(storeRecords.privacyUrl, privacyUrl);
  assert.match(storeRecords.adMob.appId, /^ca-app-pub-\d{16}~\d{10}$/);
  assert.match(storeRecords.adMob.iosAppId, /^ca-app-pub-\d{16}~\d{10}$/);
  assert.match(storeRecords.adMob.androidAppId, /^ca-app-pub-\d{16}~\d{10}$/);
  assert.equal(storeRecords.adMob.realAdsEnabled, true);
  assert.equal(storeRecords.adMob.appAdsTxtReviewed, false);
  assert.match(storeRecords.adMob.appAdsTxtPublisherLine, /^google\.com, pub-\d+, DIRECT,/);

  assert.equal(privacyReview.status, 'blocked');
  assert.equal(privacyReview.reviewedBuild.version, '1.0.0');
  assert.equal(privacyReview.googleMobileAds.sdkPresent, true);
  assert.equal(privacyReview.googleMobileAds.realAdsEnabled, true);
  assert.equal(privacyReview.googleMobileAds.removeAdsIapReviewed, false);
  assert.equal(privacyReview.googleMobileAds.consentFlowReviewed, false);
  assert.match(privacyReview.googleMobileAds.gate, /EXPO_PUBLIC_REAL_ADS_ENABLED=true/);
  assert.match(privacyReview.googleMobileAds.gate, /Google Mobile Ads/);
  assert.match(privacyReview.googleMobileAds.gate, /Remove Ads/);
  assert.match(privacyReview.googleMobileAds.gate, /29 SEK/);
  assert.match(privacyReview.googleMobileAds.gate, /ATT and UMP consent/i);
  assert.notEqual(privacyReview.disabledSdks.realAds, true);
  assert.notEqual(privacyReview.disabledSdks.purchases, true);

  const storeRecordsGate = releaseGates.gates['store-records'];
  const storePolicyGate = releaseGates.gates['store-policy-questionnaires'];
  const privacyGate = releaseGates.gates['privacy-review'];
  assert.equal(storeRecordsGate.status, 'BLOCKED');
  assert.match(storeRecordsGate.evidence, /AdMob app IDs|Google Mobile Ads/i);
  assert.match(storeRecordsGate.evidence, /app-ads\.txt/i);
  assert.equal(storePolicyGate.status, 'READY');
  assert.match(storePolicyGate.evidence, /Google Mobile Ads/i);
  assert.match(storePolicyGate.evidence, /ATT\/UMP|consent/i);
  assert.match(storePolicyGate.evidence, /Remove Ads/i);
  assert.match(privacyGate.evidence, /Google Mobile Ads/i);
  assert.match(privacyGate.evidence, /ATT\/UMP|consent/i);
  assert.match(privacyGate.evidence, /Remove Ads/i);
  assert.equal(releaseGates.gates['remove-ads-device-qa'].status, 'BLOCKED');
  assert.match(releaseGates.gates['remove-ads-device-qa'].evidence, /Remove Ads device QA/i);
  assert.match(releaseGates.gates['remove-ads-device-qa'].evidence, /ATT and UMP/i);
  assert.match(releaseGates.gates['remove-ads-device-qa'].evidence, /exam screens/i);

  assert.deepEqual(storePolicyQuestionnaires.evidenceBasis, [
    'publishing/app-store-listing.md',
    'publishing/google-play-listing.md',
    'publishing/admob-progress.md',
    'publishing/privacy-labels.md',
    'publishing/google-play-data-safety.md',
    'reports/store-records/store-records.json',
  ]);
  assert.match(storePolicyQuestionnaires.google.notes, /Google Mobile Ads/i);
  assert.match(storePolicyQuestionnaires.google.notes, /ATT\/UMP|consent/i);
  assert.match(storePolicyQuestionnaires.google.notes, /Remove Ads/i);

  for (const source of currentReleaseEvidenceSources) {
    assert.doesNotMatch(source, /com\.billyyiu\.swedishcivictest(?!"?\.removeads)/);
    assert.doesNotMatch(source, /REAL_ADS_ENABLED_FOR_V1/);
    assert.doesNotMatch(source, /real ads? (?:is|are )?disabled/i);
    assert.doesNotMatch(source, staleDeferredRealAdsStatusPattern());
    assert.doesNotMatch(source, staleCurrentReleaseAdEvidencePattern());
  }
});

function preflightEnvWithReadyDeviceQa(options = {}) {
  const env = { ...process.env, ...(options.env || {}) };
  let qaEvidence;
  const shouldAttachReadyDeviceQa =
    options.readyDeviceQa === true ||
    (options.expectedStatus === 0 && options.readyDeviceQa !== false);

  if (shouldAttachReadyDeviceQa && !env.RELEASE_PREFLIGHT_DEVICE_QA_PATH) {
    qaEvidence = createRemoveAdsDeviceQaEvidence();
    env.RELEASE_PREFLIGHT_DEVICE_QA_PATH = qaEvidence.relativeReportPath;
  }

  return {
    env,
    cleanup: () => qaEvidence?.cleanup(),
  };
}

function runPreflight(options = {}) {
  const readyDeviceQa = preflightEnvWithReadyDeviceQa(options);
  let result;
  try {
    result = spawnSync(
      process.execPath,
      ['scripts/release-preflight.js', '--json', ...(options.args || [])],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: readyDeviceQa.env,
      },
    );
    if (options.expectedStatus !== undefined) {
      assert.equal(result.status, options.expectedStatus, result.stderr || result.stdout);
    }
  } finally {
    readyDeviceQa.cleanup();
  }
  return JSON.parse(result.stdout);
}

function runPreflightText(options = {}) {
  const readyDeviceQa = preflightEnvWithReadyDeviceQa(options);
  let result;
  try {
    result = spawnSync(
      process.execPath,
      ['scripts/release-preflight.js', ...(options.args || [])],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: readyDeviceQa.env,
      },
    );
    if (options.expectedStatus !== undefined) {
      assert.equal(result.status, options.expectedStatus, result.stderr || result.stdout);
    }
  } finally {
    readyDeviceQa.cleanup();
  }
  return result.stdout;
}

function runPreflightAsync(options = {}) {
  const readyDeviceQa = preflightEnvWithReadyDeviceQa(options);
  let cleanupCalled = false;
  const cleanup = () => {
    if (cleanupCalled) return;
    cleanupCalled = true;
    readyDeviceQa.cleanup();
  };

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/release-preflight.js', '--json', ...(options.args || [])],
      {
        cwd: repoRoot,
        env: readyDeviceQa.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      cleanup();
      reject(error);
    });
    child.on('close', (status) => {
      try {
        cleanup();
        if (options.expectedStatus !== undefined) {
          assert.equal(status, options.expectedStatus, stderr || stdout);
        }
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function withPublicUrlServer(callback) {
  const requestedPaths = [];
  const server = http.createServer((request, response) => {
    requestedPaths.push(new URL(request.url, 'http://127.0.0.1').pathname);
    if (request.url === '/support/' || request.url === '/privacy/') {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><title>public page</title>');
      return;
    }
    if (request.url === '/app-ads.txt') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end(`# hosted app-ads fixture\n${appAdsSellerLine}\n`);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('missing');
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        resolve(await callback(`http://127.0.0.1:${port}`, requestedPaths));
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

function replaceRequired(source, search, replacement) {
  assert.ok(source.includes(search), `fixture source should include ${search}`);
  return source.replace(search, replacement);
}

function writeRemoveAdsPurchasesFixture(tmpDir, transform = (source) => source) {
  const purchasesPath = path.join(tmpDir, 'purchases.ts');
  fs.writeFileSync(purchasesPath, transform(read('lib/monetization/purchases.ts')));
  return purchasesPath;
}

function writeRemoveAdsWiringFixture(tmpDir, includeWiring = true) {
  const wiringRoot = path.join(tmpDir, 'remove-ads-wiring');
  fs.mkdirSync(wiringRoot, { recursive: true });
  if (includeWiring) {
    fs.writeFileSync(
      path.join(wiringRoot, 'RemoveAdsWiring.tsx'),
      "export const removeAdsWiring = 'Remove Ads placement';\n",
    );
  }
  return wiringRoot;
}

function writeFakeReleaseCommands(tmpDir, options = {}) {
  const fakeNpm = path.join(tmpDir, 'npm');
  const fakeNpx = path.join(tmpDir, 'npx');
  const fakeGit = path.join(tmpDir, 'git');
  const fakeGrep = path.join(tmpDir, 'grep');
  const expoDoctorOutput = String(
    options.expoDoctorOutput || '17/17 checks passed. No issues detected!',
  ).replace(/'/g, "'\\''");
  const expoDoctorStatus = Number.isInteger(options.expoDoctorStatus)
    ? options.expoDoctorStatus
    : 0;

  fs.writeFileSync(
    fakeNpm,
    [
      '#!/bin/sh',
      `if [ "$1 $2 $3" = "exec -- expo-doctor" ]; then printf '%s\\n' '${expoDoctorOutput}'; exit ${expoDoctorStatus}; fi`,
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
      ...(options.easWhoamiMixedFailure
        ? [
            'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then',
            '  echo "eas-cli@19.0.1 is now available. Proceeding with outdated version." >&2',
            '  echo "Not logged in"',
            '  exit 1',
            'fi',
          ]
        : [
            'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "expo-user"; exit 0; fi',
          ]),
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

function writeAllReadyEvidence(evidencePath, overrides = {}, options = {}) {
  const releaseScopeOverride =
    options.includeReleaseScopeOverride === false
      ? {}
      : {
          'release-scope-v11': {
            status: 'READY',
            evidence:
              'Operator approved v1.1 foundations before v1.0 Remove Ads closure for this release-preflight fixture.',
          },
        };

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        gates: {
          'eas-build-artifacts': {
            status: 'READY',
            evidence:
              'Android EAS AAB build and iOS EAS IPA/TestFlight build artifacts recorded at https://expo.dev/builds/ready.',
          },
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
          'remove-ads-device-qa': {
            status: 'READY',
            evidence: removeAdsDeviceQaReadyEvidence(),
          },
          'store-records': {
            status: 'READY',
            evidence: storeRecordReadyEvidence(),
          },
          'store-credentials': {
            status: 'READY',
            evidence:
              'App Store Connect and Google Play service-account submit credentials verified at https://example.com/store-credentials/evidence.',
          },
          'store-policy-questionnaires': {
            status: 'READY',
            evidence: storePolicyReadyEvidence(
              'Evidence recorded at https://example.com/store-policy/evidence.',
            ),
          },
          'privacy-review': {
            status: 'READY',
            evidence: privacyReviewReadyEvidence(),
          },
          'public-urls': {
            status: 'READY',
            evidence: `Support URL ${supportUrl}, Privacy Policy URL ${privacyUrl}, and app-ads.txt URL ${appAdsTxtUrl} verified over HTTPS.`,
          },
          'device-screenshots': {
            status: 'READY',
            evidence:
              'Final screenshots captured from accepted device tooling and recorded at https://example.com/final-store-screenshots/manifest.json.',
          },
          'release-owner-approval': {
            status: 'READY',
            evidence:
              'Release owner approved store submission at https://example.com/release-owner-approval/evidence.',
          },
          submission: {
            status: 'READY',
            evidence:
              'TestFlight build 100 processing complete; Google Play internal track URL https://play.google.com/console/internal version code 100 tester group qa; production submission ID ios-submit-100 and android-submit-100; post-launch report https://example.com/monitoring/v1-week1 recorded.',
          },
          ...releaseScopeOverride,
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
    contentReview: {
      noOfficialAffiliationClaims: true,
      noGuaranteedExamResultClaims: true,
      mockExamShowsNoAds: true,
      noTestAdBanners: true,
      privacyAndSourcePagesMatchPublishingDocs: true,
    },
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

function createEasBuildEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'eas-builds',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'ready',
    appVersion: '1.0.0',
    gitCommit: 'abcdef1',
    android: {
      profile: 'internal',
      buildId: 'android-build-100',
      buildUrl:
        'https://expo.dev/accounts/example/projects/almost-swedish/builds/android-build-100',
      artifactType: 'aab',
      installOrTestStatus: 'ready-for-device-smoke',
    },
    ios: {
      profile: 'internal',
      buildId: 'ios-build-100',
      buildUrl: 'https://expo.dev/accounts/example/projects/almost-swedish/builds/ios-build-100',
      artifactType: 'ipa',
      installOrTestStatus: 'ready-for-testflight',
    },
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'eas-builds.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'eas-builds.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

test('release blocker snapshot command writes issue-ready blocker report from preflight JSON', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-blockers-snapshot-'));
  const preflightJsonPath = path.join(tmpDir, 'preflight.json');
  const reportPath = path.join(tmpDir, 'release-blockers.md');
  fs.writeFileSync(
    preflightJsonPath,
    JSON.stringify(
      {
        status: 'BLOCKED',
        readyForSubmission: false,
        gates: [
          {
            id: 'local-validation',
            label: 'Local validation suite',
            status: 'READY',
            evidence: '`npm run validate` passed.',
            nextAction: 'Run `npm run release:preflight`.',
          },
          {
            id: 'eas-auth',
            label: 'Expo/EAS authentication',
            status: 'BLOCKED',
            evidence: 'Not logged in',
            nextAction:
              'Log in to Expo/EAS or provide an approved Expo token, then rerun `npx --yes eas-cli@18.13.0 whoami`.',
          },
          {
            id: 'public-urls',
            label: 'Public support, privacy, and app-ads URLs',
            status: 'READY',
            evidence: 'Support, Privacy Policy, and app-ads URLs returned HTTP 200.',
            nextAction: 'Enter URLs in both store records.',
          },
        ],
      },
      null,
      2,
    ),
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/write-release-blocker-snapshot.js',
      '--preflight-json',
      preflightJsonPath,
      '--out',
      reportPath,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.equal(
    pkg.scripts['release:blockers-snapshot'],
    'node scripts/write-release-blocker-snapshot.js --run-validate --out reports/release-blockers-latest.md',
  );
  assert.match(result.stdout, /Release blocker snapshot BLOCKED/i);
  assert.match(report, /https:\/\/github\.com\/SzeChunYiu\/Swedish_Civic_Test\/issues\/11/);
  assert.match(report, /## Blocked gates/);
  assert.match(
    report,
    /\| `eas-auth` \| Expo\/EAS authentication \| Not logged in \| Log in to Expo\/EAS/,
  );
  assert.doesNotMatch(report, /\| `public-urls` \| Public support and privacy URLs \|/);
  assert.match(report, /## Ready gates/);
  assert.match(report, /`public-urls`/);
});

test('release completion audit command maps objective to preflight evidence before completion', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-completion-audit-'));
  const preflightJsonPath = path.join(tmpDir, 'preflight.json');
  const reportPath = path.join(tmpDir, 'completion-audit.md');
  fs.writeFileSync(
    preflightJsonPath,
    JSON.stringify(
      {
        status: 'BLOCKED',
        readyForSubmission: false,
        gates: [
          {
            id: 'eas-auth',
            label: 'Expo/EAS authentication',
            status: 'BLOCKED',
            evidence: 'Not logged in',
            nextAction: 'Log in to Expo/EAS.',
          },
          {
            id: 'public-urls',
            label: 'Public support, privacy, and app-ads URLs',
            status: 'READY',
            evidence: 'SzeChunYiu Pages returned HTTP 200.',
            nextAction: 'Enter URLs in store records.',
          },
        ],
      },
      null,
      2,
    ),
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/write-release-completion-audit.js',
      '--preflight-json',
      preflightJsonPath,
      '--out',
      reportPath,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.equal(
    pkg.scripts['release:completion-audit'],
    'node scripts/write-release-completion-audit.js --run-validate --out reports/release-completion-audit-latest.md',
  );
  assert.match(result.stdout, /Release completion audit NOT COMPLETE/i);
  assert.match(report, /# Release completion audit/);
  assert.match(report, /\| Upload target owner \| SzeChunYiu \| READY \|/);
  assert.match(
    report,
    new RegExp(`\\| Legacy owner not targeted \\| ${['Bab', 'bloo'].join('')}`, 'i'),
  );
  assert.match(report, /\| Store submission readiness \| npm run release:preflight \| BLOCKED \|/);
  assert.match(report, /`eas-auth`/);
  assert.match(report, /Do not mark the active goal complete/i);
});

test('release issue update draft command writes tracker-ready status comment', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-issue-update-'));
  const preflightJsonPath = path.join(tmpDir, 'preflight.json');
  const reportPath = path.join(tmpDir, 'issue-update.md');
  fs.writeFileSync(
    preflightJsonPath,
    JSON.stringify(
      {
        status: 'BLOCKED',
        readyForSubmission: false,
        gates: [
          {
            id: 'eas-auth',
            label: 'Expo/EAS authentication',
            status: 'BLOCKED',
            evidence: 'Not logged in',
            nextAction: 'Log in to Expo/EAS.',
          },
          {
            id: 'public-urls',
            label: 'Public support, privacy, and app-ads URLs',
            status: 'READY',
            evidence: 'SzeChunYiu Pages returned HTTP 200.',
            nextAction: 'Enter URLs in store records.',
          },
        ],
      },
      null,
      2,
    ),
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/write-release-issue-update.js',
      '--preflight-json',
      preflightJsonPath,
      '--out',
      reportPath,
      '--merge',
      'abc1234',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.equal(
    pkg.scripts['release:issue-update'],
    'node scripts/write-release-issue-update.js --run-validate --out reports/release-issue-update-latest.md',
  );
  assert.match(result.stdout, /Release issue update draft BLOCKED/i);
  assert.match(report, /issue #11/i);
  assert.match(report, /merge `abc1234`/);
  assert.match(report, /SzeChunYiu\/Swedish_Civic_Test/);
  assert.match(report, /Current blocked gates/);
  assert.match(report, /`eas-auth`/);
  assert.match(report, /Ready gates/);
  assert.match(report, /`public-urls`/);
  assert.match(report, /Completion audit decision: do not mark the goal complete/i);
});

test('release issue comment command posts the generated blocked status draft', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-issue-comment-'));
  const preflightJsonPath = path.join(tmpDir, 'preflight.json');
  const bodyPath = path.join(tmpDir, 'issue-update.md');
  const reportPath = path.join(tmpDir, 'issue-comment.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    preflightJsonPath,
    JSON.stringify(
      {
        status: 'BLOCKED',
        readyForSubmission: false,
        gates: [
          {
            id: 'eas-auth',
            label: 'Expo/EAS authentication',
            status: 'BLOCKED',
            evidence: 'Not logged in',
            nextAction: 'Log in to Expo/EAS.',
          },
        ],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2" = "issue comment" ] && [ "$3" = "11" ]; then echo "https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11#issuecomment-123"; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/post-release-issue-update.js',
      '--preflight-json',
      preflightJsonPath,
      '--body-out',
      bodyPath,
      '--out',
      reportPath,
      '--merge',
      'abc1234',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
    },
  );
  const body = fs.readFileSync(bodyPath, 'utf8');
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:issue-comment'],
    'node scripts/post-release-issue-update.js --run-validate --body-out reports/release-issue-update-latest.md --out reports/release-issue-comment-latest.md',
  );
  assert.match(result.stdout, /Release issue update comment POSTED/i);
  assert.match(body, /Release status update for issue #11/);
  assert.match(body, /merge `abc1234`/);
  assert.match(report, /Status \| POSTED/);
  assert.match(
    report,
    /Issue comment URL \| https:\/\/github.com\/SzeChunYiu\/Swedish_Civic_Test\/issues\/11#issuecomment-123/,
  );
  assert.match(ghCalls, /issue comment 11 --repo SzeChunYiu\/Swedish_Civic_Test --body-file/);
  assert.match(ghCalls, new RegExp(bodyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

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
    artifacts: [{ type: 'log', file: `${platform}-audio-smoke.log` }],
    ...options.evidence,
  };

  if (options.createArtifactFiles !== false) {
    for (const artifact of evidence.artifacts || []) {
      if (artifact.file) {
        fs.writeFileSync(path.join(absoluteDir, artifact.file), `${platform} audio smoke log\n`);
      }
    }
  }

  const evidencePath = path.join(absoluteDir, `${platform}-audio.json`);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, `${platform}-audio.json`),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

const removeAdsDeviceQaRequiredChecks = [
  'admob-test-ads-study-screens',
  'remove-ads-purchase-hides-ads',
  'entitlement-persists-after-relaunch',
  'restore-purchase-restores-entitlement',
  'att-status-documented',
  'ump-consent-documented',
  'mock-exam-shows-no-ads',
];

function createRemoveAdsDeviceQaEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'release-device-qa',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const createArtifact = (platform, overrides = {}) => {
    const screenshot = `${platform}-remove-ads.png`;
    const log = `${platform}-remove-ads.log`;
    const artifact = {
      schemaVersion: 1,
      status: 'passed',
      platform,
      device: platform === 'ios' ? 'iPhone 15 physical device' : 'Pixel 8 physical device',
      osVersion: platform === 'ios' ? 'iOS 18.4' : 'Android 15',
      build: {
        id: platform === 'ios' ? 'ios-build-100' : 'android-build-100',
        url:
          platform === 'ios'
            ? 'https://appstoreconnect.apple.com/testflight/ios-build-100'
            : 'https://expo.dev/accounts/example/projects/almost-swedish/builds/android-build-100',
        version: '1.0.0',
      },
      reviewer: 'Release QA',
      reviewedAt: platform === 'ios' ? '2026-05-19T11:00:00Z' : '2026-05-19T11:05:00Z',
      proof: {
        screenshots: [screenshot],
        logs: [log],
      },
      checks: removeAdsDeviceQaRequiredChecks.map((id) => ({
        id,
        result: 'passed',
        notes: `${id} observed on ${platform}`,
      })),
      ...overrides,
    };

    if (options.createProofFiles !== false) {
      for (const proofPath of [
        ...(artifact.proof?.screenshots || []),
        ...(artifact.proof?.logs || []),
      ]) {
        if (!/^https:\/\//i.test(proofPath)) {
          fs.writeFileSync(path.join(absoluteDir, proofPath), `${platform} proof\n`);
        }
      }
    }

    const artifactPath = path.join(absoluteDir, `${platform}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    return path.join(relativeDir, `${platform}.json`);
  };

  const iosArtifactPath = createArtifact('ios', options.iosArtifact);
  const androidArtifactPath = createArtifact('android', options.androidArtifact);
  const reportBody =
    options.reportBody ||
    [
      '# Release Ads/IAP Device QA',
      '',
      '## Platform Artifacts',
      '',
      `- iOS artifact: \`${iosArtifactPath}\``,
      `- Android artifact: \`${androidArtifactPath}\``,
      '',
    ].join('\n');
  const reportPath = path.join(absoluteDir, 'release-ads-iap-device-qa.md');
  fs.writeFileSync(reportPath, reportBody);

  return {
    relativeReportPath: path.join(relativeDir, 'release-ads-iap-device-qa.md'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

test('checked-in Remove Ads device QA template links structured platform JSON stubs', () => {
  const report = read('reports/release-ads-iap-device-qa.md');

  assert.match(report, /reports\/release-device-qa\/ios\.json/);
  assert.match(report, /reports\/release-device-qa\/android\.json/);
  assert.doesNotMatch(report, /\bTBD\b|placeholder|- \[[ x]\]/i);
  assert.doesNotMatch(report, /reports\/release-device-qa\/[^\s]+\.md/i);

  for (const [platform, relativePath] of [
    ['ios', 'reports/release-device-qa/ios.json'],
    ['android', 'reports/release-device-qa/android.json'],
  ]) {
    const artifact = readJson(relativePath);

    assert.equal(artifact.schemaVersion, 1);
    assert.equal(artifact.status, 'pending');
    assert.equal(artifact.platform, platform);
    assert.deepEqual(
      artifact.checks.map((check) => check.id),
      removeAdsDeviceQaRequiredChecks,
    );
    assert.ok(
      artifact.checks.every((check) => check.result === 'pending' && check.notes),
      relativePath + ' should keep every required manual check pending with reviewer guidance',
    );
    assert.ok(artifact.proof.screenshots.length > 0);
    assert.ok(artifact.proof.logs.length > 0);
  }
});

test('release preflight blocks first-class Remove Ads device QA gate on checked-in pending report', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-qa-gate-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  try {
    writeAllReadyEvidence(evidencePath);
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    const deviceQaGate = report.gates.find((gate) => gate.id === 'remove-ads-device-qa');
    assert.equal(scopeGate.status, 'READY');
    assert.equal(deviceQaGate.status, 'BLOCKED');
    assert.match(deviceQaGate.evidence, /reports\/release-ads-iap-device-qa\.md is incomplete/i);
    assert.match(deviceQaGate.evidence, /reports\/release-device-qa\/ios\.json/i);
    assert.match(deviceQaGate.evidence, /reports\/release-device-qa\/android\.json/i);
    assert.match(deviceQaGate.evidence, /status must be passed/i);
    assert.match(deviceQaGate.nextAction, /real Android and iOS EAS preview\/TestFlight QA/i);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

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
    bundleIdentifier: 'com.billyyiu.almostswedish',
    appStoreConnectUrl: 'https://appstoreconnect.apple.com/apps/1234567890/appstore',
    googlePlayConsoleUrl: 'https://play.google.com/console/u/0/developers/123/app/497123',
    supportUrl,
    privacyUrl,
    accountOwnership: {
      appleDeveloperTeamId: 'ABCDE12345',
      appleBundleIdReviewed: true,
      googlePlayDeveloperId: '123456789012',
      googlePackageNameReviewed: true,
    },
    adMob: {
      appAdsTxtReviewed: true,
      appId: adMobAppId,
      note: 'AdMob app is configured for ad-supported v1.0 with app-ads.txt reviewed.',
      realAdsEnabled: true,
      status: 'ready',
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

function createStoreCredentialEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'store-credentials',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'ready',
    ios: {
      appleId: 'release-owner@example.com',
      ascAppId: '1234567890',
      appleTeamId: 'ABCDE12345',
      credentialsSource: 'EAS credentials store',
      credentialsCheckedAt: '2026-05-16T01:25:00Z',
    },
    android: {
      serviceAccountEmail: 'play-submit@almost-swedish.iam.gserviceaccount.com',
      serviceAccountKeyFingerprint:
        'SHA256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      packageName: 'com.billyyiu.almostswedish',
      credentialsSource: 'local secure file outside git',
      credentialsCheckedAt: '2026-05-16T01:25:00Z',
    },
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'store-credentials.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'store-credentials.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

function createStorePolicyQuestionnaireEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'store-policy-questionnaires',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'reviewed',
    reviewedAt: '2026-05-16T02:35:00Z',
    reviewer: 'release-owner',
    apple: {
      ageRatingReviewed: true,
      exportComplianceReviewed: true,
      usesNonExemptEncryption: false,
      contentRightsReviewed: true,
      noOfficialAffiliationClaims: true,
    },
    google: {
      contentRatingReviewed: true,
      targetAudienceReviewed: true,
      adsDeclarationReviewed: true,
      containsRealMoneyGambling: false,
      noGovernmentAffiliationClaims: true,
      notes:
        'Google Mobile Ads ads declaration, ATT/UMP consent disclosures, and Remove Ads IAP questionnaire reviewed for ad-supported v1.0.',
    },
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'store-policy-questionnaires.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'store-policy-questionnaires.json'),
    cleanup: () => fs.rmSync(absoluteDir, { recursive: true, force: true }),
  };
}

function createReleaseOwnerApprovalEvidence(options = {}) {
  const relativeDir = path.join(
    'reports',
    'release-owner-approval',
    `test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const absoluteDir = path.join(repoRoot, relativeDir);
  fs.mkdirSync(absoluteDir, { recursive: true });

  const evidence = {
    status: 'approved',
    approvedAt: '2026-05-16T03:05:00Z',
    approver: 'release-owner',
    approvedCommit: '12ff3be',
    releaseDecision: 'approved-for-store-submission',
    noKnownBlockers: true,
    evidenceReport: 'reports/release-evidence-2026-05-15.md',
    checkedGates: [
      'eas-auth',
      'eas-build-artifacts',
      'android-device-audio',
      'ios-device-audio',
      'remove-ads-device-qa',
      'store-records',
      'store-credentials',
      'store-policy-questionnaires',
      'privacy-review',
      'public-urls',
      'device-screenshots',
    ],
    ...options.evidence,
  };

  const evidencePath = path.join(absoluteDir, 'release-owner-approval.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return {
    relativePath: path.join(relativeDir, 'release-owner-approval.json'),
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
    reviewedAt: '2026-05-16T00:40:00Z',
    reviewer: 'release-owner',
    reviewedBuild: {
      id: 'EAS build ios-100/android-100',
      version: '1.0.0',
      commit: 'abcdef1',
    },
    storeQuestionnaires: {
      appleAppStoreConnectReviewed: true,
      googlePlayConsoleReviewed: true,
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
      consentFlowReviewed: true,
      gate: 'EXPO_PUBLIC_REAL_ADS_ENABLED=true; Remove Ads non-consumable in-app purchase at 29 SEK; ATT and UMP consent reviewed.',
      realAdsEnabled: true,
      removeAdsIapReviewed: true,
      sdkPresent: true,
      testAppIds: true,
    },
    disabledSdks: {
      analytics: true,
      crashReporting: true,
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
    'eas-build-artifacts',
    'android-device-audio',
    'ios-device-audio',
    'remove-ads-device-qa',
    'store-records',
    'store-credentials',
    'store-policy-questionnaires',
    'privacy-review',
    'release-owner-approval',
    'public-urls',
    'device-screenshots',
  ]) {
    assert.ok(gateIds.has(id), `${id} should be represented`);
  }

  const blocked = report.gates.filter((gate) => gate.status === 'BLOCKED');
  assert.ok(blocked.length >= 5, 'external blockers should remain explicit');
  assert.match(report.nextActions.join('\n'), /Expo\/EAS/i);
});

test('release preflight blocks v1.1 surfaces while v1.0 Remove Ads acceptance is red', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-v11-scope-red-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
  assert.equal(scopeGate.status, 'BLOCKED');
  assert.match(scopeGate.evidence, /v1\.1 runtime\/test surfaces are present/i);
  assert.match(scopeGate.evidence, /tests\/v1-1-.*\(v1\.1 test surface\)/i);
  assert.match(
    scopeGate.evidence,
    /lib\/learning\/adaptivePractice\.ts \(v1\.1 adaptive practice runtime\)/i,
  );
  assert.match(scopeGate.evidence, /reports\/release-ads-iap-device-qa\.md is incomplete/i);
  assert.match(scopeGate.evidence, /reports\/release-device-qa\/ios\.json/i);
  assert.match(scopeGate.evidence, /reports\/release-device-qa\/android\.json/i);
  assert.match(scopeGate.nextAction, /Remove Ads structural gate/i);
  assert.match(scopeGate.nextAction, /test -f reports\/release-ads-iap-device-qa\.md/);
});

test('release preflight labels v1.1 source-marker surfaces without temp-root noise', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-v11-marker-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const scopeRoot = path.join(tmpDir, 'scan-root');

  fs.mkdirSync(scopeRoot, { recursive: true });
  fs.writeFileSync(
    path.join(scopeRoot, 'feature.ts'),
    "export const releaseScope = 'v1.1 experimental study surface';\n",
  );
  writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
  writeFakeReleaseCommands(tmpDir);

  try {
    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
        RELEASE_PREFLIGHT_V11_SCOPE_ROOTS: scopeRoot,
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    assert.equal(scopeGate.status, 'BLOCKED');
    assert.match(scopeGate.evidence, /custom-scope-root\/feature\.ts \(v1\.1 source marker\)/);
    assert.equal(scopeGate.evidence.includes(scopeRoot), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('release preflight text output labels v1.1 source-marker surfaces without temp-root noise', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-v11-marker-text-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const scopeRoot = path.join(tmpDir, 'scan-root');

  fs.mkdirSync(scopeRoot, { recursive: true });
  fs.writeFileSync(
    path.join(scopeRoot, 'feature.ts'),
    "export const adaptivePractice = 'v1.1 experimental study surface';\n",
  );
  writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
  writeFakeReleaseCommands(tmpDir);

  try {
    const env = {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      RELEASE_PREFLIGHT_V11_SCOPE_ROOTS: scopeRoot,
    };
    const report = runPreflight({ expectedStatus: 1, env });
    const text = runPreflightText({ expectedStatus: 1, env });
    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');

    assert.equal(scopeGate.status, 'BLOCKED');
    assert.match(
      scopeGate.evidence,
      /custom-scope-root\/feature\.ts \(v1\.1 adaptive practice marker; v1\.1 source marker\)/,
    );
    assert.ok(
      text.includes(scopeGate.evidence),
      'human-readable text should preserve the same v1.1 surface evidence as JSON',
    );
    assert.match(text, /release-scope-v11/);
    assert.match(
      text,
      /custom-scope-root\/feature\.ts \(v1\.1 adaptive practice marker; v1\.1 source marker\)/,
    );
    assert.equal(text.includes(scopeRoot), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('release preflight blocks Remove Ads step 3 structural drift without the brittle GOAL grep', () => {
  const cases = [
    {
      id: 'buy-product',
      expected: /buyRemoveAds must request REMOVE_ADS_PRODUCT_ID/i,
      transform: (source) =>
        replaceRequired(
          source,
          'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
          "const purchase = await provider.requestRemoveAdsPurchase('debug.removeads');",
        ),
    },
    {
      id: 'restore-product',
      expected: /restoreRemoveAdsPurchase must restore REMOVE_ADS_PRODUCT_ID/i,
      transform: (source) =>
        replaceRequired(
          source,
          'const purchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);',
          "const purchases = await provider.restorePurchases(['debug.removeads']);",
        ),
    },
    {
      id: 'price-label',
      expected: /Remove Ads price label must stay 29 SEK/i,
      transform: (source) =>
        replaceRequired(
          source,
          "export const REMOVE_ADS_PRICE_LABEL = '29 SEK';",
          "export const REMOVE_ADS_PRICE_LABEL = '30 SEK';",
        ),
    },
    {
      id: 'ios-store-product-id',
      expected: /iOS store product id must match the canonical entitlement id/i,
      transform: (source) =>
        replaceRequired(
          source,
          'export const REMOVE_ADS_IOS_PRODUCT_ID = REMOVE_ADS_PRODUCT_ID;',
          "export const REMOVE_ADS_IOS_PRODUCT_ID = 'removeads';",
        ),
    },
    {
      id: 'android-store-product-id',
      expected: /Android store product id must stay Play Console removeads/i,
      transform: (source) =>
        replaceRequired(
          source,
          "export const REMOVE_ADS_ANDROID_PRODUCT_ID = 'removeads';",
          'export const REMOVE_ADS_ANDROID_PRODUCT_ID = REMOVE_ADS_PRODUCT_ID;',
        ),
    },
    {
      id: 'store-product-map',
      expected: /store product ids must export the platform-specific Android\/iOS map/i,
      transform: (source) =>
        replaceRequired(
          source,
          'android: REMOVE_ADS_ANDROID_PRODUCT_ID,',
          'android: REMOVE_ADS_PRODUCT_ID,',
        ),
    },
    {
      id: 'visible-wiring',
      expected: /Remove Ads wiring must be visible/i,
      includeWiring: false,
    },
  ];

  for (const fixture of cases) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `release-preflight-step3-${fixture.id}-`));
    const evidencePath = path.join(tmpDir, 'release-gates.json');
    const qaEvidence = createRemoveAdsDeviceQaEvidence();

    try {
      const purchasesPath = writeRemoveAdsPurchasesFixture(tmpDir, fixture.transform);
      const wiringRoot = writeRemoveAdsWiringFixture(tmpDir, fixture.includeWiring !== false);

      writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
      writeFakeReleaseCommands(tmpDir);

      const report = runPreflight({
        expectedStatus: 1,
        env: {
          PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
          RELEASE_PREFLIGHT_DEVICE_QA_PATH: qaEvidence.relativeReportPath,
          RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
          RELEASE_PREFLIGHT_REMOVE_ADS_PURCHASES_PATH: purchasesPath,
          RELEASE_PREFLIGHT_REMOVE_ADS_WIRING_ROOTS: wiringRoot,
          RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
        },
      });

      const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
      assert.equal(scopeGate.status, 'BLOCKED', fixture.id);
      assert.match(scopeGate.evidence, fixture.expected, fixture.id);
      assert.doesNotMatch(scopeGate.evidence, /Manual device-QA gate is red/i, fixture.id);
      assert.match(scopeGate.nextAction, /structural gate replacing GOAL step 3 grep/i);
    } finally {
      qaEvidence.cleanup();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
});

test('release preflight blocks Remove Ads device QA reports without JSON artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-qa-prose-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const qaEvidence = createRemoveAdsDeviceQaEvidence({
    reportBody: [
      '# Release Ads/IAP Device QA',
      '',
      '## iOS',
      '',
      '- Evidence artifact: reports/release-device-qa/ios-notes.md',
      '',
      '## Android',
      '',
      '- Evidence artifact: reports/release-device-qa/android-notes.md',
      '',
    ].join('\n'),
  });

  try {
    writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_DEVICE_QA_PATH: qaEvidence.relativeReportPath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    const deviceQaGate = report.gates.find((gate) => gate.id === 'remove-ads-device-qa');
    assert.equal(scopeGate.status, 'BLOCKED');
    assert.equal(deviceQaGate.status, 'BLOCKED');
    assert.match(scopeGate.evidence, /must link per-platform JSON artifacts/i);
    assert.match(deviceQaGate.evidence, /must link per-platform JSON artifacts/i);
    assert.match(scopeGate.evidence, /report must link a ios JSON artifact/i);
    assert.match(scopeGate.evidence, /report must link a android JSON artifact/i);
  } finally {
    qaEvidence.cleanup();
  }
});

test('release preflight blocks Remove Ads device QA JSON artifacts missing build ids and checks', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-qa-shape-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const qaEvidence = createRemoveAdsDeviceQaEvidence({
    iosArtifact: {
      build: { id: '', url: 'https://appstoreconnect.apple.com/testflight/ios-build-100' },
      checks: [{ id: 'admob-test-ads-study-screens', result: 'failed' }],
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_DEVICE_QA_PATH: qaEvidence.relativeReportPath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    const deviceQaGate = report.gates.find((gate) => gate.id === 'remove-ads-device-qa');
    assert.equal(scopeGate.status, 'BLOCKED');
    assert.equal(deviceQaGate.status, 'BLOCKED');
    assert.match(scopeGate.evidence, /ios\.json: build\.id is required/i);
    assert.match(deviceQaGate.evidence, /ios\.json: build\.id is required/i);
    assert.match(scopeGate.evidence, /build\.version is required/i);
    assert.match(scopeGate.evidence, /admob-test-ads-study-screens result must be passed/i);
    assert.match(scopeGate.evidence, /missing passed check remove-ads-purchase-hides-ads/i);
  } finally {
    qaEvidence.cleanup();
  }
});

test('release preflight blocks Remove Ads device QA JSON artifacts without proof files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-qa-proof-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const qaEvidence = createRemoveAdsDeviceQaEvidence({ createProofFiles: false });

  try {
    writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 1,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_DEVICE_QA_PATH: qaEvidence.relativeReportPath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    const deviceQaGate = report.gates.find((gate) => gate.id === 'remove-ads-device-qa');
    assert.equal(scopeGate.status, 'BLOCKED');
    assert.equal(deviceQaGate.status, 'BLOCKED');
    assert.match(scopeGate.evidence, /proof\.screenshots\[0\] does not exist/i);
    assert.match(deviceQaGate.evidence, /proof\.screenshots\[0\] does not exist/i);
    assert.match(scopeGate.evidence, /proof\.logs\[0\] does not exist/i);
  } finally {
    qaEvidence.cleanup();
  }
});

test('release preflight accepts valid Remove Ads device QA JSON artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-qa-valid-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const qaEvidence = createRemoveAdsDeviceQaEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {}, { includeReleaseScopeOverride: false });
    writeFakeReleaseCommands(tmpDir);

    const report = runPreflight({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_DEVICE_QA_PATH: qaEvidence.relativeReportPath,
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    });

    const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
    const deviceQaGate = report.gates.find((gate) => gate.id === 'remove-ads-device-qa');
    assert.equal(scopeGate.status, 'READY');
    assert.equal(deviceQaGate.status, 'READY');
    assert.doesNotMatch(scopeGate.evidence, /device-QA gate is red/i);
    assert.match(deviceQaGate.evidence, /Device QA report validation passed/i);
    assert.doesNotMatch(scopeGate.evidence, /missing passed check/i);
    assert.doesNotMatch(scopeGate.evidence, /proof\.screenshots/i);
  } finally {
    qaEvidence.cleanup();
  }
});

test('release preflight allows v1.1 surfaces only with explicit operator override evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-v11-scope-override-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const purchasesPath = writeRemoveAdsPurchasesFixture(tmpDir, (source) =>
    replaceRequired(
      source,
      'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
      "const purchase = await provider.requestRemoveAdsPurchase('debug.removeads');",
    ),
  );

  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir);

  const report = runPreflight({
    expectedStatus: 0,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_REMOVE_ADS_PURCHASES_PATH: purchasesPath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const scopeGate = report.gates.find((gate) => gate.id === 'release-scope-v11');
  assert.equal(scopeGate.status, 'READY');
  assert.match(scopeGate.evidence, /Operator override recorded/i);
  assert.match(scopeGate.evidence, /Detected v1\.1 surfaces: .* \(v1\.1 .*?\)/i);
  assert.match(scopeGate.evidence, /v1\.1 foundations/i);
  assert.match(scopeGate.evidence, /Remove Ads/i);
});

test('release preflight blocks Expo Doctor SDK dependency mismatches', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-expo-doctor-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir, {
    expoDoctorStatus: 1,
    expoDoctorOutput:
      'expo-crypto@55.0.15 is installed, but Expo SDK 54 expects expo-crypto ~15.0.9.',
  });

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const doctorGate = report.gates.find((gate) => gate.id === 'expo-doctor');
  assert.equal(doctorGate.status, 'BLOCKED');
  assert.match(doctorGate.evidence, /expo-crypto@55\.0\.15/);
  assert.match(doctorGate.evidence, /~15\.0\.9/);
  assert.match(doctorGate.nextAction, /npm exec -- expo-doctor/);
  assert.equal(report.readyForSubmission, false);
});

test('release preflight blocks local release-owner approval evidence with unresolved blockers', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-owner-approval-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const approvalEvidence = createReleaseOwnerApprovalEvidence({
    evidence: {
      noKnownBlockers: false,
      checkedGates: ['eas-auth'],
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'release-owner-approval': {
        status: 'READY',
        evidence: `Release owner approved store submission in ${approvalEvidence.relativePath}.`,
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

    const approval = report.gates.find((gate) => gate.id === 'release-owner-approval');
    assert.equal(approval.status, 'BLOCKED');
    assert.match(approval.evidence, /local artifact content/i);
    assert.match(approval.evidence, /noKnownBlockers/i);
    assert.match(approval.evidence, /checkedGates/i);
  } finally {
    approvalEvidence.cleanup();
  }
});

test('release preflight accepts valid local release-owner approval evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-owner-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const approvalEvidence = createReleaseOwnerApprovalEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'release-owner-approval': {
        status: 'READY',
        evidence: `Release owner approved store submission in ${approvalEvidence.relativePath}.`,
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

    assert.equal(report.gates.find((gate) => gate.id === 'release-owner-approval').status, 'READY');
  } finally {
    approvalEvidence.cleanup();
  }
});

test('release preflight blocks local store policy questionnaire evidence missing reviews', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-policy-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const policyEvidence = createStorePolicyQuestionnaireEvidence({
    evidence: {
      apple: {
        ageRatingReviewed: false,
        exportComplianceReviewed: true,
        usesNonExemptEncryption: false,
        contentRightsReviewed: true,
        noOfficialAffiliationClaims: true,
      },
      google: {
        contentRatingReviewed: true,
        targetAudienceReviewed: true,
        adsDeclarationReviewed: false,
        containsRealMoneyGambling: false,
        noGovernmentAffiliationClaims: true,
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-policy-questionnaires': {
        status: 'READY',
        evidence: storePolicyReadyEvidence(`Evidence recorded in ${policyEvidence.relativePath}.`),
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

    const policy = report.gates.find((gate) => gate.id === 'store-policy-questionnaires');
    assert.equal(policy.status, 'BLOCKED');
    assert.match(policy.evidence, /local artifact content/i);
    assert.match(policy.evidence, /apple.ageRatingReviewed/i);
    assert.match(policy.evidence, /google.adsDeclarationReviewed/i);
  } finally {
    policyEvidence.cleanup();
  }
});

test('release preflight blocks local store policy questionnaire evidence with stale disabled-real-ads posture', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-policy-stale-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const oldFlag = ['REAL_ADS', 'ENABLED_FOR_V1'].join('_');
  const policyEvidence = createStorePolicyQuestionnaireEvidence({
    evidence: {
      google: {
        contentRatingReviewed: true,
        targetAudienceReviewed: true,
        adsDeclarationReviewed: true,
        containsRealMoneyGambling: false,
        noGovernmentAffiliationClaims: true,
        notes: `Google Mobile Ads SDK remains test-ID/fail-closed for v1.0 with ${oldFlag}=false.`,
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-policy-questionnaires': {
        status: 'READY',
        evidence: storePolicyReadyEvidence(`Evidence recorded in ${policyEvidence.relativePath}.`),
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

    const policy = report.gates.find((gate) => gate.id === 'store-policy-questionnaires');
    assert.equal(policy.status, 'BLOCKED');
    assert.match(policy.evidence, /local artifact content/i);
    assert.match(policy.evidence, /obsolete ad-disablement evidence/i);
    assert.doesNotMatch(policy.evidence, staleCurrentReleaseAdEvidencePattern());
    assertNoStaleCurrentReleaseAdEvidence(report);
  } finally {
    policyEvidence.cleanup();
  }
});

test('release preflight accepts valid local store policy questionnaire evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-policy-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const policyEvidence = createStorePolicyQuestionnaireEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-policy-questionnaires': {
        status: 'READY',
        evidence: storePolicyReadyEvidence(`Evidence recorded in ${policyEvidence.relativePath}.`),
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

    assert.equal(
      report.gates.find((gate) => gate.id === 'store-policy-questionnaires').status,
      'READY',
    );
  } finally {
    policyEvidence.cleanup();
  }
});

test('release preflight blocks local store credential evidence with placeholders', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-creds-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const credentialEvidence = createStoreCredentialEvidence({
    evidence: {
      ios: {
        appleId: 'TBD',
        ascAppId: '',
        appleTeamId: 'ABCDE12345',
        credentialsSource: 'EAS credentials store',
        credentialsCheckedAt: '2026-05-16T01:25:00Z',
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-credentials': {
        status: 'READY',
        evidence: `App Store Connect and Google Play service-account submit credentials verified in ${credentialEvidence.relativePath}.`,
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

    const credentials = report.gates.find((gate) => gate.id === 'store-credentials');
    assert.equal(credentials.status, 'BLOCKED');
    assert.match(credentials.evidence, /local artifact content/i);
    assert.match(credentials.evidence, /ios.appleId/i);
    assert.match(credentials.evidence, /ios.ascAppId/i);
  } finally {
    credentialEvidence.cleanup();
  }
});

test('release preflight accepts valid local store credential evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-store-creds-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const credentialEvidence = createStoreCredentialEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-credentials': {
        status: 'READY',
        evidence: `App Store Connect and Google Play service-account submit credentials verified in ${credentialEvidence.relativePath}.`,
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

    assert.equal(report.gates.find((gate) => gate.id === 'store-credentials').status, 'READY');
  } finally {
    credentialEvidence.cleanup();
  }
});

test('release preflight blocks local EAS build evidence missing platform artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-eas-builds-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const buildEvidence = createEasBuildEvidence({
    evidence: {
      android: {
        profile: 'internal',
        buildId: '',
        buildUrl: '',
        artifactType: 'apk',
        installOrTestStatus: 'ready-for-device-smoke',
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'eas-build-artifacts': {
        status: 'READY',
        evidence: `EAS Android and iOS internal build artifacts recorded in ${buildEvidence.relativePath}.`,
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

    const buildGate = report.gates.find((gate) => gate.id === 'eas-build-artifacts');
    assert.equal(buildGate.status, 'BLOCKED');
    assert.match(buildGate.evidence, /local artifact content/i);
    assert.match(buildGate.evidence, /android.buildId/i);
  } finally {
    buildEvidence.cleanup();
  }
});

test('release preflight accepts valid local EAS build evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-valid-eas-builds-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const buildEvidence = createEasBuildEvidence();

  try {
    writeAllReadyEvidence(evidencePath, {
      'eas-build-artifacts': {
        status: 'READY',
        evidence: `EAS Android and iOS internal build artifacts recorded in ${buildEvidence.relativePath}.`,
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

    assert.equal(report.gates.find((gate) => gate.id === 'eas-build-artifacts').status, 'READY');
  } finally {
    buildEvidence.cleanup();
  }
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

test('release preflight eas-auth failure preserves stderr warning and stdout auth blocker', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-eas-auth-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir, { easWhoamiMixedFailure: true });

  const report = runPreflight({
    expectedStatus: 1,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
    },
  });

  const easAuth = report.gates.find((gate) => gate.id === 'eas-auth');
  assert.equal(easAuth.status, 'BLOCKED');
  assert.match(easAuth.evidence, /eas-cli@19\.0\.1 is now available/i);
  assert.match(easAuth.evidence, /Proceeding with outdated version/i);
  assert.match(easAuth.evidence, /Not logged in/i);
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

test('release preflight accepts live public URLs and app-ads seller-line parity', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-public-url-ready-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  writeFakeReleaseCommands(tmpDir);

  await withPublicUrlServer(async (baseUrl, requestedPaths) => {
    writeAllReadyEvidence(evidencePath, {
      'public-urls': {
        status: 'READY',
        evidence: `Support URL ${supportUrl}, Privacy Policy URL ${privacyUrl}, and app-ads.txt URL ${baseUrl}/app-ads.txt verified by local release-preflight fixture.`,
      },
    });

    const report = await runPreflightAsync({
      expectedStatus: 0,
      env: {
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_PUBLIC_URLS: JSON.stringify([
          `${baseUrl}/support/`,
          `${baseUrl}/privacy/`,
        ]),
        RELEASE_PREFLIGHT_APP_ADS_URL: `${baseUrl}/app-ads.txt`,
      },
    });

    const publicUrls = report.gates.find((gate) => gate.id === 'public-urls');
    assert.equal(publicUrls.status, 'READY');
    assert.match(publicUrls.evidence, /Live URL check passed/i);
    assert.match(publicUrls.evidence, /app-ads seller line matches/i);
    assert.deepEqual(requestedPaths, ['/support/', '/privacy/', '/app-ads.txt']);
  });
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
        'App Store Connect and Google Play Console records exist for com.billyyiu.almostswedish; AdMob app configured.',
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

test('release preflight can ignore workflow-generated report files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-generated-reports-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  writeAllReadyEvidence(evidencePath);
  writeFakeReleaseCommands(tmpDir, {
    gitStatusPorcelain:
      '?? reports/external-release-loop-latest.md\n?? reports/release-issue-update-latest.md',
  });

  const report = runPreflight({
    expectedStatus: 0,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
      RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      RELEASE_PREFLIGHT_ALLOWED_DIRTY_PATHS:
        'reports/external-release-loop-latest.md,reports/release-issue-update-latest.md',
    },
  });

  const worktree = report.gates.find((gate) => gate.id === 'git-worktree-clean');
  assert.equal(worktree.status, 'READY');
  assert.match(worktree.evidence, /Only ignored generated files were present/);
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

test('release preflight blocks local device audio evidence without proof artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-device-audio-proof-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const audioEvidence = createDeviceAudioEvidence('android', {
    evidence: {
      artifacts: [],
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
    assert.match(androidAudio.evidence, /proof artifact/i);
    assert.match(androidAudio.evidence, /artifacts/i);
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

test('release preflight blocks final screenshot manifests without content review', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-shot-content-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const manifest = createFinalScreenshotManifest({
    manifest: {
      contentReview: {
        noOfficialAffiliationClaims: false,
        noGuaranteedExamResultClaims: true,
        mockExamShowsNoAds: true,
        noTestAdBanners: true,
        privacyAndSourcePagesMatchPublishingDocs: true,
      },
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
    assert.match(screenshots.evidence, /contentReview/i);
    assert.match(screenshots.evidence, /noOfficialAffiliationClaims/i);
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
        'App Store Connect and Google Play Console records exist for com.billyyiu.almostswedish; Support URL and Privacy Policy URL entered in both stores; AdMob app is configured for Google Mobile Ads and app-ads.txt is reviewed.',
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
    /https:\/\/szechunyiu\.github\.io\/Swedish_Civic_Test-public-site\/support\//i,
  );
  assert.match(
    storeRecords.evidence,
    /https:\/\/szechunyiu\.github\.io\/Swedish_Civic_Test-public-site\/privacy\//i,
  );
});

test('release preflight blocks READY release evidence with stale app identity or public host values', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-stale-identity-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const staleNativeId = ['com', 'billyyiu', 'swedishcivictest'].join('.');
  const oldVercelHost = 'https://dist-web-billy10384-5430s-projects.vercel.app/support/';

  writeAllReadyEvidence(evidencePath, {
    'store-records': {
      status: 'READY',
      evidence: `${storeRecordReadyEvidence()} Historical store draft mentioned ${staleNativeId}.`,
    },
    'privacy-review': {
      status: 'READY',
      evidence: privacyReviewReadyEvidence(`Support evidence was copied from ${oldVercelHost}.`),
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
  const privacyReview = report.gates.find((gate) => gate.id === 'privacy-review');
  assert.equal(storeRecords.status, 'BLOCKED');
  assert.match(storeRecords.evidence, /stale native app identifier/i);
  assert.match(storeRecords.evidence, /com\.billyyiu\.almostswedish/i);
  assert.equal(privacyReview.status, 'BLOCKED');
  assert.match(privacyReview.evidence, /legacy Vercel public-site host URL/i);
  assert.match(privacyReview.evidence, /GitHub Pages support\/privacy URLs/i);
});

test('release preflight blocks READY manual release gates with stale disabled-real-ads evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-stale-ads-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const oldFlag = ['REAL_ADS', 'ENABLED_FOR_V1'].join('_');
  const adMobDeferred = ['AdMob', 'is', 'deferred'].join(' ');
  const realAdsAreDisabled = ['real ads are', 'disabled'].join(' ');
  const realAdsRemainDisabled = ['real ads remain', 'disabled'].join(' ');

  writeAllReadyEvidence(evidencePath, {
    'store-records': {
      status: 'READY',
      evidence: `${storeRecordReadyEvidence()} ${adMobDeferred} because ${realAdsAreDisabled} for v1.0.`,
    },
    'store-policy-questionnaires': {
      status: 'READY',
      evidence: storePolicyReadyEvidence(`${realAdsRemainDisabled} for v1.0.`),
    },
    'privacy-review': {
      status: 'READY',
      evidence: privacyReviewReadyEvidence(`Generated binary reviewed with ${oldFlag}=false.`),
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

  for (const id of ['store-records', 'store-policy-questionnaires', 'privacy-review']) {
    const currentGate = report.gates.find((gate) => gate.id === id);
    assert.equal(currentGate.status, 'BLOCKED');
    assert.match(
      currentGate.evidence,
      /obsolete ad-disablement release posture|current ad-supported Google Mobile Ads/i,
    );
    assert.doesNotMatch(currentGate.evidence, staleCurrentReleaseAdEvidencePattern());
  }
  assertNoStaleCurrentReleaseAdEvidence(report);
});

test('release preflight blocks stale disabled-ad wording in non-ready manual gates without echoing it', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-blocked-stale-ads-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const oldFlag = ['REAL_ADS', 'ENABLED_FOR_V1'].join('_');

  writeAllReadyEvidence(evidencePath, {
    'store-records': {
      status: 'BLOCKED',
      evidence: 'AdMob is deferred because real ads are disabled for v1.0.',
    },
    'store-policy-questionnaires': {
      status: 'BLOCKED',
      evidence: 'Store policy review says real ads remain disabled for v1.0.',
    },
    'privacy-review': {
      status: 'BLOCKED',
      evidence: `Privacy review still asks for ${oldFlag}=false.`,
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

  for (const id of ['store-records', 'store-policy-questionnaires', 'privacy-review']) {
    const currentGate = report.gates.find((gate) => gate.id === id);
    assert.equal(currentGate.status, 'BLOCKED');
    assert.match(currentGate.evidence, /obsolete ad-disablement release posture/i);
    assert.doesNotMatch(currentGate.evidence, staleCurrentReleaseAdEvidencePattern());
  }
  assertNoStaleCurrentReleaseAdEvidence(report);
});

test('release evidence template is synchronized with ad-supported store and privacy evidence', () => {
  const storeRecords = readJson('reports/store-records/store-records.json');
  const template = read('reports/release-evidence-template.md');

  assert.ok(template.includes(storeRecords.bundleIdentifier));
  assert.ok(template.includes(storeRecords.packageName));
  assert.match(template, /AdMob app ID/i);
  assert.match(template, /app-ads\.txt/i);
  assert.match(template, /adMob\.realAdsEnabled:\s*true/i);
  assert.match(template, /adMob\.appAdsTxtReviewed:\s*true/i);
  assert.match(template, /googleMobileAds\.realAdsEnabled:\s*true/i);
  assert.match(template, /googleMobileAds\.removeAdsIapReviewed:\s*true/i);
  assert.match(template, /googleMobileAds\.consentFlowReviewed:\s*true/i);
  assert.match(template, /EXPO_PUBLIC_REAL_ADS_ENABLED=true/i);
  assert.match(template, /generated binary\/build|generated binary/i);
  assert.match(template, /Remove Ads/i);
  assert.match(template, /29 SEK/i);
  assert.match(template, /non-consumable/i);
  assert.match(template, /App Tracking Transparency|ATT/i);
  assert.match(template, /Google UMP|UMP consent/i);

  assert.doesNotMatch(template, staleNativeIdentifierPattern());
  assert.doesNotMatch(template, oldRealAdsEnvFlagPattern());
  assert.doesNotMatch(template, staleDisabledAdsDecisionPattern());
  assert.doesNotMatch(template, disabledGoogleMobileAdsPattern());
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
        evidence: storeRecordReadyEvidence(`Reports in ${storeEvidence.relativePath}.`),
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
        evidence: storeRecordReadyEvidence(`Reports in ${storeEvidence.relativePath}.`),
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

test('release preflight blocks local store record evidence without account ownership review', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-owner-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const storeEvidence = createStoreRecordEvidence({
    evidence: {
      accountOwnership: {
        appleDeveloperTeamId: '',
        appleBundleIdReviewed: false,
        googlePlayDeveloperId: '',
        googlePackageNameReviewed: true,
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-records': {
        status: 'READY',
        evidence: storeRecordReadyEvidence(`Reports in ${storeEvidence.relativePath}.`),
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
    assert.match(storeRecords.evidence, /accountOwnership/i);
    assert.match(storeRecords.evidence, /appleDeveloperTeamId/i);
  } finally {
    storeEvidence.cleanup();
  }
});

test('release preflight blocks local store record evidence without AdMob app readiness', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-store-admob-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const storeEvidence = createStoreRecordEvidence({
    evidence: {
      adMob: {
        status: 'deferred-real-ads-disabled',
        note: 'legacy disabled-ad decision',
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'store-records': {
        status: 'READY',
        evidence: storeRecordReadyEvidence(`Reports in ${storeEvidence.relativePath}.`),
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
    assert.match(storeRecords.evidence, /adMob\.appId/i);
    assert.match(storeRecords.evidence, /adMob\.status/i);
    assert.match(storeRecords.evidence, /adMob\.realAdsEnabled/i);
    assert.doesNotMatch(storeRecords.evidence, staleCurrentReleaseAdEvidencePattern());
    assertNoStaleCurrentReleaseAdEvidence(report);
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
        evidence: storeRecordReadyEvidence(`Reports in ${storeEvidence.relativePath}.`),
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

test('release preflight blocks privacy review evidence without binary and ad-supported posture', () => {
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
  assert.match(privacyReview.evidence, /ad-supported|Google Mobile Ads/i);
});

test('release preflight blocks local privacy review evidence with disabled-ad posture', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-privacy-json-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const privacyEvidence = createPrivacyReviewEvidence({
    evidence: {
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
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'privacy-review': {
        status: 'READY',
        evidence: privacyReviewReadyEvidence(`Reports in ${privacyEvidence.relativePath}.`),
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
    assert.match(privacyReview.evidence, /disabledSdks\.realAds/i);
    assert.doesNotMatch(privacyReview.evidence, staleCurrentReleaseAdEvidencePattern());
    assertNoStaleCurrentReleaseAdEvidence(report);
  } finally {
    privacyEvidence.cleanup();
  }
});

test('release preflight blocks local privacy review evidence without audit trail', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-privacy-audit-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const privacyEvidence = createPrivacyReviewEvidence({
    evidence: {
      reviewedAt: '',
      reviewer: '',
      storeQuestionnaires: {
        appleAppStoreConnectReviewed: false,
        googlePlayConsoleReviewed: true,
      },
    },
  });

  try {
    writeAllReadyEvidence(evidencePath, {
      'privacy-review': {
        status: 'READY',
        evidence: privacyReviewReadyEvidence(`Reports in ${privacyEvidence.relativePath}.`),
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
    assert.match(privacyReview.evidence, /reviewedAt/i);
    assert.match(privacyReview.evidence, /reviewer/i);
    assert.match(privacyReview.evidence, /appleAppStoreConnectReviewed/i);
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
        evidence: privacyReviewReadyEvidence(`Reports in ${privacyEvidence.relativePath}.`),
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
