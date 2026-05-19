// Tests for v1.1 accessibility additions (blueprint 21).
// Run with: node --test tests/v1-1-accessibility.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadSource(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

test('FONT_SIZE_MULTIPLIERS: 4 steps, monotonically increasing', () => {
  // Load constants by parsing the module text — avoids zustand/MMKV side effects.
  const source = loadSource('lib/storage/accessibilityStore.ts');
  const match = source.match(/FONT_SIZE_MULTIPLIERS:[\s\S]*?\{([\s\S]*?)\}/);
  assert.ok(match);
  const values = [...match[1].matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => parseFloat(m[1]));
  // Pairs like "0: 0.9" → extracted numbers are step, multiplier, step, multiplier, ...
  const multipliers = values.filter((_, i) => i % 2 === 1);
  assert.equal(multipliers.length, 4);
  for (let i = 1; i < multipliers.length; i += 1) {
    assert.ok(multipliers[i] > multipliers[i - 1], `mult ${i} should exceed previous`);
  }
});

test('AUDIO_PLAYBACK_RATES: contains 0.5, 0.75, 1.0, 1.25', () => {
  const source = loadSource('lib/storage/accessibilityStore.ts');
  for (const rate of ['0.5', '0.75', '1.0', '1.25']) {
    assert.ok(source.includes(rate), `accessibilityStore should declare rate ${rate}`);
  }
});

test('accessibilityStore: invariant — no Pro-gate references in source', () => {
  const source = loadSource('lib/storage/accessibilityStore.ts');
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled/.test(source),
    'accessibility settings MUST NEVER be Pro-gated',
  );
});

test('speak.ts: speakSwedish accepts a rate option', () => {
  const source = loadSource('lib/audio/speak.ts');
  assert.match(source, /SpeakSwedishOptions/);
  assert.match(source, /rate\?: number/);
  assert.match(source, /Speech\.speak\([\s\S]*rate/);
});

test('speak.ts: rate is clamped to a safe range', () => {
  const source = loadSource('lib/audio/speak.ts');
  // The bounds [0.1, 2.0] match expo-speech's documented support envelope.
  assert.match(source, /0\.1/);
  assert.match(source, /2\.0/);
});

test('settingsStore.ts: v1.0 pinned shape preserved (no a11y fields added there)', () => {
  const source = loadSource('lib/storage/settingsStore.ts');
  assert.ok(!source.includes('easyReadFont'), 'a11y fields must NOT be in settingsStore');
  assert.ok(!source.includes('fontSizeStep'), 'a11y fields must NOT be in settingsStore');
  assert.ok(!source.includes('audioPlaybackRate'), 'a11y fields must NOT be in settingsStore');
});
