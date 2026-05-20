import type { PracticeQuestion, QuestionOption } from '../../types/content';

const UNKNOWN_OPTION: QuestionOption = {
  id: 'unknown',
  textSv: 'Inget av alternativen stämmer',
  textEn: 'None of the options is correct',
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

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags)];
}

function normalizedQuestionText(
  type: PracticeQuestion['type'],
  questionSv: string,
  questionEn: string,
): Pick<PracticeQuestion, 'questionSv' | 'questionEn'> {
  if (type !== 'true_false') return { questionSv, questionEn };

  return {
    questionSv: ensureSentence(stripTrueFalsePromptSv(questionSv)),
    questionEn: ensureSentence(stripTrueFalsePromptEn(questionEn)),
  };
}

function publishedCopy(question: PracticeQuestion): PracticeQuestion {
  return {
    ...question,
    ...normalizedQuestionText(question.type, question.questionSv, question.questionEn),
    reviewStatus: 'published',
  };
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
  explanationSv = source.explanationSv,
  explanationEn = source.explanationEn,
): PracticeQuestion {
  const normalized =
    type === 'single_choice'
      ? normalizeSingleChoiceOptions(options, correctOptionId)
      : { options, correctOptionId };

  const normalizedText = normalizedQuestionText(type, questionSv, questionEn);

  return {
    id,
    chapterId: source.chapterId,
    type,
    questionSv: normalizedText.questionSv,
    questionEn: normalizedText.questionEn,
    options: normalized.options,
    correctOptionId: normalized.correctOptionId,
    explanationSv,
    explanationEn,
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
  if (source.type === 'true_false') return trueFalseStatementOptions(source);
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
  if (/^EU\b/.test(value)) return value;
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function upperFirst(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function lowerLeadingEnglishArticle(value: string): string {
  return value.replace(/^(The|In|A|An|At|On|Almost)\b/, (match) => match.toLowerCase());
}

function lowerLeadingSwedishCommonStart(value: string): string {
  return value.replace(/^(Havet|Nästan|Ungefär|Ett|En|Man|När|Kungens)\b/, (match) =>
    match.toLowerCase(),
  );
}

function lowerLeadingSwedishClauseStart(value: string): string {
  return value.replace(
    /^(Havet|Nästan|Ungefär|Ett|En|Den|Det|Man|När|År|Oppositionen|Politiker|All|Samarbetet)\b/,
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

function englishAgePhrase(value: string): string {
  return value.replace(/^(\d+)\s+years$/i, 'age $1');
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

function stripLeadingByEn(value: string): string {
  return stripLeadingPurposeEn(value).replace(/^by\s+/i, '');
}

function englishGerundPhrase(value: string): string {
  const phrase = stripLeadingByEn(value).trim();
  const [first = '', ...rest] = phrase.split(/\s+/);
  if (!first) return phrase;
  const lower = first.toLowerCase();
  let gerund = `${lower}ing`;
  if (/ing$/i.test(lower)) gerund = lower;
  else if (/ie$/i.test(lower)) gerund = `${lower.slice(0, -2)}ying`;
  else if (/[^aeiou]e$/i.test(lower)) gerund = `${lower.slice(0, -1)}ing`;
  return [gerund, ...rest].join(' ');
}

function englishCivicActionClause(value: string): string {
  return lowerFirst(stripLeadingPurposeEn(value).trim())
    .replace(/^many people voting\b/i, 'many people vote')
    .replace(/\bgetting involved\b/gi, 'get involved')
    .replace(/\blearning about\b/gi, 'learn about')
    .replace(/^fewer people taking\b/i, 'fewer people take')
    .replace(/^people avoiding\b/i, 'people avoid')
    .replace(/^only authorities being allowed\b/i, 'only authorities are allowed')
    .replace(/^people with (.+?) living closer\b/i, 'people with $1 live closer')
    .replace(/\band feeling included\b/i, 'and feel included')
    .replace(/^people living\b/i, 'people live')
    .replace(/^public services being available\b/i, 'public services are available')
    .replace(/^political engagement always decreasing\b/i, 'political engagement always decreases');
}

function webSocialMediaStatementSv(answer: string): string {
  if (/^Vem som helst kan skapa innehåll där/i.test(answer)) {
    return 'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier';
  }
  if (/^Bara ansvariga utgivare får skriva inlägg där/i.test(answer)) {
    return 'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg';
  }
  if (/^Allt innehåll godkänns först av staten/i.test(answer)) {
    return 'På webben och i sociala medier godkänns allt innehåll först av staten';
  }
  if (/^Innehållet är alltid mer pålitligt/i.test(answer)) {
    return 'Innehåll på webben och i sociala medier är alltid mer pålitligt än nyheter i tidningar';
  }
  return `På webben och i sociala medier gäller att ${lowerFirst(
    answer.replace(/\bdär\b/gi, 'på webben och i sociala medier'),
  )}`;
}

function webSocialMediaStatementEn(answer: string): string {
  if (/^Anyone can create content there/i.test(answer)) {
    return 'On the web and in social media, anyone can create content, and that content is not always checked the same way as in other media';
  }
  if (/^Only responsible publishers may write posts there/i.test(answer)) {
    return 'On the web and in social media, only responsible publishers may write posts';
  }
  if (/^All content is first approved by the state/i.test(answer)) {
    return 'On the web and in social media, all content is first approved by the state';
  }
  if (/^The content is always more reliable/i.test(answer)) {
    return 'Content on the web and in social media is always more reliable than news in newspapers';
  }
  return `On the web and in social media, ${lowerFirst(
    answer.replace(/\bthere\b/gi, 'on the web and in social media'),
  )}`;
}

function swedishCommonToDoStatement(timePhrase: string, answer: string): string {
  const activity = lowerFirst(stripLeadingPurposeSv(answer));
  if (
    /^(?:fira|äta|tända|öppna|hålla|bära|bjuda|välkomna|arrangera|samlas|dansa|sjunga)\b/i.test(
      activity,
    )
  ) {
    return `På ${timePhrase} är det vanligt att ${activity}`;
  }
  return `På ${timePhrase} är det vanligt med ${activity}`;
}

function englishCommonToDoStatement(timePhrase: string, answer: string): string {
  const time = stripTrailingComma(timePhrase);
  const activity = lowerFirst(stripLeadingPurposeEn(answer));
  if (
    /^(?:celebrate|eat|light|open|hold|wear|serve|welcome|arrange|gather|dance|sing)\b/i.test(
      activity,
    )
  ) {
    return `On ${time}, it is common to ${activity}`;
  }
  return `On ${time}, ${activity} are common`;
}

function englishCommonCelebrationMode(answer: string): string {
  const activity = stripLeadingPurposeEn(answer).trim();
  const celebrateMatch = activity.match(/^celebrate with (.+)$/i);
  if (celebrateMatch) return `with ${lowerFirst(celebrateMatch[1])}`;
  if (
    /^(?:celebrate|eat|light|open|hold|wear|serve|welcome|arrange|gather|dance|sing|go)\b/i.test(
      activity,
    )
  ) {
    return `by ${englishGerundPhrase(activity)}`;
  }
  return `with ${lowerFirst(activity)}`;
}

function swedishHabitualPredicate(answer: string): string {
  return lowerFirst(answer).replace(/\barrangerar\b/i, 'arrangera');
}

function englishCommonActivity(value: string): string {
  return stripLeadingPurposeEn(value)
    .trim()
    .replace(/^Eating\b/i, 'eat')
    .replace(/^Lighting\b/i, 'light')
    .replace(/^Opening\b/i, 'open')
    .replace(/^Holding\b/i, 'hold')
    .replace(/\band opening\b/gi, 'and open')
    .replace(/\band children getting\b/gi, 'and for children to get');
}

function swedishCalledAnswer(answer: string): string {
  const normalized = answer.trim();
  if (/^Luciatåg$/i.test(normalized)) return 'ett luciatåg';
  if (/^Valborgsbrasa$/i.test(normalized)) return 'en valborgsbrasa';
  if (/^Midsommarstång$/i.test(normalized)) return 'en midsommarstång';
  return answer;
}

function englishCalledAnswer(answer: string): string {
  const normalized = answer.trim();
  if (/^(?:Lucia procession|Walpurgis bonfire|Midsummer pole)$/i.test(normalized)) {
    return `a ${normalized}`;
  }
  return lowerLeadingEnglishArticle(answer);
}

function swedishChildrenWithAdventCalendarStatement(answer: string): string {
  const activity = lowerFirst(stripLeadingPurposeSv(answer));
  if (/^öppnar\b/i.test(activity)) {
    return `Barn med en adventskalender hemma ${activity}`;
  }
  return `Under advent ${activity.replace(/^(\S+)/, '$1 barn')}`;
}

function englishChildrenWithAdventCalendarStatement(answer: string): string {
  const activity = lowerFirst(stripLeadingPurposeEn(answer));
  if (/^open\b/i.test(activity)) {
    return `Children with an Advent calendar at home often ${activity}`;
  }
  return `During Advent, children often ${activity}`;
}

function englishOccurrencePhrase(value: string): string {
  const phrase = lowerLeadingEnglishArticle(value.trim());
  if (/^on\b/i.test(phrase)) return phrase;
  if (
    /^(?:(?:a|an|the)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|four Sundays)\b/i.test(
      phrase,
    )
  ) {
    return `on ${phrase}`;
  }
  return phrase;
}

function lowerEnglishNounPhrase(value: string): string {
  const phrase = value.trim();
  if (/^(?:Buddhist|Hindu|Orthodox|Catholic|Protestant|Jewish|Muslim|Christian)\b/.test(phrase)) {
    return phrase;
  }
  if (/^(?:The|In|A|An|At|On|Almost)\b/.test(phrase)) return lowerLeadingEnglishArticle(phrase);
  return lowerFirst(phrase);
}

function swedishTraditionalCelebrationAnswer(answer: string): string {
  if (/^Jesu födelse\b/.test(answer)) return answer;
  return lowerFirst(answer);
}

function englishTraditionalCelebrationAnswer(answer: string): string {
  if (/^Jesus' birth\b/.test(answer)) return answer;
  return lowerFirst(answer);
}

function swedishPurposeClause(value: string): string {
  return `att ${lowerLeadingSwedishClauseStart(stripLeadingPurposeSv(value))}`;
}

function swedishProtectedReligionStatement(subject: string, answer: string): string {
  const trimmed = answer.trim();
  const rightAndProtection = trimmed.match(/^Rätten att (.+?) och skydd mot (.+)$/i);
  if (rightAndProtection) {
    return `${upperFirst(subject)} skyddar rätten att ${lowerLeadingSwedishClauseStart(
      rightAndProtection[1],
    )} och ger skydd mot ${lowerFirst(rightAndProtection[2])}`;
  }

  const stateChoice = trimmed.match(/^Att staten väljer (.+)$/i);
  if (stateChoice) return `${upperFirst(subject)} låter staten välja ${lowerFirst(stateChoice[1])}`;

  return `${upperFirst(subject)} skyddar ${lowerFirst(answer)}`;
}

function englishProtectedReligionStatement(subject: string, answer: string): string {
  const trimmed = answer.trim();
  const rightAndProtection = trimmed.match(/^The right to (.+?) and protection from (.+)$/i);
  if (rightAndProtection) {
    return `${upperFirst(subject)} protects the right to ${lowerFirst(
      rightAndProtection[1],
    )} and protects against ${lowerFirst(rightAndProtection[2])}`;
  }

  const stateChoice = trimmed.match(/^That the state chooses (.+)$/i);
  if (stateChoice)
    return `${upperFirst(subject)} lets the state choose ${lowerFirst(stateChoice[1])}`;

  return `${upperFirst(subject)} protects ${lowerFirst(answer)}`;
}

function swedishChristianHolidayStatement(
  subject: string,
  condition: string,
  answer: string,
): string {
  return `${answer} är kristna högtider som ${lowerFirst(subject)} firar även om ${condition}`;
}

function englishChristianHolidayStatement(
  subject: string,
  condition: string,
  answer: string,
): string {
  return `${answer} are Christian holidays that ${lowerFirst(subject)} celebrate even if ${condition}`;
}

function swedishGainedRightStatement(subject: string, answer: string, timePhrase: string): string {
  const activity = stripLeadingPurposeSv(answer).replace(/\bi landet\b/i, 'i Sverige');
  if (/^bli Sveriges största religiösa grupp$/i.test(activity)) {
    return `${upperFirst(subject)} blev Sveriges största religiösa grupp på ${timePhrase}`;
  }
  return `${upperFirst(subject)} fick rätt att ${lowerFirst(activity)}`;
}

function englishGainedRightStatement(subject: string, answer: string, timePhrase: string): string {
  const activity = stripLeadingPurposeEn(answer).replace(/\bin the country\b/i, 'in Sweden');
  if (/^become Sweden’s largest religious group$/i.test(activity)) {
    return `${upperFirst(subject)} became Sweden’s largest religious group in ${timePhrase}`;
  }
  return `${upperFirst(subject)} gained the right to ${lowerFirst(activity)}`;
}

function whyTargetStatementSv(target: string): string {
  const cleaned = stripFinalPunctuation(target);

  let match = cleaned.match(
    /^(kan|ska|måste|bör|får)\s+(.+?)\s+(vara|bli|ha|göra|skapa|ersätta|ge|påverka|spridas|delta|rösta)\b(.*)$/i,
  );
  if (match) {
    return `${lowerLeadingSwedishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3].toLowerCase()}${match[4]}`;
  }

  match = cleaned.match(/^behövs\s+(.+?)\s+(när|för|i|på|av)\b(.*)$/i);
  if (match) {
    return `${lowerLeadingSwedishClauseStart(match[1])} behövs ${match[2]}${match[3]}`;
  }

  match = cleaned.match(/^(behövs|finns)\s+(.+)$/i);
  if (match) return `${lowerLeadingSwedishClauseStart(match[2])} ${match[1].toLowerCase()}`;

  return lowerLeadingSwedishClauseStart(cleaned);
}

function whyTargetStatementEn(target: string): string {
  const cleaned = stripFinalPunctuation(target);

  let match = cleaned.match(
    /^(can|could|should|must|will|would|may|might)\s+(.+?)\s+(be|have|do|make|create|spread|replace|give|become)\b(.*)$/i,
  );
  if (match) {
    return `${lowerLeadingEnglishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3].toLowerCase()}${match[4]}`;
  }

  match = cleaned.match(/^(is|are|was|were)\s+(.+?)\s+((?:needed|required|allowed|called)\b.*)$/i);
  if (match) {
    return `${lowerLeadingEnglishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3]}`;
  }

  return lowerLeadingEnglishClauseStart(cleaned);
}

function swedishReasonClause(value: string): string {
  return lowerFirst(value).replace(/\bsom publiceras är alltid\b/i, 'som publiceras alltid är');
}

function reasonAnswerClauseSv(answer: string): string {
  const stripped = stripLeadingPurposeSv(answer);
  if (/^för att|^att\s+/i.test(answer.trim())) return `att ${swedishReasonClause(stripped)}`;
  if (
    /(^|[\s,])(?:hade|saknade|var|är|kan|ska|måste|gör|behöver|får|blir|har)(?=$|[\s,.?!])/i.test(
      stripped,
    )
  ) {
    return `att ${swedishReasonClause(stripped)}`;
  }
  return lowerFirst(stripped).replace(/\beU\b/g, 'EU');
}

function reasonAnswerClauseEn(answer: string): string {
  const stripped = stripLeadingPurposeEn(answer);
  if (/^to\b/i.test(answer.trim())) return `to ${lowerFirst(stripped)}`;
  if (/\b(?:had|was|were|is|are|can|must|should|does|do|has|have|makes|gives)\b/i.test(stripped)) {
    return `that ${lowerFirst(stripped)}`;
  }
  return lowerFirst(stripped);
}

function reasonStatementSv(answer: string, target?: string): string {
  if (target) {
    return `En anledning till att ${whyTargetStatementSv(target)} är ${reasonAnswerClauseSv(
      answer,
    )}`.replace(/\beU\b/g, 'EU');
  }

  const stripped = stripLeadingPurposeSv(answer);
  if (/^för att|^att\s+/i.test(answer.trim())) return `En anledning är att ${lowerFirst(stripped)}`;
  if (/^[A-ZÅÄÖ]/.test(stripped) && /\b(?:hade|saknade|var|är|kan|ska|måste)\b/i.test(stripped)) {
    return `En anledning är att ${stripped}`;
  }
  return `En anledning är ${lowerFirst(stripped)}`.replace(/\beU\b/g, 'EU');
}

function reasonStatementEn(answer: string, target?: string): string {
  if (target) {
    return `One reason ${whyTargetStatementEn(target)} is ${reasonAnswerClauseEn(answer)}`;
  }

  const stripped = stripLeadingPurposeEn(answer);
  if (/^to\b/i.test(answer.trim())) return `One reason is to ${lowerFirst(stripped)}`;
  if (/^[A-ZÅÄÖ]/.test(stripped) && /\b(?:had|was|were|is|are|can|must|should)\b/i.test(stripped)) {
    return `One reason is that ${stripped}`;
  }
  return `One reason is ${lowerFirst(stripped)}`;
}

function frontedManyActionSv(answer: string): string {
  const words = lowerFirst(answer).split(/\s+/);
  if (words.length <= 1) return `gör många ${words[0] ?? ''}`.trim();
  return `${words[0]} många ${words.slice(1).join(' ')}`;
}

function manyPeopleActionEn(answer: string): string {
  return `many people ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}

function stripTrailingComma(value: string): string {
  return value.replace(/,\s*$/, '');
}

function embeddedSwedishClause(value: string): string {
  return lowerFirst(stripLeadingPurposeSv(value))
    .replace(/^sverige\b/i, 'Sverige')
    .replace(/^det är alltid\s+/i, 'det alltid är ')
    .replace(/^domstolarna avgör bara\s+/i, 'domstolarna bara avgör ');
}

function embeddedEnglishClause(value: string): string {
  return lowerLeadingEnglishClauseStart(stripLeadingPurposeEn(value));
}

function replaceLeadingSwedishSubject(subject: string, value: string): string {
  if (/^äktenskap mellan personer av samma kön i Sverige$/i.test(subject.trim())) {
    if (/^Det är tillåtet att gifta sig med en person av samma kön$/i.test(value.trim())) {
      return 'Äktenskap mellan personer av samma kön är tillåtet i Sverige';
    }
    if (/^Det är förbjudet att gifta sig med en person av samma kön$/i.test(value.trim())) {
      return 'Äktenskap mellan personer av samma kön är förbjudet i Sverige';
    }
  }
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
    .replace(/^It can\s+/i, `${normalizedSubject} can `)
    .replace(/^It makes\s+/i, `${normalizedSubject} makes `)
    .replace(/^It is\s+/i, `${normalizedSubject} is `)
    .replace(/^It was\s+/i, `${normalizedSubject} was `)
    .replace(/^It says\s+/i, `${normalizedSubject} says `)
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
  if (
    /^(?:People|Public services|Political engagement)\b/i.test(answer) &&
    /^integration\b/i.test(subject)
  ) {
    return `${upperFirst(subject)} means ${englishCivicActionClause(answer)}`;
  }
  if (/^To\s+/i.test(answer)) {
    return `${upperFirst(subject)} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function importantRolesStatementSv(subject: string, context: string, answer: string): string {
  if (/^Att\s+/i.test(answer)) {
    return `I ${context} har ${lowerFirst(subject)} viktiga uppgifter: att ${lowerLeadingSwedishClauseStart(
      stripLeadingPurposeSv(answer),
    )}`;
  }
  if (/^De ska\s+/i.test(answer)) {
    return `I ${context} ska ${lowerFirst(subject)} ${lowerFirst(answer.replace(/^De ska\s+/i, ''))}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}

function importantRolesStatementEn(subject: string, context: string, answer: string): string {
  if (/^To inform, enable public debate, and scrutinize people with power$/i.test(answer)) {
    return `In ${context}, ${lowerFirst(
      subject,
    )} play important roles: informing, enabling public debate, and scrutinizing people with power`;
  }
  if (/^To\s+/i.test(answer)) {
    return `In ${context}, ${lowerFirst(subject)} play an important role: ${englishGerundPhrase(
      answer,
    )}`;
  }
  if (/^They should\s+/i.test(answer)) {
    return `In ${context}, ${lowerFirst(subject)} should ${lowerFirst(
      answer.replace(/^They should\s+/i, ''),
    )}`;
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

function decisionStatementSv(subject: string, context: string, answer: string): string {
  const normalizedAnswer = lowerFirst(stripLeadingPurposeSv(answer));
  const yearContext = context.match(/^(.+?)\s+(\d{4})$/);
  if (yearContext) {
    return `År ${yearContext[2]} beslutade ${upperFirst(subject)} som ${yearContext[1]} att ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} beslutade som ${context} att ${normalizedAnswer}`;
}

function decisionStatementEn(subject: string, context: string, answer: string): string {
  const normalizedAnswer = lowerFirst(stripLeadingThatEn(answer));
  const yearContext = context.match(/^(.+?)\s+in\s+(\d{4})$/i);
  if (yearContext) {
    return `In ${yearContext[2]}, ${upperFirst(subject)} was ${yearContext[1]} to decide that ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} decided as ${context} that ${normalizedAnswer}`;
}

function supportStatementSv(subject: string, answer: string): string {
  if (/^En\s+/i.test(answer)) return `${upperFirst(subject)} är ${lowerFirst(answer)}`;
  return replaceLeadingSwedishSubject(subject, answer);
}

function supportStatementEn(subject: string, answer: string): string {
  if (/^(?:A|An)\s+/i.test(answer)) {
    return `${upperFirst(subject)} is ${lowerLeadingEnglishArticle(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function conditionalPartyOutcomeSv(context: string, condition: string, answer: string): string {
  const partyCondition = condition.match(/^ett parti får (.+)$/i);
  const partyOutcome = answer.trim().match(/^partiet får (.+)$/i);
  if (partyCondition && partyOutcome) {
    return `I ${context} får ett parti som får ${partyCondition[1]} ${lowerFirst(partyOutcome[1])}`;
  }

  const outcome = lowerFirst(answer).replace(/^partiet får\s+/i, 'partiet ');
  return `I ${context} får ${outcome} om ${condition}`;
}

function conditionalPartyOutcomeEn(context: string, condition: string, answer: string): string {
  const partyCondition = condition.match(/^a party receives (.+)$/i);
  const partyOutcome = answer.trim().match(/^the party receives (.+)$/i);
  if (partyCondition && partyOutcome) {
    return `In ${context}, a party that receives ${partyCondition[1]} receives ${lowerFirst(
      partyOutcome[1],
    )}`;
  }

  return `In ${context}, ${lowerFirst(answer)} if ${condition}`;
}

function stripTrueFalsePromptSv(value: string): string {
  return stripFinalPunctuation(value.replace(/^Sant eller falskt:\s*/i, ''));
}

function stripTrueFalsePromptEn(value: string): string {
  return stripFinalPunctuation(value.replace(/^True or false:\s*/i, ''));
}

function firstSentence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return stripFinalPunctuation(match?.[1] ?? trimmed);
}

function normalizeStatementForComparison(value: string): string {
  return stripFinalPunctuation(value).replace(/\s+/g, ' ').trim().toLowerCase();
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

function sourceDirectStatementSv(
  source: PracticeQuestion,
  statement: string,
  sourceStatementIsTrue: boolean,
): string {
  if (sourceStatementIsTrue) {
    const fromExplanation = firstSentence(
      source.explanationSv.replace(/^Påståendet är sant[:.]?\s*/i, ''),
    );
    if (
      fromExplanation &&
      normalizeStatementForComparison(fromExplanation) !==
        normalizeStatementForComparison(statement)
    ) {
      return upperFirst(fromExplanation);
    }
  }

  return truthStatementSv(statement);
}

function sourceDirectStatementEn(
  source: PracticeQuestion,
  statement: string,
  sourceStatementIsTrue: boolean,
): string {
  if (sourceStatementIsTrue) {
    const fromExplanation = firstSentence(
      source.explanationEn.replace(/^The statement is true[:.]?\s*/i, ''),
    );
    if (
      fromExplanation &&
      normalizeStatementForComparison(fromExplanation) !==
        normalizeStatementForComparison(statement)
    ) {
      return upperFirst(fromExplanation);
    }
  }

  return truthStatementEn(statement);
}

function sourceOppositeStatementSv(statement: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bmåste\b/i, 'behöver inte'],
    [/\bska\b/i, 'ska inte'],
    [/\bhar rätt att\b/i, 'har inte rätt att'],
    [/\bbrukar\b/i, 'brukar inte'],
    [/\bblev\b/i, 'blev inte'],
    [/\bomfattar\b/i, 'omfattar inte'],
    [/\bbidrar till\b/i, 'bidrar inte till'],
    [/\bligger\b/i, 'ligger inte'],
    [/\bväljer\b/i, 'väljer inte'],
    [/\bär\b/i, 'är inte'],
    [/\bhar\b/i, 'har inte'],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }

  return `Det stämmer inte att ${lowerLeadingSwedishClauseStart(statement)}`;
}

function sourceOppositeStatementEn(statement: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bmust\b/i, 'do not have to'],
    [/\bshould\b/i, 'should not'],
    [/\bhas the right to\b/i, 'does not have the right to'],
    [/\bis usually divided\b/i, 'is not usually divided'],
    [/\bbecame\b/i, 'did not become'],
    [/\bincludes\b/i, 'does not include'],
    [/\bhelps make\b/i, 'does not help make'],
    [/\bhelp make\b/i, 'do not help make'],
    [/\blies\b/i, 'does not lie'],
    [/\bchooses\b/i, 'does not choose'],
    [/\bare\b/i, 'are not'],
    [/\bis\b/i, 'is not'],
    [/\bhas\b/i, 'does not have'],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }

  return `It is not true that ${lowerLeadingEnglishClauseStart(statement)}`;
}

function sourceFalseRestatementSv(statement: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bmåste\b/i, 'är skyldiga att'],
    [/\bska\b/i, 'är skyldiga att'],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }

  return truthStatementSv(statement);
}

function sourceFalseRestatementEn(statement: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bmust\b/i, 'are required to'],
    [/\bshould\b/i, 'are required to'],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }

  return truthStatementEn(statement);
}

function trueFalseSourceStatementSv(source: PracticeQuestion, variantIsTrue: boolean): string {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptSv(source.questionSv);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementSv(statement);
    return sourceDirectStatementSv(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementSv(statement);
}

function trueFalseSourceStatementEn(source: PracticeQuestion, variantIsTrue: boolean): string {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptEn(source.questionEn);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementEn(statement);
    return sourceDirectStatementEn(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementEn(statement);
}

function sourceTrueFactSv(source: PracticeQuestion): string {
  return ensureSentence(truthStatementSv(stripTrueFalsePromptSv(source.questionSv)));
}

function sourceTrueFactEn(source: PracticeQuestion): string {
  return ensureSentence(truthStatementEn(stripTrueFalsePromptEn(source.questionEn)));
}

function cleanTrueFalseSourceExplanationSv(source: PracticeQuestion): string {
  return ensureSentence(
    upperFirst(
      source.explanationSv
        .replace(/^Påståendet är sant[:.]?\s*/i, '')
        .replace(
          /\s*Därför\s+stämmer\s+alternativet\s+Sant,\s+medan\s+Falskt\s+motsäger\s+uppgiften\.?$/i,
          '',
        )
        .replace(
          /\s*[;,]?\s*(?:så\s+påståendet\s+är\s+sant|därför\s+(?:är\s+)?påståendet\s+sant)\.?$/i,
          '',
        )
        .trim(),
    ),
  );
}

function cleanTrueFalseSourceExplanationEn(source: PracticeQuestion): string {
  return ensureSentence(
    upperFirst(
      source.explanationEn
        .replace(/^The statement is true[:.]?\s*/i, '')
        .replace(
          /\s*That\s+makes\s+True\s+correct,\s+while\s+False\s+contradicts\s+the\s+fact\.?$/i,
          '',
        )
        .replace(/\s*,?\s*so\s+the\s+statement\s+is\s+true\.?$/i, '')
        .replace(/\s*[;,]?\s*that\s+makes\s+the\s+statement\s+true\.?$/i, '')
        .trim(),
    ),
  );
}

function trueStatementExplanationSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationSv(source);
    return ensureSentence(trueFalseSourceStatementSv(source, true));
  }

  return source.explanationSv;
}

function trueStatementExplanationEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationEn(source);
    return ensureSentence(trueFalseSourceStatementEn(source, true));
  }

  return source.explanationEn;
}

function falseStatementExplanationSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactSv(source));
  }

  return source.explanationSv;
}

function falseStatementExplanationEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactEn(source));
  }

  return source.explanationEn;
}

function trueFalseSingleChoiceExplanationSv(source: PracticeQuestion): string {
  return `${ensureSentence(
    trueFalseSourceStatementSv(source, true),
  )} Därför stämmer påståendet som motsvarar den uppgiften, medan motsatsen inte stämmer.`;
}

function trueFalseSingleChoiceExplanationEn(source: PracticeQuestion): string {
  return `${ensureSentence(
    trueFalseSourceStatementEn(source, true),
  )} Therefore the statement that matches that fact is correct, while the opposite statement is not.`;
}

function statementTopicSv(source: PracticeQuestion): string {
  const statement = stripFinalPunctuation(stripTrueFalsePromptSv(source.questionSv));

  if (/^År 2000 blev Svenska kyrkan\b/i.test(statement)) {
    return 'Svenska kyrkan och staten år 2000';
  }

  const match = statement.match(
    /^(.+?)\s+(?:ligger|bidrar|väljer|ska|måste|har rätt|omfattar|blev|brukar|är)\b/i,
  );
  return match
    ? match[1]
        .replace(/^Den\b/, 'den')
        .replace(/^Det\b/, 'det')
        .replace(/^Oppositionen\b/, 'oppositionen')
        .replace(/^Politiker\b/, 'politiker')
        .replace(/^Public service-företag\b/, 'public service-företag')
    : source.uhrReference.section;
}

function statementTopicEn(source: PracticeQuestion): string {
  const statement = stripFinalPunctuation(stripTrueFalsePromptEn(source.questionEn));

  if (/^In 2000, the Church of Sweden became\b/i.test(statement)) {
    return 'the Church of Sweden and the state in 2000';
  }

  const match = statement.match(
    /^(.+?)\s+(?:lies|help make|helps make|chooses|should|must|has the right|includes|became|is usually divided|is)\b/i,
  );
  if (!match) return source.uhrReference.section;
  return lowerLeadingEnglishArticle(match[1])
    .replace(/^Politicians\b/, 'politicians')
    .replace(/^Public service companies\b/, 'public service companies');
}

function trueFalseStatementOptions(source: PracticeQuestion): QuestionOption[] {
  return [
    {
      id: 'true-statement',
      textSv: ensureSentence(trueFalseSourceStatementSv(source, true)),
      textEn: ensureSentence(trueFalseSourceStatementEn(source, true)),
    },
    {
      id: 'false-statement',
      textSv: ensureSentence(trueFalseSourceStatementSv(source, false)),
      textEn: ensureSentence(trueFalseSourceStatementEn(source, false)),
    },
    {
      id: 'both-statements',
      textSv: 'Båda påståendena är korrekta',
      textEn: 'Both statements are correct',
    },
    {
      id: 'neither-statement',
      textSv: 'Inget av påståendena är korrekt',
      textEn: 'Neither statement is correct',
    },
  ];
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function usableClozeCandidate(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 3 || /^[A-ZÅÄÖ]{2,}$/.test(trimmed);
}

function uniqueClozeCandidates(candidates: string[]): string[] {
  return [
    ...new Set(
      candidates
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate && usableClozeCandidate(candidate)),
    ),
  ].sort((a, b) => b.length - a.length);
}

function replaceClozeCandidate(statement: string, candidates: string[]): string | null {
  for (const candidate of uniqueClozeCandidates(candidates)) {
    const pattern = new RegExp(escapeRegExp(candidate), 'i');
    if (pattern.test(statement)) {
      const replaced = statement.replace(pattern, '...');
      if (/[A-Za-zÅÄÖåäö0-9]/.test(replaced.replace(/\.\.\./g, ''))) return replaced;
    }
  }
  return null;
}

function singleChoiceClozePromptSv(source: PracticeQuestion): string {
  const option = correctOption(source);
  const answer = stripFinalPunctuation(answerLabel(option));
  const strippedPurpose = stripLeadingPurposeSv(answer);
  const strippedMust = stripLeadingMustSv(answer);
  const statement = stripFinalPunctuation(civicStatementSv(source, option));
  const cloze = replaceClozeCandidate(statement, [
    answer,
    lowerFirst(answer),
    upperFirst(answer),
    strippedPurpose,
    lowerFirst(strippedPurpose),
    upperFirst(strippedPurpose),
    strippedMust,
    lowerFirst(strippedMust),
    swedishCalledAnswer(answer),
    swedishPurposeClause(answer),
    frontedManyActionSv(answer),
    reasonAnswerClauseSv(answer),
    swedishTraditionalCelebrationAnswer(answer),
  ]);

  if (cloze) return ensureSentence(cloze);
  return `${stripFinalPunctuation(source.questionSv)} ...?`;
}

function singleChoiceClozePromptEn(source: PracticeQuestion): string {
  const option = correctOption(source);
  const answer = stripFinalPunctuation(answerTextEn(option));
  const strippedPurpose = stripLeadingPurposeEn(answer);
  const strippedBy = stripLeadingByEn(answer);
  const statement = stripFinalPunctuation(civicStatementEn(source, option));
  const cloze = replaceClozeCandidate(statement, [
    answer,
    lowerFirst(answer),
    upperFirst(answer),
    strippedPurpose,
    lowerFirst(strippedPurpose),
    upperFirst(strippedPurpose),
    strippedBy,
    lowerFirst(strippedBy),
    englishCalledAnswer(answer),
    englishGerundPhrase(answer),
    englishCivicActionClause(answer),
    englishInfinitive(answer),
    manyPeopleActionEn(answer),
    reasonAnswerClauseEn(answer),
    englishTraditionalCelebrationAnswer(answer),
  ]);

  if (cloze) return ensureSentence(cloze);
  return `${stripFinalPunctuation(source.questionEn)} ...?`;
}

function judgementPromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Vilket påstående stämmer bäst om ${statementTopicSv(source)}?`;
  }
  return `Välj rätt alternativ: ${source.questionSv}`;
}

function judgementPromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Which statement best matches ${statementTopicEn(source)}?`;
  }
  return `Choose the correct option: ${source.questionEn}`;
}

function singleChoicePromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Vilket påstående är korrekt om ${statementTopicSv(source)}?`;
  }
  return singleChoiceClozePromptSv(source);
}

function singleChoicePromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Which statement is correct about ${statementTopicEn(source)}?`;
  }
  return singleChoiceClozePromptEn(source);
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

  match = q.match(/^Vilka är Sveriges fem nationella minoriteter$/i);
  if (match) return `Sveriges fem nationella minoriteter är ${lowerFirst(answer)}`;

  match = q.match(/^Vilka (.+?) ansvarar (.+?) för$/i);
  if (match) return `${upperFirst(match[2])} ansvarar för ${lowerFirst(answer)}`;

  match = q.match(/^Vilka är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${answer}`;

  match = q.match(/^Vilka tre företag kallas (.+) i Sverige$/i);
  if (match) return `${answer} kallas ${match[1]} i Sverige`;

  match = q.match(/^Ungefär hur många (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Vilka (.+?) är viktiga i Sverige$/i);
  if (match) return `${upperFirst(answer)} är viktiga ${match[1]} i Sverige`;

  match = q.match(/^Vad betyder (?!det att\b)(.+)$/i);
  if (match) return `${upperFirst(match[1])} betyder ${lowerFirst(answer)}`;

  match = q.match(/^Vilket av följande ingår i (.+)$/i);
  if (match) return `Ett inslag i ${match[1]} är att ${lowerFirst(answer)}`;

  match = q.match(/^Hur kan (.+?) påverka (.+?) och delta i (.+)$/i);
  if (match) {
    const method = answer.replace(/^Genom att\s+/i, '');
    return `${upperFirst(match[1])} kan påverka ${match[2]} och delta i ${
      match[3]
    } genom att ${lowerFirst(method)}`;
  }

  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;

  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return `${upperFirst(answer)} när ${match[1]} påverkar ${match[2]}`;

  match = q.match(/^Hur underlättar (.+?) (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} underlättar ${match[2]} genom att ${lowerFirst(
      answer.replace(/^Genom att\s+/i, ''),
    )}`;

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

  match = q.match(/^Från vilken ålder är (.+)$/i);
  if (match) return `Från ${lowerFirst(answer)} är ${match[1]}`;

  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) return `Att ${match[1]} betyder att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad kan göra (.+?) (starkare)$/i);
  if (match) {
    return `${upperFirst(match[1])} blir ${match[2]} när ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;
  }

  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;

  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} har uppgiften att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vilken uppgift har (.+)$/i);
  if (match) return `${upperFirst(match[1])} har uppgiften ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilken rätt har (.+?) i (.+)$/i);
  if (match)
    return `I ${match[2]} har ${match[1]} rätt att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad är en uppgift för (.+)$/i);
  if (match) return `En uppgift för ${match[1]} är ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);

  match = q.match(/^Vilket påstående stämmer om (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vilken är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${lowerFirst(answer)}`;

  match = q.match(/^Hur ofta hålls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hålls ${lowerFirst(answer)}`;

  match = q.match(/^Vilka krav gäller för (.+)$/i);
  if (match) return `För ${match[1]} måste ${lowerFirst(stripLeadingMustSv(answer))}`;

  match = q.match(/^Varför röstar väljare bakom en skärm i vallokalen$/i);
  if (match)
    return `En anledning till att väljare röstar bakom en skärm i vallokalen är att ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;

  match = q.match(/^Varför bildades Förenta nationerna efter andra världskriget$/i);
  if (match)
    return `Förenta nationerna bildades efter andra världskriget för att ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;

  match = q.match(/^Varför finns lagar på arbetsmarknaden i Sverige$/i);
  if (match)
    return `Lagar på arbetsmarknaden i Sverige finns för att ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;

  match = q.match(/^Varför ökade Sveriges befolkning under 1800-talet$/i);
  if (match) return `Sveriges befolkning ökade under 1800-talet på grund av ${lowerFirst(answer)}`;

  match = q.match(/^Varför kallas (.+?) ofta (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} kallas ofta ${match[2]} eftersom ${embeddedSwedishClause(answer)}`;

  match = q.match(/^Varför (.+)$/i);
  if (match) return reasonStatementSv(answer, match[1]);

  match = q.match(/^Vad har (.+?) gemensamt$/i);
  if (match) return commonStatementSv(match[1], answer);

  match = q.match(/^Vad händer i (.+?) om (.+)$/i);
  if (match) return conditionalPartyOutcomeSv(match[1], match[2], answer);

  match = q.match(/^Vilken lista innehåller (.+)$/i);
  if (match) return `Listan med ${lowerFirst(answer)} innehåller ${match[1]}`;

  match = q.match(/^Vad säger (.+?) om (.+)$/i);
  if (match) return `${upperFirst(match[1])} säger att ${lowerLeadingSwedishClauseStart(answer)}`;

  match = q.match(/^Vad reglerar (.+)$/i);
  if (match) return `${upperFirst(match[1])} reglerar ${lowerFirst(answer)}`;

  match = q.match(/^Vad innebär (.+)$/i);
  if (match) return meaningStatementSv(match[1], answer);

  match = q.match(/^Vad menas med (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige är ${lowerFirst(answer)}`;

  match = q.match(/^Vilka myndigheter ingår i (.+)$/i);
  if (match) return `${upperFirst(answer)} ingår i ${match[1]}`;

  match = q.match(/^Vad gäller för (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Hur stor del av (.+?) (jobbar .+)$/i);
  if (match) return `${upperFirst(answer)} av ${match[1]} ${match[2]}`;

  match = q.match(/^Hur bestäms (.+) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige bestäms ${lowerFirst(answer)}`;

  match = q.match(/^Vilket stöd kan (.+?) ge (.+)$/i);
  if (match) return supportStatementSv(match[1], answer);

  match = q.match(/^Hur hjälper (.+?) till med (.+)$/i);
  if (match) {
    if (/^Att\s+/i.test(answer)) {
      return `${upperFirst(match[1])} hjälper till med ${match[2]} genom att ${lowerFirst(
        stripLeadingPurposeSv(answer),
      )}`;
    }
    return replaceLeadingSwedishSubject(match[1], answer);
  }

  match = q.match(/^Vad gör (.+?) på arbetsmarknaden$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vilken roll har (.+?) i (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vad finansierar staten inom (.+)$/i);
  if (match) return `Staten finansierar ${lowerFirst(answer)}`;

  match = q.match(/^Vad ingår i (.+)$/i);
  if (match) return `${upperFirst(match[1])} omfattar ${lowerFirst(answer)}`;

  match = q.match(/^Vilket ansvar har (.+?) för (.+)$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilken hjälp kan (.+?) få av (.+?) för att (.+)$/i);
  if (match)
    return `${upperFirst(match[2])} kan erbjuda ${lowerFirst(match[1])} ${lowerFirst(
      answer,
    )} för att ${match[3]}`;

  match = q.match(/^Vilket ansvar har (.+?) inom (.+)$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilka viktiga uppgifter har (.+?) i (.+)$/i);
  if (match) return importantRolesStatementSv(match[1], match[2], answer);

  match = q.match(/^Vilket svar ger exempel på (.+)$/i);
  if (match) return `${upperFirst(answer)} är exempel på ${match[1]}`;

  match = q.match(/^Vad förändrades genom (.+)$/i);
  if (match)
    return `Förändringen genom ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;

  match = q.match(/^När firas (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} firas ${lowerFirst(answer)}`;

  match = q.match(/^När firas (.+)$/i);
  if (match) return `${upperFirst(match[1])} firas ${lowerFirst(answer)}`;

  match = q.match(/^Vilken högtid firas (.+?) och hör ihop med (.+)$/i);
  if (match) return `${answer} firas ${match[1]} och hör ihop med ${match[2]}`;

  match = q.match(/^Vilket svar beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);

  match = q.match(/^Vad beslutade (.+?) som (.+)$/i);
  if (match) return decisionStatementSv(match[1], match[2], answer);

  match = q.match(/^Vilket år hölls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hölls ${answer}`;

  match = q.match(/^Vad blev (.+?) viktigt för$/i);
  if (match)
    return `${upperFirst(match[1])} blev viktigt för ${lowerLeadingSwedishClauseStart(answer)}`;

  match = q.match(/^Vad var (.+?) mål under (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} mål under ${match[2]} var ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vad har (.+?) förändrat$/i);
  if (match) {
    if (/^Bara\s+hur\b/i.test(answer)) {
      return `${upperFirst(match[1])} har bara förändrat ${lowerFirst(
        answer.replace(/^Bara\s+/i, ''),
      )}`;
    }
    return `${upperFirst(match[1])} har förändrat ${lowerFirst(answer)}`;
  }

  match = q.match(/^Genom vilka två organ sker (.+?) främst$/i);
  if (match) return `${upperFirst(match[1])} sker främst genom ${answer}`;

  match = q.match(/^Vilket år blev (.+?) medlem i (.+)$/i);
  if (match) return `${upperFirst(match[1])} blev medlem i ${match[2]} ${answer}`;

  match = q.match(/^Sedan vilket år är (.+) lag i Sverige$/i);
  if (match) return `${upperFirst(match[1])} är lag i Sverige sedan ${answer}`;

  match = q.match(/^Vad arbetar (.+?) för$/i);
  if (match) {
    if (/^Endast\s+/i.test(answer)) {
      return `${upperFirst(match[1])} arbetar endast för ${lowerFirst(
        answer.replace(/^Endast\s+/i, ''),
      )}`;
    }
    const object = /^Att\s+/i.test(answer) ? swedishPurposeClause(answer) : lowerFirst(answer);
    return `${upperFirst(match[1])} arbetar för ${object}`;
  }

  match = q.match(/^Vad valde (.+?) att göra (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} valde att ${lowerFirst(stripLeadingPurposeSv(answer))} ${
      match[2]
    }`;

  match = q.match(/^Vilken lag markerade (.+)$/i);
  if (match) return `${answer} markerade ${match[1]}`;

  match = q.match(/^Vilken tradition har (.+?) historiska rötter i$/i);
  if (match) return `${upperFirst(match[1])} har historiska rötter i ${lowerFirst(answer)}`;

  match = q.match(/^Vilken religion beskrivs som (.+)$/i);
  if (match) {
    const description =
      match[1].toLocaleLowerCase('sv-SE') === 'den näst största i sverige'
        ? 'den näst största religionen i Sverige'
        : match[1];
    return `${answer} beskrivs som ${description}`;
  }

  match = q.match(/^Vad är vanligt att göra på (.+?) i Sverige$/i);
  if (match) return swedishCommonToDoStatement(match[1], answer);

  match = q.match(/^Vad är vanligt att familjer gör på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} brukar familjer ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad brukar hända på (.+)$/i);
  if (match) return `På ${match[1]} brukar ${swedishHabitualPredicate(answer)}`;

  match = q.match(/^Vad handlar (.+?) mycket om i Sverige$/i);
  if (match) return `${upperFirst(match[1])} handlar mycket om ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vad är typiskt för (.+?) i Sverige$/i);
  if (match) return `Typiskt för ${match[1]} är ${lowerFirst(answer)}`;

  match = q.match(/^När infaller (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} infaller ${lowerFirst(answer)}`;

  match = q.match(/^Vad uppmärksammas på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} uppmärksammas ${lowerFirst(answer)}`;

  match = q.match(/^Vad är viktigt att komma ihåg om webben och sociala medier$/i);
  if (match) return webSocialMediaStatementSv(answer);

  match = q.match(/^Vad finns på olika platser i Sverige för (.+)$/i);
  if (match) return `På olika platser i Sverige finns ${lowerFirst(answer)} för ${match[1]}`;

  match = q.match(/^Vilka högtider är exempel på (.+)$/i);
  if (match) return `${answer} är exempel på ${match[1]}`;

  match = q.match(/^Vilka fyra folkrörelser var bland de största i Sverige under 1800-talet$/i);
  if (match) return `${answer} var bland de största folkrörelserna i Sverige under 1800-talet`;

  match = q.match(/^Vad erbjuder (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige erbjuder ${lowerFirst(answer)}`;

  match = q.match(/^Vad är ett mål med (.+)$/i);
  if (match) return `Ett mål med ${match[1]} är ${swedishPurposeClause(answer)}`;

  match = q.match(/^När byggdes (.+)$/i);
  if (match) return `${upperFirst(match[1])} byggdes ${lowerFirst(answer)}`;

  match = q.match(/^Vilka kristna kyrkor eller samfund finns i (.+)$/i);
  if (match) return `${answer} finns i ${match[1]}`;

  match = q.match(/^Vilket påstående om (.+?) stämmer$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vad skyddar (.+?) när det gäller (.+)$/i);
  if (match) return swedishProtectedReligionStatement(match[1], answer);

  match = q.match(/^Vad blev tillåtet för (.+?) år (.+)$/i);
  if (match)
    return `År ${match[2]} blev det tillåtet för ${match[1]} ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilka kristna högtider firar (.+?) även om (.+)$/i);
  if (match) return swedishChristianHolidayStatement(match[1], match[2], answer);

  match = q.match(/^Vilka religiösa ritualer är fortfarande vanliga i Sverige$/i);
  if (match) return `${answer} är fortfarande vanliga i Sverige`;

  match = q.match(/^Vad var (.+?) under (.+?) innan (.+)$/i);
  if (match) return `${upperFirst(match[1])} var ${lowerFirst(answer)} under ${match[2]}`;

  match = q.match(/^Vad fick (.+?) rätt att göra i Sverige på (.+)$/i);
  if (match) return swedishGainedRightStatement(match[1], answer, match[2]);

  match = q.match(/^Vilka riktningar inom (.+?) finns i (.+)$/i);
  if (match) return `${answer} finns i ${match[2]}`;

  match = q.match(/^Vad bidrog till (.+)$/i);
  if (match) return `${upperFirst(answer)} bidrog till ${match[1]}`;

  match = q.match(/^Vad är vanligt vid (.+)$/i);
  if (match) return `Vid ${match[1]} är det vanligt med ${lowerFirst(answer)}`;

  match = q.match(/^Vad är vanligt i många hem under (.+)$/i);
  if (match) return `Under ${match[1]} är det vanligt med ${lowerFirst(answer)} i många hem`;

  match = q.match(/^Vilken högtid avslutar (.+)$/i);
  if (match) return `${answer} avslutar ${match[1]}`;

  match = q.match(/^Vad brukar personen som är Lucia bära i ett luciatåg$/i);
  if (match) return `Personen som är Lucia brukar bära ${lowerFirst(answer)}`;

  match = q.match(/^Vad kallas gudstjänsten tidigt på morgonen den 25 december$/i);
  if (match)
    return `Gudstjänsten tidigt på morgonen den 25 december kallas ${swedishCalledAnswer(answer)}`;

  match = q.match(/^Vad är vanligt på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} är det vanligt att ${stripLeadingPurposeSv(answer)}`;

  match = q.match(/^Vad gör barn ofta med (.+?) hemma$/i);
  if (match) {
    if (/^en adventskalender$/i.test(match[1])) {
      return swedishChildrenWithAdventCalendarStatement(answer);
    }
    return `Barn ${lowerFirst(answer)} med ${match[1]} hemma`;
  }

  match = q.match(/^Vilket år blev (.+?) (en .+)$/i);
  if (match) return `${upperFirst(match[1])} blev ${match[2]} ${answer}`;

  match = q.match(/^Vad gör många på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} ${frontedManyActionSv(answer)}`;

  match = q.match(/^Vad kan hända med (.+?) när (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vad gör många med (.+?) vid (.+?) i Sverige$/i);
  if (match) return `Vid ${match[2]} ${frontedManyActionSv(answer)}`;

  match = q.match(/^Vad firar (.+?) traditionellt inom (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} firar traditionellt ${swedishTraditionalCelebrationAnswer(
      answer,
    )} inom ${match[2]}`;

  match = q.match(/^Vad brukar man bjuda på (.+?) i samband med (.+)$/i);
  if (match) return `${upperFirst(match[1])} brukar man bjuda på ${lowerFirst(answer)}`;

  match = q.match(/^Hur många landskap är Sverige indelat i$/i);
  if (match) return `Sverige är indelat i ${answer}`;

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
  if (match) return `${upperFirst(match[1])} is called ${englishCalledAnswer(answer)}`;

  match = q.match(/^What is the name of (.+)$/i);
  if (match) return `${upperFirst(match[1])} is called ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which islands are Sweden's two largest$/i);
  if (match) return `Sweden's two largest islands are ${answer}`;

  match = q.match(/^Which islands are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Which are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which groups are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Which (.+?) are (.+?) responsible for$/i);
  if (match) return `${upperFirst(match[2])} are responsible for ${lowerFirst(answer)}`;

  match = q.match(/^Which three companies are called (.+) in Sweden$/i);
  if (match) return `${answer} are called ${match[1]} in Sweden`;

  match = q.match(/^Approximately how many (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Which (.+?) are important in Sweden$/i);
  if (match) return `${upperFirst(answer)} are important ${match[1]} in Sweden`;

  match = q.match(/^What does (.+) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);

  match = q.match(/^Which of the following is part of (.+)$/i);
  if (match) return `A feature of ${match[1]} is that ${lowerFirst(answer)}`;

  match = q.match(/^How can (.+?) influence (.+?) and participate in (.+)$/i);
  if (match) {
    return `${upperFirst(match[1])} can influence ${match[2]} and participate in ${
      match[3]
    } by ${lowerFirst(stripLeadingByEn(answer))}`;
  }

  match = q.match(/^What is it called when (.+)$/i);
  if (match) return `When ${match[1]}, it is called ${lowerFirst(answer)}`;

  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) return `${upperFirst(answer)} when ${match[1]} affects ${match[2]}`;

  match = q.match(/^How does (.+?) make it easier to (.+)$/i);
  if (match) {
    const method = /^By\s+/i.test(answer)
      ? lowerFirst(stripLeadingByEn(answer))
      : englishGerundPhrase(answer);
    return `${upperFirst(match[1])} makes it easier to ${match[2]} by ${method}`;
  }

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

  match = q.match(/^From what age is (.+)$/i);
  if (match) {
    const predicate = match[1].replace(/^(.+?)\s+(criminally responsible\b.*)$/i, '$1 is $2');
    return `${upperFirst(predicate)} from ${englishAgePhrase(lowerFirst(answer))}`;
  }

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) return `That ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What does it mean to (.+)$/i);
  if (match) return `To ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What can make (.+?) (stronger)$/i);
  if (match) {
    return `${upperFirst(match[1])} becomes ${match[2]} when ${englishCivicActionClause(answer)}`;
  }

  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;

  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} has the task to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What is one task of (.+)$/i);
  if (match) return `One task of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What is one role of (.+)$/i);
  if (match) return `One role of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What right do (.+?) have in (.+)$/i);
  if (match)
    return `In ${match[2]}, ${match[1]} have the right to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);

  match = q.match(/^Which statement is correct about (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match) {
    return `The foremost task of ${lowerLeadingEnglishArticle(match[1])} is ${englishInfinitive(
      stripLeadingPurposeEn(answer),
    )}`;
  }

  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;

  match = q.match(/^Which requirements apply to (.+)$/i);
  if (match) return `To ${requirementTargetEn(match[1])}, ${lowerFirst(answer)}`;

  match = q.match(/^Why do voters vote behind a screen at the polling station$/i);
  if (match)
    return `One reason voters vote behind a screen at the polling station is that ${lowerFirst(
      stripLeadingPurposeEn(answer),
    )}`;

  match = q.match(/^Why was the United Nations created after the Second World War$/i);
  if (match)
    return `The United Nations was created after the Second World War to ${lowerFirst(
      stripLeadingPurposeEn(answer),
    )}`;

  match = q.match(/^Why does Sweden have labour-market laws$/i);
  if (match) return `Sweden has labour-market laws to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Why did Sweden’s population grow during the 19th century$/i);
  if (match)
    return `Sweden’s population grew during the 19th century because of ${lowerFirst(answer)}`;

  match = q.match(/^Why is (.+?) often called (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} is often called ${match[2]} because ${embeddedEnglishClause(
      answer,
    )}`;

  match = q.match(/^Why (.+)$/i);
  if (match) return reasonStatementEn(answer, match[1]);

  match = q.match(/^What do (.+?) have in common$/i);
  if (match) return commonStatementEn(match[1], answer);

  match = q.match(/^What happens in (.+?) if (.+)$/i);
  if (match) return conditionalPartyOutcomeEn(match[1], match[2], answer);

  match = q.match(/^Which list contains (.+)$/i);
  if (match) return `The list with ${lowerLeadingEnglishArticle(answer)} contains ${match[1]}`;

  match = q.match(/^What does (.+?) say about (.+)$/i);
  if (match) return `${upperFirst(match[1])} says that ${lowerLeadingEnglishClauseStart(answer)}`;

  match = q.match(/^What does (.+?) regulate$/i);
  if (match) return `${upperFirst(match[1])} regulates ${lowerFirst(answer)}`;

  match = q.match(/^What does (.+?) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);

  match = q.match(/^What do (.+?) mean$/i);
  if (match) return `${upperFirst(match[1])} mean ${stripLeadingThatEn(answer)}`;

  match = q.match(/^What is meant by (.+?) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} in Sweden means ${lowerFirst(answer)}`;

  match = q.match(/^Which authorities are part of (.+)$/i);
  if (match) return `${upperFirst(answer)} are part of ${match[1]}`;

  match = q.match(/^What applies to (.+)$/i);
  if (match) return appliesStatementEn(match[1], answer);

  match = q.match(/^What share of (.+?) works (.+)$/i);
  if (match) return `${upperFirst(answer)} of ${match[1]} works ${match[2]}`;

  match = q.match(/^How are (.+) set in Sweden$/i);
  if (match) return `${upperFirst(match[1])} in Sweden are set ${lowerFirst(answer)}`;

  match = q.match(/^What support can (.+?) provide to (.+)$/i);
  if (match) return supportStatementEn(match[1], answer);

  match = q.match(/^How does (.+?) help with (.+)$/i);
  if (match) {
    if (/^To\s+/i.test(answer)) {
      return `${upperFirst(match[1])} helps with ${match[2]} by ${englishGerundPhrase(answer)}`;
    }
    return replaceLeadingEnglishSubject(match[1], answer);
  }

  match = q.match(/^What do (.+?) do in the labour market$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What role do (.+?) have in (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What does the state finance within (.+)$/i);
  if (match) return `The state finances ${lowerFirst(answer)}`;

  match = q.match(/^What is included in (.+)$/i);
  if (match) return `${upperFirst(match[1])} includes ${lowerFirst(answer)}`;

  match = q.match(/^What responsibility does (.+?) have for (.+)$/i);
  if (match) return `${upperFirst(match[1])} is responsible for ${englishGerundPhrase(answer)}`;

  match = q.match(/^What help can (.+?) receive from (.+?) to (.+)$/i);
  if (match)
    return `${upperFirst(match[2])} can offer ${lowerFirst(match[1])} ${lowerFirst(
      answer,
    )} to ${match[3]}`;

  match = q.match(/^What responsibility do (.+?) have within (.+)$/i);
  if (match) return `${upperFirst(match[1])} are responsible for ${englishGerundPhrase(answer)}`;

  match = q.match(/^What important roles do (.+?) play in (.+)$/i);
  if (match) return importantRolesStatementEn(match[1], match[2], answer);

  match = q.match(/^Which answer gives examples of (.+)$/i);
  if (match) return `${upperFirst(answer)} are examples of ${match[1]}`;

  match = q.match(/^What changed through (.+)$/i);
  if (match) return `The change through ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^When is (.+?) (?:celebrated|observed) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} is observed ${lowerFirst(answer)}`;

  match = q.match(/^When are (.+?) celebrated$/i);
  if (match) return `${upperFirst(match[1])} are observed ${lowerFirst(answer)}`;

  match = q.match(/^Which holiday is celebrated (.+?) and is connected with (.+)$/i);
  if (match) return `${answer} is celebrated ${match[1]} and is connected with ${match[2]}`;

  match = q.match(/^Which answer describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);

  match = q.match(/^What did (.+?) decide as (.+)$/i);
  if (match) return decisionStatementEn(match[1], match[2], answer);

  match = q.match(/^In which year was (.+)$/i);
  if (match) return `${upperFirst(match[1])} was in ${answer}`;

  match = q.match(/^What did (.+?) become important for$/i);
  if (match)
    return `${upperFirst(match[1])} became important for ${lowerLeadingEnglishArticle(
      answer,
    ).replace(/^Cooperation\b/, 'cooperation')}`;

  match = q.match(/^What was (.+?) important for$/i);
  if (match)
    return `${upperFirst(match[1])} was important for ${lowerLeadingEnglishArticle(answer).replace(
      /^Cooperation\b/,
      'cooperation',
    )}`;

  match = q.match(/^What was the goal of (.+?) during (.+)$/i);
  if (match)
    return `The goal of ${match[1]} during ${match[2]} was to ${lowerFirst(
      stripLeadingPurposeEn(answer),
    )}`;

  match = q.match(/^What has (.+?) changed$/i);
  if (match) {
    if (/^Only\s+how\b/i.test(answer)) {
      return `${upperFirst(match[1])} has only changed ${lowerFirst(
        answer.replace(/^Only\s+/i, ''),
      )}`;
    }
    return `${upperFirst(match[1])} has changed ${lowerFirst(answer)}`;
  }

  match = q.match(/^Through which two bodies does (.+?) mainly take place$/i);
  if (match)
    return `${upperFirst(match[1])} mainly takes place through ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^In what year did (.+?) become a member of (.+)$/i);
  if (match) return `${upperFirst(match[1])} became a member of ${match[2]} in ${answer}`;

  match = q.match(/^Since what year has (.+) been law in Sweden$/i);
  if (match) return `${upperFirst(match[1])} has been law in Sweden since ${answer}`;

  match = q.match(/^What does (.+?) work to do$/i);
  if (match) return `${upperFirst(match[1])} works to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What does (.+?) promote$/i);
  if (match) {
    if (/^Only\s+/i.test(answer)) {
      return `${upperFirst(match[1])} promotes only ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} promotes ${lowerFirst(answer)}`;
  }

  match = q.match(/^What does (.+?) work for$/i);
  if (match) {
    if (/^Only\s+/i.test(answer)) {
      return `${upperFirst(match[1])} works only for ${lowerFirst(
        answer.replace(/^Only\s+/i, ''),
      )}`;
    }
    return `${upperFirst(match[1])} works for ${lowerFirst(answer)}`;
  }

  match = q.match(/^What did (.+?) choose to do (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} chose to ${lowerFirst(stripLeadingPurposeEn(answer))} ${
      match[2]
    }`;

  match = q.match(/^Which law marked (.+)$/i);
  if (match) return `${answer} marked ${match[1]}`;

  match = q.match(/^Which tradition does (.+?) have historical roots in$/i);
  if (match) return `${upperFirst(match[1])} has historical roots in ${lowerFirst(answer)}`;

  match = q.match(/^Which religion is described as (.+)$/i);
  if (match) {
    const description =
      match[1].toLowerCase() === 'the second largest in sweden'
        ? 'the second-largest religion in Sweden'
        : match[1];
    return `${answer} is described as ${description}`;
  }

  match = q.match(/^What is common to do on (.+?) in Sweden$/i);
  if (match) return englishCommonToDoStatement(match[1], answer);

  match = q.match(/^How is (.+?) commonly (celebrated|observed) in Sweden$/i);
  if (match)
    return `${match[1]} is commonly ${match[2].toLowerCase()} ${englishCommonCelebrationMode(
      answer,
    )}`;

  match = q.match(/^What do families commonly do on (.+) in Sweden$/i);
  if (match)
    return `On ${stripTrailingComma(match[1])}, families commonly ${lowerFirst(
      stripLeadingPurposeEn(answer),
    )}`;

  match = q.match(/^What usually happens on (.+)$/i);
  if (match) return `On ${match[1]}, ${lowerFirst(answer)}`;

  match = q.match(/^What is the (.+?) largely about in Sweden$/i);
  if (match) return `The ${match[1]} is largely about ${englishGerundPhrase(answer)}`;

  match = q.match(/^What is typical of (.+) in Sweden$/i);
  if (match) return `${upperFirst(answer)} are typical of ${stripTrailingComma(match[1])}`;

  match = q.match(/^When does (.+?) occur in Sweden$/i);
  if (match) return `${upperFirst(match[1])} occurs ${englishOccurrencePhrase(answer)}`;

  match = q.match(/^What is marked on (.+?) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} marks ${lowerFirst(answer)}`;

  match = q.match(/^What is important to remember about the web and social media$/i);
  if (match) return webSocialMediaStatementEn(answer);

  match = q.match(/^What exists in different places in Sweden for (.+)$/i);
  if (match)
    return `In different places in Sweden, there are ${lowerEnglishNounPhrase(answer)} for ${
      match[1]
    }`;

  match = q.match(/^Which holidays are examples of (.+)$/i);
  if (match) return `${answer} are examples of ${match[1]}`;

  match = q.match(
    /^Which four popular movements were among the largest in Sweden during the 19th century$/i,
  );
  if (match)
    return `${answer} were among the largest popular movements in Sweden during the 19th century`;

  match = q.match(/^What do (.+?) in Sweden offer$/i);
  if (match) return `${upperFirst(match[1])} in Sweden offer ${lowerFirst(answer)}`;

  match = q.match(/^What is one goal of (.+)$/i);
  if (match) return `One goal of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^When were (.+?) built$/i);
  if (match) return `${upperFirst(match[1])} were built ${lowerFirst(answer)}`;

  match = q.match(/^Which Christian churches or communities exist in (.+)$/i);
  if (match) return `${answer} exist in ${match[1]}`;

  match = q.match(/^Which statement about (.+?) is correct$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What does (.+?) protect regarding (.+)$/i);
  if (match) return englishProtectedReligionStatement(match[1], answer);

  match = q.match(/^What became permitted for (.+?) in (.+)$/i);
  if (match)
    return `In ${match[2]}, ${match[1]} were permitted to ${stripLeadingPurposeEn(answer)}`;

  match = q.match(/^Which Christian holidays do (.+?) celebrate even if (.+)$/i);
  if (match) return englishChristianHolidayStatement(match[1], match[2], answer);

  match = q.match(/^Which religious rituals are still common in Sweden$/i);
  if (match) return `${answer} are still common in Sweden`;

  match = q.match(/^What was (.+?) during (.+?) before (.+)$/i);
  if (match) return `${upperFirst(match[1])} was ${lowerFirst(answer)} during ${match[2]}`;

  match = q.match(/^What did (.+?) gain the right to do in Sweden in (.+)$/i);
  if (match) return englishGainedRightStatement(match[1], answer, match[2]);

  match = q.match(/^Which branches of (.+?) are found in (.+)$/i);
  if (match) return `${answer} are found in ${match[2]}`;

  match = q.match(/^What contributed to (.+)$/i);
  if (match) return `${upperFirst(answer)} contributed to ${match[1]}`;

  match = q.match(/^What is common during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common during ${match[1]}`;

  match = q.match(/^What is common in many homes during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common in many homes during ${match[1]}`;

  match = q.match(/^Which holiday ends (.+)$/i);
  if (match) return `${answer} ends ${match[1]}`;

  match = q.match(/^What does the person who is Lucia usually wear in a Lucia procession$/i);
  if (match) return `The person who is Lucia usually wears ${lowerFirst(answer)}`;

  match = q.match(/^What is the church service early on the morning of 25 December called$/i);
  if (match)
    return `The church service early on the morning of 25 December is called ${englishCalledAnswer(
      answer,
    )}`;

  match = q.match(/^What is common on (.+?) in Sweden$/i);
  if (match) return `On ${match[1]}, it is common to ${englishCommonActivity(answer)}`;

  match = q.match(/^What do children often do with (.+?) at home$/i);
  if (match) {
    if (/^an Advent calendar$/i.test(match[1])) {
      return englishChildrenWithAdventCalendarStatement(answer);
    }
    return `Children often ${lowerFirst(stripLeadingPurposeEn(answer))} with ${match[1]} at home`;
  }

  match = q.match(/^In which year did (.+?) become (a .+)$/i);
  if (match) return `${upperFirst(match[1])} became ${match[2]} in ${answer}`;

  match = q.match(/^What do many people do on (.+?) in Sweden$/i);
  if (match) return `On ${match[1]}, ${manyPeopleActionEn(answer)}`;

  match = q.match(/^What can happen to (.+?) when (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What do many people do with (.+?) at (.+?) in Sweden$/i);
  if (match) return `At ${match[2]}, ${manyPeopleActionEn(answer)}`;

  match = q.match(/^What does (.+?) traditionally celebrate in (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} traditionally celebrates ${englishTraditionalCelebrationAnswer(
      answer,
    )} in ${match[2]}`;

  match = q.match(/^What is commonly served on (.+?) in connection with (.+)$/i);
  if (match) return `On ${match[1]}, people commonly serve ${lowerFirst(answer)}`;

  match = q.match(/^How many historical provinces is Sweden divided into$/i);
  if (match) return `Sweden is divided into ${answer}`;

  match = q.match(/^What minimum share of votes must a party receive to enter the Riksdag$/i);
  if (match) return `A party must receive ${lowerFirst(answer)} to enter the Riksdag`;

  return upperFirst(stripLeadingPurposeEn(answer));
}

function buildSingleChoiceVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const sourceIsTrueFalse = isTrueFalseSource(source);
  return withSharedFields(
    source,
    id,
    'single_choice',
    singleChoicePromptSv(source),
    singleChoicePromptEn(source),
    singleChoiceOptions(source),
    sourceIsTrueFalse ? 'true-statement' : source.correctOptionId,
    ['published-variant', 'section-practice'],
    sourceIsTrueFalse ? trueFalseSingleChoiceExplanationSv(source) : source.explanationSv,
    sourceIsTrueFalse ? trueFalseSingleChoiceExplanationEn(source) : source.explanationEn,
  );
}

function buildTrueStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = correctOption(source);
  return withSharedFields(
    source,
    id,
    'true_false',
    ensureSentence(generatedTrueFalseStatementSv(source, option, true)),
    ensureSentence(generatedTrueFalseStatementEn(source, option, true)),
    trueFalseOptions(),
    'true',
    ['published-variant', 'true-false'],
    trueStatementExplanationSv(source),
    trueStatementExplanationEn(source),
  );
}

function buildFalseStatementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const option = wrongOption(source);
  return withSharedFields(
    source,
    id,
    'true_false',
    ensureSentence(generatedTrueFalseStatementSv(source, option, false)),
    ensureSentence(generatedTrueFalseStatementEn(source, option, false)),
    trueFalseOptions(),
    'false',
    ['published-variant', 'false-statement'],
    falseStatementExplanationSv(source),
    falseStatementExplanationEn(source),
  );
}

function buildAnswerJudgementVariant(source: PracticeQuestion, id: string): PracticeQuestion {
  const correct = correctOption(source);
  const sourceIsTrueFalse = isTrueFalseSource(source);
  const options = sourceIsTrueFalse
    ? trueFalseStatementOptions(source)
    : singleChoiceOptions(source);

  return withSharedFields(
    source,
    id,
    'single_choice',
    judgementPromptSv(source),
    judgementPromptEn(source),
    options,
    sourceIsTrueFalse ? 'true-statement' : correct.id,
    ['published-variant', 'judgement'],
    sourceIsTrueFalse ? trueFalseSingleChoiceExplanationSv(source) : source.explanationSv,
    sourceIsTrueFalse ? trueFalseSingleChoiceExplanationEn(source) : source.explanationEn,
  );
}

export function derivePublishedQuestionVariants(
  source: PracticeQuestion,
  startId: number,
): PracticeQuestion[] {
  const published = publishedCopy(source);
  return [
    buildSingleChoiceVariant(published, nextId(startId, 0)),
    buildTrueStatementVariant(published, nextId(startId, 1)),
    buildFalseStatementVariant(published, nextId(startId, 2)),
    buildAnswerJudgementVariant(published, nextId(startId, 3)),
  ];
}

export function derivePublishedQuestions(
  sourceQuestions: PracticeQuestion[],
  startId = 101,
): PracticeQuestion[] {
  return sourceQuestions.flatMap((source, index) =>
    derivePublishedQuestionVariants(source, startId + index * 4),
  );
}

export function publishQuestions(sourceQuestions: PracticeQuestion[]): PracticeQuestion[] {
  return sourceQuestions.map(publishedCopy);
}
