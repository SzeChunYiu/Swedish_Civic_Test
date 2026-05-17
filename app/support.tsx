import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { colors, typography } from '../lib/theme';

const PUBLIC_SUPPORT_URL = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';

export default function Screen() {
  return (
    <LegalPage title="Support and feedback">
      <LegalSection title="What to report">
        Send a support note if you find a content issue, confusing Swedish wording, a broken source
        reference, an audio problem, or a bug in the study flow.
      </LegalSection>
      <LegalSection title="No personal data">
        Please include no personal data, government identifiers, immigration case details, or
        sensitive account information in support messages.
      </LegalSection>
      <LegalSection title="Independent study tool">
        Support can help with app functionality and content corrections, but it cannot provide
        official exam answers, migration advice, or government decisions.
      </LegalSection>
      <LegalSection title="Public support page">
        Send feedback through the public support page:{' '}
        <Link
          accessibilityLabel="Open public support page"
          accessibilityRole="link"
          href={PUBLIC_SUPPORT_URL}
          style={styles.externalLink}
        >
          {PUBLIC_SUPPORT_URL}
        </Link>
      </LegalSection>
    </LegalPage>
  );
}

const styles = StyleSheet.create({
  externalLink: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'underline',
  },
});
