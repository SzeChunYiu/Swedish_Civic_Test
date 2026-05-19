#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const trackerUrl = `https://github.com/${repo}/issues/11`;

const ownerActions = {
  'eas-auth': {
    ownerAction:
      'Provide an approved Expo token or log in to EAS for the SzeChunYiu release owner.',
    neededEvidence:
      'Successful `npx --yes eas-cli@18.13.0 whoami` output or configured GitHub `EXPO_TOKEN` secret.',
    recordAt: '`reports/eas-access-check-latest.md` and issue #11.',
    nextCommand: 'npm run release:expo-token-bootstrap',
  },
  'eas-build-artifacts': {
    ownerAction: 'Run Android and iOS EAS preview/internal builds after EAS auth is available.',
    neededEvidence:
      'Build IDs, Expo URLs, profiles, artifact types, commit, and readiness/install status.',
    recordAt: '`reports/eas-build-artifacts/eas-build-artifacts.json`.',
    nextCommand: 'npm run build:preview',
  },
  'android-device-audio': {
    ownerAction:
      'Install the Android build on a physical Android device and run the audio smoke checklist.',
    neededEvidence:
      'Device/OS, installed build, Swedish audio smoke result, and a non-secret proof artifact.',
    recordAt: '`reports/device-smoke/android.json`.',
    nextCommand:
      'npm run release:gate -- --gate android-device-audio --status READY --evidence-file reports/device-smoke/android.json',
  },
  'ios-device-audio': {
    ownerAction: 'Install the iOS/TestFlight build on an iPhone and run the audio smoke checklist.',
    neededEvidence:
      'Device/OS, TestFlight or installed build, Swedish audio smoke result, and a non-secret proof artifact.',
    recordAt: '`reports/device-smoke/ios.json`.',
    nextCommand:
      'npm run release:gate -- --gate ios-device-audio --status READY --evidence-file reports/device-smoke/ios.json',
  },
  'store-records': {
    ownerAction:
      'Create App Store Connect and Google Play Console app records under the SzeChunYiu-owned accounts.',
    neededEvidence:
      'App Store Connect URL, Google Play Console URL, bundle/package IDs, AdMob app readiness, Remove Ads IAP at 29 SEK, and support/privacy URLs entered in both stores.',
    recordAt: '`reports/store-records/store-records.json`.',
    nextCommand:
      'npm run release:gate -- --gate store-records --status READY --evidence-file reports/store-records/store-records.json',
  },
  'store-credentials': {
    ownerAction:
      'Verify non-secret App Store Connect submit identifiers and Google Play service-account submit access.',
    neededEvidence:
      'Apple team/app identifiers, Google service-account email, SHA256 key fingerprint, source, and check timestamp; no private keys or tokens.',
    recordAt: '`reports/store-credentials/store-credentials.json`.',
    nextCommand:
      'npm run release:gate -- --gate store-credentials --status READY --evidence-file reports/store-credentials/store-credentials.json',
  },
  'privacy-review': {
    ownerAction:
      'Review Apple privacy labels and Google Play Data safety against the generated binary/build.',
    neededEvidence:
      'Reviewed build ID/version/commit, Apple privacy labels, Google Play Data safety, Google Mobile Ads real-ad path, Remove Ads IAP at 29 SEK, ATT/UMP consent review, and analytics/crash SDK audit.',
    recordAt: '`reports/privacy-review/privacy-review.json`.',
    nextCommand:
      'npm run release:gate -- --gate privacy-review --status READY --evidence-file reports/privacy-review/privacy-review.json',
  },
  'release-owner-approval': {
    ownerAction: 'Record final release-owner approval after every pre-submission gate is READY.',
    neededEvidence:
      'Approver, approved commit, store-submission decision, no-known-blockers assertion, and checked gate list.',
    recordAt: '`reports/release-owner-approval/release-owner-approval.json`.',
    nextCommand:
      'npm run release:gate -- --gate release-owner-approval --status READY --evidence-file reports/release-owner-approval/release-owner-approval.json',
  },
  'device-screenshots': {
    ownerAction:
      'Capture final store screenshots from real devices, simulator/store tooling accepted by the platform, or another store-accepted method.',
    neededEvidence:
      'At least /home, /learn, /practice, /exam, and /profile with device, platform, capture method, source build, pixel dimensions, locale, files, and content review.',
    recordAt: '`reports/final-store-screenshots/manifest.json`.',
    nextCommand:
      'npm run release:gate -- --gate device-screenshots --status READY --evidence-file reports/final-store-screenshots/manifest.json',
  },
  submission: {
    ownerAction:
      'Submit to TestFlight/Google Play internal and then production after all gates are READY.',
    neededEvidence:
      'TestFlight build, Google Play internal track URL, iOS/Android production submission IDs/statuses, and first-week monitoring report.',
    recordAt: '`reports/submission/submission.json` and `reports/monitoring/v1-week1.md`.',
    nextCommand:
      'npm run release:gate -- --gate submission --status READY --evidence-file reports/submission/submission.json',
  },
};

function parseArgs(argv) {
  const parsed = {
    out: 'reports/release-owner-action-packet-latest.md',
    releaseGates: 'reports/release-gates.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--release-gates') parsed.releaseGates = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/write-release-owner-action-packet.js [--out reports/release-owner-action-packet-latest.md]',
    '   or: node scripts/write-release-owner-action-packet.js --release-gates <path> --out <path>',
    '',
    'Writes a non-secret owner handoff packet for the remaining external release/upload blockers.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function readReleaseGates(releaseGatesPath) {
  return JSON.parse(fs.readFileSync(releaseGatesPath, 'utf8')).gates || {};
}

function remainingActions(gates) {
  const blockedManualGates = Object.entries(gates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate);
  return ['eas-auth', ...blockedManualGates]
    .filter((gate, index, all) => all.indexOf(gate) === index)
    .map((gate) => ({ gate, ...ownerActions[gate] }))
    .filter((action) => action.ownerAction);
}

function tableCell(value) {
  return String(value || '')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function renderMarkdown(actions, releaseGatesPath) {
  const status = actions.length === 0 ? 'READY' : 'BLOCKED';
  const lines = [
    '# Release owner action packet',
    '',
    `Tracker: ${trackerUrl}`,
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Repository | ${repo} |`,
    `| Release gates source | ${releaseGatesPath} |`,
    `| Remaining owner actions | ${actions.length} |`,
    `| Generated at UTC | ${new Date().toISOString()} |`,
    '',
    '## Create local evidence templates',
    '',
    'Run this before filling non-secret external evidence files:',
    '',
    '```bash',
    'npm run release:evidence-stubs-all',
    '```',
    '',
    'The command creates missing blocked-gate JSON templates and skips existing owner drafts unless `-- --force` is supplied.',
    '',
    '## Owner actions needed before upload',
    '',
  ];

  if (actions.length === 0) {
    lines.push('No owner actions remain in `reports/release-gates.json`.', '');
  } else {
    lines.push(
      '| Gate | Owner action | Needed evidence | Where to record | Next command |',
      '|---|---|---|---|---|',
    );
    for (const action of actions) {
      lines.push(
        `| \`${tableCell(action.gate)}\` | ${tableCell(action.ownerAction)} | ${tableCell(
          action.neededEvidence,
        )} | ${tableCell(action.recordAt)} | \`${tableCell(action.nextCommand)}\` |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Safety notes',
    '',
    '- Do not paste private keys, Expo tokens, Apple API keys, or Google service-account JSON into this repo.',
    '- Record only non-secret IDs, URLs, fingerprints, timestamps, and reviewer notes.',
    '- Keep upload/submission targeted to `SzeChunYiu/Swedish_Civic_Test`; do not use legacy-owner or non-SzeChunYiu accounts/remotes.',
    '- After filling evidence, rerun `npm run release:preflight` and keep the gate BLOCKED if preflight rejects it.',
    '',
  );

  return { status, markdown: lines.join('\n') };
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

  const releaseGatesPath = path.resolve(args.releaseGates);
  const actions = remainingActions(readReleaseGates(releaseGatesPath));
  const { status, markdown } = renderMarkdown(actions, args.releaseGates);
  const outputPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  process.stdout.write(`Release owner action packet ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
