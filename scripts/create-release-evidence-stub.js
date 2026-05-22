#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const publicUrls = require('../config/publicUrls.json');

const supportUrl = publicUrls.support;
const privacyUrl = publicUrls.privacy;
const appAdsTxtUrl = publicUrls.appAdsTxt;
const appAdsTxtPublisherLine = 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0';
const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')).expo;
const bundleIdentifier = appConfig.ios.bundleIdentifier;
const packageName = appConfig.android.package;

const templates = {
  'eas-build-artifacts': {
    path: 'reports/eas-build-artifacts/eas-build-artifacts.json',
    content: {
      gate: 'eas-build-artifacts',
      status: 'blocked',
      appVersion: '1.0.0',
      gitCommit: 'TBD',
      android: {
        profile: 'preview',
        buildId: 'TBD',
        buildUrl: 'TBD',
        artifactType: 'apk',
        installOrTestStatus: 'TBD',
      },
      ios: {
        profile: 'preview',
        buildId: 'TBD',
        buildUrl: 'TBD',
        artifactType: 'ipa',
        installOrTestStatus: 'TBD',
      },
      notes: 'Record only non-secret build IDs, URLs, profiles, and readiness states.',
    },
  },
  'android-device-audio': {
    path: 'reports/device-smoke/android.json',
    content: {
      gate: 'android-device-audio',
      status: 'blocked',
      platform: 'android',
      device: 'TBD',
      osVersion: 'TBD',
      buildIdOrUrl: 'TBD',
      installedBuild: false,
      swedishAudioSmoke: 'TBD',
      proofArtifact: 'TBD',
      tester: 'TBD',
      checkedAtUtc: 'TBD',
    },
  },
  'ios-device-audio': {
    path: 'reports/device-smoke/ios.json',
    content: {
      gate: 'ios-device-audio',
      status: 'blocked',
      platform: 'ios',
      device: 'TBD',
      osVersion: 'TBD',
      buildIdOrTestFlightUrl: 'TBD',
      installedBuild: false,
      swedishAudioSmoke: 'TBD',
      proofArtifact: 'TBD',
      tester: 'TBD',
      checkedAtUtc: 'TBD',
    },
  },
  'remove-ads-device-qa': {
    path: 'reports/release-ads-iap-device-qa.md',
    status: 'blocked',
    content: [
      '# Release Ads/IAP Device QA',
      '',
      '## Required Evidence',
      '',
      '- Android EAS preview build installed on a physical Android device.',
      '- iOS EAS preview/TestFlight build installed on an iPhone.',
      '- AdMob test ads render on study screens before purchase.',
      '- Remove Ads purchase disables ads.',
      '- Remove Ads entitlement persists after relaunch.',
      '- Restore purchase restores entitlement.',
      '- ATT prompt/status exercised and recorded.',
      '- UMP consent prompt/status exercised and recorded.',
      '- No ad renders on mock exam screens.',
      '',
      '## Platform Artifacts',
      '',
      '- iOS artifact: `reports/release-device-qa/ios.json`',
      '- Android artifact: `reports/release-device-qa/android.json`',
      '',
      'Keep this gate BLOCKED until both linked JSON artifacts have status `passed`, real device/build metadata, reviewer/timestamp, all required checks passed, and proof screenshot/log references.',
      '',
    ].join('\n'),
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
      appStoreConnectUrl: 'TBD',
      googlePlayConsoleUrl: 'TBD',
      accountOwnership: {
        appleDeveloperTeamId: 'TBD',
        appleBundleIdReviewed: false,
        googlePlayDeveloperId: 'TBD',
        googlePackageNameReviewed: false,
      },
      adMob: {
        status: 'created',
        appId: 'ca-app-pub-2451892671779738~8452000382',
        iosAppId: 'ca-app-pub-2451892671779738~8452000382',
        androidAppId: 'ca-app-pub-2451892671779738~5027760693',
        realAdsEnabled: true,
        appAdsTxtUrl,
        appAdsTxtPublisherLine,
        appAdsTxtReviewed: false,
        note: 'AdMob app IDs exist for the ad-supported v1.0 release; review app-ads.txt and store records before marking READY.',
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
      appStoreConnect: {
        issuerOrTeamId: 'TBD_NON_SECRET_IDENTIFIER',
        submitAccessVerified: false,
      },
      googlePlay: {
        serviceAccountEmail: 'TBD_NON_SECRET_EMAIL',
        keyFingerprint: 'TBD_NON_SECRET_FINGERPRINT',
        submitAccessVerified: false,
      },
      notes: 'Record non-secret metadata only; never commit private keys or tokens.',
    },
  },
  'store-policy-questionnaires': {
    path: 'reports/store-policy-questionnaires/store-policy-questionnaires.json',
    content: {
      gate: 'store-policy-questionnaires',
      status: 'blocked',
      apple: {
        ageRatingReviewed: false,
        exportComplianceReviewed: false,
        contentRightsReviewed: false,
        noOfficialGovernmentAffiliationReviewed: false,
      },
      googlePlay: {
        contentRatingReviewed: false,
        targetAudienceReviewed: false,
        adsDeclarationReviewed: false,
        gamblingDeclarationReviewed: false,
        governmentAffiliationReviewed: false,
      },
      reviewer: 'TBD',
      checkedAtUtc: 'TBD',
    },
  },
  'privacy-review': {
    path: 'reports/privacy-review/privacy-review.json',
    content: {
      gate: 'privacy-review',
      status: 'blocked',
      reviewedAt: 'TBD',
      reviewer: 'TBD',
      reviewedBuild: {
        id: 'TBD',
        version: '1.0.0',
        commit: 'TBD',
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
      approved: false,
      approver: 'TBD',
      approvedCommit: 'TBD',
      approvedForStoreSubmission: false,
      noKnownBlockersAssertion: false,
      checkedAtUtc: 'TBD',
    },
  },
  'device-screenshots': {
    path: 'reports/final-store-screenshots/manifest.json',
    content: {
      gate: 'device-screenshots',
      status: 'blocked',
      screenshotStatus: 'TBD_FINAL_DEVICE_OR_ACCEPTED_STORE_TOOLING',
      contentReview: {
        noOfficialAffiliationClaims: false,
        noGuaranteedExamResultClaims: false,
        mockExamShowsNoAds: false,
        noTestAdBanners: false,
        privacyAndSourcePagesMatchPublishingDocs: false,
      },
      screenshots: [],
    },
  },
  submission: {
    path: 'reports/submission/submission.json',
    content: {
      gate: 'submission',
      status: 'blocked',
      testFlightBuild: 'TBD',
      googlePlayInternalTrackUrl: 'TBD',
      iosProductionSubmissionId: 'TBD',
      androidProductionSubmissionId: 'TBD',
      monitoringReportPath: 'reports/monitoring/v1-week1.md',
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

function templateBody(template) {
  if (typeof template.content === 'string') return template.content;
  return `${JSON.stringify(template.content, null, 2)}\n`;
}

function templateStatus(template) {
  return template.status || template.content.status;
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
        status: templateStatus(templates[gate]),
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
      fs.writeFileSync(outputPath, templateBody(template));
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
  fs.writeFileSync(outputPath, templateBody(template));
  process.stdout.write(`Created ${args.gate} evidence stub at ${outputPath}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  blockedManualGates,
  templateBody,
  templateStatus,
  templates,
};
