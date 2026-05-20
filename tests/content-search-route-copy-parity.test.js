const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const searchRoutePath = path.join(repoRoot, 'app/search.tsx');

function readSearchRouteSource() {
  return fs.readFileSync(searchRoutePath, 'utf8');
}

function assertSearchRouteQuestionResults(source) {
  const requiredRules = [
    [/import \{ questions \} from '\.\.\/data\/questions';/, 'question bank import'],
    [/searchQuestions,/, 'question search helper import'],
    [/getQuestionSearchTitle,/, 'localized question title helper import'],
    [/getQuestionSearchExcerpt,/, 'localized question excerpt helper import'],
    [/getQuestionSearchChapterName,/, 'localized question chapter helper import'],
    [/const questionResults = useMemo\(\(\) => \{/, 'question results memo'],
    [/return searchQuestions\(\{/, 'searchQuestions call'],
    [/query: trimmedQuery,/, 'trimmed query passed to question search'],
    [/questions,/, 'question bank passed to question search'],
    [
      /copy\.filteredSummary\(filteredTerms\.length, termsWithChapters\.length, questionResults\.length\)/,
      'live summary includes question count',
    ],
    [/const title = getQuestionSearchTitle\(result\.question, language\);/, 'localized title use'],
    [
      /const excerpt = getQuestionSearchExcerpt\(result\.question, language\);/,
      'localized excerpt use',
    ],
    [/href=\{`\/quiz\/\$\{result\.question\.id\}`\}/, 'routed quiz question link'],
    [/questionSectionTitle: 'Övningsfrågor'/, 'Swedish question section copy'],
    [/questionSectionTitle: 'Practice questions'/, 'English question section copy'],
    [
      /openQuestionAccessibilityLabel: \(title\) => `Öppna övningsfrågan: \$\{title\}`/,
      'Swedish question link label',
    ],
    [
      /openQuestionAccessibilityLabel: \(title\) => `Open practice question: \$\{title\}`/,
      'English question link label',
    ],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `Search route missing ${label}`);
  }
}

function assertSearchRouteQueryHydration(source) {
  const requiredRules = [
    [/import \{ Link, useLocalSearchParams \} from 'expo-router';/, 'route params import'],
    [/type SearchRouteParams = \{/, 'route params type'],
    [/q\?: string \| string\[\];/, 'q param support'],
    [/query\?: string \| string\[\];/, 'query param support'],
    [
      /const searchParams = useLocalSearchParams<SearchRouteParams>\(\);/,
      'local search params read',
    ],
    [/const routeQuery = getRouteSearchQuery\(searchParams\);/, 'route query resolution'],
    [/const \[query, setQuery\] = useState\(\(\) => routeQuery\);/, 'route query initial state'],
    [/function getFirstSearchParamValue/, 'single-value route param helper'],
    [/Array\.isArray\(value\) \? value\[0\] : value/, 'array route param support'],
    [/function getRouteSearchQuery\(params: SearchRouteParams\)/, 'route query helper'],
    [
      /return getFirstSearchParamValue\(params\.q\) \|\| getFirstSearchParamValue\(params\.query\);/,
      'q then query fallback order',
    ],
    [/onChangeText=\{setQuery\}/, 'manual typing remains controlled'],
    [/onPress=\{\(\) => setQuery\(''\)\}/, 'clear search remains local'],
    [/value=\{query\}/, 'hydrated query reaches visible input'],
    [/const trimmedQuery = query\.trim\(\);/, 'hydrated query feeds filtering'],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `Search route missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /const \[query, setQuery\] = useState\(''\);/,
    'Search route must not ignore q/query route params by initializing blank',
  );
}

test('Search route hydrates q or query URL params before typing', () => {
  assertSearchRouteQueryHydration(readSearchRouteSource());
  assertSearchRouteQuestionResults(readSearchRouteSource());
});

test('Search route hydration rejects blank initial query drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'const [query, setQuery] = useState(() => routeQuery);',
    "const [query, setQuery] = useState('');",
  );

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /route query initial state/);
});

test('Search route hydration rejects dropping the query fallback param', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);',
    'return getFirstSearchParamValue(params.q);',
  );

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /q then query fallback/);
});

test('Search route question results reject dropping routed quiz links', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'href={`/quiz/${result.question.id}`}',
    'href="/(tabs)/learn"',
  );

  assert.throws(() => assertSearchRouteQuestionResults(mutatedSource), /routed quiz question link/);
});

test('Search route question results reject dropping ranked helper usage', () => {
  const mutatedSource = readSearchRouteSource().replace('return searchQuestions({', 'return [];');

  assert.throws(() => assertSearchRouteQuestionResults(mutatedSource), /searchQuestions call/);
});
