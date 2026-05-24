const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function functionBody(source, functionName) {
  const functionStart = source.indexOf(`function ${functionName}(`);
  if (functionStart === -1) {
    throw new Error(`focused validator function ${functionName} was not found`);
  }

  const bodyStart = source.indexOf('{', functionStart);
  if (bodyStart === -1) {
    throw new Error(`focused validator function ${functionName} has no body`);
  }

  const nextTopLevelFunction = source.indexOf('\nfunction ', bodyStart + 1);
  if (nextTopLevelFunction !== -1) {
    const bodyEnd = source.lastIndexOf('\n}', nextTopLevelFunction);
    if (bodyEnd > bodyStart) return source.slice(bodyStart + 1, bodyEnd);
  }

  throw new Error(`focused validator function ${functionName} body boundary was not found`);
}

function expectedRulesArraySource(functionSource, functionName) {
  const rulesStart = functionSource.indexOf('const expectedRules = [');
  if (rulesStart === -1) {
    throw new Error(`${functionName} does not define const expectedRules`);
  }

  const arrayStart = functionSource.indexOf('[', rulesStart);
  let depth = 0;
  for (let index = arrayStart; index < functionSource.length; index += 1) {
    const char = functionSource[index];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) return functionSource.slice(arrayStart, index + 1);
  }

  throw new Error(`${functionName} expectedRules array was not closed`);
}

function deriveFocusedValidatorExpectedRuleCount(functionName, options = {}) {
  const validatorPath = options.validatorPath || path.join(repoRoot, 'scripts/validate-content.js');
  const source = fs.readFileSync(validatorPath, 'utf8');
  const body = functionBody(source, functionName);
  const rulesSource = expectedRulesArraySource(body, functionName);
  const labels = rulesSource
    .split(/\r?\n/)
    .filter((line) => /^\s*label\s*:/.test(line) || /^\s*\{\s*label\s*:/.test(line));
  if (labels.length === 0) {
    throw new Error(`${functionName} expectedRules has no labelled rules`);
  }
  return labels.length;
}

module.exports = {
  deriveFocusedValidatorExpectedRuleCount,
};
