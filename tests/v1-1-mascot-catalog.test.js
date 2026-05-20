// Tests for v1.1 mascot catalog (blueprint 23).
// Run with: node --test tests/v1-1-mascot-catalog.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const MASCOT_ASSET_SIZE_LIMIT_BYTES = 8192;
const APPROVED_MASCOT_ASSET_COLORS = new Set([
  '#006aa7',
  '#fecc00',
  '#f5f7fa',
  '#ffffff',
  '#eaf0f7',
  '#dbe3ec',
  '#0b1f33',
  '#22384c',
  '#44586b',
  '#9aa9b6',
  '#c77700',
  '#fdf0dd',
  '#1e874b',
  '#e6f4ec',
  '#0e7c8a',
  '#b5527a',
  '#6b4a1f',
  '#c84a31',
  '#f2b879',
  '#f7d9b0',
]);

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

test('mascotAssetPath: every catalog expression resolves to a local safe SVG asset', () => {
  const { MASCOT_CATALOG, MASCOT_EXPRESSIONS, mascotAssetPath } = loadTs('lib/mascot/catalog.ts');
  const { SWEDISH_FLAG_BLUE, SWEDISH_FLAG_GOLD } = loadTs('lib/theme/flag.ts');
  let assetCount = 0;

  for (const mascot of MASCOT_CATALOG) {
    for (const expression of MASCOT_EXPRESSIONS) {
      const relativeAssetPath = mascotAssetPath(mascot.id, expression);
      const expectedPath = `assets/mascot/${mascot.id}/${expression}.svg`;
      assert.equal(relativeAssetPath, expectedPath);
      assert.ok(
        relativeAssetPath.startsWith(`assets/mascot/${mascot.id}/`),
        `${relativeAssetPath} escapes mascot asset directory`,
      );

      const absoluteAssetPath = path.join(repoRoot, relativeAssetPath);
      const stat = fs.statSync(absoluteAssetPath);
      assert.equal(stat.isFile(), true, `${relativeAssetPath} must be a file`);
      assert.ok(
        stat.size > 0 && stat.size <= MASCOT_ASSET_SIZE_LIMIT_BYTES,
        `${relativeAssetPath} is ${stat.size} bytes`,
      );

      const svg = fs.readFileSync(absoluteAssetPath, 'utf8');
      assert.match(svg, /^<svg[^>]+viewBox="0 0 128 128"/, `${relativeAssetPath} needs viewBox`);
      assert.doesNotMatch(svg, /<image\b|\b(?:href|xlink:href)=|url\(/i);
      assert.doesNotMatch(svg, /<linearGradient\b|<radialGradient\b|<filter\b/i);

      const colors = svg.match(/#[0-9a-fA-F]{6}/g) ?? [];
      assert.ok(colors.length > 0, `${relativeAssetPath} should use explicit flat colors`);
      for (const color of colors) {
        assert.equal(
          color,
          color.toLowerCase(),
          `${relativeAssetPath} color ${color} is not lower-case`,
        );
        assert.ok(
          APPROVED_MASCOT_ASSET_COLORS.has(color),
          `${relativeAssetPath} uses unapproved color ${color}`,
        );
      }
      assert.equal(svg.includes(SWEDISH_FLAG_BLUE), true, `${relativeAssetPath} missing flag blue`);
      assert.equal(svg.includes(SWEDISH_FLAG_GOLD), true, `${relativeAssetPath} missing flag gold`);
      assetCount += 1;
    }
  }

  assert.equal(assetCount, MASCOT_CATALOG.length * MASCOT_EXPRESSIONS.length);
});

test('DEFAULT_COMPANION_ID: is a valid mascot id', () => {
  const { DEFAULT_COMPANION_ID, isMascotId } = loadTs('lib/mascot/catalog.ts');
  assert.equal(isMascotId(DEFAULT_COMPANION_ID), true);
});
