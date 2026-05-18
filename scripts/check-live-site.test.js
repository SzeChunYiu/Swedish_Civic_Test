const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const {
  checkLiveSite,
  normalizeBaseUrl,
  readStaticQuestionCount,
  resolveRequiredQuestionCount,
} = require('./check-live-site');

function generatedQuestions(count) {
  const questions = Array.from({ length: count }, (_, index) => ({ id: `q${index + 1}` }));
  return [
    '(function () {',
    '  "use strict";',
    `  window.SMT_QUESTIONS = ${JSON.stringify(questions)};`,
    '})();',
    '',
  ].join('\n');
}

function currentAssets() {
  return {
    '/index.html': [
      '<main data-page="/practice"><div id="quiz-stage"></div></main>',
      '<main data-page="/mock"><div id="mock-stage"></div></main>',
      '<script src="questions.js"></script>',
      '<script src="practice.js"></script>',
      '<script src="ebook-tools.js"></script>',
      '<script src="ebook.js"></script>',
    ].join('\n'),
    '/practice.js': [
      'function renderPracticeHub(){ return `<a class="hub__card" href="#/mock">hub__grid</a>`; }',
      'function renderMockLanding(){}',
      'function renderMockExam(){}',
      'function renderMockResult(){}',
    ].join('\n'),
    '/ebook.js': 'const PRACTICE_LINKS = {}; window.smtEbookRender = function render() {};',
    '/questions.js': generatedQuestions(705),
  };
}

function staleAssets() {
  return {
    '/index.html': '<main data-page="/"><div id="hero"></div></main>',
    '/practice.js': 'function renderPractice(){ return "old"; }',
    '/ebook.js': 'const copy = "Svenska översättningen kommer i v1.1";',
    '/questions.js': generatedQuestions(57),
  };
}

async function withStaticServer(assets, callback) {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const body = assets[pathname] ?? assets['/index.html'];
    response.writeHead(body == null ? 404 : 200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(body ?? 'not found');
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        resolve(await callback(`http://127.0.0.1:${port}`));
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

test('normalizes production URL inputs', () => {
  assert.equal(normalizeBaseUrl('https://example.com/#/practice'), 'https://example.com');
  assert.equal(normalizeBaseUrl('https://example.com/path/?x=1'), 'https://example.com/path');
});

test('reads the generated static question count', () => {
  assert.equal(readStaticQuestionCount(generatedQuestions(705)), 705);
});

test('derives the expected live count from the local generated site bank', () => {
  const count = resolveRequiredQuestionCount();
  assert.ok(count >= 715);
});

test('live site check passes current static assets', async () => {
  await withStaticServer(currentAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, { requiredQuestionCount: 705 });
    assert.equal(result.ok, true);
    assert.equal(
      result.checks.every((check) => check.ok),
      true,
    );
  });
});

test('live site check rejects stale deploy assets', async () => {
  await withStaticServer(staleAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, { requiredQuestionCount: 705 });
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.checks.filter((check) => !check.ok).map((check) => check.name),
      [
        'static question bank',
        'practice hub assets',
        'mock exam route assets',
        'ebook renderer assets',
        'ebook placeholder copy',
      ],
    );
  });
});
