#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const selectors = new Map([
  [
    'monetization',
    {
      scripts: ['test:monetization'],
      description: 'focused ads and Remove Ads monetization gate',
    },
  ],
  [
    'correct-display-position',
    {
      scripts: ['test:correct-display-position'],
      description: 'P0 answer-shuffle distribution, stability, and static scoring gate',
    },
  ],
  [
    'xp',
    {
      scripts: ['test:xp-rules'],
      description: 'focused XP rules parity gate',
    },
  ],
  [
    'architecture',
    {
      scripts: ['test:architecture', 'test:router-shell'],
      description: 'focused architecture scaffold and router shell release gate',
    },
  ],
]);

function supportedSelectorText() {
  return [...selectors.entries()]
    .map(
      ([selector, config]) =>
        `  ${selector} -> ${config.scripts.map((script) => `npm run ${script}`).join(' && ')} (${config.description})`,
    )
    .join('\n');
}

function failUnsupported(args) {
  const received = args.length === 0 ? '(none)' : args.join(' ');
  console.error(`Unsupported npm test selector: ${received}`);
  console.error('Supported selectors:');
  console.error(supportedSelectorText());
  console.error(
    '  content-focused -> node --test --test-name-pattern <pattern> <files...> (focused Node test files)',
  );
  console.error('Run `npm test` with no selector for the full test suite.');
  process.exit(1);
}

function runCommand(command, args, label) {
  const stdio = process.env.TEST_DISPATCH_CAPTURE === '1' ? 'pipe' : 'inherit';
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio,
  });

  if (stdio === 'pipe') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(`Failed to run ${label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal) {
    console.error(`${label} was terminated by ${result.signal}`);
    process.exit(1);
  }

  return result.status ?? 1;
}

function runNpmScript(script) {
  const command = process.env.TEST_DISPATCH_NPM || 'npm';
  const status = runCommand(command, ['run', script], `npm script ${script}`);
  if (status !== 0) process.exit(status);
}

function runNpmScripts(scripts) {
  for (const script of scripts) {
    runNpmScript(script);
  }
  process.exit(0);
}

function failFocusedNodeTests(message) {
  console.error(`content-focused requires --test-name-pattern <pattern> <files...>: ${message}`);
  process.exit(1);
}

function parseFocusedNodeTestArgs(args) {
  let pattern = null;
  const files = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--test-name-pattern') {
      if (pattern !== null) failFocusedNodeTests('duplicate --test-name-pattern');
      const value = args[index + 1];
      if (!value) failFocusedNodeTests('missing pattern value');
      pattern = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--test-name-pattern=')) {
      if (pattern !== null) failFocusedNodeTests('duplicate --test-name-pattern');
      const value = arg.slice('--test-name-pattern='.length);
      if (!value) failFocusedNodeTests('missing pattern value');
      pattern = value;
      continue;
    }

    if (arg.startsWith('-')) {
      failFocusedNodeTests(`unsupported option ${arg}`);
    }

    files.push(arg);
  }

  if (pattern === null) failFocusedNodeTests('missing --test-name-pattern');
  if (files.length === 0) failFocusedNodeTests('missing test file list');

  return { pattern, files };
}

function runFocusedNodeTests(args) {
  const { pattern, files } = parseFocusedNodeTestArgs(args);
  const command = process.env.TEST_DISPATCH_NODE || process.execPath;
  const status = runCommand(
    command,
    ['--test', '--test-name-pattern', pattern, ...files],
    'focused Node tests',
  );
  process.exit(status);
}

const args = process.argv.slice(2).filter((arg) => arg !== '--');

if (args.length === 0) {
  runNpmScripts(['test:all']);
}

if (args[0] === 'content-focused') {
  runFocusedNodeTests(args.slice(1));
}

if (args.length !== 1 || !selectors.has(args[0])) {
  failUnsupported(args);
}

runNpmScripts(selectors.get(args[0]).scripts);
