import type { PracticeQuestion, QuestionOption } from '../../types/content';

const UNKNOWN_OPTION: QuestionOption = {
  id: 'unknown',
  textSv: 'Alla alternativen är korrekta',
  textEn: 'All of the options are correct',
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

function lowerLeadingEnglishArticle(value: string): string {
  return value.replace(/^(The|In|A|An|At|On|Almost)\b/, (match) => match.toLowerCase());
}

function lowerLeadingSwedishCommonStart(value: string): string {
  return value.replace(/^(Havet|Nästan|Ungefär|Ett|En|Man|När)\b/, (match) => match.toLowerCase());
}

function lowerLeadingSwedishClauseStart(value: string): string {
  return value.replace(
    /^(Havet|Nästan|Ungefär|Ett|En|Man|När|Oppositionen|Politiker|All)\b/,
    (match) => match.toLowerCase(),
  );
}

function lowerLeadingEnglishClauseStart(value: string): string {
  return value.replace(/^(The|In|A|An|At|On|Almost|Politicians|All)\b/, (match) =>
    match.toLowerCase(),
  );
}

function stripLeadingMustSv(value: string): string {
  return value.replace(/^man måste\s+/i, 'man ').replace(/^du måste\s+/i, 'du ');
}

function stripLeadingThatEn(value: string): string {
  return value.replace(/^that\s+/i, '');
}

function requirementTargetEn(value: string): string {
  return lowerFirst(value.trim()).replace(/^voting\b/i, 'vote');
}

function englishSubjectVerb(value: string, singular: string, plural: string): string {
  return /,|\band\b/i.test(value) ? plural : singular;
}

function englishInfinitive(value: string): string {
  const trimmed = lowerFirst(value.trim());
  return /^to\b/i.test(trimmed) ? trimmed : `to ${trimmed}`;
}

function stripLeadingPurposeSv(value: string): string {
  return value.replace(/^för att\s+/i, '').replace(/^att\s+/i, '');
}

function stripLeadingPurposeEn(value: string): string {
  return value
    .replace(/^to\s+/i, '')
    .replace(/^because\s+/i, '')
    .replace(/^so\s+/i, '');
}

function embeddedSwedishClause(value: string): string {
  return lowerFirst(stripLeadingPurposeSv(value))
    .replace(/^det är alltid\s+/i, 'det alltid är ')
    .replace(/^domstolarna avgör bara\s+/i, 'domstolarna bara avgör ');
}

function replaceLeadingSwedishSubject(subject: string, value: string): string {
  const normalizedSubject = upperFirst(subject.trim());
  return value
    .replace(/^De\s+/i, `${normalizedSubject} `)
    .replace(/^Den\s+/i, `${normalizedSubject} `)
    .replace(/^Det är\s+/i, `${normalizedSubject} är `);
}

function replaceLeadingEnglishSubject(subject: string, value: string): string {
  const normalizedSubject = upperFirst(subject.trim());
  return value
    .replace(/^They are\s+/i, `${normalizedSubject} are `)
    .replace(/^They\s+/i, `${normalizedSubject} `)
    .replace(/^It is\s+/i, `${normalizedSubject} is `)
    .replace(/^It (gives|lets|applies)\b/i, `${normalizedSubject} $1`);
}

function describesStatementSv(subject: string, answer: string): string {
  if (/^Som\s+/i.test(answer) && /Sverige för tvåhundra år sedan/i.test(subject)) {
    return `För tvåhundra år sedan var Sverige ${lowerFirst(answer.replace(/^Som\s+/i, ''))}`;
  }
  if (/^De ska\s+/i.test(answer) && /fria medier/i.test(subject)) {
    return `Fria medier i en demokrati ska ${lowerFirst(answer.replace(/^De ska\s+/i, ''))}`;
  }
  if (/^Att\s+/i.test(answer)) {
    return `${upperFirst(subject)} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}

function describesStatementEn(subject: string, answer: string): string {
  if (/^As\s+/i.test(answer) && /Sweden two hundred years ago/i.test(subject)) {
    return `Two hundred years ago, Sweden was ${lowerFirst(answer.replace(/^As\s+/i, ''))}`;
  }
  if (/^They should\s+/i.test(answer) && /free media/i.test(subject)) {
    return `Free media in a democracy should ${lowerFirst(answer.replace(/^They should\s+/i, ''))}`;
  }
  if (/^To\s+/i.test(answer)) {
    return `${upperFirst(subject)} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function commonStatementSv(subject: string, answer: string): string {
  if (/^Gemensamma\s+/i.test(answer)) {
    return `${upperFirst(subject)} har ${lowerFirst(answer)}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}

function commonStatementEn(subject: string, answer: string): string {
  if (/^Shared\s+/i.test(answer)) {
    return `${upperFirst(subject)} have ${lowerFirst(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function meaningStatementSv(subject: string, answer: string): string {
  const subjectStatement = replaceLeadingSwedishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} innebär att ${embeddedSwedishClause(answer)}`;
}

function meaningStatementEn(subject: string, answer: string): string {
  const subjectStatement = replaceLeadingEnglishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}

function appliesStatementEn(subject: string, answer: string): string {
  if (/^They are\s+/i.test(answer)) {
    return replaceLeadingEnglishSubject(subject, answer);
  }
  return answer;
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

function truthStatementSv(statement: string): string {
  return upperFirst(statement);
}

function truthStatementEn(statement: string): string {
  return upperFirst(statement);
}

function sourceStatementJudgementSv(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'Det stämmer i sak att' : 'Det stämmer inte att'} ${lowerLeadingSwedishClauseStart(
    statement,
  )}`;
}

function sourceStatementJudgementEn(statement: string, isTrue: boolean): string {
  return `${isTrue ? 'It is factually true that' : 'It is not true that'} ${lowerLeadingEnglishClauseStart(
    statement,
  )}`;
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
  return truthStatementSv(civicStatementSv(source, option));
}

function generatedTrueFalseStatementEn(
  source: PracticeQuestion,
  option: QuestionOption,
  variantIsTrue: boolean,
): string {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementEn(source, variantIsTrue);
  return truthStatementEn(civicStatementEn(source, option));
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
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Vilka (.+?) är viktiga i Sverige$/i);
  if (match) return `${upperFirst(answer)} är viktiga ${match[1]} i Sverige`;

  match = q.match(/^Vad betyder (?!det att\b)(.+)$/i);
  if (match) return `${upperFirst(match[1])} betyder ${lowerFirst(answer)}`;

  match = q.match(/^Vilket av följande ingår i (.+)$/i);
  if (match) return `Ett inslag i ${match[1]} är att ${lowerFirst(answer)}`;

  match = q.match(/^Vilket är ett sätt att (.+)$/i);
  if (match) return `Ett sätt att ${match[1]} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;

  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return `${upperFirst(answer)} när ${match[1]} påverkar ${match[2]}`;

  match = q.match(/^Hur väljer (.+?) (.+)$/i);
  if (match) {
    if (/^Genom att\s+/i.test(answer)) {
      return `${upperFirst(match[1])} väljer ${match[2]} ${lowerFirst(answer)}`;
    }
    return upperFirst(answer);
  }

  match = q.match(/^Hur många (.+?) har (.+)$/i);
  if (match) return `${upperFirst(match[2])} har ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Vem väljer (.+)$/i);
  if (match) return `${upperFirst(match[1])} väljs av ${lowerFirst(answer)}`;

  match = q.match(/^Hur gammal måste man ha fyllt för att (.+)$/i);
  if (match) return `Man måste ha fyllt ${lowerFirst(answer)} för att ${match[1]}`;

  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) return `Att ${match[1]} betyder att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;

  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} har uppgiften att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);

  match = q.match(/^Vilken är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${lowerFirst(answer)}`;

  match = q.match(/^Vilket exempel beskriver (.+)$/i);
  if (match) return `${upperFirst(answer)} är exempel på ${match[1]}`;

  match = q.match(/^Hur ofta hålls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hålls ${lowerFirst(answer)}`;

  match = q.match(/^Vilka krav gäller för (.+)$/i);
  if (match) return `För ${match[1]} måste ${lowerFirst(stripLeadingMustSv(answer))}`;

  match = q.match(/^Varför (.+)$/i);
  if (match) return `En anledning är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad har (.+?) gemensamt$/i);
  if (match) return commonStatementSv(match[1], answer);

  match = q.match(/^Vad händer i (.+?) om (.+)$/i);
  if (match) {
    const outcome = lowerFirst(answer).replace(/^partiet får\s+/i, 'partiet ');
    return `I ${match[1]} får ${outcome} om ${match[2]}`;
  }

  match = q.match(/^Vilken lista innehåller (.+)$/i);
  if (match) return `Listan med ${lowerFirst(answer)} innehåller ${match[1]}`;

  match = q.match(/^Vad säger (.+?) om (.+)$/i);
  if (match) return `${upperFirst(match[1])} säger att ${lowerLeadingSwedishClauseStart(answer)}`;

  match = q.match(/^Vad reglerar (.+)$/i);
  if (match) return `${upperFirst(match[1])} reglerar ${lowerFirst(answer)}`;

  match = q.match(/^Vad innebär (.+)$/i);
  if (match) return meaningStatementSv(match[1], answer);

  match = q.match(/^Vilka myndigheter ingår i (.+)$/i);
  if (match) return `${upperFirst(answer)} ingår i ${match[1]}`;

  match = q.match(/^Vad gäller för (.+)$/i);
  if (match) return upperFirst(answer);

  match = q.match(/^Från vilken ålder är (.+)$/i);
  if (match) return `Från ${lowerFirst(answer)} är ${match[1]}`;

  match = q.match(/^Vad förändrades genom (.+)$/i);
  if (match)
    return `Förändringen genom ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;

  match = q.match(/^Vilken händelse från (.+?) nämns som (.+)$/i);
  if (match) return `Händelsen från ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;

  match = q.match(/^När firas (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} firas ${lowerFirst(answer)}`;

  match = q.match(/^Vilket svar beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);

  match = q.match(/^Vad beslutade (.+?) som (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} beslutade att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(
    /^Hur stor andel av rösterna måste ett parti minst få för att komma in i riksdagen$/i,
  );
  if (match) return `Ett parti måste få ${lowerFirst(answer)} för att komma in i riksdagen`;

  return upperFirst(stripLeadingPurposeSv(answer));
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
  if (match) return `${upperFirst(match[1])} is called ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^What is the name of (.+)$/i);
  if (match) return `${upperFirst(match[1])} is called ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which islands are Sweden's two largest$/i);
  if (match) return `Sweden's two largest islands are ${answer}`;

  match = q.match(/^Which islands are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Which are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Approximately how many (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Which (.+?) are important in Sweden$/i);
  if (match) return `${upperFirst(answer)} are important ${match[1]} in Sweden`;

  match = q.match(/^What does (.+) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);

  match = q.match(/^Which of the following is part of (.+)$/i);
  if (match) return `A feature of ${match[1]} is that ${lowerFirst(answer)}`;

  match = q.match(/^Which is a way to (.+)$/i);
  if (match) return `One way to ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What is it called when (.+)$/i);
  if (match) return `When ${match[1]}, it is called ${lowerFirst(answer)}`;

  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) return `${upperFirst(answer)} when ${match[1]} affects ${match[2]}`;

  match = q.match(/^How do (.+?) choose (.+)$/i);
  if (match) {
    if (/^By\s+/i.test(answer)) {
      return `${upperFirst(match[1])} choose ${match[2]} ${lowerFirst(answer)}`;
    }
    return upperFirst(answer);
  }

  match = q.match(/^How many (.+?) does (.+?) have$/i);
  if (match) return `${upperFirst(match[2])} has ${lowerFirst(answer)} ${match[1]}`;

  match = q.match(/^Who chooses (.+)$/i);
  if (match) return `${upperFirst(match[1])} is chosen by ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^How old must (.+?) be to (.+)$/i);
  if (match) return `${upperFirst(match[1])} must be ${lowerFirst(answer)} to ${match[2]}`;

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) return `That ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What does it mean to (.+)$/i);
  if (match) return `To ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;

  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} has the task to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);

  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match) {
    return `The foremost task of ${lowerLeadingEnglishArticle(match[1])} is ${englishInfinitive(
      stripLeadingPurposeEn(answer),
    )}`;
  }

  match = q.match(/^Which example describes (.+)$/i);
  if (match)
    return `${upperFirst(answer)} ${englishSubjectVerb(answer, 'belongs', 'belong')} among ${match[1]}`;

  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;

  match = q.match(/^Which requirements apply to (.+)$/i);
  if (match) return `To ${requirementTargetEn(match[1])}, ${lowerFirst(answer)}`;

  match = q.match(/^Why (.+)$/i);
  if (match) return `One reason is that ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What do (.+?) have in common$/i);
  if (match) return commonStatementEn(match[1], answer);

  match = q.match(/^What happens in (.+?) if (.+)$/i);
  if (match) return `In ${match[1]}, ${lowerFirst(answer)} if ${match[2]}`;

  match = q.match(/^Which list contains (.+)$/i);
  if (match) return `The list with ${lowerLeadingEnglishArticle(answer)} contains ${match[1]}`;

  match = q.match(/^What does (.+?) say about (.+)$/i);
  if (match) return `${upperFirst(match[1])} says that ${lowerLeadingEnglishClauseStart(answer)}`;

  match = q.match(/^What does (.+?) regulate$/i);
  if (match) return `${upperFirst(match[1])} regulates ${lowerFirst(answer)}`;

  match = q.match(/^What does (.+?) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);

  match = q.match(/^Which authorities are part of (.+)$/i);
  if (match) return `${upperFirst(answer)} are part of ${match[1]}`;

  match = q.match(/^What applies to (.+)$/i);
  if (match) return appliesStatementEn(match[1], answer);

  match = q.match(/^From what age is (.+)$/i);
  if (match) return `From ${lowerFirst(answer)}, ${match[1]}`;

  match = q.match(/^What changed through (.+)$/i);
  if (match) return `The change through ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which event from (.+?) is mentioned as (.+)$/i);
  if (match) return `The event from ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^When is (.+?) (?:celebrated|observed) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} is observed ${lowerFirst(answer)}`;

  match = q.match(/^Which answer describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);

  match = q.match(/^What did (.+?) decide as (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} decided that ${lowerFirst(stripLeadingThatEn(answer))}`;

  match = q.match(/^What minimum share of votes must a party receive to enter the Riksdag$/i);
  if (match) return `A party must receive ${lowerFirst(answer)} to enter the Riksdag`;

  return upperFirst(stripLeadingPurposeEn(answer));
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
