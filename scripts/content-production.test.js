const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const {
  UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS,
  UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS,
} = require('./static-outcome-copy-guard');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const expectedStaticHeadMetadataOutcomePatterns =
  UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS.length + UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS.length;

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

function countByChapter(questions) {
  return questions.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
}

test('chapter questionCount metadata matches the published question distribution', () => {
  const { chapters } = loadTs('data/chapters.ts');
  const { questions } = loadTs('data/questions.ts');
  const publishedCounts = countByChapter(questions);

  assert.deepEqual(
    chapters.map((chapter) => [chapter.id, chapter.questionCount]),
    chapters.map((chapter) => [chapter.id, publishedCounts.get(chapter.id) || 0]),
  );
});

function validateContentSummary(args = []) {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function assertPositiveCounter(summary, key) {
  assert.equal(typeof summary[key], 'number', `${key} should be a numeric counter`);
  assert.ok(summary[key] > 0, `${key} should be positive`);
}

function assertValidatedBooleansAreTrue(summary) {
  const falseKeys = Object.entries(summary)
    .filter(([key, value]) => key.endsWith('Validated') && typeof value === 'boolean' && !value)
    .map(([key]) => key);

  assert.deepEqual(falseKeys, [], `validated boolean summary keys should be true`);
}

test('practice-flow focused summary reports the current validator contract', () => {
  const summary = validateContentSummary(['--focus-practice-flow-parity']);

  assertPositiveCounter(summary, 'practiceFlowCasesValidated');
  assert.equal(summary.practiceFlowParityValidated, true);
});

test('full content production validates published UHR-referenced questions', () => {
  const summary = validateContentSummary(['--json']);
  const expectedPublishedQuestions = summary.sourceQuestions + summary.generatedPublishedQuestions;
  const expectedGeneratedQuestions = summary.sourceQuestions * 4;

  assertValidatedBooleansAreTrue(summary);

  assertPositiveCounter(summary, 'sourceQuestions');
  assertPositiveCounter(summary, 'generatedPublishedQuestions');
  assertPositiveCounter(summary, 'publishedQuestions');
  assertPositiveCounter(summary, 'launchAdSuppressedRoutesValidated');
  assertPositiveCounter(summary, 'removeAdsEntitlementHookCasesValidated');
  assertPositiveCounter(summary, 'practiceFlowCasesValidated');
  assertPositiveCounter(summary, 'practiceScoringRulesValidated');
  assertPositiveCounter(summary, 'progressStoreFieldsValidated');
  assertPositiveCounter(summary, 'settingsRouteCopyLabelsValidated');
  assertPositiveCounter(summary, 'homeRouteCopyLabelsValidated');
  assertPositiveCounter(summary, 'buttonAccessibilityRulesValidated');
  assertPositiveCounter(summary, 'questionCardAccessibilityRulesValidated');
  assertPositiveCounter(summary, 'answerOptionAccessibilityRulesValidated');

  assert.equal(summary.questions, expectedPublishedQuestions);
  assert.equal(summary.publishedQuestions, expectedPublishedQuestions);
  assert.equal(summary.chapterSchemasValidated, 13);
  assert.equal(summary.chapterTextFieldsNormalizedValidated, 13);
  assert.equal(summary.chapterExactSchemaKeysValidated, 13);
  assert.equal(summary.appConfigSchemaValidated, true);
  assert.equal(summary.launchAdRouteSuppressionParityValidated, true);
  assert.equal(summary.questionDisclaimerCopyValidated, true);
  assert.equal(summary.translationCompletenessParityValidated, true);
  assert.equal(summary.translationNaturalnessGuardParityValidated, true);
  assert.equal(summary.examReviewItemsValidated, 20);
  assert.equal(summary.examReviewSourceParityValidated, true);
  assert.equal(summary.examChapterBreakdownItemsValidated, 13);
  assert.equal(summary.examChapterBreakdownParityValidated, true);
  assert.equal(summary.contentTypeUnionsValidated, 3);
  assert.equal(summary.contentTypeSchemaParityValidated, true);
  assert.equal(summary.themeColorTokensValidated, 37);
  assert.equal(summary.themeContrastPairsValidated, 20);
  assert.equal(summary.themeContrastPairsAAValidated, true);
  assert.equal(summary.themeTokenSchemaValidated, true);
  assert.equal(summary.glossaryTermsValidated, summary.glossaryTerms);
  assert.equal(summary.glossaryTermExactSchemaKeysValidated, summary.glossaryTerms);
  assert.ok(summary.uxBenchmarksValidated >= 4);
  assert.ok(summary.supportedLanguagesValidated >= 2);
  assert.equal(summary.localizationStringsValidated, summary.localizationStrings);
  assert.equal(summary.languageSettingsParityValidated, true);
  assert.equal(summary.citizenshipRulesEffectiveDateValidated, '2026-06-06');
  assert.equal(summary.civicKnowledgeTestDeadlineDateValidated, '2026-08-17');
  assert.ok(summary.citizenshipTimelineSourceUrlsValidated >= 3);
  assert.equal(summary.citizenshipTimelineDateParityValidated, true);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);
  assert.equal(summary.practiceFlowParityValidated, true);
  assert.equal(summary.answerFeedbackQuestionsValidated, summary.publishedQuestions);
  assert.ok(summary.answerFeedbackOptionsValidated > summary.answerFeedbackQuestionsValidated);
  assert.equal(summary.answerFeedbackRuntimeParityValidated, true);
  assert.ok(summary.answerShuffleSingleChoiceQuestionsValidated > 100);
  assert.equal(
    summary.answerShuffleSingleChoiceQuestionsValidated +
      summary.answerShuffleTrueFalseQuestionsValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.answerShuffleSeedDistributionsValidated, 50);
  assert.equal(summary.answerShuffleDistributionParityValidated, true);
  assert.equal(summary.questionSpeechTextQuestionsValidated, summary.publishedQuestions);
  assert.ok(
    summary.questionSpeechTextOptionsValidated > summary.questionSpeechTextQuestionsValidated,
  );
  assert.equal(summary.questionSpeechTextParityValidated, true);
  assert.equal(summary.speechRuntimeCasesValidated, 10);
  assert.equal(summary.speechRuntimeParityValidated, true);
  assert.equal(summary.chapterQuizSessionParityValidated, 13);
  assert.equal(summary.generatedPublishedQuestions, expectedGeneratedQuestions);
  assert.equal(summary.authoredSourceQuestionsValidated, summary.sourceQuestions);
  assert.equal(summary.authoredSourcePartitionQuestionsValidated, summary.sourceQuestions);
  assert.equal(summary.sourcePublicationParityValidated, summary.sourceQuestions);
  assert.equal(summary.generationParityValidated, true);
  assert.equal(summary.chapterGenerationParityValidated, 13);
  assert.equal(summary.generatedSourceMetadataParityValidated, summary.generatedPublishedQuestions);
  assert.equal(summary.generatedPromptTemplateParityValidated, summary.generatedPublishedQuestions);
  assert.equal(summary.generatedAnswerTemplateParityValidated, summary.generatedPublishedQuestions);
  assert.equal(
    summary.generatedOptionSourceMaterialWordingValidated,
    summary.generatedPublishedQuestions,
  );
  assert.equal(
    summary.generatedSingleChoiceFillerOptionsValidated,
    summary.generatedPublishedQuestions,
  );
  assert.equal(
    summary.generatedSingleChoiceMetaStemsValidated,
    summary.generatedPublishedQuestions,
  );
  assert.equal(
    summary.generatedSingleChoiceExplanationLabelsValidated,
    summary.generatedPublishedQuestions,
  );
  assert.equal(summary.generatedTrueFalseExplanationMetaValidated, summary.sourceQuestions * 2);
  assert.equal(summary.generatedTagTemplateParityValidated, summary.generatedPublishedQuestions);
  assert.equal(summary.questionSchemasValidated, summary.publishedQuestions);
  assert.equal(summary.publishedQuestionTypesValidated, summary.publishedQuestions);
  assert.equal(summary.questionIdSequencesValidated, summary.publishedQuestions);
  assert.equal(summary.questionBilingualTextPairsValidated, summary.publishedQuestions);
  assert.equal(summary.questionOptionBilingualTextPairsValidated, summary.publishedQuestions);
  assert.equal(summary.questionGeneratedTrueFalseNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionExactSchemaKeysValidated, summary.publishedQuestions);
  assert.equal(summary.questionTextFieldsNormalizedValidated, summary.publishedQuestions);
  assert.equal(summary.questionSentenceEndingsValidated, summary.publishedQuestions);
  assert.equal(summary.questionAuthorityBoundaryTextValidated, summary.publishedQuestions);
  assert.equal(summary.questionNestedMetaStemsValidated, summary.publishedQuestions);
  assert.equal(summary.questionJudgementMetaStemsValidated, summary.publishedQuestions);
  assert.equal(summary.questionPromptTextUniquenessValidated, summary.publishedQuestions);
  assert.equal(summary.questionOptionTextLabelsValidated, summary.publishedQuestions);
  assert.equal(summary.questionTypeOptionCountsValidated, summary.publishedQuestions);
  assert.equal(summary.questionOptionIdConventionsValidated, summary.publishedQuestions);
  assert.ok(summary.trueFalseQuestions > 0);
  assert.equal(summary.trueFalseOptionLabelsValidated, summary.trueFalseQuestions);
  assert.equal(summary.questionTagsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);
  assert.equal(summary.staticSiteQuestionBankQuestionsValidated, summary.publishedQuestions);
  assert.equal(summary.staticSiteQuestionBankChaptersValidated, 13);
  assert.equal(summary.staticSiteQuestionBankParityValidated, true);
  assertPositiveCounter(summary, 'staticHeadMetadataTitleValidated');
  assertPositiveCounter(summary, 'staticHeadMetadataDescriptionValidated');
  assert.equal(
    summary.staticHeadMetadataOutcomeClaimPatternsValidated,
    expectedStaticHeadMetadataOutcomePatterns,
  );
  assert.equal(summary.staticHeadMetadataParityValidated, true);
  assert.equal(summary.staticEbookOutcomeClaimPatternsValidated, 6);
  assert.equal(summary.staticEbookOutcomeClaimParityValidated, true);
  assert.equal(summary.uhrSourceMetadataValidated, true);
  assert.equal(summary.uhrMapExactSchemaKeysValidated, true);
  assert.equal(summary.uhrMapChaptersValidated, 13);
  assert.equal(summary.uhrMapSectionsValidated, 110);
  assert.equal(summary.uhrMapSourceExactSchemaKeysValidated, true);
  assert.equal(summary.uhrMapChapterExactSchemaKeysValidated, 13);
  assert.equal(summary.uhrMapTextFieldsNormalizedValidated, 140);
  assert.equal(summary.uhrMapPageRangesValidated, 13);
  assert.equal(summary.uhrSourceMaterialLinkParityValidated, true);
  assert.equal(summary.uhrSourceRetrievedDateValidated, true);
  assert.equal(summary.questionChapterReferenceParityValidated, summary.publishedQuestions);
  assert.equal(summary.uhrReferencesValidated, summary.publishedQuestions);
});
