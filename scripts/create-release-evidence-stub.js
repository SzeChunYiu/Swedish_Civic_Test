#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const supportUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const privacyPolicyUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/';
const bundleIdentifier = 'com.billyyiu.swedishcivictest';
const packageName = 'com.billyyiu.swedishcivictest';

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
  'store-records': {
    path: 'reports/store-records/store-records.json',
    content: {
      gate: 'store-records',
      status: 'blocked',
      bundleIdentifier,
      packageName,
      supportUrl,
      privacyPolicyUrl,
      appStoreConnectUrl: 'TBD',
      googlePlayConsoleUrl: 'TBD',
      supportUrlEnteredInApple: false,
      privacyPolicyUrlEnteredInApple: false,
      supportUrlEnteredInGooglePlay: false,
      privacyPolicyUrlEnteredInGooglePlay: false,
      listingMetadataReviewed: false,
      accountOwnershipReviewed: false,
      notes: 'Do not include account secrets or private credentials.',
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
      binaryBuildIdOrUrl: 'TBD',
      applePrivacyLabelsReviewed: false,
      googlePlayDataSafetyReviewed: false,
      googleMobileAdsSdkPostureReviewed: false,
      realAdsEnabledForV1: false,
      reviewer: 'TBD',
      checkedAtUtc: 'TBD',
      notes: 'Review against the generated binary before marking READY.',
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
