const DEFAULT_REF_NAME = 'purchaseActionInFlightRef';
const keyboardSpecCases = {
  premiumBannerBuy: {
    callKey: 'removeAds.buy',
    key: 'Enter',
    title: 'PremiumBanner buy suppresses rapid Enter keyboard purchase in-flight calls',
  },
  premiumBannerRestore: {
    callKey: 'removeAds.restore',
    key: 'Space',
    title: 'PremiumBanner restore suppresses rapid Space keyboard purchase in-flight calls',
  },
  proPaywallBuy: {
    callKey: 'proLifetime.buy',
    key: 'Enter',
    title: 'ProPaywall buy suppresses rapid Enter keyboard purchase in-flight calls',
  },
  proPaywallRestore: {
    callKey: 'proLifetime.restore',
    key: 'Space',
    title: 'ProPaywall restore suppresses rapid Space keyboard purchase in-flight calls',
  },
};

function firstIndexOf(source, patterns, startIndex) {
  return patterns.reduce((firstIndex, pattern) => {
    const index = source.indexOf(pattern, startIndex);
    if (index === -1) return firstIndex;
    return firstIndex === -1 ? index : Math.min(firstIndex, index);
  }, -1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTestBlock(source, title) {
  const start = source.indexOf(`test('${title}'`);
  if (start === -1) return '';
  const next = source.indexOf('\ntest(', start + 1);
  return source.slice(start, next === -1 ? source.length : next);
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

function validatePurchaseInflightKeyboardSpecGuard(source, options = {}) {
  const selectedCases = options.cases ?? Object.keys(keyboardSpecCases);
  const surfaceName = options.surfaceName ?? 'purchase-inflight E2E spec';
  const keyboardHelper = source.slice(
    source.indexOf('async function dispatchRapidKeyboardActivations'),
    source.indexOf('async function purchaseCallCount'),
  );

  if (!keyboardHelper.includes('await page.keyboard.press(key);')) {
    return {
      message: `${surfaceName} must use real Playwright keyboard input`,
      valid: false,
    };
  }
  if ((keyboardHelper.match(/await page\.keyboard\.press\(key\);/g) || []).length !== 2) {
    return {
      message: `${surfaceName} must press the selected keyboard key twice rapidly`,
      valid: false,
    };
  }
  if (/KeyboardEvent|dispatchEvent\([^)]*key/i.test(keyboardHelper)) {
    return {
      message: `${surfaceName} must not replace Playwright keyboard input with synthetic keyboard events`,
      valid: false,
    };
  }
  if (!/toBe\(1\)/.test(source.slice(source.indexOf('async function expectSingleStoreCall')))) {
    return {
      message: `${surfaceName} must assert the mock store-call counter is exactly one`,
      valid: false,
    };
  }

  for (const caseName of selectedCases) {
    const specCase = keyboardSpecCases[caseName];
    if (!specCase) {
      return {
        message: `${surfaceName} has unknown keyboard guard case ${caseName}`,
        valid: false,
      };
    }
    const block = findTestBlock(source, specCase.title);
    if (!block) {
      return { message: `${surfaceName} is missing ${specCase.title}`, valid: false };
    }
    const activationPattern = new RegExp(
      `dispatchRapidKeyboardActivations\\(\\s*page,\\s*\\w+Button,\\s*'${escapeRegExp(
        specCase.key,
      )}'\\s*\\)`,
    );
    if (!activationPattern.test(block)) {
      return {
        message: `${surfaceName} must activate ${specCase.title} with ${specCase.key}`,
        valid: false,
      };
    }
    const callPattern = new RegExp(
      `expectSingleStoreCall\\(\\s*page,\\s*'${escapeRegExp(specCase.callKey)}'\\s*\\)`,
      'g',
    );
    const callAssertions = block.match(callPattern) || [];
    if (callAssertions.length !== 2) {
      return {
        message: `${surfaceName} must assert ${specCase.callKey} stays exactly one before and after completion`,
        valid: false,
      };
    }
  }

  return { message: '', valid: true };
}

function assertPurchaseActionInFlightGuard(source, options) {
  const result = validatePurchaseActionInFlightGuard(source, options);
  if (!result.valid) throw new Error(result.message);
}

function assertPurchaseInflightKeyboardSpecGuard(source, options) {
  const result = validatePurchaseInflightKeyboardSpecGuard(source, options);
  if (!result.valid) throw new Error(result.message);
}

module.exports = {
  assertPurchaseActionInFlightGuard,
  assertPurchaseInflightKeyboardSpecGuard,
  validatePurchaseActionInFlightGuard,
  validatePurchaseInflightKeyboardSpecGuard,
};
