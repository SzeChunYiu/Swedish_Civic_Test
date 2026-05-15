import * as Speech from 'expo-speech';

export function speakSwedish(text: string): void {
  if (text.trim().length === 0) return;
  Speech.speak(text, { language: 'sv-SE' });
}
