const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const officialSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
];

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('about-the-test route uses cautious current official-detail copy', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');

  assert.equal(summary.aboutTheTestRouteCopyLabelsValidated, 38);
  assert.equal(summary.aboutTheTestRouteCopyParityValidated, true);
  assert.equal(summary.aboutTheTestOfficialSourceUrlsValidated, officialSourceUrls.length);
  assert.equal(summary.aboutTheTestOfficialSourceRetrievedDateValidated, '2026-05-19');
  assert.match(source, /const officialTestSourceNotes = \[/);
  assert.match(source, /const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = aboutTheTestCopy\[language\];/);
  assert.match(source, /15 augusti 2026 i Stockholm/);
  assert.match(source, /15 August 2026 in Stockholm/);
  assert.match(source, /brev från Migrationsverket/);
  assert.match(source, /letter from Migrationsverket/);
  assert.match(source, /kostnadsfritt och ges som ett utprövningsprov med generös tid/);
  assert.match(source, /free of charge and is a trial sitting with generous time/);
  assert.match(
    source,
    /Lägesbilden är kontrollerad \$\{officialTestSourceNotes\[0\]\.retrievedDate\}/,
  );

  for (const url of officialSourceUrls) {
    assert.match(source, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /Ett kort\s+prov|short\s+test/i);
  assert.doesNotMatch(source, /digitalt\s+prov|digital\s+exam/i);
  assert.doesNotMatch(source, /Flervalsfr[aå]gor|Multiple-choice\s+questions/i);
  assert.doesNotMatch(source, /dator i en\s+provlokal|computer at a\s+test centre/i);
});

test('about-the-test route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = aboutTheTestCopy[language];', 'const copy = aboutTheTestCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must select copy from settings language/,
  );
});

test('about-the-test route copy parity rejects unsupported old logistics claims', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'Det första provet som UHR beskriver gäller grundläggande kunskaper om det svenska samhället och är planerat till den 15 augusti 2026 i Stockholm.',
        'Ett kort' +
          ' prov med flervals' +
          'frågor på svenska. Du svarar på en dator i en ' +
          'provlokal.',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must not make unsupported logistics claim/,
  );
});

test('about-the-test route copy parity rejects missing official source metadata', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('https://www.uhr.se/medborgarskapsprovet/anmalan/', 'https://example.invalid/anmalan/')
      .replaceAll("retrievedDate: '2026-05-19'", "retrievedDate: '2026-05-01'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route official source metadata missing https:\/\/www\.uhr\.se\/medborgarskapsprovet\/anmalan\//,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route official source metadata must use retrievedDate 2026-05-19 for every source/,
  );
});
