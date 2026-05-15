const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('monetization uses test ad units and premium disables ads', () => {
  const { TEST_AD_UNITS, shouldShowAd } = loadTs('lib/monetization/ads.ts');
  assert.ok(TEST_AD_UNITS.length >= 4);
  assert.ok(
    fs
      .readFileSync(path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'), 'utf8')
      .includes('results_native'),
  );
  assert.ok(TEST_AD_UNITS.every((unit) => unit.testOnly && unit.enabled));
  assert.equal(shouldShowAd('home_banner', { adsDisabled: false }), true);
  assert.equal(shouldShowAd('home_banner', { adsDisabled: true }), false);
  assert.equal(shouldShowAd('exam_screen', { adsDisabled: false }), false);
});

test('exam screen does not import ad components', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial/i);
});
