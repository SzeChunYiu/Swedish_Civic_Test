import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { glossaryTerms } from '../data/glossary';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';
import type { GlossaryTerm } from '../types/content';

type SearchQueryParams = {
  q?: string | string[];
  query?: string | string[];
};

export default function SearchScreen() {
  const searchParams = useLocalSearchParams<SearchQueryParams>();
  const [query, setQuery] = useState(() =>
    initialSearchQueryFromParams(searchParams.q, searchParams.query),
  );
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
  const resultSummary =
    trimmedQuery.length > 0
      ? copy.filteredSummary(filteredTerms.length, termsWithChapters.length)
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
  searchLabel: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  searchInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
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
