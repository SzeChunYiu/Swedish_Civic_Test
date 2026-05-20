/**
 * Phase-2 Sorani Kurdish UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Sorani app-UI slice while `ckb` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const ckbUiPreview = {
  locale: 'ckb',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/ckb/style-guide.md',
  sourcePhrasebook: 'locales/ckb/phrasebook.md',
  settings: {
    title: 'ڕێکخستنەکان',
    subtitle: 'زمانی پرسیارەکان، دەنگ، دەرکەوتن و ئامانجی ڕۆژانە ڕێکبخە.',
    backToProfile: '← گەڕانەوە بۆ پڕۆفایل',
    backToProfileAccessibilityLabel: 'گەڕانەوە بۆ پڕۆفایل',
    questionLanguageTitle: 'زمانی پرسیارەکان',
    languageAccessibilityLabelTemplate: 'زمانی پرسیارەکان بگۆڕە بۆ: {label}',
    languageOptions: {
      sv: 'سوێدی',
      en: 'پشتیوانی بە ئینگلیزی',
    },
    audioTitle: 'دەنگ',
    audioEnabledLabel: 'دەنگ چالاکە',
    audioDisabledLabel: 'دەنگ ناچالاکە',
    enableAudioAccessibilityLabel: 'دەنگ چالاک بکە',
    disableAudioAccessibilityLabel: 'دەنگ ناچالاک بکە',
    themeModeTitle: 'دەرکەوتن',
    themeSystemLabel: 'ڕێکخستنی ئامێر بەکاربهێنە',
    themeLightLabel: 'دەرکەوتنی ڕووناک',
    themeDarkLabel: 'دەرکەوتنی تاریک',
    themeModeSummaryTemplate: 'دەرکەوتنی ئێستا: {label}',
    setThemeModeAccessibilityLabelTemplate: 'دەرکەوتن هەڵبژێرە: {label}',
    dailyGoalTitle: 'ئامانجی ڕۆژانە',
    dailyGoalSummaryTemplate: '{answerCount} پرسیار لە ڕۆژێکدا',
    dailyGoalPresetLabels: {
      5: 'ئارام',
      10: 'ڕێکوپێک',
      20: 'چڕ',
      40: 'زۆر چڕ',
    },
    setDailyGoalAccessibilityLabelTemplate: 'ئامانجی ڕۆژانە دیاری بکە: {goal} پرسیار',
    importTitle: 'هێنانی داتای خوێندن',
    importSectionSubtitle:
      'ئەو JSON ـە دابنێ کە لەم ئەپەوە هەناردە کراوە. پێش ئەوەی هیچ داتایەک بنووسرێت، پوختەیەک دەبینیت.',
    importPurchasesNote:
      'کڕین، پسووڵە و داتای فرۆشگای ئەپ ناخرێنە ناوەوە. کڕینەکان لە فرۆشگای ئەپەکەوە بگەڕێنەوە.',
    importPasteLabel: 'JSON ـی هەناردەکراو دابنێ',
    importPastePlaceholder: 'هەناردەکە لێرە دابنێ',
    importPreview: 'هێنانەکە بپشکنە',
    importPreviewAccessibilityLabel: 'هێنانی داتای خوێندن لەسەر ئەم ئامێرە بپشکنە',
    importReset: 'خانەی هێنان پاک بکەوە',
    confirmImport: 'هێنانەکە پشتڕاست بکەوە',
    confirmImportAccessibilityLabel: 'هێنانی داتای خوێندن لەسەر ئەم ئامێرە پشتڕاست بکەوە',
    importSuccess: 'هێنان تەواو بوو.',
    importSummaryTitle: 'پوختە پێش هێنان',
    importSummaryTemplates: {
      completedQuestions: '{count} پرسیار کە پێشکەوتنیان پاشەکەوت کراوە',
      bookmarks: '{count} پرسیار بۆ پێداچوونەوە نیشان کراون',
      wrongAnswers: '{count} تۆماری وەڵامی نادروست',
      mockExams: '{count} تۆماری تاقیکردنەوەی ئەزموونی',
      fsrsCards: '{count} کارتی پێداچوونەوەی FSRS',
      fsrsDays: '{count} ڕۆژی پێداچوونەوەی FSRS',
      settings: '{count} ڕێکخستن',
      streakFreeze: 'ڕۆژانی خوێندنی بەردەوام و پاراستنیان لەگەڵدایە',
    },
    importErrors: {
      emptyInput: 'پێش پشکنین JSON دابنێ.',
      invalidJson: 'ئەم JSON ـە ناخوێندرێتەوە.',
      invalidSchema: 'پێکهاتەی هێنانەکە دروست نییە یان خانەی نەناسراوی تێدایە.',
      unsupportedVersion: 'ئەم وەشانی هێنانە لە ئێستادا پشتگیری ناکرێت.',
      purchaseFieldsRejected:
        'هێنانەکە خانەی پەیوەست بە کڕین، پسووڵە یان فرۆشگای ئەپ تێدایە. ئەوانە بسڕەوە و کڕینەکان لە فرۆشگای ئەپەکەوە بگەڕێنەوە.',
      noSupportedStudyData: 'هێنانەکە داتای خوێندنی پشتگیریکراوی تێدا نییە.',
    },
  },
  languagePicker: {
    title: 'زمانی پرسیارەکان هەڵبژێرە',
    currentLanguageLabelTemplate: 'زمانی ئێستا: {label}',
    availableBadge: 'بەردەستە',
    unavailableBadge: 'ئامادە دەکرێت',
    comingSoonTitle: 'ئەم وەشانی زمانە ئامادە دەکرێت.',
    comingSoonBody:
      'دەقەکانی کوردیی ناوەندی پێش بڵاوکردنەوە پێداچوونەوەیان بۆ دەکرێت. تا ئەو کاتە، ئەپەکە بە سوێدی و ئینگلیزی بەردەستە.',
    blockedAccessibilityLabelTemplate: '{label}: وەشانی زمانەکە ئامادە دەکرێت',
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'پلانی خوێندن',
      title: 'زانیاری کۆمەڵگای لە سوێد هەنگاو بە هەنگاو فێربە',
      subtitle:
        'ڕاهێنانی ڕۆژانە، تاقیکردنەوەی ئەزموونی، پێداچوونەوەی وەڵامە نادروستەکان و ڕوونکردنەوەی کورت بە پشتبەستن بە ماددەکانی UHR.',
      startPractice: 'دەست بە ڕاهێنان بکە',
      startPracticeAccessibilityLabel: 'دەست بە ڕاهێنانی پێشنیارکراو بکە',
      browseChapters: 'بەشەکان ببینە',
      browseChaptersAccessibilityLabel: 'هەموو بەشەکان ببینە',
      dailyPracticeTitle: 'ڕاهێنانی ڕۆژانە',
      dailyPracticeTextTemplate: 'ئەمڕۆ وەڵامی {completed} لە {goal} پرسیارت داوەتەوە.',
      readinessTitle: 'نیشاندەری ئامادەیی',
      readinessSparseNote:
        'ئەمە تەنها یارمەتییەکی خوێندنە بە پشتبەستن بە وەڵامەکانی تۆ تا ئێستا. کاتێک پرسیاری زیاتر وەڵام دەدەیتەوە، سوودمەندتر دەبێت.',
      feedbackTitle: 'ئەو شتانە بپارێزە کە پێویستیان بە پێداچوونەوەیە',
      feedbackText:
        'پرسیارە نیشانکراوەکان و وەڵامە نادروستەکان لە شوێنێکدا لەگەڵ ڕوونکردنەوە و سەرچاوەکان دەمانن.',
    },
    practice: {
      badge: 'ڕاهێنانی ٥ خولەکی',
      questionTitleTemplate: 'پرسیاری {questionNumber}',
      subtitle: 'وەڵام بدەوە، تێبینییەکان ببینە و ئاماژەی ماددەکانی UHR بخوێنەوە.',
      completedQuestionsTemplate: 'پرسیارە تەواوکراوەکان: {count}',
      emptyTitle: 'هێشتا پرسیاری ڕاهێنان نییە.',
      nextQuestion: 'پرسیاری دواتر',
      nextQuestionAccessibilityLabel: 'بڕۆ بۆ پرسیاری ڕاهێنانی دواتر',
      tryAgain: 'دووبارە هەوڵبدە',
      tryAgainAccessibilityLabel: 'دووبارە هەوڵبدە وەڵامی ئەم پرسیاری ڕاهێنانە بدەیتەوە',
      bookmark: 'بۆ پێداچوونەوە نیشانی بکە',
      bookmarked: 'بۆ پێداچوونەوە نیشان کرا',
      bookmarkAccessibilityLabels: {
        add: 'ئەم پرسیارە بۆ پێداچوونەوە نیشان بکە',
        remove: 'نیشانی پێداچوونەوە لەم پرسیارە لاببە',
      },
      sourceDetailsShow: 'دەربارەی سەرچاوەکان',
      sourceDetailsHide: 'وردەکاری سەرچاوەکان بشارەوە',
      uhrSourceLabel: 'سەرچاوەی UHR',
    },
    feedback: {
      correct: 'ئەمە وەڵامی ڕاستە.',
      incorrect: 'ئەم جارە وەڵامەکە ڕاست نەبوو.',
      correctAnswerLabel: 'وەڵامی ڕاست',
      yourAnswerLabel: 'وەڵامی تۆ',
      explanationTitle: 'ڕوونکردنەوەی وەڵام',
      sourceCitationLabel: 'سەرچاوەکانی خوێندن',
      encouragement: 'کێشە نییە؛ ڕوونکردنەوەکە یارمەتیت دەدات بابەتەکە لەبیر بکەیت.',
    },
    mockExam: {
      title: 'تاقیکردنەوەی ئەزموونی',
      subtitle:
        'بە شێوازێکی کاتدار ڕاهێنان بکە و ببینە کام بابەت پێویستی بە پێداچوونەوەی زیاتر هەیە. ئەمە تاقیکردنەوەی فەرمی نییە.',
      setupTitle: 'تاقیکردنەوەی ئەزموونی ئامادە بکە',
      start: 'دەست بە تاقیکردنەوەی ئەزموونی بکە',
      startAccessibilityLabel: 'دەست بە تاقیکردنەوەی ئەزموونی بۆ خوێندن بکە',
      questionProgressTemplate: 'پرسیاری {current}/{total}',
      timeRemainingTemplate: 'کاتی ماوە: {minutes} خولەک',
      submit: 'تەواوی بکە و ئەنجام ببینە',
      resultTitle: 'ئەنجامی تاقیکردنەوەی ئەزموونی',
      resultSummaryTemplate: 'وەڵامی ڕاست: {correct} لە {total}.',
      reviewAnswers: 'پێداچوونەوە بە وەڵام و ڕوونکردنەوەکان',
      localPracticeNote:
        'ئەم ئەنجامە یارمەتیت دەدات لەم ئەپەدا بخوێنیت و ئەنجامی فەرمی پێشبینی ناکات.',
    },
    mistakes: {
      title: 'پێداچوونەوە بە وەڵامە هەڵەکان',
      subtitle:
        'بگەڕێوە بۆ ئەو پرسیارانەی وەڵامەکانیان ڕاست نەبوو و وەڵامی ڕاست، ڕوونکردنەوە و سەرچاوە بخوێنەوە.',
      emptyTitle: 'هێشتا وەڵامی نادروست نییە',
      emptyBody:
        'کاتێک وەڵامی پرسیاری ڕاهێنانێک ڕاست نەبێت، لێرە بۆ پێداچوونەوەی ئارام دەردەکەوێت.',
      savedForReview: 'بۆ پێداچوونەوە پاشەکەوت کرا',
      wrongAnswersTemplate: 'وەڵامە نادروستەکان: {count}',
      latestWrongAnswer: 'دوایین وەڵامی نادروست',
      reviewQuestion: 'ئەم پرسیارە دووبارە بکەوە',
      clearReviewed: 'دوای تێگەیشتن لایببە',
    },
    dashboard: {
      eyebrow: 'پێشکەوتن',
      title: 'پێشکەوتنت',
      subtitle: 'ببینە چی تەواو کردووە و کام بابەت باشە بۆی بگەڕێیتەوە.',
      completedQuestions: 'پرسیارە تەواوکراوەکان',
      correctAnswers: 'وەڵامە ڕاستەکان',
      currentStreak: 'ڕۆژانی خوێندنی بەردەوام',
      reviewQueue: 'پرسیارەکانی پێداچوونەوە',
      sparseDataNote:
        'ئەم پوختەیە دوای وەڵامی زیاتر سوودمەندتر دەبێت. وەک هەڵسەنگاندنی فەرمی سەیری مەکە.',
    },
    learning: {
      title: 'ڕێگای فێربوون',
      subtitle:
        'بەپێی بابەتەکان پێش بکەوە، ڕوونکردنەوەی کورت بخوێنەوە و بە پرسیاری سەرچاوەدار ڕاهێنان بکە.',
      chapterCardQuestionCountTemplate: '{count} پرسیار',
      chapterProgressTemplate: '{completed}/{total} تەواو بوو',
      startChapter: 'دەست بە بەشەکە بکە',
      reviewChapter: 'پێداچوونەوە بە بەشەکە بکە',
      continueLearning: 'فێربوون بەردەوام بکە',
      lockedReleaseNote:
        'ئەم وەشانی زمانە ئامادە دەکرێت. تا هەموو پشکنینەکان تەواو نەبن ناکرێتەوە.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'زانیاری یاسایی و سەرچاوەکان',
      openLabelTemplate: 'بیکەرەوە: {label}',
      links: {
        aboutTheTest: 'دەربارەی تاقیکردنەوەکە',
        disclaimer: 'ئاگادارکردنەوە',
        privacy: 'تایبەتمەندی',
        terms: 'مەرجەکان',
        sources: 'سەرچاوەکانی فێربوون',
        support: 'پشتیوانی',
      },
    },
    legalPage: {
      defaultBackLabel: '← گەڕانەوە بۆ پڕۆفایل',
      defaultBackAccessibilityLabel: 'گەڕانەوە بۆ پڕۆفایل',
      externalLinkAccessibilityTemplate: 'پەڕەی دەرەکی بکەرەوە: {label}',
    },
    privacy: {
      title: 'سیاسەتی تایبەتمەندی',
      noAccountRequired: {
        title: 'هەژمار پێویست نییە',
        body: 'ئەم ئەپە داوای هەژمار، ئیمەیل، تەلەفۆن یان زانیاری پڕۆفایل ناکات. دەتوانیت بەشەکانی خوێندن بەبێ تۆمارکردن بەکاربهێنیت.',
      },
      localProgressStorage: {
        title: 'پێشکەوتنی خوێندنت لەسەر ئەم ئامێرە پاشەکەوت دەکرێت',
        body: 'پێشکەوتن، ڕێکخستن، پرسیارە نیشانکراوەکان، وەڵامە نادروستەکان، XP، ڕۆژانی خوێندنی بەردەوام و هەڵبژاردنی دەنگ لەسەر ئەم ئامێرە پاشەکەوت دەکرێن بۆ ئەوەی ئەپەکە بزانێت لە کوێ وەستایت.',
      },
      adsAndPurchases: {
        title: 'ڕیکلام و کڕین',
        body: 'وەشانی خۆڕایی لە شاشەکانی خوێندن ڕیکلام پیشان دەدات. لە شاشەکانی تاقیکردنەوەی ئەزموونی کاتداردا ڕیکلام نییە. لابردنی ڕیکلام کڕینێکی جارێکە و دەتوانرێت لە فرۆشگای ئەپەکەوە بگەڕێنرێتەوە.',
      },
      dataBoundary: {
        title: 'زانیاری هەستیار مەنووسە',
        body: 'لە نامەکانی پشتیوانیدا ناوت، ژمارەی ناسنامە، وردەکاری پەڕاوی کۆچ یان بەڵگەنامەی فەرمی مەنووسە. ئەپەکە بۆ یارمەتیدان لە خوێندن پێویستی بە ئەم زانیارییانە نییە.',
      },
    },
    monetization: {
      removeAdsTitle: 'ڕیکلامەکان لاببە',
      removeAdsActiveTitle: 'خوێندن بەبێ ڕیکلام چالاکە',
      removeAdsBodyTemplate:
        'شاشە خۆڕاییەکانی خوێندن ڕەنگە ڕیکلامیان تێدا بێت. پارەدانێکی جارێکی {price} ڕیکلامەکان لە شاشەکانی خوێندن لادەبات؛ لە تاقیکردنەوەی ئەزموونی ڕیکلام نییە.',
      pricingPitchTemplate:
        'پارەدانێکی جارێکی {price} ڕیکلامەکان لادەبات. ئەمە بەشداربوونی مانگانە نییە.',
      buyLabelTemplate: 'بیکڕە بە {price}',
      restoreLabel: 'کڕینی پێشوو بگەڕێنەوە',
      statusMessages: {
        idle: 'ئەگەر پێشتر کڕیوتە، دەتوانیت لێرە بیگەڕێنیتەوە.',
        pending: 'چاوەڕێی پشتڕاستکردنەوەی فرۆشگای ئەپین.',
        purchased: 'ڕیکلامەکان لەسەر ئەم ئامێرە ناچالاک کران.',
        restored: 'کڕینەکە گەڕێنرایەوە و ڕیکلامەکان ناچالاک کران.',
        error: 'کڕین لە ئێستادا بەردەست نییە. دواتر دووبارە هەوڵبدە.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'بەخێربێیت',
      title: 'بە ئارامی بۆ زانیاری کۆمەڵگای لە سوێد ئامادە ببە',
      subtitle:
        'ئامرازێکی سەربەخۆی خوێندن: ڕاهێنانی ڕۆژانە، تاقیکردنەوەی ئەزموونی و پێداچوونەوە بە وەڵامە نادروستەکان.',
      chooseLanguage: 'زمانی پرسیارەکان هەڵبژێرە',
      setGoal: 'ئامانجی ڕۆژانە دیاری بکە',
      startLearning: 'دەست بە فێربوون بکە',
      privacyNote: 'پێشکەوتنی خوێندنت لەسەر ئەم ئامێرە پاشەکەوت دەکرێت. هەژمار پێویست نییە.',
    },
    aboutTheTest: {
      eyebrow: 'دەربارەی تاقیکردنەوەکە',
      title: 'ئەم ئەپە یارمەتیت دەدات چی ڕاهێنان بکەیت',
      body: 'ئەپەکە یارمەتیت دەدات دیموکراسی، مافەکان، ئەرکەکان و دامەزراوەکان لە سوێد دووبارە بخوێنیتەوە. ناوی دامەزراوە سوێدییەکان، وەک پەرلەمانی سوێد (Riksdag)، بە هەمان شێوە دەپارێزێت.',
      independenceTitle: 'ئەمە تاقیکردنەوەی فەرمی نییە',
      independenceBody:
        'ئەم ئەپە ئامرازێکی سەربەخۆی خوێندنە. نوێنەرایەتی UHR، Migrationsverket یان هیچ دەسەڵاتێکی حکومی تر ناکات و بەڵێنی بڕیارێکی فەرمی نادات.',
      sourceBoundary:
        'دەقەکانی خوێندن بە پشتبەستن بە ماددەکانی UHR و زانیاری گشتی ئامادە کراون. هەمیشە تازەترین زانیاری لە لایەنی پەیوەندیدار بپشکنە.',
    },
    support: {
      title: 'پشتیوانی و بۆچوون',
      subtitle:
        'ئەگەر دەقێک ڕوون نییە، سەرچاوەیەک پێویستی بە پشکنین هەیە، یان شتێک کار ناکات، بۆمان بنووسە.',
      feedbackPrompt: 'کێشەکە یان پێشنیارەکە باس بکە',
      privacyReminder:
        'زانیاری کەسی یان بەڵگەنامە مەنووسە. باسکردنی شاشە، پرسیار یان پارچەی دەق بەسە.',
      sendFeedback: 'بۆچوون بنێرە',
    },
    sources: {
      title: 'سەرچاوەکانی فێربوون',
      subtitle:
        'بپشکنە پرسیارێک یان ڕوونکردنەوەیەک پشت بە کام ماددە دەبەستێت. نیشانی سەرچاوە واتای پەسەندکردنی فەرمی ئەم ئەپە نییە.',
      uhrLabel: 'ماددەکانی UHR',
      publicInfoLabel: 'زانیاری فەرمی گشتی',
      openSource: 'سەرچاوە بکەرەوە',
    },
    search: {
      title: 'بگەڕێ بۆ چەمک و بەشەکان',
      placeholder: 'بابەت، دامەزراوە یان وشەی سەرەکی بنووسە',
      emptyTitle: 'هیچ ئەنجامێک نەدۆزرایەوە',
      emptyBody: 'گەڕانێکی کورتتر تاقی بکەرەوە، وەک “Riksdag”، “شارەوانی” یان “مافەکان”.',
      resultTypeLabels: {
        chapter: 'بەش',
        question: 'پرسیار',
        glossary: 'چەمک',
      },
    },
  },
};
