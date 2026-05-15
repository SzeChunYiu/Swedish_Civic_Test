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

test('monetization keeps real ads fail-closed for v1.0 while preserving test-unit config', () => {
  const { TEST_AD_UNITS, adsConfig, getPlatformAdUnitId, shouldShowAd } =
    loadTs('lib/monetization/ads.ts');
  assert.ok(TEST_AD_UNITS.length >= 4);
  assert.ok(
    fs
      .readFileSync(path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'), 'utf8')
      .includes('results_native'),
  );
  assert.equal(adsConfig.realAdsEnabled, false);
  assert.equal(adsConfig.googleMobileAdsEnabled, true);
  assert.ok(TEST_AD_UNITS.every((unit) => unit.testOnly));
  assert.equal(shouldShowAd('home_banner', { adsDisabled: false }), false);
  assert.equal(shouldShowAd('home_banner', { adsDisabled: true }), false);
  assert.equal(shouldShowAd('exam_screen', { adsDisabled: false }), false);
  assert.match(getPlatformAdUnitId('home_banner', 'android'), /^ca-app-pub-/);
  assert.match(getPlatformAdUnitId('home_banner', 'ios'), /^ca-app-pub-/);
});

test('app config registers the Google Mobile Ads Expo plugin with test app ids', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const plugin = appJson.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads',
  );

  assert.ok(plugin, 'react-native-google-mobile-ads plugin should be configured');
  assert.match(plugin[1].androidAppId, /^ca-app-pub-/);
  assert.match(plugin[1].iosAppId, /^ca-app-pub-/);
  assert.equal(plugin[1].delayAppMeasurementInit, true);
});

test('exam screen does not import ad components', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial/i);
});
