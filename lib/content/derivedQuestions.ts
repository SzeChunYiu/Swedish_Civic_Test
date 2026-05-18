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

function answerTextEn(option: QuestionOption): string {
  return `${option.textEn}`.replace(/[.!?]\s*$/, '');
}

function stripFinalPunctuation(value: string): string {
  return value.trim().replace(/[.!?]\s*$/, '');
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function lowerFirst(value: string): string {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function upperFirst(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function stripLeadingPurposeSv(value: string): string {
  return value.replace(/^för att\s+/i, '').replace(/^att\s+/i, '');
}

function stripLeadingPurposeEn(value: string): string {
  return value.replace(/^to\s+/i, '').replace(/^because\s+/i, '');
}

function stripTrueFalsePromptSv(value: string): string {
  return stripFinalPunctuation(value.replace(/^Sant eller falskt:\s*/i, ''));
}

function stripTrueFalsePromptEn(value: string): string {
  return stripFinalPunctuation(value.replace(/^True or false:\s*/i, ''));
}

function isTrueFalseSource(source: PracticeQuestion): boolean {
  return source.type === 'true_false' && source.options.length === 2;
}

function truthStatementSv(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'Det stämmer att' : 'Det är falskt att'} ${statement}`;
}

function truthStatementEn(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'It is true that' : 'It is false that'} ${statement}`;
}

function sourceStatementJudgementSv(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'Det stämmer i sak att' : 'Det stämmer inte att'} ${statement}`;
}

function sourceStatementJudgementEn(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'It is factually true that' : 'It is not true that'} ${statement}`;
}

function trueFalseSourceStatementSv(source: PracticeQuestion, variantIsTrue: boolean): string {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  return sourceStatementJudgementSv(stripTrueFalsePromptSv(source.questionSv), assertionIsTrue);
}

function trueFalseSourceStatementEn(source: PracticeQuestion, variantIsTrue: boolean): string {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  return sourceStatementJudgementEn(stripTrueFalsePromptEn(source.questionEn), assertionIsTrue);
}

function generatedTrueFalseStatementSv(
  source: PracticeQuestion,
  option: QuestionOption,
  variantIsTrue: boolean,
): string {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementSv(source, variantIsTrue);
  return truthStatementSv(civicStatementSv(source, option), true);
}

function generatedTrueFalseStatementEn(
  source: PracticeQuestion,
  option: QuestionOption,
  variantIsTrue: boolean,
): string {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementEn(source, variantIsTrue);
  return truthStatementEn(civicStatementEn(source, option), true);
}

function judgementPromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Vilket alternativ stämmer med påståendet? ${ensureSentence(
      stripTrueFalsePromptSv(source.questionSv),
    )}`;
  }
  return `Vilket svar är korrekt? ${source.questionSv}`;
}

function judgementPromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Which option matches the statement? ${ensureSentence(
      stripTrueFalsePromptEn(source.questionEn),
    )}`;
  }
  return `Which answer is correct? ${source.questionEn}`;
}

function singleChoicePromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Välj rätt alternativ för påståendet: ${ensureSentence(
      stripTrueFalsePromptSv(source.questionSv),
    )}`;
  }
  return `Vilket svar stämmer bäst? ${source.questionSv}`;
}

function singleChoicePromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Choose the correct option for the statement: ${ensureSentence(
      stripTrueFalsePromptEn(source.questionEn),
    )}`;
  }
  return `Which answer best matches? ${source.questionEn}`;
}

function civicStatementSv(source: PracticeQuestion, option: QuestionOption): string {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementSv(source, option.id === source.correctOptionId);
  }

  const answer = stripFinalPunctuation(answerLabel(option));
  const q = stripFinalPunctuation(source.questionSv);
  let match = q.match(/^Var ligger (.+)$/i);
  if (match) return `${upperFirst(match[1])} ligger ${lowerFirst(answer)}`;

  match = q.match(/^Ungefär hur långt sträcker sig (.+?) (från .+)$/i);
  if (match) return `${upperFirst(match[1])} sträcker sig ${lowerFirst(answer)} ${match[2]}`;

  match = q.match(/^Vad heter (.+)$/i);
  if (match) return `${upperFirst(match[1])} heter ${answer}`;

  match = q.match(/^Vilka öar är Sveriges två största$/i);
  if (match) return `Sveriges två största öar är ${answer}`;

  match = q.match(/^Vilka är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${answer}`;

  match = q.match(/^Ungefär hur många (.+)$/i);
  if (match) return `Ungefär ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Vilka (.+?) är viktiga i Sverige$/i);
  if (match) return `${upperFirst(answer)} är viktiga ${match[1]} i Sverige`;

  match = q.match(/^Vad betyder (.+)$/i);
  if (match) return `${upperFirst(match[1])} betyder ${lowerFirst(answer)}`;

  match = q.match(/^Vilket av följande ingår i (.+)$/i);
  if (match) return `${upperFirst(answer)} ingår i ${match[1]}`;

  match = q.match(/^Vilket är ett sätt att (.+)$/i);
  if (match) return `${upperFirst(answer)} är ett sätt att ${match[1]}`;

  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;

  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return `${upperFirst(answer)} när ${match[1]} påverkar ${match[2]}`;

  match = q.match(/^Hur väljer (.+?) (.+)$/i);
  if (match) return `${upperFirst(match[1])} väljer ${match[2]} ${lowerFirst(answer)}`;

  match = q.match(/^Hur många (.+?) har (.+)$/i);
  if (match) return `${upperFirst(match[2])} har ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Vem väljer (.+)$/i);
  if (match) return `${upperFirst(answer)} väljer ${lowerFirst(match[1])}`;

  match = q.match(/^Hur gammal måste man ha fyllt för att (.+)$/i);
  if (match) return `Man måste ha fyllt ${lowerFirst(answer)} för att ${match[1]}`;

  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) return `${upperFirst(stripLeadingPurposeSv(answer))} beskriver att ${match[1]}`;

  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;

  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} har uppgiften att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return `${upperFirst(answer)} beskriver ${match[1]}`;

  match = q.match(/^Vilken är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${lowerFirst(answer)}`;

  match = q.match(/^Vilket exempel beskriver (.+)$/i);
  if (match) return `${upperFirst(answer)} är ett exempel på ${match[1]}`;

  match = q.match(/^Hur ofta hålls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hålls ${lowerFirst(answer)}`;

  match = q.match(/^Vilka krav gäller för (.+)$/i);
  if (match) return `${upperFirst(answer)} gäller för ${match[1]}`;

  match = q.match(/^Varför (.+)$/i);
  if (match)
    return `${upperFirst(stripLeadingPurposeSv(answer))} är en anledning till att ${match[1]}`;

  match = q.match(/^Vad har (.+?) gemensamt$/i);
  if (match) return `${upperFirst(match[1])} har ${lowerFirst(answer)} gemensamt`;

  match = q.match(/^Vad händer i (.+?) om (.+)$/i);
  if (match) return `I ${match[1]} händer det att ${lowerFirst(answer)} om ${match[2]}`;

  match = q.match(/^Vilken lista innehåller (.+)$/i);
  if (match) return `${upperFirst(answer)} är listan som innehåller ${match[1]}`;

  match = q.match(/^Vad säger (.+?) om (.+)$/i);
  if (match) return `${upperFirst(match[1])} säger att ${lowerFirst(answer)} om ${match[2]}`;

  match = q.match(/^Vad reglerar (.+)$/i);
  if (match) return `${upperFirst(match[1])} reglerar ${lowerFirst(answer)}`;

  match = q.match(/^Vad innebär (.+)$/i);
  if (match) return `${upperFirst(match[1])} innebär ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vilka myndigheter ingår i (.+)$/i);
  if (match) return `${upperFirst(answer)} ingår i ${match[1]}`;

  match = q.match(/^Vad gäller för (.+)$/i);
  if (match) return `${upperFirst(answer)} gäller för ${match[1]}`;

  match = q.match(/^Från vilken ålder är (.+)$/i);
  if (match) return `Från ${lowerFirst(answer)} är ${match[1]}`;

  match = q.match(/^Vilket svar beskriver (.+)$/i);
  if (match) return `${upperFirst(answer)} beskriver ${match[1]}`;

  const section = lowerFirst(source.uhrReference?.section ?? 'ämnet');
  if (/^att\s+/i.test(answer))
    return `Inom ${section} gäller det att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  if (/^för att\s+/i.test(answer))
    return `${upperFirst(stripLeadingPurposeSv(answer))} hör till ${section}`;
  return `${upperFirst(answer)} hör till ${section}`;
}

function civicStatementEn(source: PracticeQuestion, option: QuestionOption): string {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementEn(source, option.id === source.correctOptionId);
  }

  const answer = stripFinalPunctuation(answerTextEn(option));
  const q = stripFinalPunctuation(source.questionEn);
  let match = q.match(/^Where is (.+) located$/i);
  if (match) return `${upperFirst(match[1])} is located ${lowerFirst(answer)}`;

  match = q.match(/^Approximately how far does (.+?) stretch (from .+)$/i);
  if (match) return `${upperFirst(match[1])} stretches ${lowerFirst(answer)} ${match[2]}`;

  match = q.match(/^What is (.+) called$/i);
  if (match) return `${upperFirst(match[1])} is called ${answer}`;

  match = q.match(/^What is the name of (.+)$/i);
  if (match) return `${upperFirst(match[1])} is called ${answer}`;

  match = q.match(/^Which islands are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Which are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Approximately how many (.+)$/i);
  if (match) return `Approximately ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Which (.+?) are important in Sweden$/i);
  if (match) return `${upperFirst(answer)} are important ${match[1]} in Sweden`;

  match = q.match(/^What does (.+) mean$/i);
  if (match) return `${upperFirst(match[1])} means ${lowerFirst(answer)}`;

  match = q.match(/^Which of the following is part of (.+)$/i);
  if (match) return `${upperFirst(answer)} is part of ${match[1]}`;

  match = q.match(/^Which is a way to (.+)$/i);
  if (match) return `${upperFirst(answer)} is a way to ${match[1]}`;

  match = q.match(/^What is it called when (.+)$/i);
  if (match) return `When ${match[1]}, it is called ${lowerFirst(answer)}`;

  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) return `${upperFirst(answer)} when ${match[1]} affects ${match[2]}`;

  match = q.match(/^How do (.+?) choose (.+)$/i);
  if (match) return `${upperFirst(match[1])} choose ${match[2]} ${lowerFirst(answer)}`;

  match = q.match(/^How many (.+?) does (.+?) have$/i);
  if (match) return `${upperFirst(match[2])} has ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Who chooses (.+)$/i);
  if (match) return `${upperFirst(answer)} chooses ${lowerFirst(match[1])}`;

  match = q.match(/^How old must (.+?) be to (.+)$/i);
  if (match) return `${upperFirst(match[1])} must be ${lowerFirst(answer)} to ${match[2]}`;

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) return `${upperFirst(stripLeadingPurposeEn(answer))} describes that ${match[1]}`;

  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;

  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} has the task to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return `${upperFirst(answer)} describes ${match[1]}`;

  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match)
    return `${upperFirst(match[1])}'s foremost task is ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which example describes (.+)$/i);
  if (match) return `${upperFirst(answer)} is an example of ${match[1]}`;

  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;

  match = q.match(/^Which requirements apply to (.+)$/i);
  if (match) return `${upperFirst(answer)} applies to ${match[1]}`;

  match = q.match(/^Why (.+)$/i);
  if (match) return `${upperFirst(stripLeadingPurposeEn(answer))} is a reason why ${match[1]}`;

  match = q.match(/^What do (.+?) have in common$/i);
  if (match) return `${upperFirst(match[1])} have ${lowerFirst(answer)} in common`;

  match = q.match(/^What happens in (.+?) if (.+)$/i);
  if (match) return `In ${match[1]}, ${lowerFirst(answer)} if ${match[2]}`;

  match = q.match(/^Which list contains (.+)$/i);
  if (match) return `${upperFirst(answer)} is the list that contains ${match[1]}`;

  match = q.match(/^What does (.+?) say about (.+)$/i);
  if (match) return `${upperFirst(match[1])} says that ${lowerFirst(answer)} about ${match[2]}`;

  match = q.match(/^What does (.+?) regulate$/i);
  if (match) return `${upperFirst(match[1])} regulates ${lowerFirst(answer)}`;

  match = q.match(/^What does (.+?) mean$/i);
  if (match) return `${upperFirst(match[1])} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which authorities are part of (.+)$/i);
  if (match) return `${upperFirst(answer)} are part of ${match[1]}`;

  match = q.match(/^What applies to (.+)$/i);
  if (match) return `${upperFirst(answer)} applies to ${match[1]}`;

  match = q.match(/^From what age is (.+)$/i);
  if (match) return `From ${lowerFirst(answer)}, ${match[1]}`;

  match = q.match(/^Which answer describes (.+)$/i);
  if (match) return `${upperFirst(answer)} describes ${match[1]}`;

  const section = lowerFirst(source.uhrReference?.section ?? 'the topic');
  if (/^to\s+/i.test(answer))
    return `In ${section}, it means to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  if (/^because\s+/i.test(answer))
    return `${upperFirst(stripLeadingPurposeEn(answer))} belongs to ${section}`;
  return `${upperFirst(answer)} belongs to ${section}`;
}

function buildSingleChoiceVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  return withSharedFields(
    source,
    id,
    'single_choice',
    singleChoicePromptSv(source),
    singleChoicePromptEn(source),
    singleChoiceOptions(source),
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
    `Sant eller falskt: ${ensureSentence(generatedTrueFalseStatementSv(source, option, true))}`,
    `True or false: ${ensureSentence(generatedTrueFalseStatementEn(source, option, true))}`,
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
    `Sant eller falskt: ${ensureSentence(generatedTrueFalseStatementSv(source, option, false))}`,
    `True or false: ${ensureSentence(generatedTrueFalseStatementEn(source, option, false))}`,
    trueFalseOptions(),
    'false',
    ['published-variant', 'false-statement'],
  );
}

function buildAnswerJudgementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const correct = correctOption(source);
  const wrong = wrongOption(source);
  const sourceIsTrueFalse = isTrueFalseSource(source);
  const options = sourceIsTrueFalse
    ? [...source.options, UNKNOWN_OPTION, SOMETIMES_OPTION]
    : [correct, wrong, UNKNOWN_OPTION, SOMETIMES_OPTION];

  return withSharedFields(
    source,
    id,
    'single_choice',
    judgementPromptSv(source),
    judgementPromptEn(source),
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
