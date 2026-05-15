const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

const baseQuestion = {
  id: 'q1',
  chapterId: 'ch01',
  type: 'single_choice',
  questionSv: 'Fråga?',
  questionEn: 'Question?',
  options: [{ id: 'a', textSv: 'A', textEn: 'A' }],
  correctOptionId: 'a',
  explanationSv: 'Förklaring',
  explanationEn: 'Explanation',
  uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
  difficulty: 'easy',
  reviewStatus: 'reviewed',
  tags: [],
};

test('generateExam selects reviewed or published UHR-based questions up to requested count', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'q1' },
    { ...baseQuestion, id: 'q2', chapterId: 'ch02', reviewStatus: 'published' },
    { ...baseQuestion, id: 'draft', reviewStatus: 'draft' },
    { ...baseQuestion, id: 'no-source', uhrReference: undefined },
  ];

  const exam = generateExam(questions, { questionCount: 2 });

  assert.equal(exam.length, 2);
  assert.deepEqual(
    exam.map((question) => question.id),
    ['q1', 'q2'],
  );
});

test('scoreExam returns score and per-chapter breakdown', () => {
  const { scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'q1', chapterId: 'ch01', correctOptionId: 'a' },
    { ...baseQuestion, id: 'q2', chapterId: 'ch02', correctOptionId: 'b' },
  ];
  const result = scoreExam(questions, { q1: 'a', q2: 'a' });

  assert.equal(result.correctCount, 1);
  assert.equal(result.totalCount, 2);
  assert.equal(result.percent, 50);
  assert.deepEqual(result.chapterBreakdown, [
    { chapterId: 'ch01', correctCount: 1, totalCount: 1 },
    { chapterId: 'ch02', correctCount: 0, totalCount: 1 },
  ]);
});

test('formatExamTime renders remaining seconds as mm:ss', () => {
  const { formatExamTime } = loadTs('lib/quiz/examGenerator.ts');

  assert.equal(formatExamTime(1800), '30:00');
  assert.equal(formatExamTime(75), '01:15');
  assert.equal(formatExamTime(-5), '00:00');
});
