const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');
const STATIC_RELEASE_COPY_FILES = Object.freeze(['site/app.js', 'site/index.html']);
const UNSUPPORTED_STATIC_RELEASE_COPY_PATTERNS = Object.freeze([
  {
    label: 'MVP release label',
    pattern: /\bMVP(?::n)?\b/i,
  },
  {
    label: 'minimum viable product label',
    pattern: /\bminimum\s+viable\s+product\b/i,
  },
  {
    label: 'beta release label',
    pattern: /\bbeta\s+(?:release|version|build)\b/i,
  },
]);

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findUnsupportedStaticReleaseCopyInSource(source, file = '<inline>') {
  const offenders = [];

  for (const { label, pattern } of UNSUPPORTED_STATIC_RELEASE_COPY_PATTERNS) {
    const match = pattern.exec(source);
    if (!match) continue;
    offenders.push({
      file,
      label,
      line: lineNumberForIndex(source, match.index),
      match: match[0],
    });
  }

  return offenders;
}

function findUnsupportedStaticReleaseCopy(repoRoot = DEFAULT_REPO_ROOT) {
  return STATIC_RELEASE_COPY_FILES.flatMap((file) =>
    findUnsupportedStaticReleaseCopyInSource(
      fs.readFileSync(path.join(repoRoot, file), 'utf8'),
      file,
    ),
  );
}

function formatUnsupportedStaticReleaseCopy(offenders) {
  return offenders
    .map(({ file, line, label, match }) => `${file}:${line} ${label}: ${JSON.stringify(match)}`)
    .join('\n');
}

function assertNoUnsupportedStaticReleaseCopy(repoRoot = DEFAULT_REPO_ROOT) {
  const offenders = findUnsupportedStaticReleaseCopy(repoRoot);
  assert.equal(
    offenders.length,
    0,
    `static public copy must not label the release as an MVP, beta, or minimum viable product:\n${formatUnsupportedStaticReleaseCopy(
      offenders,
    )}`,
  );
  return UNSUPPORTED_STATIC_RELEASE_COPY_PATTERNS.length;
}

module.exports = {
  STATIC_RELEASE_COPY_FILES,
  UNSUPPORTED_STATIC_RELEASE_COPY_PATTERNS,
  assertNoUnsupportedStaticReleaseCopy,
  findUnsupportedStaticReleaseCopy,
  findUnsupportedStaticReleaseCopyInSource,
  formatUnsupportedStaticReleaseCopy,
};
