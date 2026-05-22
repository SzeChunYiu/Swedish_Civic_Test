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
    ...(source.supplementalSources ? { supplementalSources: source.supplementalSources } : {}),
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

function ensureQuestion(value: string): string {
  const trimmed = value.trim();
  if (trimmed.endsWith('?')) return trimmed;
  if (trimmed.endsWith('...')) return `${trimmed}?`;
  return `${stripFinalPunctuation(trimmed)}?`;
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
    /^(Havet|Nästan|Ungefär|Ett|En|Den|Det|Man|När|År|Oppositionen|Politikerna|Politiker|All|Samarbetet)\b/,
    (match) => match.toLowerCase(),
  );
}

function lowerLeadingEnglishClauseStart(value: string): string {
  return value.replace(/^(The|In|A|An|At|On|Almost|Politicians|All|It)\b/, (match) =>
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

function englishResponsibilityPredicate(value: string): string {
  const phrase = lowerFirst(stripLeadingPurposeEn(value).trim());
  if (/^be responsible for\b/i.test(phrase)) {
    return phrase.replace(/^be responsible for\s+/i, '');
  }
  if (/^judge\b/i.test(phrase)) return phrase.replace(/^judge\b/i, 'judging');
  if (/^decide\b/i.test(phrase)) return phrase.replace(/^decide\b/i, 'deciding');
  if (/^appoint\b/i.test(phrase)) return phrase.replace(/^appoint\b/i, 'appointing');
  return englishInfinitive(phrase);
}

function englishAgePhrase(value: string): string {
  return value.replace(/^(\d+)\s+years$/i, 'age $1');
}

function answerClozeCandidates(answer: string, language: 'sv' | 'en'): string[] {
  const stripped = stripFinalPunctuation(answer);
  const candidates = [
    stripped,
    lowerFirst(stripped),
    language === 'sv' ? stripLeadingPurposeSv(stripped) : stripLeadingPurposeEn(stripped),
  ];

  if (language === 'en') candidates.push(stripLeadingThatEn(stripped));

  const ageMatch =
    language === 'sv' ? stripped.match(/^(\d+)\s+år$/i) : stripped.match(/^(\d+)\s+years$/i);
  if (ageMatch) {
    candidates.push(language === 'sv' ? `${ageMatch[1]} års ålder` : `age ${ageMatch[1]}`);
  }

  return [...new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
}

function replaceAnswerWithCloze(
  statement: string,
  answer: string,
  language: 'sv' | 'en',
): string | null {
  const normalizedStatement = stripFinalPunctuation(statement);

  for (const candidate of answerClozeCandidates(answer, language)) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'iu');
    if (!pattern.test(normalizedStatement)) continue;

    const cloze = normalizedStatement
      .replace(pattern, (_match, prefix: string) => `${prefix}...`)
      .replace(/\s+\.\.\./g, ' ...')
      .replace(/\.\.\.\s+/g, '... ')
      .trim();

    const context = cloze
      .replace(/\.\.\./g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '')
      .trim();
    return cloze.includes('...') && context.length >= 2 ? cloze : null;
  }

  return null;
}

function stripLeadingPurposeSv(value: string): string {
  return value.replace(/^för att\s+/i, '').replace(/^att\s+/i, '');
}

function stripLeadingMethodSv(value: string): string {
  return stripLeadingPurposeSv(value).replace(/^genom att\s+/i, '');
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

function swedishTaskProposition(source: PracticeQuestion, subject: string, answer: string): string {
  const normalizedSubject = upperFirst(subject);
  const phrase = stripLeadingPurposeSv(answer).trim();

  if (source.id === 'q022') {
    if (/^besluta om lagar och hur statens pengar ska användas$/i.test(phrase)) {
      return `${normalizedSubject} beslutar om lagar och hur statens pengar ska användas`;
    }
    if (/^sköta regionernas kollektivtrafik$/i.test(phrase)) {
      return `${normalizedSubject} sköter regionernas kollektivtrafik`;
    }
  }

  if (source.id === 'q059') {
    if (
      /^representera den samiska befolkningen i frågor om språk, kultur och identitet$/i.test(
        phrase,
      )
    ) {
      return `${normalizedSubject} representerar den samiska befolkningen i frågor om språk, kultur och identitet`;
    }
    if (/^besluta statens budget$/i.test(phrase)) {
      return `${normalizedSubject} beslutar statens budget`;
    }
  }

  return `${normalizedSubject} har uppgiften att ${lowerFirst(phrase)}`;
}

function englishTaskProposition(source: PracticeQuestion, subject: string, answer: string): string {
  const normalizedSubject = upperFirst(subject);
  const phrase = stripLeadingPurposeEn(answer).trim();

  if (source.id === 'q022') {
    if (/^decide laws and how the state's money should be used$/i.test(phrase)) {
      return `${normalizedSubject} passes laws and decides how state funds are used`;
    }
    if (/^manage regional public transport$/i.test(phrase)) {
      return `${normalizedSubject} manages regional public transport`;
    }
  }

  if (source.id === 'q059') {
    if (
      /^represent the Sami population on questions of language, culture, and identity$/i.test(
        phrase,
      )
    ) {
      return `${normalizedSubject} represents the Sami population on questions of language, culture, and identity`;
    }
    if (/^decide the state budget$/i.test(phrase)) {
      return `${normalizedSubject} decides the state budget`;
    }
  }

  return `${normalizedSubject} has the task to ${lowerFirst(phrase)}`;
}

function swedishIncomeMethod(answer: string): string {
  const phrase = lowerFirst(answer.trim());
  if (/^de säljer reklamplats eller tar betalt för en särskild kanal$/i.test(phrase)) {
    return 'genom att sälja reklamplats eller ta betalt för en särskild kanal';
  }
  if (/^genom\b/i.test(phrase)) return phrase;
  return `genom ${phrase}`;
}

function englishIncomeMethod(answer: string): string {
  const phrase = answer.trim();
  if (/^they sell advertising space or charge for a specific channel$/i.test(phrase)) {
    return 'by selling advertising space or charging for a specific channel';
  }
  if (/^(?:through|by)\b/i.test(phrase)) return lowerFirst(phrase);
  return `through ${lowerFirst(phrase)}`;
}

function swedishPartyPoliticsStatement(answer: string): string {
  const phrase = lowerFirst(answer.trim());
  if (/^bara rösta om personen redan sitter i riksdagen$/i.test(phrase)) {
    return 'En person kan bara påverka partipolitik genom att rösta om personen redan sitter i riksdagen';
  }
  return `En person kan påverka partipolitik genom att ${stripLeadingPurposeSv(phrase)}`;
}

function englishPartyPoliticsStatement(answer: string): string {
  const phrase = answer.trim();
  if (
    /^become a member of a political party or start a new party together with others$/i.test(phrase)
  ) {
    return 'A person can influence party politics by becoming a member of a political party or starting a new party together with others';
  }
  if (/^only vote if the person already sits in the Riksdag$/i.test(phrase)) {
    return 'A person can influence party politics only by voting if they already sit in the Riksdag';
  }
  return `A person can influence party politics by ${englishGerundPhrase(phrase)}`;
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

function swedishLowVoterTurnoutStatement(answer: string): string {
  const phrase = lowerFirst(stripLeadingPurposeSv(answer).trim());
  if (/^människor kan få mindre möjlighet att påverka politiska beslut$/i.test(phrase)) {
    return 'Ett lågt valdeltagande kan minska människors möjlighet att påverka politiska beslut';
  }
  if (/^alla väljare får två röster var i nästa val$/i.test(phrase)) {
    return 'Ett lågt valdeltagande ger alla väljare två röster var i nästa val';
  }
  return `Ett lågt valdeltagande kan innebära att ${phrase}`;
}

function englishLowVoterTurnoutStatement(answer: string): string {
  const phrase = lowerFirst(stripLeadingPurposeEn(answer).trim());
  if (/^people may have fewer opportunities to influence political decisions$/i.test(phrase)) {
    return "Low voter turnout can reduce people's opportunities to influence political decisions";
  }
  if (/^all voters get two votes each in the next election$/i.test(phrase)) {
    return 'Low voter turnout gives all voters two votes each in the next election';
  }
  return `Low voter turnout can mean that ${phrase}`;
}

function englishCoordinatedGerundPhrase(value: string): string {
  return englishGerundPhrase(value)
    .replace(/\band scare\b/i, 'and scaring')
    .replace(/\band stop\b/i, 'and stopping')
    .replace(/\band ban\b/i, 'and banning')
    .replace(/\band make\b/i, 'and making')
    .replace(/\band create\b/i, 'and creating');
}

function swedishAffectStatement(subject: string, target: string, answer: string): string {
  const phrase = stripFinalPunctuation(answer);
  const pronounMatch = phrase.match(/^det kan\s+(.+)$/i);
  if (pronounMatch) {
    return `${upperFirst(subject)} kan påverka ${target} genom att ${lowerLeadingSwedishClauseStart(
      stripLeadingMethodSv(pronounMatch[1]),
    )}`;
  }

  if (/^(?:genom att|att)\s+/i.test(phrase)) {
    return `${upperFirst(subject)} kan påverka ${target} genom att ${lowerLeadingSwedishClauseStart(
      stripLeadingMethodSv(phrase),
    )}`;
  }

  if (/(^|[\s,])(?:kan|ska|måste|gör|får|blir|har)(?=$|[\s,.?!])/i.test(phrase)) {
    return upperFirst(phrase);
  }

  return `${upperFirst(subject)} kan påverka ${target} genom att ${lowerLeadingSwedishClauseStart(
    stripLeadingMethodSv(phrase),
  )}`;
}

function englishAffectStatement(subject: string, target: string, answer: string): string {
  const phrase = stripFinalPunctuation(answer);
  const pronounMatch = phrase.match(/^it can\s+(.+)$/i);
  if (pronounMatch) {
    return `${upperFirst(subject)} can affect ${target} by ${englishCoordinatedGerundPhrase(
      pronounMatch[1],
    )}`;
  }

  if (/^(?:by|to)\s+/i.test(phrase)) {
    return `${upperFirst(subject)} can affect ${target} by ${englishCoordinatedGerundPhrase(
      phrase,
    )}`;
  }

  if (
    /(^|[\s,])(?:can|could|should|must|will|would|may|might|is|are|has|have)(?=$|[\s,.?!])/i.test(
      phrase,
    )
  ) {
    return upperFirst(phrase);
  }

  return `${upperFirst(subject)} can affect ${target} by ${englishCoordinatedGerundPhrase(phrase)}`;
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

function swedishMentionedExample(answer: string, category: string): string {
  const built = answer.trim().match(/^Att\s+(.+?)\s+byggdes\s+(.+)$/i);
  if (built) return `Byggandet av ${built[1]} ${built[2]} nämns som exempel på ${category}`;
  return `${answer} nämns som exempel på ${category}`;
}

function englishMentionedExample(answer: string, category: string): string {
  const built = answer.trim().match(/^That\s+(.+?)\s+were built\s+(.+)$/i);
  if (built) {
    return `The building of ${built[1]} ${built[2]} is mentioned as an example of ${category}`;
  }
  return `${answer} ${englishSubjectVerb(answer, 'is', 'are')} mentioned as ${englishSubjectVerb(
    answer,
    'an example',
    'examples',
  )} of ${category}`;
}

function swedishPurposeClause(value: string): string {
  return `att ${lowerLeadingSwedishClauseStart(stripLeadingPurposeSv(value))}`;
}

function swedishResponsibilityObject(value: string): string {
  const stripped = stripLeadingPurposeSv(value);
  if (/^(?:skicka|bestämma|välja)\b/i.test(stripped)) {
    return swedishPurposeClause(value);
  }
  return lowerFirst(stripped);
}

function englishResponsibilityObject(value: string): string {
  const stripped = stripLeadingPurposeEn(value).trim();
  if (/^\w+ing\b/i.test(stripped) || stripped.includes(',')) {
    return lowerFirst(stripped);
  }
  return englishGerundPhrase(value);
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

function swedishProtectionStatement(subject: string, answer: string): string {
  const trimmed = answer.trim();
  const stateRight = trimmed.match(/^Rätten för staten att (.+)$/i);
  if (stateRight) {
    return `${upperFirst(subject)} ger staten rätt att ${lowerLeadingSwedishClauseStart(
      stateRight[1],
    )}`;
  }
  return `${upperFirst(subject)} skyddar ${lowerFirst(answer)}`;
}

function englishProtectionStatement(subject: string, answer: string): string {
  const trimmed = answer
    .trim()
    .replace(/\bpreview all private letters\b/i, 'pre-screen all private letters');
  const stateRight = trimmed.match(/^The right of the state to (.+)$/i);
  if (stateRight) {
    return `${upperFirst(subject)} gives the state the right to ${lowerFirst(stateRight[1])}`;
  }
  return `${upperFirst(subject)} protects ${lowerFirst(trimmed)}`;
}

function swedishEveryoneRightStatement(subject: string, answer: string): string {
  if (/^Att\s+/i.test(answer)) {
    return `${upperFirst(subject)} ger alla rätt att ${lowerLeadingSwedishClauseStart(
      stripLeadingPurposeSv(answer),
    )}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}

function englishEveryoneRightStatement(subject: string, answer: string): string {
  if (/^To\s+/i.test(answer)) {
    return `${upperFirst(subject)} gives everyone the right to ${lowerFirst(
      stripLeadingPurposeEn(answer),
    )}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function swedishAccusedTrialRightStatement(answer: string): string {
  if (/^Rätt\s+/i.test(answer)) {
    return `Under en rättegång har en åtalad person ${lowerFirst(answer)}`;
  }
  return replaceLeadingSwedishSubject('den åtalade', answer);
}

function englishAccusedTrialRightStatement(answer: string): string {
  if (/^The right to\s+/i.test(answer)) {
    return `During a trial, the accused person has the right to ${lowerFirst(
      answer.replace(/^The right to\s+/i, ''),
    )}`;
  }
  return replaceLeadingEnglishSubject('the accused person', answer);
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
    /^(can|could|should|must|will|would|may|might)\s+(.+?)\s+(be|have|do|make|create|spread|replace|give|become|affect)\b(.*)$/i,
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
    return `En anledning är att ${lowerLeadingSwedishClauseStart(stripped)}`;
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
    return `One reason is that ${lowerLeadingEnglishClauseStart(stripped)}`;
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
    .replace(/^domstolarna avgör bara\s+/i, 'domstolarna bara avgör ')
    .replace(
      /^(.+?)\s+(måste|behöver|ska|kan|får)\s+(inte|alltid)\s+/i,
      (_match, subject, modal, adverb) => `${subject} ${adverb.toLowerCase()} ${modal} `,
    );
}

function embeddedEnglishClause(value: string): string {
  return lowerLeadingEnglishClauseStart(stripLeadingPurposeEn(value));
}

function replaceLeadingSwedishSubject(subject: string, value: string): string {
  if (/^att köpa sex i Sverige$/i.test(subject.trim())) {
    if (
      /^Det är olagligt att köpa sex, men personen som säljer straffas inte$/i.test(value.trim())
    ) {
      return 'Att köpa sex är olagligt i Sverige, men personen som säljer sex straffas inte';
    }
    if (/^Det är alltid lagligt att köpa sex$/i.test(value.trim())) {
      return 'Att köpa sex är alltid lagligt i Sverige';
    }
  }
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
  if (/^buying sex in Sweden$/i.test(subject.trim())) {
    if (
      /^It is illegal to buy sex, but the person who sells it is not punished$/i.test(value.trim())
    ) {
      return 'In Sweden, buying sex is illegal, but the person who sells sex is not punished';
    }
    if (/^It is always legal to buy sex$/i.test(value.trim())) {
      return 'In Sweden, buying sex is always legal';
    }
  }
  if (/^marriage between people of the same sex in Sweden$/i.test(subject.trim())) {
    if (/^It is permitted to marry a person of the same sex$/i.test(value.trim())) {
      return 'In Sweden, marriage between people of the same sex is permitted';
    }
    if (/^It is prohibited to marry a person of the same sex$/i.test(value.trim())) {
      return 'In Sweden, marriage between people of the same sex is prohibited';
    }
  }
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
  const civilDefenceStatement = civilDefenceContextStatementSv(subject, answer);
  if (civilDefenceStatement) return civilDefenceStatement;

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
  const civilDefenceStatement = civilDefenceContextStatementEn(subject, answer);
  if (civilDefenceStatement) return civilDefenceStatement;

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

function civilDefenceContextStatementSv(subject: string, answer: string): string | null {
  if (!/^det civila försvaret vid krig eller kris$/i.test(subject.trim())) return null;

  const normalizedAnswer = stripFinalPunctuation(answer.trim());
  if (
    /^Viktiga verksamheter som skola, arbete och hälso- och sjukvård kan fortsätta fungera$/i.test(
      normalizedAnswer,
    )
  ) {
    return 'Vid krig eller kris hjälper det civila försvaret viktiga verksamheter som skola, arbete och hälso- och sjukvård att fortsätta fungera';
  }
  if (/^Politiska val ersätts med militära beslut$/i.test(normalizedAnswer)) {
    return 'Vid krig eller kris ersätter det civila försvaret politiska val med militära beslut';
  }
  if (/^Bara Försvarsmakten ansvarar för samhällets motståndskraft$/i.test(normalizedAnswer)) {
    return 'Vid krig eller kris gör det civila försvaret bara Försvarsmakten ansvarig för samhällets motståndskraft';
  }
  if (/^EU bestämmer varje skolas dagliga schema$/i.test(normalizedAnswer)) {
    return 'Vid krig eller kris låter det civila försvaret EU bestämma varje skolas dagliga schema';
  }

  return `Vid krig eller kris innebär det civila försvaret att ${lowerLeadingSwedishClauseStart(
    normalizedAnswer,
  )}`;
}

function civilDefenceContextStatementEn(subject: string, answer: string): string | null {
  if (!/^civil defence during war or crisis$/i.test(subject.trim())) return null;

  const normalizedAnswer = stripFinalPunctuation(answer.trim());
  if (
    /^Important activities such as school, work, and health care can continue to function$/i.test(
      normalizedAnswer,
    )
  ) {
    return 'During war or crisis, civil defence helps important services such as school, work, and health care continue';
  }
  if (/^Political elections are replaced with military decisions$/i.test(normalizedAnswer)) {
    return 'During war or crisis, civil defence replaces political elections with military decisions';
  }
  if (
    /^Only the Swedish Armed Forces are responsible for society’s resilience$/i.test(
      normalizedAnswer,
    )
  ) {
    return 'During war or crisis, civil defence makes only the Swedish Armed Forces responsible for society’s resilience';
  }
  if (/^The EU decides every school’s daily timetable$/i.test(normalizedAnswer)) {
    return 'During war or crisis, civil defence lets the EU decide every school’s daily timetable';
  }

  return `During war or crisis, civil defence means ${lowerLeadingEnglishClauseStart(
    normalizedAnswer,
  )}`;
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
  const policyGoalStatement = policyGoalStatementEn(subject, answer);
  if (policyGoalStatement) return policyGoalStatement;
  const subjectStatement = replaceLeadingEnglishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}

function policyGoalStatementEn(subject: string, answer: string): string | null {
  const subjectMatch = subject.trim().match(/^the goal of (.+?\bpolicy)$/i);
  if (!subjectMatch) return null;

  const policyName = upperFirst(subjectMatch[1]);
  const normalizedAnswer = stripLeadingThatEn(answer).trim();
  const shouldMatch = normalizedAnswer.match(/^(.+?) should (.+)$/i);
  if (shouldMatch) {
    const aimClause = `${lowerFirst(shouldMatch[1])} to ${shouldMatch[2]}`.replace(
      /\bthe same rights and duties and equal power\b/i,
      'the same rights, duties, and power',
    );
    return `${policyName} aims for ${aimClause}`;
  }

  const onlyAboutMatch = normalizedAnswer.match(/^(.+?) is only about (.+)$/i);
  if (onlyAboutMatch) {
    return `${policyName} is only about ${onlyAboutMatch[2]}`;
  }

  return `${policyName} aims for ${lowerFirst(normalizedAnswer)}`;
}

function appliesStatementEn(subject: string, answer: string): string {
  if (/^buying sex in Sweden$/i.test(subject.trim())) {
    if (
      /^It is illegal to buy sex, but the person who sells it is not punished$/i.test(answer.trim())
    ) {
      return 'Buying sex is illegal in Sweden, but the person who sells sex is not punished';
    }
    if (/^It is always legal to buy sex$/i.test(answer.trim())) {
      return 'Buying sex is always legal in Sweden';
    }
  }
  if (/^marriage between people of the same sex in Sweden$/i.test(subject.trim())) {
    if (/^It is permitted to marry a person of the same sex$/i.test(answer.trim())) {
      return 'Marriage between people of the same sex is permitted in Sweden';
    }
    if (/^It is prohibited to marry a person of the same sex$/i.test(answer.trim())) {
      return 'Marriage between people of the same sex is prohibited in Sweden';
    }
  }
  if (/^They are\s+/i.test(answer)) {
    return replaceLeadingEnglishSubject(subject, answer);
  }
  const subjectStatement = replaceLeadingEnglishSubject(subject, answer);
  return subjectStatement === answer ? answer : subjectStatement;
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

function compactEventContextSv(context: string): string {
  return context.trim().replace(/,\s*ett datum\b.*$/i, '');
}

function compactEventContextEn(context: string): string {
  return context.trim().replace(/,\s*a date\b.*$/i, '');
}

function eventStatementSv(context: string, answer: string): string {
  return `Händelsen ${compactEventContextSv(context)} var att ${lowerLeadingSwedishCommonStart(
    answer,
  )}`;
}

function eventStatementEn(context: string, answer: string): string {
  return `The event ${compactEventContextEn(context)} was that ${lowerLeadingEnglishArticle(
    answer,
  )}`;
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
          /\s*Den norra delen av landet sträcker sig alltså in i området norr om polcirkeln\.?$/i,
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
        .replace(
          /\s*The northern part of the country therefore extends into the area north of the Arctic Circle\.?$/i,
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
  return trueStatementExplanationSv(source);
}

function trueFalseSingleChoiceExplanationEn(source: PracticeQuestion): string {
  return trueStatementExplanationEn(source);
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
  return truthStatementSv(deriveCivicStatementSv(source, option));
}

function generatedTrueFalseStatementEn(
  source: PracticeQuestion,
  option: QuestionOption,
  variantIsTrue: boolean,
): string {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementEn(source, variantIsTrue);
  return truthStatementEn(deriveCivicStatementEn(source, option));
}

function embeddedQuestionTopicSv(question: string): string {
  const q = stripFinalPunctuation(question);
  let match = q.match(/^Var ligger (.+)$/i);
  if (match) return `var ${match[1]} ligger`;

  match = q.match(/^Vad heter (.+)$/i);
  if (match) return `vad ${match[1]} heter`;

  match = q.match(/^Vad är vanligt att göra på (.+)$/i);
  if (match) return `vad som är vanligt att göra på ${match[1]}`;

  match = q.match(/^Vad gör många på (.+?) i Sverige$/i);
  if (match) return `vad många gör på ${match[1]} i Sverige`;

  match = q.match(/^Vad gör många med (.+?) vid (.+?) i Sverige$/i);
  if (match) return `vad många gör med ${match[1]} vid ${match[2]} i Sverige`;

  match = q.match(/^Vad menas med (.+)$/i);
  if (match) return `vad som menas med ${match[1]}`;

  match = q.match(/^Vad är (.+)$/i);
  if (match) return `vad ${match[1]} är`;

  match = q.match(/^Vad betyder (.+)$/i);
  if (match) return `vad ${match[1]} betyder`;

  match = q.match(/^Vad innebär (.+)$/i);
  if (match) return `vad ${match[1]} innebär`;

  match = q.match(/^Hur kan (.+?) (.+)$/i);
  if (match) return `hur ${match[1]} kan ${match[2]}`;

  match = q.match(/^Vilka är (.+)$/i);
  if (match) return `vilka ${match[1]} är`;

  match = q.match(/^Vilka (.+?) ansvarar (.+?) för$/i);
  if (match) return `vilka ${match[1]} ${match[2]} ansvarar för`;

  match = q.match(/^Vilka betalar skatt i Sverige$/i);
  if (match) return 'vilka som betalar skatt i Sverige';

  match = q.match(/^Vem väljer (.+)$/i);
  if (match) return `vem som väljer ${match[1]}`;

  match = q.match(/^När (.+)$/i);
  if (match) return `när ${lowerFirst(match[1])}`;

  return lowerFirst(q);
}

function embeddedQuestionTopicEn(question: string): string {
  const q = stripFinalPunctuation(question);
  let match = q.match(/^Where is (.+) located$/i);
  if (match) return `where ${match[1]} is located`;

  match = q.match(/^What is (.+) called$/i);
  if (match) return `what ${match[1]} is called`;

  match = q.match(/^What is the name of (.+)$/i);
  if (match) return `what the name of ${match[1]} is`;

  match = q.match(/^How is (.+?) commonly (celebrated|observed) in Sweden$/i);
  if (match) return `how ${match[1]} is commonly ${match[2]} in Sweden`;

  match = q.match(/^What do many people do with (.+?) at (.+?) in Sweden$/i);
  if (match) return `what many people do with ${match[1]} at ${match[2]} in Sweden`;

  match = q.match(/^Which everyday services are (.+?) responsible for$/i);
  if (match) return `which everyday services ${match[1]} are responsible for`;

  match = q.match(/^What is the public sector in Sweden$/i);
  if (match) return 'what the public sector in Sweden is';

  match = q.match(/^Which three companies are Sweden's public service broadcasters$/i);
  if (match) return "Sweden's public service broadcasters";

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) return `what it means that ${match[1]}`;

  match = q.match(/^What does (.+) mean$/i);
  if (match) return `what ${match[1]} means`;

  match = q.match(/^How can (.+?) (.+)$/i);
  if (match) return `how ${match[1]} can ${match[2]}`;

  match = q.match(/^Who chooses (.+)$/i);
  if (match) return `who chooses ${match[1]}`;

  match = q.match(/^When (.+)$/i);
  if (match) return `when ${lowerFirst(match[1])}`;

  return lowerFirst(q);
}

function generatedSingleChoiceGenericPromptSv(
  source: PracticeQuestion,
  variant: 'section-practice' | 'judgement',
): string {
  const topic = embeddedQuestionTopicSv(source.questionSv);
  return variant === 'judgement'
    ? `Vilken uppgift stämmer när det gäller ${topic}?`
    : `Vad stämmer när det gäller ${topic}?`;
}

function generatedSingleChoiceGenericPromptEn(
  source: PracticeQuestion,
  variant: 'section-practice' | 'judgement',
): string {
  const topic = embeddedQuestionTopicEn(source.questionEn);
  return variant === 'judgement'
    ? `Which fact is correct regarding ${topic}?`
    : `What is correct regarding ${topic}?`;
}

function judgementPromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Vilken uppgift stämmer om ${statementTopicSv(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceSv(source, 'judgement');
  if (prompt) return prompt;
  return generatedSingleChoiceGenericPromptSv(source, 'judgement');
}

function judgementPromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Which fact is correct about ${statementTopicEn(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceEn(source, 'judgement');
  if (prompt) return prompt;
  return generatedSingleChoiceGenericPromptEn(source, 'judgement');
}

function singleChoicePromptSv(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `Vad gäller för ${statementTopicSv(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceSv(source, 'section-practice');
  if (prompt) return prompt;
  return (
    generatedSingleChoiceClozePromptSv(source, correctOption(source)) ??
    generatedSingleChoiceGenericPromptSv(source, 'section-practice')
  );
}

function singleChoicePromptEn(source: PracticeQuestion): string {
  if (isTrueFalseSource(source)) {
    return `What is correct about ${statementTopicEn(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceEn(source, 'section-practice');
  if (prompt) return prompt;
  return (
    generatedSingleChoiceClozePromptEn(source, correctOption(source)) ??
    generatedSingleChoiceGenericPromptEn(source, 'section-practice')
  );
}

function generatedSingleChoiceClozePromptSv(
  source: PracticeQuestion,
  option: QuestionOption,
): string | null {
  const cloze = replaceAnswerWithCloze(
    deriveCivicStatementSv(source, option),
    answerLabel(option),
    'sv',
  );
  return cloze ? ensureQuestion(cloze) : null;
}

function generatedSingleChoiceClozePromptEn(
  source: PracticeQuestion,
  option: QuestionOption,
): string | null {
  const cloze = replaceAnswerWithCloze(
    deriveCivicStatementEn(source, option),
    answerTextEn(option),
    'en',
  );
  return cloze ? ensureQuestion(cloze) : null;
}

function generatedSingleChoicePromptFromSourceSv(
  source: PracticeQuestion,
  variant: 'section-practice' | 'judgement',
): string | null {
  const q = stripFinalPunctuation(source.questionSv);
  if (source.id === 'q062' && variant === 'judgement') {
    return 'Vilken uppgift om offentlig sektor i Sverige stämmer?';
  }

  let match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken beskrivning stämmer för ${match[1]}?`
      : `Vad gäller för ${match[1]}?`;
  }

  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken innebörd stämmer för ${match[1]}?`
      : `Vad innebär det att ${match[1]}?`;
  }

  match = q.match(/^Vad betyder (?!det att\b)(.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken beskrivning stämmer för ${match[1]}?`
      : `Vad innebär ${match[1]}?`;
  }

  match = q.match(/^Vad innebär (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken beskrivning stämmer för ${match[1]}?`
      : `Vad betyder ${match[1]}?`;
  }

  match = q.match(/^Vad gäller för (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken uppgift stämmer om ${match[1]}?`
      : `Vad stämmer för ${match[1]}?`;
  }

  match =
    q.match(/^Vilken av följande uppgifter har (.+)$/i) ?? q.match(/^Vilken uppgift har (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken uppgift stämmer för ${match[1]}?`
      : `Vad är en uppgift för ${match[1]}?`;
  }

  match = q.match(/^Vad händer i (.+?) om (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vad stämmer i ${match[1]} om ${match[2]}?`
      : `Vilken följd kan uppstå i ${match[1]} om ${match[2]}?`;
  }

  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken följd stämmer för ${match[1]} och ${match[2]}?`
      : `Vilken följd kan ${match[1]} få för ${match[2]}?`;
  }

  match = q.match(/^Vad gör (.+?) på arbetsmarknaden$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vad stämmer om ${match[1]} på arbetsmarknaden?`
      : `Vilken roll har ${match[1]} på arbetsmarknaden?`;
  }

  match = q.match(/^Vilket stöd kan (.+?) ge (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilket stöd stämmer för ${match[1]}?`
      : `Vilken hjälp kan ${match[1]} ge ${match[2]}?`;
  }

  match = q.match(/^Hur hjälper (.+?) till med (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Hur kan ${match[1]} hjälpa till med ${match[2]}?`
      : `Vilken hjälp kan ${match[1]} ge med ${match[2]}?`;
  }

  match = q.match(/^Vilken roll har (.+?) i (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken roll stämmer för ${match[1]} i ${match[2]}?`
      : `Vilken funktion har ${match[1]} i ${match[2]}?`;
  }

  match = q.match(/^Vad fick (.+?) rätt att göra i Sverige på (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vad fick ${match[1]} möjlighet att göra i Sverige på ${match[2]}?`
      : `Vilken rätt fick ${match[1]} i Sverige på ${match[2]}?`;
  }

  match = q.match(/^Vad kan hända med (.+?) när (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken förändring kan gälla för ${match[1]} när ${match[2]}?`
      : `Vad kan ske med ${match[1]} när ${match[2]}?`;
  }

  match = q.match(/^Hur kan (.+?) få inkomster$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken inkomstkälla stämmer för ${match[1]}?`
      : `På vilket sätt kan ${match[1]} få inkomster?`;
  }

  match = q.match(/^Vad kännetecknar (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken beskrivning stämmer för ${match[1]}?`
      : `Vad är typiskt för ${match[1]}?`;
  }

  match = q.match(/^Hur publiceras (.+?) i dag$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vad gäller för ${match[1]} i dag?`
      : `Var publiceras ${match[1]} i dag?`;
  }

  match = q.match(/^Vad är viktigt att komma ihåg om (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vilken uppgift stämmer om ${match[1]}?`
      : `Vad gäller för ${match[1]}?`;
  }

  match = q.match(/^Vilka regler gäller för (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Vad stämmer för ${match[1]}?`
      : `Vilken regel gäller för ${match[1]}?`;
  }

  match = q.match(/^Vilka är (.+)$/i);
  if (match && variant === 'judgement') {
    return `Vilken uppgift stämmer om ${match[1]}?`;
  }

  match =
    q.match(/^Vilket påstående stämmer om (.+)$/i) ??
    q.match(/^Vilket påstående är korrekt om (.+)$/i) ??
    q.match(/^Vilket påstående om (.+?) stämmer$/i);
  if (!match) return null;
  return variant === 'judgement'
    ? `Vilken uppgift stämmer om ${match[1]}?`
    : `Vad gäller för ${match[1]}?`;
}

function generatedSingleChoicePromptFromSourceEn(
  source: PracticeQuestion,
  variant: 'section-practice' | 'judgement',
): string | null {
  const q = stripFinalPunctuation(source.questionEn);
  if (source.id === 'q062' && variant === 'judgement') {
    return "Which statement about Sweden's public sector is correct?";
  }

  let match = q.match(/^Which statement describes (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which description is correct for ${match[1]}?`
      : `What is correct about ${match[1]}?`;
  }

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which meaning is correct for ${match[1]}?`
      : `What is meant when ${match[1]}?`;
  }

  match = q.match(/^What does (.+) mean$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which description is correct for ${match[1]}?`
      : `What is meant by ${match[1]}?`;
  }

  match = q.match(/^What applies to (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which fact is correct about ${match[1]}?`
      : `What is correct for ${match[1]}?`;
  }

  match =
    q.match(/^Which of the following tasks belongs to (.+)$/i) ??
    q.match(/^What is one task of (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which task is correct for ${match[1]}?`
      : `What is one task for ${match[1]}?`;
  }

  match = q.match(/^What happens in (.+?) if (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `What is correct in ${match[1]} if ${match[2]}?`
      : `What consequence can occur in ${match[1]} if ${match[2]}?`;
  }

  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which effect is correct for ${match[1]} and ${match[2]}?`
      : `What effect can ${match[1]} have on ${match[2]}?`;
  }

  match = q.match(/^What do (.+?) do in the labour market$/i);
  if (match) {
    return variant === 'judgement'
      ? `What is correct about ${match[1]} in the labour market?`
      : `What role do ${match[1]} have in the labour market?`;
  }

  match = q.match(/^What support can (.+?) provide to (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which support is correct for ${match[1]}?`
      : `What help can ${match[1]} provide to ${match[2]}?`;
  }

  match = q.match(/^How does (.+?) help with (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `How can ${match[1]} help with ${match[2]}?`
      : `What help can ${match[1]} provide with ${match[2]}?`;
  }

  match = q.match(/^What role do (.+?) have in (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which role is correct for ${match[1]} in ${match[2]}?`
      : `What function do ${match[1]} have in ${match[2]}?`;
  }

  match = q.match(/^What did (.+?) gain the right to do in Sweden in (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `What did ${match[1]} become able to do in Sweden in ${match[2]}?`
      : `Which right did ${match[1]} gain in Sweden in ${match[2]}?`;
  }

  match = q.match(/^What can happen to (.+?) when (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which change can apply to ${match[1]} when ${match[2]}?`
      : `What change can happen to ${match[1]} when ${match[2]}?`;
  }

  match = q.match(/^How can (.+?) earn income$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which income source is correct for ${match[1]}?`
      : `In what way can ${match[1]} earn income?`;
  }

  match = q.match(/^What characterizes (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which description is correct for ${match[1]}?`
      : `What is typical of ${match[1]}?`;
  }

  match = q.match(/^How are (.+?) published today$/i);
  if (match) {
    return variant === 'judgement'
      ? `What applies to ${match[1]} today?`
      : `Where are ${match[1]} published today?`;
  }

  match = q.match(/^What is important to remember about (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `Which fact is correct about ${match[1]}?`
      : `What is correct about ${match[1]}?`;
  }

  match = q.match(/^What rules apply to (.+)$/i);
  if (match) {
    return variant === 'judgement'
      ? `What is correct for ${match[1]}?`
      : `Which rule applies to ${match[1]}?`;
  }

  match = q.match(/^What are (.+)$/i);
  if (match && variant === 'judgement') {
    return `Which fact is correct about ${match[1]}?`;
  }

  match = q.match(/^Which groups are (.+)$/i);
  if (match && variant === 'judgement') {
    return `Which fact is correct about ${match[1]}?`;
  }

  match = q.match(/^Which three companies are Sweden's public service broadcasters$/i);
  if (match) {
    return variant === 'judgement'
      ? "Which fact is correct about Sweden's public service broadcasters?"
      : "What is correct about Sweden's public service broadcasters?";
  }

  match =
    q.match(/^Which statement is correct about (.+)$/i) ??
    q.match(/^Which statement about (.+?) is correct$/i) ??
    q.match(/^Which statement best matches (.+)$/i);
  if (!match) return null;
  return variant === 'judgement'
    ? `Which fact is correct about ${match[1]}?`
    : `What is correct about ${match[1]}?`;
}

function universalHumanRightsStatementSv(answer: string): string | null {
  if (/^varje människa har rättigheter oavsett bakgrund eller livssituation$/i.test(answer)) {
    return 'Mänskliga rättigheter gäller varje människa oavsett bakgrund eller livssituation';
  }
  if (/^bara svenska medborgare har mänskliga rättigheter$/i.test(answer)) {
    return 'Mänskliga rättigheter gäller bara svenska medborgare';
  }
  if (/^rättigheterna gäller bara personer som arbetar$/i.test(answer)) {
    return 'Mänskliga rättigheter gäller bara personer som arbetar';
  }
  if (/^varje kommun väljer själv vilka människor som har rättigheter$/i.test(answer)) {
    return 'Varje kommun väljer själv vilka människor som har mänskliga rättigheter';
  }
  return null;
}

function universalHumanRightsStatementEn(answer: string): string | null {
  if (/^every person has rights regardless of background or life situation$/i.test(answer)) {
    return 'Human rights apply to every person regardless of background or life situation';
  }
  if (/^only Swedish citizens have human rights$/i.test(answer)) {
    return 'Human rights apply only to Swedish citizens';
  }
  if (/^the rights apply only to people who work$/i.test(answer)) {
    return 'Human rights apply only to people who work';
  }
  if (/^each municipality chooses which people have rights$/i.test(answer)) {
    return 'Each municipality chooses which people have human rights';
  }
  return null;
}

function politicalDemocracyRightStatementSv(answer: string): string | null {
  if (/^(?:Att\s+)?försöka övertyga andra om sina politiska idéer$/i.test(answer)) {
    return 'I en demokrati får människor, grupper och partier försöka övertyga andra om sina politiska idéer';
  }
  if (/^(?:Att\s+)?hindra andra från att rösta$/i.test(answer)) {
    return 'I en demokrati får människor, grupper och partier inte hindra andra från att rösta';
  }
  return null;
}

function politicalDemocracyRightStatementEn(answer: string): string | null {
  if (/^(?:To\s+)?try to persuade others of their political ideas$/i.test(answer)) {
    return 'In a democracy, people, groups, and parties may try to persuade others of their political ideas';
  }
  if (/^(?:To\s+)?stop others from voting$/i.test(answer)) {
    return 'In a democracy, people, groups, and parties may not stop others from voting';
  }
  return null;
}

export function deriveCivicStatementSv(source: PracticeQuestion, option: QuestionOption): string {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementSv(source, option.id === source.correctOptionId);
  }

  const answer = stripFinalPunctuation(answerLabel(option));
  const q = stripFinalPunctuation(source.questionSv);

  if (source.id === 'q146') {
    if (/^Att försöka övertyga andra om sina politiska idéer$/i.test(answer)) {
      return 'I en demokrati får människor, grupper och partier försöka övertyga andra om sina politiska idéer';
    }
    if (/^Att hindra andra från att rösta$/i.test(answer)) {
      return 'I en demokrati får människor, grupper och partier inte hindra andra från att rösta';
    }
  }

  if (source.id === 'q151') {
    if (/^De drivs ofta av privata företag och får inkomster genom reklam$/i.test(answer)) {
      return 'Reklamfinansierade medier drivs ofta av privata företag och får inkomster genom reklam';
    }
    if (/^De får aldrig sälja reklamplats$/i.test(answer)) {
      return 'Reklamfinansierade medier får aldrig sälja reklamplats';
    }
  }

  if (source.id === 'q152') {
    if (
      /^De finns också på internet och uppdateras med nyheter flera gånger per dag$/i.test(answer)
    ) {
      return 'Många tidningar finns också på internet och uppdateras med nyheter flera gånger per dag';
    }
    if (/^De får bara säljas som ett exemplar per år$/i.test(answer)) {
      return 'Många tidningar får bara säljas som ett exemplar per år';
    }
  }

  if (source.id === 'q153') {
    if (
      /^Vem som helst kan skapa innehåll där, och det kontrolleras inte alltid som i andra medier$/i.test(
        answer,
      )
    ) {
      return 'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier';
    }
    if (/^Bara ansvariga utgivare får skriva inlägg där$/i.test(answer)) {
      return 'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg';
    }
  }

  if (
    source.id === 'q166' &&
    /^Vissa kan rösta om de är folkbokförda i Sverige och uppfyller reglerna för sin grupp$/i.test(
      answer,
    )
  ) {
    return 'Vissa personer som inte är svenska medborgare kan rösta i kommun- och regionval om de är folkbokförda i Sverige och uppfyller reglerna för sin grupp';
  }

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

  match = q.match(/^Vilka är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${answer}`;

  match = q.match(/^Vilka tre företag kallas (.+) i Sverige$/i);
  if (match) return `${answer} kallas ${match[1]} i Sverige`;

  match = q.match(/^Ungefär hur många (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Vilka (.+?) är viktiga i Sverige$/i);
  if (match) return `${upperFirst(answer)} är viktiga ${match[1]} i Sverige`;

  match = q.match(/^Vilka (.+?) kan (.+)$/i);
  if (match) {
    if (option.id === source.correctOptionId) return `${upperFirst(answer)} kan ${match[2]}`;
    return `${upperFirst(answer)} är ${match[1]} som kan ${match[2]}`;
  }

  match = q.match(/^Vad betyder (?!det att\b)(.+)$/i);
  if (match) return `${upperFirst(match[1])} betyder ${lowerFirst(answer)}`;

  match = q.match(/^Vilket av följande ingår i (.+)$/i);
  if (match) return `Ett inslag i ${match[1]} är att ${lowerFirst(answer)}`;

  match = q.match(/^Vilket är ett sätt att (.+)$/i);
  if (match) return `Ett sätt att ${match[1]} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;

  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;

  if (/^Hur kan ett lågt valdeltagande påverka demokratin$/i.test(q))
    return swedishLowVoterTurnoutStatement(answer);

  if (
    source.id === 'q013' &&
    /^Hur kan människor påverka samhället och delta i demokratin$/i.test(q)
  ) {
    return `Människor kan påverka samhället och delta i demokratin genom att ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;
  }

  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return swedishAffectStatement(match[1], match[2], answer);

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

  match = q.match(/^Vilken rätt har människor, grupper och partier i en demokrati$/i);
  if (match) {
    const statement = politicalDemocracyRightStatementSv(answer);
    if (statement) return statement;
  }

  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) {
    if (source.id === 'q050' && /^vara källkritisk$/i.test(match[1])) {
      if (/^Att ifrågasätta och kontrollera om information är korrekt$/i.test(answer)) {
        return 'Källkritik innebär att man ifrågasätter och kontrollerar om information är korrekt';
      }
      if (/^Att aldrig läsa nyheter$/i.test(answer)) {
        return 'Källkritik innebär att man aldrig läser nyheter';
      }
      return `Källkritik innebär ${lowerFirst(answer)}`;
    }
    if (/^mänskliga rättigheter gäller alla$/i.test(match[1])) {
      const statement = universalHumanRightsStatementSv(answer);
      if (statement) return statement;
    }
    if (/^folkomröstningar i Sverige är rådgivande$/i.test(match[1])) {
      return `Att ${match[1]} betyder att ${answer
        .replace(
          /^politikerna behöver inte följa resultatet$/i,
          'politikerna inte behöver följa resultatet',
        )
        .replace(
          /^politikerna måste inte följa resultatet$/i,
          'politikerna inte behöver följa resultatet',
        )
        .replace(
          /^politikerna måste alltid följa resultatet$/i,
          'politikerna alltid måste följa resultatet',
        )}`;
    }
    if (/^val i en demokrati är hemliga$/i.test(match[1])) {
      if (/^(?:Att\s+)?väljare inte behöver avslöja hur de röstar$/i.test(answer)) {
        return 'Hemliga val betyder att väljare inte behöver avslöja hur de röstar';
      }
      if (/^(?:Att\s+)?bara myndigheter får veta hur varje person röstar$/i.test(answer)) {
        return 'Hemliga val betyder att bara myndigheter får veta hur varje person röstar';
      }
    }
    if (/^Sverige är en konstitutionell monarki$/i.test(match[1])) {
      const clause = stripLeadingPurposeSv(answer)
        .replace(/^statschefen är /i, 'statschefen ')
        .replace(/ men saknar politisk makt$/i, ' utan politisk makt');
      return /^monarken har /i.test(clause)
        ? `I Sveriges konstitutionella monarki har ${lowerFirst(clause).replace(/^monarken har /i, 'monarken ')}`
        : `I Sveriges konstitutionella monarki är ${lowerFirst(clause)}`;
    }
    if (/^Sverige är en sekulär stat$/i.test(match[1])) {
      return `Sverige är en sekulär stat, så ${lowerFirst(stripLeadingPurposeSv(answer))}`;
    }
    if (/^val i en demokrati är hemliga$/i.test(match[1])) {
      return `Hemliga val betyder att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
    }
    return `Att ${match[1]} betyder att ${embeddedSwedishClause(answer)}`;
  }

  match = q.match(/^Vad kan göra (.+?) (starkare)$/i);
  if (match) {
    return `${upperFirst(match[1])} blir ${match[2]} när ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;
  }

  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;

  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match) return swedishTaskProposition(source, match[1], answer);

  match = q.match(/^Vilken uppgift har (.+)$/i);
  if (match) return swedishTaskProposition(source, match[1], answer);

  match = q.match(/^Vad är en uppgift för (.+)$/i);
  if (match) return `En uppgift för ${match[1]} är ${swedishPurposeClause(answer)}`;

  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);

  match = q.match(/^Vilket påstående stämmer om (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vilket påstående om (.+?) är korrekt$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vilken är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${lowerFirst(answer)}`;

  match = q.match(/^Vilket exempel beskriver (.+)$/i);
  if (match) return `${upperFirst(answer)} är exempel på ${match[1]}`;

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

  match = q.match(/^Varför behövs källkritik när man använder medier$/i);
  if (match) {
    return `En anledning till att källkritik behövs när man använder medier är ${reasonAnswerClauseSv(
      answer,
    )}`;
  }

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

  match = q.match(/^Hur kan (.+?) få inkomster$/i);
  if (match) return `${upperFirst(match[1])} kan få inkomster ${swedishIncomeMethod(answer)}`;

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

  match = q.match(/^Vilka vardagstjänster ansvarar (.+?) för$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishResponsibilityObject(answer)}`;

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

  match = q.match(/^Vilken händelse från (.+?) nämns som (.+)$/i);
  if (match) return `Händelsen från ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;

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

  match = q.match(/^Vad hände (.+)$/i);
  if (match) return eventStatementSv(match[1], answer);

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

  match = q.match(
    /^Vilka slags församlingar och tempel finns för buddhister och hinduer i Sverige$/i,
  );
  if (match) return `${answer} finns i Sverige`;

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

  match = q.match(/^Vilka kristna kyrkor eller samfund nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[1]}`;

  match =
    q.match(/^Vilket påstående om (.+?) stämmer$/i) ??
    q.match(/^Vilket påstående om (.+?) är korrekt$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);

  match = q.match(/^Vad skyddar (.+?) när det gäller (.+)$/i);
  if (match) return swedishProtectedReligionStatement(match[1], answer);

  match = q.match(/^Vad skyddar ((?!.*\bnär det gäller\b).+)$/i);
  if (match) return swedishProtectionStatement(match[1], answer);

  match = q.match(/^Vad ger (.+?) alla rätt att göra$/i);
  if (match) return swedishEveryoneRightStatement(match[1], answer);

  match = q.match(/^Vilken rätt har den åtalade under en rättegång$/i);
  if (match) return swedishAccusedTrialRightStatement(answer);

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

  match = q.match(/^Vilka riktningar inom (.+?) nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[2]}`;

  match = q.match(/^Vad bidrog till (.+)$/i);
  if (match) return `${upperFirst(answer)} bidrog till ${match[1]}`;

  match = q.match(/^Vad nämns som exempel på (.+)$/i);
  if (match) return swedishMentionedExample(answer, match[1]);

  match = q.match(/^Vad är vanligt vid (.+)$/i);
  if (match) return `Vid ${match[1]} är det vanligt med ${lowerFirst(answer)}`;

  match = q.match(/^Vad är vanligt i många hem under (.+)$/i);
  if (match) return `Under ${match[1]} är det vanligt med ${lowerFirst(answer)} i många hem`;

  match = q.match(/^Vilken högtid avslutar (.+)$/i);
  if (match) return `${answer} avslutar ${match[1]}`;

  match = q.match(/^Vad brukar Lucia bära i ett luciatåg$/i);
  if (match) return `Lucia brukar bära ${lowerFirst(answer)}`;

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

  match = q.match(/^Vad står på röstkortet som skickas hem före valet$/i);
  if (match) return `Röstkortet visar ${lowerFirst(answer)}`;

  match = q.match(/^Vad kan den som vill påverka innehållet i partipolitiken göra$/i);
  if (match) return swedishPartyPoliticsStatement(answer);

  return upperFirst(stripLeadingPurposeSv(answer));
}

export function deriveCivicStatementEn(source: PracticeQuestion, option: QuestionOption): string {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementEn(source, option.id === source.correctOptionId);
  }

  const answer = stripFinalPunctuation(answerTextEn(option));
  const q = stripFinalPunctuation(source.questionEn);

  if (source.id === 'q062') {
    if (
      /^Services and activities that the state, regions, and municipalities are responsible for and fund through taxes$/i.test(
        answer,
      )
    ) {
      return 'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes';
    }
    if (/^All privately owned companies$/i.test(answer)) {
      return 'The public sector in Sweden consists only of privately owned companies';
    }
    if (/^Only banks and insurance companies$/i.test(answer)) {
      return 'The public sector in Sweden consists only of banks and insurance companies';
    }
    if (/^Only non-profit associations$/i.test(answer)) {
      return 'The public sector in Sweden consists only of non-profit associations';
    }
  }

  if (source.id === 'q048') {
    if (
      /^Swedish Radio \(SR\), Swedish Television \(SVT\), and Swedish Educational Broadcasting Company \(UR\)$/i.test(
        answer,
      )
    ) {
      return "Swedish Radio (SR), Swedish Television (SVT), and Swedish Educational Broadcasting Company (UR) are Sweden's public service broadcasters";
    }
    if (/^The Police, Tax Agency, and Migration Agency$/i.test(answer)) {
      return "The Police, Tax Agency, and Migration Agency are Sweden's public service broadcasters";
    }
    if (/^The Riksdag, government, and courts$/i.test(answer)) {
      return "The Riksdag, government, and courts are Sweden's public service broadcasters";
    }
    if (/^LO, TCO, and Saco$/i.test(answer)) {
      return "LO, TCO, and Saco are Sweden's public service broadcasters";
    }
  }

  if (source.id === 'q146') {
    if (/^To try to persuade others of their political ideas$/i.test(answer)) {
      return 'In a democracy, people, groups, and parties may try to persuade others of their political ideas';
    }
    if (/^To stop others from voting$/i.test(answer)) {
      return 'In a democracy, people, groups, and parties may not stop others from voting';
    }
  }

  if (source.id === 'q151') {
    if (
      /^They are often run by private companies and earn income from advertising$/i.test(answer)
    ) {
      return 'Advertising-funded media are often run by private companies and earn income from advertising';
    }
    if (/^They may never sell advertising space$/i.test(answer)) {
      return 'Advertising-funded media may never sell advertising space';
    }
  }

  if (source.id === 'q152') {
    if (
      /^They are also available online and updated with news several times per day$/i.test(answer)
    ) {
      return 'Many newspapers are also available online and updated with news several times per day';
    }
    if (/^They may be sold only as one copy per year$/i.test(answer)) {
      return 'Many newspapers may be sold only as one copy per year';
    }
  }

  if (source.id === 'q153') {
    if (
      /^Anyone can create content there, and it is not always checked the same way as in other media$/i.test(
        answer,
      )
    ) {
      return 'On the web and in social media, anyone can create content, and it is not always checked the same way as in other media';
    }
    if (/^Only responsible publishers may write posts there$/i.test(answer)) {
      return 'On the web and in social media, only responsible publishers may write posts';
    }
  }

  if (
    source.id === 'q166' &&
    /^Some may vote if they are registered as living in Sweden and meet the rules for their group$/i.test(
      answer,
    )
  ) {
    return 'Some people who are not Swedish citizens may vote in municipal and regional elections if they are registered as living in Sweden and meet the rules for their group';
  }

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

  match = q.match(/^What are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${lowerLeadingEnglishArticle(answer)}`;

  match = q.match(/^Which groups are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;

  match = q.match(/^Which three companies are called (.+) in Sweden$/i);
  if (match) return `${answer} are called ${match[1]} in Sweden`;

  match = q.match(/^Approximately how many (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;

  match = q.match(/^Which (.+?) are important in Sweden$/i);
  if (match) return `${upperFirst(answer)} are important ${match[1]} in Sweden`;

  match = q.match(/^Which (.+?) can (.+)$/i);
  if (match) {
    if (option.id === source.correctOptionId) return `${upperFirst(answer)} can ${match[2]}`;
    return `${upperFirst(answer)} ${englishSubjectVerb(answer, 'is', 'are')} ${
      match[1]
    } that can ${match[2]}`;
  }

  match = q.match(/^What does (.+) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);

  match = q.match(/^Which of the following is part of (.+)$/i);
  if (match) return `A feature of ${match[1]} is that ${lowerFirst(answer)}`;

  match = q.match(/^Which is a way to (.+)$/i);
  if (match) return `One way to ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^What is it called when (.+)$/i);
  if (match) return `When ${match[1]}, it is called ${lowerFirst(answer)}`;

  if (/^How can a low voter turnout affect democracy$/i.test(q))
    return englishLowVoterTurnoutStatement(answer);

  if (
    source.id === 'q013' &&
    /^How can people influence society and participate in democracy$/i.test(q)
  ) {
    const action = answer
      .replace(
        /^Contact politicians, demonstrate, or sign a petition$/i,
        'contacting politicians, demonstrating, or signing a petition',
      )
      .replace(
        /^Contact politicians, join a demonstration, or sign a petition$/i,
        'contacting politicians, joining a demonstration, or signing a petition',
      )
      .replace(
        /^Ban others from voting in political elections$/i,
        'banning others from voting in political elections',
      );
    return `People can influence society and participate in democracy by ${englishGerundPhrase(
      action,
    )}`;
  }

  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) return englishAffectStatement(match[1], match[2], answer);

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

  match = q.match(/^What right do people, groups, and parties have in a democracy$/i);
  if (match) {
    const statement = politicalDemocracyRightStatementEn(answer);
    if (statement) return statement;
  }

  match = q.match(/^What does it mean that (.+)$/i);
  if (match) {
    if (/^human rights apply to everyone$/i.test(match[1])) {
      const statement = universalHumanRightsStatementEn(answer);
      if (statement) return statement;
    }
    if (/^Sweden is a constitutional monarchy$/i.test(match[1])) {
      const clause = stripLeadingPurposeEn(answer)
        .replace(/^that /i, '')
        .replace(/ but lacks political power$/i, ' without political power');
      return `In Sweden's constitutional monarchy, ${lowerLeadingEnglishClauseStart(clause)}`;
    }
    if (/^Sweden is a secular state$/i.test(match[1])) {
      return `Sweden is a secular state, so ${lowerFirst(stripLeadingPurposeEn(answer))}`;
    }
    if (/^elections in a democracy are secret$/i.test(match[1])) {
      return `Secret elections mean ${lowerFirst(stripLeadingPurposeEn(answer)).replace(
        /^no one has to reveal/i,
        'voters do not have to reveal',
      )}`;
    }
    return `That ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  }

  match = q.match(/^What does it mean to (.+)$/i);
  if (match) {
    if (source.id === 'q050' && /^be source-critical$/i.test(match[1])) {
      return `Source criticism means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
    }
    return `To ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  }

  match = q.match(/^What can make (.+?) (stronger)$/i);
  if (match) {
    return `${upperFirst(match[1])} becomes ${match[2]} when ${englishCivicActionClause(answer)}`;
  }

  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;

  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match) return englishTaskProposition(source, match[1], answer);

  match = q.match(/^What is one task of (.+)$/i);
  if (match) return englishTaskProposition(source, match[1], answer);

  match = q.match(/^What is one role of (.+)$/i);
  if (match) return `One role of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);

  match =
    q.match(/^Which statement is correct about (.+)$/i) ??
    q.match(/^Which statement about (.+?) is correct$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match) {
    return `The foremost task of ${lowerLeadingEnglishArticle(match[1])} is ${englishInfinitive(
      stripLeadingPurposeEn(answer),
    )}`;
  }

  match = q.match(/^What is the main responsibility of (.+)$/i);
  if (match) {
    return `The main responsibility of ${lowerLeadingEnglishArticle(
      match[1],
    )} is ${englishResponsibilityPredicate(answer)}`;
  }

  match = q.match(/^Which example describes (.+)$/i);
  if (match)
    return `${upperFirst(answer)} ${englishSubjectVerb(answer, 'belongs', 'belong')} among ${match[1]}`;

  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;

  match = q.match(/^How often are (.+) held$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)}`;

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

  match = q.match(/^Why is source criticism needed when using media$/i);
  if (match) {
    return `One reason source criticism is needed when using media is ${reasonAnswerClauseEn(
      answer,
    )}`;
  }

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

  match = q.match(/^How can (.+?) earn income$/i);
  if (match) return `${upperFirst(match[1])} can earn income ${englishIncomeMethod(answer)}`;

  match = q.match(/^What share of (.+?) works (.+)$/i);
  if (match) return `${upperFirst(answer)} of ${match[1]} works ${match[2]}`;

  match = q.match(/^How are (.+) set in Sweden$/i);
  if (match) return `${upperFirst(match[1])} in Sweden are set ${lowerFirst(answer)}`;

  match = q.match(/^What support can (.+?) provide to (.+)$/i);
  if (match) return supportStatementEn(match[1], answer);

  match = q.match(/^What is (.+?) responsible for$/i);
  if (match) return `${upperFirst(match[1])} is responsible for ${englishGerundPhrase(answer)}`;

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

  match = q.match(/^Which everyday services are (.+?) responsible for$/i);
  if (match)
    return `${upperFirst(match[1])} are responsible for ${englishResponsibilityObject(answer)}`;

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

  match = q.match(/^Which event from (.+?) is mentioned as (.+)$/i);
  if (match) return `The event from ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;

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

  match = q.match(/^What happened (.+)$/i);
  if (match) return eventStatementEn(match[1], answer);

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

  match = q.match(/^What does (.+?) work for$/i);
  if (match) {
    if (/^Only\s+/i.test(answer)) {
      return `${upperFirst(match[1])} works only for ${lowerFirst(
        answer.replace(/^Only\s+/i, ''),
      )}`;
    }
    return `${upperFirst(match[1])} works for ${lowerFirst(answer)}`;
  }

  match = q.match(/^What does (.+?) promote$/i);
  if (match) {
    if (/^Only\s+/i.test(answer)) {
      return `${upperFirst(match[1])} promotes only ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} promotes ${lowerFirst(answer)}`;
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

  match = q.match(/^How is (.+?) commonly (?:celebrated|observed) in Sweden$/i);
  if (match) {
    const timePhrase = match[1].replace(/\s+on\s+(\d{1,2}\s+\w+)$/i, ', $1');
    return englishCommonToDoStatement(timePhrase, answer);
  }

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

  match = q.match(
    /^What kinds of congregations and temples are there for Buddhists and Hindus in Sweden$/i,
  );
  if (match) return `${answer} exist in Sweden`;

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

  match = q.match(/^What is one aim of (.+)$/i);
  if (match) return `One aim of ${match[1]} is that ${lowerFirst(stripLeadingPurposeEn(answer))}`;

  match = q.match(/^When were (.+?) built$/i);
  if (match) return `${upperFirst(match[1])} were built ${lowerFirst(answer)}`;

  match = q.match(/^Which Christian churches or communities exist in (.+)$/i);
  if (match) return `${answer} exist in ${match[1]}`;

  match = q.match(/^Which Christian churches or communities are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[1]}`;

  match = q.match(/^Which statement about (.+?) is correct$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What does (.+?) protect regarding (.+)$/i);
  if (match) return englishProtectedReligionStatement(match[1], answer);

  match = q.match(/^What does (.+?) protect$/i);
  if (match) return englishProtectionStatement(match[1], answer);

  match = q.match(/^What does (.+?) give everyone the right to do$/i);
  if (match) return englishEveryoneRightStatement(match[1], answer);

  match = q.match(/^What right does the accused person have during a trial$/i);
  if (match) return englishAccusedTrialRightStatement(answer);

  if (source.id === 'q115' && /^To freely choose any religion or none$/i.test(answer)) {
    return 'In 1860, Swedes were free to choose any religion or none';
  }

  match = q.match(/^What became permitted for (.+?) in (.+)$/i);
  if (match)
    return `In ${match[2]}, ${match[1]} were permitted to ${stripLeadingPurposeEn(answer)}`;

  match = q.match(/^What were (.+?) allowed to do starting in (.+)$/i);
  if (match)
    return `Starting in ${match[2]}, ${match[1]} were allowed to ${stripLeadingPurposeEn(answer)}`;

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

  match = q.match(/^Which branches within (.+?) are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[2]}`;

  match = q.match(/^What contributed to (.+)$/i);
  if (match) return `${upperFirst(answer)} contributed to ${match[1]}`;

  match = q.match(/^What is mentioned as an example of (.+)$/i);
  if (match) return englishMentionedExample(answer, match[1]);

  match = q.match(/^What is common during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common during ${match[1]}`;

  match = q.match(/^What is common in many homes during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common in many homes during ${match[1]}`;

  match = q.match(/^Which holiday ends (.+)$/i);
  if (match) return `${answer} ends ${match[1]}`;

  match = q.match(/^What does Lucia usually wear in a Lucia procession$/i);
  if (match) return `Lucia usually wears ${lowerFirst(answer)}`;

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
  if (match) return `In Sweden, on ${match[1]}, ${manyPeopleActionEn(answer)}`;

  match = q.match(/^What can happen to (.+?) when (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);

  match = q.match(/^What do many people do with (.+?) at (.+?) in Sweden$/i);
  if (match) return `In Sweden, at ${match[2]}, ${manyPeopleActionEn(answer)}`;

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

  match = q.match(/^What is stated on the voting card sent home before an election$/i);
  if (match) return `The voting card shows ${lowerFirst(answer)}`;

  match = q.match(/^What can someone do to influence the content of party politics$/i);
  if (match) return englishPartyPoliticsStatement(answer);

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
