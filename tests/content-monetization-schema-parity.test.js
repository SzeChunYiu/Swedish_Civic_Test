const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
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

test('monetization TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const monetizationTypes = fs.readFileSync(path.join(repoRoot, 'types/monetization.ts'), 'utf8');

  assert.equal(summary.monetizationTypeUnionsValidated, 1);
  assert.equal(summary.monetizationTypeInterfacesValidated, 3);
  assert.equal(summary.monetizationTypeSchemaParityValidated, true);
  assert.match(monetizationTypes, /export type AdPlacement =/);
  assert.match(monetizationTypes, /'rewarded_extra_exam'/);
  assert.match(monetizationTypes, /export interface PremiumEntitlements/);
  assert.match(monetizationTypes, /adsDisabled: boolean;/);
  assert.match(monetizationTypes, /export interface MonetizationState/);
});

test('effective entitlement schema guard keeps malformed runtime flags strict boolean', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const { unionEntitlements } = loadTs('lib/monetization/premium.ts');
  const freeEntitlements = {
    adsDisabled: false,
    unlimitedMockExams: false,
    fullMistakeReview: false,
    spacedRepetition: false,
    nativeLangExplanations: false,
    customStudyPlan: false,
    notesExport: false,
    predictedPassProbability: false,
    confidenceSlider: false,
    multiColorHighlights: false,
  };
  const now = new Date('2026-05-19T12:00:00.000Z');

  assert.deepEqual(
    unionEntitlements(freeEntitlements, {
      adsDisabled: 'true',
      unlimitedMockExams: 1,
      fullMistakeReview: {},
      spacedRepetition: [],
    }),
    freeEntitlements,
  );

  const malformedRemoveAds = resolveEffectiveEntitlement({
    removeAds: {
      adsDisabled: 'yes',
      unlimitedMockExams: true,
      fullMistakeReview: true,
    },
    now,
  });
  assert.equal(malformedRemoveAds.primarySource, 'free');
  assert.deepEqual(malformedRemoveAds.entitlements, freeEntitlements);

  const malformedProLifetime = resolveEffectiveEntitlement({
    proLifetime: {
      adsDisabled: 'yes',
      unlimitedMockExams: 'yes',
      fullMistakeReview: 1,
      spacedRepetition: true,
      nativeLangExplanations: 'yes',
      customStudyPlan: true,
    },
    now,
  });
  assert.equal(malformedProLifetime.primarySource, 'pro-lifetime');
  assert.equal(malformedProLifetime.entitlements.spacedRepetition, true);
  assert.equal(malformedProLifetime.entitlements.customStudyPlan, true);
  assert.equal(malformedProLifetime.entitlements.adsDisabled, false);
  assert.equal(malformedProLifetime.entitlements.unlimitedMockExams, false);
  assert.equal(malformedProLifetime.entitlements.fullMistakeReview, false);
  Object.values(malformedProLifetime.entitlements).forEach((value) =>
    assert.equal(typeof value, 'boolean'),
  );
});

test('monetization schema parity rejects entitlement optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/monetization.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('adsDisabled: boolean;', 'adsDisabled?: boolean;');
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
    /types\/monetization\.ts PremiumEntitlements\.adsDisabled optional=true, expected false/,
  );
});
