import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { ProvenanceBadge } from '../components/quiz/ProvenanceBadge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/Button';
import { RouteLink } from '../components/ui/RouteLink';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { glossaryTerms } from '../data/glossary';
import { questions } from '../data/questions';
import {
  getProvenanceDescription,
  getProvenanceLabel,
  getQuestionProvenance,
} from '../lib/content/provenance';
import { searchGlossary } from '../lib/learning/glossarySearch';
import {
  getQuestionSearchChapterName,
  getQuestionSearchExcerpt,
  getQuestionSearchTitle,
  searchQuestionsWithTotal,
} from '../lib/search/questionSearch';
import { useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colorsForThemeMode, radius, space, typography } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

type SearchRouteParams = {
  q?: string | string[];
  query?: string | string[];
};

function getQuestionResultHref(questionId: string, query: string): Href {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return `/quiz/${questionId}` as Href;

  return `/quiz/${questionId}?q=${encodeURIComponent(trimmedQuery)}` as Href;
}

export default function SearchScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<SearchRouteParams>();
  const routeQuery = getRouteSearchQuery(searchParams);
  const [query, setQuery] = useState(() => routeQuery);
  const previousRouteQueryRef = useRef(routeQuery);
  const systemColorScheme = useColorScheme();
  const language = useSettingsStore((state) => state.language);
  const themeMode = useAccessibilityStore((state) => state.themeMode);
  const themeColors = colorsForThemeMode(themeMode, systemColorScheme);
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = searchRouteCopy[language];
  useEffect(() => {
    if (previousRouteQueryRef.current === routeQuery) return;

    previousRouteQueryRef.current = routeQuery;
    setQuery(routeQuery);
  }, [routeQuery]);
  const handleClearSearch = () => {
    setQuery('');
    previousRouteQueryRef.current = '';

    if (routeQuery.length > 0) {
      router.replace('/search');
    }
  };
  const handleSubmitSearch = () => {
    const submittedQuery = query.trim();

    if (submittedQuery.length === 0) {
      handleClearSearch();
      return;
    }

    setQuery(submittedQuery);
    previousRouteQueryRef.current = submittedQuery;
    router.replace(`/search?q=${encodeURIComponent(submittedQuery)}`);
  };
  const trimmedQuery = query.trim();
  const filteredTerms = useMemo(
    () =>
      searchGlossary(trimmedQuery, language, glossaryTerms.length).map((term) => ({
        term,
        chapterName: language === 'en' ? term.chapterNameEn : term.chapterNameSv,
      })),
    [language, trimmedQuery],
  );
  const questionSearchResults = useMemo(() => {
    if (!trimmedQuery) return { results: [], totalCount: 0 };

    return searchQuestionsWithTotal({
      chapters,
      limit: 8,
      query: trimmedQuery,
      questions,
    });
  }, [trimmedQuery]);
  const questionResults = questionSearchResults.results;
  const totalQuestionMatches = questionSearchResults.totalCount;
  const resultSummary =
    trimmedQuery.length > 0
      ? copy.filteredSummary(filteredTerms.length, glossaryTerms.length, totalQuestionMatches)
      : copy.allTermsSummary(glossaryTerms.length);
  const searchDescriptionId = 'search-route-glossary-description';

  return (
    <ScreenShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      themeColors={themeColors}
    >
      <SectionHeader
        title={copy.sectionTitle}
        subtitle={copy.sectionSubtitle}
        themeColors={themeColors}
      />

      <Card themeColors={themeColors}>
        <Text
          nativeID={searchDescriptionId}
          style={styles.accessibilitySummaryText}
          testID="search-accessibility-summary-spacer"
        >
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
          onSubmitEditing={handleSubmitSearch}
          placeholder={copy.searchPlaceholder}
          placeholderTextColor={themeColors.textPlaceholder}
          returnKeyType="search"
          style={styles.searchInput}
          testID="search-input"
          value={query}
        />
        <View style={styles.searchActions}>
          <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.resultSummary}>
            {resultSummary}
          </Text>
          <View style={styles.searchButtonGroup}>
            <Button
              accessibilityLabel={copy.submitSearchAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: trimmedQuery.length === 0 }}
              disabled={trimmedQuery.length === 0}
              onPress={handleSubmitSearch}
              themeColors={themeColors}
            >
              {copy.submitSearch}
            </Button>
            <Button
              accessibilityLabel={copy.clearSearchAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: query.length === 0 }}
              disabled={query.length === 0}
              onPress={handleClearSearch}
              themeColors={themeColors}
              variant="secondary"
            >
              {copy.clearSearch}
            </Button>
          </View>
        </View>
      </Card>

      <View style={styles.termList}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map(({ chapterName, term }) => {
            const primaryTerm = language === 'en' ? term.termEn : term.termSv;
            const secondaryTerm = language === 'en' ? term.termSv : term.termEn;
            const explanation = language === 'en' ? term.explanationEn : term.explanationSv;
            const termSummary = copy.termAccessibilityLabel({
              chapterName,
              explanation,
              primaryTerm,
            });
            const termSummaryId = `search-term-summary-${term.id}`;

            return (
              <Card key={term.id} style={styles.termCard} themeColors={themeColors}>
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
                    <RouteLink
                      aria-describedby={termSummaryId}
                      accessibilityLabel={copy.openChapterAccessibilityLabel(chapterName)}
                      href={`/chapter/${term.chapterId}`}
                      style={[styles.searchRouteLink, styles.chapterLink]}
                      variant="secondary"
                    >
                      {chapterName}
                    </RouteLink>
                  ) : null}
                </View>
                <Text style={styles.explanation}>{explanation}</Text>
              </Card>
            );
          })
        ) : (
          <Card
            accessible
            accessibilityLabel={`${copy.emptyTitle}. ${copy.emptyBody}`}
            themeColors={themeColors}
          >
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
              {copy.questionSectionSubtitle(questionResults.length, totalQuestionMatches)}
            </Text>
          </View>

          <View style={styles.questionList}>
            {questionResults.length > 0 ? (
              questionResults.map((result) => {
                const title = getQuestionSearchTitle(result.question, language);
                const excerpt = getQuestionSearchExcerpt(result.question, language);
                const chapterName = getQuestionSearchChapterName(result.chapter, language);
                const provenance = getQuestionProvenance(result.question);
                const provenanceLabel = getProvenanceLabel(provenance, language);
                const provenanceDescription = getProvenanceDescription(provenance, language);
                const sourceReference = [
                  result.question.uhrReference.chapter,
                  result.question.uhrReference.section,
                ]
                  .filter(Boolean)
                  .join(' · ');
                const questionSummary = copy.questionAccessibilityLabel({
                  chapterName,
                  excerpt,
                  provenanceDescription,
                  provenanceLabel,
                  sourceReference,
                  title,
                });
                const questionSummaryId = `search-question-summary-${result.question.id}`;

                return (
                  <Card
                    key={result.question.id}
                    style={styles.questionCard}
                    themeColors={themeColors}
                  >
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
                      <RouteLink
                        aria-describedby={questionSummaryId}
                        accessibilityLabel={copy.openQuestionAccessibilityLabel(title)}
                        href={getQuestionResultHref(result.question.id, trimmedQuery)}
                        style={[styles.searchRouteLink, styles.questionLink]}
                        variant="secondary"
                      >
                        {copy.openQuestion}
                      </RouteLink>
                    </View>
                    <Text style={styles.explanation}>{excerpt}</Text>
                    <ProvenanceBadge
                      language={language}
                      question={result.question}
                      themeColors={themeColors}
                    />
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
                themeColors={themeColors}
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

      <RouteLink
        accessibilityLabel={copy.browseChaptersAccessibilityLabel}
        href="/(tabs)/learn"
        style={[styles.searchRouteLink, styles.backLink]}
        variant="text"
      >
        {copy.browseChapters}
      </RouteLink>
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
    provenanceDescription,
    provenanceLabel,
    sourceReference,
    title,
  }: {
    chapterName: string;
    excerpt: string;
    provenanceDescription: string;
    provenanceLabel: string;
    sourceReference: string;
    title: string;
  }) => string;
  questionSectionSubtitle: (visibleCount: number, totalCount: number) => string;
  questionSectionTitle: string;
  searchCardAccessibilityLabel: string;
  searchInputAccessibilityLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  sectionSubtitle: string;
  sectionTitle: string;
  sourceLabel: string;
  submitSearch: string;
  submitSearchAccessibilityLabel: string;
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
    questionAccessibilityLabel: ({
      chapterName,
      excerpt,
      provenanceDescription,
      provenanceLabel,
      sourceReference,
      title,
    }) =>
      [
        title,
        excerpt,
        chapterName ? `Kapitel: ${chapterName}` : '',
        `Källtyp: ${provenanceLabel}`,
        provenanceDescription,
        sourceReference ? `Källa: ${sourceReference}` : '',
      ]
        .filter(Boolean)
        .join('. '),
    questionSectionSubtitle: (visibleCount, totalCount) =>
      totalCount === 0
        ? '0 källbaserade övningsfrågor matchar'
        : totalCount === 1
          ? '1 källbaserad övningsfråga matchar'
          : visibleCount === totalCount
            ? `${totalCount} källbaserade övningsfrågor matchar`
            : `${visibleCount} av ${totalCount} källbaserade övningsfrågor visas`,
    questionSectionTitle: 'Övningsfrågor',
    searchCardAccessibilityLabel: 'Sök bland samhällsbegrepp, frågor och kapitelkopplingar',
    searchInputAccessibilityLabel: 'Sök samhällsbegrepp och övningsfrågor',
    searchLabel: 'Sök begrepp',
    searchPlaceholder: 'Sök demokrati, kommun, välfärd ...',
    sectionSubtitle:
      'Slå upp centrala ord och öppna kapitlet eller övningsfrågan där begreppet används.',
    sectionTitle: 'Begrepp och frågor',
    sourceLabel: 'Källa',
    submitSearch: 'Sök',
    submitSearchAccessibilityLabel: 'Sök med den inskrivna texten',
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
    questionAccessibilityLabel: ({
      chapterName,
      excerpt,
      provenanceDescription,
      provenanceLabel,
      sourceReference,
      title,
    }) =>
      [
        title,
        excerpt,
        chapterName ? `Chapter: ${chapterName}` : '',
        `Provenance: ${provenanceLabel}`,
        provenanceDescription,
        sourceReference ? `Source: ${sourceReference}` : '',
      ]
        .filter(Boolean)
        .join('. '),
    questionSectionSubtitle: (visibleCount, totalCount) =>
      totalCount === 0
        ? '0 source-backed practice questions match'
        : totalCount === 1
          ? '1 source-backed practice question matches'
          : visibleCount === totalCount
            ? `${totalCount} source-backed practice questions match`
            : `${visibleCount} of ${totalCount} source-backed practice questions shown`,
    questionSectionTitle: 'Practice questions',
    searchCardAccessibilityLabel: 'Search civic reference terms, questions, and chapter links',
    searchInputAccessibilityLabel: 'Search civic terms and practice questions',
    searchLabel: 'Search terms',
    searchPlaceholder: 'Search democracy, municipality, welfare ...',
    sectionSubtitle:
      'Look up central words and open the chapter or practice question where the term appears.',
    sectionTitle: 'Civic terms and questions',
    sourceLabel: 'Source',
    submitSearch: 'Search',
    submitSearchAccessibilityLabel: 'Submit the typed search',
    subtitle: 'A quick search for key civic terms, source-backed questions, and explanations.',
    termAccessibilityLabel: ({ chapterName, explanation, primaryTerm }) =>
      chapterName
        ? `${primaryTerm}. ${explanation}. Linked chapter: ${chapterName}.`
        : `${primaryTerm}. ${explanation}.`,
    title: 'Search terms, questions, and explanations',
  },
};

function getFirstSearchParamValue(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  return typeof firstValue === 'string' ? firstValue : '';
}

function getRouteSearchQuery(params: SearchRouteParams) {
  return getFirstSearchParamValue(params.q) || getFirstSearchParamValue(params.query);
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    searchRouteLink: {
      borderRadius: radius.pill,
      minWidth: space[6],
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.75],
    },
    searchLabel: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    searchInput: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.input,
      borderWidth: space.hairline,
      color: themeColors.text,
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
    searchButtonGroup: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'flex-end',
      minWidth: space[15],
    },
    resultSummary: {
      color: themeColors.textMuted,
      flexShrink: 1,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      minWidth: space[15],
    },
    accessibilitySummaryText: {
      height: space.divider,
      left: -10000,
      overflow: 'hidden',
      position: 'absolute',
      width: space.divider,
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
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.subHeading.fontWeight,
      lineHeight: typography.subHeading.lineHeight,
    },
    termSubtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    explanation: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    chapterLink: {
      borderColor: themeColors.focus,
      color: themeColors.text,
      fontFamily: typography.navButton.fontFamily,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    questionSection: {
      gap: space[1.5],
    },
    inlineSectionHeader: {
      gap: space[0.5],
    },
    questionSectionTitle: {
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.subHeading.fontWeight,
      lineHeight: typography.subHeading.lineHeight,
    },
    questionSectionSubtitle: {
      color: themeColors.textSecondary,
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
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    questionMeta: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    questionSource: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    questionLink: {
      borderColor: themeColors.accent,
      color: themeColors.text,
      fontFamily: typography.navButton.fontFamily,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    emptyTitle: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      marginBottom: space[1],
    },
    backLink: {
      alignSelf: 'flex-start',
      color: themeColors.accent,
      fontFamily: typography.navButton.fontFamily,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
  });
}
