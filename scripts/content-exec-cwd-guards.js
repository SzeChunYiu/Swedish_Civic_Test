const PINNED_REPO_ROOT_CWD_PATTERN = /\bcwd\s*:\s*repoRoot\b/;
const VALIDATE_CONTENT_EXEC_PATTERN =
  /execFileSync\(\s*process\.execPath,\s*\[\s*(['"])scripts\/validate-content\.js\1\s*\],\s*\{(?<options>[\s\S]*?)\}\s*\)/g;
const EXPORT_QUESTION_BANK_EXEC_PATTERN =
  /execFileSync\(\s*process\.execPath\s*,\s*\[[\s\S]*?['"]scripts\/export-question-bank\.js['"][\s\S]*?\]\s*,\s*\{(?<options>[\s\S]*?)\}\s*\)/g;

function collectExecFileSyncCalls(sourceText, callPattern) {
  const calls = [];
  let match;
  callPattern.lastIndex = 0;
  while ((match = callPattern.exec(sourceText)) !== null) {
    const optionsSource = match.groups?.options || '';
    calls.push({
      index: match.index,
      hasPinnedCwd: PINNED_REPO_ROOT_CWD_PATTERN.test(optionsSource),
    });
  }
  return calls;
}

function collectValidateContentExecFileSyncCalls(sourceText) {
  return collectExecFileSyncCalls(sourceText, VALIDATE_CONTENT_EXEC_PATTERN);
}

function collectExportQuestionBankExecFileSyncCalls(sourceText) {
  return collectExecFileSyncCalls(sourceText, EXPORT_QUESTION_BANK_EXEC_PATTERN);
}

function summarizePinnedCwdCalls(calls) {
  const pinned = calls.filter((call) => call.hasPinnedCwd).length;
  return {
    total: calls.length,
    pinned,
    parity: calls.length > 0 && pinned === calls.length,
  };
}

function sourceLineNumberForIndex(sourceText, index) {
  return sourceText.slice(0, index).split('\n').length;
}

module.exports = {
  collectExportQuestionBankExecFileSyncCalls,
  collectValidateContentExecFileSyncCalls,
  sourceLineNumberForIndex,
  summarizePinnedCwdCalls,
};
