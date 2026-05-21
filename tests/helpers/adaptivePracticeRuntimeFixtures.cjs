const MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES = Object.freeze([
  Object.freeze({ label: 'NaN', size: Number.NaN }),
  Object.freeze({ label: 'Infinity', size: Number.POSITIVE_INFINITY }),
  Object.freeze({ label: 'negative', size: -1 }),
  Object.freeze({ label: 'fractional', size: 2.5 }),
  Object.freeze({ label: 'numeric string', size: '2' }),
]);

const MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES = Object.freeze([
  Object.freeze({ label: 'invalid string difficulty', difficulty: 'expert' }),
  Object.freeze({ label: 'null difficulty', difficulty: null }),
  Object.freeze({
    label: 'object difficulty',
    difficulty: Object.freeze({ level: 'expert' }),
  }),
]);

module.exports = {
  MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES,
  MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES,
};
