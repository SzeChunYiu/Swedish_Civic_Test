const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('search route exposes localized starter chips and result copy', () => {
  const source = read('app/search.tsx');

  assert.match(source, /type SearchCopy = \{/);
  assert.match(source, /const starterQueryChips: Record<AppLanguage, StarterQuery\[]> = \{/);
  assert.match(source, /const searchCopy: Record<AppLanguage, SearchCopy> = \{/);
  assert.match(source, /Sök frågor/);
  assert.match(source, /Search questions/);
  assert.match(source, /Snabba sökningar/);
  assert.match(source, /Quick searches/);
  assert.match(source, /Riksdagen/);
  assert.match(source, /Right of public access/);
  assert.match(source, /Midsommar/);
  assert.match(source, /Midsummer/);
  assert.match(source, /Folkomröstning/);
  assert.match(source, /Referendum/);
  assert.match(source, /const copy = searchCopy\[language\];/);
  assert.match(source, /const chips = starterQueryChips\[language\];/);
  assert.match(source, /\{hasQuery \? copy\.noResults\(trimmedQuery\) : copy\.emptyHelper\}/);
  assert.match(source, /\{copy\.resultCount\(results\.length\)\}/);
  assert.match(
    source,
    /copy\.sourceLabel\(question\.uhrReference\.chapter, question\.uhrReference\.section\)/,
  );
});

test('search route chips are tappable 48px controls with token feedback', () => {
  const source = read('app/search.tsx');

  assert.match(source, /<TextInput/);
  assert.match(source, /onChangeText=\{setQuery\}/);
  assert.match(source, /placeholder=\{copy\.placeholder\}/);
  assert.match(source, /chips\.map\(\(chip\) => \(/);
  assert.match(source, /<Pressable[\s\S]*onPress=\{\(\) => setQuery\(chip\.query\)\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /styles\.queryChip/);
  assert.match(source, /pressed \? styles\.queryChipPressed : null/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /backgroundColor: colors\.focusSoft/);
  assert.match(source, /borderColor: colors\.focus/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /href=\{`\/quiz\/\$\{question\.id\}`\}/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});
