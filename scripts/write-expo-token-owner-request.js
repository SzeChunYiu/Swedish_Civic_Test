#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const tokenName = 'EXPO_TOKEN';

function parseArgs(argv) {
  const parsed = { out: 'reports/expo-token-owner-request-latest.md', repo };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/write-expo-token-owner-request.js [--out reports/expo-token-owner-request-latest.md]',
    '',
    'Writes a non-secret Expo token owner request and current safe auth status for the release tracker.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function tableCell(value) {
  return String(value || '')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function parseSecretNames(output) {
  return new Set(
    String(output || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/)[0])
      .filter(Boolean),
  );
}

function run(command, options = {}) {
  const result = spawnSync(command[0], command.slice(1), {
    encoding: 'utf8',
    ...options,
  });
  return {
    command,
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function commandText(command) {
  return command.join(' ');
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
  }

  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const localEnvPresent = Boolean(String(process.env[tokenName] || '').trim());
  const keychain = run('security find-generic-password -s EXPO_TOKEN'.split(' '));
  const keychainPresent = keychain.status === 0;
  const secrets = run(['gh', 'secret', 'list', '--repo', args.repo]);
  const githubSecretPresent =
    secrets.status === 0 && parseSecretNames(secrets.stdout).has(tokenName);
  const eas = run(['npx', '--yes', 'eas-cli@18.13.0', 'whoami']);
  const easReady = eas.status === 0;
  const status = githubSecretPresent && easReady ? 'READY' : 'BLOCKED';

  const lines = [
    '# Expo token owner request',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${args.repo} |`,
    `| Required secret | ${tokenName} |`,
    `| Local ${tokenName} env | ${localEnvPresent ? 'present' : 'missing'} |`,
    `| macOS Keychain ${tokenName} | ${keychainPresent ? 'present' : 'missing'} |`,
    `| GitHub Actions ${tokenName} secret | ${githubSecretPresent ? 'present' : 'missing'} |`,
    `| EAS whoami | ${easReady ? 'ready' : 'blocked'} |`,
    '',
    '## Safe command evidence',
    '',
    '| Check | Command | Exit code | Non-secret output |',
    '|---|---|---:|---|',
    `| keychain presence | \`${commandText(keychain.command)}\` | ${keychain.status} | ${tableCell(keychain.stderr || keychain.stdout || '(no output)')} |`,
    `| repository secret presence | \`${commandText(secrets.command)}\` | ${secrets.status} | ${tableCell(secrets.stdout || secrets.stderr || '(no output)')} |`,
    `| EAS auth | \`${commandText(eas.command)}\` | ${eas.status} | ${tableCell(eas.stdout || eas.stderr || '(no output)')} |`,
    '',
    '## Request for the release owner',
    '',
    status === 'READY'
      ? 'No Expo token action is needed right now; the repository secret and EAS auth checks are ready.'
      : 'A valid Expo access token is still needed before the release can create EAS build artifacts.',
    '',
    'If you have the valid Expo token locally, use the safe local handoff path below. Do not paste the token into GitHub comments, logs, reports, or chat.',
    '',
    '```bash',
    'npm run release:store-expo-token-keychain -- --token-stdin --out reports/store-expo-token-keychain-latest.md',
    'npm run release:expo-token-bootstrap -- --out reports/expo-token-bootstrap-latest.md',
    'npm run release:external-loop-dispatch -- --out reports/external-loop-dispatch-latest.md',
    '```',
    '',
    'After the external loop runs, attach its GitHub Actions URL to issue #11 and continue with EAS build, device audio, store, privacy, screenshot, owner approval, and submission evidence.',
    '',
  ];

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, lines.join('\n'));
  process.stdout.write(`Expo token owner request ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
