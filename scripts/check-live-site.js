#!/usr/bin/env node

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const TIMEOUT_MS = Number(process.env.SITE_LIVE_TIMEOUT_MS || 15000);
const LOCAL_SITE_QUESTIONS_PATH = path.join(__dirname, '..', 'site', 'questions.js');
const STATIC_HEAD_METADATA_OUTCOME_PATTERNS = [
  {
    label: 'Study, fika, pass',
    pattern: /\bstudy\s*,\s*fika\s*,\s*pass\.?\b/i,
  },
  {
    label: 'pass-outcome wording',
    pattern: /\b(?:pass(?:\s+the\s+(?:test|exam))?|passed|passing)\b/i,
  },
  {
    label: 'passport-outcome wording',
    pattern: /\b(?:earn|get|få|ta)\s+(?:the\s+)?(?:passport|passet)\b/i,
  },
  {
    label: 'guaranteed result wording',
    pattern: /\bguarantee(?:d|s)?\b[\s\S]{0,80}\bpass\b/i,
  },
];

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

function hashStaticQuestionBank(source) {
  return crypto.createHash('sha256').update(String(source).replace(/\r\n/g, '\n')).digest('hex');
}

function resolveRequiredQuestionCount(options = {}) {
  if (Number.isInteger(options.requiredQuestionCount)) return options.requiredQuestionCount;

  if (process.env.SITE_LIVE_REQUIRED_QUESTION_COUNT) {
    const fromEnv = Number(process.env.SITE_LIVE_REQUIRED_QUESTION_COUNT);
    if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv;
    throw new Error('SITE_LIVE_REQUIRED_QUESTION_COUNT must be a positive integer');
  }

  if (!fs.existsSync(LOCAL_SITE_QUESTIONS_PATH)) {
    throw new Error(
      'Cannot derive expected live question count; set SITE_LIVE_REQUIRED_QUESTION_COUNT',
    );
  }

  const fromLocalSite = readStaticQuestionCount(fs.readFileSync(LOCAL_SITE_QUESTIONS_PATH, 'utf8'));
  if (fromLocalSite <= 0) {
    throw new Error('Cannot derive expected live question count from site/questions.js');
  }
  return fromLocalSite;
}

function resolveRequiredQuestionBankHash(options = {}) {
  if (typeof options.requiredQuestionBankHash === 'string' && options.requiredQuestionBankHash) {
    return options.requiredQuestionBankHash.toLowerCase();
  }

  if (process.env.SITE_LIVE_REQUIRED_QUESTION_HASH) {
    const fromEnv = process.env.SITE_LIVE_REQUIRED_QUESTION_HASH.trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(fromEnv)) return fromEnv;
    throw new Error('SITE_LIVE_REQUIRED_QUESTION_HASH must be a 64-character SHA-256 hex digest');
  }

  if (!fs.existsSync(LOCAL_SITE_QUESTIONS_PATH)) {
    throw new Error(
      'Cannot derive expected live question hash; set SITE_LIVE_REQUIRED_QUESTION_HASH',
    );
  }

  return hashStaticQuestionBank(fs.readFileSync(LOCAL_SITE_QUESTIONS_PATH, 'utf8'));
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

function decodeHtmlText(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStaticHeadMetadata(indexHtml) {
  const head = String(indexHtml).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const title = decodeHtmlText(
    head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '') ?? '',
  );
  const descriptions = Array.from(
    head.matchAll(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/gi),
    (match) => decodeHtmlText(match[1]),
  );

  return {
    head,
    title,
    descriptions,
    surface: [title, ...descriptions].filter(Boolean).join('\n'),
  };
}

function validateStaticHeadMetadata(indexHtml) {
  const metadata = extractStaticHeadMetadata(indexHtml);
  const failures = [];
  let titleValidated = false;
  let outcomeClaimPatternsValidated = 0;

  if (!metadata.title) {
    failures.push('missing <title>');
  } else {
    const titleFailures = [];
    if (!/^Almost Swedish\b/.test(metadata.title)) {
      titleFailures.push('title must start with Almost Swedish');
    }
    if (!/\b(?:study|practice|studera|öva|träna)\b/i.test(metadata.title)) {
      titleFailures.push('title must describe study or practice');
    }
    failures.push(...titleFailures);
    titleValidated = titleFailures.length === 0;
  }

  for (const { label, pattern } of STATIC_HEAD_METADATA_OUTCOME_PATTERNS) {
    if (pattern.test(metadata.surface)) {
      failures.push(`metadata contains ${label}`);
    } else {
      outcomeClaimPatternsValidated += 1;
    }
  }

  return {
    ...metadata,
    ok: failures.length === 0,
    details: failures.join('; '),
    failures,
    outcomeClaimPatternsTotal: STATIC_HEAD_METADATA_OUTCOME_PATTERNS.length,
    outcomeClaimPatternsValidated,
    titleValidated,
  };
}

async function checkLiveSite(inputUrl, options = {}) {
  const baseUrl = normalizeBaseUrl(inputUrl);
  const requiredQuestionCount = resolveRequiredQuestionCount(options);
  const requiredQuestionBankHash = resolveRequiredQuestionBankHash(options);
  const [index, styles, practice, ebook, questions] = await Promise.all([
    fetchText(baseUrl, 'index.html'),
    fetchText(baseUrl, 'styles.css'),
    fetchText(baseUrl, 'practice.js'),
    fetchText(baseUrl, 'ebook.js'),
    fetchText(baseUrl, 'questions.js'),
  ]);

  const questionCount = readStaticQuestionCount(questions);
  const questionBankHash = hashStaticQuestionBank(questions);
  const checks = [];

  checks.push(
    questionCount === requiredQuestionCount
      ? pass('static question bank', `${questionCount} questions`)
      : fail('static question bank', `expected ${requiredQuestionCount}, found ${questionCount}`),
  );

  checks.push(
    questionBankHash === requiredQuestionBankHash
      ? pass('static question bank content', questionBankHash.slice(0, 12))
      : fail(
          'static question bank content',
          `expected ${requiredQuestionBankHash.slice(0, 12)}, found ${questionBankHash.slice(
            0,
            12,
          )}`,
        ),
  );

  checks.push(
    containsAll(index, [
      'data-page="/practice"',
      'practice__inner practice__inner--wide',
      'id="quiz-stage"',
      'questions.js',
      'practice.js',
    ]) && containsAll(practice, ['hub__grid', 'hub__card', 'href="#/mock"'])
      ? pass('practice hub assets')
      : fail('practice hub assets', 'missing current Practice route, script, or hub markup'),
  );

  const staticHeadMetadata = validateStaticHeadMetadata(index);
  checks.push(
    staticHeadMetadata.ok
      ? pass('static head metadata copy', staticHeadMetadata.title)
      : fail('static head metadata copy', staticHeadMetadata.details),
  );

  checks.push(
    containsAll(styles, [
      '.practice__inner--wide',
      'max-width: 1080px',
      'grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))',
    ])
      ? pass('practice wide layout')
      : fail('practice wide layout', 'missing wide Practice shell or responsive hub grid CSS'),
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
  hashStaticQuestionBank,
  extractStaticHeadMetadata,
  normalizeBaseUrl,
  readStaticQuestionCount,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
  validateStaticHeadMetadata,
};
