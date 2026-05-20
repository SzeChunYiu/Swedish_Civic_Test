// Tests for daily challenge selector (PR9, teardown rec #23 P1).

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

function bigBank() {
  const out = [];
  for (let i = 0; i < 100; i += 1) {
    out.push({
      id: `q${i}`,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      chapterId: `c${i % 5}`,
    });
  }
  return out;
}

test('buildDailyChallenge: 5 questions + 60s time limit', () => {
  const { buildDailyChallenge, DAILY_CHALLENGE_QUESTIONS, DAILY_CHALLENGE_TIME_LIMIT_SECONDS } =
    loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({ bank: bigBank(), now: new Date('2026-05-19T12:00:00.000Z') });
  assert.equal(c.questionIds.length, DAILY_CHALLENGE_QUESTIONS);
  assert.equal(c.timeLimitSeconds, DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
});

test('buildDailyChallenge: same day + same bank → identical picks (deterministic)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const now = new Date('2026-05-19T12:00:00.000Z');
  const a = buildDailyChallenge({ bank, now });
  const b = buildDailyChallenge({ bank, now });
  assert.deepEqual(a.questionIds, b.questionIds);
});

test('buildDailyChallenge: different days → different picks (with high probability)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const a = buildDailyChallenge({ bank, now: new Date('2026-05-19T12:00:00.000Z') });
  const b = buildDailyChallenge({ bank, now: new Date('2026-05-20T12:00:00.000Z') });
  // Not strictly guaranteed to differ but with 100 questions + a 32-bit seed
  // the chance of identical 5-element picks is negligible.
  assert.notDeepEqual(a.questionIds, b.questionIds);
});

test('seedForDay: same input → same seed, distinct days → distinct seeds', () => {
  const { seedForDay } = loadTs('lib/learning/dailyChallenge.ts');
  assert.equal(seedForDay('2026-05-19'), seedForDay('2026-05-19'));
  assert.notEqual(seedForDay('2026-05-19'), seedForDay('2026-05-20'));
});

test('buildDailyChallenge: biases toward medium difficulty (first 3 mediums preferred)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const c = buildDailyChallenge({ bank, now: new Date('2026-05-19T12:00:00.000Z') });
  // Pull difficulty for each picked question.
  const diffs = c.questionIds.map((id) => bank.find((q) => q.id === id).difficulty);
  const mediumCount = diffs.filter((d) => d === 'medium').length;
  assert.ok(mediumCount >= 3, `expected >= 3 medium, got ${mediumCount} (${diffs.join(',')})`);
});

test('isDailyChallengeCompleted: matches today day key only', () => {
  const { isDailyChallengeCompleted } = loadTs('lib/learning/dailyChallenge.ts');
  const { getLocalDateKey } = loadTs('lib/learning/streaks.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const today = getLocalDateKey(now);
  assert.equal(isDailyChallengeCompleted([today], now), true);
  assert.equal(isDailyChallengeCompleted(['2026-01-01'], now), false);
  assert.equal(isDailyChallengeCompleted([], now), false);
});

test('dailyChallengeBannerCopy: bilingual + reflects completion state', () => {
  const { dailyChallengeBannerCopy } = loadTs('lib/learning/dailyChallenge.ts');
  assert.match(dailyChallengeBannerCopy(false, 'sv').title, /utmaning/i);
  assert.match(dailyChallengeBannerCopy(false, 'en').title, /challenge/i);
  assert.match(dailyChallengeBannerCopy(true, 'en').title, /done/i);
  assert.match(dailyChallengeBannerCopy(true, 'sv').title, /klar/i);
});

test('buildDailyChallenge: small bank still produces some output', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({
    bank: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  // Should not throw; output length capped at min(bank size, 5).
  assert.ok(c.questionIds.length <= 5);
  assert.ok(c.questionIds.length >= 1);
});

test('buildDailyChallenge: invalid date and seed inputs fall back without leaking NaN', () => {
  const { buildDailyChallenge, seedForDay } = loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({
    bank: bigBank(),
    now: new Date('not-a-real-date'),
    seedOverride: Number.POSITIVE_INFINITY,
  });

  assert.match(c.dayKey, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(c.seed, seedForDay(c.dayKey));
  assert.equal(Number.isFinite(c.seed), true);
  assert.equal(c.questionIds.length, 5);
});

test('buildDailyChallenge: finite seed overrides are normalized to unsigned integers', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({
    bank: bigBank(),
    now: new Date('2026-05-19T12:00:00.000Z'),
    seedOverride: -1.9,
  });

  assert.equal(c.seed, 4294967295);
  assert.equal(c.questionIds.length, 5);
});

test('buildDailyChallenge: malformed, blank, and duplicate bank rows are ignored', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({
    bank: [
      { id: 'a', difficulty: 'medium', chapterId: ' ch01 ' },
      null,
      { id: '' },
      { id: '   ' },
      { id: 'a', difficulty: 'hard' },
      { id: ' b ', difficulty: 'not-real', chapterId: '' },
      { id: 'c', difficulty: 'medium' },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
    seedOverride: 7,
  });

  assert.equal(c.questionIds.length, new Set(c.questionIds).size);
  assert.equal(c.questionIds.includes(''), false);
  assert.equal(c.questionIds.includes('a'), true);
  assert.equal(c.questionIds.includes('b'), true);
  assert.equal(c.questionIds.includes('c'), true);
  assert.equal(c.questionIds.length, 3);
});

test('isDailyChallengeCompleted: malformed stored keys and invalid clocks fail closed', () => {
  const { isDailyChallengeCompleted } = loadTs('lib/learning/dailyChallenge.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');

  assert.equal(
    isDailyChallengeCompleted([null, 123, {}, '2026-05-19junk', 'not-a-day', '2026-99-99'], now),
    false,
  );
  assert.equal(isDailyChallengeCompleted(['2026-05-19T08:00:00.000Z'], now), true);
  assert.equal(isDailyChallengeCompleted(['2026-05-19'], new Date('invalid')), false);
  assert.equal(isDailyChallengeCompleted(null, now), false);
});
