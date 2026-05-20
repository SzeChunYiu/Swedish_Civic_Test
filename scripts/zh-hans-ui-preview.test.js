const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/zhHansUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Simplified Chinese settings and picker preview uses native study-app wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    '设置',
    '题目语言',
    '每日目标',
    '每天答 {answerCount} 题',
    '语音朗读',
    '模拟考试记录',
    '语言选择器',
    '此语言版本正在准备中。',
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[{}]/g, '\\$&')));
  }

  for (const mechanicalPhrase of ['问题语言', '快来了', '源材料', '开始一个练习会话']) {
    assert.doesNotMatch(source, new RegExp(mechanicalPhrase));
  }
});

test('Simplified Chinese preview avoids outcome promises and Traditional-only forms', () => {
  const source = read(previewPath);
  for (const forbidden of ['护照', '包过', '保证通过', '通过考试', '取得公民身份']) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
  for (const traditionalOnly of ['資訊', '網路', '軟體', '準備中']) {
    assert.doesNotMatch(source, new RegExp(traditionalOnly));
  }
});

test('Simplified Chinese preview does not enable zh-Hans runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'zh-Hans',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales['zh-Hans'].appAvailable, false);
  assert.equal(readiness.locales['zh-Hans'].uiStrings, 'not_started');
  assert.equal(readiness.locales['zh-Hans'].questionContent, 'not_started');
  assert.equal(readiness.locales['zh-Hans'].releaseGate, 'blocked');
});
