#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const issueNumber = '11';

function parseArgs(argv) {
  const parsed = {
    out: 'reports/release-issue-comment-latest.md',
    bodyOut: 'reports/release-issue-update-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--body-out') parsed.bodyOut = argv[++index];
    else if (arg === '--preflight-json') parsed.preflightJson = argv[++index];
    else if (arg === '--merge') parsed.merge = argv[++index];
    else if (arg === '--run-validate') parsed.runValidate = true;
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--issue') parsed.issue = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/post-release-issue-update.js [--run-validate] [--merge <sha>]',
    '       [--body-out reports/release-issue-update-latest.md]',
    '       [--out reports/release-issue-comment-latest.md]',
    '',
    `Generates the issue #${issueNumber} release status update draft and posts it to ${repo}.`,
    'A BLOCKED release-preflight draft is still posted because it is useful tracker evidence.',
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

function commandText(command) {
  return command.map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(' ');
}

function writeReport({
  outPath,
  status,
  targetRepo,
  targetIssue,
  bodyOut,
  draftStatus,
  draftOutput,
  commentStatus,
  commentOutput,
  commentUrl,
}) {
  const lines = [
    '# Release issue update comment',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Issue | ${targetIssue} |`,
    `| Body file | ${tableCell(bodyOut)} |`,
    `| Draft command exit code | ${draftStatus} |`,
    `| Comment command exit code | ${commentStatus} |`,
    `| Issue comment URL | ${tableCell(commentUrl || '(none)')} |`,
    '',
    '## Non-secret command output',
    '',
    '| Command | Output |',
    '|---|---|',
    `| draft | ${tableCell(draftOutput || '(no output)')} |`,
    `| comment | ${tableCell(commentOutput || '(no output)')} |`,
    '',
    '## Interpretation',
    '',
    status === 'POSTED'
      ? 'The release status update was posted to the SzeChunYiu tracker issue.'
      : 'The release status update was not posted. Review GitHub CLI authentication, repository permissions, and command output.',
    '',
  ];

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
}

function buildDraftCommand(args) {
  const command = [
    process.execPath,
    'scripts/write-release-issue-update.js',
    '--out',
    args.bodyOut,
  ];
  if (args.preflightJson) command.push('--preflight-json', args.preflightJson);
  if (args.merge) command.push('--merge', args.merge);
  if (args.runValidate) command.push('--run-validate');
  return command;
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
  const targetIssue = args.issue || issueNumber;
  const bodyOut = path.resolve(args.bodyOut);
  const outPath = path.resolve(args.out);
  const draftCommand = buildDraftCommand({ ...args, bodyOut });
  const draftResult = spawnSync(draftCommand[0], draftCommand.slice(1), {
    encoding: 'utf8',
  });
  const draftOutput = draftResult.stderr || draftResult.stdout;
  const draftOk = fs.existsSync(bodyOut) && (draftResult.status === 0 || draftResult.status === 1);

  let commentStatus = 'not-run';
  let commentOutput = '(not run)';
  let commentUrl = '';

  if (draftOk) {
    const commentCommand = [
      'gh',
      'issue',
      'comment',
      targetIssue,
      '--repo',
      targetRepo,
      '--body-file',
      bodyOut,
    ];
    const commentResult = spawnSync(commentCommand[0], commentCommand.slice(1), {
      encoding: 'utf8',
    });
    commentStatus = commentResult.status ?? 1;
    commentOutput = commentResult.stderr || commentResult.stdout;
    commentUrl = commentResult.status === 0 ? String(commentResult.stdout || '').trim() : '';
  } else {
    commentOutput = `Draft command did not produce ${bodyOut}; not running gh issue comment. Command: ${commandText(
      draftCommand,
    )}`;
  }

  const status = commentStatus === 0 ? 'POSTED' : 'BLOCKED';
  writeReport({
    outPath,
    status,
    targetRepo,
    targetIssue,
    bodyOut,
    draftStatus: draftResult.status ?? 1,
    draftOutput,
    commentStatus,
    commentOutput,
    commentUrl,
  });

  process.stdout.write(`Release issue update comment ${status}; wrote ${args.out}\n`);
  process.exit(status === 'POSTED' ? 0 : 1);
}

main();
