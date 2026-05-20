import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';
import type { GlossaryTerm } from '../types/content';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
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
    <View style={styles.screen}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Question search is coming. For now, browse by chapter — each chapter groups its questions
        with explanations.
      </Text>
      <Link
        accessibilityLabel="Browse chapters"
        accessibilityRole="link"
        href="/learn"
        style={styles.primaryButton}
      >
        Browse chapters
      </Link>
      <Link
        accessibilityLabel="Back to home"
        accessibilityRole="link"
        href="/(tabs)/home"
        style={styles.backLink}
      >
        Back
      </Link>
    </View>
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2],
    justifyContent: 'center',
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    maxWidth: 360,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  backLink: {
    color: colors.textMuted,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
});
