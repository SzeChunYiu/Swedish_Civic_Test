import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { useMemo } from 'react';
import { Badge } from './Badge';
import { radius, shadows, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightSlot?: ReactNode;
  themeColors?: ThemeColors;
}>;

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  themeColors?: ThemeColors;
};

export function ScreenShell({
  title,
  subtitle,
  eyebrow,
  children,
  rightSlot,
  themeColors: providedThemeColors,
}: ScreenShellProps) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          {eyebrow ? <Badge>{eyebrow}</Badge> : null}
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function SectionHeader({
  title,
  subtitle,
  themeColors: providedThemeColors,
}: SectionHeaderProps) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.canvas,
      flex: 1,
    },
    content: {
      gap: space[2.25],
      padding: space[3],
      paddingBottom: space[10],
    },
    hero: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: space[2],
      padding: space[3],
      ...shadows.card,
    },
    heroCopy: {
      gap: space[1.25],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.heroMobile.fontSize,
      fontWeight: typography.heroMobile.fontWeight,
      letterSpacing: typography.heroMobile.letterSpacing,
      lineHeight: typography.heroMobile.lineHeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    rightSlot: {
      gap: space[1],
    },
    sectionHeader: {
      gap: space[0.5],
    },
    sectionTitle: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.sectionTitle.fontWeight,
      lineHeight: typography.sectionTitle.lineHeight,
    },
    sectionSubtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
