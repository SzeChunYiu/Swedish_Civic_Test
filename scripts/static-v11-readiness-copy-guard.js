const assert = require('node:assert/strict');

const STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS = Object.freeze([
  {
    label: 'English readiness label',
    pattern: /['"`]Readiness['"`]/,
  },
  {
    label: 'Swedish readiness label',
    pattern: /['"`]Din beredskap['"`]/,
  },
  {
    label: 'English almost-ready verdict',
    pattern: /['"`]Almost ready['"`]/,
  },
  {
    label: 'Swedish almost-ready verdict',
    pattern: /['"`]Nästan redo['"`]/,
  },
]);

const STATIC_V11_REQUIRED_READINESS_COPY = Object.freeze([
  'Local practice signal',
  'Lokal övningssignal',
  'Based only on practice and mock attempts on this device, not an official result forecast.',
  'Bygger bara på övningar och övningsprov på den här enheten, inte en officiell prognos.',
  'Practice accuracy',
  'Chapter coverage',
  'Mock average',
  'Rätt',
  'Kapiteltäckning',
  'Övningsprov',
  'Answer more questions for a steadier local signal',
  'Svara på fler frågor för en stabilare lokal signal',
]);

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findUnsupportedStaticV11ReadinessCopyInSource(source, file = 'site/v11.js') {
  const offenders = [];

  for (const { label, pattern } of STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS) {
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

function findMissingStaticV11ReadinessCopyInSource(source, file = 'site/v11.js') {
  return STATIC_V11_REQUIRED_READINESS_COPY.filter((copy) => !source.includes(copy)).map(
    (copy) => ({
      file,
      line: 1,
      label: 'missing static v1.1 local-practice copy',
      match: copy,
    }),
  );
}

function formatStaticV11ReadinessCopyIssues(issues) {
  return issues
    .map(({ file, line, label, match }) => `${file}:${line} ${label}: ${JSON.stringify(match)}`)
    .join('\n');
}

function assertStaticV11ReadinessCopySource(source, file = 'site/v11.js') {
  const offenders = findUnsupportedStaticV11ReadinessCopyInSource(source, file);
  const missing = findMissingStaticV11ReadinessCopyInSource(source, file);

  assert.equal(
    offenders.length,
    0,
    `static v1.1 dashboard must not expose unsupported readiness/pass-prediction copy:\n${formatStaticV11ReadinessCopyIssues(
      offenders,
    )}`,
  );
  assert.equal(
    missing.length,
    0,
    `static v1.1 dashboard must keep local-practice labels, component labels, and non-official caveats:\n${formatStaticV11ReadinessCopyIssues(
      missing,
    )}`,
  );

  return {
    requiredCopyValidated: STATIC_V11_REQUIRED_READINESS_COPY.length,
    unsupportedPatternsValidated: STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS.length,
  };
}

module.exports = {
  STATIC_V11_REQUIRED_READINESS_COPY,
  STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS,
  assertStaticV11ReadinessCopySource,
  findMissingStaticV11ReadinessCopyInSource,
  findUnsupportedStaticV11ReadinessCopyInSource,
  formatStaticV11ReadinessCopyIssues,
};
