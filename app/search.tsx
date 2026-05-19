import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import {
  getQuestionSearchResultChapter,
  getQuestionSearchResultSnippet,
  getQuestionSearchResultTitle,
  searchQuestions,
} from '../lib/search/questionSearch';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../lib/theme';

type SearchCopy = {
  backToLearn: string;
  backToLearnAccessibilityLabel: string;
  chapterContext: (chapterName: string, questionId: string) => string;
  clearAccessibilityLabel: string;
  clearButton: string;
  emptyHint: string;
  emptyTitle: string;
  eyebrow: string;
  inputAccessibilityLabel: string;
  inputPlaceholder: string;
  noResultsBody: (query: string) => string;
  noResultsTitle: string;
  openChapterAccessibilityLabel: (chapterName: string) => string;
  openQuestionAccessibilityLabel: (questionTitle: string) => string;
  openQuestionLabel: string;
  resultCount: (count: number) => string;
  resultsTitle: string;
  subtitle: string;
  title: string;
};

const searchCopy: Record<AppLanguage, SearchCopy> = {
  sv: {
    backToLearn: 'Bläddra bland kapitel',
    backToLearnAccessibilityLabel: 'Bläddra bland alla kapitel',
    chapterContext: (chapterName, questionId) => `${chapterName} · ${questionId}`,
    clearAccessibilityLabel: 'Rensa sökningen',
    clearButton: 'Rensa',
    emptyHint: 'Prova till exempel riksdag, skatt, allemansrätten eller midsommar.',
    emptyTitle: 'Sök i frågebanken',
    eyebrow: 'Snabbsök',
    inputAccessibilityLabel: 'Sök efter frågor, svar, förklaringar, taggar eller kapitel',
    inputPlaceholder: 'Sök efter riksdag, skatt, midsommar...',
    noResultsBody: (query) =>
      `Inga frågor matchar "${query}". Testa ett kortare ord eller bläddra bland kapitlen.`,
    noResultsTitle: 'Inga träffar',
    openChapterAccessibilityLabel: (chapterName) => `Öppna kapitlet ${chapterName}`,
    openQuestionAccessibilityLabel: (questionTitle) => `Öppna quizfrågan: ${questionTitle}`,
    openQuestionLabel: 'Öva frågan',
    resultCount: (count) => `${count} träffar`,
    resultsTitle: 'Matchande frågor',
    subtitle: 'Hitta snabbt begrepp, svarsalternativ och förklaringar i den lokala frågebanken.',
    title: 'Sök frågor',
  },
  en: {
    backToLearn: 'Browse chapters',
    backToLearnAccessibilityLabel: 'Browse all chapters',
    chapterContext: (chapterName, questionId) => `${chapterName} · ${questionId}`,
    clearAccessibilityLabel: 'Clear search',
    clearButton: 'Clear',
    emptyHint: 'Try riksdag, tax, right of public access, or midsummer.',
    emptyTitle: 'Search the question bank',
    eyebrow: 'Quick search',
    inputAccessibilityLabel: 'Search questions, answers, explanations, tags, or chapters',
    inputPlaceholder: 'Search riksdag, tax, midsummer...',
    noResultsBody: (query) =>
      `No questions match "${query}". Try a shorter word or browse by chapter.`,
    noResultsTitle: 'No results',
    openChapterAccessibilityLabel: (chapterName) => `Open chapter ${chapterName}`,
    openQuestionAccessibilityLabel: (questionTitle) => `Open quiz question: ${questionTitle}`,
    openQuestionLabel: 'Practice question',
    resultCount: (count) => `${count} results`,
    resultsTitle: 'Matching questions',
    subtitle: 'Quickly find concepts, answer options, and explanations in the local question bank.',
    title: 'Search questions',
  },
};

export default function SearchScreen() {
  const language = useSettingsStore((state) => state.language);
  const copy = searchCopy[language];
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = useMemo(
    () => searchQuestions({ chapters, language, query: trimmedQuery, questions, limit: 12 }),
    [language, trimmedQuery],
  );
  const hasQuery = trimmedQuery.length > 0;

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <Card style={styles.searchCard}>
        <TextInput
          accessibilityLabel={copy.inputAccessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder={copy.inputPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {hasQuery ? (
          <Pressable
            accessibilityLabel={copy.clearAccessibilityLabel}
            accessibilityRole="button"
            onPress={() => setQuery('')}
            style={({ pressed }) => [styles.clearButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.clearButtonText}>{copy.clearButton}</Text>
          </Pressable>
        ) : null}
      </Card>

      <QuestionDisclaimer language={language} />

      {!hasQuery ? (
        <Card elevated style={styles.emptyCard}>
          <Badge tone="warm">{copy.emptyTitle}</Badge>
          <Text style={styles.emptyText}>{copy.emptyHint}</Text>
        </Card>
      ) : results.length === 0 ? (
        <Card elevated style={styles.emptyCard}>
          <Badge tone="orange">{copy.noResultsTitle}</Badge>
          <Text style={styles.emptyText}>{copy.noResultsBody(trimmedQuery)}</Text>
          <Link
            accessibilityLabel={copy.backToLearnAccessibilityLabel}
            accessibilityRole="link"
            href="/learn"
            style={styles.chapterFallbackLink}
          >
            {copy.backToLearn}
          </Link>
        </Card>
      ) : (
        <View style={styles.results}>
          <SectionHeader title={copy.resultsTitle} subtitle={copy.resultCount(results.length)} />
          {results.map((result) => {
            const title = getQuestionSearchResultTitle(result, language);
            const chapterName = getQuestionSearchResultChapter(result, language);
            const snippet = getQuestionSearchResultSnippet(result, language);

            return (
              <View key={result.question.id} style={styles.resultCard}>
                <Text style={styles.resultMeta}>
                  {copy.chapterContext(chapterName, result.question.id)}
                </Text>
                <Text style={styles.resultTitle}>{title}</Text>
                <Text numberOfLines={3} style={styles.resultSnippet}>
                  {snippet}
                </Text>
                <View style={styles.resultActions}>
                  <Link
                    accessibilityLabel={copy.openQuestionAccessibilityLabel(title)}
                    accessibilityRole="link"
                    href={{
                      pathname: '/quiz/[sessionId]',
                      params: { sessionId: result.question.id },
                    }}
                    style={styles.practiceLink}
                  >
                    {copy.openQuestionLabel}
                  </Link>
                  <Link
                    accessibilityLabel={copy.openChapterAccessibilityLabel(chapterName)}
                    accessibilityRole="link"
                    href={`/chapter/${result.chapter.id}`}
                    style={styles.chapterLink}
                  >
                    {chapterName}
                  </Link>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Link
        accessibilityLabel={copy.backToLearnAccessibilityLabel}
        accessibilityRole="link"
        href="/learn"
        style={styles.backLink}
      >
        {copy.backToLearn}
      </Link>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    gap: space[1],
    padding: space[1.5],
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: space[7],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  clearButtonText: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  emptyCard: {
    gap: space[1],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  results: {
    gap: space[1.5],
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1],
    padding: space[2],
  },
  resultMeta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  resultSnippet: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  resultActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  practiceLink: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    textDecorationLine: 'none',
  },
  chapterFallbackLink: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  chapterLink: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  backLink: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  pressed: {
    transform: [{ scale: motion.pressedScale }],
  },
});
