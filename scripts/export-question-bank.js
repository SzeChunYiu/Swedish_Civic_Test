#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { assertQuestionBankProvenanceComposition } = require('./questionBankProvenanceCounts');

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

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function optionPayload(question, field) {
  return JSON.stringify(
    question.options.map((option) => ({
      id: option.id,
      text: option[field],
    })),
  );
}

function supplementalSourcePayload(question, field) {
  const sources = Array.isArray(question.supplementalSources) ? question.supplementalSources : [];
  if (!sources.length) return '';
  return sources.map((source) => source[field] || '').join('|');
}

const questions = loadTs('data/questions.ts', 'questions');
const sourceQuestions = loadTs('data/questions.ts', 'sourceQuestions');
const generatedPublishedQuestions = loadTs('data/questions.ts', 'generatedPublishedQuestions');
const getQuestionProvenance = loadTs('lib/content/provenance.ts', 'getQuestionProvenance');
const getQuestionSourceCitation = loadTs('lib/quiz/questionText.ts', 'getQuestionSourceCitation');
const provenanceComposition = assertQuestionBankProvenanceComposition({
  questions,
  sourceQuestions,
  generatedPublishedQuestions,
  getQuestionProvenance,
});
const uhrSource = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content', 'uhr-section-map.json'), 'utf8'),
).source;
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content', 'uhr-section-map.json'), 'utf8'),
);

function uhrCitation(question, language) {
  return getQuestionSourceCitation({ ...question, supplementalSources: [] }, language);
}

const rows = [
  [
    'id',
    'chapterId',
    'type',
    'questionSv',
    'questionEn',
    'explanationSv',
    'explanationEn',
    'correctOptionId',
    'optionSv',
    'optionEn',
    'uhrChapter',
    'uhrSection',
    'uhrPageApprox',
    'uhrCitationSv',
    'uhrCitationEn',
    'uhrSourceTitle',
    'uhrSourcePublisher',
    'uhrSourceUrl',
    'uhrSourceRetrievedAt',
    'supplementalSourceTitle',
    'supplementalSourcePublisher',
    'supplementalSourceUrl',
    'supplementalSourcePublishedDate',
    'supplementalSourceRetrievedDate',
    'difficulty',
    'reviewStatus',
    'tags',
    'questionProvenance',
  ],
  ...questions.map((question) => [
    question.id,
    question.chapterId,
    question.type,
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.correctOptionId,
    optionPayload(question, 'textSv'),
    optionPayload(question, 'textEn'),
    question.uhrReference.chapter,
    question.uhrReference.section,
    question.uhrReference.pageApprox,
    uhrCitation(question, 'sv'),
    uhrCitation(question, 'en'),
    uhrSource.title,
    uhrSource.publisher,
    uhrSource.url,
    uhrSource.retrievedDate,
    supplementalSourcePayload(question, 'title'),
    supplementalSourcePayload(question, 'publisher'),
    supplementalSourcePayload(question, 'url'),
    supplementalSourcePayload(question, 'publishedDate'),
    supplementalSourcePayload(question, 'retrievedDate'),
    question.difficulty,
    question.reviewStatus,
    question.tags.join('|'),
    getQuestionProvenance(question),
  ]),
];

const outPath = path.join(repoRoot, 'content', 'question-bank.csv');
const csv = `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;

if (checkMode) {
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (existing !== csv) {
    console.error('content/question-bank.csv is out of sync; run npm run content:export');
    process.exit(1);
  }
  console.log(
    `Question bank export parity OK (${questions.length} questions; provenance uhr=${provenanceComposition.counts.uhr}, derived=${provenanceComposition.counts.derived}, editorial=${provenanceComposition.counts.editorial})`,
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, csv);
console.log(`Exported ${questions.length} questions to ${path.relative(repoRoot, outPath)}`);
