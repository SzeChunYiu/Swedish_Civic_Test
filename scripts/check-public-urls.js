#!/usr/bin/env node

const { setTimeout: delay } = require('node:timers/promises');

const TIMEOUT_MS = Number(process.env.PUBLIC_URL_CHECK_TIMEOUT_MS || 10000);

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    await response.arrayBuffer();
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
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

async function checkUrls(urls) {
  const results = [];
  for (const url of urls) {
    results.push(await checkUrl(url));
    await delay(25);
  }
  return results;
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('Usage: node scripts/check-public-urls.js <url> [url...]');
    process.exit(2);
  }

  const results = await checkUrls(urls);
  for (const result of results) {
    const status = result.ok ? 'OK' : 'FAILED';
    const details =
      result.status == null ? result.error || 'request failed' : `HTTP ${result.status}`;
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

module.exports = { checkUrl, checkUrls };
