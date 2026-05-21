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
    '安心学习，一次掌握一个瑞典社会知识点',
    '不注册账号也能查看进度',
    '第 {questionNumber} 题',
    'UHR 参考材料',
    '答案解析',
    '答对了。',
    '这次选错了。',
    '你有多确定？',
    '设置模拟考试',
    '提交前不显示反馈',
    '错题复习',
    '你上次选的答案',
    '本地学习数据',
    '章节进度',
    '按章节学习，下一步更清楚',
    '内容已列入计划',
    '法律信息和资料来源',
    '学习进度保存在本设备上',
    '一次性支付 {price}',
    '恢复购买',
    '轻松准备瑞典社会知识考试',
    '瑞典公民身份社会知识考试是什么？',
    '支持和反馈',
    '资料来源',
    '搜索术语、章节和解释',
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[{}]/g, '\\$&')));
  }

  for (const mechanicalPhrase of [
    '问题语言',
    '快来了',
    '源材料',
    '开始一个练习会话',
    '下一个问题',
    '你是正确的',
    '解释面板',
    '假的考试',
    '错误答案',
    '条纹',
    '护照保证',
    '官方应用',
  ]) {
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

test('Simplified Chinese entry point preview covers headers and accessibility labels', () => {
  const source = read(previewPath);
  for (const phrase of [
    'startPracticeAccessibilityLabel',
    'browseChaptersAccessibilityLabel',
    'dashboardAccessibilityLabel',
    'nextQuestionAccessibilityLabel',
    'bookmarkAccessibilityLabels',
  ]) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Simplified Chinese quiz feedback preview covers answer, source, and confidence labels', () => {
  const source = read(previewPath);
  for (const phrase of [
    'selectAccessibilityLabelTemplate',
    'accessibilityLabelPrefix',
    'basedOnUhrTemplate',
    'optionLabelTemplate',
    'mistakeReassurance',
  ]) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Simplified Chinese mock exam and mistakes preview covers setup, results, and review labels', () => {
  const source = read(previewPath);
  for (const phrase of [
    'mockExamConfig',
    'selectedChaptersValueTemplate',
    'resultSummary',
    'answerReviewAccessibilityTemplate',
    'wrongAnswersTemplate',
  ]) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Simplified Chinese dashboard and learning preview covers progress and chapter labels', () => {
  const source = read(previewPath);
  for (const phrase of [
    'dashboardAndLearning',
    'summaryAccessibilityTemplate',
    'sortAccessibilityLabelTemplate',
    'chapterLink',
    'chapterProgressCard',
  ]) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Simplified Chinese compliance and monetization preview covers legal, privacy, and purchase labels', () => {
  const source = read(previewPath);
  for (const phrase of [
    'complianceAndMonetization',
    'externalLinkAccessibilityTemplate',
    'localProgressStorage',
    'pricingPitchTemplate',
    'statusAccessibilityTemplate',
  ]) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Simplified Chinese remaining route preview covers onboarding, about, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'remainingHighFrequencyRoutes',
    'dailyGoalPresets',
    'aboutTheTest',
    'questionReportContextTitle',
    'questionReferencesBody',
    'filteredSummaryTemplate',
  ]) {
    assert.match(source, new RegExp(phrase));
  }

  assert.doesNotMatch(source, /\bmyndighet\b/i);
});

test('Simplified Chinese preview does not enable zh-Hans runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'zh-Hans',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales['zh-Hans'].appAvailable, false);
  assert.equal(readiness.locales['zh-Hans'].uiStrings, 'not_started');
  assert.equal(readiness.locales['zh-Hans'].questionContent, 'pilot_q001_q181_machine_assisted');
  assert.equal(readiness.locales['zh-Hans'].releaseGate, 'blocked');
});
