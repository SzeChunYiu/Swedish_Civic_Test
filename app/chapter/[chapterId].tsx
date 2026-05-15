import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chapter {chapterId}</Text>
      <Text style={styles.subtitle}>Chapter detail placeholder.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#ffffff', padding: 24 },
  title: { color: 'rgba(0, 0, 0, 0.95)', fontSize: 26, fontWeight: '700', letterSpacing: -0.625 },
  subtitle: { color: '#615d59', fontSize: 16, lineHeight: 24, marginTop: 8 },
});
