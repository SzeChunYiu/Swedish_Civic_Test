const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const jsonMode = process.argv.includes('--json');
const runValidate = process.argv.includes('--run-validate');
const evidencePath = process.env.RELEASE_PREFLIGHT_EVIDENCE_PATH || 'reports/release-gates.json';

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

function buildReport() {
  const manualEvidence = loadManualEvidence();
  const validation = runValidate ? commandSucceeds('npm', ['run', 'validate']) : null;
  const easVersion = commandSucceeds('npm', ['exec', '--', 'eas', '--version']);
  const easWhoami = commandSucceeds('npm', ['exec', '--', 'eas', 'whoami']);

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
      'eas-cli',
      'Project-local EAS CLI',
      easVersion.ok ? 'READY' : 'BLOCKED',
      easVersion.ok ? easVersion.stdout : easVersion.stderr || easVersion.stdout,
      'Run `npm ci` and verify `npm exec -- eas --version`.',
    ),
    gate(
      'eas-auth',
      'Expo/EAS authentication',
      easWhoami.ok ? 'READY' : 'BLOCKED',
      easWhoami.ok ? easWhoami.stdout : easWhoami.stderr || easWhoami.stdout || 'Not logged in',
      'Log in to Expo/EAS or provide an approved Expo token, then rerun `npm exec -- eas whoami`.',
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
    ),
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
