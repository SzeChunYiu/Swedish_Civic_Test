/**
 * Phase-2 Polish UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Polish app-UI slice while `pl` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const plUiPreview = {
  locale: 'pl',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/pl/style-guide.md',
  sourcePhrasebook: 'locales/pl/phrasebook.md',
  settings: {
    title: 'Ustawienia',
    subtitle: 'Zarządzaj językiem pytań, dźwiękiem, wyglądem i celem dziennym.',
    backToProfile: '← Wróć do profilu',
    backToProfileAccessibilityLabel: 'Wróć do profilu',
    questionLanguageTitle: 'Język pytań',
    languageAccessibilityLabelTemplate: 'Zmień język pytań na: {label}',
    languageOptions: {
      sv: 'Szwedzki',
      en: 'Wsparcie po angielsku',
    },
    audioTitle: 'Dźwięk',
    audioEnabledLabel: 'Dźwięk jest włączony',
    audioDisabledLabel: 'Dźwięk jest wyłączony',
    enableAudioAccessibilityLabel: 'Włącz dźwięk',
    disableAudioAccessibilityLabel: 'Wyłącz dźwięk',
    themeModeTitle: 'Wygląd',
    themeSystemLabel: 'Użyj ustawień urządzenia',
    themeLightLabel: 'Jasny',
    themeDarkLabel: 'Ciemny',
    themeModeSummaryTemplate: 'Obecny wygląd: {label}',
    setThemeModeAccessibilityLabelTemplate: 'Wybierz wygląd: {label}',
    dailyGoalTitle: 'Cel dzienny',
    dailyGoalSummaryTemplate: '{answerCount} pytań dziennie',
    dailyGoalPresetLabels: {
      5: 'Spokojnie',
      10: 'Regularnie',
      20: 'Intensywnie',
      40: 'Bardzo dużo',
    },
    setDailyGoalAccessibilityLabelTemplate: 'Ustaw cel dzienny: {goal} pytań',
    importTitle: 'Importuj dane nauki',
    importSectionSubtitle:
      'Wklej plik JSON wyeksportowany z tej aplikacji. Najpierw zobaczysz podsumowanie, zanim cokolwiek zostanie zapisane.',
    importPurchasesNote:
      'Zakupy, potwierdzenia płatności i dane sklepu aplikacji nie są importowane. Zakupy przywróć w sklepie aplikacji.',
    importPasteLabel: 'Wklej eksport JSON',
    importPastePlaceholder: 'Wklej eksport tutaj',
    importPreview: 'Sprawdź import',
    importPreviewAccessibilityLabel: 'Sprawdź import danych nauki na tym urządzeniu',
    importReset: 'Wyczyść pole importu',
    confirmImport: 'Potwierdź import',
    confirmImportAccessibilityLabel: 'Potwierdź import danych nauki na tym urządzeniu',
    importSuccess: 'Import został zakończony.',
    importSummaryTitle: 'Podsumowanie przed importem',
    importSummaryTemplates: {
      completedQuestions: '{count} pytań z zapisanym postępem',
      bookmarks: '{count} pytań oznaczonych do powtórki',
      wrongAnswers: '{count} wpisów z błędnymi odpowiedziami',
      mockExams: '{count} zapisów egzaminu próbnego',
      fsrsCards: '{count} kart powtórkowych FSRS',
      fsrsDays: '{count} dni powtórek FSRS',
      settings: '{count} ustawień',
      streakFreeze: 'Uwzględniono dni nauki z rzędu i ich ochronę',
    },
    importErrors: {
      emptyInput: 'Wklej JSON, zanim sprawdzisz import.',
      invalidJson: 'Tego pliku JSON nie można odczytać.',
      invalidSchema: 'Import ma nieprawidłową strukturę albo zawiera nieznane pola.',
      unsupportedVersion: 'Ta wersja importu nie jest obecnie obsługiwana.',
      purchaseFieldsRejected:
        'Import zawiera pola dotyczące zakupów, potwierdzeń płatności albo sklepu aplikacji. Usuń je, a zakupy przywróć w sklepie aplikacji.',
      noSupportedStudyData: 'Import nie zawiera obsługiwanych danych nauki.',
    },
  },
  languagePicker: {
    title: 'Wybierz język pytań',
    currentLanguageLabelTemplate: 'Obecny język: {label}',
    availableBadge: 'Dostępny',
    unavailableBadge: 'W przygotowaniu',
    comingSoonTitle: 'Ta wersja językowa jest w przygotowaniu.',
    comingSoonBody:
      'Polskie teksty są sprawdzane przed udostępnieniem. Do tego czasu aplikacja pozostaje dostępna po szwedzku i angielsku.',
    blockedAccessibilityLabelTemplate: '{label}: wersja językowa w przygotowaniu',
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'Plan nauki',
      title: 'Ucz się wiedzy o społeczeństwie w Szwecji krok po kroku',
      subtitle:
        'Ćwiczenia dzienne, egzamin próbny, powtórki błędnych odpowiedzi i krótkie wyjaśnienia oparte na materiałach UHR.',
      startPractice: 'Rozpocznij ćwiczenie',
      startPracticeAccessibilityLabel: 'Rozpocznij zalecane ćwiczenie',
      browseChapters: 'Przejrzyj rozdziały',
      browseChaptersAccessibilityLabel: 'Przejrzyj wszystkie rozdziały',
      dailyPracticeTitle: 'Ćwiczenie dzienne',
      dailyPracticeTextTemplate: 'Dzisiaj odpowiedziano na {completed} z {goal} pytań.',
      readinessTitle: 'Sygnał gotowości',
      readinessSparseNote:
        'To tylko pomoc do nauki oparta na dotychczasowych odpowiedziach. Odpowiedz na więcej pytań, aby sygnał był bardziej użyteczny.',
      feedbackTitle: 'Zachowaj to, co warto powtórzyć',
      feedbackText:
        'Oznaczone pytania i błędne odpowiedzi są w jednym miejscu, razem z wyjaśnieniami i źródłami.',
    },
    practice: {
      badge: 'Ćwiczenie na 5 minut',
      questionTitleTemplate: 'Pytanie {questionNumber}',
      subtitle: 'Odpowiedz, sprawdź informację zwrotną i przeczytaj odniesienie do materiałów UHR.',
      completedQuestionsTemplate: 'Ukończone pytania: {count}',
      emptyTitle: 'Nie ma jeszcze pytań do ćwiczenia.',
      nextQuestion: 'Następne pytanie',
      nextQuestionAccessibilityLabel: 'Przejdź do następnego pytania ćwiczeniowego',
      tryAgain: 'Spróbuj ponownie',
      tryAgainAccessibilityLabel: 'Spróbuj ponownie odpowiedzieć na to pytanie',
      bookmark: 'Oznacz do powtórki',
      bookmarked: 'Oznaczone do powtórki',
      bookmarkAccessibilityLabels: {
        add: 'Oznacz to pytanie do powtórki',
        remove: 'Usuń oznaczenie tego pytania',
      },
      sourceDetailsShow: 'O źródłach',
      sourceDetailsHide: 'Ukryj szczegóły źródeł',
      uhrSourceLabel: 'Źródło UHR',
    },
    feedback: {
      correct: 'To prawidłowa odpowiedź.',
      incorrect: 'Tym razem odpowiedź nie była poprawna.',
      correctAnswerLabel: 'Prawidłowa odpowiedź',
      yourAnswerLabel: 'Twoja odpowiedź',
      explanationTitle: 'Wyjaśnienie odpowiedzi',
      sourceCitationLabel: 'Materiały źródłowe',
      encouragement: 'Nic się nie stało; wyjaśnienie pomoże zapamiętać tę zasadę.',
    },
    mockExam: {
      title: 'Egzamin próbny',
      subtitle:
        'Ćwicz w trybie z limitem czasu i sprawdź, które tematy warto powtórzyć. To nie jest oficjalny egzamin.',
      setupTitle: 'Przygotuj egzamin próbny',
      start: 'Rozpocznij egzamin próbny',
      startAccessibilityLabel: 'Rozpocznij egzamin próbny do nauki',
      questionProgressTemplate: 'Pytanie {current} z {total}',
      timeRemainingTemplate: 'Pozostały czas: {minutes} min',
      submit: 'Zakończ i zobacz wynik',
      resultTitle: 'Wynik egzaminu próbnego',
      resultSummaryTemplate: '{correct} prawidłowych odpowiedzi z {total} pytań',
      reviewAnswers: 'Przejrzyj odpowiedzi i wyjaśnienia',
      localPracticeNote:
        'Ten wynik pomaga w nauce w tej aplikacji i nie przewiduje wyniku oficjalnego.',
    },
    mistakes: {
      title: 'Przejrzyj błędne odpowiedzi',
      subtitle:
        'Wróć do pytań, na które odpowiedź nie była poprawna, i przeczytaj prawidłową odpowiedź, wyjaśnienie oraz źródło.',
      emptyTitle: 'Nie ma jeszcze błędnych odpowiedzi',
      emptyBody: 'Gdy pojawi się błędna odpowiedź, znajdziesz ją tutaj do spokojnej powtórki.',
      savedForReview: 'Zapisano do powtórki',
      wrongAnswersTemplate: 'Błędne odpowiedzi: {count}',
      latestWrongAnswer: 'Ostatnia błędna odpowiedź',
      reviewQuestion: 'Powtórz to pytanie',
      clearReviewed: 'Usuń po zrozumieniu',
    },
    dashboard: {
      eyebrow: 'Postęp',
      title: 'Twój postęp',
      subtitle: 'Sprawdź, co zostało ukończone i do których tematów warto wrócić.',
      completedQuestions: 'Ukończone pytania',
      correctAnswers: 'Prawidłowe odpowiedzi',
      currentStreak: 'Dni nauki z rzędu',
      reviewQueue: 'Pytania do powtórki',
      sparseDataNote:
        'Ten przegląd staje się bardziej użyteczny po większej liczbie odpowiedzi. Nie traktuj go jako oficjalnej oceny.',
    },
    learning: {
      title: 'Ścieżka nauki',
      subtitle:
        'Ucz się według tematów, czytaj krótkie wyjaśnienia i ćwicz pytania z odniesieniami do źródeł.',
      chapterCardQuestionCountTemplate: '{count} pytań',
      chapterProgressTemplate: 'Ukończono {completed} z {total}',
      startChapter: 'Rozpocznij rozdział',
      reviewChapter: 'Przejrzyj rozdział',
      continueLearning: 'Kontynuuj naukę',
      lockedReleaseNote:
        'Ta wersja językowa jest w przygotowaniu. Nie zostanie udostępniona przed zakończeniem wszystkich sprawdzeń.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'Informacje prawne i źródła',
      openLabelTemplate: 'Otwórz: {label}',
      links: {
        aboutTheTest: 'O teście',
        disclaimer: 'Zastrzeżenia',
        privacy: 'Prywatność',
        terms: 'Warunki',
        sources: 'Źródła do nauki',
        support: 'Pomoc',
      },
    },
    legalPage: {
      defaultBackLabel: '← Wróć do profilu',
      defaultBackAccessibilityLabel: 'Wróć do profilu',
      externalLinkAccessibilityTemplate: 'Otwórz stronę zewnętrzną: {label}',
    },
    privacy: {
      title: 'Polityka prywatności',
      noAccountRequired: {
        title: 'Konto nie jest wymagane',
        body: 'Aplikacja nie wymaga konta, adresu e-mail, telefonu ani profilu. Z części edukacyjnych możesz korzystać bez rejestracji.',
      },
      localProgressStorage: {
        title: 'Postępy w nauce są zapisywane na tym urządzeniu',
        body: 'Postęp, ustawienia, oznaczone pytania, błędne odpowiedzi, XP, dni nauki z rzędu i wybór dźwięku są zapisywane na tym urządzeniu, aby aplikacja pamiętała miejsce nauki.',
      },
      adsAndPurchases: {
        title: 'Reklamy i zakupy',
        body: 'Wersja bezpłatna może pokazywać reklamy na ekranach nauki. Ekrany egzaminu próbnego z limitem czasu nie zawierają reklam. Usunięcie reklam to jednorazowy zakup, który można przywrócić w sklepie aplikacji.',
      },
      dataBoundary: {
        title: 'Nie przesyłaj danych wrażliwych',
        body: 'W wiadomościach do pomocy nie podawaj imienia i nazwiska, numeru identyfikacyjnego, danych spraw migracyjnych ani dokumentów urzędowych. Aplikacja nie potrzebuje takich danych, aby wspierać naukę.',
      },
    },
    monetization: {
      removeAdsTitle: 'Usuń reklamy',
      removeAdsActiveTitle: 'Nauka bez reklam jest włączona',
      removeAdsBodyTemplate:
        'Bezpłatne ekrany nauki mogą zawierać reklamy. Jednorazowa płatność {price} usuwa reklamy z ekranów nauki; egzamin próbny reklam nie zawiera.',
      pricingPitchTemplate: 'Jednorazowa płatność {price} usuwa reklamy. To nie jest subskrypcja.',
      buyLabelTemplate: 'Kup za {price}',
      restoreLabel: 'Przywróć wcześniejszy zakup',
      statusMessages: {
        idle: 'Jeśli zakup był już dokonany, możesz go przywrócić.',
        pending: 'Czekamy na potwierdzenie ze sklepu aplikacji.',
        purchased: 'Reklamy zostały wyłączone na tym urządzeniu.',
        restored: 'Zakup został przywrócony, a reklamy wyłączone.',
        error: 'Zakup nie jest teraz dostępny. Spróbuj ponownie później.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'Witamy',
      title: 'Przygotuj się spokojnie do wiedzy o społeczeństwie w Szwecji',
      subtitle:
        'Niezależne narzędzie do nauki: ćwiczenia dzienne, egzamin próbny i powtórka błędnych odpowiedzi.',
      chooseLanguage: 'Wybierz język pytań',
      setGoal: 'Ustaw cel dzienny',
      startLearning: 'Rozpocznij naukę',
      privacyNote: 'Postępy w nauce są zapisywane na tym urządzeniu. Aplikacja nie wymaga konta.',
    },
    aboutTheTest: {
      eyebrow: 'O teście',
      title: 'Co ćwiczy ta aplikacja',
      body: 'Aplikacja pomaga powtarzać wiedzę o demokracji, prawach, obowiązkach i instytucjach w Szwecji. Zachowuje nazwy szwedzkich instytucji, na przykład szwedzki parlament (Riksdag), zamiast zastępować je polskimi odpowiednikami.',
      independenceTitle: 'To nie jest oficjalny egzamin',
      independenceBody:
        'Ta aplikacja jest niezależnym narzędziem do nauki. Nie reprezentuje UHR, Migrationsverket ani innego urzędu i nie obiecuje decyzji urzędowej.',
      sourceBoundary:
        'Treści edukacyjne są przygotowane na podstawie materiałów UHR oraz publicznych informacji. Zawsze sprawdzaj aktualne informacje w odpowiednim urzędzie.',
    },
    support: {
      title: 'Pomoc i opinie',
      subtitle: 'Napisz, jeśli tekst jest niejasny, źródło wymaga sprawdzenia albo coś nie działa.',
      feedbackPrompt: 'Opisz problem lub sugestię',
      privacyReminder:
        'Nie wysyłaj danych osobowych ani dokumentów. Wystarczy opisać ekran, pytanie lub fragment tekstu.',
      sendFeedback: 'Wyślij opinię',
    },
    sources: {
      title: 'Źródła do nauki',
      subtitle:
        'Sprawdzaj, z jakiego materiału pochodzi pytanie lub wyjaśnienie. Etykieta źródła nie oznacza oficjalnego zatwierdzenia tej aplikacji.',
      uhrLabel: 'Materiały UHR',
      publicInfoLabel: 'Publiczne informacje urzędowe',
      openSource: 'Otwórz źródło',
    },
    search: {
      title: 'Szukaj pojęć i rozdziałów',
      placeholder: 'Wpisz temat, instytucję albo słowo kluczowe',
      emptyTitle: 'Brak wyników',
      emptyBody: 'Spróbuj krótszego hasła, na przykład „Riksdag”, „gmina” albo „prawa”.',
      resultTypeLabels: {
        chapter: 'Rozdział',
        question: 'Pytanie',
        glossary: 'Pojęcie',
      },
    },
  },
};
