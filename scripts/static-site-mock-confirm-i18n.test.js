const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const supportedLocales = [
  'en',
  'sv',
  'zh-Hans',
  'zh-Hant',
  'ar',
  'ckb',
  'fa',
  'pl',
  'so',
  'ti',
  'tr',
  'uk',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('mock exam unanswered-submit confirmation is localized for every supported locale', () => {
  const practiceSource = read('site/practice.js');
  const functionMatch = practiceSource.match(
    /function mockSubmitConfirmMessage\(unanswered\) \{([\s\S]*?)\n  \}/,
  );
  assert.ok(
    functionMatch,
    'practice runtime should expose a localized mockSubmitConfirmMessage helper',
  );
  const helperSource = functionMatch[1];

  for (const locale of supportedLocales) {
    assert.match(
      helperSource,
      new RegExp(`['\"]?${locale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"]?\\s*:`),
      `${locale} should have confirmation copy`,
    );
  }

  assert.doesNotMatch(helperSource, /lang\(\)\s*===\s*['"]sv['"]/);
  assert.doesNotMatch(
    helperSource,
    /You have \$\{unanswered\} unanswered questions\. Submit anyway\?/,
  );
});
