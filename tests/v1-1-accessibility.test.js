// Tests for v1.1 accessibility additions (blueprint 21).
// Run with: node --test tests/v1-1-accessibility.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

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

test('THEME_MODE_VALUES: contains system, light, dark', () => {
  const source = loadSource('lib/storage/accessibilityStore.ts');
  assert.match(source, /THEME_MODE_VALUES/);
  for (const mode of ['system', 'light', 'dark']) {
    assert.ok(source.includes(`'${mode}'`), `accessibilityStore should declare theme mode ${mode}`);
  }
});

test('accessibilityStore: invariant — no Pro-gate references in source', () => {
  const source = loadSource('lib/storage/accessibilityStore.ts');
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled|ProTierEntitlements/.test(source),
    'accessibility settings MUST NEVER be Pro-gated',
  );
});

test('accessibilityStore: throwing MMKV writes keep in-memory state and record warning', () => {
  const storage = createThrowingSetMMKV('accessibility disk full');
  const { useAccessibilityStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/accessibilityStore.ts',
    {
      accessibility: storage,
    },
  );

  useAccessibilityStore.getState().setEasyReadFont(true);
  const state = useAccessibilityStore.getState();

  assert.equal(state.easyReadFont, true);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'accessibility');
  assert.equal(state.persistenceWarning.key, 'a11y.easyReadFont.v1');
  assert.equal(state.persistenceWarning.operation, 'write');
  assert.match(state.persistenceWarning.message, /in-memory state/);
  assert.match(state.persistenceWarning.errorMessage, /disk full/);
});

test('accessibilityStore: successful writes persist values and clear warning', () => {
  const storage = createMemoryMMKV();
  const { useAccessibilityStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/accessibilityStore.ts',
    {
      accessibility: storage,
    },
  );

  useAccessibilityStore.getState().setFontSizeStep(2);
  assert.equal(useAccessibilityStore.getState().fontSizeStep, 2);
  assert.equal(useAccessibilityStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('a11y.fontSizeStep.v1'), 2);

  useAccessibilityStore.getState().setAudioPlaybackRate(1.25);
  assert.equal(useAccessibilityStore.getState().audioPlaybackRate, 1.25);
  assert.equal(useAccessibilityStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('a11y.audioPlaybackRate.v1'), 1.25);

  useAccessibilityStore.getState().setThemeMode('dark');
  assert.equal(useAccessibilityStore.getState().themeMode, 'dark');
  assert.equal(useAccessibilityStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('a11y.themeMode.v1'), 'dark');
});

test('accessibilityStore: persisted theme mode hydrates and invalid values fall back to system', () => {
  const darkStorage = createMemoryMMKV({ 'a11y.themeMode.v1': 'dark' });
  const darkModule = loadTsWithStorage(repoRoot, 'lib/storage/accessibilityStore.ts', {
    accessibility: darkStorage,
  });
  assert.equal(darkModule.useAccessibilityStore.getState().themeMode, 'dark');

  const invalidStorage = createMemoryMMKV({ 'a11y.themeMode.v1': 'sepia' });
  const invalidModule = loadTsWithStorage(repoRoot, 'lib/storage/accessibilityStore.ts', {
    accessibility: invalidStorage,
  });
  assert.equal(invalidModule.useAccessibilityStore.getState().themeMode, 'system');
});

test('accessibilityStore: theme mode read failures fall back to system', () => {
  const storage = {
    getBoolean() {
      return undefined;
    },
    getNumber() {
      return undefined;
    },
    getString() {
      throw new Error('theme read failed');
    },
    set() {},
  };
  const { useAccessibilityStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/accessibilityStore.ts',
    {
      accessibility: storage,
    },
  );

  assert.equal(useAccessibilityStore.getState().themeMode, 'system');
});

test('RootLayout applies persisted theme mode to system chrome before screens render', () => {
  const source = loadSource('app/_layout.tsx');
  assert.match(source, /useColorScheme/);
  assert.match(source, /const themeMode = useAccessibilityStore\(\(state\) => state\.themeMode\);/);
  assert.match(source, /const themeColors = colorsForThemeMode\(themeMode, systemColorScheme\);/);
  assert.match(source, /useSystemCanvasColor\(themeColors\.canvas\);/);
  assert.match(source, /headerStyle: \{ backgroundColor: themeColors\.canvas \}/);
  assert.match(
    source,
    /<StatusBar style=\{resolvedColorScheme === 'dark' \? 'light' : 'dark'\} \/>/,
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
  assert.ok(!source.includes('themeMode'), 'a11y fields must NOT be in settingsStore');
});
