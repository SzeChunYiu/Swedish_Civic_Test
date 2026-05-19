'use strict';

const SOURCE_AUTHORITY_STEM_PATTERNS = Object.freeze([
  /\benligt\s+UHR\b/i,
  /\bUHR[\s-]?(?:materialet|avsnittet)\b/i,
  /\bUHR:s\s+material\b/i,
  /\baccording to\s+(?:the\s+)?UHR\b/i,
  /\b(?:the\s+)?UHR\s+(?:material|section)\b/i,
  /\bst(?:ä|a)mmer\s+b(?:ä|a)st\s+enligt\s+UHR\b/i,
  /\bbest\s+matches\s+(?:the\s+)?UHR\s+section\b/i,
]);

const SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES = Object.freeze([
  Object.freeze({
    label: 'sv-enligt-uhr',
    patternIndex: 0,
    column: 'questionSv',
    text: 'Enligt UHR ska källan bara visas i källraden.',
  }),
  Object.freeze({
    label: 'sv-uhr-materialet',
    patternIndex: 1,
    column: 'questionSv',
    text: 'Vilken uppgift finns i UHR-materialet?',
  }),
  Object.freeze({
    label: 'sv-uhrs-material',
    patternIndex: 2,
    column: 'questionSv',
    text: 'Vad säger UHR:s material om rösträtt?',
  }),
  Object.freeze({
    label: 'en-according-to-uhr',
    patternIndex: 3,
    column: 'questionEn',
    text: 'According to UHR, where should the source appear?',
  }),
  Object.freeze({
    label: 'en-uhr-section',
    patternIndex: 4,
    column: 'questionEn',
    text: 'Which claim appears in the UHR section?',
  }),
  Object.freeze({
    label: 'sv-best-match-uhr',
    patternIndex: 5,
    column: 'questionSv',
    text: 'Vilket svar stämmer bäst enligt UHR?',
  }),
  Object.freeze({
    label: 'en-best-match-uhr',
    patternIndex: 6,
    column: 'questionEn',
    text: 'Which answer best matches the UHR section?',
  }),
]);

function findSourceAuthorityStemPattern(text) {
  if (typeof text !== 'string') return undefined;
  return SOURCE_AUTHORITY_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function hasSourceAuthorityStemPattern(text) {
  return Boolean(findSourceAuthorityStemPattern(text));
}

module.exports = {
  SOURCE_AUTHORITY_STEM_PATTERNS,
  SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES,
  findSourceAuthorityStemPattern,
  hasSourceAuthorityStemPattern,
};
