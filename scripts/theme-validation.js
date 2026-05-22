const REQUIRED_THEME_CONTRAST_PAIRS = Object.freeze(
  [
    ['text', 'surface'],
    ['text', 'canvas'],
    ['textSoft', 'surface'],
    ['textSoft', 'canvas'],
    ['textSecondary', 'canvas'],
    ['textSecondary', 'surfaceWarm'],
    ['textMuted', 'canvas'],
    ['textMuted', 'surfaceWarm'],
    ['textDisclaimer', 'surface'],
    ['textDisclaimer', 'canvas'],
    ['textDisclaimer', 'surfaceWarm'],
    ['textPlaceholder', 'surface'],
    ['textPlaceholder', 'canvas'],
    ['textPlaceholder', 'surfaceWarm'],
    ['badgeBlueText', 'badgeBlueBg'],
    ['accent', 'surface'],
    ['success', 'surface'],
    ['success', 'successSoft'],
    ['warning', 'surface'],
    ['warning', 'warningSoft'],
    ['danger', 'surface'],
    ['danger', 'dangerSoft'],
  ].map((pair) => Object.freeze(pair)),
);

module.exports = {
  REQUIRED_THEME_CONTRAST_PAIRS,
};
