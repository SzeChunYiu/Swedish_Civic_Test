const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const jsonMode = process.argv.includes('--json');
const runValidate = process.argv.includes('--run-validate');
const evidencePath = process.env.RELEASE_PREFLIGHT_EVIDENCE_PATH || 'reports/release-gates.json';
const supportUrl = 'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/';
const privacyUrl = 'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/';
const publicUrls = process.env.RELEASE_PREFLIGHT_PUBLIC_URLS
  ? JSON.parse(process.env.RELEASE_PREFLIGHT_PUBLIC_URLS)
  : [supportUrl, privacyUrl];

const evidenceRequirements = {
  'android-device-audio': [
    ['Android device or platform', /Android|Pixel|Galaxy/i],
    ['audio smoke result', /audio/i],
    ['build URL, ID, or install evidence', /build|EAS|APK|AAB|https?:\/\/|install/i],
  ],
  'ios-device-audio': [
    ['iOS device, iPhone, or TestFlight platform', /iOS|iPhone|iPad|TestFlight/i],
    ['audio smoke result', /audio/i],
    ['build URL, ID, or TestFlight evidence', /build|TestFlight|https?:\/\/|install/i],
  ],
  'store-records': [
    ['App Store Connect record', /App Store Connect|Apple/i],
    ['Google Play Console record', /Google Play/i],
    ['bundle/package identifier', /com\.billyyiu\.swedishcivictest/i],
    ['Support URL entered in store records', /Support URL/i],
    ['Privacy Policy URL entered in store records', /Privacy Policy URL/i],
  ],
  'privacy-review': [
    ['Apple privacy labels review', /Apple privacy labels|App Store privacy/i],
    ['Google Play Data safety review', /Google Play Data safety|Data safety/i],
    ['generated binary or build evidence', /binary|build|EAS|TestFlight|APK|AAB|IPA|version/i],
    [
      'disabled ad SDK posture',
      /Google Mobile Ads|react-native-google-mobile-ads|REAL_ADS_ENABLED_FOR_V1=false|real ads disabled/i,
    ],
  ],
  'device-screenshots': [
    ['screenshot evidence', /screenshot/i],
    ['device or accepted tooling evidence', /device|accepted|store/i],
    [
      'local artifact path or URL reference',
      /\b(?:reports|publishing|content|assets)\/[^\s,;:]+|https?:\/\//i,
    ],
  ],
  submission: [
    ['TestFlight build evidence', /TestFlight build/i],
    [
      'Google Play internal track URL evidence',
      /Google Play internal track URL|https?:\/\/.*play\.google/i,
    ],
    ['production submission ID evidence', /production submission ID|submit-[\w-]+/i],
    ['monitoring report evidence', /monitoring report|reports\/.*monitoring|post-launch report/i],
  ],
};

const blockedEvidencePatterns = [
  [/TBD/i, 'TBD'],
  [/BLOCKED/i, 'BLOCKED'],
  [/not run/i, 'not run'],
  [/no .*evidence/i, 'no evidence'],
  [/placeholder/i, 'placeholder'],
  [/missing/i, 'missing'],
];

const gateSpecificBlockedEvidencePatterns = {
  'device-screenshots': [
    [/web[- ]draft/i, 'web-draft evidence is not final store screenshot evidence'],
    [/browser/i, 'browser screenshots are not final store screenshot evidence'],
  ],
};

const expectedPublicUrlEvidenceRequirements = {
  'store-records': [
    ['expected Support URL', supportUrl],
    ['expected Privacy Policy URL', privacyUrl],
  ],
  'public-urls': [
    ['expected Support URL', supportUrl],
    ['expected Privacy Policy URL', privacyUrl],
  ],
};

function exists(path) {
  return fs.existsSync(path);
}

function extractLocalArtifactPaths(evidence) {
  const matches = evidence.match(/\b(?:reports|publishing|content|assets)\/[^\s,;:]+/g) || [];
  return [...new Set(matches.map((item) => item.replace(/[.)\]]+$/g, '')))];
}

function validateFinalScreenshotManifest(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return [`could not parse ${manifestPath}: ${error.message}`];
  }

  const errors = [];
  if (manifest.status !== 'final-device') {
    errors.push('manifest status must be final-device');
  }

  if (/web[- ]draft|browser/i.test(JSON.stringify(manifest))) {
    errors.push('manifest must not contain web-draft or browser-only evidence');
  }

  const screenshots = Array.isArray(manifest.screenshots) ? manifest.screenshots : [];
  if (screenshots.length < 5) {
    errors.push('manifest must include at least five final screenshots');
  }

  const routes = new Set(screenshots.map((shot) => shot.route));
  for (const route of ['/home', '/learn', '/practice', '/exam', '/profile']) {
    if (!routes.has(route)) errors.push(`manifest missing required route ${route}`);
  }

  screenshots.forEach((shot, index) => {
    const label = shot.id || `screenshot[${index}]`;
    if (!/^(ios|android)$/i.test(shot.platform || '')) {
      errors.push(`${label} missing platform ios/android`);
    }
    if (!shot.device || !String(shot.device).trim()) {
      errors.push(`${label} missing device`);
    }
    if (!/device|simulator|store tooling|accepted/i.test(shot.captureMethod || '')) {
      errors.push(`${label} missing accepted capture method`);
    }
    if (!shot.sourceBuild || !String(shot.sourceBuild).trim()) {
      errors.push(`${label} missing source build`);
    }
    if (!shot.file || !String(shot.file).trim()) {
      errors.push(`${label} missing screenshot file path`);
      return;
    }

    const screenshotPath = path.isAbsolute(shot.file)
      ? shot.file
      : path.resolve(path.dirname(manifestPath), shot.file);
    if (!exists(screenshotPath)) {
      errors.push(`${label} screenshot file does not exist: ${shot.file}`);
    }
  });

  return errors;
}

function validateDeviceAudioEvidence(evidencePath, expectedPlatform) {
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  if (evidence.status !== 'passed') {
    errors.push('status must be passed');
  }
  if (String(evidence.platform || '').toLowerCase() !== expectedPlatform) {
    errors.push(`platform must be ${expectedPlatform}`);
  }
  if (!evidence.device || !String(evidence.device).trim()) {
    errors.push('device is required');
  }
  if (!evidence.sourceBuild || !String(evidence.sourceBuild).trim()) {
    errors.push('sourceBuild is required');
  }

  const checks = Array.isArray(evidence.checks) ? evidence.checks : [];
  if (checks.length === 0) {
    errors.push('checks array is required');
  }

  const passedChecks = new Set(
    checks
      .filter((check) => check && check.result === 'passed')
      .map((check) => String(check.id || '')),
  );
  for (const checkId of [
    'sv-se-question-audio',
    'audio-button-state',
    'speech-engine-unavailable',
    'onboarding',
    'practice-answer-flow',
    'mock-exam-no-ads',
    'progress-restart',
    'privacy-legal-pages',
  ]) {
    if (!passedChecks.has(checkId)) {
      errors.push(`missing passed check ${checkId}`);
    }
  }

  return errors;
}

function validateStoreRecordEvidence(evidencePath) {
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  if (evidence.status !== 'ready') {
    errors.push('status must be ready');
  }
  if (evidence.bundleIdentifier !== 'com.billyyiu.swedishcivictest') {
    errors.push('bundleIdentifier must be com.billyyiu.swedishcivictest');
  }
  if (!/^https:\/\/appstoreconnect\.apple\.com\//i.test(evidence.appStoreConnectUrl || '')) {
    errors.push('appStoreConnectUrl must be an App Store Connect URL');
  }
  if (!/^https:\/\/play\.google\.com\/console\//i.test(evidence.googlePlayConsoleUrl || '')) {
    errors.push('googlePlayConsoleUrl must be a Google Play Console URL');
  }
  if (evidence.supportUrl !== supportUrl) {
    errors.push(`supportUrl must be ${supportUrl}`);
  }
  if (evidence.privacyUrl !== privacyUrl) {
    errors.push(`privacyUrl must be ${privacyUrl}`);
  }

  const adMob = evidence.adMob || {};
  const adMobStatus = String(adMob.status || '');
  const adMobAppId = String(adMob.appId || '');
  if (adMobStatus !== 'deferred-real-ads-disabled' && !/^ca-app-pub-/i.test(adMobAppId)) {
    errors.push('adMob must record deferred-real-ads-disabled status or a concrete AdMob app ID');
  }
  if (
    adMobStatus === 'deferred-real-ads-disabled' &&
    !/REAL_ADS_ENABLED_FOR_V1=false|real ads disabled/i.test(
      `${adMob.note || ''} ${evidence.adMobDecision || ''}`,
    )
  ) {
    errors.push(
      'deferred AdMob decision must mention REAL_ADS_ENABLED_FOR_V1=false or real ads disabled',
    );
  }

  return errors;
}

function validatePrivacyReviewEvidence(evidencePath) {
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  if (evidence.status !== 'reviewed') {
    errors.push('status must be reviewed');
  }

  const reviewedBuild = evidence.reviewedBuild || {};
  for (const field of ['id', 'version', 'commit']) {
    if (!reviewedBuild[field] || !String(reviewedBuild[field]).trim()) {
      errors.push(`reviewedBuild.${field} is required`);
    }
  }

  const applePrivacyLabels = evidence.applePrivacyLabels || {};
  if (applePrivacyLabels.reviewed !== true) {
    errors.push('applePrivacyLabels.reviewed must be true');
  }
  if (applePrivacyLabels.matchesBinary !== true) {
    errors.push('applePrivacyLabels.matchesBinary must be true');
  }
  if (applePrivacyLabels.path !== 'publishing/privacy-labels.md') {
    errors.push('applePrivacyLabels.path must be publishing/privacy-labels.md');
  } else if (!exists(applePrivacyLabels.path)) {
    errors.push(`applePrivacyLabels.path does not exist: ${applePrivacyLabels.path}`);
  }

  const googlePlayDataSafety = evidence.googlePlayDataSafety || {};
  if (googlePlayDataSafety.reviewed !== true) {
    errors.push('googlePlayDataSafety.reviewed must be true');
  }
  if (googlePlayDataSafety.matchesBinary !== true) {
    errors.push('googlePlayDataSafety.matchesBinary must be true');
  }
  if (googlePlayDataSafety.path !== 'publishing/google-play-data-safety.md') {
    errors.push('googlePlayDataSafety.path must be publishing/google-play-data-safety.md');
  } else if (!exists(googlePlayDataSafety.path)) {
    errors.push(`googlePlayDataSafety.path does not exist: ${googlePlayDataSafety.path}`);
  }

  const googleMobileAds = evidence.googleMobileAds || {};
  if (googleMobileAds.sdkPresent !== true) {
    errors.push('googleMobileAds.sdkPresent must be true');
  }
  if (googleMobileAds.testAppIds !== true) {
    errors.push('googleMobileAds.testAppIds must be true');
  }
  if (googleMobileAds.realAdsEnabled !== false) {
    errors.push('googleMobileAds.realAdsEnabled must be false');
  }
  if (!/REAL_ADS_ENABLED_FOR_V1=false|real ads disabled/i.test(googleMobileAds.gate || '')) {
    errors.push(
      'googleMobileAds.gate must mention REAL_ADS_ENABLED_FOR_V1=false or real ads disabled',
    );
  }

  const disabledSdks = evidence.disabledSdks || {};
  for (const sdk of ['analytics', 'crashReporting', 'purchases', 'realAds']) {
    if (disabledSdks[sdk] !== true) {
      errors.push(`disabledSdks.${sdk} must be true`);
    }
  }

  return errors;
}

function validateMonitoringReportContent(monitoringPath) {
  let content;
  try {
    content = fs.readFileSync(monitoringPath, 'utf8');
  } catch (error) {
    return [`monitoringReport content could not be read: ${error.message}`];
  }

  const requirements = [
    ['first-week window', /first[- ]week|week[- ]one|7[- ]day|seven[- ]day/i],
    ['crash reports', /crash(?:es)?|crash reports|crash-free/i],
    [
      'content/support reports',
      /content(?:\/support)? reports|content reports|support reports|support tickets|support email/i,
    ],
    ['reviews/ratings', /reviews?\/ratings|store reviews?|ratings?/i],
  ];

  return requirements
    .filter(([, pattern]) => !pattern.test(content))
    .map(([label]) => `monitoringReport content missing ${label}`);
}

function validateSubmissionEvidence(evidencePath) {
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  if (evidence.status !== 'submitted') {
    errors.push('status must be submitted');
  }

  const testFlight = evidence.testFlightBuild || {};
  if (!testFlight.buildNumber || !String(testFlight.buildNumber).trim()) {
    errors.push('testFlightBuild.buildNumber is required');
  }
  if (!/processed|approved|ready/i.test(testFlight.processingStatus || '')) {
    errors.push('testFlightBuild.processingStatus must be processed/approved/ready');
  }
  if (!/approved|accepted|submitted|ready/i.test(testFlight.betaReviewStatus || '')) {
    errors.push('testFlightBuild.betaReviewStatus must be approved/accepted/submitted/ready');
  }
  if (!/^https:\/\/appstoreconnect\.apple\.com\//i.test(testFlight.url || '')) {
    errors.push('testFlightBuild.url must be an App Store Connect URL');
  }

  const googlePlay = evidence.googlePlayInternal || {};
  if (!/^https:\/\/play\.google\.com\/console\//i.test(googlePlay.trackUrl || '')) {
    errors.push('googlePlayInternal.trackUrl must be a Google Play Console URL');
  }
  if (!Number.isInteger(googlePlay.versionCode) || googlePlay.versionCode <= 0) {
    errors.push('googlePlayInternal.versionCode must be a positive integer');
  }
  if (!googlePlay.testerGroup || !String(googlePlay.testerGroup).trim()) {
    errors.push('googlePlayInternal.testerGroup is required');
  }

  const submissions = Array.isArray(evidence.productionSubmissions)
    ? evidence.productionSubmissions
    : [];
  for (const platform of ['ios', 'android']) {
    const item = submissions.find((submission) => submission.platform === platform);
    if (!item) {
      errors.push(`missing ${platform} production submission`);
      continue;
    }
    if (!item.submissionId || !String(item.submissionId).trim()) {
      errors.push(`${platform} production submissionId is required`);
    }
    if (!/submitted|approved|accepted|in review/i.test(item.reviewStatus || '')) {
      errors.push(
        `${platform} production reviewStatus must be submitted/approved/accepted/in review`,
      );
    }
  }

  if (!evidence.monitoringReport || !String(evidence.monitoringReport).trim()) {
    errors.push('monitoringReport is required');
  } else if (!exists(evidence.monitoringReport)) {
    errors.push(`monitoringReport does not exist: ${evidence.monitoringReport}`);
  } else {
    errors.push(...validateMonitoringReportContent(evidence.monitoringReport));
  }

  return errors;
}

function validateLocalArtifactContents(id, artifactPaths) {
  if (id === 'privacy-review') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validatePrivacyReviewEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'submission') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateSubmissionEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'store-records') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateStoreRecordEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'android-device-audio' || id === 'ios-device-audio') {
    const expectedPlatform = id === 'android-device-audio' ? 'android' : 'ios';
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateDeviceAudioEvidence(jsonPath, expectedPlatform).map(
        (error) => `${jsonPath}: ${error}`,
      ),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id !== 'device-screenshots') return null;

  const manifestPaths = artifactPaths.filter((artifactPath) =>
    /manifest\.json$/i.test(artifactPath),
  );
  if (manifestPaths.length === 0) return null;

  const errors = manifestPaths.flatMap((manifestPath) =>
    validateFinalScreenshotManifest(manifestPath).map((error) => `${manifestPath}: ${error}`),
  );
  return errors.length > 0 ? errors : null;
}

function commandSucceeds(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function gate(id, label, status, evidence, nextAction) {
  return { id, label, status, evidence, nextAction };
}

function gitWorktreeGate() {
  const status = commandSucceeds('git', ['status', '--porcelain']);
  if (!status.ok) {
    return gate(
      'git-worktree-clean',
      'Clean git worktree for release candidate',
      'BLOCKED',
      status.stderr || status.stdout || '`git status --porcelain` failed.',
      'Run release preflight from a git checkout and resolve the git status failure.',
    );
  }

  if (status.stdout.length > 0) {
    const changedFiles = status.stdout.split('\n').slice(0, 25).join('\n');
    return gate(
      'git-worktree-clean',
      'Clean git worktree for release candidate',
      'BLOCKED',
      `Release candidate has uncommitted or untracked files:\n${changedFiles}`,
      'Commit, stash, remove, or move local changes before production build or store submission.',
    );
  }

  return gate(
    'git-worktree-clean',
    'Clean git worktree for release candidate',
    'READY',
    '`git status --porcelain` returned no uncommitted or untracked files.',
    'Run release preflight from the exact clean release commit.',
  );
}

function loadManualEvidence() {
  if (!exists(evidencePath)) {
    return { gates: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    return { gates: parsed.gates || {} };
  } catch (error) {
    return {
      gates: {},
      error: `Could not parse ${evidencePath}: ${error.message}`,
    };
  }
}

function evidenceGate(manualEvidence, id, label, fallbackEvidence, nextAction, options = {}) {
  if (options.requiredArtifactMissing) {
    return gate(id, label, 'MISSING_ARTIFACT', options.requiredArtifactMissing, nextAction);
  }

  if (manualEvidence.error) {
    return gate(
      id,
      label,
      'BLOCKED',
      manualEvidence.error,
      `Fix ${evidencePath} JSON, then rerun release preflight.`,
    );
  }

  const recorded = manualEvidence.gates[id];
  const status = recorded?.status === 'READY' ? 'READY' : 'BLOCKED';
  const recordedEvidence = typeof recorded?.evidence === 'string' ? recorded.evidence.trim() : '';

  if (status === 'READY' && recordedEvidence.length > 0) {
    const blockedTerms = [
      ...blockedEvidencePatterns,
      ...(gateSpecificBlockedEvidencePatterns[id] || []),
    ]
      .filter(([pattern]) => pattern.test(recordedEvidence))
      .map(([, label]) => label);
    if (blockedTerms.length > 0) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but evidence still contains blocker, placeholder, or not-final language: ${blockedTerms.join(
          ', ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Replace placeholder/blocker/not-final wording with concrete evidence for ${id} in ${evidencePath}.`,
      );
    }

    const missingRequirements = (evidenceRequirements[id] || [])
      .filter(([, pattern]) => !pattern.test(recordedEvidence))
      .map(([requirement]) => requirement);
    if (missingRequirements.length > 0) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but evidence is too weak. Missing: ${missingRequirements.join(
          ', ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Add concrete evidence for ${id} to ${evidencePath}.`,
      );
    }

    const missingExpectedUrls = (expectedPublicUrlEvidenceRequirements[id] || [])
      .filter(([, url]) => !recordedEvidence.includes(url))
      .map(([requirement, url]) => `${requirement} ${url}`);
    if (missingExpectedUrls.length > 0) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but evidence is missing exact hosted URL value(s): ${missingExpectedUrls.join(
          ', ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Copy the exact hosted support/privacy URL values into ${id} evidence in ${evidencePath}.`,
      );
    }

    const artifactPaths = extractLocalArtifactPaths(recordedEvidence);
    const missingArtifactPaths = artifactPaths.filter((artifactPath) => !exists(artifactPath));
    if (missingArtifactPaths.length > 0) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but referenced local artifact path(s) do not exist: ${missingArtifactPaths.join(
          ', ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Create the referenced local artifact(s), fix their paths, or replace them with externally verifiable URLs for ${id}.`,
      );
    }

    const invalidArtifactContents = validateLocalArtifactContents(id, artifactPaths);
    if (invalidArtifactContents) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but referenced local artifact content is not valid final evidence: ${invalidArtifactContents.join(
          '; ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Fix the referenced local artifact content or replace it with externally verifiable final evidence for ${id}.`,
      );
    }

    return gate(id, label, 'READY', recordedEvidence, nextAction);
  }

  if (status === 'READY') {
    return gate(
      id,
      label,
      'BLOCKED',
      `Gate ${id} is marked READY in ${evidencePath}, but no concrete evidence string is recorded.`,
      `Add concrete evidence for ${id} to ${evidencePath}.`,
    );
  }

  return gate(id, label, 'BLOCKED', recordedEvidence || fallbackEvidence, nextAction);
}

function publicUrlsGate(manualEvidence) {
  const manualGate = evidenceGate(
    manualEvidence,
    'public-urls',
    'Public support and privacy URLs',
    'Static pages exist locally, but no hosted HTTPS URL evidence is recorded.',
    'Host the static pages, verify public HTTPS access, and enter URLs in both store records.',
    {
      requiredArtifactMissing:
        exists('publishing/public-site/support/index.html') &&
        exists('publishing/public-site/privacy/index.html')
          ? null
          : 'Local static support/privacy pages are missing from publishing/public-site.',
    },
  );

  if (manualGate.status !== 'READY') {
    return manualGate;
  }

  if (process.env.RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK === '1') {
    return gate(
      manualGate.id,
      manualGate.label,
      'READY',
      `${manualGate.evidence}\nLive URL check skipped by RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK=1.`,
      manualGate.nextAction,
    );
  }

  const liveCheck = commandSucceeds(process.execPath, [
    'scripts/check-public-urls.js',
    ...publicUrls,
  ]);
  if (liveCheck.ok) {
    return gate(
      manualGate.id,
      manualGate.label,
      'READY',
      `${manualGate.evidence}\nLive URL check passed: ${liveCheck.stdout}`,
      manualGate.nextAction,
    );
  }

  return gate(
    manualGate.id,
    manualGate.label,
    'BLOCKED',
    `Recorded public URL evidence exists, but live URL check failed: ${
      liveCheck.stderr || liveCheck.stdout || 'no checker output'
    }`,
    'Restore public support/privacy URLs or update the recorded URLs and rerun `npm run release:preflight`.',
  );
}

function buildReport() {
  const manualEvidence = loadManualEvidence();
  const validation = runValidate ? commandSucceeds('npm', ['run', 'validate']) : null;
  const expoDoctor = commandSucceeds('npm', ['exec', '--', 'expo-doctor']);
  const webExport = commandSucceeds('npm', ['run', 'release:web-export-smoke']);
  const nativePrebuild = commandSucceeds('npm', ['run', 'release:native-prebuild-smoke']);
  const easVersion = commandSucceeds('npx', ['--yes', 'eas-cli@18.13.0', '--version']);
  const easWhoami = commandSucceeds('npx', ['--yes', 'eas-cli@18.13.0', 'whoami']);

  const gates = [
    gate(
      'local-validation',
      'Local validation suite',
      !runValidate || validation.ok ? 'READY' : 'BLOCKED',
      runValidate
        ? validation.ok
          ? '`npm run validate` passed during this release preflight invocation.'
          : validation.stderr || validation.stdout || '`npm run validate` failed.'
        : '`npm run validate` was not run in this direct script invocation; `npm run release:preflight` runs it.',
      'Run `npm run release:preflight` for the exact release candidate.',
    ),
    gitWorktreeGate(),
    gate(
      'expo-doctor',
      'Expo Doctor native dependency checks',
      expoDoctor.ok ? 'READY' : 'BLOCKED',
      expoDoctor.ok ? expoDoctor.stdout : expoDoctor.stderr || expoDoctor.stdout,
      'Run `npm exec -- expo-doctor` and fix any Expo/native dependency findings.',
    ),
    gate(
      'web-export',
      'Web production export smoke',
      webExport.ok ? 'READY' : 'BLOCKED',
      webExport.ok ? webExport.stdout : webExport.stderr || webExport.stdout,
      'Run `npm run release:web-export-smoke` and fix any Expo web export errors.',
    ),
    gate(
      'native-prebuild',
      'Android/iOS native prebuild smoke',
      nativePrebuild.ok ? 'READY' : 'BLOCKED',
      nativePrebuild.ok ? nativePrebuild.stdout : nativePrebuild.stderr || nativePrebuild.stdout,
      'Run `npm run release:native-prebuild-smoke` and fix any Expo native prebuild warnings or errors.',
    ),
    gate(
      'eas-cli',
      'Pinned npx EAS CLI',
      easVersion.ok ? 'READY' : 'BLOCKED',
      easVersion.ok ? easVersion.stdout : easVersion.stderr || easVersion.stdout,
      'Run `npx --yes eas-cli@18.13.0 --version`.',
    ),
    gate(
      'eas-auth',
      'Expo/EAS authentication',
      easWhoami.ok ? 'READY' : 'BLOCKED',
      easWhoami.ok ? easWhoami.stdout : easWhoami.stderr || easWhoami.stdout || 'Not logged in',
      'Log in to Expo/EAS or provide an approved Expo token, then rerun `npx --yes eas-cli@18.13.0 whoami`.',
    ),
    evidenceGate(
      manualEvidence,
      'android-device-audio',
      'Android physical-device audio smoke',
      'No Android physical-device build/install/audio evidence is recorded.',
      'Create an EAS preview build and record Android audio smoke results in a release evidence file.',
    ),
    evidenceGate(
      manualEvidence,
      'ios-device-audio',
      'iOS physical-device audio smoke',
      'No iOS physical-device/TestFlight build/install/audio evidence is recorded.',
      'Create an EAS preview/TestFlight build and record iOS audio smoke results in a release evidence file.',
    ),
    evidenceGate(
      manualEvidence,
      'store-records',
      'Apple/Google store records',
      'No App Store Connect or Google Play Console app record evidence is recorded. AdMob is deferred because real ads are disabled for v1.0.',
      'Create Apple/Google account/app records and copy URLs into a release evidence file.',
    ),
    evidenceGate(
      manualEvidence,
      'privacy-review',
      'Store privacy questionnaire review against binary',
      'No final Apple privacy labels / Google Play Data safety review against the generated binary is recorded.',
      'After EAS build and store records exist, review Apple privacy labels and Google Play Data safety against the generated binary, including Google Mobile Ads SDK test configuration and real-ads-disabled posture.',
    ),
    publicUrlsGate(manualEvidence),
    evidenceGate(
      manualEvidence,
      'device-screenshots',
      'Store screenshots from accepted capture method',
      'Web-draft screenshots and manifest exist, but final device/store screenshots are not recorded.',
      'Capture screenshots from target devices or store-accepted tooling and record paths in release evidence.',
    ),
    evidenceGate(
      manualEvidence,
      'submission',
      'Store submission and post-launch monitoring',
      'No TestFlight, Google Play internal test, production submission, or post-launch monitoring evidence is recorded.',
      'Submit only after all build, privacy, account, screenshot, and device gates are ready.',
    ),
  ];

  const readyForSubmission = gates.every((item) => item.status === 'READY');
  return {
    status: readyForSubmission ? 'READY_FOR_STORE_SUBMISSION' : 'BLOCKED',
    readyForSubmission,
    gates,
    nextActions: gates.filter((item) => item.status !== 'READY').map((item) => item.nextAction),
  };
}

function renderText(report) {
  const lines = [
    `Release preflight: ${report.status}`,
    '',
    ...report.gates.map(
      (item) =>
        `- [${item.status}] ${item.id}: ${item.label}\n  Evidence: ${item.evidence}\n  Next: ${item.nextAction}`,
    ),
  ];
  return `${lines.join('\n')}\n`;
}

const report = buildReport();
if (jsonMode) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(renderText(report));
}

process.exit(report.readyForSubmission ? 0 : 1);
