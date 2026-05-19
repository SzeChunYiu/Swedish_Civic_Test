#!/usr/bin/env node

const fs = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const fs = require('node:fs');

const TIMEOUT_MS = Number(process.env.PUBLIC_URL_CHECK_TIMEOUT_MS || 10000);

async function checkUrl(url, expectedText = null) {
function normalizeCheck(check) {
  return typeof check === 'string' ? { url: check } : check;
}

function readAppAdsSellerLine(filePath) {
  const sellerLines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (sellerLines.length !== 1) {
    throw new Error(`${filePath} must contain exactly one non-comment seller line`);
  }

  return sellerLines[0];
}

function parseChecks(argv) {
  const checks = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--expect-app-ads-file') {
      const url = argv[++index];
      const filePath = argv[++index];
      if (!url || !filePath) {
        throw new Error('--expect-app-ads-file requires <url> <file>');
      }
      checks.push({
        expectedText: readAppAdsSellerLine(filePath),
        expectedTextLabel: filePath,
        url,
      });
    } else {
      checks.push({ url: arg });
    }
  }

  return checks;
}

async function checkUrl(check) {
  const { expectedText, expectedTextLabel, url } = normalizeCheck(check);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    const body = expectedText == null ? null : await response.text();
    if (expectedText == null) await response.arrayBuffer();
    const statusOk = response.status >= 200 && response.status < 400;
    const bodyOk = expectedText == null || body.trim() === expectedText.trim();
    const body = await response.text();
    const expectedTextMatches =
      expectedText === undefined || body.trim() === String(expectedText).trim();

    return {
      bodyMatches: expectedTextMatches,
      expectedTextLabel,
      ok: response.status >= 200 && response.status < 400 && expectedTextMatches,
      url,
      status: response.status,
      ok: statusOk && bodyOk,
      error: statusOk ? null : `HTTP ${response.status}`,
      expectedText: expectedText == null ? null : expectedText.trim(),
      actualText: expectedText == null || !statusOk || bodyOk ? null : body.trim(),
      error: expectedTextMatches ? undefined : 'response body did not match expected text',
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

async function checkUrls(urls, expectedTextByUrl = {}) {
  const results = [];
  for (const url of urls) {
    results.push(await checkUrl(url, expectedTextByUrl[url] ?? null));
  for (const check of urls) {
    results.push(await checkUrl(check));
    await delay(25);
  }
  return results;
}

function parseArgs(argv) {
  const urls = [];
  const expectedTextByUrl = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--expect-app-ads-file') {
      const url = argv[index + 1];
      const filePath = argv[index + 2];
      if (!url || !filePath) {
        throw new Error('Usage: --expect-app-ads-file <url> <local-file>');
      }
      urls.push(url);
      expectedTextByUrl[url] = fs.readFileSync(filePath, 'utf8');
      index += 2;
    } else {
      urls.push(arg);
    }
  }

  return { urls, expectedTextByUrl };
}

async function main() {
  const { urls, expectedTextByUrl } = parseArgs(process.argv.slice(2));
  if (urls.length === 0) {
    console.error(
      'Usage: node scripts/check-public-urls.js <url> [url...] [--expect-app-ads-file <url> <local-file>]',
  const checks = parseChecks(process.argv.slice(2));
  if (checks.length === 0) {
    console.error(
      'Usage: node scripts/check-public-urls.js <url> [url...] [--expect-app-ads-file <url> <file>]',
    );
    process.exit(2);
  }

  const results = await checkUrls(urls, expectedTextByUrl);
  for (const result of results) {
    const status = result.ok ? 'OK' : 'FAILED';
    const details = result.actualText
      ? `expected ${JSON.stringify(result.expectedText)}, got ${JSON.stringify(result.actualText)}`
      : result.status == null
        ? result.error || 'request failed'
        : `HTTP ${result.status}`;
  const results = await checkUrls(checks);
  for (const result of results) {
    const status = result.ok ? 'OK' : 'FAILED';
    const details =
      result.status == null
        ? result.error || 'request failed'
        : `HTTP ${result.status}${
            result.bodyMatches === false ? `; ${result.error} from ${result.expectedTextLabel}` : ''
          }`;
    console.log(`${status} ${result.url} (${details})`);
  }

  process.exit(results.every((result) => result.ok) ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = { checkUrl, checkUrls, parseArgs };
module.exports = { checkUrl, checkUrls, parseChecks, readAppAdsSellerLine };
