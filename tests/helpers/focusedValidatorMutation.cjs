const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function runFocusedValidatorMutation({ focusFlag, targetFile, mutateSource }) {
  if (typeof focusFlag !== 'string' || !focusFlag.startsWith('--focus-')) {
    throw new TypeError('focusFlag must be a focused validate-content flag');
  }
  if (
    typeof targetFile !== 'string' ||
    targetFile.startsWith('..') ||
    path.isAbsolute(targetFile)
  ) {
    throw new TypeError('targetFile must be a repo-relative path');
  }
  if (typeof mutateSource !== 'function') {
    throw new TypeError('mutateSource must be a function');
  }

  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = ${JSON.stringify(repoRoot)};
const targetFile = ${JSON.stringify(targetFile).replace(/\\\\/g, '/')};
const mutateSource = (${mutateSource.toString()});

process.argv.push(${JSON.stringify(focusFlag)});

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/' + targetFile)) {
    return mutateSource(originalReadFileSync.call(this, filePath, ...args));
  }
  return originalReadFileSync.call(this, filePath, ...args);
};

require(path.join(repoRoot, 'scripts/validate-content.js'));
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

module.exports = {
  repoRoot,
  runFocusedValidatorMutation,
};
