const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const FORBIDDEN_SWEDISH_STUDY_TERMS = [
  { label: 'Spaced repetition', pattern: /\bSpaced repetition\b/i },
  { label: 'quiz', pattern: /\bquiz\b/i },
  { label: 'timing', pattern: /\btiming\b/i },
];

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function stringLiteralValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function unwrapI18nInitializer(initializer) {
  if (
    ts.isBinaryExpression(initializer) &&
    initializer.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    return initializer.right;
  }
  return initializer;
}

function extractStaticSiteI18n() {
  const source = read('site/app.js');
  const sourceFile = ts.createSourceFile(
    'site/app.js',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  let i18nObject = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'i18n' &&
      node.initializer
    ) {
      const initializer = unwrapI18nInitializer(node.initializer);
      if (ts.isObjectLiteralExpression(initializer)) i18nObject = initializer;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  assert.ok(i18nObject, 'site/app.js should expose the static i18n dictionary');

  const dictionaries = {};
  for (const languageProperty of i18nObject.properties) {
    if (!ts.isPropertyAssignment(languageProperty)) continue;
    const language = propertyNameText(languageProperty.name);
    if (!language || !ts.isObjectLiteralExpression(languageProperty.initializer)) continue;
    dictionaries[language] = {};
    for (const entry of languageProperty.initializer.properties) {
      if (!ts.isPropertyAssignment(entry)) continue;
      const key = propertyNameText(entry.name);
      const value = stringLiteralValue(entry.initializer);
      if (key && value !== null) dictionaries[language][key] = value;
    }
  }

  return dictionaries;
}

test('static site privacy copy rejects stale monetization claims', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /real ad rendering is disabled/i,
    /avst[aä]ngd f[oö]r v1\.0/i,
    /If we ever add premium/i,
    /Om vi n[aå]gonsin l[aä]gger till premium/i,
    /we don't sell anything/i,
    /s[aä]ljer ingenting/i,
    /collects nothing and shares nothing/i,
    /samlar inget och delar inget/i,
    /collects no user data and shares no user data/i,
    /samlar inga anv[aä]ndardata och delar inga anv[aä]ndardata/i,
    /No third-party trackers/i,
    /Inga tredjepartssp[aå]rare/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site privacy copy names current ads, consent, and Remove Ads behavior', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /Google AdSense/,
    /Google Mobile Ads \(AdMob\)/,
    /ad and consent signals/,
    /annons- och samtyckessignaler/,
    /Remove Ads is an optional one-time 29 SEK purchase that removes ads/,
    /Ta bort annonser .*eng[aå]ngsk[oö]p p[aå] 29 SEK som tar bort annonser/,
    /ads never collect study answers or progress/,
    /annonser samlar aldrig in dina studiesvar eller framsteg/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static site Swedish dictionary rejects English study-product terms', () => {
  const dictionaries = extractStaticSiteI18n();
  const svEntries = Object.entries(dictionaries.sv || {});
  assert.ok(svEntries.length > 0, 'static Swedish dictionary should be parseable');

  const offenders = [];
  for (const [key, value] of svEntries) {
    for (const { label, pattern } of FORBIDDEN_SWEDISH_STUDY_TERMS) {
      if (pattern.test(value)) offenders.push(`${key}: ${label}`);
    }
  }

  assert.deepEqual(offenders, []);

  const englishSurface = Object.values(dictionaries.en || {}).join('\n');
  assert.match(englishSurface, /\bSpaced repetition\b/i);
  assert.match(englishSurface, /\bquiz\b/i);
  assert.match(englishSurface, /\btiming\b/i);
});
