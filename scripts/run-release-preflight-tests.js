const { spawnSync } = require('node:child_process');

const releasePreflightTestFiles = [
  'scripts/release-preflight.test.js',
  'tests/release-scope-v11-guard.test.js',
];

const releaseScopeGuardTestNames = [
  'release preflight owns the v1.1 scope guard behind Remove Ads acceptance',
  'release preflight npm wrapper forwards test filters before files',
];

function findTestNamePattern(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--test-name-pattern') {
      return args[index + 1] || '';
    }
    if (arg.startsWith('--test-name-pattern=')) {
      return arg.slice('--test-name-pattern='.length);
    }
  }
  return '';
}

function patternMatchesAnyName(pattern, names) {
  if (!pattern) {
    return true;
  }

  try {
    const matcher = new RegExp(pattern);
    return names.some((name) => matcher.test(name));
  } catch {
    return true;
  }
}

const forwardedArgs = process.argv.slice(2);
const testNamePattern = findTestNamePattern(forwardedArgs);
const selectedTestFiles = patternMatchesAnyName(testNamePattern, releaseScopeGuardTestNames)
  ? releasePreflightTestFiles
  : ['scripts/release-preflight.test.js'];

const result = spawnSync(process.execPath, ['--test', ...forwardedArgs, ...selectedTestFiles], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
