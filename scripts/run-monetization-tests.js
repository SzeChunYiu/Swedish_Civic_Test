#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = process.env.MONETIZATION_TEST_REPO_ROOT || path.resolve(__dirname, '..');
const selectedTestFiles = [
  'scripts/monetization.test.js',
  'tests/remove-ads-web-e2e-mock-runtime.test.js',
];

function resolveRequiredDependency(name) {
  try {
    return require.resolve(name, { paths: [repoRoot] });
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') return null;
    throw error;
  }
}

function preflightDependencies() {
  const missingDependencies = ['typescript'].filter(
    (dependencyName) => resolveRequiredDependency(dependencyName) === null,
  );

  if (missingDependencies.length > 0) {
    console.error(
      [
        'Cannot run monetization tests because required dependencies are missing.',
        'Install dependencies with npm ci before running monetization tests.',
        `Missing: ${missingDependencies.join(', ')}`,
      ].join('\n'),
    );
    process.exit(1);
  }
}

function runMonetizationTests(forwardedArgs) {
  const command = process.env.TEST_MONETIZATION_RUNNER_NODE || process.execPath;
  const args = ['--test', ...forwardedArgs, ...selectedTestFiles];
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

preflightDependencies();
runMonetizationTests(process.argv.slice(2));
