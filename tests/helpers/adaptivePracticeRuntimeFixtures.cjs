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
};
