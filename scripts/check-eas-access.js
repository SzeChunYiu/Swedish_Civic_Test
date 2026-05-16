#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const command = 'npx';
const commandArgs = ['--yes', 'eas-cli@18.13.0', 'whoami'];
const commandLabel = `${command} ${commandArgs.join(' ')}`;

function parseArgs(argv) {
  const parsed = {
    out: 'reports/eas-access-check-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/check-eas-access.js [--out reports/eas-access-check-latest.md]',
    '',
    'Runs the pinned EAS auth probe and writes a non-secret Markdown evidence report.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(1);
}

function sanitizeOutput(value) {
  let sanitized = String(value || '').trim() || '(no output)';
  if (process.env.EXPO_TOKEN) {
    sanitized = sanitized.split(process.env.EXPO_TOKEN).join('[REDACTED_EXPO_TOKEN]');
  }
  return sanitized;
}

function markdownTableValue(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function writeReport({ outPath, status, exitCode, output }) {
  const report = [
    '# EAS access check',
    '',
    '## Result',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Command | \`${commandLabel}\` |`,
    `| Exit code | ${exitCode} |`,
    `| EXPO_TOKEN_SET | ${process.env.EXPO_TOKEN ? 'yes' : 'no'} |`,
    `| Output | ${markdownTableValue(output)} |`,
    '',
    '## Interpretation',
    '',
    status === 'READY'
      ? 'EAS authentication is available for this environment. Continue with `npm run build:preview` and record build artifact evidence.'
      : 'EAS authentication is still blocked for this environment. Log in to Expo/EAS or provide an approved Expo token before preview builds.',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, report);
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

  const result = spawnSync(command, commandArgs, { encoding: 'utf8' });
  const output = sanitizeOutput(
    result.status === 0 ? result.stdout : result.stderr || result.stdout,
  );
  const exitCode = result.status ?? 1;
  const status = exitCode === 0 ? 'READY' : 'BLOCKED';

  writeReport({
    outPath: path.resolve(args.out),
    status,
    exitCode,
    output,
  });

  process.stdout.write(`EAS access check ${status}; wrote ${args.out}\n`);
  process.exit(exitCode);
}

main();
