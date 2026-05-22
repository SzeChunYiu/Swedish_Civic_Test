import { chapters } from '../../data/chapters';
import type { AppLanguage } from '../storage/settingsStore';

export type LocalizedText = Record<AppLanguage, string>;
export type EbookArticlePracticePath = '/practice' | '/exam' | `/chapter/${string}`;

export type EbookArticleSection = {
  blockId: string;
  body: LocalizedText;
  heading: LocalizedText;
  sourceNoteKeys: readonly EbookSourceKey[];
};

export const EBOOK_SOURCE_NOTES = {
  uhrStudyMaterial: {
    key: 'uhrStudyMaterial',
    label: {
      sv: 'UHR:s offentliga utbildningsmaterial',
      en: 'UHR public study material',
    },
    retrievedDate: '2026-05-19',
    url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  },
  officialTestOverview: {
    key: 'officialTestOverview',
    label: {
      sv: 'UHR: Om medborgarskapsprovet',
      en: 'UHR: About the citizenship test',
    },
    retrievedDate: '2026-05-19',
    url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  },
  officialTestSignup: {
    key: 'officialTestSignup',
    label: {
      sv: 'UHR: Anmälan',
      en: 'UHR: Registration',
    },
    retrievedDate: '2026-05-19',
    url: 'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  },
  migrationsverketCitizenshipRules: {
    key: 'migrationsverketCitizenshipRules',
    label: {
      sv: 'Migrationsverket: Nya regler för svenskt medborgarskap från 6 juni 2026',
      en: 'Migrationsverket: New rules for Swedish citizenship from 6 June 2026',
    },
    retrievedDate: '2026-05-19',
    url: 'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
  },
} as const;

export type EbookSourceKey = keyof typeof EBOOK_SOURCE_NOTES;
export type EbookSourceNote = (typeof EBOOK_SOURCE_NOTES)[EbookSourceKey];

export function getSafeEbookSourceUrl(source: EbookSourceNote): string | null {
  try {
    return new URL(source.url).protocol === 'https:' ? source.url : null;
  } catch {
    return null;
  }
}

export type EbookArticle = {
  chapterId: string | null;
  kicker: LocalizedText;
  lede: LocalizedText;
  practiceLabel: LocalizedText;
  practicePath: EbookArticlePracticePath;
  sections: readonly EbookArticleSection[];
  sourceNoteKeys: readonly EbookSourceKey[];
  staticChapterId: string;
  title: LocalizedText;
};

type EbookArticleSeed = {
  kicker: LocalizedText;
  lede: LocalizedText;
  practiceChapterId?: string;
  practiceLabel: LocalizedText;
  practicePath?: EbookArticlePracticePath;
  staticChapterId: string;
  title: LocalizedText;
};

const studyMaterialSourceKeys = ['uhrStudyMaterial'] as const satisfies readonly EbookSourceKey[];
function uniqueSourceNoteKeys(sections: readonly EbookArticleSection[]): readonly EbookSourceKey[] {
  return Array.from(
    new Set(sections.flatMap((section) => [...section.sourceNoteKeys])),
  ) as EbookSourceKey[];
}

const introSections: readonly EbookArticleSection[] = [
  {
    blockId: 'what-this-book-is',
    heading: {
      sv: 'Vad den här boken är',
      en: 'What this book is',
    },
    body: {
      sv: 'En lugn genomgång av svensk samhällskunskap inför medborgarskapsprovet, skriven för vuxna som vill förstå sammanhang och begrepp innan de övar på frågorna.',
      en: "A plain-language reader for Sweden's citizenship test, turning public study material into calm, unofficial practice reading for adults building civic vocabulary and context.",
    },
    sourceNoteKeys: studyMaterialSourceKeys,
  },
  {
    blockId: 'what-it-is-not',
    heading: {
      sv: 'Vad den inte är',
      en: 'What it is not',
    },
    body: {
      sv: 'Inte officiellt material, inte juridisk rådgivning och inte ett substitut för UHR:s material. Kontrollera alltid fakta via källsidan och UHR när en uppgift påverkar dig.',
      en: "Not official material, not a legal document, and not a substitute for UHR's study material. Use the Sources page and UHR material when a fact matters.",
    },
    sourceNoteKeys: studyMaterialSourceKeys,
  },
];

const introArticle: EbookArticle = {
  chapterId: null,
  kicker: {
    sv: 'Hur man läser den här boken',
    en: 'How to read this book',
  },
  lede: {
    sv: 'Det här är ett sällskap, inte en lärobok. Läs ett kapitel, gör en övning, ta en fika. Ordningen spelar mindre roll — men i ordning får du en känsla för hur Sveriges delar passar ihop.',
    en: "This is a companion, not a textbook. Read a chapter, take a quiz, take a fika. The order doesn't matter — but if you finish in order you get a feel for how Sweden's pieces fit together.",
  },
  practiceLabel: {
    sv: 'Öppna övning',
    en: 'Open practice',
  },
  practicePath: '/practice',
  sections: introSections,
  sourceNoteKeys: uniqueSourceNoteKeys(introSections),
  staticChapterId: 'intro',
  title: {
    sv: 'Sakta in. Vi har kaffe.',
    en: "Slow down. We've got coffee.",
  },
};

const articleSeeds: readonly EbookArticleSeed[] = [
  {
    kicker: { sv: 'Kapitel 01 · Historia', en: 'Chapter 01 · History' },
    lede: {
      sv: 'Från vikingar till NATO på under 4 000 ord. Dynastierna kan du hoppa över. Mönstren kan du inte.',
      en: 'From Vikings to NATO in under 4,000 words. The dynasties are skippable. The patterns are not.',
    },
    practiceChapterId: 'ch10',
    practiceLabel: { sv: 'Öva historia', en: 'Practice history' },
    staticChapterId: '1',
    title: { sv: 'En kort historia om Sverige.', en: 'A very short history of Sweden.' },
  },
  {
    kicker: { sv: 'Kapitel 02 · Statsskick', en: 'Chapter 02 · Government' },
    lede: {
      sv: 'En kung som inte bestämmer, en riksdag som gör det, och 290 kommuner du oftast bara träffar vid återvinningen.',
      en: "A king who can't decide, a Riksdag that does, and 290 municipalities you'll mostly only meet at the recycling station.",
    },
    practiceChapterId: 'ch03',
    practiceLabel: { sv: 'Öva statsskick', en: 'Practice government' },
    staticChapterId: '2',
    title: { sv: 'Hur Sverige styrs.', en: 'How Sweden is governed.' },
  },
  {
    kicker: { sv: 'Kapitel 03 · Rättigheter', en: 'Chapter 03 · Rights' },
    lede: {
      sv: 'Sveriges författning står i fyra grundlagar. Tryckfrihetsförordningen är världens äldsta. Resten är nästan lika kul.',
      en: "Sweden's constitution is split across four laws. The Press Act is the oldest in the world. The rest is almost as interesting.",
    },
    practiceChapterId: 'ch05',
    practiceLabel: { sv: 'Öva rättigheter', en: 'Practice rights' },
    staticChapterId: '3',
    title: {
      sv: 'Fyra grundlagar, en lång lista av rättigheter.',
      en: 'Four basic laws, one long list of rights.',
    },
  },
  {
    kicker: { sv: 'Kapitel 04 · Arbete & skatt', en: 'Chapter 04 · Work & taxes' },
    lede: {
      sv: 'Sverige tar mycket av din lön och ger tillbaka det mesta. Knepet är att veta vad det går till.',
      en: "Sweden takes a lot of your salary and gives most of it back. The trick is knowing what it's paying for.",
    },
    practiceChapterId: 'ch08',
    practiceLabel: { sv: 'Öva arbete och ekonomi', en: 'Practice work and money' },
    staticChapterId: '4',
    title: {
      sv: 'Arbete, skatt och välfärdsstaten.',
      en: 'Work, taxes, and the welfare state.',
    },
  },
  {
    kicker: { sv: 'Kapitel 05 · Jämställdhet', en: 'Chapter 05 · Equality' },
    lede: {
      sv: 'Sverige är ett tyst feministiskt projekt. Lagarna är tydligare än middagsbordssamtalen — men båda är värda att kunna.',
      en: 'Sweden is a quiet feminist project. The laws are clearer than the dinner-table conversations, but both are worth knowing.',
    },
    practiceChapterId: 'ch07',
    practiceLabel: { sv: 'Öva jämställdhet', en: 'Practice equality' },
    staticChapterId: '5',
    title: {
      sv: 'Jämställdhet och det moderna hemmet.',
      en: 'Equality and the modern household.',
    },
  },
  {
    kicker: { sv: 'Kapitel 06 · Samhälle', en: 'Chapter 06 · Society' },
    lede: {
      sv: 'Sverige sköter livets tråkiga delar — skola, vård, äldreomsorg — i offentlig regi, och är på förnamn med byråkraterna.',
      en: 'Sweden runs the boring parts of life — school, healthcare, eldercare — through the public sector, and is largely on first-name terms with its bureaucrats.',
    },
    practiceChapterId: 'ch09',
    practiceLabel: { sv: 'Öva välfärd', en: 'Practice welfare' },
    staticChapterId: '6',
    title: { sv: 'Samhälle, skola och vård.', en: 'Society, school, and healthcare.' },
  },
  {
    kicker: { sv: 'Kapitel 07 · Natur', en: 'Chapter 07 · Nature' },
    lede: {
      sv: 'Sverige är mest skog, och skogen är mest öppen för dig. Regeln är enkel: stör inte, förstör inte.',
      en: "Sweden is mostly forest, and the forest is mostly open to you. The rule is simple: don't disturb, don't destroy.",
    },
    practiceChapterId: 'ch01',
    practiceLabel: { sv: 'Öva natur', en: 'Practice nature' },
    staticChapterId: '7',
    title: {
      sv: 'Natur, klimat och allemansrätten.',
      en: 'Nature, climate, and allemansrätten.',
    },
  },
  {
    kicker: { sv: 'Kapitel 08 · Kultur', en: 'Chapter 08 · Culture' },
    lede: {
      sv: 'Vet du inte när midsommar är får du en artig förklaring. Vet du inte vad fika är får du en — vare sig du vill eller inte.',
      en: "If you don't know when midsummer is, you'll get a polite explanation. If you don't know what fika is, you'll get one whether you want it or not.",
    },
    practiceChapterId: 'ch13',
    practiceLabel: { sv: 'Öva traditioner', en: 'Practice traditions' },
    staticChapterId: '8',
    title: {
      sv: 'Kultur, traditioner och svenska kalendern.',
      en: 'Culture, traditions, and the Swedish calendar.',
    },
  },
  {
    kicker: { sv: 'Kapitel 09 · Pengar', en: 'Chapter 09 · Money' },
    lede: {
      sv: 'Sverige är ett av världens minst kontantberoende länder. Nästan varje transaktion går genom en liten app.',
      en: 'Sweden is one of the least cash-dependent countries on earth. Almost every transaction now passes through one little app.',
    },
    practiceChapterId: 'ch08',
    practiceLabel: { sv: 'Öva ekonomi', en: 'Practice money' },
    staticChapterId: '9',
    title: { sv: 'Pengar, banker och BankID.', en: 'Money, banks, and BankID.' },
  },
  {
    kicker: { sv: 'Kapitel 10 · EU & världen', en: 'Chapter 10 · EU & world' },
    lede: {
      sv: 'Sverige tillbringade två sekel med att undvika krig och ett årtionde med att snabbt gå med i allianser. Mönstret är detsamma — gör nytta, undvik bråk.',
      en: 'Sweden spent two centuries avoiding war and one decade rapidly joining alliances. The pattern is the same — be useful, stay out of trouble.',
    },
    practiceChapterId: 'ch11',
    practiceLabel: { sv: 'Öva EU och omvärld', en: 'Practice EU and world' },
    staticChapterId: '10',
    title: { sv: 'Sverige, EU och världen.', en: 'Sweden, the EU, and the world.' },
  },
  {
    kicker: { sv: 'Kapitel 11 · Migration', en: 'Chapter 11 · Migration' },
    lede: {
      sv: 'Att bli svensk medborgare är mer en process än ett ögonblick. Pappersarbetet är långt, men reglerna är ovanligt tydliga.',
      en: 'Becoming a Swedish citizen is a process more than an event. The paperwork is long, but the rules are unusually clear.',
    },
    practiceLabel: { sv: 'Öva blandade frågor', en: 'Practice mixed questions' },
    practicePath: '/practice',
    staticChapterId: '11',
    title: {
      sv: 'Migration, uppehåll och medborgarskap.',
      en: 'Migration, residence, and citizenship.',
    },
  },
  {
    kicker: { sv: 'Kapitel 12 · Övningsprov', en: 'Chapter 12 · Mock exam' },
    lede: {
      sv: 'Använd övningsprovet för övning, men håll praktiska provdetaljer knutna till UHR och Migrationsverket.',
      en: 'Use the mock exam for practice, but keep the practical test details tied to UHR and Migrationsverket.',
    },
    practiceLabel: { sv: 'Starta övningsprov', en: 'Start mock exam' },
    practicePath: '/exam',
    staticChapterId: '12',
    title: { sv: 'Övningsprov och aktuell provstatus.', en: 'Mock exam and current test status.' },
  },
  {
    kicker: { sv: 'Kapitel 13 · Traditioner', en: 'Chapter 13 · Traditions' },
    lede: {
      sv: 'Svenska traditioner är inte museiföremål. Vissa är gamla, vissa har kommit hit senare, och de flesta hjälper människor att känna igen året tillsammans.',
      en: 'Swedish traditions are not museum pieces. Some are old, some are borrowed, and most are just ways people mark the year together.',
    },
    practiceChapterId: 'ch13',
    practiceLabel: { sv: 'Öva traditioner', en: 'Practice traditions' },
    staticChapterId: '13',
    title: { sv: 'Traditioner, högtider och förändring.', en: 'Traditions, holidays, and change.' },
  },
];

function findChapter(chapterId: string | undefined) {
  return chapterId ? chapters.find((chapter) => chapter.id === chapterId) : undefined;
}

function buildChapterSections(seed: EbookArticleSeed): readonly EbookArticleSection[] {
  if (seed.staticChapterId === '12') {
    return [
      {
        blockId: 'current-official-status',
        heading: { sv: 'Aktuell officiell status', en: 'Current official status' },
        body: {
          sv: 'Det första samhällskunskapsprovet inom medborgarskapsprovet hålls den 15 augusti 2026 i Stockholm. Anmälan kräver brev från Migrationsverket, och antalet platser är begränsat.',
          en: 'The first civic-knowledge sitting will be held on 15 August 2026 in Stockholm. A Migrationsverket letter is required, and seats are limited.',
        },
        sourceNoteKeys: [
          'officialTestOverview',
          'officialTestSignup',
          'migrationsverketCitizenshipRules',
        ],
      },
      {
        blockId: 'practical-details-pending',
        heading: {
          sv: 'Praktiska detaljer väntar hos UHR',
          en: 'Practical details pending from UHR',
        },
        body: {
          sv: 'UHR har ännu inte publicerat exakt tid och plats. Använd appen som inofficiell övning och använd UHR och Migrationsverket för instruktioner som påverkar ditt eget ärende.',
          en: 'UHR has not yet published the exact time and place. Use this app for unofficial practice, and use UHR and Migrationsverket for instructions that affect your own case.',
        },
        sourceNoteKeys: [
          'officialTestOverview',
          'officialTestSignup',
          'migrationsverketCitizenshipRules',
        ],
      },
    ];
  }

  const chapter = findChapter(seed.practiceChapterId);
  const chapterNameSv = chapter?.nameSv ?? 'frågebanken';
  const chapterNameEn = chapter?.nameEn ?? 'the question bank';
  const chapterDescriptionSv =
    chapter?.descriptionSv ?? 'Blandade frågor från utbildningsmaterialet.';
  const chapterDescriptionEn = chapter?.descriptionEn ?? 'Mixed questions from the study material.';

  return [
    {
      blockId: 'read-with-focus',
      heading: { sv: 'Läs med fokus', en: 'Read with focus' },
      body: {
        sv: `${seed.lede.sv} Koppla läsningen till ${chapterNameSv} och stanna vid begrepp som dyker upp i övningsfrågorna.`,
        en: `${seed.lede.en} Connect the reading to ${chapterNameEn} and pause on concepts that appear in the practice questions.`,
      },
      sourceNoteKeys: studyMaterialSourceKeys,
    },
    {
      blockId: 'review-close-to-source',
      heading: { sv: 'Repetera nära källan', en: 'Review close to the source' },
      body: {
        sv: `${chapterDescriptionSv} Övningsfrågorna i appen visar UHR-hänvisning så att du kan kontrollera materialet utan konto eller nätverk.`,
        en: `${chapterDescriptionEn} The app's practice questions show UHR references so you can check the material without an account or network connection.`,
      },
      sourceNoteKeys: studyMaterialSourceKeys,
    },
  ];
}

function buildArticle(seed: EbookArticleSeed): EbookArticle {
  const practicePath =
    seed.practicePath ??
    (seed.practiceChapterId ? (`/chapter/${seed.practiceChapterId}` as const) : '/practice');
  const sections = buildChapterSections(seed);

  return {
    chapterId: seed.practiceChapterId ?? null,
    kicker: seed.kicker,
    lede: seed.lede,
    practiceLabel: seed.practiceLabel,
    practicePath,
    sections,
    sourceNoteKeys: uniqueSourceNoteKeys(sections),
    staticChapterId: seed.staticChapterId,
    title: seed.title,
  };
}

export const EBOOK_ARTICLES = [introArticle, ...articleSeeds.map(buildArticle)] as const;
export const EBOOK_ARTICLE_ORDER = EBOOK_ARTICLES.map((article) => article.staticChapterId);
export const EBOOK_ARTICLE_COUNT = EBOOK_ARTICLES.length;

export function getLocalizedText(value: LocalizedText, language: AppLanguage): string {
  return value[language] ?? value.sv;
}

export function getEbookArticleByParam(value: string | string[] | undefined): EbookArticle {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = rawValue?.trim();

  if (!normalized || normalized === 'intro') {
    return introArticle;
  }

  const chapterMatch = normalized.match(/^ch(\d{2})$/i);
  const staticChapterId = chapterMatch
    ? String(Number(chapterMatch[1]))
    : String(Number(normalized));
  const article = EBOOK_ARTICLES.find((item) => item.staticChapterId === staticChapterId);

  return article ?? introArticle;
}

export function getAdjacentEbookArticle(
  article: EbookArticle,
  direction: 'next' | 'previous',
): EbookArticle | null {
  const currentIndex = EBOOK_ARTICLES.findIndex(
    (item) => item.staticChapterId === article.staticChapterId,
  );
  const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

  return EBOOK_ARTICLES[nextIndex] ?? null;
}

export function getEbookSourceNotes(article: EbookArticle): readonly EbookSourceNote[] {
  return article.sourceNoteKeys.map((key) => EBOOK_SOURCE_NOTES[key]);
}

export function getEbookSectionSourceNotes(
  section: EbookArticleSection,
): readonly EbookSourceNote[] {
  return section.sourceNoteKeys.map((key) => EBOOK_SOURCE_NOTES[key]);
}

export function getEbookArticleSectionByBlockId(
  article: EbookArticle,
  blockId: string,
): EbookArticleSection | null {
  return article.sections.find((section) => section.blockId === blockId) ?? null;
}
