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
  assert.match(source, /import \{ RouteLink \} from '\.\.\/components\/ui\/RouteLink';/);
  assert.doesNotMatch(source, /function SearchRouteLink\(/);
  assert.doesNotMatch(source, /Platform\.OS === 'web'/);
  assert.doesNotMatch(source, /useReducedMotion/);
  assert.match(source, /searchRouteLink: \{/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.match(
    source,
    /<RouteLink[\s\S]*aria-describedby=\{termSummaryId\}[\s\S]*style=\{\[styles\.searchRouteLink, styles\.chapterLink\]\}[\s\S]*variant="secondary"/,
  );
  assert.match(
    source,
    /<RouteLink[\s\S]*aria-describedby=\{questionSummaryId\}[\s\S]*style=\{\[styles\.searchRouteLink, styles\.questionLink\]\}[\s\S]*variant="secondary"/,
  );
  assert.match(
    source,
    /<RouteLink[\s\S]*accessibilityLabel=\{copy\.browseChaptersAccessibilityLabel\}[\s\S]*style=\{\[styles\.searchRouteLink, styles\.backLink\]\}[\s\S]*variant="text"/,
  );
  assert.doesNotMatch(
    source,
    /<Link[\s\S]{0,220}style=\{styles\.(?:chapterLink|questionLink|backLink)\}/,
    'Search route links must use shared RouteLink instead of direct Link styling',
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

test('search route accessibility parity rejects dropping shared RouteLink', () => {
  const mutatedSource = readSearchRoute().replace(
    "import { RouteLink } from '../components/ui/RouteLink';\n",
    '',
  );

  assert.throws(() => assertSearchRouteAccessibilityParity(mutatedSource), /RouteLink/);
});
