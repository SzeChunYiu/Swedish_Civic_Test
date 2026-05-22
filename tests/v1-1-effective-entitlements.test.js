// Tests for the effective entitlements resolver (PR11).
// Run with: node --test tests/v1-1-effective-entitlements.test.js

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

const NOW = new Date('2026-05-19T12:00:00.000Z');

const PRO_LIFETIME_SNAP = {
  adsDisabled: true,
  unlimitedMockExams: true,
  fullMistakeReview: true,
  spacedRepetition: true,
  nativeLangExplanations: false,
  customStudyPlan: true,
  notesExport: true,
  predictedPassProbability: false,
  confidenceSlider: true,
  multiColorHighlights: true,
};

const NO_PRO_SNAP = {
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

const REMOVE_ADS_ONLY = { adsDisabled: true, unlimitedMockExams: false, fullMistakeReview: false };

test('resolveEffectiveEntitlement: free baseline when no inputs', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({ now: NOW });
  assert.equal(r.primarySource, 'free');
  assert.equal(r.entitlements.spacedRepetition, false);
  assert.equal(r.entitlements.adsDisabled, false);
});

test('resolveEffectiveEntitlement: Pro Lifetime → shipped flags + pro-lifetime primary', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({ proLifetime: PRO_LIFETIME_SNAP, now: NOW });
  assert.equal(r.primarySource, 'pro-lifetime');
  assert.equal(r.entitlements.spacedRepetition, true);
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.nativeLangExplanations, false);
});

test('resolveEffectiveEntitlement: Remove-Ads only does NOT grant Pro flags', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({ removeAds: REMOVE_ADS_ONLY, now: NOW });
  assert.equal(r.primarySource, 'remove-ads');
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.spacedRepetition, false);
  assert.equal(r.entitlements.unlimitedMockExams, false);
});

test('unionEntitlements: malformed truthy flags do not become active entitlement booleans', () => {
  const { unionEntitlements } = loadTs('lib/monetization/premium.ts');
  const r = unionEntitlements(NO_PRO_SNAP, {
    adsDisabled: 1,
    unlimitedMockExams: 'yes',
    fullMistakeReview: {},
    spacedRepetition: 'true',
    nativeLangExplanations: [],
    customStudyPlan: null,
    notesExport: undefined,
    predictedPassProbability: Number.POSITIVE_INFINITY,
    confidenceSlider: 'false',
    multiColorHighlights: new Boolean(true),
  });

  assert.deepEqual(r, NO_PRO_SNAP);
  Object.values(r).forEach((value) => assert.equal(typeof value, 'boolean'));
});

test('resolveEffectiveEntitlement: malformed Remove Ads snapshots fail closed', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({
    removeAds: {
      adsDisabled: 'yes',
      unlimitedMockExams: true,
      fullMistakeReview: true,
    },
    now: NOW,
  });

  assert.equal(r.primarySource, 'free');
  assert.deepEqual(r.activeSources, []);
  assert.deepEqual(r.entitlements, NO_PRO_SNAP);
  Object.values(r.entitlements).forEach((value) => assert.equal(typeof value, 'boolean'));
});

test('resolveEffectiveEntitlement: Remove Ads contributes only strict boolean flags', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({
    removeAds: {
      adsDisabled: true,
      unlimitedMockExams: 'yes',
      fullMistakeReview: 1,
    },
    now: NOW,
  });

  assert.equal(r.primarySource, 'remove-ads');
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.unlimitedMockExams, false);
  assert.equal(r.entitlements.fullMistakeReview, false);
  assert.equal(r.entitlements.spacedRepetition, false);
  Object.values(r.entitlements).forEach((value) => assert.equal(typeof value, 'boolean'));
});

test('resolveEffectiveEntitlement: Pro Lifetime contributes only strict boolean feature flags', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({
    proLifetime: {
      adsDisabled: 'yes',
      unlimitedMockExams: 'yes',
      fullMistakeReview: 1,
      spacedRepetition: true,
      nativeLangExplanations: 'yes',
      customStudyPlan: true,
      notesExport: {},
      predictedPassProbability: true,
      confidenceSlider: false,
      multiColorHighlights: Number.POSITIVE_INFINITY,
    },
    now: NOW,
  });

  assert.equal(r.primarySource, 'pro-lifetime');
  assert.equal(r.entitlements.adsDisabled, false);
  assert.equal(r.entitlements.unlimitedMockExams, false);
  assert.equal(r.entitlements.fullMistakeReview, false);
  assert.equal(r.entitlements.spacedRepetition, true);
  assert.equal(r.entitlements.nativeLangExplanations, false);
  assert.equal(r.entitlements.customStudyPlan, true);
  assert.equal(r.entitlements.notesExport, false);
  assert.equal(r.entitlements.predictedPassProbability, true);
  assert.equal(r.entitlements.confidenceSlider, false);
  assert.equal(r.entitlements.multiColorHighlights, false);
  Object.values(r.entitlements).forEach((value) => assert.equal(typeof value, 'boolean'));
});

test('resolveEffectiveEntitlement: unexpired referral grant promotes to Pro temporarily', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const future = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const r = resolveEffectiveEntitlement({
    proLifetime: NO_PRO_SNAP,
    referralGrant: { expiresAtIso: future },
    now: NOW,
  });
  assert.equal(r.primarySource, 'referral-grant-active');
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.spacedRepetition, true);
  assert.equal(r.nextExpiryIso, future);
});

test('resolveEffectiveEntitlement: expired referral grant contributes nothing', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const past = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const r = resolveEffectiveEntitlement({
    referralGrant: { expiresAtIso: past },
    now: NOW,
  });
  assert.equal(r.primarySource, 'free');
  assert.equal(r.entitlements.spacedRepetition, false);
});

test('resolveEffectiveEntitlement: Pro Lifetime stacked with active trial uses Pro primary', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const future = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const r = resolveEffectiveEntitlement({
    proLifetime: PRO_LIFETIME_SNAP,
    proTrial: { expiresAtIso: future },
    now: NOW,
  });
  assert.equal(r.primarySource, 'pro-lifetime');
  assert.deepEqual(r.activeSources, ['pro-lifetime', 'pro-trial-active']);
  // nextExpiryIso reflects the time-bounded grant, even though Pro Lifetime is eternal
  assert.equal(r.nextExpiryIso, future);
});

test('resolveEffectiveEntitlement: trial + referral both active picks the earlier expiry', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const earlier = new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const later = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const r = resolveEffectiveEntitlement({
    proTrial: { expiresAtIso: later },
    referralGrant: { expiresAtIso: earlier },
    now: NOW,
  });
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.spacedRepetition, true);
  assert.equal(r.nextExpiryIso, earlier);
});

test('resolveEffectiveEntitlement: temporary Pro expiry requires canonical UTC ISO timestamps', () => {
  const { resolveEffectiveEntitlement, timeBoundedExpiry } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const invalidExpiries = [
    ['rollover', '2026-06-31T00:00:00.000Z'],
    ['date-only', '2026-06-01'],
    ['timezone-offset', '2026-06-01T00:30:00+02:00'],
    ['blank', ''],
    ['malformed', 'not-a-date'],
  ];

  for (const [label, expiresAtIso] of invalidExpiries) {
    const trial = resolveEffectiveEntitlement({
      proTrial: { expiresAtIso },
      now: NOW,
    });
    assert.equal(trial.primarySource, 'free', `${label} trial expiry should fail closed`);
    assert.deepEqual(trial.activeSources, [], `${label} trial expiry should not be active`);
    assert.equal(trial.entitlements.spacedRepetition, false);
    assert.equal(trial.nextExpiryIso, null);

    const referral = resolveEffectiveEntitlement({
      referralGrant: { expiresAtIso },
      now: NOW,
    });
    assert.equal(referral.primarySource, 'free', `${label} referral expiry should fail closed`);
    assert.deepEqual(referral.activeSources, [], `${label} referral expiry should not be active`);
    assert.equal(referral.entitlements.spacedRepetition, false);
    assert.equal(referral.nextExpiryIso, null);
    assert.equal(timeBoundedExpiry({ referralGrant: { expiresAtIso }, now: NOW }), null);
  }
});

test('parseCanonicalUtcIsoTimestamp rejects non-canonical UTC timestamps', () => {
  const { isCanonicalUtcIsoTimestamp, parseCanonicalUtcIsoTimestamp } = loadTs(
    'lib/time/canonicalTimestamp.ts',
  );
  const canonical = '2026-05-26T12:00:00.000Z';
  const parsed = parseCanonicalUtcIsoTimestamp(canonical);

  assert.deepEqual(parsed, {
    epochMs: Date.parse(canonical),
    iso: canonical,
  });
  assert.equal(isCanonicalUtcIsoTimestamp(canonical), true);

  for (const value of [
    '2026-06-31T00:00:00.000Z',
    '2026-06-01',
    '2026-06-01T00:30:00+02:00',
    '2026-06-01T00:30:00Z',
    '',
    null,
    undefined,
  ]) {
    assert.equal(parseCanonicalUtcIsoTimestamp(value), null);
    assert.equal(isCanonicalUtcIsoTimestamp(value), false);
  }
});

test('resolveEffectiveEntitlement: non-canonical active trial cannot outrank canonical referral', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const canonicalReferral = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const result = resolveEffectiveEntitlement({
    proTrial: { expiresAtIso: '2026-06-01T00:30:00+02:00' },
    referralGrant: { expiresAtIso: canonicalReferral },
    now: NOW,
  });

  assert.equal(result.primarySource, 'referral-grant-active');
  assert.deepEqual(result.activeSources, ['referral-grant-active']);
  assert.equal(result.nextExpiryIso, canonicalReferral);
  assert.equal(result.entitlements.spacedRepetition, true);
});

test('hasProRightNow: convenience predicate matches resolver', () => {
  const { hasProRightNow } = loadTs('lib/monetization/effectiveEntitlements.ts');
  assert.equal(hasProRightNow({ now: NOW }), false);
  assert.equal(hasProRightNow({ proLifetime: PRO_LIFETIME_SNAP, now: NOW }), true);
  assert.equal(hasProRightNow({ removeAds: REMOVE_ADS_ONLY, now: NOW }), false);
});

test('timeBoundedExpiry: null when only Pro Lifetime / Remove-Ads / nothing', () => {
  const { timeBoundedExpiry } = loadTs('lib/monetization/effectiveEntitlements.ts');
  assert.equal(timeBoundedExpiry({ now: NOW }), null);
  assert.equal(timeBoundedExpiry({ proLifetime: PRO_LIFETIME_SNAP, now: NOW }), null);
  assert.equal(timeBoundedExpiry({ removeAds: REMOVE_ADS_ONLY, now: NOW }), null);
});
