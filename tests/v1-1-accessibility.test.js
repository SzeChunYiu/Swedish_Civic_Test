// Tests for v1.1 accessibility additions (blueprint 21).
// Run with: node --test tests/v1-1-accessibility.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

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

test('accessibilityStore: throwing MMKV writes keep in-memory state and record warnings', () => {
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

  state.clearPersistenceWarning();
  useAccessibilityStore.getState().setFontSizeStep(2);
  assert.equal(useAccessibilityStore.getState().fontSizeStep, 2);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.fontSizeStep.v1');

  state.clearPersistenceWarning();
  useAccessibilityStore.getState().setAudioPlaybackRate(0.75);
  assert.equal(useAccessibilityStore.getState().audioPlaybackRate, 0.75);
  assert.equal(
    useAccessibilityStore.getState().persistenceWarning.key,
    'a11y.audioPlaybackRate.v1',
  );

  state.clearPersistenceWarning();
  useAccessibilityStore.getState().setListenFirstAudioEnabled(true);
  assert.equal(useAccessibilityStore.getState().listenFirstAudioEnabled, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.listenFirstAudio.v1');

  state.clearPersistenceWarning();
  useAccessibilityStore.getState().setThemeMode('dark');
  assert.equal(useAccessibilityStore.getState().themeMode, 'dark');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.themeMode.v1');
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

  useAccessibilityStore.getState().setListenFirstAudioEnabled(true);
  assert.equal(useAccessibilityStore.getState().listenFirstAudioEnabled, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('a11y.listenFirstAudio.v1'), true);

  useAccessibilityStore.getState().setThemeMode('dark');
  assert.equal(useAccessibilityStore.getState().themeMode, 'dark');
  assert.equal(useAccessibilityStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('a11y.themeMode.v1'), 'dark');
});

test('accessibilityStore: runtime writes and font scale reads normalize invalid values', () => {
  const storage = createMemoryMMKV();
  const { fontScaleFor, useAccessibilityStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/accessibilityStore.ts',
    {
      accessibility: storage,
    },
  );

  useAccessibilityStore.getState().setEasyReadFont('yes');
  assert.equal(useAccessibilityStore.getState().easyReadFont, false);
  assert.equal(storage.values.get('a11y.easyReadFont.v1'), false);

  useAccessibilityStore.getState().setEasyReadFont(true);
  assert.equal(useAccessibilityStore.getState().easyReadFont, true);
  assert.equal(storage.values.get('a11y.easyReadFont.v1'), true);

  useAccessibilityStore.getState().setFontSizeStep(Number.NaN);
  assert.equal(useAccessibilityStore.getState().fontSizeStep, 1);
  assert.equal(storage.values.get('a11y.fontSizeStep.v1'), 1);

  useAccessibilityStore.getState().setFontSizeStep('2');
  assert.equal(useAccessibilityStore.getState().fontSizeStep, 1);
  assert.equal(storage.values.get('a11y.fontSizeStep.v1'), 1);

  useAccessibilityStore.getState().setAudioPlaybackRate(1.5);
  assert.equal(useAccessibilityStore.getState().audioPlaybackRate, 1);
  assert.equal(storage.values.get('a11y.audioPlaybackRate.v1'), 1);

  useAccessibilityStore.getState().setAudioPlaybackRate(0.75);
  assert.equal(useAccessibilityStore.getState().audioPlaybackRate, 0.75);
  assert.equal(storage.values.get('a11y.audioPlaybackRate.v1'), 0.75);

  useAccessibilityStore.getState().setListenFirstAudioEnabled('yes');
  assert.equal(useAccessibilityStore.getState().listenFirstAudioEnabled, false);
  assert.equal(storage.values.get('a11y.listenFirstAudio.v1'), false);

  useAccessibilityStore.getState().setListenFirstAudioEnabled(true);
  assert.equal(useAccessibilityStore.getState().listenFirstAudioEnabled, true);
  assert.equal(storage.values.get('a11y.listenFirstAudio.v1'), true);

  assert.equal(fontScaleFor(0), 0.9);
  assert.equal(fontScaleFor(2), 1.15);
  assert.equal(fontScaleFor(Number.NaN), 1);
  assert.equal(fontScaleFor('2'), 1);
  assert.equal(fontScaleFor(9), 1);
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
  assert.equal(useAccessibilityStore.getState().persistenceWarning.recoverable, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.storageId, 'accessibility');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.themeMode.v1');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.operation, 'read');
  assert.match(
    useAccessibilityStore.getState().persistenceWarning.errorMessage,
    /theme read failed/,
  );
});

test('accessibilityStore: first accessibility preference read failure is surfaced', () => {
  const storage = {
    getBoolean() {
      throw new Error('easy read failed');
    },
    getNumber() {
      return undefined;
    },
    getString() {
      return undefined;
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

  assert.equal(useAccessibilityStore.getState().easyReadFont, false);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.recoverable, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.storageId, 'accessibility');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.easyReadFont.v1');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.operation, 'read');
  assert.match(
    useAccessibilityStore.getState().persistenceWarning.errorMessage,
    /easy read failed/,
  );
});

test('accessibilityStore: text-size read failures are surfaced', () => {
  const storage = {
    getBoolean() {
      return undefined;
    },
    getNumber() {
      throw new Error('font size failed');
    },
    getString() {
      return undefined;
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

  assert.equal(useAccessibilityStore.getState().fontSizeStep, 1);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.recoverable, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.storageId, 'accessibility');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.key, 'a11y.fontSizeStep.v1');
  assert.equal(useAccessibilityStore.getState().persistenceWarning.operation, 'read');
  assert.match(
    useAccessibilityStore.getState().persistenceWarning.errorMessage,
    /font size failed/,
  );
});

test('accessibilityStore: audio-rate read failures are surfaced', () => {
  let numberReads = 0;
  const storage = {
    getBoolean() {
      return undefined;
    },
    getNumber() {
      numberReads += 1;
      if (numberReads === 2) throw new Error('audio rate failed');
      return undefined;
    },
    getString() {
      return undefined;
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

  assert.equal(useAccessibilityStore.getState().audioPlaybackRate, 1);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.recoverable, true);
  assert.equal(useAccessibilityStore.getState().persistenceWarning.storageId, 'accessibility');
  assert.equal(
    useAccessibilityStore.getState().persistenceWarning.key,
    'a11y.audioPlaybackRate.v1',
  );
  assert.equal(useAccessibilityStore.getState().persistenceWarning.operation, 'read');
  assert.match(
    useAccessibilityStore.getState().persistenceWarning.errorMessage,
    /audio rate failed/,
  );
});

test('RootLayout applies persisted theme mode to system chrome before screens render', () => {
  const source = loadSource('app/_layout.tsx');
  assert.match(
    source,
    /import \{ ThemeProvider, useTheme \} from '\.\.\/lib\/theme\/ThemeProvider';/,
  );
  assert.match(source, /function RootLayoutContent\(\)/);
  assert.match(source, /const \{ colors: themeColors, resolvedColorScheme \} = useTheme\(\);/);
  assert.match(source, /useSystemCanvasColor\(themeColors\.canvas\);/);
  assert.match(source, /headerStyle: \{ backgroundColor: themeColors\.canvas \}/);
  assert.match(
    source,
    /<StatusBar style=\{resolvedColorScheme === 'dark' \? 'light' : 'dark'\} \/>/,
  );
  assert.match(source, /<ThemeProvider>[\s\S]*<RootLayoutContent \/>[\s\S]*<\/ThemeProvider>/);
  assert.doesNotMatch(source, /colorsForThemeMode|useColorScheme|useAccessibilityStore/);
});

test('ThemeProvider resolves persisted theme mode once for app-wide consumers', () => {
  const source = loadSource('lib/theme/ThemeProvider.tsx');
  assert.match(source, /useColorScheme/);
  assert.match(source, /useAccessibilityStore\(\(state\) => state\.themeMode\)/);
  assert.match(source, /colorsForThemeMode\(preference, systemColorScheme\)/);
  assert.match(source, /resolveThemePreference\(preference, systemColorScheme\)/);
  assert.match(source, /createElement\(ThemeContext\.Provider, \{ value \}, children\)/);
  assert.match(source, /export function useTheme\(\)/);
  assert.match(source, /export function useThemeColors\(\)/);
});

test('main native surfaces consume app-wide theme colors instead of static tokens', () => {
  const useThemeFiles = ['app/settings.tsx'];
  const useThemeColorsFiles = [
    'components/Button.tsx',
    'components/OptionCard.tsx',
    'components/ui/Card.tsx',
    'components/ui/ScreenShell.tsx',
    'app/(tabs)/home.tsx',
    'app/(tabs)/practice.tsx',
    'app/(tabs)/exam.tsx',
    'app/(tabs)/learn.tsx',
    'app/(tabs)/mistakes.tsx',
    'app/dashboard.tsx',
  ];

  for (const file of useThemeFiles) {
    const source = loadSource(file);
    assert.match(source, /useTheme\(\)/, `${file} should read the shared theme context`);
    assert.match(
      source,
      /createStyles\(themeColors\)/,
      `${file} should bind styles to theme colors`,
    );
    assert.doesNotMatch(source, /colorsForThemeMode|useColorScheme|\bcolors\./, file);
  }

  for (const file of useThemeColorsFiles) {
    const source = loadSource(file);
    assert.match(source, /useThemeColors\(\)/, `${file} should read shared theme colors`);
    assert.match(
      source,
      /createStyles\(themeColors\)/,
      `${file} should bind styles to theme colors`,
    );
    assert.doesNotMatch(source, /import \{[^}]*\bcolors\b[^}]*\} from .*lib\/theme/, file);
    assert.doesNotMatch(source, /\bcolors\./, file);
  }

  assert.match(loadSource('components/ui/Button.tsx'), /export \{ Button \} from '\.\.\/Button';/);
});

test('nested native surfaces consume app-wide theme colors instead of static tokens', () => {
  const nestedThemeFiles = [
    'components/ui/Badge.tsx',
    'components/ui/ProgressBar.tsx',
    'components/ui/RouteLink.tsx',
    'components/ui/MetricCard.tsx',
    'components/ui/StatCallout.tsx',
    'components/ui/CountdownBanner.tsx',
    'components/quiz/QuestionCard.tsx',
    'components/quiz/ExplanationPanel.tsx',
    'components/quiz/UHRReferenceCard.tsx',
    'components/dashboard/ActivityHeatmap.tsx',
    'components/dashboard/MockExamHistoryCard.tsx',
    'components/dashboard/PerChapterProgressBars.tsx',
    'components/dashboard/StreakXpSparkline.tsx',
  ];

  for (const file of nestedThemeFiles) {
    const source = loadSource(file);
    assert.match(
      source,
      /useThemeColors\(\)|useResolvedThemeColors\(/,
      `${file} should read shared theme colors`,
    );
    assert.match(
      source,
      /createStyles\((themeColors|resolvedThemeColors)\)/,
      `${file} should bind styles to theme colors`,
    );
    assert.doesNotMatch(source, /import \{[^}]*\bcolors\b[^}]*\} from .*lib\/theme/, file);
    assert.doesNotMatch(source, /\bcolors\./, file);
  }
});

test('speak.ts: speakSwedish accepts a rate option', () => {
  const source = loadSource('lib/audio/speak.ts');
  assert.match(source, /SpeakSwedishOptions/);
  assert.match(source, /rate\?: unknown/);
  assert.match(source, /Speech\.speak\([\s\S]*rate/);
});

test('speak.ts: rate is clamped to a safe range', () => {
  const source = loadSource('lib/audio/speak.ts');
  // The bounds [0.1, 2.0] match expo-speech's documented support envelope.
  assert.match(source, /0\.1/);
  assert.match(source, /2\.0/);
});

test('native ebook study article audio uses Swedish read-aloud controls and playback rate', () => {
  const routeSource = loadSource('app/ebook.tsx');
  const articleAudioSource = loadSource('components/learning/ArticleAudioButton.tsx');
  const narrationSource = loadSource('lib/audio/ebookNarration.ts');

  assert.match(routeSource, /import \{ ArticleAudioButton \}/);
  assert.match(routeSource, /buildEbookArticleNarrationText/);
  assert.match(routeSource, /buildEbookSectionNarrationText/);
  assert.match(
    routeSource,
    /const audioEnabled = useSettingsStore\(\(state\) => state\.audioEnabled\);/,
  );
  assert.match(
    routeSource,
    /const audioPlaybackRate = useAccessibilityStore\(\(state\) => state\.audioPlaybackRate\);/,
  );
  assert.match(
    routeSource,
    /<ArticleAudioButton[\s\S]*enabled=\{audioEnabled\}[\s\S]*rate=\{audioPlaybackRate\}[\s\S]*scope="article"[\s\S]*text=\{buildEbookArticleNarrationText\(article\)\}/,
  );
  assert.match(
    routeSource,
    /<ArticleAudioButton[\s\S]*scope="section"[\s\S]*text=\{buildEbookSectionNarrationText\(section\)\}/,
  );
  assert.match(articleAudioSource, /chunkArticleNarrationText/);
  assert.match(articleAudioSource, /speakSwedish\(chunk, \{[\s\S]*rate,[\s\S]*onDone:/);
  assert.match(articleAudioSource, /stopSpeech\(\);[\s\S]*setIsSpeaking\(false\)/);
  assert.match(articleAudioSource, /Lyssna på artikeln/);
  assert.match(articleAudioSource, /Lyssna på avsnittet/);
  assert.match(narrationSource, /EBOOK_NARRATION_MAX_CHUNK_LENGTH = 260/);
  assert.doesNotMatch(narrationSource, /getEbookSourceNotes|sourceNoteKeys|provenance/i);
});

test('native ebook study article narration chunks long text and skips source cards', () => {
  const {
    buildEbookArticleNarrationText,
    buildEbookSectionNarrationText,
    chunkArticleNarrationText,
  } = require(path.join(repoRoot, 'lib/audio/ebookNarration.ts'));
  const { EBOOK_ARTICLES } = require(path.join(repoRoot, 'lib/content/ebookContent.ts'));
  const introArticle = EBOOK_ARTICLES.find((article) => article.staticChapterId === 'intro');

  const chunks = chunkArticleNarrationText('En kort mening. '.repeat(30), 120);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 120));

  const articleText = buildEbookArticleNarrationText(introArticle);
  const sectionText = buildEbookSectionNarrationText(introArticle.sections[0]);

  assert.match(articleText, /Sakta in/);
  assert.match(articleText, /Vad den här boken är/);
  assert.match(sectionText, /Vad den här boken är/);
  assert.doesNotMatch(sectionText, /Sakta in/);
  assert.doesNotMatch(
    articleText,
    /Redaktionell|Källor hämtade|UHR:s offentliga utbildningsmaterial/,
  );
});

test('settings route scopes persistence warning copy to accessibility preferences', () => {
  const settingsSource = loadSource('app/settings.tsx');
  const noticeSource = loadSource('components/storage/PersistenceWarningNotice.tsx');

  assert.match(settingsSource, /warningScope="accessibilityPreferences"/);
  assert.match(noticeSource, /type PersistenceWarningNoticeScope/);
  assert.match(noticeSource, /accessibilityPreferences:\s*\{/);
  assert.match(noticeSource, /studyData:\s*\{/);
  assert.match(noticeSource, /Tillgänglighetsinställningar kunde inte sparas/);
  assert.match(noticeSource, /Accessibility preferences could not be saved/);
  assert.match(noticeSource, /Lokal studiedata kunde inte läsas/);
  assert.match(noticeSource, /Local study data could not be loaded/);
});

test('settingsStore.ts: v1.0 pinned shape preserved (no a11y fields added there)', () => {
  const source = loadSource('lib/storage/settingsStore.ts');
  assert.ok(!source.includes('easyReadFont'), 'a11y fields must NOT be in settingsStore');
  assert.ok(!source.includes('fontSizeStep'), 'a11y fields must NOT be in settingsStore');
  assert.ok(!source.includes('audioPlaybackRate'), 'a11y fields must NOT be in settingsStore');
  assert.ok(!source.includes('themeMode'), 'a11y fields must NOT be in settingsStore');
});
