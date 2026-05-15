import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../../lib/theme';

export default function QuizSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz {sessionId}</Text>
      <Text style={styles.subtitle}>Quiz session placeholder.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: space[3],
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.625 },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: space[1] },
});
