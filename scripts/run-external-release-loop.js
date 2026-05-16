#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function buildSteps(artifactDir) {
  return [
    {
      name: 'eas-whoami',
      command: 'npx',
      args: ['--yes', 'eas-cli@18.13.0', 'whoami'],
    },
    {
      name: 'release:eas-access-check',
      command: 'npm',
      args: [
        'run',
        'release:eas-access-check',
        '--',
        '--out',
        path.join(artifactDir, 'eas-access-check.md'),
      ],
    },
    {
      name: 'release:github-secrets-check',
      command: 'npm',
      args: [
        'run',
        'release:github-secrets-check',
        '--',
        '--out',
        path.join(artifactDir, 'github-release-secrets.md'),
      ],
    },
    {
      name: 'release:eas-preview-dispatch',
      command: 'npm',
      args: [
        'run',
        'release:eas-preview-dispatch',
        '--',
        '--run-build',
        'false',
        '--out',
        path.join(artifactDir, 'eas-preview-dispatch.md'),
      ],
    },
    { name: 'release:preflight', command: 'npm', args: ['run', 'release:preflight'] },
    {
      name: 'release:blockers-snapshot',
      command: 'npm',
      args: [
        'run',
        'release:blockers-snapshot',
        '--',
        '--out',
        path.join(artifactDir, 'release-blockers.md'),
      ],
    },
    {
      name: 'release:completion-audit',
      command: 'npm',
      args: [
        'run',
        'release:completion-audit',
        '--',
        '--out',
        path.join(artifactDir, 'release-completion-audit.md'),
      ],
    },
    {
      name: 'release:issue-update',
      command: 'npm',
      args: [
        'run',
        'release:issue-update',
        '--',
        '--out',
        path.join(artifactDir, 'release-issue-update.md'),
      ],
    },
    {
      name: 'release:evidence-index',
      command: 'npm',
      args: [
        'run',
        'release:evidence-index',
        '--',
        '--out',
        path.join(artifactDir, 'release-evidence-index.md'),
      ],
    },
  ];
}

function parseArgs(argv) {
  const parsed = { out: 'reports/external-release-loop-latest.md' };

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
    'Usage: node scripts/run-external-release-loop.js [--out reports/external-release-loop-latest.md]',
    '',
    'Runs the safe external release blocker evidence loop and records every exit code.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function tableCell(value) {
  return String(value ?? '')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function redactSensitive(value) {
  let text = String(value || '');
  for (const secret of [process.env.EXPO_TOKEN]) {
    if (secret) {
      text = text.split(secret).join('[REDACTED]');
    }
  }
  return text;
}

function summarizeOutput(value) {
  const text = redactSensitive(value).trim();
  if (!text) return '';
  return text.length > 800 ? `${text.slice(0, 800)}…` : text;
}

function runStep(step) {
  const result = spawnSync(step.command, step.args, { encoding: 'utf8' });
  const exitCode = result.status ?? 1;
  return {
    ...step,
    exitCode,
    status: exitCode === 0 ? 'READY' : 'BLOCKED',
    stdout: summarizeOutput(result.stdout),
    stderr: summarizeOutput(result.stderr),
  };
}

function writeReport(outPath, results, artifactDir) {
  const overallStatus = results.every((result) => result.exitCode === 0) ? 'READY' : 'BLOCKED';
  const lines = [
    '# External release blocker loop',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${overallStatus} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Intermediate artifact dir | ${artifactDir} |`,
    '',
    '## Command results',
    '',
    '| Step | Command | Exit code | Status |',
    '|---|---|---:|---|',
  ];

  for (const result of results) {
    const command = [result.command, ...result.args].join(' ');
    lines.push(
      `| ${tableCell(result.name)} | \`${tableCell(command)}\` | ${result.exitCode} | ${result.status} |`,
    );
  }

  lines.push('', '## Output snippets', '');
  for (const result of results) {
    lines.push(
      `### ${result.name}`,
      '',
      `- stdout: ${tableCell(result.stdout || '(empty)')}`,
      `- stderr: ${tableCell(result.stderr || '(empty)')}`,
      '',
    );
  }

  lines.push(
    '## Interpretation',
    '',
    overallStatus === 'READY'
      ? 'Every external release blocker command exited 0. Run the completion audit and verify store submission evidence before marking the release complete.'
      : 'At least one external release blocker command is still blocked. Continue collecting EAS, device, store, privacy, owner approval, screenshot, and submission evidence before release upload.',
    '',
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  return overallStatus;
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

  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'swedish-civic-test-release-loop-'));
  const results = buildSteps(artifactDir).map(runStep);
  const status = writeReport(path.resolve(args.out), results, artifactDir);
  process.stdout.write(`External release blocker loop ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
