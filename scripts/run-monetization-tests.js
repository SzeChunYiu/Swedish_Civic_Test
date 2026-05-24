#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = process.env.TEST_MONETIZATION_RUNNER_REPO_ROOT || path.resolve(__dirname, '..');
const monetizationTestFiles = [
  'scripts/monetization.test.js',
  'tests/remove-ads-web-e2e-mock-runtime.test.js',
];

function dependencyIsInstalled(packageName) {
  try {
    require.resolve(packageName, { paths: [repoRoot] });
    return true;
  } catch {
    return false;
  }
}

function failMissingDependencies() {
  console.error('Install dependencies with npm ci before running monetization tests.');
  console.error(`Missing dependency: typescript (checked from ${repoRoot})`);
  process.exit(1);
}

function runMonetizationTests() {
  if (!dependencyIsInstalled('typescript')) {
    failMissingDependencies();
  }

  const command = process.env.TEST_MONETIZATION_RUNNER_NODE || process.execPath;
  const args = ['--test', ...process.argv.slice(2), ...monetizationTestFiles];
  const stdio = process.env.TEST_MONETIZATION_RUNNER_CAPTURE === '1' ? 'pipe' : 'inherit';
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio,
  });

  if (stdio === 'pipe') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(`Failed to run monetization tests: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal) {
    console.error(`Monetization tests were terminated by ${result.signal}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

runMonetizationTests();
