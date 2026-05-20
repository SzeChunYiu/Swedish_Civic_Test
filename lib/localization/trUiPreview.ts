/**
 * Phase-2 Turkish UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Turkish app-UI slice while `tr` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const trUiPreview = {
  locale: 'tr',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/tr/style-guide.md',
  sourcePhrasebook: 'locales/tr/phrasebook.md',
  settings: {
    title: 'Ayarlar',
    subtitle: 'Soru dili, ses, görünüm ve günlük hedef ayarlarını yönetin.',
    backToProfile: '← Profile dönün',
    backToProfileAccessibilityLabel: 'Profile dönün',
    questionLanguageTitle: 'Soru dili',
    languageAccessibilityLabelTemplate: 'Soru dilini değiştirin: {label}',
    languageOptions: {
      sv: 'İsveççe',
      en: 'İngilizce destek',
    },
    audioTitle: 'Ses',
    audioEnabledLabel: 'Ses açık',
    audioDisabledLabel: 'Ses kapalı',
    enableAudioAccessibilityLabel: 'Sesi açın',
    disableAudioAccessibilityLabel: 'Sesi kapatın',
    themeModeTitle: 'Görünüm',
    themeSystemLabel: 'Cihaz ayarını kullanın',
    themeLightLabel: 'Açık tema',
    themeDarkLabel: 'Koyu tema',
    themeModeSummaryTemplate: 'Geçerli görünüm: {label}',
    setThemeModeAccessibilityLabelTemplate: 'Görünümü seçin: {label}',
    dailyGoalTitle: 'Günlük hedef',
    dailyGoalSummaryTemplate: 'Günde {answerCount} soru',
    dailyGoalPresetLabels: {
      5: 'Sakin',
      10: 'Düzenli',
      20: 'Yoğun',
      40: 'Çok yoğun',
    },
    setDailyGoalAccessibilityLabelTemplate: 'Günlük hedefi belirleyin: {goal} soru',
    importTitle: 'Çalışma verilerini içe aktarın',
    importSectionSubtitle:
      'Bu uygulamadan dışa aktarılan JSON verisini yapıştırın. Herhangi bir veri yazılmadan önce kısa bir özet görürsünüz.',
    importPurchasesNote:
      'Satın alma, makbuz ve uygulama mağazası verileri içe aktarılmaz. Satın almaları uygulama mağazasından geri yükleyin.',
    importPasteLabel: 'JSON dışa aktarımını yapıştırın',
    importPastePlaceholder: 'Dışa aktarımı buraya yapıştırın',
    importPreview: 'İçe aktarımı kontrol edin',
    importPreviewAccessibilityLabel: 'Bu cihazdaki çalışma verileri içe aktarımını kontrol edin',
    importReset: 'İçe aktarım alanını temizleyin',
    confirmImport: 'İçe aktarımı onaylayın',
    confirmImportAccessibilityLabel: 'Bu cihazdaki çalışma verileri içe aktarımını onaylayın',
    importSuccess: 'İçe aktarma tamamlandı.',
    importSummaryTitle: 'İçe aktarma öncesi özet',
    importSummaryTemplates: {
      completedQuestions: 'Kaydedilmiş ilerlemesi olan {count} soru',
      bookmarks: 'Tekrar için işaretlenmiş {count} soru',
      wrongAnswers: '{count} yanlış cevap kaydı',
      mockExams: '{count} deneme sınavı kaydı',
      fsrsCards: '{count} FSRS tekrar kartı',
      fsrsDays: '{count} FSRS tekrar günü',
      settings: '{count} ayar',
      streakFreeze: 'Üst üste çalışma günleri ve korumaları dahil edildi',
    },
    importErrors: {
      emptyInput: 'Kontrol etmeden önce JSON verisini yapıştırın.',
      invalidJson: 'Bu JSON verisi okunamıyor.',
      invalidSchema: 'İçe aktarımın yapısı geçerli değil veya bilinmeyen alanlar içeriyor.',
      unsupportedVersion: 'Bu içe aktarım sürümü şu anda desteklenmiyor.',
      purchaseFieldsRejected:
        'İçe aktarım satın alma, makbuz veya uygulama mağazası alanları içeriyor. Bunları kaldırın ve satın almaları uygulama mağazasından geri yükleyin.',
      noSupportedStudyData: 'İçe aktarım desteklenen çalışma verisi içermiyor.',
    },
  },
  languagePicker: {
    title: 'Soru dilini seçin',
    currentLanguageLabelTemplate: 'Geçerli dil: {label}',
    availableBadge: 'Kullanılabilir',
    unavailableBadge: 'Hazırlanıyor',
    comingSoonTitle: 'Bu dil sürümü hazırlanıyor.',
    comingSoonBody:
      'Türkçe metinler yayımlanmadan önce kontrol ediliyor. Bu süre içinde uygulama İsveççe ve İngilizce olarak kullanılabilir.',
    blockedAccessibilityLabelTemplate: '{label}: dil sürümü hazırlanıyor',
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'Çalışma planı',
      title: "İsveç'te toplum bilgilerini adım adım öğrenin",
      subtitle:
        'Günlük alıştırmalar, deneme sınavı, yanlış cevap tekrarı ve UHR kaynak materyaline göre hazırlanmış kısa açıklamalar.',
      startPractice: 'Alıştırmaya başlayın',
      startPracticeAccessibilityLabel: 'Önerilen alıştırmaya başlayın',
      browseChapters: 'Bölümleri gözden geçirin',
      browseChaptersAccessibilityLabel: 'Tüm bölümleri gözden geçirin',
      dailyPracticeTitle: 'Günlük alıştırma',
      dailyPracticeTextTemplate: 'Bugün {goal} sorudan {completed} tanesini yanıtladınız.',
      readinessTitle: 'Hazırlık göstergesi',
      readinessSparseNote:
        'Bu, yalnızca bugüne kadarki cevaplarınıza dayanan bir çalışma desteğidir. Daha fazla soru yanıtladıkça daha yararlı olur.',
      feedbackTitle: 'Tekrar edilmesi gerekenleri saklayın',
      feedbackText:
        'İşaretlenen sorular ve yanlış cevaplar, açıklamalar ve kaynaklarla birlikte tek yerde durur.',
    },
    practice: {
      badge: '5 dakikalık alıştırma',
      questionTitleTemplate: 'Soru {questionNumber}',
      subtitle: 'Cevap verin, geri bildirimi görün ve UHR kaynak materyalindeki bölümü okuyun.',
      completedQuestionsTemplate: 'Tamamlanan sorular: {count}',
      emptyTitle: 'Henüz alıştırma sorusu yok.',
      nextQuestion: 'Sonraki soru',
      nextQuestionAccessibilityLabel: 'Sonraki alıştırma sorusuna geçin',
      tryAgain: 'Tekrar deneyin',
      tryAgainAccessibilityLabel: 'Bu alıştırma sorusunu tekrar deneyin',
      bookmark: 'Tekrar için işaretleyin',
      bookmarked: 'Tekrar için işaretlendi',
      bookmarkAccessibilityLabels: {
        add: 'Bu soruyu tekrar için işaretleyin',
        remove: 'Bu sorunun işaretini kaldırın',
      },
      sourceDetailsShow: 'Kaynaklar hakkında',
      sourceDetailsHide: 'Kaynak ayrıntılarını gizleyin',
      uhrSourceLabel: 'UHR kaynağı',
    },
    feedback: {
      correct: 'Doğru.',
      incorrect: 'Tam doğru değil.',
      correctAnswerLabel: 'Doğru cevap',
      yourAnswerLabel: 'Cevabınız',
      explanationTitle: 'Cevap açıklaması',
      sourceCitationLabel: 'Kaynak materyal',
      encouragement: 'Sorun değil; açıklama konuyu hatırlamanıza yardımcı olur.',
    },
    mockExam: {
      title: 'Deneme sınavı',
      subtitle:
        'Süreli bir çalışma biçiminde alıştırma yapın ve hangi konuları tekrar etmeniz gerektiğini görün. Resmî bir sınav değildir.',
      setupTitle: 'Deneme sınavını hazırlayın',
      start: 'Deneme sınavını başlatın',
      startAccessibilityLabel: 'Çalışma amaçlı deneme sınavını başlatın',
      questionProgressTemplate: 'Soru {current}/{total}',
      timeRemainingTemplate: 'Kalan süre: {minutes} dakika',
      submit: 'Bitirin ve sonucu görün',
      resultTitle: 'Deneme sınavı sonucu',
      resultSummaryTemplate: '{total} sorudan {correct} tanesini doğru yanıtladınız.',
      reviewAnswers: 'Cevapları ve açıklamaları gözden geçirin',
      localPracticeNote:
        'Bu sonuç, bu uygulamadaki çalışmanıza yardımcı olur ve resmî sonucu öngörmez.',
    },
    mistakes: {
      title: 'Yanlış yaptığınız soruları gözden geçirin',
      subtitle: 'Doğru yanıtlanmayan sorulara dönün; doğru cevabı, açıklamayı ve kaynağı okuyun.',
      emptyTitle: 'Henüz yanlış cevap yok',
      emptyBody:
        'Bir alıştırma sorusu doğru yanıtlanmadığında burada sakin bir tekrar için görünür.',
      savedForReview: 'Tekrar için kaydedildi',
      wrongAnswersTemplate: 'Yanlış cevaplar: {count}',
      latestWrongAnswer: 'Son yanlış cevap',
      reviewQuestion: 'Bu soruyu tekrar edin',
      clearReviewed: 'Anlaşıldığında kaldırın',
    },
    dashboard: {
      eyebrow: 'İlerleme',
      title: 'İlerlemeniz',
      subtitle: 'Neyi tamamladığınızı ve hangi konulara geri dönmenin yararlı olacağını görün.',
      completedQuestions: 'Tamamlanan sorular',
      correctAnswers: 'Doğru cevaplar',
      currentStreak: 'Üst üste çalışma günleri',
      reviewQueue: 'Tekrar edilmesi gereken sorular',
      sparseDataNote:
        'Bu özet, daha fazla cevap verdikçe daha yararlı olur. Resmî bir değerlendirme olarak görülmemelidir.',
    },
    learning: {
      title: 'Öğrenme yolu',
      subtitle:
        'Konulara göre ilerleyin, kısa açıklamaları okuyun ve kaynak gösterilen sorularla alıştırma yapın.',
      chapterCardQuestionCountTemplate: '{count} soru',
      chapterProgressTemplate: '{completed}/{total} tamamlandı',
      startChapter: 'Bölüme başlayın',
      reviewChapter: 'Bölümü gözden geçirin',
      continueLearning: 'Öğrenmeye devam edin',
      lockedReleaseNote:
        'Bu dil sürümü hazırlanıyor. Tüm kontroller tamamlanmadan kullanıma açılmayacaktır.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'Yasal bilgiler ve kaynaklar',
      openLabelTemplate: 'Açın: {label}',
      links: {
        aboutTheTest: 'Sınav hakkında',
        disclaimer: 'Açıklama',
        privacy: 'Gizlilik',
        terms: 'Şartlar',
        sources: 'Öğrenme kaynakları',
        support: 'Destek',
      },
    },
    legalPage: {
      defaultBackLabel: '← Profile dönün',
      defaultBackAccessibilityLabel: 'Profile dönün',
      externalLinkAccessibilityTemplate: 'Dış sayfayı açın: {label}',
    },
    privacy: {
      title: 'Gizlilik politikası',
      noAccountRequired: {
        title: 'Hesap gerekmez',
        body: 'Uygulama hesap, e-posta, telefon veya profil bilgisi istemez. Eğitim bölümlerini kayıt olmadan kullanabilirsiniz.',
      },
      localProgressStorage: {
        title: 'Çalışma ilerlemeniz bu cihazda saklanır',
        body: 'İlerleme, ayarlar, işaretlenen sorular, yanlış cevaplar, XP, üst üste çalışma günleri ve ses seçimi bu cihazda saklanır; böylece uygulama nerede kaldığınızı hatırlar.',
      },
      adsAndPurchases: {
        title: 'Reklamlar ve satın almalar',
        body: 'Ücretsiz sürüm çalışma ekranlarında reklam gösterebilir. Süreli deneme sınavı ekranlarında reklam yoktur. Reklamları kaldırma, uygulama mağazasından geri yüklenebilen tek seferlik bir satın almadır.',
      },
      dataBoundary: {
        title: 'Hassas bilgi göndermeyin',
        body: 'Destek mesajlarında adınızı, kimlik numaranızı, göçmenlik dosyası ayrıntılarını veya resmî belgeleri paylaşmayın. Uygulamanın öğrenmenize yardımcı olmak için bu bilgilere ihtiyacı yoktur.',
      },
    },
    monetization: {
      removeAdsTitle: 'Reklamları kaldırın',
      removeAdsActiveTitle: 'Reklamsız çalışma açık',
      removeAdsBodyTemplate:
        'Ücretsiz çalışma ekranlarında reklam olabilir. Tek seferlik {price} ödemesi çalışma ekranlarındaki reklamları kaldırır; deneme sınavında reklam yoktur.',
      pricingPitchTemplate:
        'Tek seferlik {price} ödemesi reklamları kaldırır. Bu aylık abonelik değildir.',
      buyLabelTemplate: '{price} karşılığında satın alın',
      restoreLabel: 'Önceki satın almayı geri yükleyin',
      statusMessages: {
        idle: 'Daha önce satın aldıysanız geri yükleyebilirsiniz.',
        pending: 'Uygulama mağazasından onay bekleniyor.',
        purchased: 'Reklamlar bu cihazda kapatıldı.',
        restored: 'Satın alma geri yüklendi ve reklamlar kapatıldı.',
        error: 'Satın alma şu anda kullanılamıyor. Daha sonra tekrar deneyin.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'Hoş geldiniz',
      title: "İsveç'te toplum bilgisine sakin bir şekilde hazırlanın",
      subtitle:
        'Bağımsız bir çalışma aracı: günlük alıştırmalar, deneme sınavı ve yanlış cevap tekrarı.',
      chooseLanguage: 'Soru dilini seçin',
      setGoal: 'Günlük hedefi belirleyin',
      startLearning: 'Öğrenmeye başlayın',
      privacyNote: 'Çalışma ilerlemeniz bu cihazda saklanır. Uygulama hesap gerektirmez.',
    },
    aboutTheTest: {
      eyebrow: 'Sınav hakkında',
      title: 'Bu uygulama neyi çalıştırır',
      body: "Uygulama demokrasi, haklar, yükümlülükler ve İsveç'teki kurumlar hakkında tekrar yapmanıza yardımcı olur. İsveç Parlamentosu (Riksdag) gibi İsveç kurumlarının adlarını korur.",
      independenceTitle: 'Resmî bir sınav değildir',
      independenceBody:
        'Bu uygulama bağımsız bir çalışma aracıdır. UHR, Migrationsverket veya başka bir kamu kurumunu temsil etmez ve resmî bir karara söz vermez.',
      sourceBoundary:
        'Eğitim metinleri UHR kaynak materyaline göre hazırlanmıştır ve kamuya açık bilgilerle desteklenir. Güncel bilgileri her zaman ilgili kurumdan kontrol edin.',
    },
    support: {
      title: 'Destek ve geri bildirim',
      subtitle:
        'Metin açık değilse, bir kaynak kontrol edilmeli ise veya bir şey çalışmıyorsa yazın.',
      feedbackPrompt: 'Sorunu veya önerinizi açıklayın',
      privacyReminder:
        'Kişisel bilgi veya belge göndermeyin. Ekranı, soruyu veya metin parçasını açıklamanız yeterlidir.',
      sendFeedback: 'Geri bildirim gönderin',
    },
    sources: {
      title: 'Öğrenme kaynakları',
      subtitle:
        'Bir soru veya açıklamanın hangi materyale dayandığını kontrol edin. Kaynak etiketi, bu uygulamanın resmî olarak onaylandığı anlamına gelmez.',
      uhrLabel: 'UHR kaynak materyali',
      publicInfoLabel: 'Kamuya açık resmî bilgiler',
      openSource: 'Kaynağı açın',
    },
    search: {
      title: 'Kavram ve bölüm arayın',
      placeholder: 'Konu, kurum veya anahtar sözcük yazın',
      emptyTitle: 'Sonuç bulunamadı',
      emptyBody: 'Daha kısa bir arama deneyin; örneğin “Riksdag”, “belediye” veya “haklar”.',
      resultTypeLabels: {
        chapter: 'Bölüm',
        question: 'Soru',
        glossary: 'Kavram',
      },
    },
  },
};
