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

test('practice flow scopes completed progress to the visible question bank', () => {
  const { getCompletedQuestionIdsForQuestionBank, getPracticeQuestionForSession } = loadTs(
    'lib/quiz/practiceFlow.ts',
  );
  const visibleQuestions = [{ id: 'uhr-1' }, { id: 'uhr-2' }];

  assert.deepEqual(
    getCompletedQuestionIdsForQuestionBank(visibleQuestions, ['supplementary-1']),
    [],
  );
  assert.equal(
    getPracticeQuestionForSession(visibleQuestions, ['supplementary-1'], null)?.id,
    'uhr-1',
  );
  assert.deepEqual(
    getCompletedQuestionIdsForQuestionBank(visibleQuestions, ['supplementary-1', 'uhr-1', 'uhr-1']),
    ['uhr-1'],
  );
  assert.equal(
    getPracticeQuestionForSession(visibleQuestions, ['supplementary-1', 'uhr-1'], null)?.id,
    'uhr-2',
  );
  assert.equal(getPracticeQuestionForSession(visibleQuestions, ['uhr-2'], null)?.id, 'uhr-1');
  assert.equal(
    getPracticeQuestionForSession(visibleQuestions, ['uhr-1', 'supplementary-1', 'uhr-2'], null)
      ?.id,
    'uhr-1',
  );
});

test('practice session separates retry from next-question advancement', () => {
  const { getPracticeInterstitialShowKey, usePracticeSessionStore } = loadTs(
    'lib/quiz/practiceSessionStore.ts',
  );

  usePracticeSessionStore.setState({
    activeQuestionId: null,
    selectedOptionId: null,
    shuffleSessionId: 'practice-session-0',
  });

  usePracticeSessionStore.getState().selectOption('q1', 'q1-a');
  const firstFeedbackShowKey = getPracticeInterstitialShowKey(
    usePracticeSessionStore.getState().activeQuestionId,
    usePracticeSessionStore.getState().shuffleSessionId,
  );

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, 'q1-a');
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');

  usePracticeSessionStore.getState().resetSelection();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');

  usePracticeSessionStore.getState().selectOption('q1', 'q1-b');
  assert.equal(
    getPracticeInterstitialShowKey(
      usePracticeSessionStore.getState().activeQuestionId,
      usePracticeSessionStore.getState().shuffleSessionId,
    ),
    firstFeedbackShowKey,
  );
  assert.doesNotMatch(firstFeedbackShowKey, /q1-a|q1-b/);

  usePracticeSessionStore.getState().advanceQuestion();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, null);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-1');
  assert.notEqual(getPracticeInterstitialShowKey('q2', 'practice-session-1'), firstFeedbackShowKey);
});

test('practice scope selects all, chapter, and ten-question mixed quick rounds', () => {
  const { getQuestionsForPracticeScope } = loadTs('lib/quiz/practiceFlow.ts');
  const questions = [
    { id: 'q-scope-1a', chapterId: 'ch01' },
    { id: 'q-scope-1b', chapterId: 'ch01' },
    { id: 'q-scope-1c', chapterId: 'ch01' },
    { id: 'q-scope-2a', chapterId: 'ch02' },
    { id: 'q-scope-2b', chapterId: 'ch02' },
    { id: 'q-scope-3a', chapterId: 'ch03' },
    { id: 'q-scope-3b', chapterId: 'ch03' },
    { id: 'q-scope-4a', chapterId: 'ch04' },
    { id: 'q-scope-5a', chapterId: 'ch05' },
    { id: 'q-scope-6a', chapterId: 'ch06' },
    { id: 'q-scope-7a', chapterId: 'ch07' },
  ];

  assert.deepEqual(
    getQuestionsForPracticeScope(questions, ['q-scope-1a'], { type: 'all' }, 10).map(
      (question) => question.id,
    ),
    questions.map((question) => question.id),
  );
  assert.deepEqual(
    getQuestionsForPracticeScope(questions, [], { type: 'chapter', chapterId: 'ch02' }, 10).map(
      (question) => question.id,
    ),
    ['q-scope-2a', 'q-scope-2b'],
  );
  assert.deepEqual(
    getQuestionsForPracticeScope(
      questions,
      ['q-scope-1a', 'q-scope-2a'],
      { type: 'quick' },
      10,
    ).map((question) => question.id),
    [
      'q-scope-1b',
      'q-scope-2b',
      'q-scope-3a',
      'q-scope-4a',
      'q-scope-5a',
      'q-scope-6a',
      'q-scope-7a',
      'q-scope-1c',
      'q-scope-3b',
      'q-scope-1a',
    ],
  );
});

test('practice quick round fills from answered questions when unanswered is sparse', () => {
  const { getQuestionsForPracticeScope } = loadTs('lib/quiz/practiceFlow.ts');
  const questions = [
    { id: 'q-scope-1a', chapterId: 'ch01' },
    { id: 'q-scope-1b', chapterId: 'ch01' },
    { id: 'q-scope-2a', chapterId: 'ch02' },
    { id: 'q-scope-3a', chapterId: 'ch03' },
  ];

  assert.deepEqual(
    getQuestionsForPracticeScope(
      questions,
      ['q-scope-1a', 'q-scope-2a', 'q-scope-3a'],
      { type: 'quick' },
      3,
    ).map((question) => question.id),
    ['q-scope-1b', 'q-scope-1a', 'q-scope-2a'],
  );
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
