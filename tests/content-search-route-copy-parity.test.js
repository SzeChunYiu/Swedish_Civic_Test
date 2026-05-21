const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const searchRoutePath = path.join(repoRoot, 'app/search.tsx');
const searchQueryHydrationE2ePath = path.join(repoRoot, 'tests/e2e/search-query-hydration.spec.ts');
const glossarySearchPath = path.join(repoRoot, 'lib/learning/glossarySearch.ts');
const questionSearchPath = path.join(repoRoot, 'lib/search/questionSearch.ts');
const validateContentPath = path.join(repoRoot, 'scripts/validate-content.js');

function readSearchRouteSource() {
  return fs.readFileSync(searchRoutePath, 'utf8');
}

function readGlossarySearchSource() {
  return fs.readFileSync(glossarySearchPath, 'utf8');
}

function readQuestionSearchSource() {
  return fs.readFileSync(questionSearchPath, 'utf8');
}

function readSearchQueryHydrationE2eSource() {
  return fs.readFileSync(searchQueryHydrationE2ePath, 'utf8');
}

function getExpectedSearchRouteFocusedRuleCount() {
  const source = fs.readFileSync(validateContentPath, 'utf8');
  const match = source.match(
    /const EXPECTED_SEARCH_ROUTE_QUERY_HYDRATION_RULES = Object\.freeze\(\[([\s\S]*?)\]\);/,
  );

  assert.ok(match, 'validate-content must declare focused Search route rules');

  return (match[1].match(/\bmessage:/g) ?? []).length;
}

function getExpectedSearchQuestionPunctuationRuleCount() {
  const source = fs.readFileSync(validateContentPath, 'utf8');
  const match = source.match(
    /function validateSearchQuestionPunctuationParity\(\) \{[\s\S]*?const punctuationRules = \[([\s\S]*?)\];/,
  );

  assert.ok(match, 'validate-content must declare focused Search punctuation rules');

  return (match[1].match(/\blabel:/g) ?? []).length;
}

function parseValidationSummary(output) {
  const jsonStart = output.indexOf('{');

  assert.notEqual(jsonStart, -1, 'validate-content output must include a JSON summary');

  return JSON.parse(output.slice(jsonStart));
}

function assertSearchRouteQuestionResults(source) {
  const requiredRules = [
    [
      /import \{ ProvenanceBadge \} from '\.\.\/components\/quiz\/ProvenanceBadge';/,
      'provenance badge import',
    ],
    [/getProvenanceDescription,/, 'provenance description helper import'],
    [/getProvenanceLabel,/, 'provenance label helper import'],
    [/getQuestionProvenance,/, 'provenance helper import'],
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
      /copy\.filteredSummary\(filteredTerms\.length, glossaryTerms\.length, questionResults\.length\)/,
      'live summary includes question count',
    ],
    [/const title = getQuestionSearchTitle\(result\.question, language\);/, 'localized title use'],
    [
      /const excerpt = getQuestionSearchExcerpt\(result\.question, language\);/,
      'localized excerpt use',
    ],
    [
      /const provenance = getQuestionProvenance\(result\.question\);/,
      'question provenance derivation',
    ],
    [
      /const provenanceLabel = getProvenanceLabel\(provenance, language\);/,
      'localized provenance label',
    ],
    [
      /const provenanceDescription = getProvenanceDescription\(provenance, language\);/,
      'localized provenance source note',
    ],
    [/provenanceLabel,/, 'provenance label included in accessible summary'],
    [/provenanceDescription,/, 'provenance description included in accessible summary'],
    [
      /<ProvenanceBadge\s+language=\{language\}\s+question=\{result\.question\}\s+themeColors=\{themeColors\}\s+\/>/,
      'visible theme-aware provenance badge',
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

function assertSearchRouteGlossarySearchParity(source) {
  const requiredRules = [
    [
      /import \{ searchGlossary \} from '\.\.\/lib\/learning\/glossarySearch';/,
      'shared glossary search import',
    ],
    [
      /searchGlossary\(trimmedQuery, language, glossaryTerms\.length\)\.map\(\(term\) => \(\{/,
      'shared glossary search call with full result limit',
    ],
    [
      /chapterName: language === 'en' \? term\.chapterNameEn : term\.chapterNameSv,/,
      'localized shared glossary chapter label',
    ],
    [/copy\.allTermsSummary\(glossaryTerms\.length\)/, 'total glossary count summary'],
    [/href=\{`\/chapter\/\$\{term\.chapterId\}`\}/, 'glossary chapter link'],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `Search route missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /function normalizeSearchText/,
    'Search route must not use a route-local glossary normalizer',
  );
  assert.doesNotMatch(
    source,
    /glossaryTermMatchesQuery/,
    'Search route must not fork glossary filtering away from searchGlossary()',
  );
}

function assertSharedGlossaryPunctuationNormalizer(source) {
  assert.match(
    source,
    /export function normalizeGlossarySearchText\(value: string\)/,
    'shared glossary normalizer must be exported for route parity',
  );
  assert.ok(
    source.includes(".replace(/[^a-z0-9\\s-]/g, ' ')"),
    'shared glossary normalizer must replace punctuation with spaces',
  );
  assert.ok(
    source.includes(".replace(/\\s+/g, ' ')"),
    'shared glossary normalizer must collapse punctuation-created whitespace',
  );
}

function assertQuestionSearchPunctuationNormalizer(source) {
  const requiredRules = [
    [
      /import \{ normalizeGlossarySearchText \} from '\.\.\/learning\/glossarySearch';/,
      'shared glossary normalizer import',
    ],
    [/const normalizedQuery = normalizeGlossarySearchText\(query\);/, 'normalized query'],
    [/const normalizedValue = normalizeGlossarySearchText\(value\);/, 'normalized weighted field'],
    [
      /searchableFields\(question, chapter\)\.map\(normalizeGlossarySearchText\)\.join\(' '\)/,
      'normalized token haystack',
    ],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `Question search missing ${label}`);
  }

  assert.doesNotMatch(
    source,
    /function normalizeSearchText/,
    'Question search must not keep a private punctuation-preserving normalizer',
  );
  assert.doesNotMatch(
    source,
    /\.normalize\('NFD'\)[\s\S]*?\.trim\(\);/,
    'Question search must not fork accent-only normalization away from glossary search',
  );
}

function assertSearchRouteQueryHydration(source) {
  const requiredRules = [
    [
      /import \{ Link, useLocalSearchParams, useRouter \} from 'expo-router';/,
      'route params and router import',
    ],
    [/type SearchRouteParams = \{/, 'route params type'],
    [/q\?: string \| string\[\];/, 'q param support'],
    [/query\?: string \| string\[\];/, 'query param support'],
    [/const router = useRouter\(\);/, 'router replacement hook'],
    [
      /const searchParams = useLocalSearchParams<SearchRouteParams>\(\);/,
      'local search params read',
    ],
    [/const routeQuery = getRouteSearchQuery\(searchParams\);/, 'route query resolution'],
    [/const \[query, setQuery\] = useState\(\(\) => routeQuery\);/, 'route query initial state'],
    [/const previousRouteQueryRef = useRef\(routeQuery\);/, 'route query sync ref'],
    [/useEffect\(\(\) => \{/, 'route query sync effect'],
    [/if \(previousRouteQueryRef\.current === routeQuery\) return;/, 'unchanged route query guard'],
    [/previousRouteQueryRef\.current = routeQuery;/, 'route query sync ref update'],
    [/setQuery\(routeQuery\);/, 'route query state resync'],
    [/\}, \[routeQuery\]\);/, 'route query sync dependency'],
    [/function getFirstSearchParamValue/, 'single-value route param helper'],
    [/Array\.isArray\(value\) \? value\[0\] : value/, 'array route param support'],
    [/function getRouteSearchQuery\(params: SearchRouteParams\)/, 'route query helper'],
    [
      /return getFirstSearchParamValue\(params\.q\) \|\| getFirstSearchParamValue\(params\.query\);/,
      'q then query fallback order',
    ],
    [/onChangeText=\{setQuery\}/, 'manual typing remains controlled'],
    [/const handleClearSearch = \(\) => \{/, 'clear search handler'],
    [/setQuery\(''\);/, 'clear search state reset'],
    [/router\.replace\('\/search'\);/, 'clear search URL replacement'],
    [/onPress=\{handleClearSearch\}/, 'clear search uses URL-aware handler'],
    [/const handleSubmitSearch = \(\) => \{/, 'submit search handler'],
    [/const submittedQuery = query\.trim\(\);/, 'submit trims typed query'],
    [
      /if \(submittedQuery\.length === 0\) \{[\s\S]*handleClearSearch\(\);/,
      'empty submit clears URL state',
    ],
    [/setQuery\(submittedQuery\);/, 'submitted query normalizes visible input'],
    [
      /router\.replace\(`\/search\?q=\$\{encodeURIComponent\(submittedQuery\)\}`\);/,
      'non-empty submit writes q URL param',
    ],
    [/onSubmitEditing=\{handleSubmitSearch\}/, 'search return key submits query'],
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

test('Search route hydrates and resyncs q or query URL params around typing', () => {
  const source = readSearchRouteSource();

  assertSearchRouteQueryHydration(source);
  assertSearchRouteQuestionResults(source);
  assertSearchRouteGlossarySearchParity(source);
  assertSharedGlossaryPunctuationNormalizer(readGlossarySearchSource());
  assertQuestionSearchPunctuationNormalizer(readQuestionSearchSource());
});

test('Search route e2e covers mounted query-param navigation without reload', () => {
  const source = readSearchQueryHydrationE2eSource();

  assert.match(source, /search route resyncs when URL query params change after mount/);
  assert.match(source, /window\.history\.pushState\(\{\}, '', '\/search\?query=kommun'\)/);
  assert.match(source, /window\.dispatchEvent\(new PopStateEvent\('popstate'\)\)/);
  assert.match(source, /await input\.fill\('egen text'\)/);
  assert.match(source, /await expectSearchState\(page, 'kommun'\)/);
  assert.match(source, /await expect\(page\)\.toHaveURL\(\/\\\/search\$\/\)/);
  assert.match(source, /await input\.fill\('lokal text'\)/);
});

test('validate-content reports Search route query hydration parity', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-search-route-query-hydration'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);

  assert.deepEqual(Object.keys(summary).sort(), [
    'searchQuestionPunctuationParityValidated',
    'searchQuestionPunctuationRulesValidated',
    'searchRouteQueryHydrationParityValidated',
    'searchRouteQueryHydrationRulesValidated',
  ]);
  assert.equal(
    summary.searchRouteQueryHydrationRulesValidated,
    getExpectedSearchRouteFocusedRuleCount(),
  );
  assert.equal(summary.searchRouteQueryHydrationParityValidated, true);
  assert.equal(
    summary.searchQuestionPunctuationRulesValidated,
    getExpectedSearchQuestionPunctuationRuleCount(),
  );
  assert.equal(summary.searchQuestionPunctuationParityValidated, true);
});

test('Search route hydration rejects blank initial query drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'const [query, setQuery] = useState(() => routeQuery);',
    "const [query, setQuery] = useState('');",
  );

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /route query initial state/);
});

test('Search route hydration rejects mounted route-param sync drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    /  const previousRouteQueryRef = useRef\(routeQuery\);\n[\s\S]*?  \}, \[routeQuery\]\);\n/,
    '',
  );

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /route query sync ref/);
});

test('Search route hydration rejects overwriting local typing without a route-param change', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'if (previousRouteQueryRef.current === routeQuery) return;',
    '',
  );

  assert.throws(
    () => assertSearchRouteQueryHydration(mutatedSource),
    /unchanged route query guard/,
  );
});

test('Search route hydration rejects leaving clear search local-only', () => {
  const mutatedSource = readSearchRouteSource()
    .replace("router.replace('/search');", '')
    .replace('onPress={handleClearSearch}', "onPress={() => setQuery('')}");

  assert.throws(
    () => assertSearchRouteQueryHydration(mutatedSource),
    /clear search URL replacement/,
  );
});

test('Search route hydration rejects missing explicit submit URL state', () => {
  const mutatedSource = readSearchRouteSource()
    .replace(
      /  const handleSubmitSearch = \(\) => \{[\s\S]*?  \};\n  const trimmedQuery = query\.trim\(\);\n/,
      '  const trimmedQuery = query.trim();\n',
    )
    .replace('          onSubmitEditing={handleSubmitSearch}\n', '');

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /submit search handler/);
});

test('Search route hydration rejects local-only submitted query drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'router.replace(`/search?q=${encodeURIComponent(submittedQuery)}`);',
    '',
  );

  assert.throws(
    () => assertSearchRouteQueryHydration(mutatedSource),
    /non-empty submit writes q URL param/,
  );
});

test('Search route hydration rejects dropping the query fallback param', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);',
    'return getFirstSearchParamValue(params.q);',
  );

  assert.throws(() => assertSearchRouteQueryHydration(mutatedSource), /q then query fallback/);
});

test('Search route glossary results reject route-local punctuation normalization drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'searchGlossary(trimmedQuery, language, glossaryTerms.length).map((term) => ({',
    'glossaryTerms.map((term) => ({',
  );

  assert.throws(
    () => assertSearchRouteGlossarySearchParity(mutatedSource),
    /shared glossary search call/,
  );
});

test('Shared glossary normalizer rejects dropping punctuation stripping', () => {
  const mutatedSource = readGlossarySearchSource().replace(".replace(/[^a-z0-9\\s-]/g, ' ')", '');

  assert.throws(
    () => assertSharedGlossaryPunctuationNormalizer(mutatedSource),
    /replace punctuation/,
  );
});

test('Question search rejects route-local punctuation-preserving normalization drift', () => {
  const mutatedSource = readQuestionSearchSource()
    .replace("import { normalizeGlossarySearchText } from '../learning/glossarySearch';\n", '')
    .replace(
      'const normalizedQuery = normalizeGlossarySearchText(query);',
      'const normalizedQuery = normalizeSearchText(query);',
    )
    .replace(
      'const normalizedValue = normalizeGlossarySearchText(value);',
      'const normalizedValue = normalizeSearchText(value);',
    )
    .replace(
      "const haystack = searchableFields(question, chapter).map(normalizeGlossarySearchText).join(' ');",
      "const haystack = searchableFields(question, chapter).map(normalizeSearchText).join(' ');",
    )
    .replace(
      'function searchableFields(question: PracticeQuestion, chapter: Chapter | undefined): string[] {',
      "function normalizeSearchText(value: string): string {\n  return value\n    .normalize('NFD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .toLocaleLowerCase('sv-SE')\n    .trim();\n}\n\nfunction searchableFields(question: PracticeQuestion, chapter: Chapter | undefined): string[] {",
    );

  assert.throws(
    () => assertQuestionSearchPunctuationNormalizer(mutatedSource),
    /shared glossary normalizer/,
  );
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

test('Search route question results reject dropping provenance badges', () => {
  const mutatedSource = readSearchRouteSource().replace(
    /<ProvenanceBadge\s+language=\{language\}\s+question=\{result\.question\}\s+themeColors=\{themeColors\}\s+\/>/,
    '',
  );

  assert.throws(
    () => assertSearchRouteQuestionResults(mutatedSource),
    /visible theme-aware provenance badge/,
  );
});

test('Search route question results reject light-theme provenance badges in dark mode', () => {
  const mutatedSource = readSearchRouteSource().replace(
    '                      themeColors={themeColors}\n',
    '',
  );

  assert.throws(
    () => assertSearchRouteQuestionResults(mutatedSource),
    /visible theme-aware provenance badge/,
  );
});
