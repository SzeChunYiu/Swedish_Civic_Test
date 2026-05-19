import { StyleSheet, Text, View } from 'react-native';

import { RouteLink } from '../components/ui/RouteLink';
import { colors, space, typography } from '../lib/theme';

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
    <View style={styles.screen}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Question search is coming. For now, browse by chapter — each chapter groups its questions
        with explanations.
      </Text>
      <RouteLink accessibilityLabel="Browse chapters" href="/learn" variant="primary">
        Browse chapters
      </RouteLink>
      <RouteLink accessibilityLabel="Back to home" href="/(tabs)/home" variant="text">
        Back
      </RouteLink>
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
});
