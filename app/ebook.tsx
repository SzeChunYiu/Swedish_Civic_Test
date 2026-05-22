import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { ArticleAudioButton } from '../components/learning/ArticleAudioButton';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import {
  buildEbookArticleNarrationText,
  buildEbookSectionNarrationText,
} from '../lib/audio/ebookNarration';
import {
  EBOOK_ARTICLES,
  getAdjacentEbookArticle,
  getEbookArticleByParam,
  getEbookSectionSourceNotes,
  getEbookSourceNotes,
  getLocalizedText,
  getSafeEbookSourceUrl,
  type EbookArticle,
  type EbookSourceNote,
} from '../lib/content/ebookContent';
import { useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type EbookRouteCopy = {
  articleNavGroupAccessibilityLabel: string;
  articleNavAccessibilityLabel: (kicker: string, title: string) => string;
  backToLearn: string;
  backToLearnAccessibilityLabel: string;
  nextArticle: string;
  openPracticeAccessibilityLabel: (title: string) => string;
  previousArticle: string;
  provenanceBadge: string;
  provenanceText: string;
  sectionSubtitle: string;
  sectionSourcesHeading: (count: number) => string;
  sectionTitle: string;
  sourceLinkAccessibilityLabel: (label: string, url: string) => string;
  sourceHeading: (date: string) => string;
  sourcesCta: string;
  sourcesCtaAccessibilityLabel: string;
  subtitle: string;
  title: string;
};

const ebookRouteCopy: Record<AppLanguage, EbookRouteCopy> = {
  sv: {
    articleNavGroupAccessibilityLabel: 'Välj studieartikel',
    articleNavAccessibilityLabel: (kicker, title) => `Öppna artikel ${kicker}: ${title}`,
    backToLearn: 'Tillbaka till studievägen',
    backToLearnAccessibilityLabel: 'Tillbaka till studievägen',
    nextArticle: 'Nästa',
    openPracticeAccessibilityLabel: (title) => `Öppna övning för ${title}`,
    previousArticle: 'Förra',
    provenanceBadge: 'Redaktionell',
    provenanceText:
      'Egen studieguide. Kontrollera fakta via UHR-materialet och källsidan när en uppgift påverkar dig.',
    sectionSubtitle:
      'Läs en kort artikel offline och gå sedan direkt till övningen som använder samma frågebank.',
    sectionSourcesHeading: (count) =>
      count === 1 ? 'Källa för avsnittet' : 'Källor för avsnittet',
    sectionTitle: 'Studieartiklar',
    sourceLinkAccessibilityLabel: (label, url) => `Öppna källa: ${label}. ${url}`,
    sourceHeading: (date) => `Källor hämtade ${date}`,
    sourcesCta: 'Öppna källor',
    sourcesCtaAccessibilityLabel: 'Öppna källsidan',
    subtitle:
      'Korta, tvåspråkiga artiklar från den statiska studieguiden, anpassade för appen och kopplade till kapitelövning.',
    title: 'Studieguide i appen',
  },
  en: {
    articleNavGroupAccessibilityLabel: 'Choose study article',
    articleNavAccessibilityLabel: (kicker, title) => `Open article ${kicker}: ${title}`,
    backToLearn: 'Back to Learn',
    backToLearnAccessibilityLabel: 'Back to Learn',
    nextArticle: 'Next',
    openPracticeAccessibilityLabel: (title) => `Open practice for ${title}`,
    previousArticle: 'Previous',
    provenanceBadge: 'Editorial',
    provenanceText:
      'Original study guide. Verify facts through UHR material and the Sources page when a detail affects you.',
    sectionSubtitle:
      'Read a short article offline, then jump straight into practice from the same question bank.',
    sectionSourcesHeading: (count) => (count === 1 ? 'Section source' : 'Section sources'),
    sectionTitle: 'Study articles',
    sourceLinkAccessibilityLabel: (label, url) => `Open source: ${label}. ${url}`,
    sourceHeading: (date) => `Sources accessed ${date}`,
    sourcesCta: 'Open sources',
    sourcesCtaAccessibilityLabel: 'Open the Sources page',
    subtitle:
      'Short bilingual articles from the static study guide, adapted for the app and connected to chapter practice.',
    title: 'In-app study guide',
  },
};

function navigateToArticle(router: ReturnType<typeof useRouter>, article: EbookArticle) {
  router.push(`/ebook?c=${article.staticChapterId}`);
}

function SourceNoteLine({ language, source }: { language: AppLanguage; source: EbookSourceNote }) {
  const copy = ebookRouteCopy[language];
  const sourceLabel = getLocalizedText(source.label, language);
  const safeSourceUrl = getSafeEbookSourceUrl(source);

  if (!safeSourceUrl) {
    return (
      <View accessibilityLabel={`${sourceLabel}. ${source.url}`} style={styles.sourceLine}>
        <Text style={styles.sourceLabel}>{sourceLabel}</Text>
        <Text style={styles.sourceUrl}>{source.url}</Text>
      </View>
    );
  }

  return (
    <Link
      accessibilityLabel={copy.sourceLinkAccessibilityLabel(sourceLabel, safeSourceUrl)}
      accessibilityRole="link"
      href={safeSourceUrl}
      rel="noreferrer"
      style={styles.sourceLine}
      target="_blank"
    >
      <Text style={styles.sourceLabel}>{sourceLabel}</Text>
      <Text style={styles.sourceUrl}>{safeSourceUrl}</Text>
    </Link>
  );
}

export default function EbookScreen() {
  const { c } = useLocalSearchParams<{ c?: string | string[] }>();
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const audioPlaybackRate = useAccessibilityStore((state) => state.audioPlaybackRate);
  const copy = ebookRouteCopy[language];
  const article = getEbookArticleByParam(c);
  const previousArticle = getAdjacentEbookArticle(article, 'previous');
  const nextArticle = getAdjacentEbookArticle(article, 'next');
  const sources = getEbookSourceNotes(article);
  const articleTitle = getLocalizedText(article.title, language);
  const articleKicker = getLocalizedText(article.kicker, language);
  const sourceDate = sources[0]?.retrievedDate ?? '2026-05-19';

  return (
    <ScreenShell eyebrow={copy.sectionTitle} title={copy.title} subtitle={copy.subtitle}>
      <Pressable
        accessibilityLabel={copy.backToLearnAccessibilityLabel}
        accessibilityRole="link"
        hitSlop={space[1]}
        onPress={() => router.push('/learn')}
        style={({ pressed }) => [styles.backLink, pressed ? styles.pressedLink : null]}
      >
        <Text style={styles.backLinkText}>{copy.backToLearn}</Text>
      </Pressable>

      <SectionHeader title={copy.sectionTitle} subtitle={copy.sectionSubtitle} />
      <ScrollView
        aria-label={copy.articleNavGroupAccessibilityLabel}
        accessibilityLabel={copy.articleNavGroupAccessibilityLabel}
        accessibilityRole="tablist"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.articleNavContent}
        style={styles.articleNav}
      >
        {EBOOK_ARTICLES.map((item) => {
          const selected = item.staticChapterId === article.staticChapterId;
          const kicker = getLocalizedText(item.kicker, language);
          const title = getLocalizedText(item.title, language);

          return (
            <Pressable
              key={item.staticChapterId}
              aria-selected={selected}
              accessibilityLabel={copy.articleNavAccessibilityLabel(kicker, title)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              hitSlop={space[1]}
              onPress={() => navigateToArticle(router, item)}
              style={({ pressed }) => [
                styles.articleNavItem,
                pressed ? styles.articleNavItemPressed : null,
                selected ? styles.articleNavItemSelected : null,
              ]}
            >
              <Text
                style={[styles.articleNavKicker, selected ? styles.articleNavTextSelected : null]}
              >
                {kicker}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.articleNavTitle, selected ? styles.articleNavTextSelected : null]}
              >
                {title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card elevated style={styles.articleCard}>
        <Badge tone="blue">{articleKicker}</Badge>
        <Text accessibilityRole="header" style={styles.articleTitle}>
          {articleTitle}
        </Text>
        <Text style={styles.lede}>{getLocalizedText(article.lede, language)}</Text>
        <ArticleAudioButton
          enabled={audioEnabled}
          language={language}
          rate={audioPlaybackRate}
          scope="article"
          style={styles.audioAction}
          text={buildEbookArticleNarrationText(article)}
        />

        <Card
          accessibilityLabel={`${copy.provenanceBadge}. ${copy.provenanceText}`}
          style={styles.provenanceCard}
        >
          <Badge tone="warm">{copy.provenanceBadge}</Badge>
          <Text style={styles.provenanceText}>{copy.provenanceText}</Text>
        </Card>

        {article.sections.map((section) => {
          const sectionSources = getEbookSectionSourceNotes(section);
          const sectionHeading = getLocalizedText(section.heading, language);
          const sectionElementId = `ebook-section-${article.staticChapterId}-${section.blockId}`;

          return (
            <View
              key={section.blockId}
              nativeID={sectionElementId}
              style={styles.sectionBlock}
              testID={sectionElementId}
            >
              <Text accessibilityRole="header" style={styles.sectionHeading}>
                {sectionHeading}
              </Text>
              <Text style={styles.sectionBody}>{getLocalizedText(section.body, language)}</Text>
              <View
                accessibilityLabel={`${copy.sectionSourcesHeading(sectionSources.length)}: ${sectionSources
                  .map((source) => getLocalizedText(source.label, language))
                  .join(', ')}`}
                style={styles.sectionSources}
              >
                <Text style={styles.sectionSourcesHeading}>
                  {copy.sectionSourcesHeading(sectionSources.length)}
                </Text>
                {sectionSources.map((source) => (
                  <SourceNoteLine
                    key={`${section.blockId}-${source.key}`}
                    language={language}
                    source={source}
                  />
                ))}
              </View>
              <ArticleAudioButton
                enabled={audioEnabled}
                language={language}
                rate={audioPlaybackRate}
                scope="section"
                style={styles.sectionAudioAction}
                text={buildEbookSectionNarrationText(section)}
              />
            </View>
          );
        })}

        <Card style={styles.sourcesCard}>
          <Text accessibilityRole="header" style={styles.sourcesHeading}>
            {copy.sourceHeading(sourceDate)}
          </Text>
          {sources.map((source) => (
            <SourceNoteLine key={source.key} language={language} source={source} />
          ))}
        </Card>
      </Card>

      <View style={styles.actions}>
        <Button
          accessibilityLabel={copy.openPracticeAccessibilityLabel(articleTitle)}
          accessibilityRole="link"
          onPress={() => router.push(article.practicePath)}
          style={styles.primaryAction}
        >
          {getLocalizedText(article.practiceLabel, language)}
        </Button>
        <Button
          accessibilityLabel={copy.sourcesCtaAccessibilityLabel}
          accessibilityRole="link"
          onPress={() => router.push('/sources')}
          variant="secondary"
        >
          {copy.sourcesCta}
        </Button>
      </View>

      <View style={styles.pager}>
        {previousArticle ? (
          <Button
            accessibilityLabel={`${copy.previousArticle}: ${getLocalizedText(previousArticle.title, language)}`}
            accessibilityRole="link"
            onPress={() => navigateToArticle(router, previousArticle)}
            variant="ghost"
          >
            {copy.previousArticle}
          </Button>
        ) : (
          <View />
        )}
        {nextArticle ? (
          <Button
            accessibilityLabel={`${copy.nextArticle}: ${getLocalizedText(nextArticle.title, language)}`}
            accessibilityRole="link"
            onPress={() => navigateToArticle(router, nextArticle)}
            variant="ghost"
          >
            {copy.nextArticle}
          </Button>
        ) : (
          <View />
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignSelf: 'flex-start',
    borderRadius: radius.button,
    minHeight: space[6],
    paddingHorizontal: space[1],
    paddingVertical: space[1],
  },
  pressedLink: {
    backgroundColor: colors.focusSoft,
  },
  backLinkText: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.bodyTight.lineHeight,
  },
  articleNav: {
    marginHorizontal: -space[3],
  },
  articleNavContent: {
    gap: space[1],
    paddingHorizontal: space[3],
  },
  articleNavItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    maxWidth: 220,
    minHeight: space[8],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
    width: 184,
  },
  articleNavItemSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  articleNavItemPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
  },
  articleNavKicker: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    lineHeight: typography.badge.lineHeight,
    textTransform: 'uppercase',
  },
  articleNavTitle: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  articleNavTextSelected: {
    color: colors.surface,
  },
  articleCard: {
    gap: space[2],
  },
  articleTitle: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.subHeading.lineHeight,
  },
  lede: {
    color: colors.textSecondary,
    fontSize: typography.bodyLarge.fontSize,
    lineHeight: typography.bodyLarge.lineHeight,
  },
  audioAction: {
    alignSelf: 'flex-start',
  },
  provenanceCard: {
    backgroundColor: colors.surfaceWarm,
    gap: space[1],
  },
  provenanceText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sectionBlock: {
    gap: space[0.75],
  },
  sectionHeading: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sectionSources: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.75],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  sectionSourcesHeading: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  sectionAudioAction: {
    alignSelf: 'flex-start',
    marginTop: space[0.5],
  },
  sourcesCard: {
    gap: space[1],
  },
  sourcesHeading: {
    color: colors.text,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyLarge.lineHeight,
  },
  sourceLine: {
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    gap: space[0.5],
    minHeight: space[6],
    paddingHorizontal: space[1],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  sourceLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  sourceUrl: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  primaryAction: {
    flexGrow: 1,
  },
  pager: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
