#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

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

const questions = loadTs('data/questions.ts', 'questions');
const getQuestionProvenance = loadTs('lib/content/provenance.ts', 'getQuestionProvenance');
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content', 'uhr-section-map.json'), 'utf8'),
);
const rows = [
  [
    'id',
    'chapterId',
    'type',
    'questionSv',
    'questionEn',
    'correctOptionId',
    'uhrChapter',
    'uhrSection',
    'uhrPageApprox',
    'uhrSourcePublisher',
    'difficulty',
    'reviewStatus',
    'tags',
  ],
  ...questions.map((question) => [
    question.id,
    question.chapterId,
    question.type,
    question.questionSv,
    question.questionEn,
    question.correctOptionId,
    question.uhrReference.chapter,
    question.uhrReference.section,
    question.uhrReference.pageApprox,
    uhrSectionMap.source.publisher,
    question.difficulty,
    question.reviewStatus,
    question.tags.join('|'),
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
  console.log(`Question bank export parity OK (${questions.length} questions)`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, csv);
console.log(`Exported ${questions.length} questions to ${path.relative(repoRoot, outPath)}`);
