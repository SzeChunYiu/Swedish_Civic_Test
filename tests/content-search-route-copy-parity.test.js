const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('search route keeps a reachable fallback surface for native deep links', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');
  const nativeIntent = fs.readFileSync(path.join(repoRoot, 'app/+native-intent.ts'), 'utf8');
  const manifest = fs.readFileSync(
    path.join(repoRoot, 'lib/scaffold/routerShellManifest.ts'),
    'utf8',
  );

  assert.match(source, /export default function SearchScreen\(\)/);
  assert.match(source, /<Text style=\{styles\.title\}>Search<\/Text>/);
  assert.match(source, /Question search is coming\./);
  assert.match(source, /accessibilityLabel="Browse chapters"/);
  assert.match(source, /href="\/learn"/);
  assert.match(source, /accessibilityLabel="Back to home"/);
  assert.match(source, /href="\/\(tabs\)\/home"/);

  assert.match(nativeIntent, /'\/search'/);
  assert.match(manifest, /'\/search'/);
  assert.match(manifest, /input:\s*'\/search\?q=riksdag'/);
  assert.match(manifest, /input:\s*'almost-swedish:\/\/app\/search\?q=riksdag'/);
});
