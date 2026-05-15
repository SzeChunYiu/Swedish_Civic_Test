#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const checkOnly = process.argv.includes('--check-only');

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function main() {
  const whoami = run('npx', ['--yes', 'eas-cli@18.13.0', 'whoami']);
  if (whoami.status !== 0) {
    console.log('Preview build blocked: Expo/EAS authentication is not ready.');
    console.log(whoami.stderr || whoami.stdout || 'Not logged in');
    console.log('Log in to Expo/EAS or provide an approved Expo token before preview builds.');
    process.exit(1);
  }

  if (checkOnly) {
    console.log(`Preview build config is ready for ${whoami.stdout.trim()}.`);
    return;
  }

  const result = run(
    'npx',
    ['--yes', 'eas-cli@18.13.0', 'build', '--profile', 'preview', '--platform', 'all'],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

main();
