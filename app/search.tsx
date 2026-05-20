import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { glossaryTerms } from '../data/glossary';
import { questions } from '../data/questions';
import {
  getQuestionSearchChapterName,
  getQuestionSearchExcerpt,
  getQuestionSearchTitle,
  searchQuestions,
} from '../lib/search/questionSearch';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';
import type { GlossaryTerm } from '../types/content';

type SearchRouteParams = {
  q?: string | string[];
  query?: string | string[];
};

export default function SearchScreen() {
  const searchParams = useLocalSearchParams<SearchRouteParams>();
  const routeQuery = getRouteSearchQuery(searchParams);
  const [query, setQuery] = useState(() => routeQuery);
  const language = useSettingsStore((state) => state.language);
  const copy = searchRouteCopy[language];
  const termsWithChapters = useMemo(
    () =>
      glossaryTerms.map((term) => ({
        term,
        chapter: chapters.find((chapter) => chapter.id === term.chapterId),
      })),
    [],
  );
  const trimmedQuery = query.trim();
  const filteredTerms = useMemo(() => {
    const normalizedQuery = normalizeSearchText(trimmedQuery);
    if (!normalizedQuery) return termsWithChapters;

    return termsWithChapters.filter(({ chapter, term }) =>
      glossaryTermMatchesQuery(term, chapter, normalizedQuery),
    );
  }, [termsWithChapters, trimmedQuery]);
  const questionResults = useMemo(() => {
    if (!trimmedQuery) return [];

    return searchQuestions({
      chapters,
      limit: 8,
      query: trimmedQuery,
      questions,
    });
  }, [trimmedQuery]);
  const resultSummary =
    trimmedQuery.length > 0
      ? copy.filteredSummary(filteredTerms.length, termsWithChapters.length, questionResults.length)
      : copy.allTermsSummary(termsWithChapters.length);
  const searchDescriptionId = 'search-route-glossary-description';

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <SectionHeader title={copy.sectionTitle} subtitle={copy.sectionSubtitle} />

      <Card>
        <Text nativeID={searchDescriptionId} style={styles.accessibilitySummaryText}>
          {copy.searchCardAccessibilityLabel}
        </Text>
        <Text accessibilityRole="header" style={styles.searchLabel}>
          {copy.searchLabel}
        </Text>
        <TextInput
          aria-describedby={searchDescriptionId}
          accessibilityHint={copy.searchCardAccessibilityLabel}
          accessibilityLabel={copy.searchInputAccessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder={copy.searchPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        <View style={styles.searchActions}>
          <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.resultSummary}>
            {resultSummary}
          </Text>
          <Button
            accessibilityLabel={copy.clearSearchAccessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: query.length === 0 }}
            disabled={query.length === 0}
            onPress={() => setQuery('')}
            variant="secondary"
          >
            {copy.clearSearch}
          </Button>
        </View>
      </Card>

      <View style={styles.termList}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map(({ chapter, term }) => {
            const primaryTerm = language === 'en' ? term.termEn : term.termSv;
            const secondaryTerm = language === 'en' ? term.termSv : term.termEn;
            const explanation = language === 'en' ? term.explanationEn : term.explanationSv;
            const chapterName = chapter
              ? language === 'en'
                ? chapter.nameEn
                : chapter.nameSv
              : undefined;
            const termSummary = copy.termAccessibilityLabel({
              chapterName,
              explanation,
              primaryTerm,
            });
            const termSummaryId = `search-term-summary-${term.id}`;

            return (
              <Card key={term.id} style={styles.termCard}>
                <Text nativeID={termSummaryId} style={styles.accessibilitySummaryText}>
                  {termSummary}
                </Text>
                <View style={styles.termHeader}>
                  <View style={styles.termTitleGroup}>
                    <Text accessibilityRole="header" style={styles.termTitle}>
                      {primaryTerm}
                    </Text>
                    <Text style={styles.termSubtitle}>{secondaryTerm}</Text>
                  </View>
                  {term.chapterId && chapterName ? (
                    <Link
                      aria-describedby={termSummaryId}
                      accessibilityLabel={copy.openChapterAccessibilityLabel(chapterName)}
                      accessibilityRole="link"
                      href={`/chapter/${term.chapterId}`}
                      style={styles.chapterLink}
                    >
                      {chapterName}
                    </Link>
                  ) : null}
                </View>
                <Text style={styles.explanation}>{explanation}</Text>
              </Card>
            );
          })
        ) : (
          <Card accessible accessibilityLabel={`${copy.emptyTitle}. ${copy.emptyBody}`}>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              {copy.emptyTitle}
            </Text>
            <Text style={styles.explanation}>{copy.emptyBody}</Text>
          </Card>
        )}
      </View>

      {trimmedQuery.length > 0 ? (
        <View style={styles.questionSection}>
          <View style={styles.inlineSectionHeader}>
            <Text accessibilityRole="header" style={styles.questionSectionTitle}>
              {copy.questionSectionTitle}
            </Text>
            <Text style={styles.questionSectionSubtitle}>
              {copy.questionSectionSubtitle(questionResults.length)}
            </Text>
          </View>

          <View style={styles.questionList}>
            {questionResults.length > 0 ? (
              questionResults.map((result) => {
                const title = getQuestionSearchTitle(result.question, language);
                const excerpt = getQuestionSearchExcerpt(result.question, language);
                const chapterName = getQuestionSearchChapterName(result.chapter, language);
                const sourceReference = [
                  result.question.uhrReference.chapter,
                  result.question.uhrReference.section,
                ]
                  .filter(Boolean)
                  .join(' · ');
                const questionSummary = copy.questionAccessibilityLabel({
                  chapterName,
                  excerpt,
                  sourceReference,
                  title,
                });
                const questionSummaryId = `search-question-summary-${result.question.id}`;

                return (
                  <Card key={result.question.id} style={styles.questionCard}>
                    <Text nativeID={questionSummaryId} style={styles.accessibilitySummaryText}>
                      {questionSummary}
                    </Text>
                    <View style={styles.questionHeader}>
                      <View style={styles.questionTitleGroup}>
                        <Text accessibilityRole="header" style={styles.questionTitle}>
                          {title}
                        </Text>
                        {chapterName ? (
                          <Text style={styles.questionMeta}>{chapterName}</Text>
                        ) : null}
                      </View>
                      <Link
                        aria-describedby={questionSummaryId}
                        accessibilityLabel={copy.openQuestionAccessibilityLabel(title)}
                        accessibilityRole="link"
                        href={`/quiz/${result.question.id}`}
                        style={styles.questionLink}
                      >
                        {copy.openQuestion}
                      </Link>
                    </View>
                    <Text style={styles.explanation}>{excerpt}</Text>
                    {sourceReference ? (
                      <Text style={styles.questionSource}>
                        {copy.sourceLabel}: {sourceReference}
                      </Text>
                    ) : null}
                  </Card>
                );
              })
            ) : (
              <Card
                accessible
                accessibilityLabel={`${copy.emptyQuestionTitle}. ${copy.emptyQuestionBody}`}
              >
                <Text accessibilityRole="header" style={styles.emptyTitle}>
                  {copy.emptyQuestionTitle}
                </Text>
                <Text style={styles.explanation}>{copy.emptyQuestionBody}</Text>
              </Card>
            )}
          </View>
        </View>
      ) : null}

      <Link
        accessibilityLabel={copy.browseChaptersAccessibilityLabel}
        accessibilityRole="link"
        href="/(tabs)/learn"
        style={styles.backLink}
      >
        {copy.browseChapters}
      </Link>
    </ScreenShell>
  );
}

type SearchRouteCopy = {
  allTermsSummary: (count: number) => string;
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  clearSearch: string;
  clearSearchAccessibilityLabel: string;
  emptyBody: string;
  emptyQuestionBody: string;
  emptyQuestionTitle: string;
  emptyTitle: string;
  eyebrow: string;
  filteredSummary: (
    visibleTermCount: number,
    totalTermCount: number,
    questionCount: number,
  ) => string;
  openChapterAccessibilityLabel: (chapterName: string) => string;
  openQuestion: string;
  openQuestionAccessibilityLabel: (title: string) => string;
  questionAccessibilityLabel: ({
    chapterName,
    excerpt,
    sourceReference,
    title,
  }: {
    chapterName: string;
    excerpt: string;
    sourceReference: string;
    title: string;
  }) => string;
  questionSectionSubtitle: (count: number) => string;
  questionSectionTitle: string;
  searchCardAccessibilityLabel: string;
  searchInputAccessibilityLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  sectionSubtitle: string;
  sectionTitle: string;
  sourceLabel: string;
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
    emptyQuestionBody: 'Inga källbaserade övningsfrågor matchar just nu.',
    emptyQuestionTitle: 'Inga frågor matchar sökningen',
    emptyTitle: 'Inga begrepp matchar din sökning',
    eyebrow: 'Sökbar referens',
    filteredSummary: (visibleTermCount, totalTermCount, questionCount) =>
      `${visibleTermCount} av ${totalTermCount} begrepp och ${questionCount} övningsfrågor matchar`,
    openChapterAccessibilityLabel: (chapterName) => `Öppna kapitlet ${chapterName}`,
    openQuestion: 'Öppna fråga',
    openQuestionAccessibilityLabel: (title) => `Öppna övningsfrågan: ${title}`,
    questionAccessibilityLabel: ({ chapterName, excerpt, sourceReference, title }) =>
      [
        title,
        excerpt,
        chapterName ? `Kapitel: ${chapterName}` : '',
        sourceReference ? `Källa: ${sourceReference}` : '',
      ]
        .filter(Boolean)
        .join('. '),
    questionSectionSubtitle: (count) =>
      count === 1
        ? '1 källbaserad övningsfråga matchar'
        : `${count} källbaserade övningsfrågor matchar`,
    questionSectionTitle: 'Övningsfrågor',
    searchCardAccessibilityLabel: 'Sök bland samhällsbegrepp, frågor och kapitelkopplingar',
    searchInputAccessibilityLabel: 'Sök samhällsbegrepp och övningsfrågor',
    searchLabel: 'Sök begrepp',
    searchPlaceholder: 'Sök demokrati, kommun, välfärd ...',
    sectionSubtitle:
      'Slå upp centrala ord och öppna kapitlet eller övningsfrågan där begreppet används.',
    sectionTitle: 'Begrepp och frågor',
    sourceLabel: 'Källa',
    subtitle:
      'En snabb sökning för centrala samhällsbegrepp, källbaserade frågor och förklaringar.',
    termAccessibilityLabel: ({ chapterName, explanation, primaryTerm }) =>
      chapterName
        ? `${primaryTerm}. ${explanation}. Kopplat kapitel: ${chapterName}.`
        : `${primaryTerm}. ${explanation}.`,
    title: 'Sök begrepp, frågor och förklaringar',
  },
  en: {
    allTermsSummary: (count) => `${count} civic reference terms`,
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Go to all chapters',
    clearSearch: 'Clear search',
    clearSearchAccessibilityLabel: 'Clear the search field',
    emptyBody: 'Try another word, authority, or chapter name.',
    emptyQuestionBody: 'No source-backed practice questions match right now.',
    emptyQuestionTitle: 'No questions match this search',
    emptyTitle: 'No terms match your search',
    eyebrow: 'Searchable reference',
    filteredSummary: (visibleTermCount, totalTermCount, questionCount) =>
      `${visibleTermCount} of ${totalTermCount} terms and ${questionCount} practice questions match`,
    openChapterAccessibilityLabel: (chapterName) => `Open the chapter ${chapterName}`,
    openQuestion: 'Open question',
    openQuestionAccessibilityLabel: (title) => `Open practice question: ${title}`,
    questionAccessibilityLabel: ({ chapterName, excerpt, sourceReference, title }) =>
      [
        title,
        excerpt,
        chapterName ? `Chapter: ${chapterName}` : '',
        sourceReference ? `Source: ${sourceReference}` : '',
      ]
        .filter(Boolean)
        .join('. '),
    questionSectionSubtitle: (count) =>
      count === 1
        ? '1 source-backed practice question matches'
        : `${count} source-backed practice questions match`,
    questionSectionTitle: 'Practice questions',
    searchCardAccessibilityLabel: 'Search civic reference terms, questions, and chapter links',
    searchInputAccessibilityLabel: 'Search civic terms and practice questions',
    searchLabel: 'Search terms',
    searchPlaceholder: 'Search democracy, municipality, welfare ...',
    sectionSubtitle:
      'Look up central words and open the chapter or practice question where the term appears.',
    sectionTitle: 'Civic terms and questions',
    sourceLabel: 'Source',
    subtitle: 'A quick search for key civic terms, source-backed questions, and explanations.',
    termAccessibilityLabel: ({ chapterName, explanation, primaryTerm }) =>
      chapterName
        ? `${primaryTerm}. ${explanation}. Linked chapter: ${chapterName}.`
        : `${primaryTerm}. ${explanation}.`,
    title: 'Search terms, questions, and explanations',
  },
};

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('sv')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  return typeof firstValue === 'string' ? firstValue : '';
}

function getRouteSearchQuery(params: SearchRouteParams) {
  return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);
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
  searchLabel: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  searchInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space[1],
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  searchActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
    marginTop: space[1.5],
  },
  resultSummary: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  accessibilitySummaryText: {
    height: space.hairline,
    left: -10000,
    overflow: 'hidden',
    position: 'absolute',
    width: space.hairline,
  },
  termList: {
    gap: space[1.5],
  },
  termCard: {
    gap: space[1.25],
  },
  termHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  termTitleGroup: {
    flex: 1,
    gap: space[0.5],
    minWidth: space[15],
  },
  termTitle: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    lineHeight: typography.subHeading.lineHeight,
  },
  termSubtitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  explanation: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  chapterLink: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    color: colors.text,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[5],
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  questionSection: {
    gap: space[1.5],
  },
  inlineSectionHeader: {
    gap: space[0.5],
  },
  questionSectionTitle: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    lineHeight: typography.subHeading.lineHeight,
  },
  questionSectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  questionList: {
    gap: space[1.5],
  },
  questionCard: {
    gap: space[1.25],
  },
  questionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  questionTitleGroup: {
    flex: 1,
    gap: space[0.5],
    minWidth: space[15],
  },
  questionTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  questionMeta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  questionSource: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  questionLink: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    color: colors.text,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[5],
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.75],
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
    color: colors.accent,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
});
