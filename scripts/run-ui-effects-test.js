#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const forwardedArgs = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ['--test', ...forwardedArgs, 'scripts/ui-effects.test.js'],
  {
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
