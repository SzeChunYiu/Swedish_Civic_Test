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
  assert.match(source, /href=\{getQuestionResultHref\(result\.question\.id, trimmedQuery\)\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /function SearchRouteLink\(/);
  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /onMouseEnter:\s*\(\) => \{/);
  assert.match(source, /onMouseLeave:\s*\(\) => \{/);
  assert.match(source, /onMouseDown:\s*\(\) => \{/);
  assert.match(source, /onMouseUp:\s*\(\) => \{/);
  assert.match(source, /onFocus:\s*\(\) => \{/);
  assert.match(source, /onPressIn=\{\(\) => \{/);
  assert.match(source, /styles\.routeLinkInteractive/);
  assert.match(source, /styles\.routeLinkPressed/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(
    source,
    /isFocused \|\| isHovered[\s\S]*styles\.routeLinkInteractiveReducedMotion[\s\S]*styles\.routeLinkInteractive/,
  );
  assert.match(
    source,
    /isPressed[\s\S]*styles\.routeLinkPressedReducedMotion[\s\S]*styles\.routeLinkPressed/,
  );
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.match(source, /transform:\s*\[\{ scale: motion\.hoverScale \}\]/);
  assert.match(source, /transform:\s*\[\{ scale: motion\.pressedScale \}\]/);
  assert.match(
    source,
    /<SearchRouteLink[\s\S]*aria-describedby=\{termSummaryId\}[\s\S]*linkStyle=\{styles\.chapterLink\}/,
  );
  assert.match(
    source,
    /<SearchRouteLink[\s\S]*aria-describedby=\{questionSummaryId\}[\s\S]*linkStyle=\{styles\.questionLink\}/,
  );
  assert.match(
    source,
    /<SearchRouteLink[\s\S]*accessibilityLabel=\{copy\.browseChaptersAccessibilityLabel\}[\s\S]*linkStyle=\{styles\.backLink\}/,
  );
  assert.doesNotMatch(
    source,
    /<Link[\s\S]{0,220}style=\{styles\.(?:chapterLink|questionLink|backLink)\}/,
    'Search route links must use SearchRouteLink feedback wrapper instead of direct Link styling',
  );
  assert.match(source, /accessibilitySummaryText/);
  assert.match(source, /Övningsfrågor/);
  assert.match(source, /Practice questions/);
  assert.match(source, /No terms match your search/);
  assert.match(source, /Inga begrepp matchar din sökning/);
}

test('search route keeps grouped Cards away from interactive descendants', () => {
  assertSearchRouteAccessibilityParity(readSearchRoute());
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

test('search route accessibility parity rejects missing route link pressed feedback', () => {
  const mutatedSource = readSearchRoute()
    .replace(/    routeLinkInteractive: \{[\s\S]*?    \},\n/, '')
    .replace(/    routeLinkPressed: \{[\s\S]*?    \},\n/, '');

  assert.throws(
    () => assertSearchRouteAccessibilityParity(mutatedSource),
    /routeLinkInteractive|routeLinkPressed/,
  );
});
