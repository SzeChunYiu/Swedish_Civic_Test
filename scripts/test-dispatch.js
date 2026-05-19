#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const selectors = new Map([
  [
    'monetization',
    {
      script: 'test:monetization',
      description: 'focused ads and Remove Ads monetization gate',
    },
  ],
]);

function supportedSelectorText() {
  return [...selectors.entries()]
    .map(
      ([selector, config]) => `  ${selector} -> npm run ${config.script} (${config.description})`,
    )
    .join('\n');
}

function failUnsupported(args) {
  const received = args.length === 0 ? '(none)' : args.join(' ');
  console.error(`Unsupported npm test selector: ${received}`);
  console.error('Supported selectors:');
  console.error(supportedSelectorText());
  console.error('Run `npm test` with no selector for the full test suite.');
  process.exit(1);
}

function runNpmScript(script) {
  const command = process.env.TEST_DISPATCH_NPM || 'npm';
  const stdio = process.env.TEST_DISPATCH_CAPTURE === '1' ? 'pipe' : 'inherit';
  const result = spawnSync(command, ['run', script], {
    encoding: 'utf8',
    stdio,
  });

  if (stdio === 'pipe') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(`Failed to run npm script ${script}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal) {
    console.error(`npm script ${script} was terminated by ${result.signal}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2).filter((arg) => arg !== '--');

if (args.length === 0) {
  runNpmScript('test:all');
}

if (args.length !== 1 || !selectors.has(args[0])) {
  failUnsupported(args);
}

runNpmScript(selectors.get(args[0]).script);
