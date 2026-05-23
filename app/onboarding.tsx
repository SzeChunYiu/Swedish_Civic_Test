import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthProviderButton } from '../components/auth/AuthProviderButton';
import { GoogleLogo } from '../components/auth/GoogleLogo';
import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { RouteLink } from '../components/ui/RouteLink';
import { useAuth, type AuthProviderId } from '../lib/auth/AuthContext';
import { formatExamDate, type StudyIntensity } from '../lib/learning/examDate';
import {
  normalizeStudyPlanTestDateIso,
  supportedDailyGoalAnswerOptions,
  useSettingsStore,
  type AppLanguage,
} from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

type DailyGoalPresetValue = Exclude<(typeof supportedDailyGoalAnswerOptions)[number], 5>;

function isOnboardingDailyGoalPresetValue(goal: number): goal is DailyGoalPresetValue {
  return goal !== 5;
}

const onboardingDailyGoalPresetValues: readonly DailyGoalPresetValue[] =
  supportedDailyGoalAnswerOptions.filter(isOnboardingDailyGoalPresetValue);

type OnboardingGoalPresetCopy = {
  accessibilityLabel: string;
  helper: string;
  label: string;
  summary: string;
};

type OnboardingCopy = {
  adjustSettings: string;
  adjustSettingsAccessibilityLabel: string;
  authApple: string;
  authBody: string;
  authGoogle: string;
  authTitle: string;
  authUnavailable: string;
  authWithoutAccount: string;
  authWithoutAccountAccessibilityLabel: string;
  dailyGoalPresets: Record<DailyGoalPresetValue, OnboardingGoalPresetCopy>;
  dailyGoalSubtitle: string;
  dailyGoalTitle: string;
  decideLater: string;
  decideLaterAccessibilityLabel: string;
  eyebrow: string;
  startStudying: string;
  startStudyingAccessibilityLabel: string;
  steps: readonly string[];
  subtitle: string;
  testDateInputAccessibilityLabel: string;
  testDateInputPlaceholder: string;
  testDateInvalid: string;
  testDateSaved: (formattedDate: string) => string;
  testDateSkip: string;
  testDateSkipAccessibilityLabel: string;
  testDateSubtitle: string;
  testDateTitle: string;
  title: string;
};

type FocusableElement = { focus?: () => void };
type KeyboardEventLike = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};
type WebRadioKeyboardProps = {
  onKeyDown?: (event: KeyboardEventLike) => void;
  tabIndex?: 0 | -1;
};

function getRadioArrowDirection(event: KeyboardEventLike): -1 | 1 | null {
  const key = event.nativeEvent?.key ?? event.key;
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return null;
}

const onboardingCopy: Record<AppLanguage, OnboardingCopy> = {
  sv: {
    adjustSettings: 'Justera inställningar',
    adjustSettingsAccessibilityLabel: 'Öppna inställningar',
    authApple: 'Fortsätt med Apple',
    authBody:
      'Konto är frivilligt. Dina övningssvar och studieframsteg sparas lokalt även om du fortsätter utan konto.',
    authGoogle: 'Fortsätt med Google',
    authTitle: 'Välj hur du vill börja',
    authUnavailable:
      'Inloggning är inte aktiverad i den här versionen. Du kan fortsätta utan konto.',
    authWithoutAccount: 'Fortsätt utan konto',
    authWithoutAccountAccessibilityLabel: 'Fortsätt till startsidan utan konto',
    dailyGoalPresets: {
      10: {
        accessibilityLabel: 'Välj lugnt dagligt mål med 10 svar',
        helper: 'En liten vana när du vill komma igång utan stress.',
        label: 'Lugn',
        summary: '10 svar per dag',
      },
      20: {
        accessibilityLabel: 'Välj regelbundet dagligt mål med 20 svar',
        helper: 'För stadiga studiepass de flesta dagar.',
        label: 'Regelbunden',
        summary: '20 svar per dag',
      },
      40: {
        accessibilityLabel: 'Välj seriöst dagligt mål med 40 svar',
        helper: 'När du vill träna mer inför ett närliggande övningsprov.',
        label: 'Seriös',
        summary: '40 svar per dag',
      },
    },
    dailyGoalSubtitle:
      'Börja med en takt som känns lätt att hålla. Du kan ändra den när som helst.',
    dailyGoalTitle: 'Välj ett mjukt dagligt mål',
    decideLater: 'Bestäm senare',
    decideLaterAccessibilityLabel: 'Fortsätt utan att välja dagligt mål',
    eyebrow: 'Välkommen',
    startStudying: 'Börja studera',
    startStudyingAccessibilityLabel: 'Börja studera',
    steps: [
      'Studera svenska samhällsbegrepp med engelskt stöd vid behov.',
      'Öva med UHR-refererade frågor och förklaringar.',
      'Följ framsteg lokalt på din enhet utan konto.',
    ],
    subtitle:
      'En liten, fristående studiekompis för daglig övning, provträning och genomgång av frågor du missat.',
    testDateInputAccessibilityLabel: 'Ange provdatum som ÅÅÅÅ-MM-DD',
    testDateInputPlaceholder: '2026-08-15',
    testDateInvalid: 'Använd formatet ÅÅÅÅ-MM-DD eller hoppa över tills du har bokat.',
    testDateSaved: (formattedDate) => `Sparat provdatum: ${formattedDate}.`,
    testDateSkip: 'Jag har inte bokat än',
    testDateSkipAccessibilityLabel: 'Fortsätt utan bokat provdatum',
    testDateSubtitle:
      'Lägg till datumet om du redan har bokat. Det sparas bara på den här enheten och kan ändras senare.',
    testDateTitle: 'När är ditt prov?',
    title: 'Förbered dig lugnt för samhällskunskapsprovet',
  },
  en: {
    adjustSettings: 'Adjust settings',
    adjustSettingsAccessibilityLabel: 'Adjust settings',
    authApple: 'Continue with Apple',
    authBody:
      'Accounts are optional. Your practice answers and study progress stay local even when you continue without an account.',
    authGoogle: 'Continue with Google',
    authTitle: 'Choose how to start',
    authUnavailable: 'Sign-in is not enabled on this build. You can continue without an account.',
    authWithoutAccount: 'Continue without an account',
    authWithoutAccountAccessibilityLabel: 'Continue to home without an account',
    dailyGoalPresets: {
      10: {
        accessibilityLabel: 'Choose casual daily goal with 10 answers',
        helper: 'A small habit when you want to get started without stress.',
        label: 'Casual',
        summary: '10 answers per day',
      },
      20: {
        accessibilityLabel: 'Choose regular daily goal with 20 answers',
        helper: 'For steady study on most days.',
        label: 'Regular',
        summary: '20 answers per day',
      },
      40: {
        accessibilityLabel: 'Choose serious daily goal with 40 answers',
        helper: 'When you want extra practice before an upcoming mock exam.',
        label: 'Serious',
        summary: '40 answers per day',
      },
    },
    dailyGoalSubtitle: 'Start with a pace that feels easy to keep. You can change it anytime.',
    dailyGoalTitle: 'Choose a gentle daily goal',
    decideLater: 'Decide later',
    decideLaterAccessibilityLabel: 'Continue without choosing a daily goal',
    eyebrow: 'Welcome',
    startStudying: 'Start studying',
    startStudyingAccessibilityLabel: 'Start studying',
    steps: [
      'Study Swedish civic concepts with English support when needed.',
      'Practice with UHR-referenced questions and explanations.',
      'Track progress locally on your device without an account.',
    ],
    subtitle:
      'A small, independent study companion for daily practice, mock exams, and mistake review.',
    testDateInputAccessibilityLabel: 'Enter test date as YYYY-MM-DD',
    testDateInputPlaceholder: '2026-08-15',
    testDateInvalid: "Use YYYY-MM-DD, or skip until you've booked.",
    testDateSaved: (formattedDate) => `Test date saved: ${formattedDate}.`,
    testDateSkip: "I haven't booked it yet",
    testDateSkipAccessibilityLabel: 'Continue without a booked test date',
    testDateSubtitle:
      'Add the date if you have booked it. It stays only on this device and can be changed later.',
    testDateTitle: 'When is your test?',
    title: 'Prepare calmly for the civic test',
  },
};

function studyIntensityForDailyGoal(goal: DailyGoalPresetValue): StudyIntensity {
  if (goal === 10) return 'casual';
  if (goal === 40) return 'serious';
  return 'regular';
}

export default function Screen() {
  const { isAuthConfigured, signInWithApple, signInWithGoogle } = useAuth();
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const setStudyPlanIntensity = useSettingsStore((state) => state.setStudyPlanIntensity);
  const setStudyPlanTestDateIso = useSettingsStore((state) => state.setStudyPlanTestDateIso);
  const studyPlanTestDateIso = useSettingsStore((state) => state.studyPlanTestDateIso);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [testDateInput, setTestDateInput] = useState(() =>
    studyPlanTestDateIso ? studyPlanTestDateIso.slice(0, 10) : '',
  );
  const [testDateFeedback, setTestDateFeedback] = useState<'idle' | 'invalid' | 'saved'>(
    studyPlanTestDateIso ? 'saved' : 'idle',
  );
  const [busyProvider, setBusyProvider] = useState<AuthProviderId | null>(null);
  const [focusedGoalPreset, setFocusedGoalPreset] = useState<DailyGoalPresetValue | null>(null);
  const goalOptionRefs = useRef<Record<string, FocusableElement | null>>({});
  const copy = onboardingCopy[language];
  const selectedOnboardingGoal = isOnboardingDailyGoalPresetValue(dailyGoalAnswers)
    ? dailyGoalAnswers
    : onboardingDailyGoalPresetValues[0];
  const testDateFeedbackText =
    testDateFeedback === 'invalid'
      ? copy.testDateInvalid
      : testDateFeedback === 'saved' && studyPlanTestDateIso
        ? copy.testDateSaved(formatExamDate(new Date(studyPlanTestDateIso), language))
        : null;

  useEffect(() => {
    if (!studyPlanTestDateIso) return;

    setTestDateInput(studyPlanTestDateIso.slice(0, 10));
    setTestDateFeedback('saved');
  }, [studyPlanTestDateIso]);

  const handleDailyGoalPress = (goal: DailyGoalPresetValue) => {
    setDailyGoalAnswers(goal);
    setStudyPlanIntensity(studyIntensityForDailyGoal(goal));
  };

  const handleDailyGoalKeyDown = (event: KeyboardEventLike) => {
    const direction = getRadioArrowDirection(event);
    if (!direction || onboardingDailyGoalPresetValues.length === 0) return;

    event.preventDefault?.();
    const currentIndex = onboardingDailyGoalPresetValues.findIndex(
      (goal) => goal === selectedOnboardingGoal,
    );
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + direction + onboardingDailyGoalPresetValues.length) %
          onboardingDailyGoalPresetValues.length
        : direction > 0
          ? 0
          : onboardingDailyGoalPresetValues.length - 1;
    const nextGoal = onboardingDailyGoalPresetValues[nextIndex];

    handleDailyGoalPress(nextGoal);
    goalOptionRefs.current[String(nextGoal)]?.focus?.();
  };

  const getDailyGoalWebRadioProps = (goal: DailyGoalPresetValue): WebRadioKeyboardProps =>
    Platform.OS === 'web'
      ? {
          onKeyDown: handleDailyGoalKeyDown,
          tabIndex: selectedOnboardingGoal === goal ? 0 : -1,
        }
      : {};

  const handleTestDateChange = (value: string) => {
    const nextValue = value.replace(/[^\d-]/g, '').slice(0, 10);
    setTestDateInput(nextValue);

    if (!nextValue) {
      setStudyPlanTestDateIso(null);
      setTestDateFeedback('idle');
      return;
    }

    const normalizedDate = normalizeStudyPlanTestDateIso(nextValue);
    if (normalizedDate) {
      setStudyPlanTestDateIso(normalizedDate);
      setTestDateFeedback('saved');
      return;
    }

    setTestDateFeedback(nextValue.length >= 10 ? 'invalid' : 'idle');
  };

  const handleSkipTestDate = () => {
    setTestDateInput('');
    setStudyPlanTestDateIso(null);
    setTestDateFeedback('idle');
  };

  const handleAuthChoice = (provider: AuthProviderId) => async () => {
    setBusyProvider(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithApple();
    } catch (error) {
      Alert.alert(
        language === 'sv' ? 'Inloggning inte tillgänglig' : 'Sign-in unavailable',
        error instanceof Error ? error.message : copy.authUnavailable,
      );
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero} testID="onboarding-hero">
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>

      <View style={styles.steps}>
        {copy.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.accountSection} testID="onboarding-account-section">
        <Text accessibilityRole="header" style={styles.goalTitle}>
          {copy.authTitle}
        </Text>
        <Text style={styles.goalSubtitle}>{copy.authBody}</Text>
        {!isAuthConfigured ? <Text style={styles.authStatus}>{copy.authUnavailable}</Text> : null}
        <View style={styles.accountButtons}>
          <AuthProviderButton
            disabled={busyProvider !== null}
            icon={<GoogleLogo />}
            label={copy.authGoogle}
            onPress={handleAuthChoice('google')}
            testID="onboarding-google"
          />
          <AuthProviderButton
            disabled={busyProvider !== null}
            label={copy.authApple}
            onPress={handleAuthChoice('apple')}
            testID="onboarding-apple"
          />
          <RouteLink
            accessibilityLabel={copy.authWithoutAccountAccessibilityLabel}
            href="/home"
            style={styles.accountSkipLink}
            variant="secondary"
          >
            {copy.authWithoutAccount}
          </RouteLink>
        </View>
      </View>

      <View style={styles.goalSection} testID="onboarding-goal-section">
        <Text accessibilityRole="header" style={styles.goalTitle}>
          {copy.dailyGoalTitle}
        </Text>
        <Text style={styles.goalSubtitle}>{copy.dailyGoalSubtitle}</Text>
        <View
          aria-label={copy.dailyGoalTitle}
          accessibilityLabel={copy.dailyGoalTitle}
          accessibilityRole="radiogroup"
          style={styles.goalPresetGrid}
        >
          {onboardingDailyGoalPresetValues.map((goal) => {
            const preset = copy.dailyGoalPresets[goal];
            const selected = dailyGoalAnswers === goal;

            return (
              <Pressable
                key={goal}
                aria-checked={selected}
                accessibilityLabel={preset.accessibilityLabel}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                hitSlop={space[1]}
                onBlur={() => setFocusedGoalPreset(null)}
                onFocus={() => setFocusedGoalPreset(goal)}
                onPress={() => handleDailyGoalPress(goal)}
                ref={(node) => {
                  goalOptionRefs.current[String(goal)] = node as FocusableElement | null;
                }}
                style={({ pressed }) => [
                  styles.goalPreset,
                  selected ? styles.goalPresetActive : null,
                  focusedGoalPreset === goal ? styles.goalPresetFocused : null,
                  pressed ? styles.goalPresetPressed : null,
                ]}
                {...getDailyGoalWebRadioProps(goal)}
              >
                <Text
                  style={[styles.goalPresetLabel, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[styles.goalPresetSummary, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.summary}
                </Text>
                <Text
                  style={[styles.goalPresetHelper, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.helper}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <RouteLink
          accessibilityLabel={copy.decideLaterAccessibilityLabel}
          href="/home"
          style={styles.decideLaterLink}
          variant="text"
        >
          {copy.decideLater}
        </RouteLink>
      </View>

      <View style={styles.testDateSection} testID="onboarding-test-date-section">
        <Text accessibilityRole="header" style={styles.goalTitle}>
          {copy.testDateTitle}
        </Text>
        <Text style={styles.goalSubtitle}>{copy.testDateSubtitle}</Text>
        <TextInput
          accessibilityLabel={copy.testDateInputAccessibilityLabel}
          inputMode="numeric"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={handleTestDateChange}
          placeholder={copy.testDateInputPlaceholder}
          placeholderTextColor={themeColors.textMuted}
          style={styles.testDateInput}
          value={testDateInput}
        />
        {testDateFeedbackText ? (
          <Text style={styles.goalSubtitle}>{testDateFeedbackText}</Text>
        ) : null}
        <Pressable
          accessibilityLabel={copy.testDateSkipAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={space[1]}
          onPress={handleSkipTestDate}
          style={({ pressed }) => [
            styles.testDateSkipButton,
            pressed ? styles.goalPresetPressed : null,
          ]}
        >
          <Text style={styles.testDateSkipText}>{copy.testDateSkip}</Text>
        </Pressable>
      </View>

      <QuestionDisclaimer themeColors={themeColors} />
      <ComplianceLinks />

      <View style={styles.actions}>
        <RouteLink
          accessibilityLabel={copy.startStudyingAccessibilityLabel}
          href="/home"
          style={styles.primaryLink}
          variant="primary"
        >
          {copy.startStudying}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.adjustSettingsAccessibilityLabel}
          href="/settings"
          style={styles.secondaryLink}
          variant="secondary"
        >
          {copy.adjustSettings}
        </RouteLink>
      </View>
    </ScrollView>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: space[2.25],
      justifyContent: 'center',
      padding: space[3],
      paddingBottom: space[10],
    },
    hero: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: space.hairline,
      gap: space[1.25],
      padding: space[3],
    },
    eyebrow: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textTransform: 'uppercase',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.heroMobile.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
      lineHeight: typography.heroMobile.lineHeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    steps: {
      gap: space[1.5],
    },
    stepRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space[1.5],
    },
    stepNumber: {
      backgroundColor: themeColors.badgeBlueBg,
      borderRadius: radius.pill,
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      overflow: 'hidden',
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.75],
    },
    stepText: {
      color: themeColors.textSecondary,
      flex: 1,
      fontSize: typography.navButton.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
    goalSection: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    testDateSection: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    goalTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    goalSubtitle: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    goalPresetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    goalPreset: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexBasis: space[15],
      flexGrow: 1,
      gap: space[0.5],
      minHeight: space[10],
      padding: space[1.5],
    },
    goalPresetActive: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    goalPresetPressed: {
      borderColor: themeColors.focus,
    },
    goalPresetFocused: {
      borderColor: themeColors.focus,
    },
    goalPresetLabel: {
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    goalPresetSummary: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    goalPresetHelper: {
      color: themeColors.textMuted,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    goalPresetTextActive: {
      color: themeColors.badgeBlueText,
    },
    decideLaterLink: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      color: themeColors.textSecondary,
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
    testDateInput: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    testDateSkipButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    testDateSkipText: {
      color: themeColors.textSecondary,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1.5],
    },
    accountButtons: {
      gap: space[1],
    },
    accountSection: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    accountSkipLink: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
    authStatus: {
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      color: themeColors.warning,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      padding: space[1.25],
    },
    primaryLink: {
      alignItems: 'center',
      borderRadius: radius.micro,
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
    secondaryLink: {
      alignItems: 'center',
      borderRadius: radius.micro,
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
  });
}
