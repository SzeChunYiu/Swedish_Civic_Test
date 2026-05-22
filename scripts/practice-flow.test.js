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

test('adaptive practice flow follows adaptive order without repeating session answers', () => {
  const { getAvailableQuestionsForPracticeSession, getPracticeQuestionFromAdaptiveOrder } = loadTs(
    'lib/quiz/practiceFlow.ts',
  );
  const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

  assert.deepEqual(getAvailableQuestionsForPracticeSession(questions, []), questions);
  assert.deepEqual(getAvailableQuestionsForPracticeSession(questions, ['q2']), [
    { id: 'q1' },
    { id: 'q3' },
  ]);
  assert.deepEqual(
    getAvailableQuestionsForPracticeSession(questions, ['q1', 'q2', 'q3']),
    questions,
  );
  assert.equal(getPracticeQuestionFromAdaptiveOrder(questions, ['q2', 'q1'], null)?.id, 'q2');
  assert.equal(getPracticeQuestionFromAdaptiveOrder(questions, ['q2', 'q1'], 'q3')?.id, 'q3');
  assert.equal(getPracticeQuestionFromAdaptiveOrder(questions, ['missing'], null)?.id, 'q1');
});

test('practice session separates retry from next-question advancement', () => {
  const { getPracticeInterstitialShowKey, usePracticeSessionStore } = loadTs(
    'lib/quiz/practiceSessionStore.ts',
  );

  usePracticeSessionStore.setState({
    activeQuestionId: null,
    answeredQuestionIds: [],
    selectedOptionId: null,
    shuffleSessionId: 'practice-session-0',
    struckOptionIdsByQuestionId: {},
  });

  usePracticeSessionStore.getState().toggleStruckOption('q1', 'q1-b');
  assert.deepEqual(usePracticeSessionStore.getState().struckOptionIdsByQuestionId, {
    q1: ['q1-b'],
  });

  usePracticeSessionStore.getState().selectOption('q1', 'q1-b');
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);

  usePracticeSessionStore.getState().toggleStruckOption('q1', 'q1-b');
  assert.deepEqual(usePracticeSessionStore.getState().struckOptionIdsByQuestionId, {});

  usePracticeSessionStore.getState().selectOption('q1', 'q1-a');

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.deepEqual(usePracticeSessionStore.getState().answeredQuestionIds, []);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, 'q1-a');
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');
  const firstFeedbackKey = getPracticeInterstitialShowKey(
    usePracticeSessionStore.getState().activeQuestionId,
    usePracticeSessionStore.getState().shuffleSessionId,
  );

  usePracticeSessionStore.getState().resetSelection();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q1');
  assert.deepEqual(usePracticeSessionStore.getState().answeredQuestionIds, []);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.deepEqual(usePracticeSessionStore.getState().struckOptionIdsByQuestionId, {});
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-0');
  assert.equal(
    getPracticeInterstitialShowKey(
      usePracticeSessionStore.getState().activeQuestionId,
      usePracticeSessionStore.getState().shuffleSessionId,
    ),
    firstFeedbackKey,
  );

  usePracticeSessionStore.getState().advanceQuestion();

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, null);
  assert.deepEqual(usePracticeSessionStore.getState().answeredQuestionIds, ['q1']);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.deepEqual(usePracticeSessionStore.getState().struckOptionIdsByQuestionId, {});
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-1');
  assert.notEqual(
    getPracticeInterstitialShowKey('q1', usePracticeSessionStore.getState().shuffleSessionId),
    firstFeedbackKey,
  );
});

test('practice session start clears answer state when visible sources change', () => {
  const { getPracticeAnswerXpAwardKey, usePracticeSessionStore } = loadTs(
    'lib/quiz/practiceSessionStore.ts',
  );

  usePracticeSessionStore.setState({
    activeQuestionId: 'q180',
    answeredQuestionIds: ['q180'],
    answerXpAwardedKey: getPracticeAnswerXpAwardKey('q180', 'practice-session-7'),
    selectedOptionId: 'b',
    shuffleSessionId: 'practice-session-7',
    struckOptionIdsByQuestionId: {
      q001: ['a'],
      q180: ['c'],
    },
  });

  usePracticeSessionStore.getState().startSession('q001');

  assert.equal(usePracticeSessionStore.getState().activeQuestionId, 'q001');
  assert.deepEqual(usePracticeSessionStore.getState().answeredQuestionIds, []);
  assert.equal(usePracticeSessionStore.getState().answerXpAwardedKey, null);
  assert.equal(usePracticeSessionStore.getState().selectedOptionId, null);
  assert.deepEqual(usePracticeSessionStore.getState().struckOptionIdsByQuestionId, {});
  assert.equal(usePracticeSessionStore.getState().shuffleSessionId, 'practice-session-8');
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
