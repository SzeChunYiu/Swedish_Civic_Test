const processArgs = () => process.argv.slice(2);

const FOCUSED_VALIDATION_REGISTRY = Object.freeze([
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
    id: 'questionCardAccessibility',
    flags: ['--focus-question-card-accessibility'],
    summaryKeys: [
      'questionCardAccessibilityRulesValidated',
      'questionCardAccessibilityParityValidated',
    ],
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
    id: 'questionReportLinkParity',
    flags: ['--focus-question-report-link-parity'],
    summaryKeys: ['questionReportLinkRulesValidated', 'questionReportLinkParityValidated'],
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
    id: 'aboutTheTestRouteCopy',
    flags: ['--focus-about-the-test-route-copy'],
    summaryKeys: [
      'aboutTheTestRouteCopyLabelsValidated',
      'aboutTheTestRouteCopyParityValidated',
      'aboutTheTestOfficialSourceUrlsValidated',
      'aboutTheTestOfficialSourceRetrievedDateValidated',
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
    id: 'contentExecCwd',
    flags: ['--focus-content-exec-cwd'],
    summaryKeys: [
      'contentTestValidateContentExecCallsValidated',
      'contentTestValidateContentExecCwdPinnedValidated',
      'contentTestValidateContentExecCwdParityValidated',
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
    id: 'practiceScoringParity',
    flags: ['--focus-practice-scoring-parity'],
    summaryKeys: ['practiceScoringRulesValidated', 'practiceScoringRulesParityValidated'],
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
    id: 'settingsStore',
    flags: ['--focus-settings-store'],
    summaryKeys: [
      'settingsStoreFieldsValidated',
      'settingsStoreSchemaParityValidated',
      'settingsDailyGoalOptionsValidated',
      'settingsDailyGoalParityValidated',
      'settingsAudioLabelsValidated',
      'settingsAudioParityValidated',
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
    id: 'answerFeedbackParity',
    flags: ['--focus-answer-feedback-parity'],
    summaryKeys: [
      'answerValidationTypeUnionsValidated',
      'answerValidationTypeInterfacesValidated',
      'answerValidationTypeSchemaParityValidated',
      'answerFeedbackQuestionsValidated',
      'answerFeedbackOptionsValidated',
      'answerFeedbackRuntimeParityValidated',
      'questions',
      'publishedQuestions',
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
    id: 'examGeneratorSchema',
    flags: ['--focus-exam-generator-schema'],
    summaryKeys: [
      'examGeneratorTypeAliasesValidated',
      'examGeneratorTypeInterfacesValidated',
      'examGeneratorTypeSchemaParityValidated',
    ],
  },
  {
    id: 'legalRouteParity',
    flags: ['--focus-legal-route-parity'],
    summaryKeys: [
      'legalRouteHeadersValidated',
      'legalRouteHeaderParityValidated',
      'legalSectionRenderingTestsRoutedValidated',
      'legalSectionRenderingCasesValidated',
      'legalSectionWhitespaceTextValidated',
      'legalSectionFragmentChildrenValidated',
      'legalSectionRawTextUnderViewValidated',
      'legalSectionRenderingParityValidated',
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
    id: 'mistakesRouteCopy',
    flags: ['--focus-mistakes-route-copy'],
    summaryKeys: ['mistakesRouteCopyLabelsValidated', 'mistakesRouteCopyParityValidated'],
  },
  {
    id: 'sourceMaterialLinkParity',
    flags: ['--focus-source-material-link-parity'],
    summaryKeys: ['uhrMapExactSchemaKeysValidated', 'uhrSourceMaterialLinkParityValidated'],
  },
  {
    id: 'homeSvMistakeReviewCopy',
    flags: ['--focus-home-sv-mistake-review-copy'],
    summaryKeys: ['homeRouteSwedishMistakeReviewCopyNaturalnessValidated'],
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
