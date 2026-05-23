#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const monetizationTestFiles = [
  'scripts/monetization.test.js',
  'tests/remove-ads-web-e2e-mock-runtime.test.js',
  'tests/monetization-storage-harness.test.js',
];

const forwardedArgs = process.argv.slice(2);
const result = spawnSync(process.execPath, ['--test', ...forwardedArgs, ...monetizationTestFiles], {
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Failed to run monetization tests: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`Monetization tests were terminated by ${result.signal}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
