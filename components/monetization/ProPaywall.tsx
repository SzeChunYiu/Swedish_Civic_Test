import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  TIER_COLUMNS,
  TIER_ROWS,
  paywallCtaLabels,
  type TierCell,
  type TierColumn,
  type TierColumnId,
  type TierRow,
} from '../../lib/monetization/tierComparison';
import {
  PRO_LIFETIME_PRICE_LABEL,
  buyProLifetime,
  restoreProLifetime,
  type ProLifetimePurchaseStatus,
  type ProLifetimeRuntimeOptions,
} from '../../lib/monetization/proLifetimePurchase';
import { REMOVE_ADS_PRICE_LABEL } from '../../lib/monetization/purchases';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { ProTierEntitlements } from '../../types/monetization';
import { createDefaultProLifetimeRuntimeOptions } from '../../lib/monetization/useProLifetimeEntitlements';
import { Button } from '../Button';
import { Card } from '../ui/Card';

type ProPaywallStatus = ProLifetimePurchaseStatus | 'idle' | 'error';
type ProAction = 'buy' | 'restore';

type ProPaywallCopy = {
  body: string;
  columnHeader: string;
  excluded: string;
  included: string;
  includedAccessibilityLabel: string;
  priceRowLabel: string;
  priceAccessibilityLabel: (column: TierColumn) => string;
  primaryAccessibilityHint: string;
  restoring: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreIdle: string;
  rowSummary: (row: TierRow, columns: readonly TierColumn[]) => string;
  secondaryPathHint: (label: string, alreadyAdFree: boolean) => string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<ProPaywallStatus, string>;
  title: string;
  titleEyebrow: string;
  upgrading: string;
};

const proPaywallCopy: Record<AppLanguage, ProPaywallCopy> = {
  sv: {
    body: `Pro är ett separat engångsköp med annonsfri studie, avancerad repetition, studieplanering, anteckningsexport och fler markeringar. Ta bort annonser för ${REMOVE_ADS_PRICE_LABEL} finns kvar som en egen enklare annonsfri väg.`,
    columnHeader: 'Funktion',
    excluded: 'Ingår inte',
    included: 'Ingår',
    includedAccessibilityLabel: 'Ingår i nivån',
    priceRowLabel: 'Pris',
    priceAccessibilityLabel: (column) => `${column.labelSv}: ${column.priceSv}`,
    primaryAccessibilityHint:
      'Köper Pro Lifetime med annonsfri studie och avancerade studiefunktioner.',
    restoring: 'Återställer...',
    restoreAccessibilityHint: 'Kontrollerar om Pro redan har köpts på samma butikskonto.',
    restoreAccessibilityLabel: 'Återställ Pro-köp',
    restoreIdle: 'Återställ Pro',
    rowSummary: (row, columns) =>
      columns
        .map((column) => {
          const cell = getCellText(row[column.id], 'sv');
          return `${column.labelSv}: ${cell}`;
        })
        .join('. '),
    secondaryPathHint: (label, alreadyAdFree) =>
      alreadyAdFree
        ? `${label}: din annonsfria studie behålls när du lägger till Pro.`
        : `${label} finns i Ta bort annonser-kortet ovan. Pro innehåller också annonsfri studie, men den vägen finns kvar separat.`,
    statusAccessibilityLabel: (message) => `Status för Pro: ${message}`,
    statusMessages: {
      error: 'Pro-köp är inte tillgängligt. Försök igen senare.',
      idle: 'Jämför nivåerna och välj Pro bara om du vill ha de extra studiefunktionerna.',
      not_found: 'Inget tidigare Pro-köp hittades.',
      pending: 'Väntar på butikens bekräftelse innan Pro aktiveras.',
      persistence_failed:
        'Pro-köpet bekräftades men kunde inte sparas lokalt. Försök återställa köpet.',
      purchased: 'Pro är aktiverat på den här enheten.',
      restored: 'Pro är återställt på den här enheten.',
    },
    title: 'Jämför Gratis, Annonsfri och Pro',
    titleEyebrow: 'Pro Lifetime',
    upgrading: 'Köper...',
  },
  en: {
    body: `Pro is a separate one-time purchase with ad-free study, advanced review, study planning, notes export, and richer highlights. Remove Ads for ${REMOVE_ADS_PRICE_LABEL} stays available as its own simpler ad-free path.`,
    columnHeader: 'Feature',
    excluded: 'Not included',
    included: 'Included',
    includedAccessibilityLabel: 'Included in this tier',
    priceRowLabel: 'Price',
    priceAccessibilityLabel: (column) => `${column.labelEn}: ${column.priceEn}`,
    primaryAccessibilityHint: 'Buys Pro Lifetime with ad-free study and advanced study features.',
    restoring: 'Restoring...',
    restoreAccessibilityHint: 'Checks whether Pro was already bought with the same store account.',
    restoreAccessibilityLabel: 'Restore Pro purchase',
    restoreIdle: 'Restore Pro',
    rowSummary: (row, columns) =>
      columns
        .map((column) => {
          const cell = getCellText(row[column.id], 'en');
          return `${column.labelEn}: ${cell}`;
        })
        .join('. '),
    secondaryPathHint: (label, alreadyAdFree) =>
      alreadyAdFree
        ? `${label}: your ad-free study stays active when you add Pro.`
        : `${label} is still handled by the Remove Ads card above. Pro also includes ad-free study, but that path remains separate.`,
    statusAccessibilityLabel: (message) => `Pro status: ${message}`,
    statusMessages: {
      error: 'Pro purchase is unavailable. Try again later.',
      idle: 'Compare the tiers and choose Pro only if you want the extra study features.',
      not_found: 'No previous Pro purchase was found.',
      pending: 'Waiting for store confirmation before enabling Pro.',
      persistence_failed:
        'Pro was confirmed but could not be saved locally. Try restoring the purchase.',
      purchased: 'Pro is active on this device.',
      restored: 'Pro has been restored on this device.',
    },
    title: 'Compare Free, Ad-Free, and Pro',
    titleEyebrow: 'Pro Lifetime',
    upgrading: 'Buying...',
  },
};

function getCellText(cell: TierCell, language: AppLanguage): string {
  if (cell.kind === 'check') return proPaywallCopy[language].included;
  if (cell.kind === 'cross') return proPaywallCopy[language].excluded;
  return language === 'sv' ? cell.sv : cell.en;
}

function getRowCell(row: TierRow, columnId: TierColumnId): TierCell {
  return row[columnId];
}

export function ProPaywall({
  alreadyAdFree,
  language = 'sv',
  onEntitlementsChange,
  runtimeOptions,
}: {
  alreadyAdFree: boolean;
  language?: AppLanguage;
  onEntitlementsChange?: (entitlements: ProTierEntitlements) => void;
  runtimeOptions?: ProLifetimeRuntimeOptions;
}) {
  const copy = proPaywallCopy[language];
  const ctaLabels = paywallCtaLabels({ alreadyAdFree });
  const [activeAction, setActiveAction] = useState<ProAction | null>(null);
  const [status, setStatus] = useState<ProPaywallStatus>('idle');
  const purchaseActionInFlightRef = useRef(false);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const purchaseRuntime = useMemo<ProLifetimeRuntimeOptions>(
    () => runtimeOptions ?? createDefaultProLifetimeRuntimeOptions(),
    [runtimeOptions],
  );
  const primaryLabel = language === 'sv' ? ctaLabels.primarySv : ctaLabels.primaryEn;
  const secondaryLabel = language === 'sv' ? ctaLabels.secondarySv : ctaLabels.secondaryEn;
  const statusMessage = copy.statusMessages[status];
  const runProAction = useCallback(
    async (action: ProAction) => {
      if (purchaseActionInFlightRef.current) return;

      purchaseActionInFlightRef.current = true;
      setActiveAction(action);

      try {
        const result =
          action === 'buy'
            ? await buyProLifetime(purchaseRuntime)
            : await restoreProLifetime(purchaseRuntime);

        onEntitlementsChange?.(result.entitlements);
        setStatus(result.status);
      } catch {
        setStatus('error');
      } finally {
        purchaseActionInFlightRef.current = false;
        setActiveAction(null);
      }
    },
    [onEntitlementsChange, purchaseRuntime],
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{copy.titleEyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.featureCell, styles.columnHeader]}>{copy.columnHeader}</Text>
          {TIER_COLUMNS.map((column) => (
            <View
              accessibilityLabel={copy.priceAccessibilityLabel(column)}
              accessibilityRole="text"
              key={column.id}
              style={styles.tierHeaderCell}
            >
              <Text style={styles.tierName}>
                {language === 'sv' ? column.labelSv : column.labelEn}
              </Text>
              <Text style={styles.tierPrice}>
                {language === 'sv' ? column.priceSv : column.priceEn}
              </Text>
            </View>
          ))}
        </View>

        <View
          accessible
          accessibilityLabel={`${copy.priceRowLabel}. ${TIER_COLUMNS.map(
            (column) =>
              `${language === 'sv' ? column.labelSv : column.labelEn}: ${
                language === 'sv' ? column.priceSv : column.priceEn
              }`,
          ).join('. ')}`}
          accessibilityRole="summary"
          style={styles.row}
        >
          <Text style={styles.featureCell}>{copy.priceRowLabel}</Text>
          {TIER_COLUMNS.map((column) => (
            <Text
              accessibilityLabel={copy.priceAccessibilityLabel(column)}
              accessibilityRole="text"
              key={column.id}
              style={styles.tierCell}
            >
              {language === 'sv' ? column.priceSv : column.priceEn}
            </Text>
          ))}
        </View>

        {TIER_ROWS.map((row) => (
          <View
            accessible
            accessibilityLabel={`${language === 'sv' ? row.labelSv : row.labelEn}. ${copy.rowSummary(
              row,
              TIER_COLUMNS,
            )}`}
            accessibilityRole="summary"
            key={row.id}
            style={styles.row}
          >
            <Text style={styles.featureCell}>{language === 'sv' ? row.labelSv : row.labelEn}</Text>
            {TIER_COLUMNS.map((column) => {
              const cellText = getCellText(getRowCell(row, column.id), language);
              return (
                <Text
                  accessibilityLabel={
                    getRowCell(row, column.id).kind === 'check'
                      ? copy.includedAccessibilityLabel
                      : cellText
                  }
                  accessibilityRole="text"
                  key={column.id}
                  style={styles.tierCell}
                >
                  {cellText}
                </Text>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          accessibilityHint={copy.primaryAccessibilityHint}
          accessibilityLabel={primaryLabel}
          accessibilityRole="button"
          accessibilityState={{ busy: activeAction === 'buy', disabled: activeAction !== null }}
          disabled={activeAction !== null}
          onPress={() => void runProAction('buy')}
          style={styles.actionButton}
        >
          {activeAction === 'buy' ? copy.upgrading : primaryLabel}
        </Button>
        <Button
          accessibilityHint={copy.restoreAccessibilityHint}
          accessibilityLabel={copy.restoreAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{
            busy: activeAction === 'restore',
            disabled: activeAction !== null,
          }}
          disabled={activeAction !== null}
          onPress={() => void runProAction('restore')}
          style={styles.actionButton}
          variant="secondary"
        >
          {activeAction === 'restore' ? copy.restoring : copy.restoreIdle}
        </Button>
      </View>

      <Text style={styles.secondaryPath}>
        {copy.secondaryPathHint(secondaryLabel, alreadyAdFree)}
      </Text>
      <Text
        aria-live="polite"
        accessibilityLabel={copy.statusAccessibilityLabel(statusMessage)}
        accessibilityLiveRegion="polite"
        style={styles.status}
      >
        {statusMessage}
      </Text>
      <Text style={styles.priceNote}>{PRO_LIFETIME_PRICE_LABEL}</Text>
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1.5],
    },
    header: {
      gap: space[0.75],
    },
    eyebrow: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      textTransform: 'uppercase',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.sectionTitle.fontWeight,
      lineHeight: typography.sectionTitle.lineHeight,
    },
    body: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    table: {
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      overflow: 'hidden',
    },
    row: {
      alignItems: 'stretch',
      borderColor: themeColors.border,
      borderTopWidth: space.hairline,
      flexDirection: 'row',
      gap: space[0.75],
      paddingHorizontal: space[1],
      paddingVertical: space[1],
    },
    headerRow: {
      backgroundColor: themeColors.surfaceMuted,
      borderTopWidth: space[0],
    },
    featureCell: {
      color: themeColors.text,
      flex: 1.35,
      fontSize: typography.finePrint.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.finePrint.lineHeight,
    },
    columnHeader: {
      color: themeColors.textMuted,
    },
    tierHeaderCell: {
      flex: 1,
      gap: space[0.5],
    },
    tierName: {
      color: themeColors.text,
      fontSize: typography.finePrint.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.finePrint.lineHeight,
    },
    tierPrice: {
      color: themeColors.textMuted,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    tierCell: {
      color: themeColors.textSecondary,
      flex: 1,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    actionButton: {
      minWidth: 132,
    },
    secondaryPath: {
      color: themeColors.textSecondary,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.finePrint.lineHeight,
    },
    status: {
      color: themeColors.textMuted,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.finePrint.lineHeight,
    },
    priceNote: {
      color: themeColors.textPlaceholder,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
  });
}
