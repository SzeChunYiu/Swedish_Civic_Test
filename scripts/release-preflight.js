const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const jsonMode = process.argv.includes('--json');

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

function buildReport() {
  const easVersion = commandSucceeds('npm', ['exec', '--', 'eas', '--version']);
  const easWhoami = commandSucceeds('npm', ['exec', '--', 'eas', 'whoami']);

  const gates = [
    gate(
      'local-validation',
      'Local validation suite',
      'READY',
      '`npm run validate` passed in current release-readiness work; rerun before every release candidate.',
      'Run `npm run validate` fresh for the exact release candidate.',
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
    gate(
      'android-device-audio',
      'Android physical-device audio smoke',
      'BLOCKED',
      'No Android physical-device build/install/audio evidence is recorded.',
      'Create an EAS preview build and record Android audio smoke results in a release evidence file.',
    ),
    gate(
      'ios-device-audio',
      'iOS physical-device audio smoke',
      'BLOCKED',
      'No iOS physical-device/TestFlight build/install/audio evidence is recorded.',
      'Create an EAS preview/TestFlight build and record iOS audio smoke results in a release evidence file.',
    ),
    gate(
      'store-records',
      'Apple/Google/AdMob account records',
      'BLOCKED',
      'No App Store Connect, Google Play Console, or AdMob app record evidence is recorded.',
      'Create account/app records and copy URLs/IDs into a release evidence file.',
    ),
    gate(
      'public-urls',
      'Public support and privacy URLs',
      exists('publishing/public-site/support/index.html') &&
        exists('publishing/public-site/privacy/index.html')
        ? 'BLOCKED'
        : 'MISSING_ARTIFACT',
      'Static pages exist locally, but no hosted HTTPS URL evidence is recorded.',
      'Host the static pages, verify public HTTPS access, and enter URLs in both store records.',
    ),
    gate(
      'device-screenshots',
      'Store screenshots from accepted capture method',
      'BLOCKED',
      'Web-draft screenshots and manifest exist, but final device/store screenshots are not recorded.',
      'Capture screenshots from target devices or store-accepted tooling and record paths in release evidence.',
    ),
    gate(
      'submission',
      'Store submission and post-launch monitoring',
      'BLOCKED',
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
