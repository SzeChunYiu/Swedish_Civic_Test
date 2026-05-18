import type { PracticeQuestion, QuestionOption } from '../../types/content';

const UNKNOWN_OPTION: QuestionOption = {
  id: 'unknown',
  textSv: 'Det går inte att avgöra av materialet',
  textEn: 'It cannot be determined from the material',
};

const SOMETIMES_OPTION: QuestionOption = {
  id: 'sometimes',
  textSv: 'Endast ibland',
  textEn: 'Only sometimes',
};

const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

function nextId(startId: number, offset: number): string {
  return `q${String(startId + offset).padStart(3, '0')}`;
}

function correctOption(question: PracticeQuestion): QuestionOption {
  return (
    question.options.find((option) => option.id === question.correctOptionId) ?? question.options[0]
  );
}

function wrongOption(question: PracticeQuestion): QuestionOption {
  return (
    question.options.find((option) => option.id !== question.correctOptionId) ?? UNKNOWN_OPTION
  );
}

function publishedCopy(question: PracticeQuestion): PracticeQuestion {
  return { ...question, reviewStatus: 'published' };
}

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags)];
}

function normalizeSingleChoiceOptions(
  options: QuestionOption[],
  correctOptionId: string,
): { options: QuestionOption[]; correctOptionId: string } {
  if (options.length !== SINGLE_CHOICE_OPTION_IDS.length) {
    return { options, correctOptionId };
  }

  const correctIndex = options.findIndex((option) => option.id === correctOptionId);
  return {
    options: options.map((option, index) => ({
      ...option,
      id: SINGLE_CHOICE_OPTION_IDS[index],
    })),
    correctOptionId: correctIndex >= 0 ? SINGLE_CHOICE_OPTION_IDS[correctIndex] : correctOptionId,
  };
}

function withSharedFields(
  source: PracticeQuestion,
  id: string,
  type: PracticeQuestion['type'],
  questionSv: string,
  questionEn: string,
  options: QuestionOption[],
  correctOptionId: string,
  extraTags: string[],
): PracticeQuestion {
  const normalized =
    type === 'single_choice'
      ? normalizeSingleChoiceOptions(options, correctOptionId)
      : { options, correctOptionId };

  return {
    id,
    chapterId: source.chapterId,
    type,
    questionSv,
    questionEn,
    options: normalized.options,
    correctOptionId: normalized.correctOptionId,
    explanationSv: source.explanationSv,
    explanationEn: source.explanationEn,
    uhrReference: source.uhrReference,
    difficulty: source.difficulty,
    reviewStatus: 'published',
    tags: uniqueTags([...source.tags, ...extraTags]),
  };
}

function trueFalseOptions(): QuestionOption[] {
  return [
    { id: 'true', textSv: 'Sant', textEn: 'True' },
    { id: 'false', textSv: 'Falskt', textEn: 'False' },
  ];
}

function singleChoiceOptions(source: PracticeQuestion): QuestionOption[] {
  if (source.options.length === 4) return source.options;
  if (source.type === 'true_false') return [...source.options, UNKNOWN_OPTION, SOMETIMES_OPTION];
  return source.options;
}

function answerLabel(option: QuestionOption): string {
  return `${option.textSv}`.replace(/[.!?]\s*$/, '');
}

function isTrueFalseSource(question: PracticeQuestion): boolean {
  return question.type === 'true_false' && ['true', 'false'].includes(question.correctOptionId);
}

function trueFalseStatementBody(questionText: string, language: 'sv' | 'en'): string {
  const prefix = language === 'sv' ? /^\s*Sant eller falskt:\s*/i : /^\s*True or false:\s*/i;
  return questionText
    .replace(prefix, '')
    .replace(/[.!?]\s*$/, '')
    .trim();
}

function trueFalsePromptForSource(
  source: PracticeQuestion,
  expectedTruth: boolean,
): { questionSv: string; questionEn: string } {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const svStatement = trueFalseStatementBody(source.questionSv, 'sv');
  const enStatement = trueFalseStatementBody(source.questionEn, 'en');
  const assertion = sourceStatementIsTrue === expectedTruth;

  return {
    questionSv: `Sant eller falskt: Påståendet "${svStatement}" är ${assertion ? 'sant' : 'falskt'}.`,
    questionEn: `True or false: The statement "${enStatement}" is ${assertion ? 'true' : 'false'}.`,
  };
}

function buildSingleChoiceVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  return withSharedFields(
    source,
    id,
    'single_choice',
    `Vilket svar stämmer bäst? ${source.questionSv}`,
    `Which answer best matches? ${source.questionEn}`,
    singleChoiceOptions(source),
    source.correctOptionId,
    ['published-variant', 'section-practice'],
  );
}

function buildTrueStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = correctOption(source);
  const prompt = isTrueFalseSource(source)
    ? trueFalsePromptForSource(source, true)
    : {
        questionSv: `Sant eller falskt: Ett korrekt svar på frågan "${source.questionSv}" är "${answerLabel(option)}".`,
        questionEn: `True or false: A correct answer to "${source.questionEn}" is "${option.textEn}".`,
      };

  return withSharedFields(
    source,
    id,
    'true_false',
    prompt.questionSv,
    prompt.questionEn,
    trueFalseOptions(),
    'true',
    ['published-variant', 'true-false'],
  );
}

function buildFalseStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = wrongOption(source);
  const prompt = isTrueFalseSource(source)
    ? trueFalsePromptForSource(source, false)
    : {
        questionSv: `Sant eller falskt: Ett korrekt svar på frågan "${source.questionSv}" är "${answerLabel(option)}".`,
        questionEn: `True or false: A correct answer to "${source.questionEn}" is "${option.textEn}".`,
      };

  return withSharedFields(
    source,
    id,
    'true_false',
    prompt.questionSv,
    prompt.questionEn,
    trueFalseOptions(),
    'false',
    ['published-variant', 'false-statement'],
  );
}

function buildAnswerJudgementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const correct = correctOption(source);
  const wrong = wrongOption(source);
  const options = isTrueFalseSource(source)
    ? [...source.options, UNKNOWN_OPTION, SOMETIMES_OPTION]
    : [correct, wrong, UNKNOWN_OPTION, SOMETIMES_OPTION];

  return withSharedFields(
    source,
    id,
    'single_choice',
    `Vilket alternativ motsvarar rätt bedömning av påståendet? ${source.questionSv}`,
    `Which option gives the correct judgment of the statement? ${source.questionEn}`,
    options,
    correct.id,
    ['published-variant', 'judgement'],
  );
}

export function derivePublishedQuestions(
  sourceQuestions: PracticeQuestion[],
  startId = 101,
): PracticeQuestion[] {
  return sourceQuestions.flatMap((source, index) => {
    const published = publishedCopy(source);
    const offset = index * 4;
    return [
      buildSingleChoiceVariant(published, nextId(startId, offset)),
      buildTrueStatementVariant(published, nextId(startId, offset + 1)),
      buildFalseStatementVariant(published, nextId(startId, offset + 2)),
      buildAnswerJudgementVariant(published, nextId(startId, offset + 3)),
    ];
  });
}

export function publishQuestions(sourceQuestions: PracticeQuestion[]): PracticeQuestion[] {
  return sourceQuestions.map(publishedCopy);
}
