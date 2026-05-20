#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {
  buildSiteQuestionBank,
  generateStaticSiteQuestionBankJs,
} = require('./export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];
const moduleCache = new Map();
const speechEvents = [];
const speechMock = {
  speak(text, options) {
    speechEvents.push({ type: 'speak', text, options });
  },
  stop() {
    speechEvents.push({ type: 'stop' });
  },
};
const QUESTION_TYPE_VALUES = ['single_choice', 'true_false', 'flashcard'];
const REVIEW_STATUS_VALUES = ['draft', 'reviewed', 'published'];
const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = new Set(QUESTION_TYPE_VALUES);
const PUBLISHED_QUESTION_TYPES = new Set(['single_choice', 'true_false']);
const DIFFICULTIES = new Set(DIFFICULTY_VALUES);
const REVIEW_STATUSES = new Set(REVIEW_STATUS_VALUES);
const EXPECTED_UX_BENCHMARKS = 4;
const EXPECTED_SOURCE_QUESTIONS = 144;
const EXPECTED_BASE_SOURCE_QUESTIONS = 20;
const GENERATED_VARIANTS_PER_SOURCE = 4;
const EXPECTED_PUBLISHED_QUESTIONS =
  EXPECTED_SOURCE_QUESTIONS * (GENERATED_VARIANTS_PER_SOURCE + 1);
const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'];
const TRUE_FALSE_OPTION_IDS = ['true', 'false'];
const GENERATED_VARIANT_CONVENTIONS = [
  { type: 'single_choice', tag: 'section-practice' },
  { type: 'true_false', tag: 'true-false' },
  { type: 'true_false', tag: 'false-statement' },
  { type: 'single_choice', tag: 'judgement' },
];
const UNKNOWN_OPTION = {
  id: 'unknown',
  textSv: 'Inget av alternativen stämmer',
  textEn: 'None of the options is correct',
};
const SOMETIMES_OPTION = {
  id: 'sometimes',
  textSv: 'Endast ibland',
  textEn: 'Only sometimes',
};
const TRUE_FALSE_OPTIONS = [
  { id: 'true', textSv: 'Sant', textEn: 'True' },
  { id: 'false', textSv: 'Falskt', textEn: 'False' },
];
const EXPECTED_UHR_SOURCE = {
  titleKeyword: 'Sverige i fokus',
  publisher: 'Universitets- och högskolerådet (UHR)',
  url: 'https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf',
};
const EXPECTED_UHR_EDUCATION_MATERIAL_URL =
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const QUESTION_BANK_CSV_HEADER = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'correctOptionId',
  'uhrChapter',
  'uhrSection',
  'uhrPageApprox',
  'uhrSourcePublisher',
  'difficulty',
  'reviewStatus',
  'tags',
];
const QUESTION_AUTHORITY_OVERCLAIM_PATTERNS = [
  /\bofficial\s+(?:citizenship\s+)?(?:exam|test|question|practice)\b/i,
  /\breal\s+(?:citizenship\s+)?exam\s+questions?\b/i,
  /\b(?:uhr|government|authority)[-\s]?approved\b/i,
  /\bquality[-\s]?controlled\s+by\s+(?:uhr|an?\s+authority|the\s+government)\b/i,
  /\bguarantee[sd]?\s+(?:a\s+)?(?:pass|passing|approval)\b/i,
  /\bofficiell(?:a|t)?\s+(?:prov|test|fr[aå]ga|fr[aå]gor|[oö]vning|[oö]vningar)\b/i,
  /\briktiga\s+provfr[aå]gor\b/i,
  /\b(?:uhr|myndighets|regerings)[-\s]?godk[aä]nd(?:a|t)?\b/i,
  /\bkvalitets(?:granskad|granskade|granskat)\s+av\s+(?:uhr|myndighet|regeringen)\b/i,
  /\bgaranter(?:ar|ad|at)?\s+(?:godk[aä]nt|att\s+klara)\b/i,
];
const QUESTION_STEM_SOURCE_AUTHORITY_PATTERNS = [
  /\benligt\s+UHR\b/i,
  /\bUHR[\s-]?(?:materialet|avsnittet)\b/i,
  /\bUHR:s\s+material\b/i,
  /\baccording to\s+(?:the\s+)?UHR\b/i,
  /\b(?:the\s+)?UHR\s+(?:material|section)\b/i,
  /\bst(?:ä|a)mmer\s+b(?:ä|a)st\s+enligt\s+UHR\b/i,
  /\bbest\s+matches\s+(?:the\s+)?UHR\s+section\b/i,
];
const QUESTION_NESTED_META_STEM_PATTERNS = [
  /\bSant eller falskt:\s*Ett korrekt svar på frågan\s+"(?:Sant eller falskt:)?/i,
  /\bTrue or false:\s*A correct answer to\s+"(?:True or false:)?/i,
  /\bEtt korrekt svar på frågan\s+"Sant eller falskt:/i,
  /\bA correct answer to\s+"True or false:/i,
  /\bVilket svar stämmer bäst\?\s*Sant eller falskt:/i,
  /\bWhich answer best matches\?\s*True or false:/i,
];
const QUESTION_JUDGEMENT_META_STEM_PATTERNS = [
  /\bVilket alternativ motsvarar rätt bedömning av påståendet\?/i,
  /\bWhich option gives the correct judgment of the statement\?/i,
];
const QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS = [
  /\bDet stämmer att\s+(?:Ungefär|Havet)\b/i,
  /\bIt is true that\s+(?:The|In|Approximately)\b/i,
  /\bbelongs to\s+[a-zåäö][^.,"]*/i,
  /\bhör till\s+[a-zåäö][^.,"]*/i,
  /\b(?:Det är korrekt att\s+)?(?:Det att|Svaret är)\b/i,
  /\b(?:It is correct that\s+)?(?:the answer is)\b/i,
  /\bdescribes that\b/i,
  /\bis\s+(?:be|judge)\b/i,
  /\bis an example of municipal responsibilities\b/i,
  /\b(?:has one vote each|may stand for election)\s+is part of\b/i,
  /\b(?:har en röst var|får ställa upp)\s+ingår i\b/i,
  /\bis a way to\b/i,
  /\bär ett sätt att\b/i,
  /\bapplies to\b/i,
  /\bgäller för\b/i,
  /\bare The\b/,
  /^That hitting children is prohibited\b/i,
  /\bdescribes\s+(?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)\b/i,
  /\bbeskriver\s+(?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)\b/i,
  /\bis the list that contains\b/i,
  /\bär listan som innehåller\b/i,
  /\babout public power in Sweden\b/i,
  /\bom offentlig makt i Sverige\b/i,
  /\bmeans it gives\b/i,
  /\binnebär att den ger\b/i,
  /\bfrom (?:13|15) years\b/i,
  /^One reason is to (?:prevent war|decide Swedish municipal taxes)\b/i,
  /^En anledning är att (?:förhindra krig|bestämma svenska kommunalskatter)\b/i,
  /^En anledning är(?: att)? (?:skydda anställdas rättigheter|bestämma vem som blir statschef|bättre jordbruksmetoder|EU-medlemskapet)\b/i,
  /^It was presented in (?:1918|1948)\b/i,
  /^Den presenterades (?:1918|1948)\b/i,
  /^One reason is (?:to (?:protect employees|decide who becomes head of state)|better farming methods|EU membership|eU membership)\b/i,
  /^En anledning är att (?:valet är hemligt|rösterna ska räknas snabbare)\b/i,
  /^One reason is (?:the vote is secret|votes are counted faster)\b/i,
  /^En myndighet som\b/i,
  /^An authority that\b/i,
  /\beU membership\b/,
  /\bOne reason is that so\b/i,
  /\bhave\s+[^.?!]*\bin common\b/i,
  /\bhar\s+[^.?!]*\bgemensamt\b/i,
  /\bcommon to\s+(?:eating|lighting|opening|holding)\b/i,
  /\bcelebrates The\b/,
  /\bfirar traditionellt (?!Jesu födelse\b)[A-ZÅÄÖ]/,
  /\bfirar traditionellt jesu födelse\b/,
  /\bcelebrates jesus' birth\b/,
  /^(?:By|Apply|Leave|Live)\b/i,
  /^(?:Genom att|Representera\b|Arbeta\s|Bo i landet|Lämna Svenska|Samarbetet mellan|Nordiska rådet|Riksdagen och|Islam\.|Jul\.|Påsk\.|Julotta\.|Bön,|[0-9]{4}\.)/i,
  /\bPåståendet är sant:/i,
  /\bThe statement is true:/i,
  /\b(?:Det är inte sant att|Det stämmer inte att|Det stämmer att)\b/i,
  /\b(?:It is not true that|It is true that)\b/i,
  /^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)/i,
  /^Sverige beslutade att barnkonventionen blev svensk lag\b/i,
  /\bär (?:Judar|Danskar),/,
  /^(?:De|They) (?:företräder|bestämmer|represent|decide)\b/i,
  /\batt Kungens makt\b/,
  /\bför Samarbetet mellan\b/,
  /\bfor Cooperation between\b/,
  /^En anledning är att Sverige (?:hade|saknade)\b/,
  /^One reason is that Sweden had\b/,
  /\bhar förändrat bara hur\b/i,
  /\bhas changed only how\b/i,
  /\barbetar för endast\b/i,
  /\bworks for only\b/i,
  /\b(?:den näst största i Sverige|the second largest in Sweden)\b/i,
  /,\s*,/,
  /\bit is common to large bonfires\b/i,
  /\bbrukar\s+\S+\s+arrangerar\b/i,
  /\b(?:spreadinging|welcominging)\b/i,
  /\bAdvent occurs (?:the four Sundays|a Saturday)\b/i,
  /\bthere are buddhist and Hindu\b/,
  /\bcalled Lucia procession\b/i,
  /\b(?:fram till julafton|på kvällen)\s+med en adventskalender hemma\b/i,
  /\b(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home\b/i,
  /\bTravel to Asia and increased interest[^.?!]*\bis mentioned\b/i,
  /^That Sweden's first mosques were built\b/i,
  /\bskyddar rätten [^.?!]* och skydd mot\b/i,
  /\bprotects the right [^.?!]* and protection from\b/i,
  /\bskyddar att staten väljer\b/i,
  /\bprotects that the state chooses\b/i,
  /\bMånga svenskar firar id al-fitr och Newroz även om\b/i,
  /\bMany Swedes celebrate Eid al-Fitr and Newroz even if\b/i,
  /\bfick rätt att bo i landet och utöva\b/i,
  /\bgained the right to live in the country and practice\b/i,
];
const QUESTION_TRUE_FALSE_STEM_PREFIX_PATTERNS = [
  /^\s*Sant eller falskt\s*:/i,
  /^\s*True or false\s*:/i,
];
const AUTHORED_TRUE_FALSE_EXPLANATION_BOILERPLATE_PATTERNS = [
  /^\s*Påståendet är (?:sant|falskt)[:.]\s*/i,
  /^\s*The statement is (?:true|false)[:.]\s*/i,
  /\b(?:så|därför)\s+(?:är\s+)?påståendet\s+(?:sant|falskt)\b/i,
  /\balternativet\s+(?:Sant|Falskt)\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bso\s+the\s+statement\s+is\s+(?:true|false)\b/i,
  /\bthat\s+makes\s+the\s+statement\s+(?:true|false)\b/i,
  /\bThat makes True correct\b/i,
  /\b(?:True|False)\s+is\s+correct\b/i,
  /\bwhile False\b/i,
];
const GENERATED_OPTION_SOURCE_MATERIAL_PATTERNS = [/\bmaterialet\b/i, /\bfrom the material\b/i];
const GENERATED_SINGLE_CHOICE_FILLER_OPTION_TEXTS = new Set([
  'Inget av alternativen stämmer',
  'None of the options is correct',
  'Endast ibland',
  'Only sometimes',
]);
const GENERATED_SINGLE_CHOICE_META_STEM_PATTERNS = [
  /^\s*Vilket svar är korrekt\?/i,
  /^\s*Which answer is correct\?/i,
];
const GENERATED_SINGLE_CHOICE_ABSENT_TRUE_FALSE_EXPLANATION_PATTERNS = [
  /\bPåståendet är sant\b/i,
  /\balternativet\s+Sant\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bThat makes True correct\b/i,
  /\bTrue is correct\b/i,
  /\bwhile False\b/i,
];
const GENERATED_TRUE_FALSE_EXPLANATION_META_PATTERNS = [
  /\bPåståendet är sant\b/i,
  /\bPåståendet är falskt\b/i,
  /\b(?:så\s+påståendet\s+är\s+sant|därför\s+(?:är\s+)?påståendet\s+sant)\b/i,
  /\balternativet\s+Sant\b/i,
  /\balternativet\s+Falskt\b/i,
  /\bFalskt\s+stämmer\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bThe statement is true\b/i,
  /\bThe statement is false\b/i,
  /\bthe statement is true\b/i,
  /\bso\s+the\s+statement\s+is\s+true\b/i,
  /\bthat\s+makes\s+the\s+statement\s+true\b/i,
  /\bThat makes True correct\b/i,
  /\bTrue is correct\b/i,
  /\bFalse is correct\b/i,
  /\bwhile False\b/i,
];
const EXPECTED_BADGE_IDS = ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'];
const EXPECTED_SPACED_REPETITION_SCHEDULE = [1, 3, 7, 15, 30];
const EXPECTED_STREAK_RULE_COUNT = 6;
const EXPECTED_XP_RULE_COUNT = 11;
const EXPECTED_MASTERY_RULE_COUNT = 7;
const EXPECTED_SUPPORTED_LANGUAGES = ['sv', 'en'];
const EXPECTED_LANGUAGE_LABELS = {
  sv: 'Swedish',
  en: 'English support',
};
const EXPECTED_PRACTICE_ROUTE_COPY_LABELS = {
  sv: [
    '5-minutersövning',
    'Bokmärk',
    'Bokmärkt',
    'Ta bort bokmärket från den här frågan',
    'Bokmärk den här frågan',
    'Besvarade frågor: ${count}',
    'Det finns inga övningsfrågor ännu.',
    'Nästa fråga',
    'Gå till nästa övningsfråga',
    'Fråga ${questionNumber}',
    'Poäng',
    'Besvara frågan, få direkt återkoppling och granska UHR-källan innan du går vidare.',
    'Försök igen',
    'Försök igen med den här övningsfrågan',
    'Inkludera tilläggsfrågor',
    'Bara UHR-frågor',
    'UHR-källa',
    'Tilläggsfråga',
    'Redaktionell',
    'Om källorna',
    'Stäng om källorna',
    'Frågor som kommer direkt från UHR:s utbildningsmaterial Sverige i fokus. Allt innehåll i mock-provet är UHR.',
    'Variant som genererats utifrån en UHR-fråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av mock-provet.',
  ],
  en: [
    '5-minute practice',
    'Bookmark',
    'Bookmarked',
    'Remove this question bookmark',
    'Bookmark this question',
    'Completed questions: ${count}',
    'No practice questions are available yet.',
    'Next question',
    'Move to the next practice question',
    'Question ${questionNumber}',
    'Score',
    'Answer, get instant feedback, then review the UHR source before moving on.',
    'Try again',
    'Try this practice question again',
    'Include supplementary questions',
    'UHR questions only',
    'UHR source',
    'Supplementary',
    'Editorial',
    'About the sources',
    'Close about-the-sources',
    "Questions traced directly to UHR's study material Sverige i fokus. The mock exam is always UHR-only.",
    'Variant generated from a UHR question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
  ],
};
const EXPECTED_PRACTICE_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'practice route must import AppLanguage from settings'],
  ['type PracticeCopy = {', 'practice route must define a typed copy contract'],
  [
    'const practiceCopy: Record<AppLanguage, PracticeCopy> = {',
    'practice route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'practice route must read language from settings store',
  ],
  [
    'const copy = practiceCopy[language];',
    'practice route must select copy from settings language',
  ],
  ['<Text>{copy.emptyTitle}</Text>', 'empty state must render localized copy'],
  ['<Badge>{copy.badge}</Badge>', 'practice badge must render localized copy'],
  ['{copy.questionTitle(questionNumber)}', 'question title must render localized copy'],
  ['<Text style={styles.subtitle}>{copy.subtitle}</Text>', 'subtitle must render localized copy'],
  [
    '{copy.completedQuestions(completedQuestionIds.length)}',
    'completed-question metadata must render localized copy',
  ],
  [
    'accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}',
    'bookmark action must expose localized accessibility copy',
  ],
  [
    '{isBookmarked ? copy.bookmarked : copy.bookmark}',
    'bookmark action must render localized state copy',
  ],
  ['language={language}', 'practice answer components must receive the settings language'],
  [
    '{copy.scoreLabel}: {currentScore.correct}/{currentScore.total}',
    'score label must render localized copy',
  ],
  [
    'accessibilityLabel={copy.nextQuestionAccessibilityLabel}',
    'next-question action must expose localized accessibility copy',
  ],
  ['{copy.nextQuestion}', 'next-question action must render localized copy'],
  [
    'accessibilityLabel={copy.tryAgainAccessibilityLabel}',
    'try-again action must expose localized accessibility copy',
  ],
  ['{copy.tryAgain}', 'try-again action must render localized copy'],
];
const QUESTION_DISCLAIMER_USAGE_PATTERN = /<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/;
const EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS = {
  sv: [
    'innehåll planerat',
    '${completedCount} av ${questionCount} frågor besvarade',
    'Öppna kapitel ${primaryName}. Engelskt namn: ${secondaryName}. Framsteg: ${progressLabel}.',
  ],
  en: [
    'content queued',
    '${completedCount} of ${questionCount} questions practiced',
    'Open chapter ${primaryName}. Swedish name: ${secondaryName}. Progress: ${progressLabel}.',
  ],
};
const EXPECTED_LEARN_ROUTE_LINK_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'learn route must import AppLanguage from settings'],
  ['type ChapterLinkCopy = {', 'learn route must define a typed chapter-link copy contract'],
  [
    'const chapterLinkCopy: Record<AppLanguage, ChapterLinkCopy> = {',
    'learn route chapter-link copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'learn route must read language from settings store',
  ],
  [
    'const copy = chapterLinkCopy[language];',
    'learn route must select chapter-link copy from settings language',
  ],
  [
    'questionCount > 0 ? copy.progressLabel(completedCount, questionCount) : copy.contentQueued',
    'learn route must choose localized progress or queued copy',
  ],
  [
    "const primaryName = language === 'en' ? nameEn : nameSv;",
    'learn route must choose the selected-language chapter name first',
  ],
  [
    "const secondaryName = language === 'en' ? nameSv : nameEn;",
    'learn route must keep the opposite-language chapter name as secondary context',
  ],
  [
    'return copy.accessibilityLabel({ primaryName, secondaryName, progressLabel });',
    'learn route must build chapter link accessibility labels from localized copy',
  ],
  [
    'accessibilityLabel={getChapterLinkAccessibilityLabel({',
    'learn route chapter links must expose localized accessibility labels',
  ],
  ['copy,', 'learn route chapter links must pass localized copy into the label helper'],
  ['language={language}', 'learn route chapter cards must receive the settings language'],
];
const EXPECTED_PROFILE_ROUTE_COPY_LABELS = {
  sv: [
    'Lokal profil',
    'Framsteg utan konto',
    'Dina mål, språkval, sviter och märken sparas på den här enheten för privat studierutin.',
    'nivå',
    'XP',
    'dagars svit',
    'klara',
    'frågor',
    'Studieinställningar',
    'Små dagliga mål är lättare att hålla än långa maratonpass.',
    'svar/dag',
    'Svenska',
    'Märken',
    'Milstolpar gör framsteg synliga utan att störa lärandet.',
    'Inga märken ännu',
    'Öppna inställningar',
  ],
  en: [
    'Local profile',
    'Progress without an account',
    'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    'level',
    'XP',
    'day streak',
    'completed',
    'questions',
    'Study setup',
    'Small daily goals are easier to keep than long cram sessions.',
    'answers/day',
    'English support',
    'Badges',
    'Achievement cues make progress visible without distracting from learning.',
    'No badges yet',
    'Open settings',
  ],
};
const EXPECTED_PROFILE_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'profile route must import AppLanguage from settings'],
  ['BadgeRow', 'profile route must render badge rows with descriptions'],
  [
    'deriveBadges, getBadgeDescription, getBadgeTitle',
    'profile route must import localized badge helpers',
  ],
  ['type ProfileCopy = {', 'profile route must define a typed copy contract'],
  [
    'const profileCopy: Record<AppLanguage, ProfileCopy> = {',
    'profile route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'profile route must read language from settings store',
  ],
  ['const copy = profileCopy[language];', 'profile route must select copy from settings language'],
  [
    '<ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>',
    'profile shell must render localized copy',
  ],
  ['label={copy.levelMetric}', 'profile level metric must render localized copy'],
  ['label={copy.xpMetric}', 'profile XP metric must render localized copy'],
  ['label={copy.dayStreakMetric}', 'profile streak metric must render localized copy'],
  ['label={copy.completedMetric}', 'profile completed metric must render localized copy'],
  ['helper={copy.questionsHelper}', 'profile questions helper must render localized copy'],
  ['title={copy.studySetupTitle}', 'profile study setup title must render localized copy'],
  ['subtitle={copy.studySetupSubtitle}', 'profile study setup subtitle must render localized copy'],
  ['{dailyGoalAnswers} {copy.answersPerDay}', 'profile daily goal badge must localize'],
  ['<Badge tone="warm">{copy.languageBadge}</Badge>', 'profile language badge must localize'],
  ['title={copy.badgesTitle}', 'profile badges title must render localized copy'],
  ['subtitle={copy.badgesSubtitle}', 'profile badges subtitle must render localized copy'],
  ['const title = getBadgeTitle(badge, language);', 'profile badge title must use catalog locale'],
  [
    'const description = getBadgeDescription(badge, language);',
    'profile badge description must use catalog locale',
  ],
  [
    '<BadgeRow key={badge.id} title={title} description={description} />',
    'profile badge section must render individual localized rows',
  ],
  [
    '<Text style={styles.emptyBadgeText}>{copy.noBadges}</Text>',
    'profile empty badge copy must localize',
  ],
  [
    'accessibilityLabel={copy.openSettingsAccessibilityLabel}',
    'profile settings link must expose localized accessibility copy',
  ],
  ['{copy.openSettings}', 'profile settings link must render localized copy'],
  ['language={language}', 'profile premium banner must receive the settings language'],
];
const EXPECTED_HOME_ROUTE_COPY_LABELS = {
  sv: [
    'Studieöversikt',
    'Studera lugnt, ett samhällsbegrepp i taget',
    'En tydlig väg för svenska samhällskunskaper: dagliga svar, realistiska prov, repetition av misstag och källstödda förklaringar.',
    'Dagens mål',
    'Redoindikator',
    'redo',
    'Öva mer först',
    'På rätt väg',
    'Nästan redo',
    'Stark förberedelse',
    'Bygger på dina svar hittills. Svara på fler frågor för en säkrare signal.',
    '${accuracyPercent} % rätt · ${coveragePercent} % av kapitlen provade',
    'Redoindikator: ${score} procent. ${verdict}. ${details}',
    'Starta ett mockprov för att kontrollera din redoindikator',
    'Gör ett mockprov',
    'Repetera svaga kapitel',
    'Starta en 5-minutersövning',
    'Starta den rekommenderade övningen',
    'Starta övning',
    'Bläddra bland alla samhällskapitel',
    'Bläddra bland kapitel',
    'nivå',
    'XP-baserad',
    'dagars svit',
    'daglig vana',
    'svaga kapitel',
    'behöver repetition',
    'frågor',
    '${count} kapitel',
    'Fokuserad repetition',
    'Håll koll på det som behöver övas',
    'Sparade och missade frågor samlas på ett ställe, med källstödda förklaringar och utan annonser i provläget.',
    'Hela banken gratis',
    'Alla 13 ämnen och hela frågebanken ingår gratis. Betala bara om du vill ta bort annonser från studieskärmar.',
    'Granska bokmärkta eller missade frågor',
    'Repetera sparade frågor',
    'Optimerat studieflöde',
    'Lärdomar från framgångsrika samhällsprovs- och språkstudieappar: ett tydligt nästa steg, direkt återkoppling och synliga framsteg.',
    'Börja med kort ämnesövning, tydliga sviter, XP, märken och väg tillbaka efter misstag.',
    'Visa behärskning per område så att eleven ser vad som är klart, repeterat eller fortfarande svagt.',
    'Kombinera realistiska tidsatta prov med flashcards, bokmärken, felspårning, ljud, offline-studier och tydliga redo-signaler.',
    'Ge en snabb första vinst, en självklar nästa handling och varsam daglig vanefeedback utan att hindra seriösa studier.',
  ],
  en: [
    'Study dashboard',
    'Prepare calmly, one civic concept at a time',
    'A focused path for Swedish civic knowledge: daily answers, realistic mock exams, mistake review, and source-backed explanations.',
    "Today's goal",
    'Readiness indicator',
    'ready',
    'Keep practicing first',
    'Getting there',
    'Almost ready',
    'Strong preparation',
    'Based on your answers so far. Answer more questions for a steadier signal.',
    '${accuracyPercent}% accuracy · ${coveragePercent}% chapters tried',
    'Readiness indicator: ${score} percent. ${verdict}. ${details}',
    'Start a mock exam to check your readiness indicator',
    'Take a mock exam',
    'Review weak chapters',
    'Start a 5-minute practice set',
    'Start the recommended practice session',
    'Start practice',
    'Browse all civic chapters',
    'Browse chapters',
    'level',
    'XP-based',
    'day streak',
    'daily habit',
    'weak chapters',
    'needs review',
    'questions',
    '${count} chapters',
    'Focused review',
    'Keep track of what needs review',
    'Saved and missed questions stay in one place, with source-backed explanations and no ads in exam mode.',
    'Full bank free',
    'All 13 topics and the full question bank are included for free. Pay only if you want to remove ads from study screens.',
    'Review bookmarked or missed questions',
    'Review saved questions',
    'Optimized study loop',
    'Borrowed from successful civic-test and language-learning products: one clear next step, instant feedback, and visible progress.',
    'Lead with bite-sized topic practice, visible streaks, XP, badges, and mistake recovery.',
    'Show mastery by skill area so learners know what is ready, reviewed, or still weak.',
    'Combine realistic timed exams with flashcards, bookmarks, wrong-answer tracking, audio, offline study, and readiness indicators.',
    'Give a fast first win, one obvious next action, and gentle daily habit feedback without blocking serious study.',
  ],
};
const EXPECTED_HOME_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'home route must import AppLanguage from settings'],
  ['type HomeCopy = {', 'home route must define a typed copy contract'],
  [
    'const homeCopy: Record<AppLanguage, HomeCopy> = {',
    'home route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'home route must read language from settings store',
  ],
  ['const copy = homeCopy[language];', 'home route must select copy from settings language'],
  [
    'const nextAction = weakChapterCount > 0 ? copy.reviewWeakChapters : copy.startPracticeSet;',
    'home route next action must use localized copy',
  ],
  [
    'computeReadinessFromQuestionProgress({',
    'home route must derive the readiness indicator from stored progress',
  ],
  [
    'const mockExamSessions = useProgressStore((state) => state.mockExamSessions);',
    'home route must read persisted mock exam scores',
  ],
  ['mockExamSessions,', 'home route must feed persisted mock exam scores into readiness'],
  [
    'const readinessVerdict = copy.readinessVerdicts[readiness.verdict];',
    'home route readiness verdict must use localized copy',
  ],
  [
    'accessibilityLabel={readinessAccessibilityLabel}',
    'home route readiness card must expose localized accessibility copy',
  ],
  ['href="/exam"', 'home route readiness CTA must link to the mock exam flow'],
  ['eyebrow={copy.eyebrow}', 'home route eyebrow must render localized copy'],
  ['title={copy.title}', 'home route title must render localized copy'],
  ['subtitle={copy.subtitle}', 'home route subtitle must render localized copy'],
  ['{copy.dailyGoalTitle}', 'home daily goal title must render localized copy'],
  [
    'accessibilityLabel={copy.startPracticeAccessibilityLabel}',
    'home practice link must expose localized accessibility copy',
  ],
  ['{copy.startPractice}', 'home practice link must render localized copy'],
  [
    'accessibilityLabel={copy.browseChaptersAccessibilityLabel}',
    'home chapter link must expose localized accessibility copy',
  ],
  ['{copy.browseChapters}', 'home chapter link must render localized copy'],
  ['label={copy.levelMetric}', 'home level metric must render localized copy'],
  ['helper={copy.xpBasedHelper}', 'home XP helper must render localized copy'],
  ['label={copy.dayStreakMetric}', 'home streak metric must render localized copy'],
  ['helper={copy.dayStreakHelper}', 'home streak helper must render localized copy'],
  ['label={copy.weakChaptersMetric}', 'home weak-chapter metric must render localized copy'],
  ['helper={copy.weakChaptersHelper}', 'home weak-chapter helper must render localized copy'],
  ['label={copy.questionsMetric}', 'home question metric must render localized copy'],
  [
    'helper={copy.questionsHelper(chapters.length)}',
    'home question helper must render localized copy',
  ],
  ['<Badge tone="blue">{copy.feedbackBadge}</Badge>', 'home feedback badge must localize'],
  ['{copy.feedbackTitle}', 'home feedback title must render localized copy'],
  [
    '<Text style={styles.feedbackText}>{copy.feedbackText}</Text>',
    'home feedback body must localize',
  ],
  ['<Badge tone="blue">{copy.freeBankBadge}</Badge>', 'home free-bank badge must localize'],
  [
    '<Text style={styles.freeBankText}>{copy.freeBankText}</Text>',
    'home free-bank value prop must render localized copy',
  ],
  [
    'accessibilityLabel={copy.feedbackLinkAccessibilityLabel}',
    'home feedback link must expose localized accessibility copy',
  ],
  ['{copy.feedbackLink}', 'home feedback link must render localized copy'],
  ['title={copy.studyLoopTitle}', 'home study-loop title must render localized copy'],
  ['subtitle={copy.studyLoopSubtitle}', 'home study-loop subtitle must render localized copy'],
  [
    '{copy.benchmarkLessons[item.product]}',
    'home study-loop benchmark lessons must render localized copy',
  ],
];
const EXPECTED_MISTAKES_ROUTE_COPY_LABELS = {
  sv: [
    'Smart repetition',
    'Sparat',
    'Sparad för fokuserad repetition',
    'Bokmärkta frågor',
    'Rätt svar',
    'Öva svåra frågor',
    'Starta övning',
    'Svara fel på en övningsfråga så visas den här.',
    'Inga misstag ännu',
    'Fellogg',
    'Fel svar att repetera',
    'Ditt senaste felaktiga svar',
    'Gå igenom fel svar med fråga, förklaring, källreferens och repetitionsantal på samma plats.',
    'Misstag',
    'Fel svar: ${count}',
  ],
  en: [
    'Smart review',
    'Saved list',
    'Saved for focused review',
    'Bookmarked questions',
    'Correct answer',
    'Practice weak questions',
    'Start practice',
    'Answer a practice question incorrectly and it will appear here.',
    'No mistakes yet',
    'Mistake log',
    'Wrong answers to revisit',
    'Your latest wrong answer',
    'Review wrong answers with the question, explanation, source reference, and repetition count in one place.',
    'Mistakes',
    'Wrong answers: ${count}',
  ],
};
const EXPECTED_MISTAKES_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'mistakes route must import AppLanguage from settings'],
  ['type MistakesCopy = {', 'mistakes route must define a typed copy contract'],
  [
    'const mistakesCopy: Record<AppLanguage, MistakesCopy> = {',
    'mistakes route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'mistakes route must read language from settings store',
  ],
  [
    'const copy = mistakesCopy[language];',
    'mistakes route must select copy from settings language',
  ],
  ['<Badge tone="orange">{copy.badge}</Badge>', 'mistakes badge must render localized copy'],
  ['{copy.title}', 'mistakes title must render localized copy'],
  [
    '<Text style={styles.subtitle}>{copy.subtitle}</Text>',
    'mistakes subtitle must render localized copy',
  ],
  [
    '<Badge tone="blue">{copy.bookmarkedBadge}</Badge>',
    'bookmarked badge must render localized copy',
  ],
  ['{copy.bookmarkedTitle}', 'bookmarked title must render localized copy'],
  ['{copy.bookmarkedMeta}', 'bookmarked metadata must render localized copy'],
  ['<Badge tone="orange">{copy.mistakeBadge}</Badge>', 'mistake badge must render localized copy'],
  ['{copy.mistakeTitle}', 'mistake title must render localized copy'],
  [
    '{copy.wrongAnswers(questionProgress[question.id]?.wrongCount ?? 0)}',
    'wrong-count metadata must render localized copy',
  ],
  ['useMistakeReviewStore', 'mistakes route must read stored wrong-answer review text'],
  ['{copy.selectedWrongAnswerLabel}', 'selected wrong-answer label must render localized copy'],
  ['{copy.correctAnswerLabel}', 'correct-answer label must render localized copy'],
  [
    'accessibilityLabel={copy.answerReviewAccessibilityLabel(',
    'answer review must expose localized accessibility summary',
  ],
  ['{copy.emptyTitle}', 'empty title must render localized copy'],
  [
    '<Text style={styles.emptyText}>{copy.emptyText}</Text>',
    'empty text must render localized copy',
  ],
  [
    'accessibilityLabel={copy.emptyPracticeAccessibilityLabel}',
    'empty practice link must expose localized accessibility copy',
  ],
  ['{copy.emptyPracticeLink}', 'empty practice link must render localized copy'],
];
const EXPECTED_DAILY_GOAL_OPTIONS = [5, 10, 20, 40];
const EXPECTED_DAILY_GOAL_DEFAULT = 10;
const EXPECTED_DAILY_GOAL_MIN = 1;
const EXPECTED_DAILY_GOAL_MAX = 50;
const EXPECTED_AUDIO_SETTING_KEY = 'audioEnabled';
const EXPECTED_AUDIO_LABELS = ['Audio enabled', 'Audio disabled'];
const EXPECTED_AUDIO_ACCESSIBILITY_LABELS = ['Disable audio', 'Enable audio'];
const EXPECTED_SPEECH_RUNTIME_CASES = 4;
const EXPECTED_SWEDISH_SPEECH_LANGUAGE = 'sv-SE';
const EXPECTED_SETTINGS_STORE_FIELDS = [
  { name: 'language', type: 'AppLanguage', optional: false },
  { name: 'audioEnabled', type: 'boolean', optional: false },
  { name: 'dailyGoalAnswers', type: 'number', optional: false },
  { name: 'includeSupplementaryQuestions', type: 'boolean', optional: false },
  { name: 'hasSeenAboutTheTest', type: 'boolean', optional: false },
  { name: 'setLanguage', type: '(language: AppLanguage) => void', optional: false },
  { name: 'setAudioEnabled', type: '(enabled: boolean) => void', optional: false },
  { name: 'setDailyGoalAnswers', type: '(answerCount: number) => void', optional: false },
  { name: 'setIncludeSupplementaryQuestions', type: '(include: boolean) => void', optional: false },
  { name: 'markAboutTheTestSeen', type: '() => void', optional: false },
];
const EXPECTED_APP_CONFIG_PLUGINS = [
  'expo-router',
  'react-native-google-mobile-ads',
  'expo-secure-store',
  'react-native-iap',
  'expo-tracking-transparency',
];
const EXPECTED_APP_NATIVE_IDENTIFIER = 'com.billyyiu.swedishcivictest';
const EXPECTED_TRACKING_PERMISSION =
  'This identifier may be used to deliver relevant study app ads after consent.';
const EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES = [
  '/exam',
  '/practice',
  '/quiz',
  '/disclaimer',
  '/about-the-test',
  '/onboarding',
  '/privacy',
  '/sources',
  '/support',
  '/terms',
];
const EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTE_FILES = {
  '/exam': 'app/(tabs)/exam.tsx',
  '/practice': 'app/(tabs)/practice.tsx',
  '/quiz': 'app/quiz/[sessionId].tsx',
  '/disclaimer': 'app/disclaimer.tsx',
  '/about-the-test': 'app/about-the-test.tsx',
  '/onboarding': 'app/onboarding.tsx',
  '/privacy': 'app/privacy.tsx',
  '/sources': 'app/sources.tsx',
  '/support': 'app/support.tsx',
  '/terms': 'app/terms.tsx',
};
const EXPECTED_TAB_NAVIGATION_ROUTES = [
  { routeName: 'home', sv: 'Hem', en: 'Home' },
  { routeName: 'learn', sv: 'Lär dig', en: 'Learn' },
  { routeName: 'practice', sv: 'Öva', en: 'Practice' },
  { routeName: 'exam', sv: 'Prov', en: 'Exam' },
  { routeName: 'mistakes', sv: 'Misstag', en: 'Mistakes' },
  { routeName: 'profile', sv: 'Profil', en: 'Profile' },
];
const EXPECTED_TAB_NAVIGATION_RULES = [
  {
    label: 'settings language import',
    pattern:
      /import \{ useSettingsStore, type AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'tab route-name union',
    pattern:
      /type TabRouteName = 'home' \| 'learn' \| 'practice' \| 'exam' \| 'mistakes' \| 'profile';/,
  },
  {
    label: 'tab title copy contract',
    pattern: /type TabTitleCopy = Record<TabRouteName, string>;/,
  },
  {
    label: 'localized tab copy map',
    pattern: /const tabTitleCopy: Record<AppLanguage, TabTitleCopy> = \{/,
  },
  {
    label: 'hidden icon helper',
    pattern: /const hiddenTabIcon = \(\) => null;/,
  },
  {
    label: 'tab options helper',
    pattern: /function getTabOptions\(title: string\)/,
  },
  {
    label: 'plain tab title',
    pattern: /title,/,
  },
  {
    label: 'plain tab accessible name',
    pattern: /tabBarAccessibilityLabel: title/,
  },
  {
    label: 'placeholder glyph suppression',
    pattern: /tabBarIcon: hiddenTabIcon/,
  },
  {
    label: 'settings language read',
    pattern: /useSettingsStore\(\(state\) => state\.language\)/,
  },
  {
    label: 'selected tab copy',
    pattern: /const copy = tabTitleCopy\[language\];/,
  },
];
const EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS = [
  'adSupportedByDefault',
  'adMobAppRecordRequired',
  'appAdsTxtReviewRequired',
  'consentPromptsRequired',
  'noAdPlacements',
  'privacyReviewRequiresBinary',
  'realAdsEnvFlag',
  'removeAdsPriceLabel',
  'removeAdsProductId',
  'storeDisclosureTopics',
];
const EXPECTED_RELEASE_CONSENT_PROMPTS = ['app_tracking_transparency', 'ump_consent_form'];
const EXPECTED_RELEASE_NO_AD_PLACEMENTS = ['exam_screen'];
const EXPECTED_RELEASE_STORE_DISCLOSURE_TOPICS = [
  'Google Mobile Ads',
  'Remove Ads in-app purchase',
  'App Tracking Transparency',
  'Google UMP consent',
];
const EXPECTED_RELEASE_REAL_ADS_ENV_FLAG = 'EXPO_PUBLIC_REAL_ADS_ENABLED';
const EXPECTED_ROUTE_AD_PLACEMENTS = [
  {
    file: 'app/(tabs)/home.tsx',
    component: 'AdBanner',
    placement: 'home_banner',
    pattern:
      /<AdBanner\s+entitlements=\{monetizationEntitlements\}\s+placement="home_banner"\s+\/>/,
  },
  {
    file: 'app/(tabs)/learn.tsx',
    component: 'AdBanner',
    placement: 'chapter_list_banner',
    pattern: /<AdBanner\s+placement="chapter_list_banner"\s+\/>/,
  },
  {
    file: 'app/(tabs)/practice.tsx',
    component: 'AdBanner',
    placement: 'quiz_completed_interstitial',
    pattern: /<AdBanner\s+placement="quiz_completed_interstitial"\s+\/>/,
  },
  {
    file: 'app/(tabs)/mistakes.tsx',
    component: 'NativeAdCard',
    placement: 'results_native',
    pattern: /<NativeAdCard\s+\/>/,
  },
];
const EXPECTED_NO_AD_ROUTE_FILES = ['app/(tabs)/exam.tsx'];
const EXPECTED_REMOVE_ADS_HOOK_CASES = 5;
const EXPECTED_REMOVE_ADS_PURCHASE_RUNTIME_CASES = 15;
const EXPECTED_MOBILE_ADS_CONSENT_HOOK_CASES = 5;
const EXPECTED_EXAM_ROUTE_HEADERS = [
  {
    label: 'mock exam title',
    pattern: /\{copy\.mockExamTitle\}/,
    styleName: 'title',
    occurrences: 2,
  },
  {
    label: 'exam result title',
    pattern: /\{copy\.examResultTitle\}/,
    styleName: 'title',
    occurrences: 1,
  },
  {
    label: 'exam access title',
    pattern: /\{copy\.accessTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'next exam title',
    pattern: /\{copy\.nextExamTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'chapter breakdown title',
    pattern: /\{copy\.chapterBreakdownTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'question review title',
    pattern: /\{copy\.questionReviewTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'progress title',
    pattern: /\{copy\.progressTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
];
const EXPECTED_EXAM_ROUTE_COPY_LABELS = {
  sv: [
    'Övningsprov',
    'Tidsgräns ${durationMinutes} minuter · ${questionCount} UHR-baserade frågor · inga annonser under provet',
    'Tid kvar ${remainingTime} · ${questionCount} UHR-baserade frågor · inga annonser under provet',
    'Provåtkomst',
    'Kontrollerar provåtkomst.',
    'Dagens kostnadsfria övningsprov är tillgängligt.',
    'Starta övningsprov',
    'Lås upp extra prov',
    'Starta upplåst extra prov',
    'Framsteg',
    '${answeredCount}/${questionCount} besvarade',
    'Välj svaret ${optionText} för fråga ${questionNumber}',
    'Skicka övningsprov',
    'Skicka prov',
    'Provresultat',
    'Övningsresultat',
    'Kapitelöversikt',
    'Frågegenomgång',
    'Fråga ${questionNumber}',
    'Valt svar',
    'Rätt svar',
    'Granska',
    'Rätt',
    'Skickade resultat är slutgiltiga. Starta ett nytt övningsprov för ett nytt försök.',
    'Förklaringar och genomgång visas först efter att provet har skickats in.',
    'Nästa prov',
    'Sparat',
    'Sparar',
  ],
  en: [
    'Mock exam',
    'Time limit ${durationMinutes} minutes · ${questionCount} UHR-based questions · no ads during exam',
    'Time left ${remainingTime} · ${questionCount} UHR-based questions · no ads during exam',
    'Exam access',
    'Checking mock exam access.',
    'Daily free mock exam available.',
    'Start mock exam',
    'Unlock extra exam',
    'Start unlocked extra exam',
    'Progress',
    '${answeredCount}/${questionCount} answered',
    'Select answer ${optionText} for question ${questionNumber}',
    'Submit mock exam',
    'Submit exam',
    'Exam result',
    'Mock exam result',
    'Chapter breakdown',
    'Question review',
    'Question ${questionNumber}',
    'Selected answer',
    'Correct answer',
    'Review',
    'Correct',
    'Submitted results are final. Start another mock exam for a fresh attempt.',
    'Explanations and review are shown only after the exam is submitted.',
    'Next exam',
    'Saved',
    'Saving',
  ],
};
const EXPECTED_EXAM_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'exam route must import AppLanguage from settings'],
  ['type ExamRouteCopy = {', 'exam route must define a typed copy contract'],
  [
    'const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = {',
    'exam route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'exam route must read language from settings store',
  ],
  ['const copy = examRouteCopy[language];', 'exam route must select copy from settings language'],
  ['{copy.mockExamTitle}', 'exam route title must render localized copy'],
  [
    '{copy.heroSubtitle(defaultMockExamConfig.durationMinutes, examQuestions.length)}',
    'exam route hero subtitle must render localized copy',
  ],
  [
    '{copy.activeHeroSubtitle(formatExamTime(remainingSeconds), examQuestions.length)}',
    'active exam hero subtitle must render localized copy',
  ],
  [
    '{copy.answeredCount(answeredCount, examQuestions.length)}',
    'exam progress count must render localized copy',
  ],
  [
    'accessibilityLabel={copy.answerAccessibilityLabel(optionText, index + 1)}',
    'exam answers must expose localized accessibility labels',
  ],
  [
    'accessibilityLabel={copy.submitAccessibilityLabel}',
    'exam submit control must expose localized accessibility labels',
  ],
  ['{copy.submitLabel}', 'exam submit control must render localized copy'],
  [
    "language === 'en' ? chapter.chapterNameEn : chapter.chapterNameSv",
    'exam chapter breakdown must use selected-language chapter names',
  ],
  ['{copy.questionReviewTitle}', 'exam review title must render localized copy'],
  ['{copy.selectedAnswerLabel}', 'exam selected-answer label must render localized copy'],
  ['{copy.correctAnswerLabel}', 'exam correct-answer label must render localized copy'],
  ['ExplanationPanel', 'exam review must render the localized explanation panel'],
  ['language={language}', 'exam review components must receive settings language'],
  ['<UHRReferenceCard language={language}', 'exam UHR references must receive settings language'],
];
const EXPECTED_QUIZ_ROUTE_HEADERS = [
  {
    label: 'empty quiz title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.emptyTitle\}\s*<\/Text>/,
  },
  {
    label: 'session title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.sessionTitle\(normalizedSessionId\)\}\s*<\/Text>/,
  },
];
const EXPECTED_QUIZ_ROUTE_COPY_LABELS = {
  sv: [
    'Tillbaka till övning',
    'Quizpass',
    'Det finns inga quizfrågor ännu.',
    'Poäng',
    'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.',
    'Quizpass ${currentSessionId}',
    'Försök igen',
    'Försök igen med den här quizfrågan',
  ],
  en: [
    'Back to Practice',
    'Quiz session',
    'No quiz questions are available yet.',
    'Score',
    'Answer the routed question, then review the source-backed feedback.',
    'Session ${currentSessionId}',
    'Try again',
    'Try this quiz question again',
  ],
};
const EXPECTED_QUIZ_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'quiz route must import AppLanguage from settings'],
  ['type QuizSessionCopy = {', 'quiz route must define a typed copy contract'],
  [
    'const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = {',
    'quiz route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'quiz route must read language from settings store',
  ],
  ['const copy = quizSessionCopy[language];', 'quiz route must select copy from settings language'],
  [
    '<QuestionDisclaimer language={language} />',
    'routed quiz disclaimer must receive settings language',
  ],
  [
    '<QuestionCard question={question} language={language} />',
    'quiz question card must receive settings language',
  ],
  [
    '<AudioButton\n        enabled={audioEnabled}\n        language={language}',
    'quiz audio button must receive settings language',
  ],
  ['<AnswerOption', 'quiz route must render shared answer options'],
  ['language={language}', 'quiz answer components must receive settings language'],
  [
    '{copy.scoreLabel}: {score.correct}/{score.total}',
    'quiz score label must render localized copy',
  ],
  ['<ExplanationPanel', 'quiz route must render the localized explanation panel'],
  ['<UHRReferenceCard language={language}', 'quiz UHR references must receive settings language'],
  [
    'accessibilityLabel={copy.tryAgainAccessibilityLabel}',
    'quiz try-again action must expose localized accessibility copy',
  ],
  ['{copy.tryAgain}', 'quiz try-again action must render localized copy'],
  [
    'accessibilityLabel={copy.backToPracticeAccessibilityLabel}',
    'quiz back-to-practice link must expose localized accessibility copy',
  ],
  ['{copy.backToPractice}', 'quiz back-to-practice link must render localized copy'],
];
const EXPECTED_PRACTICE_ROUTE_HEADERS = [
  {
    label: 'practice question title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.questionTitle\(questionNumber\)\}\s*<\/Text>/,
  },
];
const EXPECTED_CHAPTER_ROUTE_COPY_LABELS = {
  sv: [
    'Tillbaka till kapitellistan',
    'Tillbaka till studievägen',
    'Frågor för det här kapitlet har inte lagts till ännu.',
    'Kapitlet hittades inte',
    'Övningsfrågor (${count})',
    'Starta quiz',
    'Starta quiz för ${chapterTitle}',
  ],
  en: [
    'Back to chapter list',
    'Back to Learn',
    'Questions for this chapter are not added yet.',
    'Chapter not found',
    'Practice questions (${count})',
    'Start quiz',
    'Start quiz for ${chapterTitle}',
  ],
};
const EXPECTED_CHAPTER_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'chapter route must import AppLanguage from settings'],
  ['type ChapterRouteCopy = {', 'chapter route must define a typed copy contract'],
  [
    'const chapterRouteCopy: Record<AppLanguage, ChapterRouteCopy> = {',
    'chapter route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'chapter route must read language from settings store',
  ],
  [
    'const copy = chapterRouteCopy[language];',
    'chapter route must select copy from settings language',
  ],
  [
    'chapterDescription: (chapter) => chapter.descriptionSv',
    'chapter route Swedish copy must use the Swedish chapter description',
  ],
  [
    'chapterDescription: (chapter) => chapter.descriptionEn',
    'chapter route English copy must use the English chapter description',
  ],
  [
    'chapterSubtitle: (chapter) => chapter.nameEn',
    'chapter route Swedish copy must expose the English chapter subtitle',
  ],
  [
    'chapterSubtitle: (chapter) => chapter.nameSv',
    'chapter route English copy must expose the Swedish chapter subtitle',
  ],
  [
    'chapterTitle: (chapter) => chapter.nameSv',
    'chapter route Swedish copy must use Swedish chapter titles',
  ],
  [
    'chapterTitle: (chapter) => chapter.nameEn',
    'chapter route English copy must use English chapter titles',
  ],
  ['const chapterTitle = copy.chapterTitle(chapter);', 'chapter title must resolve from copy'],
  [
    'accessibilityLabel={copy.backToListAccessibilityLabel}',
    'chapter route back link must expose localized accessibility copy',
  ],
  ['{copy.backToLearn}', 'chapter route back link must render localized copy'],
  ['{chapterTitle}', 'chapter route title must render localized chapter copy'],
  ['{copy.chapterSubtitle(chapter)}', 'chapter route subtitle must render localized copy'],
  ['{copy.chapterDescription(chapter)}', 'chapter route description must render localized copy'],
  [
    'accessibilityLabel={copy.startQuizAccessibilityLabel(chapterTitle)}',
    'chapter route quiz link must expose localized accessibility copy',
  ],
  ['{copy.startQuiz}', 'chapter route quiz link must render localized copy'],
  [
    '{copy.practiceQuestionsTitle(chapterQuestions.length)}',
    'chapter route section title must render localized copy',
  ],
  ['{copy.emptyQuestions}', 'chapter route empty state must render localized copy'],
  [
    'UHRReferenceCard language={language}',
    'chapter route UHR cards must receive settings language',
  ],
];
const EXPECTED_CHAPTER_ROUTE_HEADERS = [
  {
    label: 'missing chapter title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.missingTitle\}\s*<\/Text>/,
  },
  {
    label: 'chapter title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{chapterTitle\}\s*<\/Text>/,
  },
  {
    label: 'practice questions section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.practiceQuestionsTitle\(chapterQuestions\.length\)\}\s*<\/Text>/,
  },
];
const EXPECTED_LEARN_ROUTE_HEADERS = [
  {
    label: 'learn route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{routeCopy\.title\}/,
  },
  {
    label: 'chapter-list section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{routeCopy\.sectionTitle\}/,
  },
];
const EXPECTED_PROFILE_ROUTE_HEADERS = [
  {
    label: 'profile route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{copy\.title\}/,
  },
  {
    label: 'study setup section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.studySetupTitle\}/,
  },
  {
    label: 'badges section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.badgesTitle\}/,
  },
];
const EXPECTED_HOME_ROUTE_HEADERS = [
  {
    label: 'home route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{copy\.title\}/,
  },
  {
    label: 'daily goal card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.goalLabel\}>\s*\{copy\.dailyGoalTitle\}\s*<\/Text>/,
  },
  {
    label: 'readiness card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.readinessTitle\}>\s*\{copy\.readinessTitle\}\s*<\/Text>/,
  },
  {
    label: 'feedback card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.feedbackTitle\}>\s*\{copy\.feedbackTitle\}\s*<\/Text>/,
  },
  {
    label: 'study-loop section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.studyLoopTitle\}/,
  },
];
const EXPECTED_MISTAKES_ROUTE_HEADERS = [
  {
    label: 'mistakes route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
  {
    label: 'bookmarked questions section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.bookmarkedTitle\}\s*<\/Text>/,
  },
  {
    label: 'wrong answers section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.mistakeTitle\}\s*<\/Text>/,
  },
  {
    label: 'empty-state title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.emptyTitle\}>\s*\{copy\.emptyTitle\}\s*<\/Text>/,
  },
];
const EXPECTED_LEGAL_ROUTE_HEADERS = [
  {
    file: 'app/disclaimer.tsx',
    requiredSnippets: [
      'const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = disclaimerCopy[language];',
      'Ansvarsfriskrivning',
      'Oberoende studieverktyg',
      'Disclaimer',
      'Independent study tool',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.practiceContent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Disclaimer',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Independent study tool', 'Practice content', 'Use with source material'],
  },
  {
    file: 'app/privacy.tsx',
    requiredSnippets: [
      'const privacyCopy: Record<AppLanguage, PrivacyRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = privacyCopy[language];',
      'Integritetspolicy',
      'Inget konto krävs',
      'Privacy policy',
      'No account required',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.noAccountRequired\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.localProgressStorage\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adsAndPurchases\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adConsent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.providerProcessing\.title\}>/,
    ],
    title: 'Privacy policy',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'No account required',
      'Local progress storage',
      'Ads and purchases',
      'Ad consent',
      'Provider processing',
    ],
  },
  {
    file: 'app/terms.tsx',
    requiredSnippets: [
      'const termsCopy: Record<AppLanguage, TermsRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = termsCopy[language];',
      'Användarvillkor',
      'Studieändamål',
      'Terms of use',
      'Study purpose',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.studyPurpose\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noGuarantee\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Terms of use',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Study purpose', 'No guarantee', 'Respect source material'],
  },
  {
    file: 'app/sources.tsx',
    requiredSnippets: [
      'const sourcesCopy: Record<AppLanguage, SourcesRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = sourcesCopy[language];',
      'Källor',
      'Primärt studiematerial',
      'Sources',
      'Primary study material',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.primaryStudyMaterial\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.questionReferences\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.authorityBoundaries\.title\}>/,
    ],
    title: 'Sources',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Primary study material', 'Question references', 'Authority boundaries'],
  },
  {
    file: 'app/support.tsx',
    requiredSnippets: [
      'const supportCopy: Record<AppLanguage, SupportRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = supportCopy[language];',
      'Support och återkoppling',
      'Vad du kan rapportera',
      'Support and feedback',
      'What to report',
      'Öppna den offentliga supportsidan',
      'Open public support page',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.whatToReport\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noPersonalData\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.publicSupportPage\.title\}>/,
    ],
    title: 'Support and feedback',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'What to report',
      'No personal data',
      'Independent study tool',
      'Public support page',
    ],
  },
];
const EXPECTED_SETTINGS_ROUTE_HEADERS = [
  {
    label: 'settings route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
  {
    label: 'question language section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.questionLanguageTitle\}\s*<\/Text>/,
  },
  {
    label: 'audio section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.audioTitle\}\s*<\/Text>/,
  },
  {
    label: 'daily goal section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.dailyGoalTitle\}\s*<\/Text>/,
  },
];
const EXPECTED_SETTINGS_ROUTE_COPY_LABELS = {
  sv: [
    'Ljud avstängt',
    'Ljud på',
    'Ljud',
    '← Tillbaka till profil',
    'Tillbaka till profil',
    '${answerCount} svar per dag',
    'Dagligt mål',
    'Stäng av ljud',
    'Slå på ljud',
    'Byt frågespråk till ${label}',
    'Frågespråk',
    'Ställ in dagligt mål till ${goal} svar',
    'Styr studiespråk, ljud och ditt dagliga mål.',
    'Inställningar',
    'Svenska',
    'Engelskt stöd',
  ],
  en: [
    'Audio disabled',
    'Audio enabled',
    'Audio',
    '← Back to Profile',
    'Back to profile',
    '${answerCount} answers per day',
    'Daily goal',
    'Disable audio',
    'Enable audio',
    'Set question language to ${label}',
    'Question language',
    'Set daily goal to ${goal} answers',
    'Control study language, audio, and your daily goal.',
    'Settings',
    'Swedish',
    'English support',
  ],
};
const EXPECTED_SETTINGS_ROUTE_COPY_SNIPPETS = [
  ['import type { AppLanguage }', 'settings route must import AppLanguage'],
  ['type SettingsCopy = {', 'settings route must define a typed copy contract'],
  [
    'const settingsCopy: Record<AppLanguage, SettingsCopy> = {',
    'settings route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'settings route must read language from settings store',
  ],
  [
    'const copy = settingsCopy[language];',
    'settings route must select copy from settings language',
  ],
  [
    "const label = language === 'sv' ? labelSv : labelEn;",
    'settings route language buttons must choose visible labels from settings language',
  ],
  [
    "renderLanguageButton('sv', 'Swedish', 'Svenska')",
    'settings route must provide localized Swedish-language button labels',
  ],
  [
    "renderLanguageButton('en', 'English support', 'Engelskt stöd')",
    'settings route must provide localized English-support button labels',
  ],
  [
    'accessibilityLabel={copy.backToProfileAccessibilityLabel}',
    'settings back link must expose localized accessibility copy',
  ],
  ['{copy.backToProfile}', 'settings back link must render localized copy'],
  ['{copy.title}', 'settings title must render localized copy'],
  ['{copy.subtitle}', 'settings subtitle must render localized copy'],
  ['{copy.questionLanguageTitle}', 'settings language section must render localized copy'],
  [
    'accessibilityLabel={copy.languageAccessibilityLabel(label)}',
    'settings language buttons must expose localized accessibility copy',
  ],
  ['{copy.audioTitle}', 'settings audio section must render localized copy'],
  [
    'audioEnabled ? copy.disableAudioAccessibilityLabel : copy.enableAudioAccessibilityLabel',
    'settings audio switch must expose localized accessibility copy',
  ],
  [
    '{audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel}',
    'settings audio switch must render localized state copy',
  ],
  ['{copy.dailyGoalTitle}', 'settings daily-goal section must render localized copy'],
  [
    '{copy.dailyGoalSummary(dailyGoalAnswers)}',
    'settings daily-goal summary must render localized copy',
  ],
  [
    'accessibilityLabel={copy.setDailyGoalAccessibilityLabel(goal)}',
    'settings daily-goal buttons must expose localized accessibility copy',
  ],
];
const EXPECTED_ONBOARDING_ROUTE_HEADERS = [
  {
    label: 'onboarding route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
];
const EXPECTED_ONBOARDING_ROUTE_COPY_LABELS = {
  sv: [
    'Justera inställningar',
    'Öppna inställningar',
    'Välkommen',
    'Börja studera',
    'Studera svenska samhällsbegrepp med engelskt stöd vid behov.',
    'Öva med UHR-refererade frågor och förklaringar.',
    'Alla 13 ämnen och hela frågebanken ingår gratis.',
    'Följ framsteg lokalt på din enhet utan konto.',
    'En liten, fristående studiekompis för daglig övning, provträning och repetition av misstag.',
    'Förbered dig lugnt för samhällskunskapsprovet',
  ],
  en: [
    'Adjust settings',
    'Welcome',
    'Start studying',
    'Study Swedish civic concepts with English support when needed.',
    'Practice with UHR-referenced questions and explanations.',
    'All 13 topics and the full question bank are included for free.',
    'Track progress locally on your device without an account.',
    'A small, independent study companion for daily practice, mock exams, and mistake review.',
    'Prepare calmly for the civic test',
  ],
};
const EXPECTED_ONBOARDING_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'onboarding route must import AppLanguage from settings'],
  ['type OnboardingCopy = {', 'onboarding route must define a typed copy contract'],
  [
    'const onboardingCopy: Record<AppLanguage, OnboardingCopy> = {',
    'onboarding route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'onboarding route must read language from settings store',
  ],
  [
    'const copy = onboardingCopy[language];',
    'onboarding route must select copy from settings language',
  ],
  ['{copy.eyebrow}', 'onboarding eyebrow must render localized copy'],
  ['{copy.title}', 'onboarding title must render localized copy'],
  ['{copy.subtitle}', 'onboarding subtitle must render localized copy'],
  ['{copy.steps.map((step, index) => (', 'onboarding steps must render localized copy'],
  [
    'accessibilityLabel={copy.startStudyingAccessibilityLabel}',
    'onboarding start link must expose localized accessibility copy',
  ],
  ['{copy.startStudying}', 'onboarding start link must render localized copy'],
  [
    'accessibilityLabel={copy.adjustSettingsAccessibilityLabel}',
    'onboarding settings link must expose localized accessibility copy',
  ],
  ['{copy.adjustSettings}', 'onboarding settings link must render localized copy'],
];
const EXPECTED_SCREEN_SHELL_LAYOUT_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'page title header',
    pattern: /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/,
  },
  {
    label: 'section title header',
    pattern: /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/,
  },
  {
    label: 'content vertical gap',
    pattern: /content:\s*\{\s*gap:\s*space\[2\.25\],/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_SETTINGS_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ Pressable, ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'growing scroll content',
    pattern: /content:\s*\{\s*flexGrow:\s*1,/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'growing scroll content',
    pattern: /content:\s*\{\s*flexGrow:\s*1,/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_LEGAL_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
];
const EXPECTED_BUTTON_ACCESSIBILITY_RULES = [
  {
    label: 'native Pressable root',
    pattern: /<Pressable[\s\S]*>/,
  },
  {
    label: 'default button role',
    pattern: /accessibilityRole\s*=\s*'button'/,
  },
  {
    label: 'explicit state merge',
    pattern: /const mergedAccessibilityState = \{\s*\.\.\.accessibilityState,/,
  },
  {
    label: 'disabled prop merged into accessibility state',
    pattern: /\.\.\.\(disabled == null \? \{\} : \{ disabled \}\),/,
  },
  {
    label: 'plain child label fallback',
    pattern:
      /typeof children === 'string' \|\| typeof children === 'number' \? String\(children\) : undefined/,
  },
  {
    label: 'busy state mirrored to web aria',
    pattern: /aria-busy=\{mergedAccessibilityState\.busy === true\}/,
  },
  {
    label: 'checked state mirrored to web aria',
    pattern: /aria-checked=\{mergedAccessibilityState\.checked\}/,
  },
  {
    label: 'disabled state mirrored to web aria',
    pattern: /aria-disabled=\{mergedAccessibilityState\.disabled === true\}/,
  },
  {
    label: 'expanded state mirrored to web aria',
    pattern: /aria-expanded=\{mergedAccessibilityState\.expanded\}/,
  },
  {
    label: 'selected state mirrored to web aria',
    pattern: /aria-selected=\{mergedAccessibilityState\.selected\}/,
  },
  {
    label: 'label mirrored to web aria',
    pattern: /aria-label=\{buttonAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{buttonAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility role',
    pattern: /accessibilityRole=\{accessibilityRole\}/,
  },
  {
    label: 'native accessibility state',
    pattern: /accessibilityState=\{mergedAccessibilityState\}/,
  },
];
const EXPECTED_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'native View root',
    pattern: /<View[\s\S]*>/,
  },
  {
    label: 'explicit accessibility grouping prop',
    pattern: /accessible,/,
  },
  {
    label: 'label-or-role grouping fallback',
    pattern:
      /const groupedForAccessibility =\s*accessible \?\? Boolean\(accessibilityLabel \|\| accessibilityRole\);/,
  },
  {
    label: 'stable hint id',
    pattern: /const hintId = useId\(\);/,
  },
  {
    label: 'web-only hint id',
    pattern: /accessibilityHint && Platform\.OS === 'web'/,
  },
  {
    label: 'hint id prefix',
    pattern: /`card-hint-\$\{hintId\.replace\(\/:\/g, ''\)\}`/,
  },
  {
    label: 'hint mirrored to web aria-describedby',
    pattern: /aria-describedby=\{cardAccessibilityHintId\}/,
  },
  {
    label: 'label mirrored to web aria',
    pattern: /aria-label=\{accessibilityLabel\}/,
  },
  {
    label: 'native accessibility grouping',
    pattern: /accessible=\{groupedForAccessibility\}/,
  },
  {
    label: 'native accessibility hint',
    pattern: /accessibilityHint=\{accessibilityHint\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{accessibilityLabel\}/,
  },
  {
    label: 'native accessibility role',
    pattern: /accessibilityRole=\{accessibilityRole\}/,
  },
  {
    label: 'hidden hint text node',
    pattern:
      /<Text\s+nativeID=\{cardAccessibilityHintId\}\s+style=\{styles\.accessibilityHintText\}>/,
  },
  {
    label: 'visually hidden hint style',
    pattern:
      /accessibilityHintText:\s*\{\s*height:\s*1,[\s\S]*position:\s*'absolute',[\s\S]*width:\s*1,/,
  },
];
const EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES = [
  {
    label: 'settings language type import',
    pattern: /import type \{ AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'typed localized copy contract',
    pattern:
      /type ProgressBarCopy = \{\s*progressLabel: \(progressPercent: number\) => string;\s*\};/,
  },
  {
    label: 'localized progress copy',
    pattern:
      /const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = \{[\s\S]*sv:[\s\S]*`\$\{progressPercent\} procent klart`[\s\S]*en:[\s\S]*`\$\{progressPercent\} percent complete`/,
  },
  {
    label: 'clamped progress source',
    pattern: /const clampedProgress = Math\.max\(0, Math\.min\(1, progress\)\);/,
  },
  {
    label: 'percent value derived from clamped progress',
    pattern: /const progressPercent = Math\.round\(clampedProgress \* 100\);/,
  },
  {
    label: 'language copy selection',
    pattern: /const copy = progressBarCopy\[language\];/,
  },
  {
    label: 'readable localized progress label',
    pattern: /const progressAccessibilityLabel = copy\.progressLabel\(progressPercent\);/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'web aria max value',
    pattern: /aria-valuemax=\{100\}/,
  },
  {
    label: 'web aria min value',
    pattern: /aria-valuemin=\{0\}/,
  },
  {
    label: 'web aria current value',
    pattern: /aria-valuenow=\{progressPercent\}/,
  },
  {
    label: 'web aria localized value text',
    pattern: /aria-valuetext=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'native progressbar role',
    pattern: /accessibilityRole="progressbar"/,
  },
  {
    label: 'native clamped accessibility value',
    pattern:
      /accessibilityValue=\{\{[\s\S]*min:\s*0,\s*max:\s*100,\s*now:\s*progressPercent,\s*text:\s*progressAccessibilityLabel,?\s*\}\}/,
  },
  {
    label: 'animated fill uses clamped source',
    pattern: /new Animated\.Value\(clampedProgress\)/,
  },
  {
    label: 'visual fill uses percent interpolation bounds',
    pattern: /inputRange:\s*\[0, 1\],[\s\S]*outputRange:\s*\['0%', '100%'\]/,
  },
];
const EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'native View root',
    pattern: /<View[\s\S]*>/,
  },
  {
    label: 'explicit accessibility label prop',
    pattern: /accessibilityLabel\?: string;/,
  },
  {
    label: 'label value helper summary',
    pattern:
      /accessibilityLabel \?\? `\$\{label\}: \$\{value\}\$\{helper \? `\. \$\{helper\}` : ''\}`;/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{metricAccessibilityLabel\}/,
  },
  {
    label: 'native grouped surface',
    pattern: /\s+accessible\s+/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{metricAccessibilityLabel\}/,
  },
  {
    label: 'visible value text',
    pattern: /<Text\s+style=\{styles\.value\}>\{value\}<\/Text>/,
  },
  {
    label: 'visible label text',
    pattern: /<Text\s+style=\{styles\.label\}>\{label\}<\/Text>/,
  },
  {
    label: 'visible helper text',
    pattern: /\{helper \? <Text style=\{styles\.helper\}>\{helper\}<\/Text> : null\}/,
  },
  {
    label: 'blue tone style path',
    pattern: /style=\{\[styles\.card, tone === 'blue' \? styles\.blueCard : null\]\}/,
  },
];
const EXPECTED_BADGE_ACCESSIBILITY_RULES = [
  {
    label: 'explicit accessibility label prop',
    pattern: /accessibilityLabel\?: string;/,
  },
  {
    label: 'derived accessibility label variable',
    pattern: /const badgeAccessibilityLabel =/,
  },
  {
    label: 'explicit label override before child fallback',
    pattern:
      /accessibilityLabel \?\?\s*\(\s*typeof children === 'string' \|\| typeof children === 'number' \? String\(children\) : undefined\s*\)/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{badgeAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{badgeAccessibilityLabel\}/,
  },
  {
    label: 'tone style path',
    pattern: /style=\{\[styles\.badge, styles\[tone\]\]\}/,
  },
  {
    label: 'visible child text',
    pattern: /<Text[\s\S]*>\s*\{children\}\s*<\/Text>/,
  },
  {
    label: 'visual uppercase transform',
    pattern: /textTransform:\s*'uppercase'/,
  },
];
const EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'settings language type import',
    pattern: /import type \{ AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'localized ChapterCard copy contract',
    pattern: /type ChapterCardCopy = \{/,
  },
  {
    label: 'localized ChapterCard copy map',
    pattern: /const chapterCardCopy: Record<AppLanguage, ChapterCardCopy> = \{/,
  },
  {
    label: 'settings language prop default',
    pattern: /language = 'sv'/,
  },
  {
    label: 'settings language copy selection',
    pattern: /const copy = chapterCardCopy\[language\];/,
  },
  {
    label: 'optional Chapter prop contract',
    pattern: /chapter\?: Chapter;/,
  },
  {
    label: 'optional language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'Swedish practiced status copy',
    pattern: /\$\{completedCount\}\/\$\{questionCount\} besvarade/,
  },
  {
    label: 'English practiced status copy',
    pattern: /\$\{completedCount\}\/\$\{questionCount\} practiced/,
  },
  {
    label: 'content-queued status fallback',
    pattern:
      /const status =[\s\S]*questionCount > 0 \? copy\.practicedStatus\(completedCount, questionCount\) : copy\.contentQueued;/,
  },
  {
    label: 'selected-language chapter title',
    pattern: /language === 'en'\s*\?\s*chapter\.nameEn\s*:\s*chapter\.nameSv/,
  },
  {
    label: 'opposite-language secondary name',
    pattern:
      /const secondaryName = chapter \? \(language === 'en' \? chapter\.nameSv : chapter\.nameEn\) : null;/,
  },
  {
    label: 'selected-language description',
    pattern: /language === 'en'\s*\?\s*chapter\.descriptionEn\s*:\s*chapter\.descriptionSv/,
  },
  {
    label: 'chapter accessibility summary variable',
    pattern: /const chapterAccessibilityLabel =/,
  },
  {
    label: 'selected title in accessibility summary',
    pattern: /copy\.accessibilityLabel\.chapter\(title\)/,
  },
  {
    label: 'secondary title in accessibility summary',
    pattern: /secondaryName \? copy\.accessibilityLabel\.secondaryName\(secondaryName\) : null/,
  },
  {
    label: 'progress status in accessibility summary',
    pattern: /copy\.accessibilityLabel\.status\(status\)/,
  },
  {
    label: 'description in accessibility summary',
    pattern: /description \? copy\.accessibilityLabel\.description\(description\) : null/,
  },
  {
    label: 'Card receives chapter accessibility summary',
    pattern:
      /<Card accessibilityLabel=\{chapterAccessibilityLabel\} elevated style=\{styles\.card\}>/,
  },
  {
    label: 'visible chapter title',
    pattern: /<Text style=\{styles\.title\}>\{title\}<\/Text>/,
  },
  {
    label: 'visible secondary chapter name',
    pattern: /<Text style=\{styles\.subtitle\}>\{secondaryName\}<\/Text>/,
  },
  {
    label: 'visible selected-language description',
    pattern: /<Text style=\{styles\.description\}>\{description\}<\/Text>/,
  },
  {
    label: 'visible progress bar',
    pattern: /<ProgressBar language=\{language\} progress=\{progress\} \/>/,
  },
];
const EXPECTED_FLASHCARD_ACCESSIBILITY_RULES = [
  {
    label: 'optional front/back/language prop contract',
    pattern:
      /type FlashcardProps = \{ front\?: string; back\?: string; language\?: AppLanguage \};/,
  },
  {
    label: 'settings language import',
    pattern: /useSettingsStore, type AppLanguage/,
  },
  {
    label: 'localized copy map',
    pattern: /const flashcardCopy: Record<AppLanguage, FlashcardCopy> = \{/,
  },
  {
    label: 'selected settings language fallback',
    pattern:
      /const settingsLanguage = useSettingsStore\(\(state\) => state\.language\);[\s\S]*const copy = flashcardCopy\[language \?\? settingsLanguage\];/,
  },
  {
    label: 'release-safe Swedish fallbacks',
    pattern: /fallbackPrompt: 'Studiefråga saknas'[\s\S]*fallbackAnswer: 'Svar saknas'/,
  },
  {
    label: 'release-safe English fallbacks',
    pattern:
      /fallbackPrompt: 'Study prompt unavailable'[\s\S]*fallbackAnswer: 'Answer unavailable'/,
  },
  {
    label: 'trimmed text helper',
    pattern: /function cleanText\(value: string \| undefined, fallback: string\): string/,
  },
  {
    label: 'prompt derived through fallback helper',
    pattern: /const prompt = cleanText\(front, copy\.fallbackPrompt\);/,
  },
  {
    label: 'answer derived through fallback helper',
    pattern: /const answer = cleanText\(back, copy\.fallbackAnswer\);/,
  },
  {
    label: 'localized accessibility summary helper',
    pattern: /const flashcardAccessibilityLabel = copy\.accessibilityLabel\(prompt, answer\);/,
  },
  {
    label: 'prompt and answer accessibility summary',
    pattern: /<Card accessibilityLabel=\{flashcardAccessibilityLabel\} style=\{styles\.card\}>/,
  },
  {
    label: 'visible localized flashcard badge',
    pattern: /<Badge tone="warm">\{copy\.badgeLabel\}<\/Badge>/,
  },
  {
    label: 'localized prompt header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.label\}>[\s\S]*\{copy\.promptHeader\}[\s\S]*<\/Text>/,
  },
  {
    label: 'localized answer header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.label\}>[\s\S]*\{copy\.answerHeader\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible prompt and answer text',
    pattern:
      /<Text style=\{styles\.prompt\}>\{prompt\}<\/Text>[\s\S]*<Text style=\{styles\.answer\}>\{answer\}<\/Text>/,
  },
];
const EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES = [
  {
    label: 'shared Button import',
    pattern: /import \{ Button \} from '\.\.\/ui\/Button';/,
  },
  {
    label: 'speech runtime imports',
    pattern: /import \{ speakSwedish, stopSpeech \} from '\.\.\/\.\.\/lib\/audio\/speak';/,
  },
  {
    label: 'optional text, enabled, and language prop contract',
    pattern:
      /enabled = true,[\s\S]*language = 'sv'[\s\S]*text = ''[\s\S]*enabled\?: boolean;[\s\S]*language\?: AppLanguage;[\s\S]*text\?: string/,
  },
  {
    label: 'trimmed speech text source',
    pattern: /const speechText = text\.trim\(\);/,
  },
  {
    label: 'nonblank speech text guard',
    pattern: /const hasSpeechText = speechText\.length > 0;/,
  },
  {
    label: 'enabled plus text playback guard',
    pattern: /const canPlayAudio = enabled && hasSpeechText;/,
  },
  {
    label: 'localized state-specific visible labels',
    pattern:
      /const audioButtonCopy: Record<AppLanguage, AudioButtonCopy> = \{[\s\S]*disabledLabel: 'Ljud är avstängt'[\s\S]*enabledLabel: 'Lyssna på den svenska frågan och svaren'[\s\S]*unavailableLabel: 'Ljud saknas för den här frågan'[\s\S]*disabledLabel: 'Audio is disabled'[\s\S]*enabledLabel: 'Listen to the Swedish question and answers'[\s\S]*unavailableLabel: 'Audio is unavailable for this question'/,
  },
  {
    label: 'accessibility label follows localized visible label',
    pattern: /const accessibilityLabel = label;/,
  },
  {
    label: 'localized state-specific accessibility hint',
    pattern:
      /disabledHint: 'Aktivera ljud i Inställningar för att höra svensk text\.'[\s\S]*enabledHint: 'Spelar upp den svenska frågan och svarsalternativen\.'[\s\S]*unavailableHint: 'Ljud behöver svensk frågetext före uppspelning\.'[\s\S]*disabledHint: 'Enable audio in Settings to hear Swedish text\.'[\s\S]*enabledHint: 'Plays the Swedish question and answer options aloud\.'[\s\S]*unavailableHint: 'Audio needs Swedish question text before playback\.'/,
  },
  {
    label: 'native button accessibility wiring',
    pattern:
      /<Button[\s\S]*accessibilityHint=\{accessibilityHint\}[\s\S]*accessibilityLabel=\{accessibilityLabel\}[\s\S]*accessibilityRole="button"/,
  },
  {
    label: 'disabled accessibility state follows playback guard',
    pattern: /accessibilityState=\{\{ disabled: !canPlayAudio \}\}/,
  },
  {
    label: 'disabled interaction follows playback guard',
    pattern: /disabled=\{!canPlayAudio\}/,
  },
  {
    label: 'trimmed speech playback',
    pattern: /if \(!canPlayAudio\) return;[\s\S]*stopSpeech\(\);[\s\S]*speakSwedish\(speechText\);/,
  },
];
const EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'PracticeQuestion prop contract',
    pattern: /language\?: AppLanguage;[\s\S]*question\?: PracticeQuestion;/,
  },
  {
    label: 'difficulty fallback',
    pattern: /const difficulty = question\?\.difficulty \?\? 'practice';/,
  },
  {
    label: 'localized difficulty value copy',
    pattern:
      /difficultyValueLabels: Record<PracticeQuestion\['difficulty'\] \| 'practice', string>[\s\S]*easy: 'Lätt'[\s\S]*medium: 'Medel'[\s\S]*hard: 'Svår'[\s\S]*practice: 'Övning'[\s\S]*easy: 'Easy'[\s\S]*medium: 'Medium'[\s\S]*hard: 'Hard'[\s\S]*practice: 'Practice'/,
  },
  {
    label: 'localized difficulty value selection',
    pattern: /const difficultyLabel = copy\.difficultyValueLabels\[difficulty\];/,
  },
  {
    label: 'display-safe language-aware question text fallback',
    pattern: /const questionText = getQuestionDisplayText\(question, language\);/,
  },
  {
    label: 'source citation helper',
    pattern: /const sourceCitation = getQuestionSourceCitation\(question, language\);/,
  },
  {
    label: 'localized accessibility prefix copy and difficulty summary',
    pattern:
      /difficultyLabel: 'Svårighetsgrad'[\s\S]*questionLabel: 'Fråga'[\s\S]*secondaryLabel: 'Engelsk översättning'[\s\S]*sourceCitationLabel: 'Källhänvisning'[\s\S]*difficultyLabel: 'Difficulty'[\s\S]*questionLabel: 'Question'[\s\S]*secondaryLabel: 'Swedish original'[\s\S]*sourceCitationLabel: 'Source citation'[\s\S]*\$\{copy\.difficultyLabel\}: \$\{difficultyLabel\}/,
  },
  {
    label: 'selected language question in accessibility summary',
    pattern: /\$\{copy\.questionLabel\}: \$\{questionText\}/,
  },
  {
    label: 'display-safe secondary language text in accessibility summary',
    pattern:
      /questionTranslation \? `\$\{copy\.secondaryLabel\}: \$\{questionTranslation\}` : null/,
  },
  {
    label: 'source citation in accessibility summary',
    pattern: /\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}/,
  },
  {
    label: 'Card receives accessibility summary',
    pattern: /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/,
  },
  {
    label: 'visible difficulty label',
    pattern: /<Text style=\{styles\.label\}>\{difficultyLabel\}<\/Text>/,
  },
  {
    label: 'question header text',
    pattern: /<Text accessibilityRole="header" style=\{styles\.question\}>/,
  },
  {
    label: 'visible source citation line',
    pattern: /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/,
  },
  {
    label: 'visible display-safe English translation',
    pattern:
      /\{questionTranslation \? <Text style=\{styles\.translation\}>\{questionTranslation\}<\/Text> : null\}/,
  },
];
const EXPECTED_QUESTION_SOURCE_CITATION_RULES = [
  {
    label: 'localized question display fallback',
    pattern:
      /const QUESTION_DISPLAY_FALLBACKS: Record<QuestionTextLanguage, string> = \{[\s\S]*sv: 'Fråga saknas'[\s\S]*en: 'Question unavailable'[\s\S]*fallback = QUESTION_DISPLAY_FALLBACKS\[language\]/,
  },
  {
    label: 'language-aware source citation signature',
    pattern:
      /export function getQuestionSourceCitation\(\s*question\?: QuestionTextSource,\s*language: QuestionTextLanguage = 'sv',\s*\): string \{/,
  },
  {
    label: 'localized source citation prefixes and page labels',
    pattern:
      /language === 'en'\s*\?\s*`Source: Sverige i fokus, \$\{chapter\}, \$\{section\}, p\. \$\{pageApprox\}`\s*:\s*`Källa: Sverige i fokus, \$\{chapter\}, \$\{section\}, s\. \$\{pageApprox\}`/,
  },
];
const EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES = [
  {
    label: 'shared OptionCard import',
    pattern: /import \{ OptionCard \} from '\.\.\/OptionCard';/,
  },
  {
    label: 'OptionCard state type import',
    pattern: /import type \{ OptionCardState \} from '\.\.\/OptionCard';/,
  },
  {
    label: 'disabled prop',
    pattern: /disabled\?: boolean;/,
  },
  {
    label: 'selected prop',
    pattern: /selected\?: boolean;/,
  },
  {
    label: 'result label prop',
    pattern: /resultLabel\?: string;/,
  },
  {
    label: 'language-specific copy map',
    pattern: /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/,
  },
  {
    label: 'localized option state label contract',
    pattern: /stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;/,
  },
  {
    label: 'Swedish select-answer accessibility copy',
    pattern: /selectAccessibilityLabel: \(label\) => `Välj svaret \$\{label\}`/,
  },
  {
    label: 'English select-answer accessibility copy',
    pattern: /selectAccessibilityLabel: \(label\) => `Select answer \$\{label\}`/,
  },
  {
    label: 'language-specific option label',
    pattern: /const label = option \? getOptionLabel\(option, language\) : copy\.fallbackLabel;/,
  },
  {
    label: 'feedback-aware accessibility label',
    pattern:
      /const accessibilityLabel = resultLabel\s*\?\s*`\$\{label\}, \$\{resultLabel\}`\s*:\s*copy\.selectAccessibilityLabel\(label\);/,
  },
  {
    label: 'localized OptionCard state label selection',
    pattern: /const stateLabel = state === 'idle' \? undefined : copy\.stateLabels\[state\];/,
  },
  {
    label: 'selected and disabled state forwarding',
    pattern: /accessibilityState=\{\{ disabled, selected \}\}/,
  },
  {
    label: 'disabled interaction forwarding',
    pattern: /disabled=\{disabled\}/,
  },
  {
    label: 'feedback-aware visible label handoff',
    pattern: /resultLabel=\{resultLabel\}/,
  },
  {
    label: 'OptionCard state forwarding',
    pattern: /state=\{state\}/,
  },
  {
    label: 'OptionCard state label forwarding',
    pattern: /stateLabel=\{stateLabel\}/,
  },
  {
    label: 'tone-to-OptionCard state mapping',
    pattern:
      /function getOptionCardState\(tone: AnswerTone, selected: boolean\): OptionCardState \{\s*if \(tone !== 'idle'\) return tone;\s*return selected \? 'selected' : 'idle';\s*\}/,
  },
  {
    label: 'English and Swedish option label switch',
    pattern: /return language === 'en' \? option\.textEn : option\.textSv;/,
  },
];
const EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES = [
  {
    label: 'optional bilingual explanation props',
    pattern: /explanationEn\?: string;[\s\S]*explanationSv\?: string;/,
  },
  {
    label: 'language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'localized copy map',
    pattern: /const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy>/,
  },
  {
    label: 'release-safe Swedish fallback',
    pattern: /Förklaring saknas för den här frågan\./,
  },
  {
    label: 'release-safe English fallback',
    pattern: /Explanation unavailable for this question\./,
  },
  {
    label: 'language-specific explanation selection',
    pattern:
      /const explanation =[\s\S]*language === 'en' && explanationEn \? explanationEn : \(explanationSv \?\? copy\.fallback\);/,
  },
  {
    label: 'localized explanation in accessibility summary',
    pattern:
      /const panelAccessibilityLabel = `\$\{copy\.accessibilityLabelPrefix\}: \$\{explanation\}`;/,
  },
  {
    label: 'Card receives accessibility summary',
    pattern: /<Card accessibilityLabel=\{panelAccessibilityLabel\}>/,
  },
  {
    label: 'localized explanation header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.title\}>[\s\S]*\{copy\.title\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible selected explanation',
    pattern: /<Text style=\{styles\.body\}>\{explanation\}<\/Text>/,
  },
];
const EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'optional UHRReference prop contract',
    pattern: /reference\?: UHRReference/,
  },
  {
    label: 'language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'localized copy map',
    pattern: /const uhrReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy>/,
  },
  {
    label: 'chapter and section source label',
    pattern:
      /const label = reference\s*\?\s*`\$\{reference\.chapter\} · \$\{reference\.section\}`\s*:\s*copy\.unavailable;/,
  },
  {
    label: 'localized approximate page source label',
    pattern:
      /const pageLabel = reference\?\.pageApprox[\s\S]*\? `\$\{copy\.approximatePage\} \$\{reference\.pageApprox\}`[\s\S]*: null;/,
  },
  {
    label: 'localized page-aware accessibility label',
    pattern:
      /const referenceAccessibilityLabel = pageLabel[\s\S]*\? `\$\{copy\.accessibilityLabelPrefix\}: \$\{label\}\. \$\{pageLabel\}`[\s\S]*: `\$\{copy\.accessibilityLabelPrefix\}: \$\{label\}`;/,
  },
  {
    label: 'Card receives UHR accessibility label',
    pattern: /<Card accessibilityLabel=\{referenceAccessibilityLabel\}>/,
  },
  {
    label: 'localized UHR title header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.title\}>[\s\S]*\{copy\.title\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible chapter-section source label',
    pattern: /<Text style=\{styles\.body\}>\{label\}<\/Text>/,
  },
  {
    label: 'visible approximate page label',
    pattern: /\{pageLabel \? <Text style=\{styles\.meta\}>\{pageLabel\}<\/Text> : null\}/,
  },
];
const EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES = [
  {
    label: 'active prop contract',
    pattern: /active: boolean;/,
  },
  {
    label: 'inactive animation reset',
    pattern: /if \(!active\) \{\s*progress\.setValue\(0\);\s*return;\s*\}/,
  },
  {
    label: 'active animation restarts from zero',
    pattern: /progress\.setValue\(0\);\s*Animated\.timing\(progress,/,
  },
  {
    label: 'tokenized animation duration',
    pattern: /duration:\s*motion\.duration\.slow \* 2,/,
  },
  {
    label: 'standard easing path',
    pattern: /easing:\s*Easing\.out\(Easing\.cubic\),/,
  },
  {
    label: 'native-driver animation',
    pattern: /useNativeDriver:\s*true,/,
  },
  {
    label: 'inactive render returns null',
    pattern: /if \(!active\) return null;/,
  },
  {
    label: 'decorative animation hidden from accessibility tree',
    pattern: /accessibilityElementsHidden/,
  },
  {
    label: 'descendant accessibility hidden',
    pattern: /importantForAccessibility="no-hide-descendants"/,
  },
  {
    label: 'non-interactive pointer behavior',
    pattern: /pointerEvents="none"/,
  },
  {
    label: 'result pill remains visible',
    pattern: /<View style=\{styles\.pill\}>[\s\S]*<Text style=\{styles\.pillText\}>/,
  },
];
const EXPECTED_PREMIUM_ENTITLEMENT_STATES = [
  {
    exportName: 'FREE_ENTITLEMENTS',
    configKey: 'free',
    entitlements: {
      adsDisabled: false,
      unlimitedMockExams: false,
      fullMistakeReview: false,
    },
  },
  {
    exportName: 'PREMIUM_ENTITLEMENTS',
    configKey: 'premium',
    entitlements: {
      adsDisabled: true,
      unlimitedMockExams: true,
      fullMistakeReview: true,
    },
  },
  {
    exportName: 'REMOVE_ADS_ENTITLEMENTS',
    configKey: 'removeAds',
    entitlements: {
      adsDisabled: true,
      unlimitedMockExams: false,
      fullMistakeReview: false,
    },
  },
];
const EXPECTED_QUESTION_DISCLAIMER_ROUTES = [
  { route: '/onboarding', file: 'app/onboarding.tsx' },
  { route: '/practice', file: 'app/(tabs)/practice.tsx' },
  { route: '/exam', file: 'app/(tabs)/exam.tsx' },
  { route: '/mistakes', file: 'app/(tabs)/mistakes.tsx' },
  { route: '/chapter/[chapterId]', file: 'app/chapter/[chapterId].tsx' },
  { route: '/quiz/[sessionId]', file: 'app/quiz/[sessionId].tsx' },
];
const REQUIRED_QUESTION_DISCLAIMER_PHRASES = [
  'independent study tool',
  'not official',
  'affiliated with UHR',
  'UHR',
  'Swedish government',
  'not real exam questions',
];
const EXPECTED_THEME_COLOR_TOKENS = [
  'canvas',
  'surface',
  'surfaceWarm',
  'surfaceMuted',
  'text',
  'textSoft',
  'textSecondary',
  'textDisclaimer',
  'textMuted',
  'textPlaceholder',
  'warmDark',
  'accent',
  'accentActive',
  'focus',
  'focusSoft',
  'badgeBlueBg',
  'badgeBlueText',
  'border',
  'success',
  'successSoft',
  'correctBg',
  'warning',
  'warningSoft',
  'incorrectBg',
  'teal',
  'navy',
  'purple',
  'pink',
  'brown',
  'brandGoogleBlue',
  'brandGoogleGreen',
  'brandGoogleRed',
  'brandGoogleYellow',
  'brandFacebook',
  'brandWhite',
  'swedishBlue',
  'swedishGold',
];
const EXPECTED_THEME_SPACE_VALUES = {
  hairline: 2,
  micro: 3,
  0: 0,
  0.5: 4,
  0.625: 5,
  0.75: 6,
  0.875: 7,
  1: 8,
  1.25: 10,
  1.375: 11,
  1.5: 12,
  1.75: 14,
  2: 16,
  2.25: 18,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  12: 96,
  15: 120,
};
const EXPECTED_THEME_RADIUS_VALUES = {
  micro: 4,
  subtle: 5,
  small: 8,
  card: 12,
  large: 16,
  pill: 9999,
  circle: 9999,
};
const EXPECTED_THEME_TYPOGRAPHY_TOKENS = [
  'displayHero',
  'displaySecondary',
  'sectionHeading',
  'subHeadingLarge',
  'subHeading',
  'cardTitle',
  'bodyLarge',
  'heroMobile',
  'metric',
  'sectionTitle',
  'bodyTight',
  'finePrint',
  'disclaimer',
  'body',
  'bodyMedium',
  'bodySemibold',
  'bodyBold',
  'navButton',
  'caption',
  'captionLight',
  'badge',
  'micro',
];
const EXPECTED_THEME_SHADOW_TOKENS = ['card', 'deep'];
const EXPECTED_THEME_MOTION_DURATIONS = {
  fast: 120,
  base: 200,
  slow: 320,
};
const EXPECTED_THEME_MOTION_EASING = ['standard', 'press'];
const EXPECTED_PROGRESS_QUESTION_FIELDS = [
  'questionId',
  'seenCount',
  'correctCount',
  'wrongCount',
  'correctStreak',
  'lastAnsweredAt',
  'nextReviewAt',
  'bookmarked',
];
const EXPECTED_PROGRESS_OPTIONAL_FIELDS = new Set(['lastAnsweredAt', 'nextReviewAt', 'bookmarked']);
const EXPECTED_PROGRESS_QUESTION_FIELD_TYPES = {
  questionId: 'string',
  seenCount: 'number',
  correctCount: 'number',
  wrongCount: 'number',
  correctStreak: 'number',
  lastAnsweredAt: 'string',
  nextReviewAt: 'string',
  bookmarked: 'boolean',
};
const EXPECTED_PROGRESS_TYPE_UNIONS = [
  { typeName: 'QuizMode', values: ['study', 'exam', 'mistakes', 'challenge'] },
  { typeName: 'Confidence', values: ['low', 'medium', 'high'] },
];
const EXPECTED_PROGRESS_INTERFACES = [
  {
    name: 'UserQuestionProgress',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'seenCount', type: 'number', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'wrongCount', type: 'number', optional: false },
      { name: 'correctStreak', type: 'number', optional: false },
      { name: 'lastAnsweredAt', type: 'string', optional: true },
      { name: 'nextReviewAt', type: 'string', optional: true },
      { name: 'confidence', type: 'Confidence', optional: true },
      { name: 'bookmarked', type: 'boolean', optional: true },
    ],
  },
  {
    name: 'QuizAnswer',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'selectedOptionIds', type: 'string[]', optional: false },
      { name: 'isCorrect', type: 'boolean', optional: false },
      { name: 'answeredAt', type: 'string', optional: false },
      { name: 'timeSpentSeconds', type: 'number', optional: false },
    ],
  },
  {
    name: 'QuizSession',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'mode', type: 'QuizMode', optional: false },
      { name: 'questionIds', type: 'string[]', optional: false },
      { name: 'answers', type: 'QuizAnswer[]', optional: false },
      { name: 'startedAt', type: 'string', optional: false },
      { name: 'completedAt', type: 'string', optional: true },
      { name: 'score', type: 'number', optional: true },
    ],
  },
  {
    name: 'UserProgress',
    fields: [
      { name: 'totalXp', type: 'number', optional: false },
      { name: 'level', type: 'number', optional: false },
      { name: 'currentStreak', type: 'number', optional: false },
      { name: 'dailyGoalAnswers', type: 'number', optional: false },
      { name: 'questionProgress', type: 'Record<string, UserQuestionProgress>', optional: false },
      { name: 'sessions', type: 'QuizSession[]', optional: false },
    ],
  },
];
const EXPECTED_PROGRESS_STORE_FIELDS = [
  { name: 'completedQuestionIds', type: 'string[]', optional: false },
  { name: 'questionProgress', type: 'Record<string, QuestionProgress>', optional: false },
  { name: 'totalXp', type: 'number', optional: false },
  { name: 'answerDates', type: 'string[]', optional: false },
  { name: 'mockExamSessions', type: 'MockExamProgress[]', optional: false },
  { name: 'markQuestionCompleted', type: '(questionId: string) => void', optional: false },
  {
    name: 'recordAnswer',
    type: '(questionId: string, isCorrect: boolean) => void',
    optional: false,
  },
  {
    name: 'recordMockExamSession',
    type: '(session: MockExamProgressInput) => void',
    optional: false,
  },
  { name: 'toggleBookmark', type: '(questionId: string) => void', optional: false },
  { name: 'resetProgress', type: '() => void', optional: false },
];
const EXPECTED_PRACTICE_SESSION_STORE_FIELDS = [
  { name: 'activeQuestionId', type: 'string | null', optional: false },
  { name: 'selectedOptionId', type: 'string | null', optional: false },
  { name: 'shuffleSessionId', type: 'string', optional: false },
  { name: 'selectOption', type: '(questionId: string, optionId: string) => void', optional: false },
  { name: 'resetSelection', type: '() => void', optional: false },
  { name: 'advanceQuestion', type: '() => void', optional: false },
];
const EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS = [
  { typeName: 'AnswerOptionFeedbackTone', values: ['idle', 'correct', 'incorrect'] },
];
const EXPECTED_ANSWER_VALIDATION_INTERFACES = [
  {
    name: 'AnswerOptionFeedback',
    fields: [
      { name: 'resultLabel', type: 'string', optional: true },
      { name: 'tone', type: 'AnswerOptionFeedbackTone', optional: false },
    ],
  },
];
const EXPECTED_CONTENT_TYPE_UNIONS = [
  { typeName: 'ReviewStatus', values: REVIEW_STATUS_VALUES },
  { typeName: 'QuestionType', values: QUESTION_TYPE_VALUES },
  { typeName: 'Difficulty', values: DIFFICULTY_VALUES },
];
const EXPECTED_CONTENT_INTERFACES = [
  {
    name: 'UHRReference',
    fields: [
      { name: 'chapter', type: 'string', optional: false },
      { name: 'section', type: 'string', optional: false },
      { name: 'pageApprox', type: 'number', optional: false },
    ],
  },
  {
    name: 'QuestionOption',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'textSv', type: 'string', optional: false },
      { name: 'textEn', type: 'string', optional: false },
    ],
  },
  {
    name: 'PracticeQuestion',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'type', type: 'QuestionType', optional: false },
      { name: 'questionSv', type: 'string', optional: false },
      { name: 'questionEn', type: 'string', optional: false },
      { name: 'options', type: 'QuestionOption[]', optional: false },
      { name: 'correctOptionId', type: 'string', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'uhrReference', type: 'UHRReference', optional: false },
      { name: 'difficulty', type: 'Difficulty', optional: false },
      { name: 'reviewStatus', type: 'ReviewStatus', optional: false },
      { name: 'tags', type: 'string[]', optional: false },
    ],
  },
  {
    name: 'Chapter',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'nameSv', type: 'string', optional: false },
      { name: 'nameEn', type: 'string', optional: false },
      { name: 'descriptionSv', type: 'string', optional: false },
      { name: 'descriptionEn', type: 'string', optional: false },
      { name: 'questionCount', type: 'number', optional: false },
    ],
  },
  {
    name: 'GlossaryTerm',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'termSv', type: 'string', optional: false },
      { name: 'termEn', type: 'string', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: true },
    ],
  },
];
function expectedContentInterfaceKeys(interfaceName) {
  const interfaceSpec = EXPECTED_CONTENT_INTERFACES.find((spec) => spec.name === interfaceName);
  return interfaceSpec ? interfaceSpec.fields.map((field) => field.name) : [];
}
const EXPECTED_UHR_REFERENCE_KEYS = expectedContentInterfaceKeys('UHRReference');
const EXPECTED_QUESTION_OPTION_KEYS = expectedContentInterfaceKeys('QuestionOption');
const EXPECTED_PRACTICE_QUESTION_KEYS = expectedContentInterfaceKeys('PracticeQuestion');
const EXPECTED_CHAPTER_KEYS = expectedContentInterfaceKeys('Chapter');
const EXPECTED_GLOSSARY_TERM_KEYS = expectedContentInterfaceKeys('GlossaryTerm');
const EXPECTED_UHR_SECTION_MAP_KEYS = ['source', 'chapters'];
const EXPECTED_UHR_SECTION_MAP_SOURCE_KEYS = ['title', 'publisher', 'url', 'retrievedDate'];
const EXPECTED_UHR_SECTION_MAP_CHAPTER_KEYS = ['id', 'chapter', 'startPage', 'endPage', 'sections'];
const EXPECTED_MOCK_EXAM_CONFIG_FIELDS = [
  { name: 'questionCount', type: 'number', optional: false },
  { name: 'durationMinutes', type: 'number', optional: false },
  { name: 'sourceScope', type: "'uhr_based'", optional: false },
  { name: 'showExplanationsDuringExam', type: 'boolean', optional: false },
  { name: 'adsAllowedDuringExam', type: 'boolean', optional: false },
];
const EXPECTED_MOCK_EXAM_CONFIG_KEYS = EXPECTED_MOCK_EXAM_CONFIG_FIELDS.map((field) => field.name);
const EXPECTED_EXAM_GENERATOR_TYPE_ALIASES = [
  { typeName: 'ExamAnswerMap', type: 'Record<string, string>' },
];
const EXPECTED_EXAM_GENERATOR_INTERFACES = [
  {
    name: 'ExamOptions',
    fields: [
      { name: 'questionCount', type: 'number', optional: true },
      { name: 'sessionId', type: 'string', optional: true },
    ],
  },
  {
    name: 'ExamChapterResult',
    fields: [
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
    ],
  },
  {
    name: 'ExamResult',
    fields: [
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
      { name: 'percent', type: 'number', optional: false },
      { name: 'chapterBreakdown', type: 'ExamChapterResult[]', optional: false },
    ],
  },
  {
    name: 'ExamChapterBreakdownItem',
    fields: [
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
      { name: 'chapterNameSv', type: 'string', optional: false },
      { name: 'chapterNameEn', type: 'string', optional: false },
    ],
  },
  {
    name: 'ExamReviewItem',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'questionSv', type: 'string', optional: false },
      { name: 'questionEn', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'selectedOptionTextSv', type: 'string', optional: false },
      { name: 'selectedOptionTextEn', type: 'string', optional: false },
      { name: 'correctOptionTextSv', type: 'string', optional: false },
      { name: 'correctOptionTextEn', type: 'string', optional: false },
      { name: 'isCorrect', type: 'boolean', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'uhrReference', type: "PracticeQuestion['uhrReference']", optional: false },
    ],
  },
  {
    name: 'ExamAutoSubmitState',
    fields: [
      { name: 'remainingSeconds', type: 'number', optional: false },
      { name: 'submitted', type: 'boolean', optional: false },
      { name: 'questionCount', type: 'number', optional: false },
    ],
  },
];
const EXPECTED_MONETIZATION_TYPE_UNIONS = [
  {
    typeName: 'AdPlacement',
    values: [
      'home_banner',
      'chapter_list_banner',
      'quiz_completed_interstitial',
      'results_native',
      'rewarded_extra_exam',
      'app_open_launch',
    ],
  },
];
const EXPECTED_MONETIZATION_INTERFACES = [
  {
    name: 'AdUnitConfig',
    fields: [
      { name: 'placement', type: 'AdPlacement', optional: false },
      { name: 'iosUnitId', type: 'string', optional: true },
      { name: 'androidUnitId', type: 'string', optional: true },
      { name: 'enabled', type: 'boolean', optional: false },
      { name: 'testOnly', type: 'boolean', optional: false },
    ],
  },
  {
    name: 'PremiumEntitlements',
    fields: [
      { name: 'adsDisabled', type: 'boolean', optional: false },
      { name: 'unlimitedMockExams', type: 'boolean', optional: false },
      { name: 'fullMistakeReview', type: 'boolean', optional: false },
    ],
  },
  {
    name: 'MonetizationState',
    fields: [
      { name: 'premium', type: 'PremiumEntitlements', optional: false },
      { name: 'adUnits', type: 'AdUnitConfig[]', optional: false },
    ],
  },
];
const EXPECTED_PURCHASE_TYPE_UNIONS = [
  {
    typeName: 'RemoveAdsPurchaseStatus',
    values: ['purchased', 'pending', 'restored', 'not_found'],
  },
];
const EXPECTED_PURCHASE_INTERFACES = [
  {
    name: 'PurchaseStorage',
    fields: [
      { name: 'getItemAsync', type: '(key: string) => Promise<string | null>', optional: false },
      {
        name: 'setItemAsync',
        type: '(key: string, value: string) => Promise<void>',
        optional: false,
      },
      { name: 'deleteItemAsync', type: '(key: string) => Promise<void>', optional: true },
    ],
  },
  {
    name: 'RemoveAdsPurchaseRecord',
    fields: [
      { name: 'productId', type: 'string', optional: false },
      { name: 'purchaseToken', type: 'string | null', optional: true },
      { name: 'transactionId', type: 'string | null', optional: true },
      { name: 'raw', type: 'unknown', optional: true },
    ],
  },
  {
    name: 'RemoveAdsPurchaseProvider',
    fields: [
      { name: 'connect', type: '() => Promise<void>', optional: false },
      { name: 'disconnect', type: '() => Promise<void>', optional: true },
      {
        name: 'finishPurchase',
        type: '(purchase: RemoveAdsPurchaseRecord) => Promise<void>',
        optional: true,
      },
      {
        name: 'requestRemoveAdsPurchase',
        type: '(productId: string) => Promise<RemoveAdsPurchaseRecord | null>',
        optional: false,
      },
      {
        name: 'restorePurchases',
        type: '(productIds: readonly string[]) => Promise<RemoveAdsPurchaseRecord[]>',
        optional: false,
      },
    ],
  },
  {
    name: 'RemoveAdsPurchaseResult',
    fields: [
      { name: 'entitlements', type: 'PremiumEntitlements', optional: false },
      { name: 'priceLabel', type: 'typeof REMOVE_ADS_PRICE_LABEL', optional: false },
      { name: 'productId', type: 'typeof REMOVE_ADS_PRODUCT_ID', optional: false },
      { name: 'purchaseToken', type: 'string | null', optional: true },
      { name: 'status', type: 'RemoveAdsPurchaseStatus', optional: false },
      { name: 'transactionId', type: 'string | null', optional: true },
    ],
  },
  {
    name: 'PurchaseRuntimeOptions',
    fields: [
      { name: 'provider', type: 'RemoveAdsPurchaseProvider', optional: true },
      { name: 'storage', type: 'PurchaseStorage', optional: true },
    ],
  },
  {
    name: 'NativePurchaseProviderOptions',
    fields: [{ name: 'purchaseTimeoutMs', type: 'number', optional: true }],
  },
  {
    name: 'MockPurchaseProviderOptions',
    fields: [
      { name: 'owned', type: 'boolean', optional: true },
      { name: 'pendingPurchase', type: 'boolean', optional: true },
    ],
  },
];
const EXPECTED_AD_CONSENT_TYPE_UNIONS = [
  { typeName: 'AdConsentPlatform', values: ['android', 'ios', 'web', 'unknown'] },
  { typeName: 'AdConsentRegion', values: ['eea', 'uk', 'us', 'other', 'unknown'] },
  {
    typeName: 'AppTrackingTransparencyStatus',
    values: ['authorized', 'denied', 'not_determined', 'restricted', 'unavailable'],
  },
  {
    typeName: 'UmpConsentStatus',
    values: ['obtained', 'not_required', 'required', 'unknown'],
  },
  {
    typeName: 'AdConsentPrompt',
    values: ['app_tracking_transparency', 'ump_consent_form'],
  },
  {
    typeName: 'AdSdkInitializationBlockReason',
    values: [
      'google_ads_disabled',
      'remove_ads_entitlement',
      'pending_consent_prompts',
      'consent_required',
    ],
  },
];
const EXPECTED_AD_CONSENT_INTERFACES = [
  {
    name: 'AdConsentState',
    fields: [
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: false },
      { name: 'googleMobileAdsEnabled', type: 'boolean', optional: false },
      { name: 'platform', type: 'AdConsentPlatform', optional: false },
      { name: 'realAdsEnabled', type: 'boolean', optional: false },
      { name: 'region', type: 'AdConsentRegion', optional: false },
      {
        name: 'trackingTransparencyStatus',
        type: 'AppTrackingTransparencyStatus',
        optional: false,
      },
      { name: 'umpConsentStatus', type: 'UmpConsentStatus', optional: false },
    ],
  },
  {
    name: 'AdConsentDecision',
    fields: [
      { name: 'adServingAllowed', type: 'boolean', optional: false },
      { name: 'canRequestNonPersonalizedAds', type: 'boolean', optional: false },
      { name: 'canRequestPersonalizedAds', type: 'boolean', optional: false },
      { name: 'pendingPrompts', type: 'AdConsentPrompt[]', optional: false },
    ],
  },
  {
    name: 'AdSdkInitializationDecision',
    fields: [
      { name: 'blockReason', type: 'AdSdkInitializationBlockReason', optional: true },
      { name: 'canInitializeGoogleMobileAds', type: 'boolean', optional: false },
      { name: 'consentDecision', type: 'AdConsentDecision', optional: false },
      { name: 'requestNonPersonalizedAdsOnly', type: 'boolean', optional: false },
    ],
  },
];
const EXPECTED_MOBILE_ADS_CONSENT_INTERFACES = [
  {
    name: 'TrackingPermissionResult',
    fields: [
      { name: 'granted', type: 'boolean', optional: true },
      { name: 'status', type: 'string', optional: true },
    ],
  },
  {
    name: 'UmpConsentResult',
    fields: [
      { name: 'canRequestAds', type: 'boolean', optional: true },
      { name: 'status', type: 'string', optional: true },
    ],
  },
  {
    name: 'MobileAdsConsentRuntime',
    fields: [
      { name: 'getUmpConsentInfo', type: '() => Promise<UmpConsentResult>', optional: true },
      { name: 'gatherUmpConsent', type: '() => Promise<UmpConsentResult>', optional: true },
      {
        name: 'getTrackingPermissionsAsync',
        type: '() => Promise<TrackingPermissionResult>',
        optional: true,
      },
      { name: 'initializeGoogleMobileAds', type: '() => Promise<unknown>', optional: true },
      { name: 'platform', type: 'AdConsentPlatform | string', optional: false },
      {
        name: 'requestTrackingPermissionsAsync',
        type: '() => Promise<TrackingPermissionResult>',
        optional: true,
      },
    ],
  },
  {
    name: 'MobileAdsConsentOptions',
    fields: [
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: false },
      { name: 'googleMobileAdsEnabled', type: 'boolean', optional: true },
      { name: 'realAdsEnabled', type: 'boolean', optional: true },
      { name: 'region', type: 'AdConsentRegion', optional: true },
      { name: 'runtime', type: 'MobileAdsConsentRuntime', optional: false },
    ],
  },
  {
    name: 'MobileAdsConsentInitializationResult',
    fields: [
      { name: 'decision', type: 'AdSdkInitializationDecision', optional: false },
      { name: 'initialized', type: 'boolean', optional: false },
      { name: 'state', type: 'AdConsentState', optional: false },
    ],
  },
];
const EXPECTED_REWARDED_AD_TYPE_UNIONS = [
  {
    typeName: 'RewardedExtraExamAdStatus',
    values: [
      'closed_without_reward',
      'earned_reward',
      'failed_to_load',
      'show_failed',
      'timed_out',
      'unavailable',
    ],
  },
];
const EXPECTED_REWARDED_AD_INTERFACES = [
  {
    name: 'RewardedExtraExamReward',
    fields: [
      { name: 'amount', type: 'number', optional: false },
      { name: 'type', type: 'string', optional: false },
    ],
  },
  {
    name: 'RewardedExtraExamAdResult',
    fields: [
      { name: 'reward', type: 'RewardedExtraExamReward', optional: true },
      { name: 'status', type: 'RewardedExtraExamAdStatus', optional: false },
    ],
  },
  {
    name: 'RewardedExtraExamAdOptions',
    fields: [
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: true },
      { name: 'requestNonPersonalizedAdsOnly', type: 'boolean', optional: true },
      { name: 'timeoutMs', type: 'number', optional: true },
    ],
  },
];
const EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS = [
  {
    typeName: 'MockExamAccessReason',
    values: [
      'free_exam_available',
      'premium_unlimited_mock_exams',
      'rewarded_exam_credit',
      'rewarded_ad_available',
      'remove_ads_active',
      'consent_required',
      'ads_unavailable',
    ],
  },
];
const EXPECTED_MOCK_EXAM_ACCESS_INTERFACES = [
  {
    name: 'MockExamAccessState',
    fields: [
      { name: 'completedMockExamsToday', type: 'number', optional: false },
      {
        name: 'consentDecision',
        type: "Pick<AdConsentDecision, 'adServingAllowed'>",
        optional: true,
      },
      {
        name: 'entitlements',
        type: "Pick<PremiumEntitlements, 'adsDisabled' | 'unlimitedMockExams'>",
        optional: false,
      },
      { name: 'freeMockExamLimit', type: 'number', optional: false },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: true },
    ],
  },
  {
    name: 'MockExamAccessDecision',
    fields: [
      { name: 'canOfferRewardedAd', type: 'boolean', optional: false },
      { name: 'canStartExam', type: 'boolean', optional: false },
      { name: 'freeExamsRemaining', type: 'number', optional: false },
      { name: 'placement', type: 'typeof REWARDED_EXTRA_EXAM_PLACEMENT', optional: false },
      { name: 'reason', type: 'MockExamAccessReason', optional: false },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
    ],
  },
  {
    name: 'PersistedMockExamAccess',
    fields: [
      { name: 'completedMockExamsByDate', type: 'Record<string, number>', optional: false },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
    ],
  },
  {
    name: 'StoredMockExamAccessSnapshot',
    fields: [
      { name: 'completedMockExamsByDate', type: 'Record<string, number>', optional: false },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
      { name: 'completedMockExamsToday', type: 'number', optional: false },
      { name: 'dateKey', type: 'string', optional: false },
    ],
  },
  {
    name: 'MockExamAccessStorage',
    fields: [
      { name: 'deleteItemAsync', type: '(key: string) => Promise<void>', optional: true },
      { name: 'getItemAsync', type: '(key: string) => Promise<string | null>', optional: false },
      {
        name: 'setItemAsync',
        type: '(key: string, value: string) => Promise<void>',
        optional: false,
      },
    ],
  },
  {
    name: 'MockExamAccessStorageOptions',
    fields: [
      { name: 'date', type: 'Date | string', optional: true },
      { name: 'storage', type: 'MockExamAccessStorage', optional: false },
    ],
  },
];

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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request === 'expo-speech') {
      return speechMock;
    }
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      const relativeResolvedPath = path.relative(repoRoot, resolvedPath);
      return loadTs(relativeResolvedPath);
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function fail(message) {
  failures.push(message);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptionText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function textIsTrimmedSingleSpaced(value) {
  return typeof value === 'string' && value === normalizeOptionText(value);
}

function normalizeComparableText(value) {
  return normalizeOptionText(value).toLocaleLowerCase('sv-SE');
}

function bilingualTextPairsAreDistinct(question) {
  return (
    normalizeComparableText(question.questionSv) !== normalizeComparableText(question.questionEn) &&
    normalizeComparableText(question.explanationSv) !==
      normalizeComparableText(question.explanationEn)
  );
}

function optionTextPairIsTranslatedOrInvariant(option) {
  const textSv = normalizeComparableText(option?.textSv);
  const textEn = normalizeComparableText(option?.textEn);
  if (!textSv || !textEn || textSv !== textEn) return true;

  const wordCount = normalizeOptionText(option.textSv).split(/\s+/).length;
  return wordCount <= 2;
}

function optionBilingualTextPairsAreValid(question) {
  if (!Array.isArray(question.options)) return false;
  return question.options.every(optionTextPairIsTranslatedOrInvariant);
}

function questionTextFieldsAreNormalized(question) {
  const fields = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.uhrReference?.chapter,
    question.uhrReference?.section,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ];

  return fields.every(textIsTrimmedSingleSpaced);
}

function textHasSentenceEnding(value) {
  return typeof value === 'string' && /[.!?]$/.test(value.trim());
}

function questionSentenceEndingsAreComplete(question) {
  return ['questionSv', 'questionEn', 'explanationSv', 'explanationEn'].every((field) =>
    textHasSentenceEnding(question[field]),
  );
}

function findQuestionAuthorityOverclaim(question) {
  const text = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ].join(' ');

  return QUESTION_AUTHORITY_OVERCLAIM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionStemSourceAuthorityReference(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return QUESTION_STEM_SOURCE_AUTHORITY_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionNestedMetaStem(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return QUESTION_NESTED_META_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionJudgementMetaStem(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return QUESTION_JUDGEMENT_META_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionGeneratedTrueFalseNaturalnessIssue(question) {
  if (question.type !== 'true_false') return null;

  return QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function findQuestionTrueFalseStemPrefix(question) {
  if (question.type !== 'true_false') return null;

  return QUESTION_TRUE_FALSE_STEM_PREFIX_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function findAuthoredTrueFalseExplanationBoilerplate(question) {
  if (question.type !== 'true_false') return null;

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return AUTHORED_TRUE_FALSE_EXPLANATION_BOILERPLATE_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionFalseAnswerExplanationMismatch(question) {
  if (
    question.type !== 'true_false' ||
    question.correctOptionId !== 'false' ||
    !question.tags?.includes('false-statement')
  ) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return [
    /Därför\s+stämmer\s+alternativet\s+Sant/i,
    /alternativet\s+Sant\s+stämmer/i,
    /\b(?:makes|make)\s+True\s+correct\b/i,
    /\bTrue\s+is\s+correct\b/i,
  ].find((pattern) => pattern.test(text));
}

function findGeneratedTrueFalseExplanationMetaIssue(question) {
  if (question.type !== 'true_false' || !question.tags?.includes('published-variant')) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return GENERATED_TRUE_FALSE_EXPLANATION_META_PATTERNS.find((pattern) => pattern.test(text));
}

function findGeneratedOptionSourceMaterialIssue(question) {
  if (!Array.isArray(question.options)) return null;

  for (const [index, option] of question.options.entries()) {
    const text = [option?.textSv, option?.textEn].filter(Boolean).join(' ');
    const pattern = GENERATED_OPTION_SOURCE_MATERIAL_PATTERNS.find((candidate) =>
      candidate.test(text),
    );
    if (pattern) return { index, pattern };
  }

  return null;
}

function findGeneratedSingleChoiceFillerOptionIssue(question) {
  if (question.type !== 'single_choice' || !Array.isArray(question.options)) return null;

  for (const [index, option] of question.options.entries()) {
    const texts = [option?.textSv, option?.textEn].map(normalizeOptionText);
    const matchedText = texts.find((text) => GENERATED_SINGLE_CHOICE_FILLER_OPTION_TEXTS.has(text));
    if (matchedText) return { index, text: matchedText };
  }

  return null;
}

function findGeneratedSingleChoiceMetaStemIssue(question) {
  if (question.type !== 'single_choice') return null;

  return GENERATED_SINGLE_CHOICE_META_STEM_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function singleChoiceHasTrueFalseOptionLabels(question) {
  if (question.type !== 'single_choice' || !Array.isArray(question.options)) return false;

  const labels = new Set(
    question.options.flatMap((option) => [
      normalizeOptionText(option?.textSv),
      normalizeOptionText(option?.textEn),
    ]),
  );

  return labels.has('Sant') || labels.has('Falskt') || labels.has('True') || labels.has('False');
}

function findGeneratedSingleChoiceExplanationLabelIssue(question) {
  if (question.type !== 'single_choice' || singleChoiceHasTrueFalseOptionLabels(question)) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].filter(Boolean).join(' ');
  return GENERATED_SINGLE_CHOICE_ABSENT_TRUE_FALSE_EXPLANATION_PATTERNS.find((pattern) =>
    pattern.test(text),
  );
}

function isSlugTag(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSnakeCaseId(value) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function findDuplicateOptionTextLabels(question) {
  if (!Array.isArray(question.options)) return [];

  const duplicates = [];
  for (const field of ['textSv', 'textEn']) {
    const labels = new Set();
    question.options.forEach((option) => {
      const label = normalizeOptionText(option?.[field]);
      if (!label) return;
      if (labels.has(label)) duplicates.push({ field, label });
      labels.add(label);
    });
  }
  return duplicates;
}

function optionCountMatchesQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  if (question.type === 'single_choice') return question.options.length === 4;
  if (question.type === 'true_false') return question.options.length === 2;
  return [2, 4].includes(question.options.length);
}

function arrayEquals(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectedGeneratedTags(sourceQuestion, convention) {
  return [
    ...new Set([...sourceQuestion.tags, 'published-variant', convention?.tag].filter(Boolean)),
  ];
}

function answerLabel(option) {
  return `${option.textSv}`.replace(/[.!?]\s*$/, '');
}
function answerTextEn(option) {
  return `${option.textEn}`.replace(/[.!?]\s*$/, '');
}
function stripFinalPunctuation(value) {
  return value.trim().replace(/[.!?]\s*$/, '');
}
function ensureSentence(value) {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
function lowerFirst(value) {
  if (/^EU\b/.test(value)) return value;
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}
function upperFirst(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}
function lowerLeadingEnglishArticle(value) {
  return value.replace(/^(The|In|A|An|At|On|Almost)\b/, (match) => match.toLowerCase());
}
function lowerLeadingSwedishCommonStart(value) {
  return value.replace(/^(Havet|Nästan|Ungefär|Ett|En|Man|När|Kungens)\b/, (match) =>
    match.toLowerCase(),
  );
}
function lowerLeadingSwedishClauseStart(value) {
  return value.replace(
    /^(Havet|Nästan|Ungefär|Ett|En|Den|Det|Man|När|År|Oppositionen|Politiker|All|Samarbetet)\b/,
    (match) => match.toLowerCase(),
  );
}
function lowerLeadingEnglishClauseStart(value) {
  return value.replace(/^(The|In|A|An|At|On|Almost|Politicians|All)\b/, (match) =>
    match.toLowerCase(),
  );
}
function stripLeadingMustSv(value) {
  return value.replace(/^man måste\s+/i, 'man ').replace(/^du måste\s+/i, 'du ');
}
function stripLeadingThatEn(value) {
  return value.replace(/^that\s+/i, '');
}
function requirementTargetEn(value) {
  return lowerFirst(value.trim()).replace(/^voting\b/i, 'vote');
}
function englishSubjectVerb(value, singular, plural) {
  return /,|\band\b/i.test(value) ? plural : singular;
}
function englishInfinitive(value) {
  const trimmed = lowerFirst(value.trim());
  return /^to\b/i.test(trimmed) ? trimmed : `to ${trimmed}`;
}
function englishAgePhrase(value) {
  return value.replace(/^(\d+)\s+years$/i, 'age $1');
}
function stripLeadingPurposeSv(value) {
  return value.replace(/^för att\s+/i, '').replace(/^att\s+/i, '');
}
function stripLeadingPurposeEn(value) {
  return value
    .replace(/^to\s+/i, '')
    .replace(/^because\s+/i, '')
    .replace(/^so\s+/i, '');
}
function stripLeadingByEn(value) {
  return stripLeadingPurposeEn(value).replace(/^by\s+/i, '');
}
function englishGerundPhrase(value) {
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
function swedishCommonToDoStatement(timePhrase, answer) {
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
function englishCommonToDoStatement(timePhrase, answer) {
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
function swedishHabitualPredicate(answer) {
  return lowerFirst(answer).replace(/\barrangerar\b/i, 'arrangera');
}
function englishCommonActivity(value) {
  return stripLeadingPurposeEn(value)
    .trim()
    .replace(/^Eating\b/i, 'eat')
    .replace(/^Lighting\b/i, 'light')
    .replace(/^Opening\b/i, 'open')
    .replace(/^Holding\b/i, 'hold')
    .replace(/\band opening\b/gi, 'and open')
    .replace(/\band children getting\b/gi, 'and for children to get');
}
function swedishCalledAnswer(answer) {
  const normalized = answer.trim();
  if (/^Luciatåg$/i.test(normalized)) return 'ett luciatåg';
  if (/^Valborgsbrasa$/i.test(normalized)) return 'en valborgsbrasa';
  if (/^Midsommarstång$/i.test(normalized)) return 'en midsommarstång';
  return answer;
}
function englishCalledAnswer(answer) {
  const normalized = answer.trim();
  if (/^(?:Lucia procession|Walpurgis bonfire|Midsummer pole)$/i.test(normalized)) {
    return `a ${normalized}`;
  }
  return lowerLeadingEnglishArticle(answer);
}
function swedishChildrenWithAdventCalendarStatement(answer) {
  const activity = lowerFirst(stripLeadingPurposeSv(answer));
  if (/^öppnar\b/i.test(activity)) {
    return `Barn med en adventskalender hemma ${activity}`;
  }
  return `Under advent ${activity.replace(/^(\S+)/, '$1 barn')}`;
}
function englishChildrenWithAdventCalendarStatement(answer) {
  const activity = lowerFirst(stripLeadingPurposeEn(answer));
  if (/^open\b/i.test(activity)) {
    return `Children with an Advent calendar at home often ${activity}`;
  }
  return `During Advent, children often ${activity}`;
}
function englishOccurrencePhrase(value) {
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
function lowerEnglishNounPhrase(value) {
  const phrase = value.trim();
  if (/^(?:Buddhist|Hindu|Orthodox|Catholic|Protestant|Jewish|Muslim|Christian)\b/.test(phrase)) {
    return phrase;
  }
  if (/^(?:The|In|A|An|At|On|Almost)\b/.test(phrase)) return lowerLeadingEnglishArticle(phrase);
  return lowerFirst(phrase);
}
function swedishTraditionalCelebrationAnswer(answer) {
  if (/^Jesu födelse\b/.test(answer)) return answer;
  return lowerFirst(answer);
}
function englishTraditionalCelebrationAnswer(answer) {
  if (/^Jesus' birth\b/.test(answer)) return answer;
  return lowerFirst(answer);
}
function swedishMentionedExample(answer, category) {
  const built = answer.trim().match(/^Att\s+(.+?)\s+byggdes\s+(.+)$/i);
  if (built) return `Byggandet av ${built[1]} ${built[2]} nämns som exempel på ${category}`;
  return `${answer} nämns som exempel på ${category}`;
}
function englishMentionedExample(answer, category) {
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
function swedishPurposeClause(value) {
  return `att ${lowerLeadingSwedishClauseStart(stripLeadingPurposeSv(value))}`;
}
function swedishProtectedReligionStatement(subject, answer) {
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
function englishProtectedReligionStatement(subject, answer) {
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
function swedishChristianHolidayStatement(subject, condition, answer) {
  return `${answer} är kristna högtider som ${lowerFirst(subject)} firar även om ${condition}`;
}
function englishChristianHolidayStatement(subject, condition, answer) {
  return `${answer} are Christian holidays that ${lowerFirst(subject)} celebrate even if ${condition}`;
}
function swedishGainedRightStatement(subject, answer) {
  const activity = stripLeadingPurposeSv(answer).replace(/\bi landet\b/i, 'i Sverige');
  return `${upperFirst(subject)} fick rätt att ${lowerFirst(activity)}`;
}
function englishGainedRightStatement(subject, answer) {
  return `${upperFirst(subject)} gained the right to ${lowerFirst(
    stripLeadingPurposeEn(answer).replace(/\bin the country\b/i, 'in Sweden'),
  )}`;
}
function reasonStatementSv(answer) {
  const stripped = stripLeadingPurposeSv(answer);
  if (/^för att|^att\s+/i.test(answer.trim())) return `En anledning är att ${lowerFirst(stripped)}`;
  if (/^[A-ZÅÄÖ]/.test(stripped) && /\b(?:hade|saknade|var|är|kan|ska|måste)\b/i.test(stripped)) {
    return `En anledning är att ${stripped}`;
  }
  return `En anledning är ${lowerFirst(stripped)}`.replace(/\beU\b/g, 'EU');
}
function reasonStatementEn(answer) {
  const stripped = stripLeadingPurposeEn(answer);
  if (/^to\b/i.test(answer.trim())) return `One reason is to ${lowerFirst(stripped)}`;
  if (/^[A-ZÅÄÖ]/.test(stripped) && /\b(?:had|was|were|is|are|can|must|should)\b/i.test(stripped)) {
    return `One reason is that ${stripped}`;
  }
  return `One reason is ${lowerFirst(stripped)}`;
}
function frontedManyActionSv(answer) {
  const words = lowerFirst(answer).split(/\s+/);
  if (words.length <= 1) return `gör många ${words[0] ?? ''}`.trim();
  return `${words[0]} många ${words.slice(1).join(' ')}`;
}
function manyPeopleActionEn(answer) {
  return `many people ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}
function stripTrailingComma(value) {
  return value.replace(/,\s*$/, '');
}
function embeddedSwedishClause(value) {
  return lowerFirst(stripLeadingPurposeSv(value))
    .replace(/^sverige\b/i, 'Sverige')
    .replace(/^det är alltid\s+/i, 'det alltid är ')
    .replace(/^domstolarna avgör bara\s+/i, 'domstolarna bara avgör ');
}
function embeddedEnglishClause(value) {
  return lowerLeadingEnglishClauseStart(stripLeadingPurposeEn(value));
}
function replaceLeadingSwedishSubject(subject, value) {
  const normalizedSubject = upperFirst(subject.trim());
  return value
    .replace(/^De\s+/i, `${normalizedSubject} `)
    .replace(/^Den\s+/i, `${normalizedSubject} `)
    .replace(/^Det är\s+/i, `${normalizedSubject} är `);
}
function replaceLeadingEnglishSubject(subject, value) {
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
function describesStatementSv(subject, answer) {
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
function describesStatementEn(subject, answer) {
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
function commonStatementSv(subject, answer) {
  if (/^Gemensamma\s+/i.test(answer)) {
    return `${upperFirst(subject)} har ${lowerFirst(answer)}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}
function commonStatementEn(subject, answer) {
  if (/^Shared\s+/i.test(answer)) {
    return `${upperFirst(subject)} have ${lowerFirst(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function meaningStatementSv(subject, answer) {
  const subjectStatement = replaceLeadingSwedishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} innebär att ${embeddedSwedishClause(answer)}`;
}
function meaningStatementEn(subject, answer) {
  const subjectStatement = replaceLeadingEnglishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}
function appliesStatementEn(subject, answer) {
  if (/^They are\s+/i.test(answer)) {
    return replaceLeadingEnglishSubject(subject, answer);
  }
  return answer;
}
function decisionStatementSv(subject, context, answer) {
  const normalizedAnswer = lowerFirst(stripLeadingPurposeSv(answer));
  const yearContext = context.match(/^(.+?)\s+(\d{4})$/);
  if (yearContext) {
    return `År ${yearContext[2]} beslutade ${upperFirst(subject)} som ${yearContext[1]} att ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} beslutade som ${context} att ${normalizedAnswer}`;
}
function decisionStatementEn(subject, context, answer) {
  const normalizedAnswer = lowerFirst(stripLeadingThatEn(answer));
  const yearContext = context.match(/^(.+?)\s+in\s+(\d{4})$/i);
  if (yearContext) {
    return `In ${yearContext[2]}, ${upperFirst(subject)} was ${yearContext[1]} to decide that ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} decided as ${context} that ${normalizedAnswer}`;
}
function supportStatementSv(subject, answer) {
  if (/^En\s+/i.test(answer)) return `${upperFirst(subject)} är ${lowerFirst(answer)}`;
  return replaceLeadingSwedishSubject(subject, answer);
}
function supportStatementEn(subject, answer) {
  if (/^(?:A|An)\s+/i.test(answer)) {
    return `${upperFirst(subject)} is ${lowerLeadingEnglishArticle(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function stripTrueFalsePromptSv(value) {
  return stripFinalPunctuation(value.replace(/^Sant eller falskt:\s*/i, ''));
}
function stripTrueFalsePromptEn(value) {
  return stripFinalPunctuation(value.replace(/^True or false:\s*/i, ''));
}
function firstSentence(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return stripFinalPunctuation(match?.[1] ?? trimmed);
}
function normalizeStatementForComparison(value) {
  return stripFinalPunctuation(value).replace(/\s+/g, ' ').trim().toLowerCase();
}
function isTrueFalseSource(source) {
  return source.type === 'true_false' && source.options.length === 2;
}
function truthStatementSv(statement) {
  return upperFirst(statement);
}
function truthStatementEn(statement) {
  return upperFirst(statement);
}
function sourceDirectStatementSv(source, statement, sourceStatementIsTrue) {
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
function sourceDirectStatementEn(source, statement, sourceStatementIsTrue) {
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
function sourceOppositeStatementSv(statement) {
  const replacements = [
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
function sourceOppositeStatementEn(statement) {
  const replacements = [
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
function sourceFalseRestatementSv(statement) {
  const replacements = [
    [/\bmåste\b/i, 'är skyldiga att'],
    [/\bska\b/i, 'är skyldiga att'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return truthStatementSv(statement);
}
function sourceFalseRestatementEn(statement) {
  const replacements = [
    [/\bmust\b/i, 'are required to'],
    [/\bshould\b/i, 'are required to'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return truthStatementEn(statement);
}
function trueFalseSourceStatementSv(source, variantIsTrue) {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptSv(source.questionSv);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementSv(statement);
    return sourceDirectStatementSv(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementSv(statement);
}
function trueFalseSourceStatementEn(source, variantIsTrue) {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptEn(source.questionEn);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementEn(statement);
    return sourceDirectStatementEn(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementEn(statement);
}
function sourceTrueFactSv(source) {
  return ensureSentence(truthStatementSv(stripTrueFalsePromptSv(source.questionSv)));
}
function sourceTrueFactEn(source) {
  return ensureSentence(truthStatementEn(stripTrueFalsePromptEn(source.questionEn)));
}
function cleanTrueFalseSourceExplanationSv(source) {
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
function cleanTrueFalseSourceExplanationEn(source) {
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
function trueStatementExplanationSv(source) {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationSv(source);
    return ensureSentence(trueFalseSourceStatementSv(source, true));
  }

  return source.explanationSv;
}
function trueStatementExplanationEn(source) {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationEn(source);
    return ensureSentence(trueFalseSourceStatementEn(source, true));
  }

  return source.explanationEn;
}
function falseStatementExplanationSv(source) {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactSv(source));
  }

  return source.explanationSv;
}
function falseStatementExplanationEn(source) {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactEn(source));
  }

  return source.explanationEn;
}

function trueFalseSingleChoiceExplanationSv(source) {
  return `${ensureSentence(
    trueFalseSourceStatementSv(source, true),
  )} Därför stämmer påståendet som motsvarar den uppgiften, medan motsatsen inte stämmer.`;
}

function trueFalseSingleChoiceExplanationEn(source) {
  return `${ensureSentence(
    trueFalseSourceStatementEn(source, true),
  )} Therefore the statement that matches that fact is correct, while the opposite statement is not.`;
}

function statementTopicSv(source) {
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

function statementTopicEn(source) {
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

function trueFalseStatementOptions(source) {
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

function generatedTrueFalseStatementSv(source, option, variantIsTrue) {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementSv(source, variantIsTrue);
  return truthStatementSv(civicStatementSv(source, option));
}
function generatedTrueFalseStatementEn(source, option, variantIsTrue) {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementEn(source, variantIsTrue);
  return truthStatementEn(civicStatementEn(source, option));
}
function judgementPromptSv(source) {
  if (isTrueFalseSource(source)) {
    return `Vilket påstående stämmer bäst om ${statementTopicSv(source)}?`;
  }
  return `Välj rätt alternativ: ${source.questionSv}`;
}
function judgementPromptEn(source) {
  if (isTrueFalseSource(source)) {
    return `Which statement best matches ${statementTopicEn(source)}?`;
  }
  return `Choose the correct option: ${source.questionEn}`;
}
function singleChoicePromptSv(source) {
  if (isTrueFalseSource(source)) {
    return `Vilket påstående är korrekt om ${statementTopicSv(source)}?`;
  }
  return `Vilket svar stämmer bäst? ${source.questionSv}`;
}
function singleChoicePromptEn(source) {
  if (isTrueFalseSource(source)) {
    return `Which statement is correct about ${statementTopicEn(source)}?`;
  }
  return `Which answer best matches? ${source.questionEn}`;
}
function civicStatementSv(source, option) {
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
  match = q.match(/^Vilket är ett sätt att (.+)$/i);
  if (match) return `Ett sätt att ${match[1]} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;
  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return `${upperFirst(answer)} när ${match[1]} påverkar ${match[2]}`;
  match = q.match(/^Hur underlättar (.+?) (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} underlättar ${match[2]} genom att ${lowerFirst(answer.replace(/^Genom att\s+/i, ''))}`;
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
  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;
  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} har uppgiften att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Vilken uppgift har (.+)$/i);
  if (match) return `${upperFirst(match[1])} har uppgiften ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vad är en uppgift för (.+)$/i);
  if (match) return `En uppgift för ${match[1]} är ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);
  match = q.match(/^Vilket påstående stämmer om (.+)$/i);
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
    return `En anledning till att väljare röstar bakom en skärm i vallokalen är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför bildades Förenta nationerna efter andra världskriget$/i);
  if (match)
    return `Förenta nationerna bildades efter andra världskriget för att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför finns lagar på arbetsmarknaden i Sverige$/i);
  if (match)
    return `Lagar på arbetsmarknaden i Sverige finns för att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför ökade Sveriges befolkning under 1800-talet$/i);
  if (match) return `Sveriges befolkning ökade under 1800-talet på grund av ${lowerFirst(answer)}`;
  match = q.match(/^Varför kallas (.+?) ofta (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} kallas ofta ${match[2]} eftersom ${embeddedSwedishClause(answer)}`;
  match = q.match(/^Varför (.+)$/i);
  if (match) return reasonStatementSv(answer);
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
      return `${upperFirst(match[1])} hjälper till med ${match[2]} genom att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
    }
    return replaceLeadingSwedishSubject(match[1], answer);
  }
  match = q.match(/^Vad gör (.+?) på arbetsmarknaden$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vilken roll har (.+?) i (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vad finansierar staten inom (.+)$/i);
  if (match) return `Staten finansierar ${lowerFirst(answer)}`;
  match = q.match(/^Vilket ansvar har (.+?) inom (.+)$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishPurposeClause(answer)}`;
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
      return `${upperFirst(match[1])} har bara förändrat ${lowerFirst(answer.replace(/^Bara\s+/i, ''))}`;
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
      return `${upperFirst(match[1])} arbetar endast för ${lowerFirst(answer.replace(/^Endast\s+/i, ''))}`;
    }
    const object = /^Att\s+/i.test(answer) ? swedishPurposeClause(answer) : lowerFirst(answer);
    return `${upperFirst(match[1])} arbetar för ${object}`;
  }
  match = q.match(/^Vad valde (.+?) att göra (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} valde att ${lowerFirst(stripLeadingPurposeSv(answer))} ${match[2]}`;
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
  match = q.match(/^Vilka kristna kyrkor eller samfund nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[1]}`;
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
  if (match) return swedishGainedRightStatement(match[1], answer);
  match = q.match(/^Vilka riktningar inom (.+?) nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[2]}`;
  match = q.match(/^Vad nämns som exempel på (.+)$/i);
  if (match) return swedishMentionedExample(answer, match[1]);
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
function civicStatementEn(source, option) {
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
  match = q.match(/^Which is a way to (.+)$/i);
  if (match) return `One way to ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
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
  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;
  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} has the task to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What is one task of (.+)$/i);
  if (match) return `One task of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What is one role of (.+)$/i);
  if (match) return `One role of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);
  match = q.match(/^Which statement is correct about (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match) {
    return `The foremost task of ${lowerLeadingEnglishArticle(match[1])} is ${englishInfinitive(stripLeadingPurposeEn(answer))}`;
  }
  match = q.match(/^Which example describes (.+)$/i);
  if (match)
    return `${upperFirst(answer)} ${englishSubjectVerb(answer, 'belongs', 'belong')} among ${match[1]}`;
  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;
  match = q.match(/^Which requirements apply to (.+)$/i);
  if (match) return `To ${requirementTargetEn(match[1])}, ${lowerFirst(answer)}`;
  match = q.match(/^Why do voters vote behind a screen at the polling station$/i);
  if (match)
    return `One reason voters vote behind a screen at the polling station is that ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why was the United Nations created after the Second World War$/i);
  if (match)
    return `The United Nations was created after the Second World War to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why does Sweden have labour-market laws$/i);
  if (match) return `Sweden has labour-market laws to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why did Sweden’s population grow during the 19th century$/i);
  if (match)
    return `Sweden’s population grew during the 19th century because of ${lowerFirst(answer)}`;
  match = q.match(/^Why is (.+?) often called (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} is often called ${match[2]} because ${embeddedEnglishClause(answer)}`;
  match = q.match(/^Why (.+)$/i);
  if (match) return reasonStatementEn(answer);
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
  match = q.match(/^What responsibility do (.+?) have within (.+)$/i);
  if (match) return `${upperFirst(match[1])} are responsible for ${englishGerundPhrase(answer)}`;
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
  match = q.match(/^In which year was (.+)$/i);
  if (match) return `${upperFirst(match[1])} was in ${answer}`;
  match = q.match(/^What did (.+?) become important for$/i);
  if (match)
    return `${upperFirst(match[1])} became important for ${lowerLeadingEnglishArticle(answer).replace(/^Cooperation\b/, 'cooperation')}`;
  match = q.match(/^What was the goal of (.+?) during (.+)$/i);
  if (match)
    return `The goal of ${match[1]} during ${match[2]} was to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What has (.+?) changed$/i);
  if (match) {
    if (/^Only\s+how\b/i.test(answer)) {
      return `${upperFirst(match[1])} has only changed ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
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
      return `${upperFirst(match[1])} works only for ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} works for ${lowerFirst(answer)}`;
  }
  match = q.match(/^What did (.+?) choose to do (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} chose to ${lowerFirst(stripLeadingPurposeEn(answer))} ${match[2]}`;
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
  match = q.match(/^What do families commonly do on (.+) in Sweden$/i);
  if (match)
    return `On ${stripTrailingComma(match[1])}, families commonly ${lowerFirst(stripLeadingPurposeEn(answer))}`;
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
  match = q.match(/^What exists in different places in Sweden for (.+)$/i);
  if (match)
    return `In different places in Sweden, there are ${lowerEnglishNounPhrase(answer)} for ${match[1]}`;
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
  match = q.match(/^Which Christian churches or communities are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[1]}`;
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
  if (match) return englishGainedRightStatement(match[1], answer);
  match = q.match(/^Which branches within (.+?) are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[2]}`;
  match = q.match(/^What is mentioned as an example of (.+)$/i);
  if (match) return englishMentionedExample(answer, match[1]);
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

function correctOption(question) {
  return (
    question.options?.find((option) => option.id === question.correctOptionId) ??
    question.options?.[0]
  );
}

function wrongOption(question) {
  return (
    question.options?.find((option) => option.id !== question.correctOptionId) ?? UNKNOWN_OPTION
  );
}

function expectedGeneratedPrompt(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return {
      questionSv: singleChoicePromptSv(sourceQuestion),
      questionEn: singleChoicePromptEn(sourceQuestion),
    };
  }

  if (variantIndex === 1) {
    const option = correctOption(sourceQuestion);
    return {
      questionSv: ensureSentence(generatedTrueFalseStatementSv(sourceQuestion, option, true)),
      questionEn: ensureSentence(generatedTrueFalseStatementEn(sourceQuestion, option, true)),
    };
  }

  if (variantIndex === 2) {
    const option = wrongOption(sourceQuestion);
    return {
      questionSv: ensureSentence(generatedTrueFalseStatementSv(sourceQuestion, option, false)),
      questionEn: ensureSentence(generatedTrueFalseStatementEn(sourceQuestion, option, false)),
    };
  }

  return {
    questionSv: judgementPromptSv(sourceQuestion),
    questionEn: judgementPromptEn(sourceQuestion),
  };
}

function expectedGeneratedExplanation(sourceQuestion, variantIndex) {
  if (variantIndex === 1) {
    return {
      explanationSv: trueStatementExplanationSv(sourceQuestion),
      explanationEn: trueStatementExplanationEn(sourceQuestion),
    };
  }

  if (variantIndex === 2) {
    return {
      explanationSv: falseStatementExplanationSv(sourceQuestion),
      explanationEn: falseStatementExplanationEn(sourceQuestion),
    };
  }

  if ((variantIndex === 0 || variantIndex === 3) && isTrueFalseSource(sourceQuestion)) {
    return {
      explanationSv: trueFalseSingleChoiceExplanationSv(sourceQuestion),
      explanationEn: trueFalseSingleChoiceExplanationEn(sourceQuestion),
    };
  }

  return {
    explanationSv: sourceQuestion.explanationSv,
    explanationEn: sourceQuestion.explanationEn,
  };
}

function singleChoiceOptions(sourceQuestion) {
  if (sourceQuestion.options?.length === SINGLE_CHOICE_OPTION_IDS.length) {
    return sourceQuestion.options;
  }
  if (sourceQuestion.type === 'true_false') {
    return trueFalseStatementOptions(sourceQuestion);
  }
  return sourceQuestion.options || [];
}

function normalizeSingleChoiceOptions(options, correctOptionId) {
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

function expectedGeneratedAnswerShape(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return normalizeSingleChoiceOptions(
      singleChoiceOptions(sourceQuestion),
      isTrueFalseSource(sourceQuestion) ? 'true-statement' : sourceQuestion.correctOptionId,
    );
  }

  if (variantIndex === 1) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'true',
    };
  }

  if (variantIndex === 2) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'false',
    };
  }

  const correct = correctOption(sourceQuestion);
  const sourceIsTrueFalse =
    sourceQuestion.options?.length === 2 &&
    ['true', 'false'].includes(sourceQuestion.correctOptionId);
  const options = sourceIsTrueFalse
    ? trueFalseStatementOptions(sourceQuestion)
    : singleChoiceOptions(sourceQuestion);

  return normalizeSingleChoiceOptions(options, sourceIsTrueFalse ? 'true-statement' : correct.id);
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  if (!hasText(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unexpectedKeys(value, expectedKeys) {
  if (!isObjectRecord(value)) return [];
  const expectedKeySet = new Set(expectedKeys);
  return Object.keys(value).filter((key) => !expectedKeySet.has(key));
}

function schemaKeyFailures(value, expectedKeys, label, schemaName) {
  if (!isObjectRecord(value)) return [`${label} must be a ${schemaName} object`];
  return unexpectedKeys(value, expectedKeys).map(
    (key) => `${label}.${key} is not part of ${schemaName} schema`,
  );
}

function questionExactSchemaKeyFailures(question, label) {
  const failures = schemaKeyFailures(
    question,
    EXPECTED_PRACTICE_QUESTION_KEYS,
    label,
    'PracticeQuestion',
  );

  if (Array.isArray(question?.options)) {
    question.options.forEach((option, optionIndex) => {
      failures.push(
        ...schemaKeyFailures(
          option,
          EXPECTED_QUESTION_OPTION_KEYS,
          `${label} option[${optionIndex}]`,
          'QuestionOption',
        ),
      );
    });
  }

  failures.push(
    ...schemaKeyFailures(
      question?.uhrReference,
      EXPECTED_UHR_REFERENCE_KEYS,
      `${label} uhrReference`,
      'UHRReference',
    ),
  );

  return failures;
}

function chapterExactSchemaKeyFailures(chapter, label) {
  return schemaKeyFailures(chapter, EXPECTED_CHAPTER_KEYS, label, 'Chapter');
}

function glossaryTermExactSchemaKeyFailures(term, label) {
  return schemaKeyFailures(term, EXPECTED_GLOSSARY_TERM_KEYS, label, 'GlossaryTerm');
}

function mockExamConfigExactSchemaKeyFailures(config, label) {
  return schemaKeyFailures(config, EXPECTED_MOCK_EXAM_CONFIG_KEYS, label, 'MockExamConfig');
}

function uhrSectionMapExactSchemaKeyFailures(map, label) {
  return schemaKeyFailures(map, EXPECTED_UHR_SECTION_MAP_KEYS, label, 'UHRSectionMap');
}

function uhrSectionMapSourceExactSchemaKeyFailures(source, label) {
  return schemaKeyFailures(
    source,
    EXPECTED_UHR_SECTION_MAP_SOURCE_KEYS,
    label,
    'UHRSectionMapSource',
  );
}

function uhrSectionMapChapterExactSchemaKeyFailures(chapter, label) {
  return schemaKeyFailures(
    chapter,
    EXPECTED_UHR_SECTION_MAP_CHAPTER_KEYS,
    label,
    'UHRSectionMapChapter',
  );
}

function isColorToken(value) {
  return (
    typeof value === 'string' && (/^#[0-9a-fA-F]{6}$/.test(value) || /^rgba?\(.+\)$/.test(value))
  );
}

function extractStringConstantFromTs(source, constantName) {
  const sourceFile = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true);
  let value;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constantName &&
      node.initializer &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      value = node.initializer.text;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return value;
}

function extractStringUnionTypeFromTs(source, typeName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let values;

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === typeName &&
      ts.isUnionTypeNode(node.type)
    ) {
      values = node.type.types.map((typeNode) => {
        if (
          ts.isLiteralTypeNode(typeNode) &&
          typeNode.literal &&
          ts.isStringLiteralLike(typeNode.literal)
        ) {
          return typeNode.literal.text;
        }
        return undefined;
      });
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function extractTypeAliasTextFromTs(source, typeName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let text;

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === typeName
    ) {
      text = node.type.getText(sourceFile);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return text;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function extractObjectTypePropertiesFromTs(source, declarationName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let properties;

  function readMembers(members) {
    return members
      .map((member) => {
        const name = propertyNameText(member.name);
        if (!name) return undefined;

        if (ts.isMethodSignature(member)) {
          const parameters = member.parameters.map((parameter) => parameter.getText(sourceFile));
          return {
            name,
            optional: Boolean(member.questionToken),
            type: `(${parameters.join(', ')}) => ${member.type?.getText(sourceFile) ?? 'void'}`,
          };
        }

        if (!ts.isPropertySignature(member)) return undefined;
        return {
          name,
          optional: Boolean(member.questionToken),
          type: member.type?.getText(sourceFile) ?? '',
        };
      })
      .filter(Boolean);
  }

  function visit(node) {
    if (
      ts.isInterfaceDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName
    ) {
      properties = readMembers(node.members);
      return;
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      ts.isTypeLiteralNode(node.type)
    ) {
      properties = readMembers(node.type.members);
      return;
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      ts.isIntersectionTypeNode(node.type)
    ) {
      const mergedProperties = [];
      for (const typeNode of node.type.types) {
        if (ts.isTypeLiteralNode(typeNode)) {
          mergedProperties.push(...readMembers(typeNode.members));
          continue;
        }
        if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
          const referencedProperties = extractObjectTypePropertiesFromTs(
            source,
            typeNode.typeName.text,
          );
          if (Array.isArray(referencedProperties)) {
            mergedProperties.push(...referencedProperties);
          }
        }
      }
      properties = mergedProperties;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return properties;
}

function extractCallStringArgumentsFromTs(source, functionName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const calls = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === functionName
    ) {
      calls.push(
        node.arguments.map((argument) =>
          ts.isStringLiteralLike(argument) ? argument.text : undefined,
        ),
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

function numericLiteralValue(node) {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }
  return undefined;
}

function extractMappedNumericArraysFromTs(source, parameterName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const arrays = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'map' &&
      ts.isArrayLiteralExpression(node.expression.expression)
    ) {
      const callback = node.arguments[0];
      const callbackParameter = callback?.parameters?.[0]?.name;
      if (
        callbackParameter &&
        ts.isIdentifier(callbackParameter) &&
        callbackParameter.text === parameterName
      ) {
        arrays.push(
          node.expression.expression.elements.map((element) => numericLiteralValue(element)),
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return arrays;
}

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      if (cell.length) {
        throw new Error('unexpected quote inside unquoted cell');
      }
      inQuotes = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new Error('unterminated quoted cell');
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function optionIdsMatchQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  const optionIds = question.options.map((option) => option?.id);
  if (question.type === 'single_choice') {
    return arrayEquals(optionIds, SINGLE_CHOICE_OPTION_IDS);
  }
  if (question.type === 'true_false') {
    return arrayEquals(optionIds, TRUE_FALSE_OPTION_IDS);
  }
  return optionIds.every(hasText);
}

function trueFalseOptionLabelsMatchConvention(question) {
  if (question.type !== 'true_false' || !Array.isArray(question.options)) return false;
  return jsonEqual(question.options, TRUE_FALSE_OPTIONS);
}

function validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn) {
  const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
  const label = hasText(chapter?.id) ? chapter.id : `chapter[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  chapterExactSchemaKeyFailures(chapter, label).forEach(reject);

  if (!isObjectRecord(chapter)) return false;

  if (chapter.id !== expectedId) reject(`expected chapter ${expectedId}, found ${chapter.id}`);
  if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
    reject(`${label} has duplicate chapter id`);
  }
  if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

  for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
    if (!hasText(chapter[field])) reject(`${label} missing ${field}`);
    if (hasText(chapter[field]) && !textIsTrimmedSingleSpaced(chapter[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  if (normalizeComparableText(chapter.nameSv) === normalizeComparableText(chapter.nameEn)) {
    reject(`${label} nameSv and nameEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(chapter.descriptionSv) ===
    normalizeComparableText(chapter.descriptionEn)
  ) {
    reject(`${label} descriptionSv and descriptionEn must be distinct bilingual text`);
  }

  const normalizedNameSv = normalizeComparableText(chapter.nameSv);
  if (normalizedNameSv && seenNamesSv.has(normalizedNameSv)) {
    reject(`${label} duplicates Swedish chapter name`);
  }
  if (normalizedNameSv) seenNamesSv.add(normalizedNameSv);

  const normalizedNameEn = normalizeComparableText(chapter.nameEn);
  if (normalizedNameEn && seenNamesEn.has(normalizedNameEn)) {
    reject(`${label} duplicates English chapter name`);
  }
  if (normalizedNameEn) seenNamesEn.add(normalizedNameEn);

  if (!Number.isInteger(chapter.questionCount) || chapter.questionCount < 1) {
    reject(`${label} has invalid questionCount`);
  }

  return valid;
}

function chapterTextFieldsAreNormalized(chapter) {
  return ['id', 'nameSv', 'nameEn', 'descriptionSv', 'descriptionEn'].every((field) =>
    textIsTrimmedSingleSpaced(chapter[field]),
  );
}

function validateQuestionSchema(question, index) {
  const label = hasText(question?.id) ? question.id : `question[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!isObjectRecord(question)) {
    reject(`${label} must be a PracticeQuestion object`);
    return false;
  }

  questionExactSchemaKeyFailures(question, label).forEach(reject);

  function requireText(field) {
    if (!hasText(question[field])) {
      reject(`${label} missing ${field}`);
    } else if (!textIsTrimmedSingleSpaced(question[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  requireText('id');
  if (hasText(question.id) && !/^q\d{3,}$/.test(question.id)) {
    reject(`${label} id must use q### format`);
  }

  for (const field of [
    'questionSv',
    'questionEn',
    'explanationSv',
    'explanationEn',
    'correctOptionId',
    'chapterId',
  ]) {
    requireText(field);
  }

  if (!QUESTION_TYPES.has(question.type)) reject(`${label} has invalid type ${question.type}`);
  if (!DIFFICULTIES.has(question.difficulty)) {
    reject(`${label} has invalid difficulty ${question.difficulty}`);
  }
  if (!REVIEW_STATUSES.has(question.reviewStatus)) {
    reject(`${label} has invalid reviewStatus ${question.reviewStatus}`);
  }
  if (
    normalizeComparableText(question.questionSv) === normalizeComparableText(question.questionEn)
  ) {
    reject(`${label} questionSv and questionEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(question.explanationSv) ===
    normalizeComparableText(question.explanationEn)
  ) {
    reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
  }
  for (const field of ['questionSv', 'questionEn', 'explanationSv', 'explanationEn']) {
    if (hasText(question[field]) && !textHasSentenceEnding(question[field])) {
      reject(`${label} ${field} must end with sentence punctuation`);
    }
  }

  if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
    reject(`${label} must have 2 or 4 options`);
  } else {
    const optionIds = new Set();
    question.options.forEach((option, optionIndex) => {
      const optionLabel = `${label} option[${optionIndex}]`;
      if (!hasText(option.id)) reject(`${optionLabel} missing id`);
      if (hasText(option.id) && !textIsTrimmedSingleSpaced(option.id)) {
        reject(`${optionLabel} id must be trimmed and single-spaced`);
      }
      if (hasText(option.id) && optionIds.has(option.id)) {
        reject(`${label} has duplicate option id ${option.id}`);
      }
      optionIds.add(option.id);
      if (!hasText(option.textSv)) reject(`${optionLabel} missing textSv`);
      if (!hasText(option.textEn)) reject(`${optionLabel} missing textEn`);
      if (hasText(option.textSv) && !textIsTrimmedSingleSpaced(option.textSv)) {
        reject(`${optionLabel} textSv must be trimmed and single-spaced`);
      }
      if (hasText(option.textEn) && !textIsTrimmedSingleSpaced(option.textEn)) {
        reject(`${optionLabel} textEn must be trimmed and single-spaced`);
      }
      if (!optionTextPairIsTranslatedOrInvariant(option)) {
        reject(`${optionLabel} textSv and textEn must be translated or a short invariant label`);
      }
    });
    findDuplicateOptionTextLabels(question).forEach((duplicate) => {
      reject(`${label} has duplicate ${duplicate.field} option text "${duplicate.label}"`);
    });

    if (!optionIds.has(question.correctOptionId)) {
      reject(`${label} correctOptionId does not match an option`);
    }
    if (question.type === 'single_choice' && question.options.length !== 4) {
      reject(`${label} single_choice questions must have 4 options`);
    }
    if (question.type === 'single_choice' && !optionIdsMatchQuestionType(question)) {
      reject(`${label} single_choice options must use a/b/c/d option ids in order`);
    }
    if (
      question.type === 'true_false' &&
      (question.options.length !== 2 ||
        !optionIdsMatchQuestionType(question) ||
        !['true', 'false'].includes(question.correctOptionId) ||
        !trueFalseOptionLabelsMatchConvention(question))
    ) {
      reject(`${label} true_false questions must use true/false option ids and labels in order`);
    }
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    reject(`${label} must have at least one tag`);
  } else {
    const tags = new Set();
    question.tags.forEach((tag, tagIndex) => {
      if (!hasText(tag)) reject(`${label} tag[${tagIndex}] is blank`);
      if (hasText(tag) && !isSlugTag(tag)) {
        reject(`${label} tag[${tagIndex}] must use lowercase kebab-case`);
      }
      if (hasText(tag) && tags.has(tag)) reject(`${label} has duplicate tag ${tag}`);
      tags.add(tag);
    });
  }

  if (question.uhrReference && typeof question.uhrReference === 'object') {
    for (const field of ['chapter', 'section']) {
      if (
        hasText(question.uhrReference[field]) &&
        !textIsTrimmedSingleSpaced(question.uhrReference[field])
      ) {
        reject(`${label} uhrReference.${field} must be trimmed and single-spaced`);
      }
    }
  }

  return valid;
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questionModule = loadTs('data/questions.ts');
const baseQuestions = questionModule.baseQuestions;
const questions = questionModule.questions;
const sourceQuestions = questionModule.sourceQuestions;
const generatedPublishedQuestions = questionModule.generatedPublishedQuestions;
const additionalQuestions = loadTs('data/additionalQuestions.ts', 'additionalQuestions');
const glossaryTerms = loadTs('data/glossary.ts', 'glossaryTerms');
const uxBenchmarks = loadTs('data/uxBenchmarks.ts', 'uxBenchmarks');
const defaultMockExamConfig = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
const supportedLanguages = loadTs('lib/localization/language.ts', 'supportedLanguages');
const localizationStrings = loadTs('lib/localization/strings.ts', 'strings');
const examGeneratorModule = loadTs('lib/quiz/examGenerator.ts');
const generateExam = examGeneratorModule.generateExam;
const buildExamReviewItems = examGeneratorModule.buildExamReviewItems;
const scoreExam = examGeneratorModule.scoreExam;
const buildExamChapterBreakdownItems = examGeneratorModule.buildExamChapterBreakdownItems;
const formatExamTime = examGeneratorModule.formatExamTime;
const shouldAutoSubmitExam = examGeneratorModule.shouldAutoSubmitExam;
const scoringModule = loadTs('lib/quiz/scoring.ts');
const scoreAnswers = scoringModule.scoreAnswers;
const answerValidationModule = loadTs('lib/quiz/answerValidation.ts');
const isCorrectAnswer = answerValidationModule.isCorrectAnswer;
const getAnswerOptionFeedback = answerValidationModule.getAnswerOptionFeedback;
const answerOptionShuffleModule = loadTs('lib/quiz/answerOptionShuffle.ts');
const shuffleQuestionOptionsForSession = answerOptionShuffleModule.shuffleQuestionOptionsForSession;
const summarizeAnswerShuffleDistribution =
  answerOptionShuffleModule.summarizeAnswerShuffleDistribution;
const answerShuffleDistributionIsBalanced =
  answerOptionShuffleModule.answerShuffleDistributionIsBalanced;
const ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE =
  answerOptionShuffleModule.ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE;
const audioModule = loadTs('lib/audio/speak.ts');
const buildQuestionSpeechText = audioModule.buildQuestionSpeechText;
const speakSwedish = audioModule.speakSwedish;
const stopSpeech = audioModule.stopSpeech;
const practiceFlowModule = loadTs('lib/quiz/practiceFlow.ts');
const getPracticeQuestionForSession = practiceFlowModule.getPracticeQuestionForSession;
const getChapterQuizSessionId = practiceFlowModule.getChapterQuizSessionId;
const practiceSessionStoreModule = loadTs('lib/quiz/practiceSessionStore.ts');
const usePracticeSessionStore = practiceSessionStoreModule.usePracticeSessionStore;
const badgeModule = loadTs('lib/learning/badges.ts');
const badgeCatalog = badgeModule.badgeCatalog;
const deriveBadges = badgeModule.deriveBadges;
const spacedRepetitionModule = loadTs('lib/learning/spacedRepetition.ts');
const spacedRepetitionSchedule = spacedRepetitionModule.spacedRepetitionSchedule;
const getNextReviewAt = spacedRepetitionModule.getNextReviewAt;
const streakModule = loadTs('lib/learning/streaks.ts');
const calculateStreak = streakModule.calculateStreak;
const xpModule = loadTs('lib/learning/xp.ts');
const calculateAnswerXp = xpModule.calculateAnswerXp;
const calculateQuizCompletionXp = xpModule.calculateQuizCompletionXp;
const calculateLevel = xpModule.calculateLevel;
const masteryModule = loadTs('lib/learning/mastery.ts');
const calculateMastery = masteryModule.calculateMastery;
const calculateChapterMastery = masteryModule.calculateChapterMastery;
const findWeakChapterIds = masteryModule.findWeakChapterIds;
const themeModule = loadTs('lib/theme/index.ts');
const colors = themeModule.colors;
const motion = themeModule.motion;
const radius = themeModule.radius;
const shadows = themeModule.shadows;
const space = themeModule.space;
const typography = themeModule.typography;
const adsModule = loadTs('lib/monetization/ads.ts');
const adsConfig = adsModule.adsConfig;
const shouldShowAd = adsModule.shouldShowAd;
const shouldSuppressLaunchPopupAdForPath = adsModule.shouldSuppressLaunchPopupAdForPath;
const consentModule = loadTs('lib/monetization/consent.ts');
const consentConfig = consentModule.consentConfig;
const premiumModule = loadTs('lib/monetization/premium.ts');
const FREE_ENTITLEMENTS = premiumModule.FREE_ENTITLEMENTS;
const PREMIUM_ENTITLEMENTS = premiumModule.PREMIUM_ENTITLEMENTS;
const REMOVE_ADS_ENTITLEMENTS = premiumModule.REMOVE_ADS_ENTITLEMENTS;
const hasAdsDisabled = premiumModule.hasAdsDisabled;
const isPremiumUser = premiumModule.isPremiumUser;
const premiumConfig = premiumModule.premiumConfig;
const purchaseModule = loadTs('lib/monetization/purchases.ts');
const REMOVE_ADS_PRICE_LABEL = purchaseModule.REMOVE_ADS_PRICE_LABEL;
const REMOVE_ADS_PRODUCT_ID = purchaseModule.REMOVE_ADS_PRODUCT_ID;
const releasePolicyModule = loadTs('lib/monetization/releasePolicy.ts');
const releaseMonetizationPolicy = releasePolicyModule.releaseMonetizationPolicy;
const isReleaseMonetizationPolicyReady = releasePolicyModule.isReleaseMonetizationPolicyReady;
const packageMetadata = loadJson('package.json');
const appConfig = loadJson('app.json');
const uhrSectionMap = loadJson('content/uhr-section-map.json');
let chapterSchemasValidated = 0;
let chapterTextFieldsNormalizedValidated = 0;
let chapterExactSchemaKeysValidated = 0;
let appConfigPluginsValidated = 0;
let appConfigSchemaValidated = false;
let launchAdSuppressedRoutesValidated = 0;
let launchAdRouteSuppressionParityValidated = false;
let tabNavigationRulesValidated = 0;
let tabNavigationRoutesValidated = 0;
let tabNavigationParityValidated = false;
let releaseMonetizationPolicyFieldsValidated = 0;
let releaseMonetizationPolicyParityValidated = false;
let adPlacementRoutesValidated = 0;
let noAdRoutesValidated = 0;
let adPlacementRouteParityValidated = false;
let removeAdsEntitlementHookCasesValidated = 0;
let removeAdsEntitlementHookParityValidated = false;
let premiumEntitlementStatesValidated = 0;
let premiumEntitlementParityValidated = false;
let questionDisclaimerRoutesValidated = 0;
let questionDisclaimerCopyValidated = false;
let mockExamConfigTypeFieldsValidated = 0;
let mockExamConfigTypeSchemaParityValidated = false;
let mockExamConfigExactSchemaKeysValidated = false;
let mockExamConfigValidated = false;
let mockExamRuntimeParityValidated = false;
let mockExamChapterBalanceParityValidated = false;
let mockExamTimerParityValidated = false;
let examSubmissionFinalityParityValidated = false;
let examRouteHeadersValidated = 0;
let examRouteHeaderParityValidated = false;
let examRouteCopyLabelsValidated = 0;
let examRouteCopyParityValidated = false;
let quizRouteHeadersValidated = 0;
let quizRouteHeaderParityValidated = false;
let quizRouteCopyLabelsValidated = 0;
let quizRouteCopyParityValidated = false;
let practiceRouteHeadersValidated = 0;
let practiceRouteHeaderParityValidated = false;
let chapterRouteHeadersValidated = 0;
let chapterRouteHeaderParityValidated = false;
let chapterRouteCopyLabelsValidated = 0;
let chapterRouteCopyParityValidated = false;
let learnRouteHeadersValidated = 0;
let learnRouteHeaderParityValidated = false;
let profileRouteHeadersValidated = 0;
let profileRouteHeaderParityValidated = false;
let profileRouteCopyLabelsValidated = 0;
let profileRouteCopyParityValidated = false;
let homeRouteHeadersValidated = 0;
let homeRouteHeaderParityValidated = false;
let homeRouteCopyLabelsValidated = 0;
let homeRouteCopyParityValidated = false;
let mistakesRouteHeadersValidated = 0;
let mistakesRouteHeaderParityValidated = false;
let legalRouteHeadersValidated = 0;
let legalRouteHeaderParityValidated = false;
let settingsRouteHeadersValidated = 0;
let settingsRouteHeaderParityValidated = false;
let settingsRouteCopyLabelsValidated = 0;
let settingsRouteCopyParityValidated = false;
let onboardingRouteHeadersValidated = 0;
let onboardingRouteHeaderParityValidated = false;
let onboardingRouteCopyLabelsValidated = 0;
let onboardingRouteCopyParityValidated = false;
let screenShellLayoutRulesValidated = 0;
let screenShellLayoutParityValidated = false;
let settingsRouteScrollRulesValidated = 0;
let settingsRouteScrollParityValidated = false;
let onboardingRouteScrollRulesValidated = 0;
let onboardingRouteScrollParityValidated = false;
let legalRouteScrollRulesValidated = 0;
let legalRouteScrollParityValidated = false;
let buttonAccessibilityRulesValidated = 0;
let buttonAccessibilityParityValidated = false;
let cardAccessibilityRulesValidated = 0;
let cardAccessibilityParityValidated = false;
let progressBarAccessibilityRulesValidated = 0;
let progressBarAccessibilityParityValidated = false;
let metricCardAccessibilityRulesValidated = 0;
let metricCardAccessibilityParityValidated = false;
let badgeAccessibilityRulesValidated = 0;
let badgeAccessibilityParityValidated = false;
let chapterCardAccessibilityRulesValidated = 0;
let chapterCardAccessibilityParityValidated = false;
let flashcardAccessibilityRulesValidated = 0;
let flashcardAccessibilityParityValidated = false;
let audioButtonAccessibilityRulesValidated = 0;
let audioButtonAccessibilityParityValidated = false;
let questionCardAccessibilityRulesValidated = 0;
let questionCardAccessibilityParityValidated = false;
let answerOptionAccessibilityRulesValidated = 0;
let answerOptionAccessibilityParityValidated = false;
let explanationPanelAccessibilityRulesValidated = 0;
let explanationPanelAccessibilityParityValidated = false;
let uhrReferenceCardAccessibilityRulesValidated = 0;
let uhrReferenceCardAccessibilityParityValidated = false;
let celebrationBurstAccessibilityRulesValidated = 0;
let celebrationBurstAccessibilityParityValidated = false;
let examReviewItemsValidated = 0;
let examReviewSourceParityValidated = false;
let examChapterBreakdownItemsValidated = 0;
let examChapterBreakdownParityValidated = false;
let examGeneratorTypeAliasesValidated = 0;
let examGeneratorTypeInterfacesValidated = 0;
let examGeneratorTypeSchemaParityValidated = false;
let glossaryTermsValidated = 0;
let glossaryTermExactSchemaKeysValidated = 0;
let uxBenchmarksValidated = 0;
let contentTypeUnionsValidated = 0;
let contentTypeInterfacesValidated = 0;
let contentTypeSchemaParityValidated = false;
let supportedLanguagesValidated = 0;
let localizationStringsValidated = 0;
let languageSettingsParityValidated = false;
let practiceRouteCopyLabelsValidated = 0;
let practiceRouteCopyParityValidated = false;
let learnRouteLinkCopyLabelsValidated = 0;
let learnRouteLinkCopyParityValidated = false;
let mistakesRouteCopyLabelsValidated = 0;
let mistakesRouteCopyParityValidated = false;
let settingsStoreFieldsValidated = 0;
let settingsStoreSchemaParityValidated = false;
let settingsDailyGoalOptionsValidated = 0;
let settingsDailyGoalParityValidated = false;
let settingsAudioLabelsValidated = 0;
let settingsAudioParityValidated = false;
let progressQuestionFieldsValidated = 0;
let progressQuestionSchemaParityValidated = false;
let progressTypeUnionsValidated = 0;
let progressTypeInterfacesValidated = 0;
let progressTypeSchemaParityValidated = false;
let progressStoreFieldsValidated = 0;
let progressStoreSchemaParityValidated = false;
let monetizationTypeUnionsValidated = 0;
let monetizationTypeInterfacesValidated = 0;
let monetizationTypeSchemaParityValidated = false;
let purchaseTypeUnionsValidated = 0;
let purchaseTypeInterfacesValidated = 0;
let purchaseTypeSchemaParityValidated = false;
let removeAdsPurchaseRuntimeCasesValidated = 0;
let removeAdsPurchaseRuntimeParityValidated = false;
let adConsentTypeUnionsValidated = 0;
let adConsentTypeInterfacesValidated = 0;
let adConsentTypeSchemaParityValidated = false;
let mobileAdsConsentTypeInterfacesValidated = 0;
let mobileAdsConsentTypeSchemaParityValidated = false;
let mobileAdsConsentHookCasesValidated = 0;
let mobileAdsConsentHookParityValidated = false;
let rewardedAdTypeUnionsValidated = 0;
let rewardedAdTypeInterfacesValidated = 0;
let rewardedAdTypeSchemaParityValidated = false;
let mockExamAccessTypeUnionsValidated = 0;
let mockExamAccessTypeInterfacesValidated = 0;
let mockExamAccessTypeSchemaParityValidated = false;
let themeColorTokensValidated = 0;
let themeSpaceTokensValidated = 0;
let themeRadiusTokensValidated = 0;
let themeTypographyTokensValidated = 0;
let themeShadowTokensValidated = 0;
let themeMotionTokensValidated = 0;
let themeTokenSchemaValidated = false;
let badgesValidated = 0;
let badgeMilestoneParityValidated = false;
let practiceScoringRulesValidated = 0;
let practiceScoringRulesParityValidated = false;
let practiceFlowCasesValidated = 0;
let practiceFlowParityValidated = false;
let practiceSessionStoreFieldsValidated = 0;
let practiceSessionStoreSchemaParityValidated = false;
let practiceSessionStoreRuntimeParityValidated = false;
let answerValidationTypeUnionsValidated = 0;
let answerValidationTypeInterfacesValidated = 0;
let answerValidationTypeSchemaParityValidated = false;
let answerFeedbackQuestionsValidated = 0;
let answerFeedbackOptionsValidated = 0;
let answerFeedbackRuntimeParityValidated = false;
let answerShuffleSingleChoiceQuestionsValidated = 0;
let answerShuffleTrueFalseQuestionsValidated = 0;
let answerShuffleSeedDistributionsValidated = 0;
let answerShuffleSessionMovementQuestionsValidated = 0;
let answerShuffleDistributionParityValidated = false;
let questionSpeechTextQuestionsValidated = 0;
let questionSpeechTextOptionsValidated = 0;
let questionSpeechTextParityValidated = false;
let speechRuntimeCasesValidated = 0;
let speechRuntimeParityValidated = false;
let chapterQuizSessionParityValidated = 0;
let spacedRepetitionIntervalsValidated = 0;
let spacedRepetitionRuntimeParityValidated = false;
let streakRulesValidated = 0;
let streakRulesParityValidated = false;
let xpRulesValidated = 0;
let xpRulesParityValidated = false;
let masteryRulesValidated = 0;
let masteryRulesParityValidated = false;
let uhrReferencesValidated = 0;
let questionSchemasValidated = 0;
let publishedQuestionTypesValidated = 0;
let questionIdSequencesValidated = 0;
let questionBilingualTextPairsValidated = 0;
let questionOptionBilingualTextPairsValidated = 0;
let questionExactSchemaKeysValidated = 0;
let questionTextFieldsNormalizedValidated = 0;
let questionSentenceEndingsValidated = 0;
let questionAuthorityBoundaryTextValidated = 0;
let questionNestedMetaStemsValidated = 0;
let questionJudgementMetaStemsValidated = 0;
let questionGeneratedTrueFalseNaturalnessValidated = 0;
let questionFalseAnswerExplanationsValidated = 0;
let questionPromptTextUniquenessValidated = 0;
let questionOptionTextLabelsValidated = 0;
let questionTypeOptionCountsValidated = 0;
let questionOptionIdConventionsValidated = 0;
let trueFalseQuestions = 0;
let trueFalseOptionLabelsValidated = 0;
let questionTagsValidated = 0;
let questionBankCsvRowsValidated = 0;
let staticSiteQuestionBankQuestionsValidated = 0;
let staticSiteQuestionBankChaptersValidated = 0;
let staticSiteQuestionBankParityValidated = false;
let uhrMapExactSchemaKeysValidated = false;
let uhrMapChaptersValidated = 0;
let uhrMapSectionsValidated = 0;
let uhrMapSourceExactSchemaKeysValidated = false;
let uhrMapChapterExactSchemaKeysValidated = 0;
let uhrMapTextFieldsNormalizedValidated = 0;
let uhrMapPageRangesValidated = 0;
let uhrSourceMetadataValidated = false;
let uhrSourceRetrievedDateValidated = false;
let uhrSourceMaterialLinkParityValidated = false;
let questionChapterReferenceParityValidated = 0;
let authoredSourceQuestionsValidated = 0;
let authoredSourcePartitionQuestionsValidated = 0;
let sourcePublicationParityValidated = 0;
let generationParityValidated = false;
let chapterGenerationParityValidated = 0;
let generatedSourceMetadataParityValidated = 0;
let generatedExplanationTemplateParityValidated = 0;
let generatedPromptTemplateParityValidated = 0;
let generatedAnswerTemplateParityValidated = 0;
let generatedOptionSourceMaterialWordingValidated = 0;
let generatedSingleChoiceFillerOptionsValidated = 0;
let generatedSingleChoiceMetaStemsValidated = 0;
let generatedSingleChoiceExplanationLabelsValidated = 0;
let generatedTrueFalseExplanationMetaValidated = 0;
let generatedTagTemplateParityValidated = 0;

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(baseQuestions)) fail('baseQuestions export is not an array');
if (!Array.isArray(additionalQuestions)) fail('additionalQuestions export is not an array');
if (!Array.isArray(glossaryTerms)) fail('glossaryTerms export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');
if (!Array.isArray(sourceQuestions)) fail('sourceQuestions export is not an array');
if (!Array.isArray(generatedPublishedQuestions)) {
  fail('generatedPublishedQuestions export is not an array');
}
if (!Array.isArray(uxBenchmarks)) fail('uxBenchmarks export is not an array');
if (!Array.isArray(supportedLanguages)) fail('supportedLanguages export is not an array');
if (
  !localizationStrings ||
  typeof localizationStrings !== 'object' ||
  Array.isArray(localizationStrings)
) {
  fail('strings export is not an object');
}
if (typeof generateExam !== 'function') fail('generateExam export is not a function');
if (typeof buildExamReviewItems !== 'function') {
  fail('buildExamReviewItems export is not a function');
}
if (typeof scoreExam !== 'function') fail('scoreExam export is not a function');
if (typeof buildExamChapterBreakdownItems !== 'function') {
  fail('buildExamChapterBreakdownItems export is not a function');
}
if (typeof formatExamTime !== 'function') fail('formatExamTime export is not a function');
if (typeof shouldAutoSubmitExam !== 'function') {
  fail('shouldAutoSubmitExam export is not a function');
}
if (typeof scoreAnswers !== 'function') fail('scoreAnswers export is not a function');
if (typeof isCorrectAnswer !== 'function') fail('isCorrectAnswer export is not a function');
if (typeof getAnswerOptionFeedback !== 'function') {
  fail('getAnswerOptionFeedback export is not a function');
}
if (typeof shuffleQuestionOptionsForSession !== 'function') {
  fail('shuffleQuestionOptionsForSession export is not a function');
}
if (typeof summarizeAnswerShuffleDistribution !== 'function') {
  fail('summarizeAnswerShuffleDistribution export is not a function');
}
if (typeof answerShuffleDistributionIsBalanced !== 'function') {
  fail('answerShuffleDistributionIsBalanced export is not a function');
}
if (typeof ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE !== 'number') {
  fail('ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE export is not a number');
}
if (typeof buildQuestionSpeechText !== 'function') {
  fail('buildQuestionSpeechText export is not a function');
}
if (typeof speakSwedish !== 'function') fail('speakSwedish export is not a function');
if (typeof stopSpeech !== 'function') fail('stopSpeech export is not a function');
if (typeof getPracticeQuestionForSession !== 'function') {
  fail('getPracticeQuestionForSession export is not a function');
}
if (typeof getChapterQuizSessionId !== 'function') {
  fail('getChapterQuizSessionId export is not a function');
}
if (
  !usePracticeSessionStore ||
  typeof usePracticeSessionStore.getState !== 'function' ||
  typeof usePracticeSessionStore.setState !== 'function'
) {
  fail('usePracticeSessionStore export is not a Zustand store');
}
if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) {
  fail('badgeCatalog export is not an object');
}
if (typeof deriveBadges !== 'function') fail('deriveBadges export is not a function');
if (!Array.isArray(spacedRepetitionSchedule)) {
  fail('spacedRepetitionSchedule export is not an array');
}
if (typeof getNextReviewAt !== 'function') fail('getNextReviewAt export is not a function');
if (typeof calculateStreak !== 'function') fail('calculateStreak export is not a function');
if (typeof calculateAnswerXp !== 'function') fail('calculateAnswerXp export is not a function');
if (typeof calculateQuizCompletionXp !== 'function') {
  fail('calculateQuizCompletionXp export is not a function');
}
if (typeof calculateLevel !== 'function') fail('calculateLevel export is not a function');
if (typeof calculateMastery !== 'function') fail('calculateMastery export is not a function');
if (typeof calculateChapterMastery !== 'function') {
  fail('calculateChapterMastery export is not a function');
}
if (typeof findWeakChapterIds !== 'function') fail('findWeakChapterIds export is not a function');
if (!isObjectRecord(colors)) fail('theme colors export is not an object');
if (!isObjectRecord(motion)) fail('theme motion export is not an object');
if (!isObjectRecord(radius)) fail('theme radius export is not an object');
if (!isObjectRecord(shadows)) fail('theme shadows export is not an object');
if (!isObjectRecord(space)) fail('theme space export is not an object');
if (!isObjectRecord(typography)) fail('theme typography export is not an object');
if (!isObjectRecord(adsConfig)) fail('adsConfig export is not an object');
if (typeof shouldShowAd !== 'function') fail('shouldShowAd export is not a function');
if (typeof shouldSuppressLaunchPopupAdForPath !== 'function') {
  fail('shouldSuppressLaunchPopupAdForPath export is not a function');
}
if (!isObjectRecord(consentConfig)) fail('consentConfig export is not an object');
if (!isObjectRecord(FREE_ENTITLEMENTS)) fail('FREE_ENTITLEMENTS export is not an object');
if (!isObjectRecord(PREMIUM_ENTITLEMENTS)) fail('PREMIUM_ENTITLEMENTS export is not an object');
if (!isObjectRecord(REMOVE_ADS_ENTITLEMENTS)) {
  fail('REMOVE_ADS_ENTITLEMENTS export is not an object');
}
if (typeof hasAdsDisabled !== 'function') fail('hasAdsDisabled export is not a function');
if (typeof isPremiumUser !== 'function') fail('isPremiumUser export is not a function');
if (!isObjectRecord(premiumConfig)) fail('premiumConfig export is not an object');
if (!hasText(REMOVE_ADS_PRICE_LABEL)) fail('REMOVE_ADS_PRICE_LABEL export is missing');
if (!hasText(REMOVE_ADS_PRODUCT_ID)) fail('REMOVE_ADS_PRODUCT_ID export is missing');
if (!isObjectRecord(releaseMonetizationPolicy)) {
  fail('releaseMonetizationPolicy export is not an object');
}
if (typeof isReleaseMonetizationPolicyReady !== 'function') {
  fail('isReleaseMonetizationPolicyReady export is not a function');
}

function getExpoPluginEntry(plugins, pluginName) {
  return plugins.find((plugin) => {
    if (typeof plugin === 'string') return plugin === pluginName;
    if (Array.isArray(plugin)) return plugin[0] === pluginName;
    return false;
  });
}

function getPluginConfig(pluginEntry) {
  return Array.isArray(pluginEntry) && pluginEntry[1] && typeof pluginEntry[1] === 'object'
    ? pluginEntry[1]
    : undefined;
}

function validateAppConfigSchema() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  const expo = appConfig?.expo;
  if (!expo || typeof expo !== 'object' || Array.isArray(expo)) {
    reject('app.json expo config is missing');
    return;
  }

  if (expo.name !== 'Sweden Citizenship Test Prep') {
    reject('app.json expo.name must identify the release app');
  }
  if (expo.slug !== 'swedish-civic-test') {
    reject('app.json expo.slug must be swedish-civic-test');
  }
  if (expo.scheme !== expo.slug) {
    reject('app.json expo.scheme must match expo.slug');
  }
  if (expo.version !== packageMetadata.version) {
    reject(
      `app.json expo.version ${expo.version} must match package.json version ${packageMetadata.version}`,
    );
  }
  if (expo.orientation !== 'portrait') {
    reject('app.json expo.orientation must be portrait');
  }
  if (expo.userInterfaceStyle !== 'light') {
    reject('app.json expo.userInterfaceStyle must be light');
  }
  if (expo.newArchEnabled !== true) {
    reject('app.json expo.newArchEnabled must be true');
  }
  if (expo.ios?.bundleIdentifier !== EXPECTED_APP_NATIVE_IDENTIFIER) {
    reject(`app.json ios.bundleIdentifier must be ${EXPECTED_APP_NATIVE_IDENTIFIER}`);
  }
  if (expo.android?.package !== EXPECTED_APP_NATIVE_IDENTIFIER) {
    reject(`app.json android.package must be ${EXPECTED_APP_NATIVE_IDENTIFIER}`);
  }

  const plugins = expo.plugins;
  if (!Array.isArray(plugins)) {
    reject('app.json expo.plugins must be an array');
  } else {
    for (const pluginName of EXPECTED_APP_CONFIG_PLUGINS) {
      const pluginEntry = getExpoPluginEntry(plugins, pluginName);
      if (!pluginEntry) {
        reject(`app.json missing required plugin ${pluginName}`);
      } else {
        appConfigPluginsValidated += 1;
      }
    }

    const googleAdsConfig = getPluginConfig(
      getExpoPluginEntry(plugins, 'react-native-google-mobile-ads'),
    );
    if (!googleAdsConfig) {
      reject('app.json react-native-google-mobile-ads plugin must include config');
    } else {
      const adMobAppIdPattern = /^ca-app-pub-\d{16}~\d{10}$/;
      if (!adMobAppIdPattern.test(String(googleAdsConfig.androidAppId ?? ''))) {
        reject('app.json react-native-google-mobile-ads androidAppId must be configured');
      }
      if (!adMobAppIdPattern.test(String(googleAdsConfig.iosAppId ?? ''))) {
        reject('app.json react-native-google-mobile-ads iosAppId must be configured');
      }
      if (googleAdsConfig.delayAppMeasurementInit !== true) {
        reject('app.json react-native-google-mobile-ads must delay app measurement initialization');
      }
      if (googleAdsConfig.userTrackingUsageDescription !== EXPECTED_TRACKING_PERMISSION) {
        reject('app.json Google ads tracking usage description must match ATT permission copy');
      }
    }

    const trackingConfig = getPluginConfig(
      getExpoPluginEntry(plugins, 'expo-tracking-transparency'),
    );
    if (!trackingConfig) {
      reject('app.json expo-tracking-transparency plugin must include config');
    } else if (trackingConfig.userTrackingPermission !== EXPECTED_TRACKING_PERMISSION) {
      reject('app.json ATT permission copy must match Google ads tracking usage description');
    }
  }

  if (valid && appConfigPluginsValidated === EXPECTED_APP_CONFIG_PLUGINS.length) {
    appConfigSchemaValidated = true;
  }
}

function validateLaunchAdRouteSuppressionParity() {
  let valid = true;
  let rootLayout = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  const suppressedRoutes = adsConfig?.suppressedLaunchPopupRoutes;
  if (!Array.isArray(suppressedRoutes)) {
    reject('adsConfig.suppressedLaunchPopupRoutes must be an array');
  } else if (!arrayEquals(suppressedRoutes, EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES)) {
    reject(
      `launch popup suppressed routes are ${JSON.stringify(
        suppressedRoutes,
      )}, expected ${JSON.stringify(EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES)}`,
    );
  }

  for (const route of EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES) {
    const routeFile = EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTE_FILES[route];
    if (!fs.existsSync(path.join(repoRoot, routeFile))) {
      reject(`${route} launch-ad suppression route file ${routeFile} is missing`);
      continue;
    }

    const routeIsSuppressed =
      typeof shouldSuppressLaunchPopupAdForPath === 'function' &&
      shouldSuppressLaunchPopupAdForPath(route) === true &&
      shouldSuppressLaunchPopupAdForPath(`${route}/nested`) === true;
    if (!routeIsSuppressed) {
      reject(`${route} must suppress the launch popup ad, including nested paths`);
    } else {
      launchAdSuppressedRoutesValidated += 1;
    }
  }

  if (typeof shouldSuppressLaunchPopupAdForPath === 'function') {
    for (const studyRoute of ['/', '/home', '/learn', '/mistakes', '/profile']) {
      if (shouldSuppressLaunchPopupAdForPath(studyRoute)) {
        reject(`${studyRoute} must remain eligible for the launch popup ad`);
      }
    }
  }

  try {
    rootLayout = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');
  } catch (error) {
    reject(`app/_layout.tsx could not be read: ${error.message}`);
    return;
  }

  if (!rootLayout.includes('usePathname()')) {
    reject('root layout must read the current pathname before rendering the launch ad');
  }
  if (!rootLayout.includes('shouldSuppressLaunchPopupAdForPath(pathname)')) {
    reject('root layout must derive launch ad suppression from current pathname');
  }
  if (!rootLayout.includes('!suppressLaunchPopupAd && entitlementsReady')) {
    reject('root layout must gate LaunchPopupAd on route suppression and entitlement readiness');
  }

  if (
    valid &&
    launchAdSuppressedRoutesValidated === EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES.length
  ) {
    launchAdRouteSuppressionParityValidated = true;
  }
}

function validateTabNavigationParity() {
  let valid = true;
  let tabLayout = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    tabLayout = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/_layout.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/_layout.tsx could not be read: ${error.message}`);
    return;
  }

  for (const rule of EXPECTED_TAB_NAVIGATION_RULES) {
    if (!rule.pattern.test(tabLayout)) {
      reject(`tab layout must satisfy ${rule.label}`);
    } else {
      tabNavigationRulesValidated += 1;
    }
  }

  if (tabLayout.includes('⏷')) {
    reject('tab layout must not include visible placeholder tab glyphs');
  }

  const swedishTabCopyBlock = tabLayout.match(/sv:\s*\{([\s\S]*?)\},\s*en:/)?.[1] ?? '';
  const swedishExamTabTitle = swedishTabCopyBlock.match(/exam:\s*'([^']+)'/)?.[1] ?? '';
  if (swedishExamTabTitle !== 'Övningsprov') {
    reject('exam tab Swedish title must use Övningsprov, not bare real-exam wording');
  }

  for (const route of EXPECTED_TAB_NAVIGATION_ROUTES) {
    const routePattern = new RegExp(
      `<Tabs\\.Screen\\s+name="${route.routeName}"\\s+options=\\{getTabOptions\\(copy\\.${route.routeName}\\)\\}`,
    );
    const svPattern = new RegExp(`${route.routeName}: '${escapeRegExp(route.sv)}'`);
    const enPattern = new RegExp(`${route.routeName}: '${escapeRegExp(route.en)}'`);

    if (!routePattern.test(tabLayout)) {
      reject(`${route.routeName} tab must use getTabOptions(copy.${route.routeName})`);
      continue;
    }
    if (!svPattern.test(tabLayout) || !enPattern.test(tabLayout)) {
      reject(`${route.routeName} tab must define Swedish and English titles`);
      continue;
    }

    tabNavigationRoutesValidated += 1;
  }

  if (
    valid &&
    tabNavigationRulesValidated === EXPECTED_TAB_NAVIGATION_RULES.length &&
    tabNavigationRoutesValidated === EXPECTED_TAB_NAVIGATION_ROUTES.length
  ) {
    tabNavigationParityValidated = true;
  }
}

function validateAdPlacementRouteParity() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  const safePlacements = Array.isArray(adsConfig?.safePlacements) ? adsConfig.safePlacements : [];
  const blockedPlacements = Array.isArray(adsConfig?.blockedPlacements)
    ? adsConfig.blockedPlacements
    : [];

  for (const spec of EXPECTED_ROUTE_AD_PLACEMENTS) {
    let source = '';
    let routeIsValid = true;

    try {
      source = fs.readFileSync(path.join(repoRoot, spec.file), 'utf8');
    } catch (error) {
      reject(`${spec.file} could not be read for ad placement parity: ${error.message}`);
      continue;
    }

    if (!source.includes(`components/monetization/${spec.component}`)) {
      reject(`${spec.file} must import ${spec.component} from the monetization components`);
      routeIsValid = false;
    }

    if (!spec.pattern.test(source)) {
      reject(`${spec.file} must render ${spec.component} placement ${spec.placement}`);
      routeIsValid = false;
    }

    if (!safePlacements.includes(spec.placement)) {
      reject(`adsConfig.safePlacements must include routed placement ${spec.placement}`);
      routeIsValid = false;
    }

    if (typeof shouldShowAd === 'function') {
      if (!shouldShowAd(spec.placement, { adsDisabled: false })) {
        reject(`${spec.placement} must render for free users with test ad config`);
        routeIsValid = false;
      }
      if (shouldShowAd(spec.placement, { adsDisabled: true })) {
        reject(`${spec.placement} must be hidden after Remove Ads is active`);
        routeIsValid = false;
      }
    }

    if (spec.component === 'NativeAdCard') {
      const nativeAdCardSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
        'utf8',
      );
      if (!nativeAdCardSource.includes(`shouldShowAd('${spec.placement}', resolvedEntitlements)`)) {
        reject(`NativeAdCard must gate ${spec.placement} through shouldShowAd`);
        routeIsValid = false;
      }
    }

    if (routeIsValid) adPlacementRoutesValidated += 1;
  }

  for (const file of EXPECTED_NO_AD_ROUTE_FILES) {
    let source = '';
    let routeIsValid = true;

    try {
      source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (error) {
      reject(`${file} could not be read for no-ad route parity: ${error.message}`);
      continue;
    }

    if (/AdBanner|NativeAd|Interstitial|LaunchPopupAd/.test(source)) {
      reject(`${file} must not import or render ad components`);
      routeIsValid = false;
    }

    if (!blockedPlacements.includes('exam_screen')) {
      reject('adsConfig.blockedPlacements must include exam_screen');
      routeIsValid = false;
    }

    if (typeof shouldShowAd === 'function' && shouldShowAd('exam_screen', { adsDisabled: false })) {
      reject('exam_screen must never render ads');
      routeIsValid = false;
    }

    if (routeIsValid) noAdRoutesValidated += 1;
  }

  if (
    valid &&
    adPlacementRoutesValidated === EXPECTED_ROUTE_AD_PLACEMENTS.length &&
    noAdRoutesValidated === EXPECTED_NO_AD_ROUTE_FILES.length
  ) {
    adPlacementRouteParityValidated = true;
  }
}

function validateReleaseMonetizationPolicyParity() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!isObjectRecord(releaseMonetizationPolicy)) return;

  const expectedFieldValues = {
    adSupportedByDefault: true,
    adMobAppRecordRequired: true,
    appAdsTxtReviewRequired: true,
    consentPromptsRequired: EXPECTED_RELEASE_CONSENT_PROMPTS,
    noAdPlacements: EXPECTED_RELEASE_NO_AD_PLACEMENTS,
    privacyReviewRequiresBinary: true,
    realAdsEnvFlag: EXPECTED_RELEASE_REAL_ADS_ENV_FLAG,
    removeAdsPriceLabel: REMOVE_ADS_PRICE_LABEL,
    removeAdsProductId: REMOVE_ADS_PRODUCT_ID,
    storeDisclosureTopics: EXPECTED_RELEASE_STORE_DISCLOSURE_TOPICS,
  };

  const actualFieldNames = Object.keys(releaseMonetizationPolicy);
  if (!arrayEquals(actualFieldNames, EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS)) {
    reject(
      `releaseMonetizationPolicy fields are ${JSON.stringify(
        actualFieldNames,
      )}, expected ${JSON.stringify(EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS)}`,
    );
  }

  EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS.forEach((fieldName) => {
    const actualValue = releaseMonetizationPolicy[fieldName];
    const expectedValue = expectedFieldValues[fieldName];

    if (!jsonEqual(actualValue, expectedValue)) {
      reject(
        `releaseMonetizationPolicy.${fieldName} is ${JSON.stringify(
          actualValue,
        )}, expected ${JSON.stringify(expectedValue)}`,
      );
      return;
    }

    releaseMonetizationPolicyFieldsValidated += 1;
  });

  if (typeof isReleaseMonetizationPolicyReady !== 'function') return;
  if (!isReleaseMonetizationPolicyReady()) {
    reject('isReleaseMonetizationPolicyReady must return true for the current release policy');
  }

  if (!Array.isArray(consentConfig?.prompts)) {
    reject('consentConfig.prompts must be an array for release policy parity');
  } else if (
    !arrayEquals(releaseMonetizationPolicy.consentPromptsRequired, consentConfig.prompts)
  ) {
    reject('releaseMonetizationPolicy consent prompts must match consentConfig.prompts');
  }

  if (!Array.isArray(adsConfig?.blockedPlacements)) {
    reject('adsConfig.blockedPlacements must be an array for release policy parity');
  } else if (!arrayEquals(releaseMonetizationPolicy.noAdPlacements, adsConfig.blockedPlacements)) {
    reject('releaseMonetizationPolicy no-ad placements must match adsConfig.blockedPlacements');
  }

  const storeDisclosureLabels = Array.isArray(consentConfig?.storeDisclosureLabels)
    ? consentConfig.storeDisclosureLabels
    : [];
  storeDisclosureLabels.forEach((label) => {
    if (!releaseMonetizationPolicy.storeDisclosureTopics?.includes(label)) {
      reject(`releaseMonetizationPolicy store disclosures must include ${label}`);
    }
  });

  if (
    valid &&
    releaseMonetizationPolicyFieldsValidated === EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS.length
  ) {
    releaseMonetizationPolicyParityValidated = true;
  }
}

function validateRemoveAdsEntitlementHookParity() {
  let valid = true;
  let hookSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    hookSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/useRemoveAdsEntitlements.ts could not be read: ${error.message}`);
    return;
  }

  const normalizedHookSource = hookSource.replace(/\s+/g, ' ');
  const hookCases = [
    [
      /const\s+AD_BLOCKED_PENDING_ENTITLEMENTS:\s*PremiumEntitlements\s*=\s*\{[\s\S]*\.\.\.FREE_ENTITLEMENTS,[\s\S]*adsDisabled:\s*true,[\s\S]*\};/.test(
        hookSource,
      ),
      'Remove Ads entitlement hook must fail closed while purchase state loads',
    ],
    [
      normalizedHookSource.includes('provider: createMockPurchaseProvider(),') &&
        normalizedHookSource.includes('storage: createWebPurchaseStorage(initialAdsDisabled),'),
      'web purchase runtime must preserve mock provider plus initial adsDisabled storage',
    ],
    [
      normalizedHookSource.includes('void getPurchaseEntitlements(purchaseRuntime)') &&
        normalizedHookSource.includes('publishRemoveAdsEntitlements(storedEntitlements);'),
      'Remove Ads entitlement hook must publish persisted purchase entitlements',
    ],
    [
      /if\s*\(\s*explicitEntitlements\s*\)\s*\{\s*return\s*\{\s*entitlements:\s*explicitEntitlements,\s*entitlementsReady:\s*true,?\s*\};\s*\}/.test(
        hookSource,
      ),
      'explicit ad entitlements must bypass async purchase loading as ready',
    ],
    [
      /if\s*\(\s*!entitlementsReady\s*\)\s*\{\s*return\s*\{\s*entitlements:\s*AD_BLOCKED_PENDING_ENTITLEMENTS,\s*entitlementsReady:\s*false,?\s*\};\s*\}/.test(
        hookSource,
      ),
      'unresolved purchase state must return ad-blocked pending entitlements',
    ],
  ];

  hookCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }
    removeAdsEntitlementHookCasesValidated += 1;
  });

  if (valid && removeAdsEntitlementHookCasesValidated === EXPECTED_REMOVE_ADS_HOOK_CASES) {
    removeAdsEntitlementHookParityValidated = true;
  }
}

function validatePremiumEntitlementParity() {
  let valid = true;
  let premiumSource = '';
  let adsSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    premiumSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/premium.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/premium.ts could not be read: ${error.message}`);
  }

  try {
    adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/ads.ts could not be read: ${error.message}`);
  }

  const entitlementExports = {
    FREE_ENTITLEMENTS,
    PREMIUM_ENTITLEMENTS,
    REMOVE_ADS_ENTITLEMENTS,
  };
  const entitlementFields = ['adsDisabled', 'unlimitedMockExams', 'fullMistakeReview'];

  EXPECTED_PREMIUM_ENTITLEMENT_STATES.forEach(({ configKey, entitlements, exportName }) => {
    const actualEntitlements = entitlementExports[exportName];
    let stateIsValid = true;

    function rejectState(message) {
      stateIsValid = false;
      reject(message);
    }

    if (!isObjectRecord(actualEntitlements)) {
      rejectState(`${exportName} must be an object`);
    } else {
      const actualFields = Object.keys(actualEntitlements);
      if (!arrayEquals(actualFields, entitlementFields)) {
        rejectState(
          `${exportName} fields are ${JSON.stringify(actualFields)}, expected ${JSON.stringify(
            entitlementFields,
          )}`,
        );
      }

      entitlementFields.forEach((fieldName) => {
        if (typeof actualEntitlements[fieldName] !== 'boolean') {
          rejectState(`${exportName}.${fieldName} must be boolean`);
        } else if (actualEntitlements[fieldName] !== entitlements[fieldName]) {
          rejectState(
            `${exportName}.${fieldName} is ${actualEntitlements[fieldName]}, expected ${entitlements[fieldName]}`,
          );
        }
      });
    }

    if (!isObjectRecord(premiumConfig?.[configKey])) {
      rejectState(`premiumConfig.${configKey} must expose ${exportName}`);
    } else if (!jsonEqual(premiumConfig[configKey], actualEntitlements)) {
      rejectState(`premiumConfig.${configKey} must match ${exportName}`);
    }

    if (stateIsValid) premiumEntitlementStatesValidated += 1;
  });

  if (typeof hasAdsDisabled === 'function') {
    if (hasAdsDisabled(FREE_ENTITLEMENTS) !== false) {
      reject('hasAdsDisabled must return false for FREE_ENTITLEMENTS');
    }
    if (hasAdsDisabled(REMOVE_ADS_ENTITLEMENTS) !== true) {
      reject('hasAdsDisabled must return true for REMOVE_ADS_ENTITLEMENTS');
    }
  }

  if (typeof isPremiumUser === 'function') {
    if (isPremiumUser(FREE_ENTITLEMENTS) !== false) {
      reject('isPremiumUser must return false for FREE_ENTITLEMENTS');
    }
    if (isPremiumUser(PREMIUM_ENTITLEMENTS) !== true) {
      reject('isPremiumUser must return true for PREMIUM_ENTITLEMENTS');
    }
    if (isPremiumUser(REMOVE_ADS_ENTITLEMENTS) !== false) {
      reject('isPremiumUser must not treat Remove Ads as full premium');
    }
    if (
      isPremiumUser({
        adsDisabled: false,
        unlimitedMockExams: true,
        fullMistakeReview: true,
      }) !== true
    ) {
      reject('isPremiumUser must stay decoupled from adsDisabled');
    }
  }

  if (typeof shouldShowAd === 'function' && shouldShowAd('home_banner', REMOVE_ADS_ENTITLEMENTS)) {
    reject('shouldShowAd must not render home_banner when adsDisabled is true');
  }

  if (!/if\s*\(\s*entitlements\.adsDisabled\s*\)\s*return false;/.test(adsSource)) {
    reject('shouldShowAd must keep an explicit adsDisabled fail-closed branch');
  }

  if (
    !/return\s+entitlements\.unlimitedMockExams\s*&&\s*entitlements\.fullMistakeReview;/.test(
      premiumSource,
    )
  ) {
    reject('isPremiumUser must depend on premium capabilities rather than adsDisabled');
  }

  if (valid && premiumEntitlementStatesValidated === EXPECTED_PREMIUM_ENTITLEMENT_STATES.length) {
    premiumEntitlementParityValidated = true;
  }
}

function validateQuestionDisclaimerParity() {
  let copyIsValid = true;

  function rejectCopy(message) {
    copyIsValid = false;
    fail(message);
  }

  let componentSource = '';
  let disclaimerRouteSource = '';
  try {
    componentSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
      'utf8',
    );
  } catch (error) {
    rejectCopy(`components/quiz/QuestionDisclaimer.tsx could not be read: ${error.message}`);
  }
  try {
    disclaimerRouteSource = fs.readFileSync(path.join(repoRoot, 'app/disclaimer.tsx'), 'utf8');
  } catch (error) {
    rejectCopy(`app/disclaimer.tsx could not be read: ${error.message}`);
  }

  const componentLower = componentSource.toLocaleLowerCase('en-US');
  const routeLower = disclaimerRouteSource.toLocaleLowerCase('en-US');
  REQUIRED_QUESTION_DISCLAIMER_PHRASES.forEach((phrase) => {
    const normalizedPhrase = phrase.toLocaleLowerCase('en-US');
    if (!componentLower.includes(normalizedPhrase)) {
      rejectCopy(`QuestionDisclaimer missing required "${phrase}" wording`);
    }
    if (!routeLower.includes(normalizedPhrase)) {
      rejectCopy(`app/disclaimer.tsx missing required "${phrase}" wording`);
    }
  });

  if (!/export function QuestionDisclaimer/.test(componentSource)) {
    rejectCopy('QuestionDisclaimer component must keep its named export');
  }
  if (/guaranteed|guarantee/i.test(componentSource)) {
    rejectCopy('QuestionDisclaimer must not imply guaranteed exam outcomes');
  }

  if (copyIsValid) questionDisclaimerCopyValidated = true;

  EXPECTED_QUESTION_DISCLAIMER_ROUTES.forEach(({ route, file }) => {
    let routeIsValid = true;
    let source = '';

    try {
      source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (error) {
      routeIsValid = false;
      fail(`${file} could not be read for ${route} disclaimer coverage: ${error.message}`);
    }

    if (!/import\s+\{\s*QuestionDisclaimer\s*\}/.test(source)) {
      routeIsValid = false;
      fail(`${file} must import QuestionDisclaimer for ${route}`);
    }
    if (!QUESTION_DISCLAIMER_USAGE_PATTERN.test(source)) {
      routeIsValid = false;
      fail(`${file} is missing QuestionDisclaimer for ${route}`);
    }

    if (routeIsValid) questionDisclaimerRoutesValidated += 1;
  });
}

function validateMockExamConfigTypeSchemaParity() {
  let valid = true;
  let mockExamConfigSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mockExamConfigSource = fs.readFileSync(path.join(repoRoot, 'data/mockExamConfig.ts'), 'utf8');
  } catch (error) {
    reject(`data/mockExamConfig.ts could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(mockExamConfigSource, 'MockExamConfig');
  if (!Array.isArray(actualFields)) {
    reject('data/mockExamConfig.ts MockExamConfig interface could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_MOCK_EXAM_CONFIG_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `MockExamConfig fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_MOCK_EXAM_CONFIG_FIELDS.forEach((expectedField) => {
    const actualField = actualFieldsByName.get(expectedField.name);
    let fieldIsValid = true;

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`MockExamConfig missing ${expectedField.name}`);
    } else {
      if (actualField.type !== expectedField.type) {
        rejectField(
          `MockExamConfig.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectField(
          `MockExamConfig.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    }

    if (fieldIsValid) mockExamConfigTypeFieldsValidated += 1;
  });

  if (valid && mockExamConfigTypeFieldsValidated === EXPECTED_MOCK_EXAM_CONFIG_FIELDS.length) {
    mockExamConfigTypeSchemaParityValidated = true;
  }
}

function validateMockExamConfig(config, publishedQuestionCount) {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!config || typeof config !== 'object') {
    reject('defaultMockExamConfig export is not an object');
  } else {
    mockExamConfigExactSchemaKeyFailures(config, 'defaultMockExamConfig').forEach(reject);

    if (!Number.isInteger(config.questionCount) || config.questionCount < 1) {
      reject('defaultMockExamConfig questionCount must be a positive integer');
    } else if (config.questionCount > publishedQuestionCount) {
      reject(
        `defaultMockExamConfig questionCount ${config.questionCount} exceeds ${publishedQuestionCount} published questions`,
      );
    }

    if (!Number.isInteger(config.durationMinutes) || config.durationMinutes < 1) {
      reject('defaultMockExamConfig durationMinutes must be a positive integer');
    }
    if (config.sourceScope !== 'uhr_based') {
      reject('defaultMockExamConfig sourceScope must be uhr_based');
    }
    if (config.showExplanationsDuringExam !== false) {
      reject('defaultMockExamConfig must not show explanations during the exam');
    }
    if (config.adsAllowedDuringExam !== false) {
      reject('defaultMockExamConfig must not allow ads during the exam');
    }
  }

  if (valid) {
    mockExamConfigExactSchemaKeysValidated = true;
    mockExamConfigValidated = true;
  }
}

function validateMockExamRuntimeParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(examQuestions)) {
    reject('generateExam did not return an array for defaultMockExamConfig');
    return;
  }

  if (examQuestions.length !== config.questionCount) {
    reject(
      `default mock exam generated ${examQuestions.length} questions, expected ${config.questionCount}`,
    );
  }

  const examQuestionIds = new Set();
  const expectedChapterCoverage = Math.min(
    Array.isArray(chapters) ? chapters.length : 0,
    config.questionCount,
  );
  const coveredChapters = new Set();
  const chapterCounts = new Map();
  examQuestions.forEach((question, index) => {
    const label = question?.id || `mock exam question[${index}]`;

    if (!question || typeof question !== 'object') {
      reject(`mock exam question[${index}] is not an object`);
      return;
    }
    if (examQuestionIds.has(question.id)) {
      reject(`default mock exam repeats question ${question.id}`);
    }
    if (hasText(question.id)) examQuestionIds.add(question.id);
    if (question.reviewStatus !== 'published') {
      reject(`${label} mock exam reviewStatus is ${question.reviewStatus}, expected published`);
    }
    if (!question.uhrReference?.chapter || !question.uhrReference?.section) {
      reject(`${label} mock exam question is missing a UHR reference`);
    }
    if (hasText(question.chapterId)) {
      coveredChapters.add(question.chapterId);
      chapterCounts.set(question.chapterId, (chapterCounts.get(question.chapterId) || 0) + 1);
    }
  });

  if (expectedChapterCoverage > 0 && coveredChapters.size !== expectedChapterCoverage) {
    reject(
      `default mock exam covers ${coveredChapters.size} chapters, expected ${expectedChapterCoverage}`,
    );
  }

  const chapterCountValues = [...chapterCounts.values()];
  if (config.questionCount > 0 && chapterCountValues.length === 0) {
    reject('default mock exam did not count any chapter buckets');
  } else if (chapterCountValues.length > 0) {
    const minChapterCount = Math.min(...chapterCountValues);
    const maxChapterCount = Math.max(...chapterCountValues);
    const countedQuestions = chapterCountValues.reduce((sum, count) => sum + count, 0);

    if (countedQuestions !== examQuestions.length) {
      reject(
        `default mock exam counted ${countedQuestions} chapter assignments for ${examQuestions.length} questions`,
      );
    }
    if (maxChapterCount - minChapterCount > 1) {
      reject(
        `default mock exam chapter counts are unbalanced: ${JSON.stringify(Object.fromEntries(chapterCounts))}`,
      );
    }
  }

  if (valid) mockExamRuntimeParityValidated = true;
  if (valid) mockExamChapterBalanceParityValidated = true;
}

function expectedFormattedExamTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function validateMockExamTimerParity(config) {
  if (!config || typeof config !== 'object') return;
  if (typeof formatExamTime !== 'function' || typeof shouldAutoSubmitExam !== 'function') return;

  const totalSeconds = config.durationMinutes * 60;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Number.isInteger(totalSeconds) || totalSeconds < 60) {
    reject('defaultMockExamConfig duration must convert to at least 60 whole seconds');
  }

  const formattedStartTime = formatExamTime(totalSeconds);
  const expectedStartTime = expectedFormattedExamTime(totalSeconds);
  if (formattedStartTime !== expectedStartTime) {
    reject(
      `formatExamTime default duration is ${formattedStartTime}, expected ${expectedStartTime}`,
    );
  }

  const liveExamState = {
    remainingSeconds: totalSeconds,
    submitted: false,
    questionCount: config.questionCount,
  };
  if (shouldAutoSubmitExam(liveExamState)) {
    reject('shouldAutoSubmitExam must not submit at the configured start time');
  }
  if (
    !shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must submit a live exam when the timer reaches zero');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      submitted: true,
    })
  ) {
    reject('shouldAutoSubmitExam must not resubmit an already submitted exam');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      questionCount: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must not submit an empty exam');
  }
  if (formatExamTime(-1) !== '00:00') {
    reject('formatExamTime must clamp negative remaining time to 00:00');
  }

  if (valid) mockExamTimerParityValidated = true;
}

function validateExamSubmissionFinalityParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/exam.tsx could not be read: ${error.message}`);
    return;
  }

  if (
    !examRoute.includes('Submitted results are final. Start another mock exam for a fresh attempt.')
  ) {
    reject('exam result screen must tell users submitted results are final');
  }
  if (examRoute.includes('Back to exam answers') || examRoute.includes('Back to answers')) {
    reject('exam result screen must not offer a back-to-answers control after submission');
  }
  if (examRoute.includes('onPress={() => setSubmitted(false)}')) {
    reject('exam result screen must not directly reopen submitted answers');
  }
  if (
    !examRoute.includes(
      'disabled: !completionRecorded || !canStartAccessibleExam || startingAccessibleExam',
    ) ||
    !examRoute.includes(
      'disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}',
    )
  ) {
    reject('next-exam control must stay disabled until the submitted completion is stored');
  }
  if (
    !examRoute.includes('const recordMockExamSession = useProgressStore') ||
    !examRoute.includes('recordMockExamSession({') ||
    !examRoute.includes(
      'score: resultTotalCount > 0 ? resultCorrectCount / resultTotalCount : 0',
    ) ||
    !examRoute.includes('completedAt: new Date().toISOString()')
  ) {
    reject('exam result submission must persist a completed mock-exam score for readiness');
  }

  if (valid) examSubmissionFinalityParityValidated = true;
}

function countExamRouteHeaderOccurrences(source, { styleName, pattern }) {
  const headerPattern = new RegExp(
    `<Text\\s+accessibilityRole="header"\\s+style=\\{styles\\.${styleName}\\}>\\s*${pattern.source}\\s*</Text>`,
    'g',
  );
  return (source.match(headerPattern) || []).length;
}

function validateExamRouteHeaderParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/exam.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    examRoute.match(/<Text style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('exam route title and sectionTitle text must expose accessibilityRole="header"');
  }

  EXPECTED_EXAM_ROUTE_HEADERS.forEach((expectedHeader) => {
    const actualOccurrences = countExamRouteHeaderOccurrences(examRoute, expectedHeader);
    if (actualOccurrences !== expectedHeader.occurrences) {
      reject(
        `exam route header ${expectedHeader.label} appears ${actualOccurrences} times as a ${expectedHeader.styleName} header, expected ${expectedHeader.occurrences}`,
      );
      return;
    }
    examRouteHeadersValidated += actualOccurrences;
  });

  const expectedHeaderCount = EXPECTED_EXAM_ROUTE_HEADERS.reduce(
    (sum, expectedHeader) => sum + expectedHeader.occurrences,
    0,
  );
  if (valid && examRouteHeadersValidated === expectedHeaderCount) {
    examRouteHeaderParityValidated = true;
  }
}

function validateExamRouteCopyParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`exam route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_EXAM_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!examRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_EXAM_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`exam route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!examRoute.includes(label)) {
        labelIsValid = false;
        reject(`exam route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`exam route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) examRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_EXAM_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && examRouteCopyLabelsValidated === expectedLabelCount) {
    examRouteCopyParityValidated = true;
  }
}

function validateQuizRouteHeaderParity() {
  let valid = true;
  let quizRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    quizRoute = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  } catch (error) {
    reject(`app/quiz/[sessionId].tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteTitles = quizRoute.match(/<Text style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteTitles.length > 0) {
    reject('quiz route title text must expose accessibilityRole="header"');
  }

  EXPECTED_QUIZ_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(quizRoute)) {
      reject(`quiz route missing ${expectedHeader.label} as a title header`);
      return;
    }
    quizRouteHeadersValidated += 1;
  });

  if (valid && quizRouteHeadersValidated === EXPECTED_QUIZ_ROUTE_HEADERS.length) {
    quizRouteHeaderParityValidated = true;
  }
}

function validateQuizRouteCopyParity() {
  let valid = true;
  let quizRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    quizRoute = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  } catch (error) {
    reject(`quiz route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_QUIZ_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!quizRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_QUIZ_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`quiz route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!quizRoute.includes(label)) {
        labelIsValid = false;
        reject(`quiz route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`quiz route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) quizRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_QUIZ_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && quizRouteCopyLabelsValidated === expectedLabelCount) {
    quizRouteCopyParityValidated = true;
  }
}

function validatePracticeRouteHeaderParity() {
  let valid = true;
  let practiceRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    practiceRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/practice.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteTitles = practiceRoute.match(/<Text\s+style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteTitles.length > 0) {
    reject('practice route title text must expose accessibilityRole="header"');
  }

  EXPECTED_PRACTICE_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(practiceRoute)) {
      reject(`practice route missing ${expectedHeader.label} as a title header`);
      return;
    }
    practiceRouteHeadersValidated += 1;
  });

  if (valid && practiceRouteHeadersValidated === EXPECTED_PRACTICE_ROUTE_HEADERS.length) {
    practiceRouteHeaderParityValidated = true;
  }
}

function validatePracticeRouteCopyParity() {
  let valid = true;
  let practiceRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    practiceRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  } catch (error) {
    reject(`practice route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PRACTICE_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!practiceRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_PRACTICE_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`practice ${language} label ${JSON.stringify(label)} must be normalized`);
      }
      if (!practiceRoute.includes(label)) {
        labelIsValid = false;
        reject(`practice route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`practice route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) practiceRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_PRACTICE_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && practiceRouteCopyLabelsValidated === expectedLabelCount) {
    practiceRouteCopyParityValidated = true;
  }
}

function validateLearnRouteLinkCopyParity() {
  let valid = true;
  let learnRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    learnRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  } catch (error) {
    reject(`learn route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_LEARN_ROUTE_LINK_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!learnRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`learn route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!learnRoute.includes(label)) {
        labelIsValid = false;
        reject(`learn route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`learn route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) learnRouteLinkCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && learnRouteLinkCopyLabelsValidated === expectedLabelCount) {
    learnRouteLinkCopyParityValidated = true;
  }
}

function validateMistakesRouteCopyParity() {
  let valid = true;
  let mistakesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mistakesRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  } catch (error) {
    reject(`mistakes route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MISTAKES_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!mistakesRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_MISTAKES_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`mistakes route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!mistakesRoute.includes(label)) {
        labelIsValid = false;
        reject(`mistakes route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`mistakes route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) mistakesRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_MISTAKES_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && mistakesRouteCopyLabelsValidated === expectedLabelCount) {
    mistakesRouteCopyParityValidated = true;
  }
}

function validateChapterRouteHeaderParity() {
  let valid = true;
  let chapterRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterRoute = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  } catch (error) {
    reject(`app/chapter/[chapterId].tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    chapterRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('chapter route title and section text must expose accessibilityRole="header"');
  }

  EXPECTED_CHAPTER_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(chapterRoute)) {
      reject(`chapter route missing ${expectedHeader.label} as a header`);
      return;
    }
    chapterRouteHeadersValidated += 1;
  });

  if (valid && chapterRouteHeadersValidated === EXPECTED_CHAPTER_ROUTE_HEADERS.length) {
    chapterRouteHeaderParityValidated = true;
  }
}

function validateChapterRouteCopyParity() {
  let valid = true;
  let chapterRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterRoute = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  } catch (error) {
    reject(`chapter route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_CHAPTER_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!chapterRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_CHAPTER_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`chapter route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!chapterRoute.includes(label)) {
        labelIsValid = false;
        reject(`chapter route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`chapter route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) chapterRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_CHAPTER_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && chapterRouteCopyLabelsValidated === expectedLabelCount) {
    chapterRouteCopyParityValidated = true;
  }
}

function validateLearnRouteHeaderParity() {
  let valid = true;
  let learnRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    learnRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`learn route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !learnRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('learn route must use the shared ScreenShell and SectionHeader header components');
  }

  const directRouteHeadings =
    learnRoute.match(
      /<Text\s+(?:accessibilityRole="header"\s+)?style=\{styles\.(?:title|sectionTitle)\}>/g,
    ) || [];
  if (directRouteHeadings.length > 0) {
    reject('learn route headings must stay on the shared ScreenShell/SectionHeader path');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('learn route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_LEARN_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(learnRoute)) {
      reject(`learn route missing ${expectedHeader.label} on the shared header path`);
      return;
    }
    learnRouteHeadersValidated += 1;
  });

  if (valid && learnRouteHeadersValidated === EXPECTED_LEARN_ROUTE_HEADERS.length) {
    learnRouteHeaderParityValidated = true;
  }
}

function validateProfileRouteHeaderParity() {
  let valid = true;
  let profileRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    profileRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`profile route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !profileRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('profile route must use the shared ScreenShell and SectionHeader header components');
  }

  const directRouteHeadings =
    profileRoute.match(
      /<Text\s+(?:accessibilityRole="header"\s+)?style=\{styles\.(?:title|sectionTitle)\}>/g,
    ) || [];
  if (directRouteHeadings.length > 0) {
    reject('profile route headings must stay on the shared ScreenShell/SectionHeader path');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('profile route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_PROFILE_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(profileRoute)) {
      reject(`profile route missing ${expectedHeader.label} on the shared header path`);
      return;
    }
    profileRouteHeadersValidated += 1;
  });

  if (valid && profileRouteHeadersValidated === EXPECTED_PROFILE_ROUTE_HEADERS.length) {
    profileRouteHeaderParityValidated = true;
  }
}

function validateProfileRouteCopyParity() {
  let valid = true;
  let profileRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    profileRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  } catch (error) {
    reject(`profile route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PROFILE_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!profileRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_PROFILE_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`profile route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!profileRoute.includes(label)) {
        labelIsValid = false;
        reject(`profile route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`profile route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) profileRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_PROFILE_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && profileRouteCopyLabelsValidated === expectedLabelCount) {
    profileRouteCopyParityValidated = true;
  }
}

function validateHomeRouteHeaderParity() {
  let valid = true;
  let homeRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`home route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !homeRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('home route must use the shared ScreenShell and SectionHeader header components');
  }

  const unheaderedCardHeadings =
    homeRoute.match(/<Text\s+style=\{styles\.(?:goalLabel|readinessTitle|feedbackTitle)\}>/g) || [];
  if (unheaderedCardHeadings.length > 0) {
    reject('home route card headings must expose accessibilityRole="header"');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('home route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_HOME_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(homeRoute)) {
      reject(`home route missing ${expectedHeader.label} on the header path`);
      return;
    }
    homeRouteHeadersValidated += 1;
  });

  if (valid && homeRouteHeadersValidated === EXPECTED_HOME_ROUTE_HEADERS.length) {
    homeRouteHeaderParityValidated = true;
  }
}

function validateHomeRouteCopyParity() {
  let valid = true;
  let homeRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  } catch (error) {
    reject(`home route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_HOME_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!homeRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_HOME_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`home route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!homeRoute.includes(label)) {
        labelIsValid = false;
        reject(`home route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`home route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) homeRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_HOME_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && homeRouteCopyLabelsValidated === expectedLabelCount) {
    homeRouteCopyParityValidated = true;
  }
}

function validateMistakesRouteHeaderParity() {
  let valid = true;
  let mistakesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mistakesRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/mistakes.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    mistakesRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle|emptyTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('mistakes route title and section text must expose accessibilityRole="header"');
  }

  EXPECTED_MISTAKES_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(mistakesRoute)) {
      reject(`mistakes route missing ${expectedHeader.label} as a header`);
      return;
    }
    mistakesRouteHeadersValidated += 1;
  });

  if (valid && mistakesRouteHeadersValidated === EXPECTED_MISTAKES_ROUTE_HEADERS.length) {
    mistakesRouteHeaderParityValidated = true;
  }
}

function countLegalTitleOccurrences(source, componentName, title) {
  const titlePattern = new RegExp(`<${componentName}\\s+title="${escapeRegExp(title)}"`, 'g');
  return (source.match(titlePattern) || []).length;
}

function countPatternOccurrences(source, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return (source.match(new RegExp(pattern.source, flags)) || []).length;
}

function validateLegalRouteHeaderParity() {
  let valid = true;
  let legalPage = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    legalPage = fs.readFileSync(path.join(repoRoot, 'components/compliance/LegalPage.tsx'), 'utf8');
  } catch (error) {
    reject(`components/compliance/LegalPage.tsx could not be read: ${error.message}`);
    return;
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(legalPage) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(legalPage)
  ) {
    reject('legal route shared heading components must expose accessibilityRole="header"');
  }

  for (const expectedRoute of EXPECTED_LEGAL_ROUTE_HEADERS) {
    let routeSource = '';
    try {
      routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    } catch (error) {
      reject(`${expectedRoute.file} could not be read: ${error.message}`);
      continue;
    }

    if (
      !routeSource.includes(
        "import { LegalPage, LegalSection } from '../components/compliance/LegalPage';",
      )
    ) {
      reject(`${expectedRoute.file} must use shared LegalPage and LegalSection headers`);
    }

    if (expectedRoute.requiredSnippets) {
      expectedRoute.requiredSnippets.forEach((snippet) => {
        if (!routeSource.includes(snippet)) {
          reject(`${expectedRoute.file} missing legal route snippet: ${snippet}`);
        }
      });
    }

    const pageTitleOccurrences = expectedRoute.titlePattern
      ? countPatternOccurrences(routeSource, expectedRoute.titlePattern)
      : countLegalTitleOccurrences(routeSource, 'LegalPage', expectedRoute.title);
    if (pageTitleOccurrences !== 1) {
      reject(
        `${expectedRoute.file} legal page title "${expectedRoute.title}" appears ${pageTitleOccurrences} times, expected 1`,
      );
    } else {
      legalRouteHeadersValidated += 1;
    }

    for (const [sectionIndex, sectionTitle] of expectedRoute.sections.entries()) {
      const sectionPattern = expectedRoute.sectionPatterns?.[sectionIndex];
      const sectionTitleOccurrences = sectionPattern
        ? countPatternOccurrences(routeSource, sectionPattern)
        : countLegalTitleOccurrences(routeSource, 'LegalSection', sectionTitle);
      if (sectionTitleOccurrences !== 1) {
        reject(
          `${expectedRoute.file} legal section title "${sectionTitle}" appears ${sectionTitleOccurrences} times, expected 1`,
        );
      } else {
        legalRouteHeadersValidated += 1;
      }
    }
  }

  const expectedHeaderCount = EXPECTED_LEGAL_ROUTE_HEADERS.reduce(
    (sum, route) => sum + 1 + route.sections.length,
    0,
  );
  if (valid && legalRouteHeadersValidated === expectedHeaderCount) {
    legalRouteHeaderParityValidated = true;
  }
}

function validateSettingsRouteHeaderParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`app/settings.tsx could not be read for header parity: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    settingsRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('settings route title and section text must expose accessibilityRole="header"');
  }

  EXPECTED_SETTINGS_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(settingsRoute)) {
      reject(`settings route missing ${expectedHeader.label} as a header`);
      return;
    }
    settingsRouteHeadersValidated += 1;
  });

  if (valid && settingsRouteHeadersValidated === EXPECTED_SETTINGS_ROUTE_HEADERS.length) {
    settingsRouteHeaderParityValidated = true;
  }
}

function validateSettingsRouteCopyParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_SETTINGS_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!settingsRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_SETTINGS_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`settings route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!settingsRoute.includes(label)) {
        labelIsValid = false;
        reject(`settings route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`settings route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) settingsRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_SETTINGS_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && settingsRouteCopyLabelsValidated === expectedLabelCount) {
    settingsRouteCopyParityValidated = true;
  }
}

function validateOnboardingRouteHeaderParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`app/onboarding.tsx could not be read for header parity: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings = onboardingRoute.match(/<Text\s+style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('onboarding route title text must expose accessibilityRole="header"');
  }

  EXPECTED_ONBOARDING_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(onboardingRoute)) {
      reject(`onboarding route missing ${expectedHeader.label} as a header`);
      return;
    }
    onboardingRouteHeadersValidated += 1;
  });

  if (valid && onboardingRouteHeadersValidated === EXPECTED_ONBOARDING_ROUTE_HEADERS.length) {
    onboardingRouteHeaderParityValidated = true;
  }
}

function validateOnboardingRouteCopyParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`onboarding route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_ONBOARDING_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!onboardingRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_ONBOARDING_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`onboarding route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!onboardingRoute.includes(label)) {
        labelIsValid = false;
        reject(`onboarding route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`onboarding route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) onboardingRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_ONBOARDING_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && onboardingRouteCopyLabelsValidated === expectedLabelCount) {
    onboardingRouteCopyParityValidated = true;
  }
}

function validateScreenShellLayoutParity() {
  let valid = true;
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/ScreenShell.tsx could not be read for layout parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(screenShell)) {
    reject('ScreenShell must keep shared tab content inside ScrollView for mobile scrolling');
  }

  EXPECTED_SCREEN_SHELL_LAYOUT_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(screenShell)) {
      reject(`ScreenShell missing ${expectedRule.label} for shared layout parity`);
      return;
    }
    screenShellLayoutRulesValidated += 1;
  });

  if (valid && screenShellLayoutRulesValidated === EXPECTED_SCREEN_SHELL_LAYOUT_RULES.length) {
    screenShellLayoutParityValidated = true;
  }
}

function validateSettingsRouteScrollParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`app/settings.tsx could not be read for scroll parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(settingsRoute)) {
    reject('settings route must keep its root content inside ScrollView for mobile scrolling');
  }

  EXPECTED_SETTINGS_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(settingsRoute)) {
      reject(`settings route missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    settingsRouteScrollRulesValidated += 1;
  });

  if (valid && settingsRouteScrollRulesValidated === EXPECTED_SETTINGS_ROUTE_SCROLL_RULES.length) {
    settingsRouteScrollParityValidated = true;
  }
}

function validateOnboardingRouteScrollParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`app/onboarding.tsx could not be read for scroll parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(onboardingRoute)) {
    reject('onboarding route must keep its root content inside ScrollView for mobile scrolling');
  }

  EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(onboardingRoute)) {
      reject(`onboarding route missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    onboardingRouteScrollRulesValidated += 1;
  });

  if (
    valid &&
    onboardingRouteScrollRulesValidated === EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES.length
  ) {
    onboardingRouteScrollParityValidated = true;
  }
}

function validateLegalRouteScrollParity() {
  let valid = true;
  let legalPage = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    legalPage = fs.readFileSync(path.join(repoRoot, 'components/compliance/LegalPage.tsx'), 'utf8');
  } catch (error) {
    reject(
      `components/compliance/LegalPage.tsx could not be read for scroll parity: ${error.message}`,
    );
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(legalPage)) {
    reject(
      'legal routes must keep shared LegalPage content inside ScrollView for mobile scrolling',
    );
  }

  EXPECTED_LEGAL_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(legalPage)) {
      reject(`shared LegalPage missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    legalRouteScrollRulesValidated += 1;
  });

  if (valid && legalRouteScrollRulesValidated === EXPECTED_LEGAL_ROUTE_SCROLL_RULES.length) {
    legalRouteScrollParityValidated = true;
  }
}

function validateButtonAccessibilityParity() {
  let valid = true;
  let buttonSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    buttonSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Button.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Button.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_BUTTON_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(buttonSource)) {
      reject(`Button missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    buttonAccessibilityRulesValidated += 1;
  });

  if (valid && buttonAccessibilityRulesValidated === EXPECTED_BUTTON_ACCESSIBILITY_RULES.length) {
    buttonAccessibilityParityValidated = true;
  }
}

function validateCardAccessibilityParity() {
  let valid = true;
  let cardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    cardSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Card.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Card.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(cardSource)) {
      reject(`Card missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    cardAccessibilityRulesValidated += 1;
  });

  if (valid && cardAccessibilityRulesValidated === EXPECTED_CARD_ACCESSIBILITY_RULES.length) {
    cardAccessibilityParityValidated = true;
  }
}

function validateProgressBarAccessibilityParity() {
  let valid = true;
  let progressBarSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressBarSource = fs.readFileSync(
      path.join(repoRoot, 'components/ui/ProgressBar.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/ui/ProgressBar.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(progressBarSource)) {
      reject(`ProgressBar missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    progressBarAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    progressBarAccessibilityRulesValidated === EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES.length
  ) {
    progressBarAccessibilityParityValidated = true;
  }
}

function validateMetricCardAccessibilityParity() {
  let valid = true;
  let metricCardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    metricCardSource = fs.readFileSync(path.join(repoRoot, 'components/ui/MetricCard.tsx'), 'utf8');
  } catch (error) {
    reject(
      `components/ui/MetricCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(metricCardSource)) {
      reject(`MetricCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    metricCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    metricCardAccessibilityRulesValidated === EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES.length
  ) {
    metricCardAccessibilityParityValidated = true;
  }
}

function validateBadgeAccessibilityParity() {
  let valid = true;
  let badgeSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    badgeSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Badge.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Badge.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_BADGE_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(badgeSource)) {
      reject(`Badge missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    badgeAccessibilityRulesValidated += 1;
  });

  if (valid && badgeAccessibilityRulesValidated === EXPECTED_BADGE_ACCESSIBILITY_RULES.length) {
    badgeAccessibilityParityValidated = true;
  }
}

function validateChapterCardAccessibilityParity() {
  let valid = true;
  let chapterCardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/ChapterCard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/ChapterCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(chapterCardSource)) {
      reject(`ChapterCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    chapterCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    chapterCardAccessibilityRulesValidated === EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES.length
  ) {
    chapterCardAccessibilityParityValidated = true;
  }
}

function validateFlashcardAccessibilityParity() {
  let valid = true;
  let flashcardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    flashcardSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/Flashcard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/Flashcard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_FLASHCARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(flashcardSource)) {
      reject(`Flashcard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    flashcardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    flashcardAccessibilityRulesValidated === EXPECTED_FLASHCARD_ACCESSIBILITY_RULES.length
  ) {
    flashcardAccessibilityParityValidated = true;
  }
}

function validateAudioButtonAccessibilityParity() {
  let valid = true;
  let audioButtonSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    audioButtonSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/AudioButton.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/AudioButton.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(audioButtonSource)) {
      reject(`AudioButton missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    audioButtonAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    audioButtonAccessibilityRulesValidated === EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES.length
  ) {
    audioButtonAccessibilityParityValidated = true;
  }
}

function validateQuestionCardAccessibilityParity() {
  let valid = true;
  let questionCardSource = '';
  let questionTextSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    questionCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/QuestionCard.tsx'),
      'utf8',
    );
    questionTextSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/questionText.ts'), 'utf8');
  } catch (error) {
    reject(
      `components/quiz/QuestionCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(questionCardSource)) {
      reject(`QuestionCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    questionCardAccessibilityRulesValidated += 1;
  });

  EXPECTED_QUESTION_SOURCE_CITATION_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(questionTextSource)) {
      reject(`QuestionCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    questionCardAccessibilityRulesValidated += 1;
  });

  if (/Källa\/Source/.test(questionTextSource)) {
    reject('QuestionCard source citation helper still exposes mixed Källa/Source prefix');
  } else {
    questionCardAccessibilityRulesValidated += 1;
  }

  if (
    valid &&
    questionCardAccessibilityRulesValidated ===
      EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES.length +
        EXPECTED_QUESTION_SOURCE_CITATION_RULES.length +
        1
  ) {
    questionCardAccessibilityParityValidated = true;
  }
}

function validateAnswerOptionAccessibilityParity() {
  let valid = true;
  let answerOptionSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    answerOptionSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/AnswerOption.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/AnswerOption.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(answerOptionSource)) {
      reject(`AnswerOption missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    answerOptionAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    answerOptionAccessibilityRulesValidated === EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES.length
  ) {
    answerOptionAccessibilityParityValidated = true;
  }
}

function validateExplanationPanelAccessibilityParity() {
  let valid = true;
  let explanationPanelSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    explanationPanelSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/ExplanationPanel.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/ExplanationPanel.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(explanationPanelSource)) {
      reject(`ExplanationPanel missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    explanationPanelAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    explanationPanelAccessibilityRulesValidated ===
      EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES.length
  ) {
    explanationPanelAccessibilityParityValidated = true;
  }
}

function validateUhrReferenceCardAccessibilityParity() {
  let valid = true;
  let uhrReferenceCardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    uhrReferenceCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/UHRReferenceCard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/UHRReferenceCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(uhrReferenceCardSource)) {
      reject(`UHRReferenceCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    uhrReferenceCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    uhrReferenceCardAccessibilityRulesValidated ===
      EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES.length
  ) {
    uhrReferenceCardAccessibilityParityValidated = true;
  }
}

function validateCelebrationBurstAccessibilityParity() {
  let valid = true;
  let celebrationBurstSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    celebrationBurstSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/CelebrationBurst.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/CelebrationBurst.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(celebrationBurstSource)) {
      reject(`CelebrationBurst missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    celebrationBurstAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    celebrationBurstAccessibilityRulesValidated ===
      EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES.length
  ) {
    celebrationBurstAccessibilityParityValidated = true;
  }
}

function firstWrongOptionId(question) {
  return question.options?.find((option) => option.id !== question.correctOptionId)?.id;
}

function validateExamReviewSourceParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function' || typeof buildExamReviewItems !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
  const reviewItems = buildExamReviewItems(examQuestions, answers);
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(reviewItems)) {
    reject('buildExamReviewItems did not return an array for the default mock exam');
    return;
  }
  if (reviewItems.length !== examQuestions.length) {
    reject(
      `buildExamReviewItems returned ${reviewItems.length} items for ${examQuestions.length} default exam questions`,
    );
  }

  reviewItems.forEach((item, index) => {
    const question = examQuestions[index];
    const label = question?.id || `exam review item[${index}]`;
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!question) {
      rejectItem(`${label} has no matching default exam question`);
      return;
    }

    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    if (item.questionId !== question.id) rejectItem(`${label} review questionId drifted`);
    if (item.questionSv !== question.questionSv)
      rejectItem(`${label} review question text drifted`);
    if (item.chapterId !== question.chapterId) rejectItem(`${label} review chapter drifted`);
    if (item.explanationSv !== question.explanationSv) {
      rejectItem(`${label} review explanation drifted`);
    }
    if (!jsonEqual(item.uhrReference, question.uhrReference)) {
      rejectItem(`${label} review UHR reference drifted`);
    }
    if (item.selectedOptionTextSv !== selectedOption?.textSv) {
      rejectItem(`${label} review selected answer text drifted`);
    }
    if (item.correctOptionTextSv !== correctOption?.textSv) {
      rejectItem(`${label} review correct answer text drifted`);
    }
    if (item.isCorrect !== (answers[question.id] === question.correctOptionId)) {
      rejectItem(`${label} review correctness drifted`);
    }
    if (item.selectedOptionTextSv === 'Not answered') {
      rejectItem(`${label} review did not resolve the selected answer`);
    }
    if (item.correctOptionTextSv === 'Correct answer missing') {
      rejectItem(`${label} review did not resolve the correct answer`);
    }

    if (itemIsValid) examReviewItemsValidated += 1;
  });

  if (
    valid &&
    examReviewItemsValidated === examQuestions.length &&
    reviewItems.some((item) => item.isCorrect) &&
    reviewItems.some((item) => !item.isCorrect)
  ) {
    examReviewSourceParityValidated = true;
  }
}

function buildAlternatingExamAnswers(examQuestions) {
  return Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
}

function validateExamChapterBreakdownParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (
    !Array.isArray(chapters) ||
    typeof generateExam !== 'function' ||
    typeof scoreExam !== 'function' ||
    typeof buildExamChapterBreakdownItems !== 'function'
  ) {
    return;
  }

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = buildAlternatingExamAnswers(examQuestions);
  const result = scoreExam(examQuestions, answers);
  const breakdownItems = buildExamChapterBreakdownItems(result.chapterBreakdown, chapters);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const expectedByChapter = new Map();
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  examQuestions.forEach((question) => {
    const previous = expectedByChapter.get(question.chapterId) ?? {
      correctCount: 0,
      totalCount: 0,
    };
    expectedByChapter.set(question.chapterId, {
      correctCount:
        previous.correctCount + (answers[question.id] === question.correctOptionId ? 1 : 0),
      totalCount: previous.totalCount + 1,
    });
  });

  if (result.totalCount !== examQuestions.length) {
    reject(`scoreExam totalCount is ${result.totalCount}, expected ${examQuestions.length}`);
  }
  const expectedCorrectCount = [...expectedByChapter.values()].reduce(
    (sum, chapterResult) => sum + chapterResult.correctCount,
    0,
  );
  if (result.correctCount !== expectedCorrectCount) {
    reject(`scoreExam correctCount is ${result.correctCount}, expected ${expectedCorrectCount}`);
  }
  if (breakdownItems.length !== expectedByChapter.size) {
    reject(
      `exam chapter breakdown has ${breakdownItems.length} rows, expected ${expectedByChapter.size}`,
    );
  }

  breakdownItems.forEach((item) => {
    const chapter = chapterById.get(item.chapterId);
    const expected = expectedByChapter.get(item.chapterId);
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!chapter) {
      rejectItem(`${item.chapterId} breakdown row references an unknown chapter`);
    } else {
      if (item.chapterNameSv !== chapter.nameSv) {
        rejectItem(`${item.chapterId} breakdown Swedish chapter name drifted`);
      }
      if (item.chapterNameEn !== chapter.nameEn) {
        rejectItem(`${item.chapterId} breakdown English chapter name drifted`);
      }
    }

    if (!expected) {
      rejectItem(`${item.chapterId} breakdown row is not present in the default exam`);
    } else {
      if (item.correctCount !== expected.correctCount) {
        rejectItem(`${item.chapterId} breakdown correctCount drifted`);
      }
      if (item.totalCount !== expected.totalCount) {
        rejectItem(`${item.chapterId} breakdown totalCount drifted`);
      }
    }

    if (itemIsValid) examChapterBreakdownItemsValidated += 1;
  });

  const countedTotal = breakdownItems.reduce((sum, item) => sum + item.totalCount, 0);
  if (countedTotal !== examQuestions.length) {
    reject(
      `exam chapter breakdown counted ${countedTotal} questions, expected ${examQuestions.length}`,
    );
  }

  if (
    valid &&
    examChapterBreakdownItemsValidated === breakdownItems.length &&
    breakdownItems.length === expectedByChapter.size
  ) {
    examChapterBreakdownParityValidated = true;
  }
}

function validateExamGeneratorTypeSchemaParity() {
  let valid = true;
  let examGeneratorSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examGeneratorSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/examGenerator.ts'), 'utf8');
  } catch (error) {
    reject(`lib/quiz/examGenerator.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_EXAM_GENERATOR_TYPE_ALIASES.forEach(({ typeName, type }) => {
    const actualType = extractTypeAliasTextFromTs(examGeneratorSource, typeName);
    if (actualType !== type) {
      reject(
        `lib/quiz/examGenerator.ts ${typeName} type is ${JSON.stringify(
          actualType,
        )}, expected ${JSON.stringify(type)}`,
      );
      return;
    }
    examGeneratorTypeAliasesValidated += 1;
  });

  EXPECTED_EXAM_GENERATOR_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      examGeneratorSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/quiz/examGenerator.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/quiz/examGenerator.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) examGeneratorTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    examGeneratorTypeAliasesValidated === EXPECTED_EXAM_GENERATOR_TYPE_ALIASES.length &&
    examGeneratorTypeInterfacesValidated === EXPECTED_EXAM_GENERATOR_INTERFACES.length
  ) {
    examGeneratorTypeSchemaParityValidated = true;
  }
}

function validateUxBenchmarks() {
  if (!Array.isArray(uxBenchmarks)) return;

  if (uxBenchmarks.length !== EXPECTED_UX_BENCHMARKS) {
    fail(`expected ${EXPECTED_UX_BENCHMARKS} UX benchmarks, found ${uxBenchmarks.length}`);
  }

  const seenProducts = new Set();
  const seenSources = new Set();

  uxBenchmarks.forEach((benchmark, index) => {
    const label = hasText(benchmark?.product) ? benchmark.product : `ux benchmark[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!benchmark || typeof benchmark !== 'object') {
      reject(`ux benchmark[${index}] is not an object`);
    } else {
      for (const field of ['product', 'lesson', 'source']) {
        if (!hasText(benchmark[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(benchmark[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      const normalizedProduct = normalizeComparableText(benchmark.product);
      if (normalizedProduct && seenProducts.has(normalizedProduct)) {
        reject(`${label} duplicates UX benchmark product`);
      }
      if (normalizedProduct) seenProducts.add(normalizedProduct);

      if (hasText(benchmark.source)) {
        if (!isHttpsUrl(benchmark.source)) {
          reject(`${label} source must be an HTTPS URL`);
        }
        if (seenSources.has(benchmark.source)) {
          reject(`${label} duplicates UX benchmark source`);
        }
        seenSources.add(benchmark.source);
      }
    }

    if (valid) uxBenchmarksValidated += 1;
  });
}

function validateLocalizationLanguageContract() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(supportedLanguages)) return;
  if (!arrayEquals(supportedLanguages, EXPECTED_SUPPORTED_LANGUAGES)) {
    reject(
      `supportedLanguages is ${JSON.stringify(supportedLanguages)}, expected ${JSON.stringify(
        EXPECTED_SUPPORTED_LANGUAGES,
      )}`,
    );
  }

  const seenLanguages = new Set();
  supportedLanguages.forEach((language, index) => {
    let languageIsValid = true;
    if (!/^[a-z]{2}$/.test(language)) {
      languageIsValid = false;
      reject(`supportedLanguages[${index}] must be a lowercase ISO language code`);
    }
    if (seenLanguages.has(language)) {
      languageIsValid = false;
      reject(`supportedLanguages has duplicate language ${language}`);
    }
    seenLanguages.add(language);
    if (!hasText(EXPECTED_LANGUAGE_LABELS[language])) {
      languageIsValid = false;
      reject(`supported language ${language} is missing a settings label`);
    }
    if (languageIsValid) supportedLanguagesValidated += 1;
  });

  if (
    !localizationStrings ||
    typeof localizationStrings !== 'object' ||
    Array.isArray(localizationStrings)
  ) {
    return;
  }

  Object.entries(localizationStrings).forEach(([key, value]) => {
    let entryIsValid = true;

    function rejectEntry(message) {
      entryIsValid = false;
      reject(message);
    }

    if (!isSlugTag(key)) rejectEntry(`strings.${key} key must use lowercase kebab-case`);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      rejectEntry(`strings.${key} must be a language map object`);
      return;
    }

    supportedLanguages.forEach((language) => {
      const text = value[language];
      if (!hasText(text)) {
        rejectEntry(`strings.${key}.${language} is missing`);
      } else if (!textIsTrimmedSingleSpaced(text)) {
        rejectEntry(`strings.${key}.${language} must be trimmed and single-spaced`);
      }
    });

    const extraLanguages = Object.keys(value).filter((language) => !seenLanguages.has(language));
    if (extraLanguages.length) {
      rejectEntry(`strings.${key} has unsupported languages ${extraLanguages.join(', ')}`);
    }

    if (entryIsValid) localizationStringsValidated += 1;
  });

  let settingsStore = '';
  let settingsRoute = '';
  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings language parity source could not be read: ${error.message}`);
    return;
  }

  const appLanguageValues = extractStringUnionTypeFromTs(settingsStore, 'AppLanguage');
  if (!Array.isArray(appLanguageValues) || !arrayEquals(appLanguageValues, supportedLanguages)) {
    reject(
      `AppLanguage union is ${JSON.stringify(appLanguageValues)}, expected ${JSON.stringify(
        supportedLanguages,
      )}`,
    );
  }

  const languageButtonCalls = extractCallStringArgumentsFromTs(
    settingsRoute,
    'renderLanguageButton',
  );
  const routeLanguages = languageButtonCalls.map(([language]) => language);
  if (!arrayEquals(routeLanguages, supportedLanguages)) {
    reject(
      `app/settings.tsx language buttons are ${JSON.stringify(
        routeLanguages,
      )}, expected ${JSON.stringify(supportedLanguages)}`,
    );
  }

  const seenLabels = new Set();
  languageButtonCalls.forEach(([language, label], index) => {
    if (label !== EXPECTED_LANGUAGE_LABELS[language]) {
      reject(
        `app/settings.tsx language button[${index}] label is ${JSON.stringify(
          label,
        )}, expected ${JSON.stringify(EXPECTED_LANGUAGE_LABELS[language])}`,
      );
    }
    if (!textIsTrimmedSingleSpaced(label)) {
      reject(`app/settings.tsx language button[${index}] label must be trimmed and single-spaced`);
    }
    const normalizedLabel = normalizeComparableText(label);
    if (seenLabels.has(normalizedLabel)) {
      reject(`app/settings.tsx duplicates language label ${label}`);
    }
    if (normalizedLabel) seenLabels.add(normalizedLabel);
  });

  if (!settingsRoute.includes('Svenska') || !settingsRoute.includes('Engelskt stöd')) {
    reject('app/settings.tsx must expose Swedish labels for language buttons in Swedish mode');
  }
  if (!settingsRoute.includes('Byt frågespråk till ${label}')) {
    reject('app/settings.tsx language buttons must expose Swedish accessibility text');
  }
  if (!settingsRoute.includes('Set question language to ${label}')) {
    reject('app/settings.tsx language buttons must expose label-derived accessibility text');
  }

  if (valid) languageSettingsParityValidated = true;
}

function validateSettingsStoreSchemaParity() {
  let valid = true;
  let settingsStore = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
  } catch (error) {
    reject(`settings store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(settingsStore, 'SettingsState');
  if (!Array.isArray(actualFields)) {
    reject('lib/storage/settingsStore.ts SettingsState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_SETTINGS_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `SettingsState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_SETTINGS_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`SettingsState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `SettingsState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `SettingsState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) settingsStoreFieldsValidated += 1;
  });

  const languageKey = extractStringConstantFromTs(settingsStore, 'languageKey');
  const audioEnabledKey = extractStringConstantFromTs(settingsStore, 'audioEnabledKey');
  const dailyGoalKey = extractStringConstantFromTs(settingsStore, 'dailyGoalKey');
  if (languageKey !== 'language') {
    reject(`languageKey is ${JSON.stringify(languageKey)}, expected "language"`);
  }
  if (audioEnabledKey !== EXPECTED_AUDIO_SETTING_KEY) {
    reject(
      `audioEnabledKey is ${JSON.stringify(audioEnabledKey)}, expected ${JSON.stringify(
        EXPECTED_AUDIO_SETTING_KEY,
      )}`,
    );
  }
  if (dailyGoalKey !== 'dailyGoalAnswers') {
    reject(`dailyGoalKey is ${JSON.stringify(dailyGoalKey)}, expected "dailyGoalAnswers"`);
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  const requiredSnippets = [
    ["createMMKV({ id: 'settings' })", 'settings storage must use the stable settings MMKV id'],
    ['language: readLanguage()', 'SettingsState must initialize language from persisted storage'],
    [
      'audioEnabled: readAudioEnabled()',
      'SettingsState must initialize audioEnabled from persisted storage',
    ],
    [
      'dailyGoalAnswers: readDailyGoalAnswers()',
      'SettingsState must initialize dailyGoalAnswers from persisted storage',
    ],
    [
      'settingsStorage?.set(languageKey, language);',
      'setLanguage must persist through languageKey',
    ],
    [
      'settingsStorage?.set(audioEnabledKey, audioEnabled);',
      'setAudioEnabled must persist through audioEnabledKey',
    ],
    [
      'settingsStorage?.set(dailyGoalKey, safeGoal);',
      'setDailyGoalAnswers must persist the clamped daily goal through dailyGoalKey',
    ],
  ];

  requiredSnippets.forEach(([snippet, message]) => {
    if (!normalizedSettingsStore.includes(snippet)) {
      reject(message);
    }
  });

  if (valid && settingsStoreFieldsValidated === EXPECTED_SETTINGS_STORE_FIELDS.length) {
    settingsStoreSchemaParityValidated = true;
  }
}

function validateSettingsDailyGoalParity() {
  let valid = true;
  let settingsStore = '';
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings daily-goal parity source could not be read: ${error.message}`);
    return;
  }

  const dailyGoalKey = extractStringConstantFromTs(settingsStore, 'dailyGoalKey');
  if (dailyGoalKey !== 'dailyGoalAnswers') {
    reject(`dailyGoalKey is ${JSON.stringify(dailyGoalKey)}, expected "dailyGoalAnswers"`);
  }

  if (!settingsStore.includes(`: ${EXPECTED_DAILY_GOAL_DEFAULT};`)) {
    reject(`readDailyGoalAnswers must default to ${EXPECTED_DAILY_GOAL_DEFAULT} answers`);
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  const expectedClamp = `Math.max(${EXPECTED_DAILY_GOAL_MIN}, Math.min(${EXPECTED_DAILY_GOAL_MAX}, Math.round(dailyGoalAnswers)))`;
  if (!normalizedSettingsStore.includes(expectedClamp)) {
    reject(
      `setDailyGoalAnswers must clamp between ${EXPECTED_DAILY_GOAL_MIN} and ${EXPECTED_DAILY_GOAL_MAX}`,
    );
  }

  const goalOptionArrays = extractMappedNumericArraysFromTs(settingsRoute, 'goal');
  const goalOptions = goalOptionArrays[0] || [];
  if (!arrayEquals(goalOptions, EXPECTED_DAILY_GOAL_OPTIONS)) {
    reject(
      `app/settings.tsx daily goal options are ${JSON.stringify(
        goalOptionArrays,
      )}, expected ${JSON.stringify(EXPECTED_DAILY_GOAL_OPTIONS)}`,
    );
  }

  const seenGoals = new Set();
  goalOptions.forEach((goal, index) => {
    let optionIsValid = true;
    if (!Number.isInteger(goal)) {
      optionIsValid = false;
      reject(`daily goal option[${index}] must be an integer`);
    } else {
      if (goal < EXPECTED_DAILY_GOAL_MIN || goal > EXPECTED_DAILY_GOAL_MAX) {
        optionIsValid = false;
        reject(
          `daily goal option ${goal} must be between ${EXPECTED_DAILY_GOAL_MIN} and ${EXPECTED_DAILY_GOAL_MAX}`,
        );
      }
      if (seenGoals.has(goal)) {
        optionIsValid = false;
        reject(`daily goal option ${goal} is duplicated`);
      }
      seenGoals.add(goal);
    }

    if (optionIsValid) settingsDailyGoalOptionsValidated += 1;
  });

  if (!seenGoals.has(EXPECTED_DAILY_GOAL_DEFAULT)) {
    reject(`daily goal options must include the default ${EXPECTED_DAILY_GOAL_DEFAULT}`);
  }
  if (!settingsRoute.includes('Set daily goal to ${goal} answers')) {
    reject('app/settings.tsx daily goal buttons must expose goal-derived accessibility text');
  }
  if (!settingsRoute.includes('Ställ in dagligt mål till ${goal} svar')) {
    reject('app/settings.tsx daily goal buttons must expose Swedish accessibility text');
  }
  if (!settingsRoute.includes('${answerCount} svar per dag')) {
    reject('app/settings.tsx must render the Swedish persisted daily-goal count');
  }
  if (!settingsRoute.includes('${answerCount} answers per day')) {
    reject('app/settings.tsx must render the persisted daily-goal count');
  }

  if (valid && settingsDailyGoalOptionsValidated === EXPECTED_DAILY_GOAL_OPTIONS.length) {
    settingsDailyGoalParityValidated = true;
  }
}

function validateSettingsAudioParity() {
  let valid = true;
  let settingsStore = '';
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings audio parity source could not be read: ${error.message}`);
    return;
  }

  const audioEnabledKey = extractStringConstantFromTs(settingsStore, 'audioEnabledKey');
  if (audioEnabledKey !== EXPECTED_AUDIO_SETTING_KEY) {
    reject(
      `audioEnabledKey is ${JSON.stringify(audioEnabledKey)}, expected ${JSON.stringify(
        EXPECTED_AUDIO_SETTING_KEY,
      )}`,
    );
  }

  const settingsFields = extractObjectTypePropertiesFromTs(settingsStore, 'SettingsState') || [];
  const settingsFieldsByName = new Map(settingsFields.map((field) => [field.name, field]));
  const audioEnabledField = settingsFieldsByName.get('audioEnabled');
  const setAudioEnabledField = settingsFieldsByName.get('setAudioEnabled');
  if (!audioEnabledField || audioEnabledField.type !== 'boolean' || audioEnabledField.optional) {
    reject('SettingsState.audioEnabled must be a required boolean');
  }
  if (
    !setAudioEnabledField ||
    setAudioEnabledField.type !== '(enabled: boolean) => void' ||
    setAudioEnabledField.optional
  ) {
    reject('SettingsState.setAudioEnabled must accept a boolean enabled value');
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  if (
    !normalizedSettingsStore.includes(
      'const storedValue = settingsStorage?.getBoolean(audioEnabledKey);',
    )
  ) {
    reject('readAudioEnabled must read the persisted audioEnabled boolean');
  }
  if (!normalizedSettingsStore.includes('return storedValue ?? true;')) {
    reject('readAudioEnabled must default audio to enabled');
  }
  if (!normalizedSettingsStore.includes('audioEnabled: readAudioEnabled()')) {
    reject('SettingsState must initialize audioEnabled from persisted storage');
  }
  if (!normalizedSettingsStore.includes('settingsStorage?.set(audioEnabledKey, audioEnabled);')) {
    reject('setAudioEnabled must persist audioEnabled through audioEnabledKey');
  }

  if (
    !settingsRoute.includes('const audioEnabled = useSettingsStore((state) => state.audioEnabled);')
  ) {
    reject('app/settings.tsx must read audioEnabled from useSettingsStore');
  }
  if (
    !settingsRoute.includes(
      'const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);',
    )
  ) {
    reject('app/settings.tsx must read setAudioEnabled from useSettingsStore');
  }
  if (!settingsRoute.includes('accessibilityRole="switch"')) {
    reject('app/settings.tsx audio control must expose switch accessibility role');
  }
  if (!settingsRoute.includes('accessibilityState={{ checked: audioEnabled }}')) {
    reject('app/settings.tsx audio switch must expose checked state from audioEnabled');
  }
  if (
    !settingsRoute.includes(
      'audioEnabled ? copy.disableAudioAccessibilityLabel : copy.enableAudioAccessibilityLabel',
    )
  ) {
    reject('app/settings.tsx audio switch must expose state-changing accessibility labels');
  }
  if (!settingsRoute.includes('onPress={() => setAudioEnabled(!audioEnabled)}')) {
    reject('app/settings.tsx audio switch must toggle persisted audio state');
  }
  if (!settingsRoute.includes('audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel')) {
    reject('app/settings.tsx audio switch must render the current audio state label');
  }

  const seenLabels = new Set();
  EXPECTED_AUDIO_LABELS.forEach((label) => {
    let labelIsValid = true;
    if (!textIsTrimmedSingleSpaced(label)) {
      labelIsValid = false;
      reject(`audio label ${JSON.stringify(label)} must be trimmed and single-spaced`);
    }
    if (!settingsRoute.includes(label)) {
      labelIsValid = false;
      reject(`app/settings.tsx is missing audio label ${JSON.stringify(label)}`);
    }
    const normalizedLabel = normalizeComparableText(label);
    if (seenLabels.has(normalizedLabel)) {
      labelIsValid = false;
      reject(`audio label ${JSON.stringify(label)} is duplicated`);
    }
    if (normalizedLabel) seenLabels.add(normalizedLabel);
    if (labelIsValid) settingsAudioLabelsValidated += 1;
  });

  EXPECTED_AUDIO_ACCESSIBILITY_LABELS.forEach((label) => {
    if (!settingsRoute.includes(label)) {
      reject(`app/settings.tsx is missing audio accessibility label ${JSON.stringify(label)}`);
    }
  });

  if (valid && settingsAudioLabelsValidated === EXPECTED_AUDIO_LABELS.length) {
    settingsAudioParityValidated = true;
  }
}

function validateProgressQuestionSchemaParity() {
  let valid = true;
  let progressTypesSource = '';
  let progressStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressTypesSource = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
    progressStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/storage/progressStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`progress schema parity source could not be read: ${error.message}`);
    return;
  }

  const publicFields = extractObjectTypePropertiesFromTs(
    progressTypesSource,
    'UserQuestionProgress',
  );
  const storeFields = extractObjectTypePropertiesFromTs(progressStoreSource, 'QuestionProgress');
  if (!Array.isArray(publicFields)) {
    reject('types/progress.ts UserQuestionProgress interface could not be read');
    return;
  }
  if (!Array.isArray(storeFields)) {
    reject('lib/storage/progressStore.ts QuestionProgress type could not be read');
    return;
  }

  const publicFieldsByName = new Map(publicFields.map((field) => [field.name, field]));
  const storeFieldsByName = new Map(storeFields.map((field) => [field.name, field]));
  const storeFieldNames = storeFields.map((field) => field.name);
  if (!arrayEquals(storeFieldNames, EXPECTED_PROGRESS_QUESTION_FIELDS)) {
    reject(
      `QuestionProgress fields are ${JSON.stringify(
        storeFieldNames,
      )}, expected ${JSON.stringify(EXPECTED_PROGRESS_QUESTION_FIELDS)}`,
    );
  }

  publicFields.forEach((field) => {
    if (!EXPECTED_PROGRESS_QUESTION_FIELDS.includes(field.name) && !field.optional) {
      reject(`UserQuestionProgress ${field.name} must be optional unless persisted by the store`);
    }
  });

  EXPECTED_PROGRESS_QUESTION_FIELDS.forEach((fieldName) => {
    let fieldIsValid = true;
    const expectedOptional = EXPECTED_PROGRESS_OPTIONAL_FIELDS.has(fieldName);
    const expectedType = EXPECTED_PROGRESS_QUESTION_FIELD_TYPES[fieldName];
    const publicField = publicFieldsByName.get(fieldName);
    const storeField = storeFieldsByName.get(fieldName);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!publicField) {
      rejectField(`UserQuestionProgress missing ${fieldName}`);
    } else {
      if (publicField.optional !== expectedOptional) {
        rejectField(
          `UserQuestionProgress ${fieldName} optional=${publicField.optional}, expected ${expectedOptional}`,
        );
      }
      if (publicField.type !== expectedType) {
        rejectField(
          `UserQuestionProgress ${fieldName} type is ${publicField.type}, expected ${expectedType}`,
        );
      }
    }

    if (!storeField) {
      rejectField(`QuestionProgress missing ${fieldName}`);
    } else {
      if (storeField.optional !== expectedOptional) {
        rejectField(
          `QuestionProgress ${fieldName} optional=${storeField.optional}, expected ${expectedOptional}`,
        );
      }
      if (storeField.type !== expectedType) {
        rejectField(
          `QuestionProgress ${fieldName} type is ${storeField.type}, expected ${expectedType}`,
        );
      }
    }

    if (fieldIsValid) progressQuestionFieldsValidated += 1;
  });

  if (valid && progressQuestionFieldsValidated === EXPECTED_PROGRESS_QUESTION_FIELDS.length) {
    progressQuestionSchemaParityValidated = true;
  }
}

function validateProgressTypeSchemaParity() {
  let valid = true;
  let progressTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressTypesSource = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  } catch (error) {
    reject(`types/progress.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PROGRESS_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(progressTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/progress.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/progress.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    progressTypeUnionsValidated += 1;
  });

  EXPECTED_PROGRESS_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      progressTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(`types/progress.ts ${expectedInterface.name} interface could not be read`);
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/progress.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) progressTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    progressTypeUnionsValidated === EXPECTED_PROGRESS_TYPE_UNIONS.length &&
    progressTypeInterfacesValidated === EXPECTED_PROGRESS_INTERFACES.length
  ) {
    progressTypeSchemaParityValidated = true;
  }
}

function validateProgressStoreSchemaParity() {
  let valid = true;
  let progressStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/storage/progressStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`progress store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(progressStoreSource, 'ProgressState');
  if (!Array.isArray(actualFields)) {
    reject('lib/storage/progressStore.ts ProgressState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_PROGRESS_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `ProgressState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_PROGRESS_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`ProgressState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `ProgressState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `ProgressState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) progressStoreFieldsValidated += 1;
  });

  const progressStateKey = extractStringConstantFromTs(progressStoreSource, 'progressStateKey');
  if (progressStateKey !== 'progressState') {
    reject(`progressStateKey is ${JSON.stringify(progressStateKey)}, expected "progressState"`);
  }

  const normalizedProgressStore = progressStoreSource.replace(/\s+/g, ' ');
  const requiredSnippets = [
    ["createMMKV({ id: 'progress' })", 'progress storage must use the stable progress MMKV id'],
    [
      'const rawProgress = progressStorage?.getString(progressStateKey);',
      'readProgress must read persisted JSON through progressStateKey',
    ],
    [
      'return normalizeProgress(JSON.parse(rawProgress));',
      'readProgress must normalize parsed persisted JSON',
    ],
    [
      'progressStorage?.set(progressStateKey, JSON.stringify(progress));',
      'writeProgress must persist JSON through progressStateKey',
    ],
    ['const initialProgress = readProgress();', 'ProgressState must initialize from storage'],
    ['...initialProgress,', 'useProgressStore must hydrate persisted progress state'],
    ['mockExamSessions: [],', 'empty progress must initialize mock exam history'],
    ['recordMockExamSession: (session) =>', 'ProgressState must persist completed mock exams'],
    ['writeProgress(nextProgress);', 'progress mutations must persist nextProgress'],
    ['writeProgress(emptyProgress);', 'resetProgress must persist the empty progress state'],
  ];

  requiredSnippets.forEach(([snippet, message]) => {
    if (!normalizedProgressStore.includes(snippet)) {
      reject(message);
    }
  });

  if (valid && progressStoreFieldsValidated === EXPECTED_PROGRESS_STORE_FIELDS.length) {
    progressStoreSchemaParityValidated = true;
  }
}

function validateContentTypeSchemaParity() {
  let valid = true;
  let contentTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    contentTypesSource = fs.readFileSync(path.join(repoRoot, 'types/content.ts'), 'utf8');
  } catch (error) {
    reject(`types/content.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_CONTENT_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(contentTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/content.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/content.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    contentTypeUnionsValidated += 1;
  });

  EXPECTED_CONTENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      contentTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(`types/content.ts ${expectedInterface.name} interface could not be read`);
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/content.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(`types/content.ts ${expectedInterface.name} missing ${expectedField.name}`);
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/content.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/content.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) contentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    contentTypeUnionsValidated === EXPECTED_CONTENT_TYPE_UNIONS.length &&
    contentTypeInterfacesValidated === EXPECTED_CONTENT_INTERFACES.length
  ) {
    contentTypeSchemaParityValidated = true;
  }
}

function validateMonetizationTypeSchemaParity() {
  let valid = true;
  let monetizationTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    monetizationTypesSource = fs.readFileSync(path.join(repoRoot, 'types/monetization.ts'), 'utf8');
  } catch (error) {
    reject(`types/monetization.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MONETIZATION_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(monetizationTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/monetization.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/monetization.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    monetizationTypeUnionsValidated += 1;
  });

  EXPECTED_MONETIZATION_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      monetizationTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `types/monetization.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/monetization.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) monetizationTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    monetizationTypeUnionsValidated === EXPECTED_MONETIZATION_TYPE_UNIONS.length &&
    monetizationTypeInterfacesValidated === EXPECTED_MONETIZATION_INTERFACES.length
  ) {
    monetizationTypeSchemaParityValidated = true;
  }
}

function validatePurchaseTypeSchemaParity() {
  let valid = true;
  let purchaseSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    purchaseSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/purchases.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/purchases.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PURCHASE_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(purchaseSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/purchases.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/purchases.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    purchaseTypeUnionsValidated += 1;
  });

  EXPECTED_PURCHASE_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(purchaseSource, expectedInterface.name);
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/purchases.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/purchases.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) purchaseTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    purchaseTypeUnionsValidated === EXPECTED_PURCHASE_TYPE_UNIONS.length &&
    purchaseTypeInterfacesValidated === EXPECTED_PURCHASE_INTERFACES.length
  ) {
    purchaseTypeSchemaParityValidated = true;
  }
}

function validateRemoveAdsPurchaseRuntimeParity() {
  let valid = true;
  let purchaseSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    purchaseSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/purchases.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/purchases.ts could not be read: ${error.message}`);
    return;
  }

  const normalizedPurchaseSource = purchaseSource.replace(/\s+/g, ' ');
  const runtimeCases = [
    [
      typeof REMOVE_ADS_PRODUCT_ID === 'string' &&
        /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+\.removeads$/.test(REMOVE_ADS_PRODUCT_ID),
      'Remove Ads product id must stay a reverse-DNS removeads identifier',
    ],
    [
      REMOVE_ADS_PRODUCT_ID === `${EXPECTED_APP_NATIVE_IDENTIFIER}.removeads`,
      'Remove Ads product id must use the current native app identifier plus .removeads',
    ],
    [
      /return\s+\{[\s\S]*priceLabel:\s*REMOVE_ADS_PRICE_LABEL,[\s\S]*productId:\s*REMOVE_ADS_PRODUCT_ID,[\s\S]*\};/.test(
        purchaseSource,
      ),
      'Remove Ads purchase results must expose canonical price label and product id',
    ],
    [
      normalizedPurchaseSource.includes(
        'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
      ),
      'buyRemoveAds must request canonical Remove Ads product id',
    ],
    [
      normalizedPurchaseSource.includes(
        'const purchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);',
      ),
      'restoreRemoveAdsPurchase must restore canonical Remove Ads product id',
    ],
    [
      /finishTransaction\(\{[\s\S]*isConsumable:\s*false,[\s\S]*purchase:\s*purchase\.raw\s+as\s+Purchase,[\s\S]*\}\);/.test(
        purchaseSource,
      ),
      'native Remove Ads finish transaction must be non-consumable',
    ],
    [
      /requestPurchase\(\{[\s\S]*request:\s*\{[\s\S]*apple:\s*\{\s*sku:\s*productId\s*\},[\s\S]*google:\s*\{\s*skus:\s*\[\s*productId\s*\]\s*\},[\s\S]*\},[\s\S]*type:\s*'in-app',[\s\S]*\}\)/.test(
        purchaseSource,
      ),
      'native Remove Ads purchase request must use the supplied product id as an in-app purchase',
    ],
    [
      normalizedPurchaseSource.includes(
        'if (!ownsRemoveAds || !productIds.includes(REMOVE_ADS_PRODUCT_ID)) return [];',
      ) && normalizedPurchaseSource.includes("return [createMockPurchase('restore-remove-ads')];"),
      'mock Remove Ads restore must require the canonical product id',
    ],
    [
      normalizedPurchaseSource.includes('export const REMOVE_ADS_RECORD_SCHEMA_VERSION = 1;') &&
        normalizedPurchaseSource.includes('interface StoredRemoveAdsEntitlementRecord'),
      'Remove Ads persistence must use a versioned structured entitlement record',
    ],
    [
      normalizedPurchaseSource.includes('parseStoredRemoveAdsEntitlementRecord(storedValue)') &&
        !normalizedPurchaseSource.includes('storedValue === STORED_TRUE') &&
        !normalizedPurchaseSource.includes("const STORED_TRUE = 'true';"),
      'Remove Ads entitlement loading must reject the legacy bare true value',
    ],
    [
      normalizedPurchaseSource.includes("source: 'purchase'") &&
        normalizedPurchaseSource.includes("source: 'restore'") &&
        normalizedPurchaseSource.includes('hasStoreConfirmation(record)'),
      'Remove Ads purchase and restore grants must persist source plus store confirmation identity',
    ],
  ];

  runtimeCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }

    removeAdsPurchaseRuntimeCasesValidated += 1;
  });

  if (
    valid &&
    removeAdsPurchaseRuntimeCasesValidated === EXPECTED_REMOVE_ADS_PURCHASE_RUNTIME_CASES
  ) {
    removeAdsPurchaseRuntimeParityValidated = true;
  }
}

function validateAdConsentTypeSchemaParity() {
  let valid = true;
  let consentSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    consentSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/consent.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/consent.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_AD_CONSENT_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(consentSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/consent.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/consent.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    adConsentTypeUnionsValidated += 1;
  });

  EXPECTED_AD_CONSENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(consentSource, expectedInterface.name);
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/consent.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/consent.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) adConsentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    adConsentTypeUnionsValidated === EXPECTED_AD_CONSENT_TYPE_UNIONS.length &&
    adConsentTypeInterfacesValidated === EXPECTED_AD_CONSENT_INTERFACES.length
  ) {
    adConsentTypeSchemaParityValidated = true;
  }
}

function validateMobileAdsConsentTypeSchemaParity() {
  let valid = true;
  let mobileConsentSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mobileConsentSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/mobileAdsConsent.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MOBILE_ADS_CONSENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      mobileConsentSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) mobileAdsConsentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    mobileAdsConsentTypeInterfacesValidated === EXPECTED_MOBILE_ADS_CONSENT_INTERFACES.length
  ) {
    mobileAdsConsentTypeSchemaParityValidated = true;
  }
}

function validateMobileAdsConsentHookParity() {
  let valid = true;
  let hookSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    hookSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/useMobileAdsConsent.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/useMobileAdsConsent.ts could not be read: ${error.message}`);
    return;
  }

  const normalizedHookSource = hookSource.replace(/\s+/g, ' ');
  const hookCases = [
    [
      normalizedHookSource.includes(
        'const shouldCollectConsent = adsConfig.googleMobileAdsEnabled && !entitlements.adsDisabled && adsConfig.realAdsEnabled;',
      ) &&
        normalizedHookSource.includes(
          "trackingTransparencyStatus: Platform.OS === 'ios' && shouldCollectConsent ? 'not_determined' : 'unavailable',",
        ) &&
        normalizedHookSource.includes(
          "umpConsentStatus: shouldCollectConsent ? 'unknown' : 'not_required',",
        ),
      'Mobile Ads consent hook must derive initial prompt state from ads config and Remove Ads entitlements',
    ],
    [
      normalizedHookSource.includes(
        'const state: AdConsentState = createInitialAdConsentState({',
      ) && normalizedHookSource.includes('decision: getAdSdkInitializationDecision(state),'),
      'Mobile Ads consent hook must route initial state through the consent SDK decision helper',
    ],
    [
      /if\s*\(\s*entitlements\.adsDisabled\s*\)\s*\{\s*return\s+initializeGoogleMobileAdsAfterConsent\(\{[\s\S]*entitlements,[\s\S]*runtime:\s*createNativeMobileAdsConsentRuntime\(Platform\.OS\),[\s\S]*\}\);\s*\}/.test(
        hookSource,
      ),
      'Mobile Ads consent hook must bypass cached initialization when Remove Ads is active',
    ],
    [
      normalizedHookSource.includes(
        'initializationPromise ??= initializeGoogleMobileAdsAfterConsent({',
      ) &&
        normalizedHookSource.includes('cachedInitialization = result;') &&
        normalizedHookSource.includes('initializationPromise = undefined;') &&
        normalizedHookSource.includes('throw error;'),
      'Mobile Ads consent hook must cache successful non-disabled initialization and reset after errors',
    ],
    [
      normalizedHookSource.includes(
        'if (!entitlements.adsDisabled && cachedInitialization) return cachedInitialization;',
      ) &&
        normalizedHookSource.includes('setResult(initialResult);') &&
        normalizedHookSource.includes('void initializeOnce(entitlements)') &&
        /\.\s*catch\(\(\)\s*=>\s*\{\s*if\s*\(\s*isMounted\s*\)\s*setResult\(createInitialResult\(entitlements\)\);\s*\}\);/.test(
          hookSource,
        ) &&
        normalizedHookSource.includes('isMounted = false;'),
      'Mobile Ads consent hook must fail closed to initial consent state after async initialization errors',
    ],
  ];

  hookCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }
    mobileAdsConsentHookCasesValidated += 1;
  });

  if (valid && mobileAdsConsentHookCasesValidated === EXPECTED_MOBILE_ADS_CONSENT_HOOK_CASES) {
    mobileAdsConsentHookParityValidated = true;
  }
}

function validateRewardedAdTypeSchemaParity() {
  let valid = true;
  let rewardedAdSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    rewardedAdSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/rewardedAd.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_REWARDED_AD_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(rewardedAdSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/rewardedAd.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/rewardedAd.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    rewardedAdTypeUnionsValidated += 1;
  });

  EXPECTED_REWARDED_AD_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      rewardedAdSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/rewardedAd.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/rewardedAd.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) rewardedAdTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    rewardedAdTypeUnionsValidated === EXPECTED_REWARDED_AD_TYPE_UNIONS.length &&
    rewardedAdTypeInterfacesValidated === EXPECTED_REWARDED_AD_INTERFACES.length
  ) {
    rewardedAdTypeSchemaParityValidated = true;
  }
}

function validateMockExamAccessTypeSchemaParity() {
  let valid = true;
  let mockExamAccessSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mockExamAccessSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/rewardedExam.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/rewardedExam.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(mockExamAccessSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/rewardedExam.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/rewardedExam.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    mockExamAccessTypeUnionsValidated += 1;
  });

  EXPECTED_MOCK_EXAM_ACCESS_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      mockExamAccessSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/rewardedExam.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/rewardedExam.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) mockExamAccessTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    mockExamAccessTypeUnionsValidated === EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS.length &&
    mockExamAccessTypeInterfacesValidated === EXPECTED_MOCK_EXAM_ACCESS_INTERFACES.length
  ) {
    mockExamAccessTypeSchemaParityValidated = true;
  }
}

function validateThemeTokenSchema() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  function validateNoExtraKeys(actual, expectedKeys, label) {
    if (!isObjectRecord(actual)) {
      reject(`${label} must be an object`);
      return;
    }
    const expectedKeySet = new Set(expectedKeys);
    for (const key of Object.keys(actual)) {
      if (!expectedKeySet.has(key)) reject(`${label}.${key} is not an expected token`);
    }
  }

  validateNoExtraKeys(colors, EXPECTED_THEME_COLOR_TOKENS, 'theme colors');
  if (isObjectRecord(colors)) {
    for (const token of EXPECTED_THEME_COLOR_TOKENS) {
      if (!Object.prototype.hasOwnProperty.call(colors, token)) {
        reject(`theme colors missing ${token}`);
        continue;
      }
      if (!isColorToken(colors[token])) {
        reject(`theme colors.${token} must be a hex or rgb/rgba color token`);
        continue;
      }
      themeColorTokensValidated += 1;
    }
  }

  validateNoExtraKeys(space, Object.keys(EXPECTED_THEME_SPACE_VALUES), 'theme space');
  if (isObjectRecord(space)) {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_SPACE_VALUES)) {
      if (space[token] !== expectedValue) {
        reject(`theme space.${token} expected ${expectedValue}, found ${space[token]}`);
        continue;
      }
      themeSpaceTokensValidated += 1;
    }
  }

  validateNoExtraKeys(radius, Object.keys(EXPECTED_THEME_RADIUS_VALUES), 'theme radius');
  if (isObjectRecord(radius)) {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_RADIUS_VALUES)) {
      if (radius[token] !== expectedValue) {
        reject(`theme radius.${token} expected ${expectedValue}, found ${radius[token]}`);
        continue;
      }
      themeRadiusTokensValidated += 1;
    }
  }

  validateNoExtraKeys(
    typography,
    ['fontFamily', ...EXPECTED_THEME_TYPOGRAPHY_TOKENS],
    'theme typography',
  );
  const fontFamily = typography?.fontFamily;
  if (!hasText(fontFamily)) reject('theme typography.fontFamily is required');
  if (isObjectRecord(typography)) {
    for (const token of EXPECTED_THEME_TYPOGRAPHY_TOKENS) {
      const style = typography[token];
      let tokenIsValid = true;

      function rejectToken(message) {
        tokenIsValid = false;
        reject(message);
      }

      if (!isObjectRecord(style)) {
        rejectToken(`theme typography.${token} must be an object`);
      } else {
        if (style.fontFamily !== fontFamily) {
          rejectToken(`theme typography.${token}.fontFamily must match theme fontFamily`);
        }
        if (!Number.isFinite(style.fontSize) || style.fontSize <= 0) {
          rejectToken(`theme typography.${token}.fontSize must be positive`);
        }
        if (!Number.isFinite(style.lineHeight) || style.lineHeight < style.fontSize) {
          rejectToken(`theme typography.${token}.lineHeight must be at least fontSize`);
        }
        if (!['400', '500', '600', '700'].includes(style.fontWeight)) {
          rejectToken(`theme typography.${token}.fontWeight must use a supported weight`);
        }
        if (
          style.letterSpacing !== undefined &&
          (!Number.isFinite(style.letterSpacing) || Math.abs(style.letterSpacing) > 4)
        ) {
          rejectToken(`theme typography.${token}.letterSpacing must be a bounded number`);
        }
      }

      if (tokenIsValid) themeTypographyTokensValidated += 1;
    }
  }

  validateNoExtraKeys(shadows, EXPECTED_THEME_SHADOW_TOKENS, 'theme shadows');
  if (isObjectRecord(shadows)) {
    for (const token of EXPECTED_THEME_SHADOW_TOKENS) {
      const shadow = shadows[token];
      let tokenIsValid = true;

      function rejectToken(message) {
        tokenIsValid = false;
        reject(message);
      }

      if (!isObjectRecord(shadow)) {
        rejectToken(`theme shadows.${token} must be an object`);
      } else {
        if (!isColorToken(shadow.shadowColor)) {
          rejectToken(`theme shadows.${token}.shadowColor must be a color token`);
        }
        if (!isObjectRecord(shadow.shadowOffset)) {
          rejectToken(`theme shadows.${token}.shadowOffset must be an object`);
        } else if (
          !Number.isFinite(shadow.shadowOffset.width) ||
          !Number.isFinite(shadow.shadowOffset.height)
        ) {
          rejectToken(`theme shadows.${token}.shadowOffset must have numeric width and height`);
        }
        if (
          !Number.isFinite(shadow.shadowOpacity) ||
          shadow.shadowOpacity < 0 ||
          shadow.shadowOpacity > 1
        ) {
          rejectToken(`theme shadows.${token}.shadowOpacity must be between 0 and 1`);
        }
        if (!Number.isFinite(shadow.shadowRadius) || shadow.shadowRadius < 0) {
          rejectToken(`theme shadows.${token}.shadowRadius must be non-negative`);
        }
        if (!Number.isFinite(shadow.elevation) || shadow.elevation < 0) {
          rejectToken(`theme shadows.${token}.elevation must be non-negative`);
        }
      }

      if (tokenIsValid) themeShadowTokensValidated += 1;
    }
  }

  if (!isObjectRecord(motion?.duration)) {
    reject('theme motion.duration must be an object');
  } else {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_MOTION_DURATIONS)) {
      if (motion.duration[token] !== expectedValue) {
        reject(
          `theme motion.duration.${token} expected ${expectedValue}, found ${motion.duration[token]}`,
        );
      } else {
        themeMotionTokensValidated += 1;
      }
    }
    if (
      !(motion.duration.fast < motion.duration.base && motion.duration.base < motion.duration.slow)
    ) {
      reject('theme motion.duration values must increase from fast to slow');
    }
  }
  if (!isObjectRecord(motion?.easing)) {
    reject('theme motion.easing must be an object');
  } else {
    for (const token of EXPECTED_THEME_MOTION_EASING) {
      if (!/^cubic-bezier\(.+\)$/.test(motion.easing[token] || '')) {
        reject(`theme motion.easing.${token} must be a cubic-bezier easing token`);
      } else {
        themeMotionTokensValidated += 1;
      }
    }
  }
  if (
    !Number.isFinite(motion?.pressedScale) ||
    motion.pressedScale <= 0 ||
    motion.pressedScale >= 1
  ) {
    reject('theme motion.pressedScale must be between 0 and 1');
  } else {
    themeMotionTokensValidated += 1;
  }
  if (!Number.isFinite(motion?.hoverScale) || motion.hoverScale <= 1) {
    reject('theme motion.hoverScale must be greater than 1');
  } else {
    themeMotionTokensValidated += 1;
  }

  if (
    valid &&
    themeColorTokensValidated === EXPECTED_THEME_COLOR_TOKENS.length &&
    themeSpaceTokensValidated === Object.keys(EXPECTED_THEME_SPACE_VALUES).length &&
    themeRadiusTokensValidated === Object.keys(EXPECTED_THEME_RADIUS_VALUES).length &&
    themeTypographyTokensValidated === EXPECTED_THEME_TYPOGRAPHY_TOKENS.length &&
    themeShadowTokensValidated === EXPECTED_THEME_SHADOW_TOKENS.length &&
    themeMotionTokensValidated ===
      Object.keys(EXPECTED_THEME_MOTION_DURATIONS).length + EXPECTED_THEME_MOTION_EASING.length + 2
  ) {
    themeTokenSchemaValidated = true;
  }
}

function validateGlossaryTerms() {
  if (!Array.isArray(glossaryTerms)) return;

  const seenIds = new Set();
  const seenTermsSv = new Set();
  const seenTermsEn = new Set();
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);

  glossaryTerms.forEach((term, index) => {
    const label = hasText(term?.id) ? term.id : `glossary term[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!term || typeof term !== 'object') {
      reject(`glossary term[${index}] is not an object`);
    } else {
      for (const field of ['id', 'termSv', 'termEn', 'explanationSv', 'explanationEn']) {
        if (!hasText(term[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(term[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      if (hasText(term.id) && !isSlugTag(term.id)) {
        reject(`${label} id must use lowercase kebab-case`);
      }
      if (hasText(term.id) && seenIds.has(term.id)) {
        reject(`${label} duplicates glossary term id`);
      }
      if (hasText(term.id)) seenIds.add(term.id);

      const normalizedTermSv = normalizeComparableText(term.termSv);
      if (normalizedTermSv && seenTermsSv.has(normalizedTermSv)) {
        reject(`${label} duplicates Swedish glossary term`);
      }
      if (normalizedTermSv) seenTermsSv.add(normalizedTermSv);

      const normalizedTermEn = normalizeComparableText(term.termEn);
      if (normalizedTermEn && seenTermsEn.has(normalizedTermEn)) {
        reject(`${label} duplicates English glossary term`);
      }
      if (normalizedTermEn) seenTermsEn.add(normalizedTermEn);

      if (!optionTextPairIsTranslatedOrInvariant({ textSv: term.termSv, textEn: term.termEn })) {
        reject(`${label} termSv and termEn must be translated or a short invariant term`);
      }
      if (
        normalizeComparableText(term.explanationSv) === normalizeComparableText(term.explanationEn)
      ) {
        reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
      }

      if (term.chapterId !== undefined) {
        if (!hasText(term.chapterId)) {
          reject(`${label} chapterId must be non-empty when present`);
        } else if (!textIsTrimmedSingleSpaced(term.chapterId)) {
          reject(`${label} chapterId must be trimmed and single-spaced`);
        } else if (chapterIds.size && !chapterIds.has(term.chapterId)) {
          reject(`${label} references unknown chapter ${term.chapterId}`);
        }
      }

      for (const failure of glossaryTermExactSchemaKeyFailures(term, label)) {
        reject(failure);
      }
    }

    if (valid) {
      glossaryTermsValidated += 1;
      glossaryTermExactSchemaKeysValidated += 1;
    }
  });
}

function validateBadgeCatalog() {
  if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) return;

  const entries = Object.entries(badgeCatalog);
  const expectedIds = new Set(EXPECTED_BADGE_IDS);
  const catalogIds = entries.map(([key]) => key);
  if (!jsonEqual(catalogIds, EXPECTED_BADGE_IDS)) {
    fail(
      `badgeCatalog ids are ${JSON.stringify(catalogIds)}, expected ${JSON.stringify(
        EXPECTED_BADGE_IDS,
      )}`,
    );
  }

  const seenTitlesByLanguage = {
    sv: new Set(),
    en: new Set(),
  };
  const seenDescriptionsByLanguage = {
    sv: new Set(),
    en: new Set(),
  };

  entries.forEach(([key, badge], index) => {
    const label = hasText(badge?.id) ? badge.id : `badge[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!badge || typeof badge !== 'object') {
      reject(`badgeCatalog.${key} is not an object`);
    } else {
      if (badge.id !== key) reject(`${label} id must match catalog key ${key}`);
      if (!expectedIds.has(badge.id)) reject(`${label} is not an expected badge id`);
      if (hasText(badge.id) && !isSnakeCaseId(badge.id)) {
        reject(`${label} id must use lowercase snake_case`);
      }

      for (const field of ['titleSv', 'titleEn', 'descriptionSv', 'descriptionEn']) {
        if (!hasText(badge[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(badge[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      for (const language of ['sv', 'en']) {
        const titleField = language === 'sv' ? 'titleSv' : 'titleEn';
        const descriptionField = language === 'sv' ? 'descriptionSv' : 'descriptionEn';
        const normalizedTitle = normalizeComparableText(badge[titleField]);
        if (normalizedTitle && seenTitlesByLanguage[language].has(normalizedTitle)) {
          reject(`${label} duplicates ${language} badge title`);
        }
        if (normalizedTitle) seenTitlesByLanguage[language].add(normalizedTitle);

        const normalizedDescription = normalizeComparableText(badge[descriptionField]);
        if (
          normalizedDescription &&
          seenDescriptionsByLanguage[language].has(normalizedDescription)
        ) {
          reject(`${label} duplicates ${language} badge description`);
        }
        if (normalizedDescription) {
          seenDescriptionsByLanguage[language].add(normalizedDescription);
        }
      }
    }

    if (valid) badgesValidated += 1;
  });

  if (typeof deriveBadges === 'function') {
    const noProgressBadgeIds = deriveBadges({
      completedQuestionCount: 0,
      currentStreak: 0,
      level: 1,
      wrongAnswerCount: 0,
    }).map((badge) => badge.id);
    const milestoneBadgeIds = deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id);

    if (noProgressBadgeIds.length) {
      fail(`deriveBadges returned badges before milestones: ${noProgressBadgeIds.join(', ')}`);
    } else if (!jsonEqual(milestoneBadgeIds, EXPECTED_BADGE_IDS)) {
      fail(
        `deriveBadges milestone ids are ${JSON.stringify(
          milestoneBadgeIds,
        )}, expected ${JSON.stringify(EXPECTED_BADGE_IDS)}`,
      );
    } else {
      badgeMilestoneParityValidated = true;
    }
  }
}

function validatePracticeScoringRules() {
  if (typeof scoreAnswers !== 'function') return;

  const cases = [
    { label: 'default empty results', input: undefined, expected: { correct: 0, total: 0 } },
    { label: 'empty results', input: [], expected: { correct: 0, total: 0 } },
    { label: 'all wrong results', input: [false, false], expected: { correct: 0, total: 2 } },
    { label: 'mixed results', input: [true, false, true], expected: { correct: 2, total: 3 } },
    { label: 'all correct results', input: [true, true], expected: { correct: 2, total: 2 } },
  ];
  let rulesAreValid = true;

  cases.forEach(({ label, input, expected }) => {
    let actual;
    try {
      actual = input === undefined ? scoreAnswers() : scoreAnswers(input);
    } catch (error) {
      rulesAreValid = false;
      fail(`practice scoring rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actual, expected)) {
      rulesAreValid = false;
      fail(
        `practice scoring rule ${label} returned ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      practiceScoringRulesValidated += 1;
    }
  });

  if (rulesAreValid && practiceScoringRulesValidated === cases.length) {
    practiceScoringRulesParityValidated = true;
  }
}

function validatePracticeFlowParity() {
  if (!Array.isArray(questions) || typeof getPracticeQuestionForSession !== 'function') {
    return;
  }

  const publishedQuestions = questions.filter((question) => question.reviewStatus === 'published');
  if (publishedQuestions.length < 3) {
    fail('practice flow parity needs at least three published questions');
    return;
  }

  const [firstQuestion, secondQuestion, thirdQuestion] = publishedQuestions;
  const completedAllQuestionIds = publishedQuestions.map((question) => question.id);
  const cases = [
    {
      label: 'empty question bank',
      questions: [],
      completedQuestionIds: [],
      activeQuestionId: null,
      expectedId: undefined,
    },
    {
      label: 'first unanswered question',
      questions: publishedQuestions,
      completedQuestionIds: [],
      activeQuestionId: null,
      expectedId: firstQuestion.id,
    },
    {
      label: 'active question remains locked',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id],
      activeQuestionId: firstQuestion.id,
      expectedId: firstQuestion.id,
    },
    {
      label: 'stale active question falls back to completed-count rotation',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id],
      activeQuestionId: 'missing-question-id',
      expectedId: secondQuestion.id,
    },
    {
      label: 'two completed questions advance to the third question',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id, secondQuestion.id],
      activeQuestionId: null,
      expectedId: thirdQuestion.id,
    },
    {
      label: 'completed question count wraps to the first question',
      questions: publishedQuestions,
      completedQuestionIds: completedAllQuestionIds,
      activeQuestionId: null,
      expectedId: firstQuestion.id,
    },
  ];

  let valid = true;

  cases.forEach((testCase) => {
    const {
      label,
      questions: caseQuestions,
      completedQuestionIds,
      activeQuestionId,
      expectedId,
    } = testCase;
    let actualQuestion;
    try {
      actualQuestion = getPracticeQuestionForSession(
        caseQuestions,
        completedQuestionIds,
        activeQuestionId,
      );
    } catch (error) {
      valid = false;
      fail(`practice flow ${label} threw ${error.message}`);
      return;
    }

    const actualId = actualQuestion?.id;
    if (actualId !== expectedId) {
      valid = false;
      fail(
        `practice flow ${label} returned ${JSON.stringify(actualId)}, expected ${JSON.stringify(
          expectedId,
        )}`,
      );
    } else {
      practiceFlowCasesValidated += 1;
    }
  });

  if (valid && practiceFlowCasesValidated === cases.length) {
    practiceFlowParityValidated = true;
  }
}

function validatePracticeSessionStoreParity() {
  let valid = true;
  let runtimeValid = true;
  let practiceSessionStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  function rejectRuntime(message) {
    runtimeValid = false;
    reject(message);
  }

  try {
    practiceSessionStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/quiz/practiceSessionStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`practice session store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(
    practiceSessionStoreSource,
    'PracticeSessionState',
  );
  if (!Array.isArray(actualFields)) {
    reject('lib/quiz/practiceSessionStore.ts PracticeSessionState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_PRACTICE_SESSION_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `PracticeSessionState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_PRACTICE_SESSION_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`PracticeSessionState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `PracticeSessionState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `PracticeSessionState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) practiceSessionStoreFieldsValidated += 1;
  });

  if (
    usePracticeSessionStore &&
    typeof usePracticeSessionStore.getState === 'function' &&
    typeof usePracticeSessionStore.setState === 'function'
  ) {
    usePracticeSessionStore.setState({
      activeQuestionId: null,
      selectedOptionId: null,
      shuffleSessionId: 'practice-session-0',
    });

    usePracticeSessionStore.getState().selectOption('q-validator', 'option-a');
    let state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== 'q-validator' || state.selectedOptionId !== 'option-a') {
      rejectRuntime('practice session selectOption must lock question id and selected option id');
    }
    if (state.shuffleSessionId !== 'practice-session-0') {
      rejectRuntime('practice session selectOption must keep the current shuffle session seed');
    }

    usePracticeSessionStore.getState().resetSelection();
    state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== 'q-validator' || state.selectedOptionId !== null) {
      rejectRuntime(
        'practice session resetSelection must keep active question while clearing answer',
      );
    }
    if (state.shuffleSessionId !== 'practice-session-0') {
      rejectRuntime('practice session resetSelection must keep the current shuffle session seed');
    }

    usePracticeSessionStore.getState().advanceQuestion();
    state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== null || state.selectedOptionId !== null) {
      rejectRuntime(
        'practice session advanceQuestion must clear active question and selected answer',
      );
    }
    if (state.shuffleSessionId !== 'practice-session-1') {
      rejectRuntime('practice session advanceQuestion must advance the shuffle session seed');
    }

    usePracticeSessionStore.setState({
      activeQuestionId: null,
      selectedOptionId: null,
      shuffleSessionId: 'practice-session-0',
    });
  }

  if (
    valid &&
    practiceSessionStoreFieldsValidated === EXPECTED_PRACTICE_SESSION_STORE_FIELDS.length
  ) {
    practiceSessionStoreSchemaParityValidated = true;
  }
  if (valid && runtimeValid) practiceSessionStoreRuntimeParityValidated = true;
}

function validateAnswerValidationTypeSchemaParity() {
  let valid = true;
  let answerValidationSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    answerValidationSource = fs.readFileSync(
      path.join(repoRoot, 'lib/quiz/answerValidation.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/quiz/answerValidation.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(answerValidationSource, typeName);
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/quiz/answerValidation.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    answerValidationTypeUnionsValidated += 1;
  });

  EXPECTED_ANSWER_VALIDATION_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      answerValidationSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/quiz/answerValidation.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/quiz/answerValidation.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) answerValidationTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    answerValidationTypeUnionsValidated === EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS.length &&
    answerValidationTypeInterfacesValidated === EXPECTED_ANSWER_VALIDATION_INTERFACES.length
  ) {
    answerValidationTypeSchemaParityValidated = true;
  }
}

function validateAnswerFeedbackParity() {
  if (
    !Array.isArray(questions) ||
    typeof isCorrectAnswer !== 'function' ||
    typeof getAnswerOptionFeedback !== 'function'
  ) {
    return;
  }

  let runtimeParityIsValid = true;

  questions.forEach((question) => {
    const correctOption = question.options?.find(
      (option) => option.id === question.correctOptionId,
    );
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!correctOption) {
      reject(`${question.id} answer feedback cannot find the correct option`);
      return;
    }

    if (!isCorrectAnswer(question, correctOption.id)) {
      reject(`${question.id} isCorrectAnswer rejects the correct option`);
    }

    const selectedCorrectFeedback = getAnswerOptionFeedback(
      question,
      correctOption.id,
      correctOption.id,
    );
    if (
      selectedCorrectFeedback.resultLabel !== 'Rätt' ||
      selectedCorrectFeedback.tone !== 'correct'
    ) {
      reject(`${question.id} selected correct feedback drifted`);
    }

    question.options.forEach((option) => {
      const label = `${question.id} option ${option.id}`;
      const idleFeedback = getAnswerOptionFeedback(question, option.id, null);
      if (!jsonEqual(idleFeedback, { tone: 'idle' })) {
        reject(`${label} idle feedback drifted`);
      }

      if (option.id === question.correctOptionId) {
        answerFeedbackOptionsValidated += 1;
        return;
      }

      if (isCorrectAnswer(question, option.id)) {
        reject(`${label} isCorrectAnswer accepts a wrong option`);
      }

      const selectedWrongFeedback = getAnswerOptionFeedback(question, option.id, option.id);
      if (
        selectedWrongFeedback.resultLabel !== 'Fel' ||
        selectedWrongFeedback.tone !== 'incorrect'
      ) {
        reject(`${label} selected wrong feedback drifted`);
      }

      const revealedCorrectFeedback = getAnswerOptionFeedback(
        question,
        correctOption.id,
        option.id,
      );
      if (
        revealedCorrectFeedback.resultLabel !== 'Rätt svar' ||
        revealedCorrectFeedback.tone !== 'correct'
      ) {
        reject(`${label} correct-answer reveal feedback drifted`);
      }

      question.options
        .filter((otherOption) => ![option.id, correctOption.id].includes(otherOption.id))
        .forEach((otherOption) => {
          const otherFeedback = getAnswerOptionFeedback(question, otherOption.id, option.id);
          if (!jsonEqual(otherFeedback, { tone: 'idle' })) {
            reject(`${label} changed neutral feedback for ${otherOption.id}`);
          }
        });

      answerFeedbackOptionsValidated += 1;
    });

    if (questionIsValid) answerFeedbackQuestionsValidated += 1;
  });

  if (runtimeParityIsValid && answerFeedbackQuestionsValidated === questions.length) {
    answerFeedbackRuntimeParityValidated = true;
  }
}

function answerShuffleOptionSignature(question) {
  return (question.options || [])
    .map((option) => `${option.id}:${option.textSv}:${option.textEn}`)
    .join('|');
}

function validateAnswerShuffleDistributionParity() {
  if (
    !Array.isArray(questions) ||
    typeof shuffleQuestionOptionsForSession !== 'function' ||
    typeof summarizeAnswerShuffleDistribution !== 'function' ||
    typeof answerShuffleDistributionIsBalanced !== 'function'
  ) {
    return;
  }

  let runtimeParityIsValid = true;
  const singleChoiceQuestions = questions.filter(
    (question) =>
      question.reviewStatus === 'published' &&
      question.type === 'single_choice' &&
      Array.isArray(question.options) &&
      question.options.length === SINGLE_CHOICE_OPTION_IDS.length,
  );
  const trueFalseQuestionsForShuffle = questions.filter(
    (question) =>
      question.reviewStatus === 'published' &&
      question.type === 'true_false' &&
      Array.isArray(question.options),
  );

  function reject(message) {
    runtimeParityIsValid = false;
    fail(message);
  }

  if (singleChoiceQuestions.length <= 100) {
    reject('answer shuffle needs more than 100 published single-choice questions');
    return;
  }

  const baseDistribution = summarizeAnswerShuffleDistribution(
    singleChoiceQuestions,
    'p0-answer-shuffle',
  );
  const movementSessionIds = Array.from(
    { length: 8 },
    (_unused, index) => `p0-answer-shuffle-movement-${index}`,
  );

  if (baseDistribution.totalQuestions !== singleChoiceQuestions.length) {
    reject(
      `answer shuffle distribution saw ${baseDistribution.totalQuestions} questions, expected ${singleChoiceQuestions.length}`,
    );
  }
  if (!answerShuffleDistributionIsBalanced(baseDistribution)) {
    reject(
      `answer shuffle correct positions exceed ${ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE}: ${JSON.stringify(
        baseDistribution.correctPositionCounts,
      )}`,
    );
  }

  singleChoiceQuestions.forEach((question) => {
    let questionIsValid = true;
    const originalSignature = answerShuffleOptionSignature(question);
    const originalCorrectOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    );
    const firstShuffle = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    const secondShuffle = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    const shuffledCorrectOption = firstShuffle.options.find(
      (option) => option.id === firstShuffle.correctOptionId,
    );
    const movementPositions = new Set(
      movementSessionIds.map(
        (sessionId) => shuffleQuestionOptionsForSession(question, sessionId).correctOptionId,
      ),
    );

    function rejectQuestion(message) {
      questionIsValid = false;
      reject(message);
    }

    if (JSON.stringify(firstShuffle) !== JSON.stringify(secondShuffle)) {
      rejectQuestion(`${question.id} answer shuffle is not stable for the same session`);
    }
    if (answerShuffleOptionSignature(question) !== originalSignature) {
      rejectQuestion(`${question.id} answer shuffle mutated source options`);
    }
    if (
      !arrayEquals(
        firstShuffle.options.map((option) => option.id),
        SINGLE_CHOICE_OPTION_IDS,
      )
    ) {
      rejectQuestion(`${question.id} answer shuffle did not remap display option ids`);
    }
    if (!originalCorrectOption || !shuffledCorrectOption) {
      rejectQuestion(`${question.id} answer shuffle lost the correct option`);
    } else if (
      shuffledCorrectOption.textSv !== originalCorrectOption.textSv ||
      shuffledCorrectOption.textEn !== originalCorrectOption.textEn
    ) {
      rejectQuestion(`${question.id} answer shuffle moved the correct label incorrectly`);
    }
    if (!isCorrectAnswer(firstShuffle, firstShuffle.correctOptionId)) {
      rejectQuestion(`${question.id} shuffled correctOptionId does not score as correct`);
    }
    if (movementPositions.size < 2) {
      rejectQuestion(`${question.id} answer shuffle ignores the session seed`);
    }

    if (questionIsValid) {
      answerShuffleSingleChoiceQuestionsValidated += 1;
      answerShuffleSessionMovementQuestionsValidated += 1;
    }
  });

  trueFalseQuestionsForShuffle.forEach((question) => {
    const shuffled = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    if (
      JSON.stringify(shuffled.options) !== JSON.stringify(question.options) ||
      shuffled.correctOptionId !== question.correctOptionId
    ) {
      reject(`${question.id} true/false answer order must stay fixed`);
      return;
    }
    answerShuffleTrueFalseQuestionsValidated += 1;
  });

  for (let index = 0; index < 50; index += 1) {
    const distribution = summarizeAnswerShuffleDistribution(
      singleChoiceQuestions,
      `p0-session-${index}`,
    );
    if (
      distribution.totalQuestions !== singleChoiceQuestions.length ||
      !answerShuffleDistributionIsBalanced(distribution)
    ) {
      reject(
        `answer shuffle distribution is unbalanced for ${distribution.sessionId}: ${JSON.stringify(
          distribution.correctPositionCounts,
        )}`,
      );
      continue;
    }
    answerShuffleSeedDistributionsValidated += 1;
  }

  if (
    runtimeParityIsValid &&
    answerShuffleSingleChoiceQuestionsValidated === singleChoiceQuestions.length &&
    answerShuffleTrueFalseQuestionsValidated === trueFalseQuestionsForShuffle.length &&
    answerShuffleSeedDistributionsValidated === 50 &&
    answerShuffleSessionMovementQuestionsValidated === singleChoiceQuestions.length
  ) {
    answerShuffleDistributionParityValidated = true;
  }
}

function speechOptionLetter(index) {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

const SOURCE_AUTHORITY_REPLACEMENTS = [
  {
    pattern: /\bSant eller falskt\s+enligt UHR-materialet\s*:/gi,
    replacement: 'Sant eller falskt:',
  },
  {
    pattern: /\bTrue or false\s+according to the UHR material\s*:/gi,
    replacement: 'True or false:',
  },
  { pattern: /\bEnligt UHR-materialet,\s*/gi, replacement: '' },
  { pattern: /\bAccording to the UHR material,\s*/gi, replacement: '' },
  { pattern: /\s+enligt UHR-materialet\b/gi, replacement: '' },
  { pattern: /\s+according to the UHR material\b/gi, replacement: '' },
  { pattern: /\s+enligt UHR-avsnittet\s+"[^"]+"/gi, replacement: '' },
  { pattern: /\s+the UHR section\s+"[^"]+"/gi, replacement: '' },
  { pattern: /^\s*Sant eller falskt\s*:\s*/i, replacement: '' },
  { pattern: /^\s*True or false\s*:\s*/i, replacement: '' },
];

function stripSourceAuthorityPhrasing(text) {
  if (!text) return '';

  const cleaned = SOURCE_AUTHORITY_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement.pattern, replacement.replacement),
    String(text),
  )
    .replace(/\?\s*,\s*/g, '? ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned
    .replace(/^([a-zåäö])/, (character) => character.toLocaleUpperCase('sv-SE'))
    .replace(/([.!?]\s+)([a-zåäö])/g, (_match, prefix, character) => {
      return `${prefix}${character.toLocaleUpperCase('sv-SE')}`;
    });
}

function expectedQuestionSpeechText(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  const questionText = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
  const optionText = options
    .map((option, index) => `Alternativ ${speechOptionLetter(index)}. ${option.textSv}.`)
    .join(' ');

  return `${questionText} ${optionText}`.trim();
}

function validateQuestionSpeechTextParity() {
  if (!Array.isArray(questions) || typeof buildQuestionSpeechText !== 'function') {
    return;
  }

  let runtimeParityIsValid = true;
  const expectedOptionCount = questions.reduce(
    (count, question) => count + (Array.isArray(question.options) ? question.options.length : 0),
    0,
  );

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!Array.isArray(question.options) || question.options.length === 0) {
      reject(`${label} speech text cannot be built without answer options`);
      return;
    }

    let speechText = '';
    try {
      speechText = buildQuestionSpeechText(question);
    } catch (error) {
      reject(`${label} buildQuestionSpeechText threw ${error.message}`);
      return;
    }

    const expectedSpeechText = expectedQuestionSpeechText(question);
    if (speechText !== expectedSpeechText) {
      reject(
        `${label} speech text is ${JSON.stringify(speechText)}, expected ${JSON.stringify(
          expectedSpeechText,
        )}`,
      );
    }

    const expectedPrompt = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
    if (!speechText.startsWith(expectedPrompt)) {
      reject(`${label} speech text must start with the display-safe Swedish question prompt`);
    }

    question.options.forEach((option, optionIndex) => {
      const expectedFragment = `Alternativ ${speechOptionLetter(optionIndex)}. ${option.textSv}.`;
      if (!speechText.includes(expectedFragment)) {
        reject(`${label} speech text is missing option fragment ${expectedFragment}`);
      }
    });

    if (questionIsValid) {
      questionSpeechTextQuestionsValidated += 1;
      questionSpeechTextOptionsValidated += question.options.length;
    }
  });

  if (
    runtimeParityIsValid &&
    questionSpeechTextQuestionsValidated === questions.length &&
    questionSpeechTextOptionsValidated === expectedOptionCount
  ) {
    questionSpeechTextParityValidated = true;
  }
}

function resetSpeechEvents() {
  speechEvents.length = 0;
}

function validateSpeechRuntimeParity() {
  if (typeof speakSwedish !== 'function' || typeof stopSpeech !== 'function') {
    return;
  }

  let runtimeParityIsValid = true;

  function reject(message) {
    runtimeParityIsValid = false;
    fail(message);
  }

  resetSpeechEvents();
  speakSwedish('');
  if (speechEvents.length === 0) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('speakSwedish must ignore empty text');
  }

  resetSpeechEvents();
  speakSwedish('   ');
  if (speechEvents.length === 0) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('speakSwedish must ignore whitespace-only text');
  }

  resetSpeechEvents();
  speakSwedish('Hej Sverige');
  const speakEvent = speechEvents[0];
  if (
    speechEvents.length === 1 &&
    speakEvent &&
    speakEvent.type === 'speak' &&
    speakEvent.text === 'Hej Sverige' &&
    speakEvent.options &&
    speakEvent.options.language === EXPECTED_SWEDISH_SPEECH_LANGUAGE
  ) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject(
      `speakSwedish must request ${EXPECTED_SWEDISH_SPEECH_LANGUAGE} speech for non-empty text`,
    );
  }

  resetSpeechEvents();
  stopSpeech();
  const stopEvent = speechEvents[0];
  if (speechEvents.length === 1 && stopEvent && stopEvent.type === 'stop') {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('stopSpeech must call the Expo Speech stop handler');
  }

  resetSpeechEvents();

  if (runtimeParityIsValid && speechRuntimeCasesValidated === EXPECTED_SPEECH_RUNTIME_CASES) {
    speechRuntimeParityValidated = true;
  }
}

function validateChapterQuizSessionParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(questions) ||
    typeof getChapterQuizSessionId !== 'function'
  ) {
    return;
  }

  chapters.forEach((chapter) => {
    const expectedQuestion = questions.find((question) => question.chapterId === chapter.id);
    const sessionId = getChapterQuizSessionId(questions, chapter.id);
    const sessionQuestion = questions.find((question) => question.id === sessionId);
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!expectedQuestion) {
      reject(`${chapter.id} has no question for chapter quiz session`);
    } else if (sessionId !== expectedQuestion.id) {
      reject(
        `${chapter.id} chapter quiz session resolves to ${sessionId}, expected ${expectedQuestion.id}`,
      );
    }

    if (!sessionQuestion) {
      reject(`${chapter.id} chapter quiz session id ${sessionId} does not match a question`);
    } else if (sessionQuestion.chapterId !== chapter.id) {
      reject(
        `${chapter.id} chapter quiz session id ${sessionId} belongs to ${sessionQuestion.chapterId}`,
      );
    } else if (sessionQuestion.reviewStatus !== 'published') {
      reject(`${chapter.id} chapter quiz session id ${sessionId} is not published`);
    }

    if (valid) chapterQuizSessionParityValidated += 1;
  });

  if (getChapterQuizSessionId(questions, 'missing-chapter') !== null) {
    fail('missing chapter quiz session should resolve to null');
  }
  if (getChapterQuizSessionId(questions, null) !== null) {
    fail('null chapter quiz session should resolve to null');
  }
}

function isoDaysAfter(baseIso, days) {
  const dayInMs = 24 * 60 * 60 * 1000;
  return new Date(new Date(baseIso).getTime() + days * dayInMs).toISOString();
}

function validateSpacedRepetitionSchedule() {
  if (!Array.isArray(spacedRepetitionSchedule)) return;

  if (!jsonEqual(spacedRepetitionSchedule, EXPECTED_SPACED_REPETITION_SCHEDULE)) {
    fail(
      `spacedRepetitionSchedule is ${JSON.stringify(
        spacedRepetitionSchedule,
      )}, expected ${JSON.stringify(EXPECTED_SPACED_REPETITION_SCHEDULE)}`,
    );
  }

  spacedRepetitionSchedule.forEach((days, index) => {
    let valid = true;

    if (!Number.isInteger(days) || days < 1) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be a positive integer day interval`);
    }
    if (index > 0 && days <= spacedRepetitionSchedule[index - 1]) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be greater than the previous interval`);
    }

    if (valid) spacedRepetitionIntervalsValidated += 1;
  });

  if (typeof getNextReviewAt !== 'function') return;

  const answeredAt = '2026-05-15T10:00:00.000Z';
  const cases = [
    {
      input: { isCorrect: false, correctStreak: 99, answeredAt },
      expectedDays: 1,
      label: 'wrong answer',
    },
    {
      input: { isCorrect: true, correctStreak: 0, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[0],
      label: 'correct streak 0',
    },
    {
      input: { isCorrect: true, correctStreak: 3, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[3],
      label: 'correct streak 3',
    },
    {
      input: { isCorrect: true, correctStreak: 50, answeredAt },
      expectedDays:
        EXPECTED_SPACED_REPETITION_SCHEDULE[EXPECTED_SPACED_REPETITION_SCHEDULE.length - 1],
      label: 'capped correct streak',
    },
  ];
  let runtimeParityIsValid = true;

  cases.forEach(({ input, expectedDays, label }) => {
    const actual = getNextReviewAt(input);
    const expected = isoDaysAfter(answeredAt, expectedDays);
    if (actual !== expected) {
      runtimeParityIsValid = false;
      fail(`getNextReviewAt ${label} returned ${actual}, expected ${expected}`);
    }
  });

  if (runtimeParityIsValid) spacedRepetitionRuntimeParityValidated = true;
}

function validateStreakRules() {
  if (typeof calculateStreak !== 'function') return;

  const today = '2026-05-15';
  const cases = [
    {
      label: 'empty answer history',
      actual: () => calculateStreak([], today),
      expected: 0,
    },
    {
      label: 'consecutive answer days through today',
      actual: () =>
        calculateStreak(['2026-05-13T09:00:00.000Z', '2026-05-14', '2026-05-15'], today),
      expected: 3,
    },
    {
      label: 'duplicate answer dates',
      actual: () =>
        calculateStreak(
          ['2026-05-14', '2026-05-15T08:00:00.000Z', '2026-05-15T20:00:00.000Z'],
          today,
        ),
      expected: 2,
    },
    {
      label: 'missed today but answered yesterday',
      actual: () => calculateStreak(['2026-05-13', '2026-05-14'], today),
      expected: 2,
    },
    {
      label: 'gap before today',
      actual: () => calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], today),
      expected: 1,
    },
    {
      label: 'future-only answers',
      actual: () => calculateStreak(['2026-05-16'], today),
      expected: 0,
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`streak rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`streak rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      streakRulesValidated += 1;
    }
  });

  if (rulesAreValid && streakRulesValidated === EXPECTED_STREAK_RULE_COUNT) {
    streakRulesParityValidated = true;
  }
}

function validateXpRules() {
  if (
    typeof calculateAnswerXp !== 'function' ||
    typeof calculateQuizCompletionXp !== 'function' ||
    typeof calculateLevel !== 'function'
  ) {
    return;
  }

  const cases = [
    {
      label: 'correct answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: true }),
      expected: 12,
    },
    {
      label: 'correct answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: false }),
      expected: 10,
    },
    {
      label: 'wrong answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: true }),
      expected: 4,
    },
    {
      label: 'wrong answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: false }),
      expected: 2,
    },
    {
      label: 'empty quiz completion',
      actual: () => calculateQuizCompletionXp({ answeredCount: 0, correctCount: 0 }),
      expected: 0,
    },
    {
      label: 'completed quiz without perfect bonus',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 9 }),
      expected: 20,
    },
    {
      label: 'perfect ten-question quiz',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }),
      expected: 70,
    },
    { label: 'level at 0 XP', actual: () => calculateLevel(0), expected: 1 },
    { label: 'level below first threshold', actual: () => calculateLevel(99), expected: 1 },
    { label: 'level at 100 XP', actual: () => calculateLevel(100), expected: 2 },
    { label: 'level at 400 XP', actual: () => calculateLevel(400), expected: 3 },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`XP rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`XP rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      xpRulesValidated += 1;
    }
  });

  if (rulesAreValid && xpRulesValidated === EXPECTED_XP_RULE_COUNT) {
    xpRulesParityValidated = true;
  }
}

function validateMasteryRules() {
  if (
    typeof calculateMastery !== 'function' ||
    typeof calculateChapterMastery !== 'function' ||
    typeof findWeakChapterIds !== 'function'
  ) {
    return;
  }

  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };
  const cases = [
    {
      label: 'no progress mastery',
      actual: () =>
        calculateMastery({
          correctCount: 0,
          seenCount: 0,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0,
    },
    {
      label: 'weighted accuracy coverage and recency',
      actual: () =>
        calculateMastery({
          correctCount: 8,
          seenCount: 10,
          totalQuestions: 20,
          recent: true,
        }),
      expected: 0.75,
    },
    {
      label: 'mastery clamps oversampled counts',
      actual: () =>
        calculateMastery({
          correctCount: 20,
          seenCount: 10,
          totalQuestions: 5,
          recent: false,
        }),
      expected: 0.8,
    },
    {
      label: 'mastery without recency bonus',
      actual: () =>
        calculateMastery({
          correctCount: 5,
          seenCount: 10,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0.4,
    },
    {
      label: 'chapter mastery aggregate',
      actual: () => calculateChapterMastery('ch01', questions, progress),
      expected: 0.67,
    },
    {
      label: 'unknown chapter mastery',
      actual: () => calculateChapterMastery('ch99', questions, progress),
      expected: 0,
    },
    {
      label: 'weak chapter ids',
      actual: () => findWeakChapterIds(questions, progress, 0.7),
      expected: ['ch01'],
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`mastery rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actualValue, expected)) {
      rulesAreValid = false;
      fail(
        `mastery rule ${label} returned ${JSON.stringify(actualValue)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      masteryRulesValidated += 1;
    }
  });

  if (rulesAreValid && masteryRulesValidated === EXPECTED_MASTERY_RULE_COUNT) {
    masteryRulesParityValidated = true;
  }
}

function validateQuestionBankCsvContract() {
  if (!Array.isArray(questions)) return;

  const csvPath = path.join(repoRoot, 'content/question-bank.csv');
  let rows = [];
  try {
    rows = parseCsvRows(fs.readFileSync(csvPath, 'utf8'));
  } catch (error) {
    fail(`content/question-bank.csv could not be parsed: ${error.message}`);
    return;
  }

  if (!rows.length) {
    fail('content/question-bank.csv is empty');
    return;
  }

  const [header, ...dataRows] = rows;
  if (!jsonEqual(header, QUESTION_BANK_CSV_HEADER)) {
    fail(
      `content/question-bank.csv header is ${JSON.stringify(header)}, expected ${JSON.stringify(
        QUESTION_BANK_CSV_HEADER,
      )}`,
    );
  }

  if (dataRows.length !== questions.length) {
    fail(
      `content/question-bank.csv has ${dataRows.length} data rows, expected ${questions.length}`,
    );
  }

  dataRows.forEach((row, index) => {
    const question = questions[index];
    const rowNumber = index + 2;
    const label = question?.id || `CSV row ${rowNumber}`;
    let rowIsValid = true;

    function reject(message) {
      rowIsValid = false;
      fail(message);
    }

    if (row.length !== QUESTION_BANK_CSV_HEADER.length) {
      reject(
        `content/question-bank.csv row ${rowNumber} has ${row.length} columns, expected ${QUESTION_BANK_CSV_HEADER.length}`,
      );
    }
    if (!question) {
      reject(`content/question-bank.csv row ${rowNumber} has no matching question`);
      return;
    }

    const expectedRow = [
      question.id,
      question.chapterId,
      question.type,
      question.questionSv,
      question.questionEn,
      question.correctOptionId,
      question.uhrReference?.chapter,
      question.uhrReference?.section,
      String(question.uhrReference?.pageApprox),
      uhrSectionMap?.source?.publisher,
      question.difficulty,
      question.reviewStatus,
      Array.isArray(question.tags) ? question.tags.join('|') : '',
    ];

    QUESTION_BANK_CSV_HEADER.forEach((field, fieldIndex) => {
      if (row[fieldIndex] !== expectedRow[fieldIndex]) {
        reject(
          `content/question-bank.csv row ${rowNumber} ${label} ${field} is ${JSON.stringify(
            row[fieldIndex],
          )}, expected ${JSON.stringify(expectedRow[fieldIndex])}`,
        );
      }
    });

    if (rowIsValid) questionBankCsvRowsValidated += 1;
  });
}

function validateStaticSiteQuestionBankParity() {
  if (failures.length > 0) return;

  const siteQuestionBankPath = path.join(repoRoot, 'site/questions.js');
  let expected = '';
  let bank;
  let actual = '';

  try {
    expected = generateStaticSiteQuestionBankJs();
    bank = buildSiteQuestionBank();
  } catch (error) {
    fail(`site/questions.js parity could not be generated: ${error.message}`);
    return;
  }

  try {
    actual = fs.readFileSync(siteQuestionBankPath, 'utf8');
  } catch (error) {
    fail(`site/questions.js could not be read: ${error.message}`);
    return;
  }

  staticSiteQuestionBankQuestionsValidated = bank.questions.length;
  staticSiteQuestionBankChaptersValidated = bank.chapters.length;

  if (actual !== expected) {
    fail('site/questions.js is out of sync; run node scripts/export-site-question-bank.js');
    return;
  }

  staticSiteQuestionBankParityValidated = true;
}

const PUBLISHED_SOURCE_PARITY_FIELDS = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'options',
  'correctOptionId',
  'explanationSv',
  'explanationEn',
  'uhrReference',
  'difficulty',
  'tags',
];

function validateAuthoredSourcePartition(questionsToValidate, label, startQuestionNumber, count) {
  if (!Array.isArray(questionsToValidate)) return;

  if (questionsToValidate.length !== count) {
    fail(`${label} has ${questionsToValidate.length} rows, expected ${count}`);
  }

  questionsToValidate.forEach((question, index) => {
    if (index >= count) {
      fail(`${label}[${index}] exceeds expected ${count} rows`);
      return;
    }

    const expectedId = `q${String(startQuestionNumber + index).padStart(3, '0')}`;
    const actualId = question?.id;
    if (actualId !== expectedId) {
      fail(`${label}[${index}] has id ${actualId}, expected ${expectedId}`);
      return;
    }

    authoredSourcePartitionQuestionsValidated += 1;
  });
}

function expectedPublishedSourceField(question, field) {
  if (question.type === 'true_false' && field === 'questionSv') {
    return ensureSentence(stripTrueFalsePromptSv(question.questionSv));
  }
  if (question.type === 'true_false' && field === 'questionEn') {
    return ensureSentence(stripTrueFalsePromptEn(question.questionEn));
  }
  return question[field];
}

function validateAuthoredSourceParity() {
  if (
    !Array.isArray(baseQuestions) ||
    !Array.isArray(additionalQuestions) ||
    !Array.isArray(sourceQuestions)
  ) {
    return;
  }

  validateAuthoredSourcePartition(
    baseQuestions,
    'baseQuestions',
    1,
    EXPECTED_BASE_SOURCE_QUESTIONS,
  );
  validateAuthoredSourcePartition(
    additionalQuestions,
    'additionalQuestions',
    EXPECTED_BASE_SOURCE_QUESTIONS + 1,
    EXPECTED_SOURCE_QUESTIONS - EXPECTED_BASE_SOURCE_QUESTIONS,
  );

  const authoredQuestions = [...baseQuestions, ...additionalQuestions];
  if (authoredQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(
      `expected ${EXPECTED_SOURCE_QUESTIONS} authored source questions, found ${authoredQuestions.length}`,
    );
  }
  if (sourceQuestions.length !== authoredQuestions.length) {
    fail(
      `sourceQuestions has ${sourceQuestions.length} rows, expected ${authoredQuestions.length} authored questions`,
    );
  }

  const seenIds = new Set();
  authoredQuestions.forEach((question, index) => {
    const label = hasText(question.id) ? question.id : `authored question[${index}]`;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    let authoredQuestionIsValid = true;

    function reject(message) {
      authoredQuestionIsValid = false;
      fail(message);
    }

    if (question.id !== expectedId) {
      reject(`authored source index ${index} has id ${question.id}, expected ${expectedId}`);
    }
    if (seenIds.has(question.id)) reject(`duplicate authored source question id ${question.id}`);
    if (hasText(question.id)) seenIds.add(question.id);
    if (question.reviewStatus !== 'reviewed') {
      reject(
        `${label} authored source reviewStatus is ${question.reviewStatus}, expected reviewed`,
      );
    }
    if (findQuestionTrueFalseStemPrefix(question)) {
      reject(`${label} authored true/false source stem contains redundant true/false prefix`);
    }
    if (findAuthoredTrueFalseExplanationBoilerplate(question)) {
      reject(
        `${label} authored true/false source explanation contains answer-judgement boilerplate`,
      );
    }

    if (validateQuestionSchema(question, index) && authoredQuestionIsValid) {
      authoredSourceQuestionsValidated += 1;
    }

    const publishedQuestion = sourceQuestions[index];
    if (!publishedQuestion) return;

    let publicationParityIsValid = true;
    if (publishedQuestion.reviewStatus !== 'published') {
      publicationParityIsValid = false;
      fail(`${label} published source reviewStatus is ${publishedQuestion.reviewStatus}`);
    }
    for (const field of PUBLISHED_SOURCE_PARITY_FIELDS) {
      const expectedValue = expectedPublishedSourceField(question, field);
      if (JSON.stringify(publishedQuestion[field]) !== JSON.stringify(expectedValue)) {
        publicationParityIsValid = false;
        fail(`${label} published source ${field} does not match authored source`);
      }
    }
    if (publicationParityIsValid) sourcePublicationParityValidated += 1;
  });
}

validateAuthoredSourceParity();

function validateGenerationParity() {
  if (
    !Array.isArray(questions) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions)
  ) {
    return;
  }

  const expectedGeneratedCount = sourceQuestions.length * GENERATED_VARIANTS_PER_SOURCE;
  if (sourceQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(`expected ${EXPECTED_SOURCE_QUESTIONS} source questions, found ${sourceQuestions.length}`);
  }
  if (generatedPublishedQuestions.length !== expectedGeneratedCount) {
    fail(
      `expected ${expectedGeneratedCount} generated published questions, found ${generatedPublishedQuestions.length}`,
    );
  }

  const expectedQuestionIds = [...sourceQuestions, ...generatedPublishedQuestions].map(
    (question) => question.id,
  );
  const actualQuestionIds = questions.map((question) => question.id);
  if (actualQuestionIds.length !== expectedQuestionIds.length) {
    fail(
      `questions export has ${actualQuestionIds.length} rows, expected ${expectedQuestionIds.length} from source + generated questions`,
    );
  }

  actualQuestionIds.forEach((id, index) => {
    const expectedSequentialId = `q${String(index + 1).padStart(3, '0')}`;
    if (id !== expectedSequentialId) {
      fail(`questions export index ${index} has id ${id}, expected ${expectedSequentialId}`);
    }
    if (id !== expectedQuestionIds[index]) {
      fail(`questions export index ${index} is ${id}, expected ${expectedQuestionIds[index]}`);
    }
  });

  if (failures.length === 0) generationParityValidated = true;
}

validateGenerationParity();

function countQuestionsByChapter(questionsToCount) {
  return questionsToCount.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
}

function validateChapterGenerationParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(questions)
  ) {
    return;
  }

  const sourceCounts = countQuestionsByChapter(sourceQuestions);
  const generatedCounts = countQuestionsByChapter(generatedPublishedQuestions);
  const publishedCounts = countQuestionsByChapter(questions);

  chapters.forEach((chapter) => {
    const sourceCount = sourceCounts.get(chapter.id) || 0;
    const generatedCount = generatedCounts.get(chapter.id) || 0;
    const publishedCount = publishedCounts.get(chapter.id) || 0;
    const expectedGeneratedCount = sourceCount * GENERATED_VARIANTS_PER_SOURCE;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (sourceCount < 1) {
      reject(`${chapter.id} has no authored source questions`);
    }
    if (generatedCount !== expectedGeneratedCount) {
      reject(
        `${chapter.id} has ${generatedCount} generated questions, expected ${expectedGeneratedCount} from ${sourceCount} source questions`,
      );
    }
    if (publishedCount !== sourceCount + generatedCount) {
      reject(
        `${chapter.id} has ${publishedCount} published questions, expected ${sourceCount + generatedCount} from source + generated questions`,
      );
    }
    if (chapter.questionCount !== publishedCount) {
      reject(
        `${chapter.id} questionCount is ${chapter.questionCount}, expected ${publishedCount} published questions`,
      );
    }

    if (valid) chapterGenerationParityValidated += 1;
  });
}

validateChapterGenerationParity();

function validateGeneratedSourceMetadataParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );
    if (variants.length !== GENERATED_VARIANTS_PER_SOURCE) {
      fail(
        `${sourceQuestion.id} has ${variants.length} generated variants, expected ${GENERATED_VARIANTS_PER_SOURCE}`,
      );
    }

    variants.forEach((variant, variantIndex) => {
      if (!variant) return;
      let variantIsValid = true;
      const convention = GENERATED_VARIANT_CONVENTIONS[variantIndex];
      const expectedId = `q${String(
        EXPECTED_SOURCE_QUESTIONS + 1 + sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex,
      ).padStart(3, '0')}`;
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;

      function reject(message) {
        variantIsValid = false;
        fail(message);
      }

      if (variant.id !== expectedId)
        reject(`${label} has id ${variant.id}, expected ${expectedId}`);
      if (variant.reviewStatus !== 'published') {
        reject(`${label} reviewStatus is ${variant.reviewStatus}, expected published`);
      }
      if (convention && variant.type !== convention.type) {
        reject(`${label} type is ${variant.type}, expected ${convention.type}`);
      }

      for (const field of ['chapterId', 'difficulty', 'uhrReference']) {
        if (!jsonEqual(variant[field], sourceQuestion[field])) {
          reject(`${label} ${field} does not match source question`);
        }
      }

      if (!Array.isArray(variant.tags)) {
        reject(`${label} tags is not an array`);
      } else {
        const expectedTags = expectedGeneratedTags(sourceQuestion, convention);
        const variantTags = new Set(variant.tags);
        sourceQuestion.tags.forEach((tag) => {
          if (!variantTags.has(tag)) reject(`${label} is missing source tag ${tag}`);
        });
        if (!variantTags.has('published-variant')) {
          reject(`${label} is missing published-variant tag`);
        }
        if (convention && !variantTags.has(convention.tag)) {
          reject(`${label} is missing ${convention.tag} tag`);
        }
        if (!jsonEqual(variant.tags, expectedTags)) {
          reject(`${label} tags do not exactly match generated tag template`);
        } else {
          generatedTagTemplateParityValidated += 1;
        }
      }

      if (variantIsValid) generatedSourceMetadataParityValidated += 1;
    });
  });
}

validateGeneratedSourceMetadataParity();

function validateGeneratedExplanationTemplateParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected = expectedGeneratedExplanation(sourceQuestion, variantIndex);

      if (variant.explanationSv !== expected.explanationSv) {
        variantIsValid = false;
        fail(`${label} explanationSv does not match generated explanation template`);
      }
      if (variant.explanationEn !== expected.explanationEn) {
        variantIsValid = false;
        fail(`${label} explanationEn does not match generated explanation template`);
      }

      const trueFalseExplanationMetaIssue = findGeneratedTrueFalseExplanationMetaIssue(variant);
      if (trueFalseExplanationMetaIssue) {
        variantIsValid = false;
        fail(`${label} explanation uses true/false answer-judgement wording`);
      } else if (variant.type === 'true_false') {
        generatedTrueFalseExplanationMetaValidated += 1;
      }

      if (variantIsValid) generatedExplanationTemplateParityValidated += 1;
    });
  });
}

validateGeneratedExplanationTemplateParity();

function validateGeneratedPromptTemplateParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected = expectedGeneratedPrompt(sourceQuestion, variantIndex);

      if (variant.questionSv !== expected.questionSv) {
        variantIsValid = false;
        fail(`${label} questionSv does not match generated prompt template`);
      }
      if (variant.questionEn !== expected.questionEn) {
        variantIsValid = false;
        fail(`${label} questionEn does not match generated prompt template`);
      }

      if (variantIsValid) generatedPromptTemplateParityValidated += 1;
    });
  });
}

validateGeneratedPromptTemplateParity();

function validateGeneratedAnswerTemplateParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected = expectedGeneratedAnswerShape(sourceQuestion, variantIndex);

      if (!jsonEqual(variant.options, expected.options)) {
        variantIsValid = false;
        fail(`${label} options do not match generated answer template`);
      }
      if (variant.correctOptionId !== expected.correctOptionId) {
        variantIsValid = false;
        fail(`${label} correctOptionId does not match generated answer template`);
      }

      if (variantIsValid) generatedAnswerTemplateParityValidated += 1;

      const sourceMaterialIssue = findGeneratedOptionSourceMaterialIssue(variant);
      if (sourceMaterialIssue) {
        fail(`${label} option[${sourceMaterialIssue.index}] uses source-material fallback wording`);
      } else {
        generatedOptionSourceMaterialWordingValidated += 1;
      }

      const fillerOptionIssue = findGeneratedSingleChoiceFillerOptionIssue(variant);
      if (fillerOptionIssue) {
        fail(
          `${label} option[${fillerOptionIssue.index}] uses generated single-choice filler option "${fillerOptionIssue.text}"`,
        );
      } else {
        generatedSingleChoiceFillerOptionsValidated += 1;
      }

      const singleChoiceMetaStemIssue = findGeneratedSingleChoiceMetaStemIssue(variant);
      if (singleChoiceMetaStemIssue) {
        fail(`${label} uses generated single-choice meta-stem wording`);
      } else {
        generatedSingleChoiceMetaStemsValidated += 1;
      }

      const singleChoiceExplanationLabelIssue =
        findGeneratedSingleChoiceExplanationLabelIssue(variant);
      if (singleChoiceExplanationLabelIssue) {
        fail(`${label} explanation refers to True/False labels absent from the options`);
      } else {
        generatedSingleChoiceExplanationLabelsValidated += 1;
      }
    });
  });
}

validateGeneratedAnswerTemplateParity();

function buildUhrReferenceChapters() {
  validateUhrSourceMetadata();
  if (!Array.isArray(uhrSectionMap?.chapters)) {
    fail('UHR section map chapters is not an array');
    return new Map();
  }

  if (Array.isArray(chapters) && uhrSectionMap.chapters.length !== chapters.length) {
    fail(
      `UHR section map expected ${chapters.length} chapters, found ${uhrSectionMap.chapters.length}`,
    );
  }

  const seenChapterIds = new Set();
  const seenChapterTitles = new Set();
  let previousStartPage = 0;

  const chapterEntries = uhrSectionMap.chapters.map((chapter, index) => {
    const label = chapter.id || `uhr-section-map chapter[${index}]`;
    const nextChapter = uhrSectionMap.chapters[index + 1];
    const nextStartPage = nextChapter?.startPage;
    let valid = true;
    let pageRangeIsValid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    function rejectPageRange(message) {
      pageRangeIsValid = false;
      reject(message);
    }

    if (!hasText(chapter.id)) reject(`uhr-section-map chapter[${index}] missing id`);
    uhrSectionMapChapterExactSchemaKeyFailures(chapter, label).forEach(reject);
    if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
      reject(`${label} has duplicate chapter id`);
    }
    if (hasText(chapter.id)) {
      if (!textIsTrimmedSingleSpaced(chapter.id)) {
        reject(`${label} id must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

    if (!hasText(chapter.chapter)) reject(`${label} missing chapter title`);
    if (hasText(chapter.chapter) && seenChapterTitles.has(chapter.chapter)) {
      reject(`${label} has duplicate chapter title`);
    }
    if (hasText(chapter.chapter)) {
      if (!textIsTrimmedSingleSpaced(chapter.chapter)) {
        reject(`${label} chapter title must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.chapter)) seenChapterTitles.add(chapter.chapter);

    const chapterMetadata = Array.isArray(chapters) ? chapters[index] : undefined;
    if (chapterMetadata) {
      if (chapter.id !== chapterMetadata.id) {
        reject(`${label} id does not match data chapter id ${chapterMetadata.id}`);
      }
      if (chapter.chapter !== chapterMetadata.nameSv) {
        reject(`${label} title does not match data chapter name "${chapterMetadata.nameSv}"`);
      }
    }

    if (!Number.isInteger(chapter.startPage) || chapter.startPage < 1) {
      rejectPageRange(`${label} has invalid startPage`);
    } else if (chapter.startPage <= previousStartPage) {
      rejectPageRange(`${label} startPage must be greater than previous chapter startPage`);
    }
    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      reject(`${label} missing sections`);
    } else {
      const sections = new Set();
      chapter.sections.forEach((section, sectionIndex) => {
        if (!hasText(section)) {
          reject(`${label} section[${sectionIndex}] is blank`);
        }
        if (hasText(section)) {
          if (!textIsTrimmedSingleSpaced(section)) {
            reject(`${label} section[${sectionIndex}] must be trimmed and single-spaced`);
          } else {
            uhrMapTextFieldsNormalizedValidated += 1;
          }
        }
        if (hasText(section) && sections.has(section)) {
          reject(`${label} has duplicate section "${section}"`);
        }
        if (hasText(section)) sections.add(section);
      });
    }

    if (chapter.endPage !== undefined) {
      if (!Number.isInteger(chapter.endPage) || chapter.endPage < chapter.startPage) {
        rejectPageRange(`${label} has invalid endPage`);
      } else if (Number.isInteger(nextStartPage) && chapter.endPage >= nextStartPage) {
        rejectPageRange(`${label} endPage must be before next chapter startPage`);
      }
    } else if (!nextChapter) {
      rejectPageRange(`${label} final chapter must define endPage`);
    } else if (!Number.isInteger(nextStartPage)) {
      rejectPageRange(`${label} cannot derive endPage from next chapter startPage`);
    } else if (Number.isInteger(chapter.startPage) && nextStartPage <= chapter.startPage) {
      rejectPageRange(`${label} next chapter startPage must be after startPage`);
    }

    if (pageRangeIsValid) uhrMapPageRangesValidated += 1;
    if (Number.isInteger(chapter.startPage)) previousStartPage = chapter.startPage;
    if (valid) {
      uhrMapChaptersValidated += 1;
      if (uhrSectionMapChapterExactSchemaKeyFailures(chapter, label).length === 0) {
        uhrMapChapterExactSchemaKeysValidated += 1;
      }
      uhrMapSectionsValidated += chapter.sections.length;
    }

    return {
      ...chapter,
      endPage:
        chapter.endPage ??
        (Number.isInteger(nextStartPage) ? nextStartPage - 1 : Number.POSITIVE_INFINITY),
      sections: new Set(chapter.sections || []),
    };
  });

  return new Map(chapterEntries.map((chapter) => [chapter.chapter, chapter]));
}

function validateUhrSourceMetadata() {
  const source = uhrSectionMap?.source;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!source || typeof source !== 'object') {
    reject('UHR section map missing source metadata');
  } else {
    uhrSectionMapSourceExactSchemaKeyFailures(source, 'UHR section map source').forEach(reject);
    if (!hasText(source.title) || !source.title.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
      reject(`UHR section map source title must reference ${EXPECTED_UHR_SOURCE.titleKeyword}`);
    }
    if (source.publisher !== EXPECTED_UHR_SOURCE.publisher) {
      reject(`UHR section map source publisher must be ${EXPECTED_UHR_SOURCE.publisher}`);
    }
    if (source.url !== EXPECTED_UHR_SOURCE.url) {
      reject(`UHR section map source URL must be ${EXPECTED_UHR_SOURCE.url}`);
    }
    if (!isIsoDate(source.retrievedDate)) {
      reject('UHR section map source retrievedDate must use YYYY-MM-DD');
    } else {
      const retrievedDate = new Date(`${source.retrievedDate}T00:00:00Z`);
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (retrievedDate > today) {
        reject('UHR section map source retrievedDate must not be in the future');
      } else {
        uhrSourceRetrievedDateValidated = true;
      }
    }
    for (const field of ['title', 'publisher', 'url', 'retrievedDate']) {
      if (hasText(source[field])) {
        if (!textIsTrimmedSingleSpaced(source[field])) {
          reject(`UHR section map source ${field} must be trimmed and single-spaced`);
        } else {
          uhrMapTextFieldsNormalizedValidated += 1;
        }
      }
    }
  }

  if (valid) {
    uhrSourceMetadataValidated = true;
    if (uhrSectionMapSourceExactSchemaKeyFailures(source, 'UHR section map source').length === 0) {
      uhrMapSourceExactSchemaKeysValidated = true;
    }
  }
}

function validateUhrSectionMapExactSchemaKeys() {
  const failures = uhrSectionMapExactSchemaKeyFailures(uhrSectionMap, 'UHR section map');
  failures.forEach(fail);
  if (failures.length === 0) uhrMapExactSchemaKeysValidated = true;
}

function validateUhrSourceMaterialLinkParity() {
  let valid = true;
  let sourcesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    sourcesRoute = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  } catch (error) {
    reject(`app/sources.tsx could not be read: ${error.message}`);
    return;
  }

  const routeMaterialUrl = extractStringConstantFromTs(sourcesRoute, 'UHR_EDUCATION_MATERIAL_URL');
  if (routeMaterialUrl !== EXPECTED_UHR_EDUCATION_MATERIAL_URL) {
    reject(
      `app/sources.tsx UHR_EDUCATION_MATERIAL_URL must be ${EXPECTED_UHR_EDUCATION_MATERIAL_URL}`,
    );
  }

  if (!isHttpsUrl(routeMaterialUrl)) {
    reject('app/sources.tsx UHR education material URL must be HTTPS');
  }

  const mapSourceUrl = uhrSectionMap?.source?.url;
  if (!isHttpsUrl(mapSourceUrl)) {
    reject('UHR section map source URL must be HTTPS');
  } else {
    const mapSource = new URL(mapSourceUrl);
    const expectedMaterialPath = new URL(EXPECTED_UHR_EDUCATION_MATERIAL_URL).pathname;
    if (mapSource.hostname !== 'www.uhr.se' || !mapSource.pathname.includes(expectedMaterialPath)) {
      reject('UHR section map source URL must be under the UHR education material path');
    }
  }

  if (!sourcesRoute.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
    reject(`app/sources.tsx must mention ${EXPECTED_UHR_SOURCE.titleKeyword}`);
  }
  if (!sourcesRoute.includes('content/uhr-section-map.json')) {
    reject('app/sources.tsx must mention content/uhr-section-map.json');
  }
  if (!sourcesRoute.includes('content/question-bank.csv')) {
    reject('app/sources.tsx must mention content/question-bank.csv');
  }
  if (!/<Link[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/.test(sourcesRoute)) {
    reject('app/sources.tsx must render the UHR material URL through an Expo Link');
  }
  if (!sourcesRoute.includes('accessibilityLabel={copy.openEducationMaterialAccessibilityLabel}')) {
    reject('app/sources.tsx UHR material link needs the localized accessibility label');
  }
  if (
    !sourcesRoute.includes(
      "openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial'",
    ) ||
    !sourcesRoute.includes("openEducationMaterialAccessibilityLabel: 'Open UHR education material'")
  ) {
    reject('app/sources.tsx UHR material link needs Swedish and English accessibility labels');
  }

  if (valid) uhrSourceMaterialLinkParityValidated = true;
}

validateUhrSectionMapExactSchemaKeys();
const uhrReferenceChapters = buildUhrReferenceChapters();

if (Array.isArray(chapters)) {
  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  const seenChapterIds = new Set();
  const seenNamesSv = new Set();
  const seenNamesEn = new Set();
  chapters.forEach((chapter, index) => {
    if (validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn)) {
      chapterSchemasValidated += 1;
      if (chapterExactSchemaKeyFailures(chapter, chapter.id || `chapter[${index}]`).length === 0) {
        chapterExactSchemaKeysValidated += 1;
      }
      if (chapterTextFieldsAreNormalized(chapter)) {
        chapterTextFieldsNormalizedValidated += 1;
      }
    }
  });
}

if (Array.isArray(questions)) {
  if (questions.length !== EXPECTED_PUBLISHED_QUESTIONS) {
    fail(`expected ${EXPECTED_PUBLISHED_QUESTIONS} questions, found ${questions.length}`);
  }
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);
  const promptTexts = {
    questionSv: new Map(),
    questionEn: new Map(),
  };
  const questionIds = new Set();
  const counts = questions.reduce((acc, question) => {
    acc[question.chapterId] = (acc[question.chapterId] || 0) + 1;
    return acc;
  }, {});

  for (const chapterId of chapterIds) {
    if (!counts[chapterId]) fail(`expected at least 1 question for ${chapterId}`);
  }
  if (Array.isArray(chapters)) {
    chapters.forEach((chapter) => {
      const actualCount = counts[chapter.id] || 0;
      if (chapter.questionCount !== actualCount) {
        fail(
          `${chapter.id} questionCount is ${chapter.questionCount}, expected ${actualCount} from questions`,
        );
      }
    });
  }
  if ((counts.ch01 || 0) < 10)
    fail(`expected at least 10 ch01 questions, found ${counts.ch01 || 0}`);
  if ((counts.ch02 || 0) < 10)
    fail(`expected at least 10 ch02 questions, found ${counts.ch02 || 0}`);

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIdSequenceIsValid = true;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    if (question.id !== expectedId) {
      questionIdSequenceIsValid = false;
      fail(`${label} expected sequential id ${expectedId}`);
    }
    if (questionIds.has(question.id)) {
      questionIdSequenceIsValid = false;
      fail(`duplicate question id ${question.id}`);
    }
    if (hasText(question.id)) questionIds.add(question.id);
    if (questionIdSequenceIsValid) questionIdSequencesValidated += 1;

    if (chapterIds.size && !chapterIds.has(question.chapterId)) {
      fail(`${label} references unknown chapter ${question.chapterId}`);
    }

    let promptTextIsUnique = true;
    for (const field of Object.keys(promptTexts)) {
      const text = normalizeOptionText(question[field]);
      if (!text) {
        promptTextIsUnique = false;
        continue;
      }
      const previousQuestionId = promptTexts[field].get(text);
      if (previousQuestionId) {
        promptTextIsUnique = false;
        fail(`${label} duplicates ${field} text from ${previousQuestionId}`);
      } else {
        promptTexts[field].set(text, label);
      }
    }

    const questionSchemaIsValid = validateQuestionSchema(question, index);
    if (questionSchemaIsValid) {
      questionSchemasValidated += 1;
      if (PUBLISHED_QUESTION_TYPES.has(question.type)) {
        publishedQuestionTypesValidated += 1;
      } else {
        fail(`${label} published question type ${question.type} is not quiz-answerable`);
      }
      if (promptTextIsUnique) {
        questionPromptTextUniquenessValidated += 1;
      }
      if (bilingualTextPairsAreDistinct(question)) {
        questionBilingualTextPairsValidated += 1;
      }
      if (optionBilingualTextPairsAreValid(question)) {
        questionOptionBilingualTextPairsValidated += 1;
      }
      if (questionExactSchemaKeyFailures(question, label).length === 0) {
        questionExactSchemaKeysValidated += 1;
      }
      if (questionTextFieldsAreNormalized(question)) {
        questionTextFieldsNormalizedValidated += 1;
      }
      if (questionSentenceEndingsAreComplete(question)) {
        questionSentenceEndingsValidated += 1;
      }
      const authorityOverclaim = findQuestionAuthorityOverclaim(question);
      const stemSourceAuthorityReference = findQuestionStemSourceAuthorityReference(question);
      const nestedMetaStem = findQuestionNestedMetaStem(question);
      const judgementMetaStem = findQuestionJudgementMetaStem(question);
      const generatedTrueFalseNaturalnessIssue =
        findQuestionGeneratedTrueFalseNaturalnessIssue(question);
      const trueFalseStemPrefix = findQuestionTrueFalseStemPrefix(question);
      const falseAnswerExplanationMismatch = findQuestionFalseAnswerExplanationMismatch(question);
      const generatedTrueFalseExplanationMetaIssue =
        findGeneratedTrueFalseExplanationMetaIssue(question);
      if (authorityOverclaim) {
        fail(`${label} appears to overclaim official status or exam certainty`);
      } else if (stemSourceAuthorityReference) {
        fail(`${label} carries source-authority wording in the stem`);
      } else {
        questionAuthorityBoundaryTextValidated += 1;
      }
      if (nestedMetaStem) {
        fail(`${label} contains a generated true/false meta-stem instead of a civic statement`);
      } else {
        questionNestedMetaStemsValidated += 1;
      }
      if (judgementMetaStem) {
        fail(`${label} contains a generated judgement meta-stem instead of a civic-study prompt`);
      } else {
        questionJudgementMetaStemsValidated += 1;
      }
      if (generatedTrueFalseNaturalnessIssue) {
        fail(`${label} contains a generated true/false grammar-splice stem`);
      } else {
        questionGeneratedTrueFalseNaturalnessValidated += 1;
      }
      if (trueFalseStemPrefix) {
        fail(`${label} contains a redundant true/false prefix in the stem`);
      }
      if (falseAnswerExplanationMismatch) {
        fail(`${label} contains a false-answer explanation that says True is correct`);
      } else {
        questionFalseAnswerExplanationsValidated += 1;
      }
      if (generatedTrueFalseExplanationMetaIssue) {
        fail(`${label} contains a generated true/false explanation meta-judgement`);
      }
      if (findDuplicateOptionTextLabels(question).length === 0) {
        questionOptionTextLabelsValidated += 1;
      }
      if (optionCountMatchesQuestionType(question)) {
        questionTypeOptionCountsValidated += 1;
      }
      if (optionIdsMatchQuestionType(question)) {
        questionOptionIdConventionsValidated += 1;
      }
      if (question.type === 'true_false') {
        trueFalseQuestions += 1;
        if (trueFalseOptionLabelsMatchConvention(question)) {
          trueFalseOptionLabelsValidated += 1;
        }
      }
      if (question.tags.every(isSlugTag)) {
        questionTagsValidated += 1;
      }
    }

    if (
      !question.uhrReference?.chapter ||
      !question.uhrReference?.section ||
      !question.uhrReference?.pageApprox
    ) {
      fail(`${label} has incomplete UHR reference`);
    } else {
      const uhrChapter = uhrReferenceChapters.get(question.uhrReference.chapter);
      if (!uhrChapter) {
        fail(`${label} UHR chapter "${question.uhrReference.chapter}" is not in section map`);
      } else {
        let referenceIsValid = true;
        if (question.chapterId !== uhrChapter.id) {
          fail(
            `${label} chapterId ${question.chapterId} does not match UHR chapter "${question.uhrReference.chapter}" (${uhrChapter.id})`,
          );
        } else {
          questionChapterReferenceParityValidated += 1;
        }
        if (!uhrChapter.sections.has(question.uhrReference.section)) {
          fail(
            `${label} UHR section "${question.uhrReference.section}" is not listed for "${question.uhrReference.chapter}"`,
          );
          referenceIsValid = false;
        }
        if (
          !Number.isInteger(question.uhrReference.pageApprox) ||
          question.uhrReference.pageApprox < uhrChapter.startPage ||
          question.uhrReference.pageApprox > uhrChapter.endPage
        ) {
          referenceIsValid = false;
          const pageRange =
            uhrChapter.endPage === Number.POSITIVE_INFINITY
              ? `${uhrChapter.startPage}+`
              : `${uhrChapter.startPage}-${uhrChapter.endPage}`;
          fail(
            `${label} UHR page ${question.uhrReference.pageApprox} is outside "${question.uhrReference.chapter}" page range ${pageRange}`,
          );
        }
        if (referenceIsValid) uhrReferencesValidated += 1;
      }
    }
    if (question.reviewStatus !== 'published')
      fail(`${label} reviewStatus is ${question.reviewStatus}`);
  });
}

validateMockExamConfig(
  defaultMockExamConfig,
  Array.isArray(questions)
    ? questions.filter((question) => question.reviewStatus === 'published').length
    : 0,
);
validateAppConfigSchema();
validateLaunchAdRouteSuppressionParity();
validateTabNavigationParity();
validateAdPlacementRouteParity();
validateReleaseMonetizationPolicyParity();
validateRemoveAdsEntitlementHookParity();
validatePremiumEntitlementParity();
validateQuestionDisclaimerParity();
validateMockExamConfigTypeSchemaParity();
validateMockExamRuntimeParity(defaultMockExamConfig);
validateMockExamTimerParity(defaultMockExamConfig);
validateExamSubmissionFinalityParity();
validateExamRouteHeaderParity();
validateExamRouteCopyParity();
validateQuizRouteHeaderParity();
validateQuizRouteCopyParity();
validatePracticeRouteHeaderParity();
validatePracticeRouteCopyParity();
validateChapterRouteHeaderParity();
validateChapterRouteCopyParity();
validateLearnRouteHeaderParity();
validateLearnRouteLinkCopyParity();
validateProfileRouteHeaderParity();
validateProfileRouteCopyParity();
validateHomeRouteHeaderParity();
validateHomeRouteCopyParity();
validateMistakesRouteHeaderParity();
validateMistakesRouteCopyParity();
validateLegalRouteHeaderParity();
validateSettingsRouteHeaderParity();
validateSettingsRouteCopyParity();
validateOnboardingRouteHeaderParity();
validateOnboardingRouteCopyParity();
validateScreenShellLayoutParity();
validateSettingsRouteScrollParity();
validateOnboardingRouteScrollParity();
validateLegalRouteScrollParity();
validateButtonAccessibilityParity();
validateCardAccessibilityParity();
validateProgressBarAccessibilityParity();
validateMetricCardAccessibilityParity();
validateBadgeAccessibilityParity();
validateChapterCardAccessibilityParity();
validateFlashcardAccessibilityParity();
validateAudioButtonAccessibilityParity();
validateQuestionCardAccessibilityParity();
validateAnswerOptionAccessibilityParity();
validateExplanationPanelAccessibilityParity();
validateUhrReferenceCardAccessibilityParity();
validateCelebrationBurstAccessibilityParity();
validateExamReviewSourceParity(defaultMockExamConfig);
validateExamChapterBreakdownParity(defaultMockExamConfig);
validateExamGeneratorTypeSchemaParity();
validateContentTypeSchemaParity();
validateMonetizationTypeSchemaParity();
validatePurchaseTypeSchemaParity();
validateRemoveAdsPurchaseRuntimeParity();
validateAdConsentTypeSchemaParity();
validateMobileAdsConsentTypeSchemaParity();
validateMobileAdsConsentHookParity();
validateRewardedAdTypeSchemaParity();
validateMockExamAccessTypeSchemaParity();
validateThemeTokenSchema();
validateGlossaryTerms();
validateUxBenchmarks();
validateLocalizationLanguageContract();
validateSettingsStoreSchemaParity();
validateSettingsDailyGoalParity();
validateSettingsAudioParity();
validateProgressQuestionSchemaParity();
validateProgressTypeSchemaParity();
validateProgressStoreSchemaParity();
validateBadgeCatalog();
validatePracticeScoringRules();
validatePracticeFlowParity();
validatePracticeSessionStoreParity();
validateAnswerValidationTypeSchemaParity();
validateAnswerFeedbackParity();
validateAnswerShuffleDistributionParity();
validateQuestionSpeechTextParity();
validateSpeechRuntimeParity();
validateChapterQuizSessionParity();
validateSpacedRepetitionSchedule();
validateStreakRules();
validateXpRules();
validateMasteryRules();
validateQuestionBankCsvContract();
validateStaticSiteQuestionBankParity();
validateUhrSourceMaterialLinkParity();

if (failures.length) {
  console.error('Content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const publishedQuestions = Array.isArray(questions)
  ? questions.filter((question) => question.reviewStatus === 'published').length
  : 0;

console.log('Content validation OK');
console.log(
  JSON.stringify(
    {
      chapters: chapters.length,
      chapterSchemasValidated,
      chapterTextFieldsNormalizedValidated,
      chapterExactSchemaKeysValidated,
      appConfigPluginsValidated,
      appConfigSchemaValidated,
      launchAdSuppressedRoutesValidated,
      launchAdRouteSuppressionParityValidated,
      tabNavigationRulesValidated,
      tabNavigationRoutesValidated,
      tabNavigationParityValidated,
      adPlacementRoutesValidated,
      noAdRoutesValidated,
      adPlacementRouteParityValidated,
      releaseMonetizationPolicyFieldsValidated,
      releaseMonetizationPolicyParityValidated,
      removeAdsEntitlementHookCasesValidated,
      removeAdsEntitlementHookParityValidated,
      premiumEntitlementStatesValidated,
      premiumEntitlementParityValidated,
      questionDisclaimerRoutesValidated,
      questionDisclaimerCopyValidated,
      mockExamConfigTypeFieldsValidated,
      mockExamConfigTypeSchemaParityValidated,
      mockExamConfigExactSchemaKeysValidated,
      mockExamConfigValidated,
      mockExamRuntimeParityValidated,
      mockExamChapterBalanceParityValidated,
      mockExamTimerParityValidated,
      examSubmissionFinalityParityValidated,
      examRouteHeadersValidated,
      examRouteHeaderParityValidated,
      examRouteCopyLabelsValidated,
      examRouteCopyParityValidated,
      quizRouteHeadersValidated,
      quizRouteHeaderParityValidated,
      quizRouteCopyLabelsValidated,
      quizRouteCopyParityValidated,
      practiceRouteHeadersValidated,
      practiceRouteHeaderParityValidated,
      practiceRouteCopyLabelsValidated,
      practiceRouteCopyParityValidated,
      chapterRouteHeadersValidated,
      chapterRouteHeaderParityValidated,
      chapterRouteCopyLabelsValidated,
      chapterRouteCopyParityValidated,
      learnRouteHeadersValidated,
      learnRouteHeaderParityValidated,
      learnRouteLinkCopyLabelsValidated,
      learnRouteLinkCopyParityValidated,
      profileRouteHeadersValidated,
      profileRouteHeaderParityValidated,
      profileRouteCopyLabelsValidated,
      profileRouteCopyParityValidated,
      homeRouteHeadersValidated,
      homeRouteHeaderParityValidated,
      homeRouteCopyLabelsValidated,
      homeRouteCopyParityValidated,
      mistakesRouteHeadersValidated,
      mistakesRouteHeaderParityValidated,
      mistakesRouteCopyLabelsValidated,
      mistakesRouteCopyParityValidated,
      legalRouteHeadersValidated,
      legalRouteHeaderParityValidated,
      settingsRouteHeadersValidated,
      settingsRouteHeaderParityValidated,
      settingsRouteCopyLabelsValidated,
      settingsRouteCopyParityValidated,
      onboardingRouteHeadersValidated,
      onboardingRouteHeaderParityValidated,
      onboardingRouteCopyLabelsValidated,
      onboardingRouteCopyParityValidated,
      screenShellLayoutRulesValidated,
      screenShellLayoutParityValidated,
      settingsRouteScrollRulesValidated,
      settingsRouteScrollParityValidated,
      onboardingRouteScrollRulesValidated,
      onboardingRouteScrollParityValidated,
      legalRouteScrollRulesValidated,
      legalRouteScrollParityValidated,
      buttonAccessibilityRulesValidated,
      buttonAccessibilityParityValidated,
      cardAccessibilityRulesValidated,
      cardAccessibilityParityValidated,
      progressBarAccessibilityRulesValidated,
      progressBarAccessibilityParityValidated,
      metricCardAccessibilityRulesValidated,
      metricCardAccessibilityParityValidated,
      badgeAccessibilityRulesValidated,
      badgeAccessibilityParityValidated,
      chapterCardAccessibilityRulesValidated,
      chapterCardAccessibilityParityValidated,
      flashcardAccessibilityRulesValidated,
      flashcardAccessibilityParityValidated,
      audioButtonAccessibilityRulesValidated,
      audioButtonAccessibilityParityValidated,
      questionCardAccessibilityRulesValidated,
      questionCardAccessibilityParityValidated,
      answerOptionAccessibilityRulesValidated,
      answerOptionAccessibilityParityValidated,
      explanationPanelAccessibilityRulesValidated,
      explanationPanelAccessibilityParityValidated,
      uhrReferenceCardAccessibilityRulesValidated,
      uhrReferenceCardAccessibilityParityValidated,
      celebrationBurstAccessibilityRulesValidated,
      celebrationBurstAccessibilityParityValidated,
      examReviewItemsValidated,
      examReviewSourceParityValidated,
      examChapterBreakdownItemsValidated,
      examChapterBreakdownParityValidated,
      examGeneratorTypeAliasesValidated,
      examGeneratorTypeInterfacesValidated,
      examGeneratorTypeSchemaParityValidated,
      contentTypeUnionsValidated,
      contentTypeInterfacesValidated,
      contentTypeSchemaParityValidated,
      monetizationTypeUnionsValidated,
      monetizationTypeInterfacesValidated,
      monetizationTypeSchemaParityValidated,
      purchaseTypeUnionsValidated,
      purchaseTypeInterfacesValidated,
      purchaseTypeSchemaParityValidated,
      removeAdsPurchaseRuntimeCasesValidated,
      removeAdsPurchaseRuntimeParityValidated,
      adConsentTypeUnionsValidated,
      adConsentTypeInterfacesValidated,
      adConsentTypeSchemaParityValidated,
      mobileAdsConsentTypeInterfacesValidated,
      mobileAdsConsentTypeSchemaParityValidated,
      mobileAdsConsentHookCasesValidated,
      mobileAdsConsentHookParityValidated,
      rewardedAdTypeUnionsValidated,
      rewardedAdTypeInterfacesValidated,
      rewardedAdTypeSchemaParityValidated,
      mockExamAccessTypeUnionsValidated,
      mockExamAccessTypeInterfacesValidated,
      mockExamAccessTypeSchemaParityValidated,
      themeColorTokensValidated,
      themeSpaceTokensValidated,
      themeRadiusTokensValidated,
      themeTypographyTokensValidated,
      themeShadowTokensValidated,
      themeMotionTokensValidated,
      themeTokenSchemaValidated,
      glossaryTerms: Array.isArray(glossaryTerms) ? glossaryTerms.length : 0,
      glossaryTermsValidated,
      glossaryTermExactSchemaKeysValidated,
      uxBenchmarksValidated,
      supportedLanguagesValidated,
      localizationStrings:
        localizationStrings &&
        typeof localizationStrings === 'object' &&
        !Array.isArray(localizationStrings)
          ? Object.keys(localizationStrings).length
          : 0,
      localizationStringsValidated,
      languageSettingsParityValidated,
      settingsStoreFieldsValidated,
      settingsStoreSchemaParityValidated,
      settingsDailyGoalOptionsValidated,
      settingsDailyGoalParityValidated,
      settingsAudioLabelsValidated,
      settingsAudioParityValidated,
      progressQuestionFieldsValidated,
      progressQuestionSchemaParityValidated,
      progressTypeUnionsValidated,
      progressTypeInterfacesValidated,
      progressTypeSchemaParityValidated,
      progressStoreFieldsValidated,
      progressStoreSchemaParityValidated,
      badgesValidated,
      badgeMilestoneParityValidated,
      practiceScoringRulesValidated,
      practiceScoringRulesParityValidated,
      practiceFlowCasesValidated,
      practiceFlowParityValidated,
      practiceSessionStoreFieldsValidated,
      practiceSessionStoreSchemaParityValidated,
      practiceSessionStoreRuntimeParityValidated,
      answerValidationTypeUnionsValidated,
      answerValidationTypeInterfacesValidated,
      answerValidationTypeSchemaParityValidated,
      answerFeedbackQuestionsValidated,
      answerFeedbackOptionsValidated,
      answerFeedbackRuntimeParityValidated,
      answerShuffleSingleChoiceQuestionsValidated,
      answerShuffleTrueFalseQuestionsValidated,
      answerShuffleSeedDistributionsValidated,
      answerShuffleSessionMovementQuestionsValidated,
      answerShuffleDistributionParityValidated,
      questionSpeechTextQuestionsValidated,
      questionSpeechTextOptionsValidated,
      questionSpeechTextParityValidated,
      speechRuntimeCasesValidated,
      speechRuntimeParityValidated,
      chapterQuizSessionParityValidated,
      spacedRepetitionIntervalsValidated,
      spacedRepetitionRuntimeParityValidated,
      streakRulesValidated,
      streakRulesParityValidated,
      xpRulesValidated,
      xpRulesParityValidated,
      masteryRulesValidated,
      masteryRulesParityValidated,
      questions: questions.length,
      publishedQuestions,
      sourceQuestions: Array.isArray(sourceQuestions) ? sourceQuestions.length : 0,
      generatedPublishedQuestions: Array.isArray(generatedPublishedQuestions)
        ? generatedPublishedQuestions.length
        : 0,
      authoredSourceQuestionsValidated,
      authoredSourcePartitionQuestionsValidated,
      sourcePublicationParityValidated,
      generationParityValidated,
      chapterGenerationParityValidated,
      generatedSourceMetadataParityValidated,
      generatedExplanationTemplateParityValidated,
      generatedPromptTemplateParityValidated,
      generatedAnswerTemplateParityValidated,
      generatedOptionSourceMaterialWordingValidated,
      generatedSingleChoiceFillerOptionsValidated,
      generatedSingleChoiceMetaStemsValidated,
      generatedSingleChoiceExplanationLabelsValidated,
      generatedTrueFalseExplanationMetaValidated,
      generatedTagTemplateParityValidated,
      questionSchemasValidated,
      publishedQuestionTypesValidated,
      questionIdSequencesValidated,
      questionBilingualTextPairsValidated,
      questionOptionBilingualTextPairsValidated,
      questionExactSchemaKeysValidated,
      questionTextFieldsNormalizedValidated,
      questionSentenceEndingsValidated,
      questionAuthorityBoundaryTextValidated,
      questionNestedMetaStemsValidated,
      questionJudgementMetaStemsValidated,
      questionGeneratedTrueFalseNaturalnessValidated,
      questionFalseAnswerExplanationsValidated,
      questionPromptTextUniquenessValidated,
      questionOptionTextLabelsValidated,
      questionTypeOptionCountsValidated,
      questionOptionIdConventionsValidated,
      trueFalseQuestions,
      trueFalseOptionLabelsValidated,
      questionTagsValidated,
      questionBankCsvRowsValidated,
      staticSiteQuestionBankQuestionsValidated,
      staticSiteQuestionBankChaptersValidated,
      staticSiteQuestionBankParityValidated,
      uhrSourceMetadataValidated,
      uhrMapExactSchemaKeysValidated,
      uhrMapChaptersValidated,
      uhrMapSectionsValidated,
      uhrMapSourceExactSchemaKeysValidated,
      uhrMapChapterExactSchemaKeysValidated,
      uhrMapTextFieldsNormalizedValidated,
      uhrMapPageRangesValidated,
      uhrSourceMaterialLinkParityValidated,
      questionChapterReferenceParityValidated,
      uhrSourceRetrievedDateValidated,
      uhrReferencesValidated,
    },
    null,
    2,
  ),
);
