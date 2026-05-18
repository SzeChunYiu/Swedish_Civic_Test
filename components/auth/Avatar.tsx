import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../lib/theme';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
};

function initialsFromName(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({ uri, name, email, size = 36 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  const initials = initialsFromName(name, email);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, dimensionStyle]}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.fallback, dimensionStyle]}>
      <Text
        style={[
          styles.initials,
          { fontSize: Math.max(12, Math.floor(size * 0.4)), lineHeight: size },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.badgeBlueBg,
    justifyContent: 'center',
  },
  initials: {
    color: colors.badgeBlueText,
    fontFamily: typography.bodyBold.fontFamily,
    fontWeight: typography.bodyBold.fontWeight,
    textAlign: 'center',
  },
});
