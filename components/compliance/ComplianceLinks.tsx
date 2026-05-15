import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../../lib/theme';

const links = [
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/sources', label: 'Sources' },
  { href: '/support', label: 'Support' },
] as const;

export function ComplianceLinks() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legal and sources</Text>
      <View style={styles.links}>
        {links.map((link) => (
          <Link
            key={link.href}
            accessibilityLabel={`Open ${link.label}`}
            href={link.href}
            style={styles.link}
          >
            {link.label}
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
    padding: space[2],
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.25],
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
});
