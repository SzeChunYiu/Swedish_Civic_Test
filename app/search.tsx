import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import {
  getQuestionSearchChapterName,
  getQuestionSearchExcerpt,
  getQuestionSearchTitle,
  searchQuestions,
} from '../lib/search/questionSearch';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../lib/theme';

type StarterQuery = {
  label: string;
  query: string;
};

type SearchCopy = {
  backAccessibilityLabel: string;
  backToHome: string;
  chapterLink: string;
  emptyHelper: string;
  inputAccessibilityLabel: string;
  noResults: (query: string) => string;
  placeholder: string;
  quickSearches: string;
  resultCount: (count: number) => string;
  resultQuestionAccessibilityLabel: (questionId: string) => string;
  searchHint: string;
  sourceLabel: (chapter: string, section: string) => string;
  title: string;
};

const starterQueryChips: Record<AppLanguage, StarterQuery[]> = {
  sv: [
    { label: 'Riksdagen', query: 'riksdagen' },
    { label: 'Midsommar', query: 'midsommar' },
    { label: 'Folkomröstning', query: 'folkomröstning' },
  ],
  en: [
    { label: 'Parliament', query: 'parliament' },
    { label: 'Right of public access', query: 'right of public access' },
    { label: 'Midsummer', query: 'midsummer' },
    { label: 'Referendum', query: 'referendum' },
  ],
};

const searchCopy: Record<AppLanguage, SearchCopy> = {
  sv: {
    backAccessibilityLabel: 'Tillbaka till startsidan',
    backToHome: 'Tillbaka',
    chapterLink: 'Öppna kapitel',
    emptyHelper: 'Sök efter frågor, svar, förklaringar, taggar eller kapitel.',
    inputAccessibilityLabel: 'Sök i frågebanken',
    noResults: (query) => `Inga resultat för ${query}. Prova ett annat ord.`,
    placeholder: 'Sök frågor',
    quickSearches: 'Snabba sökningar',
    resultCount: (count) => `${count} resultat`,
    resultQuestionAccessibilityLabel: (questionId) => `Öppna fråga ${questionId}`,
    searchHint: 'Sök lokalt i frågebanken och öppna en fråga eller ett kapitel.',
    sourceLabel: (chapter, section) => `${chapter} · ${section}`,
    title: 'Sök frågor',
  },
  en: {
    backAccessibilityLabel: 'Back to home',
    backToHome: 'Back',
    chapterLink: 'Open chapter',
    emptyHelper: 'Search questions, answers, explanations, tags, or chapters.',
    inputAccessibilityLabel: 'Search the question bank',
    noResults: (query) => `No results for ${query}. Try another word.`,
    placeholder: 'Search questions',
    quickSearches: 'Quick searches',
    resultCount: (count) => `${count} result${count === 1 ? '' : 's'}`,
    resultQuestionAccessibilityLabel: (questionId) => `Open question ${questionId}`,
    searchHint: 'Search locally in the question bank and open a question or chapter.',
    sourceLabel: (chapter, section) => `${chapter} · ${section}`,
    title: 'Search questions',
  },
};

export default function SearchScreen() {
  const language = useSettingsStore((state) => state.language);
  const [query, setQuery] = useState('');
  const copy = searchCopy[language];
  const chips = starterQueryChips[language];
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const results = useMemo(
    () => searchQuestions({ chapters, query: trimmedQuery, questions }),
    [trimmedQuery],
  );
  const showSuggestions = !hasQuery || results.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel={copy.backAccessibilityLabel}
        accessibilityRole="link"
        href="/(tabs)/home"
        style={styles.backLink}
      >
        ← {copy.backToHome}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.subtitle}>{copy.searchHint}</Text>
      <TextInput
        accessibilityLabel={copy.inputAccessibilityLabel}
        onChangeText={setQuery}
        placeholder={copy.placeholder}
        placeholderTextColor={colors.textPlaceholder}
        style={styles.input}
        value={query}
      />

      <View style={styles.quickSearchSection}>
        <Text style={styles.quickSearchTitle}>{copy.quickSearches}</Text>
        <View style={styles.queryChips}>
          {chips.map((chip) => (
            <Pressable
              accessibilityLabel={chip.label}
              accessibilityRole="button"
              hitSlop={space[1]}
              key={chip.query}
              onPress={() => setQuery(chip.query)}
              style={({ pressed }) => [styles.queryChip, pressed ? styles.queryChipPressed : null]}
            >
              <Text style={styles.queryChipText}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {showSuggestions ? (
        <Text style={styles.resultSummary}>
          {hasQuery ? copy.noResults(trimmedQuery) : copy.emptyHelper}
        </Text>
      ) : null}
      {hasQuery && results.length > 0 ? (
        <Text style={styles.resultCount}>{copy.resultCount(results.length)}</Text>
      ) : null}

      <View style={styles.results}>
        {results.map(({ chapter, question }) => (
          <View key={question.id} style={styles.resultCard}>
            <Text style={styles.resultMeta}>{question.id}</Text>
            <Link
              accessibilityLabel={copy.resultQuestionAccessibilityLabel(question.id)}
              accessibilityRole="link"
              href={`/quiz/${question.id}`}
              style={styles.resultTitle}
            >
              {getQuestionSearchTitle(question, language)}
            </Link>
            <Text numberOfLines={2} style={styles.resultExcerpt}>
              {getQuestionSearchExcerpt(question, language)}
            </Text>
            <Text style={styles.resultSource}>
              {copy.sourceLabel(question.uhrReference.chapter, question.uhrReference.section)}
            </Text>
            {chapter ? (
              <Link
                accessibilityLabel={`${copy.chapterLink}: ${getQuestionSearchChapterName(
                  chapter,
                  language,
                )}`}
                accessibilityRole="link"
                href={`/chapter/${chapter.id}`}
                style={styles.chapterLink}
              >
                {copy.chapterLink}: {getQuestionSearchChapterName(chapter, language)}
              </Link>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2],
    padding: space[3],
  },
  backLink: {
    color: colors.textMuted,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  title: {
    color: colors.text,
    fontFamily: typography.sectionHeading.fontFamily,
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  quickSearchSection: {
    gap: space[1],
  },
  quickSearchTitle: {
    color: colors.text,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  queryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  queryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
  },
  queryChipPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  queryChipText: {
    color: colors.text,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  resultSummary: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  resultCount: {
    color: colors.text,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  results: {
    gap: space[1.5],
  },
  resultCard: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    padding: space[2],
  },
  resultMeta: {
    color: colors.textMuted,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
  },
  resultTitle: {
    color: colors.accent,
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    textDecorationLine: 'none',
  },
  resultExcerpt: {
    color: colors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  resultSource: {
    color: colors.textMuted,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
  },
  chapterLink: {
    color: colors.accent,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
