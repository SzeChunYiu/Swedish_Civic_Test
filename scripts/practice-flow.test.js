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

test('practice flow keeps answered question locked until explicit advance', () => {
  const { getPracticeQuestionForSession } = loadTs('lib/quiz/practiceFlow.ts');
  const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

  assert.equal(getPracticeQuestionForSession(questions, [], null)?.id, 'q1');
  assert.equal(getPracticeQuestionForSession(questions, ['q1'], 'q1')?.id, 'q1');
  assert.equal(getPracticeQuestionForSession(questions, ['q1'], null)?.id, 'q2');
  assert.equal(getPracticeQuestionForSession(questions, ['q1', 'q2', 'q3'], null)?.id, 'q1');
});

test('practice session separates retry from next-question advancement', () => {
  const { usePracticeSessionStore } = loadTs('lib/quiz/practiceSessionStore.ts');

  usePracticeSessionStore.setState({
    activeQuestionId: null,
    selectedOptionId: null,
    shuffleSessionId: 'practice-session-0',
  });

  usePracticeSessionStore.getState().selectOption('q1', 'q1-a');

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, 'q1-a');
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');

  usePracticeSessionStore.getState().resetSelection();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');

  usePracticeSessionStore.getState().advanceQuestion();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, null);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-1');
});

test('chapter quiz session id resolves to the first question in that chapter', () => {
  const { getChapterQuizSessionId, getFirstQuestionForChapter } = loadTs(
    'lib/quiz/practiceFlow.ts',
  );
  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch02' },
    { id: 'q3', chapterId: 'ch01' },
  ];

  assert.equal(getFirstQuestionForChapter(questions, 'ch01')?.id, 'q1');
  assert.equal(getChapterQuizSessionId(questions, 'ch01'), 'q1');
  assert.equal(getChapterQuizSessionId(questions, 'ch02'), 'q2');
  assert.equal(getChapterQuizSessionId(questions, 'missing'), null);
  assert.equal(getChapterQuizSessionId(questions, null), null);
});
