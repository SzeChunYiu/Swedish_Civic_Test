#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const envName = 'EXPO_TOKEN';

function parseArgs(argv) {
  const parsed = {
    out: 'reports/store-expo-token-keychain-latest.md',
    service: envName,
    env: envName,
    tokenStdin: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--service') parsed.service = argv[++index];
    else if (arg === '--env') parsed.env = argv[++index];
    else if (arg === '--account') parsed.account = argv[++index];
    else if (arg === '--token-stdin') parsed.tokenStdin = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/store-expo-token-keychain.js [--token-stdin] [--out reports/store-expo-token-keychain-latest.md]',
    '',
    'Stores a local Expo access token in macOS Keychain service EXPO_TOKEN without printing the value.',
    'Use --token-stdin to paste/read the token without putting it in shell history:',
    '  printf \'%s\' "$EXPO_TOKEN" | npm run release:store-expo-token-keychain -- --token-stdin',
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

function redact(value, secretValue) {
  let text = String(value || '');
  if (secretValue) {
    text = text.split(secretValue).join('[REDACTED_EXPO_TOKEN]');
  }
  return text.replace(/expo_[A-Za-z0-9_-]{10,}/g, '[REDACTED_EXPO_TOKEN]');
}

function readToken({ tokenStdin, sourceEnv }) {
  if (tokenStdin) {
    return { value: String(fs.readFileSync(0, 'utf8') || '').trim(), source: 'stdin' };
  }

  const envValue = String(process.env[sourceEnv] || '').trim();
  if (envValue) {
    return { value: envValue, source: `environment variable ${sourceEnv}` };
  }

  return { value: '', source: 'none' };
}

function defaultAccount() {
  try {
    return os.userInfo().username || process.env.USER || 'expo';
  } catch {
    return process.env.USER || 'expo';
  }
}

function writeReport({
  outPath,
  status,
  service,
  account,
  tokenSource,
  tokenPresent,
  commandText,
  commandStatus,
  commandOutput,
  note,
  secretValue,
}) {
  const lines = [
    '# Expo token Keychain storage',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Keychain service | ${tableCell(service)} |`,
    `| Keychain account | ${tableCell(account)} |`,
    `| Token source | ${tableCell(tokenSource)} |`,
    `| Local token present | ${tokenPresent ? 'yes' : 'no'} |`,
    `| Command | \`${tableCell(commandText || 'not-run')}\` |`,
    `| Command exit code | ${commandStatus} |`,
    '',
    '## Non-secret command output',
    '',
    tableCell(redact(commandOutput || '(no output)', secretValue)),
    '',
    '## Interpretation',
    '',
    tableCell(note),
    '',
  ];

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
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

  const token = readToken({ tokenStdin: args.tokenStdin, sourceEnv: args.env });
  const account = args.account || defaultAccount();
  const outPath = path.resolve(args.out);

  if (!token.value) {
    writeReport({
      outPath,
      status: 'BLOCKED',
      service: args.service,
      account,
      tokenSource: token.source,
      tokenPresent: false,
      commandText: 'not-run',
      commandStatus: 'not-run',
      commandOutput: '(not run)',
      note: args.tokenStdin
        ? 'No token was received on stdin. Paste a valid Expo access token into stdin and rerun this command.'
        : `Environment variable ${args.env} is empty. Export ${args.env} or rerun with --token-stdin.`,
      secretValue: token.value,
    });
    process.stdout.write(`Expo token Keychain storage BLOCKED; wrote ${args.out}\n`);
    process.exit(1);
  }

  const command = [
    'security',
    'add-generic-password',
    '-U',
    '-a',
    account,
    '-s',
    args.service,
    '-w',
    token.value,
  ];
  const safeCommandText = `security add-generic-password -U -a ${account} -s ${args.service} -w [REDACTED_EXPO_TOKEN]`;
  const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' });
  const status = result.status === 0 ? 'READY' : 'BLOCKED';

  writeReport({
    outPath,
    status,
    service: args.service,
    account,
    tokenSource: token.source,
    tokenPresent: true,
    commandText: safeCommandText,
    commandStatus: result.status ?? 1,
    commandOutput: result.stderr || result.stdout,
    note:
      status === 'READY'
        ? `Expo token was stored in macOS Keychain service ${args.service}. Rerun release:expo-token-bootstrap to set the GitHub Actions secret and dispatch the external blocker loop.`
        : 'The macOS Keychain command failed. Review local Keychain access, security CLI availability, and command output above.',
    secretValue: token.value,
  });

  process.stdout.write(`Expo token Keychain storage ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
