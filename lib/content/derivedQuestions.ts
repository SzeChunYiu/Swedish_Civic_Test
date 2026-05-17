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
  return {
    id,
    chapterId: source.chapterId,
    type,
    questionSv,
    questionEn,
    options,
    correctOptionId,
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

function answerLabel(option: QuestionOption): string {
  return `${option.textSv}`.replace(/[.!?]\s*$/, '');
}

function buildSingleChoiceVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  return withSharedFields(
    source,
    id,
    'single_choice',
    `Vilket svar stämmer bäst enligt UHR-avsnittet "${source.uhrReference.section}"? ${source.questionSv}`,
    `Which answer best matches the UHR section "${source.uhrReference.section}"? ${source.questionEn}`,
    source.options,
    source.correctOptionId,
    ['published-variant', 'section-practice'],
  );
}

function buildTrueStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = correctOption(source);
  return withSharedFields(
    source,
    id,
    'true_false',
    `Sant eller falskt: Ett korrekt svar på frågan "${source.questionSv}" är "${answerLabel(option)}".`,
    `True or false: A correct answer to "${source.questionEn}" is "${option.textEn}".`,
    trueFalseOptions(),
    'true',
    ['published-variant', 'true-false'],
  );
}

function buildFalseStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = wrongOption(source);
  return withSharedFields(
    source,
    id,
    'true_false',
    `Sant eller falskt: Ett korrekt svar på frågan "${source.questionSv}" är "${answerLabel(option)}".`,
    `True or false: A correct answer to "${source.questionEn}" is "${option.textEn}".`,
    trueFalseOptions(),
    'false',
    ['published-variant', 'false-statement'],
  );
}

function buildAnswerJudgementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const correct = correctOption(source);
  const wrong = wrongOption(source);
  const isTrueFalseSource =
    source.options.length === 2 && ['true', 'false'].includes(source.correctOptionId);
  const options = isTrueFalseSource
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
