const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, 'browserLaunch.ts'), 'utf8');

test('browser launch settings helpers seed current MMKV web keys', () => {
  assert.match(source, /const settingsStorageId = 'settings';/);
  assert.match(source, /`\$\{settingsStorageId\}\\\\\$\{settingsLanguageKey\}`/);
  assert.match(source, /`\$\{settingsStorageId\}\\\\\$\{settingsSeenAboutKey\}`/);
  assert.match(
    source,
    /languageKeys: settingsLanguageStorageKeys/,
    'language seed helpers should write the settings-scoped MMKV web key',
  );
  assert.match(
    source,
    /seenKeys: settingsSeenAboutStorageKeys/,
    'about-the-test seed helpers should write the settings-scoped MMKV web key',
  );
  assert.match(
    source,
    /for \(const languageKey of languageKeys\) \{\s*window\.localStorage\.setItem\(languageKey, seededLanguage\);/s,
    'language seed helpers should write every supported settings language key',
  );
  assert.match(
    source,
    /for \(const seenKey of seenKeys\) \{\s*window\.localStorage\.setItem\(seenKey, 'true'\);/s,
    'about-the-test seed helpers should write every supported seen flag key',
  );
});

test('rewarded preview e2e uses shared settings seed helpers', () => {
  const rewardedPreviewSource = fs.readFileSync(
    path.join(__dirname, 'rewarded-web-preview.spec.ts'),
    'utf8',
  );

  assert.match(rewardedPreviewSource, /seedSettingsLanguage\(page, language\);/);
  assert.match(rewardedPreviewSource, /markAboutTheTestSeen\(page\);/);
  assert.doesNotMatch(rewardedPreviewSource, /settings\\\\language/);
  assert.doesNotMatch(rewardedPreviewSource, /settings\\\\hasSeenAboutTheTest/);
});
