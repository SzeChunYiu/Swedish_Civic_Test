const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const jsonMode = process.argv.includes('--json');
const runValidate = process.argv.includes('--run-validate');
const skipExternalChecks = /^(1|true|yes)$/i.test(
  String(process.env.RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS || '').trim(),
);
const evidencePath = process.env.RELEASE_PREFLIGHT_EVIDENCE_PATH || 'reports/release-gates.json';
const supportUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const privacyUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/';
const publicUrls = process.env.RELEASE_PREFLIGHT_PUBLIC_URLS
  ? JSON.parse(process.env.RELEASE_PREFLIGHT_PUBLIC_URLS)
  : [supportUrl, privacyUrl];

const evidenceRequirements = {
  'eas-build-artifacts': [
    ['Android EAS build artifact', /Android|APK|AAB|EAS/i],
    ['iOS EAS or TestFlight build artifact', /iOS|IPA|TestFlight|EAS/i],
    [
      'local build evidence path or URL reference',
      /\b(?:reports|publishing)\/[^\s,;:]+|https?:\/\//i,
    ],
  ],
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
  'store-credentials': [
    ['App Store Connect submit credentials', /App Store Connect|Apple|ASC/i],
    ['Google Play service-account credentials', /Google Play|service-account/i],
    [
      'local credential evidence path or URL reference',
      /\b(?:reports|publishing)\/[^\s,;:]+|https?:\/\//i,
    ],
  ],
  'store-policy-questionnaires': [
    ['Apple age rating or export compliance review', /Apple|age rating|export compliance/i],
    [
      'Google Play content rating or ads declaration review',
      /Google Play|content rating|ads declaration/i,
    ],
    [
      'local policy evidence path or URL reference',
      /\b(?:reports|publishing)\/[^\s,;:]+|https?:\/\//i,
    ],
  ],
  'release-owner-approval': [
    ['release owner approval', /release owner|approver|approved/i],
    ['store submission decision', /store submission|approved-for-store-submission|submission/i],
    [
      'local approval evidence path or URL reference',
      /\b(?:reports|publishing)\/[^\s,;:]+|https?:\/\//i,
    ],
  ],
  'privacy-review': [
    ['Apple privacy labels review', /Apple privacy labels|App Store privacy/i],
    ['Google Play Data safety review', /Google Play Data safety|Data safety/i],
    ['generated binary or build evidence', /binary|build|EAS|TestFlight|APK|AAB|IPA|version/i],
    [
      'ad-supported Google Mobile Ads review',
      /Google Mobile Ads|react-native-google-mobile-ads|AdMob|ad-supported|real ads enabled/i,
    ],
    ['Remove Ads IAP review', /Remove Ads|29 SEK|in-app purchase|non-consumable/i],
    ['ATT/UMP consent review', /App Tracking Transparency|ATT|UMP|consent|IDFA/i],
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

const v11ScopeSurfacePaths = [
  'lib/storage/reviewStore.ts',
  'lib/learning/adaptivePractice.ts',
  'lib/learning/dailyChallenge.ts',
  'lib/storage/companionStore.ts',
  'lib/mascot/catalog.ts',
  'lib/monetization/proLifetimePurchase.ts',
];

const removeAdsDeviceQaPath = 'reports/release-ads-iap-device-qa.md';
const removeAdsStep3Command =
  'test -f lib/monetization/purchases.ts && grep -qiE "restore" lib/monetization/purchases.ts && grep -rqi "remove.?ads" app components lib';
const releaseScopeOverrideId = 'release-scope-v11';

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

function readFileIfExists(filePath) {
  return exists(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function listFiles(root) {
  if (!exists(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    return [entryPath];
  });
}

function anyRepoFileMatches(roots, pattern) {
  return roots.some((root) =>
    listFiles(root).some((filePath) => pattern.test(readFileIfExists(filePath))),
  );
}

function listV11ScopeSurfaces() {
  const explicitSurfaces = v11ScopeSurfacePaths.filter((surfacePath) => exists(surfacePath));
  const testSurfaces = exists('tests')
    ? fs
        .readdirSync('tests')
        .filter((name) => /^v1-1-.*\.test\.js$/.test(name))
        .map((name) => path.join('tests', name))
    : [];

  return [...explicitSurfaces, ...testSurfaces].sort();
}

function removeAdsV1AcceptanceFindings() {
  const findings = [];
  const adsSource = readFileIfExists('lib/monetization/ads.ts');
  const purchasesSource = readFileIfExists('lib/monetization/purchases.ts');

  if (!/REAL_ADS_ENABLED/.test(adsSource)) {
    findings.push('GOAL step 1 is not structurally green: REAL_ADS_ENABLED is missing.');
  }
  if (/REAL_ADS_ENABLED_FOR_V1\s*=\s*false/.test(adsSource)) {
    findings.push('GOAL step 1 is red: REAL_ADS_ENABLED_FOR_V1 is still hardcoded false.');
  }
  if (!purchasesSource) {
    findings.push('GOAL step 3 is red: lib/monetization/purchases.ts is missing.');
  } else if (!/restore/i.test(purchasesSource)) {
    findings.push('GOAL step 3 is red: purchases.ts does not mention restore.');
  }
  if (!anyRepoFileMatches(['app', 'components', 'lib'], /remove.?ads/i)) {
    findings.push('GOAL step 3 is red: remove-ads wiring is not visible in app/components/lib.');
  }
  const step3Result = spawnSync('sh', ['-c', removeAdsStep3Command], { encoding: 'utf8' });
  if (step3Result.status !== 0) {
    findings.push(`GOAL step 3 exact command is red: ${removeAdsStep3Command}`);
  }
  if (!exists('publishing/public-site/app-ads.txt')) {
    findings.push('GOAL step 4 is red: publishing/public-site/app-ads.txt is missing.');
  }
  if (!exists('publishing/admob-iap-setup-runbook.md')) {
    findings.push('GOAL step 4 is red: publishing/admob-iap-setup-runbook.md is missing.');
  }
  if (!anyRepoFileMatches(['app', 'lib'], /tracking-transparency|ATT|UMP|consent/i)) {
    findings.push('GOAL step 4 is red: ATT/UMP/consent wiring is not visible in app/lib.');
  }
  const privacyLabels = readFileIfExists('publishing/privacy-labels.md');
  const dataSafety = readFileIfExists('publishing/google-play-data-safety.md');
  if (!/admob|advertis|in-app purchase|IDFA|tracking/i.test(privacyLabels)) {
    findings.push('GOAL step 7 is red: privacy labels do not disclose ads, IAP, and tracking.');
  }
  if (!/admob|advertis|in-app purchase/i.test(dataSafety)) {
    findings.push('GOAL step 7 is red: Google Play data safety does not disclose ads and IAP.');
  }
  if (!exists(removeAdsDeviceQaPath)) {
    findings.push(`Manual device-QA gate is red: ${removeAdsDeviceQaPath} is missing.`);
  } else {
    const deviceQa = readFileIfExists(removeAdsDeviceQaPath);
    const blockedTerms = blockedEvidencePatterns
      .filter(([pattern]) => pattern.test(deviceQa))
      .map(([, label]) => label);
    if (blockedTerms.length > 0) {
      findings.push(
        `Manual device-QA gate is red: ${removeAdsDeviceQaPath} still contains ${blockedTerms.join(
          ', ',
        )}.`,
      );
    }
  }

  return findings;
}

function releaseScopeOverrideGate(manualEvidence) {
  const v11Surfaces = listV11ScopeSurfaces();
  const removeAdsFindings = removeAdsV1AcceptanceFindings();

  if (v11Surfaces.length === 0) {
    return gate(
      releaseScopeOverrideId,
      'v1.1 scope held behind v1.0 Remove Ads',
      'READY',
      'No v1.1 runtime or test surfaces are present in this release candidate.',
      'Keep v1.1 files out of v1.0 release candidates until Remove Ads acceptance is green.',
    );
  }

  if (removeAdsFindings.length === 0) {
    return gate(
      releaseScopeOverrideId,
      'v1.1 scope held behind v1.0 Remove Ads',
      'READY',
      `v1.1 surfaces are present, but the structural Remove Ads v1.0 and device-QA gates are closed. Surfaces: ${v11Surfaces.join(
        ', ',
      )}.`,
      'Keep monitoring release scope before store submission.',
    );
  }

  const recorded = manualEvidence.gates[releaseScopeOverrideId];
  const recordedEvidence = typeof recorded?.evidence === 'string' ? recorded.evidence.trim() : '';
  if (recorded?.status === 'READY' && recordedEvidence.length > 0) {
    const blockedTerms = blockedEvidencePatterns
      .filter(([pattern]) => pattern.test(recordedEvidence))
      .map(([, label]) => label);
    const missingOverrideTerms = [
      ['operator approval', /operator/i],
      ['v1.1 scope', /v1\.1/i],
      ['v1.0 Remove Ads scope', /v1\.0|Remove Ads/i],
      ['explicit allow/approval wording', /allow|approved|approval/i],
    ]
      .filter(([, pattern]) => !pattern.test(recordedEvidence))
      .map(([label]) => label);

    if (blockedTerms.length === 0 && missingOverrideTerms.length === 0) {
      return gate(
        releaseScopeOverrideId,
        'v1.1 scope held behind v1.0 Remove Ads',
        'READY',
        `Operator override recorded in ${evidencePath}: ${recordedEvidence}\nDetected v1.1 surfaces: ${v11Surfaces.join(
          ', ',
        )}.\nOpen Remove Ads findings: ${removeAdsFindings.join(' ')}`,
        'Remove this override when v1.0 Remove Ads acceptance is green on main.',
      );
    }

    return gate(
      releaseScopeOverrideId,
      'v1.1 scope held behind v1.0 Remove Ads',
      'BLOCKED',
      `Gate ${releaseScopeOverrideId} is marked READY in ${evidencePath}, but the override evidence is insufficient. Missing: ${
        missingOverrideTerms.join(', ') || 'none'
      }. Blocked wording: ${blockedTerms.join(', ') || 'none'}. Recorded evidence: ${
        recordedEvidence || 'empty'
      }`,
      `Record explicit operator approval for v1.1 foundations before v1.0 Remove Ads closure in ${evidencePath}, or remove v1.1 surfaces until Remove Ads is complete.`,
    );
  }

  return gate(
    releaseScopeOverrideId,
    'v1.1 scope held behind v1.0 Remove Ads',
    'BLOCKED',
    `v1.1 runtime/test surfaces are present before v1.0 Remove Ads acceptance is closed: ${v11Surfaces.join(
      ', ',
    )}. Remove Ads findings: ${removeAdsFindings.join(' ')}`,
    `Close v1.0 Remove Ads acceptance first (${removeAdsStep3Command}; test -f ${removeAdsDeviceQaPath}) or record explicit operator approval in ${evidencePath} gate ${releaseScopeOverrideId}.`,
  );
}

function extractLocalArtifactPaths(evidence) {
  const matches = evidence.match(/\b(?:reports|publishing|content|assets)\/[^\s,;:]+/g) || [];
  return [...new Set(matches.map((item) => item.replace(/[.)\]]+$/g, '')))];
}

function validateEasBuildEvidence(evidencePath) {
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
  if (!evidence.appVersion || !String(evidence.appVersion).trim()) {
    errors.push('appVersion is required');
  }
  if (!/^[0-9a-f]{7,40}$/i.test(String(evidence.gitCommit || ''))) {
    errors.push('gitCommit must be a concrete git commit hash');
  }

  for (const platform of ['android', 'ios']) {
    const artifact = evidence[platform] || {};
    if (!artifact.profile || !String(artifact.profile).trim()) {
      errors.push(`${platform}.profile is required`);
    }
    if (!artifact.buildId || !String(artifact.buildId).trim()) {
      errors.push(`${platform}.buildId is required`);
    }
    if (
      !/^https:\/\/(expo\.dev|appstoreconnect\.apple\.com|play\.google\.com)\//i.test(
        artifact.buildUrl || '',
      )
    ) {
      errors.push(`${platform}.buildUrl must be an Expo, App Store Connect, or Google Play URL`);
    }
    const expectedArtifactTypes = platform === 'android' ? /^(apk|aab)$/i : /^(ipa|testflight)$/i;
    if (!expectedArtifactTypes.test(artifact.artifactType || '')) {
      errors.push(
        `${platform}.artifactType must be ${platform === 'android' ? 'apk/aab' : 'ipa/testflight'}`,
      );
    }
    if (!/ready|complete|installed|uploaded|processed/i.test(artifact.installOrTestStatus || '')) {
      errors.push(
        `${platform}.installOrTestStatus must record ready/complete/uploaded/installed status`,
      );
    }
  }

  return errors;
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

  const contentReview = manifest.contentReview || {};
  for (const field of [
    'noOfficialAffiliationClaims',
    'noGuaranteedExamResultClaims',
    'mockExamShowsNoAds',
    'noTestAdBanners',
    'privacyAndSourcePagesMatchPublishingDocs',
  ]) {
    if (contentReview[field] !== true) {
      errors.push(`contentReview.${field} must be true`);
    }
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
    if (!Number.isInteger(shot.pixelWidth) || shot.pixelWidth < 320) {
      errors.push(`${label} missing pixelWidth`);
    }
    if (!Number.isInteger(shot.pixelHeight) || shot.pixelHeight < 320) {
      errors.push(`${label} missing pixelHeight`);
    }
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(shot.locale || '')) {
      errors.push(`${label} missing locale`);
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

  const artifacts = Array.isArray(evidence.artifacts) ? evidence.artifacts : [];
  if (artifacts.length === 0) {
    errors.push('artifacts must include at least one proof artifact file or URL');
  }
  artifacts.forEach((artifact, index) => {
    const label = artifact?.type || `artifacts[${index}]`;
    if (!/^(log|video|screenshot|audio)$/i.test(artifact?.type || '')) {
      errors.push(`${label} proof artifact type must be log/video/screenshot/audio`);
    }
    if (!artifact?.file && !artifact?.url) {
      errors.push(`${label} proof artifact must include file or url`);
      return;
    }
    if (artifact.file) {
      const artifactPath = path.isAbsolute(artifact.file)
        ? artifact.file
        : path.resolve(path.dirname(evidencePath), artifact.file);
      if (!exists(artifactPath)) {
        errors.push(`${label} proof artifact file does not exist: ${artifact.file}`);
      }
    }
    if (artifact.url && !/^https:\/\//i.test(artifact.url)) {
      errors.push(`${label} proof artifact url must be HTTPS`);
    }
  });

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

  const accountOwnership = evidence.accountOwnership || {};
  if (!/^[A-Z0-9]{10}$/.test(String(accountOwnership.appleDeveloperTeamId || ''))) {
    errors.push('accountOwnership.appleDeveloperTeamId must be a concrete 10-character Team ID');
  }
  if (accountOwnership.appleBundleIdReviewed !== true) {
    errors.push('accountOwnership.appleBundleIdReviewed must be true');
  }
  if (!/^[0-9]{6,}$/.test(String(accountOwnership.googlePlayDeveloperId || ''))) {
    errors.push('accountOwnership.googlePlayDeveloperId must be a concrete numeric developer ID');
  }
  if (accountOwnership.googlePackageNameReviewed !== true) {
    errors.push('accountOwnership.googlePackageNameReviewed must be true');
  }

  const adMob = evidence.adMob || {};
  const adMobStatus = String(adMob.status || '');
  const adMobAppId = String(adMob.appId || '');
  if (!/^ca-app-pub-\d{16}~\d{10}$/i.test(adMobAppId)) {
    errors.push('adMob.appId must be a concrete AdMob app ID');
  }
  if (adMobStatus && !/^(ready|created|configured)$/i.test(adMobStatus)) {
    errors.push('adMob.status must be ready, created, or configured');
  }
  if (adMob.realAdsEnabled !== true) {
    errors.push('adMob.realAdsEnabled must be true for ad-supported v1.0');
  }
  if (adMob.appAdsTxtReviewed !== true) {
    errors.push('adMob.appAdsTxtReviewed must be true');
  }

  const listingMetadata = evidence.listingMetadata || {};
  if (listingMetadata.appStoreListingReviewed !== true) {
    errors.push('listingMetadata.appStoreListingReviewed must be true');
  }
  if (listingMetadata.appStoreListingPath !== 'publishing/app-store-listing.md') {
    errors.push('listingMetadata.appStoreListingPath must be publishing/app-store-listing.md');
  } else if (!exists(listingMetadata.appStoreListingPath)) {
    errors.push(
      `listingMetadata.appStoreListingPath does not exist: ${listingMetadata.appStoreListingPath}`,
    );
  }
  if (listingMetadata.googlePlayListingReviewed !== true) {
    errors.push('listingMetadata.googlePlayListingReviewed must be true');
  }
  if (listingMetadata.googlePlayListingPath !== 'publishing/google-play-listing.md') {
    errors.push('listingMetadata.googlePlayListingPath must be publishing/google-play-listing.md');
  } else if (!exists(listingMetadata.googlePlayListingPath)) {
    errors.push(
      `listingMetadata.googlePlayListingPath does not exist: ${listingMetadata.googlePlayListingPath}`,
    );
  }
  if (listingMetadata.matchesStoreRecords !== true) {
    errors.push('listingMetadata.matchesStoreRecords must be true');
  }

  return errors;
}

function validateStoreCredentialEvidence(evidencePath) {
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

  const ios = evidence.ios || {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(ios.appleId || ''))) {
    errors.push('ios.appleId must be a concrete Apple ID email');
  }
  if (!/^[0-9]{6,}$/.test(String(ios.ascAppId || ''))) {
    errors.push('ios.ascAppId must be a concrete numeric App Store Connect app ID');
  }
  if (!/^[A-Z0-9]{10}$/.test(String(ios.appleTeamId || ''))) {
    errors.push('ios.appleTeamId must be a concrete 10-character Team ID');
  }
  if (!ios.credentialsSource || !String(ios.credentialsSource).trim()) {
    errors.push('ios.credentialsSource is required');
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(ios.credentialsCheckedAt || '')) {
    errors.push('ios.credentialsCheckedAt must be an ISO UTC timestamp');
  }

  const android = evidence.android || {};
  if (!/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/i.test(android.serviceAccountEmail || '')) {
    errors.push('android.serviceAccountEmail must be a Google service-account email');
  }
  if (!/^SHA256:[0-9a-f]{64}$/i.test(android.serviceAccountKeyFingerprint || '')) {
    errors.push('android.serviceAccountKeyFingerprint must be a SHA256 fingerprint');
  }
  if (android.packageName !== 'com.billyyiu.swedishcivictest') {
    errors.push('android.packageName must be com.billyyiu.swedishcivictest');
  }
  if (!android.credentialsSource || !String(android.credentialsSource).trim()) {
    errors.push('android.credentialsSource is required');
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(android.credentialsCheckedAt || '')) {
    errors.push('android.credentialsCheckedAt must be an ISO UTC timestamp');
  }

  return errors;
}

function validateStorePolicyQuestionnaireEvidence(evidencePath) {
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
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(evidence.reviewedAt || '')) {
    errors.push('reviewedAt must be an ISO UTC timestamp');
  }
  if (!evidence.reviewer || !String(evidence.reviewer).trim()) {
    errors.push('reviewer is required');
  }

  const apple = evidence.apple || {};
  for (const field of [
    'ageRatingReviewed',
    'exportComplianceReviewed',
    'contentRightsReviewed',
    'noOfficialAffiliationClaims',
  ]) {
    if (apple[field] !== true) {
      errors.push(`apple.${field} must be true`);
    }
  }
  if (apple.usesNonExemptEncryption !== false) {
    errors.push('apple.usesNonExemptEncryption must be false');
  }

  const google = evidence.google || {};
  for (const field of [
    'contentRatingReviewed',
    'targetAudienceReviewed',
    'adsDeclarationReviewed',
    'noGovernmentAffiliationClaims',
  ]) {
    if (google[field] !== true) {
      errors.push(`google.${field} must be true`);
    }
  }
  if (google.containsRealMoneyGambling !== false) {
    errors.push('google.containsRealMoneyGambling must be false');
  }

  return errors;
}

function validateReleaseOwnerApprovalEvidence(evidencePath) {
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  if (evidence.status !== 'approved') {
    errors.push('status must be approved');
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(evidence.approvedAt || '')) {
    errors.push('approvedAt must be an ISO UTC timestamp');
  }
  if (!evidence.approver || !String(evidence.approver).trim()) {
    errors.push('approver is required');
  }
  if (!/^[0-9a-f]{7,40}$/i.test(String(evidence.approvedCommit || ''))) {
    errors.push('approvedCommit must be a short or full git SHA');
  }
  if (evidence.releaseDecision !== 'approved-for-store-submission') {
    errors.push('releaseDecision must be approved-for-store-submission');
  }
  if (evidence.noKnownBlockers !== true) {
    errors.push('noKnownBlockers must be true');
  }
  if (evidence.evidenceReport !== 'reports/release-evidence-2026-05-15.md') {
    errors.push('evidenceReport must be reports/release-evidence-2026-05-15.md');
  } else if (!exists(evidence.evidenceReport)) {
    errors.push(`evidenceReport does not exist: ${evidence.evidenceReport}`);
  }

  const checkedGates = Array.isArray(evidence.checkedGates) ? evidence.checkedGates : [];
  const requiredCheckedGates = [
    'eas-auth',
    'eas-build-artifacts',
    'android-device-audio',
    'ios-device-audio',
    'store-records',
    'store-credentials',
    'store-policy-questionnaires',
    'privacy-review',
    'public-urls',
    'device-screenshots',
  ];
  for (const gateId of requiredCheckedGates) {
    if (!checkedGates.includes(gateId)) {
      errors.push(`checkedGates must include ${gateId}`);
    }
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
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(evidence.reviewedAt || '')) {
    errors.push('reviewedAt must be an ISO UTC timestamp');
  }
  if (!evidence.reviewer || !String(evidence.reviewer).trim()) {
    errors.push('reviewer is required');
  }

  const reviewedBuild = evidence.reviewedBuild || {};
  for (const field of ['id', 'version', 'commit']) {
    if (!reviewedBuild[field] || !String(reviewedBuild[field]).trim()) {
      errors.push(`reviewedBuild.${field} is required`);
    }
  }

  const storeQuestionnaires = evidence.storeQuestionnaires || {};
  if (storeQuestionnaires.appleAppStoreConnectReviewed !== true) {
    errors.push('storeQuestionnaires.appleAppStoreConnectReviewed must be true');
  }
  if (storeQuestionnaires.googlePlayConsoleReviewed !== true) {
    errors.push('storeQuestionnaires.googlePlayConsoleReviewed must be true');
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
  if (googleMobileAds.realAdsEnabled !== true) {
    errors.push('googleMobileAds.realAdsEnabled must be true');
  }
  if (googleMobileAds.removeAdsIapReviewed !== true) {
    errors.push('googleMobileAds.removeAdsIapReviewed must be true');
  }
  if (googleMobileAds.consentFlowReviewed !== true) {
    errors.push('googleMobileAds.consentFlowReviewed must be true');
  }
  const googleMobileAdsGate = String(googleMobileAds.gate || '');
  if (
    !/EXPO_PUBLIC_REAL_ADS_ENABLED=true|real ads enabled|ad-supported/i.test(googleMobileAdsGate)
  ) {
    errors.push('googleMobileAds.gate must mention ad-supported real ads');
  }
  if (!/Remove Ads|29 SEK|in-app purchase|non-consumable/i.test(googleMobileAdsGate)) {
    errors.push('googleMobileAds.gate must mention Remove Ads IAP and 29 SEK');
  }
  if (!/App Tracking Transparency|ATT|UMP|consent|IDFA/i.test(googleMobileAdsGate)) {
    errors.push('googleMobileAds.gate must mention ATT/UMP consent review');
  }

  const disabledSdks = evidence.disabledSdks || {};
  for (const sdk of ['analytics', 'crashReporting']) {
    if (disabledSdks[sdk] !== true) {
      errors.push(`disabledSdks.${sdk} must be true`);
    }
  }
  for (const sdk of ['purchases', 'realAds']) {
    if (disabledSdks[sdk] === true) {
      errors.push(`disabledSdks.${sdk} must not be true for ad-supported v1.0`);
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
  if (id === 'eas-build-artifacts') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateEasBuildEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'privacy-review') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validatePrivacyReviewEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'release-owner-approval') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateReleaseOwnerApprovalEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
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

  if (id === 'store-credentials') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateStoreCredentialEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
    );
    return errors.length > 0 ? errors : null;
  }

  if (id === 'store-policy-questionnaires') {
    const jsonPaths = artifactPaths.filter((artifactPath) => /\.json$/i.test(artifactPath));
    if (jsonPaths.length === 0) return null;

    const errors = jsonPaths.flatMap((jsonPath) =>
      validateStorePolicyQuestionnaireEvidence(jsonPath).map((error) => `${jsonPath}: ${error}`),
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

function skippedExternalCheck(command, args) {
  return {
    ok: false,
    stdout: '',
    stderr: `Skipped by RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS=1: ${[command, ...args].join(' ')}`,
  };
}

function externalCommandSucceeds(command, args) {
  return skipExternalChecks ? skippedExternalCheck(command, args) : commandSucceeds(command, args);
}

function gate(id, label, status, evidence, nextAction) {
  return { id, label, status, evidence, nextAction };
}

function allowedDirtyPathPrefixes() {
  return String(process.env.RELEASE_PREFLIGHT_ALLOWED_DIRTY_PATHS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function porcelainPath(line) {
  return line.slice(3).trim();
}

function isAllowedDirtyLine(line, allowedPrefixes) {
  const changedPath = porcelainPath(line);
  return allowedPrefixes.some((prefix) => changedPath === prefix || changedPath.startsWith(prefix));
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
    const changedLines = status.stdout.split('\n').filter(Boolean);
    const allowedPrefixes = allowedDirtyPathPrefixes();
    const blockingLines = changedLines.filter((line) => !isAllowedDirtyLine(line, allowedPrefixes));
    if (blockingLines.length === 0) {
      return gate(
        'git-worktree-clean',
        'Clean git worktree for release candidate',
        'READY',
        `Only ignored generated files were present:\n${changedLines.slice(0, 25).join('\n')}`,
        'Run release preflight from the exact clean release commit.',
      );
    }

    const changedFiles = blockingLines.slice(0, 25).join('\n');
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
  const expoDoctor = externalCommandSucceeds('npm', ['exec', '--', 'expo-doctor']);
  const webExport = externalCommandSucceeds('npm', ['run', 'release:web-export-smoke']);
  const nativePrebuild = externalCommandSucceeds('npm', ['run', 'release:native-prebuild-smoke']);
  const easVersion = externalCommandSucceeds('npx', ['--yes', 'eas-cli@18.13.0', '--version']);
  const easWhoami = externalCommandSucceeds('npx', ['--yes', 'eas-cli@18.13.0', 'whoami']);

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
    releaseScopeOverrideGate(manualEvidence),
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
      'eas-build-artifacts',
      'EAS Android/iOS build artifacts',
      'No EAS Android/iOS build artifact evidence is recorded.',
      'Create EAS Android and iOS internal/preview builds and record build IDs, URLs, profiles, artifact types, and readiness status.',
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
      'No App Store Connect, Google Play Console, and AdMob app record evidence is recorded for the ad-supported v1.0 release.',
      'Create Apple/Google account/app records, create the AdMob app record, review app-ads.txt, and copy URLs/IDs into release evidence.',
    ),
    evidenceGate(
      manualEvidence,
      'store-credentials',
      'Apple/Google submit credentials',
      'No App Store Connect or Google Play submit credential evidence is recorded.',
      'Verify App Store Connect submit identifiers and Google Play service-account credentials, then record credential evidence outside secrets.',
    ),
    evidenceGate(
      manualEvidence,
      'store-policy-questionnaires',
      'Apple/Google policy questionnaires',
      'No App Store age rating/export compliance or Google Play content rating/ads declaration evidence is recorded.',
      'Review App Store and Google Play policy questionnaires for the generated binary, then record non-secret evidence.',
    ),
    evidenceGate(
      manualEvidence,
      'privacy-review',
      'Store privacy questionnaire review against binary',
      'No final Apple privacy labels / Google Play Data safety review against the generated binary is recorded.',
      'After EAS build and store records exist, review Apple privacy labels and Google Play Data safety against the generated binary, including Google Mobile Ads, Remove Ads IAP, and ATT/UMP consent disclosures.',
    ),
    evidenceGate(
      manualEvidence,
      'release-owner-approval',
      'Release owner approval',
      'No final release-owner approval for store submission is recorded.',
      'After build, device, store, policy, privacy, URL, and screenshot gates are ready, record release-owner approval before submission.',
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
