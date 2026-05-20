const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('static practice quiz renders localized source citations below each question', () => {
  const source = readSiteFile('site/app.js');

  assert.match(source, /function smtQuizSourceCitation\(question, lang\)/);
  assert.match(source, /Källhänvisning saknas/);
  assert.match(source, /Source citation unavailable/);
  assert.match(
    source,
    /`Källa: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, s\. \$\{source\.page\}`/,
  );
  assert.match(
    source,
    /`Source: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, p\. \$\{source\.page\}`/,
  );
  assert.match(
    source,
    /function smtQuizSourceRow\(question, lang, citationClassName = "quiz__source"\)/,
  );
  assert.match(source, /const sourceRow = smtQuizSourceRow\(q, lang\);/);
  assert.match(source, /\$\{sourceRow\}/);
  assert.match(source, /questionProvenance/);
  assert.match(source, /quiz__provenance--\$\{provenance\}/);
});

test('static mock exam and review render per-question source citations', () => {
  const source = readSiteFile('site/practice.js');

  assert.match(source, /function sourceCitation\(question\)/);
  assert.match(source, /Källhänvisning saknas/);
  assert.match(source, /Source citation unavailable/);
  assert.match(
    source,
    /`Källa: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, s\. \$\{source\.page\}`/,
  );
  assert.match(
    source,
    /`Source: \$\{title\}, \$\{source\.chapter\}, \$\{source\.section\}, p\. \$\{source\.page\}`/,
  );
  assert.match(source, /function questionSourceRow\(question, citationClassName = "quiz__source"\)/);
  assert.match(source, /\$\{questionSourceRow\(q\)\}/);
  assert.match(
    source,
    /\$\{questionSourceRow\(q, "mock-review__source"\)\}/,
  );
  assert.match(source, /questionProvenance/);
  assert.match(source, /quiz__provenance--\$\{provenance\}/);
});

test('static source citation lines have dedicated styling', () => {
  const source = readSiteFile('site/styles.css');

  assert.match(source, /\.quiz__source\s*\{/);
  assert.match(source, /\.quiz__source-row\s*\{/);
  assert.match(source, /\.quiz__provenance\s*\{/);
  assert.match(source, /\.mock-review__source\s*\{/);
});
