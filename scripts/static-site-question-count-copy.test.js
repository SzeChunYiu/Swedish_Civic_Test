const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function staticQuestionCount() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return context.window.SMT_QUESTIONS.length;
}

function footerAboutValues(source) {
  return Array.from(source.matchAll(/"footer\.about\.p": "([^"]+)"/g), (match) => match[1]);
}

test('static site product-count copy rejects stale hardcoded 500 claims', () => {
  const questionCount = staticQuestionCount();
  const surface = [read('site/index.html'), read('site/app.js'), read('site/i18n-extras.js')].join(
    '\n',
  );
  const footerValues = footerAboutValues(surface);

  assert.ok(questionCount > 500, 'test expects the current bank to exceed 500 questions');
  assert.ok(footerValues.length >= 6, 'all static footer translations should be inspected');
  assert.ok(footerValues.every((value) => !/\b500\b|500\+/.test(value)));

  [
    /core\s*500/i,
    /500\+\s*questions/i,
    /500\+\s*fr.gor/i,
    /footer\.about\.p["']?\s*:\s*["'][^"']*500/,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site count-sensitive copy uses non-numeric current-bank wording', () => {
  const surface = [read('site/index.html'), read('site/app.js'), read('site/i18n-extras.js')].join(
    '\n',
  );

  [
    /Source-backed questions/,
    /K.llst.dda fr.gor/,
    /Free to start, study, and take mock exams/,
    /Gratis att b.rja, plugga och g.ra provexempel/,
  ].forEach((pattern) => assert.match(surface, pattern));
});
