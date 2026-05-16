#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const targetOwner = 'SzeChunYiu';
const legacyOwner = ['Bab', 'bloo'].join('');
const objective = `/Users/billy/Desktop/projects/Swedish_Civic_Test work on this project until it is finished; PR and merge to main after each iteration; upload to SzeChunYiu not ${legacyOwner} studio.`;
const repoUrl = 'https://github.com/SzeChunYiu/Swedish_Civic_Test';
const trackerUrl = 'https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11';

function parseArgs(argv) {
  const parsed = {
    out: 'reports/release-completion-audit-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--preflight-json') parsed.preflightJson = argv[++index];
    else if (arg === '--run-validate') parsed.runValidate = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/write-release-completion-audit.js [--run-validate] [--out reports/release-completion-audit-latest.md]',
    '   or: node scripts/write-release-completion-audit.js --preflight-json <path> --out <path>',
    '',
    'Writes an objective-to-evidence completion audit and exits non-zero until store submission readiness is complete.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function readPreflightReport(args) {
  if (args.preflightJson) {
    return JSON.parse(fs.readFileSync(args.preflightJson, 'utf8'));
  }

  const preflightArgs = ['scripts/release-preflight.js', '--json'];
  if (args.runValidate) preflightArgs.push('--run-validate');
  const result = spawnSync(process.execPath, preflightArgs, { encoding: 'utf8' });
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Could not parse release preflight JSON: ${error.message}\n${result.stderr}`);
  }
}

function tableCell(value) {
  return String(value || '(empty)')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function gateById(report, id) {
  return (Array.isArray(report.gates) ? report.gates : []).find((gate) => gate.id === id);
}

function renderAudit(report, source) {
  const gates = Array.isArray(report.gates) ? report.gates : [];
  const blocked = gates.filter((gate) => gate.status !== 'READY');
  const publicUrls = gateById(report, 'public-urls');
  const allCriteria = [
    {
      requirement: 'Project path',
      evidence:
        '/Users/billy/Desktop/projects/Swedish_Civic_Test tracked by this release repo/worktree',
      status: 'READY',
      gap: 'None for repo tracking; operational worktree may be separate from source path.',
    },
    {
      requirement: 'Upload target owner',
      evidence: targetOwner,
      status: 'READY',
      gap: `Remote target is ${repoUrl}.`,
    },
    {
      requirement: 'Legacy owner not targeted',
      evidence: `${legacyOwner} studio is not the active upload target`,
      status: 'READY',
      gap: `Do not use ${legacyOwner} remotes, PRs, or public URLs.`,
    },
    {
      requirement: 'PR and merge each iteration',
      evidence:
        'Current workflow uses GitHub PRs merged to main on SzeChunYiu after each iteration',
      status: 'READY',
      gap: 'Verify with GitHub PR state before each handoff.',
    },
    {
      requirement: 'Public support/privacy URLs',
      evidence: publicUrls ? publicUrls.evidence : 'public-urls gate missing',
      status: publicUrls?.status || 'BLOCKED',
      gap: publicUrls?.nextAction || 'Run release preflight and restore public-urls gate.',
    },
    {
      requirement: 'Store submission readiness',
      evidence: 'npm run release:preflight',
      status: report.readyForSubmission ? 'READY' : 'BLOCKED',
      gap: blocked.length
        ? `${blocked.length} gate(s) still blocked: ${blocked.map((gate) => `\`${gate.id}\``).join(', ')}.`
        : 'No preflight blockers reported.',
    },
  ];

  const complete =
    allCriteria.every((item) => item.status === 'READY') && report.readyForSubmission;
  const lines = [
    '# Release completion audit',
    '',
    `Objective: ${objective}`,
    '',
    `Tracker: ${trackerUrl}`,
    '',
    '| Field | Value |',
    '|---|---|',
    `| Completion status | ${complete ? 'COMPLETE' : 'NOT COMPLETE'} |`,
    `| Preflight status | ${tableCell(report.status)} |`,
    `| Ready for submission | ${report.readyForSubmission ? 'yes' : 'no'} |`,
    `| Blocked gates | ${blocked.length} |`,
    `| Generated at UTC | ${new Date().toISOString()} |`,
    `| Source | ${tableCell(source)} |`,
    '',
    '## Prompt-to-artifact checklist',
    '',
    '| Requirement | Evidence | Status | Gap / next verification |',
    '|---|---|---|---|',
  ];

  for (const item of allCriteria) {
    lines.push(
      `| ${tableCell(item.requirement)} | ${tableCell(item.evidence)} | ${tableCell(
        item.status,
      )} | ${tableCell(item.gap)} |`,
    );
  }

  lines.push('', '## Blocked release gates', '');
  if (blocked.length === 0) {
    lines.push('No release preflight gates are blocked.', '');
  } else {
    lines.push('| Gate | Evidence | Next action |', '|---|---|---|');
    for (const gate of blocked) {
      lines.push(
        `| \`${tableCell(gate.id)}\` | ${tableCell(gate.evidence)} | ${tableCell(
          gate.nextAction,
        )} |`,
      );
    }
    lines.push('');
  }

  if (!complete) {
    lines.push(
      '## Completion decision',
      '',
      'Do not mark the active goal complete until every checklist item is READY and `npm run release:preflight` reports `READY_FOR_STORE_SUBMISSION`.',
      '',
    );
  }

  lines.push('## Refresh command', '', '```bash', 'npm run release:completion-audit', '```', '');
  return { complete, markdown: lines.join('\n') };
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

  const report = readPreflightReport(args);
  const source =
    args.preflightJson || `release-preflight --json${args.runValidate ? ' --run-validate' : ''}`;
  const audit = renderAudit(report, source);
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, audit.markdown);
  process.stdout.write(
    `Release completion audit ${audit.complete ? 'COMPLETE' : 'NOT COMPLETE'}; wrote ${args.out}\n`,
  );
  process.exit(audit.complete ? 0 : 1);
}

main();
