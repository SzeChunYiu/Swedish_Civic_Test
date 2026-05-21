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

test('practiceFlowCasesValidated production summary contract stays at 12', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-practice-flow-parity'],
    {
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.practiceFlowCasesValidated, 12);
  assert.equal(summary.practiceFlowParityValidated, true);
});

test('full content production validates published UHR-referenced questions', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  const expectedPublishedQuestions = summary.sourceQuestions + summary.generatedPublishedQuestions;
  const expectedGeneratedQuestions = summary.sourceQuestions * 4;
  assert.equal(summary.questions, expectedPublishedQuestions);
  assert.equal(summary.publishedQuestions, expectedPublishedQuestions);
  assert.equal(summary.chapterSchemasValidated, 13);
  assert.equal(summary.chapterTextFieldsNormalizedValidated, 13);
  assert.equal(summary.chapterExactSchemaKeysValidated, 13);
  assert.equal(summary.appConfigPluginsValidated, 5);
  assert.equal(summary.appConfigSchemaValidated, true);
  assert.equal(summary.launchAdSuppressedRoutesValidated, 8);
  assert.equal(summary.launchAdRouteSuppressionParityValidated, true);
  assert.equal(summary.tabNavigationRulesValidated, 11);
  assert.equal(summary.tabNavigationRoutesValidated, 6);
  assert.equal(summary.tabNavigationParityValidated, true);
  assert.equal(summary.bannerAdPlacementTypeCasesValidated, 3);
  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.equal(summary.releaseMonetizationPolicyFieldsValidated, 13);
  assert.equal(summary.releaseMonetizationPolicyParityValidated, true);
  assert.equal(summary.removeAdsEntitlementHookCasesValidated, 5);
  assert.equal(summary.removeAdsEntitlementHookParityValidated, true);
  assert.equal(summary.premiumEntitlementStatesValidated, 3);
  assert.equal(summary.premiumEntitlementParityValidated, true);
  assert.equal(summary.effectiveEntitlementExpiryOrderingCasesValidated, 3);
  assert.equal(summary.effectiveEntitlementExpiryOrderingParityValidated, true);
  assert.equal(summary.questionDisclaimerRoutesValidated, 6);
  assert.equal(summary.questionDisclaimerCopyValidated, true);
  assert.equal(summary.mockExamConfigTypeFieldsValidated, 5);
  assert.equal(summary.mockExamConfigTypeSchemaParityValidated, true);
  assert.equal(summary.mockExamConfigExactSchemaKeysValidated, true);
  assert.equal(summary.mockExamConfigValidated, true);
  assert.equal(summary.mockExamRuntimeParityValidated, true);
  assert.equal(summary.mockExamChapterBalanceParityValidated, true);
  assert.equal(summary.mockExamTimerParityValidated, true);
  assert.equal(summary.examSubmissionFinalityParityValidated, true);
  assert.equal(summary.examRouteHeadersValidated, 8);
  assert.equal(summary.examRouteHeaderParityValidated, true);
  assert.equal(summary.examRouteCopyLabelsValidated, 68);
  assert.equal(summary.examRouteCopyParityValidated, true);
  assert.equal(summary.quizRouteHeadersValidated, 2);
  assert.equal(summary.quizRouteHeaderParityValidated, true);
  assert.equal(summary.quizRouteCopyLabelsValidated, 16);
  assert.equal(summary.quizRouteCopyParityValidated, true);
  assert.equal(summary.practiceRouteHeadersValidated, 1);
  assert.equal(summary.practiceRouteHeaderParityValidated, true);
  assert.equal(summary.practiceRouteCopyLabelsValidated, 70);
  assert.equal(summary.practiceRouteCopyParityValidated, true);
  assert.equal(summary.chapterRouteHeadersValidated, 3);
  assert.equal(summary.chapterRouteHeaderParityValidated, true);
  assert.equal(summary.chapterRouteCopyLabelsValidated, 14);
  assert.equal(summary.chapterRouteCopyParityValidated, true);
  assert.equal(summary.learnRouteHeadersValidated, 2);
  assert.equal(summary.learnRouteHeaderParityValidated, true);
  assert.equal(summary.learnRouteLinkCopyLabelsValidated, 6);
  assert.equal(summary.learnRouteLinkCopyParityValidated, true);
  assert.equal(summary.profileRouteHeadersValidated, 3);
  assert.equal(summary.profileRouteHeaderParityValidated, true);
  assert.equal(summary.profileRouteCopyLabelsValidated, 40);
  assert.equal(summary.profileRouteCopyParityValidated, true);
  assert.equal(summary.homeRouteHeadersValidated, 6);
  assert.equal(summary.homeRouteHeaderParityValidated, true);
  assert.equal(summary.homeRouteCopyLabelsValidated, 150);
  assert.equal(summary.homeRouteCopyParityValidated, true);
  assert.equal(summary.homeRouteInternalBenchmarkCopyValidated, true);
  assert.equal(summary.mistakesRouteHeadersValidated, 4);
  assert.equal(summary.mistakesRouteHeaderParityValidated, true);
  assert.equal(summary.mistakesRouteCopyLabelsValidated, 30);
  assert.equal(summary.mistakesRouteCopyParityValidated, true);
  assert.equal(summary.mistakeReviewHydrationFixtureCasesValidated, 6);
  assert.equal(summary.mistakeReviewHydrationTestContentParityValidated, true);
  assert.equal(summary.mistakeReviewHydrationValidated, true);
  assert.equal(summary.legalRouteHeadersValidated, 23);
  assert.equal(summary.legalRouteHeaderParityValidated, true);
  assert.equal(summary.swedishPrivacyStreakCopyNaturalnessValidated, true);
  assert.equal(summary.legalSwedishEnglishTokenGuardValidated, 47);
  assert.equal(summary.legalSwedishEnglishTokenGuardParityValidated, true);
  assert.equal(summary.settingsRouteHeadersValidated, 6);
  assert.equal(summary.settingsRouteHeaderParityValidated, true);
  assert.equal(summary.settingsRouteCopyLabelsValidated, 92);
  assert.equal(summary.settingsRouteCopyParityValidated, true);
  assert.equal(summary.onboardingRouteHeadersValidated, 1);
  assert.equal(summary.onboardingRouteHeaderParityValidated, true);
  assert.equal(summary.onboardingRouteCopyLabelsValidated, 17);
  assert.equal(summary.onboardingRouteCopyParityValidated, true);
  assert.equal(summary.screenShellLayoutRulesValidated, 7);
  assert.equal(summary.screenShellLayoutParityValidated, true);
  assert.equal(summary.settingsRouteScrollRulesValidated, 5);
  assert.equal(summary.settingsRouteScrollParityValidated, true);
  assert.equal(summary.onboardingRouteScrollRulesValidated, 5);
  assert.equal(summary.onboardingRouteScrollParityValidated, true);
  assert.equal(summary.legalRouteScrollRulesValidated, 3);
  assert.equal(summary.legalRouteScrollParityValidated, true);
  assert.equal(summary.buttonAccessibilityRulesValidated, 23);
  assert.equal(summary.buttonAccessibilityParityValidated, true);
  assert.equal(summary.cardAccessibilityRulesValidated, 16);
  assert.equal(summary.cardAccessibilityParityValidated, true);
  assert.equal(summary.progressBarAccessibilityRulesValidated, 17);
  assert.equal(summary.progressBarAccessibilityParityValidated, true);
  assert.equal(summary.metricCardAccessibilityRulesValidated, 16);
  assert.equal(summary.metricCardAccessibilityParityValidated, true);
  assert.equal(summary.badgeAccessibilityRulesValidated, 9);
  assert.equal(summary.badgeAccessibilityParityValidated, true);
  assert.equal(summary.chapterCardAccessibilityRulesValidated, 23);
  assert.equal(summary.chapterCardAccessibilityParityValidated, true);
  assert.equal(summary.flashcardAccessibilityRulesValidated, 21);
  assert.equal(summary.flashcardAccessibilityParityValidated, true);
  assert.equal(summary.swedishFlashcardCopyNaturalnessValidated, true);
  assert.equal(summary.audioButtonAccessibilityRulesValidated, 13);
  assert.equal(summary.audioButtonAccessibilityParityValidated, true);
  assert.equal(summary.questionCardAccessibilityRulesValidated, 22);
  assert.equal(summary.questionCardAccessibilityParityValidated, true);
  assert.equal(summary.answerOptionAccessibilityRulesValidated, 19);
  assert.equal(summary.answerOptionAccessibilityParityValidated, true);
  assert.equal(summary.explanationPanelAccessibilityRulesValidated, 10);
  assert.equal(summary.explanationPanelAccessibilityParityValidated, true);
  assert.equal(summary.uhrReferenceCardAccessibilityRulesValidated, 15);
  assert.equal(summary.uhrReferenceCardAccessibilityParityValidated, true);
  assert.equal(summary.celebrationBurstAccessibilityRulesValidated, 13);
  assert.equal(summary.celebrationBurstAccessibilityParityValidated, true);
  assert.equal(summary.examReviewItemsValidated, 20);
  assert.equal(summary.examReviewSourceParityValidated, true);
  assert.equal(summary.examChapterBreakdownItemsValidated, 13);
  assert.equal(summary.examChapterBreakdownParityValidated, true);
  assert.equal(summary.examGeneratorTypeAliasesValidated, 1);
  assert.equal(summary.examGeneratorTypeInterfacesValidated, 6);
  assert.equal(summary.examGeneratorTypeSchemaParityValidated, true);
  assert.equal(summary.contentTypeUnionsValidated, 3);
  assert.equal(summary.contentTypeInterfacesValidated, 5);
  assert.equal(summary.contentTypeSchemaParityValidated, true);
  assert.equal(summary.monetizationTypeUnionsValidated, 2);
  assert.equal(summary.monetizationTypeInterfacesValidated, 3);
  assert.equal(summary.monetizationTypeSchemaParityValidated, true);
  assert.equal(summary.purchaseTypeUnionsValidated, 2);
  assert.equal(summary.purchaseTypeInterfacesValidated, 8);
  assert.equal(summary.purchaseTypeSchemaParityValidated, true);
  assert.equal(summary.removeAdsPurchaseRuntimeCasesValidated, 21);
  assert.equal(summary.removeAdsPurchaseRuntimeParityValidated, true);
  assert.equal(summary.adConsentTypeUnionsValidated, 6);
  assert.equal(summary.adConsentTypeInterfacesValidated, 3);
  assert.equal(summary.adConsentTypeSchemaParityValidated, true);
  assert.equal(summary.mobileAdsConsentTypeInterfacesValidated, 5);
  assert.equal(summary.mobileAdsConsentTypeSchemaParityValidated, true);
  assert.equal(summary.rewardedAdTypeUnionsValidated, 1);
  assert.equal(summary.rewardedAdTypeInterfacesValidated, 3);
  assert.equal(summary.rewardedAdTypeSchemaParityValidated, true);
  assert.equal(summary.mockExamAccessTypeUnionsValidated, 1);
  assert.equal(summary.mockExamAccessTypeInterfacesValidated, 7);
  assert.equal(summary.mockExamAccessTypeSchemaParityValidated, true);
  assert.equal(summary.themeColorTokensValidated, 37);
  assert.equal(summary.themeSpaceTokensValidated, 24);
  assert.equal(summary.themeRadiusTokensValidated, 9);
  assert.equal(summary.themeTypographyTokensValidated, 22);
  assert.equal(summary.themeShadowTokensValidated, 2);
  assert.equal(summary.themeMotionTokensValidated, 7);
  assert.equal(summary.themeContrastPairsValidated, 20);
  assert.equal(summary.themeContrastPairsAAValidated, true);
  assert.equal(summary.themeTokenSchemaValidated, true);
  assert.equal(summary.glossaryTermsValidated, summary.glossaryTerms);
  assert.equal(summary.glossaryTermExactSchemaKeysValidated, summary.glossaryTerms);
  assert.equal(summary.uxBenchmarksValidated, 4);
  assert.equal(summary.supportedLanguagesValidated, 2);
  assert.equal(summary.localizationStringsValidated, summary.localizationStrings);
  assert.equal(summary.languageSettingsParityValidated, true);
  assert.equal(summary.settingsStoreFieldsValidated, 12);
  assert.equal(summary.settingsStoreSchemaParityValidated, true);
  assert.equal(summary.settingsDailyGoalOptionsValidated, 4);
  assert.equal(summary.settingsDailyGoalParityValidated, true);
  assert.equal(summary.settingsAudioLabelsValidated, 2);
  assert.equal(summary.settingsAudioParityValidated, true);
  assert.equal(summary.progressQuestionFieldsValidated, 8);
  assert.equal(summary.progressQuestionSchemaParityValidated, true);
  assert.equal(summary.progressTypeUnionsValidated, 2);
  assert.equal(summary.progressTypeInterfacesValidated, 4);
  assert.equal(summary.progressTypeSchemaParityValidated, true);
  assert.equal(summary.progressStoreFieldsValidated, 12);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.ok(summary.reviewStoreHydrationCasesValidated >= 15);
  assert.equal(summary.reviewStoreHydrationParityValidated, true);
  assert.equal(summary.badgesValidated, 4);
  assert.equal(summary.badgeMilestoneParityValidated, true);
  assert.equal(summary.citizenshipRulesEffectiveDateValidated, '2026-06-06');
  assert.equal(summary.civicKnowledgeTestDeadlineDateValidated, '2026-08-17');
  assert.equal(summary.citizenshipTimelineSourceUrlsValidated, 3);
  assert.equal(summary.citizenshipTimelineDateParityValidated, true);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);
  assert.equal(summary.practiceScoringRulesValidated, 5);
  assert.equal(summary.practiceScoringRulesParityValidated, true);
  assert.equal(summary.practiceFlowCasesValidated, 12);
  assert.equal(summary.practiceFlowParityValidated, true);
  assert.equal(summary.practiceSessionStoreFieldsValidated, 8);
  assert.equal(summary.practiceSessionStoreSchemaParityValidated, true);
  assert.equal(summary.practiceSessionStoreRuntimeParityValidated, true);
  assert.equal(summary.answerValidationTypeUnionsValidated, 1);
  assert.equal(summary.answerValidationTypeInterfacesValidated, 1);
  assert.equal(summary.answerValidationTypeSchemaParityValidated, true);
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
  assert.equal(summary.spacedRepetitionIntervalsValidated, 5);
  assert.equal(summary.spacedRepetitionRuntimeParityValidated, true);
  assert.equal(summary.streakRulesValidated, 6);
  assert.equal(summary.streakRulesParityValidated, true);
  assert.equal(summary.xpRulesValidated, 11);
  assert.equal(summary.xpRulesParityValidated, true);
  assert.equal(summary.masteryRulesValidated, 7);
  assert.equal(summary.masteryRulesParityValidated, true);
  assert.equal(summary.sourceQuestions, 160);
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
  assert.equal(summary.staticHeadMetadataTitleValidated, 1);
  assert.equal(summary.staticHeadMetadataDescriptionValidated, 1);
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
