const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const jsonMode = process.argv.includes('--json');
const runValidate = process.argv.includes('--run-validate');
const evidencePath = process.env.RELEASE_PREFLIGHT_EVIDENCE_PATH || 'reports/release-gates.json';
const publicUrls = process.env.RELEASE_PREFLIGHT_PUBLIC_URLS
  ? JSON.parse(process.env.RELEASE_PREFLIGHT_PUBLIC_URLS)
  : [
      'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/',
      'https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/',
    ];

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
  ],
  'device-screenshots': [
    ['screenshot evidence', /screenshot/i],
    ['device or accepted tooling evidence', /device|accepted|store/i],
    [
      'path, manifest, URL, or artifact reference',
      /manifest|path|reports\/|publishing\/|https?:\/\//i,
    ],
  ],
  submission: [
    ['TestFlight evidence', /TestFlight/i],
    ['Google Play internal evidence', /Google Play internal/i],
    ['production submission evidence', /production|submit|submission/i],
    ['monitoring evidence', /monitoring|post-launch/i],
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

function exists(path) {
  return fs.existsSync(path);
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
    const blockedTerms = blockedEvidencePatterns
      .filter(([pattern]) => pattern.test(recordedEvidence))
      .map(([, label]) => label);
    if (blockedTerms.length > 0) {
      return gate(
        id,
        label,
        'BLOCKED',
        `Gate ${id} is marked READY in ${evidencePath}, but evidence still contains blocker or placeholder language: ${blockedTerms.join(
          ', ',
        )}. Recorded evidence: ${recordedEvidence}`,
        `Replace placeholder/blocker wording with concrete evidence for ${id} in ${evidencePath}.`,
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
