import { Image, StyleSheet, Text, View } from 'react-native';

import { typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type AvatarProps = {
  email?: string | null;
  name?: string | null;
  size?: number;
  uri?: string | null;
};

function initialsFromName(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({ email, name, size = 44, uri }: AvatarProps) {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);
  const dimensionStyle = { borderRadius: size / 2, height: size, width: size };

  if (uri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        style={[styles.image, dimensionStyle]}
      />
    );
  }

  return (
    <View accessibilityLabel="Account avatar" style={[styles.fallback, dimensionStyle]}>
      <Text
        style={[
          styles.initials,
          { fontSize: Math.max(12, Math.floor(size * 0.38)), lineHeight: size },
        ]}
      >
        {initialsFromName(name, email)}
      </Text>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    fallback: {
      alignItems: 'center',
      backgroundColor: themeColors.badgeBlueBg,
      justifyContent: 'center',
    },
    image: {
      backgroundColor: themeColors.surfaceMuted,
    },
    initials: {
      color: themeColors.badgeBlueText,
      fontWeight: typography.bodyBold.fontWeight,
      textAlign: 'center',
    },
  });
}
