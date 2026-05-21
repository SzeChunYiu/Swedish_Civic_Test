const processArgs = () => process.argv.slice(2);

const FOCUSED_VALIDATION_REGISTRY = Object.freeze([
  {
    id: 'authoredSourceParity',
    flags: ['--focus-authored-source-parity'],
    summaryKeys: [
      'authoredSourceQuestionsValidated',
      'authoredSourcePartitionQuestionsValidated',
      'sourcePublicationParityValidated',
      'sourceQuestions',
    ],
  },
  {
    id: 'generatedWhyReasonStems',
    flags: ['--focus-generated-why-reason-stems'],
    summaryKeys: [
      'generatedWhyReasonTargetStemsValidated',
      'generatedWhyReasonTargetStemParityValidated',
    ],
  },
  {
    id: 'generatedLocalizationTemplateParity',
    flags: ['--focus-generated-localization-template-parity'],
    summaryKeys: [
      'generatedLocalizationTemplateParityValidated',
      'generatedPromptTemplateParityValidated',
      'generatedAnswerTemplateParityValidated',
      'generatedPublishedQuestions',
    ],
  },
  {
    id: 'staticV11ReadinessCopy',
    flags: ['--focus-static-v11-readiness-copy'],
    summaryKeys: [
      'staticV11ReadinessUnsupportedPatternsValidated',
      'staticV11ReadinessRequiredCopyValidated',
      'staticV11ReadinessCopyParityValidated',
      'staticValidationSyntaxFilesValidated',
      'staticValidationImportChecksValidated',
      'staticValidationSyntaxGateValidated',
    ],
  },
  {
    id: 'rewardedExamSchema',
    flags: ['--focus-rewarded-exam-schema'],
    summaryKeys: [
      'rewardedAdTypeUnionsValidated',
      'rewardedAdTypeInterfacesValidated',
      'rewardedAdTypeSchemaParityValidated',
      'mockExamAccessTypeUnionsValidated',
      'mockExamAccessTypeInterfacesValidated',
      'mockExamAccessTypeSchemaParityValidated',
    ],
  },
  {
    id: 'mobileAdsConsent',
    flags: ['--focus-mobile-ads-consent'],
    summaryKeys: [
      'adConsentTypeUnionsValidated',
      'adConsentTypeInterfacesValidated',
      'adConsentTypeSchemaParityValidated',
      'mobileAdsConsentTypeInterfacesValidated',
      'mobileAdsConsentTypeSchemaParityValidated',
      'mobileAdsConsentRuntimeCasesValidated',
      'mobileAdsConsentRuntimeParityValidated',
      'mobileAdsConsentHookCasesValidated',
      'mobileAdsConsentHookParityValidated',
    ],
  },
  {
    id: 'monetizationSchema',
    flags: ['--focus-monetization-schema-parity'],
    summaryKeys: [
      'monetizationTypeUnionsValidated',
      'monetizationTypeInterfacesValidated',
      'monetizationTypeSchemaParityValidated',
      'effectiveEntitlementExpiryCasesValidated',
      'effectiveEntitlementExpiryParityValidated',
    ],
  },
  {
    id: 'nativeQuizCopy',
    flags: ['--focus-native-quiz-copy'],
    summaryKeys: [
      'quizRouteHeadersValidated',
      'quizRouteHeaderParityValidated',
      'quizRouteCopyLabelsValidated',
      'quizRouteCopyParityValidated',
      'chapterRouteHeadersValidated',
      'chapterRouteHeaderParityValidated',
      'chapterRouteCopyLabelsValidated',
      'chapterRouteCopyParityValidated',
    ],
  },
  {
    id: 'questionCardAccessibility',
    flags: ['--focus-question-card-accessibility'],
    summaryKeys: [
      'questionCardAccessibilityRulesValidated',
      'questionCardAccessibilityParityValidated',
    ],
  },
  {
    id: 'badgeAccessibility',
    flags: ['--focus-badge-accessibility'],
    summaryKeys: ['badgeAccessibilityRulesValidated', 'badgeAccessibilityParityValidated'],
  },
  {
    id: 'chapterCardAccessibility',
    flags: ['--focus-chapter-card-accessibility'],
    summaryKeys: [
      'chapterCardAccessibilityRulesValidated',
      'chapterCardAccessibilityParityValidated',
    ],
  },
  {
    id: 'explanationPanelAccessibility',
    flags: ['--focus-explanation-panel-accessibility'],
    summaryKeys: [
      'explanationPanelAccessibilityRulesValidated',
      'explanationPanelAccessibilityParityValidated',
    ],
  },
  {
    id: 'legalRouteParity',
    flags: ['--focus-legal-route-parity'],
    summaryKeys: [
      'legalRouteHeadersValidated',
      'legalRouteHeaderParityValidated',
      'swedishPrivacyStreakCopyNaturalnessValidated',
      'legalSwedishEnglishTokenGuardValidated',
      'legalSwedishEnglishTokenGuardParityValidated',
    ],
  },
  {
    id: 'legalSectionRendering',
    flags: ['--focus-legal-section-rendering'],
    summaryKeys: [
      'legalSectionRenderingTestsRoutedValidated',
      'legalSectionRenderingCasesValidated',
      'legalSectionWhitespaceTextValidated',
      'legalSectionFragmentChildrenValidated',
      'legalSectionRawTextUnderViewValidated',
      'legalSectionRenderingParityValidated',
    ],
  },
  {
    id: 'settingsRouteCopy',
    flags: ['--focus-settings-route-copy'],
    summaryKeys: ['settingsRouteCopyLabelsValidated', 'settingsRouteCopyParityValidated'],
  },
  {
    id: 'settingsRoute',
    flags: ['--focus-settings-route'],
    summaryKeys: [
      'settingsRouteHeadersValidated',
      'settingsRouteHeaderParityValidated',
      'settingsRouteCopyLabelsValidated',
      'settingsRouteCopyParityValidated',
      'settingsRouteScrollRulesValidated',
      'settingsRouteScrollParityValidated',
    ],
  },
  {
    id: 'mistakesRouteCopy',
    flags: ['--focus-mistakes-route-copy'],
    summaryKeys: ['mistakesRouteCopyLabelsValidated', 'mistakesRouteCopyParityValidated'],
  },
  {
    id: 'staticHeadMetadata',
    flags: ['--focus-static-head-metadata'],
    summaryKeys: [
      'staticHeadMetadataTitleValidated',
      'staticHeadMetadataDescriptionValidated',
      'staticHeadMetadataOutcomeClaimPatternsValidated',
      'staticHeadMetadataParityValidated',
      'staticValidationSyntaxFilesValidated',
      'staticValidationImportChecksValidated',
      'staticValidationSyntaxGateValidated',
    ],
  },
  {
    id: 'dashboardProgressSnapshot',
    flags: ['--focus-dashboard-progress-snapshot'],
    summaryKeys: [
      'dashboardProgressSnapshotCasesValidated',
      'dashboardProgressSnapshotParityValidated',
    ],
  },
  {
    id: 'settingsStore',
    flags: ['--focus-settings-store', '--focus-settings-parity'],
    summaryKeys: [
      'settingsRouteHeadersValidated',
      'settingsRouteHeaderParityValidated',
      'settingsRouteCopyLabelsValidated',
      'settingsRouteCopyParityValidated',
      'settingsRouteScrollRulesValidated',
      'settingsRouteScrollParityValidated',
      'settingsStoreFieldsValidated',
      'settingsStoreSchemaParityValidated',
      'settingsDailyGoalOptionsValidated',
      'settingsDailyGoalParityValidated',
      'settingsAudioLabelsValidated',
      'settingsAudioParityValidated',
    ],
  },
  {
    id: 'persistenceWarningScope',
    flags: ['--focus-persistence-warning-scope'],
    summaryKeys: [
      'persistenceWarningScopeCasesValidated',
      'persistenceWarningScopeParityValidated',
    ],
  },
  {
    id: 'homeRouteCopy',
    flags: ['--focus-home-route-copy'],
    summaryKeys: [
      'staticValidationSyntaxFilesValidated',
      'staticValidationImportChecksValidated',
      'staticValidationSyntaxGateValidated',
      'homeRouteHeadersValidated',
      'homeRouteHeaderParityValidated',
      'homeRouteCopyLabelsValidated',
      'homeRouteCopyParityValidated',
      'homeRouteInternalBenchmarkCopyValidated',
      'homeRouteSwedishMistakeReviewCopyNaturalnessValidated',
      'countdownBannerHomeMountRulesValidated',
      'countdownBannerHomeMountParityValidated',
    ],
  },
  {
    id: 'countdownBanner',
    flags: ['--focus-countdown-banner-parity', '--focus-countdown-banner'],
    summaryKeys: [
      'citizenshipRulesEffectiveDateValidated',
      'civicKnowledgeTestFirstSittingDateValidated',
      'civicKnowledgeTestDeadlineDateValidated',
      'citizenshipTimelineSourceUrlsValidated',
      'citizenshipTimelineDateParityValidated',
      'countdownBannerTimelineCopyParityValidated',
      'countdownBannerHomeMountRulesValidated',
      'countdownBannerHomeMountParityValidated',
      'studyPlanRuntimeCasesValidated',
      'studyPlanRuntimeParityValidated',
    ],
  },
  {
    id: 'answerOptionAccessibility',
    flags: ['--focus-answer-option-accessibility'],
    summaryKeys: [
      'answerOptionAccessibilityRulesValidated',
      'answerOptionAccessibilityParityValidated',
    ],
  },
  {
    id: 'homeSvMistakeReviewCopy',
    flags: ['--focus-home-sv-mistake-review-copy'],
    summaryKeys: [
      'staticValidationSyntaxFilesValidated',
      'staticValidationImportChecksValidated',
      'staticValidationSyntaxGateValidated',
      'homeRouteSwedishMistakeReviewCopyNaturalnessValidated',
    ],
  },
  {
    id: 'progressSchemaParity',
    flags: ['--focus-progress-schema-parity'],
    summaryKeys: [
      'progressQuestionFieldsValidated',
      'progressQuestionSchemaParityValidated',
      'progressTypeUnionsValidated',
      'progressTypeInterfacesValidated',
      'progressTypeSchemaParityValidated',
      'progressStoreFieldsValidated',
      'progressStoreSchemaParityValidated',
    ],
  },
  {
    id: 'contentTypeSchemaParity',
    flags: ['--focus-content-type-schema-parity'],
    summaryKeys: [
      'contentTypeUnionsValidated',
      'contentTypeInterfacesValidated',
      'contentTypeSchemaParityValidated',
    ],
  },
  {
    id: 'purchaseSchema',
    flags: ['--focus-purchase-schema'],
    summaryKeys: [
      'purchaseTypeUnionsValidated',
      'purchaseTypeInterfacesValidated',
      'purchaseTypeSchemaParityValidated',
    ],
  },
  {
    id: 'generatedTrueFalseNaturalness',
    flags: ['--focus-generated-true-false-naturalness'],
    summaryKeys: [
      'generatedTrueFalseNaturalnessFocusValidated',
      'questionGeneratedTrueFalseNaturalnessValidated',
    ],
  },
  {
    id: 'masteryRules',
    flags: ['--focus-mastery-rules'],
    summaryKeys: ['masteryRulesValidated', 'masteryRulesParityValidated'],
  },
  {
    id: 'weakChapterRules',
    flags: ['--focus-weak-chapter-rules'],
    summaryKeys: ['weakChapterRulesValidated', 'weakChapterRulesParityValidated'],
  },
  {
    id: 'spacedRepetitionSchema',
    flags: ['--focus-spaced-repetition-schema'],
    summaryKeys: [
      'spacedRepetitionIntervalsValidated',
      'spacedRepetitionRuntimeParityValidated',
      'spacedRepetitionRuntimeInputCasesValidated',
      'spacedRepetitionRuntimeInputParityValidated',
    ],
  },
  {
    id: 'mobileAdsConsentHook',
    flags: ['--focus-mobile-ads-consent-hook'],
    summaryKeys: ['mobileAdsConsentHookCasesValidated', 'mobileAdsConsentHookParityValidated'],
  },
  {
    id: 'xpRules',
    flags: ['--focus-xp-rules'],
    summaryKeys: ['xpRulesValidated', 'xpRulesParityValidated'],
  },
  {
    id: 'badgeXpRuntime',
    flags: ['--focus-badge-xp-runtime'],
    summaryKeys: [
      'badgesValidated',
      'badgeMilestoneParityValidated',
      'badgeRuntimeInputCasesValidated',
      'badgeRuntimeInputParityValidated',
      'xpRulesValidated',
      'xpRulesParityValidated',
    ],
  },
  {
    id: 'streakRules',
    flags: ['--focus-streak-rules'],
    summaryKeys: ['streakRulesValidated', 'streakRulesParityValidated'],
  },
  {
    id: 'readinessAdapterRules',
    flags: ['--focus-readiness-adapter-rules'],
    summaryKeys: ['readinessAdapterRulesValidated', 'readinessAdapterRuntimeParityValidated'],
  },
  {
    id: 'adaptivePracticeSize',
    flags: ['--focus-adaptive-practice-size'],
    summaryKeys: [
      'adaptivePracticeSizeRuntimeCasesValidated',
      'adaptivePracticeSizeRuntimeParityValidated',
    ],
  },
  {
    id: 'adaptivePracticeDifficulty',
    flags: ['--focus-adaptive-practice-difficulty'],
    summaryKeys: [
      'adaptivePracticeDifficultyRuntimeCasesValidated',
      'adaptivePracticeDifficultyRuntimeParityValidated',
    ],
  },
  {
    id: 'readinessScoreRules',
    flags: ['--focus-readiness-score-rules'],
    summaryKeys: ['readinessScoreRulesValidated', 'readinessScoreRuntimeParityValidated'],
  },
  {
    id: 'questionReportLinkParity',
    flags: ['--focus-question-report-link-parity'],
    summaryKeys: ['questionReportLinkRulesValidated', 'questionReportLinkParityValidated'],
  },
  {
    id: 'religiousFreedomParallelism',
    flags: ['--focus-religious-freedom-parallelism'],
    summaryKeys: ['publishedQuestions', 'questionReligiousFreedomParallelismValidated'],
  },
  {
    id: 'religiousFreedom1951Naturalness',
    flags: ['--focus-religious-freedom-1951-naturalness'],
    summaryKeys: ['questionReligiousFreedom1951NaturalnessValidated'],
  },
  {
    id: 'answerFeedbackParity',
    flags: ['--focus-answer-feedback-parity'],
    summaryKeys: [
      'publishedQuestions',
      'answerValidationTypeUnionsValidated',
      'answerValidationTypeInterfacesValidated',
      'answerValidationTypeSchemaParityValidated',
      'answerFeedbackQuestionsValidated',
      'answerFeedbackOptionsValidated',
      'answerFeedbackRuntimeParityValidated',
    ],
  },
  {
    id: 'aboutTheTestRouteCopy',
    flags: ['--focus-about-the-test-route-copy'],
    summaryKeys: [
      'aboutTheTestRouteCopyLabelsValidated',
      'aboutTheTestRouteCopyParityValidated',
      'aboutTheTestOfficialSourceUrlsValidated',
      'aboutTheTestOfficialSourceRetrievedDateValidated',
      'aboutTheTestSeenEffectRulesValidated',
      'aboutTheTestSeenEffectParityValidated',
      'citizenshipRequirementsLimitedSeatCopyValidated',
      'citizenshipRequirementsChecklistPersistenceRulesValidated',
      'citizenshipRequirementsChecklistPersistenceParityValidated',
    ],
  },
  {
    id: 'onboardingRouteCopy',
    flags: ['--focus-onboarding-route-copy'],
    summaryKeys: [
      'onboardingRouteHeadersValidated',
      'onboardingRouteHeaderParityValidated',
      'onboardingRouteCopyLabelsValidated',
      'onboardingRouteCopyParityValidated',
      'firstRunAboutModalSuppressedRoutesValidated',
      'firstRunAboutModalSuppressionParityValidated',
    ],
  },
  {
    id: 'onboardingRouteScroll',
    flags: ['--focus-onboarding-route-scroll'],
    summaryKeys: ['onboardingRouteScrollRulesValidated', 'onboardingRouteScrollParityValidated'],
  },
  {
    id: 'mockExamRuntimeParity',
    flags: ['--focus-mock-exam-runtime-parity'],
    summaryKeys: [
      'mockExamConfigTypeFieldsValidated',
      'mockExamConfigTypeSchemaParityValidated',
      'mockExamConfigExactSchemaKeysValidated',
      'mockExamConfigValidated',
      'mockExamRuntimeParityValidated',
      'mockExamChapterBalanceParityValidated',
      'mockExamChapterDistributionSafetyCasesValidated',
      'mockExamChapterDistributionSafetyParityValidated',
      'mockExamTimerParityValidated',
      'examRouteHeadersValidated',
      'examRouteHeaderParityValidated',
      'examRouteCopyLabelsValidated',
      'examRouteCopyParityValidated',
    ],
  },
  {
    id: 'searchRouteQueryHydration',
    flags: ['--focus-search-route-query-hydration'],
    summaryKeys: [
      'searchRouteQueryHydrationRulesValidated',
      'searchRouteQueryHydrationParityValidated',
      'searchQuestionPunctuationRulesValidated',
      'searchQuestionPunctuationParityValidated',
    ],
  },
  {
    id: 'staticEbookProvenance',
    flags: ['--focus-static-ebook-provenance'],
    summaryKeys: [
      'staticEbookExternalSourceUrlsValidated',
      'staticEbookExternalSourceLinkRulesValidated',
      'staticEbookExternalSourceLinkSafetyValidated',
    ],
  },
  {
    id: 'answerShuffleParity',
    flags: ['--focus-answer-shuffle-parity'],
    summaryKeys: [
      'answerShuffleSingleChoiceQuestionsValidated',
      'answerShuffleTrueFalseQuestionsValidated',
      'answerShuffleSeedDistributionsValidated',
      'answerShuffleSessionMovementQuestionsValidated',
      'answerShuffleDistributionParityValidated',
      'publishedQuestions',
    ],
  },
  {
    id: 'adPlacementRouteParity',
    flags: ['--focus-ad-placement-route-parity'],
    summaryKeys: [
      'adPlacementRoutesValidated',
      'noAdRoutesValidated',
      'adPlacementRouteParityValidated',
    ],
  },
  {
    id: 'examSubmissionFinalityParity',
    flags: ['--focus-exam-submission-finality-parity'],
    summaryKeys: ['examSubmissionFinalityParityValidated'],
  },
  {
    id: 'mockExamCopyParity',
    flags: ['--focus-mock-exam-copy-parity'],
    summaryKeys: [
      'nativeMockExamComponentCopyLabelsValidated',
      'nativeMockExamComponentLegalCopyValidated',
      'nativeMockExamLibraryLabelsValidated',
      'nativeMockExamScoreSourceCopyValidated',
      'nativeMockExamSwedishCopyNaturalnessValidated',
      'nativeMockExamTierCopyValidated',
    ],
  },
  {
    id: 'profileRouteCopy',
    flags: ['--focus-profile-route-copy'],
    summaryKeys: [
      'profileRouteHeadersValidated',
      'profileRouteHeaderParityValidated',
      'profileRouteCopyLabelsValidated',
      'profileRouteCopyParityValidated',
      'badgesValidated',
      'badgeMilestoneParityValidated',
    ],
  },
  {
    id: 'uhrReferenceCardAccessibility',
    flags: ['--focus-uhr-reference-card-accessibility'],
    summaryKeys: [
      'uhrReferenceCardAccessibilityRulesValidated',
      'uhrReferenceCardAccessibilityParityValidated',
    ],
  },
  {
    id: 'themeTokenSchema',
    flags: ['--focus-theme-token-schema'],
    summaryKeys: [
      'themeColorTokensValidated',
      'themeSpaceTokensValidated',
      'themeRadiusTokensValidated',
      'themeTypographyTokensValidated',
      'themeShadowTokensValidated',
      'themeMotionTokensValidated',
      'themeBorderWidthTokenFilesValidated',
      'themeBorderWidthTokenParityValidated',
      'themeContrastPairsValidated',
      'themeContrastPairsAAValidated',
      'themeDarkColorTokensValidated',
      'themeDarkContrastPairsValidated',
      'themeDarkContrastPairsAAValidated',
      'themeTokenSchemaValidated',
    ],
  },
  {
    id: 'flashcardAccessibility',
    flags: ['--focus-flashcard-accessibility'],
    summaryKeys: [
      'flashcardAccessibilityRulesValidated',
      'flashcardAccessibilityParityValidated',
      'swedishFlashcardCopyNaturalnessValidated',
    ],
  },
  {
    id: 'audioButtonAccessibility',
    flags: ['--focus-audio-button-accessibility'],
    summaryKeys: [
      'audioButtonAccessibilityRulesValidated',
      'audioButtonAccessibilityParityValidated',
    ],
  },
  {
    id: 'celebrationBurstAccessibility',
    flags: ['--focus-celebration-burst-accessibility'],
    summaryKeys: [
      'celebrationBurstAccessibilityRulesValidated',
      'celebrationBurstAccessibilityParityValidated',
    ],
  },
  {
    id: 'questionSpeechTextParity',
    flags: ['--focus-question-speech-text-parity'],
    summaryKeys: [
      'publishedQuestions',
      'questionSpeechTextQuestionsValidated',
      'questionSpeechTextOptionsValidated',
      'questionSpeechTextParityValidated',
    ],
  },
  {
    id: 'speechRuntimeParity',
    flags: ['--focus-speech-runtime-parity', '--focus-speech-runtime'],
    summaryKeys: ['speechRuntimeCasesValidated', 'speechRuntimeParityValidated'],
  },
  {
    id: 'weeklyRecapRuntime',
    flags: ['--focus-weekly-recap-runtime'],
    summaryKeys: ['weeklyRecapRuntimeCasesValidated', 'weeklyRecapRuntimeParityValidated'],
  },
  {
    id: 'uhrSourceMetadata',
    flags: ['--focus-uhr-source-metadata'],
    summaryKeys: [
      'uhrSourceMetadataValidated',
      'uhrSourceRetrievedDateValidated',
      'uhrMapSourceExactSchemaKeysValidated',
      'uhrMapTextFieldsNormalizedValidated',
    ],
  },
  {
    id: 'questionBankCsv',
    flags: ['--focus-question-bank-csv'],
    summaryKeys: [
      'questions',
      'publishedQuestions',
      'questionBankCsvHeaderColumnsValidated',
      'questionBankCsvUniqueHeaderNamesValidated',
      'questionBankCsvRowsValidated',
      'questionBankCsvProvenanceCounts',
      'questionBankCsvUhrSourcePublisherRowsValidated',
      'questionBankCsvUhrSourcePublisherParityValidated',
    ],
  },
  {
    id: 'somaliGeographyNaturalness',
    flags: ['--focus-somali-geography-naturalness'],
    summaryKeys: [
      'somaliGeographyNaturalnessCasesValidated',
      'somaliGeographyNaturalnessStaticRowsValidated',
      'somaliGeographyNaturalnessParityValidated',
    ],
  },
  {
    id: 'examGeneratorSchema',
    flags: ['--focus-exam-generator-schema'],
    summaryKeys: [
      'examGeneratorTypeAliasesValidated',
      'examGeneratorTypeInterfacesValidated',
      'examGeneratorTypeSchemaParityValidated',
    ],
  },
  {
    id: 'removeAdsHookParity',
    flags: ['--focus-remove-ads-hook-parity'],
    summaryKeys: [
      'removeAdsEntitlementHookCasesValidated',
      'removeAdsEntitlementHookParityValidated',
    ],
  },
  {
    id: 'removeAdsPurchaseRuntimeParity',
    flags: ['--focus-remove-ads-purchase-runtime-parity'],
    summaryKeys: [
      'purchaseTypeUnionsValidated',
      'purchaseTypeInterfacesValidated',
      'purchaseTypeSchemaParityValidated',
      'removeAdsPurchaseRuntimeCasesValidated',
      'removeAdsPurchaseRuntimeParityValidated',
    ],
  },
  {
    id: 'umeaDemonym',
    flags: ['--focus-umea-demonym'],
    summaryKeys: ['questionUmeaDemonymSwedishNaturalnessValidated'],
  },
  {
    id: 'chapterLocalizedText',
    flags: ['--focus-chapter-localized-text'],
    summaryKeys: [
      'chapters',
      'chapterSchemasValidated',
      'chapterTextFieldsNormalizedValidated',
      'chapterExactSchemaKeysValidated',
      'chapterLocalizedTextMapsValidated',
    ],
  },
  {
    id: 'practiceRouteCopyParity',
    flags: ['--focus-practice-route-copy-parity'],
    summaryKeys: [
      'practiceRouteCopyLabelsValidated',
      'practiceRouteCopyParityValidated',
      'provenanceAuthorityCopyFilesValidated',
      'provenanceAuthorityCopyParityValidated',
    ],
  },
  {
    id: 'practiceScoringParity',
    flags: ['--focus-practice-scoring-parity'],
    summaryKeys: ['practiceScoringRulesValidated', 'practiceScoringRulesParityValidated'],
  },
  {
    id: 'practiceFlowParity',
    flags: ['--focus-practice-flow-parity'],
    summaryKeys: ['practiceFlowCasesValidated', 'practiceFlowParityValidated'],
  },
  {
    id: 'sourceMaterialLinkParity',
    flags: ['--focus-source-material-link-parity'],
    summaryKeys: ['uhrSourceMaterialLinkParityValidated'],
  },
  {
    id: 'authoredSourcePartition',
    flags: ['--focus-authored-source-partition'],
    summaryKeys: ['authoredSourceQuestionsValidated', 'authoredSourcePartitionQuestionsValidated'],
  },
  {
    id: 'chapterMetadata',
    flags: ['--focus-chapter-metadata'],
    summaryKeys: [
      'chapters',
      'chapterSchemasValidated',
      'chapterTextFieldsNormalizedValidated',
      'chapterExactSchemaKeysValidated',
    ],
  },
  {
    id: 'launchAdDeferral',
    flags: ['--focus-launch-ad-deferral'],
    summaryKeys: [
      'launchAdSuppressedRoutesValidated',
      'launchAdRouteSuppressionParityValidated',
      'launchAdFirstRunDeferralRulesValidated',
      'launchAdFirstRunDeferralParityValidated',
    ],
  },
  {
    id: 'learnFlashcardSource',
    flags: ['--focus-learn-flashcard-source'],
    summaryKeys: [
      'questionDisclaimerRoutesValidated',
      'questionDisclaimerCopyValidated',
      'learnRouteHeadersValidated',
      'learnRouteHeaderParityValidated',
      'learnRouteLinkCopyLabelsValidated',
      'learnRouteLinkCopyParityValidated',
    ],
  },
  {
    id: 'questionAuthorityBoundary',
    flags: ['--focus-question-authority-boundary'],
    summaryKeys: ['publishedQuestions', 'questionAuthorityBoundaryTextValidated'],
  },
  {
    id: 'questionExactSchemaKeys',
    flags: ['--focus-question-exact-schema-keys'],
    summaryKeys: ['questionExactSchemaKeysValidated'],
  },
  {
    id: 'questionProvenanceRuntime',
    flags: ['--focus-question-provenance-runtime'],
    summaryKeys: [
      'uhrSourceMetadataValidated',
      'questionChapterReferenceParityValidated',
      'uhrReferencesValidated',
    ],
  },
  {
    id: 'svNativeMockExamCopy',
    flags: ['--focus-sv-native-mock-exam-copy'],
    summaryKeys: [
      'nativeMockExamComponentCopyLabelsValidated',
      'nativeMockExamComponentLegalCopyValidated',
      'nativeMockExamScoreSourceCopyValidated',
    ],
  },
  {
    id: 'uhrReferenceSectionPageParity',
    flags: ['--focus-uhr-reference-section-page-parity'],
    summaryKeys: ['uhrMapSectionsValidated', 'uhrMapPageRangesValidated', 'uhrReferencesValidated'],
  },
  {
    id: 'contentExecCwd',
    flags: ['--focus-content-exec-cwd'],
    summaryKeys: [
      'contentTestValidateContentExecCallsValidated',
      'contentTestValidateContentExecCwdPinnedValidated',
      'contentTestValidateContentExecCwdParityValidated',
    ],
  },
]);

const FOCUSED_VALIDATION_REGISTRY_BY_ID = new Map(
  FOCUSED_VALIDATION_REGISTRY.map((entry) => [entry.id, entry]),
);
const SUPPORTED_FOCUSED_VALIDATION_FLAGS = new Set(
  FOCUSED_VALIDATION_REGISTRY.flatMap((entry) => entry.flags),
);

function requestedFocusedValidationFlags(args = processArgs()) {
  return args.filter((arg) => arg.startsWith('--focus-'));
}

function unsupportedFocusedValidationFlags(args = processArgs()) {
  const requestedFlags = requestedFocusedValidationFlags(args);
  return requestedFlags.filter((flag) => !SUPPORTED_FOCUSED_VALIDATION_FLAGS.has(flag));
}

function writeSupportedFocusedValidationFlags() {
  console.error('Supported focus modes:');
  Array.from(SUPPORTED_FOCUSED_VALIDATION_FLAGS)
    .sort()
    .forEach((flag) => console.error(`- ${flag}`));
}

function rejectUnsupportedFocusedValidationFlags(args = processArgs()) {
  const unsupportedFlags = unsupportedFocusedValidationFlags(args);
  if (unsupportedFlags.length === 0) return;

  const plural = unsupportedFlags.length === 1 ? 'flag' : 'flags';
  console.error(`Unsupported validate-content focus ${plural}: ${unsupportedFlags.join(', ')}`);
  writeSupportedFocusedValidationFlags();
  process.exit(1);
}

function focusedValidationRequested(id, args = processArgs()) {
  const entry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get(id);
  if (!entry) throw new Error(`Unknown focused validation registry id: ${id}`);
  return entry.flags.some((flag) => args.includes(flag));
}

module.exports = {
  FOCUSED_VALIDATION_REGISTRY,
  FOCUSED_VALIDATION_REGISTRY_BY_ID,
  SUPPORTED_FOCUSED_VALIDATION_FLAGS,
  focusedValidationRequested,
  rejectUnsupportedFocusedValidationFlags,
  requestedFocusedValidationFlags,
  unsupportedFocusedValidationFlags,
};
