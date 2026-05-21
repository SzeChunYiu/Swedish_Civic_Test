const MALFORMED_ADAPTIVE_DIFFICULTY_CASES = Object.freeze([
  Object.freeze({ label: 'invalid string difficulty', difficulty: 'expert' }),
  Object.freeze({ label: 'null difficulty', difficulty: null }),
  Object.freeze({ label: 'object difficulty', difficulty: Object.freeze({ level: 'expert' }) }),
]);

function cloneRuntimeValue(value) {
  if (!value || typeof value !== 'object') return value;
  return { ...value };
}

function createMalformedAdaptiveDifficultyCases() {
  return MALFORMED_ADAPTIVE_DIFFICULTY_CASES.map(({ difficulty, label }) => ({
    difficulty: cloneRuntimeValue(difficulty),
    label,
  }));
}

module.exports = {
  MALFORMED_ADAPTIVE_DIFFICULTY_CASES,
  createMalformedAdaptiveDifficultyCases,
};
