import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ComplianceActionLink,
  getVisibleLinkDestination,
} from '../components/compliance/ComplianceActionLink';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import {
  CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE,
  CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026,
  citizenshipRequirementAreas,
  citizenshipRequirementSources,
  type CitizenshipRequirementAreaId,
  type CitizenshipRequirementLanguage,
  type CitizenshipRequirementSourceId,
} from '../data/citizenshipRequirements';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

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
  sourceListTitle: string;
  sourceListSubtitle: string;
  sourceDateLabel: string;
  retrievedLabel: string;
  openSourceAccessibilityLabel: (publisher: string, title: string) => string;
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
    sourceListTitle: 'Officiella källor',
    sourceListSubtitle:
      'Källorna öppnas utanför appen. Kontrollera alltid myndighetssidorna om ditt ärende är nära ett beslut.',
    sourceDateLabel: 'Källdatum',
    retrievedLabel: 'Kontrollerad',
    openSourceAccessibilityLabel: (publisher, title) => `Öppna källa: ${publisher}, ${title}`,
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
    sourceListTitle: 'Official sources',
    sourceListSubtitle:
      'Sources open outside the app. Always check the authority pages when your case is close to a decision.',
    sourceDateLabel: 'Source date',
    retrievedLabel: 'Checked',
    openSourceAccessibilityLabel: (publisher, title) => `Open source: ${publisher}, ${title}`,
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

function formatSourceMeta(
  copy: CitizenshipRequirementsCopy,
  source: (typeof citizenshipRequirementSources)[number],
) {
  const sourceDateText =
    'sourceDate' in source ? `${copy.sourceDateLabel} ${source.sourceDate} · ` : '';

  return `${source.publisher} · ${sourceDateText}${copy.retrievedLabel} ${source.retrievedDate}`;
}

export default function CitizenshipRequirementsScreen() {
  const language = useSettingsStore((state) => state.language);
  const copy = copyByLanguage[language];
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<CitizenshipRequirementAreaId>>(
    () => new Set(),
  );

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

  function toggleArea(areaId: CitizenshipRequirementAreaId) {
    setCheckedIds((current) => {
      const next = new Set(current);

      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }

      return next;
    });
  }

  return (
    <ScreenShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      rightSlot={
        <View style={styles.heroBadges}>
          <Badge tone="warm">{copy.effectiveBadge}</Badge>
          <Badge tone="green">{copy.yearlyIncomeBadge}</Badge>
        </View>
      }
    >
      <Card style={styles.summaryCard}>
        <Text accessibilityRole="header" style={styles.summaryTitle}>
          {copy.summaryTitle}
        </Text>
        <Text style={styles.summaryBody}>{summary}</Text>
      </Card>

      <SectionHeader title={copy.checklistTitle} subtitle={copy.checklistSubtitle} />

      <View style={styles.requirementsList}>
        {citizenshipRequirementAreas.map((area) => {
          const checked = checkedIds.has(area.id);
          const areaSources = area.sourceIds.map(sourceForId);
          const checkboxLabel = `${checked ? copy.checkedLabel : copy.uncheckedLabel}: ${
            area.checklistPrompt[language]
          }`;

          return (
            <Card key={area.id} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <Badge tone={checked ? 'green' : 'blue'}>{area.badge[language]}</Badge>
                <Text accessibilityRole="header" style={styles.requirementTitle}>
                  {area.order}. {area.title[language]}
                </Text>
              </View>
              <Text style={styles.requirementSummary}>{area.summary[language]}</Text>
              <Text style={styles.requirementDetail}>{area.detail[language]}</Text>
              <View style={styles.sourceRefs}>
                <Text style={styles.sourceRefsLabel}>{copy.sourceRefsLabel}</Text>
                <Text style={styles.sourceRefsText}>
                  {areaSources.map((source) => source.publisher).join(' · ')}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={checkboxLabel}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                aria-checked={checked}
                hitSlop={space[0.5]}
                onPress={() => toggleArea(area.id)}
                style={({ pressed }) => [
                  styles.checkboxRow,
                  checked ? styles.checkboxRowChecked : null,
                  pressed ? styles.checkboxRowPressed : null,
                ]}
              >
                <View style={[styles.checkboxBox, checked ? styles.checkboxBoxChecked : null]}>
                  {checked ? <View style={styles.checkboxDot} /> : null}
                </View>
                <Text style={styles.checkboxText}>{area.checklistPrompt[language]}</Text>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <QuestionDisclaimer />

      <Card style={styles.sourcesCard}>
        <Text accessibilityRole="header" style={styles.sourcesTitle}>
          {copy.sourceListTitle}
        </Text>
        <Text style={styles.sourcesSubtitle}>{copy.sourceListSubtitle}</Text>
        <View style={styles.sourceList}>
          {citizenshipRequirementSources.map((source) => (
            <View key={source.id} style={styles.sourceEntry}>
              <ComplianceActionLink
                accessibilityHint={copy.openSourceHint}
                accessibilityLabel={copy.openSourceAccessibilityLabel(
                  source.publisher,
                  source.title[language],
                )}
                detail={getVisibleLinkDestination(source.url)}
                href={source.url}
                label={source.title[language]}
                rel="noreferrer"
                target="_blank"
              />
              <Text style={styles.sourceMeta}>{formatSourceMeta(copy, source)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <ComplianceActionLink
          accessibilityLabel={copy.openPracticeAccessibilityLabel}
          href="/practice"
          label={copy.openPractice}
          variant="primary"
        />
        <ComplianceActionLink
          accessibilityLabel={copy.backAboutAccessibilityLabel}
          href="/about-the-test"
          label={copy.backAbout}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroBadges: {
    alignItems: 'flex-start',
    gap: space[1],
  },
  summaryCard: {
    backgroundColor: colors.surfaceWarm,
    gap: space[0.75],
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  summaryBody: {
    color: colors.textSecondary,
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
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  requirementSummary: {
    color: colors.text,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    lineHeight: typography.bodySemibold.lineHeight,
  },
  requirementDetail: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sourceRefs: {
    borderColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    paddingTop: space[1],
  },
  sourceRefsLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  sourceRefsText: {
    color: colors.textSecondary,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.finePrint.lineHeight,
  },
  checkboxRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.25],
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  checkboxRowChecked: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  checkboxRowPressed: {
    opacity: 0.78,
  },
  checkboxBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.textMuted,
    borderRadius: radius.micro,
    borderWidth: space.hairline,
    height: space[3],
    justifyContent: 'center',
    width: space[3],
  },
  checkboxBoxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxDot: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: space[1],
    width: space[1],
  },
  checkboxText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.bodyMedium.lineHeight,
  },
  sourcesCard: {
    gap: space[1.25],
  },
  sourcesTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  sourcesSubtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sourceList: {
    gap: space[1],
  },
  sourceEntry: {
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    padding: space[1.25],
  },
  sourceMeta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
});
