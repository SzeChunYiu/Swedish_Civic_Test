const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function staticQuestionSourceTitles() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return uniqueSorted(context.window.SMT_QUESTIONS.map((question) => question.source?.title));
}

function sourceClaimTitles(indexHtml) {
  return uniqueSorted(
    Array.from(indexHtml.matchAll(/data-source-title="([^"]+)"/g), (match) => match[1]),
  );
}

function sourcesRoute(indexHtml) {
  const routeMatch = indexHtml.match(
    /<main data-screen-label="05 Sources" data-page="\/sources">([\s\S]*?)<\/main>/,
  );
  assert.ok(routeMatch, 'static Sources route should be present');
  return routeMatch[1];
}

function termsContentParagraph(indexHtml) {
  const paragraphMatch = indexHtml.match(/<p data-i18n="terms\.s3\.p">([\s\S]*?)<\/p>/);
  assert.ok(paragraphMatch, 'static Terms content paragraph should be present');
  return paragraphMatch[1];
}

function appTranslationValues(appSource, includeKey) {
  const values = [];
  const entryPattern = /"([^"]+)": "((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = entryPattern.exec(appSource))) {
    const [, key, rawValue] = match;
    if (includeKey(key)) values.push(JSON.parse(`"${rawValue}"`));
  }
  return values;
}

function sourceProvenanceSurface() {
  const indexHtml = read('site/index.html');
  const appJs = read('site/app.js');
  const sourceAndTermsTranslations = appTranslationValues(
    appJs,
    (key) => key.startsWith('sources.') || key === 'terms.s3.p',
  );

  return [sourcesRoute(indexHtml), termsContentParagraph(indexHtml), ...sourceAndTermsTranslations]
    .join('\n')
    .replace(/<[^>]+>/g, ' ');
}

test('static source claims match the shipped question-bank source titles', () => {
  const indexHtml = read('site/index.html');
  const questionSourceTitles = staticQuestionSourceTitles();
  const claimedSourceTitles = sourceClaimTitles(indexHtml);
  const surface = sourceProvenanceSurface();

  assert.deepEqual(claimedSourceTitles, questionSourceTitles);
  assert.deepEqual(questionSourceTitles, ['Sverige i fokus']);

  for (const title of questionSourceTitles) {
    assert.match(surface, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(surface, /UHR/i);
  assert.match(surface, /current question bank|nuvarande fr[aå]gebanken/i);
  assert.match(surface, /Primary source\s+1|Prim[aä]r k[aä]lla\s+1/i);
});

test('static source provenance copy rejects unshipped external source families', () => {
  const surface = sourceProvenanceSurface();

  [
    /Riksdagen\s+.*(?:basic laws|grundlagarna|riksdagens arbete)/i,
    /Regeringen\.se/i,
    /Migrationsverket\s+.*(?:citizenship requirements|medborgarskapskrav)/i,
    /Skolverket\s+.*(?:civic-knowledge|ramverk|kursplaner)/i,
    /SCB\s+\(?(?:Statistiska centralbyr[aå]n)?\)?\s+.*(?:demographics|demografi)/i,
    /Folkh[aä]lsomyndigheten/i,
    /Nationalencyklopedin/i,
    /Institutet f(?:ö|o)r spr[aå]k och folkminnen/i,
    /public sources\s+.*Riksdagen/i,
    /offentliga k[aä]llor\s+.*Riksdagen/i,
    /Primary sources\s+8/i,
    /Prim[aä]ra k[aä]llor\s+8/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});
