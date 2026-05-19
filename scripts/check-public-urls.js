#!/usr/bin/env node

const { setTimeout: delay } = require('node:timers/promises');
const fs = require('node:fs');

const TIMEOUT_MS = Number(process.env.PUBLIC_URL_CHECK_TIMEOUT_MS || 10000);

async function checkUrl(url, expectedText = null) {
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
    return {
      url,
      status: response.status,
      ok: statusOk && bodyOk,
      error: statusOk ? null : `HTTP ${response.status}`,
      expectedText: expectedText == null ? null : expectedText.trim(),
      actualText: expectedText == null || !statusOk || bodyOk ? null : body.trim(),
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
