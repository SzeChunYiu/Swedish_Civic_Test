#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const defaultRepo = 'SzeChunYiu/Swedish_Civic_Test';
const defaultIssue = '11';

function parseArgs(argv) {
  const parsed = {
    bodyFile: 'reports/release-owner-action-packet-latest.md',
    out: 'reports/release-owner-action-packet-comment-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--body-file') parsed.bodyFile = argv[++index];
    else if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--issue') parsed.issue = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/post-release-owner-action-packet.js',
    '       [--body-file reports/release-owner-action-packet-latest.md]',
    '       [--out reports/release-owner-action-packet-comment-latest.md]',
    '',
    `Posts the generated release owner action packet to issue #${defaultIssue} in ${defaultRepo}.`,
    'The packet body is passed to gh by file path and is not echoed into the report.',
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

function writeReport({
  outPath,
  status,
  targetRepo,
  targetIssue,
  bodyFile,
  commentStatus,
  commentOutput,
  commentUrl,
}) {
  const lines = [
    '# Release owner action packet comment',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Issue | ${targetIssue} |`,
    `| Body file | ${tableCell(bodyFile)} |`,
    `| Comment command exit code | ${commentStatus} |`,
    `| Issue comment URL | ${tableCell(commentUrl || '(none)')} |`,
    '',
    '## Non-secret command output',
    '',
    '| Command | Output |',
    '|---|---|',
    `| comment | ${tableCell(commentOutput || '(no output)')} |`,
    '',
    '## Interpretation',
    '',
    status === 'POSTED'
      ? 'The release owner action packet was posted to the SzeChunYiu tracker issue.'
      : 'The release owner action packet was not posted. Review GitHub CLI authentication, repository permissions, body-file availability, and command output.',
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

  const targetRepo = args.repo || defaultRepo;
  const targetIssue = args.issue || defaultIssue;
  const bodyFile = path.resolve(args.bodyFile);
  const outPath = path.resolve(args.out);

  let commentStatus = 'not-run';
  let commentOutput = '(not run)';
  let commentUrl = '';

  if (fs.existsSync(bodyFile)) {
    const commentResult = spawnSync(
      'gh',
      ['issue', 'comment', targetIssue, '--repo', targetRepo, '--body-file', bodyFile],
      { encoding: 'utf8' },
    );
    commentStatus = commentResult.status ?? 1;
    commentOutput = commentResult.stderr || commentResult.stdout;
    commentUrl = commentResult.status === 0 ? String(commentResult.stdout || '').trim() : '';
  } else {
    commentStatus = 1;
    commentOutput = `Body file not found: ${bodyFile}`;
  }

  const status = commentStatus === 0 ? 'POSTED' : 'BLOCKED';
  writeReport({
    outPath,
    status,
    targetRepo,
    targetIssue,
    bodyFile,
    commentStatus,
    commentOutput,
    commentUrl,
  });

  process.stdout.write(`Release owner action packet comment ${status}; wrote ${args.out}\n`);
  process.exit(status === 'POSTED' ? 0 : 1);
}

main();
