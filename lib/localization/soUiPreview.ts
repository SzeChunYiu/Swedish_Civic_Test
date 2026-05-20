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
