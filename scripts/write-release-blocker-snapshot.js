#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const trackerUrl = 'https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11';

function parseArgs(argv) {
  const parsed = {
    out: 'reports/release-blockers-latest.md',
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
    'Usage: node scripts/write-release-blocker-snapshot.js [--run-validate] [--out reports/release-blockers-latest.md]',
    '   or: node scripts/write-release-blocker-snapshot.js --preflight-json <path> --out <path>',
    '',
    'Writes an issue-ready Markdown snapshot from release-preflight JSON.',
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-blockers-'));
  const stdoutPath = path.join(tmpDir, 'release-preflight.json');
  let result;
  let stdout = '';
  try {
    const stdoutFd = fs.openSync(stdoutPath, 'w');
    try {
      result = spawnSync(process.execPath, preflightArgs, {
        encoding: 'utf8',
        // --run-validate embeds the full local validation transcript in JSON
        // evidence. Write stdout to a file instead of a captured pipe so the
        // snapshot writer cannot truncate the report and then fail with
        // "Unterminated string" while preflight itself produced usable JSON.
        stdio: ['ignore', stdoutFd, 'pipe'],
      });
    } finally {
      fs.closeSync(stdoutFd);
    }
    stdout = fs.readFileSync(stdoutPath, 'utf8');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  try {
    return JSON.parse(stdout);
  } catch (error) {
    const spawnError = result?.error ? `\nspawn error: ${result.error.message}` : '';
    fail(
      `Could not parse release preflight JSON: ${error.message}${spawnError}\n${result?.stderr || ''}`,
    );
  }
}

function tableCell(value) {
  return String(value || '(empty)')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function renderMarkdown(report, source) {
  const gates = Array.isArray(report.gates) ? report.gates : [];
  const blocked = gates.filter((gate) => gate.status !== 'READY');
  const ready = gates.filter((gate) => gate.status === 'READY');
  const lines = [
    '# Release blocker snapshot',
    '',
    `Tracker: ${trackerUrl}`,
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${tableCell(report.status)} |`,
    `| Ready for submission | ${report.readyForSubmission ? 'yes' : 'no'} |`,
    `| Blocked gates | ${blocked.length} |`,
    `| Ready gates | ${ready.length} |`,
    `| Generated at UTC | ${new Date().toISOString()} |`,
    `| Source | ${tableCell(source)} |`,
    '',
    '## Blocked gates',
    '',
  ];

  if (blocked.length === 0) {
    lines.push('No blocked gates remain.', '');
  } else {
    lines.push('| Gate | Label | Evidence | Next action |', '|---|---|---|---|');
    for (const gate of blocked) {
      lines.push(
        `| \`${tableCell(gate.id)}\` | ${tableCell(gate.label)} | ${tableCell(
          gate.evidence,
        )} | ${tableCell(gate.nextAction)} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Ready gates', '');
  if (ready.length === 0) {
    lines.push('No gates are READY yet.', '');
  } else {
    lines.push(ready.map((gate) => `\`${gate.id}\``).join(', '), '');
  }

  lines.push('## Refresh command', '', '```bash', 'npm run release:blockers-snapshot', '```', '');

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
  const output = renderMarkdown(report, source);
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, output);

  process.stdout.write(`Release blocker snapshot ${report.status}; wrote ${args.out}\n`);
  process.exit(report.readyForSubmission ? 0 : 1);
}

main();
