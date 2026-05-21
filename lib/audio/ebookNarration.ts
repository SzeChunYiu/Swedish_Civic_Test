import type { EbookArticle, EbookArticleSection } from '../content/ebookContent';
import { getLocalizedText } from '../content/ebookContent';

export const EBOOK_NARRATION_MAX_CHUNK_LENGTH = 260;

function normalizeNarrationText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function appendWrappedSegment(chunks: string[], segment: string, maxLength: number) {
  const words = normalizeNarrationText(segment).split(' ').filter(Boolean);
  let current = '';

  for (const word of words) {
    if (word.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let index = 0; index < word.length; index += maxLength) {
        chunks.push(word.slice(index, index + maxLength));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
}

export function chunkArticleNarrationText(
  value: unknown,
  maxLength = EBOOK_NARRATION_MAX_CHUNK_LENGTH,
): string[] {
  const text = normalizeNarrationText(value);
  if (!text) return [];

  const safeMaxLength =
    Number.isFinite(maxLength) && maxLength >= 80
      ? Math.floor(maxLength)
      : EBOOK_NARRATION_MAX_CHUNK_LENGTH;
  const sentenceSegments = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const rawSegment of sentenceSegments) {
    const segment = normalizeNarrationText(rawSegment);
    if (!segment) continue;
    const next = current ? `${current} ${segment}` : segment;

    if (next.length <= safeMaxLength) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (segment.length <= safeMaxLength) {
      current = segment;
    } else {
      appendWrappedSegment(chunks, segment, safeMaxLength);
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export function buildEbookSectionNarrationText(section: EbookArticleSection): string {
  return normalizeNarrationText(
    `${getLocalizedText(section.heading, 'sv')}. ${getLocalizedText(section.body, 'sv')}`,
  );
}

export function buildEbookArticleNarrationText(
  article: Pick<EbookArticle, 'lede' | 'sections' | 'title'>,
): string {
  return normalizeNarrationText(
    [
      getLocalizedText(article.title, 'sv'),
      getLocalizedText(article.lede, 'sv'),
      ...article.sections.map(buildEbookSectionNarrationText),
    ].join(' '),
  );
}
