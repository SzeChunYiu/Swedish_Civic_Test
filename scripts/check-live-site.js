#!/usr/bin/env node

const vm = require('node:vm');

const REQUIRED_QUESTION_COUNT = Number(process.env.SITE_LIVE_REQUIRED_QUESTION_COUNT || 705);
const TIMEOUT_MS = Number(process.env.SITE_LIVE_TIMEOUT_MS || 15000);

function normalizeBaseUrl(input) {
  const raw = String(input || process.env.SITE_LIVE_URL || '').trim();
  if (!raw) {
    throw new Error('Usage: SITE_LIVE_URL=https://... npm run test:site-live');
  }
  const url = new URL(raw);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchText(baseUrl, assetPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${baseUrl}/${assetPath.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function readStaticQuestionCount(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  const questions = sandbox.window.SMT_QUESTIONS;
  if (!Array.isArray(questions)) return 0;
  return questions.length;
}

function pass(name, details = '') {
  return { name, ok: true, details };
}

function fail(name, details) {
  return { name, ok: false, details };
}

function containsAll(source, needles) {
  return needles.every((needle) => source.includes(needle));
}

async function checkLiveSite(inputUrl) {
  const baseUrl = normalizeBaseUrl(inputUrl);
  const [index, practice, ebook, questions] = await Promise.all([
    fetchText(baseUrl, 'index.html'),
    fetchText(baseUrl, 'practice.js'),
    fetchText(baseUrl, 'ebook.js'),
    fetchText(baseUrl, 'questions.js'),
  ]);

  const questionCount = readStaticQuestionCount(questions);
  const checks = [];

  checks.push(
    questionCount === REQUIRED_QUESTION_COUNT
      ? pass('static question bank', `${questionCount} questions`)
      : fail('static question bank', `expected ${REQUIRED_QUESTION_COUNT}, found ${questionCount}`),
  );

  checks.push(
    containsAll(index, [
      'data-page="/practice"',
      'id="quiz-stage"',
      'questions.js',
      'practice.js',
    ]) && containsAll(practice, ['hub__grid', 'hub__card', 'href="#/mock"'])
      ? pass('practice hub assets')
      : fail('practice hub assets', 'missing current Practice route, script, or hub markup'),
  );

  checks.push(
    containsAll(index, ['data-page="/mock"', 'id="mock-stage"']) &&
      containsAll(practice, ['renderMockLanding', 'renderMockExam', 'renderMockResult'])
      ? pass('mock exam route assets')
      : fail('mock exam route assets', 'missing #/mock shell or mock exam renderer'),
  );

  checks.push(
    containsAll(index, ['ebook-tools.js', 'ebook.js']) &&
      containsAll(ebook, ['window.smtEbookRender', 'PRACTICE_LINKS'])
      ? pass('ebook renderer assets')
      : fail('ebook renderer assets', 'missing current Ebook helper or renderer wiring'),
  );

  const staleEbookPattern = /Svenska översättningen kommer|kommer i v1\.1|friendly stubs/i;
  checks.push(
    staleEbookPattern.test(ebook)
      ? fail('ebook placeholder copy', 'found stale Swedish placeholder or v1.1 stub copy')
      : pass('ebook placeholder copy'),
  );

  return { baseUrl, ok: checks.every((check) => check.ok), checks };
}

async function main() {
  const target = process.argv[2] || process.env.SITE_LIVE_URL;
  const result = await checkLiveSite(target);
  for (const check of result.checks) {
    const status = check.ok ? 'OK' : 'FAILED';
    const details = check.details ? ` - ${check.details}` : '';
    console.log(`${status} ${check.name}${details}`);
  }
  console.log(`${result.ok ? 'READY' : 'BLOCKED'} live site ${result.baseUrl}`);
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = {
  checkLiveSite,
  normalizeBaseUrl,
  readStaticQuestionCount,
};
