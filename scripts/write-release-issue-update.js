#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const issueNumber = 11;

function parseArgs(argv) {
  const parsed = {
    out: 'reports/release-issue-update-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--preflight-json') parsed.preflightJson = argv[++index];
    else if (arg === '--merge') parsed.merge = argv[++index];
    else if (arg === '--run-validate') parsed.runValidate = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/write-release-issue-update.js [--run-validate] [--merge <sha>] [--out reports/release-issue-update-latest.md]',
    '   or: node scripts/write-release-issue-update.js --preflight-json <path> --out <path> [--merge <sha>]',
    '',
    `Writes a GitHub issue #${issueNumber} update draft for ${repo}.`,
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

function inlineCodeList(gates) {
  if (gates.length === 0) return 'none';
  return gates.map((gate) => `\`${gate.id}\``).join(', ');
}

function renderIssueUpdate(report, source, merge, outPath) {
  const gates = Array.isArray(report.gates) ? report.gates : [];
  const blocked = gates.filter((gate) => gate.status !== 'READY');
  const ready = gates.filter((gate) => gate.status === 'READY');
  const status = report.readyForSubmission ? 'READY_FOR_STORE_SUBMISSION' : 'BLOCKED';
  const lines = [
    `Release status update for issue #${issueNumber}${merge ? ` (merge \`${merge}\`)` : ''}: ${status}.`,
    '',
    `Repo: ${repo}`,
    `Source: ${source}`,
    '',
    'Validation evidence to run before posting this draft:',
    '- `npm run release:preflight`',
    '- `npm run release:completion-audit`',
    '- `npm run release:blockers-snapshot`',
    '',
    `Current blocked gates (${blocked.length}):`,
  ];

  if (blocked.length === 0) {
    lines.push('- none');
  } else {
    for (const gate of blocked) {
      lines.push(`- \`${gate.id}\`: ${gate.evidence}`);
    }
  }

  lines.push('', `Ready gates (${ready.length}): ${inlineCodeList(ready)}`, '');

  if (report.readyForSubmission) {
    lines.push(
      'Completion audit decision: release preflight is READY; perform final human review before marking the goal complete.',
    );
  } else {
    lines.push(
      'Completion audit decision: do not mark the goal complete. Store submission readiness remains blocked until every listed gate is READY.',
    );
  }

  lines.push(
    '',
    `Post with: \`gh issue comment ${issueNumber} --repo ${repo} --body-file ${path.basename(
      outPath || 'reports/release-issue-update-latest.md',
    )}\``,
    '',
  );
  return `${lines.join('\n')}`;
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
  const body = renderIssueUpdate(report, source, args.merge, args.out);
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, body);
  process.stdout.write(
    `Release issue update draft ${report.readyForSubmission ? 'READY' : 'BLOCKED'}; wrote ${args.out}\n`,
  );
  process.exit(report.readyForSubmission ? 0 : 1);
}

main();
