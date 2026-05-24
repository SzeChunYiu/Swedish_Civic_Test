const assert = require('node:assert/strict');

function extractFunctionSource(source, functionName) {
  const signature = `function ${functionName}(`;
  const signatureStart = source.indexOf(signature);
  assert.notEqual(signatureStart, -1, `${functionName} should be defined`);

  const nextFunctionStart = source.indexOf('\nfunction ', signatureStart + signature.length);
  return source.slice(signatureStart, nextFunctionStart === -1 ? undefined : nextFunctionStart);
}

function countExpectedRulesForValidator(source, functionName, constName = 'expectedRules') {
  const functionSource = extractFunctionSource(source, functionName);
  const rulesMatch = new RegExp(
    `const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\n\\s*\\];\\n\\s*${constName}\\.forEach`,
  ).exec(functionSource);
  assert.ok(rulesMatch, `${functionName} should iterate over ${constName}`);

  const rulesLiteral = rulesMatch[1];
  const ruleEntries = rulesLiteral.match(/\{\s*label:/g) ?? [];
  assert.ok(ruleEntries.length > 0, `${functionName} should define one or more ${constName}`);
  return ruleEntries.length;
}

module.exports = {
  countExpectedRulesForValidator,
};
