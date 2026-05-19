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
    /const sourceCitation = smtQuizEscapeHtml\(smtQuizSourceCitation\(q, lang\)\);/,
  );
  assert.match(source, /<p class="quiz__source">\$\{sourceCitation\}<\/p>/);
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
  assert.match(source, /<p class="quiz__source">\$\{escapeHtml\(sourceCitation\(q\)\)\}<\/p>/);
  assert.match(
    source,
    /<p class="mock-review__source">\$\{escapeHtml\(sourceCitation\(q\)\)\}<\/p>/,
  );
});

test('static source citation lines have dedicated styling', () => {
  const source = readSiteFile('site/styles.css');

  assert.match(source, /\.quiz__source\s*\{/);
  assert.match(source, /\.mock-review__source\s*\{/);
});
