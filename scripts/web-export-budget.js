const WEB_ENTRY_BUNDLE_BUDGET = {
  maxRawBytes: 5_302_740,
  maxGzipBytes: 1_169_609,
  maxBrotliBytes: 848_489,
  baseline: {
    measuredAt: '2026-05-23',
    entryBundle: '_expo/static/js/web/entry-ae08d50efdaae692cb6c77772e36f561.js',
    bundleCount: 3,
    measuredRawBytes: 5_002_584,
    measuredGzipBytes: 1_103_404,
    measuredBrotliBytes: 800_461,
    sizeDrivers: [
      'Expo Router and React Native Web single-entry shell',
      'expanded embedded canonical question bank with generated practice variants',
      'expanded question localization pilot data for the coming-soon picker locales',
    ],
    rationale:
      'Measured re-baseline after the expanded static question bank and localization pilot data became embedded in the native web entry; ceilings keep about 6% headroom while the app is still a single Metro web entry.',
  },
};

module.exports = { WEB_ENTRY_BUNDLE_BUDGET };
