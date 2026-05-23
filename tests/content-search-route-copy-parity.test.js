const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const searchRoutePath = path.join(repoRoot, 'app/search.tsx');
const searchQueryHydrationE2ePath = path.join(repoRoot, 'tests/e2e/search-query-hydration.spec.ts');
const themeModeUtilityE2ePath = path.join(repoRoot, 'tests/e2e/theme-mode-utility-routes.spec.ts');
const glossarySearchPath = path.join(repoRoot, 'lib/learning/glossarySearch.ts');
const questionSearchPath = path.join(repoRoot, 'lib/search/questionSearch.ts');
const searchTextNormalizationPath = path.join(repoRoot, 'lib/search/textNormalization.ts');
const validateContentPath = path.join(repoRoot, 'scripts/validate-content.js');
const moduleCache = new Map();

function readSearchRouteSource() {
  return fs.readFileSync(searchRoutePath, 'utf8');
}

function readGlossarySearchSource() {
  return fs.readFileSync(glossarySearchPath, 'utf8');
}

function readQuestionSearchSource() {
  return fs.readFileSync(questionSearchPath, 'utf8');
}

function readSearchTextNormalizationSource() {
  return fs.readFileSync(searchTextNormalizationPath, 'utf8');
}

function readSearchQueryHydrationE2eSource() {
  return fs.readFileSync(searchQueryHydrationE2ePath, 'utf8');
}

function readThemeModeUtilityE2eSource() {
  return fs.readFileSync(themeModeUtilityE2ePath, 'utf8');
}

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filePath,
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
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

function runFocusedSearchRouteQueryHydrationValidation() {
  return spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-search-route-query-hydration'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

function withMutatedSearchRouteSource(mutateSource, callback) {
  const originalSource = readSearchRouteSource();
  const mutatedSource = mutateSource(originalSource);

  assert.notEqual(
    mutatedSource,
    originalSource,
    'Search route mutation fixture must change source',
  );
  fs.writeFileSync(searchRoutePath, mutatedSource);

  try {
    return callback();
  } finally {
    fs.writeFileSync(searchRoutePath, originalSource);
  }
}

function assertFocusedSearchRouteQueryHydrationRejects({ expectedFailure, label, mutateSource }) {
  withMutatedSearchRouteSource(mutateSource, () => {
    const result = runFocusedSearchRouteQueryHydrationValidation();
    const output = `${result.stdout}\n${result.stderr}`;

    assert.notEqual(
      result.status,
      0,
      `focused Search route query hydration validation must reject ${label}`,
    );
    assert.match(output, expectedFailure, `focused validation failure should name ${label}`);
  });
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
    [/searchQuestionsWithTotal,/, 'question search helper import'],
    [/getQuestionSearchTitle,/, 'localized question title helper import'],
    [/getQuestionSearchExcerpt,/, 'localized question excerpt helper import'],
    [/getQuestionSearchChapterName,/, 'localized question chapter helper import'],
    [/const questionSearchResults = useMemo\(\(\) => \{/, 'question results memo'],
    [/return searchQuestionsWithTotal\(\{/, 'searchQuestionsWithTotal call'],
    [/const questionResults = questionSearchResults\.results;/, 'capped visible question results'],
    [/const totalQuestionMatches = questionSearchResults\.totalCount;/, 'total question matches'],
    [/query: trimmedQuery,/, 'trimmed query passed to question search'],
    [/questions,/, 'question bank passed to question search'],
    [
      /copy\.filteredSummary\(filteredTerms\.length, glossaryTerms\.length, totalQuestionMatches\)/,
      'live summary includes total question count',
    ],
    [
      /copy\.questionSectionSubtitle\(questionResults\.length, totalQuestionMatches\)/,
      'question section subtitle compares visible and total question counts',
    ],
    [
      /`\$\{visibleCount\} av \$\{totalCount\} källbaserade övningsfrågor visas`/,
      'Swedish visible of total question subtitle copy',
    ],
    [
      /`\$\{visibleCount\} of \$\{totalCount\} source-backed practice questions shown`/,
      'English visible of total question subtitle copy',
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
    [
      /function getQuestionResultHref\(questionId: string, query: string\)/,
      'shared routed quiz question href helper',
    ],
    [
      /href=\{getQuestionResultHref\(result\.question\.id, trimmedQuery\)\}/,
      'routed quiz question link',
    ],
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

function assertNeutralSearchPunctuationNormalizer(source) {
  assert.match(
    source,
    /export function normalizeSearchResultLimit\(\s*limit: unknown,\s*defaultLimit: number,\s*\): number \| undefined/,
    'shared search limit normalizer must be exported',
  );
  assert.match(
    source,
    /limit === Number\.POSITIVE_INFINITY/,
    'shared search limit normalizer must support explicit unlimited caps',
  );
  assert.match(
    source,
    /typeof limit === 'number' && Number\.isInteger\(limit\) && limit >= 0/,
    'shared search limit normalizer must accept only non-negative integer caps',
  );
  assert.match(
    source,
    /export function normalizeSearchText\(value: string\)/,
    'neutral search text normalizer must be exported',
  );
  assert.ok(
    source.includes(".replace(/[^a-z0-9\\s-]/g, ' ')"),
    'neutral search normalizer must replace punctuation with spaces',
  );
  assert.ok(
    source.includes(".replace(/\\s+/g, ' ')"),
    'neutral search normalizer must collapse punctuation-created whitespace',
  );
}

function assertGlossarySearchCompatibilityExport(source) {
  assert.match(
    source,
    /import \{ normalizeSearchResultLimit, normalizeSearchText \} from '\.\.\/search\/textNormalization';/,
    'Glossary search must import neutral search normalization helpers',
  );
  assert.match(
    source,
    /export \{ normalizeSearchResultLimit \};/,
    'Glossary search must keep normalizeSearchResultLimit as a compatibility export',
  );
  assert.match(
    source,
    /export function normalizeGlossarySearchText\(value: string\)/,
    'Glossary search must keep normalizeGlossarySearchText as a compatibility export',
  );
  assert.match(
    source,
    /return normalizeSearchText\(value\);/,
    'Glossary normalizer compatibility export must delegate to the neutral helper',
  );
}

function assertQuestionSearchPunctuationNormalizer(source) {
  const requiredRules = [
    [/normalizeSearchText/, 'neutral search normalizer import'],
    [/normalizeSearchResultLimit,/, 'neutral search limit normalizer import'],
    [
      /import \{ normalizeSearchResultLimit, normalizeSearchText \} from '\.\/textNormalization';/,
      'neutral search helper import path',
    ],
    [/const normalizedLimit = normalizeSearchResultLimit\(limit, 12\);/, 'normalized limit'],
    [/const normalizedQuery = normalizeSearchText\(query\);/, 'normalized query'],
    [/const normalizedValue = normalizeSearchText\(value\);/, 'normalized weighted field'],
    [
      /searchableFields\(question, chapter\)\.map\(normalizeSearchText\)\.join\(' '\)/,
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
    /\.\.\/learning\/glossarySearch/,
    'Question search must not import glossary search just to normalize text',
  );
  assert.doesNotMatch(
    source,
    /\.slice\(0, limit\)/,
    'Question search must not pass runtime limits directly to Array.slice',
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
      /import \{ useLocalSearchParams, useRouter \} from 'expo-router';/,
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
    [/submitSearch: string;/, 'submit search visible copy type'],
    [/submitSearchAccessibilityLabel: string;/, 'submit search accessibility copy type'],
    [/submitSearch: 'Sök'/, 'Swedish submit search copy'],
    [
      /submitSearchAccessibilityLabel: 'Sök med den inskrivna texten'/,
      'Swedish submit search accessibility label',
    ],
    [/submitSearch: 'Search'/, 'English submit search copy'],
    [
      /submitSearchAccessibilityLabel: 'Submit the typed search'/,
      'English submit search accessibility label',
    ],
    [
      /accessibilityLabel=\{copy\.submitSearchAccessibilityLabel\}[\s\S]*?accessibilityState=\{\{ disabled: trimmedQuery\.length === 0 \}\}[\s\S]*?disabled=\{trimmedQuery\.length === 0\}[\s\S]*?onPress=\{handleSubmitSearch\}[\s\S]*?\{copy\.submitSearch\}/,
      'visible submit button uses normalized submit path with disabled state',
    ],
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
  assertNeutralSearchPunctuationNormalizer(readSearchTextNormalizationSource());
  assertGlossarySearchCompatibilityExport(readGlossarySearchSource());
  assertQuestionSearchPunctuationNormalizer(readQuestionSearchSource());
});

test('Search helpers normalize malformed runtime result limits', () => {
  const { chapters } = loadTs('data/chapters.ts');
  const { questions } = loadTs('data/questions.ts');
  const { searchGlossary } = loadTs('lib/learning/glossarySearch.ts');
  const { searchQuestions, searchQuestionsWithTotal } = loadTs('lib/search/questionSearch.ts');

  const questionSearchInput = { chapters, query: 'riksdag', questions };
  const defaultQuestionResults = searchQuestions(questionSearchInput);
  const defaultQuestionIds = defaultQuestionResults.map((result) => result.question.id);

  assert.equal(defaultQuestionResults.length, 12);
  assert.deepEqual(
    searchQuestions({ ...questionSearchInput, limit: 0 }).map((result) => result.question.id),
    [],
  );
  assert.deepEqual(
    searchQuestions({ ...questionSearchInput, limit: 1 }).map((result) => result.question.id),
    defaultQuestionIds.slice(0, 1),
  );
  assert.ok(
    searchQuestions({ ...questionSearchInput, limit: Number.POSITIVE_INFINITY }).length >
      defaultQuestionResults.length,
  );

  for (const malformedLimit of [-1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY, '3', null]) {
    assert.deepEqual(
      searchQuestions({ ...questionSearchInput, limit: malformedLimit }).map(
        (result) => result.question.id,
      ),
      defaultQuestionIds,
      `question limit ${String(malformedLimit)} should fall back to default`,
    );
  }

  const cappedQuestionResults = searchQuestionsWithTotal({ ...questionSearchInput, limit: 8 });
  assert.equal(cappedQuestionResults.results.length, 8);
  assert.ok(
    cappedQuestionResults.totalCount > cappedQuestionResults.results.length,
    'question search total count must keep the full match count when visible results are capped',
  );
  assert.equal(
    cappedQuestionResults.totalCount,
    searchQuestions({ ...questionSearchInput, limit: Number.POSITIVE_INFINITY }).length,
    'question search total count must match the unlimited result count',
  );

  const defaultGlossaryResults = searchGlossary('', 'en');
  const defaultGlossaryIds = defaultGlossaryResults.map((term) => term.id);

  assert.equal(defaultGlossaryResults.length, 10);
  assert.deepEqual(
    searchGlossary('', 'en', 0).map((term) => term.id),
    [],
  );
  assert.deepEqual(
    searchGlossary('', 'en', 1).map((term) => term.id),
    defaultGlossaryIds.slice(0, 1),
  );
  assert.ok(
    searchGlossary('', 'en', Number.POSITIVE_INFINITY).length > defaultGlossaryResults.length,
  );

  for (const malformedLimit of [-1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY, '3', null]) {
    assert.deepEqual(
      searchGlossary('', 'en', malformedLimit).map((term) => term.id),
      defaultGlossaryIds,
      `glossary limit ${String(malformedLimit)} should fall back to default`,
    );
  }
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

test('Search route e2e covers q-before-query both-param precedence', () => {
  const source = readSearchQueryHydrationE2eSource();

  assert.match(
    source,
    /search route keeps q before query precedence for both params on load and mounted navigation/,
  );
  assert.match(
    source,
    /expectHydratedSearch\([\s\S]*?'\/search\?query=kommun&q=riksdag'[\s\S]*?'riksdag'/,
  );
  assert.match(
    source,
    /await page\.getByRole\('button', \{ name: searchStateCopy\.sv\.clearButtonName \}\)\.click\(\)/,
  );
  assert.match(source, /expectSearchUrlWithoutQueryParams\(page\)/);
  assert.match(source, /expectHydratedSearch\(page, '\/search\?q=demokrati', 'demokrati'\)/);
  assert.match(source, /await mountedInput\.fill\('lokal text'\)/);
  assert.match(
    source,
    /window\.history\.pushState\(\{\}, '', '\/search\?query=kommun&q=riksdag'\)/,
  );
  assert.match(source, /window\.dispatchEvent\(new PopStateEvent\('popstate'\)\)/);
  assert.match(source, /await expectSearchState\(page, 'riksdag'\)/);
});

test('Search route e2e covers English query URL clearing', () => {
  const source = readSearchQueryHydrationE2eSource();

  assert.match(
    source,
    /English search route hydrates and clears q\/query URL parameters before typing/,
  );
  assert.match(source, /type SearchStateCopy = \{/);
  assert.match(source, /inputName: 'Search civic terms and practice questions'/);
  assert.match(source, /clearButtonName: 'Clear the search field'/);
  assert.match(source, /submitButtonName: 'Submit the typed search'/);
  assert.match(source, /allTermsSummaryPattern: \/\\d\+ civic reference terms\//);
  assert.match(source, /questionLinkName: \/Open practice question:\//);
  assert.match(source, /await seedSettingsLanguage\(page, 'en'\)/);
  assert.match(
    source,
    /expectHydratedSearch\([\s\S]*?'\/search\?q=democracy'[\s\S]*?'democracy'[\s\S]*?searchStateCopy\.en/,
  );
  assert.match(
    source,
    /expectHydratedSearch\([\s\S]*?'\/search\?query=municipality'[\s\S]*?'municipality'[\s\S]*?searchStateCopy\.en/,
  );
  assert.match(source, /name: searchStateCopy\.sv\.inputName[\s\S]*?toHaveCount\(0\)/);
  assert.match(source, /name: searchStateCopy\.sv\.submitButtonName[\s\S]*?toHaveCount\(\s*0/);
  assert.match(source, /name: searchStateCopy\.sv\.clearButtonName[\s\S]*?toHaveCount\(\s*0/);
  assert.match(source, /name: searchStateCopy\.en\.submitButtonName[\s\S]*?toBeEnabled\(\)/);
  assert.match(
    source,
    /page\.getByRole\('button', \{ name: searchStateCopy\.en\.clearButtonName \}\)\.click\(\)/,
  );
  assert.match(source, /await page\.reload\(\{ waitUntil: 'networkidle' \}\)/);
  assert.match(
    source,
    /await municipalityInput\.fill\('parliament'\)[\s\S]*?expectSearchUrlWithoutQueryParams\(page\)/,
  );
});

test('Search route e2e covers manual Enter submit URL state', () => {
  const source = readSearchQueryHydrationE2eSource();

  assert.match(
    source,
    /search route submits manual typing via button or Enter before URL hydration/,
  );
  assert.match(source, /const manualSubmitQuery = 'mänskliga rättigheter';/);
  assert.match(source, /const buttonSubmitQuery = 'kommun';/);
  assert.match(source, /const encodedManualSubmitQuery = encodeURIComponent\(manualSubmitQuery\);/);
  assert.match(source, /await expect\(submitButton\)\.toBeDisabled\(\)/);
  assert.match(
    source,
    /submitButton\.evaluate\(\(element\) => element\.getBoundingClientRect\(\)\.height\)[\s\S]*?\.toBeGreaterThanOrEqual\(44\)/,
  );
  assert.match(
    source,
    /await input\.fill\(buttonSubmitQuery\)[\s\S]*?expectSearchUrlWithoutQueryParams\(page\)/,
  );
  assert.match(source, /await submitButton\.click\(\)/);
  assert.match(source, /await expectSearchUrlWithQParam\(page, buttonSubmitQuery\)/);
  assert.match(
    source,
    /await input\.fill\(manualSubmitQuery\)[\s\S]*?expectSearchUrlWithoutQueryParams\(page\)/,
  );
  assert.match(source, /await input\.press\('Enter'\)/);
  assert.match(source, /await expectSearchUrlWithQParam\(page, manualSubmitQuery\)/);
  assert.match(source, /expect\(page\.url\(\)\)\.toContain\(`q=\$\{encodedManualSubmitQuery\}`\)/);
  assert.match(
    source,
    /await page\.reload\(\{ waitUntil: 'networkidle' \}\)[\s\S]*?await expectSearchState\(page, manualSubmitQuery\)/,
  );
  assert.match(
    source,
    /await hydratedInput\.fill\('   '\)[\s\S]*?await hydratedInput\.press\('Enter'\)[\s\S]*?expectSearchUrlWithoutQueryParams\(page\)/,
  );
});

test('Search route e2e covers direct quiz backlink q-before-query precedence', () => {
  const source = readSearchQueryHydrationE2eSource();

  assert.match(source, /direct quiz visits keep q before query precedence for Search backlinks/);
  assert.match(source, /function expectDirectQuizBacklinkNavigation\(\{/);
  assert.match(
    source,
    /expectedSearchQuery: 'riksdag'[\s\S]*?url: '\/quiz\/q001\?query=kommun&q=riksdag'/,
  );
  assert.match(source, /expectedSearchQuery: 'kommun'[\s\S]*?url: '\/quiz\/q001\?query=kommun'/);
  assert.match(
    source,
    /toHaveAttribute\(\s*'href',\s*`\/search\?q=\$\{encodeURIComponent\(expectedSearchQuery\)\}`/,
  );
  assert.match(
    source,
    /new RegExp\(`\/search\\\\\?q=\$\{encodeURIComponent\(expectedSearchQuery\)\}\$`\)/,
  );
  assert.match(source, /await expectSearchState\(page, expectedSearchQuery, copy\)/);
  assert.match(source, /direct quiz visits keep the search backlink query-free/);
  assert.match(source, /direct quiz visits ignore malformed and overlong search backlink params/);
});

test('Search dark source-affordance e2e covers Swedish and English locale names', () => {
  const source = readThemeModeUtilityE2eSource();

  assert.match(source, /const searchSourceAffordanceCases = \[/);
  assert.match(source, /for \(const testCase of searchSourceAffordanceCases\)/);
  assert.match(
    source,
    /language: 'sv'[\s\S]*inputName: 'Sök samhällsbegrepp och övningsfrågor'[\s\S]*provenanceBadgeName: \/Källtyp: UHR-källa\/[\s\S]*provenanceLabel: 'UHR-källa'[\s\S]*sourceNoteName: \/\^Källanteckning:\//,
  );
  assert.match(
    source,
    /language: 'en'[\s\S]*inputName: 'Search civic terms and practice questions'[\s\S]*provenanceBadgeName: \/Provenance: UHR source\/[\s\S]*provenanceLabel: 'UHR source'[\s\S]*sourceNoteName: \/\^Source note:\//,
  );
  assert.match(source, /darkColors\.badgeBlueBg/);
  assert.match(source, /darkColors\.badgeBlueText/);
  assert.match(source, /darkColors\.surfaceWarm/);
  assert.match(source, /await expectNoHorizontalOverflow\(page\);/);
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

test('focused Search route query hydration validator rejects mutation fixtures', () => {
  const mutationFixtures = [
    {
      label: 'removing mounted route-query sync',
      expectedFailure: /search route must resync mounted state only when the route query changes/,
      mutateSource: (source) =>
        source.replace(/  useEffect\(\(\) => \{[\s\S]*?  \}, \[routeQuery\]\);\n/, ''),
    },
    {
      label: 'dropping the unchanged-route guard',
      expectedFailure: /search route must guard unchanged route params before resyncing/,
      mutateSource: (source) =>
        source.replace('    if (previousRouteQueryRef.current === routeQuery) return;\n\n', ''),
    },
    {
      label: 'preferring query before q route params',
      expectedFailure: /search route must prefer q then query fallback order/,
      mutateSource: (source) =>
        source.replace(
          'return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);',
          'return getFirstSearchParamValue(params.query) || getFirstSearchParamValue(params.q);',
        ),
    },
    {
      label: 'leaving the old q URL after clearing search',
      expectedFailure: /search route clear action must reset state and URL/,
      mutateSource: (source) =>
        source.replace(
          "router.replace('/search');",
          'router.replace(`/search?q=${encodeURIComponent(routeQuery)}`);',
        ),
    },
  ];

  for (const fixture of mutationFixtures) {
    assertFocusedSearchRouteQueryHydrationRejects(fixture);
  }
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

test('Search route hydration rejects query-before-q fallback drift', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);',
    'return getFirstSearchParamValue(params.query) || getFirstSearchParamValue(params.q);',
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

test('Neutral search normalizer rejects dropping punctuation stripping', () => {
  const mutatedSource = readSearchTextNormalizationSource().replace(
    ".replace(/[^a-z0-9\\s-]/g, ' ')",
    '',
  );

  assert.throws(
    () => assertNeutralSearchPunctuationNormalizer(mutatedSource),
    /replace punctuation/,
  );
});

test('Glossary search keeps compatibility exports backed by neutral normalization', () => {
  assertNeutralSearchPunctuationNormalizer(readSearchTextNormalizationSource());
  assertGlossarySearchCompatibilityExport(readGlossarySearchSource());
});

test('Question search rejects route-local punctuation-preserving normalization drift', () => {
  const mutatedSource = readQuestionSearchSource()
    .replace('  normalizeSearchText,\n', '')
    .replace(
      'function searchableFields(question: PracticeQuestion, chapter: Chapter | undefined): string[] {',
      "function normalizeSearchText(value: string): string {\n  return value\n    .normalize('NFD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .toLocaleLowerCase('sv-SE')\n    .trim();\n}\n\nfunction searchableFields(question: PracticeQuestion, chapter: Chapter | undefined): string[] {",
    );

  assert.throws(
    () => assertQuestionSearchPunctuationNormalizer(mutatedSource),
    /neutral search normalizer import|neutral search helper import path|private punctuation-preserving normalizer/,
  );
});

test('Question search rejects direct runtime limit slices', () => {
  const mutatedSource = readQuestionSearchSource()
    .replace('const normalizedLimit = normalizeSearchResultLimit(limit, 12);\n', '')
    .replace(
      'return normalizedLimit === undefined ? results : results.slice(0, normalizedLimit);',
      'return results.slice(0, limit);',
    );

  assert.throws(
    () => assertQuestionSearchPunctuationNormalizer(mutatedSource),
    /normalized limit|neutral search limit normalizer import/,
  );
});

test('Search route question results reject dropping routed quiz links', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'href={getQuestionResultHref(result.question.id, trimmedQuery)}',
    'href="/(tabs)/learn"',
  );

  assert.throws(() => assertSearchRouteQuestionResults(mutatedSource), /routed quiz question link/);
});

test('Search route question results reject dropping ranked helper usage', () => {
  const mutatedSource = readSearchRouteSource().replace(
    'return searchQuestionsWithTotal({',
    'return { results: [], totalCount: 0 };',
  );

  assert.throws(
    () => assertSearchRouteQuestionResults(mutatedSource),
    /searchQuestionsWithTotal call/,
  );
});

test('Search route question results reject deriving totals from capped visible cards', () => {
  const mutatedSource = readSearchRouteSource()
    .replace(
      'const totalQuestionMatches = questionSearchResults.totalCount;',
      'const totalQuestionMatches = questionResults.length;',
    )
    .replace(
      'copy.questionSectionSubtitle(questionResults.length, totalQuestionMatches)',
      'copy.questionSectionSubtitle(questionResults.length, questionResults.length)',
    );

  assert.throws(
    () => assertSearchRouteQuestionResults(mutatedSource),
    /total question matches|visible and total question counts/,
  );
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
