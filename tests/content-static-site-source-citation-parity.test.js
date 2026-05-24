const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertLocalizedSourceCitation(source, copyIdentifier) {
  assert.match(
    source,
    new RegExp(`${copyIdentifier} = \\{[\\s\\S]*en: \\{ source: 'Source', page: 'p\\.' \\}`),
  );
  assert.match(
    source,
    new RegExp(`${copyIdentifier} = \\{[\\s\\S]*sv: \\{ source: 'Källa', page: 's\\.' \\}`),
  );
  assert.match(
    source,
    new RegExp(`${copyIdentifier} = \\{[\\s\\S]*'zh-Hans': \\{ source: '来源', page: '页' \\}`),
  );
  assert.match(source, /const copy = .*?\|\| .*?\.en;/);
  assert.match(
    source,
    /return `\$\{copy\.source\}: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, \$\{copy\.page\} \$\{source\.page\}`;/,
  );
  assert.match(source, /supplementalSources/);
  assert.match(
    source,
    /function (?:smtQuizSupplementalSourceLinks|supplementalSourceLinks)\(question/,
  );
  assert.match(source, /quiz__supplemental-source-link/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /quiz__supplemental-source-meta/);
  assert.doesNotMatch(source, /return \[uhrCitation, \.\.\.supplementalCitations\]\.join\('; '\);/);
}

test('static practice quiz renders localized source citations below each question', () => {
  const source = readSiteFile('site/app.js');

  assert.match(source, /function smtQuizSourceCitation\(question, lang\)/);
  assert.match(source, /Källhänvisning saknas/);
  assert.match(source, /Source citation unavailable/);
  assertLocalizedSourceCitation(source, 'SMT_QUIZ_SOURCE_CITATION_COPY');
  assert.match(
    source,
    /function smtQuizQuestionSourceRow\(question, lang, citationClassName = ['"]quiz__source['"]\)/,
  );
  assert.match(source, /const sourceRow = smtQuizQuestionSourceRow\(q, lang\);/);
  assert.match(source, /\$\{sourceRow\}/);
  assert.match(source, /questionProvenance/);
  assert.match(source, /quiz__provenance--\$\{provenance\}/);
});

test('static mock exam and review render per-question source citations', () => {
  const source = readSiteFile('site/practice.js');

  assert.match(source, /function sourceCitation\(question\)/);
  assert.match(source, /Källhänvisning saknas/);
  assert.match(source, /Source citation unavailable/);
  assertLocalizedSourceCitation(source, 'sourceCitationCopy');
  assert.match(
    source,
    /function questionSourceRow\(question, citationClassName = ['"]quiz__source['"]\)/,
  );
  assert.match(source, /\$\{questionSourceRow\(q\)\}/);
  assert.match(source, /\$\{questionSourceRow\(q, ['"]mock-review__source['"]\)\}/);
  assert.match(source, /questionProvenance/);
  assert.match(source, /quiz__provenance--\$\{provenance\}/);
});

test('static source citation lines have dedicated styling', () => {
  const source = readSiteFile('site/styles.css');

  assert.match(source, /\.quiz__source\s*\{/);
  assert.match(source, /\.quiz__source-row\s*\{/);
  assert.match(source, /\.quiz__supplemental-source-list\s*\{/);
  assert.match(source, /\.quiz__supplemental-source-link\s*\{/);
  assert.match(source, /\.quiz__supplemental-source-meta\s*\{/);
  assert.match(source, /\.quiz__provenance\s*\{/);
  assert.match(source, /\.mock-review__source\s*\{/);
});
