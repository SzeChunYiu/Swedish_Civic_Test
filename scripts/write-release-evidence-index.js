#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { templates } = require('./create-release-evidence-stub.js');

const repoRoot = path.resolve(__dirname, '..');
const trackerUrl = 'https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11';

function parseArgs(argv) {
  const parsed = {
    root: process.cwd(),
    out: 'reports/release-evidence-index-latest.md',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') parsed.root = argv[++index];
    else if (arg === '--out') parsed.out = argv[++index];
    else if (arg === '--release-gates') parsed.releaseGates = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/write-release-evidence-index.js [--root <repo>] [--out reports/release-evidence-index-latest.md]',
    '   or: node scripts/write-release-evidence-index.js --release-gates <path> --out <path>',
    '',
    'Writes a Markdown matrix of blocked manual release gates and their evidence stub files.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveReleaseGatesPath(args) {
  if (args.releaseGates) return path.resolve(args.releaseGates);

  const rooted = path.join(args.root, 'reports/release-gates.json');
  if (fs.existsSync(rooted)) return rooted;

  return path.join(repoRoot, 'reports/release-gates.json');
}

function tableCell(value) {
  return String(value || '')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function buildRows(args) {
  const releaseGatesPath = resolveReleaseGatesPath(args);
  const releaseGates = readJson(releaseGatesPath).gates || {};
  const blockedManualGates = Object.entries(releaseGates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate);

  return blockedManualGates.map((gate) => {
    const template = templates[gate];
    if (!template) {
      return {
        gate,
        gateStatus: releaseGates[gate].status,
        stubStatus: 'no-template',
        path: '(missing template)',
        command: 'Add a template to scripts/create-release-evidence-stub.js.',
      };
    }

    const stubPath = path.join(args.root, template.path);
    const exists = fs.existsSync(stubPath);
    return {
      gate,
      gateStatus: releaseGates[gate].status,
      stubStatus: exists ? 'exists' : 'missing',
      path: template.path,
      command: exists
        ? `Fill ${template.path}, then run npm run release:gate -- --gate ${gate} --status READY --evidence-file ${template.path}`
        : `npm run release:evidence-stub -- --gate ${gate}`,
    };
  });
}

function renderMarkdown(rows, args) {
  const missingRows = rows.filter((row) => row.stubStatus !== 'exists');
  const status = rows.length === 0 ? 'READY' : missingRows.length === 0 ? 'STUBS_READY' : 'BLOCKED';
  const lines = [
    '# Release evidence index',
    '',
    `Tracker: ${trackerUrl}`,
    '',
    '| Field | Value |',
    '|---|---|',
    `| Status | ${status} |`,
    `| Blocked manual gates | ${rows.length} |`,
    `| Missing evidence stubs | ${missingRows.length} |`,
    `| Generated at UTC | ${new Date().toISOString()} |`,
    `| Evidence root | ${tableCell(path.resolve(args.root))} |`,
    '',
    '## Blocked manual gate evidence files',
    '',
  ];

  if (rows.length === 0) {
    lines.push('No blocked manual gates remain in `reports/release-gates.json`.', '');
  } else {
    lines.push('| Gate | Gate status | Stub | Path | Next command |', '|---|---|---|---|---|');
    for (const row of rows) {
      lines.push(
        `| \`${tableCell(row.gate)}\` | ${tableCell(row.gateStatus)} | ${tableCell(
          row.stubStatus,
        )} | ${tableCell(row.path)} | \`${tableCell(row.command)}\` |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Refresh command',
    '',
    '```bash',
    'npm run release:evidence-index',
    '```',
    '',
    'Keep gates BLOCKED until the evidence is filled with non-secret concrete build, device, store, policy, privacy, approval, screenshot, or submission proof and `npm run release:preflight` accepts it.',
    '',
  );

  return { status, markdown: lines.join('\n') };
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

  const rows = buildRows(args);
  const { status, markdown } = renderMarkdown(rows, args);
  const outputPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);

  process.stdout.write(`Release evidence index ${status}; wrote ${args.out}\n`);
  process.exit(status === 'READY' ? 0 : 1);
}

main();
