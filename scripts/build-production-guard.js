#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const checkOnly = process.argv.includes('--check-only');

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

function main() {
  const preflight = run(process.execPath, releasePreflightArgs(), releasePreflightOptions());
  let report = null;
  try {
    report = JSON.parse(preflight.stdout || '{}');
  } catch (_error) {
    // Keep report null; output below includes raw command output.
  }

  if (preflight.status !== 0 || report?.readyForSubmission !== true) {
    console.log('Production build blocked: release preflight is not ready.');
    if (report?.gates) {
      for (const gate of report.gates.filter((item) => item.status !== 'READY')) {
        console.log(`- [${gate.status}] ${gate.id}: ${gate.evidence}`);
      }
    } else {
      console.log(preflight.stderr || preflight.stdout || 'release preflight did not return JSON');
    }
    console.log(
      'Run npm run release:preflight and clear every release gate before production builds.',
    );
    process.exit(1);
  }

  if (checkOnly) {
    console.log('Production build config is ready.');
    return;
  }

  const result = run(
    'npx',
    ['--yes', 'eas-cli@18.13.0', 'build', '--profile', 'production', '--platform', 'all'],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

main();
