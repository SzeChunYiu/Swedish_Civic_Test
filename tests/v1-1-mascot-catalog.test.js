// Tests for v1.1 mascot catalog (blueprint 23).
// Run with: node --test tests/v1-1-mascot-catalog.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

test('MASCOT_CATALOG: exactly 10 entries with stable Sv labels', () => {
  const { MASCOT_CATALOG } = loadTs('lib/mascot/catalog.ts');
  assert.equal(MASCOT_CATALOG.length, 10);
  const expectedIds = [
    'dala-horse',
    'kanelbulle',
    'moose',
    'tomte',
    'salmon',
    'fika-cup',
    'vasa-ship',
    'midsummer-pole',
    'lucia',
    'snowman',
  ];
  assert.deepEqual(
    MASCOT_CATALOG.map((m) => m.id),
    expectedIds,
  );
});

test('MASCOT_CATALOG: every entry has bilingual labels + bilingual cultural anchor', () => {
  const { MASCOT_CATALOG } = loadTs('lib/mascot/catalog.ts');
  for (const m of MASCOT_CATALOG) {
    assert.ok(m.labelSv && m.labelSv.length > 0, `${m.id} missing labelSv`);
    assert.ok(m.labelEn && m.labelEn.length > 0, `${m.id} missing labelEn`);
    assert.ok(m.anchorSv && m.anchorSv.length > 0, `${m.id} missing anchorSv`);
    assert.ok(m.anchorEn && m.anchorEn.length > 0, `${m.id} missing anchorEn`);
  }
});

test('MASCOT_EXPRESSIONS: five expressions in canonical order', () => {
  const { MASCOT_EXPRESSIONS } = loadTs('lib/mascot/catalog.ts');
  assert.deepEqual([...MASCOT_EXPRESSIONS], ['idle', 'happy', 'oops', 'think', 'celebrate']);
});

test('isMascotId: validates known + rejects unknown', () => {
  const { isMascotId } = loadTs('lib/mascot/catalog.ts');
  assert.equal(isMascotId('dala-horse'), true);
  assert.equal(isMascotId('lucia'), true);
  assert.equal(isMascotId('not-a-mascot'), false);
  assert.equal(isMascotId(123), false);
});

test('mascotAssetPath: constructs canonical path', () => {
  const { mascotAssetPath } = loadTs('lib/mascot/catalog.ts');
  assert.equal(mascotAssetPath('lucia', 'celebrate'), 'assets/mascot/lucia/celebrate.svg');
});

test('DEFAULT_COMPANION_ID: is a valid mascot id', () => {
  const { DEFAULT_COMPANION_ID, isMascotId } = loadTs('lib/mascot/catalog.ts');
  assert.equal(isMascotId(DEFAULT_COMPANION_ID), true);
});
