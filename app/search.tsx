import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/ui/Button';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { questions } from '../data/questions';
import type { QuestionSearchField, QuestionSearchResult } from '../lib/search/questionSearch';
import { searchQuestions } from '../lib/search/questionSearch';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, shadows, space, typography } from '../lib/theme';

type SearchCopy = {
  backHome: string;
  backHomeAccessibilityLabel: string;
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  emptyHint: string;
  emptyTitle: string;
  fieldLabels: Record<QuestionSearchField, string>;
  inputAccessibilityLabel: string;
  noResultsHint: string;
  noResultsTitle: string;
  placeholder: string;
  resultAccessibilityLabel: (result: QuestionSearchResult) => string;
  resultCount: (count: number) => string;
  resultsTitle: string;
  subtitle: string;
  title: string;
};

const svSearchFieldLabels: Record<QuestionSearchField, string> = {
  answer: 'Svarsalternativ',
  explanation: 'Förklaring',
  question: 'Fråga',
  source: 'Källa',
  tag: 'Ämne',
  translation: 'Översättning',
};

const enSearchFieldLabels: Record<QuestionSearchField, string> = {
  answer: 'Answer option',
  explanation: 'Explanation',
  question: 'Question',
  source: 'Source',
  tag: 'Topic',
  translation: 'Translation',
};

const searchCopy: Record<AppLanguage, SearchCopy> = {
  sv: {
    backHome: 'Tillbaka hem',
    backHomeAccessibilityLabel: 'Tillbaka till startsidan',
    browseChapters: 'Bläddra bland kapitel',
    browseChaptersAccessibilityLabel: 'Bläddra bland kapitel',
    emptyHint: 'Sök på ett begrepp, en plats, ett svarsalternativ eller en källrad.',
    emptyTitle: 'Skriv för att söka i frågebanken',
    fieldLabels: svSearchFieldLabels,
    inputAccessibilityLabel: 'Sök i frågor och svar',
    noResultsHint: 'Prova ett kortare ord eller bläddra via kapitlen.',
    noResultsTitle: 'Inga träffar ännu',
    placeholder: 'Sök efter demokrati, Östersjön, riksdag...',
    resultAccessibilityLabel: (result) =>
      `Öppna ${result.question.id}. ${result.questionText}. Träff i ${svSearchFieldLabels[result.field]}: ${result.matchedText}.`,
    resultCount: (count) => `${count} träff${count === 1 ? '' : 'ar'}`,
    resultsTitle: 'Sökresultat',
    subtitle: 'Hitta frågor efter begrepp, svarsalternativ, förklaringar och källhänvisningar.',
    title: 'Sök',
  },
  en: {
    backHome: 'Back home',
    backHomeAccessibilityLabel: 'Back to home',
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Browse chapters',
    emptyHint: 'Search for a concept, place, answer option, or source line.',
    emptyTitle: 'Type to search the question bank',
    fieldLabels: enSearchFieldLabels,
    inputAccessibilityLabel: 'Search questions and answers',
    noResultsHint: 'Try a shorter word or browse by chapter.',
    noResultsTitle: 'No matches yet',
    placeholder: 'Search democracy, Baltic Sea, parliament...',
    resultAccessibilityLabel: (result) =>
      `Open ${result.question.id}. ${result.questionText}. Match in ${enSearchFieldLabels[result.field]}: ${result.matchedText}.`,
    resultCount: (count) => `${count} result${count === 1 ? '' : 's'}`,
    resultsTitle: 'Search results',
    subtitle: 'Find questions by concept, answer option, explanation, and source citation.',
    title: 'Search',
  },
};

export default function SearchScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const copy = searchCopy[language];
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = useMemo(
    () => searchQuestions(questions, trimmedQuery, language, { limit: 10 }),
    [language, trimmedQuery],
  );

  const openQuestion = (result: QuestionSearchResult) => {
    router.push({
      pathname: '/quiz/[sessionId]',
      params: { sessionId: result.question.id },
    });
  };

  return (
    <ScreenShell title={copy.title} subtitle={copy.subtitle}>
      <View style={styles.searchPanel}>
        <TextInput
          accessibilityLabel={copy.inputAccessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <View style={styles.actions}>
          <Button
            accessibilityLabel={copy.browseChaptersAccessibilityLabel}
            accessibilityRole="button"
            onPress={() => router.push('/learn')}
            style={styles.actionButton}
            variant="secondary"
          >
            {copy.browseChapters}
          </Button>
          <Button
            accessibilityLabel={copy.backHomeAccessibilityLabel}
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/home')}
            style={styles.actionButton}
            variant="secondary"
          >
            {copy.backHome}
          </Button>
        </View>
      </View>

      {trimmedQuery ? (
        <View style={styles.resultsSection}>
          <SectionHeader title={copy.resultsTitle} subtitle={copy.resultCount(results.length)} />
          {results.length ? (
            <View style={styles.results}>
              {results.map((result) => (
                <Pressable
                  accessibilityLabel={copy.resultAccessibilityLabel(result)}
                  accessibilityRole="link"
                  hitSlop={space[0.5]}
                  key={result.question.id}
                  onPress={() => openQuestion(result)}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed ? styles.resultCardPressed : null,
                  ]}
                >
                  <Text style={styles.resultMeta}>
                    {result.question.id} · {copy.fieldLabels[result.field]}
                  </Text>
                  <Text accessibilityRole="header" style={styles.resultQuestion}>
                    {result.questionText}
                  </Text>
                  <Text style={styles.resultMatch}>{renderHighlightedParts(result)}</Text>
                  <Text style={styles.resultSource}>{result.sourceText}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text accessibilityRole="header" style={styles.emptyTitle}>
                {copy.noResultsTitle}
              </Text>
              <Text style={styles.emptyHint}>{copy.noResultsHint}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            {copy.emptyTitle}
          </Text>
          <Text style={styles.emptyHint}>{copy.emptyHint}</Text>
        </View>
      )}
    </ScreenShell>
  );
}

function renderHighlightedParts(result: QuestionSearchResult) {
  return result.highlightParts.map((part, index) => (
    <Text key={`${result.question.id}-${index}`} style={part.matched ? styles.highlight : null}>
      {part.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  searchPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
    ...shadows.card,
  },
  input: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  actionButton: {
    flexGrow: 1,
  },
  resultsSection: {
    gap: space[1.5],
  },
  results: {
    gap: space[1.25],
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    minHeight: space[8],
    padding: space[2],
    ...shadows.card,
  },
  resultCardPressed: {
    backgroundColor: colors.surfaceWarm,
    transform: [{ scale: motion.pressedScale }],
  },
  resultMeta: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textTransform: 'uppercase',
  },
  resultQuestion: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  resultMatch: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  highlight: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.text,
    fontWeight: typography.bodyBold.fontWeight,
  },
  resultSource: {
    color: colors.textDisclaimer,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    padding: space[2],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
