import { getLocale } from '../i18n/locales';
import type { LocaleCode } from '../i18n/locales';
import type {
  LocalizedContentText,
  OfficialSourceReference,
  QuestionOption,
  UHRReference,
} from '../../types/content';

type QuestionTextSource = {
  questionEn?: string;
  questionSv?: string;
  questionText?: Partial<LocalizedContentText>;
  explanationEn?: string;
  explanationSv?: string;
  explanationText?: Partial<LocalizedContentText>;
  uhrReference?: UHRReference;
  supplementalSources?: OfficialSourceReference[];
};

type QuestionTextLanguage = LocaleCode;
type PrimaryQuestionTextLanguage = 'sv' | 'en';

export type SupplementalSourceCitation = {
  accessibilityLabel: string;
  label: string;
  meta: string;
  publisher: string;
  title: string;
  url: string;
};

const QUESTION_DISPLAY_FALLBACKS: Record<PrimaryQuestionTextLanguage, string> = {
  sv: 'Fråga saknas',
  en: 'Question unavailable',
};

const QUESTION_DISPLAY_FALLBACKS_BY_LANGUAGE: Partial<Record<QuestionTextLanguage, string>> = {
  ar: 'Question unavailable',
  ckb: 'Question unavailable',
  fa: 'Question unavailable',
  so: 'Question unavailable',
  ti: 'Question unavailable',
  pl: 'Question unavailable',
  tr: 'Question unavailable',
  uk: 'Question unavailable',
  'zh-Hans': 'Question unavailable',
  'zh-Hant': 'Question unavailable',
};

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

export function stripSourceAuthorityPhrasing(text?: string): string {
  if (!text) return '';

  const cleaned = SOURCE_AUTHORITY_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement.pattern, replacement.replacement),
    text,
  )
    .replace(/\?\s*,\s*/g, '? ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return capitalizeSentenceStart(cleaned);
}

export function getQuestionDisplayText(
  question: QuestionTextSource | undefined,
  language: QuestionTextLanguage,
  fallback = QUESTION_DISPLAY_FALLBACKS_BY_LANGUAGE[language] ??
    QUESTION_DISPLAY_FALLBACKS[primaryLanguageFor(language)],
): string {
  const rawText = resolveLocalizedText(question?.questionText, language, {
    en: question?.questionEn,
    sv: question?.questionSv,
  });
  return stripSourceAuthorityPhrasing(rawText) || fallback;
}

export function getQuestionTranslationText(
  question?: QuestionTextSource,
  language: QuestionTextLanguage = 'sv',
): string | undefined {
  const translationLanguage: PrimaryQuestionTextLanguage = language === 'en' ? 'sv' : 'en';
  const translation = stripSourceAuthorityPhrasing(
    resolveLocalizedText(question?.questionText, translationLanguage, {
      en: question?.questionEn,
      sv: question?.questionSv,
    }),
  );
  return translation || undefined;
}

export function getQuestionSourceCitation(
  question?: QuestionTextSource,
  language: QuestionTextLanguage = 'sv',
): string {
  const primaryCitation = getQuestionPrimarySourceCitation(question, language);
  if (!question?.uhrReference) return primaryCitation;

  const supplementalCitations = getQuestionSupplementalSourceCitations(question, language).map(
    (source) =>
      [`${source.label}: ${source.title}`, source.meta, source.url].filter(Boolean).join(', '),
  );
  return [primaryCitation, ...supplementalCitations].join('; ');
}

export function getQuestionPrimarySourceCitation(
  question?: QuestionTextSource,
  language: QuestionTextLanguage = 'sv',
): string {
  if (!question?.uhrReference) {
    return language === 'en' ? 'Source citation unavailable' : 'Källhänvisning saknas';
  }

  const { chapter, pageApprox, section } = question.uhrReference;
  return language === 'en'
    ? `Source: Sverige i fokus, ${chapter}, ${section}, p. ${pageApprox}`
    : `Källa: Sverige i fokus, ${chapter}, ${section}, s. ${pageApprox}`;
}

export function getQuestionSupplementalSourceCitations(
  question?: QuestionTextSource,
  language: QuestionTextLanguage = 'sv',
): SupplementalSourceCitation[] {
  if (!Array.isArray(question?.supplementalSources)) return [];

  const isEnglish = primaryLanguageFor(language) === 'en';
  const label = isEnglish ? 'Additional source' : 'Kompletterande källa';
  return question.supplementalSources
    .filter((source) => source && source.title && source.publisher && source.url)
    .map((source) => {
      const meta = formatSupplementalSourceMeta(source, isEnglish);
      return {
        accessibilityLabel: [label, source.title, meta, source.url].filter(Boolean).join(', '),
        label,
        meta,
        publisher: source.publisher,
        title: source.title,
        url: source.url,
      };
    });
}

export function getQuestionExplanationText(
  question: QuestionTextSource | undefined,
  language: QuestionTextLanguage,
  fallback: string,
): string {
  return (
    resolveLocalizedText(question?.explanationText, language, {
      en: question?.explanationEn,
      sv: question?.explanationSv,
    }) || fallback
  );
}

export function getQuestionOptionText(
  option: QuestionOption | undefined,
  language: QuestionTextLanguage,
  fallback = '',
): string {
  return (
    resolveLocalizedText(option?.text, language, {
      en: option?.textEn,
      sv: option?.textSv,
    }) || fallback
  );
}

function primaryLanguageFor(language: QuestionTextLanguage): PrimaryQuestionTextLanguage {
  if (language === 'sv') return 'sv';
  if (language === 'en') return 'en';
  return getLocale(language).fallback === 'sv' ? 'sv' : 'en';
}

function formatSupplementalSourceMeta(source: OfficialSourceReference, isEnglish: boolean): string {
  const published = source.publishedDate
    ? isEnglish
      ? `published ${source.publishedDate}`
      : `publicerad ${source.publishedDate}`
    : '';
  const retrieved = source.retrievedDate
    ? isEnglish
      ? `retrieved ${source.retrievedDate}`
      : `hämtad ${source.retrievedDate}`
    : '';
  return [source.publisher, published, retrieved].filter(Boolean).join(', ');
}

function resolveLocalizedText(
  localizedText: Partial<LocalizedContentText> | undefined,
  language: QuestionTextLanguage,
  legacyText: Partial<Record<PrimaryQuestionTextLanguage, string>>,
): string {
  const primaryLanguage = primaryLanguageFor(language);
  const candidates = [
    localizedText?.[language],
    localizedText?.[primaryLanguage],
    primaryLanguage === 'en' ? legacyText.en : legacyText.sv,
    localizedText?.sv,
    localizedText?.en,
    legacyText.sv,
    legacyText.en,
  ];

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) ?? '';
}

function capitalizeSentenceStart(text: string): string {
  return text
    .replace(/^([a-zåäö])/, (character) => character.toLocaleUpperCase('sv-SE'))
    .replace(/([.!?]\s+)([a-zåäö])/g, (_match, prefix: string, character: string) => {
      return `${prefix}${character.toLocaleUpperCase('sv-SE')}`;
    });
}
