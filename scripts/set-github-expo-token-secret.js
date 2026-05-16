#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = 'SzeChunYiu/Swedish_Civic_Test';
const secretName = 'EXPO_TOKEN';
const envName = 'EXPO_TOKEN';

function parseArgs(argv) {
  const parsed = { out: 'reports/set-expo-token-secret-latest.md' };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--repo') parsed.repo = argv[++index];
    else if (arg === '--env') parsed.env = argv[++index];
    else if (arg === '--secret-name') parsed.secretName = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/set-github-expo-token-secret.js [--out reports/set-expo-token-secret-latest.md]',
    '',
    'Reads EXPO_TOKEN from the local environment and stores it as the repository GitHub Actions secret without printing the value.',
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

function writeReport({
  outPath,
  targetRepo,
  targetSecret,
  sourceEnv,
  status,
  setStatus,
  listStatus,
  setOutput,
  listOutput,
  note,
  secretValue,
}) {
  const lines = [
    '# GitHub EXPO_TOKEN secret setter',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Checked at UTC | ${new Date().toISOString()} |`,
    `| Repository | ${targetRepo} |`,
    `| Secret | ${targetSecret} |`,
    `| Environment variable | ${sourceEnv} |`,
    `| Set command | \`gh secret set ${targetSecret} --repo ${targetRepo} --app actions\` |`,
    `| Set command exit code | ${setStatus} |`,
    `| Verify command | \`gh secret list --repo ${targetRepo}\` |`,
    `| Verify command exit code | ${listStatus} |`,
    '',
    '## Non-secret command output',
    '',
    '| Command | Output |',
    '|---|---|',
    `| set | ${tableCell(redact(setOutput || '(no output)', secretValue))} |`,
    `| verify | ${tableCell(redact(listOutput || '(no output)', secretValue))} |`,
    '',
    '## Interpretation',
    '',
    tableCell(note),
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

  const targetRepo = args.repo || repo;
  const targetSecret = args.secretName || secretName;
  const sourceEnv = args.env || envName;
  const secretValue = String(process.env[sourceEnv] || '').trim();
  const outPath = path.resolve(args.out);

  if (!secretValue) {
    writeReport({
      outPath,
      targetRepo,
      targetSecret,
      sourceEnv,
      status: 'BLOCKED',
      setStatus: 'not-run',
      listStatus: 'not-run',
      setOutput: '(not run)',
      listOutput: '(not run)',
      note: `Environment variable ${sourceEnv} is empty. Export a valid Expo access token locally, then rerun this command.`,
      secretValue,
    });
    process.stdout.write(`GitHub ${targetSecret} secret set BLOCKED; wrote ${args.out}\n`);
    process.exit(1);
  }

  const setResult = spawnSync(
    'gh',
    ['secret', 'set', targetSecret, '--repo', targetRepo, '--app', 'actions'],
    { encoding: 'utf8', input: `${secretValue}\n` },
  );
  const setOutput = setResult.stderr || setResult.stdout;

  let listResult = { status: 1, stdout: '', stderr: '' };
  let present = false;
  if (setResult.status === 0) {
    listResult = spawnSync('gh', ['secret', 'list', '--repo', targetRepo], { encoding: 'utf8' });
    present = listResult.status === 0 && parseSecretNames(listResult.stdout).has(targetSecret);
  }

  const listOutput =
    listResult.status === 0 ? listResult.stdout : listResult.stderr || listResult.stdout;
  const status = setResult.status === 0 && present ? 'READY' : 'BLOCKED';

  writeReport({
    outPath,
    targetRepo,
    targetSecret,
    sourceEnv,
    status,
    setStatus: setResult.status ?? 1,
    listStatus: listResult.status ?? 1,
    setOutput,
    listOutput,
    note:
      status === 'READY'
        ? `${targetSecret} is configured as a GitHub Actions repository secret. Rerun the external blocker loop to re-check EAS dispatch readiness.`
        : `${targetSecret} could not be confirmed after running gh secret set. Review GitHub CLI auth, repository permissions, and gh output.`,
    secretValue,
  });

  process.stdout.write(`GitHub ${targetSecret} secret set ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
