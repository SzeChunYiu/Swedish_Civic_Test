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
    new RegExp(
      `${copyIdentifier} = \\{[\\s\\S]*en: \\{ source: 'Source', supplementalSource: 'Additional source', page: 'p\\.' \\}`,
    ),
  );
  assert.match(
    source,
    new RegExp(
      `${copyIdentifier} = \\{[\\s\\S]*sv: \\{ source: 'Källa', supplementalSource: 'Kompletterande källa', page: 's\\.' \\}`,
    ),
  );
  assert.match(
    source,
    new RegExp(
      `${copyIdentifier} = \\{[\\s\\S]*'zh-Hans': \\{ source: '来源', supplementalSource: '补充来源', page: '页' \\}`,
    ),
  );
  assert.match(source, /const copy = .*?\|\| .*?\.en;/);
  assert.match(
    source,
    /return `\$\{copy\.source\}: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, \$\{copy\.page\} \$\{source\.page\}`;/,
  );
  assert.match(source, /supplementalSources/);
  assert.match(source, /function \w*[sS]upplementalSourceCitations\(question(?:, lang)?\)/);
  assert.match(source, /class="quiz__supplemental-source-link"/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /\.\.\.supplementalCitations\]\.join\('; '\);/);
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
  assert.match(
    source,
    /const feedbackSourceRow = smtQuizQuestionSourceRow\(q, lang, 'quiz__feedback-source'\);/,
  );
  assert.match(source, /\$\{feedbackSourceRow\}/);
  assert.match(source, /questionProvenance/);
  assert.match(source, /quiz__provenance--\$\{provenance\}/);
  assert.match(source, /smtQuizPrimarySourceCitation\(question, lang\)/);
  assert.match(source, /smtQuizSupplementalSourceLinks\(question, lang\)/);
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
  assert.match(source, /primarySourceCitation\(question\)/);
  assert.match(source, /supplementalSourceLinks\(question\)/);
});

test('static source citation lines have dedicated styling', () => {
  const source = readSiteFile('site/styles.css');

  assert.match(source, /\.quiz__source\s*\{/);
  assert.match(source, /\.quiz__source-row\s*\{/);
  assert.match(source, /\.quiz__provenance\s*\{/);
  assert.match(source, /\.mock-review__source\s*\{/);
  assert.match(source, /\.quiz__supplemental-source-link\s*\{/);
});

test('static supplemental official sources render as structured links', () => {
  const practiceSource = readSiteFile('site/practice.js');
  const appSource = readSiteFile('site/app.js');
  const questionBankSource = readSiteFile('site/questions.js');

  assert.match(questionBankSource, /"id": "q019"[\s\S]*"supplementalSources": \[/);
  assert.match(questionBankSource, /"id": "q030"[\s\S]*"supplementalSources": \[/);
  assert.match(questionBankSource, /"id": "q166"[\s\S]*"supplementalSources": \[/);
  assert.match(questionBankSource, /"publisher": "Valmyndigheten"/);
  assert.match(questionBankSource, /"url": "https:\/\/www\.val\.se/);

  for (const source of [practiceSource, appSource]) {
    assert.match(source, /supplementalSource: 'Additional source'/);
    assert.match(source, /supplementalSource: 'Kompletterande källa'/);
    assert.match(source, /class="quiz__supplemental-source-link"/);
    assert.match(source, /aria-label="\$\{.*accessibilityLabel/);
    assert.doesNotMatch(
      source,
      /<p class="\$\{citationClassName\}">\$\{.*sourceCitation\(question/,
    );
    assert.doesNotMatch(source, /<p class="quiz__feedback-source">\$\{.*sourceCitation/);
  }
});
