#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const workflow = 'eas-preview-build.yml';
const requiredSecrets = ['EXPO_TOKEN'];

function parseArgs(argv) {
  const parsed = {
    out: 'reports/eas-preview-dispatch-latest.md',
    runBuild: 'false',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--run-build') parsed.runBuild = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['true', 'false'].includes(parsed.runBuild)) {
    throw new Error('--run-build must be true or false');
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/dispatch-eas-preview-workflow.js [--run-build false] [--out reports/eas-preview-dispatch-latest.md]',
    '',
    'Dispatches the manual EAS preview workflow only when required GitHub Actions secret names are present.',
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

function parseLatestRun(output) {
  try {
    const runs = JSON.parse(output || '[]');
    return Array.isArray(runs) && runs.length > 0 ? runs[0] : null;
  } catch {
    return null;
  }
}

function writeReport({
  outPath,
  targetRepo,
  status,
  runBuild,
  commandStatus,
  rows,
  latestRun,
  note,
}) {
  const lines = [
    '# EAS preview workflow dispatch',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Workflow | ${workflow} |`,
    `| Run build | ${runBuild} |`,
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

  lines.push('', '## Latest workflow run', '', '| Field | Value |', '|---|---|');
  if (latestRun) {
    lines.push(
      `| Database ID | ${tableCell(latestRun.databaseId)} |`,
      `| URL | ${tableCell(latestRun.url)} |`,
      `| Status | ${tableCell(latestRun.status)} |`,
      `| Head SHA | ${tableCell(latestRun.headSha)} |`,
      `| Created at | ${tableCell(latestRun.createdAt)} |`,
    );
  } else {
    lines.push('| Database ID | unavailable |', '| URL | unavailable |');
  }

  lines.push('', '## Interpretation', '', tableCell(note), '');

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
  const secretResult = spawnSync('gh', ['secret', 'list', '--repo', targetRepo], {
    encoding: 'utf8',
  });
  const names = secretResult.status === 0 ? parseSecretNames(secretResult.stdout) : new Set();
  const rows = requiredSecrets.map((name) => ({ name, present: names.has(name) }));
  const secretsReady = secretResult.status === 0 && rows.every((row) => row.present);

  if (!secretsReady) {
    writeReport({
      outPath: path.resolve(args.out),
      targetRepo,
      status: 'BLOCKED',
      runBuild: args.runBuild,
      commandStatus: secretResult.status ?? 1,
      rows,
      latestRun: null,
      note: 'Required GitHub Actions secret names are missing or `gh secret list` failed. Add `EXPO_TOKEN` before dispatching the manual EAS preview workflow.',
    });
    process.stdout.write(`EAS preview workflow dispatch BLOCKED; wrote ${args.out}\n`);
    process.exit(1);
  }

  const dispatchResult = spawnSync(
    'gh',
    ['workflow', 'run', workflow, '--repo', targetRepo, '-f', `run_build=${args.runBuild}`],
    { encoding: 'utf8' },
  );
  let latestRun = null;
  if (dispatchResult.status === 0) {
    const listResult = spawnSync(
      'gh',
      [
        'run',
        'list',
        '--workflow',
        workflow,
        '--repo',
        targetRepo,
        '--limit',
        '1',
        '--json',
        'databaseId,url,status,headSha,createdAt',
      ],
      { encoding: 'utf8' },
    );
    latestRun = listResult.status === 0 ? parseLatestRun(listResult.stdout) : null;
  }

  const status = dispatchResult.status === 0 ? 'DISPATCHED' : 'BLOCKED';
  writeReport({
    outPath: path.resolve(args.out),
    targetRepo,
    status,
    runBuild: args.runBuild,
    commandStatus: dispatchResult.status ?? 1,
    rows,
    latestRun,
    note:
      status === 'DISPATCHED'
        ? 'The manual EAS preview workflow was dispatched. Watch the linked GitHub Actions run and copy build/access evidence into the release tracker.'
        : 'GitHub Actions secret names are present, but workflow dispatch failed. Review GitHub CLI authentication and workflow permissions.',
  });

  process.stdout.write(`EAS preview workflow dispatch ${status}; wrote ${args.out}\n`);
  process.exit(status === 'DISPATCHED' ? 0 : 1);
}

main();
