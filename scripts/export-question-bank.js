#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

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

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function assertUniqueExportQuestionIds(questionsToExport) {
  const seenIds = new Set();

  for (const question of questionsToExport) {
    if (seenIds.has(question.id)) {
      throw new Error(
        `Duplicate question id ${question.id} would be exported to question-bank.csv`,
      );
    }
    seenIds.add(question.id);
  }
}

function serializableQuestionOptions(question) {
  return (question.options || []).map((option) => ({
    id: option.id,
    textSv: option.textSv,
    textEn: option.textEn,
  }));
}

function serializeQuestionOptions(question) {
  return JSON.stringify(serializableQuestionOptions(question));
}

const QUESTION_BANK_CSV_HEADER = [
  'id',
  'chapterId',
  'examScope',
  'type',
  'questionSv',
  'questionEn',
  'correctOptionId',
  'optionsJson',
  'uhrChapter',
  'uhrSection',
  'uhrPageApprox',
  'uhrChapterStartPage',
  'uhrChapterEndPage',
  'uhrSectionStartPage',
  'uhrSectionEndPage',
  'uhrDocumentTitle',
  'uhrSourceEdition',
  'uhrSourceUrl',
  'difficulty',
  'reviewStatus',
  'tags',
];

const { findUhrChapterPageRange, findUhrSectionReference } = loadTs('data/uhrReferenceMap.ts');

function getPageRange(question) {
  const pageRange = findUhrChapterPageRange(question.chapterId);
  if (!pageRange) {
    throw new Error(`Missing UHR page range for ${question.id} (${question.chapterId})`);
  }
  return pageRange;
}

function getSectionRange(question) {
  const sectionRange = findUhrSectionReference(question.chapterId, question.uhrReference.section);
  if (!sectionRange) {
    throw new Error(
      `Missing UHR section range for ${question.id} (${question.chapterId}: ${question.uhrReference.section})`,
    );
  }
  return sectionRange;
}

function exportQuestionBank() {
  const questions = loadTs('data/questions.ts', 'questions');

  assertUniqueExportQuestionIds(questions);

  const rows = [
    QUESTION_BANK_CSV_HEADER,
    ...questions.map((question) => {
      const pageRange = getPageRange(question);
      const sectionRange = getSectionRange(question);
      return [
        question.id,
        question.chapterId,
        question.examScope,
        question.type,
        question.questionSv,
        question.questionEn,
        question.correctOptionId,
        serializeQuestionOptions(question),
        question.uhrReference.chapter,
        question.uhrReference.section,
        question.uhrReference.pageApprox,
        pageRange.startPage,
        pageRange.endPage,
        sectionRange.startPage,
        sectionRange.endPage,
        question.uhrReference.documentTitle,
        question.uhrReference.sourceEdition,
        question.uhrReference.sourceUrl,
        question.difficulty,
        question.reviewStatus,
        question.tags.join('|'),
      ];
    }),
  ];

  const outPath = path.join(repoRoot, 'content', 'question-bank.csv');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`);
  console.log(`Exported ${questions.length} questions to ${path.relative(repoRoot, outPath)}`);
}

if (require.main === module) {
  exportQuestionBank();
}

module.exports = {
  assertUniqueExportQuestionIds,
  exportQuestionBank,
  QUESTION_BANK_CSV_HEADER,
  serializeQuestionOptions,
};
