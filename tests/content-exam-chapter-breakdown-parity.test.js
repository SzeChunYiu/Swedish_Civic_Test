const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
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

function firstWrongOptionId(question) {
  return question.options.find((option) => option.id !== question.correctOptionId)?.id;
}

function buildAlternatingExamAnswers(examQuestions) {
  return Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
}

test('default mock exam chapter breakdown preserves scored counts and chapter names', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const chapters = loadTs('data/chapters.ts', 'chapters');
  const { questions } = loadTs('data/questions.ts');
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const { buildExamChapterBreakdownItems, generateExam, scoreExam } = loadTs(
    'lib/quiz/examGenerator.ts',
  );
  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = buildAlternatingExamAnswers(examQuestions);
  const result = scoreExam(examQuestions, answers);
  const breakdownItems = buildExamChapterBreakdownItems(result.chapterBreakdown, chapters);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const expectedByChapter = new Map();

  examQuestions.forEach((question) => {
    const previous = expectedByChapter.get(question.chapterId) ?? {
      correctCount: 0,
      totalCount: 0,
    };
    expectedByChapter.set(question.chapterId, {
      correctCount:
        previous.correctCount + (answers[question.id] === question.correctOptionId ? 1 : 0),
      totalCount: previous.totalCount + 1,
    });
  });

  assert.equal(summary.examChapterBreakdownItemsValidated, expectedByChapter.size);
  assert.equal(summary.examChapterBreakdownParityValidated, true);
  assert.equal(result.totalCount, examQuestions.length);
  assert.equal(breakdownItems.length, expectedByChapter.size);
  assert.equal(
    breakdownItems.reduce((sum, item) => sum + item.totalCount, 0),
    examQuestions.length,
  );

  breakdownItems.forEach((item) => {
    const chapter = chapterById.get(item.chapterId);
    const expected = expectedByChapter.get(item.chapterId);

    assert.equal(item.chapterNameSv, chapter.nameSv);
    assert.equal(item.chapterNameEn, chapter.nameEn);
    assert.equal(item.correctCount, expected.correctCount);
    assert.equal(item.totalCount, expected.totalCount);
  });
});
