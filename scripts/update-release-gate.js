const fs = require('node:fs');

function parseArgs(argv) {
  const parsed = {
    path: 'reports/release-gates.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--path') parsed.path = argv[++index];
    else if (arg === '--gate') parsed.gate = argv[++index];
    else if (arg === '--status') parsed.status = argv[++index];
    else if (arg === '--evidence') parsed.evidence = argv[++index];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function usage() {
  return [
    'Usage: node scripts/update-release-gate.js --gate <id> --status READY|BLOCKED --evidence <text> [--path reports/release-gates.json]',
    '',
    'Examples:',
    '  node scripts/update-release-gate.js --gate android-device-audio --status READY --evidence "Android Pixel 8 audio smoke passed; build https://expo.dev/..."',
    '  node scripts/update-release-gate.js --gate store-records --status BLOCKED --evidence "App Store Connect record not created yet"',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(1);
}

function loadGateFile(path) {
  if (!fs.existsSync(path)) {
    fail(`Gate file not found: ${path}`);
  }

  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`Could not parse ${path}: ${error.message}`);
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

  if (!args.gate) fail('Missing --gate.');
  if (!args.status) fail('Missing --status.');
  if (!['READY', 'BLOCKED'].includes(args.status)) fail('--status must be READY or BLOCKED.');

  const evidence = typeof args.evidence === 'string' ? args.evidence.trim() : '';
  if (!evidence) fail(`${args.status} evidence must be a non-empty string.`);
  if (args.status === 'READY' && evidence.length < 20) {
    fail('READY evidence must be concrete, not a short placeholder.');
  }

  const gateFile = loadGateFile(args.path);
  if (!gateFile.gates || !gateFile.gates[args.gate]) {
    fail(`Unknown gate: ${args.gate}`);
  }

  gateFile.gates[args.gate] = {
    ...gateFile.gates[args.gate],
    status: args.status,
    evidence,
  };

  fs.writeFileSync(args.path, `${JSON.stringify(gateFile, null, 2)}\n`);
  process.stdout.write(`Updated ${args.gate} to ${args.status} in ${args.path}\n`);
}

main();
