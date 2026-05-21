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

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function generatedQuestionIdLiteralFindingsForSource(
  relativePath,
  source,
  firstGeneratedQuestionNumber,
) {
  assert.equal(
    Number.isInteger(firstGeneratedQuestionNumber) && firstGeneratedQuestionNumber > 0,
    true,
    'first generated question number must be a positive integer',
  );

  const findings = [];
  const quotedLiteralPattern = /(['"`])(q\d{3,})\1/g;
  const unquotedObjectKeyPattern = /(?:^|[{,\s])(q\d{3,})\s*:/gm;

  for (const { label, pattern } of [
    { label: 'question id literal', pattern: quotedLiteralPattern },
    { label: 'question id object key', pattern: unquotedObjectKeyPattern },
  ]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const id = label === 'question id literal' ? match[2] : match[1];
      const numericId = Number(id.replace(/^q/, ''));
      if (numericId < firstGeneratedQuestionNumber) continue;
      const lineNumber = lineNumberForIndex(source, match.index ?? 0);
      findings.push(`${relativePath}:${lineNumber} hardcodes generated ${label} ${id}`);
    }
  }

  return findings;
}

module.exports = {
  generatedFixtureIdExpression,
  generatedFixtureIdHelperSource,
  generatedQuestionIdLiteralFindingsForSource,
  generatedQuestionId,
  generatedVariantOffsets,
};
