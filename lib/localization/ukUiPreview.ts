/**
 * Phase-2 Ukrainian UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Ukrainian app-UI slice while `uk` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const ukUiPreview = {
  locale: 'uk',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/uk/style-guide.md',
  sourcePhrasebook: 'locales/uk/phrasebook.md',
  settings: {
    title: 'Налаштування',
    subtitle: 'Керуйте мовою запитань, звуком, виглядом і щоденною метою.',
    backToProfile: '← Назад до профілю',
    backToProfileAccessibilityLabel: 'Повернутися до профілю',
    questionLanguageTitle: 'Мова запитань',
    languageAccessibilityLabelTemplate: 'Змінити мову запитань на: {label}',
    languageOptions: {
      sv: 'Шведська',
      en: 'Підтримка англійською',
    },
    audioTitle: 'Звук',
    audioEnabledLabel: 'Звук увімкнено',
    audioDisabledLabel: 'Звук вимкнено',
    enableAudioAccessibilityLabel: 'Увімкнути звук',
    disableAudioAccessibilityLabel: 'Вимкнути звук',
    themeModeTitle: 'Вигляд',
    themeSystemLabel: 'Використовувати налаштування пристрою',
    themeLightLabel: 'Світла тема',
    themeDarkLabel: 'Темна тема',
    themeModeSummaryTemplate: 'Поточний вигляд: {label}',
    setThemeModeAccessibilityLabelTemplate: 'Вибрати вигляд: {label}',
    dailyGoalTitle: 'Щоденна мета',
    dailyGoalSummaryTemplate: '{answerCount} запитань на день',
    dailyGoalPresetLabels: {
      5: 'Спокійно',
      10: 'Регулярно',
      20: 'Інтенсивно',
      40: 'Дуже інтенсивно',
    },
    setDailyGoalAccessibilityLabelTemplate: 'Встановити щоденну мету: {goal} запитань',
    importTitle: 'Імпорт навчальних даних',
    importSectionSubtitle:
      'Вставте JSON, експортований із цього застосунку. Перед записом будь-яких даних ви побачите короткий підсумок.',
    importPurchasesNote:
      'Покупки, квитанції та дані магазину застосунків не імпортуються. Відновлюйте покупки через магазин застосунків.',
    importPasteLabel: 'Вставте експортований JSON',
    importPastePlaceholder: 'Вставте експорт тут',
    importPreview: 'Перевірити імпорт',
    importPreviewAccessibilityLabel: 'Перевірити імпорт навчальних даних на цьому пристрої',
    importReset: 'Очистити поле імпорту',
    confirmImport: 'Підтвердити імпорт',
    confirmImportAccessibilityLabel: 'Підтвердити імпорт навчальних даних на цьому пристрої',
    importSuccess: 'Імпорт завершено.',
    importSummaryTitle: 'Підсумок перед імпортом',
    importSummaryTemplates: {
      completedQuestions: '{count} запитань із збереженим прогресом',
      bookmarks: '{count} запитань, позначених для повторення',
      wrongAnswers: '{count} записів про неправильні відповіді',
      mockExams: '{count} записів пробного іспиту',
      fsrsCards: '{count} карток повторення FSRS',
      fsrsDays: '{count} днів повторення FSRS',
      settings: '{count} налаштувань',
      streakFreeze: 'Дні безперервного навчання та їхній захист включено',
    },
    importErrors: {
      emptyInput: 'Вставте JSON перед перевіркою.',
      invalidJson: 'Цей JSON неможливо прочитати.',
      invalidSchema: 'Структура імпорту недійсна або містить невідомі поля.',
      unsupportedVersion: 'Ця версія імпорту наразі не підтримується.',
      purchaseFieldsRejected:
        'Імпорт містить поля, пов’язані з покупками, квитанціями або магазином застосунків. Видаліть їх і відновіть покупки через магазин застосунків.',
      noSupportedStudyData: 'Імпорт не містить підтримуваних навчальних даних.',
    },
  },
  languagePicker: {
    title: 'Виберіть мову запитань',
    currentLanguageLabelTemplate: 'Поточна мова: {label}',
    availableBadge: 'Доступно',
    unavailableBadge: 'Готується',
    comingSoonTitle: 'Ця мовна версія готується.',
    comingSoonBody:
      'Українські тексти проходять перевірку перед публікацією. Поки що застосунок доступний шведською та англійською.',
    blockedAccessibilityLabelTemplate: '{label}: мовна версія готується',
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'Навчальний план',
      title: 'Вивчайте суспільні знання у Швеції крок за кроком',
      subtitle:
        'Щоденні вправи, пробний іспит, повторення помилок і короткі пояснення на основі матеріалів UHR.',
      startPractice: 'Почати тренування',
      startPracticeAccessibilityLabel: 'Почати рекомендоване тренування',
      browseChapters: 'Переглянути розділи',
      browseChaptersAccessibilityLabel: 'Переглянути всі розділи',
      dailyPracticeTitle: 'Щоденне тренування',
      dailyPracticeTextTemplate: 'Сьогодні ви відповіли на {completed} із {goal} запитань.',
      readinessTitle: 'Показник готовності',
      readinessSparseNote:
        'Це лише навчальна підказка на основі ваших відповідей дотепер. Вона стає кориснішою, коли ви відповідаєте на більше запитань.',
      feedbackTitle: 'Зберігайте те, що потрібно повторити',
      feedbackText:
        'Позначені запитання й неправильні відповіді залишаються в одному місці разом із поясненнями та джерелами.',
    },
    practice: {
      badge: '5-хвилинне тренування',
      questionTitleTemplate: 'Запитання {questionNumber}',
      subtitle: 'Дайте відповідь, перегляньте відгук і прочитайте посилання на матеріал UHR.',
      completedQuestionsTemplate: 'Завершені запитання: {count}',
      emptyTitle: 'Поки що немає тренувальних запитань.',
      nextQuestion: 'Наступне запитання',
      nextQuestionAccessibilityLabel: 'Перейти до наступного тренувального запитання',
      tryAgain: 'Спробувати ще раз',
      tryAgainAccessibilityLabel: 'Спробувати це тренувальне запитання ще раз',
      bookmark: 'Позначити для повторення',
      bookmarked: 'Позначено для повторення',
      bookmarkAccessibilityLabels: {
        add: 'Позначити це запитання для повторення',
        remove: 'Зняти позначку повторення з цього запитання',
      },
      sourceDetailsShow: 'Про джерела',
      sourceDetailsHide: 'Приховати подробиці джерел',
      uhrSourceLabel: 'Джерело UHR',
    },
    feedback: {
      correct: 'Це правильна відповідь.',
      incorrect: 'Цього разу відповідь була неправильною.',
      correctAnswerLabel: 'Правильна відповідь',
      yourAnswerLabel: 'Ваша відповідь',
      explanationTitle: 'Пояснення відповіді',
      sourceCitationLabel: 'Джерельні матеріали',
      encouragement: 'Нічого страшного; пояснення допомагає запам’ятати тему.',
    },
    mockExam: {
      title: 'Пробний іспит',
      subtitle:
        'Тренуйтеся у форматі з обмеженим часом і подивіться, які теми варто повторити. Це не офіційний іспит.',
      setupTitle: 'Підготувати пробний іспит',
      start: 'Почати пробний іспит',
      startAccessibilityLabel: 'Почати пробний іспит для навчання',
      questionProgressTemplate: 'Запитання {current}/{total}',
      timeRemainingTemplate: 'Залишилося часу: {minutes} хвилин',
      submit: 'Завершити й переглянути результат',
      resultTitle: 'Результат пробного іспиту',
      resultSummaryTemplate: 'Правильних відповідей: {correct} із {total}.',
      reviewAnswers: 'Переглянути відповіді та пояснення',
      localPracticeNote:
        'Цей результат допомагає вам навчатися в застосунку і не передбачає офіційний результат.',
    },
    mistakes: {
      title: 'Переглянути неправильні відповіді',
      subtitle:
        'Поверніться до запитань із помилками й прочитайте правильну відповідь, пояснення та джерело.',
      emptyTitle: 'Поки що немає неправильних відповідей',
      emptyBody:
        'Коли тренувальне запитання має неправильну відповідь, воно з’явиться тут для спокійного повторення.',
      savedForReview: 'Збережено для повторення',
      wrongAnswersTemplate: 'Неправильні відповіді: {count}',
      latestWrongAnswer: 'Остання неправильна відповідь',
      reviewQuestion: 'Повторити це запитання',
      clearReviewed: 'Прибрати після опрацювання',
    },
    dashboard: {
      eyebrow: 'Прогрес',
      title: 'Ваш прогрес',
      subtitle: 'Подивіться, що вже виконано і до яких тем корисно повернутися.',
      completedQuestions: 'Завершені запитання',
      correctAnswers: 'Правильні відповіді',
      currentStreak: 'Дні навчання поспіль',
      reviewQueue: 'Запитання для повторення',
      sparseDataNote:
        'Цей підсумок стає кориснішим після більшої кількості відповідей. Не сприймайте його як офіційну оцінку.',
    },
    learning: {
      title: 'Навчальний шлях',
      subtitle:
        'Рухайтеся за темами, читайте короткі пояснення й тренуйтеся із запитаннями, що мають джерела.',
      chapterCardQuestionCountTemplate: '{count} запитань',
      chapterProgressTemplate: 'Виконано {completed}/{total}',
      startChapter: 'Почати розділ',
      reviewChapter: 'Переглянути розділ',
      continueLearning: 'Продовжити навчання',
      lockedReleaseNote:
        'Ця мовна версія готується. Вона не буде відкрита, доки не завершаться всі перевірки.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'Правова інформація та джерела',
      openLabelTemplate: 'Відкрити: {label}',
      links: {
        aboutTheTest: 'Про тест',
        disclaimer: 'Застереження',
        privacy: 'Конфіденційність',
        terms: 'Умови',
        sources: 'Джерела для навчання',
        support: 'Підтримка',
      },
    },
    legalPage: {
      defaultBackLabel: '← Назад до профілю',
      defaultBackAccessibilityLabel: 'Повернутися до профілю',
      externalLinkAccessibilityTemplate: 'Відкрити зовнішню сторінку: {label}',
    },
    privacy: {
      title: 'Політика конфіденційності',
      noAccountRequired: {
        title: 'Обліковий запис не потрібен',
        body: 'Застосунок не просить створювати обліковий запис, вводити електронну пошту, телефон або профільні дані. Навчальні розділи можна використовувати без реєстрації.',
      },
      localProgressStorage: {
        title: 'Ваш навчальний прогрес зберігається на цьому пристрої',
        body: 'Прогрес, налаштування, позначені запитання, неправильні відповіді, XP, дні навчання поспіль і вибір звуку зберігаються на цьому пристрої, щоб застосунок пам’ятав, де ви зупинилися.',
      },
      adsAndPurchases: {
        title: 'Реклама та покупки',
        body: 'Безплатна версія може показувати рекламу на навчальних екранах. На екранах пробного іспиту з таймером реклами немає. Прибирання реклами — це одноразова покупка, яку можна відновити через магазин застосунків.',
      },
      dataBoundary: {
        title: 'Не надсилайте чутливу інформацію',
        body: 'У повідомленнях до підтримки не надсилайте ім’я, ідентифікаційний номер, подробиці міграційної справи або офіційні документи. Застосунку не потрібні ці дані, щоб допомогти вам навчатися.',
      },
    },
    monetization: {
      removeAdsTitle: 'Прибрати рекламу',
      removeAdsActiveTitle: 'Навчання без реклами ввімкнено',
      removeAdsBodyTemplate:
        'На безплатних навчальних екранах може бути реклама. Одноразовий платіж {price} прибирає рекламу з навчальних екранів; у пробному іспиті реклами немає.',
      pricingPitchTemplate:
        'Одноразовий платіж {price} прибирає рекламу. Це не щомісячна підписка.',
      buyLabelTemplate: 'Купити за {price}',
      restoreLabel: 'Відновити попередню покупку',
      statusMessages: {
        idle: 'Якщо ви вже купували раніше, покупку можна відновити тут.',
        pending: 'Очікуємо підтвердження з магазину застосунків.',
        purchased: 'Рекламу вимкнено на цьому пристрої.',
        restored: 'Покупку відновлено, рекламу вимкнено.',
        error: 'Покупка зараз недоступна. Спробуйте пізніше.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'Вітаємо',
      title: 'Спокійно готуйтеся до знань про суспільство у Швеції',
      subtitle:
        'Незалежний навчальний інструмент: щоденні вправи, пробний іспит і повторення неправильних відповідей.',
      chooseLanguage: 'Виберіть мову запитань',
      setGoal: 'Встановіть щоденну мету',
      startLearning: 'Почати навчання',
      privacyNote:
        'Ваш навчальний прогрес зберігається на цьому пристрої. Обліковий запис не потрібен.',
    },
    aboutTheTest: {
      eyebrow: 'Про тест',
      title: 'Що допомагає тренувати цей застосунок',
      body: 'Застосунок допомагає повторювати демократію, права, обов’язки та інституції у Швеції. Він зберігає назви шведських інституцій, як-от шведський парламент (Riksdag), замість замінювати їх установами іншої країни.',
      independenceTitle: 'Це не офіційний іспит',
      independenceBody:
        'Цей застосунок є незалежним навчальним інструментом. Він не представляє UHR, Migrationsverket або інший державний орган і не обіцяє жодного офіційного рішення.',
      sourceBoundary:
        'Навчальні тексти підготовлено на основі матеріалів UHR і відкритої інформації. Завжди перевіряйте найактуальніші дані у відповідному органі.',
    },
    support: {
      title: 'Підтримка та відгуки',
      subtitle:
        'Напишіть нам, якщо текст незрозумілий, джерело потрібно перевірити або щось не працює.',
      feedbackPrompt: 'Опишіть проблему або пропозицію',
      privacyReminder:
        'Не надсилайте особисту інформацію чи документи. Достатньо описати екран, запитання або фрагмент тексту.',
      sendFeedback: 'Надіслати відгук',
    },
    sources: {
      title: 'Джерела для навчання',
      subtitle:
        'Перевірте, на якому матеріалі ґрунтується запитання або пояснення. Позначка джерела не означає офіційного схвалення цього застосунку.',
      uhrLabel: 'Джерельні матеріали UHR',
      publicInfoLabel: 'Відкрита офіційна інформація',
      openSource: 'Відкрити джерело',
    },
    search: {
      title: 'Шукайте поняття й розділи',
      placeholder: 'Введіть тему, інституцію або ключове слово',
      emptyTitle: 'Нічого не знайдено',
      emptyBody: 'Спробуйте коротший пошук, наприклад “Riksdag”, “муніципалітет” або “права”.',
      resultTypeLabels: {
        chapter: 'Розділ',
        question: 'Запитання',
        glossary: 'Поняття',
      },
    },
  },
};
