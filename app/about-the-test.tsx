import { useEffect } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
  sectionSourceTitle: string;
  sectionSourceBody: string;
  backHome: string;
  backHomeAccessibilityLabel: string;
  openPractice: string;
  openPracticeAccessibilityLabel: string;
  openRequirements: string;
  openRequirementsAccessibilityLabel: string;
};

const officialTestSourceNotes = [
  {
    title: 'UHR: Om medborgarskapsprovet',
    url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
    retrievedDate: '2026-05-19',
  },
  {
    title: 'UHR: Frågor och svar',
    url: 'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
    retrievedDate: '2026-05-19',
  },
  {
    title: 'UHR: Anmälan',
    url: 'https://www.uhr.se/medborgarskapsprovet/anmalan/',
    retrievedDate: '2026-05-19',
  },
  {
    title: 'UHR: Utbildningsmaterial om det svenska samhället',
    url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
    retrievedDate: '2026-05-19',
  },
  {
    title: 'Migrationsverket: Nya regler för svenskt medborgarskap från 6 juni 2026',
    url: 'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
    retrievedDate: '2026-05-19',
  },
] as const;

const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = {
  sv: {
    eyebrow: 'Om provet',
    title: 'Vad är medborgarskapsprovet i samhällskunskap?',
    subtitle:
      'Det första provet som UHR beskriver gäller grundläggande kunskaper om det svenska samhället och är planerat till den 15 augusti 2026 i Stockholm.',
    sectionWhatTitle: 'Vad är det?',
    sectionWhatBody:
      'Medborgarskapsprovet är ett kunskapsprov som UHR ansvarar för. Första delen handlar om samhällskunskap. Prov i svenska införs senare.',
    sectionWhoTitle: 'Vem ska göra det?',
    sectionWhoBody:
      'Migrationsverket avgör vem som får skriva provet. Du kan bara anmäla dig efter ett brev från Migrationsverket. Antalet platser är begränsat, och när platserna är fyllda går det inte längre att anmäla sig. Du kan också uppfylla kunskapskravet på andra sätt än genom provet.',
    sectionFormatTitle: 'Vad är känt om första provet?',
    sectionFormatBody:
      'UHR har bekräftat datumet 15 augusti 2026 och Stockholm för den första provomgången. Exakt tid och plats, anpassningar och praktiska förberedelser kommer senare. Augustiprovet är kostnadsfritt och ges som ett utprövningsprov med generös tid.',
    sectionMaterialTitle: 'Vilket material bygger appen på?',
    sectionMaterialBody:
      'Appens UHR-läge utgår från utbildningsmaterialet Sverige i fokus. Våra övningsfrågor är inte UHR:s provfrågor; UHR skriver att övningsprov från andra aktörer inte är kvalitetskontrollerade av myndigheten.',
    sectionIndependenceTitle: 'Är appen officiell?',
    sectionIndependenceBody:
      'Nej. Appen är ett oberoende studieverktyg. Vi är inte UHR, Skolverket eller Migrationsverket. Frågorna här är inte riktiga provfrågor.',
    sectionSourceTitle: 'Källäge kontrollerat',
    sectionSourceBody: `Lägesbilden är kontrollerad ${officialTestSourceNotes[0].retrievedDate} mot UHR:s sidor om provet, anmälan, frågor och svar, utbildningsmaterial samt Migrationsverkets nyhet om reglerna från 6 juni 2026.`,
    backHome: 'Tillbaka till start',
    backHomeAccessibilityLabel: 'Tillbaka till startsidan',
    openPractice: 'Börja öva',
    openPracticeAccessibilityLabel: 'Öppna övningsläget',
    openRequirements: 'Se kravguiden',
    openRequirementsAccessibilityLabel: 'Öppna guiden för medborgarskapskrav',
  },
  en: {
    eyebrow: 'About the test',
    title: 'What is the Swedish civic test?',
    subtitle:
      'The first test described by UHR covers basic knowledge of Swedish society and is planned for 15 August 2026 in Stockholm.',
    sectionWhatTitle: 'What is it?',
    sectionWhatBody:
      'The citizenship test is a knowledge test that UHR is responsible for. The first part is about civic knowledge. A Swedish-language test will be introduced later.',
    sectionWhoTitle: 'Who takes it?',
    sectionWhoBody:
      'Migrationsverket decides who may take the test. You can only sign up after receiving a letter from Migrationsverket. Seats are limited, and when the seats are filled, registration closes. You may also be able to meet the knowledge requirement in other ways.',
    sectionFormatTitle: 'What is known about the first test?',
    sectionFormatBody:
      'UHR has confirmed 15 August 2026 and Stockholm for the first sitting. Exact time and place, adaptations, and practical preparation details will come later. The August test is free of charge and is a trial sitting with generous time.',
    sectionMaterialTitle: 'What material does this app use?',
    sectionMaterialBody:
      "The app's UHR mode is based on the study material Sverige i fokus. Our practice questions are not UHR test questions; UHR says practice tests from other actors are not quality-checked by UHR or another authority.",
    sectionIndependenceTitle: 'Is this app official?',
    sectionIndependenceBody:
      'No. The app is an independent study tool. We are not UHR, Skolverket, or Migrationsverket. The questions here are not real exam questions.',
    sectionSourceTitle: 'Source status checked',
    sectionSourceBody: `This status was checked on ${officialTestSourceNotes[0].retrievedDate} against UHR's pages about the test, registration, FAQ, study material, and Migrationsverket's news about the rules from 6 June 2026.`,
    backHome: 'Back to home',
    backHomeAccessibilityLabel: 'Return to the home screen',
    openPractice: 'Start practising',
    openPracticeAccessibilityLabel: 'Open practice mode',
    openRequirements: 'View requirements guide',
    openRequirementsAccessibilityLabel: 'Open the citizenship requirements guide',
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
    { title: copy.sectionSourceTitle, body: copy.sectionSourceBody },
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
        <Link
          accessibilityLabel={copy.openRequirementsAccessibilityLabel}
          accessibilityRole="link"
          href="/citizenship-requirements"
          style={styles.primaryLink}
        >
          {copy.openRequirements}
        </Link>
        <Link
          accessibilityLabel={copy.openPracticeAccessibilityLabel}
          accessibilityRole="link"
          href="/practice"
          style={styles.secondaryLink}
        >
          {copy.openPractice}
        </Link>
        <Link
          accessibilityLabel={copy.backHomeAccessibilityLabel}
          accessibilityRole="link"
          href="/home"
          style={styles.secondaryLink}
        >
          {copy.backHome}
        </Link>
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
  primaryLink: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
