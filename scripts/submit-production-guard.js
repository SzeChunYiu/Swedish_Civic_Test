#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const checkOnly = process.argv.includes('--check-only');
const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function isPlaceholder(value) {
  return (
    typeof value !== 'string' || value.trim().length === 0 || value.trim().toUpperCase() === 'TBD'
  );
}

function validateSubmitConfig() {
  const eas = readJson('eas.json');
  const production = eas.submit?.production || {};
  const ios = production.ios || {};
  const android = production.android || {};
  const blockers = [];

  for (const field of ['appleId', 'ascAppId', 'appleTeamId']) {
    if (isPlaceholder(ios[field])) {
      blockers.push(`eas.submit.production.ios.${field} is ${JSON.stringify(ios[field] ?? null)}`);
    }
  }

  if (isPlaceholder(android.serviceAccountKeyPath)) {
    blockers.push('eas.submit.production.android.serviceAccountKeyPath is missing');
  } else if (!fs.existsSync(path.join(repoRoot, android.serviceAccountKeyPath))) {
    blockers.push(
      `eas.submit.production.android.serviceAccountKeyPath does not exist: ${android.serviceAccountKeyPath}`,
    );
  }

  return blockers;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function releasePreflightArgs() {
  const args = ['scripts/release-preflight.js', '--json'];
  if (!checkOnly) args.push('--run-validate');
  return args;
}

function releasePreflightOptions() {
  if (!checkOnly) return {};
  return {
    env: {
      ...process.env,
      RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS: '1',
    },
  };
}

function validateReleasePreflight() {
  const preflight = run(process.execPath, releasePreflightArgs(), releasePreflightOptions());
  let report = null;
  try {
    report = JSON.parse(preflight.stdout || '{}');
  } catch (_error) {
    // Keep report null; output below includes raw command output.
  }

  if (preflight.status === 0 && report?.readyForSubmission === true) {
    return [];
  }

  if (report?.gates) {
    return report.gates
      .filter((gate) => gate.status !== 'READY')
      .map((gate) => `[${gate.status}] ${gate.id}: ${gate.evidence}`);
  }

  return [preflight.stderr || preflight.stdout || 'release preflight did not return JSON'];
}

function main() {
  const blockers = validateSubmitConfig();
  if (blockers.length > 0) {
    console.log('Production submit blocked: concrete store submit credentials are not ready.');
    for (const blocker of blockers) {
      console.log(`- ${blocker}`);
    }
    console.log(
      'Fill App Store Connect identifiers and the Google Play service-account file before submitting.',
    );
    process.exit(1);
  }

  const preflightBlockers = validateReleasePreflight();
  if (preflightBlockers.length > 0) {
    console.log('Production submit blocked: release preflight is not ready.');
    for (const blocker of preflightBlockers) {
      console.log(`- ${blocker}`);
    }
    console.log(
      'Run npm run release:preflight and clear every release gate before production submit.',
    );
    process.exit(1);
  }

  if (checkOnly) {
    console.log('Production submit config is ready.');
    return;
  }

  const result = run(
    'npx',
    ['--yes', 'eas-cli@18.13.0', 'submit', '--profile', 'production', '--platform', 'all'],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

main();
