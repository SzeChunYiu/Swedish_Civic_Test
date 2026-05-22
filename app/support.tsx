import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LegalExternalLink, LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { questions } from '../data/questions';
import { publicUrls } from '../lib/scaffold/publicUrls';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type QuestionReportScreen = 'chapter' | 'exam' | 'practice' | 'quiz';

type SupportRouteCopy = {
  openSupportPageAccessibilityLabel: string;
  questionReportContext: {
    accessibilityLabel: (questionId: string) => string;
    activeLanguage: string;
    body: string;
    missingValue: string;
    noPersonalData: string;
    questionId: string;
    rejectedAccessibilityLabel: string;
    rejectedBody: string;
    rejectedTitle: string;
    screen: string;
    screenLabels: Record<QuestionReportScreen, string>;
    selectedAnswer: string;
    source: string;
    title: string;
  };
  sections: {
    whatToReport: LegalRouteSectionCopy;
    noPersonalData: LegalRouteSectionCopy;
    independentStudyTool: LegalRouteSectionCopy;
    publicSupportPage: LegalRouteSectionCopy;
  };
  title: string;
};

const supportCopy: Record<AppLanguage, SupportRouteCopy> = {
  sv: {
    openSupportPageAccessibilityLabel: 'Öppna den offentliga supportsidan',
    questionReportContext: {
      accessibilityLabel: (questionId) => `Rapportkontext för frågan ${questionId}`,
      activeLanguage: 'Aktivt språk',
      body: 'Använd den här kontexten när du skickar rapporten. Den innehåller bara frågeinformation från appen.',
      missingValue: 'Saknas',
      noPersonalData:
        'Lägg inte till namn, personnummer, ärendenummer eller andra personuppgifter i rapporten.',
      questionId: 'Fråge-ID',
      rejectedAccessibilityLabel: 'Frågerapportens länk kunde inte användas',
      rejectedBody:
        'Länken innehöll frågeuppgifter som inte kunde kontrolleras. Av integritetsskäl visas inga avvisade värden här.',
      rejectedTitle: 'Frågekontexten kunde inte användas',
      screen: 'Skärm',
      screenLabels: {
        chapter: 'Kapitel',
        exam: 'Övningsprov',
        practice: 'Övning',
        quiz: 'Frågepass',
      },
      selectedAnswer: 'Valt svar',
      source: 'Källa',
      title: 'Kontext för frågerapport',
    },
    sections: {
      whatToReport: {
        body: 'Skicka ett supportmeddelande om du hittar ett innehållsfel, oklar svensk formulering, trasig källreferens, ett ljudproblem eller ett fel i studieflödet.',
        title: 'Vad du kan rapportera',
      },
      noPersonalData: {
        body: 'Ta inte med personuppgifter, myndighets-ID, detaljer om migrationsärenden eller känslig privat information i supportmeddelanden.',
        title: 'Inga personuppgifter',
      },
      independentStudyTool: {
        body: 'Supporten kan hjälpa till med appfunktioner och innehållsrättelser, men kan inte ge officiella provsvar, migrationsråd eller myndighetsbeslut.',
        title: 'Oberoende studieverktyg',
      },
      publicSupportPage: {
        body: 'Skicka återkoppling via den offentliga supportsidan:',
        title: 'Offentlig supportsida',
      },
    },
    title: 'Support och återkoppling',
  },
  en: {
    openSupportPageAccessibilityLabel: 'Open public support page',
    questionReportContext: {
      accessibilityLabel: (questionId) => `Report context for question ${questionId}`,
      activeLanguage: 'Active language',
      body: 'Use this context when you send the report. It contains only question information from the app.',
      missingValue: 'Unavailable',
      noPersonalData:
        'Do not add names, personal identity numbers, case numbers, or other personal data to the report.',
      questionId: 'Question ID',
      rejectedAccessibilityLabel: 'Question report link context could not be used',
      rejectedBody:
        'The link included question details that could not be verified. For privacy, rejected values are not shown here.',
      rejectedTitle: 'Question context could not be used',
      screen: 'Screen',
      screenLabels: {
        chapter: 'Chapter',
        exam: 'Mock exam',
        practice: 'Practice',
        quiz: 'Quiz session',
      },
      selectedAnswer: 'Selected answer',
      source: 'Source',
      title: 'Question report context',
    },
    sections: {
      whatToReport: {
        body: 'Send a support note if you find a content issue, confusing Swedish wording, a broken source reference, an audio problem, or a bug in the study flow.',
        title: 'What to report',
      },
      noPersonalData: {
        body: 'Please include no personal data, government identifiers, immigration case details, or sensitive private information in support messages.',
        title: 'No personal data',
      },
      independentStudyTool: {
        body: 'Support can help with app functionality and content corrections, but it cannot provide official exam answers, migration advice, or government decisions.',
        title: 'Independent study tool',
      },
      publicSupportPage: {
        body: 'Send feedback through the public support page:',
        title: 'Public support page',
      },
    },
    title: 'Support and feedback',
  },
};

export default function Screen() {
  const params = useLocalSearchParams<QuestionReportSearchParams>();
  const language = useSettingsStore((state) => state.language);
  const copy = supportCopy[language];
  const questionReportResult = getQuestionReportContextResult(params, language);
  const questionReportContext = questionReportResult.context;

  return (
    <LegalPage title={copy.title}>
      {questionReportResult.rejected ? (
        <RejectedQuestionReportContextNotice copy={copy.questionReportContext} />
      ) : null}
      {questionReportContext ? (
        <View
          accessibilityLabel={copy.questionReportContext.accessibilityLabel(
            questionReportContext.questionId,
          )}
          accessibilityRole="summary"
          style={styles.contextSection}
        >
          <Text accessibilityRole="header" style={styles.contextTitle}>
            {copy.questionReportContext.title}
          </Text>
          <Text style={styles.contextBody}>{copy.questionReportContext.body}</Text>
          <View style={styles.contextRows}>
            <QuestionReportContextRow
              label={copy.questionReportContext.questionId}
              value={questionReportContext.questionId}
            />
            <QuestionReportContextRow
              label={copy.questionReportContext.source}
              value={questionReportContext.source ?? copy.questionReportContext.missingValue}
            />
            <QuestionReportContextRow
              label={copy.questionReportContext.activeLanguage}
              value={questionReportContext.language}
            />
            <QuestionReportContextRow
              label={copy.questionReportContext.screen}
              value={
                copy.questionReportContext.screenLabels[questionReportContext.screen] ??
                questionReportContext.screen
              }
            />
            {questionReportContext.selectedAnswer ? (
              <QuestionReportContextRow
                label={copy.questionReportContext.selectedAnswer}
                value={questionReportContext.selectedAnswer}
              />
            ) : null}
          </View>
          <Text style={styles.contextWarning}>{copy.questionReportContext.noPersonalData}</Text>
        </View>
      ) : null}
      <LegalSection title={copy.sections.whatToReport.title}>
        {copy.sections.whatToReport.body}
      </LegalSection>
      <LegalSection title={copy.sections.noPersonalData.title}>
        {copy.sections.noPersonalData.body}
      </LegalSection>
      <LegalSection title={copy.sections.independentStudyTool.title}>
        {copy.sections.independentStudyTool.body}
      </LegalSection>
      <LegalSection
        title={copy.sections.publicSupportPage.title}
        body={copy.sections.publicSupportPage.body}
      >
        <LegalExternalLink
          accessibilityLabel={copy.openSupportPageAccessibilityLabel}
          destination={publicUrls.support}
          href={publicUrls.support}
          label={copy.sections.publicSupportPage.title}
        />
      </LegalSection>
    </LegalPage>
  );
}

type QuestionReportSearchParams = {
  language?: string | string[];
  questionId?: string | string[];
  reportScreen?: string | string[];
  screen?: string | string[];
  selectedAnswer?: string | string[];
  source?: string | string[];
};

type QuestionReportContext = {
  language: AppLanguage;
  questionId: string;
  screen: QuestionReportScreen;
  selectedAnswer?: string;
  source?: string;
};

type QuestionReportContextResult = {
  context: QuestionReportContext | null;
  rejected: boolean;
};

type SearchParamResult = {
  rejected: boolean;
  value?: string;
};

function RejectedQuestionReportContextNotice({
  copy,
}: {
  copy: SupportRouteCopy['questionReportContext'];
}) {
  return (
    <View
      accessibilityLabel={copy.rejectedAccessibilityLabel}
      accessibilityRole="summary"
      style={styles.rejectedContextNotice}
    >
      <Text accessibilityRole="header" style={styles.rejectedContextTitle}>
        {copy.rejectedTitle}
      </Text>
      <Text style={styles.rejectedContextBody}>{copy.rejectedBody}</Text>
    </View>
  );
}

function QuestionReportContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.contextRow}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text selectable style={styles.contextValue}>
        {value}
      </Text>
    </View>
  );
}

function getQuestionReportContextResult(
  params: QuestionReportSearchParams,
  fallbackLanguage: AppLanguage,
): QuestionReportContextResult {
  const questionId = getBoundedSearchParam(params.questionId, 16);
  const language = getBoundedSearchParam(params.language, 8);
  const reportScreen = getBoundedSearchParam(params.reportScreen ?? params.screen, 16);
  const selectedAnswer = getBoundedSearchParam(params.selectedAnswer, 240);
  const source = getBoundedSearchParam(params.source, 240);
  const hasReportParams = hasQuestionReportSearchParams(params);
  let rejected =
    questionId.rejected ||
    language.rejected ||
    reportScreen.rejected ||
    selectedAnswer.rejected ||
    source.rejected;

  if (language.value && language.value !== 'sv' && language.value !== 'en') {
    rejected = true;
  }

  if (!questionId.value || !validQuestionIds.has(questionId.value)) {
    return {
      context: null,
      rejected: hasReportParams || rejected,
    };
  }

  if (reportScreen.value && !validReportScreens.has(reportScreen.value as QuestionReportScreen)) {
    rejected = true;
  }

  return {
    context: {
      language: getReportLanguage(language, fallbackLanguage),
      questionId: questionId.value,
      screen: getReportScreen(reportScreen),
      selectedAnswer: selectedAnswer.value,
      source: source.value,
    },
    rejected,
  };
}

const validQuestionIds = new Set(questions.map((question) => question.id));
const validReportScreens = new Set<QuestionReportScreen>(['chapter', 'exam', 'practice', 'quiz']);

function hasSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined;
}

function hasQuestionReportSearchParams(params: QuestionReportSearchParams) {
  return (
    hasSearchParam(params.questionId) ||
    hasSearchParam(params.reportScreen) ||
    hasSearchParam(params.screen) ||
    hasSearchParam(params.selectedAnswer) ||
    hasSearchParam(params.source)
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getBoundedSearchParam(
  value: string | string[] | undefined,
  maxLength: number,
): SearchParamResult {
  if (!hasSearchParam(value)) return { rejected: false };

  const rawValue = getSearchParam(value);
  if (typeof rawValue !== 'string') return { rejected: true };

  const trimmedValue = rawValue.trim();
  if (!trimmedValue || trimmedValue.length > maxLength) return { rejected: true };

  return { rejected: false, value: trimmedValue };
}

function getReportLanguage(result: SearchParamResult, fallbackLanguage: AppLanguage): AppLanguage {
  const language = result.value;
  return language === 'sv' || language === 'en' ? language : fallbackLanguage;
}

function getReportScreen(result: SearchParamResult): QuestionReportScreen {
  const screen = result.value;
  return screen && validReportScreens.has(screen as QuestionReportScreen)
    ? (screen as QuestionReportScreen)
    : 'practice';
}

const styles = StyleSheet.create({
  contextBody: {
    color: colors.textSecondary,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  contextLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  contextRow: {
    gap: space[0.5],
  },
  contextRows: {
    gap: space[1.25],
  },
  contextSection: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1.5],
    padding: space[2],
  },
  contextTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  contextValue: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  contextWarning: {
    color: colors.textDisclaimer,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
  },
  rejectedContextBody: {
    color: colors.textSecondary,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  rejectedContextNotice: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1],
    padding: space[2],
  },
  rejectedContextTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
});
