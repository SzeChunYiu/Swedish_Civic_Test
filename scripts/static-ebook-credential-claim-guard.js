const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_EBOOK_CREDENTIAL_CLAIM_FILES = Object.freeze(['site/ebook.js']);

function escapedPattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phrasePattern(parts, maxGap = 80) {
  return new RegExp(parts.map(escapedPattern).join(`[\\s\\S]{0,${maxGap}}`), 'i');
}

const UNSUPPORTED_STATIC_EBOOK_CREDENTIAL_CLAIM_PATTERNS = Object.freeze([
  {
    label: 'first-person been-there credential',
    pattern: phrasePattern(['we', 'been there'], 24),
  },
  {
    label: 'third-person been-there credential',
    pattern: phrasePattern(['by someone', "who's been there"], 80),
  },
  {
    label: 'test-taker experience credential',
    pattern:
      /\b(?:I|we|someone|author|team)[^.?!]{0,80}\b(?:took|taken|sat|passed)\b[^.?!]{0,80}\b(?:citizenship\s+)?(?:test|exam|medborgarskapsprovet)\b/i,
  },
  {
    label: 'first-hand official-test credential',
    pattern:
      /\bfirst[-\s]?hand[^.?!]{0,80}\b(?:citizenship\s+)?(?:test|exam|medborgarskapsprovet)\b/i,
  },
]);

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findUnsupportedStaticEbookCredentialText(source, file = 'inline') {
  const offenders = [];

  for (const { label, pattern } of UNSUPPORTED_STATIC_EBOOK_CREDENTIAL_CLAIM_PATTERNS) {
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

function findUnsupportedStaticEbookCredentialClaims(repoRoot = DEFAULT_REPO_ROOT) {
  return STATIC_EBOOK_CREDENTIAL_CLAIM_FILES.flatMap((file) =>
    findUnsupportedStaticEbookCredentialText(
      fs.readFileSync(path.join(repoRoot, file), 'utf8'),
      file,
    ),
  );
}

function formatUnsupportedStaticEbookCredentialClaims(offenders) {
  return offenders
    .map(({ file, line, label, match }) => `${file}:${line} ${label}: ${JSON.stringify(match)}`)
    .join('\n');
}

function assertNoUnsupportedStaticEbookCredentialClaims(repoRoot = DEFAULT_REPO_ROOT) {
  const offenders = findUnsupportedStaticEbookCredentialClaims(repoRoot);
  assert.equal(
    offenders.length,
    0,
    `static ebook intro copy must not imply author/test-taker credentials:\n${formatUnsupportedStaticEbookCredentialClaims(
      offenders,
    )}`,
  );
  return UNSUPPORTED_STATIC_EBOOK_CREDENTIAL_CLAIM_PATTERNS.length;
}

function assertNoUnsupportedStaticEbookCredentialText(source, file = 'inline') {
  const offenders = findUnsupportedStaticEbookCredentialText(source, file);
  assert.equal(
    offenders.length,
    0,
    `static ebook intro copy must not imply author/test-taker credentials:\n${formatUnsupportedStaticEbookCredentialClaims(
      offenders,
    )}`,
  );
  return UNSUPPORTED_STATIC_EBOOK_CREDENTIAL_CLAIM_PATTERNS.length;
}

module.exports = {
  STATIC_EBOOK_CREDENTIAL_CLAIM_FILES,
  UNSUPPORTED_STATIC_EBOOK_CREDENTIAL_CLAIM_PATTERNS,
  assertNoUnsupportedStaticEbookCredentialClaims,
  assertNoUnsupportedStaticEbookCredentialText,
  findUnsupportedStaticEbookCredentialClaims,
  findUnsupportedStaticEbookCredentialText,
  formatUnsupportedStaticEbookCredentialClaims,
};
