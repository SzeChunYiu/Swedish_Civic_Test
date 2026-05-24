function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectedRulesBlockForValidator(source, functionName) {
  const functionMatch = new RegExp(`function\\s+${escapeRegExp(functionName)}\\s*\\(`).exec(source);
  if (!functionMatch) {
    throw new Error(`${functionName} function not found`);
  }

  const expectedRulesStart = source.indexOf('const expectedRules = [', functionMatch.index);
  if (expectedRulesStart < 0) {
    throw new Error(`${functionName} expectedRules array not found`);
  }

  const expectedRulesEnd = source.indexOf('\n  ];', expectedRulesStart);
  if (expectedRulesEnd < 0) {
    throw new Error(`${functionName} expectedRules array end not found`);
  }

  return source.slice(expectedRulesStart, expectedRulesEnd);
}

function expectedRuleLabelsForValidator(source, functionName) {
  const rulesBlock = expectedRulesBlockForValidator(source, functionName);
  return Array.from(rulesBlock.matchAll(/(?:^|[{,]\s*)label:\s*'([^']+)'/gm), (match) => match[1]);
}

function expectedRuleCountForValidator(source, functionName) {
  return expectedRuleLabelsForValidator(source, functionName).length;
}

module.exports = {
  expectedRuleCountForValidator,
  expectedRuleLabelsForValidator,
};
