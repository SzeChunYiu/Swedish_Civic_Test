#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function focusedValidationFlagsFromRegistrySource() {
  const source = fs.readFileSync(__filename, 'utf8');
  const declaration = '\nconst FOCUSED_VALIDATION_REGISTRY = Object.freeze(';
  const registryStart = source.indexOf(declaration);
  const registryEnd = source.indexOf(
    '\n]);\n\nconst FOCUSED_VALIDATION_REGISTRY_BY_ID',
    registryStart,
  );
  if (registryStart === -1 || registryEnd === -1) return new Set();

  const registrySource = source.slice(registryStart, registryEnd);
  const flags = new Set();
  for (const match of registrySource.matchAll(/flags:\s*\[([^\]]+)\]/g)) {
    for (const flagMatch of match[1].matchAll(/'(--focus-[^']+)'/g)) {
      flags.add(flagMatch[1]);
    }
  }
  return flags;
}

function rejectUnsupportedFocusedValidationFlagsFromRegistrySource() {
  const requestedFlags = process.argv.slice(2).filter((arg) => arg.startsWith('--focus-'));
  if (requestedFlags.length === 0) return;

  const supportedFlags = focusedValidationFlagsFromRegistrySource();
  const unsupportedFlags = requestedFlags.filter((flag) => !supportedFlags.has(flag));
  if (unsupportedFlags.length === 0) return;

  const plural = unsupportedFlags.length === 1 ? 'flag' : 'flags';
  console.error(`Unsupported validate-content focus ${plural}: ${unsupportedFlags.join(', ')}`);
  console.error('Supported focus modes:');
  Array.from(supportedFlags)
    .sort()
    .forEach((flag) => console.error(`- ${flag}`));
  process.exit(1);
}

rejectUnsupportedFocusedValidationFlagsFromRegistrySource();

const ts = require('typescript');
const vm = require('node:vm');
const {
  buildSiteQuestionBank,
  classifyStaticSiteQuestionBankDrift,
  generateStaticSiteQuestionBankJs,
} = require('./export-site-question-bank');
const { findSourceAuthorityStemPattern } = require('./sourceAuthorityStemPatterns');
const {
  UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS,
  UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS,
  extractStaticHeadMetaDescriptions,
  extractStaticHeadTitles,
  findStaticHeadMetadataDescriptionIssues,
  findStaticHeadMetadataTitleIssues,
  formatUnsupportedStaticOutcomeSlogans,
} = require('./static-outcome-copy-guard');
const {
  STATIC_V11_REQUIRED_READINESS_COPY,
  STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS,
  findMissingStaticV11ReadinessCopyInSource,
  findUnsupportedStaticV11ReadinessCopyInSource,
  formatStaticV11ReadinessCopyIssues,
} = require('./static-v11-readiness-copy-guard');
const {
  collectValidateContentExecFileSyncCalls,
  sourceLineNumberForIndex,
  summarizePinnedCwdCalls,
} = require('./content-exec-cwd-guards');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];
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
    id: 'settingsRouteCopy',
    flags: ['--focus-settings-route-copy'],
    summaryKeys: ['settingsRouteCopyLabelsValidated', 'settingsRouteCopyParityValidated'],
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
    id: 'answerOptionAccessibility',
    flags: ['--focus-answer-option-accessibility'],
    summaryKeys: [
      'answerOptionAccessibilityRulesValidated',
      'answerOptionAccessibilityParityValidated',
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
    id: 'weeklyRecapRuntime',
    flags: ['--focus-weekly-recap-runtime'],
    summaryKeys: ['weeklyRecapRuntimeCasesValidated', 'weeklyRecapRuntimeParityValidated'],
  },
  {
    id: 'readinessAdapterRules',
    flags: ['--focus-readiness-adapter-rules'],
    summaryKeys: ['readinessAdapterRulesValidated', 'readinessAdapterRuntimeParityValidated'],
  },
  {
    id: 'questionReportLinkParity',
    flags: ['--focus-question-report-link-parity'],
    summaryKeys: ['questionReportLinkRulesValidated', 'questionReportLinkParityValidated'],
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
    id: 'mockExamRuntimeParity',
    flags: ['--focus-mock-exam-runtime-parity'],
    summaryKeys: [
      'mockExamConfigTypeFieldsValidated',
      'mockExamConfigTypeSchemaParityValidated',
      'mockExamConfigExactSchemaKeysValidated',
      'mockExamConfigValidated',
      'mockExamRuntimeParityValidated',
      'mockExamChapterBalanceParityValidated',
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
    flags: ['--focus-speech-runtime-parity'],
    summaryKeys: ['speechRuntimeCasesValidated', 'speechRuntimeParityValidated'],
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
    id: 'practiceFlowParity',
    flags: ['--focus-practice-flow-parity'],
    summaryKeys: ['practiceFlowCasesValidated', 'practiceFlowParityValidated'],
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

function rejectUnsupportedFocusedValidationFlags() {
  const requestedFlags = process.argv.slice(2).filter((arg) => arg.startsWith('--focus-'));
  const unsupportedFlags = requestedFlags.filter(
    (flag) => !SUPPORTED_FOCUSED_VALIDATION_FLAGS.has(flag),
  );
  if (unsupportedFlags.length === 0) return;

  const plural = unsupportedFlags.length === 1 ? 'flag' : 'flags';
  console.error(`Unsupported validate-content focus ${plural}: ${unsupportedFlags.join(', ')}`);
  console.error('Supported focus modes:');
  Array.from(SUPPORTED_FOCUSED_VALIDATION_FLAGS)
    .sort()
    .forEach((flag) => console.error(`- ${flag}`));
  process.exit(1);
}

function focusedValidationRequested(id) {
  const entry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get(id);
  if (!entry) throw new Error(`Unknown focused validation registry id: ${id}`);
  return entry.flags.some((flag) => process.argv.includes(flag));
}

rejectUnsupportedFocusedValidationFlags();
const moduleCache = new Map();
const speechEvents = [];
const speechMock = {
  speak(text, options) {
    if (this.throwOnSpeak) throw this.throwOnSpeak;
    speechEvents.push({ type: 'speak', text, options });
  },
  stop() {
    speechEvents.push({ type: 'stop' });
  },
  throwOnSpeak: null,
};
const QUESTION_TYPE_VALUES = ['single_choice', 'true_false', 'flashcard'];
const REVIEW_STATUS_VALUES = ['draft', 'reviewed', 'published'];
const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = new Set(QUESTION_TYPE_VALUES);
const PUBLISHED_QUESTION_TYPES = new Set(['single_choice', 'true_false']);
const DIFFICULTIES = new Set(DIFFICULTY_VALUES);
const REVIEW_STATUSES = new Set(REVIEW_STATUS_VALUES);
const EXPECTED_UX_BENCHMARKS = 4;
const EXPECTED_SOURCE_QUESTIONS = 179;
const EXPECTED_VALIDATION_SCRIPT_SYNTAX_FILES = Object.freeze([
  'scripts/static-outcome-copy-guard.js',
  'scripts/static-v11-readiness-copy-guard.js',
  'scripts/compliance-pages.test.js',
]);
const EXPECTED_BASE_SOURCE_QUESTIONS = 20;
const GENERATED_VARIANTS_PER_SOURCE = 4;
const EXPECTED_PUBLISHED_QUESTIONS =
  EXPECTED_SOURCE_QUESTIONS * (GENERATED_VARIANTS_PER_SOURCE + 1);
const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'];
const TRUE_FALSE_OPTION_IDS = ['true', 'false'];
const GENERATED_VARIANT_CONVENTIONS = [
  { type: 'single_choice', tag: 'section-practice' },
  { type: 'true_false', tag: 'true-false' },
  { type: 'true_false', tag: 'false-statement' },
  { type: 'single_choice', tag: 'judgement' },
];
const UNKNOWN_OPTION = {
  id: 'unknown',
  textSv: 'Inget av alternativen stämmer',
  textEn: 'None of the options is correct',
};
const SOMETIMES_OPTION = {
  id: 'sometimes',
  textSv: 'Endast ibland',
  textEn: 'Only sometimes',
};
const TRUE_FALSE_OPTIONS = [
  { id: 'true', textSv: 'Sant', textEn: 'True' },
  { id: 'false', textSv: 'Falskt', textEn: 'False' },
];
const STATIC_VALIDATION_SYNTAX_FILES = Object.freeze([
  'scripts/static-outcome-copy-guard.js',
  'scripts/static-v11-readiness-copy-guard.js',
  'scripts/compliance-pages.test.js',
  'scripts/static-site-source-provenance-copy.test.js',
]);
const STATIC_VALIDATION_IMPORT_CHECKS = Object.freeze([
  {
    label: 'static outcome copy guard',
    script: "require('./scripts/static-outcome-copy-guard')",
  },
  {
    label: 'static v1.1 readiness copy guard',
    script: "require('./scripts/static-v11-readiness-copy-guard')",
  },
]);
const STATIC_I18N_SOMALI_HIGH_FREQUENCY_KEYS = Object.freeze([
  'hero.eyebrow',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.language',
  'settings.text',
  'settings.misc',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.h.fika',
]);
const STATIC_I18N_SOMALI_EXPECTED_COPY = Object.freeze({
  'hero.lede':
    'Qalab barasho deggan oo aan rasmi ahayn oo kaa caawinaya aqoonta bulshada Iswiidhan. Cutubyo gaaban, tababar kooban, iyo imtixaan tijaabo ah ayaa ka dhigaya dib-u-eegista mid fudud.',
  'hero.cta1': 'Bilow tababarka',
  'hero.cta2': 'Isku day hal su’aal',
  'consent.body':
    'Waxaan isticmaalnaa Google AdSense si aan u muujinno xayaysiisyo kooban. AdSense waxay isticmaashaa cookies, waxaana laga yaabaa inay u adeegsato xayaysiisyo la shakhsiyeeyay. Aqbal dhammaan, kaliya kuwa lagama maarmaanka ah, ama akhri <a href="#/privacy">bogga asturnaanta</a>.',
  'settings.title': 'Dejinta',
  'settings.theme': 'Muuqaalka',
  'settings.theme.auto': 'Si otomaatig ah',
  'settings.consent.reset': 'Dib u deji oggolaanshaha cookies / xayaysiinta…',
  'settings.done': 'Dhammay',
  'footer.t1': 'Si cad wax u baro.',
  'footer.t2': 'Ku tababar ilo cad.',
});
const STATIC_I18N_SOMALI_FORBIDDEN_FRAGMENTS = Object.freeze([
  'Goobinta',
  'Toosan',
  'Gudaha',
  'qaab gaar ah',
  'ka yaraan cabsida ka yaraan',
]);
const STATIC_I18N_ARABIC_HIGH_FREQUENCY_KEYS = Object.freeze([
  'hero.eyebrow',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'nav.ebook',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.language',
  'settings.text',
  'settings.misc',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.h.fika',
  'footer.about.p',
  'footer.fika',
]);
const STATIC_I18N_ARABIC_EXPECTED_COPY = Object.freeze({
  'hero.lede':
    'أداة هادئة وغير رسمية لمراجعة المعرفة المدنية السويدية. فصول قصيرة، تدريب مركز، واختبارات تجريبية تساعدك على فهم المادة دون تعقيد.',
  'hero.cta1': 'ابدأ التدريب',
  'hero.cta2': 'جرّب سؤالاً',
  'nav.ebook': 'دليل الدراسة',
  'consent.body':
    'نستخدم Google AdSense لعرض عدد قليل من الإعلانات. قد يستخدم AdSense ملفات تعريف الارتباط، وقد يستعملها للإعلانات المخصّصة. اقبل الكل، أو الضروري فقط، أو اقرأ <a href="#/privacy">صفحة الخصوصية</a>.',
  'settings.theme': 'المظهر',
  'settings.consent.reset': 'إعادة ضبط موافقة ملفات تعريف الارتباط / الإعلانات…',
  'footer.about.p':
    'هذه أداة دراسة مستقلة. يمكنك البدء مجاناً، ومراجعة الدروس، وتجربة الاختبارات التدريبية.',
  'footer.fika': 'صُنع بروح لاغوم · جُرِّب مع القهوة.',
});
const STATIC_I18N_ARABIC_FORBIDDEN_FRAGMENTS = Object.freeze([
  'اختبار وهمي',
  'موافقة الكوكيز',
  'مُختبر بالقهوة',
  'بناها أشخاص اجتازوا الاختبار',
]);
const STATIC_I18N_ENGLISH_FALLBACKS_BY_KEY = Object.freeze({
  'hero.lede': "A friendly, unofficial study app for Sweden's medborgarskapsprov.",
  'consent.body': 'We use Google AdSense',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.auto': 'Auto',
  'settings.language': 'Language',
  'settings.text': 'Text size',
  'settings.misc': 'Other',
  'settings.consent.reset': 'Reset cookie',
  'settings.savedHint': 'Changes save automatically',
  'settings.done': 'Done',
  'footer.about.p': 'built by people',
  'footer.fika': 'Fika-tested',
  'nav.ebook': 'Ebook',
});
const EXPECTED_UHR_SOURCE = {
  titleKeyword: 'Sverige i fokus',
  publisher: 'Universitets- och högskolerådet (UHR)',
  url: 'https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf',
};
const EXPECTED_UHR_EDUCATION_MATERIAL_URL =
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const EXPECTED_CITIZENSHIP_RULES_EFFECTIVE_DATE = '2026-06-06';
const EXPECTED_CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE = '2026-08-15';
const EXPECTED_CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE = '2026-08-17';
const EXPECTED_CITIZENSHIP_TIMELINE_SOURCE_URLS = {
  rulesEffectiveDate:
    'https://www.migrationsverket.se/nyheter/news-archive/2026-05-06-new-rules-for-swedish-citizenship-from-6-june-2026.html',
  civicKnowledgeTestStart: 'https://www.uhr.se/medborgarskapsprovet/',
  civicKnowledgeTestDeadline:
    'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
};
const EXPECTED_ABOUT_THE_TEST_RETRIEVED_DATE = '2026-05-20';
const EXPECTED_ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
];
const EXPECTED_ABOUT_THE_TEST_COPY_LABELS = {
  sv: [
    'Om provet',
    'Vad är medborgarskapsprovet i samhällskunskap?',
    'Det första provet som UHR beskriver gäller grundläggande kunskaper om det svenska samhället och är planerat till den 15 augusti 2026 i Stockholm.',
    'Vad är det?',
    'Medborgarskapsprovet är ett kunskapsprov som UHR ansvarar för. Första delen handlar om samhällskunskap. Prov i svenska införs senare.',
    'Vem ska göra det?',
    'Migrationsverket avgör vem som får skriva provet. Du kan bara anmäla dig efter ett brev från Migrationsverket. Antalet platser är begränsat, och när platserna är fyllda går det inte längre att anmäla sig. Du kan också uppfylla kunskapskravet på andra sätt än genom provet.',
    'Vad är känt om första provet?',
    'UHR har bekräftat datumet 15 augusti 2026 och Stockholm för den första provomgången. Exakt tid och plats, anpassningar och praktiska förberedelser kommer senare. Augustiprovet är kostnadsfritt och ges som ett utprövningsprov med generös tid.',
    'Vilket material bygger appen på?',
    'Appens UHR-läge utgår från utbildningsmaterialet Sverige i fokus. Våra övningsfrågor är inte UHR:s provfrågor; UHR skriver att övningsprov från andra aktörer inte är kvalitetskontrollerade av myndigheten.',
    'Är appen officiell?',
    'Nej. Appen är ett oberoende studieverktyg. Vi är inte UHR, Skolverket eller Migrationsverket. Frågorna här är inte riktiga provfrågor.',
    'Källäge kontrollerat',
    'Officiella källor',
    'Utgivare',
    'Hämtad',
    'URL',
    'Öppna officiell källa',
    'Tillbaka till start',
    'Tillbaka till startsidan',
    'Börja öva',
    'Öppna övningsläget',
    'Se kravguiden',
    'Öppna guiden för medborgarskapskrav',
  ],
  en: [
    'About the test',
    'What is the Swedish civic test?',
    'The first test described by UHR covers basic knowledge of Swedish society and is planned for 15 August 2026 in Stockholm.',
    'What is it?',
    'The citizenship test is a knowledge test that UHR is responsible for. The first part is about civic knowledge. A Swedish-language test will be introduced later.',
    'Who takes it?',
    'Migrationsverket decides who may take the test. You can only sign up after receiving a letter from Migrationsverket. Seats are limited, and when the seats are filled, registration closes. You may also be able to meet the knowledge requirement in other ways.',
    'What is known about the first test?',
    'UHR has confirmed 15 August 2026 and Stockholm for the first sitting. Exact time and place, adaptations, and practical preparation details will come later. The August test is free of charge and is a trial sitting with generous time.',
    'What material does this app use?',
    "The app's UHR mode is based on the study material Sverige i fokus. Our practice questions are not UHR test questions; UHR says practice tests from other actors are not quality-checked by UHR or another authority.",
    'Is this app official?',
    'No. The app is an independent study tool. We are not UHR, Skolverket, or Migrationsverket. The questions here are not real exam questions.',
    'Source status checked',
    'Official sources',
    'Publisher',
    'Retrieved',
    'URL',
    'Open official source',
    'Back to home',
    'Return to the home screen',
    'Start practising',
    'Open practice mode',
    'View requirements guide',
    'Open the citizenship requirements guide',
  ],
};
const EXPECTED_ABOUT_THE_TEST_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'about-the-test route must import AppLanguage'],
  ['type AboutTheTestCopy = {', 'about-the-test route must define a typed copy contract'],
  ['const officialTestSourceNotes = [', 'about-the-test route must keep official source metadata'],
  [
    'const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = {',
    'about-the-test copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'about-the-test route must read language from settings store',
  ],
  [
    'const copy = aboutTheTestCopy[language];',
    'about-the-test route must select copy from settings language',
  ],
  [
    'sectionSourceBody: `Lägesbilden är kontrollerad ${officialTestSourceNotes[0].retrievedDate}',
    'about-the-test route Swedish source-status copy must use source metadata',
  ],
  [
    'sectionSourceBody: `This status was checked on ${officialTestSourceNotes[0].retrievedDate}',
    'about-the-test route English source-status copy must use source metadata',
  ],
  [
    "import { LegalExternalLink } from '../components/compliance/LegalPage';",
    'about-the-test route must reuse the legal external-link pattern',
  ],
  [
    "publisher: 'Universitets- och högskolerådet (UHR)'",
    'about-the-test route official source notes must expose publisher metadata',
  ],
  [
    "titleEn: 'UHR: About the citizenship test'",
    'about-the-test route official source notes must expose localized source titles',
  ],
  [
    'officialTestSourceNotes.map((source) =>',
    'about-the-test route must render every official source note',
  ],
  ['<LegalExternalLink', 'about-the-test route must render official sources as external links'],
  [
    'href={source.url}',
    'about-the-test route official source links must use the source URL as href',
  ],
  [
    'copy.officialSourcePublisherLabel',
    'about-the-test route official source links must visibly include publisher labels',
  ],
  [
    'source.publisher',
    'about-the-test route official source links must visibly include source publishers',
  ],
  [
    'copy.officialSourceRetrievedLabel',
    'about-the-test route official source links must visibly include retrieved-date labels',
  ],
  [
    'source.retrievedDate',
    'about-the-test route official source links must visibly include retrieved dates',
  ],
  [
    'copy.officialSourceUrlLabel',
    'about-the-test route official source links must visibly include URL labels',
  ],
];
const EXPECTED_ABOUT_THE_TEST_SWEDISH_MOCKPROV_COPY_SOURCES = [
  {
    path: 'app/about-the-test.tsx',
    label: 'about-the-test route',
  },
  {
    path: 'components/onboarding/FirstRunAboutTheTestModal.tsx',
    label: 'first-run about guide',
  },
];
const SWEDISH_MOCKPROV_COPY_PATTERN = /\bmock\s*-?\s*prov(?:et)?\b/i;
const EXPECTED_CITIZENSHIP_REQUIREMENTS_LIMITED_SEAT_SNIPPETS = [
  'Antalet platser är begränsat',
  'när platserna är fyllda går det inte längre att anmäla sig',
  'Seats are limited',
  'when the seats are filled, registration closes',
];
function phrasePattern(...parts) {
  return new RegExp(parts.join(''), 'i');
}
const QUESTION_BANK_CSV_HEADER = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'explanationSv',
  'explanationEn',
  'correctOptionId',
  'optionSv',
  'optionEn',
  'uhrChapter',
  'uhrSection',
  'uhrPageApprox',
  'uhrSourceTitle',
  'uhrSourcePublisher',
  'uhrSourceUrl',
  'uhrSourceRetrievedAt',
  'difficulty',
  'reviewStatus',
  'tags',
  'questionProvenance',
];
const STATIC_EBOOK_UNSUPPORTED_OUTCOME_CLAIM_PATTERNS = [
  /Most people who pass this way/i,
  /three weeks,\s*not three days/i,
  /de flesta[^.?!]*(?:veckor|veckan)[^.?!]*(?:klarar|klara|godk[aä]n|prov)/i,
  /\b(?:typical|most)\s+(?:learners|people|users)[^.?!]*(?:pass|passing)[^.?!]*(?:days?|weeks?|months?)/i,
  /\b(?:pass|passing)\s+(?:rate|likelihood|chance|timeline)\b/i,
  /\b(?:guaranteed?|guarantees?)\s+(?:to\s+)?(?:pass|passing|approval)\b/i,
];
const STATIC_EBOOK_UNSUPPORTED_PRACTICAL_TEST_CLAIM_PATTERNS = [
  phrasePattern('Format of ', 'the real test'),
  phrasePattern('multiple-choice ', 'and timed'),
  phrasePattern('Bring valid ', "ID\\s*\\(BankID,\\s*passport,\\s*or Swedish driver's licence\\)"),
  phrasePattern('Arrive 30 ', 'minutes early'),
  phrasePattern('test centre ', 'is strict'),
  phrasePattern('Multiple-choice:\\s*', 'every question'),
  phrasePattern('You may ', 'retake the test'),
  phrasePattern('There is a ', 'small fee'),
  phrasePattern('Language ', 'requirement:\\s*A2[–-]B1\\s*', '\\(separate test\\)'),
  phrasePattern('På provdagen är ', 'giltig legitimation'),
  phrasePattern('Tidsatt ', 'provträning'),
];
const STATIC_EBOOK_PRACTICAL_TEST_SOURCE_URLS = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
];
const STATIC_EBOOK_PRACTICAL_TEST_REQUIRED_COPY = [
  'OFFICIAL_TEST_SOURCE_NOTES',
  "retrievedDate: '2026-05-19'",
  'first civic-knowledge sitting will be held on 15 August 2026 in Stockholm',
  'only people who receive a letter from Migrationsverket can sign up',
  'Seats are limited',
  'free of charge',
  'generous time',
  'UHR has not yet published the exact time and place',
  'första samhällskunskapsprovet inom medborgarskapsprovet',
  'brev från Migrationsverket',
  'Antalet platser är begränsat',
  'kostnadsfritt',
  'generöst med tid',
  'Praktiska detaljer väntar hos UHR',
];
const STATIC_EBOOK_FACTBOX_SOURCE_URLS = [
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.scb.se/mi0803-en',
  'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
];
const STATIC_EBOOK_UNSUPPORTED_FACTBOX_PATTERNS = [
  /Facts you'll see on the test/i,
  /what you'll see on the test/i,
  /\b69%\s+is\s+forest/i,
  /\b9%\s+lake/i,
  /35\s*000\s+km\s+of\s+coastline/i,
  /Coastline incl\. islands:\s*~35\s*000\s+km/i,
  /world's oldest central bank/i,
  /historically commits\s+~?1%\s+of\s+GNI/i,
  /Citizenship test starts:\s*6 June 2026/i,
];
const STATIC_EBOOK_FACTBOX_REQUIRED_COPY = [
  'EBOOK_FACTBOX_SOURCE_NOTES',
  "retrievedDate: '2026-05-19'",
  'Facts to review',
  'Fakta att repetera',
  'Sources accessed',
  'Källor hämtade',
];

const CRIMINAL_RESPONSIBILITY_CURRENTNESS = {
  sourceId: 'q044',
  retrievedAt: '2026-05-20',
  proposalSubmittedAt: '2026-04-16',
  proposalEffectiveDate: '2026-08-02',
  postEffectiveDateRecheck: {
    recheckedAt: null,
    status: null,
  },
  officialSources: [
    {
      label: 'current-law-main-rule',
      url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/brottsbalk-1962700_sfs-1962-700.',
    },
    {
      label: 'proposal-government-pdf',
      url: 'https://www.regeringen.se/contentassets/c776976adafb4f6890297223ae109e4e/skarpta-regler-for-unga-lagovertradare-prop.-202526246.pdf',
    },
    {
      label: 'proposal-riksdag-html',
      url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/skarpta-regler-for-unga-lagovertradare_hd03246/html/',
    },
  ],
  requiredQuestionSv: /\bhuvudregeln\b/i,
  requiredQuestionEn: /\bmain rule\b/i,
  requiredExplanationSv: [
    /\bhuvudregeln i 1 kap\. 6 § brottsbalken\b/i,
    /\bProposition 2025\/26:246\b/,
    /\b16 april 2026\b/i,
    /\b2 augusti 2026\b/i,
    /\btidsbegränsad sänkning till 13 år\b/i,
    /\bkontrolleras på nytt efter det datumet\b/i,
  ],
  requiredExplanationEn: [
    /\bmain rule in Chapter 1, Section 6 of the Swedish Penal Code\b/i,
    /\bProposition 2025\/26:246\b/,
    /\b16 April 2026\b/,
    /\b2 August 2026\b/,
    /\btime-limited lowering to age 13\b/i,
    /\bshould be rechecked after that date\b/i,
  ],
  stalePatterns: [
    /\bregeringsförslag under 2026\b/i,
    /\b2026 government proposal\b/i,
    /\b13 år gäller ett regeringsförslag\b/i,
    /\bage 13 option refers to\b/i,
  ],
};
const QUESTION_AUTHORITY_OVERCLAIM_PATTERNS = [
  /\bofficial\s+(?:citizenship\s+)?(?:exam|test|question|practice)\b/i,
  /\breal\s+(?:citizenship\s+)?exam\s+questions?\b/i,
  /\b(?:uhr|government|authority)[-\s]?approved\b/i,
  /\bquality[-\s]?controlled\s+by\s+(?:uhr|an?\s+authority|the\s+government)\b/i,
  /\bguarantee[sd]?\s+(?:a\s+)?(?:pass|passing|approval)\b/i,
  /\bofficiell(?:a|t)?\s+(?:prov|test|fr[aå]ga|fr[aå]gor|[oö]vning|[oö]vningar)\b/i,
  /\briktiga\s+provfr[aå]gor\b/i,
  /\b(?:uhr|myndighets|regerings)[-\s]?godk[aä]nd(?:a|t)?\b/i,
  /\bkvalitets(?:granskad|granskade|granskat)\s+av\s+(?:uhr|myndighet|regeringen)\b/i,
  /\bgaranter(?:ar|ad|at)?\s+(?:godk[aä]nt|att\s+klara)\b/i,
];
const QUESTION_AUTHORITY_OVERCLAIM_PATTERN_FIXTURES = [
  'official citizenship test',
  'real citizenship exam questions',
  'UHR-approved practice',
  'quality-controlled by an authority',
  'guaranteed passing',
  'officiella prov',
  'riktiga provfrågor',
  'myndighetsgodkänd övning',
  'kvalitetsgranskad av regeringen',
  'garanterar att klara',
];
const PROVENANCE_AUTHORITY_COPY_OVERCLAIMS = [
  [['Directly', 'from', 'UHR'], 'positive direct-source English badge copy'],
  [['Direkt', 'från', 'UHR'], 'positive direct-source Swedish badge copy'],
  [['traced', 'directly', 'to', 'UHR'], 'positive traced-source English drawer copy'],
  [['kommer', 'direkt', 'från', 'UHR'], 'positive traced-source Swedish drawer copy'],
  [['generated', 'from', 'a', 'UHR', 'question'], 'positive generated-source English copy'],
  [['genererats', 'från', 'en', 'UHR-fråga'], 'positive generated-source Swedish copy'],
].map(([parts, label]) => ({
  label,
  pattern: new RegExp(parts.map((part) => escapeRegExp(part)).join('\\s+'), 'i'),
}));
const PROVENANCE_AUTHORITY_COPY_FILES = [
  'app/(tabs)/practice.tsx',
  'lib/content/provenance.ts',
  'site/practice.js',
  'scripts/validate-content.js',
  'scripts/static-site-question-feedback.test.js',
  'tests/content-practice-route-copy-parity.test.js',
  'tests/content-static-site-source-citation-parity.test.js',
  'tests/e2e/practice-header-controls.spec.ts',
];
const QUESTION_NESTED_META_STEM_PATTERNS = [
  /\bSant eller falskt:\s*Ett korrekt svar på frågan\s+"(?:Sant eller falskt:)?/i,
  /\bTrue or false:\s*A correct answer to\s+"(?:True or false:)?/i,
  /\bEtt korrekt svar på frågan\s+"Sant eller falskt:/i,
  /\bA correct answer to\s+"True or false:/i,
  /\bVilket svar stämmer bäst\?\s*Sant eller falskt:/i,
  /\bWhich answer best matches\?\s*True or false:/i,
];
const QUESTION_JUDGEMENT_META_STEM_PATTERNS = [
  /\bVilket alternativ motsvarar rätt bedömning av påståendet\?/i,
  /\bWhich option gives the correct judgment of the statement\?/i,
];
const QUESTION_REFERENDUM_ADVISORY_SWEDISH_NATURALNESS_PATTERNS = [
  /\bmåste\s+inte\s+följa\s+resultatet\b/i,
];
const QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS = [
  /\bDet stämmer att\s+(?:Ungefär|Havet)\b/i,
  /\bIt is true that\s+(?:The|In|Approximately)\b/i,
  /\bbetyder att politikerna måste (?:inte|alltid) följa resultatet\b/i,
  /\bbelongs to\s+[a-zåäö][^.,"]*/i,
  /\bhör till\s+[a-zåäö][^.,"]*/i,
  /\b(?:Det är korrekt att\s+)?(?:Det att|Svaret är)\b/i,
  /\b(?:It is correct that\s+)?(?:the answer is)\b/i,
  /\bdescribes that\b/i,
  /\bis\s+(?:be|judge)\b/i,
  /\bis an example of municipal responsibilities\b/i,
  /\b(?:has one vote each|may stand for election)\s+is part of\b/i,
  /\b(?:har en röst var|får ställa upp)\s+ingår i\b/i,
  /\bis a way to\b/i,
  /\bär ett sätt att\b/i,
  /\bapplies to\b/i,
  /\bgäller för\b/i,
  /\bare The\b/,
  /^That hitting children is prohibited\b/i,
  /\bdescribes\s+(?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)\b/i,
  /\bbeskriver\s+(?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)\b/i,
  /\bis the list that contains\b/i,
  /\bär listan som innehåller\b/i,
  /\babout public power in Sweden\b/i,
  /\bom offentlig makt i Sverige\b/i,
  /\bmeans it gives\b/i,
  /\binnebär att den ger\b/i,
  /\bfrom (?:13|15) years\b/i,
  /^En anledning är\b/i,
  /^One reason is\b/i,
  /^One reason is to (?:prevent war|decide Swedish municipal taxes)\b/i,
  /^En anledning är att (?:förhindra krig|bestämma svenska kommunalskatter)\b/i,
  /^En anledning är(?: att)? (?:skydda anställdas rättigheter|bestämma vem som blir statschef|bättre jordbruksmetoder|EU-medlemskapet)\b/i,
  /^It was presented in (?:1918|1948)\b/i,
  /^Den presenterades (?:1918|1948)\b/i,
  /^One reason is (?:to (?:protect employees|decide who becomes head of state)|better farming methods|EU membership|eU membership)\b/i,
  /^En anledning är att (?:valet är hemligt|rösterna ska räknas snabbare)\b/i,
  /^One reason is (?:the vote is secret|votes are counted faster)\b/i,
  /^En myndighet som\b/i,
  /^An authority that\b/i,
  /\beU membership\b/,
  /\bOne reason is that so\b/i,
  /\bhave\s+[^.?!]*\bin common\b/i,
  /\bhar\s+[^.?!]*\bgemensamt\b/i,
  /\bcommon to\s+(?:eating|lighting|opening|holding)\b/i,
  /\bcelebrates The\b/,
  /\bfirar traditionellt (?!Jesu födelse\b)[A-ZÅÄÖ]/,
  /\bfirar traditionellt jesu födelse\b/,
  /\bcelebrates jesus' birth\b/,
  /^(?:By|Apply|Leave|Live)\b/i,
  /^(?:Genom att|Representera\b|Arbeta\s|Bo i landet|Lämna Svenska|Samarbetet mellan|Nordiska rådet|Riksdagen och|Islam\.|Jul\.|Påsk\.|Julotta\.|Bön,|[0-9]{4}\.)/i,
  /\bPåståendet är sant:/i,
  /\bThe statement is true:/i,
  /\b(?:Det är inte sant att|Det stämmer inte att|Det stämmer att)\b/i,
  /\b(?:It is not true that|It is true that)\b/i,
  /^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)/i,
  /^Sverige beslutade att barnkonventionen blev svensk lag\b/i,
  /\bär (?:Judar|Danskar),/,
  /^(?:De|They) (?:företräder|bestämmer|represent|decide)\b/i,
  /\batt Kungens makt\b/,
  /\bför Samarbetet mellan\b/,
  /\bfor Cooperation between\b/,
  /^En anledning är att Sverige (?:hade|saknade)\b/,
  /^One reason is that Sweden had\b/,
  /^En anledning är att Det\b/,
  /^One reason is that It\b/,
  /\bhar förändrat bara hur\b/i,
  /\bhas changed only how\b/i,
  /\barbetar för endast\b/i,
  /\bworks for only\b/i,
  /\b(?:den näst största i Sverige|the second largest in Sweden)\b/i,
  /,\s*,/,
  /\bit is common to large bonfires\b/i,
  /\bbrukar\s+\S+\s+arrangerar\b/i,
  /\b(?:spreadinging|welcominging)\b/i,
  /\bAdvent occurs (?:the four Sundays|a Saturday)\b/i,
  /\bthere are buddhist and Hindu\b/,
  /\bcalled Lucia procession\b/i,
  /^En (?:ljuskrona|blomsterkrans) på huvudet\.?$/i,
  /\b(?:fram till julafton|på kvällen)\s+med en adventskalender hemma\b/i,
  /\b(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home\b/i,
  /\bTravel to Asia and increased interest[^.?!]*\bis mentioned\b/i,
  /^That Sweden's first mosques were built\b/i,
  /^Försöka övertyga andra om sina politiska idéer\.?$/i,
  /^Hindra andra från att rösta\.?$/i,
  /^Try to persuade others of their political ideas\.?$/i,
  /^Stop others from voting\.?$/i,
  /^Vårdcentraler, barnavårdscentraler och mödravårdscentraler\.?$/i,
  /^Domstolar, åklagare och kriminalvård\.?$/i,
  /^Health centres, child health centres, and maternity clinics\.?$/i,
  /^Courts, prosecutors, and prison and probation services\.?$/i,
  /^Ordna förskolor, fritidshem, grundskolor och gymnasieskolor\.?$/i,
  /^Betala sjukförsäkring och statliga pensioner\.?$/i,
  /^Arrange preschools, after-school centres, compulsory schools, and upper-secondary schools\.?$/i,
  /^Pay sickness insurance and state pensions\.?$/i,
  /^Vård och service hemma eller boende som är anpassat för äldre personer\.?$/i,
  /^Automatiskt studiestöd och plats på universitet\.?$/i,
  /^Care and services at home or housing adapted for older people\.?$/i,
  /^Automatic study support and a university place\.?$/i,
  /\bskyddar rätten [^.?!]* och skydd mot\b/i,
  /\bprotects the right [^.?!]* and protection from\b/i,
  /\bskyddar att staten väljer\b/i,
  /\bprotects that the state chooses\b/i,
  /\bMånga svenskar firar id al-fitr och Newroz även om\b/i,
  /\bMany Swedes celebrate Eid al-Fitr and Newroz even if\b/i,
  /\bfick rätt att bo i landet och utöva\b/i,
  /\bgained the right to live in the country and practice\b/i,
  /\bnär ett lågt valdeltagande påverkar demokratin\b/i,
  /\bwhen a low voter turnout affects democracy\b/i,
  /^(?:De|They)\s+(?:säljer|drivs|får|finns|kan|måste|sell|are often|may|can|must)\b/i,
  /^(?:Genom|Through)\b/i,
  /\b(?:innehåll där|content there|inlägg där|posts there)\b/i,
];
const QUESTION_LUCIA_ROLE_ENGLISH_NATURALNESS_PATTERNS = [/\b(?:the\s+)?person who is Lucia\b/i];
const QUESTION_EU_COOPERATION_ENGLISH_NATURALNESS_PATTERNS = [
  /\bThe EU is political and economic cooperation between European countries\b/i,
];
const QUESTION_RELIGIOUS_FREEDOM_PARALLELISM_PATTERNS = [
  /\bRätten att utöva sin religion och skydd mot diskriminering på grund av tro\b/i,
  /\bThe right to practice (?:one’s|one's) religion and protection from discrimination because of belief\b/i,
];
const QUESTION_UMEA_DEMONYM_SWEDISH_NATURALNESS_PATTERNS = [/\bumebor\b/i];
const QUESTION_GOOD_FRIDAY_ENGLISH_NATURALNESS_PATTERNS = [
  /\bGood Friday remembers Jesus' death and Easter Sunday his resurrection\b/i,
];
const QUESTION_WORKERS_DAY_HOLIDAY_ENGLISH_NATURALNESS_PATTERNS = [
  /\bDemonstrations on workers[’'] day\b/i,
  /\bHolding demonstrations on workers[’'] day\b/i,
  /\bWorkers[’'] day with demonstrations and speeches\b/,
  /\bmarks workers[’'] day with demonstrations and speeches\b/i,
];
const QUESTION_TRUE_FALSE_STEM_PREFIX_PATTERNS = [
  /^\s*Sant eller falskt\s*:/i,
  /^\s*True or false\s*:/i,
];
const AUTHORED_TRUE_FALSE_EXPLANATION_BOILERPLATE_PATTERNS = [
  /^\s*Påståendet är (?:sant|falskt)[:.]\s*/i,
  /^\s*The statement is (?:true|false)[:.]\s*/i,
  /\b(?:så|därför)\s+(?:är\s+)?påståendet\s+(?:sant|falskt)\b/i,
  /\balternativet\s+(?:Sant|Falskt)\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bso\s+the\s+statement\s+is\s+(?:true|false)\b/i,
  /\bthat\s+makes\s+the\s+statement\s+(?:true|false)\b/i,
  /\bThat makes True correct\b/i,
  /\b(?:True|False)\s+is\s+correct\b/i,
  /\bwhile False\b/i,
];
const GENERATED_OPTION_SOURCE_MATERIAL_PATTERNS = [/\bmaterialet\b/i, /\bfrom the material\b/i];
const GENERATED_SINGLE_CHOICE_FILLER_OPTION_TEXTS = new Set([
  'Inget av alternativen stämmer',
  'None of the options is correct',
  'Endast ibland',
  'Only sometimes',
]);
const GENERATED_SINGLE_CHOICE_META_STEM_PATTERNS = [
  /^\s*Vilket svar är korrekt\?/i,
  /^\s*Which answer is correct\?/i,
  /^\s*Vilket påstående är korrekt/i,
  /^\s*Vilket påstående stämmer bäst/i,
  /^\s*Which statement is correct/i,
  /^\s*Which statement best matches/i,
];
const GENERATED_SINGLE_CHOICE_ABSENT_TRUE_FALSE_EXPLANATION_PATTERNS = [
  /\bPåståendet är sant\b/i,
  /\balternativet\s+Sant\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bThat makes True correct\b/i,
  /\bTrue is correct\b/i,
  /\bwhile False\b/i,
];
const GENERATED_TRUE_FALSE_EXPLANATION_META_PATTERNS = [
  /\bPåståendet är sant\b/i,
  /\bPåståendet är falskt\b/i,
  /\b(?:så\s+påståendet\s+är\s+sant|därför\s+(?:är\s+)?påståendet\s+sant)\b/i,
  /\balternativet\s+Sant\b/i,
  /\balternativet\s+Falskt\b/i,
  /\bFalskt\s+stämmer\b/i,
  /\bmedan\s+Falskt\b/i,
  /\bThe statement is true\b/i,
  /\bThe statement is false\b/i,
  /\bthe statement is true\b/i,
  /\bso\s+the\s+statement\s+is\s+true\b/i,
  /\bthat\s+makes\s+the\s+statement\s+true\b/i,
  /\bThat makes True correct\b/i,
  /\bTrue is correct\b/i,
  /\bFalse is correct\b/i,
  /\bwhile False\b/i,
];
const EXPECTED_BADGE_IDS = ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'];
const EXPECTED_SPACED_REPETITION_SCHEDULE = [1, 3, 7, 15, 30];
const EXPECTED_STREAK_RULE_COUNT = 10;
const EXPECTED_XP_RULE_COUNT = 24;
const EXPECTED_MASTERY_RULE_COUNT = 7;
const EXPECTED_READINESS_ADAPTER_RULE_COUNT = 6;
const EXPECTED_WEEKLY_RECAP_RUNTIME_CASES = 7;
const EXPECTED_SUPPORTED_LANGUAGES = ['sv', 'en'];
const EXPECTED_LANGUAGE_LABELS = {
  sv: 'Swedish',
  en: 'English support',
};
const UNSUPPORTED_SETTINGS_LANGUAGE_SCOPE_LABELS = [
  ['Fråge', 'språk'].join(''),
  ['Byt fråge', 'språk till ${label}'].join(''),
  ['Question ', 'language'].join(''),
  ['Set question ', 'language to ${label}'].join(''),
];
const EXPECTED_PRACTICE_ROUTE_COPY_LABELS = {
  sv: [
    '5-minutersövning',
    'Bokmärk',
    'Bokmärkt',
    'Ta bort bokmärket från den här frågan',
    'Bokmärk den här frågan',
    'Besvarade frågor: ${count}',
    'Det finns inga övningsfrågor ännu.',
    'Nästa fråga',
    'Gå till nästa övningsfråga',
    'Fråga ${questionNumber}',
    'Poäng',
    'Besvara frågan, få direkt återkoppling och granska UHR-källan innan du går vidare.',
    'Försök igen',
    'Försök igen med den här övningsfrågan',
    'Inkludera tilläggsfrågor',
    'Bara UHR-frågor',
    'UHR-källa',
    'Tilläggsfråga',
    'Redaktionell',
    'Om källorna',
    'Stäng om källorna',
    'Frågor skrivna utifrån UHR:s studiematerial Sverige i fokus. Övningsprovet använder bara UHR-hänvisade frågor.',
    'Variant av en appskriven, UHR-hänvisad övningsfråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av övningsprovet.',
    'Dagens utmaning',
    '${remainingSeconds} sekunder kvar',
    'Tiden är ute. Försök igen för att starta om dagens utmaning.',
  ],
  en: [
    '5-minute practice',
    'Bookmark',
    'Bookmarked',
    'Remove this question bookmark',
    'Bookmark this question',
    'Completed questions: ${count}',
    'No practice questions are available yet.',
    'Next question',
    'Move to the next practice question',
    'Question ${questionNumber}',
    'Score',
    'Answer, get instant feedback, then review the UHR source before moving on.',
    'Try again',
    'Try this practice question again',
    'Include supplementary questions',
    'UHR questions only',
    'UHR source',
    'Supplementary',
    'Editorial',
    'About the sources',
    'Close source details',
    "Questions written from UHR's study material Sverige i fokus. The mock exam uses only UHR-referenced questions.",
    'Variant of an app-authored, UHR-referenced practice question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
    'Daily challenge',
    '${remainingSeconds} seconds left',
    "Time is up. Try again to restart today's challenge.",
  ],
};
const EXPECTED_PRACTICE_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'practice route must import AppLanguage from settings'],
  ['type PracticeCopy = {', 'practice route must define a typed copy contract'],
  [
    'const practiceCopy: Record<AppLanguage, PracticeCopy> = {',
    'practice route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'practice route must read language from settings store',
  ],
  [
    'const copy = practiceCopy[language];',
    'practice route must select copy from settings language',
  ],
  ['<Text>{copy.emptyTitle}</Text>', 'empty state must render localized copy'],
  [
    '<Badge>{isChallengeMode ? copy.challengeBadge : copy.badge}</Badge>',
    'practice badge must render localized copy',
  ],
  ['{copy.questionTitle(questionNumber)}', 'question title must render localized copy'],
  ['<Text style={styles.subtitle}>{copy.subtitle}</Text>', 'subtitle must render localized copy'],
  [
    '() => getCompletedQuestionIdsForQuestionBank(practiceQuestionBank, completedQuestionIds)',
    'completed-question metadata must scope persisted progress to the visible question bank',
  ],
  ['visibleCompletedQuestionIds,', 'practice selection must use visible completed-question ids'],
  [
    'copy.completedQuestions(visibleCompletedQuestionIds.length)',
    'completed-question metadata must render localized copy',
  ],
  [
    'accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}',
    'bookmark action must expose localized accessibility copy',
  ],
  [
    '{isBookmarked ? copy.bookmarked : copy.bookmark}',
    'bookmark action must render localized state copy',
  ],
  ['language={language}', 'practice answer components must receive the settings language'],
  [
    '{copy.scoreLabel}: {currentScore.correct}/{currentScore.total}',
    'score label must render localized copy',
  ],
  [
    'accessibilityLabel={copy.nextQuestionAccessibilityLabel}',
    'next-question action must expose localized accessibility copy',
  ],
  ['{copy.nextQuestion}', 'next-question action must render localized copy'],
  [
    'accessibilityLabel={copy.tryAgainAccessibilityLabel}',
    'try-again action must expose localized accessibility copy',
  ],
  ['{copy.tryAgain}', 'try-again action must render localized copy'],
];
const QUESTION_DISCLAIMER_USAGE_PATTERN = /<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/;
const EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS = {
  sv: [
    'innehåll planerat',
    '${completedCount} av ${questionCount} frågor besvarade',
    'Öppna kapitel ${primaryName}. Engelskt namn: ${secondaryName}. Framsteg: ${progressLabel}.',
  ],
  en: [
    'content queued',
    '${completedCount} of ${questionCount} questions practiced',
    'Open chapter ${primaryName}. Swedish name: ${secondaryName}. Progress: ${progressLabel}.',
  ],
};
const EXPECTED_LEARN_ROUTE_LINK_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'learn route must import AppLanguage from settings'],
  ['type ChapterLinkCopy = {', 'learn route must define a typed chapter-link copy contract'],
  [
    'const chapterLinkCopy: Record<AppLanguage, ChapterLinkCopy> = {',
    'learn route chapter-link copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'learn route must read language from settings store',
  ],
  [
    'const copy = chapterLinkCopy[language];',
    'learn route must select chapter-link copy from settings language',
  ],
  [
    'questionCount > 0 ? copy.progressLabel(completedCount, questionCount) : copy.contentQueued',
    'learn route must choose localized progress or queued copy',
  ],
  [
    "const primaryName = language === 'en' ? nameEn : nameSv;",
    'learn route must choose the selected-language chapter name first',
  ],
  [
    "const secondaryName = language === 'en' ? nameSv : nameEn;",
    'learn route must keep the opposite-language chapter name as secondary context',
  ],
  [
    'return copy.accessibilityLabel({ primaryName, secondaryName, progressLabel });',
    'learn route must build chapter link accessibility labels from localized copy',
  ],
  [
    'accessibilityLabel={getChapterLinkAccessibilityLabel({',
    'learn route chapter links must expose localized accessibility labels',
  ],
  ['copy,', 'learn route chapter links must pass localized copy into the label helper'],
  ['language={language}', 'learn route chapter cards must receive the settings language'],
];
const EXPECTED_PROFILE_ROUTE_COPY_LABELS = {
  sv: [
    'Lokal profil',
    'Framsteg utan konto',
    'Dina mål, språkval, sviter och märken sparas på den här enheten för privat studierutin.',
    'nivå',
    'XP',
    'dagars svit',
    '${count} svitskydd redo',
    'Svitskydd',
    'klara',
    'frågor',
    'Studieinställningar',
    'Små dagliga mål är lättare att hålla än långa maratonpass.',
    'svar/dag',
    'Svenska',
    'Märken',
    'Milstolpar gör framsteg synliga utan att störa lärandet.',
    'Låst',
    'Upplåst',
    'Framstegsöversikt',
    'Aktivitet, kapitelframsteg och XP visas på en egen sida.',
    'Visa översikt',
    'Öppna framstegsöversikten',
    'Öppna inställningar',
    'Ta bort annonser är markerat. Köp- och återställningsknapparna finns här.',
  ],
  en: [
    'Local profile',
    'Progress without an account',
    'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    'level',
    'XP',
    'day streak',
    '${count} streak freeze ready',
    'Streak freeze',
    'completed',
    'questions',
    'Study setup',
    'Small daily goals are easier to keep than long cram sessions.',
    'answers/day',
    'English support',
    'Badges',
    'Achievement cues make progress visible without distracting from learning.',
    'Locked',
    'Unlocked',
    'Progress dashboard',
    'Activity, chapter progress, and XP live on a dedicated page.',
    'View dashboard',
    'Open progress dashboard',
    'Open settings',
    'Remove Ads is highlighted. Buy and Restore controls are here.',
  ],
};
const EXPECTED_PROFILE_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'profile route must import AppLanguage from settings'],
  ['type ProfileCopy = {', 'profile route must define a typed copy contract'],
  [
    'const profileCopy: Record<AppLanguage, ProfileCopy> = {',
    'profile route copy must cover every AppLanguage value',
  ],
  ['getAllBadges,', 'profile route must read badge rows from the shared badge catalog'],
  ['getBadgeTitle,', 'profile route badge titles must localize through the badge helpers'],
  [
    'getBadgeDescription,',
    'profile route badge descriptions must localize through the badge helpers',
  ],
  [
    'getBadgeLockedHint,',
    'profile route locked badge hints must localize through the badge helpers',
  ],
  [
    'getBadgeProgressHint,',
    'profile route badge progress hints must localize through the badge helpers',
  ],
  ['type BadgeInput,', 'profile route must type badge-progress inputs'],
  ['const badgeInput: BadgeInput = {', 'profile route must derive badges from typed inputs'],
  [
    'const unlockedBadgeIds = new Set(deriveBadges(badgeInput)',
    'profile route must derive unlocked badges from progress',
  ],
  ['{getAllBadges().map((badge) => {', 'profile route must render the full badge catalog'],
  [
    'title={getBadgeTitle(badge, language)}',
    'profile route badge titles must render localized copy',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'profile route must read language from settings store',
  ],
  ['const copy = profileCopy[language];', 'profile route must select copy from settings language'],
  [
    '<ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>',
    'profile shell must render localized copy',
  ],
  ['label={copy.levelMetric}', 'profile level metric must render localized copy'],
  ['label={copy.xpMetric}', 'profile XP metric must render localized copy'],
  ['label={copy.dayStreakMetric}', 'profile streak metric must render localized copy'],
  ['helper={dayStreakHelper}', 'profile streak helper must render freeze-aware copy'],
  ['freezeBannerCopy(streakWithFreeze, language)', 'profile streak rescue copy must localize'],
  [
    '<Badge tone="warm">{copy.streakFreezeBadge}</Badge>',
    'profile streak freeze badge must localize',
  ],
  ['label={copy.completedMetric}', 'profile completed metric must render localized copy'],
  ['helper={copy.questionsHelper}', 'profile questions helper must render localized copy'],
  ['title={copy.studySetupTitle}', 'profile study setup title must render localized copy'],
  ['subtitle={copy.studySetupSubtitle}', 'profile study setup subtitle must render localized copy'],
  ['{dailyGoalAnswers} {copy.answersPerDay}', 'profile daily goal badge must localize'],
  ['<Badge tone="warm">{copy.languageBadge}</Badge>', 'profile language badge must localize'],
  ['title={copy.badgesTitle}', 'profile badges title must render localized copy'],
  ['subtitle={copy.badgesSubtitle}', 'profile badges subtitle must render localized copy'],
  [
    'accessibilityLabel={copy.openSettingsAccessibilityLabel}',
    'profile settings link must expose localized accessibility copy',
  ],
  ['{copy.studySetupCta}', 'profile settings link must render localized copy'],
  [
    'accessibilityLabel={copy.dashboardAccessibilityLabel}',
    'profile dashboard link must expose localized accessibility copy',
  ],
  ['href="/dashboard"', 'profile dashboard link must route to the dashboard surface'],
  ['label={copy.dashboardCta}', 'profile dashboard link must render localized copy'],
  [
    'const removeAdsPaywall = entitlementsReady ? (',
    'profile premium banner must fail closed while entitlements load',
  ],
  ['nativeID="remove-ads-paywall"', 'profile Remove Ads paywall must keep a stable anchor'],
  ['entitlements={monetizationEntitlements}', 'profile premium banner must receive entitlements'],
  ['language={language}', 'profile premium banner must receive the settings language'],
  ['runtimeOptions={purchaseRuntime}', 'profile premium banner must use the shared runtime'],
  [
    '{entitlementsReady && proRuntimeScopeEnabled ? (',
    'profile Pro tier comparison must fail closed unless the Pro runtime scope is enabled',
  ],
];
const EXPECTED_HOME_ROUTE_COPY_LABELS = {
  sv: [
    'Studieöversikt',
    'Studera lugnt, ett samhällsbegrepp i taget',
    'En tydlig väg för svenska samhällskunskaper: dagliga svar, realistiska prov, genomgång av frågor du missat och källstödda förklaringar.',
    'Dagens mål',
    'Öppna framstegsöversikten',
    'Visa framsteg',
    'Förberedelsesignal',
    'lokalt',
    'Bygg mer underlag',
    'Du gör framsteg',
    'Stadig övning',
    'Stark övningsgrund',
    'Svara på fler frågor för en stabilare lokal signal.',
    'Bygger bara på dina svar och övningsprov i appen, inte en officiell prognos.',
    '${accuracyPercent} % rätt i appen · ${coveragePercent} % av kapitlen provade',
    'Förberedelsesignal: ${score} procent. ${verdict}. ${details}. Bygger bara på dina svar och övningsprov i appen, inte en officiell prognos.',
    'Starta ett tidsatt övningsprov för att jämföra med din lokala förberedelsesignal',
    'Gör ett tidsatt övningsprov',
    'Repetera svaga kapitel',
    'Starta en 5-minutersövning',
    'Starta den rekommenderade övningen',
    'Starta övning',
    'Gå till övningsprovet',
    '${title}: gå till övningsprovet när steget är klart.',
    'Bläddra bland alla samhällskapitel',
    'Bläddra bland kapitel',
    'nivå',
    'XP-baserad',
    'dagars svit',
    'daglig vana',
    '${count} svitskydd redo',
    'Svitskydd',
    'svaga kapitel',
    'behöver repetition',
    'frågor',
    '${count} kapitel',
    'Håll koll på det som behöver övas',
    'Sparade och missade frågor samlas på ett ställe, med källstödda förklaringar och utan annonser i provläget.',
    'Granska bokmärkta eller missade frågor',
    'Repetera sparade frågor',
    'Smarta studievanor',
    'Välj ett tydligt nästa steg, få snabb återkoppling och följ framstegen utan att provläget störs.',
    'Korta pass',
    'Börja med ett litet ämnespass, få direkt återkoppling och fortsätt utan krångel.',
    'Tydlig behärskning',
    'Se vilka områden som är klara, repeterade eller fortfarande svaga.',
    'Vana i vardagen',
    'Få en enkel nästa handling och varsam vanefeedback utan att stoppa seriösa studier.',
    'Tidsatt övning',
    'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
  ],
  en: [
    'Study dashboard',
    'Prepare calmly, one civic concept at a time',
    'A focused path for Swedish civic knowledge: daily answers, realistic mock exams, mistake review, and source-backed explanations.',
    "Today's goal",
    'Open progress dashboard',
    'View dashboard',
    'Preparation signal',
    'local',
    'Build more evidence',
    'Making progress',
    'Steady practice',
    'Strong practice base',
    'Answer more questions for a steadier local signal.',
    'Based only on your in-app answers and mock practice, not an official result forecast.',
    '${accuracyPercent}% in-app accuracy · ${coveragePercent}% chapters tried',
    'Preparation signal: ${score} percent. ${verdict}. ${details}. Based only on your in-app answers and mock practice, not an official result forecast.',
    'Start a timed practice exam to compare with your local preparation signal',
    'Take a timed practice exam',
    'Review weak chapters',
    'Start a 5-minute practice set',
    'Start the recommended practice session',
    'Start practice',
    'Browse all civic chapters',
    'Browse chapters',
    'level',
    'XP-based',
    'day streak',
    'daily habit',
    '${count} streak freeze ready',
    'Streak freeze',
    'weak chapters',
    'needs review',
    'questions',
    '${count} chapters',
    'Keep track of what needs review',
    'Saved and missed questions stay in one place, with source-backed explanations and no ads in exam mode.',
    'Review bookmarked or missed questions',
    'Review saved questions',
    'Smart study habits',
    'Choose one clear next step, get quick feedback, and follow progress without distractions in exam mode.',
    'Bite-size practice',
    'Start with a small topic set, get immediate feedback, and keep moving.',
    'Clear mastery',
    'See which areas are solid, reviewed, or still weak.',
    'Study rhythm',
    'Get one simple next action and gentle habit feedback without blocking serious study.',
    'Timed practice',
    'Switch between timed practice exams, bookmarks, missed-question review, audio, and preparation signals.',
  ],
};
const FORBIDDEN_HOME_ROUTE_LEARNER_COPY = [
  ['Civics', 'Go'],
  ['Citizen', ' Pass'],
  ['Duolingo', '-inspired'],
  ['Life in the UK', ' Test apps'],
  ['Borrowed from', ' successful'],
  ['Lärdomar från', ' framgångsrika'],
  ['Optimized', ' study loop'],
  ['Optimerat', ' studieflöde'],
  ['simulated', ' learners'],
  ['flash', 'cards'],
].map((parts) => parts.join(''));
const EXPECTED_HOME_ROUTE_SWEDISH_MISTAKE_REVIEW_COPY = [
  'genomgång av frågor du missat',
  'bokmärken, missade frågor, ljud',
];
const FORBIDDEN_HOME_ROUTE_SWEDISH_MISTAKE_REVIEW_COPY = [
  /felspårning/i,
  /repetition av misstag/i,
  /upprepning av misstag/i,
];
const FORBIDDEN_HOME_ROUTE_READINESS_COPY = [
  'Redoindikator',
  'redoindikator',
  'Nästan redo',
  'redo-signaler',
  'Provredo',
  'Readiness indicator',
  'readiness indicator',
  'Almost ready',
  'Exam readiness',
  'readiness signals',
  "readinessMetricLabel: 'redo'",
  "readinessMetricLabel: 'ready'",
];
const EXPECTED_HOME_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'home route must import AppLanguage from settings'],
  ['type HomeCopy = {', 'home route must define a typed copy contract'],
  [
    'const homeCopy: Record<AppLanguage, HomeCopy> = {',
    'home route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'home route must read language from settings store',
  ],
  ['const copy = homeCopy[language];', 'home route must select copy from settings language'],
  [
    'const nextAction = weakChapterCount > 0 ? copy.reviewWeakChapters : copy.startPracticeSet;',
    'home route next action must use localized copy',
  ],
  [
    'computeReadinessFromQuestionProgress({',
    'home route must derive the readiness indicator from stored progress',
  ],
  [
    'const mockExamSessions = useProgressStore((state) => state.mockExamSessions);',
    'home route must read persisted mock exam scores',
  ],
  ['mockExamSessions,', 'home route must feed persisted mock exam scores into readiness'],
  [
    'const readinessVerdict = copy.readinessVerdicts[readiness.verdict];',
    'home route readiness verdict must use localized copy',
  ],
  [
    'accessibilityLabel={readinessAccessibilityLabel}',
    'home route readiness card must expose localized accessibility copy',
  ],
  ['href="/exam"', 'home route readiness CTA must link to the mock exam flow'],
  ['eyebrow={copy.eyebrow}', 'home route eyebrow must render localized copy'],
  ['title={copy.title}', 'home route title must render localized copy'],
  ['subtitle={copy.subtitle}', 'home route subtitle must render localized copy'],
  ['{copy.dailyGoalTitle}', 'home daily goal title must render localized copy'],
  [
    'accessibilityLabel={copy.startPracticeAccessibilityLabel}',
    'home practice link must expose localized accessibility copy',
  ],
  ['{copy.startPractice}', 'home practice link must render localized copy'],
  [
    'accessibilityLabel={copy.browseChaptersAccessibilityLabel}',
    'home chapter link must expose localized accessibility copy',
  ],
  ['{copy.browseChapters}', 'home chapter link must render localized copy'],
  ['label={copy.levelMetric}', 'home level metric must render localized copy'],
  ['helper={copy.xpBasedHelper}', 'home XP helper must render localized copy'],
  ['label={copy.dayStreakMetric}', 'home streak metric must render localized copy'],
  ['helper={dayStreakHelper}', 'home streak helper must render freeze-aware copy'],
  ['freezeBannerCopy(streakWithFreeze, language)', 'home streak rescue copy must localize'],
  ['<Badge tone="warm">{copy.streakFreezeBadge}</Badge>', 'home streak freeze badge must localize'],
  ['label={copy.weakChaptersMetric}', 'home weak-chapter metric must render localized copy'],
  ['helper={copy.weakChaptersHelper}', 'home weak-chapter helper must render localized copy'],
  ['label={copy.questionsMetric}', 'home question metric must render localized copy'],
  [
    'helper={copy.questionsHelper(chapters.length)}',
    'home question helper must render localized copy',
  ],
  ['<Badge tone="blue">{copy.feedbackBadge}</Badge>', 'home feedback badge must localize'],
  ['{copy.feedbackTitle}', 'home feedback title must render localized copy'],
  [
    '<Text style={styles.feedbackText}>{copy.feedbackText}</Text>',
    'home feedback body must localize',
  ],
  [
    'accessibilityLabel={copy.feedbackLinkAccessibilityLabel}',
    'home feedback link must expose localized accessibility copy',
  ],
  ['{copy.feedbackLink}', 'home feedback link must render localized copy'],
  ['title={copy.studyLoopTitle}', 'home study-loop title must render localized copy'],
  ['subtitle={copy.studyLoopSubtitle}', 'home study-loop subtitle must render localized copy'],
  ['copy.studyLoopItems[index]', 'home study-loop items must render localized copy by index'],
  ['{itemCopy.label}', 'home study-loop badges must render learner-facing labels'],
  ['{itemCopy.lesson}', 'home study-loop lessons must render learner-facing copy'],
];
const EXPECTED_MISTAKES_ROUTE_COPY_LABELS = {
  sv: [
    'Smart repetition',
    'Sparat',
    'Sparad till senare övning',
    'Bokmärkta frågor',
    'Rätt svar',
    'Öva svåra frågor',
    'Starta övning',
    'När du missar en övningsfråga visas den här.',
    'Inga missade frågor ännu',
    'Missade frågor',
    'Frågor att öva på',
    'Ditt senaste svar',
    'Här samlas frågor du vill öva på igen, med förklaring, källhänvisning och ditt senaste svar.',
    'Misstag',
    'Fel svar: ${count}',
  ],
  en: [
    'Smart review',
    'Saved list',
    'Saved for focused review',
    'Bookmarked questions',
    'Correct answer',
    'Practice weak questions',
    'Start practice',
    'Answer a practice question incorrectly and it will appear here.',
    'No mistakes yet',
    'Mistake log',
    'Wrong answers to revisit',
    'Your latest wrong answer',
    'Review wrong answers with the question, explanation, source reference, and repetition count in one place.',
    'Mistakes',
    'Wrong answers: ${count}',
  ],
};
const EXPECTED_MISTAKES_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'mistakes route must import AppLanguage from settings'],
  ['type MistakesCopy = {', 'mistakes route must define a typed copy contract'],
  [
    'const mistakesCopy: Record<AppLanguage, MistakesCopy> = {',
    'mistakes route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'mistakes route must read language from settings store',
  ],
  [
    'const copy = mistakesCopy[language];',
    'mistakes route must select copy from settings language',
  ],
  ['<Badge tone="orange">{copy.badge}</Badge>', 'mistakes badge must render localized copy'],
  ['{copy.title}', 'mistakes title must render localized copy'],
  [
    '<Text style={styles.subtitle}>{copy.subtitle}</Text>',
    'mistakes subtitle must render localized copy',
  ],
  [
    '<Badge tone="blue">{copy.bookmarkedBadge}</Badge>',
    'bookmarked badge must render localized copy',
  ],
  ['{copy.bookmarkedTitle}', 'bookmarked title must render localized copy'],
  ['{copy.bookmarkedMeta}', 'bookmarked metadata must render localized copy'],
  [
    '<AnswerReviewBlock copy={copy} correctAnswer={correctAnswer} />',
    'bookmarked review cards must show the localized correct answer',
  ],
  ['<Badge tone="orange">{copy.mistakeBadge}</Badge>', 'mistake badge must render localized copy'],
  ['{copy.mistakeTitle}', 'mistake title must render localized copy'],
  [
    '{copy.wrongAnswers(questionProgress[question.id]?.wrongCount ?? 0)}',
    'wrong-count metadata must render localized copy',
  ],
  ['useMistakeReviewStore', 'mistakes route must read stored wrong-answer review text'],
  ['{copy.selectedWrongAnswerLabel}', 'selected wrong-answer label must render localized copy'],
  ['{copy.correctAnswerLabel}', 'correct-answer label must render localized copy'],
  [
    'accessibilityLabel={copy.answerReviewAccessibilityLabel(',
    'answer review must expose localized accessibility summary',
  ],
  ['{copy.emptyTitle}', 'empty title must render localized copy'],
  [
    '<Text style={styles.emptyText}>{copy.emptyText}</Text>',
    'empty text must render localized copy',
  ],
  [
    'accessibilityLabel={copy.emptyPracticeAccessibilityLabel}',
    'empty practice link must expose localized accessibility copy',
  ],
  ['{copy.emptyPracticeLink}', 'empty practice link must render localized copy'],
];
const EXPECTED_DAILY_GOAL_OPTIONS = [5, 10, 20, 40];
const EXPECTED_DAILY_GOAL_DEFAULT = 10;
const EXPECTED_DAILY_GOAL_MIN = 1;
const EXPECTED_DAILY_GOAL_MAX = 50;
const EXPECTED_AUDIO_SETTING_KEY = 'audioEnabled';
const EXPECTED_AUDIO_LABELS = ['Audio enabled', 'Audio disabled'];
const EXPECTED_AUDIO_ACCESSIBILITY_LABELS = ['Disable audio', 'Enable audio'];
const EXPECTED_SPEECH_RUNTIME_CASES = 5;
const EXPECTED_SWEDISH_SPEECH_LANGUAGE = 'sv-SE';
const EXPECTED_SETTINGS_STORE_FIELDS = [
  { name: 'language', type: 'AppLanguage', optional: false },
  { name: 'audioEnabled', type: 'boolean', optional: false },
  { name: 'dailyGoalAnswers', type: 'number', optional: false },
  { name: 'includeSupplementaryQuestions', type: 'boolean', optional: false },
  { name: 'hasSeenAboutTheTest', type: 'boolean', optional: false },
  {
    name: 'persistenceWarning',
    type: 'RecoverablePersistenceWarning | null',
    optional: false,
  },
  { name: 'setLanguage', type: '(language: AppLanguage) => void', optional: false },
  { name: 'setAudioEnabled', type: '(enabled: boolean) => void', optional: false },
  { name: 'setDailyGoalAnswers', type: '(answerCount: number) => void', optional: false },
  { name: 'setIncludeSupplementaryQuestions', type: '(include: boolean) => void', optional: false },
  { name: 'markAboutTheTestSeen', type: '() => void', optional: false },
  { name: 'clearPersistenceWarning', type: '() => void', optional: false },
];
const EXPECTED_APP_CONFIG_PLUGINS = [
  'expo-router',
  'react-native-google-mobile-ads',
  'expo-secure-store',
  'react-native-iap',
  'expo-tracking-transparency',
];
const EXPECTED_APP_NATIVE_IDENTIFIER = 'com.billyyiu.almostswedish';
const EXPECTED_TRACKING_PERMISSION =
  'This identifier may be used to deliver relevant study app ads after consent.';
const EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES = [
  '/exam',
  '/practice',
  '/quiz',
  '/about-the-test',
  '/citizenship-requirements',
  '/disclaimer',
  '/onboarding',
  '/privacy',
  '/sources',
  '/support',
  '/terms',
];
const EXPECTED_FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PREFIXES = [
  '/exam',
  '/quiz',
  '/(auth)',
  '/about-the-test',
  '/onboarding',
];
const EXPECTED_FIRST_RUN_ABOUT_MODAL_ELIGIBLE_PATHS = [
  '/',
  '/home',
  '/learn',
  '/practice',
  '/mistakes',
  '/profile',
];
const EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTE_FILES = {
  '/exam': 'app/(tabs)/exam.tsx',
  '/practice': 'app/(tabs)/practice.tsx',
  '/quiz': 'app/quiz/[sessionId].tsx',
  '/about-the-test': 'app/about-the-test.tsx',
  '/citizenship-requirements': 'app/citizenship-requirements.tsx',
  '/disclaimer': 'app/disclaimer.tsx',
  '/onboarding': 'app/onboarding.tsx',
  '/privacy': 'app/privacy.tsx',
  '/sources': 'app/sources.tsx',
  '/support': 'app/support.tsx',
  '/terms': 'app/terms.tsx',
};
const EXPECTED_TAB_NAVIGATION_ROUTES = [
  { routeName: 'home', sv: 'Hem', en: 'Home' },
  { routeName: 'learn', sv: 'Lär dig', en: 'Learn' },
  { routeName: 'practice', sv: 'Öva', en: 'Practice' },
  { routeName: 'exam', sv: 'Övningsprov', en: 'Exam' },
  { routeName: 'mistakes', sv: 'Repetition', en: 'Mistakes' },
  { routeName: 'profile', sv: 'Profil', en: 'Profile' },
];
const EXPECTED_TAB_NAVIGATION_RULES = [
  {
    label: 'settings language import',
    pattern:
      /import \{ useSettingsStore, type AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'tab route-name union',
    pattern:
      /type TabRouteName = 'home' \| 'learn' \| 'practice' \| 'exam' \| 'mistakes' \| 'profile';/,
  },
  {
    label: 'tab title copy contract',
    pattern: /type TabTitleCopy = Record<TabRouteName, string>;/,
  },
  {
    label: 'localized tab copy map',
    pattern: /const tabTitleCopy: Record<AppLanguage, TabTitleCopy> = \{/,
  },
  {
    label: 'hidden icon helper',
    pattern: /const hiddenTabIcon = \(\) => null;/,
  },
  {
    label: 'tab options helper',
    pattern: /function getTabOptions\(title: string\)/,
  },
  {
    label: 'plain tab title',
    pattern: /title,/,
  },
  {
    label: 'plain tab accessible name',
    pattern: /tabBarAccessibilityLabel: title/,
  },
  {
    label: 'placeholder glyph suppression',
    pattern: /tabBarIcon: hiddenTabIcon/,
  },
  {
    label: 'settings language read',
    pattern: /useSettingsStore\(\(state\) => state\.language\)/,
  },
  {
    label: 'selected tab copy',
    pattern: /const copy = tabTitleCopy\[language\];/,
  },
];
const EXPECTED_SEARCH_ROUTE_QUERY_HYDRATION_RULES = [
  {
    label: 'route params and router import',
    pattern: /import \{ Link, useLocalSearchParams, useRouter \} from 'expo-router';/,
  },
  { label: 'route params type', pattern: /type SearchRouteParams = \{/ },
  { label: 'q param support', pattern: /q\?: string \| string\[\];/ },
  { label: 'query param support', pattern: /query\?: string \| string\[\];/ },
  { label: 'router replacement hook', pattern: /const router = useRouter\(\);/ },
  {
    label: 'local search params read',
    pattern: /const searchParams = useLocalSearchParams<SearchRouteParams>\(\);/,
  },
  {
    label: 'route query resolution',
    pattern: /const routeQuery = getRouteSearchQuery\(searchParams\);/,
  },
  {
    label: 'route query initial state',
    pattern: /const \[query, setQuery\] = useState\(\(\) => routeQuery\);/,
  },
  { label: 'single-value route param helper', pattern: /function getFirstSearchParamValue/ },
  {
    label: 'array route param support',
    pattern: /Array\.isArray\(value\) \? value\[0\] : value/,
  },
  {
    label: 'route query helper',
    pattern: /function getRouteSearchQuery\(params: SearchRouteParams\)/,
  },
  {
    label: 'q then query fallback order',
    pattern:
      /return getFirstSearchParamValue\(params\.q\) \|\| getFirstSearchParamValue\(params\.query\);/,
  },
  { label: 'manual typing remains controlled', pattern: /onChangeText=\{setQuery\}/ },
  { label: 'clear search handler', pattern: /const handleClearSearch = \(\) => \{/ },
  { label: 'clear search state reset', pattern: /setQuery\(''\);/ },
  { label: 'clear search URL replacement', pattern: /router\.replace\('\/search'\);/ },
  { label: 'clear search uses URL-aware handler', pattern: /onPress=\{handleClearSearch\}/ },
  { label: 'submit search handler', pattern: /const handleSubmitSearch = \(\) => \{/ },
  { label: 'submit trims typed query', pattern: /const submittedQuery = query\.trim\(\);/ },
  {
    label: 'empty submit clears URL state',
    pattern: /if \(submittedQuery\.length === 0\) \{[\s\S]*handleClearSearch\(\);/,
  },
  { label: 'submitted query normalizes visible input', pattern: /setQuery\(submittedQuery\);/ },
  {
    label: 'non-empty submit writes q URL param',
    pattern: /router\.replace\(`\/search\?q=\$\{encodeURIComponent\(submittedQuery\)\}`\);/,
  },
  { label: 'search return key submits query', pattern: /onSubmitEditing=\{handleSubmitSearch\}/ },
  { label: 'hydrated query reaches visible input', pattern: /value=\{query\}/ },
  { label: 'hydrated query feeds filtering', pattern: /const trimmedQuery = query\.trim\(\);/ },
];
const EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS = [
  'adSupportedByDefault',
  'adMobAppRecordRequired',
  'appAdsTxtReviewRequired',
  'consentPromptsRequired',
  'noAdPlacements',
  'privacyReviewRequiresBinary',
  'proRuntimeScopeDefaultEnabled',
  'proRuntimeScopeEnvFlag',
  'proRuntimeScopeOverrideGate',
  'realAdsEnvFlag',
  'removeAdsPriceLabel',
  'removeAdsProductId',
  'storeDisclosureTopics',
];
const EXPECTED_RELEASE_CONSENT_PROMPTS = ['app_tracking_transparency', 'ump_consent_form'];
const EXPECTED_RELEASE_NO_AD_PLACEMENTS = ['exam_screen'];
const EXPECTED_RELEASE_STORE_DISCLOSURE_TOPICS = [
  'Google Mobile Ads',
  'Remove Ads in-app purchase',
  'App Tracking Transparency',
  'Google UMP consent',
];
const EXPECTED_RELEASE_REAL_ADS_ENV_FLAG = 'EXPO_PUBLIC_REAL_ADS_ENABLED';
const EXPECTED_ROUTE_AD_PLACEMENTS = [
  {
    file: 'app/(tabs)/home.tsx',
    component: 'AdBanner',
    placement: 'home_banner',
    pattern:
      /<AdBanner\s+entitlements=\{monetizationEntitlements\}\s+placement="home_banner"\s+\/>/,
  },
  {
    file: 'app/(tabs)/learn.tsx',
    component: 'AdBanner',
    placement: 'chapter_list_banner',
    pattern: /<AdBanner\s+placement="chapter_list_banner"\s+\/>/,
  },
  {
    file: 'app/(tabs)/practice.tsx',
    component: 'PracticeInterstitialAd',
    placement: 'quiz_completed_interstitial',
    pattern:
      /<PracticeInterstitialAd\s+showKey=\{getPracticeInterstitialShowKey\(question\.id,\s*shuffleSessionId\)\}\s+\/>/,
  },
  {
    file: 'app/(tabs)/mistakes.tsx',
    component: 'NativeAdCard',
    placement: 'results_native',
    pattern: /<NativeAdCard\s+\/>/,
  },
];
const EXPECTED_NO_AD_ROUTE_FILES = ['app/(tabs)/exam.tsx'];
const EXPECTED_REMOVE_ADS_HOOK_CASES = 8;
const EXPECTED_REMOVE_ADS_PURCHASE_RUNTIME_CASES = 20;
const EXPECTED_REMOVE_ADS_SWEDISH_EXAM_COPY_CASES = 8;
const EXPECTED_MOBILE_ADS_CONSENT_HOOK_CASES = 5;
const EXPECTED_EXAM_ROUTE_HEADERS = [
  {
    label: 'mock exam title',
    pattern: /\{copy\.mockExamTitle\}/,
    styleName: 'title',
    occurrences: 2,
  },
  {
    label: 'exam result title',
    pattern: /\{copy\.examResultTitle\}/,
    styleName: 'title',
    occurrences: 1,
  },
  {
    label: 'exam access title',
    pattern: /\{copy\.accessTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'next exam title',
    pattern: /\{copy\.nextExamTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'chapter breakdown title',
    pattern: /\{copy\.chapterBreakdownTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'question review title',
    pattern: /\{copy\.questionReviewTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
  {
    label: 'progress title',
    pattern: /\{copy\.progressTitle\}/,
    styleName: 'sectionTitle',
    occurrences: 1,
  },
];
const EXPECTED_EXAM_ROUTE_COPY_LABELS = {
  sv: [
    'Övningsprov',
    'Tidsgräns ${durationMinutes} minuter · ${questionCount} UHR-baserade frågor · inga annonser under provet',
    'Tid kvar ${remainingTime} · ${questionCount} UHR-baserade frågor · inga annonser under provet',
    'Provåtkomst',
    'Kontrollerar provåtkomst.',
    'Det gick inte att läsa sparad övningsprovsstatus. Försök igen innan du startar.',
    'Dagens kostnadsfria övningsprov är tillgängligt.',
    'Dagens kostnadsfria övningsprov är använt. Extra prov låses inte upp på provskärmen.',
    'Starta övningsprov',
    'Försök läsa övningsprovsstatus igen',
    'Starta upplåst extra prov',
    'Framsteg',
    '${answeredCount}/${questionCount} besvarade',
    'Välj svaret ${optionText} för fråga ${questionNumber}',
    'Skicka övningsprov',
    'Skicka prov',
    'Provresultat',
    'Övningsresultat',
    'Kapitelöversikt',
    'Frågegenomgång',
    'Fråga ${questionNumber}',
    'Valt svar',
    'Rätt svar',
    'Granska',
    'Rätt',
    'Skickade resultat är slutgiltiga. Starta ett nytt övningsprov för ett nytt försök.',
    'Förklaringar och genomgång visas först efter att provet har skickats in.',
    'Nästa prov',
    'Sparat',
    'Sparar',
  ],
  en: [
    'Mock exam',
    'Time limit ${durationMinutes} minutes · ${questionCount} UHR-based questions · no ads during exam',
    'Time left ${remainingTime} · ${questionCount} UHR-based questions · no ads during exam',
    'Exam access',
    'Checking mock exam access.',
    'Stored mock exam access could not be read. Retry before starting.',
    'Daily free mock exam available.',
    'Daily free mock exam used. Extra exams are not unlocked on the exam screen.',
    'Start mock exam',
    'Retry mock exam access check',
    'Start unlocked extra exam',
    'Progress',
    '${answeredCount}/${questionCount} answered',
    'Select answer ${optionText} for question ${questionNumber}',
    'Submit mock exam',
    'Submit exam',
    'Exam result',
    'Mock exam result',
    'Chapter breakdown',
    'Question review',
    'Question ${questionNumber}',
    'Selected answer',
    'Correct answer',
    'Review',
    'Correct',
    'Submitted results are final. Start another mock exam for a fresh attempt.',
    'Explanations and review are shown only after the exam is submitted.',
    'Next exam',
    'Saved',
    'Saving',
  ],
};
const EXPECTED_EXAM_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'exam route must import AppLanguage from settings'],
  ['type ExamRouteCopy = {', 'exam route must define a typed copy contract'],
  [
    'const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = {',
    'exam route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'exam route must read language from settings store',
  ],
  ['const copy = examRouteCopy[language];', 'exam route must select copy from settings language'],
  [
    "import { ProvenanceBadge } from '../../components/quiz/ProvenanceBadge';",
    'exam route must import shared provenance badge',
  ],
  [
    'const examQuestionById = useMemo(',
    'exam review must keep original question records for provenance badges',
  ],
  ['{copy.mockExamTitle}', 'exam route title must render localized copy'],
  [
    '{copy.heroSubtitle(defaultMockExamConfig.durationMinutes, examQuestions.length)}',
    'exam route hero subtitle must render localized copy',
  ],
  [
    '{copy.activeHeroSubtitle(formatExamTime(remainingSeconds), examQuestions.length)}',
    'active exam hero subtitle must render localized copy',
  ],
  [
    '{copy.answeredCount(answeredCount, examQuestions.length)}',
    'exam progress count must render localized copy',
  ],
  [
    'accessibilityLabel={copy.answerAccessibilityLabel(optionText, index + 1)}',
    'exam answers must expose localized accessibility labels',
  ],
  [
    'accessibilityLabel={copy.submitAccessibilityLabel}',
    'exam submit control must expose localized accessibility labels',
  ],
  ['{copy.submitLabel}', 'exam submit control must render localized copy'],
  [
    '<ProvenanceBadge language={language} question={question} />',
    'exam questions must render provenance badges during active attempts',
  ],
  [
    "language === 'en' ? chapter.chapterNameEn : chapter.chapterNameSv",
    'exam chapter breakdown must use selected-language chapter names',
  ],
  ['{copy.questionReviewTitle}', 'exam review title must render localized copy'],
  [
    '<ProvenanceBadge language={language} question={examQuestionById.get(item.questionId)} />',
    'exam questions must render provenance badges during review',
  ],
  ['{copy.selectedAnswerLabel}', 'exam selected-answer label must render localized copy'],
  ['{copy.correctAnswerLabel}', 'exam correct-answer label must render localized copy'],
  ['ExplanationPanel', 'exam review must render the localized explanation panel'],
  ['language={language}', 'exam review components must receive settings language'],
  ['<UHRReferenceCard language={language}', 'exam UHR references must receive settings language'],
];
const EXPECTED_NATIVE_MOCK_EXAM_COMPONENT_COPY = [
  {
    file: 'app/(tabs)/exam.tsx',
    snippets: [
      ['<ResultSummary', 'exam route must render the neutral result summary'],
      [
        "tone={endedByTime ? 'orange' : 'blue'}",
        'exam result badge must avoid score-threshold styling',
      ],
    ],
  },
  {
    file: 'components/MockExamStatusBar.tsx',
    snippets: [
      ["eyebrowLabel: 'Övningsprov'", 'status bar must default to Swedish practice copy'],
      ["eyebrowLabel: 'Mock exam'", 'status bar must preserve English mock exam copy'],
    ],
  },
  {
    file: 'components/MockExamConfigPanel.tsx',
    snippets: [
      [
        "startLabel: 'Starta övningsprov'",
        'config panel must default to Swedish practice start copy',
      ],
      ["startLabel: 'Start mock exam'", 'config panel must preserve English mock exam start copy'],
    ],
  },
];
const EXPECTED_NATIVE_MOCK_EXAM_LIBRARY_LABELS_SV = Object.freeze([
  'Övningsprov 1 – Mjuk start',
  'Övningsprov 2 – Standard',
  'Övningsprov 3 – Standard',
  'Övningsprov 4 – Standard plus',
  'Övningsprov 5 – Utmaning',
  'Övningsprov 6 – Slutspurt',
  'Slumpmässigt övningsprov',
]);
const UNSUPPORTED_NATIVE_MOCK_EXAM_SWEDISH_TERMS = /\bprovexamen\b|\bprovexamina\b/i;
const NATIVE_MOCK_EXAM_UNSUPPORTED_SCORE_SOURCE_PATTERNS = [
  {
    label: '75% pass line',
    pattern: /75\s*%/,
  },
  {
    label: 'hardcoded 75 percent result threshold',
    pattern: /result\.percent\s*>=\s*75/,
  },
  {
    label: 'Swedish passing-line copy',
    pattern: /Gräns\s+för\s+godkänt/i,
  },
  {
    label: 'English passing-line copy',
    pattern: /Passing\s+line/i,
  },
  {
    label: 'Swedish pass verdict',
    pattern: /\bGodkänt\b/,
  },
  {
    label: 'English pass verdict',
    pattern: /\bPassed\b/,
  },
];
const EXPECTED_QUIZ_ROUTE_HEADERS = [
  {
    label: 'empty quiz title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.emptyTitle\}\s*<\/Text>/,
  },
  {
    label: 'session title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.sessionTitle\(normalizedSessionId\)\}\s*<\/Text>/,
  },
];
const EXPECTED_QUIZ_ROUTE_COPY_LABELS = {
  sv: [
    'Tillbaka till övning',
    'Frågepass',
    'Det finns inga övningsfrågor ännu.',
    'Poäng',
    'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.',
    'Frågepass ${currentSessionId}',
    'Försök igen',
    'Försök igen med den här frågan',
  ],
  en: [
    'Back to Practice',
    'Quiz session',
    'No quiz questions are available yet.',
    'Score',
    'Answer the routed question, then review the source-backed feedback.',
    'Session ${currentSessionId}',
    'Try again',
    'Try this quiz question again',
  ],
};
const EXPECTED_QUIZ_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'quiz route must import AppLanguage from settings'],
  ['type QuizSessionCopy = {', 'quiz route must define a typed copy contract'],
  [
    'const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = {',
    'quiz route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'quiz route must read language from settings store',
  ],
  ['const copy = quizSessionCopy[language];', 'quiz route must select copy from settings language'],
  [
    '<QuestionDisclaimer language={language} />',
    'routed quiz disclaimer must receive settings language',
  ],
  [
    '<QuestionCard question={question} language={language} />',
    'quiz question card must receive settings language',
  ],
  [
    '<AudioButton\n        enabled={audioEnabled}\n        language={language}',
    'quiz audio button must receive settings language',
  ],
  ['<AnswerOption', 'quiz route must render shared answer options'],
  ['language={language}', 'quiz answer components must receive settings language'],
  [
    '{copy.scoreLabel}: {score.correct}/{score.total}',
    'quiz score label must render localized copy',
  ],
  ['<ExplanationPanel', 'quiz route must render the localized explanation panel'],
  ['<UHRReferenceCard language={language}', 'quiz UHR references must receive settings language'],
  [
    'accessibilityLabel={copy.tryAgainAccessibilityLabel}',
    'quiz try-again action must expose localized accessibility copy',
  ],
  ['{copy.tryAgain}', 'quiz try-again action must render localized copy'],
  [
    'accessibilityLabel={copy.backToPracticeAccessibilityLabel}',
    'quiz back-to-practice link must expose localized accessibility copy',
  ],
  ['{copy.backToPractice}', 'quiz back-to-practice link must render localized copy'],
];
const EXPECTED_PRACTICE_ROUTE_HEADERS = [
  {
    label: 'practice question title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.questionTitle\(questionNumber\)\}\s*<\/Text>/,
  },
];
const EXPECTED_CHAPTER_ROUTE_COPY_LABELS = {
  sv: [
    'Tillbaka till kapitellistan',
    'Tillbaka till studievägen',
    'Frågor för det här kapitlet har inte lagts till ännu.',
    'Kapitlet hittades inte',
    'Övningsfrågor (${count})',
    'Starta frågepass',
    'Starta frågepass för ${chapterTitle}',
  ],
  en: [
    'Back to chapter list',
    'Back to Learn',
    'Questions for this chapter are not added yet.',
    'Chapter not found',
    'Practice questions (${count})',
    'Start quiz',
    'Start quiz for ${chapterTitle}',
  ],
};
const SWEDISH_QUIZ_LOANWORD_PATTERNS = [
  new RegExp(['Starta', 'quiz'].join('\\s+')),
  new RegExp(['Quiz', 'pass'].join('')),
  new RegExp(['quiz', 'frågor'].join('')),
  new RegExp(['quiz', 'frågan'].join('')),
];
const EXPECTED_CHAPTER_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'chapter route must import AppLanguage from settings'],
  ['type ChapterRouteCopy = {', 'chapter route must define a typed copy contract'],
  [
    'const chapterRouteCopy: Record<AppLanguage, ChapterRouteCopy> = {',
    'chapter route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'chapter route must read language from settings store',
  ],
  [
    'const copy = chapterRouteCopy[language];',
    'chapter route must select copy from settings language',
  ],
  [
    'chapterDescription: (chapter) => chapter.descriptionSv',
    'chapter route Swedish copy must use the Swedish chapter description',
  ],
  [
    'chapterDescription: (chapter) => chapter.descriptionEn',
    'chapter route English copy must use the English chapter description',
  ],
  [
    'chapterSubtitle: (chapter) => chapter.nameEn',
    'chapter route Swedish copy must expose the English chapter subtitle',
  ],
  [
    'chapterSubtitle: (chapter) => chapter.nameSv',
    'chapter route English copy must expose the Swedish chapter subtitle',
  ],
  [
    'chapterTitle: (chapter) => chapter.nameSv',
    'chapter route Swedish copy must use Swedish chapter titles',
  ],
  [
    'chapterTitle: (chapter) => chapter.nameEn',
    'chapter route English copy must use English chapter titles',
  ],
  ['const chapterTitle = copy.chapterTitle(chapter);', 'chapter title must resolve from copy'],
  [
    'accessibilityLabel={copy.backToListAccessibilityLabel}',
    'chapter route back link must expose localized accessibility copy',
  ],
  ['{copy.backToLearn}', 'chapter route back link must render localized copy'],
  ['{chapterTitle}', 'chapter route title must render localized chapter copy'],
  ['{copy.chapterSubtitle(chapter)}', 'chapter route subtitle must render localized copy'],
  ['{copy.chapterDescription(chapter)}', 'chapter route description must render localized copy'],
  [
    'accessibilityLabel={copy.startQuizAccessibilityLabel(chapterTitle)}',
    'chapter route quiz link must expose localized accessibility copy',
  ],
  ['{copy.startQuiz}', 'chapter route quiz link must render localized copy'],
  [
    '{copy.practiceQuestionsTitle(chapterQuestions.length)}',
    'chapter route section title must render localized copy',
  ],
  ['{copy.emptyQuestions}', 'chapter route empty state must render localized copy'],
  [
    'UHRReferenceCard language={language}',
    'chapter route UHR cards must receive settings language',
  ],
];
const EXPECTED_CHAPTER_ROUTE_HEADERS = [
  {
    label: 'missing chapter title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.missingTitle\}\s*<\/Text>/,
  },
  {
    label: 'chapter title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{chapterTitle\}\s*<\/Text>/,
  },
  {
    label: 'practice questions section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.practiceQuestionsTitle\(chapterQuestions\.length\)\}\s*<\/Text>/,
  },
];
const EXPECTED_LEARN_ROUTE_HEADERS = [
  {
    label: 'learn route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{routeCopy\.title\}/,
  },
  {
    label: 'chapter-list section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{routeCopy\.sectionTitle\}/,
  },
];
const EXPECTED_PROFILE_ROUTE_HEADERS = [
  {
    label: 'profile route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{copy\.title\}/,
  },
  {
    label: 'study setup section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.studySetupTitle\}/,
  },
  {
    label: 'badges section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.badgesTitle\}/,
  },
];
const EXPECTED_HOME_ROUTE_HEADERS = [
  {
    label: 'home route title',
    pattern: /<ScreenShell[\s\S]*\btitle=\{copy\.title\}/,
  },
  {
    label: 'daily goal card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.goalLabel\}>\s*\{copy\.dailyGoalTitle\}\s*<\/Text>/,
  },
  {
    label: 'readiness card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.readinessTitle\}>\s*\{copy\.readinessTitle\}\s*<\/Text>/,
  },
  {
    label: 'feedback card title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.feedbackTitle\}>\s*\{copy\.feedbackTitle\}\s*<\/Text>/,
  },
  {
    label: 'study-loop section title',
    pattern: /<SectionHeader[\s\S]*\btitle=\{copy\.studyLoopTitle\}/,
  },
];
const EXPECTED_MISTAKES_ROUTE_HEADERS = [
  {
    label: 'mistakes route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
  {
    label: 'bookmarked questions section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.bookmarkedTitle\}\s*<\/Text>/,
  },
  {
    label: 'wrong answers section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.mistakeTitle\}\s*<\/Text>/,
  },
  {
    label: 'empty-state title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.emptyTitle\}>\s*\{copy\.emptyTitle\}\s*<\/Text>/,
  },
];
const EXPECTED_LEGAL_ROUTE_HEADERS = [
  {
    file: 'app/disclaimer.tsx',
    requiredSnippets: [
      'const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = disclaimerCopy[language];',
      'Ansvarsfriskrivning',
      'Oberoende studieverktyg',
      'Disclaimer',
      'Independent study tool',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.practiceContent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Disclaimer',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Independent study tool', 'Practice content', 'Use with source material'],
  },
  {
    file: 'app/privacy.tsx',
    requiredSnippets: [
      'const privacyCopy: Record<AppLanguage, PrivacyRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = privacyCopy[language];',
      'Integritetspolicy',
      'Inget konto krävs',
      'Privacy policy',
      'No account required',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.noAccountRequired\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.localProgressStorage\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adsAndPurchases\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adConsent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.providerProcessing\.title\}>/,
    ],
    title: 'Privacy policy',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'No account required',
      'Local progress storage',
      'Ads and purchases',
      'Ad consent',
      'Provider processing',
    ],
  },
  {
    file: 'app/terms.tsx',
    requiredSnippets: [
      'const termsCopy: Record<AppLanguage, TermsRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = termsCopy[language];',
      'Användarvillkor',
      'Studieändamål',
      'Terms of use',
      'Study purpose',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.studyPurpose\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noGuarantee\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Terms of use',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Study purpose', 'No guarantee', 'Respect source material'],
  },
  {
    file: 'app/sources.tsx',
    requiredSnippets: [
      'const sourcesCopy: Record<AppLanguage, SourcesRouteCopy> = {',
      'const UHR_AUTHORITY_BOUNDARY_SOURCE = {',
      "retrievedDate: '2026-05-20'",
      "title: 'UHR: Om medborgarskapsprovet'",
      "url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/'",
      'const language = useSettingsStore((state) => state.language);',
      'const copy = sourcesCopy[language];',
      'Källor',
      'Primärt studiematerial',
      'UHR inte står bakom dessa',
      'Källa hämtad ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
      'Varje övningsfråga visar en källrad med UHR:s kapitel',
      'Sources',
      'Primary study material',
      'quality is not controlled by UHR or any other authority',
      'Source accessed ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
      'Every practice question shows a source line with the UHR chapter',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.primaryStudyMaterial\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.questionReferences\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.authorityBoundaries\.title\}[\s\S]*?>/,
    ],
    title: 'Sources',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Primary study material', 'Question references', 'Authority boundaries'],
  },
  {
    file: 'app/support.tsx',
    requiredSnippets: [
      'const supportCopy: Record<AppLanguage, SupportRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = supportCopy[language];',
      'Support och återkoppling',
      'Vad du kan rapportera',
      'Support and feedback',
      'What to report',
      'Öppna den offentliga supportsidan',
      'Open public support page',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.whatToReport\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noPersonalData\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.publicSupportPage\.title\}>/,
    ],
    title: 'Support and feedback',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'What to report',
      'No personal data',
      'Independent study tool',
      'Public support page',
    ],
  },
];
const EXPECTED_LEGAL_SWEDISH_COPY_STRINGS = 59;
const FORBIDDEN_SWEDISH_LEGAL_ENGLISH_TOKENS = ['streaks', 'settings'];
const EXPECTED_LEGAL_INTERNAL_MONETIZATION_KEY_SURFACES = 7;
const FORBIDDEN_LEGAL_INTERNAL_MONETIZATION_COPY_PATTERNS = Object.freeze([
  {
    label: 'adsDisabled flag',
    pattern: /\badsDisabled(?:\s*=\s*(?:true|false))?\b/i,
  },
  {
    label: 'Remove Ads storage key',
    pattern: /\bmonetization\.removeAds\.adsDisabled\.v\d+\b/i,
  },
  {
    label: 'raw Remove Ads entitlement key',
    pattern: /\bremove[_-]ads[_-]entitlement\b/i,
  },
  {
    label: 'raw purchase-field rejection key',
    pattern: /\bpurchase_fields_rejected\b/i,
  },
  {
    label: 'raw premium entitlement flag',
    pattern:
      /\b(?:unlimitedMockExams|fullMistakeReview|spacedRepetition|nativeLangExplanations|predictedPassProbability|multiColorHighlights|customStudyPlan|notesExport|confidenceSlider)\b/i,
  },
  {
    label: 'raw entitlement flag wording',
    pattern: /\bentitlement flag\b/i,
  },
]);
const EXPECTED_SETTINGS_ROUTE_HEADERS = [
  {
    label: 'settings route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
  {
    label: 'study language section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.studyLanguageTitle\}\s*<\/Text>/,
  },
  {
    label: 'audio section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.audioTitle\}\s*<\/Text>/,
  },
  {
    label: 'theme section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.themeModeTitle\}\s*<\/Text>/,
  },
  {
    label: 'daily goal section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.dailyGoalTitle\}\s*<\/Text>/,
  },
  {
    label: 'import section title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>\s*\{copy\.importTitle\}\s*<\/Text>/,
  },
];
const EXPECTED_SETTINGS_ROUTE_COPY_LABELS = {
  sv: [
    'Ljud avstängt',
    'Ljud på',
    'Ljud',
    '← Tillbaka till profil',
    'Tillbaka till profil',
    '${answerCount} svar per dag',
    'Dagligt mål',
    'Stäng av ljud',
    'Slå på ljud',
    'Bekräfta import',
    'Bekräfta lokal studiedataimport',
    'Klistra in JSON innan du förhandsgranskar.',
    'JSON-exporten är större än ${localStudyDataImportMaxLabel}. Välj en mindre export och försök igen.',
    'JSON kunde inte läsas.',
    'Importen har fel format eller okända toppnivåfält.',
    'Importversionen stöds inte.',
    'Importen innehåller fält för köp i appen eller kvitton. Ta bort dem och återställ köp via appbutiken.',
    'Importen innehåller inga stödda studiedata.',
    'Klistra in JSON-export',
    'Klistra in exporten här',
    'Förhandsgranska import',
    'Förhandsgranska lokal studiedataimport',
    'Köp, kvitton och data om köp i appen importeras inte. Använd appbutikens återställning för köp.',
    'Återställ importfält',
    'Klistra in en lokal studiedataexport i JSON-format (högst ${localStudyDataImportMaxLabel}). Du får en sammanfattning innan något skrivs.',
    'Importen är klar.',
    '${count} bokmärken',
    '${count} frågor med sparad progression',
    '${count} repetitionsdagar',
    '${count} repetitionskort',
    '${count} provhistorikposter',
    '${count} inställningar',
    'Studiesvit och svitskydd ingår',
    'Sammanfattning före import',
    '${count} granskningar av fel svar',
    'Importera studiedata',
    'Byt studiespråk till ${label}',
    'Studiespråk',
    'Ställ in dagligt mål till ${goal} svar',
    'Välj tema: ${label}',
    'Styr studiespråk, ljud, tema och ditt dagliga mål.',
    'Mörkt',
    'Ljust',
    'Tema: ${label}',
    'Tema',
    'Följ systemet',
    'Inställningar',
    'Svenska',
    'Engelskt stöd',
  ],
  en: [
    'Audio disabled',
    'Audio enabled',
    'Audio',
    '← Back to Profile',
    'Back to profile',
    '${answerCount} answers per day',
    'Daily goal',
    'Disable audio',
    'Enable audio',
    'Confirm import',
    'Confirm local study data import',
    'Paste JSON before previewing.',
    'The JSON export is larger than ${localStudyDataImportMaxLabel}. Choose a smaller export and try again.',
    'JSON could not be read.',
    'The import has the wrong format or unknown top-level fields.',
    'This import version is not supported.',
    'The import contains purchase, receipt, or IAP fields. Remove them and restore purchases through the app store.',
    'The import does not contain supported study data.',
    'Paste JSON export',
    'Paste the export here',
    'Preview import',
    'Preview local study data import',
    'Purchases, receipts, and IAP data are not imported. Use the app store restore flow for purchases.',
    'Reset import field',
    'Paste a local study data export in JSON format (under ${localStudyDataImportMaxLabel}). You will see a summary before anything is written.',
    'Import complete.',
    '${count} bookmarks',
    '${count} questions with saved progress',
    '${count} FSRS review days',
    '${count} FSRS review cards',
    '${count} mock exam history entries',
    '${count} settings',
    'Study streak and freeze status included',
    'Summary before import',
    '${count} wrong-answer reviews',
    'Import study data',
    'Set study language to ${label}',
    'Study language',
    'Set daily goal to ${goal} answers',
    'Choose theme: ${label}',
    'Control study language, audio, theme, and your daily goal.',
    'Dark',
    'Light',
    'Theme: ${label}',
    'Theme',
    'Use system',
    'Settings',
    'Swedish',
    'English support',
  ],
};
const EXPECTED_SETTINGS_ROUTE_COPY_SNIPPETS = [
  [
    'LOCAL_STUDY_DATA_IMPORT_MAX_BYTES',
    'settings route must reuse the shared local study data import size limit',
  ],
  ['import type { AppLanguage }', 'settings route must import AppLanguage'],
  ['type SettingsCopy = {', 'settings route must define a typed copy contract'],
  [
    'const settingsCopy: Record<AppLanguage, SettingsCopy> = {',
    'settings route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'settings route must read language from settings store',
  ],
  [
    'const copy = settingsCopy[language];',
    'settings route must select copy from settings language',
  ],
  [
    "const label = language === 'sv' ? labelSv : labelEn;",
    'settings route language buttons must choose visible labels from settings language',
  ],
  [
    "renderLanguageButton('sv', 'Swedish', 'Svenska')",
    'settings route must provide localized Swedish-language button labels',
  ],
  [
    "renderLanguageButton('en', 'English support', 'Engelskt stöd')",
    'settings route must provide localized English-support button labels',
  ],
  [
    'accessibilityLabel={copy.backToProfileAccessibilityLabel}',
    'settings back link must expose localized accessibility copy',
  ],
  ['{copy.backToProfile}', 'settings back link must render localized copy'],
  ['{copy.title}', 'settings title must render localized copy'],
  ['{copy.subtitle}', 'settings subtitle must render localized copy'],
  ['{copy.studyLanguageTitle}', 'settings language section must render localized copy'],
  [
    'accessibilityLabel={copy.languageAccessibilityLabel(label)}',
    'settings language buttons must expose localized accessibility copy',
  ],
  ['aria-checked={language === value}', 'settings language options must expose checked state'],
  [
    'accessibilityState={{ checked: language === value }}',
    'settings language options must mirror checked state to accessibilityState',
  ],
  ['{copy.audioTitle}', 'settings audio section must render localized copy'],
  [
    'audioEnabled ? copy.disableAudioAccessibilityLabel : copy.enableAudioAccessibilityLabel',
    'settings audio switch must expose localized accessibility copy',
  ],
  [
    '{audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel}',
    'settings audio switch must render localized state copy',
  ],
  ['{copy.dailyGoalTitle}', 'settings daily-goal section must render localized copy'],
  [
    '{copy.dailyGoalSummary(dailyGoalAnswers)}',
    'settings daily-goal summary must render localized copy',
  ],
  [
    'accessibilityLabel={copy.setDailyGoalAccessibilityLabel(goal)}',
    'settings daily-goal buttons must expose localized accessibility copy',
  ],
  [
    'aria-checked={dailyGoalAnswers === goal}',
    'settings daily-goal options must expose checked state',
  ],
  [
    'accessibilityState={{ checked: dailyGoalAnswers === goal }}',
    'settings daily-goal options must mirror checked state to accessibilityState',
  ],
  [
    'const accessibilityPersistenceWarning = useAccessibilityStore(',
    'settings route must read accessibility persistence warnings',
  ],
  [
    '(state) => state.persistenceWarning,',
    'settings route must subscribe to the accessibility warning state',
  ],
  [
    'const clearAccessibilityPersistenceWarning = useAccessibilityStore(',
    'settings route must read the accessibility warning dismiss action',
  ],
  [
    '(state) => state.clearPersistenceWarning,',
    'settings route must subscribe to the accessibility warning dismiss action',
  ],
  [
    'warning={accessibilityPersistenceWarning}',
    'settings route must render accessibility persistence warnings',
  ],
  [
    'onDismiss={clearAccessibilityPersistenceWarning}',
    'settings route must dismiss accessibility persistence warnings through the accessibility store',
  ],
  [
    'maxLength={LOCAL_STUDY_DATA_IMPORT_MAX_BYTES}',
    'settings import TextInput must expose the shared payload size limit',
  ],
];
const EXPECTED_ONBOARDING_ROUTE_HEADERS = [
  {
    label: 'onboarding route title',
    pattern:
      /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  },
];
const EXPECTED_ONBOARDING_ROUTE_COPY_LABELS = {
  sv: [
    'Justera inställningar',
    'Öppna inställningar',
    'Välkommen',
    'Börja studera',
    'Studera svenska samhällsbegrepp med engelskt stöd vid behov.',
    'Öva med UHR-refererade frågor och förklaringar.',
    'Följ framsteg lokalt på din enhet utan konto.',
    'En liten, fristående studiekompis för daglig övning, provträning och genomgång av frågor du missat.',
    'Förbered dig lugnt för samhällskunskapsprovet',
  ],
  en: [
    'Adjust settings',
    'Welcome',
    'Start studying',
    'Study Swedish civic concepts with English support when needed.',
    'Practice with UHR-referenced questions and explanations.',
    'Track progress locally on your device without an account.',
    'A small, independent study companion for daily practice, mock exams, and mistake review.',
    'Prepare calmly for the civic test',
  ],
};
const FORBIDDEN_ONBOARDING_SV_MISTAKE_REVIEW_COPY = [
  /repetition av misstag/i,
  /upprepning av misstag/i,
];
const EXPECTED_ONBOARDING_ROUTE_COPY_SNIPPETS = [
  ['useSettingsStore, type AppLanguage', 'onboarding route must import AppLanguage from settings'],
  ['type OnboardingCopy = {', 'onboarding route must define a typed copy contract'],
  [
    'const onboardingCopy: Record<AppLanguage, OnboardingCopy> = {',
    'onboarding route copy must cover every AppLanguage value',
  ],
  [
    'const language = useSettingsStore((state) => state.language);',
    'onboarding route must read language from settings store',
  ],
  [
    'const copy = onboardingCopy[language];',
    'onboarding route must select copy from settings language',
  ],
  ['{copy.eyebrow}', 'onboarding eyebrow must render localized copy'],
  ['{copy.title}', 'onboarding title must render localized copy'],
  ['{copy.subtitle}', 'onboarding subtitle must render localized copy'],
  ['{copy.steps.map((step, index) => (', 'onboarding steps must render localized copy'],
  [
    'accessibilityLabel={copy.startStudyingAccessibilityLabel}',
    'onboarding start link must expose localized accessibility copy',
  ],
  ['{copy.startStudying}', 'onboarding start link must render localized copy'],
  [
    'accessibilityLabel={copy.adjustSettingsAccessibilityLabel}',
    'onboarding settings link must expose localized accessibility copy',
  ],
  ['{copy.adjustSettings}', 'onboarding settings link must render localized copy'],
];
const EXPECTED_SCREEN_SHELL_LAYOUT_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'page title header',
    pattern: /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/,
  },
  {
    label: 'section title header',
    pattern: /<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/,
  },
  {
    label: 'content vertical gap',
    pattern: /content:\s*\{\s*gap:\s*space\[2\.25\],/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_SETTINGS_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern:
      /import\s+\{[\s\S]*Pressable,[\s\S]*ScrollView,[\s\S]*StyleSheet,[\s\S]*Text,[\s\S]*TextInput,[\s\S]*View,[\s\S]*\}\s+from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'growing scroll content',
    pattern: /content:\s*\{\s*flexGrow:\s*1,/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern:
      /import\s+\{[\s\S]*ScrollView,[\s\S]*StyleSheet,[\s\S]*Text,[\s\S]*View[\s\S]*\}\s+from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
  {
    label: 'growing scroll content',
    pattern: /content:\s*\{\s*flexGrow:\s*1,/,
  },
  {
    label: 'bottom safe padding',
    pattern: /paddingBottom:\s*space\[10\]/,
  },
];
const EXPECTED_LEGAL_ROUTE_SCROLL_RULES = [
  {
    label: 'ScrollView import',
    pattern: /import \{ ScrollView, StyleSheet, Text, View \} from 'react-native';/,
  },
  {
    label: 'scroll root container',
    pattern:
      /<ScrollView\s+style=\{styles\.container\}\s+contentContainerStyle=\{styles\.content\}>/,
  },
  {
    label: 'scroll root closing tag',
    pattern: /<\/ScrollView>/,
  },
];
const EXPECTED_BUTTON_ACCESSIBILITY_RULES = [
  {
    label: 'exported variant type',
    pattern:
      /export type ButtonVariant = 'primary' \| 'secondary' \| 'option' \| 'success' \| 'danger';/,
  },
  {
    label: 'exported props interface',
    pattern:
      /export interface ButtonProps extends PropsWithChildren<Omit<PressableProps, 'style'>>/,
  },
  {
    label: 'documented default props',
    pattern:
      /Defaults: `variant="primary"`, `accessibilityRole="button"`[\s\S]*`hitSlop=space\[0\.5\]`/,
  },
  {
    label: 'native Pressable root',
    pattern: /<Pressable[\s\S]*>/,
  },
  {
    label: 'default button role',
    pattern: /accessibilityRole\s*=\s*'button'/,
  },
  {
    label: 'explicit state merge',
    pattern: /const mergedAccessibilityState = \{\s*\.\.\.accessibilityState,/,
  },
  {
    label: 'disabled prop merged into accessibility state',
    pattern: /\.\.\.\(disabled == null \? \{\} : \{ disabled \}\),/,
  },
  {
    label: 'plain child label fallback',
    pattern:
      /typeof children === 'string' \|\| typeof children === 'number' \? String\(children\) : undefined/,
  },
  {
    label: 'busy state mirrored to web aria',
    pattern: /aria-busy=\{mergedAccessibilityState\.busy === true\}/,
  },
  {
    label: 'checked state mirrored to web aria',
    pattern: /aria-checked=\{mergedAccessibilityState\.checked\}/,
  },
  {
    label: 'disabled state mirrored to web aria',
    pattern: /aria-disabled=\{mergedAccessibilityState\.disabled === true\}/,
  },
  {
    label: 'expanded state mirrored to web aria',
    pattern: /aria-expanded=\{mergedAccessibilityState\.expanded\}/,
  },
  {
    label: 'selected state mirrored to web aria',
    pattern: /aria-selected=\{mergedAccessibilityState\.selected\}/,
  },
  {
    label: 'label mirrored to web aria',
    pattern: /aria-label=\{buttonAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{buttonAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility role',
    pattern: /accessibilityRole=\{accessibilityRole\}/,
  },
  {
    label: 'native accessibility state',
    pattern: /accessibilityState=\{mergedAccessibilityState\}/,
  },
  {
    label: 'token hairline border width',
    pattern: /borderWidth:\s*space\.hairline/,
  },
  {
    label: 'token minimum touch target',
    pattern: /minHeight:\s*space\[6\]/,
  },
  {
    label: 'token pressed feedback',
    pattern: /transform:\s*\[\{ scale: motion\.pressedScale \}\]/,
  },
];
const EXPECTED_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'native View root',
    pattern: /<View[\s\S]*>/,
  },
  {
    label: 'explicit accessibility grouping prop',
    pattern: /accessible,/,
  },
  {
    label: 'label-or-role grouping fallback',
    pattern:
      /const groupedForAccessibility =\s*accessible \?\? Boolean\(accessibilityLabel \|\| accessibilityRole\);/,
  },
  {
    label: 'resolved accessibility role fallback',
    pattern: /const resolvedAccessibilityRole =\s*accessibilityRole \?\?/,
  },
  {
    label: 'grouped default summary role',
    pattern: /\(groupedForAccessibility \? 'summary' : undefined\)/,
  },
  {
    label: 'stable hint id',
    pattern: /const hintId = useId\(\);/,
  },
  {
    label: 'web-only hint id',
    pattern: /accessibilityHint && Platform\.OS === 'web'/,
  },
  {
    label: 'hint id prefix',
    pattern: /`card-hint-\$\{hintId\.replace\(\/:\/g, ''\)\}`/,
  },
  {
    label: 'hint mirrored to web aria-describedby',
    pattern: /aria-describedby=\{cardAccessibilityHintId\}/,
  },
  {
    label: 'label mirrored to web aria',
    pattern: /aria-label=\{accessibilityLabel\}/,
  },
  {
    label: 'native accessibility grouping',
    pattern: /accessible=\{groupedForAccessibility\}/,
  },
  {
    label: 'native accessibility hint',
    pattern: /accessibilityHint=\{accessibilityHint\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{accessibilityLabel\}/,
  },
  {
    label: 'native resolved accessibility role',
    pattern: /accessibilityRole=\{resolvedAccessibilityRole\}/,
  },
  {
    label: 'hidden hint text node',
    pattern:
      /<Text\s+nativeID=\{cardAccessibilityHintId\}\s+style=\{styles\.accessibilityHintText\}>/,
  },
  {
    label: 'visually hidden hint style',
    pattern:
      /accessibilityHintText:\s*\{\s*height:\s*1,[\s\S]*position:\s*'absolute',[\s\S]*width:\s*1,/,
  },
];
const EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES = [
  {
    label: 'settings language type import',
    pattern: /import type \{ AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'typed localized copy contract',
    pattern:
      /type ProgressBarCopy = \{\s*progressLabel: \(progressPercent: number\) => string;\s*\};/,
  },
  {
    label: 'localized progress copy',
    pattern:
      /const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = \{[\s\S]*sv:[\s\S]*`\$\{progressPercent\} procent klart`[\s\S]*en:[\s\S]*`\$\{progressPercent\} percent complete`/,
  },
  {
    label: 'clamped progress source',
    pattern: /const clampedProgress = Math\.max\(0, Math\.min\(1, progress\)\);/,
  },
  {
    label: 'percent value derived from clamped progress',
    pattern: /const progressPercent = Math\.round\(clampedProgress \* 100\);/,
  },
  {
    label: 'language copy selection',
    pattern: /const copy = progressBarCopy\[language\];/,
  },
  {
    label: 'readable localized progress label',
    pattern: /const progressAccessibilityLabel = copy\.progressLabel\(progressPercent\);/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'web aria max value',
    pattern: /aria-valuemax=\{100\}/,
  },
  {
    label: 'web aria min value',
    pattern: /aria-valuemin=\{0\}/,
  },
  {
    label: 'web aria current value',
    pattern: /aria-valuenow=\{progressPercent\}/,
  },
  {
    label: 'web aria localized value text',
    pattern: /aria-valuetext=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{progressAccessibilityLabel\}/,
  },
  {
    label: 'native progressbar role',
    pattern: /accessibilityRole="progressbar"/,
  },
  {
    label: 'native clamped accessibility value',
    pattern:
      /accessibilityValue=\{\{[\s\S]*min:\s*0,\s*max:\s*100,\s*now:\s*progressPercent,\s*text:\s*progressAccessibilityLabel,?\s*\}\}/,
  },
  {
    label: 'animated fill uses clamped source',
    pattern: /new Animated\.Value\(clampedProgress\)/,
  },
  {
    label: 'visual fill uses percent interpolation bounds',
    pattern: /inputRange:\s*\[0, 1\],[\s\S]*outputRange:\s*\['0%', '100%'\]/,
  },
];
const EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'native View root',
    pattern: /<View[\s\S]*>/,
  },
  {
    label: 'exported MetricCard props interface',
    pattern:
      /export interface MetricCardProps extends Omit<ComponentProps<typeof View>, 'children' \| 'style'>/,
  },
  {
    label: 'documented defaults',
    pattern:
      /Defaults: `tone="warm"`, `accessible=true`, `accessibilityRole="summary"`,[\s\S]*accessibility label derived from the visible label\/value\/helper text/,
  },
  {
    label: 'explicit accessibility label prop',
    pattern: /accessibilityLabel\?: string;/,
  },
  {
    label: 'caller style prop',
    pattern: /style\?: ComponentProps<typeof View>\['style'\];/,
  },
  {
    label: 'summary role default',
    pattern: /accessibilityRole = 'summary'/,
  },
  {
    label: 'label value helper summary',
    pattern:
      /accessibilityLabel \?\? `\$\{label\}: \$\{value\}\$\{helper \? `\. \$\{helper\}` : ''\}`;/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{metricAccessibilityLabel\}/,
  },
  {
    label: 'native grouped surface',
    pattern: /accessible=\{accessible\}/,
  },
  {
    label: 'native accessibility role',
    pattern: /accessibilityRole=\{accessibilityRole\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{metricAccessibilityLabel\}/,
  },
  {
    label: 'visible value text',
    pattern: /<Text\s+style=\{styles\.value\}>\{value\}<\/Text>/,
  },
  {
    label: 'visible label text',
    pattern: /<Text\s+style=\{styles\.label\}>\{label\}<\/Text>/,
  },
  {
    label: 'visible helper text',
    pattern: /\{helper \? <Text style=\{styles\.helper\}>\{helper\}<\/Text> : null\}/,
  },
  {
    label: 'blue tone style path',
    pattern: /style=\{\[styles\.card, tone === 'blue' \? styles\.blueCard : null, style\]\}/,
  },
  {
    label: 'token hairline border width',
    pattern: /borderWidth:\s*space\.hairline/,
  },
];
const EXPECTED_BADGE_ACCESSIBILITY_RULES = [
  {
    label: 'explicit accessibility label prop',
    pattern: /accessibilityLabel\?: string;/,
  },
  {
    label: 'derived accessibility label variable',
    pattern: /const badgeAccessibilityLabel =/,
  },
  {
    label: 'explicit label override before child fallback',
    pattern:
      /accessibilityLabel \?\?\s*\(\s*typeof children === 'string' \|\| typeof children === 'number' \? String\(children\) : undefined\s*\)/,
  },
  {
    label: 'web aria label',
    pattern: /aria-label=\{badgeAccessibilityLabel\}/,
  },
  {
    label: 'native accessibility label',
    pattern: /accessibilityLabel=\{badgeAccessibilityLabel\}/,
  },
  {
    label: 'tone style path with caller override',
    pattern: /style=\{\[styles\.badge, styles\[tone\], style\]\}/,
  },
  {
    label: 'visible child text',
    pattern: /<Text[\s\S]*>\s*\{children\}\s*<\/Text>/,
  },
  {
    label: 'visual uppercase transform',
    pattern: /textTransform:\s*'uppercase'/,
  },
];
const EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'settings language type import',
    pattern: /import type \{ AppLanguage \} from '\.\.\/\.\.\/lib\/storage\/settingsStore';/,
  },
  {
    label: 'localized ChapterCard copy contract',
    pattern: /type ChapterCardCopy = \{/,
  },
  {
    label: 'localized ChapterCard copy map',
    pattern: /const chapterCardCopy: Record<AppLanguage, ChapterCardCopy> = \{/,
  },
  {
    label: 'settings language prop default',
    pattern: /language = 'sv'/,
  },
  {
    label: 'settings language copy selection',
    pattern: /const copy = chapterCardCopy\[language\];/,
  },
  {
    label: 'optional Chapter prop contract',
    pattern: /chapter\?: Chapter;/,
  },
  {
    label: 'optional language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'Swedish practiced status copy',
    pattern: /\$\{completedCount\}\/\$\{questionCount\} besvarade/,
  },
  {
    label: 'English practiced status copy',
    pattern: /\$\{completedCount\}\/\$\{questionCount\} practiced/,
  },
  {
    label: 'content-queued status fallback',
    pattern:
      /const status =[\s\S]*questionCount > 0 \? copy\.practicedStatus\(completedCount, questionCount\) : copy\.contentQueued;/,
  },
  {
    label: 'selected-language chapter title',
    pattern: /language === 'en'\s*\?\s*chapter\.nameEn\s*:\s*chapter\.nameSv/,
  },
  {
    label: 'opposite-language secondary name',
    pattern:
      /const secondaryName = chapter \? \(language === 'en' \? chapter\.nameSv : chapter\.nameEn\) : null;/,
  },
  {
    label: 'selected-language description',
    pattern: /language === 'en'\s*\?\s*chapter\.descriptionEn\s*:\s*chapter\.descriptionSv/,
  },
  {
    label: 'chapter accessibility summary variable',
    pattern: /const chapterAccessibilityLabel =/,
  },
  {
    label: 'selected title in accessibility summary',
    pattern: /copy\.accessibilityLabel\.chapter\(title\)/,
  },
  {
    label: 'secondary title in accessibility summary',
    pattern: /secondaryName \? copy\.accessibilityLabel\.secondaryName\(secondaryName\) : null/,
  },
  {
    label: 'progress status in accessibility summary',
    pattern: /copy\.accessibilityLabel\.status\(status\)/,
  },
  {
    label: 'description in accessibility summary',
    pattern: /description \? copy\.accessibilityLabel\.description\(description\) : null/,
  },
  {
    label: 'Card receives chapter accessibility summary',
    pattern:
      /accessibilityLabel=\{shouldGroupForAccessibility \? chapterAccessibilityLabel : undefined\}/,
  },
  {
    label: 'visible chapter title',
    pattern: /<Text style=\{styles\.title\}>\{title\}<\/Text>/,
  },
  {
    label: 'visible secondary chapter name',
    pattern: /<Text style=\{styles\.subtitle\}>\{secondaryName\}<\/Text>/,
  },
  {
    label: 'visible selected-language description',
    pattern: /<Text style=\{styles\.description\}>\{description\}<\/Text>/,
  },
  {
    label: 'visible progress bar',
    pattern: /<ProgressBar language=\{language\} progress=\{progress\} \/>/,
  },
];
const EXPECTED_FLASHCARD_ACCESSIBILITY_RULES = [
  {
    label: 'optional front/back/language prop contract',
    pattern:
      /type FlashcardProps = \{ front\?: string; back\?: string; language\?: AppLanguage \};/,
  },
  {
    label: 'settings language import',
    pattern: /useSettingsStore, type AppLanguage/,
  },
  {
    label: 'localized copy map',
    pattern: /const flashcardCopy: Record<AppLanguage, FlashcardCopy> = \{/,
  },
  {
    label: 'selected settings language fallback',
    pattern:
      /const settingsLanguage = useSettingsStore\(\(state\) => state\.language\);[\s\S]*const copy = flashcardCopy\[language \?\? settingsLanguage\];/,
  },
  {
    label: 'release-safe Swedish fallbacks',
    pattern: /fallbackPrompt: 'Studiefråga saknas'[\s\S]*fallbackAnswer: 'Svar saknas'/,
  },
  {
    label: 'release-safe English fallbacks',
    pattern:
      /fallbackPrompt: 'Study prompt unavailable'[\s\S]*fallbackAnswer: 'Answer unavailable'/,
  },
  {
    label: 'trimmed text helper',
    pattern: /function cleanText\(value: string \| undefined, fallback: string\): string/,
  },
  {
    label: 'prompt derived through fallback helper',
    pattern: /const prompt = cleanText\(front, copy\.fallbackPrompt\);/,
  },
  {
    label: 'answer derived through fallback helper',
    pattern: /const answer = cleanText\(back, copy\.fallbackAnswer\);/,
  },
  {
    label: 'localized accessibility summary helper',
    pattern: /const flashcardAccessibilityLabel = copy\.accessibilityLabel\(prompt, answer\);/,
  },
  {
    label: 'prompt and answer accessibility summary',
    pattern: /<Card accessibilityLabel=\{flashcardAccessibilityLabel\} style=\{styles\.card\}>/,
  },
  {
    label: 'visible localized flashcard badge',
    pattern: /<Badge tone="warm">\{copy\.badgeLabel\}<\/Badge>/,
  },
  {
    label: 'localized prompt header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.label\}>[\s\S]*\{copy\.promptHeader\}[\s\S]*<\/Text>/,
  },
  {
    label: 'localized answer header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.label\}>[\s\S]*\{copy\.answerHeader\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible prompt and answer text',
    pattern:
      /<Text style=\{styles\.prompt\}>\{prompt\}<\/Text>[\s\S]*<Text style=\{styles\.answer\}>\{answer\}<\/Text>/,
  },
];
const EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES = [
  {
    label: 'shared Button import',
    pattern: /import \{ Button \} from '\.\.\/ui\/Button';/,
  },
  {
    label: 'speech runtime imports',
    pattern: /import \{ speakSwedish, stopSpeech \} from '\.\.\/\.\.\/lib\/audio\/speak';/,
  },
  {
    label: 'speaking state import',
    pattern: /import \{ useEffect, useState \} from 'react';/,
  },
  {
    label: 'optional text, enabled, and language prop contract',
    pattern:
      /enabled = true,[\s\S]*language = 'sv'[\s\S]*text = ''[\s\S]*enabled\?: boolean;[\s\S]*language\?: AppLanguage;[\s\S]*text\?: string/,
  },
  {
    label: 'trimmed speech text source',
    pattern: /const speechText = text\.trim\(\);/,
  },
  {
    label: 'nonblank speech text guard',
    pattern: /const hasSpeechText = speechText\.length > 0;/,
  },
  {
    label: 'enabled plus text playback guard',
    pattern: /const canPlayAudio = enabled && hasSpeechText;/,
  },
  {
    label: 'localized state-specific visible labels',
    pattern:
      /const audioButtonCopy: Record<AppLanguage, AudioButtonCopy> = \{[\s\S]*disabledLabel: 'Ljud är avstängt'[\s\S]*enabledLabel: 'Lyssna på den svenska frågan och svaren'[\s\S]*stopLabel: 'Stoppa frågeljud'[\s\S]*unavailableLabel: 'Ljud saknas för den här frågan'[\s\S]*disabledLabel: 'Audio is disabled'[\s\S]*enabledLabel: 'Listen to the Swedish question and answers'[\s\S]*stopLabel: 'Stop question audio'[\s\S]*unavailableLabel: 'Audio is unavailable for this question'/,
  },
  {
    label: 'speaking state controls localized visible label',
    pattern:
      /const \[isSpeaking, setIsSpeaking\] = useState\(false\);[\s\S]*const label = !enabled[\s\S]*\? copy\.disabledLabel[\s\S]*\? copy\.unavailableLabel[\s\S]*\? copy\.stopLabel[\s\S]*: copy\.enabledLabel;/,
  },
  {
    label: 'accessibility label follows localized visible label',
    pattern: /const accessibilityLabel = label;/,
  },
  {
    label: 'localized state-specific accessibility hint',
    pattern:
      /disabledHint: 'Aktivera ljud i Inställningar för att höra svensk text\.'[\s\S]*enabledHint: 'Spelar upp den svenska frågan och svarsalternativen\.'[\s\S]*stopHint: 'Stoppar uppläsningen av frågan och svarsalternativen\.'[\s\S]*unavailableHint: 'Ljud behöver svensk frågetext före uppspelning\.'[\s\S]*disabledHint: 'Enable audio in Settings to hear Swedish text\.'[\s\S]*enabledHint: 'Plays the Swedish question and answer options aloud\.'[\s\S]*stopHint: 'Stops the question audio playback\.'[\s\S]*unavailableHint: 'Audio needs Swedish question text before playback\.'/,
  },
  {
    label: 'native button accessibility wiring',
    pattern:
      /<Button[\s\S]*accessibilityHint=\{accessibilityHint\}[\s\S]*accessibilityLabel=\{accessibilityLabel\}[\s\S]*accessibilityRole="button"/,
  },
  {
    label: 'busy and disabled accessibility state follows playback lifecycle',
    pattern: /accessibilityState=\{\{ busy: isSpeaking, disabled: !canPlayAudio \}\}/,
  },
  {
    label: 'disabled interaction follows playback guard',
    pattern: /disabled=\{!canPlayAudio\}/,
  },
  {
    label: 'second press stops active question audio',
    pattern:
      /if \(!canPlayAudio\) return;[\s\S]*if \(isSpeaking\) \{[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);[\s\S]*return;[\s\S]*\}/,
  },
  {
    label: 'trimmed speech playback with lifecycle cleanup',
    pattern:
      /stopSpeech\(\);[\s\S]*setIsSpeaking\(true\);[\s\S]*speakSwedish\(speechText, \{[\s\S]*onDone: \(\) => setIsSpeaking\(false\),[\s\S]*onError: \(\) => setIsSpeaking\(false\),[\s\S]*onStopped: \(\) => setIsSpeaking\(false\),[\s\S]*\}\);/,
  },
  {
    label: 'speech cleanup on text change and unmount',
    pattern:
      /useEffect\(\(\) => \{[\s\S]*setIsSpeaking\(false\);[\s\S]*return \(\) => \{[\s\S]*stopSpeech\(\);[\s\S]*\};[\s\S]*\}, \[speechText\]\);/,
  },
];
const EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'PracticeQuestion prop contract',
    pattern: /language\?: AppLanguage;[\s\S]*question\?: PracticeQuestion;/,
  },
  {
    label: 'difficulty fallback',
    pattern: /const difficulty = question\?\.difficulty \?\? 'practice';/,
  },
  {
    label: 'localized difficulty value copy',
    pattern:
      /difficultyValueLabels: Record<PracticeQuestion\['difficulty'\] \| 'practice', string>[\s\S]*easy: 'Lätt'[\s\S]*medium: 'Medel'[\s\S]*hard: 'Svår'[\s\S]*practice: 'Övning'[\s\S]*easy: 'Easy'[\s\S]*medium: 'Medium'[\s\S]*hard: 'Hard'[\s\S]*practice: 'Practice'/,
  },
  {
    label: 'localized difficulty value selection',
    pattern: /const difficultyLabel = copy\.difficultyValueLabels\[difficulty\];/,
  },
  {
    label: 'display-safe language-aware question text fallback',
    pattern: /const questionText = getQuestionDisplayText\(question, language\);/,
  },
  {
    label: 'source citation helper',
    pattern: /const sourceCitation = getQuestionSourceCitation\(question, language\);/,
  },
  {
    label: 'localized accessibility prefix copy and difficulty summary',
    pattern:
      /difficultyLabel: 'Svårighetsgrad'[\s\S]*questionLabel: 'Fråga'[\s\S]*secondaryLabel: 'Engelsk översättning'[\s\S]*sourceCitationLabel: 'Källhänvisning'[\s\S]*difficultyLabel: 'Difficulty'[\s\S]*questionLabel: 'Question'[\s\S]*secondaryLabel: 'Swedish original'[\s\S]*sourceCitationLabel: 'Source citation'[\s\S]*\$\{copy\.difficultyLabel\}: \$\{difficultyLabel\}/,
  },
  {
    label: 'selected language question in accessibility summary',
    pattern: /\$\{copy\.questionLabel\}: \$\{questionText\}/,
  },
  {
    label: 'display-safe secondary language text in accessibility summary',
    pattern:
      /questionTranslation \? `\$\{copy\.secondaryLabel\}: \$\{questionTranslation\}` : null/,
  },
  {
    label: 'source citation in accessibility summary',
    pattern: /\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}/,
  },
  {
    label: 'Card receives accessibility summary',
    pattern: /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/,
  },
  {
    label: 'visible difficulty label',
    pattern: /<Text style=\{styles\.label\}>\{difficultyLabel\}<\/Text>/,
  },
  {
    label: 'question header text',
    pattern: /<Text accessibilityRole="header" style=\{styles\.question\}>/,
  },
  {
    label: 'visible source citation line',
    pattern: /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/,
  },
  {
    label: 'visible display-safe English translation',
    pattern:
      /\{questionTranslation \? <Text style=\{styles\.translation\}>\{questionTranslation\}<\/Text> : null\}/,
  },
];
const EXPECTED_QUESTION_SOURCE_CITATION_RULES = [
  {
    label: 'localized question display fallback',
    pattern:
      /const QUESTION_DISPLAY_FALLBACKS: Record<PrimaryQuestionTextLanguage, string> = \{[\s\S]*sv: 'Fråga saknas'[\s\S]*en: 'Question unavailable'[\s\S]*QUESTION_DISPLAY_FALLBACKS_BY_LANGUAGE\[language\][\s\S]*QUESTION_DISPLAY_FALLBACKS\[primaryLanguageFor\(language\)\]/,
  },
  {
    label: 'language-aware source citation signature',
    pattern:
      /export function getQuestionSourceCitation\(\s*question\?: QuestionTextSource,\s*language: QuestionTextLanguage = 'sv',\s*\): string \{/,
  },
  {
    label: 'localized source citation prefixes and page labels',
    pattern:
      /language === 'en'\s*\?\s*`Source: Sverige i fokus, \$\{chapter\}, \$\{section\}, p\. \$\{pageApprox\}`\s*:\s*`Källa: Sverige i fokus, \$\{chapter\}, \$\{section\}, s\. \$\{pageApprox\}`/,
  },
];
const EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES = [
  {
    label: 'shared OptionCard import',
    pattern: /import \{ OptionCard \} from '\.\.\/OptionCard';/,
  },
  {
    label: 'OptionCard state type import',
    pattern: /import type \{ OptionCardState \} from '\.\.\/OptionCard';/,
  },
  {
    label: 'disabled prop',
    pattern: /disabled\?: boolean;/,
  },
  {
    label: 'selected prop',
    pattern: /selected\?: boolean;/,
  },
  {
    label: 'result label prop',
    pattern: /resultLabel\?: string;/,
  },
  {
    label: 'language-specific copy map',
    pattern: /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/,
  },
  {
    label: 'localized option state label contract',
    pattern: /stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;/,
  },
  {
    label: 'Swedish select-answer accessibility copy',
    pattern: /selectAccessibilityLabel: \(label\) => `Välj svaret \$\{label\}`/,
  },
  {
    label: 'English select-answer accessibility copy',
    pattern: /selectAccessibilityLabel: \(label\) => `Select answer \$\{label\}`/,
  },
  {
    label: 'language-specific option label',
    pattern: /const label = option \? getOptionLabel\(option, language\) : copy\.fallbackLabel;/,
  },
  {
    label: 'feedback-aware accessibility label',
    pattern:
      /const accessibilityLabel = resultLabel\s*\?\s*`\$\{label\}, \$\{resultLabel\}`\s*:\s*copy\.selectAccessibilityLabel\(label\);/,
  },
  {
    label: 'localized OptionCard state label selection',
    pattern: /const stateLabel = state === 'idle' \? undefined : copy\.stateLabels\[state\];/,
  },
  {
    label: 'selected and disabled state forwarding',
    pattern: /accessibilityState=\{\{ disabled, selected \}\}/,
  },
  {
    label: 'disabled interaction forwarding',
    pattern: /disabled=\{disabled\}/,
  },
  {
    label: 'feedback-aware visible label handoff',
    pattern: /resultLabel=\{resultLabel\}/,
  },
  {
    label: 'OptionCard state forwarding',
    pattern: /state=\{state\}/,
  },
  {
    label: 'OptionCard state label forwarding',
    pattern: /stateLabel=\{stateLabel\}/,
  },
  {
    label: 'tone-to-OptionCard state mapping',
    pattern:
      /function getOptionCardState\(tone: AnswerTone, selected: boolean\): OptionCardState \{\s*if \(tone !== 'idle'\) return tone;\s*return selected \? 'selected' : 'idle';\s*\}/,
  },
  {
    label: 'shared localized option text helper',
    pattern: /return getQuestionOptionText\(option, language\);/,
  },
];
const EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES = [
  {
    label: 'optional bilingual explanation props',
    pattern: /explanationEn\?: string;[\s\S]*explanationSv\?: string;/,
  },
  {
    label: 'language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'localized copy map',
    pattern: /const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy>/,
  },
  {
    label: 'release-safe Swedish fallback',
    pattern: /Förklaring saknas för den här frågan\./,
  },
  {
    label: 'release-safe English fallback',
    pattern: /Explanation unavailable for this question\./,
  },
  {
    label: 'language-specific explanation selection',
    pattern:
      /const explanation =[\s\S]*language === 'en' && explanationEn \? explanationEn : \(explanationSv \?\? copy\.fallback\)\);/,
  },
  {
    label: 'localized explanation in accessibility summary',
    pattern:
      /const panelAccessibilityLabel = `\$\{copy\.accessibilityLabelPrefix\}: \$\{explanation\}`;/,
  },
  {
    label: 'Card receives accessibility summary',
    pattern: /<Card accessibilityLabel=\{panelAccessibilityLabel\}>/,
  },
  {
    label: 'localized explanation header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.title\}>[\s\S]*\{copy\.title\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible selected explanation',
    pattern: /<Text style=\{styles\.body\}>\{explanation\}<\/Text>/,
  },
];
const EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES = [
  {
    label: 'optional UHRReference prop contract',
    pattern: /reference\?: UHRReference/,
  },
  {
    label: 'language prop contract',
    pattern: /language\?: AppLanguage;/,
  },
  {
    label: 'localized copy map',
    pattern: /const uhrReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy>/,
  },
  {
    label: 'chapter and section source label',
    pattern:
      /const label = reference\s*\?\s*`\$\{reference\.chapter\} · \$\{reference\.section\}`\s*:\s*copy\.unavailable;/,
  },
  {
    label: 'localized approximate page source label',
    pattern:
      /const pageLabel = reference\?\.pageApprox[\s\S]*\? `\$\{copy\.approximatePage\} \$\{reference\.pageApprox\}`[\s\S]*: null;/,
  },
  {
    label: 'localized page-aware accessibility label',
    pattern:
      /const referenceAccessibilityLabel = pageLabel[\s\S]*\? `\$\{copy\.accessibilityLabelPrefix\}: \$\{label\}\. \$\{pageLabel\}`[\s\S]*: `\$\{copy\.accessibilityLabelPrefix\}: \$\{label\}`;/,
  },
  {
    label: 'Card receives UHR accessibility label',
    pattern: /<Card accessibilityLabel=\{referenceAccessibilityLabel\}>/,
  },
  {
    label: 'localized UHR title header text',
    pattern:
      /<Text accessibilityRole="header" style=\{styles\.title\}>[\s\S]*\{copy\.title\}[\s\S]*<\/Text>/,
  },
  {
    label: 'visible chapter-section source label',
    pattern: /<Text style=\{styles\.body\}>\{label\}<\/Text>/,
  },
  {
    label: 'visible approximate page label',
    pattern: /\{pageLabel \? <Text style=\{styles\.meta\}>\{pageLabel\}<\/Text> : null\}/,
  },
  {
    label: 'nested SourceCitation opts out of duplicate accessibility node',
    pattern: /<SourceCitation[\s\S]*accessibilityRole="none"[\s\S]*label=\{copy\.title\}/,
  },
  {
    label: 'nested SourceCitation omits duplicate accessibility label',
    pattern:
      /<SourceCitation(?![\s\S]*accessibilityLabel=\{referenceAccessibilityLabel\})[\s\S]*accessibilityRole="none"[\s\S]*>/,
  },
];
const EXPECTED_SOURCE_CITATION_ACCESSIBILITY_RULES = [
  {
    label: 'standalone SourceCitation text role default',
    pattern: /accessibilityRole = 'text'/,
  },
  {
    label: 'standalone SourceCitation default accessibility label includes page text',
    pattern: /const defaultAccessibilityLabel = \[resolvedLabel, citationText, pageText\]/,
  },
  {
    label: 'nested SourceCitation none role suppresses duplicate label',
    pattern: /accessibilityRole === 'none'\s*\? undefined/,
  },
];
const EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES = [
  {
    label: 'active prop contract',
    pattern: /active: boolean;/,
  },
  {
    label: 'inactive animation reset',
    pattern: /if \(!active\) \{\s*progress\.setValue\(0\);\s*return;\s*\}/,
  },
  {
    label: 'active animation restarts from zero',
    pattern: /progress\.setValue\(0\);\s*Animated\.timing\(progress,/,
  },
  {
    label: 'tokenized animation duration',
    pattern: /duration:\s*motion\.duration\.slow \* 2,/,
  },
  {
    label: 'standard easing path',
    pattern: /easing:\s*Easing\.out\(Easing\.cubic\),/,
  },
  {
    label: 'native-driver animation',
    pattern: /useNativeDriver:\s*true,/,
  },
  {
    label: 'inactive render returns null',
    pattern: /if \(!active\) return null;/,
  },
  {
    label: 'decorative animation hidden from accessibility tree',
    pattern: /accessibilityElementsHidden/,
  },
  {
    label: 'reduced-motion branch hidden from accessibility tree',
    pattern:
      /if \(reducedMotionEnabled\) \{\s*return \(\s*<View(?=[^>]*accessibilityElementsHidden)(?=[^>]*importantForAccessibility="no-hide-descendants")(?=[^>]*pointerEvents="none")[^>]*>/,
  },
  {
    label: 'animated branch hidden from accessibility tree',
    pattern:
      /<Animated\.View(?=[^>]*accessibilityElementsHidden)(?=[^>]*importantForAccessibility="no-hide-descendants")(?=[^>]*pointerEvents="none")[^>]*>/,
  },
  {
    label: 'descendant accessibility hidden',
    pattern: /importantForAccessibility="no-hide-descendants"/,
  },
  {
    label: 'non-interactive pointer behavior',
    pattern: /pointerEvents="none"/,
  },
  {
    label: 'result pill remains visible',
    pattern: /<View style=\{styles\.pill\}>[\s\S]*<Text style=\{styles\.pillText\}>/,
  },
];
const EXPECTED_PREMIUM_ENTITLEMENT_STATES = [
  {
    exportName: 'FREE_ENTITLEMENTS',
    configKey: 'free',
    entitlements: {
      adsDisabled: false,
      unlimitedMockExams: false,
      fullMistakeReview: false,
    },
  },
  {
    exportName: 'PREMIUM_ENTITLEMENTS',
    configKey: 'premium',
    entitlements: {
      adsDisabled: true,
      unlimitedMockExams: true,
      fullMistakeReview: true,
    },
  },
  {
    exportName: 'REMOVE_ADS_ENTITLEMENTS',
    configKey: 'removeAds',
    entitlements: {
      adsDisabled: true,
      unlimitedMockExams: false,
      fullMistakeReview: false,
    },
  },
];
const EXPECTED_QUESTION_DISCLAIMER_ROUTES = [
  { route: '/onboarding', file: 'app/onboarding.tsx' },
  { route: '/practice', file: 'app/(tabs)/practice.tsx' },
  { route: '/exam', file: 'app/(tabs)/exam.tsx' },
  { route: '/mistakes', file: 'app/(tabs)/mistakes.tsx' },
  { route: '/chapter/[chapterId]', file: 'app/chapter/[chapterId].tsx' },
  { route: '/quiz/[sessionId]', file: 'app/quiz/[sessionId].tsx' },
];
const REQUIRED_QUESTION_DISCLAIMER_PHRASES = [
  'independent study tool',
  'not official',
  'affiliated with UHR',
  'UHR',
  'Swedish government',
  'not real exam questions',
];
const EXPECTED_QUESTION_REPORT_LINK_RULES = [
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'expo link import',
    pattern: /import \{ Link \} from 'expo-router';/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'Swedish report label',
    pattern: /Rapportera den här frågan/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'English report label',
    pattern: /Report this question/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'selected answer prop',
    pattern: /selectedOptionId\?: string \| null;/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'source citation context',
    pattern: /getQuestionSourceCitation\(question, language\)/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'question id query context',
    pattern: /\['questionId', question\.id\]/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'selected answer query context',
    pattern: /selectedAnswer \? \['selectedAnswer', selectedAnswer\] : null/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'encoded query values',
    pattern: /encodeURIComponent\(key\)[\s\S]*encodeURIComponent\(value\)/,
  },
  {
    file: 'components/quiz/QuestionReportLink.tsx',
    label: 'minimum report link target size',
    pattern: /minHeight: space\[6\]/,
  },
  {
    file: 'app/(tabs)/practice.tsx',
    label: 'practice report link import',
    pattern:
      /import \{ QuestionReportLink \} from '\.\.\/\.\.\/components\/quiz\/QuestionReportLink';/,
  },
  {
    file: 'app/(tabs)/practice.tsx',
    label: 'practice feedback selected answer context',
    message: 'QuestionReportLink missing practice feedback selected answer context',
    pattern:
      /<QuestionReportLink[\s\S]*language=\{language\}[\s\S]*question=\{question\}[\s\S]*screen="practice"[\s\S]*selectedOptionId=\{selectedOptionId\}[\s\S]*\/>/,
  },
  {
    file: 'app/quiz/[sessionId].tsx',
    label: 'quiz feedback selected answer context',
    message: 'QuestionReportLink missing quiz feedback selected answer context',
    pattern:
      /<QuestionReportLink[\s\S]*language=\{language\}[\s\S]*question=\{question\}[\s\S]*screen="quiz"[\s\S]*selectedOptionId=\{selectedOptionId\}[\s\S]*\/>/,
  },
  {
    file: 'app/support.tsx',
    label: 'selected answer search param',
    pattern: /selectedAnswer\?: string \| string\[\];/,
  },
  {
    file: 'app/support.tsx',
    label: 'selected answer context parsing',
    pattern: /selectedAnswer: getSearchParam\(params\.selectedAnswer\)/,
  },
  {
    file: 'app/support.tsx',
    label: 'selected answer context row',
    pattern: /copy\.questionReportContext\.selectedAnswer/,
  },
  {
    file: 'app/support.tsx',
    label: 'Swedish non-PII warning',
    message: 'QuestionReportLink missing support context non-PII copy',
    pattern: /Lägg inte till namn, personnummer, ärendenummer/,
  },
  {
    file: 'app/support.tsx',
    label: 'English non-PII warning',
    message: 'QuestionReportLink missing support context non-PII copy',
    pattern:
      /Do not add names, personal identity numbers, case numbers, or other personal data to the report\./,
  },
  {
    file: 'app/support.tsx',
    label: 'support context summary role',
    pattern: /accessibilityRole="summary"/,
  },
  {
    file: 'app/support.tsx',
    label: 'no direct report data submission',
    message: 'QuestionReportLink support route must not submit report data over the network',
    forbiddenPattern: /mailto:|Linking\.openURL|fetch\(/,
  },
  {
    file: 'package.json',
    label: 'question report content test route',
    pattern: /tests\/content-question-report-link-parity\.test\.js/,
  },
];
const EXPECTED_THEME_COLOR_TOKENS = [
  'canvas',
  'surface',
  'surfaceWarm',
  'surfaceMuted',
  'text',
  'textSoft',
  'textSecondary',
  'textDisclaimer',
  'textMuted',
  'textPlaceholder',
  'warmDark',
  'accent',
  'accentActive',
  'focus',
  'focusSoft',
  'badgeBlueBg',
  'badgeBlueText',
  'border',
  'success',
  'successSoft',
  'correctBg',
  'warning',
  'warningSoft',
  'incorrectBg',
  'teal',
  'navy',
  'purple',
  'pink',
  'brown',
  'brandGoogleBlue',
  'brandGoogleGreen',
  'brandGoogleRed',
  'brandGoogleYellow',
  'brandFacebook',
  'brandWhite',
  'swedishBlue',
  'swedishGold',
];
const EXPECTED_THEME_SPACE_VALUES = {
  hairline: 2,
  micro: 3,
  0: 0,
  0.5: 4,
  0.625: 5,
  0.75: 6,
  0.875: 7,
  1: 8,
  1.25: 10,
  1.375: 11,
  1.5: 12,
  1.75: 14,
  2: 16,
  2.25: 18,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  12: 96,
  15: 120,
};
const EXPECTED_THEME_RADIUS_VALUES = {
  input: 4,
  micro: 4,
  subtle: 5,
  small: 8,
  button: 12,
  card: 12,
  large: 16,
  pill: 9999,
  circle: 9999,
};
const EXPECTED_THEME_TYPOGRAPHY_TOKENS = [
  'displayHero',
  'displaySecondary',
  'sectionHeading',
  'subHeadingLarge',
  'subHeading',
  'cardTitle',
  'bodyLarge',
  'heroMobile',
  'metric',
  'sectionTitle',
  'bodyTight',
  'finePrint',
  'disclaimer',
  'body',
  'bodyMedium',
  'bodySemibold',
  'bodyBold',
  'navButton',
  'caption',
  'captionLight',
  'badge',
  'micro',
];
const EXPECTED_THEME_SHADOW_TOKENS = ['card', 'deep'];
const EXPECTED_THEME_MOTION_DURATIONS = {
  fast: 120,
  base: 200,
  slow: 320,
};
const EXPECTED_THEME_MOTION_EASING = ['standard', 'press'];
const EXPECTED_THEME_CONTRAST_PAIRS = [
  ['text', 'canvas'],
  ['text', 'surface'],
  ['text', 'surfaceWarm'],
  ['textSoft', 'surface'],
  ['textSecondary', 'surface'],
  ['textDisclaimer', 'surface'],
  ['textMuted', 'surface'],
  ['textPlaceholder', 'surface'],
  ['warmDark', 'surfaceWarm'],
  ['accent', 'surface'],
  ['accentActive', 'surface'],
  ['badgeBlueText', 'badgeBlueBg'],
  ['success', 'successSoft'],
  ['warning', 'warningSoft'],
  ['teal', 'surface'],
  ['navy', 'surface'],
  ['purple', 'surface'],
  ['pink', 'surface'],
  ['brown', 'surface'],
  ['swedishBlue', 'surface'],
];
const EXPECTED_PROGRESS_QUESTION_FIELDS = [
  'questionId',
  'seenCount',
  'correctCount',
  'wrongCount',
  'correctStreak',
  'lastAnsweredAt',
  'nextReviewAt',
  'confidenceRating',
  'bookmarked',
];
const EXPECTED_PROGRESS_OPTIONAL_FIELDS = new Set([
  'lastAnsweredAt',
  'nextReviewAt',
  'confidenceRating',
  'bookmarked',
]);
const EXPECTED_PROGRESS_QUESTION_FIELD_TYPES = {
  questionId: 'string',
  seenCount: 'number',
  correctCount: 'number',
  wrongCount: 'number',
  correctStreak: 'number',
  lastAnsweredAt: 'string',
  nextReviewAt: 'string',
  confidenceRating: 'ConfidenceRating',
  bookmarked: 'boolean',
};
const EXPECTED_PROGRESS_TYPE_UNIONS = [
  { typeName: 'QuizMode', values: ['study', 'exam', 'mistakes', 'challenge'] },
  { typeName: 'ConfidenceRating', values: [1, 2, 3, 4, 5] },
];
const EXPECTED_PROGRESS_INTERFACES = [
  {
    name: 'UserQuestionProgress',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'seenCount', type: 'number', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'wrongCount', type: 'number', optional: false },
      { name: 'correctStreak', type: 'number', optional: false },
      { name: 'lastAnsweredAt', type: 'string', optional: true },
      { name: 'nextReviewAt', type: 'string', optional: true },
      { name: 'confidenceRating', type: 'ConfidenceRating', optional: true },
      { name: 'bookmarked', type: 'boolean', optional: true },
    ],
  },
  {
    name: 'QuizAnswer',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'selectedOptionIds', type: 'string[]', optional: false },
      { name: 'isCorrect', type: 'boolean', optional: false },
      { name: 'answeredAt', type: 'string', optional: false },
      { name: 'timeSpentSeconds', type: 'number', optional: false },
      { name: 'confidenceRating', type: 'ConfidenceRating', optional: true },
    ],
  },
  {
    name: 'QuizSession',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'mode', type: 'QuizMode', optional: false },
      { name: 'questionIds', type: 'string[]', optional: false },
      { name: 'answers', type: 'QuizAnswer[]', optional: false },
      { name: 'startedAt', type: 'string', optional: false },
      { name: 'completedAt', type: 'string', optional: true },
      { name: 'score', type: 'number', optional: true },
    ],
  },
  {
    name: 'UserProgress',
    fields: [
      { name: 'totalXp', type: 'number', optional: false },
      { name: 'level', type: 'number', optional: false },
      { name: 'currentStreak', type: 'number', optional: false },
      { name: 'dailyGoalAnswers', type: 'number', optional: false },
      { name: 'questionProgress', type: 'Record<string, UserQuestionProgress>', optional: false },
      { name: 'sessions', type: 'QuizSession[]', optional: false },
      {
        name: 'dailyChallengeCompletions',
        type: 'Record<string, DailyChallengeCompletion>',
        optional: false,
      },
    ],
  },
];
const EXPECTED_PROGRESS_STORE_FIELDS = [
  { name: 'completedQuestionIds', type: 'string[]', optional: false },
  { name: 'questionProgress', type: 'Record<string, QuestionProgress>', optional: false },
  { name: 'totalXp', type: 'number', optional: false },
  { name: 'answerDates', type: 'string[]', optional: false },
  { name: 'answerHistory', type: 'AnswerHistoryEntry[]', optional: false },
  {
    name: 'dailyChallengeCompletions',
    type: 'Record<string, DailyChallengeProgress>',
    optional: false,
  },
  { name: 'mockExamSessions', type: 'MockExamProgress[]', optional: false },
  { name: 'streakFreezeState', type: 'StreakFreezeState', optional: false },
  {
    name: 'persistenceWarning',
    type: 'RecoverablePersistenceWarning | null',
    optional: false,
  },
  { name: 'markQuestionCompleted', type: '(questionId: string) => void', optional: false },
  {
    name: 'recordAnswer',
    type: '(questionId: string, isCorrect: boolean, confidenceRating?: ConfidenceRating) => void',
    optional: false,
  },
  {
    name: 'recordDailyChallengeCompletion',
    type: '(completion: DailyChallengeProgressInput) => void',
    optional: false,
  },
  {
    name: 'recordMockExamSession',
    type: '(session: MockExamProgressInput) => void',
    optional: false,
  },
  {
    name: 'setStreakFreezeState',
    type: '(streakFreezeState: StreakFreezeState) => void',
    optional: false,
  },
  { name: 'toggleBookmark', type: '(questionId: string) => void', optional: false },
  { name: 'resetProgress', type: '() => void', optional: false },
  { name: 'clearPersistenceWarning', type: '() => void', optional: false },
];
const EXPECTED_PRACTICE_SESSION_STORE_FIELDS = [
  { name: 'activeQuestionId', type: 'string | null', optional: false },
  { name: 'selectedOptionId', type: 'string | null', optional: false },
  { name: 'shuffleSessionId', type: 'string', optional: false },
  { name: 'selectOption', type: '(questionId: string, optionId: string) => void', optional: false },
  { name: 'resetSelection', type: '() => void', optional: false },
  { name: 'advanceQuestion', type: '() => void', optional: false },
];
const EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS = [
  { typeName: 'AnswerOptionFeedbackTone', values: ['idle', 'correct', 'incorrect'] },
];
const EXPECTED_ANSWER_VALIDATION_INTERFACES = [
  {
    name: 'AnswerOptionFeedback',
    fields: [
      { name: 'resultLabel', type: 'string', optional: true },
      { name: 'tone', type: 'AnswerOptionFeedbackTone', optional: false },
    ],
  },
];
const EXPECTED_CONTENT_TYPE_UNIONS = [
  { typeName: 'ReviewStatus', values: REVIEW_STATUS_VALUES },
  { typeName: 'QuestionType', values: QUESTION_TYPE_VALUES },
  { typeName: 'Difficulty', values: DIFFICULTY_VALUES },
];
const EXPECTED_CONTENT_INTERFACES = [
  {
    name: 'UHRReference',
    fields: [
      { name: 'chapter', type: 'string', optional: false },
      { name: 'section', type: 'string', optional: false },
      { name: 'pageApprox', type: 'number', optional: false },
    ],
  },
  {
    name: 'QuestionOption',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'textSv', type: 'string', optional: false },
      { name: 'textEn', type: 'string', optional: false },
      { name: 'text', type: 'LocalizedContentText', optional: true },
    ],
  },
  {
    name: 'PracticeQuestion',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'type', type: 'QuestionType', optional: false },
      { name: 'questionSv', type: 'string', optional: false },
      { name: 'questionEn', type: 'string', optional: false },
      { name: 'questionText', type: 'LocalizedContentText', optional: true },
      { name: 'options', type: 'QuestionOption[]', optional: false },
      { name: 'correctOptionId', type: 'string', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'explanationText', type: 'LocalizedContentText', optional: true },
      { name: 'uhrReference', type: 'UHRReference', optional: false },
      { name: 'difficulty', type: 'Difficulty', optional: false },
      { name: 'reviewStatus', type: 'ReviewStatus', optional: false },
      { name: 'tags', type: 'string[]', optional: false },
    ],
  },
  {
    name: 'Chapter',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'nameSv', type: 'string', optional: false },
      { name: 'nameEn', type: 'string', optional: false },
      { name: 'nameText', type: 'LocalizedContentTextOverrides', optional: true },
      { name: 'descriptionSv', type: 'string', optional: false },
      { name: 'descriptionEn', type: 'string', optional: false },
      { name: 'descriptionText', type: 'LocalizedContentTextOverrides', optional: true },
      { name: 'questionCount', type: 'number', optional: false },
    ],
  },
  {
    name: 'GlossaryTerm',
    fields: [
      { name: 'id', type: 'string', optional: false },
      { name: 'termSv', type: 'string', optional: false },
      { name: 'termEn', type: 'string', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: true },
    ],
  },
];
function expectedContentInterfaceKeys(interfaceName) {
  const interfaceSpec = EXPECTED_CONTENT_INTERFACES.find((spec) => spec.name === interfaceName);
  return interfaceSpec ? interfaceSpec.fields.map((field) => field.name) : [];
}
const EXPECTED_UHR_REFERENCE_KEYS = expectedContentInterfaceKeys('UHRReference');
const EXPECTED_QUESTION_OPTION_KEYS = expectedContentInterfaceKeys('QuestionOption');
const EXPECTED_PRACTICE_QUESTION_KEYS = expectedContentInterfaceKeys('PracticeQuestion');
const EXPECTED_CHAPTER_KEYS = expectedContentInterfaceKeys('Chapter');
const EXPECTED_GLOSSARY_TERM_KEYS = expectedContentInterfaceKeys('GlossaryTerm');
const EXPECTED_UHR_SECTION_MAP_KEYS = ['source', 'chapters'];
const EXPECTED_UHR_SECTION_MAP_SOURCE_KEYS = ['title', 'publisher', 'url', 'retrievedDate'];
const EXPECTED_UHR_SECTION_MAP_CHAPTER_KEYS = ['id', 'chapter', 'startPage', 'endPage', 'sections'];
const EXPECTED_MOCK_EXAM_CONFIG_FIELDS = [
  { name: 'questionCount', type: 'number', optional: false },
  { name: 'durationMinutes', type: 'number', optional: false },
  { name: 'sourceScope', type: "'uhr_based'", optional: false },
  { name: 'showExplanationsDuringExam', type: 'boolean', optional: false },
  { name: 'adsAllowedDuringExam', type: 'boolean', optional: false },
];
const EXPECTED_MOCK_EXAM_CONFIG_KEYS = EXPECTED_MOCK_EXAM_CONFIG_FIELDS.map((field) => field.name);
const EXPECTED_EXAM_GENERATOR_TYPE_ALIASES = [
  { typeName: 'ExamAnswerMap', type: 'Record<string, string>' },
];
const EXPECTED_EXAM_GENERATOR_INTERFACES = [
  {
    name: 'ExamOptions',
    fields: [
      { name: 'questionCount', type: 'number', optional: true },
      { name: 'sessionId', type: 'string', optional: true },
    ],
  },
  {
    name: 'ExamChapterResult',
    fields: [
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
    ],
  },
  {
    name: 'ExamResult',
    fields: [
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
      { name: 'percent', type: 'number', optional: false },
      { name: 'chapterBreakdown', type: 'ExamChapterResult[]', optional: false },
    ],
  },
  {
    name: 'ExamChapterBreakdownItem',
    fields: [
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'correctCount', type: 'number', optional: false },
      { name: 'totalCount', type: 'number', optional: false },
      { name: 'chapterNameSv', type: 'string', optional: false },
      { name: 'chapterNameEn', type: 'string', optional: false },
    ],
  },
  {
    name: 'ExamReviewItem',
    fields: [
      { name: 'questionId', type: 'string', optional: false },
      { name: 'questionSv', type: 'string', optional: false },
      { name: 'questionEn', type: 'string', optional: false },
      { name: 'chapterId', type: 'string', optional: false },
      { name: 'selectedOptionTextSv', type: 'string', optional: false },
      { name: 'selectedOptionTextEn', type: 'string', optional: false },
      { name: 'correctOptionTextSv', type: 'string', optional: false },
      { name: 'correctOptionTextEn', type: 'string', optional: false },
      { name: 'isCorrect', type: 'boolean', optional: false },
      { name: 'explanationSv', type: 'string', optional: false },
      { name: 'explanationEn', type: 'string', optional: false },
      { name: 'explanationText', type: "PracticeQuestion['explanationText']", optional: true },
      { name: 'uhrReference', type: "PracticeQuestion['uhrReference']", optional: false },
    ],
  },
  {
    name: 'ExamAutoSubmitState',
    fields: [
      { name: 'examActive', type: 'boolean', optional: true },
      { name: 'remainingSeconds', type: 'number', optional: false },
      { name: 'submitted', type: 'boolean', optional: false },
      { name: 'questionCount', type: 'number', optional: false },
    ],
  },
];
const EXPECTED_MONETIZATION_TYPE_UNIONS = [
  {
    typeName: 'AdPlacement',
    values: [
      'home_banner',
      'chapter_list_banner',
      'quiz_completed_interstitial',
      'results_native',
      'rewarded_extra_exam',
      'app_open_launch',
    ],
  },
];
const EXPECTED_MONETIZATION_INTERFACES = [
  {
    name: 'AdUnitConfig',
    fields: [
      { name: 'placement', type: 'AdPlacement', optional: false },
      { name: 'iosUnitId', type: 'string', optional: true },
      { name: 'androidUnitId', type: 'string', optional: true },
      { name: 'enabled', type: 'boolean', optional: false },
      { name: 'testOnly', type: 'boolean', optional: false },
    ],
  },
  {
    name: 'PremiumEntitlements',
    fields: [
      { name: 'adsDisabled', type: 'boolean', optional: false },
      { name: 'unlimitedMockExams', type: 'boolean', optional: false },
      { name: 'fullMistakeReview', type: 'boolean', optional: false },
    ],
  },
  {
    name: 'MonetizationState',
    fields: [
      { name: 'premium', type: 'PremiumEntitlements', optional: false },
      { name: 'adUnits', type: 'AdUnitConfig[]', optional: false },
    ],
  },
];
const EXPECTED_PURCHASE_TYPE_UNIONS = [
  {
    typeName: 'RemoveAdsReceiptValidationStatus',
    values: ['valid', 'invalid', 'pending'],
  },
  {
    typeName: 'RemoveAdsPurchaseStatus',
    values: ['purchased', 'pending', 'restored', 'not_found', 'persistence_failed'],
  },
];
const EXPECTED_PURCHASE_INTERFACES = [
  {
    name: 'PurchaseStorage',
    fields: [
      { name: 'getItemAsync', type: '(key: string) => Promise<string | null>', optional: false },
      {
        name: 'setItemAsync',
        type: '(key: string, value: string) => Promise<void>',
        optional: false,
      },
      { name: 'deleteItemAsync', type: '(key: string) => Promise<void>', optional: true },
    ],
  },
  {
    name: 'RemoveAdsPurchaseRecord',
    fields: [
      { name: 'productId', type: 'string', optional: false },
      { name: 'purchaseToken', type: 'string | null', optional: true },
      { name: 'transactionId', type: 'string | null', optional: true },
      { name: 'raw', type: 'unknown', optional: true },
    ],
  },
  {
    name: 'RemoveAdsReceiptValidationResult',
    fields: [
      { name: 'status', type: 'RemoveAdsReceiptValidationStatus', optional: false },
      { name: 'productId', type: 'string | null', optional: true },
      { name: 'purchaseToken', type: 'string | null', optional: true },
      { name: 'transactionId', type: 'string | null', optional: true },
      { name: 'validatedAt', type: 'string | null', optional: true },
    ],
  },
  {
    name: 'RemoveAdsPurchaseProvider',
    fields: [
      { name: 'connect', type: '() => Promise<void>', optional: false },
      { name: 'disconnect', type: '() => Promise<void>', optional: true },
      {
        name: 'finishPurchase',
        type: '(purchase: RemoveAdsPurchaseRecord) => Promise<void>',
        optional: true,
      },
      {
        name: 'validateRemoveAdsReceipt',
        type: '(purchase: RemoveAdsPurchaseRecord, productId: typeof REMOVE_ADS_PRODUCT_ID) => Promise<RemoveAdsReceiptValidationResult>',
        optional: true,
      },
      {
        name: 'requestRemoveAdsPurchase',
        type: '(productId: string) => Promise<RemoveAdsPurchaseRecord | null>',
        optional: false,
      },
      {
        name: 'restorePurchases',
        type: '(productIds: readonly string[]) => Promise<RemoveAdsPurchaseRecord[]>',
        optional: false,
      },
    ],
  },
  {
    name: 'RemoveAdsPurchaseResult',
    fields: [
      { name: 'entitlements', type: 'PremiumEntitlements', optional: false },
      { name: 'priceLabel', type: 'typeof REMOVE_ADS_PRICE_LABEL', optional: false },
      { name: 'productId', type: 'typeof REMOVE_ADS_PRODUCT_ID', optional: false },
      { name: 'purchaseToken', type: 'string | null', optional: true },
      { name: 'status', type: 'RemoveAdsPurchaseStatus', optional: false },
      { name: 'transactionId', type: 'string | null', optional: true },
    ],
  },
  {
    name: 'PurchaseRuntimeOptions',
    fields: [
      { name: 'provider', type: 'RemoveAdsPurchaseProvider', optional: true },
      { name: 'storage', type: 'PurchaseStorage', optional: true },
    ],
  },
  {
    name: 'NativePurchaseProviderOptions',
    fields: [
      { name: 'loadIap', type: '() => Promise<NativeIapModule>', optional: true },
      { name: 'platform', type: 'RemoveAdsStorePlatform', optional: true },
      { name: 'purchaseTimeoutMs', type: 'number', optional: true },
      { name: 'receiptValidator', type: 'NativeRemoveAdsReceiptValidator', optional: true },
    ],
  },
  {
    name: 'MockPurchaseProviderOptions',
    fields: [
      { name: 'owned', type: 'boolean', optional: true },
      { name: 'pendingPurchase', type: 'boolean', optional: true },
      { name: 'receiptValidationStatus', type: 'RemoveAdsReceiptValidationStatus', optional: true },
    ],
  },
];
const EXPECTED_AD_CONSENT_TYPE_UNIONS = [
  { typeName: 'AdConsentPlatform', values: ['android', 'ios', 'web', 'unknown'] },
  { typeName: 'AdConsentRegion', values: ['eea', 'uk', 'us', 'other', 'unknown'] },
  {
    typeName: 'AppTrackingTransparencyStatus',
    values: ['authorized', 'denied', 'not_determined', 'restricted', 'unavailable'],
  },
  {
    typeName: 'UmpConsentStatus',
    values: ['obtained', 'not_required', 'required', 'unknown'],
  },
  {
    typeName: 'AdConsentPrompt',
    values: ['app_tracking_transparency', 'ump_consent_form'],
  },
  {
    typeName: 'AdSdkInitializationBlockReason',
    values: [
      'google_ads_disabled',
      'remove_ads_entitlement',
      'pending_consent_prompts',
      'consent_required',
    ],
  },
];
const EXPECTED_AD_CONSENT_INTERFACES = [
  {
    name: 'AdConsentState',
    fields: [
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: false },
      { name: 'googleMobileAdsEnabled', type: 'boolean', optional: false },
      { name: 'platform', type: 'AdConsentPlatform', optional: false },
      { name: 'realAdsEnabled', type: 'boolean', optional: false },
      { name: 'region', type: 'AdConsentRegion', optional: false },
      {
        name: 'trackingTransparencyStatus',
        type: 'AppTrackingTransparencyStatus',
        optional: false,
      },
      { name: 'umpConsentStatus', type: 'UmpConsentStatus', optional: false },
    ],
  },
  {
    name: 'AdConsentDecision',
    fields: [
      { name: 'adServingAllowed', type: 'boolean', optional: false },
      { name: 'canRequestNonPersonalizedAds', type: 'boolean', optional: false },
      { name: 'canRequestPersonalizedAds', type: 'boolean', optional: false },
      { name: 'pendingPrompts', type: 'AdConsentPrompt[]', optional: false },
    ],
  },
  {
    name: 'AdSdkInitializationDecision',
    fields: [
      { name: 'blockReason', type: 'AdSdkInitializationBlockReason', optional: true },
      { name: 'canInitializeGoogleMobileAds', type: 'boolean', optional: false },
      { name: 'consentDecision', type: 'AdConsentDecision', optional: false },
      { name: 'requestNonPersonalizedAdsOnly', type: 'boolean', optional: false },
    ],
  },
];
const EXPECTED_MOBILE_ADS_CONSENT_INTERFACES = [
  {
    name: 'TrackingPermissionResult',
    fields: [
      { name: 'granted', type: 'boolean', optional: true },
      { name: 'status', type: 'string', optional: true },
    ],
  },
  {
    name: 'UmpConsentResult',
    fields: [
      { name: 'canRequestAds', type: 'boolean', optional: true },
      { name: 'status', type: 'string', optional: true },
    ],
  },
  {
    name: 'MobileAdsConsentRuntime',
    fields: [
      { name: 'getUmpConsentInfo', type: '() => Promise<UmpConsentResult>', optional: true },
      { name: 'gatherUmpConsent', type: '() => Promise<UmpConsentResult>', optional: true },
      {
        name: 'getTrackingPermissionsAsync',
        type: '() => Promise<TrackingPermissionResult>',
        optional: true,
      },
      { name: 'initializeGoogleMobileAds', type: '() => Promise<unknown>', optional: true },
      { name: 'platform', type: 'AdConsentPlatform | string', optional: false },
      {
        name: 'requestTrackingPermissionsAsync',
        type: '() => Promise<TrackingPermissionResult>',
        optional: true,
      },
    ],
  },
  {
    name: 'MobileAdsConsentOptions',
    fields: [
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: false },
      { name: 'googleMobileAdsEnabled', type: 'boolean', optional: true },
      { name: 'realAdsEnabled', type: 'boolean', optional: true },
      { name: 'region', type: 'AdConsentRegion', optional: true },
      { name: 'runtime', type: 'MobileAdsConsentRuntime', optional: false },
    ],
  },
  {
    name: 'MobileAdsConsentInitializationResult',
    fields: [
      { name: 'decision', type: 'AdSdkInitializationDecision', optional: false },
      { name: 'initialized', type: 'boolean', optional: false },
      { name: 'state', type: 'AdConsentState', optional: false },
    ],
  },
];
const EXPECTED_REWARDED_AD_TYPE_UNIONS = [
  {
    typeName: 'RewardedExtraExamAdStatus',
    values: [
      'closed_without_reward',
      'earned_reward',
      'failed_to_load',
      'show_failed',
      'timed_out',
      'unavailable',
    ],
  },
];
const EXPECTED_REWARDED_AD_INTERFACES = [
  {
    name: 'RewardedExtraExamReward',
    fields: [
      { name: 'amount', type: 'number', optional: false },
      { name: 'type', type: 'string', optional: false },
    ],
  },
  {
    name: 'RewardedExtraExamAdResult',
    fields: [
      { name: 'reward', type: 'RewardedExtraExamReward', optional: true },
      { name: 'status', type: 'RewardedExtraExamAdStatus', optional: false },
    ],
  },
  {
    name: 'RewardedExtraExamAdOptions',
    fields: [
      { name: 'confirmReward', type: 'RewardedExtraExamRewardConfirmation', optional: true },
      { name: 'entitlements', type: "Pick<PremiumEntitlements, 'adsDisabled'>", optional: true },
      { name: 'requestNonPersonalizedAdsOnly', type: 'boolean', optional: true },
      { name: 'timeoutMs', type: 'number', optional: true },
      { name: 'webConsentDecision', type: 'RewardedExtraExamWebConsentDecision', optional: true },
    ],
  },
];
const EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS = [
  {
    typeName: 'MockExamAccessReason',
    values: [
      'free_exam_available',
      'premium_unlimited_mock_exams',
      'rewarded_exam_credit',
      'rewarded_ad_available',
      'remove_ads_active',
      'consent_required',
      'ads_unavailable',
      'access_read_failed',
    ],
  },
];
const EXPECTED_MOCK_EXAM_ACCESS_INTERFACES = [
  {
    name: 'MockExamAccessState',
    fields: [
      { name: 'completedMockExamsToday', type: 'number', optional: false },
      {
        name: 'consentDecision',
        type: "Pick<AdConsentDecision, 'adServingAllowed'>",
        optional: true,
      },
      {
        name: 'entitlements',
        type: "Pick<PremiumEntitlements, 'adsDisabled' | 'unlimitedMockExams'>",
        optional: false,
      },
      { name: 'freeMockExamLimit', type: 'number', optional: false },
      { name: 'platform', type: 'AdRuntimePlatform | string', optional: true },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: true },
    ],
  },
  {
    name: 'MockExamAccessDecision',
    fields: [
      { name: 'canOfferRewardedAd', type: 'boolean', optional: false },
      { name: 'canStartExam', type: 'boolean', optional: false },
      { name: 'freeExamsRemaining', type: 'number', optional: false },
      { name: 'placement', type: 'typeof REWARDED_EXTRA_EXAM_PLACEMENT', optional: false },
      { name: 'reason', type: 'MockExamAccessReason', optional: false },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
    ],
  },
  {
    name: 'PersistedMockExamAccess',
    fields: [
      { name: 'completedMockExamsByDate', type: 'Record<string, number>', optional: false },
      {
        name: 'completedMockExamSessionIdsByDate',
        type: 'Record<string, string[]>',
        optional: false,
      },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
    ],
  },
  {
    name: 'StoredMockExamAccessSnapshot',
    fields: [
      { name: 'completedMockExamsByDate', type: 'Record<string, number>', optional: false },
      {
        name: 'completedMockExamSessionIdsByDate',
        type: 'Record<string, string[]>',
        optional: false,
      },
      { name: 'rewardedExtraExamCredits', type: 'number', optional: false },
      { name: 'completedMockExamsToday', type: 'number', optional: false },
      { name: 'dateKey', type: 'string', optional: false },
    ],
  },
  {
    name: 'MockExamAccessStorage',
    fields: [
      { name: 'deleteItemAsync', type: '(key: string) => Promise<void>', optional: true },
      { name: 'getItemAsync', type: '(key: string) => Promise<string | null>', optional: false },
      {
        name: 'setItemAsync',
        type: '(key: string, value: string) => Promise<void>',
        optional: false,
      },
    ],
  },
  {
    name: 'MockExamAccessStorageOptions',
    fields: [
      { name: 'date', type: 'Date | string', optional: true },
      { name: 'storage', type: 'MockExamAccessStorage', optional: false },
    ],
  },
  {
    name: 'RecordMockExamCompletionOptions',
    fields: [
      { name: 'date', type: 'Date | string', optional: true },
      { name: 'storage', type: 'MockExamAccessStorage', optional: false },
      { name: 'sessionId', type: 'string', optional: false },
    ],
  },
];

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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request === 'expo-speech') {
      return speechMock;
    }
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      const relativeResolvedPath = path.relative(repoRoot, resolvedPath);
      return loadTs(relativeResolvedPath);
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function loadText(relativePath) {
  return fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

function loadStaticI18nExtras() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(loadText('site/i18n-extras.js'), sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra || {};
}

function fail(message) {
  failures.push(message);
}

function validateValidationScriptSyntax() {
  for (const relativePath of EXPECTED_VALIDATION_SCRIPT_SYNTAX_FILES) {
    const filePath = path.join(repoRoot, relativePath);
    try {
      new vm.Script(fs.readFileSync(filePath, 'utf8'), { filename: filePath });
      validationScriptSyntaxChecksValidated += 1;
    } catch (error) {
      fail(`${relativePath} must parse before validation runs: ${error.message}`);
    }
  }
}

function dateIsoDay(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : '';
}

function validateStaticValidationSyntaxGate() {
  let valid = true;

  for (const fileName of STATIC_VALIDATION_SYNTAX_FILES) {
    const result = spawnSync(process.execPath, ['--check', fileName], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      valid = false;
      fail(
        `${fileName} must parse before content validation runs:\n${(
          result.stderr ||
          result.stdout ||
          ''
        ).trim()}`,
      );
    } else {
      staticValidationSyntaxFilesValidated += 1;
    }
  }

  for (const check of STATIC_VALIDATION_IMPORT_CHECKS) {
    const result = spawnSync(process.execPath, ['-e', check.script], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      valid = false;
      fail(
        `${check.label} must be importable before content validation runs:\n${(
          result.stderr ||
          result.stdout ||
          ''
        ).trim()}`,
      );
    } else {
      staticValidationImportChecksValidated += 1;
    }
  }

  if (valid) staticValidationSyntaxGateValidated = true;
}

function countStaticI18nEnglishFallbackChecks(keys) {
  return keys.filter((key) => Boolean(STATIC_I18N_ENGLISH_FALLBACKS_BY_KEY[key])).length;
}

function validateStaticI18nSomaliNaturalness() {
  const result = {
    requiredCopyValidated: 0,
    highFrequencyLabelsValidated: 0,
    forbiddenFragmentsValidated: 0,
    englishFallbacksValidated: 0,
  };
  const extra = loadStaticI18nExtras();
  const somali = extra.so;

  if (!somali || typeof somali !== 'object' || Array.isArray(somali)) {
    fail('static Somali i18n dictionary must exist');
    return result;
  }

  for (const [key, expected] of Object.entries(STATIC_I18N_SOMALI_EXPECTED_COPY)) {
    if (somali[key] === expected) {
      result.requiredCopyValidated += 1;
    } else {
      fail(`Somali static-site ${key} should use reviewed local copy`);
    }
  }

  for (const key of STATIC_I18N_SOMALI_HIGH_FREQUENCY_KEYS) {
    const value = somali[key];
    if (typeof value === 'string' && value.trim()) {
      result.highFrequencyLabelsValidated += 1;
    } else {
      fail(`Somali static-site ${key} must be a non-empty string`);
      continue;
    }

    const englishFallback = STATIC_I18N_ENGLISH_FALLBACKS_BY_KEY[key];
    if (!englishFallback) continue;
    if (new RegExp(escapeRegExp(englishFallback), 'i').test(value)) {
      fail(`Somali static-site ${key} still uses English fallback`);
    } else {
      result.englishFallbacksValidated += 1;
    }
  }

  const serializedSomali = Object.values(somali).join('\n');
  for (const fragment of STATIC_I18N_SOMALI_FORBIDDEN_FRAGMENTS) {
    if (new RegExp(escapeRegExp(fragment), 'i').test(serializedSomali)) {
      fail(`Somali static-site dictionary still contains ${fragment}`);
    } else {
      result.forbiddenFragmentsValidated += 1;
    }
  }

  return result;
}

function validateStaticI18nArabicNaturalness() {
  const result = {
    requiredCopyValidated: 0,
    highFrequencyLabelsValidated: 0,
    forbiddenFragmentsValidated: 0,
    englishFallbacksValidated: 0,
  };
  const extra = loadStaticI18nExtras();
  const arabic = extra.ar;

  if (!arabic || typeof arabic !== 'object' || Array.isArray(arabic)) {
    fail('static Arabic i18n dictionary must exist');
    return result;
  }

  for (const [key, expected] of Object.entries(STATIC_I18N_ARABIC_EXPECTED_COPY)) {
    if (arabic[key] === expected) {
      result.requiredCopyValidated += 1;
    } else {
      fail(`Arabic static-site ${key} should use reviewed local copy`);
    }
  }

  for (const key of STATIC_I18N_ARABIC_HIGH_FREQUENCY_KEYS) {
    const value = arabic[key];
    if (typeof value === 'string' && value.trim()) {
      result.highFrequencyLabelsValidated += 1;
    } else {
      fail(`Arabic static-site ${key} must be a non-empty string`);
      continue;
    }

    const englishFallback = STATIC_I18N_ENGLISH_FALLBACKS_BY_KEY[key];
    if (!englishFallback) continue;
    if (new RegExp(escapeRegExp(englishFallback), 'i').test(value)) {
      fail(`Arabic static-site ${key} still uses English fallback`);
    } else {
      result.englishFallbacksValidated += 1;
    }
  }

  const serializedArabic = Object.values(arabic).join('\n');
  for (const fragment of STATIC_I18N_ARABIC_FORBIDDEN_FRAGMENTS) {
    if (new RegExp(escapeRegExp(fragment), 'i').test(serializedArabic)) {
      fail(`Arabic static-site dictionary still contains ${fragment}`);
    } else {
      result.forbiddenFragmentsValidated += 1;
    }
  }

  return result;
}

function exitWithValidationFailures() {
  if (failures.length === 0) return;
  console.error('Content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

function printValidationSummary(summary) {
  console.log('Content validation OK');
  console.log(JSON.stringify(summary, null, 2));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptionText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function textIsTrimmedSingleSpaced(value) {
  return typeof value === 'string' && value === normalizeOptionText(value);
}

function normalizeComparableText(value) {
  return normalizeOptionText(value).toLocaleLowerCase('sv-SE');
}

function bilingualTextPairsAreDistinct(question) {
  return (
    normalizeComparableText(question.questionSv) !== normalizeComparableText(question.questionEn) &&
    normalizeComparableText(question.explanationSv) !==
      normalizeComparableText(question.explanationEn)
  );
}

function optionTextPairIsTranslatedOrInvariant(option) {
  const textSv = normalizeComparableText(option?.textSv);
  const textEn = normalizeComparableText(option?.textEn);
  if (!textSv || !textEn || textSv !== textEn) return true;

  const wordCount = normalizeOptionText(option.textSv).split(/\s+/).length;
  return wordCount <= 2;
}

function optionBilingualTextPairsAreValid(question) {
  if (!Array.isArray(question.options)) return false;
  return question.options.every(optionTextPairIsTranslatedOrInvariant);
}

function questionTextFieldsAreNormalized(question) {
  const fields = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.uhrReference?.chapter,
    question.uhrReference?.section,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ];

  return fields.every(textIsTrimmedSingleSpaced);
}

function textHasSentenceEnding(value) {
  return typeof value === 'string' && /[.!?]$/.test(value.trim());
}

function validateStaticHeadMetadataParity() {
  const indexHtml = loadText('site/index.html');
  const titleIssues = findStaticHeadMetadataTitleIssues(indexHtml, 'site/index.html');
  const descriptionIssues = findStaticHeadMetadataDescriptionIssues(indexHtml, 'site/index.html');

  if (titleIssues.length > 0) {
    fail(
      `static head title must be branded, non-empty, and avoid pass/passport outcome copy:\n${formatUnsupportedStaticOutcomeSlogans(
        titleIssues,
      )}`,
    );
  } else {
    staticHeadMetadataTitleValidated = extractStaticHeadTitles(indexHtml).length;
  }

  if (descriptionIssues.length > 0) {
    fail(
      `static meta description must be non-empty and avoid pass/passport outcome copy:\n${formatUnsupportedStaticOutcomeSlogans(
        descriptionIssues,
      )}`,
    );
  } else {
    staticHeadMetadataDescriptionValidated = extractStaticHeadMetaDescriptions(indexHtml).length;
  }

  const expectedOutcomeClaimPatterns =
    UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS.length +
    UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS.length;
  if (titleIssues.length === 0 && descriptionIssues.length === 0) {
    staticHeadMetadataOutcomeClaimPatternsValidated = expectedOutcomeClaimPatterns;
  }
  staticHeadMetadataParityValidated =
    staticHeadMetadataTitleValidated > 0 &&
    staticHeadMetadataDescriptionValidated > 0 &&
    staticHeadMetadataOutcomeClaimPatternsValidated === expectedOutcomeClaimPatterns;
}

function validateStaticEbookOutcomeClaimPatterns() {
  const source = loadText('site/ebook.js');
  const offenders = STATIC_EBOOK_UNSUPPORTED_OUTCOME_CLAIM_PATTERNS.filter((pattern) =>
    pattern.test(source),
  );

  if (offenders.length > 0) {
    fail('static ebook contains unsupported pass-duration, pass-likelihood, or outcome copy');
  }

  return STATIC_EBOOK_UNSUPPORTED_OUTCOME_CLAIM_PATTERNS.length - offenders.length;
}

function validateStaticEbookPracticalTestClaims() {
  const source = loadText('site/ebook.js');
  let unsupportedPracticalClaimsValidated = 0;
  let sourceUrlsValidated = 0;
  let requiredCopyValidated = 0;

  STATIC_EBOOK_UNSUPPORTED_PRACTICAL_TEST_CLAIM_PATTERNS.forEach((pattern) => {
    if (pattern.test(source)) {
      fail(`static ebook contains unsupported practical test logistics claim: ${pattern}`);
      return;
    }
    unsupportedPracticalClaimsValidated += 1;
  });

  STATIC_EBOOK_PRACTICAL_TEST_SOURCE_URLS.forEach((url) => {
    if (!source.includes(url)) {
      fail(`static ebook practical test source metadata missing ${url}`);
      return;
    }
    sourceUrlsValidated += 1;
  });

  STATIC_EBOOK_PRACTICAL_TEST_REQUIRED_COPY.forEach((text) => {
    if (!source.includes(text)) {
      fail(`static ebook practical test copy missing current sourced claim: ${text}`);
      return;
    }
    requiredCopyValidated += 1;
  });

  return {
    requiredCopyValidated,
    sourceUrlsValidated,
    unsupportedPracticalClaimsValidated,
  };
}

function validateStaticEbookFactboxProvenance() {
  const source = loadText('site/ebook.js');
  let unsupportedFactboxClaimsValidated = 0;
  let sourceUrlsValidated = 0;
  let requiredCopyValidated = 0;

  STATIC_EBOOK_UNSUPPORTED_FACTBOX_PATTERNS.forEach((pattern) => {
    if (pattern.test(source)) {
      fail(`static ebook contains unsupported factbox or current prose claim: ${pattern}`);
      return;
    }
    unsupportedFactboxClaimsValidated += 1;
  });

  STATIC_EBOOK_FACTBOX_SOURCE_URLS.forEach((url) => {
    if (!source.includes(url)) {
      fail(`static ebook factbox source metadata missing ${url}`);
      return;
    }
    sourceUrlsValidated += 1;
  });

  STATIC_EBOOK_FACTBOX_REQUIRED_COPY.forEach((text) => {
    if (!source.includes(text)) {
      fail(`static ebook factbox provenance copy missing ${text}`);
      return;
    }
    requiredCopyValidated += 1;
  });

  return {
    requiredCopyValidated,
    sourceUrlsValidated,
    unsupportedFactboxClaimsValidated,
  };
}

function validateStaticV11ReadinessCopy() {
  const source = loadText('site/v11.js');
  const offenders = findUnsupportedStaticV11ReadinessCopyInSource(source);
  const missing = findMissingStaticV11ReadinessCopyInSource(source);

  if (offenders.length > 0) {
    fail(
      `static v1.1 dashboard exposes unsupported readiness/pass-prediction copy:\n${formatStaticV11ReadinessCopyIssues(
        offenders,
      )}`,
    );
  }

  if (missing.length > 0) {
    fail(
      `static v1.1 dashboard is missing local-practice labels, component labels, or non-official caveats:\n${formatStaticV11ReadinessCopyIssues(
        missing,
      )}`,
    );
  }

  return {
    requiredCopyValidated: STATIC_V11_REQUIRED_READINESS_COPY.length - missing.length,
    unsupportedPatternsValidated:
      STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS.length - offenders.length,
  };
}

const STATIC_SITE_SWEDISH_STUDY_TERM_FORBIDDEN = [
  /Spaced repetition/i,
  /\bquiz\b/i,
  /\btiming\b/i,
  /litet quiz/i,
  /riktig timing/i,
];

const STATIC_SITE_SWEDISH_STUDY_TERM_REQUIRED = [
  'Repetition med intervall',
  'kort övning',
  'tidsatt övning',
];
const STATIC_SITE_SWEDISH_GRAMMAR_TONE_FORBIDDEN = [
  /ingen juridiska/i,
  /fika-stor/i,
  /fika-skador/i,
];
const STATIC_SITE_SWEDISH_GRAMMAR_TONE_REQUIRED = [
  /inget juridiskt kr[aå]ngel/i,
  /en kort studievana/i,
  /inte ansvariga f[oö]r missade deadlines, avslagna ans[oö]kningar eller beslut/i,
];
const STATIC_EBOOK_SWEDISH_STUDY_TERM_FORBIDDEN = [
  /gör ett\s+quiz/i,
  new RegExp(['quiz', 'frågor'].join(''), 'i'),
  new RegExp(['quiz', 'pass'].join(''), 'i'),
  /quizet/i,
  /provexempel/i,
];
const STATIC_EBOOK_SWEDISH_STUDY_TERM_REQUIRED = [
  'gör en övning',
  'Starta övningsprov',
  'gör ett övningsprov',
];
const STATIC_I18N_CHINESE_LOCALES = ['zh-Hans', 'zh-Hant'];
const STATIC_I18N_CHINESE_TEXT_PATTERN = /[\u3400-\u9fff]/;
const STATIC_I18N_ASCII_SENTENCE_PUNCTUATION_NEAR_CHINESE =
  /[\u3400-\u9fff][,:;?!.]|[,:;?!.][\u3400-\u9fff]/;

function validateStaticSiteSwedishStudyTerms() {
  const source = loadText('site/app.js');
  const swedishDictionary = source.match(/\n  sv: \{([\s\S]*?)\n  \}\n\};/)?.[1];
  let forbiddenTermsValidated = 0;
  let requiredTermsValidated = 0;

  if (!swedishDictionary) {
    fail('static site Swedish dictionary block must stay parseable');
    return {
      forbiddenTermsValidated,
      requiredTermsValidated,
    };
  }

  STATIC_SITE_SWEDISH_STUDY_TERM_FORBIDDEN.forEach((pattern) => {
    if (pattern.test(swedishDictionary)) {
      fail(`static site Swedish dictionary contains English study term: ${pattern}`);
      return;
    }
    forbiddenTermsValidated += 1;
  });

  STATIC_SITE_SWEDISH_STUDY_TERM_REQUIRED.forEach((term) => {
    if (!swedishDictionary.includes(term)) {
      fail(`static site Swedish dictionary missing natural study term: ${term}`);
      return;
    }
    requiredTermsValidated += 1;
  });

  return {
    forbiddenTermsValidated,
    requiredTermsValidated,
  };
}

function validateStaticSiteSwedishGrammarTone() {
  const source = loadText('site/app.js');
  const swedishDictionary = source.match(/\n  sv: \{([\s\S]*?)\n  \}\n\};/)?.[1];
  let forbiddenPhrasesValidated = 0;
  let requiredPhrasesValidated = 0;

  if (!swedishDictionary) {
    fail('static site Swedish dictionary block must stay parseable');
    return {
      forbiddenPhrasesValidated,
      requiredPhrasesValidated,
    };
  }

  STATIC_SITE_SWEDISH_GRAMMAR_TONE_FORBIDDEN.forEach((pattern) => {
    if (pattern.test(swedishDictionary)) {
      fail(`static site Swedish grammar/tone copy contains stale phrase: ${pattern}`);
      return;
    }
    forbiddenPhrasesValidated += 1;
  });

  STATIC_SITE_SWEDISH_GRAMMAR_TONE_REQUIRED.forEach((pattern) => {
    if (!pattern.test(swedishDictionary)) {
      fail(`static site Swedish grammar/tone copy missing natural phrase: ${pattern}`);
      return;
    }
    requiredPhrasesValidated += 1;
  });

  return {
    forbiddenPhrasesValidated,
    requiredPhrasesValidated,
  };
}

function validateStaticEbookSwedishStudyTerms() {
  const source = loadText('site/ebook.js');
  let forbiddenTermsValidated = 0;
  let requiredTermsValidated = 0;

  STATIC_EBOOK_SWEDISH_STUDY_TERM_FORBIDDEN.forEach((pattern) => {
    if (pattern.test(source)) {
      fail(`static ebook Swedish copy contains stale study term: ${pattern}`);
      return;
    }
    forbiddenTermsValidated += 1;
  });

  STATIC_EBOOK_SWEDISH_STUDY_TERM_REQUIRED.forEach((term) => {
    if (!source.includes(term)) {
      fail(`static ebook Swedish copy missing natural study term: ${term}`);
      return;
    }
    requiredTermsValidated += 1;
  });

  return {
    forbiddenTermsValidated,
    requiredTermsValidated,
  };
}

function stripAllowedStaticI18nTokens(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/#[/a-z0-9_-]+/gi, ' ')
    .replace(
      /\b(?:Almost Swedish|Google AdSense|Google Mobile Ads|AdMob|Cookie|cookies|UHR|Skolverket|Migrationsverket|BankID|MVP|EN|SV|SEK|Jantelagen|Allemansrätten|Lagom|Fika|fika)\b/g,
      ' ',
    );
}

function validateStaticI18nChinesePunctuation() {
  let localesValidated = 0;
  let valuesValidated = 0;
  let valid = true;
  let dictionaries;

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    dictionaries = loadStaticI18nExtras();
  } catch (error) {
    reject(`site/i18n-extras.js must stay parseable for static i18n validation: ${error.message}`);
    return { localesValidated, valuesValidated, valid };
  }

  for (const locale of STATIC_I18N_CHINESE_LOCALES) {
    const dictionary = dictionaries?.[locale];
    if (!dictionary || typeof dictionary !== 'object' || Array.isArray(dictionary)) {
      reject(`static i18n extra dictionary ${locale} must exist`);
      continue;
    }
    localesValidated += 1;

    for (const [key, value] of Object.entries(dictionary)) {
      if (typeof value !== 'string') {
        reject(`static i18n extra ${locale}.${key} must be a string`);
        continue;
      }
      if (!STATIC_I18N_CHINESE_TEXT_PATTERN.test(value)) continue;

      const learnerText = stripAllowedStaticI18nTokens(value);
      if (STATIC_I18N_ASCII_SENTENCE_PUNCTUATION_NEAR_CHINESE.test(learnerText)) {
        reject(
          `static i18n extra ${locale}.${key} uses Latin sentence punctuation near Chinese text`,
        );
        continue;
      }
      valuesValidated += 1;
    }
  }

  if (valuesValidated === 0) {
    reject('static i18n Chinese punctuation guard must inspect learner-facing values');
  }

  return { localesValidated, valuesValidated, valid };
}

function questionSentenceEndingsAreComplete(question) {
  return ['questionSv', 'questionEn', 'explanationSv', 'explanationEn'].every((field) =>
    textHasSentenceEnding(question[field]),
  );
}

function validateCitizenshipTimeline() {
  let dateParity = true;
  let countdownCopyParity = true;
  const sourceUrls = examDateModule.CITIZENSHIP_TIMELINE_SOURCE_URLS;
  const rulesDate = dateIsoDay(examDateModule.CITIZENSHIP_RULES_EFFECTIVE_DATE);
  const firstSittingDate = dateIsoDay(examDateModule.CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE);
  const testDeadlineDate = dateIsoDay(examDateModule.CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE);

  function rejectDate(message) {
    dateParity = false;
    fail(message);
  }

  function rejectCountdown(message) {
    countdownCopyParity = false;
    fail(message);
  }

  if (rulesDate !== EXPECTED_CITIZENSHIP_RULES_EFFECTIVE_DATE) {
    rejectDate(
      `citizenship rules effective date must be ${EXPECTED_CITIZENSHIP_RULES_EFFECTIVE_DATE}`,
    );
  }
  if (firstSittingDate !== EXPECTED_CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE) {
    rejectDate(
      `civic knowledge first sitting date must be ${EXPECTED_CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE}`,
    );
  }
  if (testDeadlineDate !== EXPECTED_CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE) {
    rejectDate(
      `civic knowledge test deadline must be ${EXPECTED_CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE}`,
    );
  }
  if (
    !(examDateModule.CITIZENSHIP_RULES_EFFECTIVE_DATE instanceof Date) ||
    !(examDateModule.CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE instanceof Date) ||
    !(examDateModule.CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE instanceof Date) ||
    examDateModule.CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE.getTime() <=
      examDateModule.CITIZENSHIP_RULES_EFFECTIVE_DATE.getTime() ||
    examDateModule.CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE.getTime() <=
      examDateModule.CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE.getTime()
  ) {
    rejectDate('civic knowledge test dates must stay after the citizenship rules date');
  }
  if (dateIsoDay(examDateModule.EXAM_REFORM_DATE) !== rulesDate) {
    rejectDate('EXAM_REFORM_DATE must remain an alias for the citizenship rules date');
  }

  let sourceUrlsValidated = 0;
  Object.entries(EXPECTED_CITIZENSHIP_TIMELINE_SOURCE_URLS).forEach(([key, expectedUrl]) => {
    const actualUrl = sourceUrls?.[key];
    if (actualUrl !== expectedUrl) {
      rejectDate(`citizenship timeline source URL ${key} must be ${expectedUrl}`);
      return;
    }
    if (!actualUrl.startsWith('https://')) {
      rejectDate(`citizenship timeline source URL ${key} must use HTTPS`);
      return;
    }
    sourceUrlsValidated += 1;
  });

  const countdownBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/ui/CountdownBanner.tsx'),
    'utf8',
  );

  [
    'CITIZENSHIP_RULES_EFFECTIVE_DATE',
    'CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE',
    'CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE',
    'getCitizenshipTimelineCountdown',
    'Nya medborgarskapsregler gäller från',
    'Samhällskunskapsprovet väntas starta i augusti 2026',
    'De nya medborgarskapsreglerna gäller nu sedan',
    'till första provet',
    'New citizenship rules apply from',
    'The civic-knowledge test is expected in August 2026',
    'The new citizenship rules now apply from',
    'until first test',
  ].forEach((requiredText) => {
    if (!countdownBannerSource.includes(requiredText)) {
      rejectCountdown(`CountdownBanner missing timeline copy or constant: ${requiredText}`);
    }
  });

  [
    /Det nya samhällskunskapstestet träder i kraft/,
    /The new civic knowledge test takes effect/,
    /until new exam/,
    /tills nya provet/,
  ].forEach((forbiddenPattern) => {
    if (forbiddenPattern.test(countdownBannerSource)) {
      rejectCountdown('CountdownBanner still says the civic knowledge test starts on 6 June');
    }
  });

  return {
    countdownCopyParity,
    dateParity,
    firstSittingDate,
    rulesDate,
    sourceUrlsValidated,
    testDeadlineDate,
  };
}

function validateCountdownBannerHomeMountParity() {
  let valid = true;
  let rulesValidated = 0;
  let homeRouteSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRouteSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  } catch (error) {
    reject(`home route countdown banner source could not be read: ${error.message}`);
    return { homeMountParity: false, rulesValidated };
  }

  [
    [
      "import { CountdownBanner } from '../../components/ui/CountdownBanner';",
      'Home route must import CountdownBanner for the currentness banner',
    ],
    [
      '<CountdownBanner language={language} />',
      'Home route must mount CountdownBanner with the selected language',
    ],
  ].forEach(([requiredSnippet, message]) => {
    if (!homeRouteSource.includes(requiredSnippet)) {
      reject(message);
      return;
    }
    rulesValidated += 1;
  });

  return {
    homeMountParity: valid && rulesValidated === 2,
    rulesValidated,
  };
}

function findQuestionAuthorityOverclaim(question) {
  const text = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ].join(' ');

  return QUESTION_AUTHORITY_OVERCLAIM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionStemSourceAuthorityReference(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return findSourceAuthorityStemPattern(text);
}

function findQuestionNestedMetaStem(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return QUESTION_NESTED_META_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionJudgementMetaStem(question) {
  const text = [question.questionSv, question.questionEn].join(' ');

  return QUESTION_JUDGEMENT_META_STEM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionGeneratedTrueFalseNaturalnessIssue(question) {
  if (question.type !== 'true_false') return null;

  return QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function findQuestionReferendumAdvisorySwedishNaturalnessIssue(question) {
  const text = [
    question.questionSv,
    question.explanationSv,
    ...(question.options || []).map((option) => option.textSv),
  ].join(' ');

  return QUESTION_REFERENDUM_ADVISORY_SWEDISH_NATURALNESS_PATTERNS.find((pattern) =>
    pattern.test(text),
  );
}

function findQuestionLuciaRoleEnglishNaturalnessIssue(question) {
  const text = [
    question.questionEn,
    question.explanationEn,
    ...(question.options || []).map((option) => option.textEn),
  ].join(' ');

  return QUESTION_LUCIA_ROLE_ENGLISH_NATURALNESS_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionEuCooperationEnglishNaturalnessIssue(question) {
  const text = [
    question.questionEn,
    question.explanationEn,
    ...(question.options || []).map((option) => option.textEn),
  ].join(' ');

  return QUESTION_EU_COOPERATION_ENGLISH_NATURALNESS_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionReligiousFreedomParallelismIssue(question) {
  const text = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ].join(' ');

  return QUESTION_RELIGIOUS_FREEDOM_PARALLELISM_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionUmeaDemonymSwedishNaturalnessIssue(question) {
  const text = [
    question.questionSv,
    question.explanationSv,
    ...(question.options || []).map((option) => option.textSv),
  ].join(' ');

  return QUESTION_UMEA_DEMONYM_SWEDISH_NATURALNESS_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionGoodFridayEnglishNaturalnessIssue(question) {
  const text = [
    question.questionEn,
    question.explanationEn,
    ...(question.options || []).map((option) => option.textEn),
  ].join(' ');

  return QUESTION_GOOD_FRIDAY_ENGLISH_NATURALNESS_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionWorkersDayHolidayEnglishNaturalnessIssue(question) {
  const text = [
    question.questionEn,
    question.explanationEn,
    ...(question.options || []).map((option) => option.textEn),
  ].join(' ');

  return QUESTION_WORKERS_DAY_HOLIDAY_ENGLISH_NATURALNESS_PATTERNS.find((pattern) =>
    pattern.test(text),
  );
}

function findQuestionTrueFalseStemPrefix(question) {
  if (question.type !== 'true_false') return null;

  return QUESTION_TRUE_FALSE_STEM_PREFIX_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function findAuthoredTrueFalseExplanationBoilerplate(question) {
  if (question.type !== 'true_false') return null;

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return AUTHORED_TRUE_FALSE_EXPLANATION_BOILERPLATE_PATTERNS.find((pattern) => pattern.test(text));
}

function findQuestionFalseAnswerExplanationMismatch(question) {
  if (
    question.type !== 'true_false' ||
    question.correctOptionId !== 'false' ||
    !question.tags?.includes('false-statement')
  ) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return [
    /Därför\s+stämmer\s+alternativet\s+Sant/i,
    /alternativet\s+Sant\s+stämmer/i,
    /\b(?:makes|make)\s+True\s+correct\b/i,
    /\bTrue\s+is\s+correct\b/i,
  ].find((pattern) => pattern.test(text));
}

function findGeneratedTrueFalseExplanationMetaIssue(question) {
  if (question.type !== 'true_false' || !question.tags?.includes('published-variant')) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].join(' ');
  return GENERATED_TRUE_FALSE_EXPLANATION_META_PATTERNS.find((pattern) => pattern.test(text));
}

function findGeneratedOptionSourceMaterialIssue(question) {
  if (!Array.isArray(question.options)) return null;

  for (const [index, option] of question.options.entries()) {
    const text = [option?.textSv, option?.textEn].filter(Boolean).join(' ');
    const pattern = GENERATED_OPTION_SOURCE_MATERIAL_PATTERNS.find((candidate) =>
      candidate.test(text),
    );
    if (pattern) return { index, pattern };
  }

  return null;
}

function findGeneratedSingleChoiceFillerOptionIssue(question) {
  if (question.type !== 'single_choice' || !Array.isArray(question.options)) return null;

  for (const [index, option] of question.options.entries()) {
    const texts = [option?.textSv, option?.textEn].map(normalizeOptionText);
    const matchedText = texts.find((text) => GENERATED_SINGLE_CHOICE_FILLER_OPTION_TEXTS.has(text));
    if (matchedText) return { index, text: matchedText };
  }

  return null;
}

function findGeneratedSingleChoiceMetaStemIssue(question) {
  if (question.type !== 'single_choice') return null;

  return GENERATED_SINGLE_CHOICE_META_STEM_PATTERNS.find(
    (pattern) => pattern.test(question.questionSv) || pattern.test(question.questionEn),
  );
}

function singleChoiceHasTrueFalseOptionLabels(question) {
  if (question.type !== 'single_choice' || !Array.isArray(question.options)) return false;

  const labels = new Set(
    question.options.flatMap((option) => [
      normalizeOptionText(option?.textSv),
      normalizeOptionText(option?.textEn),
    ]),
  );

  return labels.has('Sant') || labels.has('Falskt') || labels.has('True') || labels.has('False');
}

function findGeneratedSingleChoiceExplanationLabelIssue(question) {
  if (question.type !== 'single_choice' || singleChoiceHasTrueFalseOptionLabels(question)) {
    return null;
  }

  const text = [question.explanationSv, question.explanationEn].filter(Boolean).join(' ');
  return GENERATED_SINGLE_CHOICE_ABSENT_TRUE_FALSE_EXPLANATION_PATTERNS.find((pattern) =>
    pattern.test(text),
  );
}

function isSlugTag(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSnakeCaseId(value) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function findDuplicateOptionTextLabels(question) {
  if (!Array.isArray(question.options)) return [];

  const duplicates = [];
  for (const field of ['textSv', 'textEn']) {
    const labels = new Set();
    question.options.forEach((option) => {
      const label = normalizeOptionText(option?.[field]);
      if (!label) return;
      if (labels.has(label)) duplicates.push({ field, label });
      labels.add(label);
    });
  }
  return duplicates;
}

function optionCountMatchesQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  if (question.type === 'single_choice') return question.options.length === 4;
  if (question.type === 'true_false') return question.options.length === 2;
  return [2, 4].includes(question.options.length);
}

function arrayEquals(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectedGeneratedTags(sourceQuestion, convention) {
  return [
    ...new Set([...sourceQuestion.tags, 'published-variant', convention?.tag].filter(Boolean)),
  ];
}

function answerLabel(option) {
  return `${option.textSv}`.replace(/[.!?]\s*$/, '');
}
function answerTextEn(option) {
  return `${option.textEn}`.replace(/[.!?]\s*$/, '');
}
function stripFinalPunctuation(value) {
  return value.trim().replace(/[.!?]\s*$/, '');
}
function ensureSentence(value) {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
function lowerFirst(value) {
  if (/^EU\b/.test(value)) return value;
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}
function upperFirst(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}
function lowerLeadingEnglishArticle(value) {
  return value.replace(/^(The|In|A|An|At|On|Almost)\b/, (match) => match.toLowerCase());
}
function lowerLeadingSwedishCommonStart(value) {
  return value.replace(/^(Havet|Nästan|Ungefär|Ett|En|Man|När|Kungens)\b/, (match) =>
    match.toLowerCase(),
  );
}
function lowerLeadingSwedishClauseStart(value) {
  return value.replace(
    /^(Havet|Nästan|Ungefär|Ett|En|Den|Det|Man|När|År|Oppositionen|Politiker|All|Samarbetet)\b/,
    (match) => match.toLowerCase(),
  );
}
function lowerLeadingEnglishClauseStart(value) {
  return value.replace(/^(The|In|A|An|At|On|Almost|Politicians|All|It)\b/, (match) =>
    match.toLowerCase(),
  );
}
function stripLeadingMustSv(value) {
  return value.replace(/^man måste\s+/i, 'man ').replace(/^du måste\s+/i, 'du ');
}
function stripLeadingThatEn(value) {
  return value.replace(/^that\s+/i, '');
}
function requirementTargetEn(value) {
  return lowerFirst(value.trim()).replace(/^voting\b/i, 'vote');
}
function englishSubjectVerb(value, singular, plural) {
  return /,|\band\b/i.test(value) ? plural : singular;
}
function englishInfinitive(value) {
  const trimmed = lowerFirst(value.trim());
  return /^to\b/i.test(trimmed) ? trimmed : `to ${trimmed}`;
}
function englishAgePhrase(value) {
  return value.replace(/^(\d+)\s+years$/i, 'age $1');
}
function stripLeadingPurposeSv(value) {
  return value.replace(/^för att\s+/i, '').replace(/^att\s+/i, '');
}
function stripLeadingPurposeEn(value) {
  return value
    .replace(/^to\s+/i, '')
    .replace(/^because\s+/i, '')
    .replace(/^so\s+/i, '');
}
function stripLeadingByEn(value) {
  return stripLeadingPurposeEn(value).replace(/^by\s+/i, '');
}
function englishGerundPhrase(value) {
  const phrase = stripLeadingByEn(value).trim();
  const [first = '', ...rest] = phrase.split(/\s+/);
  if (!first) return phrase;
  const lower = first.toLowerCase();
  let gerund = `${lower}ing`;
  if (/ing$/i.test(lower)) gerund = lower;
  else if (/ie$/i.test(lower)) gerund = `${lower.slice(0, -2)}ying`;
  else if (/[^aeiou]e$/i.test(lower)) gerund = `${lower.slice(0, -1)}ing`;
  return [gerund, ...rest].join(' ');
}
function englishCivicActionClause(value) {
  return lowerFirst(stripLeadingPurposeEn(value).trim())
    .replace(/^many people voting\b/i, 'many people vote')
    .replace(/\bgetting involved\b/gi, 'get involved')
    .replace(/\blearning about\b/gi, 'learn about')
    .replace(/^fewer people taking\b/i, 'fewer people take')
    .replace(/^people avoiding\b/i, 'people avoid')
    .replace(/^only authorities being allowed\b/i, 'only authorities are allowed')
    .replace(/^people with (.+?) living closer\b/i, 'people with $1 live closer')
    .replace(/\band feeling included\b/i, 'and feel included')
    .replace(/^people living\b/i, 'people live')
    .replace(/^public services being available\b/i, 'public services are available')
    .replace(/^political engagement always decreasing\b/i, 'political engagement always decreases');
}
function swedishCommonToDoStatement(timePhrase, answer) {
  const activity = lowerFirst(stripLeadingPurposeSv(answer));
  if (
    /^(?:fira|äta|tända|öppna|hålla|bära|bjuda|välkomna|arrangera|samlas|dansa|sjunga)\b/i.test(
      activity,
    )
  ) {
    return `På ${timePhrase} är det vanligt att ${activity}`;
  }
  return `På ${timePhrase} är det vanligt med ${activity}`;
}
function englishCommonToDoStatement(timePhrase, answer) {
  const time = stripTrailingComma(timePhrase);
  const activity = lowerFirst(stripLeadingPurposeEn(answer));
  if (
    /^(?:celebrate|eat|light|open|hold|wear|serve|welcome|arrange|gather|dance|sing)\b/i.test(
      activity,
    )
  ) {
    return `On ${time}, it is common to ${activity}`;
  }
  return `On ${time}, ${activity} are common`;
}
function swedishHabitualPredicate(answer) {
  return lowerFirst(answer).replace(/\barrangerar\b/i, 'arrangera');
}
function englishCommonActivity(value) {
  return stripLeadingPurposeEn(value)
    .trim()
    .replace(/^Eating\b/i, 'eat')
    .replace(/^Lighting\b/i, 'light')
    .replace(/^Opening\b/i, 'open')
    .replace(/^Holding\b/i, 'hold')
    .replace(/\band opening\b/gi, 'and open')
    .replace(/\band children getting\b/gi, 'and for children to get');
}
function swedishCalledAnswer(answer) {
  const normalized = answer.trim();
  if (/^Luciatåg$/i.test(normalized)) return 'ett luciatåg';
  if (/^Valborgsbrasa$/i.test(normalized)) return 'en valborgsbrasa';
  if (/^Midsommarstång$/i.test(normalized)) return 'en midsommarstång';
  return answer;
}
function englishCalledAnswer(answer) {
  const normalized = answer.trim();
  if (/^(?:Lucia procession|Walpurgis bonfire|Midsummer pole)$/i.test(normalized)) {
    return `a ${normalized}`;
  }
  return lowerLeadingEnglishArticle(answer);
}
function swedishChildrenWithAdventCalendarStatement(answer) {
  const activity = lowerFirst(stripLeadingPurposeSv(answer));
  if (/^öppnar\b/i.test(activity)) {
    return `Barn med en adventskalender hemma ${activity}`;
  }
  return `Under advent ${activity.replace(/^(\S+)/, '$1 barn')}`;
}
function englishChildrenWithAdventCalendarStatement(answer) {
  const activity = lowerFirst(stripLeadingPurposeEn(answer));
  if (/^open\b/i.test(activity)) {
    return `Children with an Advent calendar at home often ${activity}`;
  }
  return `During Advent, children often ${activity}`;
}
function englishOccurrencePhrase(value) {
  const phrase = lowerLeadingEnglishArticle(value.trim());
  if (/^on\b/i.test(phrase)) return phrase;
  if (
    /^(?:(?:a|an|the)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|four Sundays)\b/i.test(
      phrase,
    )
  ) {
    return `on ${phrase}`;
  }
  return phrase;
}
function lowerEnglishNounPhrase(value) {
  const phrase = value.trim();
  if (/^(?:Buddhist|Hindu|Orthodox|Catholic|Protestant|Jewish|Muslim|Christian)\b/.test(phrase)) {
    return phrase;
  }
  if (/^(?:The|In|A|An|At|On|Almost)\b/.test(phrase)) return lowerLeadingEnglishArticle(phrase);
  return lowerFirst(phrase);
}
function swedishTraditionalCelebrationAnswer(answer) {
  if (/^Jesu födelse\b/.test(answer)) return answer;
  return lowerFirst(answer);
}
function englishTraditionalCelebrationAnswer(answer) {
  if (/^Jesus' birth\b/.test(answer)) return answer;
  return lowerFirst(answer);
}
function swedishContributionStatement(answer, target) {
  const built = answer.trim().match(/^Att\s+(.+?)\s+byggdes\s+(.+)$/i);
  if (built) return `Byggandet av ${built[1]} ${built[2]} bidrog till ${target}`;
  return `${answer} bidrog till ${target}`;
}
function englishContributionStatement(answer, target) {
  const built = answer.trim().match(/^That\s+(.+?)\s+were built\s+(.+)$/i);
  if (built) {
    return `The building of ${built[1]} ${built[2]} contributed to ${target}`;
  }
  const clause = answer.trim().match(/^That\s+(.+)$/i);
  if (clause) return `The fact that ${clause[1]} contributed to ${target}`;
  return `${answer} contributed to ${target}`;
}
function swedishMentionedExample(answer, category) {
  const built = answer.trim().match(/^Att\s+(.+?)\s+byggdes\s+(.+)$/i);
  if (built) return `Byggandet av ${built[1]} ${built[2]} nämns som exempel på ${category}`;
  return `${answer} nämns som exempel på ${category}`;
}
function englishMentionedExample(answer, category) {
  const built = answer.trim().match(/^That\s+(.+?)\s+were built\s+(.+)$/i);
  if (built) {
    return `The building of ${built[1]} ${built[2]} is mentioned as an example of ${category}`;
  }
  return `${answer} ${englishSubjectVerb(answer, 'is', 'are')} mentioned as ${englishSubjectVerb(
    answer,
    'an example',
    'examples',
  )} of ${category}`;
}
function swedishPurposeClause(value) {
  return `att ${lowerLeadingSwedishClauseStart(stripLeadingPurposeSv(value))}`;
}
function swedishProtectedReligionStatement(subject, answer) {
  const trimmed = answer.trim();
  const rightAndProtection = trimmed.match(/^Rätten att (.+?) och skydd mot (.+)$/i);
  if (rightAndProtection) {
    return `${upperFirst(subject)} skyddar rätten att ${lowerLeadingSwedishClauseStart(
      rightAndProtection[1],
    )} och ger skydd mot ${lowerFirst(rightAndProtection[2])}`;
  }
  const stateChoice = trimmed.match(/^Att staten väljer (.+)$/i);
  if (stateChoice) return `${upperFirst(subject)} låter staten välja ${lowerFirst(stateChoice[1])}`;
  return `${upperFirst(subject)} skyddar ${lowerFirst(answer)}`;
}
function englishProtectedReligionStatement(subject, answer) {
  const trimmed = answer.trim();
  const rightAndProtection = trimmed.match(/^The right to (.+?) and protection from (.+)$/i);
  if (rightAndProtection) {
    return `${upperFirst(subject)} protects the right to ${lowerFirst(
      rightAndProtection[1],
    )} and protects against ${lowerFirst(rightAndProtection[2])}`;
  }
  const stateChoice = trimmed.match(/^That the state chooses (.+)$/i);
  if (stateChoice)
    return `${upperFirst(subject)} lets the state choose ${lowerFirst(stateChoice[1])}`;
  return `${upperFirst(subject)} protects ${lowerFirst(answer)}`;
}
function swedishChristianHolidayStatement(subject, condition, answer) {
  return `${answer} är kristna högtider som ${lowerFirst(subject)} firar även om ${condition}`;
}
function englishChristianHolidayStatement(subject, condition, answer) {
  return `${answer} are Christian holidays that ${lowerFirst(subject)} celebrate even if ${condition}`;
}
function swedishGainedRightStatement(subject, answer, timePhrase) {
  const activity = stripLeadingPurposeSv(answer).replace(/\bi landet\b/i, 'i Sverige');
  if (/^bli Sveriges största religiösa grupp$/i.test(activity)) {
    return `${upperFirst(subject)} blev Sveriges största religiösa grupp på ${timePhrase}`;
  }
  return `${upperFirst(subject)} fick rätt att ${lowerFirst(activity)}`;
}
function englishGainedRightStatement(subject, answer, timePhrase) {
  const activity = stripLeadingPurposeEn(answer).replace(/\bin the country\b/i, 'in Sweden');
  if (/^become Sweden’s largest religious group$/i.test(activity)) {
    return `${upperFirst(subject)} became Sweden’s largest religious group in ${timePhrase}`;
  }
  return `${upperFirst(subject)} gained the right to ${lowerFirst(activity)}`;
}
function whyTargetStatementSv(target) {
  const cleaned = stripFinalPunctuation(target);

  let match = cleaned.match(
    /^(kan|ska|måste|bör|får)\s+(.+?)\s+(vara|bli|ha|göra|skapa|ersätta|ge|påverka|spridas|delta|rösta)\b(.*)$/i,
  );
  if (match) {
    return `${lowerLeadingSwedishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3].toLowerCase()}${match[4]}`;
  }

  match = cleaned.match(/^behövs\s+(.+?)\s+(när|för|i|på|av)\b(.*)$/i);
  if (match) {
    return `${lowerLeadingSwedishClauseStart(match[1])} behövs ${match[2]}${match[3]}`;
  }

  match = cleaned.match(/^(behövs|finns)\s+(.+)$/i);
  if (match) return `${lowerLeadingSwedishClauseStart(match[2])} ${match[1].toLowerCase()}`;

  return lowerLeadingSwedishClauseStart(cleaned);
}
function whyTargetStatementEn(target) {
  const cleaned = stripFinalPunctuation(target);

  let match = cleaned.match(
    /^(can|could|should|must|will|would|may|might)\s+(.+?)\s+(be|have|do|make|create|spread|replace|give|become|affect)\b(.*)$/i,
  );
  if (match) {
    return `${lowerLeadingEnglishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3].toLowerCase()}${match[4]}`;
  }

  match = cleaned.match(
    /^(is|are|was|were)\s+(.+)\s+((?:needed|required|important|allowed|permitted|called|responsible|common|legal|illegal|true|false)\b.*)$/i,
  );
  if (match) {
    return `${lowerLeadingEnglishClauseStart(match[2])} ${match[1].toLowerCase()} ${match[3]}`;
  }

  return lowerLeadingEnglishClauseStart(cleaned);
}
function swedishReasonClause(value) {
  return lowerFirst(value).replace(/\bsom publiceras är alltid\b/i, 'som publiceras alltid är');
}
function reasonAnswerClauseSv(answer) {
  const stripped = stripLeadingPurposeSv(answer);
  if (/^för att|^att\s+/i.test(answer.trim())) return `att ${swedishReasonClause(stripped)}`;
  if (
    /(^|[\s,])(?:hade|saknade|var|är|kan|ska|måste|gör|behöver|får|blir|har)(?=$|[\s,.?!])/i.test(
      stripped,
    )
  ) {
    return `att ${swedishReasonClause(stripped)}`;
  }
  return lowerFirst(stripped).replace(/\beU\b/g, 'EU');
}
function reasonAnswerClauseEn(answer) {
  const stripped = stripLeadingPurposeEn(answer);
  if (/^to\b/i.test(answer.trim())) return `to ${lowerFirst(stripped)}`;
  if (/\b(?:had|was|were|is|are|can|must|should|does|do|has|have|makes|gives)\b/i.test(stripped)) {
    return `that ${lowerFirst(stripped)}`;
  }
  return lowerFirst(stripped);
}
function reasonStatementSv(answer, target) {
  return `En anledning till att ${whyTargetStatementSv(target)} är ${reasonAnswerClauseSv(
    answer,
  )}`.replace(/\beU\b/g, 'EU');
}
function reasonStatementEn(answer, target) {
  return `One reason ${whyTargetStatementEn(target)} is ${reasonAnswerClauseEn(answer)}`;
}
function frontedManyActionSv(answer) {
  const words = lowerFirst(answer).split(/\s+/);
  if (words.length <= 1) return `gör många ${words[0] ?? ''}`.trim();
  return `${words[0]} många ${words.slice(1).join(' ')}`;
}
function manyPeopleActionEn(answer) {
  return `many people ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}
function stripTrailingComma(value) {
  return value.replace(/,\s*$/, '');
}
function embeddedSwedishClause(value) {
  return lowerFirst(stripLeadingPurposeSv(value))
    .replace(/^sverige\b/i, 'Sverige')
    .replace(/^det är alltid\s+/i, 'det alltid är ')
    .replace(/^domstolarna avgör bara\s+/i, 'domstolarna bara avgör ');
}
function embeddedEnglishClause(value) {
  return lowerLeadingEnglishClauseStart(stripLeadingPurposeEn(value));
}
function replaceLeadingSwedishSubject(subject, value) {
  if (/^äktenskap mellan personer av samma kön i Sverige$/i.test(subject.trim())) {
    if (/^Det är tillåtet att gifta sig med en person av samma kön$/i.test(value.trim())) {
      return 'Äktenskap mellan personer av samma kön är tillåtet i Sverige';
    }
    if (/^Det är förbjudet att gifta sig med en person av samma kön$/i.test(value.trim())) {
      return 'Äktenskap mellan personer av samma kön är förbjudet i Sverige';
    }
  }
  const normalizedSubject = upperFirst(subject.trim());
  return value
    .replace(/^De\s+/i, `${normalizedSubject} `)
    .replace(/^Den\s+/i, `${normalizedSubject} `)
    .replace(/^Det är\s+/i, `${normalizedSubject} är `);
}
function replaceLeadingEnglishSubject(subject, value) {
  const normalizedSubject = upperFirst(subject.trim());
  return value
    .replace(/^They are\s+/i, `${normalizedSubject} are `)
    .replace(/^They\s+/i, `${normalizedSubject} `)
    .replace(/^It can\s+/i, `${normalizedSubject} can `)
    .replace(/^It makes\s+/i, `${normalizedSubject} makes `)
    .replace(/^It is\s+/i, `${normalizedSubject} is `)
    .replace(/^It was\s+/i, `${normalizedSubject} was `)
    .replace(/^It says\s+/i, `${normalizedSubject} says `)
    .replace(/^It (gives|lets|applies)\b/i, `${normalizedSubject} $1`);
}
function describesStatementSv(subject, answer) {
  if (/^Som\s+/i.test(answer) && /Sverige för tvåhundra år sedan/i.test(subject)) {
    return `För tvåhundra år sedan var Sverige ${lowerFirst(answer.replace(/^Som\s+/i, ''))}`;
  }
  if (/^De ska\s+/i.test(answer) && /fria medier/i.test(subject)) {
    return `Fria medier i en demokrati ska ${lowerFirst(answer.replace(/^De ska\s+/i, ''))}`;
  }
  if (/^Att\s+/i.test(answer)) {
    return `${upperFirst(subject)} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}
function describesStatementEn(subject, answer) {
  if (/^As\s+/i.test(answer) && /Sweden two hundred years ago/i.test(subject)) {
    return `Two hundred years ago, Sweden was ${lowerFirst(answer.replace(/^As\s+/i, ''))}`;
  }
  if (/^They should\s+/i.test(answer) && /free media/i.test(subject)) {
    return `Free media in a democracy should ${lowerFirst(answer.replace(/^They should\s+/i, ''))}`;
  }
  if (
    /^(?:People|Public services|Political engagement)\b/i.test(answer) &&
    /^integration\b/i.test(subject)
  ) {
    return `${upperFirst(subject)} means ${englishCivicActionClause(answer)}`;
  }
  if (/^To\s+/i.test(answer)) {
    return `${upperFirst(subject)} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function importantRolesStatementSv(subject, context, answer) {
  if (/^Att\s+/i.test(answer)) {
    return `I ${context} har ${lowerFirst(subject)} viktiga uppgifter: att ${lowerLeadingSwedishClauseStart(
      stripLeadingPurposeSv(answer),
    )}`;
  }
  if (/^De ska\s+/i.test(answer)) {
    return `I ${context} ska ${lowerFirst(subject)} ${lowerFirst(answer.replace(/^De ska\s+/i, ''))}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}
function importantRolesStatementEn(subject, context, answer) {
  if (/^To inform, enable public debate, and scrutinize people with power$/i.test(answer)) {
    return `In ${context}, ${lowerFirst(
      subject,
    )} play important roles: informing, enabling public debate, and scrutinizing people with power`;
  }
  if (/^To\s+/i.test(answer)) {
    return `In ${context}, ${lowerFirst(subject)} play an important role: ${englishGerundPhrase(
      answer,
    )}`;
  }
  if (/^They should\s+/i.test(answer)) {
    return `In ${context}, ${lowerFirst(subject)} should ${lowerFirst(
      answer.replace(/^They should\s+/i, ''),
    )}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function commonStatementSv(subject, answer) {
  if (/^Gemensamma\s+/i.test(answer)) {
    return `${upperFirst(subject)} har ${lowerFirst(answer)}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}
function commonStatementEn(subject, answer) {
  if (/^Shared\s+/i.test(answer)) {
    return `${upperFirst(subject)} have ${lowerFirst(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function meaningStatementSv(subject, answer) {
  const subjectStatement = replaceLeadingSwedishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} innebär att ${embeddedSwedishClause(answer)}`;
}
function meaningStatementEn(subject, answer) {
  const subjectStatement = replaceLeadingEnglishSubject(subject, answer);
  if (subjectStatement !== answer) return subjectStatement;
  return `${upperFirst(subject)} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
}
function appliesStatementEn(subject, answer) {
  if (/^They are\s+/i.test(answer)) {
    return replaceLeadingEnglishSubject(subject, answer);
  }
  return answer;
}
function decisionStatementSv(subject, context, answer) {
  const normalizedAnswer = lowerFirst(stripLeadingPurposeSv(answer));
  const yearContext = context.match(/^(.+?)\s+(\d{4})$/);
  if (yearContext) {
    return `År ${yearContext[2]} beslutade ${upperFirst(subject)} som ${yearContext[1]} att ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} beslutade som ${context} att ${normalizedAnswer}`;
}
function decisionStatementEn(subject, context, answer) {
  const normalizedAnswer = lowerFirst(stripLeadingThatEn(answer));
  const yearContext = context.match(/^(.+?)\s+in\s+(\d{4})$/i);
  if (yearContext) {
    return `In ${yearContext[2]}, ${upperFirst(subject)} was ${yearContext[1]} to decide that ${normalizedAnswer}`;
  }
  return `${upperFirst(subject)} decided as ${context} that ${normalizedAnswer}`;
}
function supportStatementSv(subject, answer) {
  if (/^En\s+/i.test(answer)) return `${upperFirst(subject)} är ${lowerFirst(answer)}`;
  return replaceLeadingSwedishSubject(subject, answer);
}
function supportStatementEn(subject, answer) {
  if (/^(?:A|An)\s+/i.test(answer)) {
    return `${upperFirst(subject)} is ${lowerLeadingEnglishArticle(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}
function conditionalPartyOutcomeSv(context, condition, answer) {
  const partyCondition = condition.match(/^ett parti får (.+)$/i);
  const partyOutcome = answer.trim().match(/^partiet får (.+)$/i);
  if (partyCondition && partyOutcome) {
    return `I ${context} får ett parti som får ${partyCondition[1]} ${lowerFirst(partyOutcome[1])}`;
  }

  const outcome = lowerFirst(answer).replace(/^partiet får\s+/i, 'partiet ');
  return `I ${context} får ${outcome} om ${condition}`;
}
function conditionalPartyOutcomeEn(context, condition, answer) {
  const partyCondition = condition.match(/^a party receives (.+)$/i);
  const partyOutcome = answer.trim().match(/^the party receives (.+)$/i);
  if (partyCondition && partyOutcome) {
    return `In ${context}, a party that receives ${partyCondition[1]} receives ${lowerFirst(
      partyOutcome[1],
    )}`;
  }

  return `In ${context}, ${lowerFirst(answer)} if ${condition}`;
}

function commercialMediaIncomeStatementSv(subject, answer) {
  if (/^De\s+säljer\b/i.test(answer)) {
    const method = answer
      .replace(/^De\s+/i, '')
      .replace(/^säljer\b/i, 'sälja')
      .replace(/\btar\s+betalt\b/i, 'ta betalt');
    return `${upperFirst(subject)} kan få inkomster genom att ${lowerFirst(method)}`;
  }
  if (/^Genom\b/i.test(answer)) {
    return `${upperFirst(subject)} kan få inkomster ${lowerFirst(answer)}`;
  }
  return replaceLeadingSwedishSubject(subject, answer);
}

function commercialMediaIncomeStatementEn(subject, answer) {
  if (/^They\s+sell\b/i.test(answer)) {
    const method = answer
      .replace(/^They\s+/i, '')
      .replace(/^sell\b/i, 'selling')
      .replace(/\bcharge\b/i, 'charging');
    return `${upperFirst(subject)} can earn income by ${lowerFirst(method)}`;
  }
  if (/^(?:Through|By)\b/i.test(answer)) {
    return `${upperFirst(subject)} can earn income ${lowerFirst(answer)}`;
  }
  return replaceLeadingEnglishSubject(subject, answer);
}

function webSocialMediaStatementSv(answer) {
  if (/^Vem som helst kan skapa innehåll där\b/i.test(answer)) {
    return answer.replace(
      /^Vem som helst kan skapa innehåll där/i,
      'På webben och i sociala medier kan vem som helst skapa innehåll',
    );
  }
  if (/^Bara ansvariga utgivare får skriva inlägg där$/i.test(answer)) {
    return 'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg';
  }
  if (/^Allt innehåll godkänns först av staten$/i.test(answer)) {
    return 'På webben och i sociala medier godkänns allt innehåll först av staten';
  }
  if (/^Innehållet är alltid mer pålitligt än nyheter i tidningar$/i.test(answer)) {
    return 'Innehåll på webben och i sociala medier är alltid mer pålitligt än nyheter i tidningar';
  }
  return answer;
}

function webSocialMediaStatementEn(answer) {
  if (/^Anyone can create content there\b/i.test(answer)) {
    return answer.replace(
      /^Anyone can create content there/i,
      'On the web and in social media, anyone can create content',
    );
  }
  if (/^Only responsible publishers may write posts there$/i.test(answer)) {
    return 'On the web and in social media, only responsible publishers may write posts';
  }
  if (/^All content is first approved by the state$/i.test(answer)) {
    return 'On the web and in social media, all content is first approved by the state';
  }
  if (/^The content is always more reliable than news in newspapers$/i.test(answer)) {
    return 'Content on the web and in social media is always more reliable than news in newspapers';
  }
  return answer;
}

function stripTrueFalsePromptSv(value) {
  return stripFinalPunctuation(value.replace(/^Sant eller falskt:\s*/i, ''));
}
function stripTrueFalsePromptEn(value) {
  return stripFinalPunctuation(value.replace(/^True or false:\s*/i, ''));
}
function firstSentence(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return stripFinalPunctuation(match?.[1] ?? trimmed);
}
function normalizeStatementForComparison(value) {
  return stripFinalPunctuation(value).replace(/\s+/g, ' ').trim().toLowerCase();
}
function isTrueFalseSource(source) {
  return source.type === 'true_false' && source.options.length === 2;
}
function truthStatementSv(statement) {
  return upperFirst(statement);
}
function truthStatementEn(statement) {
  return upperFirst(statement);
}
function sourceDirectStatementSv(source, statement, sourceStatementIsTrue) {
  if (sourceStatementIsTrue) {
    const fromExplanation = firstSentence(
      source.explanationSv.replace(/^Påståendet är sant[:.]?\s*/i, ''),
    );
    if (
      fromExplanation &&
      normalizeStatementForComparison(fromExplanation) !==
        normalizeStatementForComparison(statement)
    ) {
      return upperFirst(fromExplanation);
    }
  }
  return truthStatementSv(statement);
}
function sourceDirectStatementEn(source, statement, sourceStatementIsTrue) {
  if (sourceStatementIsTrue) {
    const fromExplanation = firstSentence(
      source.explanationEn.replace(/^The statement is true[:.]?\s*/i, ''),
    );
    if (
      fromExplanation &&
      normalizeStatementForComparison(fromExplanation) !==
        normalizeStatementForComparison(statement)
    ) {
      return upperFirst(fromExplanation);
    }
  }
  return truthStatementEn(statement);
}
function sourceOppositeStatementSv(statement) {
  const replacements = [
    [/\bmåste\b/i, 'behöver inte'],
    [/\bska\b/i, 'ska inte'],
    [/\bhar rätt att\b/i, 'har inte rätt att'],
    [/\bbrukar\b/i, 'brukar inte'],
    [/\bblev\b/i, 'blev inte'],
    [/\bomfattar\b/i, 'omfattar inte'],
    [/\bbidrar till\b/i, 'bidrar inte till'],
    [/\bligger\b/i, 'ligger inte'],
    [/\bväljer\b/i, 'väljer inte'],
    [/\bär\b/i, 'är inte'],
    [/\bhar\b/i, 'har inte'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return `Det stämmer inte att ${lowerLeadingSwedishClauseStart(statement)}`;
}
function sourceOppositeStatementEn(statement) {
  const replacements = [
    [/\bmust\b/i, 'do not have to'],
    [/\bshould\b/i, 'should not'],
    [/\bhas the right to\b/i, 'does not have the right to'],
    [/\bis usually divided\b/i, 'is not usually divided'],
    [/\bbecame\b/i, 'did not become'],
    [/\bincludes\b/i, 'does not include'],
    [/\bhelps make\b/i, 'does not help make'],
    [/\bhelp make\b/i, 'do not help make'],
    [/\blies\b/i, 'does not lie'],
    [/\bchooses\b/i, 'does not choose'],
    [/\bare\b/i, 'are not'],
    [/\bis\b/i, 'is not'],
    [/\bhas\b/i, 'does not have'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return `It is not true that ${lowerLeadingEnglishClauseStart(statement)}`;
}
function sourceFalseRestatementSv(statement) {
  const replacements = [
    [/\bmåste\b/i, 'är skyldiga att'],
    [/\bska\b/i, 'är skyldiga att'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return truthStatementSv(statement);
}
function sourceFalseRestatementEn(statement) {
  const replacements = [
    [/\bmust\b/i, 'are required to'],
    [/\bshould\b/i, 'are required to'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(statement)) return upperFirst(statement.replace(pattern, replacement));
  }
  return truthStatementEn(statement);
}
function trueFalseSourceStatementSv(source, variantIsTrue) {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptSv(source.questionSv);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementSv(statement);
    return sourceDirectStatementSv(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementSv(statement);
}
function trueFalseSourceStatementEn(source, variantIsTrue) {
  const sourceStatementIsTrue = source.correctOptionId === 'true';
  const assertionIsTrue = variantIsTrue === sourceStatementIsTrue;
  const statement = stripTrueFalsePromptEn(source.questionEn);
  if (assertionIsTrue) {
    if (!sourceStatementIsTrue) return sourceFalseRestatementEn(statement);
    return sourceDirectStatementEn(source, statement, sourceStatementIsTrue);
  }
  return sourceOppositeStatementEn(statement);
}
function sourceTrueFactSv(source) {
  return ensureSentence(truthStatementSv(stripTrueFalsePromptSv(source.questionSv)));
}
function sourceTrueFactEn(source) {
  return ensureSentence(truthStatementEn(stripTrueFalsePromptEn(source.questionEn)));
}
function cleanTrueFalseSourceExplanationSv(source) {
  return ensureSentence(
    upperFirst(
      source.explanationSv
        .replace(/^Påståendet är sant[:.]?\s*/i, '')
        .replace(
          /\s*Därför\s+stämmer\s+alternativet\s+Sant,\s+medan\s+Falskt\s+motsäger\s+uppgiften\.?$/i,
          '',
        )
        .replace(
          /\s*Den norra delen av landet sträcker sig alltså in i området norr om polcirkeln\.?$/i,
          '',
        )
        .replace(
          /\s*[;,]?\s*(?:så\s+påståendet\s+är\s+sant|därför\s+(?:är\s+)?påståendet\s+sant)\.?$/i,
          '',
        )
        .trim(),
    ),
  );
}
function cleanTrueFalseSourceExplanationEn(source) {
  return ensureSentence(
    upperFirst(
      source.explanationEn
        .replace(/^The statement is true[:.]?\s*/i, '')
        .replace(
          /\s*That\s+makes\s+True\s+correct,\s+while\s+False\s+contradicts\s+the\s+fact\.?$/i,
          '',
        )
        .replace(
          /\s*The northern part of the country therefore extends into the area north of the Arctic Circle\.?$/i,
          '',
        )
        .replace(/\s*,?\s*so\s+the\s+statement\s+is\s+true\.?$/i, '')
        .replace(/\s*[;,]?\s*that\s+makes\s+the\s+statement\s+true\.?$/i, '')
        .trim(),
    ),
  );
}
function trueStatementExplanationSv(source) {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationSv(source);
    return ensureSentence(trueFalseSourceStatementSv(source, true));
  }

  return source.explanationSv;
}
function trueStatementExplanationEn(source) {
  if (isTrueFalseSource(source)) {
    if (source.correctOptionId === 'true') return cleanTrueFalseSourceExplanationEn(source);
    return ensureSentence(trueFalseSourceStatementEn(source, true));
  }

  return source.explanationEn;
}
function falseStatementExplanationSv(source) {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactSv(source));
  }

  return source.explanationSv;
}
function falseStatementExplanationEn(source) {
  if (isTrueFalseSource(source) && source.correctOptionId === 'true') {
    return ensureSentence(sourceTrueFactEn(source));
  }

  return source.explanationEn;
}

function trueFalseSingleChoiceExplanationSv(source) {
  return trueStatementExplanationSv(source);
}

function trueFalseSingleChoiceExplanationEn(source) {
  return trueStatementExplanationEn(source);
}

function statementTopicSv(source) {
  const statement = stripFinalPunctuation(stripTrueFalsePromptSv(source.questionSv));

  if (/^År 2000 blev Svenska kyrkan\b/i.test(statement)) {
    return 'Svenska kyrkan och staten år 2000';
  }

  const match = statement.match(
    /^(.+?)\s+(?:ligger|bidrar|väljer|ska|måste|har rätt|omfattar|blev|brukar|är)\b/i,
  );
  return match
    ? match[1]
        .replace(/^Den\b/, 'den')
        .replace(/^Det\b/, 'det')
        .replace(/^Oppositionen\b/, 'oppositionen')
        .replace(/^Politiker\b/, 'politiker')
        .replace(/^Public service-företag\b/, 'public service-företag')
    : source.uhrReference.section;
}

function statementTopicEn(source) {
  const statement = stripFinalPunctuation(stripTrueFalsePromptEn(source.questionEn));

  if (/^In 2000, the Church of Sweden became\b/i.test(statement)) {
    return 'the Church of Sweden and the state in 2000';
  }

  const match = statement.match(
    /^(.+?)\s+(?:lies|help make|helps make|chooses|should|must|has the right|includes|became|is usually divided|is)\b/i,
  );
  if (!match) return source.uhrReference.section;
  return lowerLeadingEnglishArticle(match[1])
    .replace(/^Politicians\b/, 'politicians')
    .replace(/^Public service companies\b/, 'public service companies');
}

function trueFalseStatementOptions(source) {
  return [
    {
      id: 'true-statement',
      textSv: ensureSentence(trueFalseSourceStatementSv(source, true)),
      textEn: ensureSentence(trueFalseSourceStatementEn(source, true)),
    },
    {
      id: 'false-statement',
      textSv: ensureSentence(trueFalseSourceStatementSv(source, false)),
      textEn: ensureSentence(trueFalseSourceStatementEn(source, false)),
    },
    {
      id: 'both-statements',
      textSv: 'Båda påståendena är korrekta',
      textEn: 'Both statements are correct',
    },
    {
      id: 'neither-statement',
      textSv: 'Inget av påståendena är korrekt',
      textEn: 'Neither statement is correct',
    },
  ];
}

function generatedTrueFalseStatementSv(source, option, variantIsTrue) {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementSv(source, variantIsTrue);
  return truthStatementSv(civicStatementSv(source, option));
}
function generatedTrueFalseStatementEn(source, option, variantIsTrue) {
  if (isTrueFalseSource(source)) return trueFalseSourceStatementEn(source, variantIsTrue);
  return truthStatementEn(civicStatementEn(source, option));
}
function judgementPromptSv(source) {
  if (isTrueFalseSource(source)) {
    return `Vilken uppgift stämmer om ${statementTopicSv(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceSv(source, 'judgement');
  if (prompt) return prompt;
  return `Välj rätt alternativ: ${source.questionSv}`;
}
function judgementPromptEn(source) {
  if (isTrueFalseSource(source)) {
    return `Which fact is correct about ${statementTopicEn(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceEn(source, 'judgement');
  if (prompt) return prompt;
  return `Choose the correct option: ${source.questionEn}`;
}
function singleChoicePromptSv(source) {
  if (isTrueFalseSource(source)) {
    return `Vad gäller för ${statementTopicSv(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceSv(source, 'section-practice');
  if (prompt) return prompt;
  return `Vilket svar stämmer bäst? ${source.questionSv}`;
}
function singleChoicePromptEn(source) {
  if (isTrueFalseSource(source)) {
    return `What is correct about ${statementTopicEn(source)}?`;
  }
  const prompt = generatedSingleChoicePromptFromSourceEn(source, 'section-practice');
  if (prompt) return prompt;
  return `Which answer best matches? ${source.questionEn}`;
}
function generatedSingleChoicePromptFromSourceSv(source, variant) {
  const q = stripFinalPunctuation(source.questionSv);
  const match =
    q.match(/^Vilket påstående stämmer om (.+)$/i) ??
    q.match(/^Vilket påstående är korrekt om (.+)$/i) ??
    q.match(/^Vilket påstående om (.+?) stämmer$/i);
  if (!match) return null;
  return variant === 'judgement'
    ? `Vilken uppgift stämmer om ${match[1]}?`
    : `Vad gäller för ${match[1]}?`;
}
function generatedSingleChoicePromptFromSourceEn(source, variant) {
  const q = stripFinalPunctuation(source.questionEn);
  const match =
    q.match(/^Which statement is correct about (.+)$/i) ??
    q.match(/^Which statement about (.+?) is correct$/i) ??
    q.match(/^Which statement best matches (.+)$/i);
  if (!match) return null;
  return variant === 'judgement'
    ? `Which fact is correct about ${match[1]}?`
    : `What is correct about ${match[1]}?`;
}

function referendumAdvisoryStatementSv(subject, answer) {
  if (/^politikerna?\s+(?:måste|behöver)\s+inte\s+följa\s+resultatet$/i.test(answer)) {
    return `Att ${subject} betyder att politikerna inte behöver följa resultatet`;
  }
  if (/^politikerna?\s+måste\s+alltid\s+följa\s+resultatet$/i.test(answer)) {
    return `Att ${subject} betyder att politikerna alltid måste följa resultatet`;
  }
  return null;
}

function democracyRightStatementSv(subject, answer, isCorrect) {
  const action = lowerFirst(stripLeadingPurposeSv(answer));
  return isCorrect
    ? `I en demokrati har ${subject} rätt att ${action}`
    : `I en demokrati har ${subject} inte rätt att ${action}`;
}

function democracyRightStatementEn(subject, answer, isCorrect) {
  const action = lowerFirst(stripLeadingPurposeEn(answer));
  return isCorrect
    ? `In a democracy, ${subject} may ${action}`
    : `In a democracy, ${subject} may not ${action}`;
}

function civicStatementSv(source, option) {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementSv(source, option.id === source.correctOptionId);
  }
  const answer = stripFinalPunctuation(answerLabel(option));
  const q = stripFinalPunctuation(source.questionSv);
  let match = q.match(/^Var ligger (.+)$/i);
  if (match) return `${upperFirst(match[1])} ligger ${lowerFirst(answer)}`;
  match = q.match(/^Ungefär hur långt sträcker sig (.+?) (från .+)$/i);
  if (match) return `${upperFirst(match[1])} sträcker sig ${lowerFirst(answer)} ${match[2]}`;
  match = q.match(/^Vad heter (.+)$/i);
  if (match) return `${upperFirst(match[1])} heter ${answer}`;
  match = q.match(/^Vilka öar är Sveriges två största$/i);
  if (match) return `Sveriges två största öar är ${answer}`;
  match = q.match(/^Vilka är Sveriges fem nationella minoriteter$/i);
  if (match) return `Sveriges fem nationella minoriteter är ${lowerFirst(answer)}`;
  match = q.match(/^Vilka är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${answer}`;
  match = q.match(/^Vilka tre företag kallas (.+) i Sverige$/i);
  if (match) return `${answer} kallas ${match[1]} i Sverige`;
  match = q.match(/^Ungefär hur många (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;
  match = q.match(/^Vilka (.+?) är viktiga i Sverige$/i);
  if (match) return `${upperFirst(answer)} är viktiga ${match[1]} i Sverige`;
  match = q.match(/^Vad betyder (?!det att\b)(.+)$/i);
  if (match) return `${upperFirst(match[1])} betyder ${lowerFirst(answer)}`;
  match = q.match(/^Vilket av följande ingår i (.+)$/i);
  if (match) return `Ett inslag i ${match[1]} är att ${lowerFirst(answer)}`;
  match = q.match(/^Vilket är ett sätt att (.+)$/i);
  if (match) return `Ett sätt att ${match[1]} är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Vilken rätt har (.+?) i en demokrati$/i);
  if (match) {
    return democracyRightStatementSv(match[1], answer, option.id === source.correctOptionId);
  }
  match = q.match(/^Vad kallas det när (.+)$/i);
  if (match) return `När ${match[1]} kallas det ${lowerFirst(answer)}`;
  match = q.match(/^Hur kan (.+?) påverka (.+)$/i);
  if (match) return `${upperFirst(answer)} när ${match[1]} påverkar ${match[2]}`;
  match = q.match(/^Hur kan (.+?) få inkomster$/i);
  if (match) return commercialMediaIncomeStatementSv(match[1], answer);
  match = q.match(/^Hur underlättar (.+?) (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} underlättar ${match[2]} genom att ${lowerFirst(answer.replace(/^Genom att\s+/i, ''))}`;
  match = q.match(/^Hur väljer (.+?) (.+)$/i);
  if (match) {
    if (/^Genom att\s+/i.test(answer)) {
      return `${upperFirst(match[1])} väljer ${match[2]} ${lowerFirst(answer)}`;
    }
    return upperFirst(answer);
  }
  match = q.match(/^Hur många (.+?) har (.+)$/i);
  if (match) return `${upperFirst(match[2])} har ${lowerFirst(answer)} ${match[1]}`;
  match = q.match(/^Vem väljer (.+)$/i);
  if (match) return `${upperFirst(match[1])} väljs av ${lowerFirst(answer)}`;
  match = q.match(/^Hur gammal måste man ha fyllt för att (.+)$/i);
  if (match) return `Man måste ha fyllt ${lowerFirst(answer)} för att ${match[1]}`;
  match = q.match(/^Från vilken ålder är (.+)$/i);
  if (match) return `Från ${lowerFirst(answer)} är ${match[1]}`;
  match = q.match(/^Vad betyder det att (.+)$/i);
  if (match) {
    const referendumStatement = referendumAdvisoryStatementSv(match[1], answer);
    if (referendumStatement) return referendumStatement;
    return `Att ${match[1]} betyder att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  }
  match = q.match(/^Vad kan göra (.+?) (starkare)$/i);
  if (match) {
    return `${upperFirst(match[1])} blir ${match[2]} när ${lowerFirst(
      stripLeadingPurposeSv(answer),
    )}`;
  }
  match = q.match(/^Vilka tre nivåer delar (.+)$/i);
  if (match) return `${upperFirst(answer)} delar ${match[1]}`;
  match = q.match(/^Vilken av följande uppgifter har (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} har uppgiften att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Vilken uppgift har (.+)$/i);
  if (match) return `${upperFirst(match[1])} har uppgiften ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vad är en uppgift för (.+)$/i);
  if (match) return `En uppgift för ${match[1]} är ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vilket påstående beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);
  match = q.match(/^Vad kännetecknar (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Hur publiceras många tidningar i dag$/i);
  if (match) return replaceLeadingSwedishSubject('många tidningar', answer);
  match = q.match(/^Vad är viktigt att komma ihåg om webben och sociala medier$/i);
  if (match) return webSocialMediaStatementSv(answer);
  match = q.match(/^Vilket påstående stämmer om (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vilket påstående om (.+?) är korrekt$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vilken är (.+)$/i);
  if (match) return `${upperFirst(match[1])} är ${lowerFirst(answer)}`;
  match = q.match(/^Vilket exempel beskriver (.+)$/i);
  if (match && /^kontakter med\b/i.test(match[1])) {
    return swedishContributionStatement(answer, match[1]);
  }
  if (match) return `${upperFirst(answer)} är exempel på ${match[1]}`;
  match = q.match(/^Hur ofta hålls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hålls ${lowerFirst(answer)}`;
  match = q.match(/^Vilka krav gäller för (.+)$/i);
  if (match) return `För ${match[1]} måste ${lowerFirst(stripLeadingMustSv(answer))}`;
  match = q.match(/^Varför röstar väljare bakom en skärm i vallokalen$/i);
  if (match)
    return `En anledning till att väljare röstar bakom en skärm i vallokalen är att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför bildades Förenta nationerna efter andra världskriget$/i);
  if (match)
    return `Förenta nationerna bildades efter andra världskriget för att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför finns lagar på arbetsmarknaden i Sverige$/i);
  if (match)
    return `Lagar på arbetsmarknaden i Sverige finns för att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Varför ökade Sveriges befolkning under 1800-talet$/i);
  if (match) return `Sveriges befolkning ökade under 1800-talet på grund av ${lowerFirst(answer)}`;
  match = q.match(/^Varför kallas (.+?) ofta (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} kallas ofta ${match[2]} eftersom ${embeddedSwedishClause(answer)}`;
  match = q.match(/^Varför (.+)$/i);
  if (match) return reasonStatementSv(answer, match[1]);
  match = q.match(/^Vad har (.+?) gemensamt$/i);
  if (match) return commonStatementSv(match[1], answer);
  match = q.match(/^Vad händer i (.+?) om (.+)$/i);
  if (match) return conditionalPartyOutcomeSv(match[1], match[2], answer);
  match = q.match(/^Vilken lista innehåller (.+)$/i);
  if (match) return `Listan med ${lowerFirst(answer)} innehåller ${match[1]}`;
  match = q.match(/^Vad säger (.+?) om (.+)$/i);
  if (match) return `${upperFirst(match[1])} säger att ${lowerLeadingSwedishClauseStart(answer)}`;
  match = q.match(/^Vad reglerar (.+)$/i);
  if (match) return `${upperFirst(match[1])} reglerar ${lowerFirst(answer)}`;
  match = q.match(/^Vad innebär (.+)$/i);
  if (match) return meaningStatementSv(match[1], answer);
  match = q.match(/^Vad menas med (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige är ${lowerFirst(answer)}`;
  match = q.match(/^Vilka myndigheter ingår i (.+)$/i);
  if (match) return `${upperFirst(answer)} ingår i ${match[1]}`;
  match = q.match(/^Vad gäller för (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Hur stor del av (.+?) (jobbar .+)$/i);
  if (match) return `${upperFirst(answer)} av ${match[1]} ${match[2]}`;
  match = q.match(/^Hur bestäms (.+) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige bestäms ${lowerFirst(answer)}`;
  match = q.match(/^Vilket stöd kan (.+?) ge (.+)$/i);
  if (match) return supportStatementSv(match[1], answer);
  match = q.match(/^Hur hjälper (.+?) till med (.+)$/i);
  if (match) {
    if (/^Att\s+/i.test(answer)) {
      return `${upperFirst(match[1])} hjälper till med ${match[2]} genom att ${lowerFirst(stripLeadingPurposeSv(answer))}`;
    }
    return replaceLeadingSwedishSubject(match[1], answer);
  }
  match = q.match(/^Vad gör (.+?) på arbetsmarknaden$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vilken roll har (.+?) i (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vad finansierar staten inom (.+)$/i);
  if (match) return `Staten finansierar ${lowerFirst(answer)}`;
  match = q.match(/^Vad ingår i (.+)$/i);
  if (match) return `${upperFirst(match[1])} omfattar ${lowerFirst(answer)}`;
  match = q.match(/^Vilket ansvar har (.+?) för (.+)$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vilken hjälp kan (.+?) få av (.+?) för att (.+)$/i);
  if (match)
    return `${upperFirst(match[2])} kan erbjuda ${lowerFirst(match[1])} ${lowerFirst(
      answer,
    )} för att ${match[3]}`;
  match = q.match(/^Vilket ansvar har (.+?) inom (.+)$/i);
  if (match) return `${upperFirst(match[1])} ansvarar för ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vilka viktiga uppgifter har (.+?) i (.+)$/i);
  if (match) return importantRolesStatementSv(match[1], match[2], answer);
  match = q.match(/^Vilket svar ger exempel på (.+)$/i);
  if (match) return `${upperFirst(answer)} är exempel på ${match[1]}`;
  match = q.match(/^Vad förändrades genom (.+)$/i);
  if (match)
    return `Förändringen genom ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;
  match = q.match(/^Vilken händelse från (.+?) nämns som (.+)$/i);
  if (match) return `Händelsen från ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;
  match = q.match(/^Vilken händelse från (.+?) kopplas till (.+)$/i);
  if (match) return `Händelsen från ${match[1]} var att ${lowerLeadingSwedishCommonStart(answer)}`;
  match = q.match(/^När firas (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} firas ${lowerFirst(answer)}`;
  match = q.match(/^När firas (.+)$/i);
  if (match) return `${upperFirst(match[1])} firas ${lowerFirst(answer)}`;
  match = q.match(/^Vilken högtid firas (.+?) och hör ihop med (.+)$/i);
  if (match) return `${answer} firas ${match[1]} och hör ihop med ${match[2]}`;
  match = q.match(/^Vilket svar beskriver (.+)$/i);
  if (match) return describesStatementSv(match[1], answer);
  match = q.match(/^Vad beslutade (.+?) som (.+)$/i);
  if (match) return decisionStatementSv(match[1], match[2], answer);
  match = q.match(/^Vilket år hölls (.+)$/i);
  if (match) return `${upperFirst(match[1])} hölls ${answer}`;
  match = q.match(/^Vad blev (.+?) viktigt för$/i);
  if (match)
    return `${upperFirst(match[1])} blev viktigt för ${lowerLeadingSwedishClauseStart(answer)}`;
  match = q.match(/^Vad var (.+?) mål under (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} mål under ${match[2]} var ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vad har (.+?) förändrat$/i);
  if (match) {
    if (/^Bara\s+hur\b/i.test(answer)) {
      return `${upperFirst(match[1])} har bara förändrat ${lowerFirst(answer.replace(/^Bara\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} har förändrat ${lowerFirst(answer)}`;
  }
  match = q.match(/^Genom vilka två organ sker (.+?) främst$/i);
  if (match) return `${upperFirst(match[1])} sker främst genom ${answer}`;
  match = q.match(/^Vilket år blev (.+?) medlem i (.+)$/i);
  if (match) return `${upperFirst(match[1])} blev medlem i ${match[2]} ${answer}`;
  match = q.match(/^Sedan vilket år är (.+) lag i Sverige$/i);
  if (match) return `${upperFirst(match[1])} är lag i Sverige sedan ${answer}`;
  match = q.match(/^Vad arbetar (.+?) för$/i);
  if (match) {
    if (/^Endast\s+/i.test(answer)) {
      return `${upperFirst(match[1])} arbetar endast för ${lowerFirst(answer.replace(/^Endast\s+/i, ''))}`;
    }
    const object = /^Att\s+/i.test(answer) ? swedishPurposeClause(answer) : lowerFirst(answer);
    return `${upperFirst(match[1])} arbetar för ${object}`;
  }
  match = q.match(/^Vad valde (.+?) att göra (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} valde att ${lowerFirst(stripLeadingPurposeSv(answer))} ${match[2]}`;
  match = q.match(/^Vilken lag markerade (.+)$/i);
  if (match) return `${answer} markerade ${match[1]}`;
  match = q.match(/^Vilken tradition har (.+?) historiska rötter i$/i);
  if (match) return `${upperFirst(match[1])} har historiska rötter i ${lowerFirst(answer)}`;
  match = q.match(/^Vilken religion beskrivs som (.+)$/i);
  if (match) {
    const description =
      match[1].toLocaleLowerCase('sv-SE') === 'den näst största i sverige'
        ? 'den näst största religionen i Sverige'
        : match[1];
    return `${answer} beskrivs som ${description}`;
  }
  match = q.match(/^Vad är vanligt att göra på (.+?) i Sverige$/i);
  if (match) return swedishCommonToDoStatement(match[1], answer);
  match = q.match(/^Vad är vanligt att familjer gör på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} brukar familjer ${lowerFirst(stripLeadingPurposeSv(answer))}`;
  match = q.match(/^Vad brukar hända på (.+)$/i);
  if (match) return `På ${match[1]} brukar ${swedishHabitualPredicate(answer)}`;
  match = q.match(/^Vad handlar (.+?) mycket om i Sverige$/i);
  if (match) return `${upperFirst(match[1])} handlar mycket om ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vad är typiskt för (.+?) i Sverige$/i);
  if (match) return `Typiskt för ${match[1]} är ${lowerFirst(answer)}`;
  match = q.match(/^När infaller (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} infaller ${lowerFirst(answer)}`;
  match = q.match(/^Vad uppmärksammas på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} uppmärksammas ${lowerFirst(answer)}`;
  match = q.match(/^Vad finns på olika platser i Sverige för (.+)$/i);
  if (match) return `På olika platser i Sverige finns ${lowerFirst(answer)} för ${match[1]}`;
  match = q.match(/^Vilka högtider är exempel på (.+)$/i);
  if (match) return `${answer} är exempel på ${match[1]}`;
  match = q.match(/^Vilka fyra folkrörelser var bland de största i Sverige under 1800-talet$/i);
  if (match) return `${answer} var bland de största folkrörelserna i Sverige under 1800-talet`;
  match = q.match(/^Vad erbjuder (.+?) i Sverige$/i);
  if (match) return `${upperFirst(match[1])} i Sverige erbjuder ${lowerFirst(answer)}`;
  match = q.match(/^Vad är ett mål med (.+)$/i);
  if (match) return `Ett mål med ${match[1]} är ${swedishPurposeClause(answer)}`;
  match = q.match(/^När byggdes (.+)$/i);
  if (match) return `${upperFirst(match[1])} byggdes ${lowerFirst(answer)}`;
  match = q.match(/^Vilka kristna kyrkor och samfund finns i (.+)$/i);
  if (match) return `${answer} finns i ${match[1]}`;
  match = q.match(/^Vilka kristna kyrkor eller samfund finns i (.+)$/i);
  if (match) return `${answer} finns i ${match[1]}`;
  match = q.match(/^Vilka kristna kyrkor eller samfund nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[1]}`;
  match = q.match(/^Vilket påstående om (.+?) stämmer$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vad skyddar (.+?) när det gäller (.+)$/i);
  if (match) return swedishProtectedReligionStatement(match[1], answer);
  match = q.match(/^Vad blev tillåtet för (.+?) år (.+)$/i);
  if (match)
    return `År ${match[2]} blev det tillåtet för ${match[1]} ${swedishPurposeClause(answer)}`;
  match = q.match(/^Vilka kristna högtider firar (.+?) även om (.+)$/i);
  if (match) return swedishChristianHolidayStatement(match[1], match[2], answer);
  match = q.match(/^Vilka religiösa ritualer är fortfarande vanliga i Sverige$/i);
  if (match) return `${answer} är fortfarande vanliga i Sverige`;
  match = q.match(/^Vad var (.+?) under (.+?) innan (.+)$/i);
  if (match) return `${upperFirst(match[1])} var ${lowerFirst(answer)} under ${match[2]}`;
  match = q.match(/^Vad fick (.+?) rätt att göra i Sverige på (.+)$/i);
  if (match) return swedishGainedRightStatement(match[1], answer, match[2]);
  match = q.match(/^Vilka riktningar inom (.+?) finns i (.+)$/i);
  if (match) return `${answer} finns i ${match[2]}`;
  match = q.match(/^Vilka riktningar inom (.+?) nämns som exempel i (.+)$/i);
  if (match) return `${answer} nämns som exempel i ${match[2]}`;
  match = q.match(/^Vad bidrog till (.+)$/i);
  if (match) return `${upperFirst(answer)} bidrog till ${match[1]}`;
  match = q.match(/^Vad nämns som exempel på (.+)$/i);
  if (match) return swedishMentionedExample(answer, match[1]);
  match = q.match(/^Vad är vanligt vid (.+)$/i);
  if (match) return `Vid ${match[1]} är det vanligt med ${lowerFirst(answer)}`;
  match = q.match(/^Vad är vanligt i många hem under (.+)$/i);
  if (match) return `Under ${match[1]} är det vanligt med ${lowerFirst(answer)} i många hem`;
  match = q.match(/^Vilken högtid avslutar (.+)$/i);
  if (match) return `${answer} avslutar ${match[1]}`;
  match = q.match(/^Vad brukar Lucia bära i ett luciatåg$/i);
  if (match) return `Lucia brukar bära ${lowerFirst(answer)}`;

  match = q.match(/^Vad brukar personen som är Lucia bära i ett luciatåg$/i);
  if (match) return `Personen som är Lucia brukar bära ${lowerFirst(answer)}`;
  match = q.match(/^Vad kallas gudstjänsten tidigt på morgonen den 25 december$/i);
  if (match)
    return `Gudstjänsten tidigt på morgonen den 25 december kallas ${swedishCalledAnswer(answer)}`;
  match = q.match(/^Vad är vanligt på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} är det vanligt att ${stripLeadingPurposeSv(answer)}`;
  match = q.match(/^Vad gör barn ofta med (.+?) hemma$/i);
  if (match) {
    if (/^en adventskalender$/i.test(match[1])) {
      return swedishChildrenWithAdventCalendarStatement(answer);
    }
    return `Barn ${lowerFirst(answer)} med ${match[1]} hemma`;
  }
  match = q.match(/^Vilket år blev (.+?) (en .+)$/i);
  if (match) return `${upperFirst(match[1])} blev ${match[2]} ${answer}`;
  match = q.match(/^Vad gör många på (.+?) i Sverige$/i);
  if (match) return `På ${match[1]} ${frontedManyActionSv(answer)}`;
  match = q.match(/^Vad kan hända med (.+?) när (.+)$/i);
  if (match) return replaceLeadingSwedishSubject(match[1], answer);
  match = q.match(/^Vad gör många med (.+?) vid (.+?) i Sverige$/i);
  if (match) return `Vid ${match[2]} ${frontedManyActionSv(answer)}`;
  match = q.match(/^Vad firar (.+?) traditionellt inom (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} firar traditionellt ${swedishTraditionalCelebrationAnswer(
      answer,
    )} inom ${match[2]}`;
  match = q.match(/^Vad brukar man bjuda på (.+?) i samband med (.+)$/i);
  if (match) return `${upperFirst(match[1])} brukar man bjuda på ${lowerFirst(answer)}`;
  match = q.match(/^Hur många landskap är Sverige indelat i$/i);
  if (match) return `Sverige är indelat i ${answer}`;
  match = q.match(
    /^Hur stor andel av rösterna måste ett parti minst få för att komma in i riksdagen$/i,
  );
  if (match) return `Ett parti måste få ${lowerFirst(answer)} för att komma in i riksdagen`;
  return upperFirst(stripLeadingPurposeSv(answer));
}
function civicStatementEn(source, option) {
  if (isTrueFalseSource(source)) {
    return trueFalseSourceStatementEn(source, option.id === source.correctOptionId);
  }
  const answer = stripFinalPunctuation(answerTextEn(option));
  const q = stripFinalPunctuation(source.questionEn);
  let match = q.match(/^Where is (.+) located$/i);
  if (match) return `${upperFirst(match[1])} is located ${lowerFirst(answer)}`;
  match = q.match(/^Approximately how far does (.+?) stretch (from .+)$/i);
  if (match) return `${upperFirst(match[1])} stretches ${lowerFirst(answer)} ${match[2]}`;
  match = q.match(/^What is (.+) called$/i);
  if (match) return `${upperFirst(match[1])} is called ${englishCalledAnswer(answer)}`;
  match = q.match(/^What is the name of (.+)$/i);
  if (match) return `${upperFirst(match[1])} is called ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^Which islands are Sweden's two largest$/i);
  if (match) return `Sweden's two largest islands are ${answer}`;
  match = q.match(/^Which islands are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;
  match = q.match(/^Which are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^Which groups are (.+)$/i);
  if (match) return `${upperFirst(match[1])} are ${answer}`;
  match = q.match(/^Which three companies are called (.+) in Sweden$/i);
  if (match) return `${answer} are called ${match[1]} in Sweden`;
  match = q.match(/^Approximately how many (.+)$/i);
  if (match) return `${upperFirst(answer)} ${match[1]}`;
  match = q.match(/^Which (.+?) are important in Sweden$/i);
  if (match) return `${upperFirst(answer)} are important ${match[1]} in Sweden`;
  match = q.match(/^What does (.+) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);
  match = q.match(/^Which of the following is part of (.+)$/i);
  if (match) return `A feature of ${match[1]} is that ${lowerFirst(answer)}`;
  match = q.match(/^Which is a way to (.+)$/i);
  if (match) return `One way to ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What right do (.+?) have in a democracy$/i);
  if (match) {
    return democracyRightStatementEn(match[1], answer, option.id === source.correctOptionId);
  }
  match = q.match(/^What is it called when (.+)$/i);
  if (match) return `When ${match[1]}, it is called ${lowerFirst(answer)}`;
  match = q.match(/^How can (.+?) affect (.+)$/i);
  if (match) return `${upperFirst(answer)} when ${match[1]} affects ${match[2]}`;
  match = q.match(/^How can (.+?) earn income$/i);
  if (match) return commercialMediaIncomeStatementEn(match[1], answer);
  match = q.match(/^How does (.+?) make it easier to (.+)$/i);
  if (match) {
    const method = /^By\s+/i.test(answer)
      ? lowerFirst(stripLeadingByEn(answer))
      : englishGerundPhrase(answer);
    return `${upperFirst(match[1])} makes it easier to ${match[2]} by ${method}`;
  }
  match = q.match(/^How do (.+?) choose (.+)$/i);
  if (match) {
    if (/^By\s+/i.test(answer)) {
      return `${upperFirst(match[1])} choose ${match[2]} ${lowerFirst(answer)}`;
    }
    return upperFirst(answer);
  }
  match = q.match(/^How many (.+?) does (.+?) have$/i);
  if (match) return `${upperFirst(match[2])} has ${lowerFirst(answer)} ${match[1]}`;
  match = q.match(/^Who chooses (.+)$/i);
  if (match) return `${upperFirst(match[1])} is chosen by ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^How old must (.+?) be to (.+)$/i);
  if (match) return `${upperFirst(match[1])} must be ${lowerFirst(answer)} to ${match[2]}`;
  match = q.match(/^From what age is (.+)$/i);
  if (match) {
    const predicate = match[1].replace(/^(.+?)\s+(criminally responsible\b.*)$/i, '$1 is $2');
    return `${upperFirst(predicate)} from ${englishAgePhrase(lowerFirst(answer))}`;
  }
  match = q.match(/^What does it mean that (.+)$/i);
  if (match) return `That ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What does it mean to (.+)$/i);
  if (match) return `To ${match[1]} means ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What can make (.+?) (stronger)$/i);
  if (match) {
    return `${upperFirst(match[1])} becomes ${match[2]} when ${englishCivicActionClause(answer)}`;
  }
  match = q.match(/^Which three levels share (.+)$/i);
  if (match) return `${upperFirst(answer)} share ${match[1]}`;
  match = q.match(/^Which of the following tasks belongs to (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} has the task to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What is one task of (.+)$/i);
  if (match) return `One task of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What is one role of (.+)$/i);
  if (match) return `One role of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Which statement describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);
  match = q.match(/^What characterizes (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^How are many newspapers published today$/i);
  if (match) return replaceLeadingEnglishSubject('many newspapers', answer);
  match = q.match(/^What is important to remember about the web and social media$/i);
  if (match) return webSocialMediaStatementEn(answer);
  match = q.match(/^Which statement is correct about (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What is the foremost task of (.+)$/i);
  if (match) {
    return `The foremost task of ${lowerLeadingEnglishArticle(match[1])} is ${englishInfinitive(stripLeadingPurposeEn(answer))}`;
  }
  match = q.match(/^Which example describes (.+)$/i);
  if (match && /^contacts with\b/i.test(match[1])) {
    return englishContributionStatement(answer, match[1]);
  }
  if (match)
    return `${upperFirst(answer)} ${englishSubjectVerb(answer, 'belongs', 'belong')} among ${match[1]}`;
  match = q.match(/^How often are (.+) held in Sweden$/i);
  if (match) return `${upperFirst(match[1])} are held ${lowerFirst(answer)} in Sweden`;
  match = q.match(/^Which requirements apply to (.+)$/i);
  if (match) return `To ${requirementTargetEn(match[1])}, ${lowerFirst(answer)}`;
  match = q.match(/^Why do voters vote behind a screen at the polling station$/i);
  if (match)
    return `One reason voters vote behind a screen at the polling station is that ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why was the United Nations created after the Second World War$/i);
  if (match)
    return `The United Nations was created after the Second World War to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why does Sweden have labour-market laws$/i);
  if (match) return `Sweden has labour-market laws to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^Why did Sweden’s population grow during the 19th century$/i);
  if (match)
    return `Sweden’s population grew during the 19th century because of ${lowerFirst(answer)}`;
  match = q.match(/^Why is (.+?) often called (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} is often called ${match[2]} because ${embeddedEnglishClause(answer)}`;
  match = q.match(/^Why (.+)$/i);
  if (match) return reasonStatementEn(answer, match[1]);
  match = q.match(/^What do (.+?) have in common$/i);
  if (match) return commonStatementEn(match[1], answer);
  match = q.match(/^What happens in (.+?) if (.+)$/i);
  if (match) return conditionalPartyOutcomeEn(match[1], match[2], answer);
  match = q.match(/^Which list contains (.+)$/i);
  if (match) return `The list with ${lowerLeadingEnglishArticle(answer)} contains ${match[1]}`;
  match = q.match(/^What does (.+?) say about (.+)$/i);
  if (match) return `${upperFirst(match[1])} says that ${lowerLeadingEnglishClauseStart(answer)}`;
  match = q.match(/^What does (.+?) regulate$/i);
  if (match) return `${upperFirst(match[1])} regulates ${lowerFirst(answer)}`;
  match = q.match(/^What does (.+?) mean$/i);
  if (match) return meaningStatementEn(match[1], answer);
  match = q.match(/^What do (.+?) mean$/i);
  if (match) return `${upperFirst(match[1])} mean ${stripLeadingThatEn(answer)}`;
  match = q.match(/^What is meant by (.+?) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} in Sweden means ${lowerFirst(answer)}`;
  match = q.match(/^Which authorities are part of (.+)$/i);
  if (match) return `${upperFirst(answer)} are part of ${match[1]}`;
  match = q.match(/^What applies to (.+)$/i);
  if (match) return appliesStatementEn(match[1], answer);
  match = q.match(/^What share of (.+?) works (.+)$/i);
  if (match) return `${upperFirst(answer)} of ${match[1]} works ${match[2]}`;
  match = q.match(/^How are (.+) set in Sweden$/i);
  if (match) return `${upperFirst(match[1])} in Sweden are set ${lowerFirst(answer)}`;
  match = q.match(/^What support can (.+?) provide to (.+)$/i);
  if (match) return supportStatementEn(match[1], answer);
  match = q.match(/^How does (.+?) help with (.+)$/i);
  if (match) {
    if (/^To\s+/i.test(answer)) {
      return `${upperFirst(match[1])} helps with ${match[2]} by ${englishGerundPhrase(answer)}`;
    }
    return replaceLeadingEnglishSubject(match[1], answer);
  }
  match = q.match(/^What do (.+?) do in the labour market$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What role do (.+?) have in (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What does the state finance within (.+)$/i);
  if (match) return `The state finances ${lowerFirst(answer)}`;
  match = q.match(/^What is included in (.+)$/i);
  if (match) return `${upperFirst(match[1])} includes ${lowerFirst(answer)}`;
  match = q.match(/^What responsibility does (.+?) have for (.+)$/i);
  if (match) return `${upperFirst(match[1])} is responsible for ${englishGerundPhrase(answer)}`;
  match = q.match(/^What help can (.+?) receive from (.+?) to (.+)$/i);
  if (match)
    return `${upperFirst(match[2])} can offer ${lowerFirst(match[1])} ${lowerFirst(
      answer,
    )} to ${match[3]}`;
  match = q.match(/^What responsibility do (.+?) have within (.+)$/i);
  if (match) return `${upperFirst(match[1])} are responsible for ${englishGerundPhrase(answer)}`;
  match = q.match(/^What important roles do (.+?) play in (.+)$/i);
  if (match) return importantRolesStatementEn(match[1], match[2], answer);
  match = q.match(/^Which answer gives examples of (.+)$/i);
  if (match) return `${upperFirst(answer)} are examples of ${match[1]}`;
  match = q.match(/^What changed through (.+)$/i);
  if (match) return `The change through ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^Which event from (.+?) is mentioned as (.+)$/i);
  if (match) return `The event from ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^Which event from (.+?) is linked to (.+)$/i);
  if (match) return `The event from ${match[1]} was that ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^When is (.+?) (?:celebrated|observed) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} is observed ${lowerFirst(answer)}`;
  match = q.match(/^When are (.+?) celebrated$/i);
  if (match) return `${upperFirst(match[1])} are observed ${lowerFirst(answer)}`;
  match = q.match(/^Which holiday is celebrated (.+?) and is connected with (.+)$/i);
  if (match) return `${answer} is celebrated ${match[1]} and is connected with ${match[2]}`;
  match = q.match(/^Which answer describes (.+)$/i);
  if (match) return describesStatementEn(match[1], answer);
  match = q.match(/^What did (.+?) decide as (.+)$/i);
  if (match) return decisionStatementEn(match[1], match[2], answer);
  match = q.match(/^In which year was (.+)$/i);
  if (match) return `${upperFirst(match[1])} was in ${answer}`;
  match = q.match(/^What did (.+?) become important for$/i);
  if (match)
    return `${upperFirst(match[1])} became important for ${lowerLeadingEnglishArticle(answer).replace(/^Cooperation\b/, 'cooperation')}`;
  match = q.match(/^What was the goal of (.+?) during (.+)$/i);
  if (match)
    return `The goal of ${match[1]} during ${match[2]} was to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What has (.+?) changed$/i);
  if (match) {
    if (/^Only\s+how\b/i.test(answer)) {
      return `${upperFirst(match[1])} has only changed ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} has changed ${lowerFirst(answer)}`;
  }
  match = q.match(/^Through which two bodies does (.+?) mainly take place$/i);
  if (match)
    return `${upperFirst(match[1])} mainly takes place through ${lowerLeadingEnglishArticle(answer)}`;
  match = q.match(/^In what year did (.+?) become a member of (.+)$/i);
  if (match) return `${upperFirst(match[1])} became a member of ${match[2]} in ${answer}`;
  match = q.match(/^Since what year has (.+) been law in Sweden$/i);
  if (match) return `${upperFirst(match[1])} has been law in Sweden since ${answer}`;
  match = q.match(/^What does (.+?) work to do$/i);
  if (match) return `${upperFirst(match[1])} works to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What does (.+?) work for$/i);
  if (match) {
    if (/^Only\s+/i.test(answer)) {
      return `${upperFirst(match[1])} works only for ${lowerFirst(answer.replace(/^Only\s+/i, ''))}`;
    }
    return `${upperFirst(match[1])} works for ${lowerFirst(answer)}`;
  }
  match = q.match(/^What did (.+?) choose to do (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} chose to ${lowerFirst(stripLeadingPurposeEn(answer))} ${match[2]}`;
  match = q.match(/^Which law marked (.+)$/i);
  if (match) return `${answer} marked ${match[1]}`;
  match = q.match(/^Which tradition does (.+?) have historical roots in$/i);
  if (match) return `${upperFirst(match[1])} has historical roots in ${lowerFirst(answer)}`;
  match = q.match(/^Which religion is described as (.+)$/i);
  if (match) {
    const description =
      match[1].toLowerCase() === 'the second largest in sweden'
        ? 'the second-largest religion in Sweden'
        : match[1];
    return `${answer} is described as ${description}`;
  }
  match = q.match(/^What is common to do on (.+?) in Sweden$/i);
  if (match) return englishCommonToDoStatement(match[1], answer);
  match = q.match(/^What do families commonly do on (.+) in Sweden$/i);
  if (match)
    return `On ${stripTrailingComma(match[1])}, families commonly ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^What usually happens on (.+)$/i);
  if (match) return `On ${match[1]}, ${lowerFirst(answer)}`;
  match = q.match(/^What is the (.+?) largely about in Sweden$/i);
  if (match) return `The ${match[1]} is largely about ${englishGerundPhrase(answer)}`;
  match = q.match(/^What is typical of (.+) in Sweden$/i);
  if (match) return `${upperFirst(answer)} are typical of ${stripTrailingComma(match[1])}`;
  match = q.match(/^When does (.+?) occur in Sweden$/i);
  if (match) return `${upperFirst(match[1])} occurs ${englishOccurrencePhrase(answer)}`;
  match = q.match(/^What is marked on (.+?) in Sweden$/i);
  if (match) return `${upperFirst(match[1])} marks ${lowerFirst(answer)}`;
  match = q.match(/^What exists in different places in Sweden for (.+)$/i);
  if (match)
    return `In different places in Sweden, there are ${lowerEnglishNounPhrase(answer)} for ${match[1]}`;
  match = q.match(/^Which holidays are examples of (.+)$/i);
  if (match) return `${answer} are examples of ${match[1]}`;
  match = q.match(
    /^Which four popular movements were among the largest in Sweden during the 19th century$/i,
  );
  if (match)
    return `${answer} were among the largest popular movements in Sweden during the 19th century`;
  match = q.match(/^What do (.+?) in Sweden offer$/i);
  if (match) return `${upperFirst(match[1])} in Sweden offer ${lowerFirst(answer)}`;
  match = q.match(/^What is one goal of (.+)$/i);
  if (match) return `One goal of ${match[1]} is to ${lowerFirst(stripLeadingPurposeEn(answer))}`;
  match = q.match(/^When were (.+?) built$/i);
  if (match) return `${upperFirst(match[1])} were built ${lowerFirst(answer)}`;
  match = q.match(/^Which Christian churches and communities exist in (.+)$/i);
  if (match) return `${answer} are present in ${match[1]}`;
  match = q.match(/^Which Christian churches or communities exist in (.+)$/i);
  if (match) return `${answer} exist in ${match[1]}`;
  match = q.match(/^Which Christian churches or communities are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[1]}`;
  match = q.match(/^Which statement about (.+?) is correct$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What does (.+?) protect regarding (.+)$/i);
  if (match) return englishProtectedReligionStatement(match[1], answer);
  match = q.match(/^What became permitted for (.+?) in (.+)$/i);
  if (match)
    return `In ${match[2]}, ${match[1]} were permitted to ${stripLeadingPurposeEn(answer)}`;
  match = q.match(/^Which Christian holidays do (.+?) celebrate even if (.+)$/i);
  if (match) return englishChristianHolidayStatement(match[1], match[2], answer);
  match = q.match(/^Which religious rituals are still common in Sweden$/i);
  if (match) return `${answer} are still common in Sweden`;
  match = q.match(/^What was (.+?) during (.+?) before (.+)$/i);
  if (match) return `${upperFirst(match[1])} was ${lowerFirst(answer)} during ${match[2]}`;
  match = q.match(/^What did (.+?) gain the right to do in Sweden in (.+)$/i);
  if (match) return englishGainedRightStatement(match[1], answer, match[2]);
  match = q.match(/^Which branches of (.+?) are found in (.+)$/i);
  if (match) return `${answer} are found in ${match[2]}`;
  match = q.match(/^Which branches within (.+?) are found in (.+)$/i);
  if (match) return `${answer} are found in ${match[2]}`;
  match = q.match(/^Which branches within (.+?) are mentioned as examples in (.+)$/i);
  if (match) return `${answer} are mentioned as examples in ${match[2]}`;
  match = q.match(/^What contributed to (.+)$/i);
  if (match) return `${upperFirst(answer)} contributed to ${match[1]}`;
  match = q.match(/^What is mentioned as an example of (.+)$/i);
  if (match) return englishMentionedExample(answer, match[1]);
  match = q.match(/^What is common during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common during ${match[1]}`;
  match = q.match(/^What is common in many homes during (.+)$/i);
  if (match) return `${upperFirst(answer)} are common in many homes during ${match[1]}`;
  match = q.match(/^Which holiday ends (.+)$/i);
  if (match) return `${answer} ends ${match[1]}`;
  match = q.match(/^What does Lucia usually wear in a Lucia procession$/i);
  if (match) return `Lucia usually wears ${lowerFirst(answer)}`;
  match = q.match(/^What is the church service early on the morning of 25 December called$/i);
  if (match)
    return `The church service early on the morning of 25 December is called ${englishCalledAnswer(
      answer,
    )}`;
  match = q.match(/^What is common on (.+?) in Sweden$/i);
  if (match) return `On ${match[1]}, it is common to ${englishCommonActivity(answer)}`;
  match = q.match(/^What do children often do with (.+?) at home$/i);
  if (match) {
    if (/^an Advent calendar$/i.test(match[1])) {
      return englishChildrenWithAdventCalendarStatement(answer);
    }
    return `Children often ${lowerFirst(stripLeadingPurposeEn(answer))} with ${match[1]} at home`;
  }
  match = q.match(/^In which year did (.+?) become (a .+)$/i);
  if (match) return `${upperFirst(match[1])} became ${match[2]} in ${answer}`;
  match = q.match(/^What do many people do on (.+?) in Sweden$/i);
  if (match) return `On ${match[1]}, ${manyPeopleActionEn(answer)}`;
  match = q.match(/^What can happen to (.+?) when (.+)$/i);
  if (match) return replaceLeadingEnglishSubject(match[1], answer);
  match = q.match(/^What do many people do with (.+?) at (.+?) in Sweden$/i);
  if (match) return `At ${match[2]}, ${manyPeopleActionEn(answer)}`;
  match = q.match(/^What does (.+?) traditionally celebrate in (.+)$/i);
  if (match)
    return `${upperFirst(match[1])} traditionally celebrates ${englishTraditionalCelebrationAnswer(
      answer,
    )} in ${match[2]}`;
  match = q.match(/^What is commonly served on (.+?) in connection with (.+)$/i);
  if (match) return `On ${match[1]}, people commonly serve ${lowerFirst(answer)}`;
  match = q.match(/^How many historical provinces is Sweden divided into$/i);
  if (match) return `Sweden is divided into ${answer}`;
  match = q.match(/^What minimum share of votes must a party receive to enter the Riksdag$/i);
  if (match) return `A party must receive ${lowerFirst(answer)} to enter the Riksdag`;
  return upperFirst(stripLeadingPurposeEn(answer));
}

function correctOption(question) {
  return (
    question.options?.find((option) => option.id === question.correctOptionId) ??
    question.options?.[0]
  );
}

function wrongOption(question) {
  return (
    question.options?.find((option) => option.id !== question.correctOptionId) ?? UNKNOWN_OPTION
  );
}

function expectedGeneratedPrompt(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return {
      questionSv: singleChoicePromptSv(sourceQuestion),
      questionEn: singleChoicePromptEn(sourceQuestion),
    };
  }

  if (variantIndex === 1) {
    const option = correctOption(sourceQuestion);
    return {
      questionSv: ensureSentence(generatedTrueFalseStatementSv(sourceQuestion, option, true)),
      questionEn: ensureSentence(generatedTrueFalseStatementEn(sourceQuestion, option, true)),
    };
  }

  if (variantIndex === 2) {
    const option = wrongOption(sourceQuestion);
    return {
      questionSv: ensureSentence(generatedTrueFalseStatementSv(sourceQuestion, option, false)),
      questionEn: ensureSentence(generatedTrueFalseStatementEn(sourceQuestion, option, false)),
    };
  }

  return {
    questionSv: judgementPromptSv(sourceQuestion),
    questionEn: judgementPromptEn(sourceQuestion),
  };
}

function expectedGeneratedExplanation(sourceQuestion, variantIndex) {
  if (variantIndex === 1) {
    return {
      explanationSv: trueStatementExplanationSv(sourceQuestion),
      explanationEn: trueStatementExplanationEn(sourceQuestion),
    };
  }

  if (variantIndex === 2) {
    return {
      explanationSv: falseStatementExplanationSv(sourceQuestion),
      explanationEn: falseStatementExplanationEn(sourceQuestion),
    };
  }

  if ((variantIndex === 0 || variantIndex === 3) && isTrueFalseSource(sourceQuestion)) {
    return {
      explanationSv: trueFalseSingleChoiceExplanationSv(sourceQuestion),
      explanationEn: trueFalseSingleChoiceExplanationEn(sourceQuestion),
    };
  }

  return {
    explanationSv: sourceQuestion.explanationSv,
    explanationEn: sourceQuestion.explanationEn,
  };
}

function singleChoiceOptions(sourceQuestion) {
  if (sourceQuestion.options?.length === SINGLE_CHOICE_OPTION_IDS.length) {
    return sourceQuestion.options;
  }
  if (sourceQuestion.type === 'true_false') {
    return trueFalseStatementOptions(sourceQuestion);
  }
  return sourceQuestion.options || [];
}

function normalizeSingleChoiceOptions(options, correctOptionId) {
  if (options.length !== SINGLE_CHOICE_OPTION_IDS.length) {
    return { options, correctOptionId };
  }

  const correctIndex = options.findIndex((option) => option.id === correctOptionId);
  return {
    options: options.map((option, index) => ({
      ...option,
      id: SINGLE_CHOICE_OPTION_IDS[index],
    })),
    correctOptionId: correctIndex >= 0 ? SINGLE_CHOICE_OPTION_IDS[correctIndex] : correctOptionId,
  };
}

function expectedGeneratedAnswerShape(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return normalizeSingleChoiceOptions(
      singleChoiceOptions(sourceQuestion),
      isTrueFalseSource(sourceQuestion) ? 'true-statement' : sourceQuestion.correctOptionId,
    );
  }

  if (variantIndex === 1) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'true',
    };
  }

  if (variantIndex === 2) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'false',
    };
  }

  const correct = correctOption(sourceQuestion);
  const sourceIsTrueFalse =
    sourceQuestion.options?.length === 2 &&
    ['true', 'false'].includes(sourceQuestion.correctOptionId);
  const options = sourceIsTrueFalse
    ? trueFalseStatementOptions(sourceQuestion)
    : singleChoiceOptions(sourceQuestion);

  return normalizeSingleChoiceOptions(options, sourceIsTrueFalse ? 'true-statement' : correct.id);
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  if (!hasText(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unexpectedKeys(value, expectedKeys) {
  if (!isObjectRecord(value)) return [];
  const expectedKeySet = new Set(expectedKeys);
  return Object.keys(value).filter((key) => !expectedKeySet.has(key));
}

function schemaKeyFailures(value, expectedKeys, label, schemaName) {
  if (!isObjectRecord(value)) return [`${label} must be a ${schemaName} object`];
  return unexpectedKeys(value, expectedKeys).map(
    (key) => `${label}.${key} is not part of ${schemaName} schema`,
  );
}

function questionExactSchemaKeyFailures(question, label) {
  const failures = schemaKeyFailures(
    question,
    EXPECTED_PRACTICE_QUESTION_KEYS,
    label,
    'PracticeQuestion',
  );

  if (Array.isArray(question?.options)) {
    question.options.forEach((option, optionIndex) => {
      failures.push(
        ...schemaKeyFailures(
          option,
          EXPECTED_QUESTION_OPTION_KEYS,
          `${label} option[${optionIndex}]`,
          'QuestionOption',
        ),
      );
    });
  }

  failures.push(
    ...schemaKeyFailures(
      question?.uhrReference,
      EXPECTED_UHR_REFERENCE_KEYS,
      `${label} uhrReference`,
      'UHRReference',
    ),
  );

  return failures;
}

function chapterExactSchemaKeyFailures(chapter, label) {
  return schemaKeyFailures(chapter, EXPECTED_CHAPTER_KEYS, label, 'Chapter');
}

function glossaryTermExactSchemaKeyFailures(term, label) {
  return schemaKeyFailures(term, EXPECTED_GLOSSARY_TERM_KEYS, label, 'GlossaryTerm');
}

function mockExamConfigExactSchemaKeyFailures(config, label) {
  return schemaKeyFailures(config, EXPECTED_MOCK_EXAM_CONFIG_KEYS, label, 'MockExamConfig');
}

function uhrSectionMapExactSchemaKeyFailures(map, label) {
  return schemaKeyFailures(map, EXPECTED_UHR_SECTION_MAP_KEYS, label, 'UHRSectionMap');
}

function uhrSectionMapSourceExactSchemaKeyFailures(source, label) {
  return schemaKeyFailures(
    source,
    EXPECTED_UHR_SECTION_MAP_SOURCE_KEYS,
    label,
    'UHRSectionMapSource',
  );
}

function uhrSectionMapChapterExactSchemaKeyFailures(chapter, label) {
  return schemaKeyFailures(
    chapter,
    EXPECTED_UHR_SECTION_MAP_CHAPTER_KEYS,
    label,
    'UHRSectionMapChapter',
  );
}

function isColorToken(value) {
  return (
    typeof value === 'string' && (/^#[0-9a-fA-F]{6}$/.test(value) || /^rgba?\(.+\)$/.test(value))
  );
}

function parseColorTokenRgb(value) {
  if (typeof value !== 'string') return null;
  const hex = value.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    return [0, 2, 4].map((index) => parseInt(hex[1].slice(index, index + 2), 16) / 255);
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  if (!rgb) return null;
  const channels = rgb[1]
    .split(',')
    .slice(0, 3)
    .map((channel) => Number(channel.trim()));
  if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;
  return channels.map((channel) => channel / 255);
}

function relativeLuminance(colorToken) {
  const rgb = parseColorTokenRgb(colorToken);
  if (!rgb) return null;
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractStringConstantFromTs(source, constantName) {
  const sourceFile = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true);
  let value;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constantName &&
      node.initializer &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      value = node.initializer.text;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return value;
}

function extractStringUnionTypeFromTs(source, typeName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let values;

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === typeName &&
      ts.isUnionTypeNode(node.type)
    ) {
      values = node.type.types.map((typeNode) => {
        if (
          ts.isLiteralTypeNode(typeNode) &&
          typeNode.literal &&
          ts.isStringLiteralLike(typeNode.literal)
        ) {
          return typeNode.literal.text;
        }
        if (ts.isLiteralTypeNode(typeNode) && ts.isNumericLiteral(typeNode.literal)) {
          return Number(typeNode.literal.text);
        }
        return undefined;
      });
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function extractTypeAliasTextFromTs(source, typeName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let text;

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === typeName
    ) {
      text = node.type.getText(sourceFile);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return text;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function extractObjectTypePropertiesFromTs(source, declarationName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let properties;

  function readMembers(members) {
    return members
      .map((member) => {
        const name = propertyNameText(member.name);
        if (!name) return undefined;

        if (ts.isMethodSignature(member)) {
          const parameters = member.parameters.map((parameter) => parameter.getText(sourceFile));
          return {
            name,
            optional: Boolean(member.questionToken),
            type: `(${parameters.join(', ')}) => ${member.type?.getText(sourceFile) ?? 'void'}`,
          };
        }

        if (!ts.isPropertySignature(member)) return undefined;
        return {
          name,
          optional: Boolean(member.questionToken),
          type: member.type?.getText(sourceFile) ?? '',
        };
      })
      .filter(Boolean);
  }

  function visit(node) {
    if (
      ts.isInterfaceDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName
    ) {
      properties = readMembers(node.members);
      return;
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      ts.isTypeLiteralNode(node.type)
    ) {
      properties = readMembers(node.type.members);
      return;
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      ts.isIntersectionTypeNode(node.type)
    ) {
      const mergedProperties = [];
      for (const typeNode of node.type.types) {
        if (ts.isTypeLiteralNode(typeNode)) {
          mergedProperties.push(...readMembers(typeNode.members));
          continue;
        }
        if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
          const referencedProperties = extractObjectTypePropertiesFromTs(
            source,
            typeNode.typeName.text,
          );
          if (Array.isArray(referencedProperties)) {
            mergedProperties.push(...referencedProperties);
          }
        }
      }
      properties = mergedProperties;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return properties;
}

function extractCallStringArgumentsFromTs(source, functionName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const calls = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === functionName
    ) {
      calls.push(
        node.arguments.map((argument) =>
          ts.isStringLiteralLike(argument) ? argument.text : undefined,
        ),
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

function numericLiteralValue(node) {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }
  return undefined;
}

function extractMappedNumericArraysFromTs(source, parameterName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const arrays = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'map' &&
      ts.isArrayLiteralExpression(node.expression.expression)
    ) {
      const callback = node.arguments[0];
      const callbackParameter = callback?.parameters?.[0]?.name;
      if (
        callbackParameter &&
        ts.isIdentifier(callbackParameter) &&
        callbackParameter.text === parameterName
      ) {
        arrays.push(
          node.expression.expression.elements.map((element) => numericLiteralValue(element)),
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return arrays;
}

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      if (cell.length) {
        throw new Error('unexpected quote inside unquoted cell');
      }
      inQuotes = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new Error('unterminated quoted cell');
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function questionOptionPayload(question, field) {
  return JSON.stringify(
    question.options.map((option) => ({
      id: option.id,
      text: option[field],
    })),
  );
}

function optionIdsMatchQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  const optionIds = question.options.map((option) => option?.id);
  if (question.type === 'single_choice') {
    return arrayEquals(optionIds, SINGLE_CHOICE_OPTION_IDS);
  }
  if (question.type === 'true_false') {
    return arrayEquals(optionIds, TRUE_FALSE_OPTION_IDS);
  }
  return optionIds.every(hasText);
}

function trueFalseOptionLabelsMatchConvention(question) {
  if (question.type !== 'true_false' || !Array.isArray(question.options)) return false;
  const legacyLabels = question.options.map((option) => ({
    id: option.id,
    textSv: option.textSv,
    textEn: option.textEn,
  }));
  return jsonEqual(legacyLabels, TRUE_FALSE_OPTIONS);
}

function validateChapterLocalizedTextMap(chapter, label, fieldName, svField, enField, reject) {
  let valid = true;

  function rejectMap(message) {
    valid = false;
    reject(message);
  }

  const localizedText = chapter[fieldName];
  if (!isObjectRecord(localizedText)) {
    rejectMap(`${label} ${fieldName} must be a localized text map`);
    return false;
  }

  for (const [locale, sourceField] of [
    ['sv', svField],
    ['en', enField],
  ]) {
    const value = localizedText[locale];
    if (!hasText(value)) {
      rejectMap(`${label} ${fieldName}.${locale} missing localized text`);
      continue;
    }
    if (!textIsTrimmedSingleSpaced(value)) {
      rejectMap(`${label} ${fieldName}.${locale} must be trimmed and single-spaced`);
    }
    if (value !== chapter[sourceField]) {
      rejectMap(`${label} ${fieldName}.${locale} must match ${sourceField}`);
    }
  }

  Object.entries(localizedText).forEach(([locale, value]) => {
    if (!hasText(value)) {
      rejectMap(`${label} ${fieldName}.${locale} must be non-empty localized text`);
    } else if (!textIsTrimmedSingleSpaced(value)) {
      rejectMap(`${label} ${fieldName}.${locale} must be trimmed and single-spaced`);
    }
  });

  return valid;
}

function validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn) {
  const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
  const label = hasText(chapter?.id) ? chapter.id : `chapter[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  chapterExactSchemaKeyFailures(chapter, label).forEach(reject);

  if (!isObjectRecord(chapter)) return false;

  if (chapter.id !== expectedId) reject(`expected chapter ${expectedId}, found ${chapter.id}`);
  if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
    reject(`${label} has duplicate chapter id`);
  }
  if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

  for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
    if (!hasText(chapter[field])) reject(`${label} missing ${field}`);
    if (hasText(chapter[field]) && !textIsTrimmedSingleSpaced(chapter[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  if (normalizeComparableText(chapter.nameSv) === normalizeComparableText(chapter.nameEn)) {
    reject(`${label} nameSv and nameEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(chapter.descriptionSv) ===
    normalizeComparableText(chapter.descriptionEn)
  ) {
    reject(`${label} descriptionSv and descriptionEn must be distinct bilingual text`);
  }

  const normalizedNameSv = normalizeComparableText(chapter.nameSv);
  if (normalizedNameSv && seenNamesSv.has(normalizedNameSv)) {
    reject(`${label} duplicates Swedish chapter name`);
  }
  if (normalizedNameSv) seenNamesSv.add(normalizedNameSv);

  const normalizedNameEn = normalizeComparableText(chapter.nameEn);
  if (normalizedNameEn && seenNamesEn.has(normalizedNameEn)) {
    reject(`${label} duplicates English chapter name`);
  }
  if (normalizedNameEn) seenNamesEn.add(normalizedNameEn);

  if (!Number.isInteger(chapter.questionCount) || chapter.questionCount < 1) {
    reject(`${label} has invalid questionCount`);
  }

  if (validateChapterLocalizedTextMap(chapter, label, 'nameText', 'nameSv', 'nameEn', reject)) {
    chapterLocalizedTextMapsValidated += 1;
  }
  if (
    validateChapterLocalizedTextMap(
      chapter,
      label,
      'descriptionText',
      'descriptionSv',
      'descriptionEn',
      reject,
    )
  ) {
    chapterLocalizedTextMapsValidated += 1;
  }

  return valid;
}

function chapterTextFieldsAreNormalized(chapter) {
  return ['id', 'nameSv', 'nameEn', 'descriptionSv', 'descriptionEn'].every((field) =>
    textIsTrimmedSingleSpaced(chapter[field]),
  );
}

function validateQuestionSchema(question, index) {
  const label = hasText(question?.id) ? question.id : `question[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!isObjectRecord(question)) {
    reject(`${label} must be a PracticeQuestion object`);
    return false;
  }

  questionExactSchemaKeyFailures(question, label).forEach(reject);

  function requireText(field) {
    if (!hasText(question[field])) {
      reject(`${label} missing ${field}`);
    } else if (!textIsTrimmedSingleSpaced(question[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  requireText('id');
  if (hasText(question.id) && !/^q\d{3,}$/.test(question.id)) {
    reject(`${label} id must use q### format`);
  }

  for (const field of [
    'questionSv',
    'questionEn',
    'explanationSv',
    'explanationEn',
    'correctOptionId',
    'chapterId',
  ]) {
    requireText(field);
  }

  if (!QUESTION_TYPES.has(question.type)) reject(`${label} has invalid type ${question.type}`);
  if (!DIFFICULTIES.has(question.difficulty)) {
    reject(`${label} has invalid difficulty ${question.difficulty}`);
  }
  if (!REVIEW_STATUSES.has(question.reviewStatus)) {
    reject(`${label} has invalid reviewStatus ${question.reviewStatus}`);
  }
  if (
    normalizeComparableText(question.questionSv) === normalizeComparableText(question.questionEn)
  ) {
    reject(`${label} questionSv and questionEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(question.explanationSv) ===
    normalizeComparableText(question.explanationEn)
  ) {
    reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
  }
  for (const field of ['questionSv', 'questionEn', 'explanationSv', 'explanationEn']) {
    if (hasText(question[field]) && !textHasSentenceEnding(question[field])) {
      reject(`${label} ${field} must end with sentence punctuation`);
    }
  }

  if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
    reject(`${label} must have 2 or 4 options`);
  } else {
    const optionIds = new Set();
    question.options.forEach((option, optionIndex) => {
      const optionLabel = `${label} option[${optionIndex}]`;
      if (!hasText(option.id)) reject(`${optionLabel} missing id`);
      if (hasText(option.id) && !textIsTrimmedSingleSpaced(option.id)) {
        reject(`${optionLabel} id must be trimmed and single-spaced`);
      }
      if (hasText(option.id) && optionIds.has(option.id)) {
        reject(`${label} has duplicate option id ${option.id}`);
      }
      optionIds.add(option.id);
      if (!hasText(option.textSv)) reject(`${optionLabel} missing textSv`);
      if (!hasText(option.textEn)) reject(`${optionLabel} missing textEn`);
      if (hasText(option.textSv) && !textIsTrimmedSingleSpaced(option.textSv)) {
        reject(`${optionLabel} textSv must be trimmed and single-spaced`);
      }
      if (hasText(option.textEn) && !textIsTrimmedSingleSpaced(option.textEn)) {
        reject(`${optionLabel} textEn must be trimmed and single-spaced`);
      }
      if (!optionTextPairIsTranslatedOrInvariant(option)) {
        reject(`${optionLabel} textSv and textEn must be translated or a short invariant label`);
      }
    });
    findDuplicateOptionTextLabels(question).forEach((duplicate) => {
      reject(`${label} has duplicate ${duplicate.field} option text "${duplicate.label}"`);
    });

    if (!optionIds.has(question.correctOptionId)) {
      reject(`${label} correctOptionId does not match an option`);
    }
    if (question.type === 'single_choice' && question.options.length !== 4) {
      reject(`${label} single_choice questions must have 4 options`);
    }
    if (question.type === 'single_choice' && !optionIdsMatchQuestionType(question)) {
      reject(`${label} single_choice options must use a/b/c/d option ids in order`);
    }
    if (
      question.type === 'true_false' &&
      (question.options.length !== 2 ||
        !optionIdsMatchQuestionType(question) ||
        !['true', 'false'].includes(question.correctOptionId) ||
        !trueFalseOptionLabelsMatchConvention(question))
    ) {
      reject(`${label} true_false questions must use true/false option ids and labels in order`);
    }
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    reject(`${label} must have at least one tag`);
  } else {
    const tags = new Set();
    question.tags.forEach((tag, tagIndex) => {
      if (!hasText(tag)) reject(`${label} tag[${tagIndex}] is blank`);
      if (hasText(tag) && !isSlugTag(tag)) {
        reject(`${label} tag[${tagIndex}] must use lowercase kebab-case`);
      }
      if (hasText(tag) && tags.has(tag)) reject(`${label} has duplicate tag ${tag}`);
      tags.add(tag);
    });
  }

  if (question.uhrReference && typeof question.uhrReference === 'object') {
    for (const field of ['chapter', 'section']) {
      if (
        hasText(question.uhrReference[field]) &&
        !textIsTrimmedSingleSpaced(question.uhrReference[field])
      ) {
        reject(`${label} uhrReference.${field} must be trimmed and single-spaced`);
      }
    }
  }

  return valid;
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questionModule = loadTs('data/questions.ts');
const baseQuestions = questionModule.baseQuestions;
const localizedAdditionalQuestions = questionModule.localizedAdditionalQuestions;
const questions = questionModule.questions;
const sourceQuestions = questionModule.sourceQuestions;
const generatedPublishedQuestions = questionModule.generatedPublishedQuestions;
const questionLocalizationModule = loadTs('data/questionLocalizations.ts');
const applyQuestionLocalizationPilot = questionLocalizationModule.applyQuestionLocalizationPilot;
const derivedQuestionModule = loadTs('lib/content/derivedQuestions.ts');
const derivePublishedQuestions = derivedQuestionModule.derivePublishedQuestions;
const expectedGeneratedPublishedQuestions =
  Array.isArray(sourceQuestions) && typeof derivePublishedQuestions === 'function'
    ? derivePublishedQuestions(sourceQuestions, sourceQuestions.length + 1)
    : [];
const additionalQuestions = loadTs('data/additionalQuestions.ts', 'additionalQuestions');
const glossaryTerms = loadTs('data/glossary.ts', 'glossaryTerms');
const uxBenchmarks = loadTs('data/uxBenchmarks.ts', 'uxBenchmarks');
const defaultMockExamConfig = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
const supportedLanguages = loadTs('lib/localization/language.ts', 'supportedLanguages');
const localizationStrings = loadTs('lib/localization/strings.ts', 'strings');
const examGeneratorModule = loadTs('lib/quiz/examGenerator.ts');
const generateExam = examGeneratorModule.generateExam;
const buildExamReviewItems = examGeneratorModule.buildExamReviewItems;
const scoreExam = examGeneratorModule.scoreExam;
const buildExamChapterBreakdownItems = examGeneratorModule.buildExamChapterBreakdownItems;
const formatExamTime = examGeneratorModule.formatExamTime;
const shouldAutoSubmitExam = examGeneratorModule.shouldAutoSubmitExam;
const scoringModule = loadTs('lib/quiz/scoring.ts');
const scoreAnswers = scoringModule.scoreAnswers;
const answerValidationModule = loadTs('lib/quiz/answerValidation.ts');
const isCorrectAnswer = answerValidationModule.isCorrectAnswer;
const getAnswerOptionFeedback = answerValidationModule.getAnswerOptionFeedback;
const answerOptionShuffleModule = loadTs('lib/quiz/answerOptionShuffle.ts');
const shuffleQuestionOptionsForSession = answerOptionShuffleModule.shuffleQuestionOptionsForSession;
const summarizeAnswerShuffleDistribution =
  answerOptionShuffleModule.summarizeAnswerShuffleDistribution;
const answerShuffleDistributionIsBalanced =
  answerOptionShuffleModule.answerShuffleDistributionIsBalanced;
const ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE =
  answerOptionShuffleModule.ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE;
const audioModule = loadTs('lib/audio/speak.ts');
const buildQuestionSpeechText = audioModule.buildQuestionSpeechText;
const speakSwedish = audioModule.speakSwedish;
const stopSpeech = audioModule.stopSpeech;
const practiceFlowModule = loadTs('lib/quiz/practiceFlow.ts');
const getPracticeQuestionForSession = practiceFlowModule.getPracticeQuestionForSession;
const getCompletedQuestionIdsForQuestionBank =
  practiceFlowModule.getCompletedQuestionIdsForQuestionBank;
const getChapterQuizSessionId = practiceFlowModule.getChapterQuizSessionId;
const practiceSessionStoreModule = loadTs('lib/quiz/practiceSessionStore.ts');
const usePracticeSessionStore = practiceSessionStoreModule.usePracticeSessionStore;
const getPracticeInterstitialShowKey = practiceSessionStoreModule.getPracticeInterstitialShowKey;
const badgeModule = loadTs('lib/learning/badges.ts');
const badgeCatalog = badgeModule.badgeCatalog;
const deriveBadges = badgeModule.deriveBadges;
const examDateModule = loadTs('lib/learning/examDate.ts');
const spacedRepetitionModule = loadTs('lib/learning/spacedRepetition.ts');
const spacedRepetitionSchedule = spacedRepetitionModule.spacedRepetitionSchedule;
const getNextReviewAt = spacedRepetitionModule.getNextReviewAt;
const dashboardStatsModule = loadTs('lib/learning/dashboardStats.ts');
const perChapterProgress = dashboardStatsModule.perChapterProgress;
const readinessModule = loadTs('lib/learning/readiness.ts');
const computeReadinessFromQuestionProgress = readinessModule.computeReadinessFromQuestionProgress;
const streakModule = loadTs('lib/learning/streaks.ts');
const calculateStreak = streakModule.calculateStreak;
const streakWithFreezeModule = loadTs('lib/learning/streakWithFreeze.ts');
const calculateStreakWithFreeze = streakWithFreezeModule.calculateStreakWithFreeze;
const refillFreezes = streakWithFreezeModule.refillFreezes;
const mockExamLibraryModule = loadTs('lib/learning/mockExamLibrary.ts');
const MOCK_EXAM_LIBRARY = mockExamLibraryModule.MOCK_EXAM_LIBRARY;
const xpModule = loadTs('lib/learning/xp.ts');
const calculateAnswerXp = xpModule.calculateAnswerXp;
const calculateQuizCompletionXp = xpModule.calculateQuizCompletionXp;
const calculateLevel = xpModule.calculateLevel;
const masteryModule = loadTs('lib/learning/mastery.ts');
const calculateMastery = masteryModule.calculateMastery;
const calculateChapterMastery = masteryModule.calculateChapterMastery;
const findWeakChapterIds = masteryModule.findWeakChapterIds;
const weeklyRecapModule = loadTs('lib/learning/weeklyRecap.ts');
const generateWeeklyRecap = weeklyRecapModule.generateWeeklyRecap;
const themeModule = loadTs('lib/theme/index.ts');
const colors = themeModule.colors;
const darkColors = themeModule.darkColors;
const motion = themeModule.motion;
const radius = themeModule.radius;
const shadows = themeModule.shadows;
const space = themeModule.space;
const typography = themeModule.typography;
const adsModule = loadTs('lib/monetization/ads.ts');
const adsConfig = adsModule.adsConfig;
const shouldShowAd = adsModule.shouldShowAd;
const shouldSuppressLaunchPopupAdForPath = adsModule.shouldSuppressLaunchPopupAdForPath;
const consentModule = loadTs('lib/monetization/consent.ts');
const consentConfig = consentModule.consentConfig;
const premiumModule = loadTs('lib/monetization/premium.ts');
const FREE_ENTITLEMENTS = premiumModule.FREE_ENTITLEMENTS;
const PREMIUM_ENTITLEMENTS = premiumModule.PREMIUM_ENTITLEMENTS;
const REMOVE_ADS_ENTITLEMENTS = premiumModule.REMOVE_ADS_ENTITLEMENTS;
const hasAdsDisabled = premiumModule.hasAdsDisabled;
const isPremiumUser = premiumModule.isPremiumUser;
const premiumConfig = premiumModule.premiumConfig;
const tierComparisonModule = loadTs('lib/monetization/tierComparison.ts');
const TIER_ROWS = tierComparisonModule.TIER_ROWS;
const purchaseModule = loadTs('lib/monetization/purchases.ts');
const REMOVE_ADS_PRICE_LABEL = purchaseModule.REMOVE_ADS_PRICE_LABEL;
const REMOVE_ADS_PRODUCT_ID = purchaseModule.REMOVE_ADS_PRODUCT_ID;
const releasePolicyModule = loadTs('lib/monetization/releasePolicy.ts');
const releaseMonetizationPolicy = releasePolicyModule.releaseMonetizationPolicy;
const isReleaseMonetizationPolicyReady = releasePolicyModule.isReleaseMonetizationPolicyReady;
const packageMetadata = loadJson('package.json');
const appConfig = loadJson('app.json');
const uhrSectionMap = loadJson('content/uhr-section-map.json');
const provenanceModule = loadTs('lib/content/provenance.ts');
const getQuestionProvenance = provenanceModule.getQuestionProvenance;
let chapterSchemasValidated = 0;
let chapterTextFieldsNormalizedValidated = 0;
let chapterExactSchemaKeysValidated = 0;
let chapterLocalizedTextMapsValidated = 0;
let validationScriptSyntaxChecksValidated = 0;
let contentTestValidateContentExecCallsValidated = 0;
let contentTestValidateContentExecCwdPinnedValidated = 0;
let contentTestValidateContentExecCwdParityValidated = false;
let appConfigPluginsValidated = 0;
let appConfigSchemaValidated = false;
let launchAdSuppressedRoutesValidated = 0;
let launchAdRouteSuppressionParityValidated = false;
let tabNavigationRulesValidated = 0;
let tabNavigationRoutesValidated = 0;
let tabNavigationParityValidated = false;
let searchRouteQueryHydrationRulesValidated = 0;
let searchRouteQueryHydrationParityValidated = false;
let releaseMonetizationPolicyFieldsValidated = 0;
let releaseMonetizationPolicyParityValidated = false;
let adPlacementRoutesValidated = 0;
let noAdRoutesValidated = 0;
let adPlacementRouteParityValidated = false;
let removeAdsEntitlementHookCasesValidated = 0;
let removeAdsEntitlementHookParityValidated = false;
let premiumEntitlementStatesValidated = 0;
let premiumEntitlementParityValidated = false;
let questionDisclaimerRoutesValidated = 0;
let questionDisclaimerCopyValidated = false;
let questionReportLinkRulesValidated = 0;
let questionReportLinkParityValidated = false;
let mockExamConfigTypeFieldsValidated = 0;
let mockExamConfigTypeSchemaParityValidated = false;
let mockExamConfigExactSchemaKeysValidated = false;
let mockExamConfigValidated = false;
let mockExamRuntimeParityValidated = false;
let mockExamChapterBalanceParityValidated = false;
let mockExamTimerParityValidated = false;
let examSubmissionFinalityParityValidated = false;
let aboutTheTestRouteCopyLabelsValidated = 0;
let aboutTheTestRouteCopyParityValidated = false;
let aboutTheTestOfficialSourceUrlsValidated = 0;
let aboutTheTestOfficialSourceRetrievedDateValidated = '';
let aboutTheTestSeenEffectRulesValidated = 0;
let aboutTheTestSeenEffectParityValidated = false;
let aboutTheTestSwedishMockprovCopyGuardValidated = 0;
let citizenshipRequirementsLimitedSeatCopyValidated = 0;
let examRouteHeadersValidated = 0;
let examRouteHeaderParityValidated = false;
let examRouteCopyLabelsValidated = 0;
let examRouteCopyParityValidated = false;
let nativeMockExamComponentCopyLabelsValidated = 0;
let nativeMockExamComponentLegalCopyValidated = false;
let nativeMockExamLibraryLabelsValidated = 0;
let nativeMockExamScoreSourceCopyValidated = false;
let nativeMockExamSwedishCopyNaturalnessValidated = false;
let nativeMockExamTierCopyValidated = false;
let quizRouteHeadersValidated = 0;
let quizRouteHeaderParityValidated = false;
let quizRouteCopyLabelsValidated = 0;
let quizRouteCopyParityValidated = false;
let practiceRouteHeadersValidated = 0;
let practiceRouteHeaderParityValidated = false;
let chapterRouteHeadersValidated = 0;
let chapterRouteHeaderParityValidated = false;
let chapterRouteCopyLabelsValidated = 0;
let chapterRouteCopyParityValidated = false;
let learnRouteHeadersValidated = 0;
let learnRouteHeaderParityValidated = false;
let profileRouteHeadersValidated = 0;
let profileRouteHeaderParityValidated = false;
let profileRouteCopyLabelsValidated = 0;
let profileRouteCopyParityValidated = false;
let homeRouteHeadersValidated = 0;
let homeRouteHeaderParityValidated = false;
let homeRouteCopyLabelsValidated = 0;
let homeRouteCopyParityValidated = false;
let homeRouteInternalBenchmarkCopyValidated = false;
let homeRouteSwedishMistakeReviewCopyNaturalnessValidated = false;
let mistakesRouteHeadersValidated = 0;
let mistakesRouteHeaderParityValidated = false;
let legalRouteHeadersValidated = 0;
let legalRouteHeaderParityValidated = false;
let swedishPrivacyStreakCopyNaturalnessValidated = false;
let legalSwedishEnglishTokenGuardValidated = 0;
let legalSwedishEnglishTokenGuardParityValidated = false;
let legalInternalMonetizationKeyGuardValidated = 0;
let legalInternalMonetizationKeyGuardParityValidated = false;
let staticSiteSwedishStudyTermsValidated = 0;
let staticSiteSwedishStudyTermNaturalnessValidated = false;
let staticSiteSwedishGrammarToneValidated = 0;
let staticSiteSwedishGrammarToneNaturalnessValidated = false;
let staticEbookSwedishStudyTermsValidated = 0;
let staticEbookSwedishStudyTermNaturalnessValidated = false;
let staticI18nChinesePunctuationLocalesValidated = 0;
let staticI18nChinesePunctuationValuesValidated = 0;
let staticI18nChinesePunctuationParityValidated = false;
let settingsRouteHeadersValidated = 0;
let settingsRouteHeaderParityValidated = false;
let settingsRouteCopyLabelsValidated = 0;
let settingsRouteCopyParityValidated = false;
let onboardingRouteHeadersValidated = 0;
let onboardingRouteHeaderParityValidated = false;
let onboardingRouteCopyLabelsValidated = 0;
let onboardingRouteCopyParityValidated = false;
let firstRunAboutModalSuppressedRoutesValidated = 0;
let firstRunAboutModalSuppressionParityValidated = false;
let screenShellLayoutRulesValidated = 0;
let screenShellLayoutParityValidated = false;
let settingsRouteScrollRulesValidated = 0;
let settingsRouteScrollParityValidated = false;
let onboardingRouteScrollRulesValidated = 0;
let onboardingRouteScrollParityValidated = false;
let legalRouteScrollRulesValidated = 0;
let legalRouteScrollParityValidated = false;
let buttonAccessibilityRulesValidated = 0;
let buttonAccessibilityParityValidated = false;
let cardAccessibilityRulesValidated = 0;
let cardAccessibilityParityValidated = false;
let progressBarAccessibilityRulesValidated = 0;
let progressBarAccessibilityParityValidated = false;
let metricCardAccessibilityRulesValidated = 0;
let metricCardAccessibilityParityValidated = false;
let badgeAccessibilityRulesValidated = 0;
let badgeAccessibilityParityValidated = false;
let chapterCardAccessibilityRulesValidated = 0;
let chapterCardAccessibilityParityValidated = false;
let flashcardAccessibilityRulesValidated = 0;
let flashcardAccessibilityParityValidated = false;
let audioButtonAccessibilityRulesValidated = 0;
let audioButtonAccessibilityParityValidated = false;
let questionCardAccessibilityRulesValidated = 0;
let questionCardAccessibilityParityValidated = false;
let answerOptionAccessibilityRulesValidated = 0;
let answerOptionAccessibilityParityValidated = false;
let explanationPanelAccessibilityRulesValidated = 0;
let explanationPanelAccessibilityParityValidated = false;
let uhrReferenceCardAccessibilityRulesValidated = 0;
let uhrReferenceCardAccessibilityParityValidated = false;
let celebrationBurstAccessibilityRulesValidated = 0;
let celebrationBurstAccessibilityParityValidated = false;
let examReviewItemsValidated = 0;
let examReviewSourceParityValidated = false;
let examChapterBreakdownItemsValidated = 0;
let examChapterBreakdownParityValidated = false;
let examGeneratorTypeAliasesValidated = 0;
let examGeneratorTypeInterfacesValidated = 0;
let examGeneratorTypeSchemaParityValidated = false;
let glossaryTermsValidated = 0;
let glossaryTermExactSchemaKeysValidated = 0;
let uxBenchmarksValidated = 0;
let contentTypeUnionsValidated = 0;
let contentTypeInterfacesValidated = 0;
let contentTypeSchemaParityValidated = false;
let supportedLanguagesValidated = 0;
let localizationStringsValidated = 0;
let languageSettingsParityValidated = false;
let practiceRouteCopyLabelsValidated = 0;
let practiceRouteCopyParityValidated = false;
let provenanceAuthorityCopyFilesValidated = 0;
let provenanceAuthorityCopyParityValidated = false;
let learnRouteLinkCopyLabelsValidated = 0;
let learnRouteLinkCopyParityValidated = false;
let mistakesRouteCopyLabelsValidated = 0;
let mistakesRouteCopyParityValidated = false;
let mistakeReviewHydrationFixtureCasesValidated = 0;
let mistakeReviewHydrationTestContentParityValidated = false;
let mistakeReviewHydrationValidated = false;
let settingsStoreFieldsValidated = 0;
let settingsStoreSchemaParityValidated = false;
let settingsDailyGoalOptionsValidated = 0;
let settingsDailyGoalParityValidated = false;
let settingsAudioLabelsValidated = 0;
let settingsAudioParityValidated = false;
let progressQuestionFieldsValidated = 0;
let progressQuestionSchemaParityValidated = false;
let progressTypeUnionsValidated = 0;
let progressTypeInterfacesValidated = 0;
let progressTypeSchemaParityValidated = false;
let progressStoreFieldsValidated = 0;
let progressStoreSchemaParityValidated = false;
let monetizationTypeUnionsValidated = 0;
let monetizationTypeInterfacesValidated = 0;
let monetizationTypeSchemaParityValidated = false;
let purchaseTypeUnionsValidated = 0;
let purchaseTypeInterfacesValidated = 0;
let purchaseTypeSchemaParityValidated = false;
let removeAdsPurchaseRuntimeCasesValidated = 0;
let removeAdsPurchaseRuntimeParityValidated = false;
let removeAdsSwedishExamCopyCasesValidated = 0;
let removeAdsSwedishExamCopyParityValidated = false;
let adConsentTypeUnionsValidated = 0;
let adConsentTypeInterfacesValidated = 0;
let adConsentTypeSchemaParityValidated = false;
let mobileAdsConsentTypeInterfacesValidated = 0;
let mobileAdsConsentTypeSchemaParityValidated = false;
let mobileAdsConsentHookCasesValidated = 0;
let mobileAdsConsentHookParityValidated = false;
let rewardedAdTypeUnionsValidated = 0;
let rewardedAdTypeInterfacesValidated = 0;
let rewardedAdTypeSchemaParityValidated = false;
let mockExamAccessTypeUnionsValidated = 0;
let mockExamAccessTypeInterfacesValidated = 0;
let mockExamAccessTypeSchemaParityValidated = false;
let themeColorTokensValidated = 0;
let themeDarkColorTokensValidated = 0;
let themeContrastPairsValidated = 0;
let themeContrastPairsAAValidated = false;
let themeDarkContrastPairsValidated = 0;
let themeDarkContrastPairsAAValidated = false;
let themeSpaceTokensValidated = 0;
let themeRadiusTokensValidated = 0;
let themeTypographyTokensValidated = 0;
let themeShadowTokensValidated = 0;
let themeMotionTokensValidated = 0;
let themeTokenSchemaValidated = false;
let badgesValidated = 0;
let badgeMilestoneParityValidated = false;
let badgeRuntimeInputCasesValidated = 0;
let badgeRuntimeInputParityValidated = false;
let citizenshipRulesEffectiveDateValidated = '';
let civicKnowledgeTestFirstSittingDateValidated = '';
let civicKnowledgeTestDeadlineDateValidated = '';
let citizenshipTimelineSourceUrlsValidated = 0;
let citizenshipTimelineDateParityValidated = false;
let countdownBannerTimelineCopyParityValidated = false;
let countdownBannerHomeMountRulesValidated = 0;
let countdownBannerHomeMountParityValidated = false;
let practiceScoringRulesValidated = 0;
let practiceScoringRulesParityValidated = false;
let practiceFlowCasesValidated = 0;
let practiceFlowParityValidated = false;
let practiceSessionStoreFieldsValidated = 0;
let practiceSessionStoreSchemaParityValidated = false;
let practiceSessionStoreRuntimeParityValidated = false;
let practiceInterstitialQuestionCapValidated = false;
let answerValidationTypeUnionsValidated = 0;
let answerValidationTypeInterfacesValidated = 0;
let answerValidationTypeSchemaParityValidated = false;
let answerFeedbackQuestionsValidated = 0;
let answerFeedbackOptionsValidated = 0;
let answerFeedbackRuntimeParityValidated = false;
let answerShuffleSingleChoiceQuestionsValidated = 0;
let answerShuffleTrueFalseQuestionsValidated = 0;
let answerShuffleSeedDistributionsValidated = 0;
let answerShuffleSessionMovementQuestionsValidated = 0;
let answerShuffleDistributionParityValidated = false;
let questionSpeechTextQuestionsValidated = 0;
let questionSpeechTextOptionsValidated = 0;
let questionSpeechTextParityValidated = false;
let speechRuntimeCasesValidated = 0;
let speechRuntimeParityValidated = false;
let chapterQuizSessionParityValidated = 0;
let spacedRepetitionIntervalsValidated = 0;
let spacedRepetitionRuntimeParityValidated = false;
let dashboardPerChapterInputRulesValidated = 0;
let dashboardPerChapterInputParityValidated = false;
let readinessAdapterRulesValidated = 0;
let readinessAdapterRuntimeParityValidated = false;
let streakRulesValidated = 0;
let streakRulesParityValidated = false;
let xpRulesValidated = 0;
let xpRulesParityValidated = false;
let masteryRulesValidated = 0;
let masteryRulesParityValidated = false;
let weeklyRecapRuntimeCasesValidated = 0;
let weeklyRecapRuntimeParityValidated = false;
let uhrReferencesValidated = 0;
let questionSchemasValidated = 0;
let publishedQuestionTypesValidated = 0;
let questionIdSequencesValidated = 0;
let questionBilingualTextPairsValidated = 0;
let questionOptionBilingualTextPairsValidated = 0;
let questionExactSchemaKeysValidated = 0;
let questionTextFieldsNormalizedValidated = 0;
let questionSentenceEndingsValidated = 0;
let questionAuthorityBoundaryTextValidated = 0;
let questionNestedMetaStemsValidated = 0;
let questionJudgementMetaStemsValidated = 0;
let questionGeneratedTrueFalseNaturalnessValidated = 0;
let questionReferendumAdvisorySwedishNaturalnessValidated = 0;
let questionLuciaRoleEnglishNaturalnessValidated = 0;
let questionEuCooperationEnglishNaturalnessValidated = 0;
let questionReligiousFreedomParallelismValidated = 0;
let questionUmeaDemonymSwedishNaturalnessValidated = 0;
let questionGoodFridayEnglishNaturalnessValidated = 0;
let questionWorkersDayHolidayEnglishNaturalnessValidated = 0;
let questionFalseAnswerExplanationsValidated = 0;
let questionPromptTextUniquenessValidated = 0;
let questionOptionTextLabelsValidated = 0;
let questionTypeOptionCountsValidated = 0;
let questionOptionIdConventionsValidated = 0;
let trueFalseQuestions = 0;
let trueFalseOptionLabelsValidated = 0;
let questionTagsValidated = 0;
let questionBankCsvHeaderColumnsValidated = 0;
let questionBankCsvUniqueHeaderNamesValidated = false;
let questionBankCsvRowsValidated = 0;
let questionBankCsvProvenanceCounts = { uhr: 0, derived: 0, editorial: 0 };
let questionBankCsvUhrSourcePublisherRowsValidated = 0;
let questionBankCsvUhrSourcePublisherParityValidated = false;
let criminalResponsibilityCurrentnessOfficialSourcesValidated = 0;
let criminalResponsibilityCurrentnessSourceMetadataValidated = false;
let criminalResponsibilityCurrentnessSourceRetrievedAt = null;
let criminalResponsibilityCurrentnessProposalEffectiveDate = null;
let criminalResponsibilityCurrentnessValidationDate = null;
let criminalResponsibilityCurrentnessEffectiveDateRecheckDue = false;
let criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated = false;
let criminalResponsibilityCurrentnessPostEffectiveDateRecheckedAt = null;
let criminalResponsibilityCurrentnessPostEffectiveDateStatus = null;
let criminalResponsibilityCurrentnessQuestionsValidated = 0;
let criminalResponsibilityCurrentnessParityValidated = false;
let staticSiteQuestionBankQuestionsValidated = 0;
let staticSiteQuestionBankChaptersValidated = 0;
let staticSiteQuestionBankParityValidated = false;
let staticEbookOutcomeClaimPatternsValidated = 0;
let staticEbookOutcomeClaimParityValidated = false;
let staticEbookPracticalTestClaimPatternsValidated = 0;
let staticEbookPracticalTestRequiredCopyValidated = 0;
let staticEbookPracticalTestSourceUrlsValidated = 0;
let staticEbookPracticalTestCurrentnessValidated = false;
let staticEbookFactboxClaimPatternsValidated = 0;
let staticEbookFactboxRequiredCopyValidated = 0;
let staticEbookFactboxSourceUrlsValidated = 0;
let staticEbookFactboxProvenanceValidated = false;
let staticHeadMetadataTitleValidated = 0;
let staticHeadMetadataDescriptionValidated = 0;
let staticHeadMetadataOutcomeClaimPatternsValidated = 0;
let staticHeadMetadataParityValidated = false;
let staticI18nSomaliRequiredCopyValidated = 0;
let staticI18nSomaliHighFrequencyLabelsValidated = 0;
let staticI18nSomaliForbiddenFragmentsValidated = 0;
let staticI18nSomaliEnglishFallbacksValidated = 0;
let staticI18nSomaliNaturalnessValidated = false;
let staticI18nArabicRequiredCopyValidated = 0;
let staticI18nArabicHighFrequencyLabelsValidated = 0;
let staticI18nArabicForbiddenFragmentsValidated = 0;
let staticI18nArabicEnglishFallbacksValidated = 0;
let staticI18nArabicNaturalnessValidated = false;
let staticV11ReadinessUnsupportedPatternsValidated = 0;
let staticV11ReadinessRequiredCopyValidated = 0;
let staticV11ReadinessCopyParityValidated = false;
let staticValidationSyntaxFilesValidated = 0;
let staticValidationImportChecksValidated = 0;
let staticValidationSyntaxGateValidated = false;
let uhrMapExactSchemaKeysValidated = false;
let uhrMapChaptersValidated = 0;
let uhrMapSectionsValidated = 0;
let uhrMapSourceExactSchemaKeysValidated = false;
let uhrMapChapterExactSchemaKeysValidated = 0;
let uhrMapTextFieldsNormalizedValidated = 0;
let uhrMapPageRangesValidated = 0;
let uhrSourceMetadataValidated = false;
let uhrSourceRetrievedDateValidated = false;
let uhrSourceMaterialLinkParityValidated = false;
let questionChapterReferenceParityValidated = 0;
let authoredSourceQuestionsValidated = 0;
let authoredSourcePartitionQuestionsValidated = 0;
let sourcePublicationParityValidated = 0;
let generationParityValidated = false;
let chapterGenerationParityValidated = 0;
let generatedSourceMetadataParityValidated = 0;
let generatedExplanationTemplateParityValidated = 0;
let generatedPromptTemplateParityValidated = 0;
let generatedAnswerTemplateParityValidated = 0;
let generatedOptionSourceMaterialWordingValidated = 0;
let generatedSingleChoiceFillerOptionsValidated = 0;
let generatedSingleChoiceMetaStemsValidated = 0;
let generatedSingleChoiceExplanationLabelsValidated = 0;
let generatedTrueFalseExplanationMetaValidated = 0;
let generatedTagTemplateParityValidated = 0;

const PUBLISHED_SOURCE_PARITY_FIELDS = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'options',
  'correctOptionId',
  'explanationSv',
  'explanationEn',
  'uhrReference',
  'difficulty',
  'tags',
];

function validateAuthoredSourcePartition(questionsToValidate, label, startQuestionNumber, count) {
  if (!Array.isArray(questionsToValidate)) return;

  if (questionsToValidate.length !== count) {
    fail(`${label} has ${questionsToValidate.length} rows, expected ${count}`);
  }

  questionsToValidate.forEach((question, index) => {
    if (index >= count) {
      fail(`${label}[${index}] exceeds expected ${count} rows`);
      return;
    }

    const expectedId = `q${String(startQuestionNumber + index).padStart(3, '0')}`;
    const actualId = question?.id;
    if (actualId !== expectedId) {
      fail(`${label}[${index}] has id ${actualId}, expected ${expectedId}`);
      return;
    }

    authoredSourcePartitionQuestionsValidated += 1;
  });
}

function expectedPublishedSourceField(question, field) {
  if (question.type === 'true_false' && field === 'questionSv') {
    return ensureSentence(stripTrueFalsePromptSv(question.questionSv));
  }
  if (question.type === 'true_false' && field === 'questionEn') {
    return ensureSentence(stripTrueFalsePromptEn(question.questionEn));
  }
  if (field === 'options') {
    return normalizePublishedSourceOptions(question.options);
  }
  return question[field];
}

function normalizePublishedSourceOptions(options) {
  if (!Array.isArray(options)) return options;
  return options.map((option) => ({
    id: option.id,
    textSv: option.textSv,
    textEn: option.textEn,
  }));
}

function validateAuthoredSourceParity() {
  if (
    !Array.isArray(baseQuestions) ||
    !Array.isArray(additionalQuestions) ||
    !Array.isArray(localizedAdditionalQuestions) ||
    !Array.isArray(sourceQuestions)
  ) {
    return;
  }

  validateAuthoredSourcePartition(
    baseQuestions,
    'baseQuestions',
    1,
    EXPECTED_BASE_SOURCE_QUESTIONS,
  );
  validateAuthoredSourcePartition(
    additionalQuestions,
    'additionalQuestions',
    EXPECTED_BASE_SOURCE_QUESTIONS + 1,
    EXPECTED_SOURCE_QUESTIONS - EXPECTED_BASE_SOURCE_QUESTIONS,
  );

  const authoredQuestions = [...baseQuestions, ...localizedAdditionalQuestions];
  const expectedPublishedSourceQuestions = authoredQuestions;
  if (authoredQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(
      `expected ${EXPECTED_SOURCE_QUESTIONS} authored source questions, found ${authoredQuestions.length}`,
    );
  }
  if (sourceQuestions.length !== authoredQuestions.length) {
    fail(
      `sourceQuestions has ${sourceQuestions.length} rows, expected ${authoredQuestions.length} authored questions`,
    );
  }

  const seenIds = new Set();
  authoredQuestions.forEach((question, index) => {
    const label = hasText(question.id) ? question.id : `authored question[${index}]`;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    let authoredQuestionIsValid = true;

    function reject(message) {
      authoredQuestionIsValid = false;
      fail(message);
    }

    if (question.id !== expectedId) {
      reject(`authored source index ${index} has id ${question.id}, expected ${expectedId}`);
    }
    if (seenIds.has(question.id)) reject(`duplicate authored source question id ${question.id}`);
    if (hasText(question.id)) seenIds.add(question.id);
    if (question.reviewStatus !== 'reviewed') {
      reject(
        `${label} authored source reviewStatus is ${question.reviewStatus}, expected reviewed`,
      );
    }
    if (findQuestionTrueFalseStemPrefix(question)) {
      reject(`${label} authored true/false source stem contains redundant true/false prefix`);
    }
    if (findAuthoredTrueFalseExplanationBoilerplate(question)) {
      reject(
        `${label} authored true/false source explanation contains answer-judgement boilerplate`,
      );
    }

    if (validateQuestionSchema(question, index) && authoredQuestionIsValid) {
      authoredSourceQuestionsValidated += 1;
    }

    const publishedQuestion = sourceQuestions[index];
    const expectedSourceQuestion = expectedPublishedSourceQuestions[index] ?? question;
    if (!publishedQuestion) return;

    let publicationParityIsValid = true;
    if (publishedQuestion.reviewStatus !== 'published') {
      publicationParityIsValid = false;
      fail(`${label} published source reviewStatus is ${publishedQuestion.reviewStatus}`);
    }

    for (const field of PUBLISHED_SOURCE_PARITY_FIELDS) {
      const expectedValue = expectedPublishedSourceField(expectedSourceQuestion, field);
      const actualValue =
        field === 'options'
          ? normalizePublishedSourceOptions(publishedQuestion[field])
          : publishedQuestion[field];
      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        publicationParityIsValid = false;
        fail(`${label} published source ${field} does not match authored source`);
      }
    }
    if (publicationParityIsValid) sourcePublicationParityValidated += 1;
  });
}

if (focusedValidationRequested('authoredSourceParity')) {
  validateAuthoredSourceParity();
  exitWithValidationFailures();
  printValidationSummary({
    authoredSourceQuestionsValidated,
    authoredSourcePartitionQuestionsValidated,
    sourcePublicationParityValidated,
    sourceQuestions: Array.isArray(sourceQuestions) ? sourceQuestions.length : 0,
  });
  process.exit(0);
}

if (focusedValidationRequested('staticV11ReadinessCopy')) {
  validateStaticValidationSyntaxGate();
  const readinessValidation = validateStaticV11ReadinessCopy();
  staticV11ReadinessUnsupportedPatternsValidated = readinessValidation.unsupportedPatternsValidated;
  staticV11ReadinessRequiredCopyValidated = readinessValidation.requiredCopyValidated;
  staticV11ReadinessCopyParityValidated =
    staticV11ReadinessUnsupportedPatternsValidated ===
      STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS.length &&
    staticV11ReadinessRequiredCopyValidated === STATIC_V11_REQUIRED_READINESS_COPY.length;
  exitWithValidationFailures();
  printValidationSummary({
    staticV11ReadinessUnsupportedPatternsValidated,
    staticV11ReadinessRequiredCopyValidated,
    staticV11ReadinessCopyParityValidated,
    staticValidationSyntaxFilesValidated,
    staticValidationImportChecksValidated,
    staticValidationSyntaxGateValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('rewardedExamSchema')) {
  validateRewardedAdTypeSchemaParity();
  validateMockExamAccessTypeSchemaParity();
  exitWithValidationFailures();
  printValidationSummary({
    rewardedAdTypeUnionsValidated,
    rewardedAdTypeInterfacesValidated,
    rewardedAdTypeSchemaParityValidated,
    mockExamAccessTypeUnionsValidated,
    mockExamAccessTypeInterfacesValidated,
    mockExamAccessTypeSchemaParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('nativeQuizCopy')) {
  validateQuizRouteHeaderParity();
  validateQuizRouteCopyParity();
  validateChapterRouteHeaderParity();
  validateChapterRouteCopyParity();
  exitWithValidationFailures();
  printValidationSummary({
    quizRouteHeadersValidated,
    quizRouteHeaderParityValidated,
    quizRouteCopyLabelsValidated,
    quizRouteCopyParityValidated,
    chapterRouteHeadersValidated,
    chapterRouteHeaderParityValidated,
    chapterRouteCopyLabelsValidated,
    chapterRouteCopyParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('legalRouteParity')) {
  validateLegalRouteHeaderParity();
  validateLegalSwedishEnglishTokenGuard();
  validateLegalInternalMonetizationKeyGuard();
  exitWithValidationFailures();
  printValidationSummary({
    legalRouteHeadersValidated,
    legalRouteHeaderParityValidated,
    swedishPrivacyStreakCopyNaturalnessValidated,
    legalSwedishEnglishTokenGuardValidated,
    legalSwedishEnglishTokenGuardParityValidated,
    legalInternalMonetizationKeyGuardValidated,
    legalInternalMonetizationKeyGuardParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('settingsRouteCopy')) {
  validateSettingsRouteCopyParity();
  exitWithValidationFailures();
  printValidationSummary({
    settingsRouteCopyLabelsValidated,
    settingsRouteCopyParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('staticHeadMetadata')) {
  validateStaticValidationSyntaxGate();
  validateStaticHeadMetadataParity();
  exitWithValidationFailures();
  printValidationSummary({
    staticHeadMetadataTitleValidated,
    staticHeadMetadataDescriptionValidated,
    staticHeadMetadataOutcomeClaimPatternsValidated,
    staticHeadMetadataParityValidated,
    staticValidationSyntaxFilesValidated,
    staticValidationImportChecksValidated,
    staticValidationSyntaxGateValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('settingsStore')) {
  validateSettingsRouteHeaderParity();
  validateSettingsRouteCopyParity();
  validateSettingsRouteScrollParity();
  validateSettingsStoreSchemaParity();
  validateSettingsDailyGoalParity();
  validateSettingsAudioParity();
  exitWithValidationFailures();
  printValidationSummary({
    settingsRouteHeadersValidated,
    settingsRouteHeaderParityValidated,
    settingsRouteCopyLabelsValidated,
    settingsRouteCopyParityValidated,
    settingsRouteScrollRulesValidated,
    settingsRouteScrollParityValidated,
    settingsStoreFieldsValidated,
    settingsStoreSchemaParityValidated,
    settingsDailyGoalOptionsValidated,
    settingsDailyGoalParityValidated,
    settingsAudioLabelsValidated,
    settingsAudioParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('homeRouteCopy')) {
  validateStaticValidationSyntaxGate();
  validateHomeRouteHeaderParity();
  validateHomeRouteCopyParity();
  validateHomeRouteSwedishMistakeReviewCopyNaturalness();
  {
    const homeMountValidation = validateCountdownBannerHomeMountParity();
    countdownBannerHomeMountRulesValidated = homeMountValidation.rulesValidated;
    countdownBannerHomeMountParityValidated = homeMountValidation.homeMountParity;
  }
  exitWithValidationFailures();
  printValidationSummary({
    staticValidationSyntaxFilesValidated,
    staticValidationImportChecksValidated,
    staticValidationSyntaxGateValidated,
    homeRouteHeadersValidated,
    homeRouteHeaderParityValidated,
    homeRouteCopyLabelsValidated,
    homeRouteCopyParityValidated,
    homeRouteInternalBenchmarkCopyValidated,
    homeRouteSwedishMistakeReviewCopyNaturalnessValidated,
    countdownBannerHomeMountRulesValidated,
    countdownBannerHomeMountParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('answerOptionAccessibility')) {
  validateAnswerOptionAccessibilityParity();
  exitWithValidationFailures();
  printValidationSummary({
    answerOptionAccessibilityRulesValidated,
    answerOptionAccessibilityParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('homeSvMistakeReviewCopy')) {
  validateStaticValidationSyntaxGate();
  validateHomeRouteSwedishMistakeReviewCopyNaturalness();
  exitWithValidationFailures();
  printValidationSummary({
    staticValidationSyntaxFilesValidated,
    staticValidationImportChecksValidated,
    staticValidationSyntaxGateValidated,
    homeRouteSwedishMistakeReviewCopyNaturalnessValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('progressSchemaParity')) {
  validateProgressQuestionSchemaParity();
  validateProgressTypeSchemaParity();
  validateProgressStoreSchemaParity();
  exitWithValidationFailures();
  printValidationSummary({
    progressQuestionFieldsValidated,
    progressQuestionSchemaParityValidated,
    progressTypeUnionsValidated,
    progressTypeInterfacesValidated,
    progressTypeSchemaParityValidated,
    progressStoreFieldsValidated,
    progressStoreSchemaParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('xpRules')) {
  validateXpRules();
  exitWithValidationFailures();
  printValidationSummary({
    xpRulesValidated,
    xpRulesParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('streakRules')) {
  validateStreakRules();
  exitWithValidationFailures();
  printValidationSummary({
    streakRulesValidated,
    streakRulesParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('readinessAdapterRules')) {
  validateReadinessAdapterRules();
  exitWithValidationFailures();
  printValidationSummary({
    readinessAdapterRulesValidated,
    readinessAdapterRuntimeParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('questionReportLinkParity')) {
  validateQuestionReportLinkParity();
  exitWithValidationFailures();
  printValidationSummary({
    questionReportLinkRulesValidated,
    questionReportLinkParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('answerFeedbackParity')) {
  validateAnswerValidationTypeSchemaParity();
  validateAnswerFeedbackParity();
  exitWithValidationFailures();
  printValidationSummary({
    publishedQuestions: Array.isArray(questions)
      ? questions.filter((question) => question.reviewStatus === 'published').length
      : 0,
    answerValidationTypeUnionsValidated,
    answerValidationTypeInterfacesValidated,
    answerValidationTypeSchemaParityValidated,
    answerFeedbackQuestionsValidated,
    answerFeedbackOptionsValidated,
    answerFeedbackRuntimeParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('aboutTheTestRouteCopy')) {
  validateAboutTheTestRouteCopyParity();
  validateAboutTheTestSeenEffectParity();
  validateCitizenshipRequirementsLimitedSeatParity();
  exitWithValidationFailures();
  printValidationSummary({
    aboutTheTestRouteCopyLabelsValidated,
    aboutTheTestRouteCopyParityValidated,
    aboutTheTestOfficialSourceUrlsValidated,
    aboutTheTestOfficialSourceRetrievedDateValidated,
    aboutTheTestSeenEffectRulesValidated,
    aboutTheTestSeenEffectParityValidated,
    aboutTheTestSwedishMockprovCopyGuardValidated,
    citizenshipRequirementsLimitedSeatCopyValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('onboardingRouteCopy')) {
  validateOnboardingRouteHeaderParity();
  validateOnboardingRouteCopyParity();
  validateFirstRunAboutModalSuppressionParity();
  exitWithValidationFailures();
  printValidationSummary({
    onboardingRouteHeadersValidated,
    onboardingRouteHeaderParityValidated,
    onboardingRouteCopyLabelsValidated,
    onboardingRouteCopyParityValidated,
    firstRunAboutModalSuppressedRoutesValidated,
    firstRunAboutModalSuppressionParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('mockExamRuntimeParity')) {
  validateMockExamConfig(
    defaultMockExamConfig,
    Array.isArray(questions)
      ? questions.filter((question) => question.reviewStatus === 'published').length
      : 0,
  );
  validateMockExamConfigTypeSchemaParity();
  validateMockExamRuntimeParity(defaultMockExamConfig);
  validateMockExamTimerParity(defaultMockExamConfig);
  validateExamRouteHeaderParity();
  validateExamRouteCopyParity();
  exitWithValidationFailures();
  printValidationSummary({
    mockExamConfigTypeFieldsValidated,
    mockExamConfigTypeSchemaParityValidated,
    mockExamConfigExactSchemaKeysValidated,
    mockExamConfigValidated,
    mockExamRuntimeParityValidated,
    mockExamChapterBalanceParityValidated,
    mockExamTimerParityValidated,
    examRouteHeadersValidated,
    examRouteHeaderParityValidated,
    examRouteCopyLabelsValidated,
    examRouteCopyParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('searchRouteQueryHydration')) {
  validateSearchRouteQueryHydrationParity();
  exitWithValidationFailures();
  printValidationSummary({
    searchRouteQueryHydrationRulesValidated,
    searchRouteQueryHydrationParityValidated,
  });
  process.exit(0);
}

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(baseQuestions)) fail('baseQuestions export is not an array');
if (!Array.isArray(additionalQuestions)) fail('additionalQuestions export is not an array');
if (!Array.isArray(localizedAdditionalQuestions)) {
  fail('localizedAdditionalQuestions export is not an array');
}
if (!Array.isArray(glossaryTerms)) fail('glossaryTerms export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');
if (!Array.isArray(sourceQuestions)) fail('sourceQuestions export is not an array');
if (!Array.isArray(generatedPublishedQuestions)) {
  fail('generatedPublishedQuestions export is not an array');
}
if (!Array.isArray(uxBenchmarks)) fail('uxBenchmarks export is not an array');
if (!Array.isArray(supportedLanguages)) fail('supportedLanguages export is not an array');
if (
  !localizationStrings ||
  typeof localizationStrings !== 'object' ||
  Array.isArray(localizationStrings)
) {
  fail('strings export is not an object');
}
{
  const timelineValidation = validateCitizenshipTimeline();
  citizenshipRulesEffectiveDateValidated = timelineValidation.rulesDate;
  civicKnowledgeTestFirstSittingDateValidated = timelineValidation.firstSittingDate;
  civicKnowledgeTestDeadlineDateValidated = timelineValidation.testDeadlineDate;
  citizenshipTimelineSourceUrlsValidated = timelineValidation.sourceUrlsValidated;
  citizenshipTimelineDateParityValidated = timelineValidation.dateParity;
  countdownBannerTimelineCopyParityValidated = timelineValidation.countdownCopyParity;
  const homeMountValidation = validateCountdownBannerHomeMountParity();
  countdownBannerHomeMountRulesValidated = homeMountValidation.rulesValidated;
  countdownBannerHomeMountParityValidated = homeMountValidation.homeMountParity;
}
if (typeof generateExam !== 'function') fail('generateExam export is not a function');
if (typeof buildExamReviewItems !== 'function') {
  fail('buildExamReviewItems export is not a function');
}
if (typeof scoreExam !== 'function') fail('scoreExam export is not a function');
if (typeof buildExamChapterBreakdownItems !== 'function') {
  fail('buildExamChapterBreakdownItems export is not a function');
}
if (typeof formatExamTime !== 'function') fail('formatExamTime export is not a function');
if (typeof shouldAutoSubmitExam !== 'function') {
  fail('shouldAutoSubmitExam export is not a function');
}
staticEbookOutcomeClaimPatternsValidated = validateStaticEbookOutcomeClaimPatterns();
staticEbookOutcomeClaimParityValidated =
  staticEbookOutcomeClaimPatternsValidated ===
  STATIC_EBOOK_UNSUPPORTED_OUTCOME_CLAIM_PATTERNS.length;
{
  const studyTermValidation = validateStaticSiteSwedishStudyTerms();
  staticSiteSwedishStudyTermsValidated =
    studyTermValidation.forbiddenTermsValidated + studyTermValidation.requiredTermsValidated;
  staticSiteSwedishStudyTermNaturalnessValidated =
    studyTermValidation.forbiddenTermsValidated ===
      STATIC_SITE_SWEDISH_STUDY_TERM_FORBIDDEN.length &&
    studyTermValidation.requiredTermsValidated === STATIC_SITE_SWEDISH_STUDY_TERM_REQUIRED.length;
}
{
  const grammarToneValidation = validateStaticSiteSwedishGrammarTone();
  staticSiteSwedishGrammarToneValidated =
    grammarToneValidation.forbiddenPhrasesValidated +
    grammarToneValidation.requiredPhrasesValidated;
  staticSiteSwedishGrammarToneNaturalnessValidated =
    grammarToneValidation.forbiddenPhrasesValidated ===
      STATIC_SITE_SWEDISH_GRAMMAR_TONE_FORBIDDEN.length &&
    grammarToneValidation.requiredPhrasesValidated ===
      STATIC_SITE_SWEDISH_GRAMMAR_TONE_REQUIRED.length;
}
{
  const ebookStudyTermValidation = validateStaticEbookSwedishStudyTerms();
  staticEbookSwedishStudyTermsValidated =
    ebookStudyTermValidation.forbiddenTermsValidated +
    ebookStudyTermValidation.requiredTermsValidated;
  staticEbookSwedishStudyTermNaturalnessValidated =
    ebookStudyTermValidation.forbiddenTermsValidated ===
      STATIC_EBOOK_SWEDISH_STUDY_TERM_FORBIDDEN.length &&
    ebookStudyTermValidation.requiredTermsValidated ===
      STATIC_EBOOK_SWEDISH_STUDY_TERM_REQUIRED.length;
}
{
  const i18nPunctuationValidation = validateStaticI18nChinesePunctuation();
  staticI18nChinesePunctuationLocalesValidated = i18nPunctuationValidation.localesValidated;
  staticI18nChinesePunctuationValuesValidated = i18nPunctuationValidation.valuesValidated;
  staticI18nChinesePunctuationParityValidated =
    i18nPunctuationValidation.valid &&
    staticI18nChinesePunctuationLocalesValidated === STATIC_I18N_CHINESE_LOCALES.length &&
    staticI18nChinesePunctuationValuesValidated > 0;
}
{
  const practicalTestValidation = validateStaticEbookPracticalTestClaims();
  staticEbookPracticalTestClaimPatternsValidated =
    practicalTestValidation.unsupportedPracticalClaimsValidated;
  staticEbookPracticalTestRequiredCopyValidated = practicalTestValidation.requiredCopyValidated;
  staticEbookPracticalTestSourceUrlsValidated = practicalTestValidation.sourceUrlsValidated;
  staticEbookPracticalTestCurrentnessValidated =
    staticEbookPracticalTestClaimPatternsValidated ===
      STATIC_EBOOK_UNSUPPORTED_PRACTICAL_TEST_CLAIM_PATTERNS.length &&
    staticEbookPracticalTestRequiredCopyValidated ===
      STATIC_EBOOK_PRACTICAL_TEST_REQUIRED_COPY.length &&
    staticEbookPracticalTestSourceUrlsValidated === STATIC_EBOOK_PRACTICAL_TEST_SOURCE_URLS.length;
}
{
  const factboxValidation = validateStaticEbookFactboxProvenance();
  staticEbookFactboxClaimPatternsValidated = factboxValidation.unsupportedFactboxClaimsValidated;
  staticEbookFactboxRequiredCopyValidated = factboxValidation.requiredCopyValidated;
  staticEbookFactboxSourceUrlsValidated = factboxValidation.sourceUrlsValidated;
  staticEbookFactboxProvenanceValidated =
    staticEbookFactboxClaimPatternsValidated === STATIC_EBOOK_UNSUPPORTED_FACTBOX_PATTERNS.length &&
    staticEbookFactboxRequiredCopyValidated === STATIC_EBOOK_FACTBOX_REQUIRED_COPY.length &&
    staticEbookFactboxSourceUrlsValidated === STATIC_EBOOK_FACTBOX_SOURCE_URLS.length;
}
{
  const somaliI18nValidation = validateStaticI18nSomaliNaturalness();
  staticI18nSomaliRequiredCopyValidated = somaliI18nValidation.requiredCopyValidated;
  staticI18nSomaliHighFrequencyLabelsValidated = somaliI18nValidation.highFrequencyLabelsValidated;
  staticI18nSomaliForbiddenFragmentsValidated = somaliI18nValidation.forbiddenFragmentsValidated;
  staticI18nSomaliEnglishFallbacksValidated = somaliI18nValidation.englishFallbacksValidated;
  staticI18nSomaliNaturalnessValidated =
    staticI18nSomaliRequiredCopyValidated ===
      Object.keys(STATIC_I18N_SOMALI_EXPECTED_COPY).length &&
    staticI18nSomaliHighFrequencyLabelsValidated ===
      STATIC_I18N_SOMALI_HIGH_FREQUENCY_KEYS.length &&
    staticI18nSomaliForbiddenFragmentsValidated === STATIC_I18N_SOMALI_FORBIDDEN_FRAGMENTS.length &&
    staticI18nSomaliEnglishFallbacksValidated ===
      countStaticI18nEnglishFallbackChecks(STATIC_I18N_SOMALI_HIGH_FREQUENCY_KEYS);
}
{
  const arabicI18nValidation = validateStaticI18nArabicNaturalness();
  staticI18nArabicRequiredCopyValidated = arabicI18nValidation.requiredCopyValidated;
  staticI18nArabicHighFrequencyLabelsValidated = arabicI18nValidation.highFrequencyLabelsValidated;
  staticI18nArabicForbiddenFragmentsValidated = arabicI18nValidation.forbiddenFragmentsValidated;
  staticI18nArabicEnglishFallbacksValidated = arabicI18nValidation.englishFallbacksValidated;
  staticI18nArabicNaturalnessValidated =
    staticI18nArabicRequiredCopyValidated ===
      Object.keys(STATIC_I18N_ARABIC_EXPECTED_COPY).length &&
    staticI18nArabicHighFrequencyLabelsValidated ===
      STATIC_I18N_ARABIC_HIGH_FREQUENCY_KEYS.length &&
    staticI18nArabicForbiddenFragmentsValidated === STATIC_I18N_ARABIC_FORBIDDEN_FRAGMENTS.length &&
    staticI18nArabicEnglishFallbacksValidated ===
      countStaticI18nEnglishFallbackChecks(STATIC_I18N_ARABIC_HIGH_FREQUENCY_KEYS);
}
{
  const readinessValidation = validateStaticV11ReadinessCopy();
  staticV11ReadinessUnsupportedPatternsValidated = readinessValidation.unsupportedPatternsValidated;
  staticV11ReadinessRequiredCopyValidated = readinessValidation.requiredCopyValidated;
  staticV11ReadinessCopyParityValidated =
    staticV11ReadinessUnsupportedPatternsValidated ===
      STATIC_V11_UNSUPPORTED_READINESS_COPY_PATTERNS.length &&
    staticV11ReadinessRequiredCopyValidated === STATIC_V11_REQUIRED_READINESS_COPY.length;
}
if (typeof scoreAnswers !== 'function') fail('scoreAnswers export is not a function');
if (typeof isCorrectAnswer !== 'function') fail('isCorrectAnswer export is not a function');
if (typeof getAnswerOptionFeedback !== 'function') {
  fail('getAnswerOptionFeedback export is not a function');
}
if (typeof shuffleQuestionOptionsForSession !== 'function') {
  fail('shuffleQuestionOptionsForSession export is not a function');
}
if (typeof summarizeAnswerShuffleDistribution !== 'function') {
  fail('summarizeAnswerShuffleDistribution export is not a function');
}
if (typeof answerShuffleDistributionIsBalanced !== 'function') {
  fail('answerShuffleDistributionIsBalanced export is not a function');
}
if (typeof ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE !== 'number') {
  fail('ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE export is not a number');
}
if (focusedValidationRequested('answerShuffleParity')) {
  validateAnswerShuffleDistributionParity();
  exitWithValidationFailures();
  printValidationSummary({
    answerShuffleSingleChoiceQuestionsValidated,
    answerShuffleTrueFalseQuestionsValidated,
    answerShuffleSeedDistributionsValidated,
    answerShuffleSessionMovementQuestionsValidated,
    answerShuffleDistributionParityValidated,
    publishedQuestions: Array.isArray(questions)
      ? questions.filter((question) => question.reviewStatus === 'published').length
      : 0,
  });
  process.exit(0);
}
if (typeof buildQuestionSpeechText !== 'function') {
  fail('buildQuestionSpeechText export is not a function');
}
if (typeof speakSwedish !== 'function') fail('speakSwedish export is not a function');
if (typeof stopSpeech !== 'function') fail('stopSpeech export is not a function');
if (typeof getPracticeQuestionForSession !== 'function') {
  fail('getPracticeQuestionForSession export is not a function');
}
if (typeof getChapterQuizSessionId !== 'function') {
  fail('getChapterQuizSessionId export is not a function');
}
if (
  !usePracticeSessionStore ||
  typeof usePracticeSessionStore.getState !== 'function' ||
  typeof usePracticeSessionStore.setState !== 'function'
) {
  fail('usePracticeSessionStore export is not a Zustand store');
}
if (typeof getPracticeInterstitialShowKey !== 'function') {
  fail('getPracticeInterstitialShowKey export is not a function');
}
if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) {
  fail('badgeCatalog export is not an object');
}
if (typeof deriveBadges !== 'function') fail('deriveBadges export is not a function');
if (!Array.isArray(spacedRepetitionSchedule)) {
  fail('spacedRepetitionSchedule export is not an array');
}
if (typeof getNextReviewAt !== 'function') fail('getNextReviewAt export is not a function');
if (typeof calculateStreak !== 'function') fail('calculateStreak export is not a function');
if (typeof calculateStreakWithFreeze !== 'function') {
  fail('calculateStreakWithFreeze export is not a function');
}
if (typeof refillFreezes !== 'function') fail('refillFreezes export is not a function');
if (typeof calculateAnswerXp !== 'function') fail('calculateAnswerXp export is not a function');
if (typeof calculateQuizCompletionXp !== 'function') {
  fail('calculateQuizCompletionXp export is not a function');
}
if (typeof calculateLevel !== 'function') fail('calculateLevel export is not a function');
if (typeof calculateMastery !== 'function') fail('calculateMastery export is not a function');
if (typeof calculateChapterMastery !== 'function') {
  fail('calculateChapterMastery export is not a function');
}
if (typeof findWeakChapterIds !== 'function') fail('findWeakChapterIds export is not a function');
if (typeof generateWeeklyRecap !== 'function') {
  fail('generateWeeklyRecap export is not a function');
}
if (!isObjectRecord(colors)) fail('theme colors export is not an object');
if (!isObjectRecord(motion)) fail('theme motion export is not an object');
if (!isObjectRecord(radius)) fail('theme radius export is not an object');
if (!isObjectRecord(shadows)) fail('theme shadows export is not an object');
if (!isObjectRecord(space)) fail('theme space export is not an object');
if (!isObjectRecord(typography)) fail('theme typography export is not an object');
if (!isObjectRecord(adsConfig)) fail('adsConfig export is not an object');
if (typeof shouldShowAd !== 'function') fail('shouldShowAd export is not a function');
if (typeof shouldSuppressLaunchPopupAdForPath !== 'function') {
  fail('shouldSuppressLaunchPopupAdForPath export is not a function');
}
if (!isObjectRecord(consentConfig)) fail('consentConfig export is not an object');
if (!isObjectRecord(FREE_ENTITLEMENTS)) fail('FREE_ENTITLEMENTS export is not an object');
if (!isObjectRecord(PREMIUM_ENTITLEMENTS)) fail('PREMIUM_ENTITLEMENTS export is not an object');
if (!isObjectRecord(REMOVE_ADS_ENTITLEMENTS)) {
  fail('REMOVE_ADS_ENTITLEMENTS export is not an object');
}
if (typeof hasAdsDisabled !== 'function') fail('hasAdsDisabled export is not a function');
if (typeof isPremiumUser !== 'function') fail('isPremiumUser export is not a function');
if (!isObjectRecord(premiumConfig)) fail('premiumConfig export is not an object');
if (!hasText(REMOVE_ADS_PRICE_LABEL)) fail('REMOVE_ADS_PRICE_LABEL export is missing');
if (!hasText(REMOVE_ADS_PRODUCT_ID)) fail('REMOVE_ADS_PRODUCT_ID export is missing');
if (!isObjectRecord(releaseMonetizationPolicy)) {
  fail('releaseMonetizationPolicy export is not an object');
}
if (typeof isReleaseMonetizationPolicyReady !== 'function') {
  fail('isReleaseMonetizationPolicyReady export is not a function');
}

function getExpoPluginEntry(plugins, pluginName) {
  return plugins.find((plugin) => {
    if (typeof plugin === 'string') return plugin === pluginName;
    if (Array.isArray(plugin)) return plugin[0] === pluginName;
    return false;
  });
}

function getPluginConfig(pluginEntry) {
  return Array.isArray(pluginEntry) && pluginEntry[1] && typeof pluginEntry[1] === 'object'
    ? pluginEntry[1]
    : undefined;
}

function validateAppConfigSchema() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  const expo = appConfig?.expo;
  if (!expo || typeof expo !== 'object' || Array.isArray(expo)) {
    reject('app.json expo config is missing');
    return;
  }

  if (expo.name !== 'Almost Swedish') {
    reject('app.json expo.name must identify the release app');
  }
  if (expo.slug !== 'almost-swedish') {
    reject('app.json expo.slug must be almost-swedish');
  }
  if (expo.scheme !== expo.slug) {
    reject('app.json expo.scheme must match expo.slug');
  }
  if (expo.version !== packageMetadata.version) {
    reject(
      `app.json expo.version ${expo.version} must match package.json version ${packageMetadata.version}`,
    );
  }
  if (expo.orientation !== 'portrait') {
    reject('app.json expo.orientation must be portrait');
  }
  if (expo.userInterfaceStyle !== 'light') {
    reject('app.json expo.userInterfaceStyle must be light');
  }
  if (expo.newArchEnabled !== true) {
    reject('app.json expo.newArchEnabled must be true');
  }
  if (expo.ios?.bundleIdentifier !== EXPECTED_APP_NATIVE_IDENTIFIER) {
    reject(`app.json ios.bundleIdentifier must be ${EXPECTED_APP_NATIVE_IDENTIFIER}`);
  }
  if (expo.android?.package !== EXPECTED_APP_NATIVE_IDENTIFIER) {
    reject(`app.json android.package must be ${EXPECTED_APP_NATIVE_IDENTIFIER}`);
  }

  const plugins = expo.plugins;
  if (!Array.isArray(plugins)) {
    reject('app.json expo.plugins must be an array');
  } else {
    for (const pluginName of EXPECTED_APP_CONFIG_PLUGINS) {
      const pluginEntry = getExpoPluginEntry(plugins, pluginName);
      if (!pluginEntry) {
        reject(`app.json missing required plugin ${pluginName}`);
      } else {
        appConfigPluginsValidated += 1;
      }
    }

    const googleAdsConfig = getPluginConfig(
      getExpoPluginEntry(plugins, 'react-native-google-mobile-ads'),
    );
    if (!googleAdsConfig) {
      reject('app.json react-native-google-mobile-ads plugin must include config');
    } else {
      const adMobAppIdPattern = /^ca-app-pub-\d{16}~\d{10}$/;
      if (!adMobAppIdPattern.test(String(googleAdsConfig.androidAppId ?? ''))) {
        reject('app.json react-native-google-mobile-ads androidAppId must be configured');
      }
      if (!adMobAppIdPattern.test(String(googleAdsConfig.iosAppId ?? ''))) {
        reject('app.json react-native-google-mobile-ads iosAppId must be configured');
      }
      if (googleAdsConfig.delayAppMeasurementInit !== true) {
        reject('app.json react-native-google-mobile-ads must delay app measurement initialization');
      }
      if (googleAdsConfig.userTrackingUsageDescription !== EXPECTED_TRACKING_PERMISSION) {
        reject('app.json Google ads tracking usage description must match ATT permission copy');
      }
    }

    const trackingConfig = getPluginConfig(
      getExpoPluginEntry(plugins, 'expo-tracking-transparency'),
    );
    if (!trackingConfig) {
      reject('app.json expo-tracking-transparency plugin must include config');
    } else if (trackingConfig.userTrackingPermission !== EXPECTED_TRACKING_PERMISSION) {
      reject('app.json ATT permission copy must match Google ads tracking usage description');
    }
  }

  if (valid && appConfigPluginsValidated === EXPECTED_APP_CONFIG_PLUGINS.length) {
    appConfigSchemaValidated = true;
  }
}

function validateLaunchAdRouteSuppressionParity() {
  let valid = true;
  let rootLayout = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  const suppressedRoutes = adsConfig?.suppressedLaunchPopupRoutes;
  if (!Array.isArray(suppressedRoutes)) {
    reject('adsConfig.suppressedLaunchPopupRoutes must be an array');
  } else if (!arrayEquals(suppressedRoutes, EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES)) {
    reject(
      `launch popup suppressed routes are ${JSON.stringify(
        suppressedRoutes,
      )}, expected ${JSON.stringify(EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES)}`,
    );
  }

  for (const route of EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES) {
    const routeFile = EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTE_FILES[route];
    if (!fs.existsSync(path.join(repoRoot, routeFile))) {
      reject(`${route} launch-ad suppression route file ${routeFile} is missing`);
      continue;
    }

    const routeIsSuppressed =
      typeof shouldSuppressLaunchPopupAdForPath === 'function' &&
      shouldSuppressLaunchPopupAdForPath(route) === true &&
      shouldSuppressLaunchPopupAdForPath(`${route}/nested`) === true;
    if (!routeIsSuppressed) {
      reject(`${route} must suppress the launch popup ad, including nested paths`);
    } else {
      launchAdSuppressedRoutesValidated += 1;
    }
  }

  if (typeof shouldSuppressLaunchPopupAdForPath === 'function') {
    for (const studyRoute of ['/', '/home', '/learn', '/mistakes', '/profile']) {
      if (shouldSuppressLaunchPopupAdForPath(studyRoute)) {
        reject(`${studyRoute} must remain eligible for the launch popup ad`);
      }
    }
  }

  try {
    rootLayout = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');
  } catch (error) {
    reject(`app/_layout.tsx could not be read: ${error.message}`);
    return;
  }

  if (!rootLayout.includes('usePathname()')) {
    reject('root layout must read the current pathname before rendering the launch ad');
  }
  if (!rootLayout.includes('shouldSuppressLaunchPopupAdForPath(pathname)')) {
    reject('root layout must derive launch ad suppression from current pathname');
  }
  if (!rootLayout.includes('!suppressLaunchPopupAd && entitlementsReady')) {
    reject('root layout must gate LaunchPopupAd on route suppression and entitlement readiness');
  }

  if (
    valid &&
    launchAdSuppressedRoutesValidated === EXPECTED_LAUNCH_POPUP_SUPPRESSED_ROUTES.length
  ) {
    launchAdRouteSuppressionParityValidated = true;
  }
}

function validateTabNavigationParity() {
  let valid = true;
  let tabLayout = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    tabLayout = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/_layout.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/_layout.tsx could not be read: ${error.message}`);
    return;
  }

  for (const rule of EXPECTED_TAB_NAVIGATION_RULES) {
    if (!rule.pattern.test(tabLayout)) {
      reject(`tab layout must satisfy ${rule.label}`);
    } else {
      tabNavigationRulesValidated += 1;
    }
  }

  if (tabLayout.includes('⏷')) {
    reject('tab layout must not include visible placeholder tab glyphs');
  }

  if (/exam:\s*'Prov'/.test(tabLayout)) {
    reject('tab layout must not expose bare Swedish exam tab copy');
  }

  for (const route of EXPECTED_TAB_NAVIGATION_ROUTES) {
    const routePattern = new RegExp(
      `<Tabs\\.Screen\\s+name="${route.routeName}"\\s+options=\\{getTabOptions\\(copy\\.${route.routeName}\\)\\}`,
    );
    const svPattern = new RegExp(`${route.routeName}: '${escapeRegExp(route.sv)}'`);
    const enPattern = new RegExp(`${route.routeName}: '${escapeRegExp(route.en)}'`);

    if (!routePattern.test(tabLayout)) {
      reject(`${route.routeName} tab must use getTabOptions(copy.${route.routeName})`);
      continue;
    }
    if (!svPattern.test(tabLayout) || !enPattern.test(tabLayout)) {
      reject(`${route.routeName} tab must define Swedish and English titles`);
      continue;
    }

    tabNavigationRoutesValidated += 1;
  }

  if (
    valid &&
    tabNavigationRulesValidated === EXPECTED_TAB_NAVIGATION_RULES.length &&
    tabNavigationRoutesValidated === EXPECTED_TAB_NAVIGATION_ROUTES.length
  ) {
    tabNavigationParityValidated = true;
  }
}

function validateAdPlacementRouteParity() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  const safePlacements = Array.isArray(adsConfig?.safePlacements) ? adsConfig.safePlacements : [];
  const blockedPlacements = Array.isArray(adsConfig?.blockedPlacements)
    ? adsConfig.blockedPlacements
    : [];

  for (const spec of EXPECTED_ROUTE_AD_PLACEMENTS) {
    let source = '';
    let routeIsValid = true;

    try {
      source = fs.readFileSync(path.join(repoRoot, spec.file), 'utf8');
    } catch (error) {
      reject(`${spec.file} could not be read for ad placement parity: ${error.message}`);
      continue;
    }

    if (!source.includes(`components/monetization/${spec.component}`)) {
      reject(`${spec.file} must import ${spec.component} from the monetization components`);
      routeIsValid = false;
    }

    if (!spec.pattern.test(source)) {
      reject(`${spec.file} must render ${spec.component} placement ${spec.placement}`);
      routeIsValid = false;
    }

    if (!safePlacements.includes(spec.placement)) {
      reject(`adsConfig.safePlacements must include routed placement ${spec.placement}`);
      routeIsValid = false;
    }

    if (typeof shouldShowAd === 'function') {
      if (!shouldShowAd(spec.placement, { adsDisabled: false })) {
        reject(`${spec.placement} must render for free users with test ad config`);
        routeIsValid = false;
      }
      if (shouldShowAd(spec.placement, { adsDisabled: true })) {
        reject(`${spec.placement} must be hidden after Remove Ads is active`);
        routeIsValid = false;
      }
    }

    if (spec.component === 'NativeAdCard') {
      const consentAwareShouldShowPattern = new RegExp(
        `shouldShowAd\\(\\s*'${spec.placement}'\\s*,\\s*resolvedEntitlements\\s*,\\s*mobileAdsConsent\\.decision\\.consentDecision\\s*,\\s*Platform\\.OS\\s*,?\\s*\\)`,
      );
      const webFallbackShouldShowPattern = new RegExp(
        `shouldShowAd\\(\\s*'${spec.placement}'\\s*,\\s*resolvedEntitlements\\s*,\\s*WEB_AD_FALLBACK_CONSENT_DECISION\\s*,?\\s*\\)`,
      );
      const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
      const adBannerSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
        'utf8',
      );
      const nativeAdCardSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
        'utf8',
      );
      const nativeAdCardNativeSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/NativeAdCard.native.tsx'),
        'utf8',
      );
      const nativeAdCopySource = fs.readFileSync(
        path.join(repoRoot, 'lib/monetization/adCopy.ts'),
        'utf8',
      );
      if (!adsSource.includes('export const WEB_AD_FALLBACK_CONSENT_DECISION')) {
        reject('ads.ts must export the shared web fallback consent decision');
        routeIsValid = false;
      }
      if (!adBannerSource.includes('WEB_AD_FALLBACK_CONSENT_DECISION')) {
        reject('AdBanner web fallback must use the shared web fallback consent decision');
        routeIsValid = false;
      }
      if (!webFallbackShouldShowPattern.test(nativeAdCardSource)) {
        reject(`NativeAdCard must gate ${spec.placement} through shouldShowAd`);
        routeIsValid = false;
      }
      if (!nativeAdCardSource.includes('WEB_AD_FALLBACK_CONSENT_DECISION')) {
        reject('NativeAdCard web fallback must use the shared web fallback consent decision');
        routeIsValid = false;
      }
      if (nativeAdCardSource.includes('react-native-google-mobile-ads')) {
        reject('NativeAdCard web fallback must not import native-only ad SDK APIs');
        routeIsValid = false;
      }
      if (
        !nativeAdCardSource.includes("const resultsNativeUnit = getAdUnit('results_native');") ||
        !nativeAdCardSource.includes(
          'getNativeAdCardCopy(language, { testOnly: resultsNativeUnit?.testOnly })',
        )
      ) {
        reject('NativeAdCard web fallback must choose live/test copy from the configured unit');
        routeIsValid = false;
      }
      if (!nativeAdCardNativeSource.includes('NativeAd.createForAdRequest')) {
        reject('NativeAdCard native placement must load results_native through NativeAd');
        routeIsValid = false;
      }
      if (!nativeAdCardNativeSource.includes('NativeAdView')) {
        reject('NativeAdCard native placement must render NativeAdView');
        routeIsValid = false;
      }
      if (!nativeAdCardNativeSource.includes('NativeAsset')) {
        reject('NativeAdCard native placement must register visible native ad assets');
        routeIsValid = false;
      }
      if (!nativeAdCardNativeSource.includes('NativeMediaView')) {
        reject('NativeAdCard native placement must render NativeMediaView');
        routeIsValid = false;
      }
      if (
        !nativeAdCardNativeSource.includes(`getPlatformAdUnitId('${spec.placement}', Platform.OS)`)
      ) {
        reject(`NativeAdCard native placement must resolve the ${spec.placement} unit by platform`);
        routeIsValid = false;
      }
      if (!consentAwareShouldShowPattern.test(nativeAdCardNativeSource)) {
        reject(
          `NativeAdCard native placement must gate ${spec.placement} through consent-aware shouldShowAd`,
        );
        routeIsValid = false;
      }
      if (!nativeAdCardNativeSource.includes('requestNonPersonalizedAdsOnly')) {
        reject('NativeAdCard native placement must pass non-personalized ad request options');
        routeIsValid = false;
      }
      if (!/\.destroy\(\)/.test(nativeAdCardNativeSource)) {
        reject('NativeAdCard native placement must destroy loaded native ads on cleanup');
        routeIsValid = false;
      }
      if (
        !nativeAdCardNativeSource.includes(
          "const resultsNativeUnit = getAdUnit('results_native');",
        ) ||
        !nativeAdCardNativeSource.includes(
          'getNativeAdCardCopy(language, { testOnly: resultsNativeUnit?.testOnly })',
        )
      ) {
        reject('NativeAdCard native placement must choose live/test copy from the configured unit');
        routeIsValid = false;
      }
      if (!nativeAdCopySource.includes('getNativeAdCardCopy')) {
        reject('NativeAdCard copy must expose a live/test selector');
        routeIsValid = false;
      }
      if (!/live:\s*\{[\s\S]*?accessibilityLabel:\s*'Ad:/.test(nativeAdCopySource)) {
        reject('NativeAdCard English live copy must identify the placement as an ad');
        routeIsValid = false;
      }
      if (!/live:\s*\{[\s\S]*?accessibilityLabel:\s*'Annons:/.test(nativeAdCopySource)) {
        reject('NativeAdCard Swedish live copy must identify the placement as an ad');
        routeIsValid = false;
      }
      if (!/test:\s*\{[\s\S]*?accessibilityLabel:\s*'Test native ad:/.test(nativeAdCopySource)) {
        reject('NativeAdCard test copy must keep explicit test-ad disclosure');
        routeIsValid = false;
      }
      const liveNativeAdCopyBlocks = Array.from(
        nativeAdCopySource.matchAll(/live:\s*\{([\s\S]*?)\n    \},\n    test:/g),
        (match) => match[1],
      );
      if (
        liveNativeAdCopyBlocks.length < 2 ||
        liveNativeAdCopyBlocks.some((block) =>
          /Test native ad|Inbyggd testannons|AdMob test placement preview|AdMob-testplacering/.test(
            block,
          ),
        )
      ) {
        reject('NativeAdCard live copy must not announce test-ad wording');
        routeIsValid = false;
      }
    }

    if (spec.component === 'PracticeInterstitialAd') {
      const consentAwareShouldShowPattern = new RegExp(
        `shouldShowAd\\(\\s*'${spec.placement}'\\s*,\\s*resolvedEntitlements\\s*,\\s*mobileAdsConsent\\.decision\\.consentDecision\\s*,\\s*Platform\\.OS\\s*,?\\s*\\)`,
      );
      const webInterstitialSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.tsx'),
        'utf8',
      );
      const nativeInterstitialSource = fs.readFileSync(
        path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.native.tsx'),
        'utf8',
      );

      if (/showKey=\{[\s\S]{0,160}selectedOptionId/.test(source)) {
        reject(
          'Practice route must key quiz_completed_interstitial by question and shuffle session, not selectedOptionId',
        );
        routeIsValid = false;
      }
      if (!source.includes('getPracticeInterstitialShowKey(question.id, shuffleSessionId)')) {
        reject('Practice route must use getPracticeInterstitialShowKey for interstitial capping');
        routeIsValid = false;
      }
      if (
        !webInterstitialSource.includes(`shouldShowAd('${spec.placement}', resolvedEntitlements)`)
      ) {
        reject(
          `PracticeInterstitialAd web fallback must gate ${spec.placement} through shouldShowAd`,
        );
        routeIsValid = false;
      }
      if (webInterstitialSource.includes('react-native-google-mobile-ads')) {
        reject('PracticeInterstitialAd web fallback must not import native-only ad SDK APIs');
        routeIsValid = false;
      }
      if (!nativeInterstitialSource.includes('InterstitialAd.createForAdRequest')) {
        reject('PracticeInterstitialAd native placement must load through InterstitialAd');
        routeIsValid = false;
      }
      if (
        !nativeInterstitialSource.includes(`getPlatformAdUnitId('${spec.placement}', Platform.OS)`)
      ) {
        reject(
          `PracticeInterstitialAd native placement must resolve the ${spec.placement} unit by platform`,
        );
        routeIsValid = false;
      }
      if (!consentAwareShouldShowPattern.test(nativeInterstitialSource)) {
        reject(
          `PracticeInterstitialAd native placement must gate ${spec.placement} through consent-aware platform shouldShowAd`,
        );
        routeIsValid = false;
      }
      if (!nativeInterstitialSource.includes('requestNonPersonalizedAdsOnly')) {
        reject(
          'PracticeInterstitialAd native placement must pass non-personalized ad request options',
        );
        routeIsValid = false;
      }
      if (
        !nativeInterstitialSource.includes('AdEventType.OPENED') ||
        !nativeInterstitialSource.includes('AdEventType.CLOSED')
      ) {
        reject(
          'PracticeInterstitialAd native placement must consume the cap on opened/closed show paths',
        );
        routeIsValid = false;
      }
      if (
        /AdEventType\.LOADED[\s\S]{0,260}lastInterstitialShowKey\s*=/.test(nativeInterstitialSource)
      ) {
        reject('PracticeInterstitialAd must not consume the show key in the LOADED listener');
        routeIsValid = false;
      }
    }

    if (routeIsValid) adPlacementRoutesValidated += 1;
  }

  for (const file of EXPECTED_NO_AD_ROUTE_FILES) {
    let source = '';
    let routeIsValid = true;

    try {
      source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (error) {
      reject(`${file} could not be read for no-ad route parity: ${error.message}`);
      continue;
    }

    if (
      /AdBanner|NativeAd|Interstitial|LaunchPopupAd|RewardedAd|showRewardedExtraExamAd/.test(source)
    ) {
      reject(`${file} must not import or render ad components`);
      routeIsValid = false;
    }

    if (
      /rewardPreview|sponsor preview|Sponsrad förhandsvisning|Sponsored preview|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/.test(
        source,
      )
    ) {
      reject(`${file} must not render sponsor-preview unlock UI`);
      routeIsValid = false;
    }

    if (!blockedPlacements.includes('exam_screen')) {
      reject('adsConfig.blockedPlacements must include exam_screen');
      routeIsValid = false;
    }

    if (typeof shouldShowAd === 'function' && shouldShowAd('exam_screen', { adsDisabled: false })) {
      reject('exam_screen must never render ads');
      routeIsValid = false;
    }

    if (routeIsValid) noAdRoutesValidated += 1;
  }

  if (
    valid &&
    adPlacementRoutesValidated === EXPECTED_ROUTE_AD_PLACEMENTS.length &&
    noAdRoutesValidated === EXPECTED_NO_AD_ROUTE_FILES.length
  ) {
    adPlacementRouteParityValidated = true;
  }
}

if (focusedValidationRequested('adPlacementRouteParity')) {
  validateStaticValidationSyntaxGate();
  validateAdPlacementRouteParity();
  exitWithValidationFailures();
  printValidationSummary({
    adPlacementRoutesValidated,
    noAdRoutesValidated,
    adPlacementRouteParityValidated,
  });
  process.exit(0);
}

function validateReleaseMonetizationPolicyParity() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!isObjectRecord(releaseMonetizationPolicy)) return;

  const expectedFieldValues = {
    adSupportedByDefault: true,
    adMobAppRecordRequired: true,
    appAdsTxtReviewRequired: true,
    consentPromptsRequired: EXPECTED_RELEASE_CONSENT_PROMPTS,
    noAdPlacements: EXPECTED_RELEASE_NO_AD_PLACEMENTS,
    privacyReviewRequiresBinary: true,
    proRuntimeScopeDefaultEnabled: false,
    proRuntimeScopeEnvFlag: 'EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE',
    proRuntimeScopeOverrideGate: 'release-scope-v11',
    realAdsEnvFlag: EXPECTED_RELEASE_REAL_ADS_ENV_FLAG,
    removeAdsPriceLabel: REMOVE_ADS_PRICE_LABEL,
    removeAdsProductId: REMOVE_ADS_PRODUCT_ID,
    storeDisclosureTopics: EXPECTED_RELEASE_STORE_DISCLOSURE_TOPICS,
  };

  const actualFieldNames = Object.keys(releaseMonetizationPolicy);
  if (!arrayEquals(actualFieldNames, EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS)) {
    reject(
      `releaseMonetizationPolicy fields are ${JSON.stringify(
        actualFieldNames,
      )}, expected ${JSON.stringify(EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS)}`,
    );
  }

  EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS.forEach((fieldName) => {
    const actualValue = releaseMonetizationPolicy[fieldName];
    const expectedValue = expectedFieldValues[fieldName];

    if (!jsonEqual(actualValue, expectedValue)) {
      reject(
        `releaseMonetizationPolicy.${fieldName} is ${JSON.stringify(
          actualValue,
        )}, expected ${JSON.stringify(expectedValue)}`,
      );
      return;
    }

    releaseMonetizationPolicyFieldsValidated += 1;
  });

  if (typeof isReleaseMonetizationPolicyReady !== 'function') return;
  if (!isReleaseMonetizationPolicyReady()) {
    reject('isReleaseMonetizationPolicyReady must return true for the current release policy');
  }

  if (!Array.isArray(consentConfig?.prompts)) {
    reject('consentConfig.prompts must be an array for release policy parity');
  } else if (
    !arrayEquals(releaseMonetizationPolicy.consentPromptsRequired, consentConfig.prompts)
  ) {
    reject('releaseMonetizationPolicy consent prompts must match consentConfig.prompts');
  }

  if (!Array.isArray(adsConfig?.blockedPlacements)) {
    reject('adsConfig.blockedPlacements must be an array for release policy parity');
  } else if (!arrayEquals(releaseMonetizationPolicy.noAdPlacements, adsConfig.blockedPlacements)) {
    reject('releaseMonetizationPolicy no-ad placements must match adsConfig.blockedPlacements');
  }

  const storeDisclosureLabels = Array.isArray(consentConfig?.storeDisclosureLabels)
    ? consentConfig.storeDisclosureLabels
    : [];
  storeDisclosureLabels.forEach((label) => {
    if (!releaseMonetizationPolicy.storeDisclosureTopics?.includes(label)) {
      reject(`releaseMonetizationPolicy store disclosures must include ${label}`);
    }
  });

  if (
    valid &&
    releaseMonetizationPolicyFieldsValidated === EXPECTED_RELEASE_MONETIZATION_POLICY_FIELDS.length
  ) {
    releaseMonetizationPolicyParityValidated = true;
  }
}

function validateRemoveAdsEntitlementHookParity() {
  let valid = true;
  let hookSource = '';
  let homeSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    hookSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
      'utf8',
    );
    homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  } catch (error) {
    reject(`Remove Ads entitlement sources could not be read: ${error.message}`);
    return;
  }

  const normalizedHookSource = hookSource.replace(/\s+/g, ' ');
  const normalizedHomeSource = homeSource.replace(/\s+/g, ' ');
  const hookCases = [
    [
      /const\s+AD_BLOCKED_PENDING_ENTITLEMENTS:\s*PremiumEntitlements\s*=\s*\{[\s\S]*\.\.\.FREE_ENTITLEMENTS,[\s\S]*adsDisabled:\s*true,[\s\S]*\};/.test(
        hookSource,
      ),
      'Remove Ads entitlement hook must fail closed while purchase state loads',
    ],
    [
      normalizedHookSource.includes('provider: createMockPurchaseProvider(),') &&
        normalizedHookSource.includes('storage: createWebPurchaseStorage(initialAdsDisabled),'),
      'web purchase runtime must preserve mock provider plus initial adsDisabled storage',
    ],
    [
      normalizedHookSource.includes(
        'provider: createNativePurchaseProvider({ platform: getNativePurchasePlatform() }),',
      ) &&
        normalizedHookSource.includes('storage: createSecureStorePurchaseStorage(),') &&
        !normalizedHookSource.includes("if (Platform.OS !== 'web') return undefined;"),
      'native Remove Ads entitlement runtime must provide a native provider and secure storage',
    ],
    [
      normalizedHookSource.includes('void getPurchaseEntitlements(purchaseRuntime)') &&
        normalizedHookSource.includes('publishRemoveAdsEntitlements(storedEntitlements);'),
      'Remove Ads entitlement hook must publish persisted purchase entitlements',
    ],
    [
      /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*setCurrentEntitlements\(AD_BLOCKED_PENDING_ENTITLEMENTS\);[\s\S]*setEntitlementsReady\(false\);[\s\S]*setEntitlementStatus\('read_failed'\);[\s\S]*\}\s*\)/.test(
        hookSource,
      ),
      'failed Remove Ads entitlement reads must stay ad-blocked and expose read_failed state',
    ],
    [
      /if\s*\(\s*explicitEntitlements\s*\)\s*\{\s*return\s*\{[\s\S]*entitlements:\s*explicitEntitlements,[\s\S]*entitlementsReady:\s*true,[\s\S]*entitlementStatus:\s*'ready'\s+as\s+const,?[\s\S]*\};\s*\}/.test(
        hookSource,
      ),
      'explicit ad entitlements must bypass async purchase loading as ready',
    ],
    [
      /if\s*\(\s*!entitlementsReady\s*\)\s*\{\s*return\s*\{[\s\S]*entitlements:\s*AD_BLOCKED_PENDING_ENTITLEMENTS,[\s\S]*entitlementsReady:\s*false,[\s\S]*entitlementStatus,?[\s\S]*\};\s*\}/.test(
        hookSource,
      ),
      'unresolved purchase state must return ad-blocked pending entitlements',
    ],
    [
      /\bentitlementsReady\b/.test(homeSource) &&
        normalizedHomeSource.includes(
          'const showRemoveAdsOffer = entitlementsReady && !monetizationEntitlements.adsDisabled;',
        ) &&
        /\{showRemoveAdsOffer\s*\?\s*\([\s\S]{0,420}<PricingWedge/.test(homeSource) &&
        /\{entitlementsReady\s*\?\s*\([\s\S]{0,1200}<PremiumBanner[\s\S]{0,1200}<AdBanner\s+entitlements=\{monetizationEntitlements\}\s+placement="home_banner"\s*\/>/.test(
          homeSource,
        ),
      'Home monetization surfaces must wait for Remove Ads entitlements before rendering',
    ],
  ];

  hookCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }
    removeAdsEntitlementHookCasesValidated += 1;
  });

  if (valid && removeAdsEntitlementHookCasesValidated === EXPECTED_REMOVE_ADS_HOOK_CASES) {
    removeAdsEntitlementHookParityValidated = true;
  }
}

function validatePremiumEntitlementParity() {
  let valid = true;
  let premiumSource = '';
  let adsSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    premiumSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/premium.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/premium.ts could not be read: ${error.message}`);
  }

  try {
    adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/ads.ts could not be read: ${error.message}`);
  }

  const entitlementExports = {
    FREE_ENTITLEMENTS,
    PREMIUM_ENTITLEMENTS,
    REMOVE_ADS_ENTITLEMENTS,
  };
  const entitlementFields = ['adsDisabled', 'unlimitedMockExams', 'fullMistakeReview'];

  EXPECTED_PREMIUM_ENTITLEMENT_STATES.forEach(({ configKey, entitlements, exportName }) => {
    const actualEntitlements = entitlementExports[exportName];
    let stateIsValid = true;

    function rejectState(message) {
      stateIsValid = false;
      reject(message);
    }

    if (!isObjectRecord(actualEntitlements)) {
      rejectState(`${exportName} must be an object`);
    } else {
      const actualFields = Object.keys(actualEntitlements);
      if (!arrayEquals(actualFields, entitlementFields)) {
        rejectState(
          `${exportName} fields are ${JSON.stringify(actualFields)}, expected ${JSON.stringify(
            entitlementFields,
          )}`,
        );
      }

      entitlementFields.forEach((fieldName) => {
        if (typeof actualEntitlements[fieldName] !== 'boolean') {
          rejectState(`${exportName}.${fieldName} must be boolean`);
        } else if (actualEntitlements[fieldName] !== entitlements[fieldName]) {
          rejectState(
            `${exportName}.${fieldName} is ${actualEntitlements[fieldName]}, expected ${entitlements[fieldName]}`,
          );
        }
      });
    }

    if (!isObjectRecord(premiumConfig?.[configKey])) {
      rejectState(`premiumConfig.${configKey} must expose ${exportName}`);
    } else if (!jsonEqual(premiumConfig[configKey], actualEntitlements)) {
      rejectState(`premiumConfig.${configKey} must match ${exportName}`);
    }

    if (stateIsValid) premiumEntitlementStatesValidated += 1;
  });

  if (typeof hasAdsDisabled === 'function') {
    if (hasAdsDisabled(FREE_ENTITLEMENTS) !== false) {
      reject('hasAdsDisabled must return false for FREE_ENTITLEMENTS');
    }
    if (hasAdsDisabled(REMOVE_ADS_ENTITLEMENTS) !== true) {
      reject('hasAdsDisabled must return true for REMOVE_ADS_ENTITLEMENTS');
    }
  }

  if (typeof isPremiumUser === 'function') {
    if (isPremiumUser(FREE_ENTITLEMENTS) !== false) {
      reject('isPremiumUser must return false for FREE_ENTITLEMENTS');
    }
    if (isPremiumUser(PREMIUM_ENTITLEMENTS) !== true) {
      reject('isPremiumUser must return true for PREMIUM_ENTITLEMENTS');
    }
    if (isPremiumUser(REMOVE_ADS_ENTITLEMENTS) !== false) {
      reject('isPremiumUser must not treat Remove Ads as full premium');
    }
    if (
      isPremiumUser({
        adsDisabled: false,
        unlimitedMockExams: true,
        fullMistakeReview: true,
      }) !== true
    ) {
      reject('isPremiumUser must stay decoupled from adsDisabled');
    }
  }

  if (typeof shouldShowAd === 'function' && shouldShowAd('home_banner', REMOVE_ADS_ENTITLEMENTS)) {
    reject('shouldShowAd must not render home_banner when adsDisabled is true');
  }

  if (!/if\s*\(\s*entitlements\.adsDisabled\s*\)\s*return false;/.test(adsSource)) {
    reject('shouldShowAd must keep an explicit adsDisabled fail-closed branch');
  }

  if (
    !/return\s+entitlements\.unlimitedMockExams\s*&&\s*entitlements\.fullMistakeReview;/.test(
      premiumSource,
    )
  ) {
    reject('isPremiumUser must depend on premium capabilities rather than adsDisabled');
  }

  if (valid && premiumEntitlementStatesValidated === EXPECTED_PREMIUM_ENTITLEMENT_STATES.length) {
    premiumEntitlementParityValidated = true;
  }
}

function validateQuestionDisclaimerParity() {
  let copyIsValid = true;

  function rejectCopy(message) {
    copyIsValid = false;
    fail(message);
  }

  let componentSource = '';
  let disclaimerRouteSource = '';
  try {
    componentSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
      'utf8',
    );
  } catch (error) {
    rejectCopy(`components/quiz/QuestionDisclaimer.tsx could not be read: ${error.message}`);
  }
  try {
    disclaimerRouteSource = fs.readFileSync(path.join(repoRoot, 'app/disclaimer.tsx'), 'utf8');
  } catch (error) {
    rejectCopy(`app/disclaimer.tsx could not be read: ${error.message}`);
  }

  const componentLower = componentSource.toLocaleLowerCase('en-US');
  const routeLower = disclaimerRouteSource.toLocaleLowerCase('en-US');
  REQUIRED_QUESTION_DISCLAIMER_PHRASES.forEach((phrase) => {
    const normalizedPhrase = phrase.toLocaleLowerCase('en-US');
    if (!componentLower.includes(normalizedPhrase)) {
      rejectCopy(`QuestionDisclaimer missing required "${phrase}" wording`);
    }
    if (!routeLower.includes(normalizedPhrase)) {
      rejectCopy(`app/disclaimer.tsx missing required "${phrase}" wording`);
    }
  });

  if (!/export function QuestionDisclaimer/.test(componentSource)) {
    rejectCopy('QuestionDisclaimer component must keep its named export');
  }
  if (/guaranteed|guarantee/i.test(componentSource)) {
    rejectCopy('QuestionDisclaimer must not imply guaranteed exam outcomes');
  }

  if (copyIsValid) questionDisclaimerCopyValidated = true;

  EXPECTED_QUESTION_DISCLAIMER_ROUTES.forEach(({ route, file }) => {
    let routeIsValid = true;
    let source = '';

    try {
      source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (error) {
      routeIsValid = false;
      fail(`${file} could not be read for ${route} disclaimer coverage: ${error.message}`);
    }

    if (!/import\s+\{\s*QuestionDisclaimer\s*\}/.test(source)) {
      routeIsValid = false;
      fail(`${file} must import QuestionDisclaimer for ${route}`);
    }
    if (!QUESTION_DISCLAIMER_USAGE_PATTERN.test(source)) {
      routeIsValid = false;
      fail(`${file} is missing QuestionDisclaimer for ${route}`);
    }

    if (routeIsValid) questionDisclaimerRoutesValidated += 1;
  });
}

function validateQuestionReportLinkParity() {
  let valid = true;
  const sourceCache = new Map();

  function reject(message) {
    valid = false;
    fail(message);
  }

  function readSource(relativePath) {
    if (sourceCache.has(relativePath)) return sourceCache.get(relativePath);

    try {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      sourceCache.set(relativePath, source);
      return source;
    } catch (error) {
      reject(`${relativePath} could not be read for question report link parity: ${error.message}`);
      sourceCache.set(relativePath, '');
      return '';
    }
  }

  EXPECTED_QUESTION_REPORT_LINK_RULES.forEach((rule) => {
    const source = readSource(rule.file);
    const message = rule.message ?? `QuestionReportLink missing ${rule.label}`;
    let ruleIsValid = true;

    if (rule.pattern && !rule.pattern.test(source)) {
      ruleIsValid = false;
      reject(message);
    }
    if (rule.forbiddenPattern && rule.forbiddenPattern.test(source)) {
      ruleIsValid = false;
      reject(message);
    }

    if (ruleIsValid) questionReportLinkRulesValidated += 1;
  });

  if (valid && questionReportLinkRulesValidated === EXPECTED_QUESTION_REPORT_LINK_RULES.length) {
    questionReportLinkParityValidated = true;
  }
}

function validateMockExamConfigTypeSchemaParity() {
  let valid = true;
  let mockExamConfigSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mockExamConfigSource = fs.readFileSync(path.join(repoRoot, 'data/mockExamConfig.ts'), 'utf8');
  } catch (error) {
    reject(`data/mockExamConfig.ts could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(mockExamConfigSource, 'MockExamConfig');
  if (!Array.isArray(actualFields)) {
    reject('data/mockExamConfig.ts MockExamConfig interface could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_MOCK_EXAM_CONFIG_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `MockExamConfig fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_MOCK_EXAM_CONFIG_FIELDS.forEach((expectedField) => {
    const actualField = actualFieldsByName.get(expectedField.name);
    let fieldIsValid = true;

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`MockExamConfig missing ${expectedField.name}`);
    } else {
      if (actualField.type !== expectedField.type) {
        rejectField(
          `MockExamConfig.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectField(
          `MockExamConfig.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    }

    if (fieldIsValid) mockExamConfigTypeFieldsValidated += 1;
  });

  if (valid && mockExamConfigTypeFieldsValidated === EXPECTED_MOCK_EXAM_CONFIG_FIELDS.length) {
    mockExamConfigTypeSchemaParityValidated = true;
  }
}

function validateMockExamConfig(config, publishedQuestionCount) {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!config || typeof config !== 'object') {
    reject('defaultMockExamConfig export is not an object');
  } else {
    mockExamConfigExactSchemaKeyFailures(config, 'defaultMockExamConfig').forEach(reject);

    if (!Number.isInteger(config.questionCount) || config.questionCount < 1) {
      reject('defaultMockExamConfig questionCount must be a positive integer');
    } else if (config.questionCount > publishedQuestionCount) {
      reject(
        `defaultMockExamConfig questionCount ${config.questionCount} exceeds ${publishedQuestionCount} published questions`,
      );
    }

    if (!Number.isInteger(config.durationMinutes) || config.durationMinutes < 1) {
      reject('defaultMockExamConfig durationMinutes must be a positive integer');
    }
    if (config.sourceScope !== 'uhr_based') {
      reject('defaultMockExamConfig sourceScope must be uhr_based');
    }
    if (config.showExplanationsDuringExam !== false) {
      reject('defaultMockExamConfig must not show explanations during the exam');
    }
    if (config.adsAllowedDuringExam !== false) {
      reject('defaultMockExamConfig must not allow ads during the exam');
    }
  }

  if (valid) {
    mockExamConfigExactSchemaKeysValidated = true;
    mockExamConfigValidated = true;
  }
}

function validateMockExamRuntimeParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(examQuestions)) {
    reject('generateExam did not return an array for defaultMockExamConfig');
    return;
  }

  if (examQuestions.length !== config.questionCount) {
    reject(
      `default mock exam generated ${examQuestions.length} questions, expected ${config.questionCount}`,
    );
  }

  const examQuestionIds = new Set();
  const expectedChapterCoverage = Math.min(
    Array.isArray(chapters) ? chapters.length : 0,
    config.questionCount,
  );
  const coveredChapters = new Set();
  const chapterCounts = new Map();
  examQuestions.forEach((question, index) => {
    const label = question?.id || `mock exam question[${index}]`;

    if (!question || typeof question !== 'object') {
      reject(`mock exam question[${index}] is not an object`);
      return;
    }
    if (examQuestionIds.has(question.id)) {
      reject(`default mock exam repeats question ${question.id}`);
    }
    if (hasText(question.id)) examQuestionIds.add(question.id);
    if (question.reviewStatus !== 'published') {
      reject(`${label} mock exam reviewStatus is ${question.reviewStatus}, expected published`);
    }
    if (!question.uhrReference?.chapter || !question.uhrReference?.section) {
      reject(`${label} mock exam question is missing a UHR reference`);
    }
    if (hasText(question.chapterId)) {
      coveredChapters.add(question.chapterId);
      chapterCounts.set(question.chapterId, (chapterCounts.get(question.chapterId) || 0) + 1);
    }
  });

  if (expectedChapterCoverage > 0 && coveredChapters.size !== expectedChapterCoverage) {
    reject(
      `default mock exam covers ${coveredChapters.size} chapters, expected ${expectedChapterCoverage}`,
    );
  }

  const chapterCountValues = [...chapterCounts.values()];
  if (config.questionCount > 0 && chapterCountValues.length === 0) {
    reject('default mock exam did not count any chapter buckets');
  } else if (chapterCountValues.length > 0) {
    const minChapterCount = Math.min(...chapterCountValues);
    const maxChapterCount = Math.max(...chapterCountValues);
    const countedQuestions = chapterCountValues.reduce((sum, count) => sum + count, 0);

    if (countedQuestions !== examQuestions.length) {
      reject(
        `default mock exam counted ${countedQuestions} chapter assignments for ${examQuestions.length} questions`,
      );
    }
    if (maxChapterCount - minChapterCount > 1) {
      reject(
        `default mock exam chapter counts are unbalanced: ${JSON.stringify(Object.fromEntries(chapterCounts))}`,
      );
    }
  }

  if (valid) mockExamRuntimeParityValidated = true;
  if (valid) mockExamChapterBalanceParityValidated = true;
}

function expectedFormattedExamTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function validateMockExamTimerParity(config) {
  if (!config || typeof config !== 'object') return;
  if (typeof formatExamTime !== 'function' || typeof shouldAutoSubmitExam !== 'function') return;

  const totalSeconds = config.durationMinutes * 60;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Number.isInteger(totalSeconds) || totalSeconds < 60) {
    reject('defaultMockExamConfig duration must convert to at least 60 whole seconds');
  }

  const formattedStartTime = formatExamTime(totalSeconds);
  const expectedStartTime = expectedFormattedExamTime(totalSeconds);
  if (formattedStartTime !== expectedStartTime) {
    reject(
      `formatExamTime default duration is ${formattedStartTime}, expected ${expectedStartTime}`,
    );
  }

  const liveExamState = {
    remainingSeconds: totalSeconds,
    submitted: false,
    questionCount: config.questionCount,
  };
  if (shouldAutoSubmitExam(liveExamState)) {
    reject('shouldAutoSubmitExam must not submit at the configured start time');
  }
  if (
    !shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must submit a live exam when the timer reaches zero');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      submitted: true,
    })
  ) {
    reject('shouldAutoSubmitExam must not resubmit an already submitted exam');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      questionCount: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must not submit an empty exam');
  }
  if (formatExamTime(-1) !== '00:00') {
    reject('formatExamTime must clamp negative remaining time to 00:00');
  }

  if (valid) mockExamTimerParityValidated = true;
}

function validateExamSubmissionFinalityParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/exam.tsx could not be read: ${error.message}`);
    return;
  }

  if (
    !examRoute.includes('Submitted results are final. Start another mock exam for a fresh attempt.')
  ) {
    reject('exam result screen must tell users submitted results are final');
  }
  if (examRoute.includes('Back to exam answers') || examRoute.includes('Back to answers')) {
    reject('exam result screen must not offer a back-to-answers control after submission');
  }
  if (examRoute.includes('onPress={() => setSubmitted(false)}')) {
    reject('exam result screen must not directly reopen submitted answers');
  }
  if (
    !examRoute.includes(
      'disabled: !completionRecorded || !canStartAccessibleExam || startingAccessibleExam',
    ) ||
    !examRoute.includes(
      'disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}',
    )
  ) {
    reject('next-exam control must stay disabled until the submitted completion is stored');
  }
  const persistsCompletedMockExam =
    examRoute.includes('const recordMockExamSession = useProgressStore') &&
    examRoute.includes('recordMockExamSession({') &&
    examRoute.includes('sessionId: examSessionId') &&
    examRoute.includes('score: resultTotalCount > 0 ? resultCorrectCount / resultTotalCount : 0') &&
    examRoute.includes(
      'completedAt: submittedExamSession?.completedAt ?? new Date().toISOString()',
    ) &&
    examRoute.includes('correctCount: resultCorrectCount') &&
    examRoute.includes('totalCount: resultTotalCount') &&
    examRoute.includes('questionTimings:') &&
    examRoute.includes('submittedExamSession?.answers') &&
    examRoute.includes('timeSpentSeconds: answer.timeSpentSeconds');
  if (!persistsCompletedMockExam) {
    reject('exam result submission must persist a completed mock-exam score for readiness');
  }

  if (valid) examSubmissionFinalityParityValidated = true;
}

if (focusedValidationRequested('examSubmissionFinalityParity')) {
  validateExamSubmissionFinalityParity();
  exitWithValidationFailures();
  printValidationSummary({
    examSubmissionFinalityParityValidated,
  });
  process.exit(0);
}

function countExamRouteHeaderOccurrences(source, { styleName, pattern }) {
  const headerPattern = new RegExp(
    `<Text\\s+accessibilityRole="header"\\s+style=\\{styles\\.${styleName}\\}>\\s*${pattern.source}\\s*</Text>`,
    'g',
  );
  return (source.match(headerPattern) || []).length;
}

function validateCitizenshipRequirementsLimitedSeatParity() {
  let valid = true;
  let requirementsSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    requirementsSource = fs.readFileSync(
      path.join(repoRoot, 'data/citizenshipRequirements.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`data/citizenshipRequirements.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_CITIZENSHIP_REQUIREMENTS_LIMITED_SEAT_SNIPPETS.forEach((snippet) => {
    if (!requirementsSource.includes(snippet)) {
      reject('citizenship requirements guide must surface the limited-seat registration warning');
      return;
    }
    citizenshipRequirementsLimitedSeatCopyValidated += 1;
  });

  [
    'uhrCivicTestRegistration',
    'Migrationsverket har skickat brev',
    'Migrationsverket has sent you a letter',
    'anmälan öppnar i början av juni 2026',
    'registration opens in early June 2026',
  ].forEach((snippet) => {
    if (!requirementsSource.includes(snippet)) {
      reject(`citizenship requirements guide missing registration context ${snippet}`);
    }
  });

  if (!valid) return;
}

function validateAboutTheTestRouteCopyParity() {
  let valid = true;
  let aboutRoute = '';
  let legalPage = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    aboutRoute = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');
  } catch (error) {
    reject(`app/about-the-test.tsx could not be read: ${error.message}`);
    return;
  }
  try {
    legalPage = fs.readFileSync(path.join(repoRoot, 'components/compliance/LegalPage.tsx'), 'utf8');
  } catch (error) {
    reject(`components/compliance/LegalPage.tsx could not be read: ${error.message}`);
    return;
  }

  EXPECTED_ABOUT_THE_TEST_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!aboutRoute.includes(snippet)) reject(message);
  });

  if (!legalPage.includes('target="_blank"') || !legalPage.includes('rel="noreferrer"')) {
    reject('about-the-test official source links must inherit safe external-link attributes');
  }
  if (!legalPage.includes('minHeight: space[6]') || !legalPage.includes('minWidth: space[6]')) {
    reject('about-the-test official source links must inherit touch-safe legal link sizing');
  }

  EXPECTED_ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS.forEach((url) => {
    if (!aboutRoute.includes(url)) {
      reject(`about-the-test route official source metadata missing ${url}`);
      return;
    }
    aboutTheTestOfficialSourceUrlsValidated += 1;
  });

  const retrievedDates = Array.from(
    aboutRoute.matchAll(/retrievedDate:\s*'(\d{4}-\d{2}-\d{2})'/g),
    (match) => match[1],
  );
  if (
    retrievedDates.length < EXPECTED_ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS.length ||
    retrievedDates.some((date) => date !== EXPECTED_ABOUT_THE_TEST_RETRIEVED_DATE)
  ) {
    reject(
      `about-the-test route official source metadata must use retrievedDate ${EXPECTED_ABOUT_THE_TEST_RETRIEVED_DATE} for every source`,
    );
  } else {
    aboutTheTestOfficialSourceRetrievedDateValidated = EXPECTED_ABOUT_THE_TEST_RETRIEVED_DATE;
  }

  if (
    !aboutRoute.includes('Antalet platser är begränsat') ||
    !aboutRoute.includes('när platserna är fyllda går det inte längre att anmäla sig') ||
    !aboutRoute.includes('Seats are limited') ||
    !aboutRoute.includes('when the seats are filled, registration closes')
  ) {
    reject('about-the-test route must surface the limited-seat registration warning');
  }

  [
    /Ett kort\s+prov/i,
    /short\s+test/i,
    /digitalt\s+prov/i,
    /digital\s+exam/i,
    /Flervalsfr[aå]gor/i,
    /Multiple-choice\s+questions/i,
    /dator i en\s+provlokal/i,
    /computer at a\s+test centre/i,
  ].forEach((pattern) => {
    if (pattern.test(aboutRoute)) {
      reject('about-the-test route must not make unsupported logistics claim');
    }
  });

  EXPECTED_ABOUT_THE_TEST_SWEDISH_MOCKPROV_COPY_SOURCES.forEach((sourceConfig) => {
    let source = '';
    try {
      source = fs.readFileSync(path.join(repoRoot, sourceConfig.path), 'utf8');
    } catch (error) {
      reject(
        `${sourceConfig.path} could not be read for Swedish mockprov copy guard: ${error.message}`,
      );
      return;
    }

    if (SWEDISH_MOCKPROV_COPY_PATTERN.test(source)) {
      reject(
        `${sourceConfig.label} Swedish copy must use övningsprov wording, not mockprov/mock-provet`,
      );
      return;
    }

    aboutTheTestSwedishMockprovCopyGuardValidated += 1;
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_ABOUT_THE_TEST_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`about-the-test route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!aboutRoute.includes(label)) {
        labelIsValid = false;
        reject(`about-the-test route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`about-the-test route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) aboutTheTestRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_ABOUT_THE_TEST_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (
    valid &&
    aboutTheTestRouteCopyLabelsValidated === expectedLabelCount &&
    aboutTheTestOfficialSourceUrlsValidated ===
      EXPECTED_ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS.length &&
    aboutTheTestSwedishMockprovCopyGuardValidated ===
      EXPECTED_ABOUT_THE_TEST_SWEDISH_MOCKPROV_COPY_SOURCES.length
  ) {
    aboutTheTestRouteCopyParityValidated = true;
  }
}

function validateAboutTheTestSeenEffectParity() {
  let valid = true;
  let aboutRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    aboutRoute = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');
  } catch (error) {
    reject(`app/about-the-test.tsx could not be read for seen-effect parity: ${error.message}`);
    return;
  }

  const expectedEffect =
    'useEffect(() => {\n' +
    '    if (!hasSeenAboutTheTest) {\n' +
    '      markAboutTheTestSeen();\n' +
    '    }\n' +
    '  }, [hasSeenAboutTheTest, markAboutTheTestSeen]);';
  const expectedRules = [
    {
      pattern: /import \{ useEffect \} from 'react';/,
      message: 'about-the-test route must import useEffect for first-run seen effect',
    },
    {
      pattern:
        /const hasSeenAboutTheTest = useSettingsStore\(\(state\) => state\.hasSeenAboutTheTest\);/,
      message:
        'about-the-test route must subscribe to hasSeenAboutTheTest instead of reading useSettingsStore.getState() during render',
    },
    {
      pattern:
        /const markAboutTheTestSeen = useSettingsStore\(\(state\) => state\.markAboutTheTestSeen\);/,
      message: 'about-the-test route must subscribe to markAboutTheTestSeen from settings store',
    },
  ];

  expectedRules.forEach(({ pattern, message }) => {
    if (!pattern.test(aboutRoute)) {
      reject(message);
      return;
    }
    aboutTheTestSeenEffectRulesValidated += 1;
  });

  if (!aboutRoute.includes(expectedEffect)) {
    reject('about-the-test route missing effect-scoped seen marker for first-run seen effect');
  } else {
    aboutTheTestSeenEffectRulesValidated += 1;
  }

  if (/useSettingsStore\.getState\(\)\.hasSeenAboutTheTest/.test(aboutRoute)) {
    reject(
      'about-the-test route must subscribe to hasSeenAboutTheTest instead of reading useSettingsStore.getState() during render',
    );
  } else {
    aboutTheTestSeenEffectRulesValidated += 1;
  }

  if (/markAboutTheTestSeen\(\);/.test(aboutRoute.replace(expectedEffect, ''))) {
    reject('about-the-test route must call markAboutTheTestSeen() only inside useEffect');
  } else {
    aboutTheTestSeenEffectRulesValidated += 1;
  }

  if (valid && aboutTheTestSeenEffectRulesValidated === 6) {
    aboutTheTestSeenEffectParityValidated = true;
  }
}

function validateExamRouteHeaderParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/exam.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    examRoute.match(/<Text style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('exam route title and sectionTitle text must expose accessibilityRole="header"');
  }

  EXPECTED_EXAM_ROUTE_HEADERS.forEach((expectedHeader) => {
    const actualOccurrences = countExamRouteHeaderOccurrences(examRoute, expectedHeader);
    if (actualOccurrences !== expectedHeader.occurrences) {
      reject(
        `exam route header ${expectedHeader.label} appears ${actualOccurrences} times as a ${expectedHeader.styleName} header, expected ${expectedHeader.occurrences}`,
      );
      return;
    }
    examRouteHeadersValidated += actualOccurrences;
  });

  const expectedHeaderCount = EXPECTED_EXAM_ROUTE_HEADERS.reduce(
    (sum, expectedHeader) => sum + expectedHeader.occurrences,
    0,
  );
  if (valid && examRouteHeadersValidated === expectedHeaderCount) {
    examRouteHeaderParityValidated = true;
  }
}

function validateExamRouteCopyParity() {
  let valid = true;
  let examRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  } catch (error) {
    reject(`exam route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_EXAM_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!examRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_EXAM_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`exam route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!examRoute.includes(label)) {
        labelIsValid = false;
        reject(`exam route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`exam route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) examRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_EXAM_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && examRouteCopyLabelsValidated === expectedLabelCount) {
    examRouteCopyParityValidated = true;
  }
}

function validateNativeMockExamComponentLegalCopy() {
  let valid = true;
  const swedishExamNoun = String.fromCharCode(116, 101, 110, 116, 97, 109, 101, 110);
  const bannedTerms = [
    new RegExp(`\b${['skarp', swedishExamNoun].join('\\s+')}\b`, 'i'),
    new RegExp(`\b${['starta', 'provet'].join('\\s+')}\b`, 'i'),
    new RegExp(`\b${swedishExamNoun}\b`, 'i'),
    UNSUPPORTED_NATIVE_MOCK_EXAM_SWEDISH_TERMS,
  ];

  function reject(message) {
    valid = false;
    fail(message);
  }

  EXPECTED_NATIVE_MOCK_EXAM_COMPONENT_COPY.forEach(({ file, snippets }) => {
    let source = '';
    try {
      source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (error) {
      reject(`${file} native mock exam copy source could not be read: ${error.message}`);
      return;
    }

    snippets.forEach(([snippet, message]) => {
      let labelIsValid = true;
      if (!source.includes(snippet)) {
        labelIsValid = false;
        reject(message);
      }
      if (labelIsValid) nativeMockExamComponentCopyLabelsValidated += 1;
    });

    bannedTerms.forEach((pattern) => {
      if (pattern.test(source)) {
        reject(
          `${file} native mock exam component copy must use clearly unofficial Swedish practice wording`,
        );
      }
    });

    NATIVE_MOCK_EXAM_UNSUPPORTED_SCORE_SOURCE_PATTERNS.forEach(({ label, pattern }) => {
      if (pattern.test(source)) {
        reject(`${file} must not expose unsupported native mock-exam ${label}`);
      }
    });
  });

  const expectedLabelCount = EXPECTED_NATIVE_MOCK_EXAM_COMPONENT_COPY.reduce(
    (count, expectedFile) => count + expectedFile.snippets.length,
    0,
  );
  if (valid && nativeMockExamComponentCopyLabelsValidated === expectedLabelCount) {
    nativeMockExamComponentLegalCopyValidated = true;
    nativeMockExamScoreSourceCopyValidated = true;
  }
}

function validateNativeMockExamLibraryAndTierCopy() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(MOCK_EXAM_LIBRARY)) {
    reject('MOCK_EXAM_LIBRARY must be an array of native mock-exam descriptors');
  } else {
    const labelsSv = MOCK_EXAM_LIBRARY.map((mock) => mock.labelSv);

    if (JSON.stringify(labelsSv) !== JSON.stringify(EXPECTED_NATIVE_MOCK_EXAM_LIBRARY_LABELS_SV)) {
      reject('mock exam library Swedish labels must use the canonical Övningsprov wording');
    }

    labelsSv.forEach((label, index) => {
      let labelIsValid = true;
      if (!hasText(label) || !textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`mock exam library Swedish label ${index + 1} must be normalized`);
      }
      if (UNSUPPORTED_NATIVE_MOCK_EXAM_SWEDISH_TERMS.test(label)) {
        labelIsValid = false;
        reject(`mock exam library Swedish label ${JSON.stringify(label)} must not use provexamen`);
      }
      if (labelIsValid) nativeMockExamLibraryLabelsValidated += 1;
    });
  }

  const mockExamsRow = Array.isArray(TIER_ROWS)
    ? TIER_ROWS.find((row) => row.id === 'mockExams')
    : null;
  if (!mockExamsRow) {
    reject('tier comparison must include the mockExams row');
  } else {
    if (mockExamsRow.labelSv !== 'Övningsprov') {
      reject('tier comparison mock-exams label must use Swedish Övningsprov wording');
    }
    if (mockExamsRow.labelEn !== 'Mock exams') {
      reject('tier comparison mock-exams label must preserve English Mock exams wording');
    }
    if (UNSUPPORTED_NATIVE_MOCK_EXAM_SWEDISH_TERMS.test(mockExamsRow.labelSv)) {
      reject('tier comparison mock-exams label must not use provexamen/provexamina');
    }
  }

  if (
    valid &&
    nativeMockExamLibraryLabelsValidated === EXPECTED_NATIVE_MOCK_EXAM_LIBRARY_LABELS_SV.length
  ) {
    nativeMockExamSwedishCopyNaturalnessValidated = true;
    nativeMockExamTierCopyValidated = true;
  }
}

if (focusedValidationRequested('mockExamCopyParity')) {
  validateNativeMockExamComponentLegalCopy();
  validateNativeMockExamLibraryAndTierCopy();
  exitWithValidationFailures();
  printValidationSummary({
    nativeMockExamComponentCopyLabelsValidated,
    nativeMockExamComponentLegalCopyValidated,
    nativeMockExamLibraryLabelsValidated,
    nativeMockExamScoreSourceCopyValidated,
    nativeMockExamSwedishCopyNaturalnessValidated,
    nativeMockExamTierCopyValidated,
  });
  process.exit(0);
}

function validateQuizRouteHeaderParity() {
  let valid = true;
  let quizRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    quizRoute = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  } catch (error) {
    reject(`app/quiz/[sessionId].tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteTitles = quizRoute.match(/<Text style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteTitles.length > 0) {
    reject('quiz route title text must expose accessibilityRole="header"');
  }

  EXPECTED_QUIZ_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(quizRoute)) {
      reject(`quiz route missing ${expectedHeader.label} as a title header`);
      return;
    }
    quizRouteHeadersValidated += 1;
  });

  if (valid && quizRouteHeadersValidated === EXPECTED_QUIZ_ROUTE_HEADERS.length) {
    quizRouteHeaderParityValidated = true;
  }
}

function validateQuizRouteCopyParity() {
  let valid = true;
  let quizRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    quizRoute = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  } catch (error) {
    reject(`quiz route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_QUIZ_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!quizRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_QUIZ_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`quiz route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!quizRoute.includes(label)) {
        labelIsValid = false;
        reject(`quiz route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`quiz route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) quizRouteCopyLabelsValidated += 1;
    });
  });

  for (const pattern of SWEDISH_QUIZ_LOANWORD_PATTERNS) {
    if (pattern.test(quizRoute)) {
      reject('quiz route Swedish copy must avoid English quiz loanwords');
      break;
    }
  }

  const expectedLabelCount = Object.values(EXPECTED_QUIZ_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && quizRouteCopyLabelsValidated === expectedLabelCount) {
    quizRouteCopyParityValidated = true;
  }
}

function validatePracticeRouteHeaderParity() {
  let valid = true;
  let practiceRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    practiceRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/practice.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteTitles = practiceRoute.match(/<Text\s+style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteTitles.length > 0) {
    reject('practice route title text must expose accessibilityRole="header"');
  }

  EXPECTED_PRACTICE_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(practiceRoute)) {
      reject(`practice route missing ${expectedHeader.label} as a title header`);
      return;
    }
    practiceRouteHeadersValidated += 1;
  });

  if (valid && practiceRouteHeadersValidated === EXPECTED_PRACTICE_ROUTE_HEADERS.length) {
    practiceRouteHeaderParityValidated = true;
  }
}

function validatePracticeRouteCopyParity() {
  let valid = true;
  let practiceRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    practiceRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  } catch (error) {
    reject(`practice route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PRACTICE_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!practiceRoute.includes(snippet)) reject(message);
  });

  if (/about-the-sources/i.test(practiceRoute)) {
    reject('source drawer copy must not contain hyphenated about-the-sources');
  }

  if (SWEDISH_MOCKPROV_COPY_PATTERN.test(practiceRoute)) {
    reject('practice route Swedish copy must use övningsprov wording, not mockprov/mock-provet');
  }

  const seenLabels = new Set();
  Object.entries(EXPECTED_PRACTICE_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`practice ${language} label ${JSON.stringify(label)} must be normalized`);
      }
      if (!practiceRoute.includes(label)) {
        labelIsValid = false;
        reject(`practice route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`practice route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) practiceRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_PRACTICE_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && practiceRouteCopyLabelsValidated === expectedLabelCount) {
    practiceRouteCopyParityValidated = true;
  }
}

function validateSearchRouteQueryHydrationParity() {
  let valid = true;
  let searchRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    searchRoute = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');
  } catch (error) {
    reject(`app/search.tsx could not be read: ${error.message}`);
    return;
  }

  EXPECTED_SEARCH_ROUTE_QUERY_HYDRATION_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(searchRoute)) {
      reject(`search route missing ${expectedRule.label}`);
      return;
    }
    searchRouteQueryHydrationRulesValidated += 1;
  });

  if (/const \[query, setQuery\] = useState\(''\);/.test(searchRoute)) {
    reject('search route must not ignore q/query route params by initializing blank');
  }

  if (
    valid &&
    searchRouteQueryHydrationRulesValidated === EXPECTED_SEARCH_ROUTE_QUERY_HYDRATION_RULES.length
  ) {
    searchRouteQueryHydrationParityValidated = true;
  }
}

function validateProvenanceAuthorityCopyBoundary() {
  let valid = true;

  for (const relativePath of PROVENANCE_AUTHORITY_COPY_FILES) {
    const filePath = path.join(repoRoot, relativePath);
    let source = '';
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      valid = false;
      fail(
        `${relativePath} could not be read for provenance authority copy validation: ${error.message}`,
      );
      continue;
    }

    const matches = PROVENANCE_AUTHORITY_COPY_OVERCLAIMS.filter(({ pattern }) =>
      pattern.test(source),
    );
    if (matches.length > 0) {
      valid = false;
      fail(
        `${relativePath} includes positive provenance authority wording: ${matches
          .map(({ label }) => label)
          .join(', ')}`,
      );
      continue;
    }

    provenanceAuthorityCopyFilesValidated += 1;
  }

  if (valid && provenanceAuthorityCopyFilesValidated === PROVENANCE_AUTHORITY_COPY_FILES.length) {
    provenanceAuthorityCopyParityValidated = true;
  }
}

function validateLearnRouteLinkCopyParity() {
  let valid = true;
  let learnRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    learnRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  } catch (error) {
    reject(`learn route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_LEARN_ROUTE_LINK_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!learnRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`learn route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!learnRoute.includes(label)) {
        labelIsValid = false;
        reject(`learn route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`learn route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) learnRouteLinkCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_LEARN_ROUTE_LINK_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && learnRouteLinkCopyLabelsValidated === expectedLabelCount) {
    learnRouteLinkCopyParityValidated = true;
  }
}

function validateMistakesRouteCopyParity() {
  let valid = true;
  let mistakesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mistakesRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  } catch (error) {
    reject(`mistakes route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MISTAKES_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!mistakesRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_MISTAKES_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`mistakes route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!mistakesRoute.includes(label)) {
        labelIsValid = false;
        reject(`mistakes route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`mistakes route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) mistakesRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_MISTAKES_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && mistakesRouteCopyLabelsValidated === expectedLabelCount) {
    mistakesRouteCopyParityValidated = true;
  }
}

function validateChapterRouteHeaderParity() {
  let valid = true;
  let chapterRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterRoute = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  } catch (error) {
    reject(`app/chapter/[chapterId].tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    chapterRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('chapter route title and section text must expose accessibilityRole="header"');
  }
  if (/chapterQuestions\.map\s*\(/.test(chapterRoute)) {
    reject('chapter route must not eagerly map all chapter questions');
  }

  EXPECTED_CHAPTER_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(chapterRoute)) {
      reject(`chapter route missing ${expectedHeader.label} as a header`);
      return;
    }
    chapterRouteHeadersValidated += 1;
  });

  if (valid && chapterRouteHeadersValidated === EXPECTED_CHAPTER_ROUTE_HEADERS.length) {
    chapterRouteHeaderParityValidated = true;
  }
}

function validateChapterRouteCopyParity() {
  let valid = true;
  let chapterRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterRoute = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  } catch (error) {
    reject(`chapter route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_CHAPTER_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!chapterRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_CHAPTER_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`chapter route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!chapterRoute.includes(label)) {
        labelIsValid = false;
        reject(`chapter route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`chapter route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) chapterRouteCopyLabelsValidated += 1;
    });
  });

  for (const pattern of SWEDISH_QUIZ_LOANWORD_PATTERNS) {
    if (pattern.test(chapterRoute)) {
      reject('chapter route Swedish copy must avoid English quiz loanwords');
      break;
    }
  }

  const expectedLabelCount = Object.values(EXPECTED_CHAPTER_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && chapterRouteCopyLabelsValidated === expectedLabelCount) {
    chapterRouteCopyParityValidated = true;
  }
}

function validateLearnRouteHeaderParity() {
  let valid = true;
  let learnRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    learnRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`learn route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !learnRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('learn route must use the shared ScreenShell and SectionHeader header components');
  }

  const directRouteHeadings =
    learnRoute.match(
      /<Text\s+(?:accessibilityRole="header"\s+)?style=\{styles\.(?:title|sectionTitle)\}>/g,
    ) || [];
  if (directRouteHeadings.length > 0) {
    reject('learn route headings must stay on the shared ScreenShell/SectionHeader path');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('learn route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_LEARN_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(learnRoute)) {
      reject(`learn route missing ${expectedHeader.label} on the shared header path`);
      return;
    }
    learnRouteHeadersValidated += 1;
  });

  if (valid && learnRouteHeadersValidated === EXPECTED_LEARN_ROUTE_HEADERS.length) {
    learnRouteHeaderParityValidated = true;
  }
}

function validateProfileRouteHeaderParity() {
  let valid = true;
  let profileRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    profileRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`profile route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !profileRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('profile route must use the shared ScreenShell and SectionHeader header components');
  }

  const directRouteHeadings =
    profileRoute.match(
      /<Text\s+(?:accessibilityRole="header"\s+)?style=\{styles\.(?:title|sectionTitle)\}>/g,
    ) || [];
  if (directRouteHeadings.length > 0) {
    reject('profile route headings must stay on the shared ScreenShell/SectionHeader path');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('profile route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_PROFILE_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(profileRoute)) {
      reject(`profile route missing ${expectedHeader.label} on the shared header path`);
      return;
    }
    profileRouteHeadersValidated += 1;
  });

  if (valid && profileRouteHeadersValidated === EXPECTED_PROFILE_ROUTE_HEADERS.length) {
    profileRouteHeaderParityValidated = true;
  }
}

function validateProfileRouteCopyParity() {
  let valid = true;
  let profileRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    profileRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  } catch (error) {
    reject(`profile route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PROFILE_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!profileRoute.includes(snippet)) reject(message);
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_PROFILE_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`profile route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!profileRoute.includes(label)) {
        labelIsValid = false;
        reject(`profile route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`profile route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) profileRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_PROFILE_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && profileRouteCopyLabelsValidated === expectedLabelCount) {
    profileRouteCopyParityValidated = true;
  }
}

if (focusedValidationRequested('profileRouteCopy')) {
  validateProfileRouteHeaderParity();
  validateProfileRouteCopyParity();
  validateBadgeCatalog();
  exitWithValidationFailures();
  printValidationSummary({
    profileRouteHeadersValidated,
    profileRouteHeaderParityValidated,
    profileRouteCopyLabelsValidated,
    profileRouteCopyParityValidated,
    badgesValidated,
    badgeMilestoneParityValidated,
  });
  process.exit(0);
}

function validateHomeRouteHeaderParity() {
  let valid = true;
  let homeRoute = '';
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`home route header files could not be read: ${error.message}`);
    return;
  }

  if (
    !homeRoute.includes(
      "import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';",
    )
  ) {
    reject('home route must use the shared ScreenShell and SectionHeader header components');
  }

  const unheaderedCardHeadings =
    homeRoute.match(/<Text\s+style=\{styles\.(?:goalLabel|readinessTitle|feedbackTitle)\}>/g) || [];
  if (unheaderedCardHeadings.length > 0) {
    reject('home route card headings must expose accessibilityRole="header"');
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(screenShell) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(screenShell)
  ) {
    reject('home route shared heading components must expose accessibilityRole="header"');
  }

  EXPECTED_HOME_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(homeRoute)) {
      reject(`home route missing ${expectedHeader.label} on the header path`);
      return;
    }
    homeRouteHeadersValidated += 1;
  });

  if (valid && homeRouteHeadersValidated === EXPECTED_HOME_ROUTE_HEADERS.length) {
    homeRouteHeaderParityValidated = true;
  }
}

function validateHomeRouteCopyParity() {
  let valid = true;
  let homeRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  } catch (error) {
    reject(`home route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_HOME_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!homeRoute.includes(snippet)) reject(message);
  });

  FORBIDDEN_HOME_ROUTE_LEARNER_COPY.forEach((forbidden) => {
    if (homeRoute.includes(forbidden)) {
      reject(
        forbidden === 'simulated learners'
          ? 'home route contains synthetic learner feedback copy'
          : forbidden === 'flashcards'
            ? 'home route must not advertise flashcards until the feature is reachable'
            : `home route learner copy must not expose internal benchmark phrase ${forbidden}`,
      );
    }
  });

  FORBIDDEN_HOME_ROUTE_READINESS_COPY.forEach((forbidden) => {
    if (homeRoute.includes(forbidden)) {
      reject(`home route preparation signal copy must not expose official-readiness wording`);
    }
  });

  if (
    !homeRoute.includes("chapterRange: 'Kapitel 10-13'") ||
    !homeRoute.includes("chapterRange: 'Chapters 10-13'")
  ) {
    reject('home route guided path must finish with chapters 10-13');
  }

  if (SWEDISH_MOCKPROV_COPY_PATTERN.test(homeRoute)) {
    reject('home route Swedish copy must use övningsprov wording, not mockprov/mock-provet');
  }

  const seenLabels = new Set();
  Object.entries(EXPECTED_HOME_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`home route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!homeRoute.includes(label)) {
        labelIsValid = false;
        reject(`home route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`home route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) homeRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_HOME_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && homeRouteCopyLabelsValidated === expectedLabelCount) {
    homeRouteCopyParityValidated = true;
    homeRouteInternalBenchmarkCopyValidated = true;
  }
}

function validateHomeRouteSwedishMistakeReviewCopyNaturalness() {
  let valid = true;
  let homeRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    homeRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  } catch (error) {
    reject(`home route copy source could not be read: ${error.message}`);
    return;
  }

  FORBIDDEN_HOME_ROUTE_SWEDISH_MISTAKE_REVIEW_COPY.forEach((pattern) => {
    if (pattern.test(homeRoute)) {
      reject('home route Swedish missed-question review copy must use natural learner wording');
    }
  });

  EXPECTED_HOME_ROUTE_SWEDISH_MISTAKE_REVIEW_COPY.forEach((phrase) => {
    if (!homeRoute.includes(phrase)) {
      reject('home route Swedish missed-question review copy must use natural learner wording');
    }
  });

  if (valid) homeRouteSwedishMistakeReviewCopyNaturalnessValidated = true;
}

function validateMistakeReviewHydrationEvidence() {
  let valid = true;
  let testSource = '';
  let packageSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    testSource = fs.readFileSync(
      path.join(repoRoot, 'tests/content-mistakes-route-copy-parity.test.js'),
      'utf8',
    );
  } catch (error) {
    reject(`mistake review hydration test source could not be read: ${error.message}`);
    return;
  }

  try {
    packageSource = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8');
  } catch (error) {
    reject(`package.json could not be read for mistake review hydration wiring: ${error.message}`);
    return;
  }

  if (
    !testSource.includes('mistake review store drops corrupt persisted selected-answer reviews')
  ) {
    reject('mistake review hydration guard test is missing');
  }

  const corruptFixtureKeys = [
    'qBadDate',
    'qMismatched',
    "'': {",
    'qBlankEn',
    'qBlankSv',
    'qTooLong',
  ];
  corruptFixtureKeys.forEach((fixtureKey) => {
    if (testSource.includes(fixtureKey)) {
      mistakeReviewHydrationFixtureCasesValidated += 1;
    } else {
      reject(`mistake review hydration corrupt fixture is missing ${fixtureKey}`);
    }
  });

  if (!testSource.includes("selectedOptionTextEn: 'Wrong answer'")) {
    reject('mistake review hydration guard must preserve trimmed selectedOptionTextEn');
  }
  if (!testSource.includes("selectedOptionTextSv: 'Fel svar'")) {
    reject('mistake review hydration guard must preserve trimmed selectedOptionTextSv');
  }
  if (!testSource.includes('useMistakeReviewStore.getState().wrongAnswerReviews')) {
    reject('mistake review hydration guard must assert hydrated wrongAnswerReviews state');
  }

  const testContentOccurrences = (
    packageSource.match(/tests\/content-mistakes-route-copy-parity\.test\.js/g) || []
  ).length;
  if (testContentOccurrences !== 1) {
    reject(
      `test:content must include tests/content-mistakes-route-copy-parity.test.js exactly once, found ${testContentOccurrences}`,
    );
  } else {
    mistakeReviewHydrationTestContentParityValidated = true;
  }

  if (
    valid &&
    mistakeReviewHydrationFixtureCasesValidated === corruptFixtureKeys.length &&
    mistakeReviewHydrationTestContentParityValidated
  ) {
    mistakeReviewHydrationValidated = true;
  }
}

function validateMistakesRouteHeaderParity() {
  let valid = true;
  let mistakesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mistakesRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  } catch (error) {
    reject(`app/(tabs)/mistakes.tsx could not be read: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    mistakesRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle|emptyTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('mistakes route title and section text must expose accessibilityRole="header"');
  }

  EXPECTED_MISTAKES_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(mistakesRoute)) {
      reject(`mistakes route missing ${expectedHeader.label} as a header`);
      return;
    }
    mistakesRouteHeadersValidated += 1;
  });

  if (valid && mistakesRouteHeadersValidated === EXPECTED_MISTAKES_ROUTE_HEADERS.length) {
    mistakesRouteHeaderParityValidated = true;
  }
}

function countLegalTitleOccurrences(source, componentName, title) {
  const titlePattern = new RegExp(`<${componentName}\\s+title="${escapeRegExp(title)}"`, 'g');
  return (source.match(titlePattern) || []).length;
}

function countPatternOccurrences(source, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return (source.match(new RegExp(pattern.source, flags)) || []).length;
}

function validateLegalRouteHeaderParity() {
  let valid = true;
  let legalPage = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    legalPage = fs.readFileSync(path.join(repoRoot, 'components/compliance/LegalPage.tsx'), 'utf8');
  } catch (error) {
    reject(`components/compliance/LegalPage.tsx could not be read: ${error.message}`);
    return;
  }

  if (
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>/.test(legalPage) ||
    !/<Text\s+accessibilityRole="header"\s+style=\{styles\.sectionTitle\}>/.test(legalPage)
  ) {
    reject('legal route shared heading components must expose accessibilityRole="header"');
  }

  for (const expectedRoute of EXPECTED_LEGAL_ROUTE_HEADERS) {
    let routeSource = '';
    try {
      routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    } catch (error) {
      reject(`${expectedRoute.file} could not be read: ${error.message}`);
      continue;
    }

    if (!/LegalPage,\s+LegalSection/.test(routeSource)) {
      reject(`${expectedRoute.file} must use shared LegalPage and LegalSection headers`);
    }

    if (expectedRoute.requiredSnippets) {
      expectedRoute.requiredSnippets.forEach((snippet) => {
        if (!routeSource.includes(snippet)) {
          reject(`${expectedRoute.file} missing legal route snippet: ${snippet}`);
        }
      });
    }

    const pageTitleOccurrences = expectedRoute.titlePattern
      ? countPatternOccurrences(routeSource, expectedRoute.titlePattern)
      : countLegalTitleOccurrences(routeSource, 'LegalPage', expectedRoute.title);
    if (pageTitleOccurrences !== 1) {
      reject(
        `${expectedRoute.file} legal page title "${expectedRoute.title}" appears ${pageTitleOccurrences} times, expected 1`,
      );
    } else {
      legalRouteHeadersValidated += 1;
    }

    for (const [sectionIndex, sectionTitle] of expectedRoute.sections.entries()) {
      const sectionPattern = expectedRoute.sectionPatterns?.[sectionIndex];
      const sectionTitleOccurrences = sectionPattern
        ? countPatternOccurrences(routeSource, sectionPattern)
        : countLegalTitleOccurrences(routeSource, 'LegalSection', sectionTitle);
      if (sectionTitleOccurrences !== 1) {
        reject(
          `${expectedRoute.file} legal section title "${sectionTitle}" appears ${sectionTitleOccurrences} times, expected 1`,
        );
      } else {
        legalRouteHeadersValidated += 1;
      }
    }

    if (expectedRoute.file === 'app/privacy.tsx') {
      const swedishPrivacyBlock = routeSource.match(
        /sv:\s*\{[\s\S]*?title:\s*'Integritetspolicy',\s*\},\s*en:/,
      )?.[0];

      if (!swedishPrivacyBlock) {
        reject('app/privacy.tsx Swedish privacy copy block must stay parseable');
      } else if (/\bstreaks\b/i.test(swedishPrivacyBlock)) {
        reject('Swedish privacy copy must use natural Swedish streak wording, not "streaks"');
      } else if (!/\bstudiesviter\b/i.test(swedishPrivacyBlock)) {
        reject('Swedish privacy copy must name locally stored study streaks as studiesviter');
      } else {
        swedishPrivacyStreakCopyNaturalnessValidated = true;
      }
    }
  }

  const expectedHeaderCount = EXPECTED_LEGAL_ROUTE_HEADERS.reduce(
    (sum, route) => sum + 1 + route.sections.length,
    0,
  );
  if (valid && legalRouteHeadersValidated === expectedHeaderCount) {
    legalRouteHeaderParityValidated = true;
  }
}

function extractBraceBlockFromKey(source, keyPattern) {
  const keyMatch = keyPattern.exec(source);
  if (!keyMatch) return '';

  const blockStart = source.indexOf('{', keyMatch.index);
  if (blockStart < 0) return '';

  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = blockStart; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      escaped = false;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(blockStart, index + 1);
    }
  }

  return '';
}

function extractStaticStringLiterals(source) {
  const values = [];

  for (let index = 0; index < source.length; index += 1) {
    const quote = source[index];
    if (quote !== "'" && quote !== '"' && quote !== '`') continue;

    const lineStart = source.lastIndexOf('\n', index) + 1;
    const prefix = source.slice(lineStart, index);
    const skipDynamicTemplate = quote === '`' && prefix.includes('=>');
    let value = '';
    let escaped = false;
    let cursor = index + 1;

    for (; cursor < source.length; cursor += 1) {
      const char = source[cursor];
      if (escaped) {
        value += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) break;
      value += char;
    }

    if (!skipDynamicTemplate) {
      values.push(value.replace(/\$\{[\s\S]*?\}/g, ' '));
    }
    index = cursor;
  }

  return values;
}

function validateLegalSwedishEnglishTokenGuard() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  for (const expectedRoute of EXPECTED_LEGAL_ROUTE_HEADERS) {
    let routeSource = '';
    try {
      routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    } catch (error) {
      reject(`${expectedRoute.file} could not be read for Swedish token guard: ${error.message}`);
      continue;
    }

    const swedishBlock = extractBraceBlockFromKey(routeSource, /\bsv\s*:/);
    if (!swedishBlock) {
      reject(`${expectedRoute.file} Swedish legal copy block must stay parseable`);
      continue;
    }

    const stringValues = extractStaticStringLiterals(swedishBlock);
    for (const value of stringValues) {
      let stringIsValid = true;
      for (const token of FORBIDDEN_SWEDISH_LEGAL_ENGLISH_TOKENS) {
        if (new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i').test(value)) {
          stringIsValid = false;
          reject(`Swedish legal copy contains English token "${token}" in ${expectedRoute.file}`);
        }
      }
      if (stringIsValid) legalSwedishEnglishTokenGuardValidated += 1;
    }
  }

  if (legalSwedishEnglishTokenGuardValidated !== EXPECTED_LEGAL_SWEDISH_COPY_STRINGS) {
    reject(
      `Swedish legal copy token guard validated ${legalSwedishEnglishTokenGuardValidated} strings, expected ${EXPECTED_LEGAL_SWEDISH_COPY_STRINGS}`,
    );
  }

  if (valid) legalSwedishEnglishTokenGuardParityValidated = true;
}

function extractStaticPrivacyHtmlSurface(source) {
  const match = source.match(
    /<main\s+data-screen-label="02 Privacy"\s+data-page="\/privacy">[\s\S]*?<\/main>/,
  );
  return match?.[0] ?? source;
}

function extractLegalCopySurface(source) {
  return extractStaticStringLiterals(source).join('\n');
}

function validateLegalInternalMonetizationKeyGuard() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  const surfaces = EXPECTED_LEGAL_ROUTE_HEADERS.map((expectedRoute) => ({
    label: expectedRoute.file,
    read() {
      const routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
      return extractLegalCopySurface(routeSource);
    },
  })).concat([
    {
      label: 'site/app.js privacy i18n copy',
      read() {
        return fs.readFileSync(path.join(repoRoot, 'site/app.js'), 'utf8');
      },
    },
    {
      label: 'site/index.html privacy page',
      read() {
        const htmlSource = fs.readFileSync(path.join(repoRoot, 'site/index.html'), 'utf8');
        return extractStaticPrivacyHtmlSurface(htmlSource);
      },
    },
  ]);

  for (const surface of surfaces) {
    let surfaceText = '';
    try {
      surfaceText = surface.read();
    } catch (error) {
      reject(
        `${surface.label} could not be read for internal monetization key guard: ${error.message}`,
      );
      continue;
    }

    let surfaceIsValid = true;
    for (const { label, pattern } of FORBIDDEN_LEGAL_INTERNAL_MONETIZATION_COPY_PATTERNS) {
      if (pattern.test(surfaceText)) {
        surfaceIsValid = false;
        reject(
          `learner-facing legal/privacy copy must not expose internal monetization implementation key "${label}" in ${surface.label}`,
        );
      }
    }
    if (surfaceIsValid) legalInternalMonetizationKeyGuardValidated += 1;
  }

  if (
    legalInternalMonetizationKeyGuardValidated !== EXPECTED_LEGAL_INTERNAL_MONETIZATION_KEY_SURFACES
  ) {
    reject(
      `legal internal monetization key guard validated ${legalInternalMonetizationKeyGuardValidated} surfaces, expected ${EXPECTED_LEGAL_INTERNAL_MONETIZATION_KEY_SURFACES}`,
    );
  }

  if (valid) legalInternalMonetizationKeyGuardParityValidated = true;
}

function validateSettingsRouteHeaderParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`app/settings.tsx could not be read for header parity: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings =
    settingsRoute.match(/<Text\s+style=\{styles\.(?:title|sectionTitle)\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('settings route title and section text must expose accessibilityRole="header"');
  }

  EXPECTED_SETTINGS_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(settingsRoute)) {
      reject(`settings route missing ${expectedHeader.label} as a header`);
      return;
    }
    settingsRouteHeadersValidated += 1;
  });

  if (valid && settingsRouteHeadersValidated === EXPECTED_SETTINGS_ROUTE_HEADERS.length) {
    settingsRouteHeaderParityValidated = true;
  }
}

function validateSettingsRouteCopyParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_SETTINGS_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!settingsRoute.includes(snippet)) reject(message);
  });
  UNSUPPORTED_SETTINGS_LANGUAGE_SCOPE_LABELS.forEach((label) => {
    if (settingsRoute.includes(label)) {
      reject(
        `settings route must describe the app-wide study language, not ${JSON.stringify(label)}`,
      );
    }
  });
  const swedishSettingsCopyMatch = settingsRoute.match(/sv:\s*\{[\s\S]*?\n\s*\},\n\s*en:/);
  if (!swedishSettingsCopyMatch) {
    reject('settings route must expose a Swedish copy block before English copy');
  } else if (/\bFSRS\b|frysstatus/.test(swedishSettingsCopyMatch[0])) {
    reject('settings route Swedish import summary copy must hide scheduler jargon');
  } else if (/\bIAP\b/.test(swedishSettingsCopyMatch[0])) {
    reject(
      'settings route Swedish import copy must describe purchases in appen without IAP acronym',
    );
  }
  if (
    /aria-selected=\{(?:language === value|dailyGoalAnswers === goal)\}/.test(settingsRoute) ||
    /accessibilityState=\{\{\s*selected:\s*(?:language === value|dailyGoalAnswers === goal)\s*\}\}/.test(
      settingsRoute,
    )
  ) {
    reject('settings route language and daily-goal options must use radio semantics');
  }

  const seenLabels = new Set();
  Object.entries(EXPECTED_SETTINGS_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`settings route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!settingsRoute.includes(label)) {
        labelIsValid = false;
        reject(`settings route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`settings route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) settingsRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_SETTINGS_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && settingsRouteCopyLabelsValidated === expectedLabelCount) {
    settingsRouteCopyParityValidated = true;
  }
}

function validateOnboardingRouteHeaderParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`app/onboarding.tsx could not be read for header parity: ${error.message}`);
    return;
  }

  const unheaderedRouteHeadings = onboardingRoute.match(/<Text\s+style=\{styles\.title\}>/g) || [];
  if (unheaderedRouteHeadings.length > 0) {
    reject('onboarding route title text must expose accessibilityRole="header"');
  }

  EXPECTED_ONBOARDING_ROUTE_HEADERS.forEach((expectedHeader) => {
    if (!expectedHeader.pattern.test(onboardingRoute)) {
      reject(`onboarding route missing ${expectedHeader.label} as a header`);
      return;
    }
    onboardingRouteHeadersValidated += 1;
  });

  if (valid && onboardingRouteHeadersValidated === EXPECTED_ONBOARDING_ROUTE_HEADERS.length) {
    onboardingRouteHeaderParityValidated = true;
  }
}

function validateOnboardingRouteCopyParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`onboarding route copy source could not be read: ${error.message}`);
    return;
  }

  EXPECTED_ONBOARDING_ROUTE_COPY_SNIPPETS.forEach(([snippet, message]) => {
    if (!onboardingRoute.includes(snippet)) reject(message);
  });

  FORBIDDEN_ONBOARDING_SV_MISTAKE_REVIEW_COPY.forEach((pattern) => {
    if (pattern.test(onboardingRoute)) {
      reject(
        'onboarding route Swedish mistake-review copy must describe reviewing missed questions, not repeating mistakes',
      );
    }
  });

  const seenLabels = new Set();
  Object.entries(EXPECTED_ONBOARDING_ROUTE_COPY_LABELS).forEach(([language, labels]) => {
    labels.forEach((label) => {
      let labelIsValid = true;
      if (!textIsTrimmedSingleSpaced(label)) {
        labelIsValid = false;
        reject(`onboarding route ${language} copy ${JSON.stringify(label)} must be normalized`);
      }
      if (!onboardingRoute.includes(label)) {
        labelIsValid = false;
        reject(`onboarding route is missing ${language} copy ${JSON.stringify(label)}`);
      }

      const normalizedLabel = `${language}:${normalizeComparableText(label)}`;
      if (seenLabels.has(normalizedLabel)) {
        labelIsValid = false;
        reject(`onboarding route duplicates ${language} copy ${JSON.stringify(label)}`);
      }
      if (normalizedLabel) seenLabels.add(normalizedLabel);
      if (labelIsValid) onboardingRouteCopyLabelsValidated += 1;
    });
  });

  const expectedLabelCount = Object.values(EXPECTED_ONBOARDING_ROUTE_COPY_LABELS).reduce(
    (count, labels) => count + labels.length,
    0,
  );
  if (valid && onboardingRouteCopyLabelsValidated === expectedLabelCount) {
    onboardingRouteCopyParityValidated = true;
  }
}

function validateFirstRunAboutModalSuppressionParity() {
  let valid = true;
  let modalSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    modalSource = fs.readFileSync(
      path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/onboarding/FirstRunAboutTheTestModal.tsx could not be read for first-run route suppression: ${error.message}`,
    );
    return;
  }

  const suppressedPrefixMatch = modalSource.match(
    /const SUPPRESSED_PATH_PREFIXES = \[([\s\S]*?)\] as const;/,
  );
  if (!suppressedPrefixMatch) {
    reject('first-run about modal suppression prefixes must be declared as a const array');
    return;
  }

  const suppressedPrefixes = [...suppressedPrefixMatch[1].matchAll(/'([^']+)'/g)].map(
    (match) => match[1],
  );

  if (!arrayEquals(suppressedPrefixes, EXPECTED_FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PREFIXES)) {
    reject(
      `first-run about modal suppressed prefixes are ${JSON.stringify(
        suppressedPrefixes,
      )}, expected ${JSON.stringify(EXPECTED_FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PREFIXES)}`,
    );
  }

  for (const prefix of EXPECTED_FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PREFIXES) {
    if (!suppressedPrefixes.includes(prefix)) {
      reject(`first-run about modal must suppress ${prefix}`);
      continue;
    }
    firstRunAboutModalSuppressedRoutesValidated += 1;
  }

  for (const eligiblePath of EXPECTED_FIRST_RUN_ABOUT_MODAL_ELIGIBLE_PATHS) {
    if (suppressedPrefixes.includes(eligiblePath)) {
      reject(`first-run about modal must remain eligible on ${eligiblePath}`);
    }
  }

  const launchPopupRoutes = adsConfig?.suppressedLaunchPopupRoutes;
  if (!Array.isArray(launchPopupRoutes) || !launchPopupRoutes.includes('/onboarding')) {
    reject('launch popup route suppression must include /onboarding');
  }

  if (
    valid &&
    firstRunAboutModalSuppressedRoutesValidated ===
      EXPECTED_FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PREFIXES.length
  ) {
    firstRunAboutModalSuppressionParityValidated = true;
  }
}

function validateScreenShellLayoutParity() {
  let valid = true;
  let screenShell = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/ScreenShell.tsx could not be read for layout parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(screenShell)) {
    reject('ScreenShell must keep shared tab content inside ScrollView for mobile scrolling');
  }

  EXPECTED_SCREEN_SHELL_LAYOUT_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(screenShell)) {
      reject(`ScreenShell missing ${expectedRule.label} for shared layout parity`);
      return;
    }
    screenShellLayoutRulesValidated += 1;
  });

  if (valid && screenShellLayoutRulesValidated === EXPECTED_SCREEN_SHELL_LAYOUT_RULES.length) {
    screenShellLayoutParityValidated = true;
  }
}

function validateSettingsRouteScrollParity() {
  let valid = true;
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`app/settings.tsx could not be read for scroll parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(settingsRoute)) {
    reject('settings route must keep its root content inside ScrollView for mobile scrolling');
  }

  EXPECTED_SETTINGS_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(settingsRoute)) {
      reject(`settings route missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    settingsRouteScrollRulesValidated += 1;
  });

  if (valid && settingsRouteScrollRulesValidated === EXPECTED_SETTINGS_ROUTE_SCROLL_RULES.length) {
    settingsRouteScrollParityValidated = true;
  }
}

function validateOnboardingRouteScrollParity() {
  let valid = true;
  let onboardingRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');
  } catch (error) {
    reject(`app/onboarding.tsx could not be read for scroll parity: ${error.message}`);
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(onboardingRoute)) {
    reject('onboarding route must keep its root content inside ScrollView for mobile scrolling');
  }

  EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(onboardingRoute)) {
      reject(`onboarding route missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    onboardingRouteScrollRulesValidated += 1;
  });

  if (
    valid &&
    onboardingRouteScrollRulesValidated === EXPECTED_ONBOARDING_ROUTE_SCROLL_RULES.length
  ) {
    onboardingRouteScrollParityValidated = true;
  }
}

function validateLegalRouteScrollParity() {
  let valid = true;
  let legalPage = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    legalPage = fs.readFileSync(path.join(repoRoot, 'components/compliance/LegalPage.tsx'), 'utf8');
  } catch (error) {
    reject(
      `components/compliance/LegalPage.tsx could not be read for scroll parity: ${error.message}`,
    );
    return;
  }

  if (/<View\s+style=\{styles\.container\}>/.test(legalPage)) {
    reject(
      'legal routes must keep shared LegalPage content inside ScrollView for mobile scrolling',
    );
  }

  EXPECTED_LEGAL_ROUTE_SCROLL_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(legalPage)) {
      reject(`shared LegalPage missing ${expectedRule.label} for mobile scroll parity`);
      return;
    }
    legalRouteScrollRulesValidated += 1;
  });

  if (valid && legalRouteScrollRulesValidated === EXPECTED_LEGAL_ROUTE_SCROLL_RULES.length) {
    legalRouteScrollParityValidated = true;
  }
}

function validateButtonAccessibilityParity() {
  let valid = true;
  let buttonSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    buttonSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Button.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Button.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_BUTTON_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(buttonSource)) {
      reject(`Button missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    buttonAccessibilityRulesValidated += 1;
  });

  if (valid && buttonAccessibilityRulesValidated === EXPECTED_BUTTON_ACCESSIBILITY_RULES.length) {
    buttonAccessibilityParityValidated = true;
  }
}

function validateCardAccessibilityParity() {
  let valid = true;
  let cardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    cardSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Card.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Card.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(cardSource)) {
      reject(`Card missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    cardAccessibilityRulesValidated += 1;
  });

  if (valid && cardAccessibilityRulesValidated === EXPECTED_CARD_ACCESSIBILITY_RULES.length) {
    cardAccessibilityParityValidated = true;
  }
}

function validateProgressBarAccessibilityParity() {
  let valid = true;
  let progressBarSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressBarSource = fs.readFileSync(
      path.join(repoRoot, 'components/ui/ProgressBar.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/ui/ProgressBar.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(progressBarSource)) {
      reject(`ProgressBar missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    progressBarAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    progressBarAccessibilityRulesValidated === EXPECTED_PROGRESS_BAR_ACCESSIBILITY_RULES.length
  ) {
    progressBarAccessibilityParityValidated = true;
  }
}

function validateMetricCardAccessibilityParity() {
  let valid = true;
  let metricCardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    metricCardSource = fs.readFileSync(path.join(repoRoot, 'components/ui/MetricCard.tsx'), 'utf8');
  } catch (error) {
    reject(
      `components/ui/MetricCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(metricCardSource)) {
      reject(`MetricCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    metricCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    metricCardAccessibilityRulesValidated === EXPECTED_METRIC_CARD_ACCESSIBILITY_RULES.length
  ) {
    metricCardAccessibilityParityValidated = true;
  }
}

function validateBadgeAccessibilityParity() {
  let valid = true;
  let badgeSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    badgeSource = fs.readFileSync(path.join(repoRoot, 'components/ui/Badge.tsx'), 'utf8');
  } catch (error) {
    reject(`components/ui/Badge.tsx could not be read for accessibility parity: ${error.message}`);
    return;
  }

  EXPECTED_BADGE_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(badgeSource)) {
      reject(`Badge missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    badgeAccessibilityRulesValidated += 1;
  });

  if (valid && badgeAccessibilityRulesValidated === EXPECTED_BADGE_ACCESSIBILITY_RULES.length) {
    badgeAccessibilityParityValidated = true;
  }
}

function validateChapterCardAccessibilityParity() {
  let valid = true;
  let chapterCardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    chapterCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/ChapterCard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/ChapterCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(chapterCardSource)) {
      reject(`ChapterCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    chapterCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    chapterCardAccessibilityRulesValidated === EXPECTED_CHAPTER_CARD_ACCESSIBILITY_RULES.length
  ) {
    chapterCardAccessibilityParityValidated = true;
  }
}

function validateFlashcardAccessibilityParity() {
  let valid = true;
  let flashcardSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    flashcardSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/Flashcard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/Flashcard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_FLASHCARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(flashcardSource)) {
      reject(`Flashcard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    flashcardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    flashcardAccessibilityRulesValidated === EXPECTED_FLASHCARD_ACCESSIBILITY_RULES.length
  ) {
    flashcardAccessibilityParityValidated = true;
  }
}

function validateAudioButtonAccessibilityParity() {
  let valid = true;
  let audioButtonSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    audioButtonSource = fs.readFileSync(
      path.join(repoRoot, 'components/learning/AudioButton.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/learning/AudioButton.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(audioButtonSource)) {
      reject(`AudioButton missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    audioButtonAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    audioButtonAccessibilityRulesValidated === EXPECTED_AUDIO_BUTTON_ACCESSIBILITY_RULES.length
  ) {
    audioButtonAccessibilityParityValidated = true;
  }
}

if (focusedValidationRequested('audioButtonAccessibility')) {
  validateAudioButtonAccessibilityParity();
  exitWithValidationFailures();
  printValidationSummary({
    audioButtonAccessibilityRulesValidated,
    audioButtonAccessibilityParityValidated,
  });
  process.exit(0);
}

function validateQuestionCardAccessibilityParity() {
  let valid = true;
  let questionCardSource = '';
  let questionTextSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    questionCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/QuestionCard.tsx'),
      'utf8',
    );
    questionTextSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/questionText.ts'), 'utf8');
  } catch (error) {
    reject(
      `components/quiz/QuestionCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(questionCardSource)) {
      reject(`QuestionCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    questionCardAccessibilityRulesValidated += 1;
  });

  EXPECTED_QUESTION_SOURCE_CITATION_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(questionTextSource)) {
      reject(`QuestionCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    questionCardAccessibilityRulesValidated += 1;
  });

  if (/Källa\/Source/.test(questionTextSource)) {
    reject('QuestionCard source citation helper still exposes mixed Källa/Source prefix');
  } else {
    questionCardAccessibilityRulesValidated += 1;
  }

  if (
    valid &&
    questionCardAccessibilityRulesValidated ===
      EXPECTED_QUESTION_CARD_ACCESSIBILITY_RULES.length +
        EXPECTED_QUESTION_SOURCE_CITATION_RULES.length +
        1
  ) {
    questionCardAccessibilityParityValidated = true;
  }
}

function validateAnswerOptionAccessibilityParity() {
  let valid = true;
  let answerOptionSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    answerOptionSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/AnswerOption.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/AnswerOption.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(answerOptionSource)) {
      reject(`AnswerOption missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    answerOptionAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    answerOptionAccessibilityRulesValidated === EXPECTED_ANSWER_OPTION_ACCESSIBILITY_RULES.length
  ) {
    answerOptionAccessibilityParityValidated = true;
  }
}

function validateExplanationPanelAccessibilityParity() {
  let valid = true;
  let explanationPanelSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    explanationPanelSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/ExplanationPanel.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/ExplanationPanel.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(explanationPanelSource)) {
      reject(`ExplanationPanel missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    explanationPanelAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    explanationPanelAccessibilityRulesValidated ===
      EXPECTED_EXPLANATION_PANEL_ACCESSIBILITY_RULES.length
  ) {
    explanationPanelAccessibilityParityValidated = true;
  }
}

function validateUhrReferenceCardAccessibilityParity() {
  let valid = true;
  let uhrReferenceCardSource = '';
  let sourceCitationSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    uhrReferenceCardSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/UHRReferenceCard.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/UHRReferenceCard.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  try {
    sourceCitationSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/SourceCitation.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/SourceCitation.tsx could not be read for UHRReferenceCard accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(uhrReferenceCardSource)) {
      reject(`UHRReferenceCard missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    uhrReferenceCardAccessibilityRulesValidated += 1;
  });
  EXPECTED_SOURCE_CITATION_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(sourceCitationSource)) {
      reject(
        `SourceCitation missing ${expectedRule.label} for UHRReferenceCard accessibility parity`,
      );
      return;
    }
    uhrReferenceCardAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    uhrReferenceCardAccessibilityRulesValidated ===
      EXPECTED_UHR_REFERENCE_CARD_ACCESSIBILITY_RULES.length +
        EXPECTED_SOURCE_CITATION_ACCESSIBILITY_RULES.length
  ) {
    uhrReferenceCardAccessibilityParityValidated = true;
  }
}

if (focusedValidationRequested('uhrReferenceCardAccessibility')) {
  validateUhrReferenceCardAccessibilityParity();
  exitWithValidationFailures();
  printValidationSummary({
    uhrReferenceCardAccessibilityRulesValidated,
    uhrReferenceCardAccessibilityParityValidated,
  });
  process.exit(0);
}

function validateCelebrationBurstAccessibilityParity() {
  let valid = true;
  let celebrationBurstSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    celebrationBurstSource = fs.readFileSync(
      path.join(repoRoot, 'components/quiz/CelebrationBurst.tsx'),
      'utf8',
    );
  } catch (error) {
    reject(
      `components/quiz/CelebrationBurst.tsx could not be read for accessibility parity: ${error.message}`,
    );
    return;
  }

  EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES.forEach((expectedRule) => {
    if (!expectedRule.pattern.test(celebrationBurstSource)) {
      reject(`CelebrationBurst missing ${expectedRule.label} for accessibility parity`);
      return;
    }
    celebrationBurstAccessibilityRulesValidated += 1;
  });

  if (
    valid &&
    celebrationBurstAccessibilityRulesValidated ===
      EXPECTED_CELEBRATION_BURST_ACCESSIBILITY_RULES.length
  ) {
    celebrationBurstAccessibilityParityValidated = true;
  }
}

if (focusedValidationRequested('celebrationBurstAccessibility')) {
  validateCelebrationBurstAccessibilityParity();
  exitWithValidationFailures();
  printValidationSummary({
    celebrationBurstAccessibilityRulesValidated,
    celebrationBurstAccessibilityParityValidated,
  });
  process.exit(0);
}

function firstWrongOptionId(question) {
  return question.options?.find((option) => option.id !== question.correctOptionId)?.id;
}

function validateExamReviewSourceParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function' || typeof buildExamReviewItems !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
  const reviewItems = buildExamReviewItems(examQuestions, answers);
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(reviewItems)) {
    reject('buildExamReviewItems did not return an array for the default mock exam');
    return;
  }
  if (reviewItems.length !== examQuestions.length) {
    reject(
      `buildExamReviewItems returned ${reviewItems.length} items for ${examQuestions.length} default exam questions`,
    );
  }

  reviewItems.forEach((item, index) => {
    const question = examQuestions[index];
    const label = question?.id || `exam review item[${index}]`;
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!question) {
      rejectItem(`${label} has no matching default exam question`);
      return;
    }

    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    if (item.questionId !== question.id) rejectItem(`${label} review questionId drifted`);
    if (item.questionSv !== question.questionSv)
      rejectItem(`${label} review question text drifted`);
    if (item.chapterId !== question.chapterId) rejectItem(`${label} review chapter drifted`);
    if (item.explanationSv !== question.explanationSv) {
      rejectItem(`${label} review explanation drifted`);
    }
    if (!jsonEqual(item.uhrReference, question.uhrReference)) {
      rejectItem(`${label} review UHR reference drifted`);
    }
    if (item.selectedOptionTextSv !== selectedOption?.textSv) {
      rejectItem(`${label} review selected answer text drifted`);
    }
    if (item.correctOptionTextSv !== correctOption?.textSv) {
      rejectItem(`${label} review correct answer text drifted`);
    }
    if (item.isCorrect !== (answers[question.id] === question.correctOptionId)) {
      rejectItem(`${label} review correctness drifted`);
    }
    if (item.selectedOptionTextSv === 'Not answered') {
      rejectItem(`${label} review did not resolve the selected answer`);
    }
    if (item.correctOptionTextSv === 'Correct answer missing') {
      rejectItem(`${label} review did not resolve the correct answer`);
    }

    if (itemIsValid) examReviewItemsValidated += 1;
  });

  if (
    valid &&
    examReviewItemsValidated === examQuestions.length &&
    reviewItems.some((item) => item.isCorrect) &&
    reviewItems.some((item) => !item.isCorrect)
  ) {
    examReviewSourceParityValidated = true;
  }
}

function buildAlternatingExamAnswers(examQuestions) {
  return Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
}

function validateExamChapterBreakdownParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (
    !Array.isArray(chapters) ||
    typeof generateExam !== 'function' ||
    typeof scoreExam !== 'function' ||
    typeof buildExamChapterBreakdownItems !== 'function'
  ) {
    return;
  }

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = buildAlternatingExamAnswers(examQuestions);
  const result = scoreExam(examQuestions, answers);
  const breakdownItems = buildExamChapterBreakdownItems(result.chapterBreakdown, chapters);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const expectedByChapter = new Map();
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  examQuestions.forEach((question) => {
    const previous = expectedByChapter.get(question.chapterId) ?? {
      correctCount: 0,
      totalCount: 0,
    };
    expectedByChapter.set(question.chapterId, {
      correctCount:
        previous.correctCount + (answers[question.id] === question.correctOptionId ? 1 : 0),
      totalCount: previous.totalCount + 1,
    });
  });

  if (result.totalCount !== examQuestions.length) {
    reject(`scoreExam totalCount is ${result.totalCount}, expected ${examQuestions.length}`);
  }
  const expectedCorrectCount = [...expectedByChapter.values()].reduce(
    (sum, chapterResult) => sum + chapterResult.correctCount,
    0,
  );
  if (result.correctCount !== expectedCorrectCount) {
    reject(`scoreExam correctCount is ${result.correctCount}, expected ${expectedCorrectCount}`);
  }
  if (breakdownItems.length !== expectedByChapter.size) {
    reject(
      `exam chapter breakdown has ${breakdownItems.length} rows, expected ${expectedByChapter.size}`,
    );
  }

  breakdownItems.forEach((item) => {
    const chapter = chapterById.get(item.chapterId);
    const expected = expectedByChapter.get(item.chapterId);
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!chapter) {
      rejectItem(`${item.chapterId} breakdown row references an unknown chapter`);
    } else {
      if (item.chapterNameSv !== chapter.nameSv) {
        rejectItem(`${item.chapterId} breakdown Swedish chapter name drifted`);
      }
      if (item.chapterNameEn !== chapter.nameEn) {
        rejectItem(`${item.chapterId} breakdown English chapter name drifted`);
      }
    }

    if (!expected) {
      rejectItem(`${item.chapterId} breakdown row is not present in the default exam`);
    } else {
      if (item.correctCount !== expected.correctCount) {
        rejectItem(`${item.chapterId} breakdown correctCount drifted`);
      }
      if (item.totalCount !== expected.totalCount) {
        rejectItem(`${item.chapterId} breakdown totalCount drifted`);
      }
    }

    if (itemIsValid) examChapterBreakdownItemsValidated += 1;
  });

  const countedTotal = breakdownItems.reduce((sum, item) => sum + item.totalCount, 0);
  if (countedTotal !== examQuestions.length) {
    reject(
      `exam chapter breakdown counted ${countedTotal} questions, expected ${examQuestions.length}`,
    );
  }

  if (
    valid &&
    examChapterBreakdownItemsValidated === breakdownItems.length &&
    breakdownItems.length === expectedByChapter.size
  ) {
    examChapterBreakdownParityValidated = true;
  }
}

function validateExamGeneratorTypeSchemaParity() {
  let valid = true;
  let examGeneratorSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    examGeneratorSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/examGenerator.ts'), 'utf8');
  } catch (error) {
    reject(`lib/quiz/examGenerator.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_EXAM_GENERATOR_TYPE_ALIASES.forEach(({ typeName, type }) => {
    const actualType = extractTypeAliasTextFromTs(examGeneratorSource, typeName);
    if (actualType !== type) {
      reject(
        `lib/quiz/examGenerator.ts ${typeName} type is ${JSON.stringify(
          actualType,
        )}, expected ${JSON.stringify(type)}`,
      );
      return;
    }
    examGeneratorTypeAliasesValidated += 1;
  });

  EXPECTED_EXAM_GENERATOR_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      examGeneratorSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/quiz/examGenerator.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/quiz/examGenerator.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/quiz/examGenerator.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) examGeneratorTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    examGeneratorTypeAliasesValidated === EXPECTED_EXAM_GENERATOR_TYPE_ALIASES.length &&
    examGeneratorTypeInterfacesValidated === EXPECTED_EXAM_GENERATOR_INTERFACES.length
  ) {
    examGeneratorTypeSchemaParityValidated = true;
  }
}

function validateUxBenchmarks() {
  if (!Array.isArray(uxBenchmarks)) return;

  if (uxBenchmarks.length !== EXPECTED_UX_BENCHMARKS) {
    fail(`expected ${EXPECTED_UX_BENCHMARKS} UX benchmarks, found ${uxBenchmarks.length}`);
  }

  const seenProducts = new Set();
  const seenSources = new Set();

  uxBenchmarks.forEach((benchmark, index) => {
    const label = hasText(benchmark?.product) ? benchmark.product : `ux benchmark[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!benchmark || typeof benchmark !== 'object') {
      reject(`ux benchmark[${index}] is not an object`);
    } else {
      for (const field of ['product', 'lesson', 'source']) {
        if (!hasText(benchmark[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(benchmark[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      const normalizedProduct = normalizeComparableText(benchmark.product);
      if (normalizedProduct && seenProducts.has(normalizedProduct)) {
        reject(`${label} duplicates UX benchmark product`);
      }
      if (normalizedProduct) seenProducts.add(normalizedProduct);

      if (hasText(benchmark.source)) {
        if (!isHttpsUrl(benchmark.source)) {
          reject(`${label} source must be an HTTPS URL`);
        }
        if (seenSources.has(benchmark.source)) {
          reject(`${label} duplicates UX benchmark source`);
        }
        seenSources.add(benchmark.source);
      }
    }

    if (valid) uxBenchmarksValidated += 1;
  });
}

function validateLocalizationLanguageContract() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(supportedLanguages)) return;
  if (!arrayEquals(supportedLanguages, EXPECTED_SUPPORTED_LANGUAGES)) {
    reject(
      `supportedLanguages is ${JSON.stringify(supportedLanguages)}, expected ${JSON.stringify(
        EXPECTED_SUPPORTED_LANGUAGES,
      )}`,
    );
  }

  const seenLanguages = new Set();
  supportedLanguages.forEach((language, index) => {
    let languageIsValid = true;
    if (!/^[a-z]{2}$/.test(language)) {
      languageIsValid = false;
      reject(`supportedLanguages[${index}] must be a lowercase ISO language code`);
    }
    if (seenLanguages.has(language)) {
      languageIsValid = false;
      reject(`supportedLanguages has duplicate language ${language}`);
    }
    seenLanguages.add(language);
    if (!hasText(EXPECTED_LANGUAGE_LABELS[language])) {
      languageIsValid = false;
      reject(`supported language ${language} is missing a settings label`);
    }
    if (languageIsValid) supportedLanguagesValidated += 1;
  });

  if (
    !localizationStrings ||
    typeof localizationStrings !== 'object' ||
    Array.isArray(localizationStrings)
  ) {
    return;
  }

  Object.entries(localizationStrings).forEach(([key, value]) => {
    let entryIsValid = true;

    function rejectEntry(message) {
      entryIsValid = false;
      reject(message);
    }

    if (!isSlugTag(key)) rejectEntry(`strings.${key} key must use lowercase kebab-case`);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      rejectEntry(`strings.${key} must be a language map object`);
      return;
    }

    supportedLanguages.forEach((language) => {
      const text = value[language];
      if (!hasText(text)) {
        rejectEntry(`strings.${key}.${language} is missing`);
      } else if (!textIsTrimmedSingleSpaced(text)) {
        rejectEntry(`strings.${key}.${language} must be trimmed and single-spaced`);
      }
    });

    const extraLanguages = Object.keys(value).filter((language) => !seenLanguages.has(language));
    if (extraLanguages.length) {
      rejectEntry(`strings.${key} has unsupported languages ${extraLanguages.join(', ')}`);
    }

    if (entryIsValid) localizationStringsValidated += 1;
  });

  let settingsStore = '';
  let settingsRoute = '';
  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings language parity source could not be read: ${error.message}`);
    return;
  }

  const appLanguageValues = extractStringUnionTypeFromTs(settingsStore, 'AppLanguage');
  if (!Array.isArray(appLanguageValues) || !arrayEquals(appLanguageValues, supportedLanguages)) {
    reject(
      `AppLanguage union is ${JSON.stringify(appLanguageValues)}, expected ${JSON.stringify(
        supportedLanguages,
      )}`,
    );
  }

  const languageButtonCalls = extractCallStringArgumentsFromTs(
    settingsRoute,
    'renderLanguageButton',
  );
  const routeLanguages = languageButtonCalls.map(([language]) => language);
  if (!arrayEquals(routeLanguages, supportedLanguages)) {
    reject(
      `app/settings.tsx language buttons are ${JSON.stringify(
        routeLanguages,
      )}, expected ${JSON.stringify(supportedLanguages)}`,
    );
  }

  const seenLabels = new Set();
  languageButtonCalls.forEach(([language, label], index) => {
    if (label !== EXPECTED_LANGUAGE_LABELS[language]) {
      reject(
        `app/settings.tsx language button[${index}] label is ${JSON.stringify(
          label,
        )}, expected ${JSON.stringify(EXPECTED_LANGUAGE_LABELS[language])}`,
      );
    }
    if (!textIsTrimmedSingleSpaced(label)) {
      reject(`app/settings.tsx language button[${index}] label must be trimmed and single-spaced`);
    }
    const normalizedLabel = normalizeComparableText(label);
    if (seenLabels.has(normalizedLabel)) {
      reject(`app/settings.tsx duplicates language label ${label}`);
    }
    if (normalizedLabel) seenLabels.add(normalizedLabel);
  });

  if (!settingsRoute.includes('Svenska') || !settingsRoute.includes('Engelskt stöd')) {
    reject('app/settings.tsx must expose Swedish labels for language buttons in Swedish mode');
  }
  UNSUPPORTED_SETTINGS_LANGUAGE_SCOPE_LABELS.forEach((label) => {
    if (settingsRoute.includes(label)) {
      reject(
        `app/settings.tsx must not expose narrow language scope label ${JSON.stringify(label)}`,
      );
    }
  });
  if (!settingsRoute.includes('Byt studiespråk till ${label}')) {
    reject('app/settings.tsx language buttons must expose Swedish accessibility text');
  }
  if (!settingsRoute.includes('Set study language to ${label}')) {
    reject('app/settings.tsx language buttons must expose label-derived accessibility text');
  }

  if (valid) languageSettingsParityValidated = true;
}

function validateSettingsStoreSchemaParity() {
  let valid = true;
  let settingsStore = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
  } catch (error) {
    reject(`settings store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(settingsStore, 'SettingsState');
  if (!Array.isArray(actualFields)) {
    reject('lib/storage/settingsStore.ts SettingsState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_SETTINGS_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `SettingsState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_SETTINGS_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`SettingsState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `SettingsState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `SettingsState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) settingsStoreFieldsValidated += 1;
  });

  const languageKey = extractStringConstantFromTs(settingsStore, 'languageKey');
  const audioEnabledKey = extractStringConstantFromTs(settingsStore, 'audioEnabledKey');
  const dailyGoalKey = extractStringConstantFromTs(settingsStore, 'dailyGoalKey');
  if (languageKey !== 'language') {
    reject(`languageKey is ${JSON.stringify(languageKey)}, expected "language"`);
  }
  if (audioEnabledKey !== EXPECTED_AUDIO_SETTING_KEY) {
    reject(
      `audioEnabledKey is ${JSON.stringify(audioEnabledKey)}, expected ${JSON.stringify(
        EXPECTED_AUDIO_SETTING_KEY,
      )}`,
    );
  }
  if (dailyGoalKey !== 'dailyGoalAnswers') {
    reject(`dailyGoalKey is ${JSON.stringify(dailyGoalKey)}, expected "dailyGoalAnswers"`);
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  const requiredSnippets = [
    [
      'createMMKV({ id: settingsStorageId })',
      'settings storage must use the stable settings MMKV id',
    ],
    ['language: readLanguage()', 'SettingsState must initialize language from persisted storage'],
    [
      'audioEnabled: readAudioEnabled()',
      'SettingsState must initialize audioEnabled from persisted storage',
    ],
    [
      'dailyGoalAnswers: readDailyGoalAnswers()',
      'SettingsState must initialize dailyGoalAnswers from persisted storage',
    ],
    [
      'writeRecoverably( settingsStorage, settingsStorageId, languageKey, language, );',
      'setLanguage must persist through languageKey',
    ],
    [
      'writeRecoverably( settingsStorage, settingsStorageId, audioEnabledKey, audioEnabled, );',
      'setAudioEnabled must persist through audioEnabledKey',
    ],
    [
      'writeRecoverably( settingsStorage, settingsStorageId, dailyGoalKey, normalizedGoal, );',
      'setDailyGoalAnswers must persist the clamped daily goal through dailyGoalKey',
    ],
  ];

  requiredSnippets.forEach(([snippet, message]) => {
    if (!normalizedSettingsStore.includes(snippet)) {
      reject(message);
    }
  });

  if (valid && settingsStoreFieldsValidated === EXPECTED_SETTINGS_STORE_FIELDS.length) {
    settingsStoreSchemaParityValidated = true;
  }
}

function validateSettingsDailyGoalParity() {
  let valid = true;
  let settingsStore = '';
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings daily-goal parity source could not be read: ${error.message}`);
    return;
  }

  const dailyGoalKey = extractStringConstantFromTs(settingsStore, 'dailyGoalKey');
  if (dailyGoalKey !== 'dailyGoalAnswers') {
    reject(`dailyGoalKey is ${JSON.stringify(dailyGoalKey)}, expected "dailyGoalAnswers"`);
  }

  if (!settingsStore.includes(`const defaultDailyGoalAnswers = ${EXPECTED_DAILY_GOAL_DEFAULT};`)) {
    reject(`readDailyGoalAnswers must default to ${EXPECTED_DAILY_GOAL_DEFAULT} answers`);
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  const requiredStoreSnippets = [
    ['const defaultDailyGoalAnswers = 10;', 'settings store must define the daily-goal default'],
    [
      'function normalizeDailyGoalAnswers',
      'settings store must centralize daily-goal normalization',
    ],
    [
      'const storedValue = readStorageNumber(dailyGoalKey);',
      'readDailyGoalAnswers must read the raw persisted daily goal safely',
    ],
    [
      'return normalizeDailyGoalAnswers(storedValue);',
      'readDailyGoalAnswers must normalize the raw persisted value',
    ],
    ['typeof answerCount !==', 'normalizeDailyGoalAnswers must reject non-numeric runtime values'],
    [
      'Number.isFinite(answerCount)',
      'normalizeDailyGoalAnswers must reject non-finite runtime values',
    ],
    [
      'Number.isInteger(answerCount)',
      'normalizeDailyGoalAnswers must reject fractional runtime values',
    ],
    [
      'answerCount < minDailyGoalAnswers',
      'normalizeDailyGoalAnswers must reject values below the daily-goal minimum',
    ],
    [
      'answerCount > maxDailyGoalAnswers',
      'normalizeDailyGoalAnswers must reject values above the daily-goal maximum',
    ],
    [
      'const normalizedGoal = normalizeDailyGoalAnswers(dailyGoalAnswers);',
      'setDailyGoalAnswers must normalize runtime input before persisting',
    ],
  ];

  requiredStoreSnippets.forEach(([snippet, message]) => {
    if (!normalizedSettingsStore.includes(snippet)) reject(message);
  });
  if (normalizedSettingsStore.includes('Math.round(dailyGoalAnswers)')) {
    reject('setDailyGoalAnswers must not round unsafe runtime input directly');
  }
  if (!normalizedSettingsStore.includes('const storedValue = readStorageNumber(dailyGoalKey);')) {
    reject('readDailyGoalAnswers must read the persisted value through readStorageNumber');
  }
  if (!normalizedSettingsStore.includes('return normalizeDailyGoalAnswers(storedValue);')) {
    reject('readDailyGoalAnswers must normalize the raw persisted value');
  }
  if (!normalizedSettingsStore.includes('const storedDailyGoalOptions = [5, 10, 20, 40];')) {
    reject('settings store must define the persisted daily-goal option set');
  }
  if (!normalizedSettingsStore.includes('storedDailyGoalOptions.includes(answerCount)')) {
    reject('readDailyGoalAnswers must only hydrate stored daily-goal values from shipped options');
  }
  if (settingsStore.includes('storedValue && storedValue > 0 ? storedValue : 10')) {
    reject('readDailyGoalAnswers must not hydrate raw positive persisted values');
  }

  const goalOptionArrays = extractMappedNumericArraysFromTs(settingsRoute, 'goal');
  const goalOptions = goalOptionArrays[0] || [];
  if (!arrayEquals(goalOptions, EXPECTED_DAILY_GOAL_OPTIONS)) {
    reject(
      `app/settings.tsx daily goal options are ${JSON.stringify(
        goalOptionArrays,
      )}, expected ${JSON.stringify(EXPECTED_DAILY_GOAL_OPTIONS)}`,
    );
  }

  const seenGoals = new Set();
  goalOptions.forEach((goal, index) => {
    let optionIsValid = true;
    if (!Number.isInteger(goal)) {
      optionIsValid = false;
      reject(`daily goal option[${index}] must be an integer`);
    } else {
      if (goal < EXPECTED_DAILY_GOAL_MIN || goal > EXPECTED_DAILY_GOAL_MAX) {
        optionIsValid = false;
        reject(
          `daily goal option ${goal} must be between ${EXPECTED_DAILY_GOAL_MIN} and ${EXPECTED_DAILY_GOAL_MAX}`,
        );
      }
      if (seenGoals.has(goal)) {
        optionIsValid = false;
        reject(`daily goal option ${goal} is duplicated`);
      }
      seenGoals.add(goal);
    }

    if (optionIsValid) settingsDailyGoalOptionsValidated += 1;
  });

  if (!seenGoals.has(EXPECTED_DAILY_GOAL_DEFAULT)) {
    reject(`daily goal options must include the default ${EXPECTED_DAILY_GOAL_DEFAULT}`);
  }
  if (!settingsRoute.includes('Set daily goal to ${goal} answers')) {
    reject('app/settings.tsx daily goal buttons must expose goal-derived accessibility text');
  }
  if (!settingsRoute.includes('Ställ in dagligt mål till ${goal} svar')) {
    reject('app/settings.tsx daily goal buttons must expose Swedish accessibility text');
  }
  if (!settingsRoute.includes('${answerCount} svar per dag')) {
    reject('app/settings.tsx must render the Swedish persisted daily-goal count');
  }
  if (!settingsRoute.includes('${answerCount} answers per day')) {
    reject('app/settings.tsx must render the persisted daily-goal count');
  }

  if (valid && settingsDailyGoalOptionsValidated === EXPECTED_DAILY_GOAL_OPTIONS.length) {
    settingsDailyGoalParityValidated = true;
  }
}

function validateSettingsAudioParity() {
  let valid = true;
  let settingsStore = '';
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings audio parity source could not be read: ${error.message}`);
    return;
  }

  const audioEnabledKey = extractStringConstantFromTs(settingsStore, 'audioEnabledKey');
  if (audioEnabledKey !== EXPECTED_AUDIO_SETTING_KEY) {
    reject(
      `audioEnabledKey is ${JSON.stringify(audioEnabledKey)}, expected ${JSON.stringify(
        EXPECTED_AUDIO_SETTING_KEY,
      )}`,
    );
  }

  const settingsFields = extractObjectTypePropertiesFromTs(settingsStore, 'SettingsState') || [];
  const settingsFieldsByName = new Map(settingsFields.map((field) => [field.name, field]));
  const audioEnabledField = settingsFieldsByName.get('audioEnabled');
  const setAudioEnabledField = settingsFieldsByName.get('setAudioEnabled');
  if (!audioEnabledField || audioEnabledField.type !== 'boolean' || audioEnabledField.optional) {
    reject('SettingsState.audioEnabled must be a required boolean');
  }
  if (
    !setAudioEnabledField ||
    setAudioEnabledField.type !== '(enabled: boolean) => void' ||
    setAudioEnabledField.optional
  ) {
    reject('SettingsState.setAudioEnabled must accept a boolean enabled value');
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  if (
    !normalizedSettingsStore.includes('const storedValue = readStorageBoolean(audioEnabledKey);')
  ) {
    reject('readAudioEnabled must read the persisted audioEnabled boolean');
  }
  if (!normalizedSettingsStore.includes('return storedValue ?? true;')) {
    reject('readAudioEnabled must default audio to enabled');
  }
  if (!normalizedSettingsStore.includes('audioEnabled: readAudioEnabled()')) {
    reject('SettingsState must initialize audioEnabled from persisted storage');
  }
  if (
    !normalizedSettingsStore.includes(
      'writeRecoverably( settingsStorage, settingsStorageId, audioEnabledKey, audioEnabled, );',
    )
  ) {
    reject('setAudioEnabled must persist audioEnabled through audioEnabledKey');
  }
  if (!settingsStore.includes("import { stopSpeech } from '../audio/speak';")) {
    reject('setAudioEnabled(false) must stop any in-flight speech before muting');
  }
  if (!normalizedSettingsStore.includes('if (!audioEnabled) { stopSpeech(); }')) {
    reject('setAudioEnabled(false) must stop any in-flight speech before muting');
  }
  if (!normalizedSettingsStore.includes("if (typeof audioEnabled !== 'boolean') return;")) {
    reject('setAudioEnabled must ignore invalid runtime input');
  }

  if (
    !settingsRoute.includes('const audioEnabled = useSettingsStore((state) => state.audioEnabled);')
  ) {
    reject('app/settings.tsx must read audioEnabled from useSettingsStore');
  }
  if (
    !settingsRoute.includes(
      'const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);',
    )
  ) {
    reject('app/settings.tsx must read setAudioEnabled from useSettingsStore');
  }
  if (!settingsRoute.includes('accessibilityRole="switch"')) {
    reject('app/settings.tsx audio control must expose switch accessibility role');
  }
  if (!settingsRoute.includes('accessibilityState={{ checked: audioEnabled }}')) {
    reject('app/settings.tsx audio switch must expose checked state from audioEnabled');
  }
  if (
    !settingsRoute.includes(
      'audioEnabled ? copy.disableAudioAccessibilityLabel : copy.enableAudioAccessibilityLabel',
    )
  ) {
    reject('app/settings.tsx audio switch must expose state-changing accessibility labels');
  }
  if (!settingsRoute.includes('onPress={() => setAudioEnabled(!audioEnabled)}')) {
    reject('app/settings.tsx audio switch must toggle persisted audio state');
  }
  if (!settingsRoute.includes('audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel')) {
    reject('app/settings.tsx audio switch must render the current audio state label');
  }

  const seenLabels = new Set();
  EXPECTED_AUDIO_LABELS.forEach((label) => {
    let labelIsValid = true;
    if (!textIsTrimmedSingleSpaced(label)) {
      labelIsValid = false;
      reject(`audio label ${JSON.stringify(label)} must be trimmed and single-spaced`);
    }
    if (!settingsRoute.includes(label)) {
      labelIsValid = false;
      reject(`app/settings.tsx is missing audio label ${JSON.stringify(label)}`);
    }
    const normalizedLabel = normalizeComparableText(label);
    if (seenLabels.has(normalizedLabel)) {
      labelIsValid = false;
      reject(`audio label ${JSON.stringify(label)} is duplicated`);
    }
    if (normalizedLabel) seenLabels.add(normalizedLabel);
    if (labelIsValid) settingsAudioLabelsValidated += 1;
  });

  EXPECTED_AUDIO_ACCESSIBILITY_LABELS.forEach((label) => {
    if (!settingsRoute.includes(label)) {
      reject(`app/settings.tsx is missing audio accessibility label ${JSON.stringify(label)}`);
    }
  });

  if (valid && settingsAudioLabelsValidated === EXPECTED_AUDIO_LABELS.length) {
    settingsAudioParityValidated = true;
  }
}

function validateProgressQuestionSchemaParity() {
  let valid = true;
  let progressTypesSource = '';
  let progressStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressTypesSource = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
    progressStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/storage/progressStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`progress schema parity source could not be read: ${error.message}`);
    return;
  }

  const publicFields = extractObjectTypePropertiesFromTs(
    progressTypesSource,
    'UserQuestionProgress',
  );
  const storeFields = extractObjectTypePropertiesFromTs(progressStoreSource, 'QuestionProgress');
  if (!Array.isArray(publicFields)) {
    reject('types/progress.ts UserQuestionProgress interface could not be read');
    return;
  }
  if (!Array.isArray(storeFields)) {
    reject('lib/storage/progressStore.ts QuestionProgress type could not be read');
    return;
  }

  const publicFieldsByName = new Map(publicFields.map((field) => [field.name, field]));
  const storeFieldsByName = new Map(storeFields.map((field) => [field.name, field]));
  const storeFieldNames = storeFields.map((field) => field.name);
  if (!arrayEquals(storeFieldNames, EXPECTED_PROGRESS_QUESTION_FIELDS)) {
    reject(
      `QuestionProgress fields are ${JSON.stringify(
        storeFieldNames,
      )}, expected ${JSON.stringify(EXPECTED_PROGRESS_QUESTION_FIELDS)}`,
    );
  }

  publicFields.forEach((field) => {
    if (!EXPECTED_PROGRESS_QUESTION_FIELDS.includes(field.name) && !field.optional) {
      reject(`UserQuestionProgress ${field.name} must be optional unless persisted by the store`);
    }
  });

  EXPECTED_PROGRESS_QUESTION_FIELDS.forEach((fieldName) => {
    let fieldIsValid = true;
    const expectedOptional = EXPECTED_PROGRESS_OPTIONAL_FIELDS.has(fieldName);
    const expectedType = EXPECTED_PROGRESS_QUESTION_FIELD_TYPES[fieldName];
    const publicField = publicFieldsByName.get(fieldName);
    const storeField = storeFieldsByName.get(fieldName);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!publicField) {
      rejectField(`UserQuestionProgress missing ${fieldName}`);
    } else {
      if (publicField.optional !== expectedOptional) {
        rejectField(
          `UserQuestionProgress ${fieldName} optional=${publicField.optional}, expected ${expectedOptional}`,
        );
      }
      if (publicField.type !== expectedType) {
        rejectField(
          `UserQuestionProgress ${fieldName} type is ${publicField.type}, expected ${expectedType}`,
        );
      }
    }

    if (!storeField) {
      rejectField(`QuestionProgress missing ${fieldName}`);
    } else {
      if (storeField.optional !== expectedOptional) {
        rejectField(
          `QuestionProgress ${fieldName} optional=${storeField.optional}, expected ${expectedOptional}`,
        );
      }
      if (storeField.type !== expectedType) {
        rejectField(
          `QuestionProgress ${fieldName} type is ${storeField.type}, expected ${expectedType}`,
        );
      }
    }

    if (fieldIsValid) progressQuestionFieldsValidated += 1;
  });

  if (valid && progressQuestionFieldsValidated === EXPECTED_PROGRESS_QUESTION_FIELDS.length) {
    progressQuestionSchemaParityValidated = true;
  }
}

function validateProgressTypeSchemaParity() {
  let valid = true;
  let progressTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressTypesSource = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  } catch (error) {
    reject(`types/progress.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PROGRESS_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(progressTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/progress.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/progress.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    progressTypeUnionsValidated += 1;
  });

  EXPECTED_PROGRESS_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      progressTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(`types/progress.ts ${expectedInterface.name} interface could not be read`);
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/progress.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/progress.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) progressTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    progressTypeUnionsValidated === EXPECTED_PROGRESS_TYPE_UNIONS.length &&
    progressTypeInterfacesValidated === EXPECTED_PROGRESS_INTERFACES.length
  ) {
    progressTypeSchemaParityValidated = true;
  }
}

function validateProgressStoreSchemaParity() {
  let valid = true;
  let progressStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/storage/progressStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`progress store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(progressStoreSource, 'ProgressState');
  if (!Array.isArray(actualFields)) {
    reject('lib/storage/progressStore.ts ProgressState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_PROGRESS_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `ProgressState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_PROGRESS_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`ProgressState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `ProgressState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `ProgressState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) progressStoreFieldsValidated += 1;
  });

  const progressStateKey = extractStringConstantFromTs(progressStoreSource, 'progressStateKey');
  if (progressStateKey !== 'progressState') {
    reject(`progressStateKey is ${JSON.stringify(progressStateKey)}, expected "progressState"`);
  }
  const progressStorageId = extractStringConstantFromTs(progressStoreSource, 'progressStorageId');
  if (progressStorageId !== 'progress') {
    reject(`progressStorageId is ${JSON.stringify(progressStorageId)}, expected "progress"`);
  }

  const normalizedProgressStore = progressStoreSource.replace(/\s+/g, ' ');
  const requiredSnippets = [
    [
      'createMMKV({ id: progressStorageId })',
      'progress storage must use the stable progress MMKV id',
    ],
    [
      'rawProgress = progressStorage?.getString(progressStateKey);',
      'readProgress must read persisted JSON through progressStateKey',
    ],
    [
      'return normalizeProgress(JSON.parse(rawProgress));',
      'readProgress must normalize parsed persisted JSON',
    ],
    [
      'const serializedProgress = JSON.stringify(progress);',
      'writeProgress must serialize progress before persistence',
    ],
    [
      'writeRecoverably( progressStorage, progressStorageId, progressStateKey, serializedProgress, )',
      'writeProgress must persist JSON recoverably through the stable progress storage key',
    ],
    ['const initialProgress = readProgress();', 'ProgressState must initialize from storage'],
    ['...initialProgress,', 'useProgressStore must hydrate persisted progress state'],
    ['mockExamSessions: [],', 'empty progress must initialize mock exam history'],
    [
      'streakFreezeState: createInitialFreezeState(),',
      'empty progress must initialize streak-freeze state',
    ],
    [
      'normalizeStreakFreezeState as normalizeStoredStreakFreezeState',
      'ProgressState must reuse the shared streak-freeze normalizer',
    ],
    [
      'streakFreezeState: normalizeStoredStreakFreezeState(candidate.streakFreezeState),',
      'progress hydration must normalize freeze state through the shared helper',
    ],
    ['recordMockExamSession: (session) =>', 'ProgressState must persist completed mock exams'],
    ['setStreakFreezeState: (streakFreezeState) =>', 'ProgressState must persist freeze state'],
    [
      "if (typeof isCorrect !== 'boolean') return state;",
      'recordAnswer must ignore non-boolean correctness before mutating progress',
    ],
    [
      'const normalizedStreakFreezeState = normalizeStoredStreakFreezeState(streakFreezeState);',
      'setStreakFreezeState must normalize freeze state before persistence',
    ],
    [
      'streakFreezeState: normalizedStreakFreezeState,',
      'setStreakFreezeState must persist the normalized freeze state',
    ],
    ['writeProgress(nextProgress);', 'progress mutations must persist nextProgress'],
    ['writeProgress(emptyProgress);', 'resetProgress must persist the empty progress state'],
  ];

  requiredSnippets.forEach(([snippet, message]) => {
    if (!normalizedProgressStore.includes(snippet)) {
      reject(message);
    }
  });

  const forbiddenSnippets = [
    [
      'seenCount: Math.max(0, item.seenCount ?? 0),',
      'progress hydration must not use raw numeric expression Math.max(0, item.seenCount ?? 0)',
    ],
    [
      'normalizedQuestionProgress.lastAnsweredAt = item.lastAnsweredAt;',
      'question progress hydration must normalize and omit absent lastAnsweredAt timestamps',
    ],
    [
      'normalizedQuestionProgress.confidenceRating = item.confidenceRating;',
      'question progress hydration must preserve only valid 1..5 confidence ratings',
    ],
    [
      'function normalizeStreakFreezeState(value: unknown): StreakFreezeState',
      'progress store must not duplicate the shared streak-freeze normalizer',
    ],
  ];

  forbiddenSnippets.forEach(([snippet, message]) => {
    if (normalizedProgressStore.includes(snippet)) {
      reject(message);
    }
  });

  if (
    normalizedProgressStore.includes('normalizedQuestionProgress.bookmarked = item.bookmarked;') &&
    !normalizedProgressStore.includes(
      "if (typeof item.bookmarked === 'boolean') { normalizedQuestionProgress.bookmarked = item.bookmarked; }",
    )
  ) {
    reject('question progress hydration must preserve only boolean bookmark values');
  }

  if (valid && progressStoreFieldsValidated === EXPECTED_PROGRESS_STORE_FIELDS.length) {
    progressStoreSchemaParityValidated = true;
  }
}

function validateContentTypeSchemaParity() {
  let valid = true;
  let contentTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    contentTypesSource = fs.readFileSync(path.join(repoRoot, 'types/content.ts'), 'utf8');
  } catch (error) {
    reject(`types/content.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_CONTENT_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(contentTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/content.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/content.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    contentTypeUnionsValidated += 1;
  });

  EXPECTED_CONTENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      contentTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(`types/content.ts ${expectedInterface.name} interface could not be read`);
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/content.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(`types/content.ts ${expectedInterface.name} missing ${expectedField.name}`);
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/content.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/content.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) contentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    contentTypeUnionsValidated === EXPECTED_CONTENT_TYPE_UNIONS.length &&
    contentTypeInterfacesValidated === EXPECTED_CONTENT_INTERFACES.length
  ) {
    contentTypeSchemaParityValidated = true;
  }
}

function validateMonetizationTypeSchemaParity() {
  let valid = true;
  let monetizationTypesSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    monetizationTypesSource = fs.readFileSync(path.join(repoRoot, 'types/monetization.ts'), 'utf8');
  } catch (error) {
    reject(`types/monetization.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MONETIZATION_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(monetizationTypesSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`types/monetization.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `types/monetization.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    monetizationTypeUnionsValidated += 1;
  });

  EXPECTED_MONETIZATION_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      monetizationTypesSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `types/monetization.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `types/monetization.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `types/monetization.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) monetizationTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    monetizationTypeUnionsValidated === EXPECTED_MONETIZATION_TYPE_UNIONS.length &&
    monetizationTypeInterfacesValidated === EXPECTED_MONETIZATION_INTERFACES.length
  ) {
    monetizationTypeSchemaParityValidated = true;
  }
}

function validatePurchaseTypeSchemaParity() {
  let valid = true;
  let purchaseSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    purchaseSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/purchases.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/purchases.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_PURCHASE_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(purchaseSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/purchases.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/purchases.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    purchaseTypeUnionsValidated += 1;
  });

  EXPECTED_PURCHASE_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(purchaseSource, expectedInterface.name);
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/purchases.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/purchases.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/purchases.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) purchaseTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    purchaseTypeUnionsValidated === EXPECTED_PURCHASE_TYPE_UNIONS.length &&
    purchaseTypeInterfacesValidated === EXPECTED_PURCHASE_INTERFACES.length
  ) {
    purchaseTypeSchemaParityValidated = true;
  }
}

function validateRemoveAdsPurchaseRuntimeParity() {
  let valid = true;
  let placementCtaSource = '';
  let purchaseSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    placementCtaSource = fs.readFileSync(
      path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
      'utf8',
    );
    purchaseSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/purchases.ts'), 'utf8');
  } catch (error) {
    reject(`Remove Ads purchase runtime sources could not be read: ${error.message}`);
    return;
  }

  const normalizedPlacementCtaSource = placementCtaSource.replace(/\s+/g, ' ');
  const normalizedPurchaseSource = purchaseSource.replace(/\s+/g, ' ');
  const runtimeCases = [
    [
      typeof REMOVE_ADS_PRODUCT_ID === 'string' &&
        /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+\.removeads$/.test(REMOVE_ADS_PRODUCT_ID),
      'Remove Ads product id must stay a reverse-DNS removeads identifier',
    ],
    [
      /return\s+\{[\s\S]*priceLabel:\s*REMOVE_ADS_PRICE_LABEL,[\s\S]*productId:\s*REMOVE_ADS_PRODUCT_ID,[\s\S]*\};/.test(
        purchaseSource,
      ),
      'Remove Ads purchase results must expose canonical price label and product id',
    ],
    [
      normalizedPurchaseSource.includes(
        'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
      ),
      'buyRemoveAds must request canonical Remove Ads product id',
    ],
    [
      normalizedPurchaseSource.includes(
        'const purchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);',
      ),
      'restoreRemoveAdsPurchase must restore canonical Remove Ads product id',
    ],
    [
      /finishTransaction\(\{[\s\S]*isConsumable:\s*false,[\s\S]*purchase:\s*purchase\.raw\s+as\s+Purchase,[\s\S]*\}\);/.test(
        purchaseSource,
      ),
      'native Remove Ads finish transaction must be non-consumable',
    ],
    [
      normalizedPurchaseSource.includes(
        'const storeProductId = getPurchaseStoreProductId(productId, storePlatform);',
      ) &&
        /requestPurchase\(\{[\s\S]*request:\s*\{[\s\S]*apple:\s*\{\s*sku:\s*storeProductId\s*\},[\s\S]*google:\s*\{\s*skus:\s*\[\s*storeProductId\s*\]\s*\},[\s\S]*\},[\s\S]*type:\s*'in-app',[\s\S]*\}\)/.test(
          purchaseSource,
        ),
      'native Remove Ads purchase request must map the supplied canonical id to the active store id as an in-app purchase',
    ],
    [
      normalizedPurchaseSource.includes(
        'if (!ownsRemoveAds || !productIds.includes(REMOVE_ADS_PRODUCT_ID)) return [];',
      ) && normalizedPurchaseSource.includes("return [createMockPurchase('restore-remove-ads')];"),
      'mock Remove Ads restore must require the canonical product id',
    ],
    [
      normalizedPurchaseSource.includes('export const REMOVE_ADS_RECORD_SCHEMA_VERSION = 1;') &&
        normalizedPurchaseSource.includes('interface StoredRemoveAdsEntitlementRecord'),
      'Remove Ads persistence must use a versioned structured entitlement record',
    ],
    [
      normalizedPurchaseSource.includes('parseStoredRemoveAdsEntitlementRecord(storedValue)') &&
        !normalizedPurchaseSource.includes('storedValue === STORED_TRUE') &&
        !normalizedPurchaseSource.includes("const STORED_TRUE = 'true';"),
      'Remove Ads entitlement loading must reject the legacy bare true value',
    ],
    [
      normalizedPurchaseSource.includes("source: 'purchase'") &&
        normalizedPurchaseSource.includes("source: 'restore'") &&
        normalizedPurchaseSource.includes('hasStoreConfirmation(record)'),
      'Remove Ads purchase and restore grants must persist source plus store confirmation identity',
    ],
    [
      normalizedPurchaseSource.includes('receiptValidationStatus:') &&
        normalizedPurchaseSource.includes('receiptValidatedAt:'),
      'Remove Ads entitlement records must persist receipt validation status and timestamp',
    ],
    [
      normalizedPurchaseSource.includes('validateRemoveAdsReceipt?(') &&
        normalizedPurchaseSource.includes('Promise<RemoveAdsReceiptValidationResult>'),
      'Remove Ads purchase provider must expose a receipt validation hook',
    ],
    [
      normalizedPurchaseSource.includes('export type NativeRemoveAdsReceiptValidator =') &&
        normalizedPurchaseSource.includes('receiptValidator?: NativeRemoveAdsReceiptValidator;'),
      'native Remove Ads provider must require an explicit receipt validator hook',
    ],
    [
      /async validateRemoveAdsReceipt\(purchase, productId\) \{[\s\S]*if \(!receiptValidator\) \{[\s\S]*status:\s*'pending'[\s\S]*return receiptValidator\(purchase, productId\);/.test(
        purchaseSource,
      ) &&
        normalizedPurchaseSource.includes(
          ": ({ status: 'pending' } satisfies RemoveAdsReceiptValidationResult);",
        ) &&
        normalizedPurchaseSource.includes('return removeAdsEntitlements(true);') &&
        !/if \(!provider\) \{[\s\S]*clearStoredRemoveAdsEntitlement\(storage\)/.test(
          purchaseSource,
        ),
      'default native, missing receipt validation, and providerless relaunch entitlements must fail closed correctly',
    ],
    [
      normalizedPurchaseSource.includes(
        'const receiptValidation = await validateRemoveAdsReceipt(provider, purchase);',
      ) &&
        normalizedPurchaseSource.includes("return createResult('pending'") &&
        normalizedPurchaseSource.includes("return createResult('not_found'"),
      'Remove Ads buy and restore flows must validate receipts before granting entitlements',
    ],
    [
      normalizedPurchaseSource.includes('receiptValidationStatus =') &&
        normalizedPurchaseSource.includes("if (receiptValidationStatus !== 'valid')") &&
        normalizedPurchaseSource.includes('setRemoveAdsEntitlement(true, {') &&
        normalizedPurchaseSource.includes('receiptValidation,'),
      'mock/provider flows must cover invalid receipt validation without direct entitlement writes',
    ],
    [
      /const persistenceResult = await persistValidatedRemoveAdsEntitlement\(\{[\s\S]*source:\s*'purchase',[\s\S]*\}\);[\s\S]*if \(!persistenceResult\.persisted\) \{[\s\S]*return createResult\('persistence_failed',[\s\S]*\);[\s\S]*\}[\s\S]*await provider\.finishPurchase\?\.\(purchase\);[\s\S]*return createResult\('purchased', persistenceResult\.entitlements, purchase\);/.test(
        purchaseSource,
      ),
      'Remove Ads buy flow must persist the entitlement before finishing the native transaction',
    ],
    [
      normalizedPlacementCtaSource.includes('restoreRemoveAdsPurchase') &&
        normalizedPlacementCtaSource.includes(
          "onPress={() => void runPurchaseAction('restore', restoreRemoveAdsPurchase)}",
        ),
      'RemoveAdsPlacementCta must wire restoreRemoveAdsPurchase through the shared purchase runtime',
    ],
    [
      normalizedPlacementCtaSource.includes(
        'accessibilityLabel={copy.restoreAccessibilityLabel}',
      ) &&
        normalizedPlacementCtaSource.includes('accessibilityHint={copy.restoreAccessibilityHint}'),
      'RemoveAdsPlacementCta restore action must keep localized accessibility label and hint',
    ],
    [
      normalizedPlacementCtaSource.includes('const purchaseActionInFlightRef = useRef(false);') &&
        normalizedPlacementCtaSource.includes('if (purchaseActionInFlightRef.current) return;') &&
        normalizedPlacementCtaSource.includes('purchaseActionInFlightRef.current = true;') &&
        normalizedPlacementCtaSource.includes('purchaseActionInFlightRef.current = false;'),
      'Remove Ads buy/restore handlers must use a ref-backed in-flight guard before awaiting store calls',
    ],
  ];

  runtimeCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }

    removeAdsPurchaseRuntimeCasesValidated += 1;
  });

  if (
    valid &&
    removeAdsPurchaseRuntimeCasesValidated === EXPECTED_REMOVE_ADS_PURCHASE_RUNTIME_CASES
  ) {
    removeAdsPurchaseRuntimeParityValidated = true;
  }
}

function validateRemoveAdsSwedishExamCopyParity() {
  let valid = true;
  const sourceFiles = [
    'components/monetization/PremiumBanner.tsx',
    'components/monetization/PricingWedge.tsx',
    'components/monetization/RemoveAdsPlacementCta.tsx',
  ];
  const sources = new Map();

  function reject(message) {
    valid = false;
    fail(message);
  }

  sourceFiles.forEach((file) => {
    try {
      sources.set(file, fs.readFileSync(path.join(repoRoot, file), 'utf8'));
    } catch (error) {
      reject(`${file} could not be read: ${error.message}`);
    }
  });

  if (sources.size !== sourceFiles.length) return;

  const premiumBannerSource = sources.get('components/monetization/PremiumBanner.tsx');
  const pricingWedgeSource = sources.get('components/monetization/PricingWedge.tsx');
  const placementCtaSource = sources.get('components/monetization/RemoveAdsPlacementCta.tsx');
  const combinedSource = `${premiumBannerSource}\n${pricingWedgeSource}\n${placementCtaSource}`;
  const bareExamAdFreeClaimPattern =
    /\bprov(?:et)?\s+(?:är|förblir)\s+(?:alltid\s+|redan\s+)?annonsfri(?:tt|a)?\b/i;
  const copyCases = [
    [
      /tidsatta övningsprov i appen redan är annonsfria/.test(premiumBannerSource),
      'PremiumBanner Swedish body must clarify that app practice exams, not the official exam, stay ad-free',
    ],
    [
      /Tidsatta övningsprov i appen är redan annonsfria/.test(premiumBannerSource),
      'PremiumBanner Swedish purchase hint must clarify that app practice exams stay ad-free',
    ],
    [
      /tidsatta övningsprov är alltid annonsfria/.test(pricingWedgeSource),
      'PricingWedge Swedish pitch must keep the timed practice-exam qualifier',
    ],
    [
      /Tidsatta övningsprov är redan annonsfria/.test(placementCtaSource),
      'RemoveAdsPlacementCta Swedish body must keep the timed practice-exam qualifier',
    ],
    [
      !/prov förblir annonsfria/i.test(combinedSource),
      'Remove Ads Swedish copy must not say bare "prov förblir annonsfria"',
    ],
    [
      !/provet är alltid annonsfritt/i.test(combinedSource),
      'Remove Ads Swedish copy must not say bare "provet är alltid annonsfritt"',
    ],
    [
      !bareExamAdFreeClaimPattern.test(combinedSource),
      'Remove Ads Swedish copy must qualify ad-free exam claims as övningsprov or app provläge',
    ],
    [
      /while exams stay ad-free/.test(premiumBannerSource) &&
        /Exam mode is already ad-free/.test(premiumBannerSource),
      'PremiumBanner English Remove Ads exam copy must stay unchanged',
    ],
  ];

  copyCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }

    removeAdsSwedishExamCopyCasesValidated += 1;
  });

  if (
    valid &&
    removeAdsSwedishExamCopyCasesValidated === EXPECTED_REMOVE_ADS_SWEDISH_EXAM_COPY_CASES
  ) {
    removeAdsSwedishExamCopyParityValidated = true;
  }
}

function validateAdConsentTypeSchemaParity() {
  let valid = true;
  let consentSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    consentSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/consent.ts'), 'utf8');
  } catch (error) {
    reject(`lib/monetization/consent.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_AD_CONSENT_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(consentSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/consent.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/consent.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    adConsentTypeUnionsValidated += 1;
  });

  EXPECTED_AD_CONSENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(consentSource, expectedInterface.name);
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/consent.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/consent.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/consent.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) adConsentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    adConsentTypeUnionsValidated === EXPECTED_AD_CONSENT_TYPE_UNIONS.length &&
    adConsentTypeInterfacesValidated === EXPECTED_AD_CONSENT_INTERFACES.length
  ) {
    adConsentTypeSchemaParityValidated = true;
  }
}

function validateMobileAdsConsentTypeSchemaParity() {
  let valid = true;
  let mobileConsentSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mobileConsentSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/mobileAdsConsent.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MOBILE_ADS_CONSENT_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      mobileConsentSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/mobileAdsConsent.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) mobileAdsConsentTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    mobileAdsConsentTypeInterfacesValidated === EXPECTED_MOBILE_ADS_CONSENT_INTERFACES.length
  ) {
    mobileAdsConsentTypeSchemaParityValidated = true;
  }
}

function validateMobileAdsConsentHookParity() {
  let valid = true;
  let hookSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    hookSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/useMobileAdsConsent.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/useMobileAdsConsent.ts could not be read: ${error.message}`);
    return;
  }

  const normalizedHookSource = hookSource.replace(/\s+/g, ' ');
  const hookCases = [
    [
      normalizedHookSource.includes(
        'const shouldCollectConsent = adsConfig.googleMobileAdsEnabled && !entitlements.adsDisabled && adsConfig.realAdsEnabled;',
      ) &&
        normalizedHookSource.includes('platform,') &&
        normalizedHookSource.includes(
          "trackingTransparencyStatus: platform === 'ios' && shouldCollectConsent ? 'not_determined' : 'unavailable',",
        ) &&
        normalizedHookSource.includes(
          "umpConsentStatus: shouldCollectConsent ? 'unknown' : 'not_required',",
        ),
      'Mobile Ads consent hook must derive initial prompt state from ads config and Remove Ads entitlements',
    ],
    [
      normalizedHookSource.includes(
        'const state: AdConsentState = createInitialAdConsentState({',
      ) && normalizedHookSource.includes('decision: getAdSdkInitializationDecision(state),'),
      'Mobile Ads consent hook must route initial state through the consent SDK decision helper',
    ],
    [
      /if\s*\(\s*entitlements\.adsDisabled\s*\)\s*\{\s*return\s+initializeGoogleMobileAdsAfterConsent\(\{[\s\S]*entitlements,[\s\S]*runtime:\s*createNativeMobileAdsConsentRuntime\(platform\),[\s\S]*\}\);\s*\}/.test(
        hookSource,
      ),
      'Mobile Ads consent hook must bypass cached initialization when Remove Ads is active',
    ],
    [
      normalizedHookSource.includes(
        'initializationPromise ??= initializeGoogleMobileAdsAfterConsent({',
      ) &&
        normalizedHookSource.includes('cachedInitialization = result;') &&
        normalizedHookSource.includes('initializationPromise = undefined;') &&
        normalizedHookSource.includes('throw error;'),
      'Mobile Ads consent hook must cache successful non-disabled initialization and reset after errors',
    ],
    [
      /if\s*\([\s\S]*!entitlements\.adsDisabled[\s\S]*cachedInitialization[\s\S]*cachedInitializationPlatform\s*===\s*platform[\s\S]*\)\s*\{\s*return\s+cachedInitialization;\s*\}/.test(
        hookSource,
      ) &&
        normalizedHookSource.includes('setResult(initialResult);') &&
        normalizedHookSource.includes('void initializeOnce(entitlements, platform)') &&
        /\.\s*catch\(\(\)\s*=>\s*\{\s*if\s*\(\s*isMounted\s*\)\s*setResult\(createInitialResult\(entitlements,\s*platform\)\);\s*\}\);/.test(
          hookSource,
        ) &&
        normalizedHookSource.includes('isMounted = false;'),
      'Mobile Ads consent hook must fail closed to initial consent state after async initialization errors',
    ],
  ];

  hookCases.forEach(([caseIsValid, message]) => {
    if (!caseIsValid) {
      reject(message);
      return;
    }
    mobileAdsConsentHookCasesValidated += 1;
  });

  if (valid && mobileAdsConsentHookCasesValidated === EXPECTED_MOBILE_ADS_CONSENT_HOOK_CASES) {
    mobileAdsConsentHookParityValidated = true;
  }
}

function validateRewardedAdTypeSchemaParity() {
  let valid = true;
  let rewardedAdSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    rewardedAdSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/rewardedAd.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_REWARDED_AD_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(rewardedAdSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/rewardedAd.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/rewardedAd.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    rewardedAdTypeUnionsValidated += 1;
  });

  EXPECTED_REWARDED_AD_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      rewardedAdSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/rewardedAd.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/rewardedAd.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/rewardedAd.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) rewardedAdTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    rewardedAdTypeUnionsValidated === EXPECTED_REWARDED_AD_TYPE_UNIONS.length &&
    rewardedAdTypeInterfacesValidated === EXPECTED_REWARDED_AD_INTERFACES.length
  ) {
    rewardedAdTypeSchemaParityValidated = true;
  }
}

function validateMockExamAccessTypeSchemaParity() {
  let valid = true;
  let mockExamAccessSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    mockExamAccessSource = fs.readFileSync(
      path.join(repoRoot, 'lib/monetization/rewardedExam.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/monetization/rewardedExam.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(mockExamAccessSource, typeName);
    if (!Array.isArray(actualValues)) {
      reject(`lib/monetization/rewardedExam.ts ${typeName} union could not be read`);
      return;
    }
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/monetization/rewardedExam.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    mockExamAccessTypeUnionsValidated += 1;
  });

  EXPECTED_MOCK_EXAM_ACCESS_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      mockExamAccessSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/monetization/rewardedExam.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/monetization/rewardedExam.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/monetization/rewardedExam.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) mockExamAccessTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    mockExamAccessTypeUnionsValidated === EXPECTED_MOCK_EXAM_ACCESS_TYPE_UNIONS.length &&
    mockExamAccessTypeInterfacesValidated === EXPECTED_MOCK_EXAM_ACCESS_INTERFACES.length
  ) {
    mockExamAccessTypeSchemaParityValidated = true;
  }
}

function validateThemeTokenSchema() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  function validateNoExtraKeys(actual, expectedKeys, label) {
    if (!isObjectRecord(actual)) {
      reject(`${label} must be an object`);
      return;
    }
    const expectedKeySet = new Set(expectedKeys);
    for (const key of Object.keys(actual)) {
      if (!expectedKeySet.has(key)) reject(`${label}.${key} is not an expected token`);
    }
  }

  validateNoExtraKeys(colors, EXPECTED_THEME_COLOR_TOKENS, 'theme colors');
  if (isObjectRecord(colors)) {
    for (const token of EXPECTED_THEME_COLOR_TOKENS) {
      if (!Object.prototype.hasOwnProperty.call(colors, token)) {
        reject(`theme colors missing ${token}`);
        continue;
      }
      if (!isColorToken(colors[token])) {
        reject(`theme colors.${token} must be a hex or rgb/rgba color token`);
        continue;
      }
      themeColorTokensValidated += 1;
    }
  }
  validateNoExtraKeys(darkColors, EXPECTED_THEME_COLOR_TOKENS, 'theme darkColors');
  if (isObjectRecord(darkColors)) {
    for (const token of EXPECTED_THEME_COLOR_TOKENS) {
      if (!Object.prototype.hasOwnProperty.call(darkColors, token)) {
        reject(`theme darkColors missing ${token}`);
        continue;
      }
      if (!isColorToken(darkColors[token])) {
        reject(`theme darkColors.${token} must be a hex or rgb/rgba color token`);
        continue;
      }
      themeDarkColorTokensValidated += 1;
    }
  }

  function validateContrastPairs(palette, label) {
    let validPairs = 0;
    const contrastLabel = label ? `${label} contrast` : 'contrast';
    for (const [foregroundToken, backgroundToken] of EXPECTED_THEME_CONTRAST_PAIRS) {
      const foreground = palette?.[foregroundToken];
      const background = palette?.[backgroundToken];
      const ratio = contrastRatio(foreground, background);
      if (ratio === null) {
        reject(`theme ${contrastLabel} ${foregroundToken} on ${backgroundToken} could not be read`);
        continue;
      }
      if (ratio < 4.5) {
        reject(
          `theme ${contrastLabel} ${foregroundToken} on ${backgroundToken} ratio ${ratio.toFixed(
            2,
          )}:1 below 4.5:1`,
        );
        continue;
      }
      validPairs += 1;
    }
    return validPairs;
  }
  if (isObjectRecord(colors)) themeContrastPairsValidated = validateContrastPairs(colors, '');
  if (isObjectRecord(darkColors)) {
    themeDarkContrastPairsValidated = validateContrastPairs(darkColors, 'dark');
  }
  themeContrastPairsAAValidated =
    themeContrastPairsValidated === EXPECTED_THEME_CONTRAST_PAIRS.length;
  themeDarkContrastPairsAAValidated =
    themeDarkContrastPairsValidated === EXPECTED_THEME_CONTRAST_PAIRS.length;

  validateNoExtraKeys(space, Object.keys(EXPECTED_THEME_SPACE_VALUES), 'theme space');
  if (isObjectRecord(space)) {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_SPACE_VALUES)) {
      if (space[token] !== expectedValue) {
        reject(`theme space.${token} expected ${expectedValue}, found ${space[token]}`);
        continue;
      }
      themeSpaceTokensValidated += 1;
    }
  }

  validateNoExtraKeys(radius, Object.keys(EXPECTED_THEME_RADIUS_VALUES), 'theme radius');
  if (isObjectRecord(radius)) {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_RADIUS_VALUES)) {
      if (radius[token] !== expectedValue) {
        reject(`theme radius.${token} expected ${expectedValue}, found ${radius[token]}`);
        continue;
      }
      themeRadiusTokensValidated += 1;
    }
  }

  validateNoExtraKeys(
    typography,
    ['fontFamily', ...EXPECTED_THEME_TYPOGRAPHY_TOKENS],
    'theme typography',
  );
  const fontFamily = typography?.fontFamily;
  if (!hasText(fontFamily)) reject('theme typography.fontFamily is required');
  if (isObjectRecord(typography)) {
    for (const token of EXPECTED_THEME_TYPOGRAPHY_TOKENS) {
      const style = typography[token];
      let tokenIsValid = true;

      function rejectToken(message) {
        tokenIsValid = false;
        reject(message);
      }

      if (!isObjectRecord(style)) {
        rejectToken(`theme typography.${token} must be an object`);
      } else {
        if (style.fontFamily !== fontFamily) {
          rejectToken(`theme typography.${token}.fontFamily must match theme fontFamily`);
        }
        if (!Number.isFinite(style.fontSize) || style.fontSize <= 0) {
          rejectToken(`theme typography.${token}.fontSize must be positive`);
        }
        if (!Number.isFinite(style.lineHeight) || style.lineHeight < style.fontSize) {
          rejectToken(`theme typography.${token}.lineHeight must be at least fontSize`);
        }
        if (!['400', '500', '600', '700'].includes(style.fontWeight)) {
          rejectToken(`theme typography.${token}.fontWeight must use a supported weight`);
        }
        if (
          style.letterSpacing !== undefined &&
          (!Number.isFinite(style.letterSpacing) || Math.abs(style.letterSpacing) > 4)
        ) {
          rejectToken(`theme typography.${token}.letterSpacing must be a bounded number`);
        }
      }

      if (tokenIsValid) themeTypographyTokensValidated += 1;
    }
  }

  validateNoExtraKeys(shadows, EXPECTED_THEME_SHADOW_TOKENS, 'theme shadows');
  if (isObjectRecord(shadows)) {
    for (const token of EXPECTED_THEME_SHADOW_TOKENS) {
      const shadow = shadows[token];
      let tokenIsValid = true;

      function rejectToken(message) {
        tokenIsValid = false;
        reject(message);
      }

      if (!isObjectRecord(shadow)) {
        rejectToken(`theme shadows.${token} must be an object`);
      } else {
        if (!isColorToken(shadow.shadowColor)) {
          rejectToken(`theme shadows.${token}.shadowColor must be a color token`);
        }
        if (!isObjectRecord(shadow.shadowOffset)) {
          rejectToken(`theme shadows.${token}.shadowOffset must be an object`);
        } else if (
          !Number.isFinite(shadow.shadowOffset.width) ||
          !Number.isFinite(shadow.shadowOffset.height)
        ) {
          rejectToken(`theme shadows.${token}.shadowOffset must have numeric width and height`);
        }
        if (
          !Number.isFinite(shadow.shadowOpacity) ||
          shadow.shadowOpacity < 0 ||
          shadow.shadowOpacity > 1
        ) {
          rejectToken(`theme shadows.${token}.shadowOpacity must be between 0 and 1`);
        }
        if (!Number.isFinite(shadow.shadowRadius) || shadow.shadowRadius < 0) {
          rejectToken(`theme shadows.${token}.shadowRadius must be non-negative`);
        }
        if (!Number.isFinite(shadow.elevation) || shadow.elevation < 0) {
          rejectToken(`theme shadows.${token}.elevation must be non-negative`);
        }
      }

      if (tokenIsValid) themeShadowTokensValidated += 1;
    }
  }

  if (!isObjectRecord(motion?.duration)) {
    reject('theme motion.duration must be an object');
  } else {
    for (const [token, expectedValue] of Object.entries(EXPECTED_THEME_MOTION_DURATIONS)) {
      if (motion.duration[token] !== expectedValue) {
        reject(
          `theme motion.duration.${token} expected ${expectedValue}, found ${motion.duration[token]}`,
        );
      } else {
        themeMotionTokensValidated += 1;
      }
    }
    if (
      !(motion.duration.fast < motion.duration.base && motion.duration.base < motion.duration.slow)
    ) {
      reject('theme motion.duration values must increase from fast to slow');
    }
  }
  if (!isObjectRecord(motion?.easing)) {
    reject('theme motion.easing must be an object');
  } else {
    for (const token of EXPECTED_THEME_MOTION_EASING) {
      if (!/^cubic-bezier\(.+\)$/.test(motion.easing[token] || '')) {
        reject(`theme motion.easing.${token} must be a cubic-bezier easing token`);
      } else {
        themeMotionTokensValidated += 1;
      }
    }
  }
  if (
    !Number.isFinite(motion?.pressedScale) ||
    motion.pressedScale <= 0 ||
    motion.pressedScale >= 1
  ) {
    reject('theme motion.pressedScale must be between 0 and 1');
  } else {
    themeMotionTokensValidated += 1;
  }
  if (!Number.isFinite(motion?.hoverScale) || motion.hoverScale <= 1) {
    reject('theme motion.hoverScale must be greater than 1');
  } else {
    themeMotionTokensValidated += 1;
  }

  if (
    valid &&
    themeColorTokensValidated === EXPECTED_THEME_COLOR_TOKENS.length &&
    themeDarkColorTokensValidated === EXPECTED_THEME_COLOR_TOKENS.length &&
    themeContrastPairsAAValidated &&
    themeDarkContrastPairsAAValidated &&
    themeSpaceTokensValidated === Object.keys(EXPECTED_THEME_SPACE_VALUES).length &&
    themeRadiusTokensValidated === Object.keys(EXPECTED_THEME_RADIUS_VALUES).length &&
    themeTypographyTokensValidated === EXPECTED_THEME_TYPOGRAPHY_TOKENS.length &&
    themeShadowTokensValidated === EXPECTED_THEME_SHADOW_TOKENS.length &&
    themeMotionTokensValidated ===
      Object.keys(EXPECTED_THEME_MOTION_DURATIONS).length + EXPECTED_THEME_MOTION_EASING.length + 2
  ) {
    themeTokenSchemaValidated = true;
  }
}

function validateGlossaryTerms() {
  if (!Array.isArray(glossaryTerms)) return;

  const seenIds = new Set();
  const seenTermsSv = new Set();
  const seenTermsEn = new Set();
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);

  glossaryTerms.forEach((term, index) => {
    const label = hasText(term?.id) ? term.id : `glossary term[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!term || typeof term !== 'object') {
      reject(`glossary term[${index}] is not an object`);
    } else {
      for (const field of ['id', 'termSv', 'termEn', 'explanationSv', 'explanationEn']) {
        if (!hasText(term[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(term[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      if (hasText(term.id) && !isSlugTag(term.id)) {
        reject(`${label} id must use lowercase kebab-case`);
      }
      if (hasText(term.id) && seenIds.has(term.id)) {
        reject(`${label} duplicates glossary term id`);
      }
      if (hasText(term.id)) seenIds.add(term.id);

      const normalizedTermSv = normalizeComparableText(term.termSv);
      if (normalizedTermSv && seenTermsSv.has(normalizedTermSv)) {
        reject(`${label} duplicates Swedish glossary term`);
      }
      if (normalizedTermSv) seenTermsSv.add(normalizedTermSv);

      const normalizedTermEn = normalizeComparableText(term.termEn);
      if (normalizedTermEn && seenTermsEn.has(normalizedTermEn)) {
        reject(`${label} duplicates English glossary term`);
      }
      if (normalizedTermEn) seenTermsEn.add(normalizedTermEn);

      if (!optionTextPairIsTranslatedOrInvariant({ textSv: term.termSv, textEn: term.termEn })) {
        reject(`${label} termSv and termEn must be translated or a short invariant term`);
      }
      if (
        normalizeComparableText(term.explanationSv) === normalizeComparableText(term.explanationEn)
      ) {
        reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
      }

      if (term.chapterId !== undefined) {
        if (!hasText(term.chapterId)) {
          reject(`${label} chapterId must be non-empty when present`);
        } else if (!textIsTrimmedSingleSpaced(term.chapterId)) {
          reject(`${label} chapterId must be trimmed and single-spaced`);
        } else if (chapterIds.size && !chapterIds.has(term.chapterId)) {
          reject(`${label} references unknown chapter ${term.chapterId}`);
        }
      }

      for (const failure of glossaryTermExactSchemaKeyFailures(term, label)) {
        reject(failure);
      }
    }

    if (valid) {
      glossaryTermsValidated += 1;
      glossaryTermExactSchemaKeysValidated += 1;
    }
  });
}

function validateBadgeCatalog() {
  if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) return;

  const entries = Object.entries(badgeCatalog);
  const expectedIds = new Set(EXPECTED_BADGE_IDS);
  const catalogIds = entries.map(([key]) => key);
  if (!jsonEqual(catalogIds, EXPECTED_BADGE_IDS)) {
    fail(
      `badgeCatalog ids are ${JSON.stringify(catalogIds)}, expected ${JSON.stringify(
        EXPECTED_BADGE_IDS,
      )}`,
    );
  }

  const seenTitles = new Set();
  const seenDescriptions = new Set();

  entries.forEach(([key, badge], index) => {
    const label = hasText(badge?.id) ? badge.id : `badge[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!badge || typeof badge !== 'object') {
      reject(`badgeCatalog.${key} is not an object`);
    } else {
      if (badge.id !== key) reject(`${label} id must match catalog key ${key}`);
      if (!expectedIds.has(badge.id)) reject(`${label} is not an expected badge id`);
      if (hasText(badge.id) && !isSnakeCaseId(badge.id)) {
        reject(`${label} id must use lowercase snake_case`);
      }

      for (const field of [
        'title',
        'description',
        'titleSv',
        'titleEn',
        'descriptionSv',
        'descriptionEn',
        'lockedHintSv',
        'lockedHintEn',
      ]) {
        if (!hasText(badge[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(badge[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      for (const [svField, enField] of [
        ['titleSv', 'titleEn'],
        ['descriptionSv', 'descriptionEn'],
        ['lockedHintSv', 'lockedHintEn'],
      ]) {
        if (!hasText(badge[svField])) {
          reject(`${label} missing ${svField}`);
        } else if (!textIsTrimmedSingleSpaced(badge[svField])) {
          reject(`${label} ${svField} must be trimmed and single-spaced`);
        }

        if (!hasText(badge[enField])) {
          reject(`${label} missing ${enField}`);
        } else if (!textIsTrimmedSingleSpaced(badge[enField])) {
          reject(`${label} ${enField} must be trimmed and single-spaced`);
        }

        if (
          hasText(badge[svField]) &&
          hasText(badge[enField]) &&
          normalizeComparableText(badge[svField]) === normalizeComparableText(badge[enField])
        ) {
          reject(`${label} ${svField} must be localized separately from ${enField}`);
        }
      }

      const normalizedTitle = normalizeComparableText(badge.title);
      if (normalizedTitle && seenTitles.has(normalizedTitle)) {
        reject(`${label} duplicates badge title`);
      }
      if (normalizedTitle) seenTitles.add(normalizedTitle);

      const normalizedDescription = normalizeComparableText(badge.description);
      if (normalizedDescription && seenDescriptions.has(normalizedDescription)) {
        reject(`${label} duplicates badge description`);
      }
      if (normalizedDescription) seenDescriptions.add(normalizedDescription);
    }

    if (valid) badgesValidated += 1;
  });

  if (typeof deriveBadges === 'function') {
    const noProgressBadgeIds = deriveBadges({
      completedQuestionCount: 0,
      currentStreak: 0,
      level: 1,
      wrongAnswerCount: 0,
    }).map((badge) => badge.id);
    const milestoneBadgeIds = deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id);

    if (noProgressBadgeIds.length) {
      fail(`deriveBadges returned badges before milestones: ${noProgressBadgeIds.join(', ')}`);
    } else if (!jsonEqual(milestoneBadgeIds, EXPECTED_BADGE_IDS)) {
      fail(
        `deriveBadges milestone ids are ${JSON.stringify(
          milestoneBadgeIds,
        )}, expected ${JSON.stringify(EXPECTED_BADGE_IDS)}`,
      );
    } else {
      badgeMilestoneParityValidated = true;
    }

    const invalidBadgeInputCases = [
      {
        label: 'string badge counters',
        input: {
          completedQuestionCount: '1',
          currentStreak: '3',
          level: '2',
          wrongAnswerCount: '1',
        },
      },
      {
        label: 'infinite badge counters',
        input: {
          completedQuestionCount: Infinity,
          currentStreak: Infinity,
          level: Infinity,
          wrongAnswerCount: Infinity,
        },
      },
      {
        label: 'fractional badge counters',
        input: {
          completedQuestionCount: 1.5,
          currentStreak: 3.5,
          level: 2.5,
          wrongAnswerCount: 1.5,
        },
      },
      {
        label: 'negative badge counters',
        input: {
          completedQuestionCount: -1,
          currentStreak: -3,
          level: -2,
          wrongAnswerCount: -1,
        },
      },
    ];
    let badgeRuntimeInputIsValid = true;

    invalidBadgeInputCases.forEach(({ label, input }) => {
      let badgeIds;
      try {
        badgeIds = deriveBadges(input).map((badge) => badge.id);
      } catch (error) {
        badgeRuntimeInputIsValid = false;
        fail(`deriveBadges ${label} threw ${error.message}`);
        return;
      }

      if (badgeIds.length) {
        badgeRuntimeInputIsValid = false;
        fail(`deriveBadges ${label} returned badges: ${badgeIds.join(', ')}`);
      } else {
        badgeRuntimeInputCasesValidated += 1;
      }
    });

    if (
      badgeRuntimeInputIsValid &&
      badgeRuntimeInputCasesValidated === invalidBadgeInputCases.length
    ) {
      badgeRuntimeInputParityValidated = true;
    }
  }
}

function validatePracticeScoringRules() {
  if (typeof scoreAnswers !== 'function') return;

  const cases = [
    { label: 'default empty results', input: undefined, expected: { correct: 0, total: 0 } },
    { label: 'empty results', input: [], expected: { correct: 0, total: 0 } },
    { label: 'all wrong results', input: [false, false], expected: { correct: 0, total: 2 } },
    { label: 'mixed results', input: [true, false, true], expected: { correct: 2, total: 3 } },
    { label: 'all correct results', input: [true, true], expected: { correct: 2, total: 2 } },
  ];
  let rulesAreValid = true;

  cases.forEach(({ label, input, expected }) => {
    let actual;
    try {
      actual = input === undefined ? scoreAnswers() : scoreAnswers(input);
    } catch (error) {
      rulesAreValid = false;
      fail(`practice scoring rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actual, expected)) {
      rulesAreValid = false;
      fail(
        `practice scoring rule ${label} returned ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      practiceScoringRulesValidated += 1;
    }
  });

  if (rulesAreValid && practiceScoringRulesValidated === cases.length) {
    practiceScoringRulesParityValidated = true;
  }
}

function validatePracticeFlowParity() {
  if (
    !Array.isArray(questions) ||
    typeof getPracticeQuestionForSession !== 'function' ||
    typeof getCompletedQuestionIdsForQuestionBank !== 'function'
  ) {
    return;
  }

  const publishedQuestions = questions.filter((question) => question.reviewStatus === 'published');
  if (publishedQuestions.length < 3) {
    fail('practice flow parity needs at least three published questions');
    return;
  }

  const [firstQuestion, secondQuestion, thirdQuestion] = publishedQuestions;
  const completedAllQuestionIds = publishedQuestions.map((question) => question.id);
  const cases = [
    {
      label: 'empty question bank',
      questions: [],
      completedQuestionIds: [],
      activeQuestionId: null,
      expectedId: undefined,
    },
    {
      label: 'first unanswered question',
      questions: publishedQuestions,
      completedQuestionIds: [],
      activeQuestionId: null,
      expectedId: firstQuestion.id,
    },
    {
      label: 'active question remains locked',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id],
      activeQuestionId: firstQuestion.id,
      expectedId: firstQuestion.id,
    },
    {
      label: 'stale active question falls back to completed-count rotation',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id],
      activeQuestionId: 'missing-question-id',
      expectedId: secondQuestion.id,
    },
    {
      label: 'two completed questions advance to the third question',
      questions: publishedQuestions,
      completedQuestionIds: [firstQuestion.id, secondQuestion.id],
      activeQuestionId: null,
      expectedId: thirdQuestion.id,
    },
    {
      label: 'completed question count wraps to the first question',
      questions: publishedQuestions,
      completedQuestionIds: completedAllQuestionIds,
      activeQuestionId: null,
      expectedId: firstQuestion.id,
    },
  ];

  let valid = true;

  cases.forEach((testCase) => {
    const {
      label,
      questions: caseQuestions,
      completedQuestionIds,
      activeQuestionId,
      expectedId,
    } = testCase;
    let actualQuestion;
    try {
      actualQuestion = getPracticeQuestionForSession(
        caseQuestions,
        completedQuestionIds,
        activeQuestionId,
      );
    } catch (error) {
      valid = false;
      fail(`practice flow ${label} threw ${error.message}`);
      return;
    }

    const actualId = actualQuestion?.id;
    if (actualId !== expectedId) {
      valid = false;
      fail(
        `practice flow ${label} returned ${JSON.stringify(actualId)}, expected ${JSON.stringify(
          expectedId,
        )}`,
      );
    } else {
      practiceFlowCasesValidated += 1;
    }
  });

  const scopedCompletedQuestionIds = getCompletedQuestionIdsForQuestionBank(
    [firstQuestion, secondQuestion],
    [thirdQuestion.id],
  );
  const expectedScopedCompletedQuestionIds = [];
  if (!jsonEqual(scopedCompletedQuestionIds, expectedScopedCompletedQuestionIds)) {
    valid = false;
    fail(
      `practice flow completion outside visible bank is ignored scoped completed ids returned ${JSON.stringify(
        scopedCompletedQuestionIds,
      )}, expected ${JSON.stringify(expectedScopedCompletedQuestionIds)}`,
    );
  } else {
    practiceFlowCasesValidated += 1;
  }

  if (valid && practiceFlowCasesValidated === cases.length + 1) {
    practiceFlowParityValidated = true;
  }
}

function validatePracticeSessionStoreParity() {
  let valid = true;
  let runtimeValid = true;
  let practiceSessionStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  function rejectRuntime(message) {
    runtimeValid = false;
    reject(message);
  }

  try {
    practiceSessionStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/quiz/practiceSessionStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`practice session store schema source could not be read: ${error.message}`);
    return;
  }

  const actualFields = extractObjectTypePropertiesFromTs(
    practiceSessionStoreSource,
    'PracticeSessionState',
  );
  if (!Array.isArray(actualFields)) {
    reject('lib/quiz/practiceSessionStore.ts PracticeSessionState type could not be read');
    return;
  }

  const actualNames = actualFields.map((field) => field.name);
  const expectedNames = EXPECTED_PRACTICE_SESSION_STORE_FIELDS.map((field) => field.name);
  if (!arrayEquals(actualNames, expectedNames)) {
    reject(
      `PracticeSessionState fields are ${JSON.stringify(actualNames)}, expected ${JSON.stringify(
        expectedNames,
      )}`,
    );
  }

  const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
  EXPECTED_PRACTICE_SESSION_STORE_FIELDS.forEach((expectedField) => {
    let fieldIsValid = true;
    const actualField = actualFieldsByName.get(expectedField.name);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!actualField) {
      rejectField(`PracticeSessionState missing ${expectedField.name}`);
      return;
    }
    if (actualField.type !== expectedField.type) {
      rejectField(
        `PracticeSessionState.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
      );
    }
    if (actualField.optional !== expectedField.optional) {
      rejectField(
        `PracticeSessionState.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
      );
    }

    if (fieldIsValid) practiceSessionStoreFieldsValidated += 1;
  });

  if (
    usePracticeSessionStore &&
    typeof usePracticeSessionStore.getState === 'function' &&
    typeof usePracticeSessionStore.setState === 'function' &&
    typeof getPracticeInterstitialShowKey === 'function'
  ) {
    usePracticeSessionStore.setState({
      activeQuestionId: null,
      selectedOptionId: null,
      shuffleSessionId: 'practice-session-0',
    });

    usePracticeSessionStore.getState().selectOption('q-validator', 'option-a');
    let state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== 'q-validator' || state.selectedOptionId !== 'option-a') {
      rejectRuntime('practice session selectOption must lock question id and selected option id');
    }
    if (state.shuffleSessionId !== 'practice-session-0') {
      rejectRuntime('practice session selectOption must keep the current shuffle session seed');
    }
    const firstFeedbackKey = getPracticeInterstitialShowKey(
      state.activeQuestionId,
      state.shuffleSessionId,
    );

    usePracticeSessionStore.getState().resetSelection();
    state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== 'q-validator' || state.selectedOptionId !== null) {
      rejectRuntime(
        'practice session resetSelection must keep active question while clearing answer',
      );
    }
    if (state.shuffleSessionId !== 'practice-session-0') {
      rejectRuntime('practice session resetSelection must keep the current shuffle session seed');
    }
    if (
      firstFeedbackKey !==
      getPracticeInterstitialShowKey(state.activeQuestionId, state.shuffleSessionId)
    ) {
      rejectRuntime('practice retry must keep the same interstitial feedback-cycle key');
    }

    usePracticeSessionStore.getState().advanceQuestion();
    state = usePracticeSessionStore.getState();
    if (state.activeQuestionId !== null || state.selectedOptionId !== null) {
      rejectRuntime(
        'practice session advanceQuestion must clear active question and selected answer',
      );
    }
    if (state.shuffleSessionId !== 'practice-session-1') {
      rejectRuntime('practice session advanceQuestion must advance the shuffle session seed');
    }
    if (
      firstFeedbackKey === getPracticeInterstitialShowKey('q-validator', state.shuffleSessionId)
    ) {
      rejectRuntime('practice advance must create a fresh interstitial feedback-cycle key');
    }

    usePracticeSessionStore.setState({
      activeQuestionId: null,
      selectedOptionId: null,
      shuffleSessionId: 'practice-session-0',
    });
    if (runtimeValid) practiceInterstitialQuestionCapValidated = true;
  }

  if (
    valid &&
    practiceSessionStoreFieldsValidated === EXPECTED_PRACTICE_SESSION_STORE_FIELDS.length
  ) {
    practiceSessionStoreSchemaParityValidated = true;
  }
  if (valid && runtimeValid) practiceSessionStoreRuntimeParityValidated = true;
}

function validateAnswerValidationTypeSchemaParity() {
  let valid = true;
  let answerValidationSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    answerValidationSource = fs.readFileSync(
      path.join(repoRoot, 'lib/quiz/answerValidation.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`lib/quiz/answerValidation.ts could not be read: ${error.message}`);
    return;
  }

  EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS.forEach(({ typeName, values }) => {
    const actualValues = extractStringUnionTypeFromTs(answerValidationSource, typeName);
    if (!arrayEquals(actualValues, values)) {
      reject(
        `lib/quiz/answerValidation.ts ${typeName} values are ${JSON.stringify(
          actualValues,
        )}, expected ${JSON.stringify(values)}`,
      );
      return;
    }
    answerValidationTypeUnionsValidated += 1;
  });

  EXPECTED_ANSWER_VALIDATION_INTERFACES.forEach((expectedInterface) => {
    const actualFields = extractObjectTypePropertiesFromTs(
      answerValidationSource,
      expectedInterface.name,
    );
    let interfaceIsValid = true;

    function rejectInterface(message) {
      interfaceIsValid = false;
      reject(message);
    }

    if (!Array.isArray(actualFields)) {
      rejectInterface(
        `lib/quiz/answerValidation.ts ${expectedInterface.name} interface could not be read`,
      );
      return;
    }

    const actualNames = actualFields.map((field) => field.name);
    const expectedNames = expectedInterface.fields.map((field) => field.name);
    if (!arrayEquals(actualNames, expectedNames)) {
      rejectInterface(
        `lib/quiz/answerValidation.ts ${expectedInterface.name} fields are ${JSON.stringify(
          actualNames,
        )}, expected ${JSON.stringify(expectedNames)}`,
      );
    }

    const actualFieldsByName = new Map(actualFields.map((field) => [field.name, field]));
    expectedInterface.fields.forEach((expectedField) => {
      const actualField = actualFieldsByName.get(expectedField.name);
      if (!actualField) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name} missing ${expectedField.name}`,
        );
        return;
      }
      if (actualField.type !== expectedField.type) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name}.${expectedField.name} type is ${actualField.type}, expected ${expectedField.type}`,
        );
      }
      if (actualField.optional !== expectedField.optional) {
        rejectInterface(
          `lib/quiz/answerValidation.ts ${expectedInterface.name}.${expectedField.name} optional=${actualField.optional}, expected ${expectedField.optional}`,
        );
      }
    });

    if (interfaceIsValid) answerValidationTypeInterfacesValidated += 1;
  });

  if (
    valid &&
    answerValidationTypeUnionsValidated === EXPECTED_ANSWER_VALIDATION_TYPE_UNIONS.length &&
    answerValidationTypeInterfacesValidated === EXPECTED_ANSWER_VALIDATION_INTERFACES.length
  ) {
    answerValidationTypeSchemaParityValidated = true;
  }
}

function validateAnswerFeedbackParity() {
  if (
    !Array.isArray(questions) ||
    typeof isCorrectAnswer !== 'function' ||
    typeof getAnswerOptionFeedback !== 'function'
  ) {
    return;
  }

  let runtimeParityIsValid = true;

  questions.forEach((question) => {
    const correctOption = question.options?.find(
      (option) => option.id === question.correctOptionId,
    );
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!correctOption) {
      reject(`${question.id} answer feedback cannot find the correct option`);
      return;
    }

    if (!isCorrectAnswer(question, correctOption.id)) {
      reject(`${question.id} isCorrectAnswer rejects the correct option`);
    }

    const selectedCorrectFeedback = getAnswerOptionFeedback(
      question,
      correctOption.id,
      correctOption.id,
    );
    if (
      selectedCorrectFeedback.resultLabel !== 'Rätt' ||
      selectedCorrectFeedback.tone !== 'correct'
    ) {
      reject(`${question.id} selected correct feedback drifted`);
    }

    question.options.forEach((option) => {
      const label = `${question.id} option ${option.id}`;
      const idleFeedback = getAnswerOptionFeedback(question, option.id, null);
      if (!jsonEqual(idleFeedback, { tone: 'idle' })) {
        reject(`${label} idle feedback drifted`);
      }

      if (option.id === question.correctOptionId) {
        answerFeedbackOptionsValidated += 1;
        return;
      }

      if (isCorrectAnswer(question, option.id)) {
        reject(`${label} isCorrectAnswer accepts a wrong option`);
      }

      const selectedWrongFeedback = getAnswerOptionFeedback(question, option.id, option.id);
      if (
        selectedWrongFeedback.resultLabel !== 'Fel' ||
        selectedWrongFeedback.tone !== 'incorrect'
      ) {
        reject(`${label} selected wrong feedback drifted`);
      }

      const revealedCorrectFeedback = getAnswerOptionFeedback(
        question,
        correctOption.id,
        option.id,
      );
      if (
        revealedCorrectFeedback.resultLabel !== 'Rätt svar' ||
        revealedCorrectFeedback.tone !== 'correct'
      ) {
        reject(`${label} correct-answer reveal feedback drifted`);
      }

      question.options
        .filter((otherOption) => ![option.id, correctOption.id].includes(otherOption.id))
        .forEach((otherOption) => {
          const otherFeedback = getAnswerOptionFeedback(question, otherOption.id, option.id);
          if (!jsonEqual(otherFeedback, { tone: 'idle' })) {
            reject(`${label} changed neutral feedback for ${otherOption.id}`);
          }
        });

      answerFeedbackOptionsValidated += 1;
    });

    if (questionIsValid) answerFeedbackQuestionsValidated += 1;
  });

  if (runtimeParityIsValid && answerFeedbackQuestionsValidated === questions.length) {
    answerFeedbackRuntimeParityValidated = true;
  }
}

function answerShuffleOptionSignature(question) {
  return (question.options || [])
    .map((option) => `${option.id}:${option.textSv}:${option.textEn}`)
    .join('|');
}

function validateAnswerShuffleDistributionParity() {
  if (
    !Array.isArray(questions) ||
    typeof shuffleQuestionOptionsForSession !== 'function' ||
    typeof summarizeAnswerShuffleDistribution !== 'function' ||
    typeof answerShuffleDistributionIsBalanced !== 'function'
  ) {
    return;
  }

  let runtimeParityIsValid = true;
  const singleChoiceQuestions = questions.filter(
    (question) =>
      question.reviewStatus === 'published' &&
      question.type === 'single_choice' &&
      Array.isArray(question.options) &&
      question.options.length === SINGLE_CHOICE_OPTION_IDS.length,
  );
  const trueFalseQuestionsForShuffle = questions.filter(
    (question) =>
      question.reviewStatus === 'published' &&
      question.type === 'true_false' &&
      Array.isArray(question.options),
  );

  function reject(message) {
    runtimeParityIsValid = false;
    fail(message);
  }

  if (singleChoiceQuestions.length <= 100) {
    reject('answer shuffle needs more than 100 published single-choice questions');
    return;
  }

  const baseDistribution = summarizeAnswerShuffleDistribution(
    singleChoiceQuestions,
    'p0-answer-shuffle',
  );
  const movementSessionIds = Array.from(
    { length: 8 },
    (_unused, index) => `p0-answer-shuffle-movement-${index}`,
  );

  if (baseDistribution.totalQuestions !== singleChoiceQuestions.length) {
    reject(
      `answer shuffle distribution saw ${baseDistribution.totalQuestions} questions, expected ${singleChoiceQuestions.length}`,
    );
  }
  if (!answerShuffleDistributionIsBalanced(baseDistribution)) {
    reject(
      `answer shuffle correct positions exceed ${ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE}: ${JSON.stringify(
        baseDistribution.correctPositionCounts,
      )}`,
    );
  }

  singleChoiceQuestions.forEach((question) => {
    let questionIsValid = true;
    const originalSignature = answerShuffleOptionSignature(question);
    const originalCorrectOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    );
    const firstShuffle = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    const secondShuffle = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    const shuffledCorrectOption = firstShuffle.options.find(
      (option) => option.id === firstShuffle.correctOptionId,
    );
    const movementPositions = new Set(
      movementSessionIds.map(
        (sessionId) => shuffleQuestionOptionsForSession(question, sessionId).correctOptionId,
      ),
    );

    function rejectQuestion(message) {
      questionIsValid = false;
      reject(message);
    }

    if (JSON.stringify(firstShuffle) !== JSON.stringify(secondShuffle)) {
      rejectQuestion(`${question.id} answer shuffle is not stable for the same session`);
    }
    if (answerShuffleOptionSignature(question) !== originalSignature) {
      rejectQuestion(`${question.id} answer shuffle mutated source options`);
    }
    if (
      !arrayEquals(
        firstShuffle.options.map((option) => option.id),
        SINGLE_CHOICE_OPTION_IDS,
      )
    ) {
      rejectQuestion(`${question.id} answer shuffle did not remap display option ids`);
    }
    if (!originalCorrectOption || !shuffledCorrectOption) {
      rejectQuestion(`${question.id} answer shuffle lost the correct option`);
    } else if (
      shuffledCorrectOption.textSv !== originalCorrectOption.textSv ||
      shuffledCorrectOption.textEn !== originalCorrectOption.textEn
    ) {
      rejectQuestion(`${question.id} answer shuffle moved the correct label incorrectly`);
    }
    if (!isCorrectAnswer(firstShuffle, firstShuffle.correctOptionId)) {
      rejectQuestion(`${question.id} shuffled correctOptionId does not score as correct`);
    }
    if (movementPositions.size < 2) {
      rejectQuestion(`${question.id} answer shuffle ignores the session seed`);
    }

    if (questionIsValid) {
      answerShuffleSingleChoiceQuestionsValidated += 1;
      answerShuffleSessionMovementQuestionsValidated += 1;
    }
  });

  trueFalseQuestionsForShuffle.forEach((question) => {
    const shuffled = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    if (
      JSON.stringify(shuffled.options) !== JSON.stringify(question.options) ||
      shuffled.correctOptionId !== question.correctOptionId
    ) {
      reject(`${question.id} true/false answer order must stay fixed`);
      return;
    }
    answerShuffleTrueFalseQuestionsValidated += 1;
  });

  for (let index = 0; index < 50; index += 1) {
    const distribution = summarizeAnswerShuffleDistribution(
      singleChoiceQuestions,
      `p0-session-${index}`,
    );
    if (
      distribution.totalQuestions !== singleChoiceQuestions.length ||
      !answerShuffleDistributionIsBalanced(distribution)
    ) {
      reject(
        `answer shuffle distribution is unbalanced for ${distribution.sessionId}: ${JSON.stringify(
          distribution.correctPositionCounts,
        )}`,
      );
      continue;
    }
    answerShuffleSeedDistributionsValidated += 1;
  }

  if (
    runtimeParityIsValid &&
    answerShuffleSingleChoiceQuestionsValidated === singleChoiceQuestions.length &&
    answerShuffleTrueFalseQuestionsValidated === trueFalseQuestionsForShuffle.length &&
    answerShuffleSeedDistributionsValidated === 50 &&
    answerShuffleSessionMovementQuestionsValidated === singleChoiceQuestions.length
  ) {
    answerShuffleDistributionParityValidated = true;
  }
}

function speechOptionLetter(index) {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

const SOURCE_AUTHORITY_REPLACEMENTS = [
  {
    pattern: /\bSant eller falskt\s+enligt UHR-materialet\s*:/gi,
    replacement: 'Sant eller falskt:',
  },
  {
    pattern: /\bTrue or false\s+according to the UHR material\s*:/gi,
    replacement: 'True or false:',
  },
  { pattern: /\bEnligt UHR-materialet,\s*/gi, replacement: '' },
  { pattern: /\bAccording to the UHR material,\s*/gi, replacement: '' },
  { pattern: /\s+enligt UHR-materialet\b/gi, replacement: '' },
  { pattern: /\s+according to the UHR material\b/gi, replacement: '' },
  { pattern: /\s+enligt UHR-avsnittet\s+"[^"]+"/gi, replacement: '' },
  { pattern: /\s+the UHR section\s+"[^"]+"/gi, replacement: '' },
  { pattern: /^\s*Sant eller falskt\s*:\s*/i, replacement: '' },
  { pattern: /^\s*True or false\s*:\s*/i, replacement: '' },
];

function stripSourceAuthorityPhrasing(text) {
  if (!text) return '';

  const cleaned = SOURCE_AUTHORITY_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement.pattern, replacement.replacement),
    String(text),
  )
    .replace(/\?\s*,\s*/g, '? ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned
    .replace(/^([a-zåäö])/, (character) => character.toLocaleUpperCase('sv-SE'))
    .replace(/([.!?]\s+)([a-zåäö])/g, (_match, prefix, character) => {
      return `${prefix}${character.toLocaleUpperCase('sv-SE')}`;
    });
}

function expectedQuestionSpeechText(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  const questionText = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
  const optionText = options
    .map((option, index) => `Alternativ ${speechOptionLetter(index)}. ${option.textSv}.`)
    .join(' ');

  return `${questionText} ${optionText}`.trim();
}

function validateQuestionSpeechTextParity() {
  if (!Array.isArray(questions) || typeof buildQuestionSpeechText !== 'function') {
    return;
  }

  let runtimeParityIsValid = true;
  const expectedOptionCount = questions.reduce(
    (count, question) => count + (Array.isArray(question.options) ? question.options.length : 0),
    0,
  );

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!Array.isArray(question.options) || question.options.length === 0) {
      reject(`${label} speech text cannot be built without answer options`);
      return;
    }

    let speechText = '';
    try {
      speechText = buildQuestionSpeechText(question);
    } catch (error) {
      reject(`${label} buildQuestionSpeechText threw ${error.message}`);
      return;
    }

    const expectedSpeechText = expectedQuestionSpeechText(question);
    if (speechText !== expectedSpeechText) {
      reject(
        `${label} speech text is ${JSON.stringify(speechText)}, expected ${JSON.stringify(
          expectedSpeechText,
        )}`,
      );
    }

    const expectedPrompt = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
    if (!speechText.startsWith(expectedPrompt)) {
      reject(`${label} speech text must start with the display-safe Swedish question prompt`);
    }

    question.options.forEach((option, optionIndex) => {
      const expectedFragment = `Alternativ ${speechOptionLetter(optionIndex)}. ${option.textSv}.`;
      if (!speechText.includes(expectedFragment)) {
        reject(`${label} speech text is missing option fragment ${expectedFragment}`);
      }
    });

    if (questionIsValid) {
      questionSpeechTextQuestionsValidated += 1;
      questionSpeechTextOptionsValidated += question.options.length;
    }
  });

  if (
    runtimeParityIsValid &&
    questionSpeechTextQuestionsValidated === questions.length &&
    questionSpeechTextOptionsValidated === expectedOptionCount
  ) {
    questionSpeechTextParityValidated = true;
  }
}

if (focusedValidationRequested('questionSpeechTextParity')) {
  validateQuestionSpeechTextParity();
  exitWithValidationFailures();
  printValidationSummary({
    publishedQuestions: Array.isArray(questions)
      ? questions.filter((question) => question.reviewStatus === 'published').length
      : 0,
    questionSpeechTextQuestionsValidated,
    questionSpeechTextOptionsValidated,
    questionSpeechTextParityValidated,
  });
  process.exit(0);
}

function resetSpeechEvents() {
  speechEvents.length = 0;
}

function validateSpeechRuntimeParity() {
  if (typeof speakSwedish !== 'function' || typeof stopSpeech !== 'function') {
    return;
  }

  let runtimeParityIsValid = true;

  function reject(message) {
    runtimeParityIsValid = false;
    fail(message);
  }

  resetSpeechEvents();
  speakSwedish('');
  if (speechEvents.length === 0) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('speakSwedish must ignore empty text');
  }

  resetSpeechEvents();
  speakSwedish('   ');
  if (speechEvents.length === 0) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('speakSwedish must ignore whitespace-only text');
  }

  resetSpeechEvents();
  speakSwedish('Hej Sverige');
  const speakEvent = speechEvents[0];
  if (
    speechEvents.length === 1 &&
    speakEvent &&
    speakEvent.type === 'speak' &&
    speakEvent.text === 'Hej Sverige' &&
    speakEvent.options &&
    speakEvent.options.language === EXPECTED_SWEDISH_SPEECH_LANGUAGE
  ) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject(
      `speakSwedish must request ${EXPECTED_SWEDISH_SPEECH_LANGUAGE} speech for non-empty text`,
    );
  }

  resetSpeechEvents();
  stopSpeech();
  const stopEvent = speechEvents[0];
  if (speechEvents.length === 1 && stopEvent && stopEvent.type === 'stop') {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('stopSpeech must call the Expo Speech stop handler');
  }

  resetSpeechEvents();
  const syncSpeechError = new Error('speech unavailable');
  let onErrorCallbackError = null;
  const originalWarn = console.warn;
  console.warn = () => {};
  speechMock.throwOnSpeak = syncSpeechError;
  try {
    speakSwedish('Hej fel', {
      onError(error) {
        onErrorCallbackError = error;
        speechEvents.push({ type: 'onError', error });
      },
    });
  } finally {
    speechMock.throwOnSpeak = null;
    console.warn = originalWarn;
  }
  const onErrorEvent = speechEvents[0];
  if (
    speechEvents.length === 1 &&
    onErrorEvent &&
    onErrorEvent.type === 'onError' &&
    onErrorCallbackError === syncSpeechError
  ) {
    speechRuntimeCasesValidated += 1;
  } else {
    reject('speakSwedish must call onError once when Speech.speak throws synchronously');
  }

  resetSpeechEvents();

  if (runtimeParityIsValid && speechRuntimeCasesValidated === EXPECTED_SPEECH_RUNTIME_CASES) {
    speechRuntimeParityValidated = true;
  }
}

if (focusedValidationRequested('speechRuntimeParity')) {
  validateSpeechRuntimeParity();
  exitWithValidationFailures();
  printValidationSummary({
    speechRuntimeCasesValidated,
    speechRuntimeParityValidated,
  });
  process.exit(0);
}

function validateChapterQuizSessionParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(questions) ||
    typeof getChapterQuizSessionId !== 'function'
  ) {
    return;
  }

  chapters.forEach((chapter) => {
    const expectedQuestion = questions.find((question) => question.chapterId === chapter.id);
    const sessionId = getChapterQuizSessionId(questions, chapter.id);
    const sessionQuestion = questions.find((question) => question.id === sessionId);
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!expectedQuestion) {
      reject(`${chapter.id} has no question for chapter quiz session`);
    } else if (sessionId !== expectedQuestion.id) {
      reject(
        `${chapter.id} chapter quiz session resolves to ${sessionId}, expected ${expectedQuestion.id}`,
      );
    }

    if (!sessionQuestion) {
      reject(`${chapter.id} chapter quiz session id ${sessionId} does not match a question`);
    } else if (sessionQuestion.chapterId !== chapter.id) {
      reject(
        `${chapter.id} chapter quiz session id ${sessionId} belongs to ${sessionQuestion.chapterId}`,
      );
    } else if (sessionQuestion.reviewStatus !== 'published') {
      reject(`${chapter.id} chapter quiz session id ${sessionId} is not published`);
    }

    if (valid) chapterQuizSessionParityValidated += 1;
  });

  if (getChapterQuizSessionId(questions, 'missing-chapter') !== null) {
    fail('missing chapter quiz session should resolve to null');
  }
  if (getChapterQuizSessionId(questions, null) !== null) {
    fail('null chapter quiz session should resolve to null');
  }
}

function isoDaysAfter(baseIso, days) {
  const dayInMs = 24 * 60 * 60 * 1000;
  return new Date(new Date(baseIso).getTime() + days * dayInMs).toISOString();
}

function validateSpacedRepetitionSchedule() {
  if (!Array.isArray(spacedRepetitionSchedule)) return;

  if (!jsonEqual(spacedRepetitionSchedule, EXPECTED_SPACED_REPETITION_SCHEDULE)) {
    fail(
      `spacedRepetitionSchedule is ${JSON.stringify(
        spacedRepetitionSchedule,
      )}, expected ${JSON.stringify(EXPECTED_SPACED_REPETITION_SCHEDULE)}`,
    );
  }

  spacedRepetitionSchedule.forEach((days, index) => {
    let valid = true;

    if (!Number.isInteger(days) || days < 1) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be a positive integer day interval`);
    }
    if (index > 0 && days <= spacedRepetitionSchedule[index - 1]) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be greater than the previous interval`);
    }

    if (valid) spacedRepetitionIntervalsValidated += 1;
  });

  if (typeof getNextReviewAt !== 'function') return;

  const answeredAt = '2026-05-15T10:00:00.000Z';
  const cases = [
    {
      input: { isCorrect: false, correctStreak: 99, answeredAt },
      expectedDays: 1,
      label: 'wrong answer',
    },
    {
      input: { isCorrect: true, correctStreak: 0, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[0],
      label: 'correct streak 0',
    },
    {
      input: { isCorrect: true, correctStreak: 3, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[3],
      label: 'correct streak 3',
    },
    {
      input: { isCorrect: true, correctStreak: 50, answeredAt },
      expectedDays:
        EXPECTED_SPACED_REPETITION_SCHEDULE[EXPECTED_SPACED_REPETITION_SCHEDULE.length - 1],
      label: 'capped correct streak',
    },
  ];
  let runtimeParityIsValid = true;

  cases.forEach(({ input, expectedDays, label }) => {
    const actual = getNextReviewAt(input);
    const expected = isoDaysAfter(answeredAt, expectedDays);
    if (actual !== expected) {
      runtimeParityIsValid = false;
      fail(`getNextReviewAt ${label} returned ${actual}, expected ${expected}`);
    }
  });

  if (runtimeParityIsValid) spacedRepetitionRuntimeParityValidated = true;
}

function validateStreakRules() {
  if (
    typeof calculateStreak !== 'function' ||
    typeof calculateStreakWithFreeze !== 'function' ||
    typeof refillFreezes !== 'function'
  ) {
    return;
  }

  const today = '2026-05-15';
  const streakFreezeNow = new Date('2026-05-19T12:00:00.000Z');
  const malformedFreezeState = {
    available: 1,
    lastEarnedAt: 'not-a-date',
    lifetimeEarned: 1,
    lifetimeSpent: 0,
    rescuedDayKeys: ['bad-key', '2026-05-17'],
  };
  const cases = [
    {
      label: 'empty answer history',
      actual: () => calculateStreak([], today),
      expected: 0,
    },
    {
      label: 'consecutive answer days through today',
      actual: () =>
        calculateStreak(['2026-05-13T09:00:00.000Z', '2026-05-14', '2026-05-15'], today),
      expected: 3,
    },
    {
      label: 'duplicate answer dates',
      actual: () =>
        calculateStreak(
          ['2026-05-14', '2026-05-15T08:00:00.000Z', '2026-05-15T20:00:00.000Z'],
          today,
        ),
      expected: 2,
    },
    {
      label: 'missed today but answered yesterday',
      actual: () => calculateStreak(['2026-05-13', '2026-05-14'], today),
      expected: 2,
    },
    {
      label: 'gap before today',
      actual: () => calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], today),
      expected: 1,
    },
    {
      label: 'future-only answers',
      actual: () => calculateStreak(['2026-05-16'], today),
      expected: 0,
    },
    {
      label: 'streakWithFreeze ignores malformed active day keys',
      actual: () =>
        calculateStreakWithFreeze({
          activeDayKeys: ['2026-05-19', '2026-05-18T08:00:00.000Z', 7, '2026-02-30'],
          freezeState: malformedFreezeState,
          today: '2026-05-19',
          now: streakFreezeNow,
        }).streakDays,
      expected: 3,
    },
    {
      label: 'streakWithFreeze falls back from invalid today',
      actual: () =>
        calculateStreakWithFreeze({
          activeDayKeys: ['2026-05-19', '2026-05-18'],
          freezeState: malformedFreezeState,
          today: 'not-a-date',
          now: streakFreezeNow,
        }).streakDays,
      expected: 3,
    },
    {
      label: 'refillFreezes repairs invalid lastEarnedAt',
      actual: () => refillFreezes(malformedFreezeState, streakFreezeNow).lastEarnedAt,
      expected: '2026-05-18',
    },
    {
      label: 'refillFreezes rejects invalid now corruption',
      actual: () => {
        const lastEarnedAt = refillFreezes(
          malformedFreezeState,
          new Date('not-a-date'),
        ).lastEarnedAt;
        return /^\d{4}-\d{2}-\d{2}$/.test(lastEarnedAt) && !/NaN|not-a-date/.test(lastEarnedAt);
      },
      expected: true,
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`streak rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`streak rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      streakRulesValidated += 1;
    }
  });

  if (rulesAreValid && streakRulesValidated === EXPECTED_STREAK_RULE_COUNT) {
    streakRulesParityValidated = true;
  }
}

function validateXpRules() {
  if (
    typeof calculateAnswerXp !== 'function' ||
    typeof calculateQuizCompletionXp !== 'function' ||
    typeof calculateLevel !== 'function'
  ) {
    return;
  }

  const cases = [
    {
      label: 'correct answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: true }),
      expected: 12,
    },
    {
      label: 'correct answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: false }),
      expected: 10,
    },
    {
      label: 'wrong answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: true }),
      expected: 4,
    },
    {
      label: 'wrong answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: false }),
      expected: 2,
    },
    {
      label: 'non-boolean answer correctness',
      actual: () => calculateAnswerXp({ isCorrect: 'true', explanationRead: true }),
      expected: 0,
    },
    {
      label: 'string correctness answer XP',
      actual: () => calculateAnswerXp({ isCorrect: 'false', explanationRead: 'yes' }),
      expected: 0,
    },
    {
      label: 'non-boolean explanation read flag',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: 'yes' }),
      expected: 10,
    },
    {
      label: 'empty quiz completion',
      actual: () => calculateQuizCompletionXp({ answeredCount: 0, correctCount: 0 }),
      expected: 0,
    },
    {
      label: 'completed quiz without perfect bonus',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 9 }),
      expected: 20,
    },
    {
      label: 'perfect ten-question quiz',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }),
      expected: 70,
    },
    {
      label: 'NaN quiz completion counts',
      actual: () => calculateQuizCompletionXp({ answeredCount: NaN, correctCount: 0 }),
      expected: 0,
    },
    {
      label: 'string quiz completion counters',
      actual: () => calculateQuizCompletionXp({ answeredCount: '10', correctCount: '10' }),
      expected: 0,
    },
    {
      label: 'infinite quiz completion counts',
      actual: () => calculateQuizCompletionXp({ answeredCount: Infinity, correctCount: Infinity }),
      expected: 0,
    },
    {
      label: 'fractional quiz completion counts',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10.5, correctCount: 10 }),
      expected: 0,
    },
    {
      label: 'negative answered quiz completion count',
      actual: () => calculateQuizCompletionXp({ answeredCount: -1, correctCount: 0 }),
      expected: 0,
    },
    {
      label: 'over-correct quiz completion count',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 11 }),
      expected: 0,
    },
    { label: 'level at 0 XP', actual: () => calculateLevel(0), expected: 1 },
    { label: 'level for NaN XP', actual: () => calculateLevel(NaN), expected: 1 },
    { label: 'level for infinite XP', actual: () => calculateLevel(Infinity), expected: 1 },
    { label: 'level below first threshold', actual: () => calculateLevel(99), expected: 1 },
    { label: 'level at 100 XP', actual: () => calculateLevel(100), expected: 2 },
    { label: 'level at 400 XP', actual: () => calculateLevel(400), expected: 3 },
    { label: 'level for string XP', actual: () => calculateLevel('10000'), expected: 1 },
    { label: 'level for negative XP', actual: () => calculateLevel(-100), expected: 1 },
  ];

  let rulesAreValid = true;

  if (cases.length !== EXPECTED_XP_RULE_COUNT) {
    rulesAreValid = false;
    fail(`XP rule catalog validates ${cases.length} cases, expected ${EXPECTED_XP_RULE_COUNT}`);
  }

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`XP rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`XP rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      xpRulesValidated += 1;
    }
  });

  if (rulesAreValid && xpRulesValidated === EXPECTED_XP_RULE_COUNT) {
    xpRulesParityValidated = true;
  }
}

if (focusedValidationRequested('badgeXpRuntime')) {
  validateBadgeCatalog();
  validateXpRules();
  exitWithValidationFailures();
  printValidationSummary({
    badgesValidated,
    badgeMilestoneParityValidated,
    badgeRuntimeInputCasesValidated,
    badgeRuntimeInputParityValidated,
    xpRulesValidated,
    xpRulesParityValidated,
  });
  process.exit(0);
}

function validateMasteryRules() {
  if (
    typeof calculateMastery !== 'function' ||
    typeof calculateChapterMastery !== 'function' ||
    typeof findWeakChapterIds !== 'function'
  ) {
    return;
  }

  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };
  const cases = [
    {
      label: 'no progress mastery',
      actual: () =>
        calculateMastery({
          correctCount: 0,
          seenCount: 0,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0,
    },
    {
      label: 'weighted accuracy coverage and recency',
      actual: () =>
        calculateMastery({
          correctCount: 8,
          seenCount: 10,
          totalQuestions: 20,
          recent: true,
        }),
      expected: 0.75,
    },
    {
      label: 'mastery clamps oversampled counts',
      actual: () =>
        calculateMastery({
          correctCount: 20,
          seenCount: 10,
          totalQuestions: 5,
          recent: false,
        }),
      expected: 0.8,
    },
    {
      label: 'mastery without recency bonus',
      actual: () =>
        calculateMastery({
          correctCount: 5,
          seenCount: 10,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0.4,
    },
    {
      label: 'chapter mastery aggregate',
      actual: () => calculateChapterMastery('ch01', questions, progress),
      expected: 0.67,
    },
    {
      label: 'unknown chapter mastery',
      actual: () => calculateChapterMastery('ch99', questions, progress),
      expected: 0,
    },
    {
      label: 'weak chapter ids',
      actual: () => findWeakChapterIds(questions, progress, 0.7),
      expected: ['ch01'],
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`mastery rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actualValue, expected)) {
      rulesAreValid = false;
      fail(
        `mastery rule ${label} returned ${JSON.stringify(actualValue)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      masteryRulesValidated += 1;
    }
  });

  if (rulesAreValid && masteryRulesValidated === EXPECTED_MASTERY_RULE_COUNT) {
    masteryRulesParityValidated = true;
  }
}

function validateDashboardPerChapterInputRules() {
  if (typeof perChapterProgress !== 'function') return;

  const progress = {
    sessions: [
      {
        id: 'dashboard-input-guard',
        mode: 'study',
        questionIds: [],
        startedAt: '2026-05-19T00:00:00.000Z',
        answers: [
          {
            questionId: 'nan-1',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:00:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'negative-1',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:01:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'fractional-1',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:02:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'small-1',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:03:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'small-2',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:04:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'valid-1',
            selectedOptionIds: [],
            isCorrect: 'yes',
            answeredAt: '2026-05-19T10:05:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'valid-2',
            selectedOptionIds: [],
            isCorrect: 1,
            answeredAt: '2026-05-19T10:06:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'valid-3',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-19T10:07:00.000Z',
            timeSpentSeconds: 5,
          },
        ],
      },
    ],
  };
  const result = perChapterProgress(
    progress,
    [
      { id: 'nan-count', questionCount: Number.NaN },
      { id: 'negative-count', questionCount: -5 },
      { id: 'fractional-count', questionCount: 2.5 },
      { id: 'undersized-count', questionCount: 1 },
      { id: 'valid-count', questionCount: 3 },
    ],
    {
      'nan-1': 'nan-count',
      'negative-1': 'negative-count',
      'fractional-1': 'fractional-count',
      'small-1': 'undersized-count',
      'small-2': 'undersized-count',
      'valid-1': 'valid-count',
      'valid-2': 'valid-count',
      'valid-3': 'valid-count',
    },
    { now: new Date('2026-05-20T12:00:00.000Z') },
  );
  const byId = new Map(result.map((bar) => [bar.chapterId, bar]));
  const cases = [
    { label: 'NaN questionCount coverage', actual: byId.get('nan-count')?.coverage, expected: 0 },
    {
      label: 'negative questionCount coverage',
      actual: byId.get('negative-count')?.coverage,
      expected: 0,
    },
    {
      label: 'fractional questionCount coverage',
      actual: byId.get('fractional-count')?.coverage,
      expected: 0,
    },
    {
      label: 'undersized questionCount coverage',
      actual: byId.get('undersized-count')?.coverage,
      expected: 1,
    },
    {
      label: 'non-boolean correctness accuracy',
      actual: byId.get('valid-count')?.accuracy,
      expected: 1 / 3,
    },
  ];
  let rulesAreValid = true;

  result.forEach((bar) => {
    if (!Number.isFinite(bar.coverage) || bar.coverage < 0 || bar.coverage > 1) {
      rulesAreValid = false;
      fail(`${bar.chapterId} dashboard per-chapter coverage is out of range: ${bar.coverage}`);
    }
  });
  cases.forEach(({ label, actual, expected }) => {
    if (actual !== expected) {
      rulesAreValid = false;
      fail(`dashboard per-chapter ${label} returned ${actual}, expected ${expected}`);
    } else {
      dashboardPerChapterInputRulesValidated += 1;
    }
  });
  if (rulesAreValid && dashboardPerChapterInputRulesValidated === cases.length) {
    dashboardPerChapterInputParityValidated = true;
  }
}

function validateReadinessAdapterRules() {
  if (typeof computeReadinessFromQuestionProgress !== 'function') return;

  const now = new Date('2026-05-19T12:00:00.000Z');
  const validQuestions = Array.from({ length: 40 }, (_, index) => ({
    id: `q${index}`,
    chapterId: index < 20 ? 'ch01' : 'ch02',
  }));
  const validQuestionProgress = Object.fromEntries(
    validQuestions.map((question) => [
      question.id,
      {
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-18T10:00:00.000Z',
      },
    ]),
  );
  const validReadiness = computeReadinessFromQuestionProgress({
    questionProgress: validQuestionProgress,
    questions: validQuestions,
    chapters: [
      { id: 'ch01', questionCount: 20 },
      { id: 'ch02', questionCount: 20 },
    ],
    now,
  });

  const malformedReadiness = computeReadinessFromQuestionProgress({
    questionProgress: {
      infinite: {
        seenCount: Infinity,
        correctCount: Infinity,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
      },
      stringy: {
        seenCount: '3',
        correctCount: '2',
        wrongCount: '1',
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:01:00.000Z',
      },
      fractional: {
        seenCount: 1.5,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:02:00.000Z',
      },
      oversized: {
        seenCount: 10001,
        correctCount: 10001,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:03:00.000Z',
      },
      valid: {
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-19T10:04:00.000Z',
      },
    },
    questions: [
      { id: 'infinite', chapterId: 'ch01' },
      { id: 'stringy', chapterId: 'ch01' },
      { id: 'fractional', chapterId: 'ch01' },
      { id: 'oversized', chapterId: 'ch01' },
      { id: 'valid', chapterId: 'ch02' },
    ],
    chapters: [
      { id: 'ch01', questionCount: 4 },
      { id: 'ch02', questionCount: 1 },
    ],
    now,
  });

  const scoreOnlyMock = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      { sessionId: 'score-only', score: 0.8, completedAt: '2026-05-19T10:00:00.000Z' },
    ],
    now,
  });
  const countedMock = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      {
        sessionId: 'counted',
        score: 0.8,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 32,
        totalCount: 40,
      },
    ],
    now,
  });
  const malformedMock = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      {
        sessionId: 'bad-total',
        score: 0.8,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 32,
        totalCount: Infinity,
      },
    ],
    now,
  });

  const readinessSource = loadText('lib/learning/readiness.ts');
  const adapterStart = readinessSource.indexOf(
    'export function computeReadinessFromQuestionProgress',
  );
  const adapterEnd = readinessSource.indexOf(
    '\nexport function computeReadinessScore',
    adapterStart,
  );
  const adapterBody =
    adapterStart === -1 || adapterEnd === -1 ? '' : readinessSource.slice(adapterStart, adapterEnd);
  const rules = [
    {
      label: 'valid persisted progress aggregates to a strong non-sparse score',
      valid:
        validReadiness.verdict === 'strong_preparation' &&
        validReadiness.isSparse === false &&
        validReadiness.components.accuracy === 1 &&
        validReadiness.components.coverage === 1,
      detail: JSON.stringify(validReadiness),
    },
    {
      label: 'malformed study counters are ignored without changing valid aggregates',
      valid:
        malformedReadiness.isSparse === true &&
        malformedReadiness.components.accuracy === 1 &&
        malformedReadiness.components.coverage === 0.5,
      detail: JSON.stringify(malformedReadiness),
    },
    {
      label: 'score-only mock recency and score contribute without synthetic answers',
      valid:
        scoreOnlyMock.isSparse === true &&
        scoreOnlyMock.components.accuracy === 0 &&
        Math.abs(scoreOnlyMock.components.mockAverage - 0.8) < 0.0001 &&
        scoreOnlyMock.components.recency > 0.99,
      detail: JSON.stringify(scoreOnlyMock),
    },
    {
      label: 'counted mock totals affect sparse state but not practice accuracy',
      valid:
        countedMock.isSparse === false &&
        countedMock.components.accuracy === 0 &&
        Math.abs(countedMock.components.mockAverage - 0.8) < 0.0001,
      detail: JSON.stringify(countedMock),
    },
    {
      label: 'malformed mock totals do not count as sparse-state answers',
      valid:
        malformedMock.isSparse === true &&
        malformedMock.components.accuracy === 0 &&
        Math.abs(malformedMock.components.mockAverage - 0.8) < 0.0001,
      detail: JSON.stringify(malformedMock),
    },
    {
      label: 'adapter computes aggregates without Array.from synthetic rows',
      valid: adapterBody.length > 0 && !/Array\.from\s*\(/.test(adapterBody),
      detail: 'computeReadinessFromQuestionProgress must not materialize answer rows',
    },
  ];
  let rulesAreValid = true;

  rules.forEach(({ label, valid, detail }) => {
    if (valid) {
      readinessAdapterRulesValidated += 1;
      return;
    }
    rulesAreValid = false;
    fail(`readiness adapter rule ${label} failed: ${detail}`);
  });

  if (rulesAreValid && readinessAdapterRulesValidated === EXPECTED_READINESS_ADAPTER_RULE_COUNT) {
    readinessAdapterRuntimeParityValidated = true;
  }
}

function validateWeeklyRecapRuntimeGuards() {
  if (typeof generateWeeklyRecap !== 'function') {
    return;
  }

  const recap = generateWeeklyRecap({
    progress: {
      totalXp: 0,
      level: 1,
      currentStreak: '7',
      dailyGoalAnswers: 10,
      questionProgress: {
        validResolved: {
          questionId: 'validResolved',
          correctStreak: 1,
          wrongCount: 1,
          lastAnsweredAt: '2026-05-20T10:03:00.000Z',
        },
        stringCounters: {
          questionId: 'stringCounters',
          correctStreak: '1',
          wrongCount: '2',
          lastAnsweredAt: '2026-05-20T10:04:00.000Z',
        },
      },
      sessions: [
        {
          id: 'weekly-bad-runtime',
          mode: 'exam',
          questionIds: ['q1', 'q2', 'q3'],
          startedAt: '2026-05-20T10:00:00.000Z',
          completedAt: '2026-05-20T10:30:00.000Z',
          score: Infinity,
          answers: [
            {
              questionId: 'q1',
              selectedOptionIds: ['a'],
              isCorrect: 'true',
              answeredAt: '2026-05-20T10:00:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q2',
              selectedOptionIds: ['a'],
              isCorrect: 1,
              answeredAt: '2026-05-20T10:01:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q3',
              selectedOptionIds: ['a'],
              isCorrect: false,
              answeredAt: '2026-05-20T10:02:00.000Z',
              timeSpentSeconds: 5,
            },
          ],
        },
        {
          id: 'weekly-high-runtime',
          mode: 'exam',
          questionIds: [],
          answers: [],
          startedAt: '2026-05-20T11:00:00.000Z',
          completedAt: '2026-05-20T11:20:00.000Z',
          score: 1.2,
        },
      ],
    },
    chapterMasteryAtWeekStart: { ch01: 0.1, ch02: '0.1', ch03: 0.2 },
    chapterMasteryNow: { ch01: Infinity, ch02: 0.9, ch03: 1.1 },
    masteryThreshold: '0.8',
    now: new Date('2026-05-20T12:00:00.000Z'),
  });

  const cases = [
    { label: 'truthy correctness is not correct', actual: recap.accuracy, expected: 0 },
    { label: 'answered count is preserved', actual: recap.questionsAnswered, expected: 3 },
    { label: 'valid resolved mistake still counts', actual: recap.mistakesResolved, expected: 1 },
    { label: 'malformed streak normalizes to number', actual: recap.streakDays, expected: 0 },
    { label: 'exam completions still count', actual: recap.mockExamsTaken, expected: 2 },
    { label: 'mock best score is finite and clamped', actual: recap.bestMockScore, expected: 1 },
    {
      label: 'invalid mastery values do not master',
      actual: recap.chapterNowMastered,
      expected: null,
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    if (!jsonEqual(actual, expected)) {
      rulesAreValid = false;
      fail(
        `weekly recap runtime guard ${label} returned ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      weeklyRecapRuntimeCasesValidated += 1;
    }
  });

  if (rulesAreValid && weeklyRecapRuntimeCasesValidated === EXPECTED_WEEKLY_RECAP_RUNTIME_CASES) {
    weeklyRecapRuntimeParityValidated = true;
  }
}

if (focusedValidationRequested('weeklyRecapRuntime')) {
  validateWeeklyRecapRuntimeGuards();
  exitWithValidationFailures();
  printValidationSummary({
    weeklyRecapRuntimeCasesValidated,
    weeklyRecapRuntimeParityValidated,
  });
  process.exit(0);
}

function validateQuestionBankCsvContract() {
  if (!Array.isArray(questions)) return;

  const csvPath = path.join(repoRoot, 'content/question-bank.csv');
  let rows = [];
  try {
    rows = parseCsvRows(fs.readFileSync(csvPath, 'utf8'));
  } catch (error) {
    fail(`content/question-bank.csv could not be parsed: ${error.message}`);
    return;
  }

  if (!rows.length) {
    fail('content/question-bank.csv is empty');
    return;
  }

  const [header, ...dataRows] = rows;
  questionBankCsvHeaderColumnsValidated = header.length;

  const duplicateHeaderNames = [
    ...new Set(header.filter((field, index) => header.indexOf(field) !== index)),
  ];
  questionBankCsvUniqueHeaderNamesValidated = duplicateHeaderNames.length === 0;
  if (duplicateHeaderNames.length) {
    fail(
      `content/question-bank.csv header has duplicate column name(s): ${duplicateHeaderNames.join(
        ', ',
      )}`,
    );
  }

  if (!jsonEqual(header, QUESTION_BANK_CSV_HEADER)) {
    fail(
      `content/question-bank.csv header is ${JSON.stringify(header)}, expected ${JSON.stringify(
        QUESTION_BANK_CSV_HEADER,
      )}`,
    );
  }

  if (dataRows.length !== questions.length) {
    fail(
      `content/question-bank.csv has ${dataRows.length} data rows, expected ${questions.length}`,
    );
  }

  const sharedMetadataFields = new Map([
    ['uhrSourceTitle', uhrSectionMap?.source?.title],
    ['uhrSourcePublisher', uhrSectionMap?.source?.publisher],
    ['uhrSourceUrl', uhrSectionMap?.source?.url],
    ['uhrSourceRetrievedAt', uhrSectionMap?.source?.retrievedDate],
  ]);
  const sharedMetadataSourceKeys = new Map([
    ['uhrSourceTitle', 'title'],
    ['uhrSourcePublisher', 'publisher'],
    ['uhrSourceUrl', 'url'],
    ['uhrSourceRetrievedAt', 'retrievedDate'],
  ]);
  const summarizedSharedMetadataDriftFields = new Set();

  for (const [field, expected] of sharedMetadataFields.entries()) {
    const fieldIndex = QUESTION_BANK_CSV_HEADER.indexOf(field);
    if (fieldIndex < 0 || !dataRows.length) continue;

    const driftedRows = dataRows.filter((row) => row[fieldIndex] !== expected);
    if (driftedRows.length === dataRows.length) {
      summarizedSharedMetadataDriftFields.add(field);
      fail(
        `content/question-bank.csv ${field} metadata drift: ${driftedRows.length} rows disagree with content/uhr-section-map.json source.${sharedMetadataSourceKeys.get(
          field,
        )}`,
      );
    }
  }

  dataRows.forEach((row, index) => {
    const question = questions[index];
    const rowNumber = index + 2;
    const label = question?.id || `CSV row ${rowNumber}`;
    let rowIsValid = true;

    function reject(message) {
      rowIsValid = false;
      fail(message);
    }

    if (row.length !== QUESTION_BANK_CSV_HEADER.length) {
      reject(
        `content/question-bank.csv row ${rowNumber} has ${row.length} columns, expected ${QUESTION_BANK_CSV_HEADER.length}`,
      );
    }
    if (!question) {
      reject(`content/question-bank.csv row ${rowNumber} has no matching question`);
      return;
    }

    const expectedRow = [
      question.id,
      question.chapterId,
      question.type,
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
      question.correctOptionId,
      questionOptionPayload(question, 'textSv'),
      questionOptionPayload(question, 'textEn'),
      question.uhrReference?.chapter,
      question.uhrReference?.section,
      String(question.uhrReference?.pageApprox),
      uhrSectionMap?.source?.title,
      uhrSectionMap?.source?.publisher,
      uhrSectionMap?.source?.url,
      uhrSectionMap?.source?.retrievedDate,
      question.difficulty,
      question.reviewStatus,
      Array.isArray(question.tags) ? question.tags.join('|') : '',
      getQuestionProvenance(question),
    ];

    QUESTION_BANK_CSV_HEADER.forEach((field, fieldIndex) => {
      if (summarizedSharedMetadataDriftFields.has(field)) return;
      if (row[fieldIndex] !== expectedRow[fieldIndex]) {
        reject(
          `content/question-bank.csv row ${rowNumber} ${label} ${field} is ${JSON.stringify(
            row[fieldIndex],
          )}, expected ${JSON.stringify(expectedRow[fieldIndex])}`,
        );
      }
    });

    const publisherIndex = QUESTION_BANK_CSV_HEADER.indexOf('uhrSourcePublisher');
    if (row[publisherIndex] === uhrSectionMap?.source?.publisher) {
      questionBankCsvUhrSourcePublisherRowsValidated += 1;
    }

    const provenanceIndex = QUESTION_BANK_CSV_HEADER.indexOf('questionProvenance');
    const provenance = row[provenanceIndex];
    if (Object.hasOwn(questionBankCsvProvenanceCounts, provenance)) {
      questionBankCsvProvenanceCounts[provenance] += 1;
    }

    if (rowIsValid) questionBankCsvRowsValidated += 1;
  });

  questionBankCsvUhrSourcePublisherParityValidated =
    dataRows.length === questions.length &&
    questionBankCsvUhrSourcePublisherRowsValidated === dataRows.length;
}

if (focusedValidationRequested('uhrSourceMetadata')) {
  validateUhrSourceMetadata();
  exitWithValidationFailures();
  printValidationSummary({
    uhrSourceMetadataValidated,
    uhrSourceRetrievedDateValidated,
    uhrMapSourceExactSchemaKeysValidated,
    uhrMapTextFieldsNormalizedValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('questionBankCsv')) {
  validateUhrSourceMetadata();
  validateQuestionBankCsvContract();
  exitWithValidationFailures();
  const publishedQuestions = Array.isArray(questions)
    ? questions.filter((question) => question.reviewStatus === 'published').length
    : 0;
  printValidationSummary({
    questions: Array.isArray(questions) ? questions.length : 0,
    publishedQuestions,
    questionBankCsvHeaderColumnsValidated,
    questionBankCsvUniqueHeaderNamesValidated,
    questionBankCsvRowsValidated,
    questionBankCsvProvenanceCounts,
    questionBankCsvUhrSourcePublisherRowsValidated,
    questionBankCsvUhrSourcePublisherParityValidated,
  });
  process.exit(0);
}

function criminalResponsibilityCurrentnessQuestionIds() {
  const ids = [CRIMINAL_RESPONSIBILITY_CURRENTNESS.sourceId];

  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return ids;
  }

  const sourceIndex = sourceQuestions.findIndex(
    (question) => question.id === CRIMINAL_RESPONSIBILITY_CURRENTNESS.sourceId,
  );
  if (sourceIndex < 0) return ids;

  return [
    ...ids,
    ...generatedPublishedQuestions
      .slice(
        sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
        (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
      )
      .map((question) => question?.id)
      .filter(hasText),
  ];
}

function validateCriminalResponsibilityCurrentness() {
  if (!Array.isArray(questions)) return;

  const byId = new Map(questions.map((question) => [question.id, question]));
  const currentnessIds = criminalResponsibilityCurrentnessQuestionIds();
  const expectedCurrentnessRows = GENERATED_VARIANTS_PER_SOURCE + 1;
  let allRowsAreValid = true;
  let sourceMetadataIsValid = true;

  function rejectMetadata(message) {
    sourceMetadataIsValid = false;
    allRowsAreValid = false;
    fail(message);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt)) {
    rejectMetadata('criminal-responsibility currentness retrievedAt metadata is invalid');
  }
  if (CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalSubmittedAt !== '2026-04-16') {
    rejectMetadata('criminal-responsibility proposal submitted-at metadata is invalid');
  }
  if (CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate !== '2026-08-02') {
    rejectMetadata('criminal-responsibility proposal effective-date metadata is invalid');
  }

  criminalResponsibilityCurrentnessValidationDate = dateIsoDay(new Date());
  criminalResponsibilityCurrentnessEffectiveDateRecheckDue =
    isIsoDate(criminalResponsibilityCurrentnessValidationDate) &&
    criminalResponsibilityCurrentnessValidationDate >=
      CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate;
  criminalResponsibilityCurrentnessPostEffectiveDateRecheckedAt =
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.postEffectiveDateRecheck.recheckedAt;
  criminalResponsibilityCurrentnessPostEffectiveDateStatus =
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.postEffectiveDateRecheck.status;
  criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated =
    !criminalResponsibilityCurrentnessEffectiveDateRecheckDue;

  if (
    isIsoDate(CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt) &&
    isIsoDate(criminalResponsibilityCurrentnessValidationDate) &&
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt >
      criminalResponsibilityCurrentnessValidationDate
  ) {
    rejectMetadata('criminal-responsibility currentness retrievedAt must not be in the future');
  }

  if (criminalResponsibilityCurrentnessEffectiveDateRecheckDue) {
    const recheck = CRIMINAL_RESPONSIBILITY_CURRENTNESS.postEffectiveDateRecheck;
    const recheckDateIsValid =
      isIsoDate(recheck.recheckedAt) &&
      recheck.recheckedAt >= CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate;
    const recheckStatusIsValid = hasText(recheck.status);

    if (!recheckDateIsValid || !recheckStatusIsValid) {
      rejectMetadata(
        `${CRIMINAL_RESPONSIBILITY_CURRENTNESS.sourceId} criminal-responsibility proposal outcome must be rechecked on or after ${CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate}`,
      );
    }
    if (
      !isIsoDate(CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt) ||
      CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt <
        CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate
    ) {
      rejectMetadata(
        `${CRIMINAL_RESPONSIBILITY_CURRENTNESS.sourceId} criminal-responsibility source metadata must be retrieved on or after ${CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate} once that date is reached`,
      );
    }

    criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated =
      recheckDateIsValid &&
      recheckStatusIsValid &&
      isIsoDate(CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt) &&
      CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt >=
        CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate;
  }

  CRIMINAL_RESPONSIBILITY_CURRENTNESS.officialSources.forEach((source) => {
    if (!/^https:\/\/www\.(?:riksdagen|regeringen)\.se\//.test(source.url)) {
      rejectMetadata(
        `criminal-responsibility currentness source ${source.label} must be an official HTTPS source`,
      );
    } else {
      criminalResponsibilityCurrentnessOfficialSourcesValidated += 1;
    }
  });

  criminalResponsibilityCurrentnessSourceMetadataValidated =
    sourceMetadataIsValid &&
    criminalResponsibilityCurrentnessOfficialSourcesValidated ===
      CRIMINAL_RESPONSIBILITY_CURRENTNESS.officialSources.length;
  criminalResponsibilityCurrentnessSourceRetrievedAt =
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.retrievedAt;
  criminalResponsibilityCurrentnessProposalEffectiveDate =
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.proposalEffectiveDate;

  if (currentnessIds.length !== expectedCurrentnessRows) {
    rejectMetadata(
      `${CRIMINAL_RESPONSIBILITY_CURRENTNESS.sourceId} criminal-responsibility currentness guard found ${currentnessIds.length} rows, expected ${expectedCurrentnessRows}`,
    );
  }

  currentnessIds.forEach((id) => {
    const question = byId.get(id);
    let rowIsValid = true;

    function reject(message) {
      rowIsValid = false;
      allRowsAreValid = false;
      fail(message);
    }

    if (!question) {
      reject(`${id} criminal-responsibility age currentness row is missing`);
      return;
    }

    const combinedText = [
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
    ].join('\n');

    CRIMINAL_RESPONSIBILITY_CURRENTNESS.stalePatterns.forEach((pattern) => {
      if (pattern.test(combinedText)) {
        reject(`${id} criminal-responsibility age currentness uses stale proposal wording`);
      }
    });

    if (!CRIMINAL_RESPONSIBILITY_CURRENTNESS.requiredQuestionSv.test(question.questionSv)) {
      reject(`${id} criminal-responsibility Swedish stem must say the question tests huvudregeln`);
    }
    if (!CRIMINAL_RESPONSIBILITY_CURRENTNESS.requiredQuestionEn.test(question.questionEn)) {
      reject(
        `${id} criminal-responsibility English stem must say the question tests the main rule`,
      );
    }

    CRIMINAL_RESPONSIBILITY_CURRENTNESS.requiredExplanationSv.forEach((pattern) => {
      if (!pattern.test(question.explanationSv)) {
        reject(`${id} criminal-responsibility Swedish explanation is missing ${pattern}`);
      }
    });
    CRIMINAL_RESPONSIBILITY_CURRENTNESS.requiredExplanationEn.forEach((pattern) => {
      if (!pattern.test(question.explanationEn)) {
        reject(`${id} criminal-responsibility English explanation is missing ${pattern}`);
      }
    });

    if (rowIsValid) criminalResponsibilityCurrentnessQuestionsValidated += 1;
  });

  criminalResponsibilityCurrentnessParityValidated =
    allRowsAreValid &&
    currentnessIds.length === expectedCurrentnessRows &&
    criminalResponsibilityCurrentnessQuestionsValidated === currentnessIds.length;
}

function validateUmeaDemonymSwedishNaturalness() {
  if (!Array.isArray(questions)) return;

  questions.forEach((question, index) => {
    const label = question?.id || `question[${index}]`;
    if (findQuestionUmeaDemonymSwedishNaturalnessIssue(question)) {
      fail(`${label} uses nonstandard Umeå demonym Swedish wording`);
    } else {
      questionUmeaDemonymSwedishNaturalnessValidated += 1;
    }
  });
}

if (focusedValidationRequested('examGeneratorSchema')) {
  validateStaticValidationSyntaxGate();
  validateExamGeneratorTypeSchemaParity();
  exitWithValidationFailures();
  printValidationSummary({
    examGeneratorTypeAliasesValidated,
    examGeneratorTypeInterfacesValidated,
    examGeneratorTypeSchemaParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('removeAdsHookParity')) {
  validateRemoveAdsEntitlementHookParity();
  exitWithValidationFailures();
  printValidationSummary({
    removeAdsEntitlementHookCasesValidated,
    removeAdsEntitlementHookParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('removeAdsPurchaseRuntimeParity')) {
  validatePurchaseTypeSchemaParity();
  validateRemoveAdsPurchaseRuntimeParity();
  exitWithValidationFailures();
  printValidationSummary({
    purchaseTypeUnionsValidated,
    purchaseTypeInterfacesValidated,
    purchaseTypeSchemaParityValidated,
    removeAdsPurchaseRuntimeCasesValidated,
    removeAdsPurchaseRuntimeParityValidated,
  });
  process.exit(0);
}

validateCriminalResponsibilityCurrentness();

if (focusedValidationRequested('umeaDemonym')) {
  validateStaticValidationSyntaxGate();
  validateUmeaDemonymSwedishNaturalness();
  exitWithValidationFailures();
  printValidationSummary({
    questionUmeaDemonymSwedishNaturalnessValidated,
  });
  process.exit(0);
}

function validateStaticSiteQuestionBankParity() {
  if (failures.length > 0) return;

  const siteQuestionBankPath = path.join(repoRoot, 'site/questions.js');
  let expected = '';
  let bank;
  let actual = '';

  try {
    expected = generateStaticSiteQuestionBankJs();
    bank = buildSiteQuestionBank();
  } catch (error) {
    fail(`site/questions.js parity could not be generated: ${error.message}`);
    return;
  }

  try {
    actual = fs.readFileSync(siteQuestionBankPath, 'utf8');
  } catch (error) {
    fail(`site/questions.js could not be read: ${error.message}`);
    return;
  }

  staticSiteQuestionBankQuestionsValidated = bank.questions.length;
  staticSiteQuestionBankChaptersValidated = bank.chapters.length;

  if (actual !== expected) {
    fail(classifyStaticSiteQuestionBankDrift(actual, expected).message);
    return;
  }

  staticSiteQuestionBankParityValidated = true;
}

validateAuthoredSourceParity();

function validateGenerationParity() {
  if (
    !Array.isArray(questions) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions)
  ) {
    return;
  }

  const expectedGeneratedCount = sourceQuestions.length * GENERATED_VARIANTS_PER_SOURCE;
  if (sourceQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(`expected ${EXPECTED_SOURCE_QUESTIONS} source questions, found ${sourceQuestions.length}`);
  }
  if (generatedPublishedQuestions.length !== expectedGeneratedCount) {
    fail(
      `expected ${expectedGeneratedCount} generated published questions, found ${generatedPublishedQuestions.length}`,
    );
  }

  const expectedQuestionIds = [...sourceQuestions, ...generatedPublishedQuestions].map(
    (question) => question.id,
  );
  const actualQuestionIds = questions.map((question) => question.id);
  if (actualQuestionIds.length !== expectedQuestionIds.length) {
    fail(
      `questions export has ${actualQuestionIds.length} rows, expected ${expectedQuestionIds.length} from source + generated questions`,
    );
  }

  actualQuestionIds.forEach((id, index) => {
    const expectedSequentialId = `q${String(index + 1).padStart(3, '0')}`;
    if (id !== expectedSequentialId) {
      fail(`questions export index ${index} has id ${id}, expected ${expectedSequentialId}`);
    }
    if (id !== expectedQuestionIds[index]) {
      fail(`questions export index ${index} is ${id}, expected ${expectedQuestionIds[index]}`);
    }
  });

  if (failures.length === 0) generationParityValidated = true;
}

function countQuestionsByChapter(questionsToCount) {
  return questionsToCount.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
}

function validateChapterMetadataSchemas() {
  if (!Array.isArray(chapters)) return;

  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  const seenChapterIds = new Set();
  const seenNamesSv = new Set();
  const seenNamesEn = new Set();
  chapters.forEach((chapter, index) => {
    if (validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn)) {
      chapterSchemasValidated += 1;
      if (chapterExactSchemaKeyFailures(chapter, chapter.id || `chapter[${index}]`).length === 0) {
        chapterExactSchemaKeysValidated += 1;
      }
      if (chapterTextFieldsAreNormalized(chapter)) {
        chapterTextFieldsNormalizedValidated += 1;
      }
    }
  });
}

if (focusedValidationRequested('chapterLocalizedText')) {
  validateStaticValidationSyntaxGate();
  exitWithValidationFailures();
  validateChapterMetadataSchemas();
  exitWithValidationFailures();
  printValidationSummary({
    chapters: Array.isArray(chapters) ? chapters.length : 0,
    chapterSchemasValidated,
    chapterTextFieldsNormalizedValidated,
    chapterExactSchemaKeysValidated,
    chapterLocalizedTextMapsValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('practiceRouteCopyParity')) {
  validatePracticeRouteCopyParity();
  validateProvenanceAuthorityCopyBoundary();
  exitWithValidationFailures();
  printValidationSummary({
    practiceRouteCopyLabelsValidated,
    practiceRouteCopyParityValidated,
    provenanceAuthorityCopyFilesValidated,
    provenanceAuthorityCopyParityValidated,
  });
  process.exit(0);
}

if (focusedValidationRequested('practiceFlowParity')) {
  validatePracticeFlowParity();
  exitWithValidationFailures();
  printValidationSummary({
    practiceFlowCasesValidated,
    practiceFlowParityValidated,
  });
  process.exit(0);
}

validateAuthoredSourceParity();
validateGenerationParity();

function validateChapterGenerationParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(questions)
  ) {
    return;
  }

  const sourceCounts = countQuestionsByChapter(sourceQuestions);
  const generatedCounts = countQuestionsByChapter(generatedPublishedQuestions);
  const publishedCounts = countQuestionsByChapter(questions);

  chapters.forEach((chapter) => {
    const sourceCount = sourceCounts.get(chapter.id) || 0;
    const generatedCount = generatedCounts.get(chapter.id) || 0;
    const publishedCount = publishedCounts.get(chapter.id) || 0;
    const expectedGeneratedCount = sourceCount * GENERATED_VARIANTS_PER_SOURCE;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (sourceCount < 1) {
      reject(`${chapter.id} has no authored source questions`);
    }
    if (generatedCount !== expectedGeneratedCount) {
      reject(
        `${chapter.id} has ${generatedCount} generated questions, expected ${expectedGeneratedCount} from ${sourceCount} source questions`,
      );
    }
    if (publishedCount !== sourceCount + generatedCount) {
      reject(
        `${chapter.id} has ${publishedCount} published questions, expected ${sourceCount + generatedCount} from source + generated questions`,
      );
    }
    if (chapter.questionCount !== publishedCount) {
      reject(
        `${chapter.id} questionCount is ${chapter.questionCount}, expected ${publishedCount} published questions`,
      );
    }

    if (valid) chapterGenerationParityValidated += 1;
  });
}

validateChapterGenerationParity();

function validateGeneratedSourceMetadataParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );
    if (variants.length !== GENERATED_VARIANTS_PER_SOURCE) {
      fail(
        `${sourceQuestion.id} has ${variants.length} generated variants, expected ${GENERATED_VARIANTS_PER_SOURCE}`,
      );
    }

    variants.forEach((variant, variantIndex) => {
      if (!variant) return;
      let variantIsValid = true;
      const convention = GENERATED_VARIANT_CONVENTIONS[variantIndex];
      const expectedId = `q${String(
        EXPECTED_SOURCE_QUESTIONS + 1 + sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex,
      ).padStart(3, '0')}`;
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;

      function reject(message) {
        variantIsValid = false;
        fail(message);
      }

      if (variant.id !== expectedId)
        reject(`${label} has id ${variant.id}, expected ${expectedId}`);
      if (variant.reviewStatus !== 'published') {
        reject(`${label} reviewStatus is ${variant.reviewStatus}, expected published`);
      }
      if (convention && variant.type !== convention.type) {
        reject(`${label} type is ${variant.type}, expected ${convention.type}`);
      }

      for (const field of ['chapterId', 'difficulty', 'uhrReference']) {
        if (!jsonEqual(variant[field], sourceQuestion[field])) {
          reject(`${label} ${field} does not match source question`);
        }
      }

      if (!Array.isArray(variant.tags)) {
        reject(`${label} tags is not an array`);
      } else {
        const expectedTags = expectedGeneratedTags(sourceQuestion, convention);
        const variantTags = new Set(variant.tags);
        sourceQuestion.tags.forEach((tag) => {
          if (!variantTags.has(tag)) reject(`${label} is missing source tag ${tag}`);
        });
        if (!variantTags.has('published-variant')) {
          reject(`${label} is missing published-variant tag`);
        }
        if (convention && !variantTags.has(convention.tag)) {
          reject(`${label} is missing ${convention.tag} tag`);
        }
        if (!jsonEqual(variant.tags, expectedTags)) {
          reject(`${label} tags do not exactly match generated tag template`);
        } else {
          generatedTagTemplateParityValidated += 1;
        }
      }

      if (variantIsValid) generatedSourceMetadataParityValidated += 1;
    });
  });
}

validateGeneratedSourceMetadataParity();

function validateGeneratedExplanationTemplateParity() {
  if (
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(expectedGeneratedPublishedQuestions)
  ) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected =
        expectedGeneratedPublishedQuestions[
          sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex
        ];

      if (!expected) {
        variantIsValid = false;
        fail(`${label} expected generated variant is missing`);
      } else if (variant.explanationSv !== expected.explanationSv) {
        variantIsValid = false;
        fail(`${label} explanationSv does not match generated explanation template`);
      }
      if (expected && variant.explanationEn !== expected.explanationEn) {
        variantIsValid = false;
        fail(`${label} explanationEn does not match generated explanation template`);
      }

      const trueFalseExplanationMetaIssue = findGeneratedTrueFalseExplanationMetaIssue(variant);
      if (trueFalseExplanationMetaIssue) {
        variantIsValid = false;
        fail(`${label} explanation uses true/false answer-judgement wording`);
      } else if (variant.type === 'true_false') {
        generatedTrueFalseExplanationMetaValidated += 1;
      }

      if (variantIsValid) generatedExplanationTemplateParityValidated += 1;
    });
  });
}

validateGeneratedExplanationTemplateParity();

function validateGeneratedPromptTemplateParity() {
  if (
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(expectedGeneratedPublishedQuestions)
  ) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected =
        expectedGeneratedPublishedQuestions[
          sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex
        ];

      if (!expected) {
        variantIsValid = false;
        fail(`${label} expected generated variant is missing`);
      } else if (variant.questionSv !== expected.questionSv) {
        variantIsValid = false;
        fail(`${label} questionSv does not match generated prompt template`);
      }
      if (expected && variant.questionEn !== expected.questionEn) {
        variantIsValid = false;
        fail(`${label} questionEn does not match generated prompt template`);
      }

      if (variantIsValid) generatedPromptTemplateParityValidated += 1;
    });
  });
}

validateGeneratedPromptTemplateParity();

function validateGeneratedAnswerTemplateParity() {
  if (
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(expectedGeneratedPublishedQuestions)
  ) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected =
        expectedGeneratedPublishedQuestions[
          sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex
        ];

      if (!expected) {
        variantIsValid = false;
        fail(`${label} expected generated variant is missing`);
      } else if (!jsonEqual(variant.options, expected.options)) {
        variantIsValid = false;
        fail(`${label} options do not match generated answer template`);
      }
      if (expected && variant.correctOptionId !== expected.correctOptionId) {
        variantIsValid = false;
        fail(`${label} correctOptionId does not match generated answer template`);
      }

      if (variantIsValid) generatedAnswerTemplateParityValidated += 1;

      const sourceMaterialIssue = findGeneratedOptionSourceMaterialIssue(variant);
      if (sourceMaterialIssue) {
        fail(`${label} option[${sourceMaterialIssue.index}] uses source-material fallback wording`);
      } else {
        generatedOptionSourceMaterialWordingValidated += 1;
      }

      const fillerOptionIssue = findGeneratedSingleChoiceFillerOptionIssue(variant);
      if (fillerOptionIssue) {
        fail(
          `${label} option[${fillerOptionIssue.index}] uses generated single-choice filler option "${fillerOptionIssue.text}"`,
        );
      } else {
        generatedSingleChoiceFillerOptionsValidated += 1;
      }

      const singleChoiceMetaStemIssue = findGeneratedSingleChoiceMetaStemIssue(variant);
      if (singleChoiceMetaStemIssue) {
        fail(`${label} uses generated single-choice meta-stem wording`);
      } else {
        generatedSingleChoiceMetaStemsValidated += 1;
      }

      const singleChoiceExplanationLabelIssue =
        findGeneratedSingleChoiceExplanationLabelIssue(variant);
      if (singleChoiceExplanationLabelIssue) {
        fail(`${label} explanation refers to True/False labels absent from the options`);
      } else {
        generatedSingleChoiceExplanationLabelsValidated += 1;
      }
    });
  });
}

validateGeneratedAnswerTemplateParity();

function buildUhrReferenceChapters() {
  validateUhrSourceMetadata();
  if (!Array.isArray(uhrSectionMap?.chapters)) {
    fail('UHR section map chapters is not an array');
    return new Map();
  }

  if (Array.isArray(chapters) && uhrSectionMap.chapters.length !== chapters.length) {
    fail(
      `UHR section map expected ${chapters.length} chapters, found ${uhrSectionMap.chapters.length}`,
    );
  }

  const seenChapterIds = new Set();
  const seenChapterTitles = new Set();
  let previousStartPage = 0;

  const chapterEntries = uhrSectionMap.chapters.map((chapter, index) => {
    const label = chapter.id || `uhr-section-map chapter[${index}]`;
    const nextChapter = uhrSectionMap.chapters[index + 1];
    const nextStartPage = nextChapter?.startPage;
    let valid = true;
    let pageRangeIsValid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    function rejectPageRange(message) {
      pageRangeIsValid = false;
      reject(message);
    }

    if (!hasText(chapter.id)) reject(`uhr-section-map chapter[${index}] missing id`);
    uhrSectionMapChapterExactSchemaKeyFailures(chapter, label).forEach(reject);
    if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
      reject(`${label} has duplicate chapter id`);
    }
    if (hasText(chapter.id)) {
      if (!textIsTrimmedSingleSpaced(chapter.id)) {
        reject(`${label} id must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

    if (!hasText(chapter.chapter)) reject(`${label} missing chapter title`);
    if (hasText(chapter.chapter) && seenChapterTitles.has(chapter.chapter)) {
      reject(`${label} has duplicate chapter title`);
    }
    if (hasText(chapter.chapter)) {
      if (!textIsTrimmedSingleSpaced(chapter.chapter)) {
        reject(`${label} chapter title must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.chapter)) seenChapterTitles.add(chapter.chapter);

    const chapterMetadata = Array.isArray(chapters) ? chapters[index] : undefined;
    if (chapterMetadata) {
      if (chapter.id !== chapterMetadata.id) {
        reject(`${label} id does not match data chapter id ${chapterMetadata.id}`);
      }
      if (chapter.chapter !== chapterMetadata.nameSv) {
        reject(`${label} title does not match data chapter name "${chapterMetadata.nameSv}"`);
      }
    }

    if (!Number.isInteger(chapter.startPage) || chapter.startPage < 1) {
      rejectPageRange(`${label} has invalid startPage`);
    } else if (chapter.startPage <= previousStartPage) {
      rejectPageRange(`${label} startPage must be greater than previous chapter startPage`);
    }
    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      reject(`${label} missing sections`);
    } else {
      const sections = new Set();
      chapter.sections.forEach((section, sectionIndex) => {
        if (!hasText(section)) {
          reject(`${label} section[${sectionIndex}] is blank`);
        }
        if (hasText(section)) {
          if (!textIsTrimmedSingleSpaced(section)) {
            reject(`${label} section[${sectionIndex}] must be trimmed and single-spaced`);
          } else {
            uhrMapTextFieldsNormalizedValidated += 1;
          }
        }
        if (hasText(section) && sections.has(section)) {
          reject(`${label} has duplicate section "${section}"`);
        }
        if (hasText(section)) sections.add(section);
      });
    }

    if (chapter.endPage !== undefined) {
      if (!Number.isInteger(chapter.endPage) || chapter.endPage < chapter.startPage) {
        rejectPageRange(`${label} has invalid endPage`);
      } else if (Number.isInteger(nextStartPage) && chapter.endPage >= nextStartPage) {
        rejectPageRange(`${label} endPage must be before next chapter startPage`);
      }
    } else if (!nextChapter) {
      rejectPageRange(`${label} final chapter must define endPage`);
    } else if (!Number.isInteger(nextStartPage)) {
      rejectPageRange(`${label} cannot derive endPage from next chapter startPage`);
    } else if (Number.isInteger(chapter.startPage) && nextStartPage <= chapter.startPage) {
      rejectPageRange(`${label} next chapter startPage must be after startPage`);
    }

    if (pageRangeIsValid) uhrMapPageRangesValidated += 1;
    if (Number.isInteger(chapter.startPage)) previousStartPage = chapter.startPage;
    if (valid) {
      uhrMapChaptersValidated += 1;
      if (uhrSectionMapChapterExactSchemaKeyFailures(chapter, label).length === 0) {
        uhrMapChapterExactSchemaKeysValidated += 1;
      }
      uhrMapSectionsValidated += chapter.sections.length;
    }

    return {
      ...chapter,
      endPage:
        chapter.endPage ??
        (Number.isInteger(nextStartPage) ? nextStartPage - 1 : Number.POSITIVE_INFINITY),
      sections: new Set(chapter.sections || []),
    };
  });

  return new Map(chapterEntries.map((chapter) => [chapter.chapter, chapter]));
}

function validateUhrSourceMetadata() {
  const source = uhrSectionMap?.source;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!source || typeof source !== 'object') {
    reject('UHR section map missing source metadata');
  } else {
    uhrSectionMapSourceExactSchemaKeyFailures(source, 'UHR section map source').forEach(reject);
    if (!hasText(source.title) || !source.title.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
      reject(`UHR section map source title must reference ${EXPECTED_UHR_SOURCE.titleKeyword}`);
    }
    if (source.publisher !== EXPECTED_UHR_SOURCE.publisher) {
      reject(`UHR section map source publisher must be ${EXPECTED_UHR_SOURCE.publisher}`);
    }
    if (source.url !== EXPECTED_UHR_SOURCE.url) {
      reject(`UHR section map source URL must be ${EXPECTED_UHR_SOURCE.url}`);
    }
    if (
      !source.url.startsWith(
        'https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/',
      )
    ) {
      reject('UHR section map source URL must be under the UHR education material path');
    }
    if (!isIsoDate(source.retrievedDate)) {
      reject('UHR section map source retrievedDate must use YYYY-MM-DD');
    } else {
      const retrievedDate = new Date(`${source.retrievedDate}T00:00:00Z`);
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (retrievedDate > today) {
        reject('UHR section map source retrievedDate must not be in the future');
      } else {
        uhrSourceRetrievedDateValidated = true;
      }
    }
    for (const field of ['title', 'publisher', 'url', 'retrievedDate']) {
      if (hasText(source[field])) {
        if (!textIsTrimmedSingleSpaced(source[field])) {
          reject(`UHR section map source ${field} must be trimmed and single-spaced`);
        } else {
          uhrMapTextFieldsNormalizedValidated += 1;
        }
      }
    }
  }

  if (valid) {
    uhrSourceMetadataValidated = true;
    if (uhrSectionMapSourceExactSchemaKeyFailures(source, 'UHR section map source').length === 0) {
      uhrMapSourceExactSchemaKeysValidated = true;
    }
  }
}

function validateUhrSectionMapExactSchemaKeys() {
  const failures = uhrSectionMapExactSchemaKeyFailures(uhrSectionMap, 'UHR section map');
  failures.forEach(fail);
  if (failures.length === 0) uhrMapExactSchemaKeysValidated = true;
}

function validateUhrSourceMaterialLinkParity() {
  let valid = true;
  let sourcesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    sourcesRoute = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  } catch (error) {
    reject(`app/sources.tsx could not be read: ${error.message}`);
    return;
  }

  const routeMaterialUrl = extractStringConstantFromTs(sourcesRoute, 'UHR_EDUCATION_MATERIAL_URL');
  if (routeMaterialUrl !== EXPECTED_UHR_EDUCATION_MATERIAL_URL) {
    reject(
      `app/sources.tsx UHR_EDUCATION_MATERIAL_URL must be ${EXPECTED_UHR_EDUCATION_MATERIAL_URL}`,
    );
  }

  if (!isHttpsUrl(routeMaterialUrl)) {
    reject('app/sources.tsx UHR education material URL must be HTTPS');
  }

  const mapSourceUrl = uhrSectionMap?.source?.url;
  if (!isHttpsUrl(mapSourceUrl)) {
    reject('UHR section map source URL must be HTTPS');
  } else {
    const mapSource = new URL(mapSourceUrl);
    const expectedMaterialPath = new URL(EXPECTED_UHR_EDUCATION_MATERIAL_URL).pathname;
    if (mapSource.hostname !== 'www.uhr.se' || !mapSource.pathname.includes(expectedMaterialPath)) {
      reject('UHR section map source URL must be under the UHR education material path');
    }
  }

  if (!sourcesRoute.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
    reject(`app/sources.tsx must mention ${EXPECTED_UHR_SOURCE.titleKeyword}`);
  }
  const forbiddenLearnerFacingSourceCopy = [
    'content/uhr-section-map.json',
    'content/question-bank.csv',
    'spreadsheet-friendly',
    'kalkylbladsvänliga',
  ];
  for (const forbiddenCopy of forbiddenLearnerFacingSourceCopy) {
    if (sourcesRoute.includes(forbiddenCopy)) {
      reject(`app/sources.tsx learner-facing copy must not mention ${forbiddenCopy}`);
    }
  }
  if (!sourcesRoute.includes('Varje övningsfråga visar en källrad med UHR:s kapitel')) {
    reject('app/sources.tsx must explain Swedish learner-visible source lines');
  }
  if (!sourcesRoute.includes('Every practice question shows a source line with the UHR chapter')) {
    reject('app/sources.tsx must explain English learner-visible source lines');
  }
  if (!/<Link[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/.test(sourcesRoute)) {
    reject('app/sources.tsx must render the UHR material URL through an Expo Link');
  }
  if (!sourcesRoute.includes('accessibilityLabel={copy.openEducationMaterialAccessibilityLabel}')) {
    reject('app/sources.tsx UHR material link needs the localized accessibility label');
  }
  if (
    !sourcesRoute.includes(
      "openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial'",
    ) ||
    !sourcesRoute.includes("openEducationMaterialAccessibilityLabel: 'Open UHR education material'")
  ) {
    reject('app/sources.tsx UHR material link needs Swedish and English accessibility labels');
  }

  if (valid) uhrSourceMaterialLinkParityValidated = true;
}

function contentTestFilePaths() {
  return fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .sort()
    .map((fileName) => path.join(repoRoot, 'tests', fileName));
}

function validateContentTestValidateContentExecCwdParity() {
  const unpinnedCalls = [];

  for (const filePath of contentTestFilePaths()) {
    const source = fs.readFileSync(filePath, 'utf8');
    const calls = collectValidateContentExecFileSyncCalls(source);
    const summary = summarizePinnedCwdCalls(calls);
    contentTestValidateContentExecCallsValidated += summary.total;
    contentTestValidateContentExecCwdPinnedValidated += summary.pinned;

    for (const call of calls) {
      if (!call.hasPinnedCwd) {
        unpinnedCalls.push(
          `${path.relative(repoRoot, filePath)}:${sourceLineNumberForIndex(source, call.index)}`,
        );
      }
    }
  }

  contentTestValidateContentExecCwdParityValidated =
    contentTestValidateContentExecCallsValidated > 0 &&
    contentTestValidateContentExecCallsValidated ===
      contentTestValidateContentExecCwdPinnedValidated;

  if (!contentTestValidateContentExecCwdParityValidated) {
    fail(
      `content tests must pin direct validate-content execFileSync cwd: ${unpinnedCalls.join(', ')}`,
    );
  }
}

if (focusedValidationRequested('contentExecCwd')) {
  validateStaticValidationSyntaxGate();
  validateContentTestValidateContentExecCwdParity();
  exitWithValidationFailures();
  printValidationSummary({
    contentTestValidateContentExecCallsValidated,
    contentTestValidateContentExecCwdPinnedValidated,
    contentTestValidateContentExecCwdParityValidated,
  });
  process.exit(0);
}

validateStaticValidationSyntaxGate();
validateContentTestValidateContentExecCwdParity();
exitWithValidationFailures();
validateStaticHeadMetadataParity();
validateUhrSectionMapExactSchemaKeys();
const uhrReferenceChapters = buildUhrReferenceChapters();
validateChapterMetadataSchemas();

if (Array.isArray(questions)) {
  if (questions.length !== EXPECTED_PUBLISHED_QUESTIONS) {
    fail(`expected ${EXPECTED_PUBLISHED_QUESTIONS} questions, found ${questions.length}`);
  }
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);
  const promptTexts = {
    questionSv: new Map(),
    questionEn: new Map(),
  };
  const questionIds = new Set();
  const counts = questions.reduce((acc, question) => {
    acc[question.chapterId] = (acc[question.chapterId] || 0) + 1;
    return acc;
  }, {});

  for (const chapterId of chapterIds) {
    if (!counts[chapterId]) fail(`expected at least 1 question for ${chapterId}`);
  }
  if (Array.isArray(chapters)) {
    chapters.forEach((chapter) => {
      const actualCount = counts[chapter.id] || 0;
      if (chapter.questionCount !== actualCount) {
        fail(
          `${chapter.id} questionCount is ${chapter.questionCount}, expected ${actualCount} from questions`,
        );
      }
    });
  }
  if ((counts.ch01 || 0) < 10)
    fail(`expected at least 10 ch01 questions, found ${counts.ch01 || 0}`);
  if ((counts.ch02 || 0) < 10)
    fail(`expected at least 10 ch02 questions, found ${counts.ch02 || 0}`);

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIdSequenceIsValid = true;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    if (question.id !== expectedId) {
      questionIdSequenceIsValid = false;
      fail(`${label} expected sequential id ${expectedId}`);
    }
    if (questionIds.has(question.id)) {
      questionIdSequenceIsValid = false;
      fail(`duplicate question id ${question.id}`);
    }
    if (hasText(question.id)) questionIds.add(question.id);
    if (questionIdSequenceIsValid) questionIdSequencesValidated += 1;

    if (chapterIds.size && !chapterIds.has(question.chapterId)) {
      fail(`${label} references unknown chapter ${question.chapterId}`);
    }

    let promptTextIsUnique = true;
    for (const field of Object.keys(promptTexts)) {
      const text = normalizeOptionText(question[field]);
      if (!text) {
        promptTextIsUnique = false;
        continue;
      }
      const previousQuestionId = promptTexts[field].get(text);
      if (previousQuestionId) {
        promptTextIsUnique = false;
        fail(`${label} duplicates ${field} text from ${previousQuestionId}`);
      } else {
        promptTexts[field].set(text, label);
      }
    }

    const questionSchemaIsValid = validateQuestionSchema(question, index);
    if (questionSchemaIsValid) {
      questionSchemasValidated += 1;
      if (PUBLISHED_QUESTION_TYPES.has(question.type)) {
        publishedQuestionTypesValidated += 1;
      } else {
        fail(`${label} published question type ${question.type} is not quiz-answerable`);
      }
      if (promptTextIsUnique) {
        questionPromptTextUniquenessValidated += 1;
      }
      if (bilingualTextPairsAreDistinct(question)) {
        questionBilingualTextPairsValidated += 1;
      }
      if (optionBilingualTextPairsAreValid(question)) {
        questionOptionBilingualTextPairsValidated += 1;
      }
      if (questionExactSchemaKeyFailures(question, label).length === 0) {
        questionExactSchemaKeysValidated += 1;
      }
      if (questionTextFieldsAreNormalized(question)) {
        questionTextFieldsNormalizedValidated += 1;
      }
      if (questionSentenceEndingsAreComplete(question)) {
        questionSentenceEndingsValidated += 1;
      }
      const authorityOverclaim = findQuestionAuthorityOverclaim(question);
      const stemSourceAuthorityReference = findQuestionStemSourceAuthorityReference(question);
      const nestedMetaStem = findQuestionNestedMetaStem(question);
      const judgementMetaStem = findQuestionJudgementMetaStem(question);
      const generatedTrueFalseNaturalnessIssue =
        findQuestionGeneratedTrueFalseNaturalnessIssue(question);
      const referendumAdvisorySwedishNaturalnessIssue =
        findQuestionReferendumAdvisorySwedishNaturalnessIssue(question);
      const luciaRoleEnglishNaturalnessIssue =
        findQuestionLuciaRoleEnglishNaturalnessIssue(question);
      const euCooperationEnglishNaturalnessIssue =
        findQuestionEuCooperationEnglishNaturalnessIssue(question);
      const religiousFreedomParallelismIssue =
        findQuestionReligiousFreedomParallelismIssue(question);
      const umeaDemonymSwedishNaturalnessIssue =
        findQuestionUmeaDemonymSwedishNaturalnessIssue(question);
      const goodFridayEnglishNaturalnessIssue =
        findQuestionGoodFridayEnglishNaturalnessIssue(question);
      const workersDayHolidayEnglishNaturalnessIssue =
        findQuestionWorkersDayHolidayEnglishNaturalnessIssue(question);
      const trueFalseStemPrefix = findQuestionTrueFalseStemPrefix(question);
      const falseAnswerExplanationMismatch = findQuestionFalseAnswerExplanationMismatch(question);
      const generatedTrueFalseExplanationMetaIssue =
        findGeneratedTrueFalseExplanationMetaIssue(question);
      if (authorityOverclaim) {
        fail(`${label} appears to overclaim official status or exam certainty`);
      } else if (stemSourceAuthorityReference) {
        fail(`${label} carries source-authority wording in the stem`);
      } else {
        questionAuthorityBoundaryTextValidated += 1;
      }
      if (nestedMetaStem) {
        fail(`${label} contains a generated true/false meta-stem instead of a civic statement`);
      } else {
        questionNestedMetaStemsValidated += 1;
      }
      if (judgementMetaStem) {
        fail(`${label} contains a generated judgement meta-stem instead of a civic-study prompt`);
      } else {
        questionJudgementMetaStemsValidated += 1;
      }
      if (generatedTrueFalseNaturalnessIssue) {
        fail(`${label} contains a generated true/false grammar-splice stem`);
      } else {
        questionGeneratedTrueFalseNaturalnessValidated += 1;
      }
      if (referendumAdvisorySwedishNaturalnessIssue) {
        fail(`${label} uses ambiguous advisory-referendum Swedish wording`);
      } else {
        questionReferendumAdvisorySwedishNaturalnessValidated += 1;
      }
      if (luciaRoleEnglishNaturalnessIssue) {
        fail(`${label} uses stilted Lucia role English wording`);
      } else {
        questionLuciaRoleEnglishNaturalnessValidated += 1;
      }
      if (euCooperationEnglishNaturalnessIssue) {
        fail(`${label} uses missing-article EU cooperation English wording`);
      } else {
        questionEuCooperationEnglishNaturalnessValidated += 1;
      }
      if (religiousFreedomParallelismIssue) {
        fail(`${label} uses nonparallel religious-freedom option wording`);
      } else {
        questionReligiousFreedomParallelismValidated += 1;
      }
      if (umeaDemonymSwedishNaturalnessIssue) {
        fail(`${label} uses nonstandard Umeå demonym Swedish wording`);
      } else {
        questionUmeaDemonymSwedishNaturalnessValidated += 1;
      }
      if (goodFridayEnglishNaturalnessIssue) {
        fail(`${label} uses Good Friday remembers English wording`);
      } else {
        questionGoodFridayEnglishNaturalnessValidated += 1;
      }
      if (workersDayHolidayEnglishNaturalnessIssue) {
        fail(`${label} uses lower-case workers' day holiday English wording`);
      } else {
        questionWorkersDayHolidayEnglishNaturalnessValidated += 1;
      }
      if (trueFalseStemPrefix) {
        fail(`${label} contains a redundant true/false prefix in the stem`);
      }
      if (falseAnswerExplanationMismatch) {
        fail(`${label} contains a false-answer explanation that says True is correct`);
      } else {
        questionFalseAnswerExplanationsValidated += 1;
      }
      if (generatedTrueFalseExplanationMetaIssue) {
        fail(`${label} contains a generated true/false explanation meta-judgement`);
      }
      if (findDuplicateOptionTextLabels(question).length === 0) {
        questionOptionTextLabelsValidated += 1;
      }
      if (optionCountMatchesQuestionType(question)) {
        questionTypeOptionCountsValidated += 1;
      }
      if (optionIdsMatchQuestionType(question)) {
        questionOptionIdConventionsValidated += 1;
      }
      if (question.type === 'true_false') {
        trueFalseQuestions += 1;
        if (trueFalseOptionLabelsMatchConvention(question)) {
          trueFalseOptionLabelsValidated += 1;
        }
      }
      if (question.tags.every(isSlugTag)) {
        questionTagsValidated += 1;
      }
    }

    if (
      !question.uhrReference?.chapter ||
      !question.uhrReference?.section ||
      !question.uhrReference?.pageApprox
    ) {
      fail(`${label} has incomplete UHR reference`);
    } else {
      const uhrChapter = uhrReferenceChapters.get(question.uhrReference.chapter);
      if (!uhrChapter) {
        fail(`${label} UHR chapter "${question.uhrReference.chapter}" is not in section map`);
      } else {
        let referenceIsValid = true;
        if (question.chapterId !== uhrChapter.id) {
          fail(
            `${label} chapterId ${question.chapterId} does not match UHR chapter "${question.uhrReference.chapter}" (${uhrChapter.id})`,
          );
        } else {
          questionChapterReferenceParityValidated += 1;
        }
        if (!uhrChapter.sections.has(question.uhrReference.section)) {
          fail(
            `${label} UHR section "${question.uhrReference.section}" is not listed for "${question.uhrReference.chapter}"`,
          );
          referenceIsValid = false;
        }
        if (
          !Number.isInteger(question.uhrReference.pageApprox) ||
          question.uhrReference.pageApprox < uhrChapter.startPage ||
          question.uhrReference.pageApprox > uhrChapter.endPage
        ) {
          referenceIsValid = false;
          const pageRange =
            uhrChapter.endPage === Number.POSITIVE_INFINITY
              ? `${uhrChapter.startPage}+`
              : `${uhrChapter.startPage}-${uhrChapter.endPage}`;
          fail(
            `${label} UHR page ${question.uhrReference.pageApprox} is outside "${question.uhrReference.chapter}" page range ${pageRange}`,
          );
        }
        if (referenceIsValid) uhrReferencesValidated += 1;
      }
    }
    if (question.reviewStatus !== 'published')
      fail(`${label} reviewStatus is ${question.reviewStatus}`);
  });
}

validateMockExamConfig(
  defaultMockExamConfig,
  Array.isArray(questions)
    ? questions.filter((question) => question.reviewStatus === 'published').length
    : 0,
);
validateValidationScriptSyntax();
validateAppConfigSchema();
validateLaunchAdRouteSuppressionParity();
validateTabNavigationParity();
validateAdPlacementRouteParity();
validateReleaseMonetizationPolicyParity();
validateRemoveAdsEntitlementHookParity();
validatePremiumEntitlementParity();
validateQuestionDisclaimerParity();
validateQuestionReportLinkParity();
validateMockExamConfigTypeSchemaParity();
validateMockExamRuntimeParity(defaultMockExamConfig);
validateMockExamTimerParity(defaultMockExamConfig);
validateExamSubmissionFinalityParity();
validateAboutTheTestRouteCopyParity();
validateAboutTheTestSeenEffectParity();
validateCitizenshipRequirementsLimitedSeatParity();
validateExamRouteHeaderParity();
validateExamRouteCopyParity();
validateNativeMockExamComponentLegalCopy();
validateNativeMockExamLibraryAndTierCopy();
validateQuizRouteHeaderParity();
validateQuizRouteCopyParity();
validatePracticeRouteHeaderParity();
validatePracticeRouteCopyParity();
validateSearchRouteQueryHydrationParity();
validateProvenanceAuthorityCopyBoundary();
validateChapterRouteHeaderParity();
validateChapterRouteCopyParity();
validateLearnRouteHeaderParity();
validateLearnRouteLinkCopyParity();
validateProfileRouteHeaderParity();
validateProfileRouteCopyParity();
validateHomeRouteHeaderParity();
validateHomeRouteSwedishMistakeReviewCopyNaturalness();
validateHomeRouteCopyParity();
validateMistakesRouteHeaderParity();
validateMistakesRouteCopyParity();
validateMistakeReviewHydrationEvidence();
validateLegalRouteHeaderParity();
validateLegalSwedishEnglishTokenGuard();
validateLegalInternalMonetizationKeyGuard();
validateSettingsRouteHeaderParity();
validateSettingsRouteCopyParity();
validateOnboardingRouteHeaderParity();
validateOnboardingRouteCopyParity();
validateFirstRunAboutModalSuppressionParity();
validateScreenShellLayoutParity();
validateSettingsRouteScrollParity();
validateOnboardingRouteScrollParity();
validateLegalRouteScrollParity();
validateButtonAccessibilityParity();
validateCardAccessibilityParity();
validateProgressBarAccessibilityParity();
validateMetricCardAccessibilityParity();
validateBadgeAccessibilityParity();
validateChapterCardAccessibilityParity();
validateFlashcardAccessibilityParity();
validateAudioButtonAccessibilityParity();
validateQuestionCardAccessibilityParity();
validateAnswerOptionAccessibilityParity();
validateExplanationPanelAccessibilityParity();
validateUhrReferenceCardAccessibilityParity();
validateCelebrationBurstAccessibilityParity();
validateExamReviewSourceParity(defaultMockExamConfig);
validateExamChapterBreakdownParity(defaultMockExamConfig);
validateExamGeneratorTypeSchemaParity();
validateContentTypeSchemaParity();
validateMonetizationTypeSchemaParity();
validatePurchaseTypeSchemaParity();
validateRemoveAdsPurchaseRuntimeParity();
validateRemoveAdsSwedishExamCopyParity();
validateAdConsentTypeSchemaParity();
validateMobileAdsConsentTypeSchemaParity();
validateMobileAdsConsentHookParity();
validateRewardedAdTypeSchemaParity();
validateMockExamAccessTypeSchemaParity();
validateThemeTokenSchema();
validateGlossaryTerms();
validateUxBenchmarks();
validateLocalizationLanguageContract();
validateSettingsStoreSchemaParity();
validateSettingsDailyGoalParity();
validateSettingsAudioParity();
validateProgressQuestionSchemaParity();
validateProgressTypeSchemaParity();
validateProgressStoreSchemaParity();
validateBadgeCatalog();
validatePracticeScoringRules();
validatePracticeFlowParity();
validatePracticeSessionStoreParity();
validateAnswerValidationTypeSchemaParity();
validateAnswerFeedbackParity();
validateAnswerShuffleDistributionParity();
validateQuestionSpeechTextParity();
validateSpeechRuntimeParity();
validateChapterQuizSessionParity();
validateSpacedRepetitionSchedule();
validateDashboardPerChapterInputRules();
validateReadinessAdapterRules();
validateStreakRules();
validateXpRules();
validateMasteryRules();
validateWeeklyRecapRuntimeGuards();
validateQuestionBankCsvContract();
validateStaticSiteQuestionBankParity();
validateUhrSourceMaterialLinkParity();

if (failures.length) {
  exitWithValidationFailures();
}

const publishedQuestions = Array.isArray(questions)
  ? questions.filter((question) => question.reviewStatus === 'published').length
  : 0;

console.log('Content validation OK');
console.log(
  JSON.stringify(
    {
      chapters: chapters.length,
      chapterSchemasValidated,
      chapterTextFieldsNormalizedValidated,
      chapterExactSchemaKeysValidated,
      chapterLocalizedTextMapsValidated,
      validationScriptSyntaxChecksValidated,
      appConfigPluginsValidated,
      appConfigSchemaValidated,
      launchAdSuppressedRoutesValidated,
      launchAdRouteSuppressionParityValidated,
      tabNavigationRulesValidated,
      tabNavigationRoutesValidated,
      tabNavigationParityValidated,
      searchRouteQueryHydrationRulesValidated,
      searchRouteQueryHydrationParityValidated,
      adPlacementRoutesValidated,
      noAdRoutesValidated,
      adPlacementRouteParityValidated,
      releaseMonetizationPolicyFieldsValidated,
      releaseMonetizationPolicyParityValidated,
      removeAdsEntitlementHookCasesValidated,
      removeAdsEntitlementHookParityValidated,
      premiumEntitlementStatesValidated,
      premiumEntitlementParityValidated,
      questionDisclaimerRoutesValidated,
      questionDisclaimerCopyValidated,
      questionReportLinkRulesValidated,
      questionReportLinkParityValidated,
      mockExamConfigTypeFieldsValidated,
      mockExamConfigTypeSchemaParityValidated,
      mockExamConfigExactSchemaKeysValidated,
      mockExamConfigValidated,
      mockExamRuntimeParityValidated,
      mockExamChapterBalanceParityValidated,
      mockExamTimerParityValidated,
      examSubmissionFinalityParityValidated,
      aboutTheTestRouteCopyLabelsValidated,
      aboutTheTestRouteCopyParityValidated,
      aboutTheTestOfficialSourceUrlsValidated,
      aboutTheTestOfficialSourceRetrievedDateValidated,
      aboutTheTestSeenEffectRulesValidated,
      aboutTheTestSeenEffectParityValidated,
      aboutTheTestSwedishMockprovCopyGuardValidated,
      citizenshipRequirementsLimitedSeatCopyValidated,
      examRouteHeadersValidated,
      examRouteHeaderParityValidated,
      examRouteCopyLabelsValidated,
      examRouteCopyParityValidated,
      nativeMockExamComponentCopyLabelsValidated,
      nativeMockExamComponentLegalCopyValidated,
      nativeMockExamLibraryLabelsValidated,
      nativeMockExamScoreSourceCopyValidated,
      nativeMockExamSwedishCopyNaturalnessValidated,
      nativeMockExamTierCopyValidated,
      quizRouteHeadersValidated,
      quizRouteHeaderParityValidated,
      quizRouteCopyLabelsValidated,
      quizRouteCopyParityValidated,
      practiceRouteHeadersValidated,
      practiceRouteHeaderParityValidated,
      practiceRouteCopyLabelsValidated,
      practiceRouteCopyParityValidated,
      provenanceAuthorityCopyFilesValidated,
      provenanceAuthorityCopyParityValidated,
      chapterRouteHeadersValidated,
      chapterRouteHeaderParityValidated,
      chapterRouteCopyLabelsValidated,
      chapterRouteCopyParityValidated,
      learnRouteHeadersValidated,
      learnRouteHeaderParityValidated,
      learnRouteLinkCopyLabelsValidated,
      learnRouteLinkCopyParityValidated,
      profileRouteHeadersValidated,
      profileRouteHeaderParityValidated,
      profileRouteCopyLabelsValidated,
      profileRouteCopyParityValidated,
      homeRouteHeadersValidated,
      homeRouteHeaderParityValidated,
      homeRouteCopyLabelsValidated,
      homeRouteCopyParityValidated,
      homeRouteInternalBenchmarkCopyValidated,
      homeRouteSwedishMistakeReviewCopyNaturalnessValidated,
      mistakesRouteHeadersValidated,
      mistakesRouteHeaderParityValidated,
      mistakesRouteCopyLabelsValidated,
      mistakesRouteCopyParityValidated,
      mistakeReviewHydrationFixtureCasesValidated,
      mistakeReviewHydrationTestContentParityValidated,
      mistakeReviewHydrationValidated,
      legalRouteHeadersValidated,
      legalRouteHeaderParityValidated,
      swedishPrivacyStreakCopyNaturalnessValidated,
      legalSwedishEnglishTokenGuardValidated,
      legalSwedishEnglishTokenGuardParityValidated,
      legalInternalMonetizationKeyGuardValidated,
      legalInternalMonetizationKeyGuardParityValidated,
      staticSiteSwedishStudyTermsValidated,
      staticSiteSwedishStudyTermNaturalnessValidated,
      staticSiteSwedishGrammarToneValidated,
      staticSiteSwedishGrammarToneNaturalnessValidated,
      staticEbookSwedishStudyTermsValidated,
      staticEbookSwedishStudyTermNaturalnessValidated,
      staticI18nChinesePunctuationLocalesValidated,
      staticI18nChinesePunctuationValuesValidated,
      staticI18nChinesePunctuationParityValidated,
      staticHeadMetadataTitleValidated,
      staticHeadMetadataDescriptionValidated,
      staticHeadMetadataOutcomeClaimPatternsValidated,
      staticHeadMetadataParityValidated,
      settingsRouteHeadersValidated,
      settingsRouteHeaderParityValidated,
      settingsRouteCopyLabelsValidated,
      settingsRouteCopyParityValidated,
      onboardingRouteHeadersValidated,
      onboardingRouteHeaderParityValidated,
      onboardingRouteCopyLabelsValidated,
      onboardingRouteCopyParityValidated,
      firstRunAboutModalSuppressedRoutesValidated,
      firstRunAboutModalSuppressionParityValidated,
      screenShellLayoutRulesValidated,
      screenShellLayoutParityValidated,
      settingsRouteScrollRulesValidated,
      settingsRouteScrollParityValidated,
      onboardingRouteScrollRulesValidated,
      onboardingRouteScrollParityValidated,
      legalRouteScrollRulesValidated,
      legalRouteScrollParityValidated,
      buttonAccessibilityRulesValidated,
      buttonAccessibilityParityValidated,
      cardAccessibilityRulesValidated,
      cardAccessibilityParityValidated,
      progressBarAccessibilityRulesValidated,
      progressBarAccessibilityParityValidated,
      metricCardAccessibilityRulesValidated,
      metricCardAccessibilityParityValidated,
      badgeAccessibilityRulesValidated,
      badgeAccessibilityParityValidated,
      chapterCardAccessibilityRulesValidated,
      chapterCardAccessibilityParityValidated,
      flashcardAccessibilityRulesValidated,
      flashcardAccessibilityParityValidated,
      audioButtonAccessibilityRulesValidated,
      audioButtonAccessibilityParityValidated,
      questionCardAccessibilityRulesValidated,
      questionCardAccessibilityParityValidated,
      answerOptionAccessibilityRulesValidated,
      answerOptionAccessibilityParityValidated,
      explanationPanelAccessibilityRulesValidated,
      explanationPanelAccessibilityParityValidated,
      uhrReferenceCardAccessibilityRulesValidated,
      uhrReferenceCardAccessibilityParityValidated,
      celebrationBurstAccessibilityRulesValidated,
      celebrationBurstAccessibilityParityValidated,
      examReviewItemsValidated,
      examReviewSourceParityValidated,
      examChapterBreakdownItemsValidated,
      examChapterBreakdownParityValidated,
      examGeneratorTypeAliasesValidated,
      examGeneratorTypeInterfacesValidated,
      examGeneratorTypeSchemaParityValidated,
      contentTypeUnionsValidated,
      contentTypeInterfacesValidated,
      contentTypeSchemaParityValidated,
      monetizationTypeUnionsValidated,
      monetizationTypeInterfacesValidated,
      monetizationTypeSchemaParityValidated,
      purchaseTypeUnionsValidated,
      purchaseTypeInterfacesValidated,
      purchaseTypeSchemaParityValidated,
      removeAdsPurchaseRuntimeCasesValidated,
      removeAdsPurchaseRuntimeParityValidated,
      removeAdsSwedishExamCopyCasesValidated,
      removeAdsSwedishExamCopyParityValidated,
      adConsentTypeUnionsValidated,
      adConsentTypeInterfacesValidated,
      adConsentTypeSchemaParityValidated,
      mobileAdsConsentTypeInterfacesValidated,
      mobileAdsConsentTypeSchemaParityValidated,
      mobileAdsConsentHookCasesValidated,
      mobileAdsConsentHookParityValidated,
      rewardedAdTypeUnionsValidated,
      rewardedAdTypeInterfacesValidated,
      rewardedAdTypeSchemaParityValidated,
      mockExamAccessTypeUnionsValidated,
      mockExamAccessTypeInterfacesValidated,
      mockExamAccessTypeSchemaParityValidated,
      themeColorTokensValidated,
      themeDarkColorTokensValidated,
      themeContrastPairsValidated,
      themeContrastPairsAAValidated,
      themeDarkContrastPairsValidated,
      themeDarkContrastPairsAAValidated,
      themeSpaceTokensValidated,
      themeRadiusTokensValidated,
      themeTypographyTokensValidated,
      themeShadowTokensValidated,
      themeMotionTokensValidated,
      themeTokenSchemaValidated,
      contentTestValidateContentExecCallsValidated,
      contentTestValidateContentExecCwdPinnedValidated,
      contentTestValidateContentExecCwdParityValidated,
      glossaryTerms: Array.isArray(glossaryTerms) ? glossaryTerms.length : 0,
      glossaryTermsValidated,
      glossaryTermExactSchemaKeysValidated,
      uxBenchmarksValidated,
      supportedLanguagesValidated,
      localizationStrings:
        localizationStrings &&
        typeof localizationStrings === 'object' &&
        !Array.isArray(localizationStrings)
          ? Object.keys(localizationStrings).length
          : 0,
      localizationStringsValidated,
      languageSettingsParityValidated,
      settingsStoreFieldsValidated,
      settingsStoreSchemaParityValidated,
      settingsDailyGoalOptionsValidated,
      settingsDailyGoalParityValidated,
      settingsAudioLabelsValidated,
      settingsAudioParityValidated,
      progressQuestionFieldsValidated,
      progressQuestionSchemaParityValidated,
      progressTypeUnionsValidated,
      progressTypeInterfacesValidated,
      progressTypeSchemaParityValidated,
      progressStoreFieldsValidated,
      progressStoreSchemaParityValidated,
      badgesValidated,
      badgeMilestoneParityValidated,
      badgeRuntimeInputCasesValidated,
      badgeRuntimeInputParityValidated,
      citizenshipRulesEffectiveDateValidated,
      civicKnowledgeTestFirstSittingDateValidated,
      civicKnowledgeTestDeadlineDateValidated,
      citizenshipTimelineSourceUrlsValidated,
      citizenshipTimelineDateParityValidated,
      countdownBannerTimelineCopyParityValidated,
      countdownBannerHomeMountRulesValidated,
      countdownBannerHomeMountParityValidated,
      practiceScoringRulesValidated,
      practiceScoringRulesParityValidated,
      practiceFlowCasesValidated,
      practiceFlowParityValidated,
      practiceSessionStoreFieldsValidated,
      practiceSessionStoreSchemaParityValidated,
      practiceSessionStoreRuntimeParityValidated,
      practiceInterstitialQuestionCapValidated,
      answerValidationTypeUnionsValidated,
      answerValidationTypeInterfacesValidated,
      answerValidationTypeSchemaParityValidated,
      answerFeedbackQuestionsValidated,
      answerFeedbackOptionsValidated,
      answerFeedbackRuntimeParityValidated,
      answerShuffleSingleChoiceQuestionsValidated,
      answerShuffleTrueFalseQuestionsValidated,
      answerShuffleSeedDistributionsValidated,
      answerShuffleSessionMovementQuestionsValidated,
      answerShuffleDistributionParityValidated,
      questionSpeechTextQuestionsValidated,
      questionSpeechTextOptionsValidated,
      questionSpeechTextParityValidated,
      speechRuntimeCasesValidated,
      speechRuntimeParityValidated,
      chapterQuizSessionParityValidated,
      spacedRepetitionIntervalsValidated,
      spacedRepetitionRuntimeParityValidated,
      dashboardPerChapterInputRulesValidated,
      dashboardPerChapterInputParityValidated,
      readinessAdapterRulesValidated,
      readinessAdapterRuntimeParityValidated,
      streakRulesValidated,
      streakRulesParityValidated,
      xpRulesValidated,
      xpRulesParityValidated,
      masteryRulesValidated,
      masteryRulesParityValidated,
      weeklyRecapRuntimeCasesValidated,
      weeklyRecapRuntimeParityValidated,
      questions: questions.length,
      publishedQuestions,
      sourceQuestions: Array.isArray(sourceQuestions) ? sourceQuestions.length : 0,
      generatedPublishedQuestions: Array.isArray(generatedPublishedQuestions)
        ? generatedPublishedQuestions.length
        : 0,
      authoredSourceQuestionsValidated,
      authoredSourcePartitionQuestionsValidated,
      sourcePublicationParityValidated,
      generationParityValidated,
      chapterGenerationParityValidated,
      generatedSourceMetadataParityValidated,
      generatedExplanationTemplateParityValidated,
      generatedPromptTemplateParityValidated,
      generatedAnswerTemplateParityValidated,
      generatedOptionSourceMaterialWordingValidated,
      generatedSingleChoiceFillerOptionsValidated,
      generatedSingleChoiceMetaStemsValidated,
      generatedSingleChoiceExplanationLabelsValidated,
      generatedTrueFalseExplanationMetaValidated,
      generatedTagTemplateParityValidated,
      questionSchemasValidated,
      publishedQuestionTypesValidated,
      questionIdSequencesValidated,
      questionBilingualTextPairsValidated,
      questionOptionBilingualTextPairsValidated,
      questionExactSchemaKeysValidated,
      questionTextFieldsNormalizedValidated,
      questionSentenceEndingsValidated,
      questionAuthorityBoundaryTextValidated,
      questionNestedMetaStemsValidated,
      questionJudgementMetaStemsValidated,
      questionGeneratedTrueFalseNaturalnessValidated,
      questionReferendumAdvisorySwedishNaturalnessValidated,
      questionLuciaRoleEnglishNaturalnessValidated,
      questionEuCooperationEnglishNaturalnessValidated,
      questionReligiousFreedomParallelismValidated,
      questionUmeaDemonymSwedishNaturalnessValidated,
      questionGoodFridayEnglishNaturalnessValidated,
      questionWorkersDayHolidayEnglishNaturalnessValidated,
      questionFalseAnswerExplanationsValidated,
      questionPromptTextUniquenessValidated,
      questionOptionTextLabelsValidated,
      questionTypeOptionCountsValidated,
      questionOptionIdConventionsValidated,
      trueFalseQuestions,
      trueFalseOptionLabelsValidated,
      questionTagsValidated,
      questionBankCsvHeaderColumnsValidated,
      questionBankCsvUniqueHeaderNamesValidated,
      questionBankCsvRowsValidated,
      questionBankCsvProvenanceCounts,
      questionBankCsvUhrSourcePublisherRowsValidated,
      questionBankCsvUhrSourcePublisherParityValidated,
      criminalResponsibilityCurrentnessOfficialSourcesValidated,
      criminalResponsibilityCurrentnessSourceMetadataValidated,
      criminalResponsibilityCurrentnessSourceRetrievedAt,
      criminalResponsibilityCurrentnessProposalEffectiveDate,
      criminalResponsibilityCurrentnessValidationDate,
      criminalResponsibilityCurrentnessEffectiveDateRecheckDue,
      criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated,
      criminalResponsibilityCurrentnessPostEffectiveDateRecheckedAt,
      criminalResponsibilityCurrentnessPostEffectiveDateStatus,
      criminalResponsibilityCurrentnessQuestionsValidated,
      criminalResponsibilityCurrentnessParityValidated,
      staticSiteQuestionBankQuestionsValidated,
      staticSiteQuestionBankChaptersValidated,
      staticSiteQuestionBankParityValidated,
      staticEbookOutcomeClaimPatternsValidated,
      staticEbookOutcomeClaimParityValidated,
      staticEbookPracticalTestClaimPatternsValidated,
      staticEbookPracticalTestRequiredCopyValidated,
      staticEbookPracticalTestSourceUrlsValidated,
      staticEbookPracticalTestCurrentnessValidated,
      staticEbookFactboxClaimPatternsValidated,
      staticEbookFactboxRequiredCopyValidated,
      staticEbookFactboxSourceUrlsValidated,
      staticEbookFactboxProvenanceValidated,
      staticI18nSomaliRequiredCopyValidated,
      staticI18nSomaliHighFrequencyLabelsValidated,
      staticI18nSomaliForbiddenFragmentsValidated,
      staticI18nSomaliEnglishFallbacksValidated,
      staticI18nSomaliNaturalnessValidated,
      staticI18nArabicRequiredCopyValidated,
      staticI18nArabicHighFrequencyLabelsValidated,
      staticI18nArabicForbiddenFragmentsValidated,
      staticI18nArabicEnglishFallbacksValidated,
      staticI18nArabicNaturalnessValidated,
      staticV11ReadinessUnsupportedPatternsValidated,
      staticV11ReadinessRequiredCopyValidated,
      staticV11ReadinessCopyParityValidated,
      staticValidationSyntaxFilesValidated,
      staticValidationImportChecksValidated,
      staticValidationSyntaxGateValidated,
      uhrSourceMetadataValidated,
      uhrMapExactSchemaKeysValidated,
      uhrMapChaptersValidated,
      uhrMapSectionsValidated,
      uhrMapSourceExactSchemaKeysValidated,
      uhrMapChapterExactSchemaKeysValidated,
      uhrMapTextFieldsNormalizedValidated,
      uhrMapPageRangesValidated,
      uhrSourceMaterialLinkParityValidated,
      questionChapterReferenceParityValidated,
      uhrSourceRetrievedDateValidated,
      uhrReferencesValidated,
    },
    null,
    2,
  ),
);
