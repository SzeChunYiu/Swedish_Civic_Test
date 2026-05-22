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
  assert.equal(summary.effectiveEntitlementExpiryCasesValidated, 5);
  assert.equal(summary.effectiveEntitlementExpiryParityValidated, true);
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

test('effective entitlement schema guard rejects non-canonical temporary Pro expiry values', () => {
  const {
    REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
    resolveEffectiveEntitlement,
    timeBoundedExpiry,
  } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const canonicalReferral = '2026-05-26T12:00:00.000Z';

  for (const expiresAtIso of [
    '2026-06-31T00:00:00.000Z',
    '2026-06-01',
    '2026-06-01T00:30:00+02:00',
  ]) {
    const result = resolveEffectiveEntitlement({
      proTrial: { expiresAtIso },
      now,
    });

    assert.equal(result.primarySource, 'free');
    assert.equal(result.entitlements.spacedRepetition, false);
    assert.equal(result.nextExpiryIso, null);
    assert.equal(timeBoundedExpiry({ proTrial: { expiresAtIso }, now }), null);
  }

  const stacked = resolveEffectiveEntitlement({
    proTrial: { expiresAtIso: '2026-06-01T00:30:00+02:00' },
    referralGrant: { expiresAtIso: canonicalReferral },
    now,
  });
  assert.equal(stacked.primarySource, 'referral-grant-active');
  assert.deepEqual(stacked.activeSources, ['referral-grant-active']);
  assert.equal(stacked.nextExpiryIso, canonicalReferral);
  assert.equal(
    REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
    'monetization.referral.proGrant.expiresAt.v1',
  );
});

test('temporary Pro expiry parsing stays on the shared canonical timestamp helper', () => {
  const effectiveSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/effectiveEntitlements.ts'),
    'utf8',
  );
  const helperSource = fs.readFileSync(
    path.join(repoRoot, 'lib/time/canonicalTimestamp.ts'),
    'utf8',
  );

  assert.match(helperSource, /export function parseCanonicalUtcIsoTimestamp/);
  assert.match(helperSource, /parsed\.toISOString\(\) !== value/);
  assert.match(effectiveSource, /from '\.\.\/time\/canonicalTimestamp'/);
  assert.match(effectiveSource, /parseCanonicalUtcIsoTimestamp\(iso\)/);
  assert.doesNotMatch(effectiveSource, /CANONICAL_UTC_ISO_TIMESTAMP_PATTERN/);
  assert.doesNotMatch(effectiveSource, /function parseCanonicalUtcIsoTimestamp/);
  assert.doesNotMatch(effectiveSource, /new Date\(iso\)/);
  assert.doesNotMatch(effectiveSource, /Date\.parse\(/);
});

test('referral grant store persists the canonical server grant consumed by effective entitlements', async () => {
  const { REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY, resolveEffectiveEntitlement } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const { getReferralGrantSnapshot, persistReferralGrantSnapshot } = loadTs(
    'lib/monetization/referralGrantStore.ts',
  );
  const values = new Map();
  const storage = {
    async deleteItemAsync(key) {
      values.delete(key);
    },
    async getItemAsync(key) {
      return values.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      values.set(key, value);
    },
  };
  const now = new Date('2026-05-19T12:00:00.000Z');

  assert.deepEqual(await persistReferralGrantSnapshot('2026-05-26T12:00:00.000Z', { storage }), {
    expiresAtIso: '2026-05-26T12:00:00.000Z',
  });
  assert.equal(values.get(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY), '2026-05-26T12:00:00.000Z');

  const resolved = resolveEffectiveEntitlement({
    referralGrant: await getReferralGrantSnapshot({ storage }),
    now,
  });
  assert.equal(resolved.primarySource, 'referral-grant-active');
  assert.equal(resolved.entitlements.spacedRepetition, true);
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
