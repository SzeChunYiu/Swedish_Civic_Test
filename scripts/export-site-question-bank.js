#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const checkMode = process.argv.includes('--check');

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function localizedQuestionText(question) {
  return Object.assign(
    { en: question.questionEn, sv: question.questionSv },
    question.questionText || {},
  );
}

function localizedOptionText(option) {
  return Object.assign({ en: option.textEn, sv: option.textSv }, option.text || {});
}

function localizedExplanationText(question) {
  return Object.assign(
    { en: question.explanationEn, sv: question.explanationSv },
    question.explanationText || {},
  );
}

function localizedChapterTitle(chapter) {
  return Object.assign({ en: chapter.nameEn, sv: chapter.nameSv }, chapter.nameText || {});
}

function localizedChapterDescription(chapter) {
  return Object.assign(
    { en: chapter.descriptionEn, sv: chapter.descriptionSv },
    chapter.descriptionText || {},
  );
}

function parseChapterNumber(chapterId) {
  const match = /^ch(\d{2})$/.exec(chapterId);
  if (!match) throw new Error(`Invalid chapter id for static site export: ${chapterId}`);
  return Number.parseInt(match[1], 10);
}

function buildSiteQuestionBank() {
  const questions = loadTs('data/questions.ts', 'questions');
  const chapters = loadTs('data/chapters.ts', 'chapters');
  const getQuestionProvenance = loadTs('lib/content/provenance.ts', 'getQuestionProvenance');
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const chapterEmoji = new Map([
    ['ch01', '🌍'],
    ['ch02', '🏛'],
    ['ch03', '🗳'],
    ['ch04', '🗳'],
    ['ch05', '⚖️'],
    ['ch06', '📰'],
    ['ch07', '🤝'],
    ['ch08', '💼'],
    ['ch09', '🏥'],
    ['ch10', '📜'],
    ['ch11', '🌐'],
    ['ch12', '🕊'],
    ['ch13', '🕯'],
  ]);

  const siteQuestions = questions.map((question) => {
    const chapter = chapterById.get(question.chapterId);
    if (!chapter) throw new Error(`Missing chapter metadata for ${question.id}`);

    const answer = question.options.findIndex((option) => option.id === question.correctOptionId);
    if (answer < 0) {
      throw new Error(`Missing correct option ${question.correctOptionId} for ${question.id}`);
    }

    const chapterNumber = parseChapterNumber(question.chapterId);
    return {
      id: question.id,
      chapterId: chapterNumber,
      chapter: `Ch. ${String(chapterNumber).padStart(2, '0')} · ${chapter.nameEn}`,
      type: question.type,
      q: localizedQuestionText(question),
      opts: question.options.map(localizedOptionText),
      answer,
      why: localizedExplanationText(question),
      source: {
        title: 'Sverige i fokus',
        chapter: question.uhrReference.chapter,
        section: question.uhrReference.section,
        page: question.uhrReference.pageApprox,
      },
      questionProvenance: getQuestionProvenance(question),
      difficulty: question.difficulty,
      tags: question.tags,
    };
  });

  const chapterMeta = chapters.map((chapter) => {
    const chapterNumber = parseChapterNumber(chapter.id);
    return {
      id: chapterNumber,
      emoji: chapterEmoji.get(chapter.id) || '•',
      title: localizedChapterTitle(chapter),
      description: localizedChapterDescription(chapter),
      questionCount: chapter.questionCount,
    };
  });

  return { questions: siteQuestions, chapters: chapterMeta };
}

function generateUnformattedStaticSiteQuestionBankJs() {
  const bank = buildSiteQuestionBank();
  return `/* Almost Swedish - generated static question bank.
   Source: data/questions.ts and data/chapters.ts.
   Run: node scripts/export-site-question-bank.js
*/

(function () {
  "use strict";

  window.SMT_QUESTIONS = ${JSON.stringify(bank.questions, null, 2)};

  window.SMT_CHAPTERS_META = ${JSON.stringify(bank.chapters, null, 2)};
})();
`;
}

function formatStaticSiteQuestionBankJs(source) {
  const prettierBinPath = require.resolve('prettier/bin/prettier.cjs');
  return execFileSync(
    process.execPath,
    [
      prettierBinPath,
      '--stdin-filepath',
      path.join(repoRoot, 'site', 'questions.js'),
      '--config',
      path.join(repoRoot, '.prettierrc.json'),
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      input: source,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
}

function generateStaticSiteQuestionBankJs() {
  return formatStaticSiteQuestionBankJs(generateUnformattedStaticSiteQuestionBankJs());
}

function readStaticSiteQuestionBankFromSource(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context, { timeout: 3000 });
  const { SMT_QUESTIONS: questions, SMT_CHAPTERS_META: chapters } = context.window;
  if (!Array.isArray(questions) || !Array.isArray(chapters)) {
    throw new Error('source does not define SMT_QUESTIONS and SMT_CHAPTERS_META arrays');
  }
  return { questions, chapters };
}

function comparableStaticSiteQuestionBank(source) {
  const bank = readStaticSiteQuestionBankFromSource(source);
  return JSON.stringify(bank);
}

function classifyStaticSiteQuestionBankDrift(actual, expected) {
  if (actual === expected) {
    return {
      kind: 'none',
      message: 'site/questions.js matches the generated static question bank',
    };
  }

  try {
    if (comparableStaticSiteQuestionBank(actual) === comparableStaticSiteQuestionBank(expected)) {
      return {
        kind: 'format',
        message:
          'site/questions.js has format-only exporter drift; run node scripts/export-site-question-bank.js',
      };
    }
  } catch (error) {
    return {
      kind: 'semantic',
      message: `site/questions.js could not be compared semantically: ${error.message}`,
    };
  }

  return {
    kind: 'semantic',
    message:
      'site/questions.js semantic content is out of sync; run node scripts/export-site-question-bank.js and inspect the question-bank changes',
  };
}

function main() {
  const outPath = path.join(repoRoot, 'site', 'questions.js');
  const generated = generateStaticSiteQuestionBankJs();

  if (checkMode) {
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (existing !== generated) {
      console.error(classifyStaticSiteQuestionBankDrift(existing, generated).message);
      process.exit(1);
    }
    const bank = buildSiteQuestionBank();
    console.log(
      `Static site question-bank parity OK (${bank.questions.length} questions, ${bank.chapters.length} chapters)`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, generated);
  const bank = buildSiteQuestionBank();
  console.log(
    `Exported ${bank.questions.length} questions and ${bank.chapters.length} chapters to ${path.relative(
      repoRoot,
      outPath,
    )}`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSiteQuestionBank,
  classifyStaticSiteQuestionBankDrift,
  formatStaticSiteQuestionBankJs,
  generateStaticSiteQuestionBankJs,
  generateUnformattedStaticSiteQuestionBankJs,
  readStaticSiteQuestionBankFromSource,
};
