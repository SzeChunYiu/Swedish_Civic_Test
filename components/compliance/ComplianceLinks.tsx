import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const links = [
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/sources', label: 'Sources' },
] as const;

export function ComplianceLinks() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legal and sources</Text>
      <View style={styles.links}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={styles.link}>
            {link.label}
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 16,
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 16,
    fontWeight: '700',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  link: {
    color: '#0075de',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
});
