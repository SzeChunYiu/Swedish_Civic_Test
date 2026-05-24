import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PersistenceWarningNotice } from '../components/storage/PersistenceWarningNotice';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { RouteLink } from '../components/ui/RouteLink';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import {
  CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE,
  CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026,
  citizenshipRequirementAreas,
  citizenshipRequirementSources,
  type CitizenshipRequirementLanguage,
  type CitizenshipRequirementSource,
  type CitizenshipRequirementSourceId,
} from '../data/citizenshipRequirements';
import { useCitizenshipRequirementsChecklistStore } from '../lib/storage/citizenshipRequirementsStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme/ThemeProvider';

type CitizenshipRequirementsCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  effectiveBadge: string;
  yearlyIncomeBadge: string;
  checklistTitle: string;
  checklistSubtitle: string;
  summaryTitle: string;
  summaryEmpty: string;
  summaryComplete: string;
  summaryProgressPrefix: string;
  summaryProgressSuffix: string;
  summaryNextPrefix: string;
  summaryMoreSuffix: string;
  summaryBoundary: string;
  checkedLabel: string;
  uncheckedLabel: string;
  sourceRefsLabel: string;
  areaSourceAccessibilityPrefix: string;
  sourceListTitle: string;
  sourceListSubtitle: string;
  sourceDateLabel: string;
  retrievedLabel: string;
  openSourceHint: string;
  backAbout: string;
  backAboutAccessibilityLabel: string;
  openPractice: string;
  openPracticeAccessibilityLabel: string;
};

const copyByLanguage: Record<AppLanguage, CitizenshipRequirementsCopy> = {
  sv: {
    eyebrow: 'Medborgarskap 2026',
    title: 'Krav och behörighet',
    subtitle:
      'En planeringsguide för vuxna som ansöker om svenskt medborgarskap när de nya reglerna börjar gälla. Migrationsverket avgör alltid ansökan.',
    effectiveBadge: `Gäller från ${CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE}`,
    yearlyIncomeBadge: `Försörjning ${formatSek(
      CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026,
      'sv',
    )}/år`,
    checklistTitle: 'Sju områden att kontrollera',
    checklistSubtitle:
      'Markera bara sådant du själv har kontrollerat mot myndigheternas aktuella information.',
    summaryTitle: 'Din planeringsbild',
    summaryEmpty:
      'Inget är markerat ännu. Börja med identitet och vistelsestatus; de påverkar resten av tidsplanen.',
    summaryComplete:
      'Alla sju planeringsområden är markerade. Gör ändå en sista kontroll hos Migrationsverket innan du ansöker eller bokar något.',
    summaryProgressPrefix: 'Du har markerat',
    summaryProgressSuffix: 'av 7 planeringspunkter.',
    summaryNextPrefix: 'Nästa att kontrollera:',
    summaryMoreSuffix: 'till',
    summaryBoundary: 'Checklistan visar inte ett myndighetsbeslut eller garanterad behörighet.',
    checkedLabel: 'Markerad',
    uncheckedLabel: 'Ej markerad',
    sourceRefsLabel: 'Källor',
    areaSourceAccessibilityPrefix: 'Källa för',
    sourceListTitle: 'Officiella källor',
    sourceListSubtitle:
      'Källorna öppnas utanför appen. Kontrollera alltid myndighetssidorna om ditt ärende är nära ett beslut.',
    sourceDateLabel: 'Källdatum',
    retrievedLabel: 'Kontrollerad',
    openSourceHint: 'Öppna källan i webbläsaren',
    backAbout: 'Om provet',
    backAboutAccessibilityLabel: 'Gå tillbaka till sidan om medborgarskapsprovet',
    openPractice: 'Öva samhällskunskap',
    openPracticeAccessibilityLabel: 'Öppna övningsläget för samhällskunskap',
  },
  en: {
    eyebrow: 'Citizenship 2026',
    title: 'Requirements and eligibility',
    subtitle:
      'A planning guide for adults applying for Swedish citizenship when the new rules take effect. Migrationsverket always decides the application.',
    effectiveBadge: `Applies from ${CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE}`,
    yearlyIncomeBadge: `Self-support ${formatSek(
      CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026,
      'en',
    )}/year`,
    checklistTitle: 'Seven areas to check',
    checklistSubtitle:
      "Only mark items you have checked against the authorities' current information.",
    summaryTitle: 'Your planning picture',
    summaryEmpty:
      'Nothing is marked yet. Start with identity and residence status; they shape the rest of the timeline.',
    summaryComplete:
      'All seven planning areas are marked. Still make a final check with Migrationsverket before applying or booking anything.',
    summaryProgressPrefix: 'You have marked',
    summaryProgressSuffix: 'of 7 planning items.',
    summaryNextPrefix: 'Next to check:',
    summaryMoreSuffix: 'more',
    summaryBoundary: 'This checklist is not an authority decision or a guarantee of eligibility.',
    checkedLabel: 'Marked',
    uncheckedLabel: 'Not marked',
    sourceRefsLabel: 'Sources',
    areaSourceAccessibilityPrefix: 'Source for',
    sourceListTitle: 'Official sources',
    sourceListSubtitle:
      'Sources open outside the app. Always check the authority pages when your case is close to a decision.',
    sourceDateLabel: 'Source date',
    retrievedLabel: 'Checked',
    openSourceHint: 'Open the source in the browser',
    backAbout: 'About the test',
    backAboutAccessibilityLabel: 'Go back to the page about the citizenship test',
    openPractice: 'Practise civic knowledge',
    openPracticeAccessibilityLabel: 'Open civic knowledge practice mode',
  },
};

const sourceById = new Map(citizenshipRequirementSources.map((source) => [source.id, source]));

function formatSek(amount: number, language: CitizenshipRequirementLanguage) {
  return new Intl.NumberFormat(language === 'sv' ? 'sv-SE' : 'en-SE', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'SEK',
  }).format(amount);
}

function sourceForId(sourceId: CitizenshipRequirementSourceId) {
  const source = sourceById.get(sourceId);

  if (!source) {
    throw new Error(`Missing citizenship requirement source: ${sourceId}`);
  }

  return source;
}

function formatSourceMeta(source: CitizenshipRequirementSource, copy: CitizenshipRequirementsCopy) {
  const sourceDate = source.sourceDate ? ` · ${copy.sourceDateLabel} ${source.sourceDate}` : '';

  return `${source.publisher}${sourceDate} · ${copy.retrievedLabel} ${source.retrievedDate}`;
}

function buildAreaSourceAccessibilityLabel(
  copy: CitizenshipRequirementsCopy,
  areaTitle: string,
  source: CitizenshipRequirementSource,
  language: CitizenshipRequirementLanguage,
) {
  return `${copy.areaSourceAccessibilityPrefix} ${areaTitle}: ${source.publisher}: ${
    source.title[language]
  }. ${formatSourceMeta(source, copy)}. ${source.url}`;
}

function buildSummary(
  copy: CitizenshipRequirementsCopy,
  checkedCount: number,
  missingTitles: readonly string[],
) {
  if (checkedCount === 0) {
    return copy.summaryEmpty;
  }

  if (missingTitles.length === 0) {
    return copy.summaryComplete;
  }

  const visibleMissingTitles = missingTitles.slice(0, 2).join(', ');
  const hiddenMissingCount = missingTitles.length - 2;
  const moreText =
    hiddenMissingCount > 0 ? ` + ${hiddenMissingCount} ${copy.summaryMoreSuffix}` : '';

  return `${copy.summaryProgressPrefix} ${checkedCount} ${copy.summaryProgressSuffix} ${copy.summaryNextPrefix} ${visibleMissingTitles}${moreText}. ${copy.summaryBoundary}`;
}

export default function CitizenshipRequirementsScreen() {
  const language = useSettingsStore((state) => state.language);
  const { colors: themeColors } = useTheme();
  const checkedAreaIds = useCitizenshipRequirementsChecklistStore((state) => state.checkedAreaIds);
  const toggleChecklistArea = useCitizenshipRequirementsChecklistStore((state) => state.toggleArea);
  const persistenceWarning = useCitizenshipRequirementsChecklistStore(
    (state) => state.persistenceWarning,
  );
  const clearPersistenceWarning = useCitizenshipRequirementsChecklistStore(
    (state) => state.clearPersistenceWarning,
  );
  const copy = copyByLanguage[language];
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const checkedIds = useMemo(() => new Set(checkedAreaIds), [checkedAreaIds]);
  const [focusedSourceRow, setFocusedSourceRow] = useState<string | null>(null);

  const missingAreas = useMemo(
    () => citizenshipRequirementAreas.filter((area) => !checkedIds.has(area.id)),
    [checkedIds],
  );
  const checkedCount = citizenshipRequirementAreas.length - missingAreas.length;
  const summary = buildSummary(
    copy,
    checkedCount,
    missingAreas.map((area) => area.title[language]),
  );

  return (
    <ScreenShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      themeColors={themeColors}
      rightSlot={
        <View style={styles.heroBadges}>
          <Badge themeColors={themeColors} tone="warm">
            {copy.effectiveBadge}
          </Badge>
          <Badge themeColors={themeColors} tone="green">
            {copy.yearlyIncomeBadge}
          </Badge>
        </View>
      }
    >
      <Card style={styles.summaryCard} themeColors={themeColors}>
        <Text accessibilityRole="header" style={styles.summaryTitle}>
          {copy.summaryTitle}
        </Text>
        <Text style={styles.summaryBody}>{summary}</Text>
      </Card>

      <PersistenceWarningNotice
        language={language}
        onDismiss={clearPersistenceWarning}
        warning={persistenceWarning}
      />

      <SectionHeader
        title={copy.checklistTitle}
        subtitle={copy.checklistSubtitle}
        themeColors={themeColors}
      />

      <View style={styles.requirementsList}>
        {citizenshipRequirementAreas.map((area) => {
          const checked = checkedIds.has(area.id);
          const areaSources = area.sourceIds.map(sourceForId);
          const checkboxLabel = `${checked ? copy.checkedLabel : copy.uncheckedLabel}: ${
            area.checklistPrompt[language]
          }`;

          return (
            <Card key={area.id} style={styles.requirementCard} themeColors={themeColors}>
              <View style={styles.requirementHeader}>
                <Badge themeColors={themeColors} tone={checked ? 'green' : 'blue'}>
                  {area.badge[language]}
                </Badge>
                <Text accessibilityRole="header" style={styles.requirementTitle}>
                  {area.order}. {area.title[language]}
                </Text>
              </View>
              <Text style={styles.requirementSummary}>{area.summary[language]}</Text>
              <Text style={styles.requirementDetail}>{area.detail[language]}</Text>
              <View style={styles.sourceRefs}>
                <Text style={styles.sourceRefsLabel}>{copy.sourceRefsLabel}</Text>
                <View style={styles.sourceRefList}>
                  {areaSources.map((source) => {
                    const sourceFocusKey = `area:${area.id}:${source.id}`;

                    return (
                      <RouteLink
                        key={`${area.id}-${source.id}`}
                        accessibilityHint={copy.openSourceHint}
                        accessibilityLabel={buildAreaSourceAccessibilityLabel(
                          copy,
                          area.title[language],
                          source,
                          language,
                        )}
                        href={source.url}
                        onBlur={() => setFocusedSourceRow(null)}
                        onFocus={() => setFocusedSourceRow(sourceFocusKey)}
                        rel="noreferrer"
                        style={[
                          styles.sourceRefRow,
                          focusedSourceRow === sourceFocusKey ? styles.sourceRefRowFocused : null,
                        ]}
                        target="_blank"
                        variant="card"
                      >
                        <Text style={styles.sourceRefTitle}>{source.title[language]}</Text>
                        <Text style={styles.sourceRefMeta}>{formatSourceMeta(source, copy)}</Text>
                        <Text style={styles.sourceRefUrl}>{source.url}</Text>
                      </RouteLink>
                    );
                  })}
                </View>
              </View>
              <Pressable
                accessibilityLabel={checkboxLabel}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                aria-checked={checked}
                hitSlop={space[0.5]}
                onPress={() => toggleChecklistArea(area.id)}
                style={({ pressed }) => [
                  styles.checkboxRow,
                  checked ? styles.checkboxRowChecked : null,
                  pressed ? styles.checkboxRowPressed : null,
                ]}
                testID={`citizenship-requirement-${area.id}-checkbox`}
              >
                <View
                  style={[styles.checkboxBox, checked ? styles.checkboxBoxChecked : null]}
                  testID={`citizenship-requirement-${area.id}-checkbox-box`}
                >
                  {checked ? (
                    <View
                      style={styles.checkboxDot}
                      testID={`citizenship-requirement-${area.id}-checkbox-check`}
                    />
                  ) : null}
                </View>
                <Text style={styles.checkboxText}>{area.checklistPrompt[language]}</Text>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <QuestionDisclaimer themeColors={themeColors} />

      <Card style={styles.sourcesCard} themeColors={themeColors}>
        <Text accessibilityRole="header" style={styles.sourcesTitle}>
          {copy.sourceListTitle}
        </Text>
        <Text style={styles.sourcesSubtitle}>{copy.sourceListSubtitle}</Text>
        <View style={styles.sourceList}>
          {citizenshipRequirementSources.map((source) => {
            const sourceFocusKey = `source:${source.id}`;

            return (
              <RouteLink
                key={source.id}
                accessibilityHint={copy.openSourceHint}
                accessibilityLabel={`${copy.openSourceHint}: ${source.title[language]}`}
                href={source.url}
                onBlur={() => setFocusedSourceRow(null)}
                onFocus={() => setFocusedSourceRow(sourceFocusKey)}
                rel="noreferrer"
                style={[
                  styles.sourceRow,
                  focusedSourceRow === sourceFocusKey ? styles.sourceRowFocused : null,
                ]}
                target="_blank"
                variant="card"
              >
                <Text style={styles.sourceTitle}>{source.title[language]}</Text>
                <Text style={styles.sourceMeta}>{formatSourceMeta(source, copy)}</Text>
                <Text style={styles.sourceUrl}>{source.url}</Text>
              </RouteLink>
            );
          })}
        </View>
      </Card>

      <View style={styles.actions}>
        <RouteLink
          accessibilityLabel={copy.openPracticeAccessibilityLabel}
          href="/practice"
          variant="primary"
        >
          {copy.openPractice}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.backAboutAccessibilityLabel}
          href="/about-the-test"
          variant="secondary"
        >
          {copy.backAbout}
        </RouteLink>
      </View>
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    heroBadges: {
      alignItems: 'flex-start',
      gap: space[1],
    },
    summaryCard: {
      backgroundColor: themeColors.surfaceWarm,
      gap: space[0.75],
    },
    summaryTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    summaryBody: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    requirementsList: {
      gap: space[2],
    },
    requirementCard: {
      gap: space[1.25],
    },
    requirementHeader: {
      gap: space[0.75],
    },
    requirementTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    requirementSummary: {
      color: themeColors.text,
      fontSize: typography.bodySemibold.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
      lineHeight: typography.bodySemibold.lineHeight,
    },
    requirementDetail: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    sourceRefs: {
      borderColor: themeColors.border,
      borderTopWidth: space.hairline,
      gap: space[0.5],
      paddingTop: space[1],
    },
    sourceRefsLabel: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    sourceRefList: {
      gap: space[0.75],
    },
    sourceRefRow: {
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      gap: space[0.5],
      minHeight: space[6],
      paddingHorizontal: space[1],
      paddingVertical: space[0.75],
    },
    sourceRefRowFocused: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    sourceRefRowPressed: {
      backgroundColor: themeColors.surfaceMuted,
    },
    sourceRefTitle: {
      color: themeColors.text,
      fontSize: typography.finePrint.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
      lineHeight: typography.finePrint.lineHeight,
    },
    sourceRefMeta: {
      color: themeColors.textSecondary,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.finePrint.lineHeight,
    },
    sourceRefUrl: {
      color: themeColors.accent,
      flexShrink: 1,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.finePrint.lineHeight,
    },
    checkboxRow: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexDirection: 'row',
      gap: space[1.25],
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    checkboxRowChecked: {
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
    },
    checkboxRowPressed: {
      opacity: 0.78,
    },
    checkboxBox: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.textMuted,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[3],
      justifyContent: 'center',
      width: space[3],
    },
    checkboxBoxChecked: {
      backgroundColor: themeColors.success,
      borderColor: themeColors.success,
    },
    checkboxDot: {
      backgroundColor: themeColors.surface,
      borderRadius: radius.pill,
      height: space[1],
      width: space[1],
    },
    checkboxText: {
      color: themeColors.text,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    sourcesCard: {
      gap: space[1.25],
    },
    sourcesTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    sourcesSubtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    sourceList: {
      gap: space[1],
    },
    sourceRow: {
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      gap: space[0.5],
      minHeight: space[6],
      padding: space[1.25],
    },
    sourceRowFocused: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    sourceRowPressed: {
      backgroundColor: themeColors.surfaceMuted,
    },
    sourceTitle: {
      color: themeColors.text,
      fontSize: typography.bodySemibold.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
      lineHeight: typography.bodySemibold.lineHeight,
    },
    sourceMeta: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    sourceUrl: {
      color: themeColors.accent,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.finePrint.lineHeight,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1.5],
    },
  });
}
