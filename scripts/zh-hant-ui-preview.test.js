const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/zhHantUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Traditional Chinese preview uses native Taiwan-style study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    '設定',
    '題目語言',
    '每日目標',
    '開始練習',
    '模擬測驗',
    '答對了。',
    '這次選錯了。',
    '答案解析',
    '參考資料',
    '複習錯題',
    '你的進度',
    '學習路徑',
    '此語言版本仍在準備中。',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    '設置',
    '問題語言',
    '開始一個練習會話',
    '源材料',
    '你是正確的',
    '你是不正確的',
    '全国人大',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Traditional Chinese preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    '法律資訊與資料來源',
    '隱私權政策',
    '移除廣告',
    '歡迎使用',
    '關於測驗',
    '支援與意見回饋',
    '學習資料來源',
    '搜尋概念與章節',
    '不是官方考試',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['取得護照', '保證通過測驗', '保證取得公民身分']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Traditional Chinese preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    '瑞典議會（Riksdag）',
    '依據 UHR 參考資料整理',
    '在瑞典',
    '不預測官方結果',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['保證', '一定通過', '取得瑞典護照', '官方認證']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Traditional Chinese preview does not enable zh-Hant runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'zh-Hant',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales['zh-Hant'].appAvailable, false);
  assert.equal(readiness.locales['zh-Hant'].uiStrings, 'not_started');
  assert.equal(readiness.locales['zh-Hant'].questionContent, 'pilot_q001_q172_machine_assisted');
  assert.equal(readiness.locales['zh-Hant'].releaseGate, 'blocked');
});
