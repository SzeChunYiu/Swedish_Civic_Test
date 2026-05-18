#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function buildSteps(artifactDir) {
  const quickPreflightEnv = { RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS: '1' };
  return [
    {
      name: 'eas-whoami',
      command: 'npx',
      args: ['--yes', 'eas-cli@18.13.0', 'whoami'],
      requiresExpoToken: true,
      timeoutMs: 120_000,
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
      requiresExpoToken: true,
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
      name: 'release:expo-token-request',
      command: 'npm',
      args: [
        'run',
        'release:expo-token-request',
        '--',
        '--out',
        path.join(artifactDir, 'expo-token-owner-request.md'),
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
      requiresExpoToken: true,
    },
    {
      name: 'release:preflight',
      command: 'node',
      args: ['scripts/release-preflight.js'],
      env: quickPreflightEnv,
    },
    {
      name: 'release:blockers-snapshot',
      command: 'node',
      args: [
        'scripts/write-release-blocker-snapshot.js',
        '--out',
        path.join(artifactDir, 'release-blockers.md'),
      ],
      env: quickPreflightEnv,
    },
    {
      name: 'release:completion-audit',
      command: 'node',
      args: [
        'scripts/write-release-completion-audit.js',
        '--out',
        path.join(artifactDir, 'release-completion-audit.md'),
      ],
      env: quickPreflightEnv,
    },
    {
      name: 'release:issue-update',
      command: 'node',
      args: [
        'scripts/write-release-issue-update.js',
        '--out',
        path.join(artifactDir, 'release-issue-update.md'),
      ],
      env: quickPreflightEnv,
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
    {
      name: 'release:owner-action-packet',
      command: 'npm',
      args: [
        'run',
        'release:owner-action-packet',
        '--',
        '--out',
        path.join(artifactDir, 'release-owner-action-packet.md'),
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

function parsePositiveInteger(value) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stepTimeoutMs(step) {
  return (
    parsePositiveInteger(process.env.EXTERNAL_RELEASE_LOOP_STEP_TIMEOUT_MS) ||
    step.timeoutMs ||
    300_000
  );
}

function timedOutMessage(timeoutMs) {
  return `Timed out after ${timeoutMs}ms`;
}

function truthyEnv(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function expoSkipReason() {
  if (truthyEnv(process.env.EXTERNAL_RELEASE_LOOP_SKIP_EAS)) {
    return 'Skipped because EXTERNAL_RELEASE_LOOP_SKIP_EAS is enabled';
  }
  if (!process.env.EXPO_TOKEN) {
    return 'Skipped because EXPO_TOKEN is not configured';
  }
  return '';
}

function skippedExpoStep(step, reason) {
  return {
    ...step,
    exitCode: 1,
    status: 'BLOCKED',
    stdout: '',
    stderr: reason,
  };
}

function runStep(step) {
  const skipReason = step.requiresExpoToken ? expoSkipReason() : '';
  if (skipReason) {
    return skippedExpoStep(step, skipReason);
  }

  const timeoutMs = stepTimeoutMs(step);
  const result = spawnSync(step.command, step.args, {
    encoding: 'utf8',
    env: { ...process.env, ...(step.env || {}) },
    killSignal: 'SIGTERM',
    timeout: timeoutMs,
  });
  const exitCode = result.status ?? 1;
  const timedOut = result.error && result.error.code === 'ETIMEDOUT';
  const stderr = [result.stderr, timedOut ? timedOutMessage(timeoutMs) : result.error?.message]
    .filter(Boolean)
    .join('\n');
  return {
    ...step,
    exitCode,
    status: exitCode === 0 ? 'READY' : 'BLOCKED',
    stdout: summarizeOutput(result.stdout),
    stderr: summarizeOutput(stderr),
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

function copySelectedArtifacts(outPath, artifactDir) {
  const outputDir = path.dirname(outPath);
  const selectedArtifacts = [
    {
      from: path.join(artifactDir, 'release-owner-action-packet.md'),
      to: path.join(outputDir, 'release-owner-action-packet-latest.md'),
    },
  ];

  for (const artifact of selectedArtifacts) {
    if (!fs.existsSync(artifact.from)) continue;
    fs.mkdirSync(path.dirname(artifact.to), { recursive: true });
    fs.copyFileSync(artifact.from, artifact.to);
  }
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
  copySelectedArtifacts(path.resolve(args.out), artifactDir);
  process.stdout.write(`External release blocker loop ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
