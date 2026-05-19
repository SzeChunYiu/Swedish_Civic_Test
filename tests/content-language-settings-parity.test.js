const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const expectedLanguages = ['sv', 'en'];

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('language settings stay in parity with supported localization languages', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const supportedLanguages = loadTs('lib/localization/language.ts', 'supportedLanguages');
  const strings = loadTs('lib/localization/strings.ts', 'strings');
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.deepEqual(supportedLanguages, expectedLanguages);
  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(settingsRoute, /renderLanguageButton\('sv', 'Swedish', 'Svenska'\)/);
  assert.match(settingsRoute, /renderLanguageButton\('en', 'English support', 'Engelskt stöd'\)/);
  assert.match(settingsRoute, /Byt frågespråk till \$\{label\}/);
  assert.match(settingsRoute, /Set question language to \$\{label\}/);
  assert.equal(summary.supportedLanguagesValidated, expectedLanguages.length);
  assert.equal(summary.localizationStrings, Object.keys(strings).length);
  assert.equal(summary.localizationStringsValidated, Object.keys(strings).length);
  assert.equal(summary.languageSettingsParityValidated, true);
});

test('language settings parity rejects supported-language drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/localization/language.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("['sv', 'en'] as const", "['sv', 'en', 'de'] as const");
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
    /supportedLanguages is \["sv","en","de"\], expected \["sv","en"\]/,
  );
});

test('language settings parity rejects unsupported localization string languages', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/localization/strings.ts')) {
    return 'export const strings = { "home-title": { sv: "Hem", en: "Home", de: "Start" } };';
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
    /strings\.home-title has unsupported languages de/,
  );
});
