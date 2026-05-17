import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { colors, typography } from '../lib/theme';

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';

export default function Screen() {
  return (
    <LegalPage title="Sources">
      <LegalSection title="Primary study material">
        Sverige i fokus. Utbildningsmaterial till medborgarskapsprov. Grundläggande kunskaper om det
        svenska samhället. 1:a upplagan. UHR education material:{' '}
        <Link
          accessibilityLabel="Open UHR education material"
          accessibilityRole="link"
          href={UHR_EDUCATION_MATERIAL_URL}
          style={styles.externalLink}
        >
          {UHR_EDUCATION_MATERIAL_URL}
        </Link>
      </LegalSection>
      <LegalSection title="Question references">
        Each practice question stores UHR chapter, section, and approximate page metadata. The
        section map is tracked in content/uhr-section-map.json and the spreadsheet-friendly content
        database is exported to content/question-bank.csv.
      </LegalSection>
      <LegalSection title="Authority boundaries">
        UHR warns that exercises created by others are not quality-controlled by UHR or another
        authority. This app keeps the same boundary clear: it is independent practice content.
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
