const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { getMockExamSourceCitationSections } = require('../scripts/mock-exam-source-sections');

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

function parseFocusedMockExamCopySummary() {
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
  return JSON.parse(match[0]);
}

function runFocusedMockExamCopyWithSourcePatch(patches) {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const patches = ${JSON.stringify(patches)};
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  for (const [fileSuffix, replacements] of Object.entries(patches)) {
    if (!normalizedPath.endsWith(fileSuffix)) continue;
    let next = String(contents);
    for (const [from, to] of replacements) {
      if (!next.includes(from)) {
        throw new Error(\`Patch fixture could not find "\${from}" in \${fileSuffix}\`);
      }
      next = next.replace(from, to);
    }
    return next;
  }
  return contents;
};
process.argv.push('--focus-mock-exam-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  return result;
}

function assertFocusedMockExamCopyPatchFails(patches, expectedPattern) {
  const result = runFocusedMockExamCopyWithSourcePatch(patches);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(`${result.stdout}\n${result.stderr}`, expectedPattern);
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
  assert.equal(summary.mockExamChapterDistributionSafetyCasesValidated, 9);
  assert.equal(summary.mockExamChapterDistributionSafetyParityValidated, true);
  assert.equal(summary.mockExamQuestionIdSafetyCasesValidated, 9);
  assert.equal(summary.mockExamQuestionIdSafetyParityValidated, true);
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
  assert.match(examRouteSource, /consumeRewardedExamCredit/);
  assert.doesNotMatch(
    examRouteSource,
    /showRewardedExtraExamAd|rewardPreview|grantRewardedExamCredit|sponsor preview|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
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

test('mock exam copy parity keeps Swedish övningsprov labels and English Mock Exam labels', () => {
  const summary = parseFocusedMockExamCopySummary();
  const librarySource = fs.readFileSync(
    path.join(repoRoot, 'lib/learning/mockExamLibrary.ts'),
    'utf8',
  );
  const tierSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/tierComparison.ts'),
    'utf8',
  );

  assert.equal(summary.nativeMockExamComponentCopyLabelsValidated, 6);
  assert.equal(summary.nativeMockExamComponentLegalCopyValidated, true);
  assert.equal(summary.nativeMockExamLibraryLabelsValidated, 7);
  assert.equal(summary.nativeMockExamScoreSourceCopyValidated, true);
  assert.equal(summary.nativeMockExamSwedishCopyNaturalnessValidated, true);
  assert.equal(summary.nativeMockExamTierCopyValidated, true);
  assert.match(librarySource, /Övningsprov 1 – Mjuk start/);
  assert.match(librarySource, /Slumpmässigt övningsprov/);
  assert.match(librarySource, /Mock Exam 1 – Gentle start/);
  assert.match(tierSource, /labelSv: 'Övningsprov'/);
  assert.match(tierSource, /labelEn: 'Mock exams'/);
  assert.doesNotMatch(`${librarySource}\n${tierSource}`, /\bprovexamen\b|\bprovexamina\b/i);
});

test('mock exam copy focused guard rejects provexamen and provexamina regressions', () => {
  assertFocusedMockExamCopyPatchFails(
    {
      'lib/learning/mockExamLibrary.ts': [
        ['Övningsprov 1 – Mjuk start', 'Provexamen 1 – Mjuk start'],
      ],
    },
    /Swedish mock-exam copy must use Övningsprov, not provexamen\/provexamina/,
  );

  assertFocusedMockExamCopyPatchFails(
    {
      'lib/monetization/tierComparison.ts': [['Övningsprov', 'Provexamina']],
    },
    /Swedish mock-exam copy must use Övningsprov, not provexamen\/provexamina/,
  );
});

test('mock exam copy focused guard rejects random mock and tier label drift', () => {
  assertFocusedMockExamCopyPatchFails(
    {
      'lib/learning/mockExamLibrary.ts': [['Slumpmässigt övningsprov', 'Slumpmässigt test']],
    },
    /MOCK_EXAM_LIBRARY\[6\] labelSv is "Slumpmässigt test", expected "Slumpmässigt övningsprov"/,
  );

  assertFocusedMockExamCopyPatchFails(
    {
      'lib/monetization/tierComparison.ts': [["labelSv: 'Övningsprov'", "labelSv: 'Prov'"]],
    },
    /TIER_ROWS mockExams row must use Övningsprov \/ Mock exams labels/,
  );
});

test('mock exam copy focused guard rejects weakened English Mock Exam labels', () => {
  assertFocusedMockExamCopyPatchFails(
    {
      'lib/learning/mockExamLibrary.ts': [
        ['Mock Exam 1 – Gentle start', 'Practice Test 1 – Gentle start'],
      ],
    },
    /MOCK_EXAM_LIBRARY must preserve the English Mock Exam labels/,
  );
});

test('active mock exam keeps full UHR reference cards out of pre-submit questions', () => {
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const { activeQuestionSection, reviewSection } =
    getMockExamSourceCitationSections(examRouteSource);

  assert.match(
    reviewSection,
    /<UHRReferenceCard language=\{language\} reference=\{item\.uhrReference\} \/>/,
  );
  assert.match(reviewSection, /<ExplanationPanel[\s\S]*language=\{language\}/);
  assert.match(reviewSection, /<QuestionSourceCitation[\s\S]*question=\{item\}/);
  assert.match(
    reviewSection,
    /<QuestionReportLink[\s\S]*question=\{reviewQuestion\}[\s\S]*selectedOptionId=\{answers\[item\.questionId\]\}/,
  );
  assert.match(
    activeQuestionSection,
    /<QuestionSourceCitation[\s\S]*language=\{language\}[\s\S]*question=\{question\}/,
  );
  assert.match(activeQuestionSection, /copy\.activeQuestionRegionLabel\(questionNumber\)/);
  assert.match(activeQuestionSection, /accessibilityLabel=\{activeQuestionRegionLabel\}/);
  assert.match(activeQuestionSection, /aria-label=\{activeQuestionRegionLabel\}/);
  assert.match(
    activeQuestionSection,
    /<ProvenanceBadge language=\{language\} question=\{question\} \/>/,
  );
  assert.match(
    activeQuestionSection,
    /<QuestionReportLink\s+language=\{language\}\s+question=\{question\}\s+screen="exam"\s+\/>/,
  );
  assert.match(
    activeQuestionSection,
    /const isFlagged = Boolean\(flaggedQuestionIds\[question\.id\]\);/,
  );
  assert.match(activeQuestionSection, /aria-pressed=\{isFlagged\}/);
  assert.match(activeQuestionSection, /accessibilityState=\{\{ checked: isFlagged \}\}/);
  assert.doesNotMatch(activeQuestionSection, /<UHRReferenceCard/);
  assert.doesNotMatch(activeQuestionSection, /<ExplanationPanel/);
});

test('mock exam timer and auto-submit runtime guards reject malformed state', () => {
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
  const { formatExamTime, getMockExamTimerUrgency, shouldAutoSubmitExam } = loadTs(
    'lib/quiz/examGenerator.ts',
  );
  const examRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.equal(summary.mockExamTimerParityValidated, true);
  assert.match(examRouteSource, /examActive: examUnlocked && !examPaused/);
  assert.match(examRouteSource, /formatExamTime\(remainingSeconds\)/);
  assert.match(examRouteSource, /!Number\.isFinite\(remainingSeconds\)/);
  assert.match(examRouteSource, /AppState\.addEventListener\('change', handleAppStateChange\)/);
  assert.match(examRouteSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(examRouteSource, /const \[examPaused, setExamPaused\] = useState\(false\);/);
  assert.match(examRouteSource, /pauseStartedAtMsRef\.current \?\?= Date\.now\(\);/);
  assert.match(examRouteSource, /timingCheckpointMsRef\.current \+= pausedDurationMs/);
  assert.match(examRouteSource, /setExamPauseStatus\('paused'\)/);
  assert.match(examRouteSource, /setExamPauseStatus\('resumed'\)/);
  assert.match(examRouteSource, /aria-live="polite"/);
  assert.match(examRouteSource, /Number\.isFinite\(current\) \? Math\.max\(0, current - 1\) : 0/);
  assert.equal(getMockExamTimerUrgency({ remainingSeconds: 1800, totalSeconds: 1800 }), 'steady');
  assert.equal(getMockExamTimerUrgency({ remainingSeconds: 900, totalSeconds: 1800 }), 'warning');
  assert.equal(getMockExamTimerUrgency({ remainingSeconds: 449, totalSeconds: 1800 }), 'danger');
  for (const malformedRemainingSeconds of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    'abc',
    null,
    undefined,
  ]) {
    assert.equal(formatExamTime(malformedRemainingSeconds), '00:00');
  }
  for (const malformedState of [
    { examActive: undefined, remainingSeconds: 0, submitted: false, questionCount: 1 },
    { examActive: 'yes', remainingSeconds: 0, submitted: false, questionCount: 1 },
    { examActive: true, remainingSeconds: '0', submitted: false, questionCount: 1 },
    { examActive: true, remainingSeconds: Number.NaN, submitted: false, questionCount: 1 },
    { examActive: true, remainingSeconds: 0, submitted: 0, questionCount: 1 },
    { examActive: true, remainingSeconds: 0, submitted: false, questionCount: '1' },
    { examActive: true, remainingSeconds: 0, submitted: false, questionCount: null },
  ]) {
    assert.equal(shouldAutoSubmitExam(malformedState), false);
  }
});

test('web rewarded unlocks require explicit completion before credit grant path', async () => {
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
    /showRewardedExtraExamAd|rewardPreview|grantRewardedExamCredit|sponsor preview|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
});

test('mock exam access gates only strict boolean entitlement flags', () => {
  const { getMockExamAccessDecision } = loadTs('lib/monetization/rewardedExam.ts');
  const rewardedExamSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedExam.ts'),
    'utf8',
  );
  const accessHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMockExamAccess.ts'),
    'utf8',
  );

  assert.deepEqual(
    getMockExamAccessDecision({
      completedMockExamsToday: 1,
      entitlements: { adsDisabled: false, unlimitedMockExams: 'yes' },
      freeMockExamLimit: 1,
    }),
    {
      canOfferRewardedAd: true,
      canStartExam: false,
      freeExamsRemaining: 0,
      placement: 'rewarded_extra_exam',
      reason: 'rewarded_ad_available',
      rewardedExtraExamCredits: 0,
    },
  );
  assert.equal(
    getMockExamAccessDecision({
      completedMockExamsToday: 1,
      entitlements: { adsDisabled: false, unlimitedMockExams: 1 },
      freeMockExamLimit: 1,
    }).reason,
    'rewarded_ad_available',
  );
  assert.equal(
    getMockExamAccessDecision({
      completedMockExamsToday: 1,
      entitlements: { adsDisabled: 'yes', unlimitedMockExams: false },
      freeMockExamLimit: 1,
    }).reason,
    'rewarded_ad_available',
  );
  assert.match(rewardedExamSource, /import \{ isStrictEntitlementFlag \} from '\.\/premium';/);
  assert.match(rewardedExamSource, /isStrictEntitlementFlag\(entitlements\.unlimitedMockExams\)/);
  assert.match(rewardedExamSource, /isStrictEntitlementFlag\(entitlements\.adsDisabled\)/);
  assert.doesNotMatch(
    rewardedExamSource,
    /if \(entitlements\.(?:unlimitedMockExams|adsDisabled)\)/,
  );
  assert.match(accessHookSource, /import \{ FREE_ENTITLEMENTS, isStrictEntitlementFlag \}/);
  assert.match(accessHookSource, /isStrictEntitlementFlag\(entitlements\.unlimitedMockExams\)/);
});
