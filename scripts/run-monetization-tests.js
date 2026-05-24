#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const monetizationTestFiles = [
  'scripts/monetization.test.js',
  'tests/remove-ads-web-e2e-mock-runtime.test.js',
  'tests/monetization-storage-harness.test.js',
];

const forwardedArgs = process.argv.slice(2);
const command = process.env.TEST_DISPATCH_NODE || process.execPath;
const stdio = process.env.TEST_DISPATCH_CAPTURE === '1' ? 'pipe' : 'inherit';
const result = spawnSync(command, ['--test', ...forwardedArgs, ...monetizationTestFiles], {
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
  console.error(`monetization tests terminated by ${result.signal}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
