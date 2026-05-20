import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import {
  getGlossaryChapterLabel,
  searchGlossary,
  type GlossarySearchResult,
} from '../lib/learning/glossarySearch';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type SearchCopy = {
  backHome: string;
  backHomeAccessibilityLabel: string;
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  emptyText: string;
  emptyTitle: string;
  eyebrow: string;
  inputAccessibilityHint: string;
  inputAccessibilityLabel: string;
  placeholder: string;
  resultAccessibilityLabel: (term: string, chapter: string) => string;
  resultCount: (count: number) => string;
  resultSectionSubtitle: string;
  resultSectionTitle: string;
  sourcePrefix: string;
  subtitle: string;
  termBadge: string;
  title: string;
};

const searchCopy: Record<AppLanguage, SearchCopy> = {
  sv: {
    backHome: 'Tillbaka hem',
    backHomeAccessibilityLabel: 'Gå tillbaka till startsidan',
    browseChapters: 'Bläddra bland kapitel',
    browseChaptersAccessibilityLabel: 'Bläddra bland alla kapitel',
    emptyText: 'Prova ett annat samhällsbegrepp eller bläddra via kapitel.',
    emptyTitle: 'Inga begrepp hittades',
    eyebrow: 'Begrepp och sök',
    inputAccessibilityHint: 'Sök bland samhällsbegrepp på svenska eller engelska.',
    inputAccessibilityLabel: 'Sök begrepp',
    placeholder: 'Sök begrepp, till exempel riksdag',
    resultAccessibilityLabel: (term, chapter) => `Öppna kapitlet ${chapter} för begreppet ${term}.`,
    resultCount: (count) => `${count} begrepp`,
    resultSectionSubtitle:
      'Varje träff pekar till kapitlet där begreppet hör hemma i UHR-materialet.',
    resultSectionTitle: 'Ordlisteträffar',
    sourcePrefix: 'Kapitel',
    subtitle:
      'Hitta centrala samhällsord snabbt och gå vidare till rätt kapitel när du vill läsa mer.',
    termBadge: 'Begrepp',
    title: 'Sök i ordlistan',
  },
  en: {
    backHome: 'Back home',
    backHomeAccessibilityLabel: 'Go back to the home screen',
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Browse all chapters',
    emptyText: 'Try another civic term or browse by chapter.',
    emptyTitle: 'No terms found',
    eyebrow: 'Terms and search',
    inputAccessibilityHint: 'Search civic terms in Swedish or English.',
    inputAccessibilityLabel: 'Search glossary terms',
    placeholder: 'Search terms, for example Riksdag',
    resultAccessibilityLabel: (term, chapter) => `Open the ${chapter} chapter for ${term}.`,
    resultCount: (count) => `${count} terms`,
    resultSectionSubtitle:
      'Each match points to the chapter where the term belongs in the UHR material.',
    resultSectionTitle: 'Glossary results',
    sourcePrefix: 'Chapter',
    subtitle: 'Find core civic terms quickly, then open the right chapter when you want context.',
    termBadge: 'Term',
    title: 'Search the glossary',
  },
};

function getTermText(term: GlossarySearchResult, language: AppLanguage) {
  return language === 'en' ? term.termEn : term.termSv;
}

function getSecondaryTermText(term: GlossarySearchResult, language: AppLanguage) {
  return language === 'en' ? term.termSv : term.termEn;
}

function getExplanationText(term: GlossarySearchResult, language: AppLanguage) {
  return language === 'en' ? term.explanationEn : term.explanationSv;
}

export default function SearchScreen() {
  const language = useSettingsStore((state) => state.language);
  const copy = searchCopy[language];
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchGlossary(query, language, 8), [language, query]);
  const hasResults = results.length > 0;

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <View style={styles.searchPanel}>
        <TextInput
          accessibilityHint={copy.inputAccessibilityHint}
          accessibilityLabel={copy.inputAccessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Text style={styles.resultCount}>{copy.resultCount(results.length)}</Text>
      </View>

      <SectionHeader title={copy.resultSectionTitle} subtitle={copy.resultSectionSubtitle} />

      {hasResults ? (
        <View style={styles.results}>
          {results.map((term) => {
            const chapterLabel = getGlossaryChapterLabel(term, language) ?? term.chapterId ?? '';
            const primaryTerm = getTermText(term, language);
            const secondaryTerm = getSecondaryTermText(term, language);
            const explanation = getExplanationText(term, language);
            return (
              <Link
                key={term.id}
                accessibilityLabel={copy.resultAccessibilityLabel(primaryTerm, chapterLabel)}
                accessibilityRole="link"
                href={`/chapter/${term.chapterId}`}
                style={styles.resultLink}
              >
                <Card style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Badge tone="blue">{copy.termBadge}</Badge>
                    <Text style={styles.sourceLine}>
                      {copy.sourcePrefix}: {chapterLabel}
                    </Text>
                  </View>
                  <Text accessibilityRole="header" style={styles.term}>
                    {primaryTerm}
                  </Text>
                  <Text style={styles.secondaryTerm}>{secondaryTerm}</Text>
                  <Text style={styles.explanation}>{explanation}</Text>
                </Card>
              </Link>
            );
          })}
        </View>
      ) : (
        <Card accessible accessibilityLabel={`${copy.emptyTitle}. ${copy.emptyText}`}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            {copy.emptyTitle}
          </Text>
          <Text style={styles.emptyText}>{copy.emptyText}</Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Link
          accessibilityLabel={copy.browseChaptersAccessibilityLabel}
          accessibilityRole="link"
          href="/learn"
          style={styles.primaryLink}
        >
          {copy.browseChapters}
        </Link>
        <Link
          accessibilityLabel={copy.backHomeAccessibilityLabel}
          accessibilityRole="link"
          href="/(tabs)/home"
          style={styles.secondaryLink}
        >
          {copy.backHome}
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space[0.75],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  explanation: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.body.fontSize,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  primaryLink: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
  resultCard: {
    gap: space[1],
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  resultLink: {
    color: colors.text,
    textDecorationLine: 'none',
  },
  results: {
    gap: space[1.25],
  },
  searchPanel: {
    gap: space[1],
  },
  secondaryLink: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
  secondaryTerm: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sourceLine: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  term: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
});
