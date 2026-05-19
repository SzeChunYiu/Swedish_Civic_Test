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

function findSourceAuthorityStemPattern(text) {
  if (typeof text !== 'string') return undefined;
  return SOURCE_AUTHORITY_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function hasSourceAuthorityStemPattern(text) {
  return Boolean(findSourceAuthorityStemPattern(text));
}

module.exports = {
  SOURCE_AUTHORITY_STEM_PATTERNS,
  findSourceAuthorityStemPattern,
  hasSourceAuthorityStemPattern,
};
