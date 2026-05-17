import type { UHRReference } from '../../types/content';

type QuestionTextSource = {
  questionEn?: string;
  questionSv?: string;
  uhrReference?: UHRReference;
};

type QuestionTextLanguage = 'sv' | 'en';

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
  fallback = 'Question unavailable',
): string {
  const rawText = language === 'en' ? question?.questionEn : question?.questionSv;
  return stripSourceAuthorityPhrasing(rawText) || fallback;
}

export function getQuestionTranslationText(question?: QuestionTextSource): string | undefined {
  const translation = stripSourceAuthorityPhrasing(question?.questionEn);
  return translation || undefined;
}

export function getQuestionSourceCitation(question?: QuestionTextSource): string {
  if (!question?.uhrReference) return 'Source citation unavailable';

  const { chapter, pageApprox, section } = question.uhrReference;
  return `Källa/Source: Sverige i fokus, ${chapter}, ${section}, s. ${pageApprox}`;
}

function capitalizeSentenceStart(text: string): string {
  return text
    .replace(/^([a-zåäö])/, (character) => character.toLocaleUpperCase('sv-SE'))
    .replace(/([.!?]\s+)([a-zåäö])/g, (_match, prefix: string, character: string) => {
      return `${prefix}${character.toLocaleUpperCase('sv-SE')}`;
    });
}
