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

test('MASCOT_CATALOG: exactly 11 entries with stable Sv labels', () => {
  const { MASCOT_CATALOG } = loadTs('lib/mascot/catalog.ts');
  assert.equal(MASCOT_CATALOG.length, 11);
  const expectedIds = [
    'dala-horse',
    'kanelbulle',
    'skoglimpa',
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
  assert.equal(isMascotId('skoglimpa'), true);
  assert.equal(isMascotId('lucia'), true);
  assert.equal(isMascotId('not-a-mascot'), false);
  assert.equal(isMascotId(123), false);
});

test('mascotAssetPath: constructs canonical path', () => {
  const { MASCOT_EXPRESSIONS, mascotAssetPath } = loadTs('lib/mascot/catalog.ts');
  assert.equal(mascotAssetPath('lucia', 'celebrate'), 'assets/mascot/lucia/celebrate.svg');
  for (const expression of MASCOT_EXPRESSIONS) {
    assert.equal(
      mascotAssetPath('skoglimpa', expression),
      `assets/mascot/skoglimpa/${expression}.svg`,
    );
  }
});

test('mascotAssetPath: every catalog expression has a canonical asset file', () => {
  const { MASCOT_CATALOG, MASCOT_EXPRESSIONS, mascotAssetPath } = loadTs('lib/mascot/catalog.ts');

  for (const mascot of MASCOT_CATALOG) {
    for (const expression of MASCOT_EXPRESSIONS) {
      const assetPath = mascotAssetPath(mascot.id, expression);
      assert.match(assetPath, /^assets\/mascot\/[^/]+\/(?:idle|happy|oops|think|celebrate)\.svg$/);
      assert.ok(fs.existsSync(path.join(repoRoot, assetPath)), `${assetPath} missing`);
    }
  }
});

test('MascotArtwork maps every catalog companion to practice feedback assets', () => {
  const { MASCOT_CATALOG, mascotAssetPath } = loadTs('lib/mascot/catalog.ts');
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/MascotArtwork.tsx'),
    'utf8',
  );
  const practiceExpressions = ['idle', 'happy', 'oops'];

  assert.match(
    source,
    /type PracticeMascotExpression = Extract<MascotExpression, 'idle' \| 'happy' \| 'oops'>/,
  );
  assert.match(
    source,
    /satisfies Record<MascotId, Record<PracticeMascotExpression, ImageSourcePropType>>/,
  );
  assert.match(source, /typeof source\.uri === 'string'/);
  assert.match(source, /Image\.resolveAssetSource/);

  for (const mascot of MASCOT_CATALOG) {
    for (const expression of practiceExpressions) {
      const assetPath = mascotAssetPath(mascot.id, expression);
      assert.match(
        source,
        new RegExp(
          `require\\('\\.\\.\\/\\.\\.\\/${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`,
        ),
        `${mascot.id} ${expression} asset is not wired into MascotArtwork`,
      );
    }
  }
});

test('inline mascot components share the canonical expression id contract', () => {
  const dalaSource = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/DalaMascot.tsx'),
    'utf8',
  );
  const lumiSource = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/LumiMascot.tsx'),
    'utf8',
  );
  const indexSource = fs.readFileSync(path.join(repoRoot, 'components/mascot/index.ts'), 'utf8');

  for (const [label, source] of [
    ['DalaMascot', dalaSource],
    ['LumiMascot', lumiSource],
  ]) {
    const expectedThinkingLabel =
      label === 'DalaMascot' ? 'Dala mascot thinking' : 'Lumi mascot thinking';
    assert.match(
      source,
      /import type \{ MascotExpression \} from '..\/..\/lib\/mascot\/catalog';/,
      `${label} must consume the catalog MascotExpression type`,
    );
    assert.match(source, new RegExp(`think: '${expectedThinkingLabel}'`));
    assert.match(source, /expression === 'think'/);
    assert.doesNotMatch(source, /expression === 'thinking'/);
    assert.doesNotMatch(source, /'thinking'\s*\|/);
  }

  assert.match(
    indexSource,
    /export type \{ MascotExpression \} from '..\/..\/lib\/mascot\/catalog';/,
  );
});

test('mascot runtime sources do not reference legacy thinking asset paths', () => {
  const runtimeFiles = [
    'components/mascot/CompanionPicker.tsx',
    'components/mascot/DalaMascot.tsx',
    'components/mascot/LumiMascot.tsx',
    'components/mascot/MascotArtwork.tsx',
    'components/mascot/index.ts',
    'lib/mascot/catalog.ts',
    'lib/storage/companionStore.ts',
  ];

  for (const relativePath of runtimeFiles) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, /assets\/mascots\//, `${relativePath} uses legacy mascot dir`);
    assert.doesNotMatch(source, /thinking\.svg/, `${relativePath} uses legacy thinking asset`);
  }
});

test('DEFAULT_COMPANION_ID: Kanelbulle is the valid default companion', () => {
  const { DEFAULT_COMPANION_ID, isMascotId } = loadTs('lib/mascot/catalog.ts');
  assert.equal(DEFAULT_COMPANION_ID, 'kanelbulle');
  assert.equal(isMascotId(DEFAULT_COMPANION_ID), true);
});

test('favorite companion ordering starts the picker with Kanelbulle and Skoglimpa', () => {
  const { FAVORITE_COMPANION_IDS, MASCOT_CATALOG, getCompanionPickerMascots } =
    loadTs('lib/mascot/catalog.ts');
  assert.deepEqual([...FAVORITE_COMPANION_IDS], ['kanelbulle', 'skoglimpa']);
  assert.deepEqual(
    getCompanionPickerMascots()
      .slice(0, 2)
      .map((mascot) => mascot.id),
    ['kanelbulle', 'skoglimpa'],
  );
  assert.deepEqual(
    new Set(getCompanionPickerMascots().map((mascot) => mascot.id)),
    new Set(MASCOT_CATALOG.map((mascot) => mascot.id)),
  );
});

test('CompanionPicker renders canonical idle asset previews for every mascot', () => {
  const { MASCOT_CATALOG } = loadTs('lib/mascot/catalog.ts');
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/CompanionPicker.tsx'),
    'utf8',
  );

  assert.match(
    source,
    /import \{ Image, Platform, Pressable, StyleSheet, Text, View \} from 'react-native';/,
  );
  assert.match(source, /type \{ ImageSourcePropType, ViewStyle \} from 'react-native';/);
  assert.match(source, /satisfies Record<MascotId, ImageSourcePropType>;/);
  assert.match(source, /if \(typeof source === 'object' && source !== null && 'uri' in source\)/);
  assert.match(source, /Platform\.OS === 'web' && previewUri/);
  assert.match(source, /backgroundImage: `url\(\$\{uri\}\)`/);
  assert.match(source, /testID=\{`companion-preview-\$\{mascot\.id\}`\}/);
  assert.match(source, /source=\{companionPreviewSource\(mascot\.id\)\}/);
  assert.match(source, /height: space\[6\]/);
  assert.match(source, /width: space\[6\]/);

  for (const mascot of MASCOT_CATALOG) {
    assert.ok(
      source.includes(
        `${mascot.id.includes('-') ? `'${mascot.id}'` : mascot.id}: require('../../assets/mascot/${
          mascot.id
        }/idle.svg')`,
      ),
      `${mascot.id} picker preview should use the canonical idle asset`,
    );
  }
});

test('Skoglimpa carries bilingual labels and cultural anchors', () => {
  const { getMascot } = loadTs('lib/mascot/catalog.ts');
  const skoglimpa = getMascot('skoglimpa');
  assert.ok(skoglimpa);
  assert.equal(skoglimpa.labelSv, 'Skoglimpa');
  assert.equal(skoglimpa.labelEn, 'Swedish rye loaf');
  assert.match(skoglimpa.anchorSv, /rågbröd/);
  assert.match(skoglimpa.anchorEn, /rye bread/);
});
