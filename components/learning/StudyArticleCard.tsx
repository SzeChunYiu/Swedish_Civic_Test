import { StyleSheet, Text } from 'react-native';

import { colors, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface StudyArticleCardProps {
  accessibilityMode?: 'summary' | 'presentation';
  ctaLabel: string;
  eyebrow: string;
  meta: string;
  subtitle: string;
  title: string;
}

export function StudyArticleCard({
  accessibilityMode = 'summary',
  ctaLabel,
  eyebrow,
  meta,
  subtitle,
  title,
}: StudyArticleCardProps) {
  const shouldGroupForAccessibility = accessibilityMode === 'summary';
  const shouldHideNestedAccessibility = accessibilityMode === 'presentation';
  const accessibilityLabel = `${eyebrow}. ${title}. ${subtitle}. ${meta}. ${ctaLabel}.`;

  return (
    <Card
      accessibilityElementsHidden={shouldHideNestedAccessibility}
      accessibilityLabel={shouldGroupForAccessibility ? accessibilityLabel : undefined}
      elevated
      importantForAccessibility={shouldHideNestedAccessibility ? 'no-hide-descendants' : undefined}
      style={styles.card}
    >
      <Badge tone="green">{eyebrow}</Badge>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.cta}>{ctaLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
  title: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  cta: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.bodyTight.lineHeight,
  },
});
