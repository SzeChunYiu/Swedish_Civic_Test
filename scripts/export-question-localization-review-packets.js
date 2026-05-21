#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const siteQuestionsPath = path.join(repoRoot, 'site/questions.js');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');
const outputRoot = path.join(repoRoot, 'docs/localization/review-packets/question-i18n-v8');
const targetLocales = ['ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk', 'zh-Hans', 'zh-Hant'];
const sourceLocales = ['sv', 'en'];
const allRequiredLocales = [...sourceLocales, ...targetLocales];
const checkMode = process.argv.includes('--check');

const header = [
  'id',
  'locale',
  'chapter_id',
  'chapter_label',
  'source_chapter',
  'source_section',
  'source_page',
  'question_sv',
  'question_en',
  'question_target',
  'correct_option_id',
  'correct_option_sv',
  'correct_option_en',
  'correct_option_target',
  'options_sv',
  'options_en',
  'options_target',
  'explanation_sv',
  'explanation_en',
  'explanation_target',
  'native_review_status',
  'reviewer_notes',
];

function loadSiteQuestions() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(siteQuestionsPath, 'utf8'), sandbox, { timeout: 3000 });
  const questions = sandbox.window.SMT_QUESTIONS;
  if (!Array.isArray(questions)) throw new Error('site/questions.js did not define SMT_QUESTIONS');
  return questions;
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function optionIdsFor(question) {
  if (question.type === 'true_false') return ['true', 'false'];
  return ['a', 'b', 'c', 'd'].slice(0, question.opts.length);
}

function localized(value, locale, context) {
  const text = value?.[locale];
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error(`${context}.${locale} missing`);
  }
  return text;
}

function assertQuestionReadinessFailClosed() {
  const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));

  for (const locale of targetLocales) {
    const readinessEntry = readiness.locales?.[locale];
    if (
      !readinessEntry ||
      readinessEntry.appAvailable !== false ||
      readinessEntry.questionContent !== 'pilot_q001_q177_machine_assisted' ||
      readinessEntry.nativeReview !== 'missing' ||
      readinessEntry.releaseGate !== 'blocked'
    ) {
      throw new Error(
        `${locale} question readiness must remain fail-closed (appAvailable=false, questionContent=pilot_q001_q177_machine_assisted, nativeReview=missing, releaseGate=blocked)`,
      );
    }
  }
}

function optionList(question, locale, optionIds) {
  return question.opts
    .map(
      (option, index) =>
        `${optionIds[index] ?? String(index)}: ${localized(option, locale, `${question.id}.options.${index}`)}`,
    )
    .join(' | ');
}

function rowFor(question, locale) {
  const optionIds = optionIdsFor(question);
  const correctOptionId = optionIds[question.answer] ?? String(question.answer);
  const correctOption = question.opts[question.answer];
  if (!correctOption) throw new Error(`${question.id}.answer does not point to an option`);

  return [
    question.id,
    locale,
    question.chapterId,
    question.chapter,
    question.source?.chapter,
    question.source?.section,
    question.source?.page,
    localized(question.q, 'sv', `${question.id}.question`),
    localized(question.q, 'en', `${question.id}.question`),
    localized(question.q, locale, `${question.id}.question`),
    correctOptionId,
    localized(correctOption, 'sv', `${question.id}.correctOption`),
    localized(correctOption, 'en', `${question.id}.correctOption`),
    localized(correctOption, locale, `${question.id}.correctOption`),
    optionList(question, 'sv', optionIds),
    optionList(question, 'en', optionIds),
    optionList(question, locale, optionIds),
    localized(question.why, 'sv', `${question.id}.explanation`),
    localized(question.why, 'en', `${question.id}.explanation`),
    localized(question.why, locale, `${question.id}.explanation`),
    'pending_native_review',
    'pending_reviewer_notes',
  ].map(sanitize);
}

function buildReadme(questions) {
  return `# Question i18n v8 native-review packets\n\nThese are machine-assisted q001-q177 question localization review packets for the UHR-published question bank.\n\nDo not use these packets to enable a locale. They exist so native reviewers can check semantic accuracy, answer/distractor logic, civic terminology, tone, script/layout issues, and any culture-specific ambiguity before release gates move.\n\n## Scope\n\n- Source: generated \`site/questions.js\` from \`data/questions.ts\`, \`data/additionalQuestions.ts\`, and \`data/questionLocalizations.ts\`.\n- Questions: ${questions.length} UHR-published rows, q001-q177.\n- Review locales: ${targetLocales.map((locale) => `\`${locale}\``).join(', ')}.\n- Source/bridge columns: Swedish and English.\n\n## Reviewer instructions\n\nFor each row, check that:\n\n1. the target question asks the same thing as the Swedish source,\n2. the correct answer remains correct and no distractor becomes accidentally correct,\n3. explanations do not overclaim official authority,\n4. civic/legal terms match local-language public-service usage,\n5. wording is natural for the target locale and avoids literal translation,\n6. script direction, punctuation, numbers, and names render correctly, and\n7. reviewer notes are added before any readiness ledger is moved from blocked to allowed.\n\nKeep \`native_review_status\` as \`pending_native_review\` until a native reviewer changes it in a reviewed copy.\n`;
}

function buildPackets() {
  assertQuestionReadinessFailClosed();

  const expectedIds = Array.from(
    { length: 177 },
    (_, index) => `q${String(index + 1).padStart(3, '0')}`,
  );
  const questions = loadSiteQuestions()
    .filter(
      (question) => question.questionProvenance === 'uhr' && expectedIds.includes(question.id),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const ids = questions.map((question) => question.id);
  if (ids.join('\n') !== expectedIds.join('\n')) {
    throw new Error(`Expected q001-q177 UHR questions, found ${ids.length}: ${ids.join(', ')}`);
  }

  for (const question of questions) {
    for (const locale of allRequiredLocales) {
      localized(question.q, locale, `${question.id}.question`);
      localized(question.why, locale, `${question.id}.explanation`);
      for (let index = 0; index < question.opts.length; index += 1) {
        localized(question.opts[index], locale, `${question.id}.options.${index}`);
      }
    }
  }

  const files = new Map();
  files.set('README.md', buildReadme(questions));
  for (const locale of targetLocales) {
    const lines = [header.join('\t')];
    for (const question of questions) lines.push(rowFor(question, locale).join('\t'));
    files.set(`${locale}.tsv`, `${lines.join('\n')}\n`);
  }
  return files;
}

function main() {
  const files = buildPackets();
  const mismatches = [];

  if (!checkMode) fs.mkdirSync(outputRoot, { recursive: true });

  for (const [fileName, content] of files) {
    const filePath = path.join(outputRoot, fileName);
    if (checkMode) {
      if (!fs.existsSync(filePath)) {
        mismatches.push(`${path.relative(repoRoot, filePath)} missing`);
        continue;
      }
      const existing = fs.readFileSync(filePath, 'utf8');
      if (existing !== content) mismatches.push(`${path.relative(repoRoot, filePath)} stale`);
    } else {
      fs.writeFileSync(filePath, content);
    }
  }

  if (mismatches.length > 0) {
    console.error(`Question localization review packets are stale:\n${mismatches.join('\n')}`);
    process.exit(1);
  }

  console.log(
    `Question localization review packets ${checkMode ? 'OK' : 'exported'} (${targetLocales.length} locales, 177 questions)`,
  );
}

main();
