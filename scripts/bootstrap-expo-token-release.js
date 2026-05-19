#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const envName = 'EXPO_TOKEN';

function parseArgs(argv) {
  const parsed = { out: 'reports/expo-token-bootstrap-latest.md' };

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
    'Usage: node scripts/bootstrap-expo-token-release.js [--out reports/expo-token-bootstrap-latest.md]',
    '',
    'When EXPO_TOKEN is available locally, sets the GitHub Actions secret, verifies it, and dispatches the external blocker loop.',
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

function redact(value, secretValue) {
  let text = String(value || '');
  if (secretValue) {
    text = text.split(secretValue).join('[REDACTED_EXPO_TOKEN]');
  }
  return text.replace(/expo_[A-Za-z0-9_-]{10,}/g, '[REDACTED_EXPO_TOKEN]');
}

function commandText(command) {
  return command.join(' ');
}

function readLocalToken() {
  const envValue = String(process.env[envName] || '').trim();
  if (envValue) {
    return { value: envValue, source: `environment variable ${envName}` };
  }

  const keychainResult = spawnSync('security', ['find-generic-password', '-w', '-s', envName], {
    encoding: 'utf8',
  });
  const keychainValue =
    keychainResult.status === 0 ? String(keychainResult.stdout || '').trim() : '';
  if (keychainValue) {
    return { value: keychainValue, source: `macOS Keychain service ${envName}` };
  }

  return { value: '', source: 'none' };
}

function writeReport({ outPath, status, tokenPresent, tokenSource, steps, note, secretValue }) {
  const lines = [
    '# Expo token release bootstrap',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Environment variable | ${envName} |`,
    `| Token source | ${tableCell(tokenSource || 'none')} |`,
    `| Local token present | ${tokenPresent ? 'yes' : 'no'} |`,
    '',
    '## Command results',
    '',
    '| Step | Command | Exit code | Status |',
    '|---|---|---:|---|',
  ];

  if (steps.length === 0) {
    lines.push('| none | not run | 0 | BLOCKED |');
  } else {
    for (const step of steps) {
      lines.push(
        `| ${tableCell(step.name)} | \`${tableCell(commandText(step.command))}\` | ${step.statusCode} | ${step.ok ? 'READY' : 'BLOCKED'} |`,
      );
    }
  }

  lines.push('', '## Output snippets', '');
  if (steps.length === 0) {
    lines.push('No release commands were run because the local Expo token was absent.', '');
  } else {
    for (const step of steps) {
      lines.push(
        `### ${step.name}`,
        '',
        `- stdout: ${tableCell(redact(step.stdout || '(empty)', secretValue))}`,
        `- stderr: ${tableCell(redact(step.stderr || '(empty)', secretValue))}`,
        '',
      );
      if (step.artifact && fs.existsSync(step.artifact)) {
        lines.push(
          `Artifact: \`${tableCell(step.artifact)}\``,
          '',
          tableCell(redact(fs.readFileSync(step.artifact, 'utf8'), secretValue)),
          '',
        );
      }
    }
  }

  lines.push('## Interpretation', '', tableCell(note), '');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
}

function runStep({ name, command, artifact }) {
  const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' });
  return {
    name,
    command,
    artifact,
    statusCode: result.status ?? 1,
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
  };
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

  const localToken = readLocalToken();
  const secretValue = localToken.value;
  const tokenSource = localToken.source;
  const outPath = path.resolve(args.out);
  const steps = [];

  if (!secretValue) {
    writeReport({
      outPath,
      status: 'BLOCKED',
      tokenPresent: false,
      tokenSource,
      steps,
      note: `No local Expo token was found. Export ${envName} or store the token in macOS Keychain service ${envName} before running the bootstrap loop.`,
      secretValue,
    });
    process.stdout.write(`Expo token release bootstrap BLOCKED; wrote ${args.out}\n`);
    process.exit(1);
  }

  process.env[envName] = secretValue;

  const artifactDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'swedish-civic-test-expo-token-bootstrap-'),
  );
  const plannedSteps = [
    {
      name: 'release:set-expo-token-secret',
      artifact: path.join(artifactDir, 'set-expo-token-secret.md'),
      command: [
        'npm',
        'run',
        'release:set-expo-token-secret',
        '--',
        '--out',
        path.join(artifactDir, 'set-expo-token-secret.md'),
      ],
    },
    {
      name: 'release:github-secrets-check',
      artifact: path.join(artifactDir, 'github-release-secrets.md'),
      command: [
        'npm',
        'run',
        'release:github-secrets-check',
        '--',
        '--out',
        path.join(artifactDir, 'github-release-secrets.md'),
      ],
    },
    {
      name: 'release:external-loop-dispatch',
      artifact: path.join(artifactDir, 'external-loop-dispatch.md'),
      command: [
        'npm',
        'run',
        'release:external-loop-dispatch',
        '--',
        '--out',
        path.join(artifactDir, 'external-loop-dispatch.md'),
      ],
    },
  ];

  for (const plannedStep of plannedSteps) {
    const step = runStep(plannedStep);
    steps.push(step);
    if (!step.ok) break;
  }

  const status =
    steps.length === plannedSteps.length && steps.every((step) => step.ok)
      ? 'DISPATCHED'
      : 'BLOCKED';
  writeReport({
    outPath,
    status,
    tokenPresent: true,
    tokenSource,
    steps,
    note:
      status === 'DISPATCHED'
        ? 'The Expo token was stored as a GitHub Actions secret, the secret name was verified, and the external blocker loop workflow was dispatched. Watch the linked run for remaining release blockers.'
        : 'The bootstrap loop stopped before dispatch. Review the first blocked command above; no later release command was run after a failed step.',
    secretValue,
  });

  process.stdout.write(`Expo token release bootstrap ${status}; wrote ${args.out}\n`);
  process.exit(status === 'DISPATCHED' ? 0 : 1);
}

main();
