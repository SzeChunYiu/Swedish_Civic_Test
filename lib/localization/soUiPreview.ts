/**
 * Phase-2 Somali UI preview copy.
 *
 * This is not wired into AppLanguage or release selection. It gives reviewers a
 * typed, testable first Somali app-UI slice while `so` remains unavailable in
 * lib/i18n/locales.ts and blocked in docs/localization/readiness.json.
 */
export const soUiPreview = {
  locale: 'so',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/so/style-guide.md',
  sourcePhrasebook: 'locales/so/phrasebook.md',
  settings: {
    title: 'Dejinta',
    subtitle: 'Maamul luqadda su’aalaha, codka, muuqaalka, iyo hadafkaaga maalinta.',
    backToProfile: '← Ku noqo boggaaga',
    backToProfileAccessibilityLabel: 'Ku noqo boggaaga',
    questionLanguageTitle: 'Luqadda su’aalaha',
    languageAccessibilityLabelTemplate: 'U beddel luqadda su’aalaha: {label}',
    languageOptions: {
      sv: 'Af-Iswiidhish',
      en: 'Taageero Ingiriisi',
    },
    audioTitle: 'Cod',
    audioEnabledLabel: 'Codku wuu shidan yahay',
    audioDisabledLabel: 'Codku wuu dansan yahay',
    enableAudioAccessibilityLabel: 'Daar codka',
    disableAudioAccessibilityLabel: 'Dami codka',
    themeModeTitle: 'Muuqaalka',
    themeSystemLabel: 'Raac nidaamka qalabka',
    themeLightLabel: 'Iftiin',
    themeDarkLabel: 'Madow',
    themeModeSummaryTemplate: 'Muuqaalka hadda: {label}',
    setThemeModeAccessibilityLabelTemplate: 'Dooro muuqaalka: {label}',
    dailyGoalTitle: 'Hadafka maalinta',
    dailyGoalSummaryTemplate: '{answerCount} su’aalood maalintii',
    dailyGoalPresetLabels: {
      5: 'Fudud',
      10: 'Joogto ah',
      20: 'Diirran',
      40: 'Dheeraad ah',
    },
    setDailyGoalAccessibilityLabelTemplate: 'Deji hadafka maalinta: {goal} su’aalood',
    importTitle: 'Soo geli xogta waxbarashada',
    importSectionSubtitle:
      'Ku dheji xogta JSON ee qalabkan laga dhoofiyay. Marka hore waxaad arki doontaa kooban, ka hor inta aan wax la qorin.',
    importPurchasesNote:
      'Iibsiyada, rasiidyada, iyo xogta app-ka dhexdiisa laguma soo geliyo. Iibsiyada ka soo celi dukaanka app-ka.',
    importPasteLabel: 'Ku dheji dhoofinta JSON',
    importPastePlaceholder: 'Halkan ku dheji dhoofinta',
    importPreview: 'Eeg waxa la soo gelinayo',
    importPreviewAccessibilityLabel: 'Eeg soo gelinta xogta waxbarashada ee qalabkan',
    importReset: 'Nadiifi goobta soo gelinta',
    confirmImport: 'Xaqiiji soo gelinta',
    confirmImportAccessibilityLabel: 'Xaqiiji soo gelinta xogta waxbarashada ee qalabkan',
    importSuccess: 'Soo gelintu way dhammaatay.',
    importSummaryTitle: 'Kooban ka hor soo gelinta',
    importSummaryTemplates: {
      completedQuestions: '{count} su’aalood oo horumar la keydiyay leh',
      bookmarks: '{count} su’aalood oo la calaamadeeyay',
      wrongAnswers: '{count} dib-u-eegis jawaabo khaldan ah',
      mockExams: '{count} diiwaanno imtixaan tijaabo ah',
      fsrsCards: '{count} kaarar dib-u-eegis FSRS ah',
      fsrsDays: '{count} maalmood oo dib-u-eegis FSRS ah',
      settings: '{count} dejin',
      streakFreeze: 'Maalmaha isku xiga ee waxbarashada iyo ilaalintooda waa ku jiraan',
    },
    importErrors: {
      emptyInput: 'Ku dheji JSON ka hor intaadan eegis samayn.',
      invalidJson: 'JSON-kan lama akhrin karo.',
      invalidSchema: 'Soo gelintu qaab sax ah ma laha ama waxay leedahay meelo aan la aqoon.',
      unsupportedVersion: 'Noocan soo gelinta hadda lama taageero.',
      purchaseFieldsRejected:
        'Soo gelintu waxay leedahay meelo la xiriira iibsi, rasiid, ama iibsiga app-ka dhexdiisa. Ka saar, ka dibna iibsiyada ka soo celi dukaanka app-ka.',
      noSupportedStudyData: 'Soo gelintu kuma jirto xog waxbarasho oo la taageerayo.',
    },
  },
  studyEntryPoints: {
    home: {
      eyebrow: 'Dulmar waxbarasho',
      title: 'Si deggan u baro qodob kasta oo bulshada Iswiidhan ah',
      subtitle:
        'Jid cad oo lagu barto aqoonta bulshada Iswiidhan: su’aalo maalinle ah, imtixaan tijaabo ah, dib-u-eegis khaladaad, iyo sharaxaad tixraac leh.',
      startPractice: 'Bilow layliga',
      startPracticeAccessibilityLabel: 'Bilow layliga lagu talinayo',
      browseChapters: 'Eeg cutubyada',
      browseChaptersAccessibilityLabel: 'Eeg dhammaan cutubyada bulshada',
      dailyPracticeTitle: 'Layli maalinle ah',
      dailyPracticeTextTemplate: 'Maanta waxaad ka jawaabtay {completed}/{goal} su’aalood.',
      readinessTitle: 'Calaamadda diyaargarowga',
      readinessSparseNote:
        'Waxay ku dhisan tahay jawaabahaaga ilaa hadda. Jawaabo badan bixi si calaamaddu u noqoto mid ka hubsan.',
      feedbackTitle: 'Meel ku hay waxa u baahan dib-u-eegis',
      feedbackText:
        'Su’aalaha la keydiyay iyo kuwa aad qalday waxay joogaan hal meel, iyagoo wata sharaxaad tixraac leh.',
    },
    practice: {
      badge: 'Layli 5 daqiiqo ah',
      questionTitleTemplate: 'Su’aal {questionNumber}',
      subtitle: 'Jawaab bixi, hel jawaab-celin degdeg ah, ka dibna eeg tixraaca UHR.',
      completedQuestionsTemplate: 'Su’aalaha la dhammeeyay: {count}',
      emptyTitle: 'Weli ma jiraan su’aalo layli ah.',
      nextQuestion: 'Su’aasha xigta',
      nextQuestionAccessibilityLabel: 'U gudub su’aasha xigta ee layliga',
      tryAgain: 'Mar kale isku day',
      tryAgainAccessibilityLabel: 'Mar kale isku day su’aashan layliga ah',
      bookmark: 'Calaamadee',
      bookmarked: 'La calaamadeeyay',
      bookmarkAccessibilityLabels: {
        add: 'Calaamadee su’aashan',
        remove: 'Ka saar calaamadda su’aashan',
      },
      sourceDetailsShow: 'Ku saabsan tixraacyada',
      sourceDetailsHide: 'Xir faahfaahinta tixraacyada',
      uhrSourceLabel: 'Tixraaca UHR',
    },
    feedback: {
      correct: 'Waa sax.',
      incorrect: 'Markan jawaabtu ma saxna.',
      correctAnswerLabel: 'Jawaabta saxda ah',
      yourAnswerLabel: 'Jawaabtaada',
      explanationTitle: 'Sharaxaadda jawaabta',
      sourceCitationLabel: 'Ilaha macluumaadka',
      encouragement: 'Hal qalad wax ma yeelo; hadda qodobkan waad xasuusan doontaa.',
    },
    mockExam: {
      title: 'Imtixaan tijaabo',
      subtitle:
        'Ku tababar qaab wakhti leh oo kuu muujinaya halka aad weli u baahan tahay dib-u-eegis. Tani ma aha imtixaan rasmi ah.',
      setupTitle: 'Diyaari imtixaanka tijaabada ah',
      start: 'Bilow imtixaanka tijaabada ah',
      startAccessibilityLabel: 'Bilow imtixaanka tijaabada ah ee waxbarashada',
      questionProgressTemplate: 'Su’aal {current} ee {total}',
      timeRemainingTemplate: 'Waqti haray: {minutes} daqiiqo',
      submit: 'Dhammee oo eeg natiijada',
      resultTitle: 'Natiijada imtixaanka tijaabada ah',
      resultSummaryTemplate: '{correct} jawaabood oo sax ah {total} su’aalood',
      reviewAnswers: 'Eeg jawaabaha iyo sharaxaadaha',
      localPracticeNote:
        'Natiijadani waxay kaa caawinaysaa waxbarashada gudaha app-kan; ma saadaalinayso natiijo rasmi ah.',
    },
    mistakes: {
      title: 'Dib-u-eeg khaladaadka',
      subtitle:
        'Ku celi su’aalaha aad hore u qalday, adigoo arkaya jawaabta saxda ah, sharaxaadda, iyo tixraaca.',
      emptyTitle: 'Weli khaladaad ma jiraan',
      emptyBody:
        'Markaad su’aal layli ah qaladdo, waxay halkan uga muuqan doontaa dib-u-eegis deggan.',
      savedForReview: 'Waxaa loo keydiyay dib-u-eegis diirran',
      wrongAnswersTemplate: 'Jawaabo khaldan: {count}',
      latestWrongAnswer: 'Jawaabtii ugu dambaysay ee khaldan',
      reviewQuestion: 'Dib u eeg su’aashan',
      clearReviewed: 'Ka saar marka la fahmo',
    },
    dashboard: {
      eyebrow: 'Dulmar waxbarasho',
      title: 'Dulmarka horumarka',
      subtitle:
        'Eeg sida layligaagu u socdo, waxa aad dhammaysay, iyo meelaha mudan in si deggan loogu noqdo.',
      completedQuestions: 'Su’aalaha la dhammaystiray',
      correctAnswers: 'Jawaabaha saxda ah',
      currentStreak: 'Maalmaha isku xiga ee waxbarashada',
      reviewQueue: 'Su’aalo dib-u-eegis u baahan',
      sparseDataNote:
        'Dulmarku wuu fiicnaanayaa marka aad ka jawaabto su’aalo badan. Ha u qaadan saadaal rasmi ah.',
    },
    learning: {
      title: 'Jidka waxbarashada',
      subtitle:
        'Raac cutubyada mawduuc ahaan, akhri sharaxaadaha, ka dibna ku tababar su’aalo tixraac leh.',
      chapterCardQuestionCountTemplate: '{count} su’aalood',
      chapterProgressTemplate: '{completed} ee {total} la dhammaystiray',
      startChapter: 'Bilow cutubkan',
      reviewChapter: 'Eeg cutubkan',
      continueLearning: 'Sii wad waxbarashada',
      lockedReleaseNote:
        'Tarjumaaddan waa hordhac dib-u-eegis ah; luqadda lama furi doono ilaa dhammaan hubinnada la dhammeeyo.',
    },
  },
  complianceAndMonetization: {
    complianceLinks: {
      title: 'Macluumaad sharci iyo ilo',
      openLabelTemplate: 'Fur: {label}',
      links: {
        aboutTheTest: 'Ku saabsan imtixaanka',
        disclaimer: 'Qeexid',
        privacy: 'Asturnaan',
        terms: 'Shuruudo',
        sources: 'Ilaha waxbarashada',
        support: 'Taageero',
      },
    },
    legalPage: {
      defaultBackLabel: '← Ku noqo boggaaga',
      defaultBackAccessibilityLabel: 'Ku noqo boggaaga',
      externalLinkAccessibilityTemplate: 'Fur bog dibadda ah: {label}',
    },
    privacy: {
      title: 'Siyaasadda asturnaanta',
      noAccountRequired: {
        title: 'Akoon looma baahna',
        body: 'App-kan ma dalbado akoon, iimayl, telefoon, ama xog profile. Waxaad isticmaali kartaa qaybaha waxbarashada adigoo aan is diiwaangelin.',
      },
      localProgressStorage: {
        title: 'Horumarka waxbarashadu wuxuu ku kaydsan yahay qalabkan',
        body: 'Horumarka, dejinta, su’aalaha la calaamadeeyay, khaladaadka, XP, maalmaha isku xiga, iyo doorashada codka waxay ku kaydsan yihiin qalabkan si app-ku u xusuusto halka aad joogto.',
      },
      adsAndPurchases: {
        title: 'Xayeysiis iyo iibsi',
        body: 'Nooca bilaashka ah wuxuu xayeysiis ku muujin karaa bogagga waxbarashada. Bogagga imtixaanka tijaabada ah ee wakhtiga leh xayeysiis kuma jiraan. Ka saar xayeysiiska waa hal iibsi oo laga soo celin karo dukaanka app-ka.',
      },
      dataBoundary: {
        title: 'Xuduudda xogta xasaasiga ah',
        body: 'Ha gelin magacaaga, lambarkaaga shakhsiga, faahfaahinta kiis socdaal, ama dukumenti dowladeed fariimaha taageerada. App-kan uma baahna xogtaas si uu kuugu caawiyo waxbarashada.',
      },
    },
    monetization: {
      removeAdsTitle: 'Ka saar xayeysiiska',
      removeAdsActiveTitle: 'Waxbarasho aan xayeysiis lahayn waa shidan tahay',
      removeAdsBodyTemplate:
        'Bogagga waxbarashada bilaashka ah waxay yeelan karaan xayeysiis. Hal mar bixi {price} si aad uga saarto xayeysiiska bogagga waxbarashada; imtixaanka tijaabada ah xayeysiis kuma laha.',
      pricingPitchTemplate:
        'Hal mar bixi {price} si aad uga saarto xayeysiiska. Ma jiro isdiiwaangelin bille ah.',
      buyLabelTemplate: 'Iibso {price}',
      restoreLabel: 'Soo celi iibsigii hore',
      statusMessages: {
        idle: 'Haddii aad hore u iibsatay, waad soo celin kartaa.',
        pending: 'Waxaan sugaynaa xaqiijinta dukaanka app-ka.',
        purchased: 'Xayeysiiska qalabkan waa la damiyay.',
        restored: 'Iibsigii waa la soo celiyay, xayeysiiskana waa la damiyay.',
        error: 'Hadda iibsi lama samayn karo. Mar kale isku day goor dambe.',
      },
    },
  },
  remainingHighFrequencyRoutes: {
    onboarding: {
      eyebrow: 'Soo dhowow',
      title: 'Si deggan ugu diyaargarow aqoonta bulshada Iswiidhan',
      subtitle:
        'Qalab waxbarasho oo madax-bannaan: layli maalinle ah, imtixaan tijaabo ah, iyo dib-u-eegis khaladaad.',
      steps: [
        'Baro ereyada iyo fikradaha bulshada Iswiidhan.',
        'Ku tababar su’aalo leh tixraac iyo sharaxaad.',
        'Akoon looma baahna; horumarku wuxuu ku kaydsan yahay qalabkan.',
      ],
      startStudying: 'Bilow waxbarashada',
      adjustSettings: 'Hagaaji dejinta',
      decideLater: 'Go’aanso mar dambe',
    },
    aboutTheTest: {
      eyebrow: 'Ku saabsan imtixaanka',
      title: 'Waa maxay imtixaanka aqoonta bulshada ee jinsiyadda Iswiidhan?',
      subtitle:
        'UHR waxay sharxaysaa in qaybta koowaad ay tijaabiso aqoonta aasaasiga ah ee bulshada Iswiidhan. App-kan waa qalab waxbarasho oo madax-bannaan.',
      sections: {
        what: {
          title: 'Waa maxay imtixaankani?',
          body: 'Imtixaanka jinsiyadda waa imtixaan aqoon ah oo UHR mas’uul ka tahay. Qaybta koowaad waxay ku saabsan tahay aqoonta bulshada.',
        },
        independence: {
          title: 'Ma aha qalab rasmi ah',
          body: 'App-kan ma matalo UHR, Skolverket, ama Migrationsverket. Su’aalaha halkan ku jira ma aha su’aalo imtixaan rasmi ah.',
        },
        material: {
          title: 'Maxaa sal u ah layliga?',
          body: 'Qaabka UHR ee app-kan wuxuu ku salaysan yahay agabka waxbarasho ee Sverige i fokus, iyadoo la ilaalinayo in layligu yahay mid madax-bannaan.',
        },
      },
      openPractice: 'Fur layliga',
      backHome: 'Ku noqo bogga hore',
    },
    support: {
      title: 'Taageero iyo jawaab-celin',
      whatToReportTitle: 'Waxaad soo sheegi karto',
      whatToReportBody:
        'Soo sheeg qalad nuxur, weedh aan caddayn, xiriir il oo jaban, dhibaato cod, ama qalad ku jira socodka waxbarashada.',
      noPersonalDataTitle: 'Ha dirin xog shakhsi ah',
      noPersonalDataBody:
        'Ha ku darin magaca, lambarka shakhsiga, lambarka kiis, faahfaahinta socdaalka, ama xog kale oo xasaasi ah.',
      independentStudyToolTitle: 'Qalab waxbarasho oo madax-bannaan',
      independentStudyToolBody:
        'Taageeradu waxay caawin kartaa app-ka iyo saxitaanka nuxurka, laakiin ma bixin karto jawaabo rasmi ah, talo socdaal, ama go’aanno hay’ad rasmi ah.',
      questionReportContextTitle: 'Macluumaadka su’aasha lagu soo sheegayo',
      noPersonalDataWarning: 'Ha gelin xog shakhsi ah markaad jawaab-celin dirayso.',
    },
    sources: {
      title: 'Ilaha waxbarashada',
      primaryStudyMaterialTitle: 'Agabka waxbarasho ee ugu muhiimsan',
      primaryStudyMaterialBody:
        'Sverige i fokus. Agab waxbarasho oo loogu talagalay imtixaanka jinsiyadda, aqoonta aasaasiga ah ee bulshada Iswiidhan.',
      questionReferencesTitle: 'Tixraacyada su’aalaha',
      questionReferencesBody:
        'Su’aal kasta waxay leedahay tixraac kooban oo muujinaya cutubka UHR, qaybta, iyo bog qiyaas ah si aad ugu noqoto agabka waxbarashada.',
      authorityBoundariesTitle: 'Xuduudda hay’adaha',
      authorityBoundariesBody:
        'UHR waxay sheegtay in su’aalaha internetka ee ay sameeyaan dad ama shirkado kale aanay ahayn kuwo UHR ansixisay. App-kan wuxuu hayaa xuduuddaas: waa layli madax-bannaan.',
    },
    search: {
      eyebrow: 'Tixraac la raadin karo',
      title: 'Raadi ereyo iyo cutubyo',
      subtitle: 'Eeg ereyada muhiimka ah ee aqoonta bulshada iyo cutubyada ay la xiriiraan.',
      searchLabel: 'Raadi erey',
      searchPlaceholder: 'Raadi dimoqraadiyad, degmo, daryeel bulsho…',
      clearSearch: 'Nadiifi raadinta',
      emptyTitle: 'Erey ku habboon lama helin',
      emptyBody: 'Isku day erey kale, magaca hay’ad, ama cinwaan cutub.',
      browseChapters: 'Eeg cutubyada',
    },
  },
  languagePicker: {
    triggerLabelTemplate: 'Luqadda hadda waa {currentLabel}. Fur doorashada luqadda.',
    closeLabel: 'Xir doorashada luqadda',
    menuLabel: 'Doorashada luqadda',
    title: 'Dooro luqadda',
    subtitle:
      'Tarjumaadda interface-ka si tartiib ah ayaa loo dhisayaa. Su’aalaha waxay sii ahaanayaan af-Iswiidhish ama Ingiriisi ilaa nooc kasta dib-u-eegis bini’aadan helo.',
    unavailableSuffix: ', weli waa la diyaarinayaa',
    comingSoon: 'Noocan luqadeed weli waa la diyaarinayaa.',
  },
} as const;
