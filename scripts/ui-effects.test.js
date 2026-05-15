const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('progress bar uses tokenized animated motion and exposes progress to assistive tech', () => {
  const source = read('components/ui/ProgressBar.tsx');

  assert.match(source, /Animated\.timing/);
  assert.match(source, /motion\.duration\.slow/);
  assert.match(source, /accessibilityLabel/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}|rgba?\(/);
});

test('practice screen adds bookmark controls backed by progress storage', () => {
  const source = read('app/(tabs)/practice.tsx');

  assert.match(source, /toggleBookmark/);
  assert.match(source, /bookmarked/);
  assert.match(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
});

test('mistakes screen has a bookmarked-question review section', () => {
  const source = read('app/(tabs)/mistakes.tsx');

  assert.match(source, /bookmarkedQuestions/);
  assert.match(source, /Bookmarked questions/);
  assert.match(source, /Saved for focused review/);
});

test('native ads use Google Mobile Ads while web keeps a safe preview component', () => {
  const webSource = read('components/monetization/AdBanner.tsx');
  const nativeSource = read('components/monetization/AdBanner.native.tsx');

  assert.doesNotMatch(webSource, /react-native-google-mobile-ads/);
  assert.match(webSource, /web preview/);
  assert.match(nativeSource, /react-native-google-mobile-ads/);
  assert.match(nativeSource, /<BannerAd/);
});
