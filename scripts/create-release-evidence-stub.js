#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const supportUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const privacyUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/';
const appAdsTxtUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/app-ads.txt';
const bundleIdentifier = 'com.billyyiu.almostswedish';
const packageName = 'com.billyyiu.almostswedish';
const adMobAppId = 'ca-app-pub-2451892671779738~8452000382';
const adMobAndroidAppId = 'ca-app-pub-2451892671779738~5027760693';
const appAdsTxtPublisherLine = 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0';

const deviceAudioCheckIds = [
  'sv-se-question-audio',
  'audio-button-state',
  'speech-engine-unavailable',
  'onboarding',
  'practice-answer-flow',
  'mock-exam-no-ads',
  'progress-restart',
  'privacy-legal-pages',
];

function deviceAudioTemplate(platform) {
  return {
    gate: `${platform}-device-audio`,
    status: 'pending',
    platform,
    device: 'pending-manual-device',
    sourceBuild: 'pending-eas-build-url-or-id',
    checks: deviceAudioCheckIds.map((id) => ({
      id,
      result: 'pending',
      notes: 'Manual device evidence required before this gate can be READY.',
    })),
    artifacts: [],
    tester: 'pending-manual-reviewer',
    checkedAtUtc: 'pending-manual-review',
    notes:
      'Keep this stub pending until a real device run records passed checks and proof artifacts.',
  };
}

const templates = {
  'eas-build-artifacts': {
    path: 'reports/eas-build-artifacts/eas-build-artifacts.json',
    content: {
      gate: 'eas-build-artifacts',
      status: 'blocked',
      appVersion: '1.0.0',
      gitCommit: 'pending-release-commit',
      android: {
        profile: 'preview',
        buildId: 'pending-eas-android-build-id',
        buildUrl: 'pending-eas-android-build-url',
        artifactType: 'apk',
        installOrTestStatus: 'pending-manual-evidence',
      },
      ios: {
        profile: 'preview',
        buildId: 'pending-eas-ios-build-id',
        buildUrl: 'pending-eas-ios-build-url',
        artifactType: 'ipa',
        installOrTestStatus: 'pending-manual-evidence',
      },
      notes: 'Record only non-secret build IDs, URLs, profiles, and readiness states.',
    },
  },
  'android-device-audio': {
    path: 'reports/device-smoke/android.json',
    content: deviceAudioTemplate('android'),
  },
  'ios-device-audio': {
    path: 'reports/device-smoke/ios.json',
    content: deviceAudioTemplate('ios'),
  },
  'store-records': {
    path: 'reports/store-records/store-records.json',
    content: {
      gate: 'store-records',
      status: 'blocked',
      bundleIdentifier,
      packageName,
      supportUrl,
      privacyUrl,
      appStoreConnectUrl: 'pending-app-store-connect-url',
      googlePlayConsoleUrl: 'pending-google-play-console-url',
      accountOwnership: {
        appleDeveloperTeamId: 'pending-team-id',
        appleBundleIdReviewed: false,
        googlePlayDeveloperId: 'pending-developer-id',
        googlePackageNameReviewed: false,
      },
      adMob: {
        status: 'created',
        appId: adMobAppId,
        iosAppId: adMobAppId,
        androidAppId: adMobAndroidAppId,
        realAdsEnabled: true,
        appAdsTxtUrl,
        appAdsTxtPublisherLine,
        appAdsTxtReviewed: false,
        note: 'AdMob app IDs exist for the ad-supported v1.0 release; review app-ads.txt before marking READY.',
      },
      listingMetadata: {
        appStoreListingReviewed: false,
        appStoreListingPath: 'publishing/app-store-listing.md',
        googlePlayListingReviewed: false,
        googlePlayListingPath: 'publishing/google-play-listing.md',
        matchesStoreRecords: false,
      },
      notes:
        'Blocked until Apple/Google store records, account ownership, listing metadata, and app-ads.txt review are completed. Do not include account secrets or private credentials.',
    },
  },
  'store-credentials': {
    path: 'reports/store-credentials/store-credentials.json',
    content: {
      gate: 'store-credentials',
      status: 'blocked',
      ios: {
        appleId: 'pending-apple-id-email',
        ascAppId: 'pending-app-store-connect-app-id',
        appleTeamId: 'pending-team-id',
        credentialsSource: 'pending-secure-source-outside-git',
        credentialsCheckedAt: 'pending-manual-review',
      },
      android: {
        serviceAccountEmail: 'pending-service-account@project.iam.gserviceaccount.com',
        serviceAccountKeyFingerprint: 'pending-sha256-fingerprint',
        packageName,
        credentialsSource: 'pending-secure-source-outside-git',
        credentialsCheckedAt: 'pending-manual-review',
      },
      notes: 'Record non-secret metadata only; never commit private keys or tokens.',
    },
  },
  'store-policy-questionnaires': {
    path: 'reports/store-policy-questionnaires/store-policy-questionnaires.json',
    content: {
      gate: 'store-policy-questionnaires',
      status: 'pending-review',
      reviewedAt: 'pending-manual-review',
      reviewer: 'pending-reviewer',
      evidenceBasis: [
        'publishing/app-store-listing.md',
        'publishing/google-play-listing.md',
        'publishing/admob-progress.md',
        'publishing/privacy-labels.md',
        'publishing/google-play-data-safety.md',
        'reports/store-records/store-records.json',
      ],
      apple: {
        ageRatingReviewed: false,
        exportComplianceReviewed: false,
        contentRightsReviewed: false,
        noOfficialAffiliationClaims: false,
        usesNonExemptEncryption: false,
      },
      google: {
        contentRatingReviewed: false,
        targetAudienceReviewed: false,
        adsDeclarationReviewed: false,
        containsRealMoneyGambling: false,
        noGovernmentAffiliationClaims: false,
        notes:
          'Review Google Mobile Ads ads declaration, ATT/UMP consent disclosures, and Remove Ads IAP questionnaire before marking READY.',
      },
      remainingCaveat:
        'This is a pending local questionnaire stub. Final console submission still depends on store records, credentials, generated builds, privacy review, owner approval, screenshots, and submission gates.',
    },
  },
  'privacy-review': {
    path: 'reports/privacy-review/privacy-review.json',
    content: {
      gate: 'privacy-review',
      status: 'blocked',
      reviewedAt: 'pending-manual-review',
      reviewer: 'pending-reviewer',
      reviewedBuild: {
        id: 'pending-eas-build-id-or-url',
        version: '1.0.0',
        commit: 'pending-release-commit',
      },
      storeQuestionnaires: {
        appleAppStoreConnectReviewed: false,
        googlePlayConsoleReviewed: false,
      },
      applePrivacyLabels: {
        reviewed: false,
        path: 'publishing/privacy-labels.md',
        matchesBinary: false,
      },
      googlePlayDataSafety: {
        reviewed: false,
        path: 'publishing/google-play-data-safety.md',
        matchesBinary: false,
      },
      googleMobileAds: {
        sdkPresent: true,
        testAppIds: true,
        realAdsEnabled: true,
        removeAdsIapReviewed: false,
        consentFlowReviewed: false,
        gate: 'EXPO_PUBLIC_REAL_ADS_ENABLED=true; Google Mobile Ads real-ad path; Remove Ads non-consumable in-app purchase at 29 SEK; ATT and UMP consent review required.',
      },
      disabledSdks: {
        analytics: true,
        crashReporting: true,
      },
      notes:
        'Blocked until a generated binary is reviewed against Apple privacy labels, Google Play Data safety, Google Mobile Ads, ATT/UMP consent, and the 29 SEK Remove Ads IAP. Do not mark READY with placeholder evidence.',
    },
  },
  'release-owner-approval': {
    path: 'reports/release-owner-approval/release-owner-approval.json',
    content: {
      gate: 'release-owner-approval',
      status: 'blocked',
      approvedAt: 'pending-owner-approval',
      approver: 'pending-release-owner',
      approvedCommit: 'pending-release-commit',
      releaseDecision: 'pending-owner-decision',
      noKnownBlockers: false,
      evidenceReport: 'reports/release-evidence-2026-05-15.md',
      checkedGates: [],
      notes:
        'Release owner approval must stay blocked until all build, device, store, policy, privacy, URL, and screenshot gates are READY.',
    },
  },
  'device-screenshots': {
    path: 'reports/final-store-screenshots/manifest.json',
    content: {
      gate: 'device-screenshots',
      status: 'blocked',
      screenshotStatus: 'pending-final-device-or-accepted-store-tooling',
      contentReview: {
        noOfficialAffiliationClaims: false,
        noGuaranteedExamResultClaims: false,
        mockExamShowsNoAds: false,
        noTestAdBanners: false,
        privacyAndSourcePagesMatchPublishingDocs: false,
      },
      screenshots: [],
      notes:
        'Keep blocked until at least five final iOS/Android screenshots from target devices or store-accepted tooling are recorded.',
    },
  },
  submission: {
    path: 'reports/submission/submission.json',
    content: {
      gate: 'submission',
      status: 'blocked',
      testFlightBuild: {
        buildNumber: 'pending-testflight-build-number',
        processingStatus: 'pending',
        betaReviewStatus: 'pending',
        url: 'pending-app-store-connect-testflight-url',
      },
      googlePlayInternal: {
        trackUrl: 'pending-google-play-internal-track-url',
        versionCode: 0,
        testerGroup: 'pending-tester-group',
      },
      productionSubmissions: [
        {
          platform: 'ios',
          submissionId: 'pending-ios-production-submission-id',
          reviewStatus: 'pending',
        },
        {
          platform: 'android',
          submissionId: 'pending-android-production-submission-id',
          reviewStatus: 'pending',
        },
      ],
      monitoringReport: 'reports/monitoring/v1-week1.md',
      notes: 'Submit only after every pre-submission gate is READY.',
    },
  },
};

function parseArgs(argv) {
  const parsed = {
    root: process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') parsed.root = argv[++index];
    else if (arg === '--gate') parsed.gate = argv[++index];
    else if (arg === '--all') parsed.all = true;
    else if (arg === '--force') parsed.force = true;
    else if (arg === '--list') parsed.list = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/create-release-evidence-stub.js --gate <gate> [--root <repo>] [--force]',
    '   or: node scripts/create-release-evidence-stub.js --all [--root <repo>] [--force]',
    '   or: node scripts/create-release-evidence-stub.js --list',
    '',
    `Known gates: ${Object.keys(templates).join(', ')}`,
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(1);
}

function blockedManualGates(root) {
  const gatesPath = path.join(root, 'reports/release-gates.json');
  if (!fs.existsSync(gatesPath)) return Object.keys(templates);

  const gates = JSON.parse(fs.readFileSync(gatesPath, 'utf8')).gates || {};
  return Object.entries(gates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
  }

  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (args.list) {
    const rows = blockedManualGates(args.root)
      .filter((gate) => templates[gate])
      .map((gate) => ({
        gate,
        path: templates[gate].path,
        status: templates[gate].content.status,
      }));
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }

  if (args.all) {
    const gates = blockedManualGates(args.root).filter((gate) => templates[gate]);
    for (const gate of gates) {
      const template = templates[gate];
      const outputPath = path.join(args.root, template.path);
      if (fs.existsSync(outputPath) && !args.force) {
        process.stdout.write(`Skipped ${gate} evidence stub at ${outputPath}; already exists\n`);
        continue;
      }

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${JSON.stringify(template.content, null, 2)}\n`);
      process.stdout.write(`Created ${gate} evidence stub at ${outputPath}\n`);
    }
    return;
  }

  if (!args.gate) fail('Missing --gate.');
  const template = templates[args.gate];
  if (!template) fail(`Unknown gate: ${args.gate}`);

  const outputPath = path.join(args.root, template.path);
  if (fs.existsSync(outputPath) && !args.force) {
    fail(`Evidence stub already exists: ${outputPath}. Use --force to overwrite.`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(template.content, null, 2)}\n`);
  process.stdout.write(`Created ${args.gate} evidence stub at ${outputPath}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  blockedManualGates,
  templates,
};
