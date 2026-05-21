const DEFAULT_REF_NAME = 'purchaseActionInFlightRef';

function firstIndexOf(source, patterns, startIndex) {
  return patterns.reduce((firstIndex, pattern) => {
    const index = source.indexOf(pattern, startIndex);
    if (index === -1) return firstIndex;
    return firstIndex === -1 ? index : Math.min(firstIndex, index);
  }, -1);
}

function validatePurchaseActionInFlightGuard(source, options = {}) {
  const surfaceName = options.surfaceName ?? 'purchase surface';
  const refName = options.refName ?? DEFAULT_REF_NAME;
  const awaitedCalls = options.awaitedCalls ?? [];
  const declaration = `const ${refName} = useRef(false);`;
  const earlyReturn = `if (${refName}.current) return;`;
  const setTrue = `${refName}.current = true;`;
  const setFalse = `${refName}.current = false;`;

  if (!source.includes(declaration)) {
    return {
      message: `${surfaceName} must declare ${refName} with useRef(false)`,
      valid: false,
    };
  }

  const earlyReturnIndex = source.indexOf(earlyReturn);
  const setTrueIndex = source.indexOf(setTrue);
  if (earlyReturnIndex === -1 || setTrueIndex === -1 || earlyReturnIndex > setTrueIndex) {
    return {
      message: `${surfaceName} must return early from the ref-backed in-flight guard before activating it`,
      valid: false,
    };
  }

  const firstAwaitIndex = firstIndexOf(source, awaitedCalls, earlyReturnIndex);
  if (firstAwaitIndex === -1) {
    return {
      message: `${surfaceName} must include the configured awaited store call`,
      valid: false,
    };
  }

  if (setTrueIndex > firstAwaitIndex) {
    return {
      message: `${surfaceName} must set ${refName}.current before awaiting store calls`,
      valid: false,
    };
  }

  const finallyIndex = source.indexOf('finally', firstAwaitIndex);
  const resetIndex = finallyIndex === -1 ? -1 : source.indexOf(setFalse, finallyIndex);
  if (finallyIndex === -1 || resetIndex === -1) {
    return {
      message: `${surfaceName} must reset ${refName}.current inside finally`,
      valid: false,
    };
  }

  return { message: '', valid: true };
}

function assertPurchaseActionInFlightGuard(source, options) {
  const result = validatePurchaseActionInFlightGuard(source, options);
  if (!result.valid) throw new Error(result.message);
}

module.exports = {
  assertPurchaseActionInFlightGuard,
  validatePurchaseActionInFlightGuard,
};
