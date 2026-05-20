const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Search route hydrates the input from q or query route parameters', () => {
  const source = read('app/search.tsx');

  assert.match(source, /import \{ Link, useLocalSearchParams \} from 'expo-router';/);
  assert.match(source, /type SearchQueryParams = \{/);
  assert.match(source, /q\?: string \| string\[\];/);
  assert.match(source, /query\?: string \| string\[\];/);
  assert.match(source, /const searchParams = useLocalSearchParams<SearchQueryParams>\(\);/);
  assert.match(
    source,
    /const \[query, setQuery\] = useState\(\(\) =>\s+initialSearchQueryFromParams\(searchParams\.q, searchParams\.query\),\s+\);/,
  );
  assert.match(
    source,
    /function initialSearchQueryFromParams\(q: SearchParamValue, query: SearchParamValue\) \{\s+return firstSearchParamValue\(q\) \|\| firstSearchParamValue\(query\);/,
  );
  assert.match(
    source,
    /const firstTextValue = value\.find\(\(item\) => item\.trim\(\)\.length > 0\);/,
  );
  assert.match(source, /return firstTextValue\?\.trim\(\) \?\? '';/);
  assert.match(source, /return value\?\.trim\(\) \?\? '';/);
});

test('Search route keeps manual typing and clear-search behavior intact', () => {
  const source = read('app/search.tsx');

  assert.match(source, /onChangeText=\{setQuery\}/);
  assert.match(source, /value=\{query\}/);
  assert.match(source, /disabled=\{query\.length === 0\}/);
  assert.match(source, /onPress=\{\(\) => setQuery\(''\)\}/);
  assert.match(source, /const trimmedQuery = query\.trim\(\);/);
  assert.match(source, /const normalizedQuery = normalizeSearchText\(trimmedQuery\);/);
});

test('Search route query hydration has glossary and native-intent evidence', () => {
  const glossary = read('data/glossary.ts');
  const routerManifest = read('lib/scaffold/routerShellManifest.ts');
  const nativeIntent = read('app/+native-intent.ts');

  assert.match(glossary, /id: 'riksdagen'/);
  assert.match(glossary, /termSv: 'Riksdagen'/);
  assert.match(glossary, /termEn: 'The Riksdag'/);
  assert.match(
    routerManifest,
    /input: '\/search\?q=riksdag'[\s\S]*expectedPath: '\/search\?q=riksdag'/,
  );
  assert.match(
    routerManifest,
    /input: '\/search\?query=riksdag'[\s\S]*expectedPath: '\/search\?query=riksdag'/,
  );
  assert.match(
    routerManifest,
    /input: 'almost-swedish:\/\/app\/search\?q=riksdag'[\s\S]*expectedPath: '\/search\?q=riksdag'/,
  );
  assert.match(nativeIntent, /'\/search'/);
});
