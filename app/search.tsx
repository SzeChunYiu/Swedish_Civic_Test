import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { questions } from '../data/questions';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../lib/theme';
import type { PracticeQuestion } from '../types/content';

type StarterQuery = {
  label: string;
  query: string;
};

type SearchCopy = {
  backHome: string;
  backHomeAccessibilityLabel: string;
  emptyHelper: string;
  inputAccessibilityLabel: string;
  noResults: (query: string) => string;
  openQuestion: string;
  placeholder: string;
  resultCount: (count: number) => string;
  sourceLabel: (chapter: string, section: string) => string;
  starterHeading: string;
  subtitle: string;
  title: string;
};

const starterQueryChips: Record<AppLanguage, StarterQuery[]> = {
  sv: [
    { label: 'Riksdagen', query: 'riksdag' },
    { label: 'Allemansrätten', query: 'allemansrätten' },
    { label: 'Midsommar', query: 'midsommar' },
    { label: 'Folkomröstning', query: 'folkomröstning' },
  ],
  en: [
    { label: 'Riksdag', query: 'riksdag' },
    { label: 'Right of public access', query: 'right of public access' },
    { label: 'Midsummer', query: 'midsummer' },
    { label: 'Referendum', query: 'referendum' },
  ],
};

const searchCopy: Record<AppLanguage, SearchCopy> = {
  sv: {
    backHome: 'Tillbaka hem',
    backHomeAccessibilityLabel: 'Tillbaka till startsidan',
    emptyHelper: 'Sök i frågor, svarsalternativ, förklaringar, taggar och UHR-källor.',
    inputAccessibilityLabel: 'Sök bland frågor',
    noResults: (query) => `Inga frågor matchar "${query}". Prova ett förslag.`,
    openQuestion: 'Öppna fråga',
    placeholder: 'Sök till exempel riksdag eller midsommar',
    resultCount: (count) => `${count} matchande frågor`,
    sourceLabel: (chapter, section) => `Källa: ${chapter}, ${section}`,
    starterHeading: 'Snabba sökningar',
    subtitle: 'Hitta frågor snabbt och öppna dem direkt som ett quizpass.',
    title: 'Sök frågor',
  },
  en: {
    backHome: 'Back home',
    backHomeAccessibilityLabel: 'Back to home',
    emptyHelper: 'Search questions, answer options, explanations, tags, and UHR sources.',
    inputAccessibilityLabel: 'Search questions',
    noResults: (query) => `No questions match "${query}". Try a suggestion.`,
    openQuestion: 'Open question',
    placeholder: 'Try riksdag or midsummer',
    resultCount: (count) => `${count} matching questions`,
    sourceLabel: (chapter, section) => `Source: ${chapter}, ${section}`,
    starterHeading: 'Quick searches',
    subtitle: 'Find questions quickly and open them directly as a quiz session.',
    title: 'Search questions',
  },
};

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function questionSearchFields(question: PracticeQuestion): string[] {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.uhrReference.chapter,
    question.uhrReference.section,
    ...question.options.flatMap((option) => [option.textSv, option.textEn]),
    ...question.tags,
  ];
}

function searchQuestions(query: string): PracticeQuestion[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return [];

  return questions
    .filter((question) =>
      questionSearchFields(question).some((field) =>
        normalizeSearchText(field).includes(normalizedQuery),
      ),
    )
    .slice(0, 10);
}

function getQuestionTitle(question: PracticeQuestion, language: AppLanguage): string {
  return language === 'sv' ? question.questionSv : question.questionEn;
}

function getQuestionPreview(question: PracticeQuestion, language: AppLanguage): string {
  return language === 'sv' ? question.explanationSv : question.explanationEn;
}

export default function SearchScreen() {
  const language = useSettingsStore((state) => state.language);
  const copy = searchCopy[language];
  const chips = starterQueryChips[language];
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = useMemo(() => searchQuestions(query), [query]);
  const hasQuery = trimmedQuery.length > 0;
  const showSuggestions = !hasQuery || results.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>

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

        {showSuggestions ? (
          <View style={styles.suggestions}>
            <Text accessibilityRole="header" style={styles.suggestionTitle}>
              {copy.starterHeading}
            </Text>
            <Text style={styles.helperText}>
              {hasQuery ? copy.noResults(trimmedQuery) : copy.emptyHelper}
            </Text>
            <View style={styles.chipRow}>
              {chips.map((chip) => (
                <Pressable
                  key={chip.query}
                  accessibilityLabel={chip.label}
                  accessibilityRole="button"
                  onPress={() => setQuery(chip.query)}
                  style={({ pressed }) => [
                    styles.queryChip,
                    pressed ? styles.queryChipPressed : null,
                  ]}
                >
                  <Text style={styles.queryChipText}>{chip.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {results.length > 0 ? (
        <View style={styles.results}>
          <Text accessibilityRole="header" style={styles.resultsTitle}>
            {copy.resultCount(results.length)}
          </Text>
          {results.map((question) => (
            <View key={question.id} style={styles.resultCard}>
              <Text style={styles.resultId}>{question.id}</Text>
              <Text style={styles.resultQuestion}>{getQuestionTitle(question, language)}</Text>
              <Text numberOfLines={2} style={styles.resultPreview}>
                {getQuestionPreview(question, language)}
              </Text>
              <Text style={styles.resultSource}>
                {copy.sourceLabel(question.uhrReference.chapter, question.uhrReference.section)}
              </Text>
              <Link
                accessibilityLabel={`${copy.openQuestion}: ${getQuestionTitle(question, language)}`}
                accessibilityRole="link"
                href={`/quiz/${question.id}`}
                style={styles.resultLink}
              >
                {copy.openQuestion}
              </Link>
            </View>
          ))}
        </View>
      ) : null}

      <Link
        accessibilityLabel={copy.backHomeAccessibilityLabel}
        accessibilityRole="link"
        href="/(tabs)/home"
        style={styles.backLink}
      >
        {copy.backHome}
      </Link>
    </ScrollView>
  );
}

type SearchRouteCopy = {
  allTermsSummary: (count: number) => string;
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  clearSearch: string;
  clearSearchAccessibilityLabel: string;
  emptyBody: string;
  emptyTitle: string;
  eyebrow: string;
  filteredSummary: (visibleCount: number, totalCount: number) => string;
  openChapterAccessibilityLabel: (chapterName: string) => string;
  searchCardAccessibilityLabel: string;
  searchInputAccessibilityLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  sectionSubtitle: string;
  sectionTitle: string;
  subtitle: string;
  termAccessibilityLabel: ({
    chapterName,
    explanation,
    primaryTerm,
  }: {
    chapterName?: string;
    explanation: string;
    primaryTerm: string;
  }) => string;
  title: string;
};

const searchRouteCopy: Record<AppLanguage, SearchRouteCopy> = {
  sv: {
    allTermsSummary: (count) => `${count} samhällsbegrepp i referensen`,
    browseChapters: 'Bläddra bland kapitel',
    browseChaptersAccessibilityLabel: 'Gå till alla kapitel',
    clearSearch: 'Rensa sökning',
    clearSearchAccessibilityLabel: 'Rensa sökfältet',
    emptyBody: 'Prova ett annat ord, en myndighet eller ett kapitelnamn.',
    emptyTitle: 'Inga begrepp matchar din sökning',
    eyebrow: 'Sökbar referens',
    filteredSummary: (visibleCount, totalCount) =>
      `${visibleCount} av ${totalCount} samhällsbegrepp visas`,
    openChapterAccessibilityLabel: (chapterName) => `Öppna kapitlet ${chapterName}`,
    searchCardAccessibilityLabel: 'Sök bland samhällsbegrepp och kapitelkopplingar',
    searchInputAccessibilityLabel: 'Sök samhällsbegrepp',
    searchLabel: 'Sök begrepp',
    searchPlaceholder: 'Sök demokrati, kommun, välfärd ...',
    sectionSubtitle: 'Slå upp centrala ord och öppna kapitlet där begreppet används i frågebanken.',
    sectionTitle: 'Begreppsreferens',
    subtitle:
      'En snabb ordlista för centrala samhällsbegrepp, med svenska och engelska förklaringar.',
    termAccessibilityLabel: ({ chapterName, explanation, primaryTerm }) =>
      chapterName
        ? `${primaryTerm}. ${explanation}. Kopplat kapitel: ${chapterName}.`
        : `${primaryTerm}. ${explanation}.`,
    title: 'Sök begrepp, kapitel och förklaringar',
  },
  en: {
    allTermsSummary: (count) => `${count} civic reference terms`,
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Go to all chapters',
    clearSearch: 'Clear search',
    clearSearchAccessibilityLabel: 'Clear the search field',
    emptyBody: 'Try another word, authority, or chapter name.',
    emptyTitle: 'No terms match your search',
    eyebrow: 'Searchable reference',
    filteredSummary: (visibleCount, totalCount) =>
      `${visibleCount} of ${totalCount} civic reference terms shown`,
    openChapterAccessibilityLabel: (chapterName) => `Open the chapter ${chapterName}`,
    searchCardAccessibilityLabel: 'Search civic reference terms and chapter links',
    searchInputAccessibilityLabel: 'Search civic terms',
    searchLabel: 'Search terms',
    searchPlaceholder: 'Search democracy, municipality, welfare ...',
    sectionSubtitle:
      'Look up central words and open the chapter where the term appears in the question bank.',
    sectionTitle: 'Civic reference terms',
    subtitle: 'A quick glossary for key civic terms, with Swedish and English explanations.',
    termAccessibilityLabel: ({ chapterName, explanation, primaryTerm }) =>
      chapterName
        ? `${primaryTerm}. ${explanation}. Linked chapter: ${chapterName}.`
        : `${primaryTerm}. ${explanation}.`,
    title: 'Search terms, chapters, and explanations',
  },
};

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('sv')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

type SearchParamValue = string | string[] | undefined;

function initialSearchQueryFromParams(q: SearchParamValue, query: SearchParamValue) {
  return firstSearchParamValue(q) || firstSearchParamValue(query);
}

function firstSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    const firstTextValue = value.find((item) => item.trim().length > 0);

    return firstTextValue?.trim() ?? '';
  }

  return value?.trim() ?? '';
}

function glossaryTermMatchesQuery(
  term: GlossaryTerm,
  chapter: (typeof chapters)[number] | undefined,
  normalizedQuery: string,
) {
  const searchableText = [
    term.termSv,
    term.termEn,
    term.explanationSv,
    term.explanationEn,
    chapter?.nameSv,
    chapter?.nameEn,
  ]
    .filter(Boolean)
    .map((value) => normalizeSearchText(String(value)))
    .join(' ');

  return searchableText.includes(normalizedQuery);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: space[3],
    padding: space[3],
    paddingBottom: space[10],
  },
  hero: {
    gap: space[1],
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    lineHeight: typography.subHeading.lineHeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    maxWidth: 560,
  },
  searchPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[2],
    padding: space[2],
  },
  input: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    color: colors.text,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  suggestions: {
    gap: space[1],
  },
  suggestionTitle: {
    color: colors.text,
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  helperText: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  queryChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  queryChipPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  queryChipText: {
    color: colors.textSoft,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  results: {
    gap: space[1.5],
  },
  resultsTitle: {
    color: colors.text,
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.75],
    padding: space[2],
  },
  resultId: {
    color: colors.badgeBlueText,
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  resultQuestion: {
    color: colors.text,
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  resultPreview: {
    color: colors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  resultSource: {
    color: colors.textMuted,
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
  },
  resultLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: space[1],
  },
  backLink: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
});
