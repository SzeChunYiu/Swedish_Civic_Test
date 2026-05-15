# 07 — Swedish Audio Plan Without AI Costs

## Goal

Add Swedish listening support without using paid AI voice features.

## Audio options

### Option A — Device text-to-speech

Use native device TTS through `expo-speech`.

Pros:

- low cost,
- no audio hosting,
- no AI server cost,
- works for dynamic questions,
- small app size.

Cons:

- voice quality depends on device,
- pronunciation must be tested,
- less polished than human audio.

MVP recommendation: **Use device TTS first.**

Implementation:

```ts
import * as Speech from "expo-speech";

export function speakSwedish(text: string) {
  Speech.stop();
  Speech.speak(text, {
    language: "sv-SE",
    rate: 0.9
  });
}
```

UI:

- speaker icon next to question,
- speaker icon next to correct answer,
- settings toggle: audio on/off,
- optional speed control.

### Option B — Human-recorded audio

Use a native Swedish speaker to record key items.

Start with:

1. 150–300 important glossary words.
2. 500 question prompts later.
3. Short explanation summaries later.

Pros:

- best quality,
- trustworthy,
- polished.

Cons:

- upfront cost,
- app size or hosting cost,
- update complexity.

### Option C — Link to UHR official audio

UHR says an in-read/audio version of the material will be available on the UHR page.

Safe approach:

- link to UHR audio page,
- mention official audio availability,
- do not embed or redistribute unless rights are confirmed.

## Recommended audio roadmap

### MVP

- Use device TTS for questions and options.
- Add glossary pronunciation with TTS.
- Add settings for audio.

### Version 1.1

- Record top 150 glossary words with human voice.
- Keep TTS for dynamic questions.

### Version 2.0

- Record all question prompts.
- Add listening practice mini-game.

## Audio UX

Study Mode:

- user can tap speaker any time,
- show Swedish and English,
- can replay audio.

Exam Mode:

- audio optional,
- if enabled, user can tap question audio,
- no auto-play by default.

## Accessibility

Audio helps:

- learners with reading difficulty,
- users learning Swedish pronunciation,
- users commuting or walking,
- users who understand spoken Swedish better than written Swedish.

## Storage options for human audio

If human audio is added:

- bundle small glossary audio in the app,
- store larger audio files remotely,
- cache played audio locally.

Recommended format:

- `.m4a` or compressed `.mp3`
- file naming: `glossary_riksdag_sv_se.m4a`
