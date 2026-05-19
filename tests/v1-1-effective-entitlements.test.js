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
  nativeLangExplanations: true,
  customStudyPlan: true,
  notesExport: true,
  predictedPassProbability: true,
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

test('resolveEffectiveEntitlement: Pro Lifetime → all flags + pro-lifetime primary', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({ proLifetime: PRO_LIFETIME_SNAP, now: NOW });
  assert.equal(r.primarySource, 'pro-lifetime');
  assert.equal(r.entitlements.spacedRepetition, true);
  assert.equal(r.entitlements.adsDisabled, true);
});

test('resolveEffectiveEntitlement: Remove-Ads only does NOT grant Pro flags', () => {
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const r = resolveEffectiveEntitlement({ removeAds: REMOVE_ADS_ONLY, now: NOW });
  assert.equal(r.primarySource, 'remove-ads');
  assert.equal(r.entitlements.adsDisabled, true);
  assert.equal(r.entitlements.spacedRepetition, false);
  assert.equal(r.entitlements.unlimitedMockExams, false);
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
  assert.equal(r.nextExpiryIso, earlier);
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
