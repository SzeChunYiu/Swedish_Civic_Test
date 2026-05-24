const assert = require('node:assert/strict');
const ts = require('typescript');

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

function q167StatedSourceFixture(sourceQuestions) {
  const sourceId = 'q167';
  const ids = {
    source: sourceId,
    singleChoice: generatedQuestionId(sourceQuestions, sourceId, 'singleChoice'),
    trueStatement: generatedQuestionId(sourceQuestions, sourceId, 'trueStatement'),
    falseStatement: generatedQuestionId(sourceQuestions, sourceId, 'falseStatement'),
    judgement: generatedQuestionId(sourceQuestions, sourceId, 'judgement'),
  };
  const source = {
    title: 'Sverige i fokus',
    chapter: 'Politiska val och partier',
    section: 'Så här går det till att rösta',
    page: 14,
  };
  const uhrReference = {
    chapter: 'Politiska val och partier',
    section: 'Så här går det till att rösta',
    pageApprox: 14,
  };
  const commonExplanation = {
    sv: 'Röstkortet visar vilken vallokal väljaren ska gå till. Det går också att rösta i förväg på särskilda platser, och i vallokalen finns valsedlar till de olika partierna.',
    en: 'The voting card shows which polling station the voter should go to. It is also possible to vote in advance at special places, and polling stations have ballot papers for the different parties.',
  };

  return {
    sourceId,
    ids,
    generatedIds: [ids.singleChoice, ids.trueStatement, ids.falseStatement, ids.judgement],
    allIds: [ids.source, ids.singleChoice, ids.trueStatement, ids.falseStatement, ids.judgement],
    source,
    uhrReference,
    expectedRows: {
      [ids.source]: {
        q: {
          sv: 'Vad står på röstkortet som skickas hem före valet?',
          en: 'What is stated on the voting card sent home before an election?',
        },
        why: commonExplanation,
        questionProvenance: 'uhr',
      },
      [ids.singleChoice]: {
        q: {
          sv: 'Vad stämmer om röstkortet som skickas hem före valets innehåll?',
          en: "What is correct about the voting card sent home before an election's contents?",
        },
        why: commonExplanation,
        questionProvenance: 'derived',
      },
      [ids.trueStatement]: {
        q: {
          sv: 'Röstkortet visar vilken vallokal väljaren ska gå till.',
          en: 'The voting card shows which polling station the voter should go to.',
        },
        why: commonExplanation,
        questionProvenance: 'derived',
      },
      [ids.falseStatement]: {
        q: {
          sv: 'Röstkortet visar vilket parti väljaren måste rösta på.',
          en: 'The voting card shows which party the voter must vote for.',
        },
        why: commonExplanation,
        questionProvenance: 'derived',
      },
      [ids.judgement]: {
        q: {
          sv: 'Vilken uppgift stämmer om röstkortet som skickas hem före valets innehåll?',
          en: "Which fact is correct about the voting card sent home before an election's contents?",
        },
        why: commonExplanation,
        questionProvenance: 'derived',
      },
    },
  };
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

function generatedExpectedRowsKeyFindingsForSource(relativePath, source) {
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const findings = [];

  function lineNumberForNode(node) {
    return lineNumberForIndex(source, node.getStart(sourceFile));
  }

  function propertyKeyLabel(propertyName) {
    if (ts.isIdentifier(propertyName)) return propertyName.text;
    if (ts.isStringLiteral(propertyName) || ts.isNoSubstitutionTemplateLiteral(propertyName)) {
      return propertyName.text;
    }
    return null;
  }

  function isGeneratedQuestionIdKey(propertyName) {
    return (
      ts.isComputedPropertyName(propertyName) &&
      ts.isCallExpression(propertyName.expression) &&
      ts.isIdentifier(propertyName.expression.expression) &&
      propertyName.expression.expression.text === 'generatedQuestionId'
    );
  }

  function inspectExpectedRowsMap(node) {
    for (const property of node.initializer.properties) {
      if (ts.isSpreadAssignment(property)) {
        findings.push(
          `${relativePath}:${lineNumberForNode(property)} uses spread in generated expectedRows map`,
        );
        continue;
      }
      const propertyName = property.name;
      if (!propertyName) continue;
      if (isGeneratedQuestionIdKey(propertyName)) continue;

      const literalKey = propertyKeyLabel(propertyName);
      const lineNumber = lineNumberForNode(propertyName);
      if (literalKey && /^q\d{3,}$/.test(literalKey)) {
        findings.push(
          `${relativePath}:${lineNumber} hardcodes generated expectedRows map key ${literalKey}`,
        );
        continue;
      }

      if (ts.isComputedPropertyName(propertyName)) {
        findings.push(
          `${relativePath}:${lineNumber} uses a generated expectedRows map key without generatedQuestionId(...)`,
        );
      }
    }
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'expectedRows' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      inspectExpectedRowsMap(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

module.exports = {
  generatedExpectedRowsKeyFindingsForSource,
  generatedFixtureIdExpression,
  generatedFixtureIdHelperSource,
  generatedQuestionIdLiteralFindingsForSource,
  generatedQuestionId,
  generatedVariantOffsets,
  q167StatedSourceFixture,
};
