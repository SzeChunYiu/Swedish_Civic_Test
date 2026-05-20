import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type AboutTheTestCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sectionWhatTitle: string;
  sectionWhatBody: string;
  sectionWhoTitle: string;
  sectionWhoBody: string;
  sectionFormatTitle: string;
  sectionFormatBody: string;
  sectionMaterialTitle: string;
  sectionMaterialBody: string;
  sectionIndependenceTitle: string;
  sectionIndependenceBody: string;
  backHome: string;
  backHomeAccessibilityLabel: string;
  openPractice: string;
  openPracticeAccessibilityLabel: string;
};

const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = {
  sv: {
    eyebrow: 'Om provet',
    title: 'Vad är medborgarskapsprovet i samhällskunskap?',
    subtitle:
      'Ett kort prov som personer som ansöker om svenskt medborgarskap ska klara. Det handlar om Sverige som land, demokratin, vardagslivet och dina rättigheter.',
    sectionWhatTitle: 'Vad är det?',
    sectionWhatBody:
      'Medborgarskapsprovet är ett digitalt prov som testar grundläggande kunskaper om det svenska samhället. Det ingår i kraven för att få bli svensk medborgare.',
    sectionWhoTitle: 'Vem ska göra det?',
    sectionWhoBody:
      'Du som ansöker om svenskt medborgarskap. Vissa grupper är undantagna; läs alltid Migrationsverkets aktuella regler innan du planerar provet.',
    sectionFormatTitle: 'Hur ser provet ut?',
    sectionFormatBody:
      'Flervalsfrågor på svenska. Du svarar på en dator i en provlokal. Provet täcker tretton områden, från geografi och historia till lag och rätt, arbetsmarknad och välfärd.',
    sectionMaterialTitle: 'Vilket material bygger appen på?',
    sectionMaterialBody:
      'Allt grundinnehåll följer UHR:s utbildningsmaterial Sverige i fokus. Mock-provet visar bara UHR-frågor; tilläggsfrågor och redaktionellt innehåll markeras tydligt och kan slås av.',
    sectionIndependenceTitle: 'Är appen officiell?',
    sectionIndependenceBody:
      'Nej. Appen är ett oberoende studieverktyg. Vi är inte UHR, Skolverket eller Migrationsverket. Frågorna här är inte riktiga provfrågor.',
    backHome: 'Tillbaka till start',
    backHomeAccessibilityLabel: 'Tillbaka till startsidan',
    openPractice: 'Börja öva',
    openPracticeAccessibilityLabel: 'Öppna övningsläget',
  },
  en: {
    eyebrow: 'About the test',
    title: 'What is the Swedish civic test?',
    subtitle:
      'A short test that applicants for Swedish citizenship must pass. It covers Sweden as a country, democracy, everyday life, and your rights.',
    sectionWhatTitle: 'What is it?',
    sectionWhatBody:
      'The civic test is a digital exam that checks basic knowledge of Swedish society. It is part of the requirements for becoming a Swedish citizen.',
    sectionWhoTitle: 'Who takes it?',
    sectionWhoBody:
      'People applying for Swedish citizenship. Some groups are exempt; always check the current Migrationsverket rules before booking.',
    sectionFormatTitle: 'What does it look like?',
    sectionFormatBody:
      'Multiple-choice questions in Swedish, answered on a computer at a test centre. The exam covers thirteen topics from geography and history to law, the labour market, and welfare.',
    sectionMaterialTitle: 'What material does this app use?',
    sectionMaterialBody:
      "All core content follows UHR's study material Sverige i fokus. The mock exam only shows UHR questions; supplementary and editorial content is clearly labelled and can be switched off.",
    sectionIndependenceTitle: 'Is this app official?',
    sectionIndependenceBody:
      'No. The app is an independent study tool. We are not UHR, Skolverket, or Migrationsverket. The questions here are not real exam questions.',
    backHome: 'Back to home',
    backHomeAccessibilityLabel: 'Back to home',
    openPractice: 'Start practising',
    openPracticeAccessibilityLabel: 'Open practice mode',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const hasSeenAboutTheTest = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markAboutTheTestSeen = useSettingsStore((state) => state.markAboutTheTestSeen);
  const copy = aboutTheTestCopy[language];

  useEffect(() => {
    if (!hasSeenAboutTheTest) {
      markAboutTheTestSeen();
    }
  }, [hasSeenAboutTheTest, markAboutTheTestSeen]);

  const sections: readonly { title: string; body: string }[] = [
    { title: copy.sectionWhatTitle, body: copy.sectionWhatBody },
    { title: copy.sectionWhoTitle, body: copy.sectionWhoBody },
    { title: copy.sectionFormatTitle, body: copy.sectionFormatBody },
    { title: copy.sectionMaterialTitle, body: copy.sectionMaterialBody },
    { title: copy.sectionIndependenceTitle, body: copy.sectionIndependenceBody },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>

      <View style={styles.sections}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {section.title}
            </Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>

      <QuestionDisclaimer />

      <View style={styles.actions}>
        <ComplianceActionLink
          accessibilityLabel={copy.openPracticeAccessibilityLabel}
          href="/practice"
          label={copy.openPractice}
          variant="primary"
        />
        <ComplianceActionLink
          accessibilityLabel={copy.backHomeAccessibilityLabel}
          href="/home"
          label={copy.backHome}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space[2.25],
    padding: space[3],
    paddingBottom: space[10],
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
    padding: space[3],
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.heroMobile.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sections: {
    gap: space[2],
  },
  section: {
    gap: space[0.75],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
});
