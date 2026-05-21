import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LegalExternalLink, LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { questions } from '../data/questions';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

const PUBLIC_SUPPORT_URL = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';

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
  const questionReportContext = getQuestionReportContext(params, language);

  return (
    <LegalPage title={copy.title}>
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
          destination={PUBLIC_SUPPORT_URL}
          href={PUBLIC_SUPPORT_URL}
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

function getQuestionReportContext(
  params: QuestionReportSearchParams,
  fallbackLanguage: AppLanguage,
): QuestionReportContext | null {
  const questionId = getBoundedSearchParam(params.questionId, 16);
  if (!questionId || !validQuestionIds.has(questionId)) return null;

  return {
    language: getReportLanguage(params.language, fallbackLanguage),
    questionId,
    screen: getReportScreen(params.reportScreen ?? params.screen),
    selectedAnswer: getBoundedSearchParam(params.selectedAnswer, 240),
    source: getBoundedSearchParam(params.source, 240),
  };
}

const validQuestionIds = new Set(questions.map((question) => question.id));
const validReportScreens = new Set<QuestionReportScreen>(['chapter', 'exam', 'practice', 'quiz']);

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getBoundedSearchParam(value: string | string[] | undefined, maxLength: number) {
  const rawValue = getSearchParam(value);
  if (typeof rawValue !== 'string') return undefined;

  const trimmedValue = rawValue.trim();
  if (!trimmedValue || trimmedValue.length > maxLength) return undefined;

  return trimmedValue;
}

function getReportLanguage(
  value: string | string[] | undefined,
  fallbackLanguage: AppLanguage,
): AppLanguage {
  const language = getBoundedSearchParam(value, 8);
  return language === 'sv' || language === 'en' ? language : fallbackLanguage;
}

function getReportScreen(value: string | string[] | undefined): QuestionReportScreen {
  const screen = getBoundedSearchParam(value, 16);
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
    borderWidth: StyleSheet.hairlineWidth,
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
});
