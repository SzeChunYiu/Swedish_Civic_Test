const assert = require('node:assert/strict');
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

test('generateExam balances chapter coverage before repeating a chapter', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'ch01-a', chapterId: 'ch01' },
    { ...baseQuestion, id: 'ch01-b', chapterId: 'ch01' },
    { ...baseQuestion, id: 'ch02-a', chapterId: 'ch02' },
    { ...baseQuestion, id: 'ch02-b', chapterId: 'ch02' },
    { ...baseQuestion, id: 'ch03-a', chapterId: 'ch03' },
    { ...baseQuestion, id: 'ch03-b', chapterId: 'ch03' },
  ];

  const exam = generateExam(questions, { questionCount: 5 });

  assert.equal(exam.length, 5);
  assert.deepEqual(
    exam.slice(0, 3).map((question) => question.chapterId),
    ['ch01', 'ch02', 'ch03'],
  );
  assert.equal(new Set(exam.map((question) => question.id)).size, exam.length);
  const chapterCounts = exam.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
  const counts = [...chapterCounts.values()];
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});

test('generateExam rotates question ids by session while preserving deterministic balance', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = ['ch01', 'ch02', 'ch03'].flatMap((chapterId) =>
    ['a', 'b', 'c', 'd'].map((slot) => ({
      ...baseQuestion,
      id: `${chapterId}-${slot}`,
      chapterId,
    })),
  );
  const firstSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-0',
  });
  const firstSessionRepeat = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-0',
  });
  const secondSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-1',
  });
  const thirdSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-2',
  });
  const idsFor = (exam) => exam.map((question) => question.id);

  assert.deepEqual(idsFor(firstSession), idsFor(firstSessionRepeat));
  assert.notDeepEqual(idsFor(firstSession), idsFor(secondSession));
  assert.notDeepEqual(idsFor(secondSession), idsFor(thirdSession));

  for (const exam of [firstSession, secondSession, thirdSession]) {
    assert.equal(new Set(idsFor(exam)).size, exam.length);
    const chapterCounts = exam.reduce((counts, question) => {
      counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
      return counts;
    }, new Map());
    assert.deepEqual([...chapterCounts.values()].sort(), [2, 2, 2]);
  }
});

test('generateExam preserves scoring and review after session answer shuffle', () => {
  const { buildExamReviewItems, generateExam, scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const sourceQuestion = {
    ...baseQuestion,
    id: 'q-shuffle',
    options: [
      { id: 'a', textSv: 'Rätt ursprungssvar', textEn: 'Original correct answer' },
      { id: 'b', textSv: 'Distraktor B', textEn: 'Distractor B' },
      { id: 'c', textSv: 'Distraktor C', textEn: 'Distractor C' },
      { id: 'd', textSv: 'Distraktor D', textEn: 'Distractor D' },
    ],
    correctOptionId: 'a',
  };

  const shuffledExam = Array.from({ length: 12 }, (_unused, index) =>
    generateExam([sourceQuestion], {
      questionCount: 1,
      sessionId: `mock-exam-shuffle-${index}`,
    }),
  ).find(([question]) => question.correctOptionId !== sourceQuestion.correctOptionId);

  assert.ok(shuffledExam, 'at least one deterministic exam session should move the correct answer');
  const [question] = shuffledExam;
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  assert.deepEqual(
    question.options.map((option) => option.id),
    ['a', 'b', 'c', 'd'],
  );
  assert.equal(correctOption.textSv, 'Rätt ursprungssvar');
  assert.equal(correctOption.textEn, 'Original correct answer');
  assert.deepEqual(scoreExam([question], { [question.id]: question.correctOptionId }), {
    correctCount: 1,
    totalCount: 1,
    percent: 100,
    chapterBreakdown: [{ chapterId: 'ch01', correctCount: 1, totalCount: 1 }],
  });

  const [review] = buildExamReviewItems([question], { [question.id]: question.correctOptionId });

  assert.equal(review.isCorrect, true);
  assert.equal(review.correctOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.correctOptionTextEn, 'Original correct answer');
  assert.equal(review.selectedOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.selectedOptionTextEn, 'Original correct answer');
});

test('generateExam review keeps selected wrong answer text after session answer shuffle', () => {
  const { buildExamReviewItems, generateExam, scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const sourceQuestion = {
    ...baseQuestion,
    id: 'q-shuffle-wrong-review',
    options: [
      { id: 'a', textSv: 'Rätt ursprungssvar', textEn: 'Original correct answer' },
      { id: 'b', textSv: 'Distraktor B', textEn: 'Distractor B' },
      { id: 'c', textSv: 'Distraktor C', textEn: 'Distractor C' },
      { id: 'd', textSv: 'Distraktor D', textEn: 'Distractor D' },
    ],
    correctOptionId: 'a',
  };

  const shuffledExam = Array.from({ length: 12 }, (_unused, index) =>
    generateExam([sourceQuestion], {
      questionCount: 1,
      sessionId: `mock-exam-wrong-review-${index}`,
    }),
  ).find(([question]) => question.correctOptionId !== sourceQuestion.correctOptionId);

  assert.ok(shuffledExam, 'at least one deterministic exam session should move the correct answer');
  const [question] = shuffledExam;
  const selectedWrongOption = question.options.find(
    (option) => option.id !== question.correctOptionId,
  );
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  assert.ok(selectedWrongOption, 'shuffled question should expose a selectable wrong answer');
  assert.ok(correctOption, 'shuffled question should expose the remapped correct answer');
  assert.deepEqual(scoreExam([question], { [question.id]: selectedWrongOption.id }), {
    correctCount: 0,
    totalCount: 1,
    percent: 0,
    chapterBreakdown: [{ chapterId: 'ch01', correctCount: 0, totalCount: 1 }],
  });

  const [review] = buildExamReviewItems([question], { [question.id]: selectedWrongOption.id });

  assert.equal(review.isCorrect, false);
  assert.equal(review.selectedOptionTextSv, selectedWrongOption.textSv);
  assert.equal(review.selectedOptionTextEn, selectedWrongOption.textEn);
  assert.equal(review.correctOptionTextSv, correctOption.textSv);
  assert.equal(review.correctOptionTextEn, correctOption.textEn);
  assert.equal(review.correctOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.correctOptionTextEn, 'Original correct answer');
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

test('countUnansweredExamQuestions treats missing answers as incomplete', () => {
  const { countUnansweredExamQuestions, scoreExam, buildExamReviewItems } = loadTs(
    'lib/quiz/examGenerator.ts',
  );
  const questions = [
    { ...baseQuestion, id: 'q1', correctOptionId: 'a' },
    { ...baseQuestion, id: 'q2', correctOptionId: 'b' },
    { ...baseQuestion, id: 'q3', correctOptionId: 'a' },
  ];
  const answers = { q1: 'a' };

  assert.equal(countUnansweredExamQuestions(questions, answers), 2);
  assert.deepEqual(scoreExam(questions, answers), {
    correctCount: 1,
    totalCount: 3,
    percent: 33,
    chapterBreakdown: [{ chapterId: 'ch01', correctCount: 1, totalCount: 3 }],
  });

  const reviewItems = buildExamReviewItems(questions, answers);

  assert.equal(reviewItems[1].selectedOptionTextSv, 'Inte besvarad');
  assert.equal(reviewItems[1].selectedOptionTextEn, 'Not answered');
  assert.equal(reviewItems[2].selectedOptionTextSv, 'Inte besvarad');
  assert.equal(reviewItems[2].selectedOptionTextEn, 'Not answered');
});

test('buildExamChapterBreakdownItems adds human-readable chapter names', () => {
  const { buildExamChapterBreakdownItems } = loadTs('lib/quiz/examGenerator.ts');
  const breakdown = [
    { chapterId: 'ch01', correctCount: 1, totalCount: 2 },
    { chapterId: 'unknown', correctCount: 0, totalCount: 1 },
  ];
  const chapters = [
    {
      id: 'ch01',
      nameSv: 'Landet Sverige',
      nameEn: 'The country of Sweden',
      descriptionSv: '',
      descriptionEn: '',
      questionCount: 0,
    },
  ];

  assert.deepEqual(buildExamChapterBreakdownItems(breakdown, chapters), [
    {
      chapterId: 'ch01',
      chapterNameSv: 'Landet Sverige',
      chapterNameEn: 'The country of Sweden',
      correctCount: 1,
      totalCount: 2,
    },
    {
      chapterId: 'unknown',
      chapterNameSv: 'unknown',
      chapterNameEn: 'unknown',
      correctCount: 0,
      totalCount: 1,
    },
  ]);
});

test('buildExamReviewItems returns selected answer, correct answer, source, and explanation', () => {
  const { buildExamReviewItems } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    {
      ...baseQuestion,
      id: 'q1',
      correctOptionId: 'b',
      options: [
        { id: 'a', textSv: 'Fel svar', textEn: 'Wrong answer' },
        { id: 'b', textSv: 'Rätt svar', textEn: 'Correct answer' },
      ],
    },
  ];

  const [review] = buildExamReviewItems(questions, { q1: 'a' });

  assert.equal(review.questionId, 'q1');
  assert.equal(review.isCorrect, false);
  assert.equal(review.selectedOptionTextSv, 'Fel svar');
  assert.equal(review.selectedOptionTextEn, 'Wrong answer');
  assert.equal(review.correctOptionTextSv, 'Rätt svar');
  assert.equal(review.correctOptionTextEn, 'Correct answer');
  assert.equal(review.explanationSv, 'Förklaring');
  assert.equal(review.explanationEn, 'Explanation');
  assert.deepEqual(review.uhrReference, baseQuestion.uhrReference);
});

test('buildExamReviewItems localizes unanswered and missing-correct fallbacks', () => {
  const { buildExamReviewItems } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    {
      ...baseQuestion,
      id: 'q-unanswered',
      correctOptionId: 'missing',
      options: [{ id: 'a', textSv: 'Svar', textEn: 'Answer' }],
    },
  ];

  const [review] = buildExamReviewItems(questions, {});

  assert.equal(review.selectedOptionTextSv, 'Inte besvarad');
  assert.equal(review.selectedOptionTextEn, 'Not answered');
  assert.equal(review.correctOptionTextSv, 'Rätt svar saknas');
  assert.equal(review.correctOptionTextEn, 'Correct answer missing');
});

test('buildMockExamQuizSession keeps submitted answers with per-question timing', () => {
  const { buildMockExamQuizSession } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    {
      ...baseQuestion,
      id: 'q1',
      correctOptionId: 'a',
      options: [
        { id: 'a', textSv: 'Rätt', textEn: 'Correct' },
        { id: 'b', textSv: 'Fel', textEn: 'Wrong' },
      ],
    },
    {
      ...baseQuestion,
      id: 'q2',
      correctOptionId: 'b',
      options: [
        { id: 'a', textSv: 'Fel', textEn: 'Wrong' },
        { id: 'b', textSv: 'Rätt', textEn: 'Correct' },
      ],
    },
    { ...baseQuestion, id: 'q3', correctOptionId: 'a' },
  ];

  const session = buildMockExamQuizSession({
    answers: { q1: 'a', q2: 'a' },
    completedAt: '2026-05-20T10:05:00.000Z',
    questionTimings: { q1: 12.3, q2: 35, q3: Number.NaN },
    questions,
    sessionId: 'mock-exam-42',
    startedAt: '2026-05-20T09:45:00.000Z',
  });

  assert.equal(session.id, 'mock-exam-42');
  assert.equal(session.mode, 'exam');
  assert.deepEqual(session.questionIds, ['q1', 'q2', 'q3']);
  assert.equal(session.score, 1 / 3);
  assert.deepEqual(
    session.answers.map((answer) => ({
      isCorrect: answer.isCorrect,
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      timeSpentSeconds: answer.timeSpentSeconds,
    })),
    [
      { isCorrect: true, questionId: 'q1', selectedOptionIds: ['a'], timeSpentSeconds: 12 },
      { isCorrect: false, questionId: 'q2', selectedOptionIds: ['a'], timeSpentSeconds: 35 },
      { isCorrect: false, questionId: 'q3', selectedOptionIds: [], timeSpentSeconds: 0 },
    ],
  );
});

test('exam route wires timed quiz-session diagnostics to the review heatmap', () => {
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const progressStoreSource = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );
  const heatmapSource = fs.readFileSync(
    path.join(repoRoot, 'components/MockExamTimeHeatmap.tsx'),
    'utf8',
  );

  assert.match(examRouteSource, /buildMockExamQuizSession/);
  assert.match(examRouteSource, /buildExamDiagnostic/);
  assert.match(examRouteSource, /MockExamTimeHeatmap/);
  assert.match(examRouteSource, /recordQuestionAnswer/);
  assert.match(examRouteSource, /examActive: examUnlocked/);
  assert.match(examRouteSource, /!examUnlocked \|\| submitted/);
  assert.match(examRouteSource, /questionTimings:/);
  assert.match(examRouteSource, /scrollTo\(\{ animated: true/);
  assert.match(progressStoreSource, /export type MockExamQuestionTiming = \{/);
  assert.match(progressStoreSource, /questionTimings: MockExamQuestionTiming\[\]/);
  assert.match(progressStoreSource, /normalizeMockExamQuestionTimings/);
  assert.match(heatmapSource, /rushed/);
  assert.match(heatmapSource, /overthought/);
  assert.match(heatmapSource, /stuck/);
  assert.match(heatmapSource, /normalizeHeatmapSeconds/);
  assert.match(heatmapSource, /normalizeMedianSecondsFromMs/);
  assert.match(heatmapSource, /isStrictlyCorrectAnswer/);
  assert.doesNotMatch(heatmapSource, /Math\.round\(answer\.timeSpentSeconds\)/);
  assert.doesNotMatch(heatmapSource, /Math\.round\(medianMs \/ 1000\)/);
});

test('exam route keeps flag-for-review state local to the current attempt', () => {
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const navigatorSource = fs.readFileSync(
    path.join(repoRoot, 'components/QuestionNavigator.tsx'),
    'utf8',
  );
  const sessionBuilderCall =
    examRouteSource.match(/buildMockExamQuizSession\(\{[\s\S]*?\n\s*\}\)/)?.[0] ?? '';
  const progressRecordCall =
    examRouteSource.match(/recordMockExamSession\(\{[\s\S]*?\n\s*\}\);/)?.[0] ?? '';
  const activeNavigatorCall = examRouteSource.match(/<QuestionNavigator[\s\S]*?\/>/)?.[0] ?? '';

  assert.match(
    examRouteSource,
    /const \[flaggedQuestionIds, setFlaggedQuestionIds\] = useState<Record<string, true>>\(\{\}\);/,
  );
  assert.match(examRouteSource, /const toggleFlaggedQuestion = useCallback/);
  assert.match(examRouteSource, /setFlaggedQuestionIds\(\{\}\);/);
  assert.match(
    examRouteSource,
    /const \[reviewFilter, setReviewFilter\] = useState<ReviewFilter>\('all'\);/,
  );
  assert.match(examRouteSource, /const flaggedReviewCount = reviewItems\.filter/);
  assert.match(examRouteSource, /const filteredReviewItems =/);
  assert.match(examRouteSource, /reviewFilter === 'flagged'/);
  assert.match(examRouteSource, /copy\.flaggedReviewCount\(flaggedReviewCount\)/);
  assert.match(
    examRouteSource,
    /copy\.reviewFilterSummary\(filteredReviewItems\.length, reviewItems\.length\)/,
  );
  assert.match(examRouteSource, /copy\.reviewFilterFlagged\(flaggedReviewCount\)/);
  assert.match(examRouteSource, /\{copy\.reviewFilterAll\}/);
  assert.match(examRouteSource, /onPress=\{\(\) => setReviewFilter\('flagged'\)\}/);
  assert.match(examRouteSource, /onPress=\{\(\) => setReviewFilter\('all'\)\}/);
  assert.match(examRouteSource, /filteredReviewItems\.map/);
  assert.match(examRouteSource, /const examQuestionNumberById = useMemo/);
  assert.match(examRouteSource, /copy\.questionNumber\(questionNumber\)/);
  assert.match(examRouteSource, /flaggedIndexes=\{flaggedIndexes\}/);
  assert.match(examRouteSource, /stateLabels=\{copy\.navigatorStateLabels\}/);
  assert.match(examRouteSource, /copy\.flagQuestionAccessibilityLabel\(index \+ 1\)/);
  assert.match(examRouteSource, /copy\.unflagQuestionAccessibilityLabel\(index \+ 1\)/);
  assert.match(examRouteSource, /\{flaggedQuestionIds\[item\.questionId\] \? \(/);
  assert.match(examRouteSource, /<Badge tone="warm">\{copy\.flaggedQuestionLabel\}<\/Badge>/);
  assert.match(activeNavigatorCall, /currentIndex=\{null\}/);
  assert.doesNotMatch(activeNavigatorCall, /onSelect=/);
  assert.doesNotMatch(
    sessionBuilderCall,
    /flaggedQuestionIds/,
    'flagged review markers should not become answer or score data',
  );
  assert.doesNotMatch(
    progressRecordCall,
    /flaggedQuestionIds/,
    'flagged review markers should not become persisted score history',
  );
  assert.match(
    navigatorSource,
    /export type QuestionNavigatorItemState = 'current' \| 'answered' \| 'flagged' \| 'unanswered';/,
  );
  assert.match(navigatorSource, /flaggedIndexes\?: readonly number\[\];/);
  assert.match(navigatorSource, /if \(flaggedSet\.has\(index\)\) return 'flagged';/);
  assert.match(
    navigatorSource,
    /const isInteractive = disabled !== true && typeof onSelect === 'function';/,
  );
  assert.match(navigatorSource, /isInteractive \? copy\.navigationLabel : copy\.statusLabel/);
  assert.match(navigatorSource, /accessibilityRole="tab"/);
  assert.match(navigatorSource, /accessibilityRole="text"/);
  assert.match(navigatorSource, /accessibilityState=\{\{ selected \}\}/);
  assert.doesNotMatch(
    navigatorSource,
    /accessibilityState=\{\{ disabled: isDisabled, selected \}\}/,
  );
});

test('exam route separates reload-safe attempt ids from deterministic shuffle seeds', () => {
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const generateExamCall =
    examRouteSource.match(/generateExam\(questions, \{[\s\S]*?\n\s*\}\),/)?.[0] ?? '';
  const sessionBuilderCall =
    examRouteSource.match(/buildMockExamQuizSession\(\{[\s\S]*?\n\s*\}\)/)?.[0] ?? '';
  const progressRecordCall =
    examRouteSource.match(/recordMockExamSession\(\{[\s\S]*?\n\s*\}\);/)?.[0] ?? '';

  assert.ok(examRouteSource.includes('function createMockExamAttemptId('));
  assert.ok(
    examRouteSource.includes(
      'const [examAttemptId, setExamAttemptId] = useState(createMockExamAttemptId);',
    ),
  );
  assert.ok(
    examRouteSource.includes(
      'const [examShuffleSeedIndex, setExamShuffleSeedIndex] = useState(0);',
    ),
  );
  assert.ok(
    examRouteSource.includes(
      'const examShuffleSeed = `mock-exam-shuffle-${examShuffleSeedIndex}`;',
    ),
  );
  assert.ok(examRouteSource.includes('setExamAttemptId(createMockExamAttemptId());'));
  assert.ok(examRouteSource.includes('setExamShuffleSeedIndex((current) => current + 1);'));
  assert.match(generateExamCall, /sessionId: examShuffleSeed,/);
  assert.doesNotMatch(generateExamCall, /examAttemptId/);
  assert.match(sessionBuilderCall, /sessionId: examAttemptId,/);
  assert.match(progressRecordCall, /sessionId: examAttemptId,/);
  assert.match(examRouteSource, /recordExamCompletion\(examAttemptId\)/);
  assert.doesNotMatch(examRouteSource, /examAttemptIndex/);
  assert.doesNotMatch(examRouteSource, /examSessionId/);
  assert.doesNotMatch(examRouteSource, /const examSessionId = `mock-exam-\$\{examAttemptIndex\}`;/);
});

test('mock exam access counts unique durable attempt ids while deduping completion retries', async () => {
  const { createMemoryMockExamAccessStorage, recordStoredMockExamCompletion } = loadTs(
    'lib/monetization/rewardedExam.ts',
  );
  const storage = createMemoryMockExamAccessStorage();

  const firstCompletion = await recordStoredMockExamCompletion({
    date: '2026-05-21T10:00:00.000Z',
    sessionId: 'mock-exam-attempt-a',
    storage,
  });
  const duplicateCompletion = await recordStoredMockExamCompletion({
    date: '2026-05-21T10:05:00.000Z',
    sessionId: 'mock-exam-attempt-a',
    storage,
  });
  const secondCompletion = await recordStoredMockExamCompletion({
    date: '2026-05-21T12:00:00.000Z',
    sessionId: 'mock-exam-attempt-b',
    storage,
  });

  assert.equal(firstCompletion.completedMockExamsToday, 1);
  assert.equal(duplicateCompletion.completedMockExamsToday, 1);
  assert.equal(secondCompletion.completedMockExamsToday, 2);
  assert.deepEqual(secondCompletion.completedMockExamSessionIdsByDate['2026-05-21'], [
    'mock-exam-attempt-a',
    'mock-exam-attempt-b',
  ]);
});

test('formatExamTime renders remaining seconds as mm:ss', () => {
  const { formatExamTime } = loadTs('lib/quiz/examGenerator.ts');

  assert.equal(formatExamTime(1800), '30:00');
  assert.equal(formatExamTime(75), '01:15');
  assert.equal(formatExamTime(-5), '00:00');
  for (const malformedRemainingSeconds of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    'abc',
    null,
    undefined,
  ]) {
    assert.equal(formatExamTime(malformedRemainingSeconds), '00:00');
  }
});

test('shouldAutoSubmitExam submits only when a live exam reaches zero', () => {
  const { shouldAutoSubmitExam } = loadTs('lib/quiz/examGenerator.ts');

  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 20,
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: -1,
      submitted: false,
      questionCount: 20,
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 1,
      submitted: false,
      questionCount: 20,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: true,
      questionCount: 20,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: false,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 20,
    }),
    false,
  );
  for (const malformedState of [
    { examActive: undefined, remainingSeconds: 0, submitted: false, questionCount: 20 },
    { examActive: 'yes', remainingSeconds: 0, submitted: false, questionCount: 20 },
    { examActive: true, remainingSeconds: '0', submitted: false, questionCount: 20 },
    { examActive: true, remainingSeconds: Number.NaN, submitted: false, questionCount: 20 },
    {
      examActive: true,
      remainingSeconds: Number.POSITIVE_INFINITY,
      submitted: false,
      questionCount: 20,
    },
    { examActive: true, remainingSeconds: 0, submitted: 0, questionCount: 20 },
    { examActive: true, remainingSeconds: 0, submitted: false, questionCount: '1' },
    { examActive: true, remainingSeconds: 0, submitted: false, questionCount: null },
    {
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: Number.POSITIVE_INFINITY,
    },
  ]) {
    assert.equal(shouldAutoSubmitExam(malformedState), false);
  }
});
