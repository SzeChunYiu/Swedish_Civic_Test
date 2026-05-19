const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_OUTCOME_COPY_FILES = Object.freeze([
  'site/index.html',
  'site/app.js',
  'site/i18n-extras.js',
  'site/buddies.js',
  'site/tweaks.jsx',
]);

const UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS = Object.freeze([
  { label: 'English pass-the-test slogan', pattern: /Pass the test\./ },
  { label: 'English earn-the-passport slogan', pattern: /Earn the passport\./ },
  { label: 'English pass-big slogan', pattern: /Pass big\./ },
  { label: 'English dancing-queen pass slogan', pattern: /Pass like a dancing queen\./ },
  { label: 'English pulla pass slogan', pattern: /Pass with pulla\./ },
  { label: 'Swedish klara-provet slogan', pattern: /Klara provet\./ },
  { label: 'Swedish fa-passet slogan', pattern: /Få passet\./ },
  { label: 'Swedish klara-stort slogan', pattern: /Klara stort\./ },
  { label: 'Simplified Chinese pass-test slogan', pattern: /通过测试。/ },
  { label: 'Simplified Chinese passport slogan', pattern: /拿到护照。/ },
  { label: 'Traditional Chinese pass-test slogan', pattern: /通過測試。/ },
  { label: 'Traditional Chinese passport slogan', pattern: /拿到護照。/ },
  { label: 'Arabic pass-test slogan', pattern: /اجتز الاختبار\./ },
  { label: 'Arabic passport slogan', pattern: /احصل على الجواز\./ },
  { label: 'Somali pass-test slogan', pattern: /Imtixaanka uga gud\./ },
  { label: 'Somali passport slogan', pattern: /Hel baasaboorka\./ },
]);

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function readHtmlAttribute(tagSource, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = pattern.exec(tagSource);
  return match ? (match[1] ?? match[2] ?? '') : '';
}

function extractStaticHeadMetaDescriptions(source) {
  const headMatch = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(source);
  const headSource = headMatch ? headMatch[1] : source;
  const headOffset = headMatch ? headMatch.index + headMatch[0].indexOf(headSource) : 0;
  const descriptions = [];

  for (const match of headSource.matchAll(/<meta\b[^>]*>/gi)) {
    const tagSource = match[0];
    if (readHtmlAttribute(tagSource, 'name').toLocaleLowerCase('en-US') !== 'description') {
      continue;
    }

    descriptions.push({
      content: readHtmlAttribute(tagSource, 'content').trim(),
      line: lineNumberForIndex(source, headOffset + match.index),
    });
  }

  return descriptions;
}

function findStaticHeadMetadataDescriptionIssues(source, file = 'site/index.html') {
  const descriptions = extractStaticHeadMetaDescriptions(source);
  const issues = [];

  if (descriptions.length === 0) {
    issues.push({ file, line: 1, label: 'missing static meta description', match: '' });
    return issues;
  }

  for (const description of descriptions) {
    if (!description.content) {
      issues.push({
        file,
        line: description.line,
        label: 'blank static meta description',
        match: '',
      });
      continue;
    }

    for (const { label, pattern } of UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS) {
      const match = pattern.exec(description.content);
      if (!match) continue;
      issues.push({
        file,
        line: description.line,
        label: `static meta description ${label}`,
        match: match[0],
      });
    }
  }

  return issues;
}

function findUnsupportedStaticOutcomeSlogans(repoRoot = DEFAULT_REPO_ROOT) {
  const offenders = [];

  for (const file of STATIC_OUTCOME_COPY_FILES) {
    const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');

    for (const { label, pattern } of UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS) {
      const match = pattern.exec(source);
      if (!match) continue;
      offenders.push({
        file,
        label,
        line: lineNumberForIndex(source, match.index),
        match: match[0],
      });
    }
  }

  return offenders;
}

function formatUnsupportedStaticOutcomeSlogans(offenders) {
  return offenders
    .map(({ file, line, label, match }) => `${file}:${line} ${label}: ${JSON.stringify(match)}`)
    .join('\n');
}

function assertStaticHeadMetadataDescriptionSource(source, file = 'site/index.html') {
  const issues = findStaticHeadMetadataDescriptionIssues(source, file);
  assert.equal(
    issues.length,
    0,
    `static head meta description must be non-empty and avoid pass/passport outcome copy:\n${formatUnsupportedStaticOutcomeSlogans(
      issues,
    )}`,
  );
  return extractStaticHeadMetaDescriptions(source).length;
}

function assertStaticHeadMetadataDescription(repoRoot = DEFAULT_REPO_ROOT) {
  const source = fs.readFileSync(path.join(repoRoot, 'site/index.html'), 'utf8');
  return assertStaticHeadMetadataDescriptionSource(source);
}

function assertNoUnsupportedStaticOutcomeSlogans(repoRoot = DEFAULT_REPO_ROOT) {
  const offenders = findUnsupportedStaticOutcomeSlogans(repoRoot);
  assert.equal(
    offenders.length,
    0,
    `static learner-facing copy must not promise pass/passport outcomes:\n${formatUnsupportedStaticOutcomeSlogans(
      offenders,
    )}`,
  );
  return UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS.length;
}

module.exports = {
  STATIC_OUTCOME_COPY_FILES,
  UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS,
  assertNoUnsupportedStaticOutcomeSlogans,
  assertStaticHeadMetadataDescription,
  assertStaticHeadMetadataDescriptionSource,
  extractStaticHeadMetaDescriptions,
  findStaticHeadMetadataDescriptionIssues,
  findUnsupportedStaticOutcomeSlogans,
  formatUnsupportedStaticOutcomeSlogans,
};
