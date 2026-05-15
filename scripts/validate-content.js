#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];
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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      const relativeResolvedPath = path.relative(repoRoot, resolvedPath);
      return loadTs(relativeResolvedPath);
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function fail(message) {
  failures.push(message);
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questions = loadTs('data/questions.ts', 'questions');

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');

if (Array.isArray(chapters)) {
  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  chapters.forEach((chapter, index) => {
    const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
    if (chapter.id !== expectedId) fail(`expected chapter ${expectedId}, found ${chapter.id}`);
    for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
      if (!chapter[field]) fail(`${chapter.id || expectedId} missing ${field}`);
    }
  });
}

if (Array.isArray(questions)) {
  if (questions.length !== 100) fail(`expected 100 questions, found ${questions.length}`);
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);
  const counts = questions.reduce((acc, question) => {
    acc[question.chapterId] = (acc[question.chapterId] || 0) + 1;
    return acc;
  }, {});

  for (const chapterId of chapterIds) {
    if (!counts[chapterId]) fail(`expected at least 1 question for ${chapterId}`);
  }
  if (counts.ch01 !== 10) fail(`expected 10 ch01 questions, found ${counts.ch01 || 0}`);
  if (counts.ch02 !== 10) fail(`expected 10 ch02 questions, found ${counts.ch02 || 0}`);

  const ids = new Set();
  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    if (!question.id) fail(`question[${index}] missing id`);
    if (ids.has(question.id)) fail(`duplicate question id ${question.id}`);
    ids.add(question.id);
    if (chapterIds.size && !chapterIds.has(question.chapterId)) {
      fail(`${label} references unknown chapter ${question.chapterId}`);
    }

    for (const field of [
      'questionSv',
      'questionEn',
      'explanationSv',
      'explanationEn',
      'correctOptionId',
      'chapterId',
    ]) {
      if (!question[field]) fail(`${label} missing ${field}`);
    }
    if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
      fail(`${label} must have 2 or 4 options`);
    } else if (!question.options.some((option) => option.id === question.correctOptionId)) {
      fail(`${label} correctOptionId does not match an option`);
    }
    if (
      !question.uhrReference?.chapter ||
      !question.uhrReference?.section ||
      !question.uhrReference?.pageApprox
    ) {
      fail(`${label} has incomplete UHR reference`);
    }
    if (question.reviewStatus !== 'reviewed')
      fail(`${label} reviewStatus is ${question.reviewStatus}`);

    const text = [
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
      ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
    ].join(' ');
    if (/official|officiell|real exam|riktiga provfrågor|guaranteed|garanterad/i.test(text)) {
      fail(`${label} appears to overclaim official status or exam certainty`);
    }
  });
}

const practiceScreen = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
const disclaimer = fs.readFileSync(
  path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
  'utf8',
);
if (!practiceScreen.includes('<QuestionDisclaimer />'))
  fail('practice screen is missing QuestionDisclaimer');
if (!/not official/i.test(disclaimer) || !/not real exam questions/i.test(disclaimer)) {
  fail('QuestionDisclaimer missing required independent/not-real-exam wording');
}

if (failures.length) {
  console.error('Content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Content validation OK');
console.log(JSON.stringify({ chapters: chapters.length, questions: questions.length }, null, 2));
