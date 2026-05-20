const fs = require('node:fs');
const { chromium } = require('@playwright/test');

const SYSTEM_CHROMIUM_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value || ''));
}

function isCiEnvironment(env = process.env) {
  return isTruthy(env.CI) || isTruthy(env.GITHUB_ACTIONS);
}

function bundledChromiumPath() {
  try {
    return chromium.executablePath();
  } catch {
    return '';
  }
}

function resolveStaticChromiumExecutablePath({
  bundledPath = bundledChromiumPath(),
  env = process.env,
  fileExists = fs.existsSync,
  systemCandidates = SYSTEM_CHROMIUM_CANDIDATES,
} = {}) {
  if (env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return fileExists(env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
      ? env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      : '';
  }

  const systemExecutable = systemCandidates.find((candidate) => fileExists(candidate));
  if (systemExecutable) return systemExecutable;

  return bundledPath && fileExists(bundledPath) ? bundledPath : '';
}

function staticChromiumUnavailableMessage(testLabel) {
  return [
    `Chromium is unavailable for ${testLabel}.`,
    'Install it with `npx playwright install --with-deps chromium`',
    'or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a supported Chromium executable.',
  ].join(' ');
}

async function launchStaticChromium(testContext, testLabel) {
  const executablePath = resolveStaticChromiumExecutablePath();

  if (!executablePath) {
    const message = staticChromiumUnavailableMessage(testLabel);
    if (isCiEnvironment()) {
      throw new Error(`CI static browser check must run. ${message}`);
    }
    testContext.skip(message);
    return null;
  }

  return chromium.launch({ executablePath });
}

module.exports = {
  isCiEnvironment,
  launchStaticChromium,
  resolveStaticChromiumExecutablePath,
  staticChromiumUnavailableMessage,
};
