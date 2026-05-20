/**
 * Phase-2 Persian/Farsi UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Persian app-UI slice while `fa` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const faUiPreview = {
  locale: 'fa',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/fa/style-guide.md',
  sourcePhrasebook: 'locales/fa/phrasebook.md',
  settings: {
    title: 'تنظیمات',
    subtitle: 'زبان سؤال‌ها، صدا، ظاهر و هدف روزانه را مدیریت کنید.',
    backToProfile: '← بازگشت به نمایه',
    backToProfileAccessibilityLabel: 'بازگشت به نمایه',
    questionLanguageTitle: 'زبان سؤال‌ها',
    languageAccessibilityLabelTemplate: 'زبان سؤال‌ها را تغییر دهید: {label}',
    languageOptions: {
      sv: 'سوئدی',
      en: 'پشتیبانی انگلیسی',
    },
    audioTitle: 'صدا',
    audioEnabledLabel: 'صدا روشن است',
    audioDisabledLabel: 'صدا خاموش است',
    enableAudioAccessibilityLabel: 'صدا را روشن کنید',
    disableAudioAccessibilityLabel: 'صدا را خاموش کنید',
    themeModeTitle: 'ظاهر',
    themeSystemLabel: 'از تنظیم دستگاه پیروی کنید',
    themeLightLabel: 'روشن',
    themeDarkLabel: 'تیره',
    themeModeSummaryTemplate: 'ظاهر فعلی: {label}',
    setThemeModeAccessibilityLabelTemplate: 'ظاهر را انتخاب کنید: {label}',
    dailyGoalTitle: 'هدف روزانه',
    dailyGoalSummaryTemplate: '{answerCount} سؤال در روز',
    dailyGoalPresetLabels: {
      5: 'آرام',
      10: 'منظم',
      20: 'پرفشار',
      40: 'زیاد',
    },
    setDailyGoalAccessibilityLabelTemplate: 'هدف روزانه را تعیین کنید: {goal} سؤال',
    importTitle: 'وارد کردن داده‌های آموزشی',
    importSectionSubtitle:
      'JSON صادرشده از این برنامه را بچسبانید. پیش از نوشتن هر داده، یک خلاصه برای بررسی نشان داده می‌شود.',
    importPurchasesNote:
      'خریدها، رسیدها و داده‌های فروشگاه برنامه وارد نمی‌شوند. خریدها را از فروشگاه برنامه بازیابی کنید.',
    importPasteLabel: 'JSON صادرشده را بچسبانید',
    importPastePlaceholder: 'داده صادرشده را اینجا بچسبانید',
    importPreview: 'وارد کردن را بررسی کنید',
    importPreviewAccessibilityLabel: 'وارد کردن داده‌های آموزشی روی این دستگاه را بررسی کنید',
    importReset: 'پاک کردن بخش وارد کردن',
    confirmImport: 'وارد کردن را تأیید کنید',
    confirmImportAccessibilityLabel: 'وارد کردن داده‌های آموزشی روی این دستگاه را تأیید کنید',
    importSuccess: 'وارد کردن کامل شد.',
    importSummaryTitle: 'خلاصه پیش از وارد کردن',
    importSummaryTemplates: {
      completedQuestions: '{count} سؤال با پیشرفت ذخیره‌شده',
      bookmarks: '{count} سؤال نشانه‌گذاری‌شده برای مرور',
      wrongAnswers: '{count} مورد پاسخ نادرست',
      mockExams: '{count} رکورد آزمون آزمایشی',
      fsrsCards: '{count} کارت مرور FSRS',
      fsrsDays: '{count} روز مرور FSRS',
      settings: '{count} تنظیم',
      streakFreeze: 'روزهای پیاپی مطالعه و محافظت‌های آن‌ها هم شامل شده‌اند',
    },
    importErrors: {
      emptyInput: 'پیش از بررسی، JSON را بچسبانید.',
      invalidJson: 'این JSON خوانده نمی‌شود.',
      invalidSchema: 'ساختار داده واردشده درست نیست یا فیلد ناشناخته دارد.',
      unsupportedVersion: 'این نسخه وارد کردن فعلاً پشتیبانی نمی‌شود.',
      purchaseFieldsRejected:
        'داده واردشده شامل فیلدهای خرید، رسید یا فروشگاه برنامه است. آن‌ها را حذف کنید و خریدها را از فروشگاه برنامه بازیابی کنید.',
      noSupportedStudyData: 'داده واردشده شامل داده آموزشی پشتیبانی‌شده نیست.',
    },
  },
  languagePicker: {
    title: 'زبان سؤال‌ها را انتخاب کنید',
    currentLanguageLabelTemplate: 'زبان فعلی: {label}',
    availableBadge: 'در دسترس',
    unavailableBadge: 'در حال آماده‌سازی',
    comingSoonTitle: 'این نسخه در حال آماده‌سازی است.',
    comingSoonBody:
      'متن فارسی پیش از انتشار بررسی می‌شود. تا آن زمان، برنامه به زبان سوئدی و انگلیسی در دسترس است.',
    blockedAccessibilityLabelTemplate: '{label}: نسخه زبانی در حال آماده‌سازی است',
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'برنامه مطالعه',
      title: 'آشنایی با جامعه در سوئد را قدم‌به‌قدم یاد بگیرید',
      subtitle:
        'تمرین روزانه، آزمون آزمایشی، مرور اشتباهات و توضیح‌های کوتاه که بر اساس مطالب مرجع UHR تهیه شده است.',
      startPractice: 'تمرین را شروع کنید',
      startPracticeAccessibilityLabel: 'تمرین پیشنهادی را شروع کنید',
      browseChapters: 'بخش‌ها را ببینید',
      browseChaptersAccessibilityLabel: 'همه بخش‌ها را ببینید',
      dailyPracticeTitle: 'تمرین روزانه',
      dailyPracticeTextTemplate: 'امروز به {completed} سؤال از {goal} سؤال پاسخ داده‌اید.',
      readinessTitle: 'نشانه آمادگی',
      readinessSparseNote:
        'این فقط یک کمک آموزشی بر اساس پاسخ‌های فعلی شماست. با پاسخ‌های بیشتر، مفیدتر می‌شود.',
      feedbackTitle: 'آنچه را نیاز به مرور دارد نگه دارید',
      feedbackText:
        'سؤال‌های نشانه‌گذاری‌شده و پاسخ‌های نادرست همراه با توضیح و منبع در یک جا می‌مانند.',
    },
    practice: {
      badge: 'تمرین ۵ دقیقه‌ای',
      questionTitleTemplate: 'سؤال {questionNumber}',
      subtitle: 'پاسخ دهید، بازخورد را ببینید و سپس ارجاع به مطالب مرجع UHR را بخوانید.',
      completedQuestionsTemplate: 'سؤال‌های کامل‌شده: {count}',
      emptyTitle: 'هنوز سؤال تمرینی وجود ندارد.',
      nextQuestion: 'سؤال بعدی',
      nextQuestionAccessibilityLabel: 'به سؤال تمرینی بعدی بروید',
      tryAgain: 'دوباره تلاش کنید',
      tryAgainAccessibilityLabel: 'دوباره به این سؤال تمرینی پاسخ دهید',
      bookmark: 'برای مرور نشانه‌گذاری کنید',
      bookmarked: 'برای مرور نشانه‌گذاری شد',
      bookmarkAccessibilityLabels: {
        add: 'این سؤال را برای مرور نشانه‌گذاری کنید',
        remove: 'نشانه مرور این سؤال را بردارید',
      },
      sourceDetailsShow: 'درباره منابع',
      sourceDetailsHide: 'جزئیات منابع را پنهان کنید',
      uhrSourceLabel: 'منبع UHR',
    },
    feedback: {
      correct: 'درست است.',
      incorrect: 'این بار پاسخ درست نبود.',
      correctAnswerLabel: 'پاسخ درست',
      yourAnswerLabel: 'پاسخ شما',
      explanationTitle: 'توضیح پاسخ',
      sourceCitationLabel: 'مطالب مرجع',
      encouragement: 'اشکالی ندارد؛ توضیح به شما کمک می‌کند نکته را به خاطر بسپارید.',
    },
    mockExam: {
      title: 'آزمون آزمایشی',
      subtitle:
        'با محدودیت زمانی تمرین کنید و ببینید کدام موضوع‌ها هنوز به مرور نیاز دارند. آزمون رسمی نیست.',
      setupTitle: 'آزمون آزمایشی را آماده کنید',
      start: 'آزمون آزمایشی را شروع کنید',
      startAccessibilityLabel: 'آزمون آزمایشی آموزشی را شروع کنید',
      questionProgressTemplate: 'سؤال {current} از {total}',
      timeRemainingTemplate: 'زمان باقی‌مانده: {minutes} دقیقه',
      submit: 'تمام کنید و نتیجه را ببینید',
      resultTitle: 'نتیجه آزمون آزمایشی',
      resultSummaryTemplate: '{correct} پاسخ درست از {total} سؤال',
      reviewAnswers: 'پاسخ‌ها و توضیح‌ها را مرور کنید',
      localPracticeNote:
        'این نتیجه فقط به یادگیری شما در این برنامه کمک می‌کند و نتیجه رسمی را پیش‌بینی نمی‌کند.',
    },
    mistakes: {
      title: 'مرور اشتباهات',
      subtitle: 'به سؤال‌هایی برگردید که پاسخ درست نداشتند و پاسخ درست، توضیح و منبع را بخوانید.',
      emptyTitle: 'هنوز پاسخ نادرستی وجود ندارد',
      emptyBody: 'وقتی پاسخ تمرینی درست نباشد، اینجا برای مرور آرام نشان داده می‌شود.',
      savedForReview: 'برای مرور ذخیره شد',
      wrongAnswersTemplate: 'پاسخ‌های نادرست: {count}',
      latestWrongAnswer: 'آخرین پاسخ نادرست',
      reviewQuestion: 'این سؤال را مرور کنید',
      clearReviewed: 'پس از فهمیدن حذف کنید',
    },
    dashboard: {
      eyebrow: 'پیشرفت',
      title: 'پیشرفت شما',
      subtitle: 'ببینید چه چیزهایی کامل شده‌اند و کدام موضوع‌ها ارزش مرور دوباره دارند.',
      completedQuestions: 'سؤال‌های کامل‌شده',
      correctAnswers: 'پاسخ‌های درست',
      currentStreak: 'روزهای پیاپی مطالعه',
      reviewQueue: 'سؤال‌های نیازمند مرور',
      sparseDataNote:
        'این خلاصه با پاسخ‌های بیشتر مفیدتر می‌شود. آن را ارزیابی رسمی در نظر نگیرید.',
    },
    learning: {
      title: 'مسیر یادگیری',
      subtitle:
        'بر اساس موضوع پیش بروید، توضیح‌های کوتاه را بخوانید و با سؤال‌های دارای منبع تمرین کنید.',
      chapterCardQuestionCountTemplate: '{count} سؤال',
      chapterProgressTemplate: '{completed} از {total} کامل شده است',
      startChapter: 'این بخش را شروع کنید',
      reviewChapter: 'این بخش را مرور کنید',
      continueLearning: 'یادگیری را ادامه دهید',
      lockedReleaseNote:
        'این نسخه زبانی در حال آماده‌سازی است و پیش از پایان همه بررسی‌ها فعال نمی‌شود.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'اطلاعات حقوقی و منابع',
      openLabelTemplate: 'باز کنید: {label}',
      links: {
        aboutTheTest: 'درباره آزمون',
        disclaimer: 'توضیح حقوقی',
        privacy: 'حریم خصوصی',
        terms: 'شرایط',
        sources: 'منابع یادگیری',
        support: 'پشتیبانی',
      },
    },
    legalPage: {
      defaultBackLabel: '← بازگشت به نمایه',
      defaultBackAccessibilityLabel: 'بازگشت به نمایه',
      externalLinkAccessibilityTemplate: 'صفحه بیرونی را باز کنید: {label}',
    },
    privacy: {
      title: 'سیاست حریم خصوصی',
      noAccountRequired: {
        title: 'حساب کاربری لازم نیست',
        body: 'این برنامه حساب، ایمیل، تلفن یا نمایه نمی‌خواهد. می‌توانید بخش‌های آموزشی را بدون ثبت‌نام استفاده کنید.',
      },
      localProgressStorage: {
        title: 'پیشرفت آموزشی فقط روی این دستگاه ذخیره می‌شود',
        body: 'پیشرفت، تنظیمات، سؤال‌های نشانه‌گذاری‌شده، پاسخ‌های نادرست، XP، روزهای پیاپی مطالعه و انتخاب صدا روی این دستگاه ذخیره می‌شوند تا برنامه جای شما را به خاطر بسپارد.',
      },
      adsAndPurchases: {
        title: 'تبلیغات و خریدها',
        body: 'نسخه رایگان ممکن است در صفحه‌های مطالعه تبلیغ نشان دهد. صفحه‌های آزمون آزمایشی زمان‌دار تبلیغ ندارند. حذف تبلیغات یک خرید یک‌باره است که از فروشگاه برنامه قابل بازیابی است.',
      },
      dataBoundary: {
        title: 'اطلاعات حساس نفرستید',
        body: 'در پیام‌های پشتیبانی نام، شماره هویتی، جزئیات پرونده مهاجرتی یا سند دولتی نفرستید. برنامه برای کمک به یادگیری شما به این اطلاعات نیاز ندارد.',
      },
    },
    monetization: {
      removeAdsTitle: 'حذف تبلیغات',
      removeAdsActiveTitle: 'مطالعه بدون تبلیغ فعال است',
      removeAdsBodyTemplate:
        'صفحه‌های رایگان مطالعه ممکن است تبلیغ داشته باشند. پرداخت یک‌باره {price} تبلیغات صفحه‌های مطالعه را حذف می‌کند؛ آزمون آزمایشی تبلیغ ندارد.',
      pricingPitchTemplate: 'با پرداخت یک‌باره {price} تبلیغات حذف می‌شود. این اشتراک ماهانه نیست.',
      buyLabelTemplate: 'خرید با {price}',
      restoreLabel: 'بازیابی خرید قبلی',
      statusMessages: {
        idle: 'اگر قبلاً خرید کرده‌اید، می‌توانید آن را بازیابی کنید.',
        pending: 'در انتظار تأیید فروشگاه برنامه هستیم.',
        purchased: 'تبلیغات روی این دستگاه خاموش شد.',
        restored: 'خرید بازیابی شد و تبلیغات خاموش شد.',
        error: 'خرید در حال حاضر در دسترس نیست. بعداً دوباره تلاش کنید.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'خوش آمدید',
      title: 'برای آشنایی با جامعه سوئد آرام و مرحله‌به‌مرحله آماده شوید',
      subtitle: 'یک ابزار آموزشی مستقل: تمرین روزانه، آزمون آزمایشی و مرور پاسخ‌های نادرست.',
      chooseLanguage: 'زبان سؤال‌ها را انتخاب کنید',
      setGoal: 'هدف روزانه را تعیین کنید',
      startLearning: 'یادگیری را شروع کنید',
      privacyNote: 'پیشرفت آموزشی فقط روی این دستگاه ذخیره می‌شود. حساب کاربری لازم نیست.',
    },
    aboutTheTest: {
      eyebrow: 'درباره آزمون',
      title: 'این برنامه برای تمرین چه چیزهایی کمک می‌کند',
      body: 'این برنامه به مرور دموکراسی، حق و حقوق، وظایف و نهادهای سوئد کمک می‌کند. نام نهادهای سوئدی، مانند پارلمان سوئد (ریسکداگ)، حفظ می‌شود و با نهادهای کشور دیگر جایگزین نمی‌شود.',
      independenceTitle: 'آزمون رسمی نیست',
      independenceBody:
        'این برنامه یک ابزار آموزشی مستقل است. نماینده UHR، اداره مهاجرت سوئد یا اداره دولتی دیگری نیست و درباره تصمیم اداری وعده نمی‌دهد.',
      sourceBoundary:
        'مطالب آموزشی بر اساس مطالب مرجع UHR تهیه شده است و با اطلاعات عمومی پشتیبانی می‌شود. اطلاعات تازه را همیشه از اداره مربوط بررسی کنید.',
    },
    support: {
      title: 'پشتیبانی و بازخورد',
      subtitle:
        'اگر متن روشن نیست، منبعی نیاز به بررسی دارد یا چیزی کار نمی‌کند، به ما اطلاع دهید.',
      feedbackPrompt: 'مشکل یا پیشنهاد را توضیح دهید',
      privacyReminder: 'اطلاعات شخصی یا سند نفرستید. توضیح صفحه، سؤال یا بخش متن کافی است.',
      sendFeedback: 'ارسال بازخورد',
    },
    sources: {
      title: 'منابع یادگیری',
      subtitle:
        'بررسی کنید هر سؤال یا توضیح بر چه مطلبی تکیه دارد. برچسب منبع به معنی تأیید این برنامه از سوی آن مرجع نیست.',
      uhrLabel: 'مطالب مرجع UHR',
      publicInfoLabel: 'اطلاعات عمومی ادارات',
      openSource: 'باز کردن منبع',
    },
    search: {
      title: 'جست‌وجوی مفهوم‌ها و بخش‌ها',
      placeholder: 'موضوع، نهاد یا واژه کلیدی را بنویسید',
      emptyTitle: 'نتیجه‌ای پیدا نشد',
      emptyBody: 'یک عبارت کوتاه‌تر امتحان کنید، مانند «Riksdag»، «کمون» یا «حقوق».',
      resultTypeLabels: {
        chapter: 'بخش',
        question: 'سؤال',
        glossary: 'مفهوم',
      },
    },
  },
};
