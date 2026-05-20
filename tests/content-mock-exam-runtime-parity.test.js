const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('default mock exam config generates a full UHR-based exam from bundled questions', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mock-exam-runtime-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { questions } = loadTs('data/questions.ts');
  const chapters = loadTs('data/chapters.ts', 'chapters');
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const rewardedAdSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
    'utf8',
  );
  const exam = generateExam(questions, { questionCount: config.questionCount });

  assert.equal(summary.mockExamRuntimeParityValidated, true);
  assert.match(rewardedAdSource, /confirmReward\?: RewardedExtraExamRewardConfirmation/);
  assert.match(rewardedAdSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(rewardedAdSource, /webConsentDecision\?: RewardedExtraExamWebConsentDecision/);
  assert.match(
    rewardedAdSource,
    /shouldShowAd\(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements, webConsentDecision, 'web'\)/,
  );
  assert.match(
    rewardedAdSource,
    /if \(!rewardConfirmed\) \{[\s\S]*status: 'closed_without_reward'/,
  );
  assert.doesNotMatch(examRouteSource, /Platform,/);
  assert.doesNotMatch(
    examRouteSource,
    /showRewardedExtraExamAd|rewardPreview|RewardedAd|Sponsored preview|Sponsrad förhandsvisning|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
  assert.doesNotMatch(examRouteSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(examRouteSource, /consumeRewardedExamCredit/);
  assert.match(examRouteSource, /accessDecision\.reason === 'rewarded_exam_credit'/);
  assert.equal(exam.length, config.questionCount);
  assert.equal(new Set(exam.map((question) => question.id)).size, exam.length);
  assert.equal(
    new Set(exam.map((question) => question.chapterId)).size,
    Math.min(chapters.length, config.questionCount),
  );
  assert.ok(
    exam.every(
      (question) =>
        question.reviewStatus === 'published' &&
        question.uhrReference?.chapter &&
        question.uhrReference?.section,
    ),
  );
});

test('web rewarded extra exam helper requires completion while exam route stays ad-free', async () => {
  const { showRewardedExtraExamAd } = loadTs('lib/monetization/rewardedAd.ts');
  const rewardedAdSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
    'utf8',
  );
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const defaultResult = await showRewardedExtraExamAd();
  const confirmedResult = await showRewardedExtraExamAd({
    confirmReward: () => true,
  });

  assert.deepEqual(defaultResult, { status: 'closed_without_reward' });
  assert.equal(confirmedResult.status, 'earned_reward');
  assert.match(
    rewardedAdSource,
    /rewardConfirmed = \(await confirmReward\?\.\(\)\) === true;[\s\S]*if \(!rewardConfirmed\) \{[\s\S]*return \{ status: 'closed_without_reward' \};[\s\S]*\}/,
  );
  assert.match(rewardedAdSource, /webConsentDecision = WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.doesNotMatch(
    examSource,
    /showRewardedExtraExamAd|RewardedAd|rewardPreview|Sponsored preview|Sponsrad förhandsvisning|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
  assert.doesNotMatch(examSource, /WEB_AD_FALLBACK_CONSENT_DECISION|grantRewardedExamCredit/);
  assert.doesNotMatch(examSource, /Complete sponsor preview|Slutför förhandsvisning/);
  assert.match(examSource, /Start unlocked extra exam/);
  assert.match(examSource, /Starta upplåst extra prov/);
});

test('native mock exam copy parity rejects provexamen wording in library and tier labels', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mock-exam-copy-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused mock-exam copy validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.nativeMockExamComponentLegalCopyValidated, true);
  assert.equal(summary.nativeMockExamLibraryLabelsValidated, 7);
  assert.equal(summary.nativeMockExamTierCopyValidated, true);
  assert.equal(summary.nativeMockExamSwedishCopyNaturalnessValidated, true);
});
