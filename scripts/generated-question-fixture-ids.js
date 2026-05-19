const assert = require('node:assert/strict');

const generatedVariantOffsets = Object.freeze({
  singleChoice: 0,
  trueStatement: 1,
  falseStatement: 2,
  judgement: 3,
});

function nextQuestionId(questionNumberValue) {
  return `q${String(questionNumberValue).padStart(3, '0')}`;
}

function generatedVariantOffset(variant) {
  if (typeof variant === 'number') return variant;
  const offset = generatedVariantOffsets[variant];
  assert.notEqual(offset, undefined, `unknown generated variant fixture "${variant}"`);
  return offset;
}

function generatedQuestionId(sourceQuestions, sourceQuestionId, variant) {
  const sourceIndex = sourceQuestions.findIndex((question) => question.id === sourceQuestionId);
  assert.notEqual(sourceIndex, -1, `missing generated fixture source ${sourceQuestionId}`);
  return nextQuestionId(
    sourceQuestions.length + 1 + sourceIndex * 4 + generatedVariantOffset(variant),
  );
}

function generatedFixtureIdExpression(
  sourceQuestionId,
  variant,
  functionName = 'generatedFixtureId',
) {
  return `${functionName}('${sourceQuestionId}', ${generatedVariantOffset(variant)})`;
}

function generatedFixtureIdHelperSource(functionName = 'generatedFixtureId') {
  return [
    `const ${functionName} = (sourceId, variantOffset) => {`,
    '  const sourceIndex = sourceQuestions.findIndex((sourceQuestion) => sourceQuestion.id === sourceId);',
    "  if (sourceIndex < 0) throw new Error('Missing generated fixture source ' + sourceId);",
    "  return 'q' + String(sourceQuestions.length + 1 + sourceIndex * 4 + variantOffset).padStart(3, '0');",
    '};',
  ].join('\n');
}

module.exports = {
  generatedFixtureIdExpression,
  generatedFixtureIdHelperSource,
  generatedQuestionId,
  generatedVariantOffsets,
};
