#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const requiredSecrets = ['EXPO_TOKEN'];

function parseArgs(argv) {
  const parsed = {
    out: 'reports/github-release-secrets-latest.md',
  };

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
    'Usage: node scripts/check-github-release-secrets.js [--out reports/github-release-secrets-latest.md]',
    '',
    'Checks required GitHub Actions secret names without exposing values.',
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

function writeReport({ outPath, targetRepo, status, source, commandStatus, commandOutput, rows }) {
  const lines = [
    '# GitHub release secrets check',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Source | ${tableCell(source)} |`,
    `| Command | \`gh secret list --repo ${targetRepo}\` |`,
    `| Command exit code | ${commandStatus} |`,
    '',
    '## Required GitHub Actions secrets',
    '',
    '| Name | Presence |',
    '|---|---|',
  ];

  for (const row of rows) {
    lines.push(`| ${tableCell(row.name)} | ${row.present ? 'present' : 'missing'} |`);
  }

  lines.push(
    '',
    '## Non-secret command output',
    '',
    tableCell(commandOutput || '(no output)'),
    '',
    '## Interpretation',
    '',
    status === 'READY'
      ? 'Required GitHub Actions secret names are present. The manual EAS preview workflow can be dispatched for an auth/build check.'
      : 'At least one required GitHub Actions secret name is missing or `gh secret list` failed. Add the missing secret before dispatching the manual EAS preview workflow.',
    '',
  );

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

  const targetRepo = args.repo || repo;
  const runningInActions = process.env.GITHUB_ACTIONS === 'true';

  let result = { status: 0, stdout: '', stderr: '' };
  let source = 'gh secret list';
  let rows;

  if (runningInActions) {
    source = 'GitHub Actions injected environment';
    rows = requiredSecrets.map((name) => ({
      name,
      present: String(process.env[name] || '').trim().length > 0,
    }));
  } else {
    result = spawnSync('gh', ['secret', 'list', '--repo', targetRepo], { encoding: 'utf8' });
    const names = result.status === 0 ? parseSecretNames(result.stdout) : new Set();
    rows = requiredSecrets.map((name) => ({ name, present: names.has(name) }));
  }

  const output = runningInActions
    ? 'Checked injected GitHub Actions environment secret presence only; values are never printed.'
    : result.status === 0
      ? result.stdout
      : result.stderr || result.stdout;
  const status =
    (runningInActions || result.status === 0) && rows.every((row) => row.present)
      ? 'READY'
      : 'BLOCKED';

  writeReport({
    outPath: path.resolve(args.out),
    targetRepo,
    status,
    source,
    commandStatus: runningInActions ? 'not-run' : (result.status ?? 1),
    commandOutput: output,
    rows,
  });

  process.stdout.write(`GitHub release secrets check ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
