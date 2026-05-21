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
  const questionCardTag = cardOpeningTags.find(
    (tag) => tag.includes('questionSummary') || tag.includes('copy.questionAccessibilityLabel'),
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
  assert.equal(
    questionCardTag,
    undefined,
    'question result Card must not group the nested routed question link',
  );

  assert.match(source, /const searchDescriptionId = 'search-route-glossary-description';/);
  assert.match(source, /nativeID=\{searchDescriptionId\}/);
  assert.match(source, /accessibilityHint=\{copy\.searchCardAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.searchInputAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.clearSearchAccessibilityLabel\}/);
  assert.match(source, /const termSummary = copy\.termAccessibilityLabel\(\{/);
  assert.match(source, /const termSummaryId = `search-term-summary-\$\{term\.id\}`;/);
  assert.match(source, /nativeID=\{termSummaryId\}/);
  assert.match(source, /aria-describedby=\{termSummaryId\}/);
  assert.match(source, /accessibilityLabel=\{copy\.openChapterAccessibilityLabel\(chapterName\)\}/);
  assert.match(source, /const questionSummary = copy\.questionAccessibilityLabel\(\{/);
  assert.match(
    source,
    /const questionSummaryId = `search-question-summary-\$\{result\.question\.id\}`;/,
  );
  assert.match(source, /nativeID=\{questionSummaryId\}/);
  assert.match(source, /aria-describedby=\{questionSummaryId\}/);
  assert.match(source, /accessibilityLabel=\{copy\.openQuestionAccessibilityLabel\(title\)\}/);
  assert.match(source, /href=\{`\/quiz\/\$\{result\.question\.id\}`\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /accessibilitySummaryText/);
  assert.match(source, /Övningsfrågor/);
  assert.match(source, /Practice questions/);
  assert.match(source, /No terms match your search/);
  assert.match(source, /Inga begrepp matchar din sökning/);
}

function assertSearchRouteLinkTargetParity(source) {
  const requiredTargetRules = [
    [
      /chapterLink:\s*\{[\s\S]*minHeight:\s*space\[6\][\s\S]*paddingVertical:\s*space\[1\]/,
      'glossary chapter link target',
    ],
    [
      /questionLink:\s*\{[\s\S]*minHeight:\s*space\[6\][\s\S]*paddingVertical:\s*space\[1\]/,
      'practice question link target',
    ],
    [
      /backLink:\s*\{[\s\S]*borderRadius:\s*radius\.pill[\s\S]*minHeight:\s*space\[6\][\s\S]*paddingHorizontal:\s*space\[1\.5\][\s\S]*paddingVertical:\s*space\[1\]/,
      'bottom Browse chapters link target',
    ],
  ];

  for (const [pattern, label] of requiredTargetRules) {
    assert.match(source, pattern, `Search route missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /(chapterLink|questionLink|backLink):\s*\{[\s\S]*minHeight:\s*space\[5\]/,
    'Search route links must not keep 40px target sizing',
  );
}

test('search route keeps grouped Cards away from interactive descendants', () => {
  const source = readSearchRoute();

  assertSearchRouteAccessibilityParity(source);
  assertSearchRouteLinkTargetParity(source);
});

test('search route accessibility parity rejects a grouped search form Card', () => {
  const mutatedSource = readSearchRoute().replace(
    '<Card themeColors={themeColors}>',
    '<Card accessible accessibilityLabel={copy.searchCardAccessibilityLabel} themeColors={themeColors}>',
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

test('search route accessibility parity rejects grouped question result Cards', () => {
  const mutatedSource = readSearchRoute().replace(
    'style={styles.questionCard}',
    'accessible accessibilityLabel={questionSummary} style={styles.questionCard}',
  );

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /question result Card must not group the nested routed question link/,
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

test('search route accessibility parity rejects undersized result links', () => {
  const mutatedSource = readSearchRoute().replace(
    '      minHeight: space[6],\n      paddingHorizontal: space[1.25],\n      paddingVertical: space[1],',
    '      minHeight: space[5],\n      paddingHorizontal: space[1.25],\n      paddingVertical: space[0.75],',
  );

  assert.throws(
    () => assertSearchRouteLinkTargetParity(mutatedSource),
    /Search route links must not keep 40px target sizing/,
  );
});

test('search route accessibility parity rejects an unstyled Browse chapters link target', () => {
  const mutatedSource = readSearchRoute().replace(
    /backLink:\s*\{[\s\S]*?textDecorationLine:\s*'none',\n    \},/,
    "backLink: {\n      alignSelf: 'flex-start',\n      color: themeColors.accent,\n      fontFamily: typography.navButton.fontFamily,\n      fontSize: typography.navButton.fontSize,\n      fontWeight: typography.navButton.fontWeight,\n      textDecorationLine: 'none',\n    },",
  );

  assert.throws(
    () => assertSearchRouteLinkTargetParity(mutatedSource),
    /Search route missing bottom Browse chapters link target/,
  );
});
