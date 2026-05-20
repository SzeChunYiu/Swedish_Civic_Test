const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const searchRoutePath = path.join(repoRoot, 'app/search.tsx');

function readSearchRoute() {
  return fs.readFileSync(searchRoutePath, 'utf8');
}

function collectOpeningTags(source, tagName) {
  const lines = source.split('\n');
  const tags = [];

  lines.forEach((line, startIndex) => {
    if (!line.includes(`<${tagName}`)) return;

    let tag = '';
    for (let index = startIndex; index < lines.length; index += 1) {
      tag += `\n${lines[index]}`;
      if (lines[index].includes('>')) break;
    }
    tags.push(tag);
  });

  return tags;
}

function assertSearchRouteAccessibilityParity(source) {
  const cardOpeningTags = collectOpeningTags(source, 'Card');
  const searchCardTag = cardOpeningTags.find((tag) =>
    tag.includes('copy.searchCardAccessibilityLabel'),
  );
  const termCardTag = cardOpeningTags.find(
    (tag) => tag.includes('termSummary') || tag.includes('copy.termAccessibilityLabel'),
  );

  assert.equal(
    searchCardTag,
    undefined,
    'search form Card must not be an accessible grouped parent',
  );
  assert.equal(
    termCardTag,
    undefined,
    'glossary result Card must not group the nested chapter link',
  );

  assert.match(source, /const searchDescriptionId = 'search-route-glossary-description';/);
  assert.match(source, /nativeID=\{searchDescriptionId\}/);
  assert.match(source, /accessibilityHint=\{copy\.searchCardAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.searchInputAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.clearSearchAccessibilityLabel\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /const termSummary = copy\.termAccessibilityLabel\(\{/);
  assert.match(source, /const termSummaryId = `search-term-summary-\$\{term\.id\}`;/);
  assert.match(source, /nativeID=\{termSummaryId\}/);
  assert.match(source, /aria-describedby=\{termSummaryId\}/);
  assert.match(source, /accessibilityLabel=\{copy\.openChapterAccessibilityLabel\(chapterName\)\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /accessibilitySummaryText/);
  assert.match(source, /No terms match your search/);
  assert.match(source, /Inga begrepp matchar din sökning/);
}

test('search route keeps grouped Cards away from interactive descendants', () => {
  assertSearchRouteAccessibilityParity(readSearchRoute());
});

test('search route accessibility parity rejects a grouped search form Card', () => {
  const mutatedSource = readSearchRoute().replace(
    '<Card>',
    '<Card accessible accessibilityLabel={copy.searchCardAccessibilityLabel}>',
  );

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /search form Card must not be an accessible grouped parent/,
  );
});

test('search route accessibility parity rejects grouped glossary result Cards', () => {
  const mutatedSource = readSearchRoute().replace(
    'style={styles.termCard}',
    'accessible accessibilityLabel={termSummary} style={styles.termCard}',
  );

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /glossary result Card must not group the nested chapter link/,
  );
});

test('search route accessibility parity rejects dropped term summary text', () => {
  const mutatedSource = readSearchRoute().replace(
    'const termSummary = copy.termAccessibilityLabel({',
    'const termSummary = String({',
  );

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /termAccessibilityLabel/,
  );
});

test('search route accessibility parity rejects a non-announced result summary', () => {
  const mutatedSource = readSearchRoute()
    .replace('accessibilityLiveRegion="polite"', '')
    .replace('aria-live="polite"', '');

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /accessibilityLiveRegion/,
  );
});
