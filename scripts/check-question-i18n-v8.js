#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
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

const localeCodes = loadTs('lib/i18n/locales.ts', 'localeCodes');
const QUESTION_LOCALIZATION_PILOT_IDS = loadTs(
  'data/questionLocalizations.ts',
  'QUESTION_LOCALIZATION_PILOT_IDS',
);
const QUESTION_LOCALIZATION_REVIEW_STATUS = loadTs(
  'data/questionLocalizations.ts',
  'QUESTION_LOCALIZATION_REVIEW_STATUS',
);
const questionLocalizationPilot = loadTs(
  'data/questionLocalizations.ts',
  'questionLocalizationPilot',
);
const REQUIRED_LOCALES = [...localeCodes];
const REQUIRED_REVIEW_LOCALES = REQUIRED_LOCALES.filter((locale) => !['sv', 'en'].includes(locale));

const PROTECTED_TERM_RULES = [
  { source: /\bRiksdagen?\b/, canonical: 'Riksdag' },
  { source: /\bSkatteverket\b/, canonical: 'Skatteverket' },
  { source: /\bMigrationsverket\b/, canonical: 'Migrationsverket' },
  { source: /\bAllemansrätten\b/, canonical: 'Allemansrätten' },
  { source: /\bSverige i fokus\b/, canonical: 'Sverige i fokus' },
  { source: /\bTreriksröset\b/, canonical: 'Treriksröset' },
  { source: /\bSmygehuk\b/, canonical: 'Smygehuk' },
  { source: /\bKebnekaise\b/, canonical: 'Kebnekaise' },
];

const TRUE_FALSE_LABELS = {
  true: {
    sv: 'Sant',
    en: 'True',
    'zh-Hant': '正確',
    'zh-Hans': '正确',
    ar: 'صحيح',
    ckb: 'ڕاستە',
    fa: 'درست',
    pl: 'Prawda',
    so: 'Sax',
    ti: 'ትኽክል',
    tr: 'Doğru',
    uk: 'Правда',
  },
  false: {
    sv: 'Falskt',
    en: 'False',
    'zh-Hant': '錯誤',
    'zh-Hans': '错误',
    ar: 'خطأ',
    ckb: 'هەڵەیە',
    fa: 'نادرست',
    pl: 'Fałsz',
    so: 'Khalad',
    ti: 'ጌጋ',
    tr: 'Yanlış',
    uk: 'Неправда',
  },
};

const SOMALI_GEOGRAPHY_NATURALNESS_IDS = ['q004', 'q006', 'q008'];
const SOMALI_ENGLISH_GEOGRAPHY_TERM_PATTERN = /\b(?:Mediterranean|Baltic|Atlantic|Gulf Stream)\b/;
const SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS = ['q099', 'q101', 'q125', 'q131', 'q135', 'q141'];
const SOMALI_HOLIDAY_FOOD_ENGLISH_TOKEN_PATTERN = /\b(?:herring|strawberries|Easter)\b/i;
const Q062_PUBLIC_SECTOR_NATURALNESS_IDS = ['q062'];
const Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS = ['q166', 'q169'];
const Q062_PUBLIC_SECTOR_REQUIREMENTS = {
  en: {
    question: ['public sector'],
    option: ['services and activities', 'state', 'regions', 'municipalities', 'fund through taxes'],
    explanation: [
      'services and activities',
      'state',
      'regions',
      'municipalities',
      'fund through taxes',
    ],
  },
  'zh-Hant': {
    question: ['服務', '活動'],
    option: ['服務', '活動', '稅收'],
    explanation: ['服務', '活動', '稅收'],
  },
  'zh-Hans': {
    question: ['服务', '活动'],
    option: ['服务', '活动', '税收'],
    explanation: ['服务', '活动', '税收'],
  },
  ar: {
    question: ['الخدمات', 'الأنشطة'],
    option: ['الخدمات', 'الأنشطة', 'الضرائب'],
    explanation: ['الخدمات', 'الأنشطة', 'الضرائب'],
  },
  ckb: {
    question: ['خزمەتگوزاری', 'چالاکی'],
    option: ['خزمەتگوزاری', 'چالاکی', 'باج'],
    explanation: ['خزمەتگوزاری', 'چالاکی', 'باج'],
  },
  fa: {
    question: ['خدمات', 'فعالیت'],
    option: ['خدمات', 'فعالیت', 'مالیات'],
    explanation: ['خدمات', 'فعالیت', 'مالیات'],
  },
  pl: {
    question: ['usługi', 'działania'],
    option: ['usługi', 'działania', 'podatków'],
    explanation: ['usługi', 'działania', 'podatków'],
  },
  so: {
    question: ['adeegyo', 'hawlo'],
    option: ['adeegyo', 'hawlo', 'canshuur'],
    explanation: ['adeegyo', 'hawlo', 'canshuur'],
  },
  ti: {
    question: ['ኣገልግሎታት', 'ንጥፈታት'],
    option: ['ኣገልግሎታት', 'ንጥፈታት', 'ግብሪ'],
    explanation: ['ኣገልግሎታት', 'ንጥፈታት', 'ግብሪ'],
  },
  tr: {
    question: ['hizmet', 'faaliyet'],
    option: ['hizmet', 'faaliyet', 'vergiler'],
    explanation: ['hizmet', 'faaliyet', 'vergiler'],
  },
  uk: {
    question: ['послуги', 'діяльності'],
    option: ['послуги', 'діяльності', 'податків'],
    explanation: ['послуги', 'діяльності', 'податків'],
  },
};
const Q062_PUBLIC_SECTOR_STALE_PATTERNS = {
  question:
    /\bWhat is meant by the public sector in Sweden\b|公共部[門门][」”]?是什麼意思|ما المقصود بالقطاع العام|مەبەست لە کەرتی گشتی|منظور از بخش عمومی|Co oznacza sektor publiczny|Maxaa loola jeedaa qaybta dadweynaha|ህዝባዊ ዘፈር ማለት|kamu sektörü ne anlama gelir|Що означає державний сектор/i,
  option:
    /\bActivities for which the state, regions, and municipalities are responsible\b|由[國国]家、[區区]域和市[鎮镇]負責的活動|أنشطة تكون الدولة|ئەو چالاکیانەی دەوڵەت|^فعالیت‌هایی که دولت، مناطق و شهرداری‌ها مسئول آن‌ها هستند$|^Działania, za które odpowiadają państwo, regiony i gminy$|^Hawlo ay dowladda, gobollada iyo degmooyinku masuul ka yihiin$|ሓላፍነት ዘለዎም ንጥፈታት|^Devletin, bölgelerin ve belediyelerin sorumlu olduğu faaliyetler$|^Діяльність, за яку відповідають держава, регіони та муніципалітети$/i,
  explanation:
    /\bThe public sector means activities for which\b|公共部[門门]是指|القطاع العام هو الأنشطة|کەرتی گشتی بریتییە|بخش عمومی به فعالیت|Sektor publiczny to działania|Qaybta dadweynuhu waa hawlo|ህዝባዊ ዘፈር ማለት|^Kamu sektörü, devletin|Державний сектор — це діяльність/i,
};
const BARE_KOMMUN_REGION_TERM_PATTERN =
  /(^|[^\p{L}\p{N}_])(kommun(?:[-'’][\p{L}\p{N}_]+)?|region(?:[-'’][\p{L}\p{N}_]+)?)(?=$|[^\p{L}\p{N}_])/giu;
const Q050_SOURCE_CRITICISM_NATURALNESS_IDS = ['q050'];
const Q050_SOURCE_CRITICISM_REQUIRED_TERMS = {
  'zh-Hant': ['來源批判'],
  'zh-Hans': ['来源批判'],
  ar: ['نقد المصادر'],
  ckb: ['ڕەخنەی سەرچاوە'],
  fa: ['نقد منبع'],
  pl: ['krytyka źródeł'],
  so: ['qiimeynta ilaha'],
  ti: ['ናይ ምንጪ ነቐፌታ'],
  tr: ['kaynak eleştirisi'],
  uk: ['критика джерел'],
};
const Q050_SOURCE_CRITICISM_STALE_PATTERNS = {
  question:
    /具有(?:來|来)源批判意識|أن تكون ناقدًا للمصادر|سەرچاوە-ڕەخنەیی|منبع‌سنج بودن|krytyczne podejście do źródeł|si naqdineed loo eego ilaha|ንምንጭታት ብነቐፌታዊ መንገዲ ምርኣይ|kaynaklara eleştirel yaklaşmak|критично ставитися до джерел/i,
  explanation:
    /具有(?:來|来)源批判意識表示|أن تكون ناقدًا للمصادر يعني|سەرچاوە-ڕەخنەیی بوون واتە|منبع‌سنج بودن یعنی|krytyczne podejście do źródeł oznacza|si naqdineed loo eego ilaha macluumaadka|ንምንጭታት ብነቐፌታዊ መንገዲ ምርኣይ ማለት|kaynaklara eleştirel yaklaşmak,|критично ставитися до джерел означає/i,
};

function checkLocalizedMap(map, path, errors) {
  for (const locale of REQUIRED_LOCALES) {
    if (!map || typeof map[locale] !== 'string' || map[locale].trim() === '') {
      errors.push(`${path}.${locale} missing`);
    }
  }
}

function checkTargetLocalizedMap(map, path, errors) {
  for (const locale of REQUIRED_REVIEW_LOCALES) {
    if (!map || typeof map[locale] !== 'string' || map[locale].trim() === '') {
      errors.push(`${path}.${locale} missing`);
    }
  }
}

function questionSourceText(question) {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ]
    .filter(Boolean)
    .join(' ');
}

function questionLocalizedText(question) {
  return [
    question.questionText,
    question.explanationText,
    ...(question.options || []).map((option) => option.text),
  ]
    .filter(Boolean)
    .flatMap((map) => REQUIRED_REVIEW_LOCALES.map((locale) => map[locale] || ''))
    .join(' ');
}

function normalizeLocalizedDigits(value) {
  return String(value).replace(/[٠-٩۰-۹]/g, (digit) => {
    const codePoint = digit.codePointAt(0);
    if (codePoint >= 0x0660 && codePoint <= 0x0669) {
      return String(codePoint - 0x0660);
    }
    return String(codePoint - 0x06f0);
  });
}

function isAsciiDigit(char) {
  return char >= '0' && char <= '9';
}

function isSpaceGroupSeparator(char) {
  return char === ' ' || char === '\u00a0' || char === '\u202f';
}

function isPunctuationGroupSeparator(char) {
  return char === ',' || char === '.' || char === '\u066c';
}

function readDigits(text, startIndex) {
  let index = startIndex;
  while (index < text.length && isAsciiDigit(text[index])) index += 1;
  return { digits: text.slice(startIndex, index), nextIndex: index };
}

function readGroupedDigits(text, separatorIndex) {
  const separator = text[separatorIndex];
  let digitStart = separatorIndex + 1;

  if (isPunctuationGroupSeparator(separator)) {
    if (!isAsciiDigit(text[digitStart])) return null;
  } else if (isSpaceGroupSeparator(separator)) {
    while (digitStart < text.length && isSpaceGroupSeparator(text[digitStart])) {
      digitStart += 1;
    }
  } else {
    return null;
  }

  const groupEnd = digitStart + 3;
  if (groupEnd > text.length) return null;
  const group = text.slice(digitStart, groupEnd);
  if (!/^\d{3}$/.test(group)) return null;
  if (isAsciiDigit(text[groupEnd])) return null;

  return { digits: group, nextIndex: groupEnd };
}

function isDecimalToken(text, startIndex, firstGroupEnd) {
  const previous = text[startIndex - 1];
  const previousPrevious = text[startIndex - 2];
  if ((previous === ',' || previous === '.') && isAsciiDigit(previousPrevious)) return true;

  const separator = text[firstGroupEnd];
  if (separator !== ',' && separator !== '.') return false;
  if (!isAsciiDigit(text[firstGroupEnd + 1])) return false;
  return !readGroupedDigits(text, firstGroupEnd);
}

function sourceTokenCanShiftByLocale(text, tokenEndIndex) {
  const tail = text.slice(tokenEndIndex);
  const trimmedTail = tail.trimStart().toLowerCase();

  if (trimmedTail.startsWith('-talet') || trimmedTail.startsWith('-talets')) return true;
  if (/^(s|st|nd|rd|th)\b/.test(trimmedTail)) return true;
  if (/^(million|miljon|miljoner)\b/.test(trimmedTail)) return true;
  if (
    /^(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(
      trimmedTail,
    )
  ) {
    return true;
  }
  if (
    /^(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/.test(
      trimmedTail,
    )
  ) {
    return true;
  }

  return false;
}

function scaledNumericFact(text, tokenEndIndex, token) {
  const trimmedTail = text.slice(tokenEndIndex).trimStart().toLowerCase();
  if (/^(thousand|tusen)\b/.test(trimmedTail) || /^(ألف|الف|هزار|هەزار)/.test(trimmedTail)) {
    return String(Number(token) * 1000);
  }
  if (/^(万|萬)/.test(trimmedTail)) {
    return String(Number(token) * 10000);
  }
  return null;
}

function extractNumericFacts(text, options = {}) {
  const normalizedText = normalizeLocalizedDigits(text || '');
  const facts = new Set();

  for (let index = 0; index < normalizedText.length; index += 1) {
    if (!isAsciiDigit(normalizedText[index])) continue;

    const firstGroup = readDigits(normalizedText, index);
    const isDecimal = isDecimalToken(normalizedText, index, firstGroup.nextIndex);
    let token = firstGroup.digits;
    let nextIndex = firstGroup.nextIndex;

    while (nextIndex < normalizedText.length) {
      const groupedDigits = readGroupedDigits(normalizedText, nextIndex);
      if (!groupedDigits) break;
      token += groupedDigits.digits;
      nextIndex = groupedDigits.nextIndex;
    }

    if (!isDecimal && !(options.source && sourceTokenCanShiftByLocale(normalizedText, nextIndex))) {
      facts.add(token);
      if (options.includeScaledFacts) {
        const scaledFact = scaledNumericFact(normalizedText, nextIndex, token);
        if (scaledFact) facts.add(scaledFact);
      }
    }
    index = nextIndex - 1;
  }

  return facts;
}

function extractSourceNumericFacts(values) {
  const facts = new Set();
  for (const value of values.filter(Boolean)) {
    for (const fact of extractNumericFacts(value, { source: true })) {
      facts.add(fact);
    }
  }
  return facts;
}

function localizedSegmentTextByLocale(map, locale) {
  return map?.[locale] || '';
}

function checkNumericFacts(question, errors) {
  const reported = new Set();
  const segments = [
    {
      source: [question.questionSv, question.questionEn],
      target: question.questionText,
    },
    {
      source: [question.explanationSv, question.explanationEn],
      target: question.explanationText,
    },
    ...(question.options || []).map((option) => ({
      source: [option.textSv, option.textEn],
      target: option.text,
    })),
  ];

  for (const segment of segments) {
    const sourceFacts = extractSourceNumericFacts(segment.source);
    for (const fact of sourceFacts) {
      const isMissingInAnyLocale = REQUIRED_REVIEW_LOCALES.some((locale) => {
        const localizedFacts = extractNumericFacts(
          localizedSegmentTextByLocale(segment.target, locale),
          { includeScaledFacts: true },
        );
        return !localizedFacts.has(fact);
      });

      if (isMissingInAnyLocale && !reported.has(fact)) {
        errors.push(`${question.id}.numericFact.${fact} missing from localized text`);
        reported.add(fact);
      }
    }
  }
}

function checkProtectedTerms(question, errors) {
  const sourceText = questionSourceText(question);
  const localizedText = questionLocalizedText(question);
  for (const { source, canonical } of PROTECTED_TERM_RULES) {
    if (source.test(sourceText) && !localizedText.includes(canonical)) {
      errors.push(`${question.id}.protectedTerm.${canonical} missing from localized text`);
    }
  }
}

function checkTrueFalseLabels(question, errors) {
  if (question.type !== 'true_false') return;

  for (const optionId of ['true', 'false']) {
    const option = (question.options || []).find((candidate) => candidate.id === optionId);
    if (!option) {
      errors.push(`${question.id}.options.${optionId} missing true/false option`);
      continue;
    }
    const localizedText = Object.assign(
      { sv: option.textSv, en: option.textEn },
      option.text || {},
    );
    for (const locale of REQUIRED_LOCALES) {
      const expected = TRUE_FALSE_LABELS[optionId][locale];
      if (localizedText[locale] !== expected) {
        errors.push(`${question.id}.options.${optionId}.text.${locale} must be ${expected}`);
      }
    }
  }
}

function somaliLocalizedSegments(question) {
  return [
    ['questionText.so', question.questionText?.so],
    ['explanationText.so', question.explanationText?.so],
    ...(question.options || []).map((option) => [`options.${option.id}.text.so`, option.text?.so]),
  ];
}

function publicServiceLoanwordSegments(question) {
  const segments = [];

  for (const locale of PUBLIC_SERVICE_LOANWORD_LOCALES) {
    segments.push([`questionText.${locale}`, question.questionText?.[locale]]);
    segments.push([`explanationText.${locale}`, question.explanationText?.[locale]]);

    for (const option of question.options || []) {
      segments.push([`options.${option.id}.text.${locale}`, option.text?.[locale]]);
    }
  }

  return segments;
}

function summarizeSomaliGeographyNaturalness(questions, ids = SOMALI_GEOGRAPHY_NATURALNESS_IDS) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let casesValidated = 0;

  for (const id of ids) {
    const question = questionById.get(id);
    const errorCountBefore = errors.length;

    if (!question) {
      errors.push(`${id}.somaliGeographyNaturalness missing`);
      continue;
    }

    for (const [path, value] of somaliLocalizedSegments(question)) {
      if (typeof value === 'string' && SOMALI_ENGLISH_GEOGRAPHY_TERM_PATTERN.test(value)) {
        errors.push(`${id}.${path} contains English geography term`);
      }
    }

    if (errors.length === errorCountBefore) {
      casesValidated += 1;
    }
  }

  return {
    errors,
    casesValidated,
    expectedCases: ids.length,
    parityValidated: errors.length === 0 && casesValidated === ids.length,
  };
}

function checkSomaliGeographyNaturalness(questions, ids = SOMALI_GEOGRAPHY_NATURALNESS_IDS) {
  const { errors } = summarizeSomaliGeographyNaturalness(questions, ids);
  return errors;
}

function summarizeSomaliHolidayFoodNaturalness(
  questions,
  ids = SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS,
) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let casesValidated = 0;

  for (const id of ids) {
    const question = questionById.get(id);
    const errorCountBefore = errors.length;

    if (!question) {
      errors.push(`${id}.somaliHolidayFoodNaturalness missing`);
      continue;
    }

    for (const [path, value] of somaliLocalizedSegments(question)) {
      if (typeof value === 'string' && SOMALI_HOLIDAY_FOOD_ENGLISH_TOKEN_PATTERN.test(value)) {
        errors.push(`${id}.${path} contains English holiday-food token`);
      }
    }

    if (errors.length === errorCountBefore) {
      casesValidated += 1;
    }
  }

  return {
    errors,
    casesValidated,
    expectedCases: ids.length,
    parityValidated: errors.length === 0 && casesValidated === ids.length,
  };
}

function checkSomaliHolidayFoodNaturalness(questions, ids = SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS) {
  const { errors } = summarizeSomaliHolidayFoodNaturalness(questions, ids);
  return errors;
}

function localizedQuestionMap(question) {
  return Object.assign(
    { sv: question.questionSv, en: question.questionEn },
    question.questionText || {},
  );
}

function localizedExplanationMap(question) {
  return Object.assign(
    { sv: question.explanationSv, en: question.explanationEn },
    question.explanationText || {},
  );
}

function localizedOptionMap(option) {
  return Object.assign({ sv: option?.textSv, en: option?.textEn }, option?.text || {});
}

function includesTerm(value, term) {
  return String(value || '')
    .toLocaleLowerCase('sv')
    .includes(String(term).toLocaleLowerCase('sv'));
}

function q062PublicSectorErrorsForQuestion(question) {
  const errors = [];
  const questionMap = localizedQuestionMap(question);
  const explanationMap = localizedExplanationMap(question);
  const correctOption = (question.options || []).find(
    (option) => option.id === question.correctOptionId,
  );
  const optionMap = localizedOptionMap(correctOption);

  if (!correctOption) {
    return [`${question.id}.publicSectorNaturalness correct option missing`];
  }

  const segments = [
    ['questionText', questionMap, Q062_PUBLIC_SECTOR_STALE_PATTERNS.question],
    ['correctOption.text', optionMap, Q062_PUBLIC_SECTOR_STALE_PATTERNS.option],
    ['explanationText', explanationMap, Q062_PUBLIC_SECTOR_STALE_PATTERNS.explanation],
  ];

  for (const [path, map, stalePattern] of segments) {
    for (const [locale, value] of Object.entries(map || {})) {
      if (typeof value === 'string' && stalePattern.test(value)) {
        errors.push(`${question.id}.${path}.${locale} uses stale public-sector wording`);
      }
    }
  }

  for (const [locale, requirements] of Object.entries(Q062_PUBLIC_SECTOR_REQUIREMENTS)) {
    const requirementSegments = [
      ['questionText', questionMap[locale], requirements.question],
      ['correctOption.text', optionMap[locale], requirements.option],
      ['explanationText', explanationMap[locale], requirements.explanation],
    ];

    for (const [path, value, requiredTerms] of requirementSegments) {
      const missingTerms = requiredTerms.filter((term) => !includesTerm(value, term));
      if (missingTerms.length > 0) {
        errors.push(
          `${question.id}.${path}.${locale} missing public-sector concept term(s): ${missingTerms.join(', ')}`,
        );
      }
    }
  }

  return errors;
}

function summarizeQ062PublicSectorNaturalness(questions, ids = Q062_PUBLIC_SECTOR_NATURALNESS_IDS) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let casesValidated = 0;

  for (const id of ids) {
    const question = questionById.get(id);
    const errorCountBefore = errors.length;

    if (!question) {
      errors.push(`${id}.publicSectorNaturalness missing`);
      continue;
    }

    errors.push(...q062PublicSectorErrorsForQuestion(question));

    if (errors.length === errorCountBefore) {
      casesValidated += 1;
    }
  }

  return {
    errors,
    casesValidated,
    expectedCases: ids.length,
    parityValidated: errors.length === 0 && casesValidated === ids.length,
  };
}

function checkQ062PublicSectorNaturalness(questions, ids = Q062_PUBLIC_SECTOR_NATURALNESS_IDS) {
  const { errors } = summarizeQ062PublicSectorNaturalness(questions, ids);
  return errors;
}

function isApprovedKommunRegionGloss(value, match) {
  const termStart = (match.index || 0) + match[1].length;
  const termEnd = termStart + match[2].length;
  const before = value[termStart - 1];
  const after = value[termEnd];
  return (before === '(' && after === ')') || (before === '（' && after === '）');
}

function q166Q169KommunRegionErrorsForQuestion(question) {
  const errors = [];
  const segments = [
    ['questionText', localizedQuestionMap(question)],
    ['explanationText', localizedExplanationMap(question)],
    ...(question.options || []).map((option) => [
      `options.${option.id}.text`,
      localizedOptionMap(option),
    ]),
  ];

  for (const [path, map] of segments) {
    for (const locale of REQUIRED_REVIEW_LOCALES) {
      const value = map?.[locale];
      if (typeof value !== 'string') continue;

      const bareTerms = Array.from(value.matchAll(BARE_KOMMUN_REGION_TERM_PATTERN))
        .filter((match) => !isApprovedKommunRegionGloss(value, match))
        .map((match) => match[2]);

      if (bareTerms.length > 0) {
        errors.push(
          `${question.id}.${path}.${locale} uses bare Swedish civic term(s): ${[
            ...new Set(bareTerms),
          ].join(', ')}`,
        );
      }
    }
  }

  return errors;
}

function summarizeQ166Q169KommunRegionNaturalness(
  questions,
  ids = Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let casesValidated = 0;

  for (const id of ids) {
    const question = questionById.get(id);
    const errorCountBefore = errors.length;

    if (!question) {
      errors.push(`${id}.kommunRegionNaturalness missing`);
      continue;
    }

    errors.push(...q166Q169KommunRegionErrorsForQuestion(question));

    if (errors.length === errorCountBefore) {
      casesValidated += 1;
    }
  }

  return {
    errors,
    casesValidated,
    expectedCases: ids.length,
    parityValidated: errors.length === 0 && casesValidated === ids.length,
  };
}

function checkQ166Q169KommunRegionNaturalness(
  questions,
  ids = Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
) {
  const { errors } = summarizeQ166Q169KommunRegionNaturalness(questions, ids);
  return errors;
}

function q050SourceCriticismErrorsForQuestion(question) {
  const errors = [];
  const questionMap = localizedQuestionMap(question);
  const explanationMap = localizedExplanationMap(question);

  const segments = [
    ['questionText', questionMap, Q050_SOURCE_CRITICISM_STALE_PATTERNS.question],
    ['explanationText', explanationMap, Q050_SOURCE_CRITICISM_STALE_PATTERNS.explanation],
  ];

  for (const [path, map, stalePattern] of segments) {
    for (const [locale, value] of Object.entries(map || {})) {
      if (typeof value === 'string' && stalePattern.test(value)) {
        errors.push(`${question.id}.${path}.${locale} uses stale source-criticism wording`);
      }
    }
  }

  for (const [locale, requiredTerms] of Object.entries(Q050_SOURCE_CRITICISM_REQUIRED_TERMS)) {
    for (const [path, value] of [
      ['questionText', questionMap[locale]],
      ['explanationText', explanationMap[locale]],
    ]) {
      const missingTerms = requiredTerms.filter((term) => !includesTerm(value, term));
      if (missingTerms.length > 0) {
        errors.push(
          `${question.id}.${path}.${locale} missing source-criticism noun term(s): ${missingTerms.join(', ')}`,
        );
      }
    }
  }

  return errors;
}

function summarizeQ050SourceCriticismNaturalness(
  questions,
  ids = Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let casesValidated = 0;

  for (const id of ids) {
    const question = questionById.get(id);
    const errorCountBefore = errors.length;

    if (!question) {
      errors.push(`${id}.sourceCriticismNaturalness missing`);
      continue;
    }

    errors.push(...q050SourceCriticismErrorsForQuestion(question));

    if (errors.length === errorCountBefore) {
      casesValidated += 1;
    }
  }

  return {
    errors,
    casesValidated,
    expectedCases: ids.length,
    parityValidated: errors.length === 0 && casesValidated === ids.length,
  };
}

function checkQ050SourceCriticismNaturalness(
  questions,
  ids = Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
) {
  const { errors } = summarizeQ050SourceCriticismNaturalness(questions, ids);
  return errors;
}

function isSomaliGeographyNaturalnessId(id) {
  return SOMALI_GEOGRAPHY_NATURALNESS_IDS.includes(id);
}

function isSomaliHolidayFoodNaturalnessId(id) {
  return SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS.includes(id);
}

function isQ062PublicSectorNaturalnessId(id) {
  return Q062_PUBLIC_SECTOR_NATURALNESS_IDS.includes(id);
}

function isQ166Q169KommunRegionNaturalnessId(id) {
  return Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS.includes(id);
}

function isQ050SourceCriticismNaturalnessId(id) {
  return Q050_SOURCE_CRITICISM_NATURALNESS_IDS.includes(id);
}

function checkQuestions(questions, ids = QUESTION_LOCALIZATION_PILOT_IDS) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));

  for (const id of ids) {
    const q = questionById.get(id);
    if (!q) {
      errors.push(`${id} missing`);
      continue;
    }

    checkLocalizedMap(
      Object.assign({ sv: q.questionSv, en: q.questionEn }, q.questionText || {}),
      `${q.id}.questionText`,
      errors,
    );
    checkLocalizedMap(
      Object.assign({ sv: q.explanationSv, en: q.explanationEn }, q.explanationText || {}),
      `${q.id}.explanationText`,
      errors,
    );

    const optionIds = new Set();
    for (const opt of q.options || []) {
      if (optionIds.has(opt.id)) errors.push(`${q.id}.options duplicate id ${opt.id}`);
      optionIds.add(opt.id);
      checkLocalizedMap(
        Object.assign({ sv: opt.textSv, en: opt.textEn }, opt.text || {}),
        `${q.id}.options.${opt.id}.text`,
        errors,
      );
    }
    if (!optionIds.has(q.correctOptionId)) errors.push(`${q.id}.correctOptionId not in options`);
    checkTrueFalseLabels(q, errors);
    checkProtectedTerms(q, errors);
    checkNumericFacts(q, errors);
  }

  const somaliGeographyIds = ids.filter(isSomaliGeographyNaturalnessId);
  if (somaliGeographyIds.length > 0) {
    errors.push(...checkSomaliGeographyNaturalness(questions, somaliGeographyIds));
  }

  const somaliHolidayFoodIds = ids.filter(isSomaliHolidayFoodNaturalnessId);
  if (somaliHolidayFoodIds.length > 0) {
    errors.push(...checkSomaliHolidayFoodNaturalness(questions, somaliHolidayFoodIds));
  }

  const q062PublicSectorIds = ids.filter(isQ062PublicSectorNaturalnessId);
  if (q062PublicSectorIds.length > 0) {
    errors.push(...checkQ062PublicSectorNaturalness(questions, q062PublicSectorIds));
  }

  const q166Q169KommunRegionIds = ids.filter(isQ166Q169KommunRegionNaturalnessId);
  if (q166Q169KommunRegionIds.length > 0) {
    errors.push(...checkQ166Q169KommunRegionNaturalness(questions, q166Q169KommunRegionIds));
  }

  const q050SourceCriticismIds = ids.filter(isQ050SourceCriticismNaturalnessId);
  if (q050SourceCriticismIds.length > 0) {
    errors.push(...checkQ050SourceCriticismNaturalness(questions, q050SourceCriticismIds));
  }

  return errors;
}

function checkLocalizationSourceShape(
  questions,
  localizations = questionLocalizationPilot,
  ids = QUESTION_LOCALIZATION_PILOT_IDS,
) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const expectedIdSet = new Set(ids);

  for (const localizationId of Object.keys(localizations || {})) {
    if (!expectedIdSet.has(localizationId)) {
      errors.push(`${localizationId}.localization stale question id not in pilot ids`);
    }
  }

  for (const id of ids) {
    const question = questionById.get(id);
    const localization = localizations?.[id];
    if (!question) {
      errors.push(`${id}.source missing for localization shape check`);
      continue;
    }
    if (!localization || typeof localization !== 'object') {
      errors.push(`${id}.localization missing`);
      continue;
    }

    checkTargetLocalizedMap(localization.questionText, `${id}.localization.questionText`, errors);
    checkTargetLocalizedMap(
      localization.explanationText,
      `${id}.localization.explanationText`,
      errors,
    );

    const sourceOptionIds = new Set((question.options || []).map((option) => option.id));
    const localizedOptionIds = new Set(Object.keys(localization.options || {}));

    for (const sourceOptionId of sourceOptionIds) {
      if (!localizedOptionIds.has(sourceOptionId)) {
        errors.push(`${id}.localization.options.${sourceOptionId} missing source option id`);
      } else {
        checkTargetLocalizedMap(
          localization.options[sourceOptionId],
          `${id}.localization.options.${sourceOptionId}.text`,
          errors,
        );
      }
    }

    for (const localizedOptionId of localizedOptionIds) {
      if (!sourceOptionIds.has(localizedOptionId)) {
        errors.push(
          `${id}.localization.options.${localizedOptionId} stale option id not in source`,
        );
      }
    }

    if (!sourceOptionIds.has(question.correctOptionId)) {
      errors.push(`${id}.source.correctOptionId not in options`);
    }
  }

  return errors;
}

function checkReviewMetadata(
  reviewStatus = QUESTION_LOCALIZATION_REVIEW_STATUS,
  ids = QUESTION_LOCALIZATION_PILOT_IDS,
  locales = REQUIRED_REVIEW_LOCALES,
) {
  const errors = [];

  for (const id of ids) {
    const perQuestion = reviewStatus?.[id];
    if (!perQuestion || typeof perQuestion !== 'object') {
      errors.push(`${id}.review missing`);
      continue;
    }

    for (const locale of locales) {
      const metadata = perQuestion[locale];
      if (!metadata || typeof metadata !== 'object') {
        errors.push(`${id}.review.${locale} missing`);
        continue;
      }
      if (metadata.status !== 'machine_assisted') {
        errors.push(`${id}.review.${locale}.status must be machine_assisted before native review`);
      }
      if (metadata.nativeReviewStatus !== 'pending_native_review') {
        errors.push(`${id}.review.${locale}.nativeReviewStatus must be pending_native_review`);
      }
      if (metadata.source !== 'question_localization_v8') {
        errors.push(`${id}.review.${locale}.source must be question_localization_v8`);
      }
    }
  }

  return errors;
}

if (require.main === module) {
  const questions = loadTs('data/questions.ts', 'questions');
  const errors = [
    ...checkLocalizationSourceShape(questions),
    ...checkQuestions(questions),
    ...checkReviewMetadata(),
  ];
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(
    `Question i18n pilot OK (${QUESTION_LOCALIZATION_PILOT_IDS.length} questions, ${REQUIRED_LOCALES.length} locales)`,
  );
}

module.exports = {
  Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
  Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
  Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
  SOMALI_GEOGRAPHY_NATURALNESS_IDS,
  SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS,
  checkQuestions,
  checkLocalizationSourceShape,
  checkQ050SourceCriticismNaturalness,
  checkQ062PublicSectorNaturalness,
  checkQ166Q169KommunRegionNaturalness,
  checkSomaliGeographyNaturalness,
  checkSomaliHolidayFoodNaturalness,
  checkReviewMetadata,
  REQUIRED_LOCALES,
  REQUIRED_REVIEW_LOCALES,
  summarizeQ050SourceCriticismNaturalness,
  summarizeQ062PublicSectorNaturalness,
  summarizeQ166Q169KommunRegionNaturalness,
  summarizeSomaliGeographyNaturalness,
  summarizeSomaliHolidayFoodNaturalness,
};
