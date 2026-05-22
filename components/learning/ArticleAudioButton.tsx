import { useEffect, useMemo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { chunkArticleNarrationText } from '../../lib/audio/ebookNarration';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { Button } from '../Button';

type ArticleAudioScope = 'article' | 'section';

type ArticleAudioButtonCopy = {
  disabledHint: string;
  disabledLabel: string;
  playArticleHint: string;
  playArticleLabel: string;
  playSectionHint: string;
  playSectionLabel: string;
  stopArticleHint: string;
  stopArticleLabel: string;
  stopSectionHint: string;
  stopSectionLabel: string;
  unavailableHint: string;
  unavailableLabel: string;
};

const articleAudioButtonCopy: Record<AppLanguage, ArticleAudioButtonCopy> = {
  sv: {
    disabledHint: 'Aktivera ljud i Inställningar för att höra svensk artikeltext.',
    disabledLabel: 'Ljud är avstängt',
    playArticleHint: 'Spelar upp den svenska artikeltexten.',
    playArticleLabel: 'Lyssna på artikeln',
    playSectionHint: 'Spelar upp det här svenska avsnittet.',
    playSectionLabel: 'Lyssna på avsnittet',
    stopArticleHint: 'Stoppar uppläsningen av artikeln.',
    stopArticleLabel: 'Stoppa artikelljud',
    stopSectionHint: 'Stoppar uppläsningen av avsnittet.',
    stopSectionLabel: 'Stoppa avsnittsljud',
    unavailableHint: 'Ljud behöver svensk artikeltext före uppspelning.',
    unavailableLabel: 'Artikelljud saknas',
  },
  en: {
    disabledHint: 'Enable audio in Settings to hear Swedish article text.',
    disabledLabel: 'Audio is disabled',
    playArticleHint: 'Plays the Swedish article text aloud.',
    playArticleLabel: 'Listen to article',
    playSectionHint: 'Plays this Swedish section aloud.',
    playSectionLabel: 'Listen to section',
    stopArticleHint: 'Stops the article playback.',
    stopArticleLabel: 'Stop article audio',
    stopSectionHint: 'Stops the section playback.',
    stopSectionLabel: 'Stop section audio',
    unavailableHint: 'Audio needs Swedish article text before playback.',
    unavailableLabel: 'Article audio is unavailable',
  },
};

function scopedCopy(copy: ArticleAudioButtonCopy, scope: ArticleAudioScope, isSpeaking: boolean) {
  if (scope === 'section') {
    return isSpeaking
      ? { hint: copy.stopSectionHint, label: copy.stopSectionLabel }
      : { hint: copy.playSectionHint, label: copy.playSectionLabel };
  }

  return isSpeaking
    ? { hint: copy.stopArticleHint, label: copy.stopArticleLabel }
    : { hint: copy.playArticleHint, label: copy.playArticleLabel };
}

export function ArticleAudioButton({
  enabled = true,
  language = 'sv',
  rate,
  scope = 'article',
  style,
  text = '',
}: {
  enabled?: boolean;
  language?: AppLanguage;
  rate?: number;
  scope?: ArticleAudioScope;
  style?: StyleProp<ViewStyle>;
  text?: string | null;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechText = typeof text === 'string' ? text.trim() : '';
  const chunks = useMemo(() => chunkArticleNarrationText(speechText), [speechText]);
  const hasSpeechText = chunks.length > 0;
  const canPlayAudio = enabled && hasSpeechText;
  const copy = articleAudioButtonCopy[language];
  const activeCopy = scopedCopy(copy, scope, isSpeaking);
  const label = !enabled
    ? copy.disabledLabel
    : !hasSpeechText
      ? copy.unavailableLabel
      : activeCopy.label;
  const accessibilityHint = !enabled
    ? copy.disabledHint
    : !hasSpeechText
      ? copy.unavailableHint
      : activeCopy.hint;
  const playbackRunRef = useRef(0);
  const previousSpeechTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousSpeechTextRef.current === null) {
      previousSpeechTextRef.current = speechText;
      return;
    }

    previousSpeechTextRef.current = speechText;
    playbackRunRef.current += 1;
    stopSpeech();
    setIsSpeaking(false);
  }, [speechText]);

  useEffect(() => {
    if (!canPlayAudio && isSpeaking) {
      playbackRunRef.current += 1;
      stopSpeech();
      setIsSpeaking(false);
    }
  }, [canPlayAudio, isSpeaking]);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      stopSpeech();
    };
  }, []);

  const playChunk = (index: number, runId: number) => {
    if (playbackRunRef.current !== runId) return;
    const chunk = chunks[index];
    if (!chunk) {
      setIsSpeaking(false);
      return;
    }

    speakSwedish(chunk, {
      rate,
      onDone: () => {
        if (playbackRunRef.current !== runId) return;
        if (index + 1 >= chunks.length) {
          setIsSpeaking(false);
          return;
        }
        playChunk(index + 1, runId);
      },
      onError: () => {
        if (playbackRunRef.current === runId) setIsSpeaking(false);
      },
      onStopped: () => {
        if (playbackRunRef.current === runId) setIsSpeaking(false);
      },
    });
  };

  return (
    <Button
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: isSpeaking, disabled: !canPlayAudio }}
      disabled={!canPlayAudio}
      onPress={() => {
        if (!canPlayAudio) return;
        if (isSpeaking) {
          playbackRunRef.current += 1;
          stopSpeech();
          setIsSpeaking(false);
          return;
        }

        const runId = playbackRunRef.current + 1;
        playbackRunRef.current = runId;
        stopSpeech();
        setIsSpeaking(true);
        playChunk(0, runId);
      }}
      style={style}
      variant="secondary"
    >
      {label}
    </Button>
  );
}
