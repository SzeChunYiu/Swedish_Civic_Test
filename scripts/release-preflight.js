const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const configuredPublicUrls = require('../config/publicUrls.json');

const jsonMode = process.argv.includes('--json');
const runValidate = process.argv.includes('--run-validate');
const skipExternalChecks = /^(1|true|yes)$/i.test(
  String(process.env.RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS || '').trim(),
);
const evidencePath = process.env.RELEASE_PREFLIGHT_EVIDENCE_PATH || 'reports/release-gates.json';
const supportUrl = configuredPublicUrls.support;
const privacyUrl = configuredPublicUrls.privacy;
const appAdsUrl = process.env.RELEASE_PREFLIGHT_APP_ADS_URL || configuredPublicUrls.appAdsTxt;
const oldRealAdsV1EnvFlag = ['REAL_ADS', 'ENABLED_FOR_V1'].join('_');
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
  'remove-ads-device-qa': [
    ['Android Remove Ads device QA', /Android|Pixel|Galaxy/i],
    ['iOS Remove Ads device QA', /iOS|iPhone|iPad|TestFlight/i],
    ['EAS preview or TestFlight build', /EAS|preview|TestFlight|build/i],
    ['AdMob test ads rendered before purchase', /AdMob|test ads?|ads? render/i],
    [
      'Remove Ads purchase disables ads',
      /Remove Ads.*purchase|purchase.*Remove Ads|disables? ads|hides? ads/i,
    ],
    ['entitlement persists after relaunch', /entitlement|persist|relaunch/i],
    ['restore purchase works', /restore/i],
    ['ATT prompt exercised', /\bATT\b|App Tracking Transparency/i],
    ['UMP consent prompt exercised', /\bUMP\b|consent/i],
    ['exam screens render no ads', /no ad renders?.*exam|exam.*no ads?|mock exam/i],
  ],
  'store-records': [
    ['App Store Connect record', /App Store Connect|Apple/i],
    ['Google Play Console record', /Google Play/i],
    ['bundle/package identifier', /com\.billyyiu\.almostswedish/i],
    ['Support URL entered in store records', /Support URL/i],
    ['Privacy Policy URL entered in store records', /Privacy Policy URL/i],
    ['Google Mobile Ads or AdMob app record', /Google Mobile Ads|AdMob/i],
    ['app-ads.txt review', /app-ads\.txt/i],
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
      'Google Mobile Ads ad-supported declaration review',
      /Google Mobile Ads|AdMob|ad-supported|ads declaration/i,
    ],
    ['Remove Ads IAP questionnaire review', /Remove Ads|29 SEK|in-app purchase|non-consumable/i],
    ['ATT/UMP consent disclosure review', /App Tracking Transparency|ATT|UMP|consent|IDFA/i],
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

const stalePublicPrivacyPatterns = [
  [/no user data is collected/i, 'no user data is collected'],
  [/no user data is shared/i, 'no user data is shared'],
  [/no user data collected/i, 'no user data collected'],
  [/no user data shared/i, 'no user data shared'],
  [/real ad rendering is disabled/i, 'real ad rendering is disabled'],
  [/real ads? (?:is|are) disabled/i, 'real ads disabled'],
  [/Data Not Collected/i, 'Data Not Collected'],
  [new RegExp(oldRealAdsV1EnvFlag, 'i'), oldRealAdsV1EnvFlag],
];

const staleReleaseAdEvidencePatterns = [
  [new RegExp(['AdMob', 'is', 'deferred'].join('\\s+'), 'i'), 'stale AdMob deferral'],
  [
    new RegExp(['real ads? remain', 'disabled'].join('\\s+'), 'i'),
    'stale real-ads disabled decision',
  ],
  [/real ads? (?:is|are) disabled/i, 'stale real-ads disabled decision'],
  [/keep real ads? disabled/i, 'stale real-ads disabled decision'],
  [new RegExp(`${oldRealAdsV1EnvFlag}\\s*=\\s*false`, 'i'), `${oldRealAdsV1EnvFlag}=false`],
  [new RegExp(oldRealAdsV1EnvFlag, 'i'), oldRealAdsV1EnvFlag],
  [
    new RegExp(['deferred', 'real', 'ads', 'disabled'].join('[-\\s]+'), 'i'),
    'stale real-ads disabled status',
  ],
  [new RegExp(['disabled', 'Google Mobile Ads'].join('\\s+'), 'i'), 'disabled ad SDK posture'],
];

const staleReleaseIdentityEvidencePatterns = [
  [
    new RegExp(['com', 'billyyiu', 'swedishcivictest'].join('\\.'), 'i'),
    'stale native app identifier',
  ],
  [
    /https?:\/\/(?:dist-[^\s/]+|[^\s/]*billy10384[^\s/]*)\.vercel\.app[^\s),;]*/i,
    'legacy Vercel public-site host URL',
  ],
];

const gateSpecificBlockedEvidencePatterns = {
  'device-screenshots': [
    [/web[- ]draft/i, 'web-draft evidence is not final store screenshot evidence'],
    [/browser/i, 'browser screenshots are not final store screenshot evidence'],
  ],
};

const v11ScopeSurfaceClassifiers = [
  ['lib/storage/reviewStore.ts', 'v1.1 review store runtime'],
  ['lib/learning/adaptivePractice.ts', 'v1.1 adaptive practice runtime'],
  ['lib/learning/dailyChallenge.ts', 'v1.1 daily challenge runtime'],
  ['lib/storage/companionStore.ts', 'v1.1 companion state runtime'],
  ['lib/mascot/catalog.ts', 'v1.1 mascot catalog'],
  ['lib/monetization/proLifetimePurchase.ts', 'v1.1 Pro purchase runtime'],
];
const v11ScopeScanRoots = envPathList('RELEASE_PREFLIGHT_V11_SCOPE_ROOTS', []);
const v11ScopeSourceMarkers = [
  ['v1.1 source marker', /\bv1\.1\b/i],
  ['v1.1 Pro UI marker', /ProPaywall|Pro Lifetime|EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE/i],
  ['v1.1 adaptive practice marker', /pickAdaptiveSession|adaptivePractice/i],
  ['v1.1 daily challenge marker', /dailyChallenge|DailyChallenge/i],
  ['v1.1 companion marker', /companionStore|selectedMascot/i],
];

const removeAdsDeviceQaPath =
  process.env.RELEASE_PREFLIGHT_DEVICE_QA_PATH || 'reports/release-ads-iap-device-qa.md';
const removeAdsPurchasesPath =
  process.env.RELEASE_PREFLIGHT_REMOVE_ADS_PURCHASES_PATH || 'lib/monetization/purchases.ts';
const removeAdsStep3WiringRoots = envPathList('RELEASE_PREFLIGHT_REMOVE_ADS_WIRING_ROOTS', [
  'app',
  'components',
  'lib',
]);
const removeAdsStep3StructuralGate =
  'Remove Ads structural gate replacing GOAL step 3 grep: purchases.ts exists, canonical buy/restore flows use REMOVE_ADS_PRODUCT_ID, platform store ids export Android removeads + iOS canonical id, 29 SEK pricing is exported, and app/components/lib expose Remove Ads wiring';
const releaseScopeOverrideId = 'release-scope-v11';
const removeAdsDeviceQaArtifactRoot = 'reports/release-device-qa/';
const removeAdsDeviceQaRequiredChecks = [
  'admob-test-ads-study-screens',
  'remove-ads-purchase-hides-ads',
  'entitlement-persists-after-relaunch',
  'restore-purchase-restores-entitlement',
  'att-status-documented',
  'ump-consent-documented',
  'mock-exam-shows-no-ads',
];

const expectedPublicUrlEvidenceRequirements = {
  'store-records': [
    ['expected Support URL', supportUrl],
    ['expected Privacy Policy URL', privacyUrl],
  ],
  'public-urls': [
    ['expected Support URL', supportUrl],
    ['expected Privacy Policy URL', privacyUrl],
    ['expected app-ads.txt URL', appAdsUrl],
  ],
};

function exists(path) {
  return fs.existsSync(path);
}

function readFileIfExists(filePath) {
  return exists(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function envPathList(name, fallback) {
  const value = String(process.env[name] || '').trim();
  if (!value) return fallback;

  const entries = value
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : fallback;
}

function staleReleaseAdEvidenceTerms(source) {
  return staleReleaseAdEvidencePatterns
    .filter(([pattern]) => pattern.test(source))
    .map(([, label]) => label);
}

function staleReleaseAdEvidenceGate(id, label, staleTerms) {
  const matchCount = staleTerms.length;
  return gate(
    id,
    label,
    'BLOCKED',
    `Gate ${id} evidence in ${evidencePath} still uses obsolete ad-disablement release posture (${matchCount} pattern match${
      matchCount === 1 ? '' : 'es'
    }). Replace it with current ad-supported Google Mobile Ads, ATT/UMP consent, and 29 SEK Remove Ads IAP evidence before relying on this gate.`,
    `Replace obsolete ad-disablement evidence for ${id} in ${evidencePath} with current ad-supported release evidence.`,
  );
}

function staleReleaseAdEvidenceError(staleTerms) {
  const matchCount = staleTerms.length;
  return `obsolete ad-disablement evidence (${matchCount} pattern match${
    matchCount === 1 ? '' : 'es'
  })`;
}

function staleReleaseIdentityEvidenceTerms(source) {
  return staleReleaseIdentityEvidencePatterns
    .filter(([pattern]) => pattern.test(source))
    .map(([, label]) => label);
}

function staleReleaseIdentityEvidenceGate(id, label, staleTerms) {
  const matchCount = staleTerms.length;
  return gate(
    id,
    label,
    'BLOCKED',
    `Gate ${id} evidence in ${evidencePath} still uses obsolete app identity or public-site host values (${matchCount} pattern match${
      matchCount === 1 ? '' : 'es'
    }: ${staleTerms.join(', ')}). Replace it with com.billyyiu.almostswedish and the current GitHub Pages support/privacy URLs before relying on this gate.`,
    `Replace obsolete app identity/public URL evidence for ${id} in ${evidencePath}.`,
  );
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

function normalizeRepoPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function scopedSurfacePath(filePath, root) {
  const relative = normalizeRepoPath(path.relative(root, filePath));
  if (path.isAbsolute(root)) {
    return `custom-scope-root/${relative}`;
  }
  return normalizeRepoPath(filePath);
}

function addV11Surface(surfaceMap, surfacePath, reason) {
  if (!surfaceMap.has(surfacePath)) {
    surfaceMap.set(surfacePath, new Set());
  }
  surfaceMap.get(surfacePath).add(reason);
}

function listV11ScopeSurfaces() {
  const surfaces = new Map();

  v11ScopeSurfaceClassifiers.forEach(([surfacePath, reason]) => {
    if (exists(surfacePath)) {
      addV11Surface(surfaces, surfacePath, reason);
    }
  });

  const testSurfaces = exists('tests')
    ? fs
        .readdirSync('tests')
        .filter((name) => /^v1-1-.*\.test\.js$/.test(name))
        .map((name) => path.join('tests', name))
    : [];
  testSurfaces.forEach((surfacePath) => {
    addV11Surface(surfaces, normalizeRepoPath(surfacePath), 'v1.1 test surface');
  });

  v11ScopeScanRoots.forEach((root) => {
    listFiles(root).forEach((filePath) => {
      const source = readFileIfExists(filePath);
      v11ScopeSourceMarkers.forEach(([reason, pattern]) => {
        if (pattern.test(source)) {
          addV11Surface(surfaces, scopedSurfacePath(filePath, root), reason);
        }
      });
    });
  });

  return [...surfaces.entries()]
    .map(([surfacePath, reasons]) => ({
      path: surfacePath,
      reasons: [...reasons].sort(),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function formatV11ScopeSurface(surface) {
  return `${surface.path} (${surface.reasons.join('; ')})`;
}

function formatV11ScopeSurfaces(surfaces) {
  return surfaces.map(formatV11ScopeSurface).join(', ');
}

function removeAdsV1AcceptanceFindings() {
  const findings = [];
  const adsSource = readFileIfExists('lib/monetization/ads.ts');
  const purchasesSource = readFileIfExists(removeAdsPurchasesPath);
  const publicPrivacySurface = [
    'publishing/public-site/privacy/index.html',
    'publishing/public-support-and-privacy.md',
    'publishing/google-play-listing.md',
  ]
    .map(readFileIfExists)
    .join('\n');

  if (!/REAL_ADS_ENABLED/.test(adsSource)) {
    findings.push('GOAL step 1 is not structurally green: REAL_ADS_ENABLED is missing.');
  }
  if (/REAL_ADS_ENABLED_FOR_V1\s*=\s*false/.test(adsSource)) {
    findings.push('GOAL step 1 is red: REAL_ADS_ENABLED_FOR_V1 is still hardcoded false.');
  }
  findings.push(
    ...removeAdsStep3StructuralFindings(purchasesSource, {
      purchasesPath: removeAdsPurchasesPath,
      wiringRoots: removeAdsStep3WiringRoots,
    }),
  );
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
  const stalePublicPrivacyTerms = stalePublicPrivacyPatterns
    .filter(([pattern]) => pattern.test(publicPrivacySurface))
    .map(([, label]) => label);
  if (stalePublicPrivacyTerms.length > 0) {
    findings.push(
      `Public privacy posture is red: hosted/listing copy still says ${stalePublicPrivacyTerms.join(
        ', ',
      )}.`,
    );
  }
  if (!/Google Mobile Ads|AdMob/i.test(publicPrivacySurface)) {
    findings.push(
      'Public privacy posture is red: public copy does not disclose Google Mobile Ads.',
    );
  }
  if (!/Remove Ads/i.test(publicPrivacySurface) || !/29 SEK/i.test(publicPrivacySurface)) {
    findings.push(
      'Public privacy posture is red: public copy does not disclose 29 SEK Remove Ads.',
    );
  }
  if (
    !/App Tracking Transparency|ATT/i.test(publicPrivacySurface) ||
    !/UMP consent/i.test(publicPrivacySurface)
  ) {
    findings.push('Public privacy posture is red: public copy does not disclose ATT/UMP consent.');
  }
  if (!exists(removeAdsDeviceQaPath)) {
    findings.push(`Manual device-QA gate is red: ${removeAdsDeviceQaPath} is missing.`);
  } else {
    const errors = validateRemoveAdsDeviceQaReport(removeAdsDeviceQaPath);
    if (errors.length > 0) {
      findings.push(
        `Manual device-QA gate is red: ${removeAdsDeviceQaPath} is incomplete: ${errors.join(
          '; ',
        )}.`,
      );
    }
  }

  return findings;
}

function removeAdsStep3StructuralFindings(purchasesSource, options = {}) {
  const findings = [];
  const purchasesPath = options.purchasesPath || removeAdsPurchasesPath;
  const wiringRoots = options.wiringRoots || removeAdsStep3WiringRoots;
  const wiringRootLabel = wiringRoots.join('/');

  if (!purchasesSource) {
    return [`GOAL step 3 structural gate is red: ${purchasesPath} is missing.`];
  }

  const normalizedPurchasesSource = purchasesSource.replace(/\s+/g, ' ');
  const step3Checks = [
    [
      /export\s+const\s+REMOVE_ADS_PRODUCT_ID\s*=\s*['"][a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+\.removeads['"]/.test(
        purchasesSource,
      ) ||
        /export\s+const\s+REMOVE_ADS_PRODUCT_ID\s*=\s*`\$\{APP_NATIVE_IDENTIFIER\}\.removeads`/.test(
          purchasesSource,
        ),
      'Remove Ads product id must be an exported reverse-DNS removeads identifier',
    ],
    [
      /export\s+const\s+REMOVE_ADS_PRICE_LABEL\s*=\s*['"]29 SEK['"]/.test(purchasesSource),
      'Remove Ads price label must stay 29 SEK',
    ],
    [
      /export\s+const\s+REMOVE_ADS_IOS_PRODUCT_ID\s*=\s*REMOVE_ADS_PRODUCT_ID\b/.test(
        purchasesSource,
      ),
      'Remove Ads iOS store product id must match the canonical entitlement id',
    ],
    [
      /export\s+const\s+REMOVE_ADS_ANDROID_PRODUCT_ID\s*=\s*['"]removeads['"]/.test(
        purchasesSource,
      ),
      'Remove Ads Android store product id must stay Play Console removeads',
    ],
    [
      /export\s+const\s+REMOVE_ADS_STORE_PRODUCT_IDS\s*=\s*\{[\s\S]*android:\s*REMOVE_ADS_ANDROID_PRODUCT_ID,?[\s\S]*ios:\s*REMOVE_ADS_IOS_PRODUCT_ID,?[\s\S]*\}\s*as\s+const/.test(
        purchasesSource,
      ),
      'Remove Ads store product ids must export the platform-specific Android/iOS map',
    ],
    [
      normalizedPurchasesSource.includes(
        'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
      ),
      'buyRemoveAds must request REMOVE_ADS_PRODUCT_ID',
    ],
    [
      normalizedPurchasesSource.includes(
        'const purchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);',
      ),
      'restoreRemoveAdsPurchase must restore REMOVE_ADS_PRODUCT_ID',
    ],
    [
      /export\s+async\s+function\s+restoreRemoveAdsPurchase\b/.test(purchasesSource),
      'restoreRemoveAdsPurchase must remain exported',
    ],
    [
      anyRepoFileMatches(wiringRoots, /remove[-_\s]?ads/i),
      `Remove Ads wiring must be visible in ${wiringRootLabel}`,
    ],
  ];

  step3Checks.forEach(([isValid, message]) => {
    if (!isValid) findings.push(`GOAL step 3 structural gate is red: ${message}.`);
  });

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
      `v1.1 surfaces are present, but the structural Remove Ads v1.0 and device-QA gates are closed. Surfaces: ${formatV11ScopeSurfaces(
        v11Surfaces,
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
        `Operator override recorded in ${evidencePath}: ${recordedEvidence}\nDetected v1.1 surfaces: ${formatV11ScopeSurfaces(
          v11Surfaces,
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
    `v1.1 runtime/test surfaces are present before v1.0 Remove Ads acceptance is closed: ${formatV11ScopeSurfaces(
      v11Surfaces,
    )}. Remove Ads findings: ${removeAdsFindings.join(' ')}`,
    `Close v1.0 Remove Ads acceptance first (${removeAdsStep3StructuralGate}; test -f ${removeAdsDeviceQaPath}) or record explicit operator approval in ${evidencePath} gate ${releaseScopeOverrideId}.`,
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

function artifactPathExists(reference, baseDir) {
  if (/^https:\/\//i.test(reference)) return true;
  const artifactPath = path.isAbsolute(reference)
    ? reference
    : /^(?:reports|publishing|content|assets)\//.test(reference)
      ? path.resolve(reference)
      : path.resolve(baseDir, reference);
  return exists(artifactPath);
}

function validateProofReferences(values, baseDir, label) {
  const errors = [];
  if (!Array.isArray(values) || values.length === 0) {
    return [`proof.${label} must include at least one local path or HTTPS URL`];
  }

  values.forEach((value, index) => {
    const reference = String(value || '').trim();
    if (!reference) {
      errors.push(`proof.${label}[${index}] is blank`);
    } else if (!/^https:\/\//i.test(reference) && !/^[./\w-]/.test(reference)) {
      errors.push(`proof.${label}[${index}] must be a local path or HTTPS URL`);
    } else if (!artifactPathExists(reference, baseDir)) {
      errors.push(`proof.${label}[${index}] does not exist: ${reference}`);
    }
  });

  return errors;
}

function validateRemoveAdsDeviceQaArtifact(artifactPath, expectedPlatform) {
  let artifact;
  try {
    artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } catch (error) {
    return [`could not parse ${artifactPath}: ${error.message}`];
  }

  const errors = [];
  const platform = String(artifact.platform || '').toLowerCase();
  if (platform !== expectedPlatform) {
    errors.push(`platform must be ${expectedPlatform}`);
  }
  if (artifact.status !== 'passed') {
    errors.push('status must be passed');
  }
  if (!artifact.device || !String(artifact.device).trim()) {
    errors.push('device is required');
  }
  if (!artifact.osVersion || !String(artifact.osVersion).trim()) {
    errors.push('osVersion is required');
  }
  if (!artifact.reviewer || !String(artifact.reviewer).trim()) {
    errors.push('reviewer is required');
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(artifact.reviewedAt || '')) {
    errors.push('reviewedAt must be an ISO UTC timestamp');
  }

  const build = artifact.build || {};
  if (!build.id || !String(build.id).trim()) {
    errors.push('build.id is required');
  }
  if (!/^https:\/\//i.test(build.url || '')) {
    errors.push('build.url must be an HTTPS URL');
  }
  if (!build.version || !String(build.version).trim()) {
    errors.push('build.version is required');
  }

  const checks = Array.isArray(artifact.checks) ? artifact.checks : [];
  if (checks.length === 0) {
    errors.push('checks array is required');
  }
  const passedChecks = new Set(
    checks
      .filter((check) => check && check.result === 'passed')
      .map((check) => String(check.id || '')),
  );
  for (const checkId of removeAdsDeviceQaRequiredChecks) {
    if (!passedChecks.has(checkId)) {
      errors.push(`missing passed check ${checkId}`);
    }
  }
  checks.forEach((check, index) => {
    if (!check?.id || !String(check.id).trim()) {
      errors.push(`checks[${index}].id is required`);
    }
    if (!/^(passed|failed|not_applicable|pending)$/i.test(check?.result || '')) {
      errors.push(`checks[${index}].result must be passed, failed, not_applicable, or pending`);
    }
    if (check?.result !== 'passed') {
      errors.push(`${check?.id || `checks[${index}]`} result must be passed`);
    }
  });

  const proof = artifact.proof || {};
  const baseDir = path.dirname(artifactPath);
  errors.push(...validateProofReferences(proof.screenshots, baseDir, 'screenshots'));
  errors.push(...validateProofReferences(proof.logs, baseDir, 'logs'));

  return errors;
}

function extractRemoveAdsDeviceQaArtifactPaths(markdown) {
  const matches = markdown.match(/\breports\/release-device-qa\/[^\s),;\]]+\.json\b/g) || [];
  return [...new Set(matches.map((item) => item.replace(/[.)\]]+$/g, '')))];
}

function validateRemoveAdsDeviceQaReport(reportPath) {
  let markdown;
  try {
    markdown = fs.readFileSync(reportPath, 'utf8');
  } catch (error) {
    return [`could not read ${reportPath}: ${error.message}`];
  }

  const errors = [];
  const blockedTerms = [
    ...blockedEvidencePatterns,
    [/^\s*done\s*$/im, 'generic "done" evidence'],
    [/- \[[ \t]\]/, 'unchecked manual checklist item'],
  ]
    .filter(([pattern]) => pattern.test(markdown))
    .map(([, label]) => label);
  if (blockedTerms.length > 0) {
    errors.push(
      `report still contains blocker, placeholder, or prose-only language: ${blockedTerms.join(
        ', ',
      )}`,
    );
  }

  const artifactPaths = extractRemoveAdsDeviceQaArtifactPaths(markdown);
  if (artifactPaths.length === 0) {
    errors.push(
      `report must link per-platform JSON artifacts under ${removeAdsDeviceQaArtifactRoot}`,
    );
  }

  const linkedPlatforms = new Set();
  for (const artifactPath of artifactPaths) {
    if (!exists(artifactPath)) {
      errors.push(`linked JSON artifact does not exist: ${artifactPath}`);
      continue;
    }

    let parsedPlatform = '';
    try {
      parsedPlatform = String(JSON.parse(fs.readFileSync(artifactPath, 'utf8')).platform || '')
        .toLowerCase()
        .trim();
    } catch {
      parsedPlatform = /ios/i.test(artifactPath)
        ? 'ios'
        : /android/i.test(artifactPath)
          ? 'android'
          : '';
    }
    if (parsedPlatform) linkedPlatforms.add(parsedPlatform);
    const expectedPlatform =
      parsedPlatform === 'ios' || parsedPlatform === 'android'
        ? parsedPlatform
        : /ios/i.test(artifactPath)
          ? 'ios'
          : 'android';
    const artifactErrors = validateRemoveAdsDeviceQaArtifact(artifactPath, expectedPlatform);
    errors.push(...artifactErrors.map((error) => `${artifactPath}: ${error}`));
  }

  for (const platform of ['ios', 'android']) {
    if (!linkedPlatforms.has(platform)) {
      errors.push(`report must link a ${platform} JSON artifact`);
    }
  }

  return errors;
}

function validateStoreRecordEvidence(evidencePath) {
  let evidence;
  let source;
  try {
    source = fs.readFileSync(evidencePath, 'utf8');
    evidence = JSON.parse(source);
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  const staleTerms = staleReleaseAdEvidenceTerms(source);
  if (staleTerms.length > 0) {
    errors.push(staleReleaseAdEvidenceError(staleTerms));
  }

  if (evidence.status !== 'ready') {
    errors.push('status must be ready');
  }
  if (evidence.bundleIdentifier !== 'com.billyyiu.almostswedish') {
    errors.push('bundleIdentifier must be com.billyyiu.almostswedish');
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
  if (android.packageName !== 'com.billyyiu.almostswedish') {
    errors.push('android.packageName must be com.billyyiu.almostswedish');
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
  let source;
  try {
    source = fs.readFileSync(evidencePath, 'utf8');
    evidence = JSON.parse(source);
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  const staleTerms = staleReleaseAdEvidenceTerms(source);
  if (staleTerms.length > 0) {
    errors.push(staleReleaseAdEvidenceError(staleTerms));
  }

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
    'remove-ads-device-qa',
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
  let source;
  try {
    source = fs.readFileSync(evidencePath, 'utf8');
    evidence = JSON.parse(source);
  } catch (error) {
    return [`could not parse ${evidencePath}: ${error.message}`];
  }

  const errors = [];
  const staleTerms = staleReleaseAdEvidenceTerms(source);
  if (staleTerms.length > 0) {
    errors.push(staleReleaseAdEvidenceError(staleTerms));
  }

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

  if (id === 'remove-ads-device-qa') {
    const reportPaths = artifactPaths.filter((artifactPath) =>
      /release-ads-iap-device-qa\.md$/i.test(artifactPath),
    );
    if (reportPaths.length === 0) return null;

    const errors = reportPaths.flatMap((reportPath) =>
      validateRemoveAdsDeviceQaReport(reportPath).map((error) => `${reportPath}: ${error}`),
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
    stdout: result.stdout.trimEnd(),
    stderr: result.stderr.trimEnd(),
  };
}

function commandEvidence(result, fallback = '') {
  const streams = [result.stderr, result.stdout].filter(Boolean);
  const combined = [...new Set(streams)].join('\n');
  return combined || fallback;
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
  const staleIdentityTerms = staleReleaseIdentityEvidenceTerms(recordedEvidence);
  const staleTerms = staleReleaseAdEvidenceTerms(recordedEvidence);

  if (recordedEvidence.length > 0 && staleIdentityTerms.length > 0) {
    return staleReleaseIdentityEvidenceGate(id, label, staleIdentityTerms);
  }

  if (recordedEvidence.length > 0 && staleTerms.length > 0) {
    return staleReleaseAdEvidenceGate(id, label, staleTerms);
  }

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
    'Public support, privacy, and app-ads URLs',
    'Static pages/files exist locally, but no hosted HTTPS URL evidence is recorded.',
    'Host the static pages and app-ads file, verify public HTTPS access, and enter support/privacy URLs in both store records.',
    {
      requiredArtifactMissing:
        exists('publishing/public-site/support/index.html') &&
        exists('publishing/public-site/privacy/index.html') &&
        exists('publishing/public-site/app-ads.txt')
          ? null
          : 'Local static support/privacy/app-ads files are missing from publishing/public-site.',
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
    '--expect-app-ads-file',
    appAdsUrl,
    'publishing/public-site/app-ads.txt',
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

function removeAdsDeviceQaGate(manualEvidence) {
  const manualGate = evidenceGate(
    manualEvidence,
    'remove-ads-device-qa',
    'Remove Ads Android/iOS device QA',
    'No Android/iOS Remove Ads device QA evidence is recorded.',
    `Run Android and iOS EAS preview/TestFlight device QA, then record results in ${removeAdsDeviceQaPath} and linked ${removeAdsDeviceQaArtifactRoot} JSON artifacts.`,
  );

  if (manualEvidence.error) {
    return manualGate;
  }

  const reportErrors = exists(removeAdsDeviceQaPath)
    ? validateRemoveAdsDeviceQaReport(removeAdsDeviceQaPath)
    : [`${removeAdsDeviceQaPath} is missing`];
  if (reportErrors.length > 0) {
    return gate(
      manualGate.id,
      manualGate.label,
      'BLOCKED',
      `${manualGate.evidence}\nDevice QA report ${removeAdsDeviceQaPath} is incomplete: ${reportErrors.join(
        '; ',
      )}.`,
      `Run real Android and iOS EAS preview/TestFlight QA, then update ${removeAdsDeviceQaPath} and linked ${removeAdsDeviceQaArtifactRoot} JSON artifacts with passed checks and proof files.`,
    );
  }

  if (manualGate.status !== 'READY') {
    return manualGate;
  }

  return gate(
    manualGate.id,
    manualGate.label,
    'READY',
    `${manualGate.evidence}\nDevice QA report validation passed for ${removeAdsDeviceQaPath}.`,
    manualGate.nextAction,
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
      expoDoctor.ok ? expoDoctor.stdout : commandEvidence(expoDoctor),
      'Run `npm exec -- expo-doctor` and fix any Expo/native dependency findings.',
    ),
    gate(
      'web-export',
      'Web production export smoke',
      webExport.ok ? 'READY' : 'BLOCKED',
      webExport.ok ? webExport.stdout : commandEvidence(webExport),
      'Run `npm run release:web-export-smoke` and fix any Expo web export errors.',
    ),
    gate(
      'native-prebuild',
      'Android/iOS native prebuild smoke',
      nativePrebuild.ok ? 'READY' : 'BLOCKED',
      nativePrebuild.ok ? nativePrebuild.stdout : commandEvidence(nativePrebuild),
      'Run `npm run release:native-prebuild-smoke` and fix any Expo native prebuild warnings or errors.',
    ),
    gate(
      'eas-cli',
      'Pinned npx EAS CLI',
      easVersion.ok ? 'READY' : 'BLOCKED',
      easVersion.ok ? easVersion.stdout : commandEvidence(easVersion),
      'Run `npx --yes eas-cli@18.13.0 --version`.',
    ),
    gate(
      'eas-auth',
      'Expo/EAS authentication',
      easWhoami.ok ? 'READY' : 'BLOCKED',
      easWhoami.ok ? easWhoami.stdout : commandEvidence(easWhoami, 'Not logged in'),
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
    removeAdsDeviceQaGate(manualEvidence),
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
