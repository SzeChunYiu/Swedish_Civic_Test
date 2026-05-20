const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const chineseLocales = ['zh-Hans', 'zh-Hant'];
const chineseTextPattern = /[\u3400-\u9fff]/;
const asciiSentencePunctuationNearChinese = /[\u3400-\u9fff][,:;?!.]|[,:;?!.][\u3400-\u9fff]/;

function loadExtraI18n() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

function stripAllowedMarkupAndTokens(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/#[/a-z0-9_-]+/gi, ' ')
    .replace(
      /\b(?:Almost Swedish|Google AdSense|Google Mobile Ads|AdMob|Cookie|cookies|UHR|Skolverket|Migrationsverket|BankID|MVP|EN|SV|SEK|Jantelagen|Allemansrätten|Lagom|Fika|fika)\b/g,
      ' ',
    );
}

test('static site Chinese extras use script-native punctuation in learner copy', () => {
  const extras = loadExtraI18n();
  let inspectedValues = 0;

  for (const locale of chineseLocales) {
    const dictionary = extras?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    for (const [key, value] of Object.entries(dictionary)) {
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      if (!chineseTextPattern.test(value)) continue;

      inspectedValues += 1;
      assert.doesNotMatch(
        stripAllowedMarkupAndTokens(value),
        asciiSentencePunctuationNearChinese,
        `${locale}.${key} uses Latin sentence punctuation next to Chinese text`,
      );
    }
  }

  assert.ok(inspectedValues > 0, 'Chinese punctuation parity must inspect learner copy');
});
