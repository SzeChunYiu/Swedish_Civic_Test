#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const checkMode = process.argv.includes('--check');
const QUESTION_PROVENANCE_VALUES = ['uhr', 'derived', 'editorial'];

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

function emptyProvenanceCounts() {
  return QUESTION_PROVENANCE_VALUES.reduce((counts, provenance) => {
    counts[provenance] = 0;
    return counts;
  }, {});
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function provenanceFromTags(question) {
  const tags = Array.isArray(question.tags) ? question.tags : [];
  if (tags.includes('editorial')) return 'editorial';
  if (tags.includes('published-variant')) return 'derived';
  return 'uhr';
}

function countQuestionProvenanceFromRows(dataRows, provenanceIndex, sourceLabel) {
  const counts = emptyProvenanceCounts();
  dataRows.forEach((row, index) => {
    const provenance = row[provenanceIndex];
    if (!QUESTION_PROVENANCE_VALUES.includes(provenance)) {
      throw new Error(
        `${sourceLabel} row ${index + 2} questionProvenance is ${JSON.stringify(
          provenance,
        )}, expected one of ${QUESTION_PROVENANCE_VALUES.join(', ')}`,
      );
    }
    counts[provenance] += 1;
  });
  return counts;
}

function validateQuestionProvenanceComposition(tableRows, sourceLabel) {
  const header = tableRows[0] ?? [];
  const provenanceIndex = header.indexOf('questionProvenance');
  if (provenanceIndex < 0) {
    throw new Error(`${sourceLabel} is missing questionProvenance column`);
  }

  const actualCounts = countQuestionProvenanceFromRows(
    tableRows.slice(1),
    provenanceIndex,
    sourceLabel,
  );
  const helperCounts = emptyProvenanceCounts();
  const tagCounts = emptyProvenanceCounts();

  questions.forEach((question) => {
    const helperProvenance = getQuestionProvenance(question);
    if (!QUESTION_PROVENANCE_VALUES.includes(helperProvenance)) {
      throw new Error(
        `question ${question.id} helper returned unsupported questionProvenance ${JSON.stringify(
          helperProvenance,
        )}`,
      );
    }
    helperCounts[helperProvenance] += 1;
    tagCounts[provenanceFromTags(question)] += 1;
  });

  if (!jsonEqual(actualCounts, helperCounts)) {
    throw new Error(
      `${sourceLabel} provenance counts are ${JSON.stringify(
        actualCounts,
      )}, expected helper-derived ${JSON.stringify(helperCounts)}`,
    );
  }
  if (!jsonEqual(helperCounts, tagCounts)) {
    throw new Error(
      `question-bank export provenance helper composition is ${JSON.stringify(
        helperCounts,
      )}, expected tag-derived ${JSON.stringify(tagCounts)}`,
    );
  }
  if (tagCounts.derived !== generatedPublishedQuestions.length) {
    throw new Error(
      `question-bank export derived provenance count is ${tagCounts.derived}, expected generatedPublishedQuestions ${generatedPublishedQuestions.length}`,
    );
  }
  if (tagCounts.uhr + tagCounts.editorial !== sourceQuestions.length) {
    throw new Error(
      `question-bank export source provenance count is ${
        tagCounts.uhr + tagCounts.editorial
      }, expected sourceQuestions ${sourceQuestions.length}`,
    );
  }

  const total = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
  if (total !== questions.length) {
    throw new Error(
      `question-bank export provenance count total is ${total}, expected ${questions.length}`,
    );
  }
}

function parseCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

function parseCsvRows(csvText) {
  return csvText.trimEnd().split('\n').map(parseCsvLine);
}

const questionModule = loadTs('data/questions.ts');
const questions = questionModule.questions;
const sourceQuestions = questionModule.sourceQuestions;
const generatedPublishedQuestions = questionModule.generatedPublishedQuestions;
const getQuestionProvenance = loadTs('lib/content/provenance.ts', 'getQuestionProvenance');
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content', 'uhr-section-map.json'), 'utf8'),
);
const uhrSource = uhrSectionMap.source ?? {};
const rows = [
  [
    'id',
    'chapterId',
    'type',
    'questionSv',
    'questionEn',
    'correctOptionId',
    'optionSv',
    'optionEn',
    'correctOptionSv',
    'correctOptionEn',
    'uhrChapter',
    'uhrSection',
    'uhrPageApprox',
    'uhrSourceTitle',
    'uhrSourcePublisher',
    'uhrSourceUrl',
    'uhrSourceRetrievedAt',
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
    optionPayload(question, 'textSv'),
    optionPayload(question, 'textEn'),
    question.options.find((option) => option.id === question.correctOptionId)?.textSv,
    question.options.find((option) => option.id === question.correctOptionId)?.textEn,
    question.uhrReference.chapter,
    question.uhrReference.section,
    question.uhrReference.pageApprox,
    uhrSource.title,
    uhrSource.publisher,
    uhrSource.url,
    uhrSource.retrievedDate,
    question.difficulty,
    question.reviewStatus,
    question.tags.join('|'),
  ]),
];

const outPath = path.join(repoRoot, 'content', 'question-bank.csv');
const csv = `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
validateQuestionProvenanceComposition(rows, 'generated question-bank export');

if (checkMode) {
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (existing) {
    validateQuestionProvenanceComposition(parseCsvRows(existing), 'content/question-bank.csv');
  }
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
