#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const TIMEOUT_MS = Number(process.env.PUBLIC_URL_CHECK_TIMEOUT_MS || 10000);

async function checkUrl(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    const body = options.includeBody ? await response.text() : null;
    if (!options.includeBody) {
      await response.arrayBuffer();
    }
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      ...(options.includeBody ? { body } : {}),
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function firstSellerLine(contents) {
  return String(contents)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#'));
}

function parseArgs(argv) {
  const urls = [];
  let appAdsExpectation = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--expect-app-ads-file') {
      const hostedUrl = argv[index + 1];
      const localFile = argv[index + 2];
      if (!hostedUrl || !localFile) {
        throw new Error('--expect-app-ads-file requires <hosted-url> <local-file>');
      }
      appAdsExpectation = { hostedUrl, localFile };
      index += 2;
      continue;
    }
    if (token.startsWith('--')) {
      throw new Error(`Unknown option: ${token}`);
    }
    urls.push(token);
  }

  return { urls, appAdsExpectation };
}

async function checkUrls(urls) {
  const results = [];
  for (const url of urls) {
    results.push(await checkUrl(url));
    await delay(25);
  }
  return results;
}

async function checkAppAdsFile(expectation) {
  const localPath = path.resolve(process.cwd(), expectation.localFile);
  let localContents;
  try {
    localContents = fs.readFileSync(localPath, 'utf8');
  } catch (error) {
    return {
      url: expectation.hostedUrl,
      status: null,
      ok: false,
      error: `Could not read local app-ads file ${expectation.localFile}: ${error.message}`,
    };
  }

  const localSellerLine = firstSellerLine(localContents);
  if (!localSellerLine) {
    return {
      url: expectation.hostedUrl,
      status: null,
      ok: false,
      error: `Local app-ads file ${expectation.localFile} has no seller line`,
    };
  }

  const hostedResult = await checkUrl(expectation.hostedUrl, { includeBody: true });
  if (!hostedResult.ok) return hostedResult;

  const hostedSellerLine = firstSellerLine(hostedResult.body);
  if (!hostedSellerLine) {
    return {
      ...hostedResult,
      ok: false,
      error: 'Hosted app-ads file has no seller line',
    };
  }
  if (hostedSellerLine !== localSellerLine) {
    return {
      ...hostedResult,
      ok: false,
      error: `Hosted app-ads seller line mismatch: expected "${localSellerLine}", got "${hostedSellerLine}"`,
    };
  }

  return {
    ...hostedResult,
    appAdsFile: expectation.localFile,
    sellerLine: hostedSellerLine,
  };
}

async function checkPublicUrls(argv) {
  const { urls, appAdsExpectation } = Array.isArray(argv) ? parseArgs(argv) : argv;
  const results = await checkUrls(urls);
  if (appAdsExpectation) {
    results.push(await checkAppAdsFile(appAdsExpectation));
  }
  return results;
}

function formatResult(result) {
  const status = result.ok ? 'OK' : 'FAILED';
  const details =
    result.status == null ? result.error || 'request failed' : `HTTP ${result.status}`;
  const suffix = result.appAdsFile
    ? `; app-ads seller line matches ${result.appAdsFile}`
    : result.error
      ? `; ${result.error}`
      : '';
  return `${status} ${result.url} (${details}${suffix})`;
}

async function main() {
  const usage =
    'Usage: node scripts/check-public-urls.js <url> [url...] [--expect-app-ads-file <hosted-url> <local-file>]';
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage);
    process.exit(2);
  }

  if (parsed.urls.length === 0 && !parsed.appAdsExpectation) {
    console.error(usage);
    process.exit(2);
  }

  const results = await checkPublicUrls(parsed);
  for (const result of results) {
    console.log(formatResult(result));
  }

  process.exit(results.every((result) => result.ok) ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = {
  checkAppAdsFile,
  checkPublicUrls,
  checkUrl,
  checkUrls,
  firstSellerLine,
  formatResult,
  parseArgs,
};
