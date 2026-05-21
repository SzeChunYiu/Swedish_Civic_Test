const WEB_ENTRY_BUNDLE_BUDGET = {
  maxRawBytes: 2_555_000,
  maxGzipBytes: 628_000,
  maxBrotliBytes: 490_000,
  baseline: {
    measuredAt: '2026-05-20',
    entryBundle: '_expo/static/js/web/entry-79142e674b1420e52972bc613d73511e.js',
    bundleCount: 3,
    measuredRawBytes: 2_431_194,
    measuredGzipBytes: 597_930,
    measuredBrotliBytes: 466_218,
    sizeDrivers: [
      'Expo Router and React Native Web single-entry shell',
      'embedded canonical question bank with generated practice variants',
      'question localization pilot data for the coming-soon picker locales',
    ],
    rationale:
      'Measured re-baseline after the 2026 question-bank and localization expansion; ceilings keep about 5% headroom while the app is still a single Metro web entry.',
  },
};

module.exports = { WEB_ENTRY_BUNDLE_BUDGET };
