#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const workflow = 'external-blocker-loop.yml';
const ref = 'main';

function parseArgs(argv) {
  const parsed = { out: 'reports/external-loop-dispatch-latest.md' };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--ref') parsed.ref = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/dispatch-external-blocker-loop.js [--out reports/external-loop-dispatch-latest.md]',
    '',
    'Dispatches the manual External release blocker loop workflow and records the GitHub Actions run URL.',
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

function parseLatestRun(output) {
  try {
    const runs = JSON.parse(output || '[]');
    return Array.isArray(runs) && runs.length > 0 ? runs[0] : null;
  } catch {
    return null;
  }
}

function writeReport({ outPath, targetRepo, targetRef, status, commandStatus, latestRun, note }) {
  const lines = [
    '# External blocker loop workflow dispatch',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Ref | ${targetRef} |`,
    `| Workflow | ${workflow} |`,
    `| Command exit code | ${commandStatus} |`,
    '',
    '## Latest workflow run',
    '',
    '| Field | Value |',
    '|---|---|',
  ];

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
  const targetRef = args.ref || ref;
  const dispatchResult = spawnSync(
    'gh',
    ['workflow', 'run', workflow, '--repo', targetRepo, '--ref', targetRef],
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
    targetRef,
    status,
    commandStatus: dispatchResult.status ?? 1,
    latestRun,
    note:
      status === 'DISPATCHED'
        ? 'The manual External release blocker loop workflow was dispatched. Watch the linked run and download the external-release-loop artifact.'
        : 'Workflow dispatch failed. Review GitHub CLI authentication, workflow availability, and repository permissions.',
  });

  process.stdout.write(`External blocker loop dispatch ${status}; wrote ${args.out}\n`);
  process.exit(status === 'DISPATCHED' ? 0 : 1);
}

main();
