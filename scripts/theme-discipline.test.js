const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const MONETIZATION_THEME_SURFACES = [
  'components/monetization/AdBanner.tsx',
  'components/monetization/AdBanner.native.tsx',
  'components/monetization/LaunchPopupAd.tsx',
  'components/monetization/NativeAdCard.tsx',
  'components/monetization/NativeAdCard.native.tsx',
  'components/monetization/PracticeInterstitialAd.tsx',
  'components/monetization/PremiumBanner.tsx',
  'components/monetization/PricingWedge.tsx',
  'components/monetization/ProPaywall.tsx',
  'components/monetization/RemoveAdsPlacementCta.tsx',
];
const HEADER_THEME_SURFACES = [
  'components/ui/LanguageToggle.tsx',
  'components/ui/LanguagePicker.tsx',
  'components/ui/TopBarActions.tsx',
];
const HEADER_THEME_ICONS = [
  'components/ui/icons/AudioIcon.tsx',
  'components/ui/icons/BookmarkIcon.tsx',
  'components/ui/icons/CloseIcon.tsx',
  'components/ui/icons/GlobeIcon.tsx',
  'components/ui/icons/SearchIcon.tsx',
  'components/ui/icons/SettingsIcon.tsx',
];
const PRO_LEARNING_THEME_SURFACES = ['components/quiz/PostAnswerRewardPanel.tsx'];
const POST_ANSWER_REWARD_CALLERS = ['app/(tabs)/practice.tsx', 'app/quiz/[sessionId].tsx'];
const WEEKLY_RECAP_THEME_SURFACES = [
  'app/recap.tsx',
  'components/compliance/ComplianceActionLink.tsx',
];
const COLOR_LITERAL = /#[0-9a-fA-F]{6}|rgba?\(/;
const SPACING_LITERAL = /\b(?:padding(?:Horizontal|Vertical)?|marginTop|gap|borderRadius):\s*\d/;
const TYPOGRAPHY_LITERAL =
  /\b(?:fontSize|lineHeight|letterSpacing):\s*-?\d|\bfontWeight:\s*['\"]\d/;
const BORDER_WIDTH_LITERAL =
  /\b(?:border(?:Top|Right|Bottom|Left)?Width):\s*(?:StyleSheet\.hairlineWidth|\d)/;
const SHADOW_LITERAL =
  /\b(?:shadowColor|shadowOpacity|shadowRadius|shadowOffset|boxShadow):\s*|\belevation:\s*\d/;
const MIN_BODY_TEXT_CONTRAST = 4.5;
const REQUIRED_CONTRAST_PAIRS = [
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
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readColorTokens() {
  const source = read('lib/theme/colors.ts');
  const colors = {};
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*'([^']+)'/g)) {
    colors[match[1]] = match[2];
  }
  colors.correctBg = colors.successSoft;
  colors.incorrectBg = colors.warningSoft;
  return colors;
}

function readObjectColorTokens(exportName) {
  const source = read('lib/theme/colors.ts');
  const objectMatch = source.match(
    new RegExp(`export const ${exportName} = \\{([\\s\\S]*?)\\} as const`),
  );
  assert.ok(objectMatch, `${exportName} must be exported as a token object`);

  const colors = {};
  for (const match of objectMatch[1].matchAll(/(\w+):\s*'([^']+)'/g)) {
    colors[match[1]] = match[2];
  }
  return colors;
}

function readThemeColorPalettes() {
  return [
    { label: 'light', colors: readColorTokens() },
    { label: 'dark', colors: readObjectColorTokens('darkColors') },
  ];
}

function relativeLuminance(color) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(color || '');
  assert.ok(match, `${color} must be a 6-digit hex token for contrast checks`);
  const channels = [0, 2, 4].map((index) => parseInt(match[1].slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test('app and component styles use theme tokens instead of literal colors, spacing, typography, border widths, or shadows', () => {
  const offenders = [];

  for (const sourceDir of SOURCE_DIRS) {
    for (const filePath of walk(path.join(ROOT, sourceDir))) {
      const relPath = path.relative(ROOT, filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (
          COLOR_LITERAL.test(line) ||
          SPACING_LITERAL.test(line) ||
          TYPOGRAPHY_LITERAL.test(line) ||
          BORDER_WIDTH_LITERAL.test(line) ||
          SHADOW_LITERAL.test(line)
        ) {
          offenders.push(`${relPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test('theme discipline rejects raw shadow and elevation style declarations', () => {
  for (const literal of [
    "shadowColor: 'rgba(0, 0, 0, 0.08)'",
    'shadowOpacity: 0.4',
    'shadowRadius: 18',
    'shadowOffset: { width: 0, height: 12 }',
    "boxShadow: '0 8px 24px rgba(0,0,0,0.12)'",
    'elevation: 3',
  ]) {
    assert.match(literal, SHADOW_LITERAL, `${literal} should be rejected as a raw shadow`);
  }

  for (const tokenized of ['...shadows.card', '...shadows.deep', 'elevation={elevation}']) {
    assert.doesNotMatch(
      tokenized,
      SHADOW_LITERAL,
      `${tokenized} should remain available for tokenized shadow usage`,
    );
  }
});

test('shared elevated surfaces consume tokenized native and web shadows', () => {
  const shadowsSource = read('lib/theme/shadows.ts');
  const surfaceSource = read('components/Surface.tsx');
  const cardSource = read('components/ui/Card.tsx');

  assert.match(
    shadowsSource,
    /card:\s*\{[\s\S]*boxShadow:\s*'0px 6px 20px rgba\(11, 31, 51, 0\.06\)'[\s\S]*shadowColor:\s*whisperShadowColor[\s\S]*elevation:\s*1,/,
    'card shadow token should expose native values plus a matching web boxShadow token',
  );
  assert.match(
    shadowsSource,
    /deep:\s*\{[\s\S]*boxShadow:\s*'0px 8px 24px rgba\(11, 31, 51, 0\.08\)'[\s\S]*shadowColor:\s*whisperShadowColor[\s\S]*elevation:\s*2,/,
    'deep shadow token should expose native values plus a matching web boxShadow token',
  );
  assert.match(
    surfaceSource,
    /cardElevation:\s*\{[\s\S]*\.\.\.shadows\.card[\s\S]*\}/,
    'Surface card elevation should consume the shared card shadow token',
  );
  assert.match(
    surfaceSource,
    /elevated:\s*\{[\s\S]*\.\.\.shadows\.deep[\s\S]*\}/,
    'Surface elevated mode should consume the shared deep shadow token',
  );
  assert.match(
    cardSource,
    /elevated:\s*\{[\s\S]*\.\.\.shadows\.card[\s\S]*\}/,
    'Card elevated mode should consume the shared card shadow token',
  );
  assert.doesNotMatch(
    `${surfaceSource}\n${cardSource}`,
    /\b(?:shadowColor|shadowOpacity|shadowRadius|shadowOffset|boxShadow):\s*|\belevation:\s*\d/,
    'Surface and Card should not declare route-local raw shadow styles',
  );
});

test('semantic text tokens meet WCAG AA contrast on app surfaces', () => {
  for (const { label, colors } of readThemeColorPalettes()) {
    for (const [foreground, background] of REQUIRED_CONTRAST_PAIRS) {
      const ratio = contrastRatio(colors[foreground], colors[background]);
      assert.ok(
        ratio >= 4.5,
        `${label} ${foreground} on ${background} contrast ${ratio.toFixed(2)}:1 is below 4.5:1`,
      );
    }
  }
});

test('disabled button tokens keep labels readable without wrapper opacity', () => {
  const buttonSource = read('components/Button.tsx');

  assert.equal(
    fs.existsSync(path.join(ROOT, 'components/ui/Button.tsx')),
    false,
    'components/ui/Button.tsx should stay retired so disabled styling lives only in components/Button.tsx',
  );
  assert.doesNotMatch(
    buttonSource,
    /disabled:\s*\{\s*opacity\s*:/,
    'Button disabled state should not dim child labels with wrapper opacity',
  );
  assert.match(
    buttonSource,
    /disabled:\s*\{[\s\S]*backgroundColor:\s*themeColors\.surfaceWarm[\s\S]*borderColor:\s*themeColors\.border[\s\S]*\}/,
    'Button disabled state should use tokenized disabled surface and border',
  );
  assert.match(
    buttonSource,
    /disabledLabel:\s*\{[\s\S]*color:\s*themeColors\.textMuted[\s\S]*\}/,
    'Button disabled label should use the readable muted text token',
  );

  for (const { label, colors } of readThemeColorPalettes()) {
    assert.ok(colors.textMuted, `${label} theme textMuted token should be present`);
    assert.ok(colors.surfaceWarm, `${label} theme surfaceWarm token should be present`);

    const disabledLabelContrast = contrastRatio(colors.textMuted, colors.surfaceWarm);
    assert.ok(
      disabledLabelContrast >= MIN_BODY_TEXT_CONTRAST,
      `${label} disabled button label contrast ${disabledLabelContrast.toFixed(
        2,
      )} should be at least ${MIN_BODY_TEXT_CONTRAST}:1`,
    );
  }
});

test('form fields and primary button controls consume dedicated radius tokens', () => {
  const buttonSource = read('components/Button.tsx');
  const searchSource = read('app/search.tsx');
  const settingsSource = read('app/settings.tsx');

  assert.equal(
    fs.existsSync(path.join(ROOT, 'components/ui/Button.tsx')),
    false,
    'components/ui/Button.tsx should stay retired; radius checks target components/Button.tsx',
  );
  assert.match(buttonSource, /base:\s*\{[^}]*borderRadius:\s*radius\.button/);
  assert.match(searchSource, /searchInput:\s*\{[^}]*borderRadius:\s*radius\.input/);
  assert.match(settingsSource, /importInput:\s*\{[^}]*borderRadius:\s*radius\.input/);
  assert.match(settingsSource, /secondaryButton:\s*\{[^}]*borderRadius:\s*radius\.button/);
  assert.match(settingsSource, /outlineButton:\s*\{[^}]*borderRadius:\s*radius\.button/);

  assert.doesNotMatch(buttonSource, /base:\s*\{[^}]*borderRadius:\s*radius\.card/);
  assert.doesNotMatch(searchSource, /searchInput:\s*\{[^}]*borderRadius:\s*radius\.card/);
  assert.doesNotMatch(settingsSource, /importInput:\s*\{[^}]*borderRadius:\s*radius\.card/);
});

test('utility routes resolve semantic colors from the active theme', () => {
  for (const routePath of [
    'app/search.tsx',
    'app/citizenship-requirements.tsx',
    'app/onboarding.tsx',
  ]) {
    const source = read(routePath);

    assert.match(source, /themeColors/, `${routePath} should derive local styles from themeColors`);
    assert.doesNotMatch(
      source,
      /import \{ colors[,}]/,
      `${routePath} must not import static light color tokens`,
    );
    assert.doesNotMatch(
      source,
      /\bcolors\./,
      `${routePath} must not read route-local colors.* values`,
    );
  }

  const searchSource = read('app/search.tsx');
  const citizenshipSource = read('app/citizenship-requirements.tsx');
  const onboardingSource = read('app/onboarding.tsx');

  assert.match(searchSource, /colorsForThemeMode\(themeMode, systemColorScheme\)/);
  assert.match(citizenshipSource, /const \{ colors: themeColors \} = useTheme\(\);/);
  assert.match(citizenshipSource, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(citizenshipSource, /<ScreenShell[\s\S]*themeColors=\{themeColors\}/);
  assert.match(citizenshipSource, /<QuestionDisclaimer themeColors=\{themeColors\}/);
  assert.match(onboardingSource, /const themeColors = useThemeColors\(\);/);
  assert.match(onboardingSource, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(onboardingSource, /<QuestionDisclaimer themeColors=\{themeColors\}/);
  assert.match(onboardingSource, /placeholderTextColor=\{themeColors\.textMuted\}/);
});

test('native ebook route resolves semantic colors from the active theme', () => {
  const source = read('app/ebook.tsx');

  assert.match(source, /useThemeColors\(\)/, 'Ebook should read the active theme context');
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\)/,
    'Ebook should memoize route-local styles from active theme colors',
  );
  assert.match(
    source,
    /function createStyles\(themeColors: ThemeColors\)/,
    'Ebook should derive local styles from ThemeColors',
  );
  assert.match(
    source,
    /<ScreenShell[\s\S]*themeColors=\{themeColors\}/,
    'Ebook should pass active theme colors to its route shell',
  );
  assert.match(
    source,
    /<Badge themeColors=\{themeColors\}/,
    'Ebook should pass active theme colors to local badges',
  );
  assert.match(
    source,
    /themeColors\.focusSoft/,
    'Ebook pressed states should resolve focus feedback from ThemeColors',
  );
  assert.match(
    source,
    /themeColors\.surfaceWarm/,
    'Ebook provenance and section-source panels should use active warm surfaces',
  );
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/lib\/theme['"]/,
    'Ebook must not import the static light colors singleton',
  );
  assert.doesNotMatch(source, /\bcolors\./, 'Ebook must not read static colors.* values');
});

test('monetization surfaces resolve semantic colors from the active theme', () => {
  for (const componentPath of MONETIZATION_THEME_SURFACES) {
    const source = read(componentPath);

    assert.match(
      source,
      /useThemeColors\(\)/,
      `${componentPath} should read the active theme color context`,
    );
    assert.match(
      source,
      /function createStyles\(themeColors: ThemeColors\)/,
      `${componentPath} should derive styles from ThemeColors`,
    );
    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
      `${componentPath} must not import the static light color singleton`,
    );
    assert.doesNotMatch(
      source,
      /\bcolors\./,
      `${componentPath} must not read static colors.* values`,
    );
  }
});

test('profile Remove Ads focus styles resolve from active theme colors', () => {
  const source = read('app/(tabs)/profile.tsx');

  assert.match(source, /useThemeColors\(\)/, 'Profile should read the active theme context');
  assert.match(
    source,
    /function createStyles\(themeColors: ThemeColors\)/,
    'Profile should derive local styles from ThemeColors',
  );
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\)/,
    'Profile should memoize active-theme styles',
  );
  assert.match(
    source,
    /removeAdsPaywallFocused:\s*\{[\s\S]*borderColor:\s*themeColors\.focus/,
    'Focused Remove Ads wrapper should use the active focus token',
  );
  assert.match(
    source,
    /removeAdsFocusCue:\s*\{[\s\S]*color:\s*themeColors\.accent/,
    'Focused Remove Ads cue should use the active accent token',
  );
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
    'Profile must not import the static light colors singleton',
  );
  assert.doesNotMatch(source, /\bcolors\./, 'Profile must not read static colors.* values');
});

test('weekly recap quiet-week and action link colors resolve from active theme colors', () => {
  for (const sourcePath of WEEKLY_RECAP_THEME_SURFACES) {
    const source = read(sourcePath);

    assert.match(
      source,
      /useThemeColors\(\)/,
      `${sourcePath} should read the active theme context`,
    );
    assert.match(
      source,
      /function createStyles\(themeColors: ThemeColors\)/,
      `${sourcePath} should derive styles from ThemeColors`,
    );
    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"][^'"]*lib\/theme['"]/,
      `${sourcePath} must not import the static light colors singleton`,
    );
    assert.doesNotMatch(source, /\bcolors\./, `${sourcePath} must not read static colors.* values`);
  }

  const recapSource = read('app/recap.tsx');
  assert.match(
    recapSource,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\)/,
    'Weekly recap should memoize route-local styles from active theme colors',
  );
  assert.match(
    recapSource,
    /cardTitle:\s*\{[\s\S]*color:\s*themeColors\.text/,
    'Quiet-week title should use the active text token',
  );
  assert.match(
    recapSource,
    /cardBody:\s*\{[\s\S]*color:\s*themeColors\.textSecondary/,
    'Quiet-week body should use the active secondary text token',
  );

  const actionLinkSource = read('components/compliance/ComplianceActionLink.tsx');
  assert.match(
    actionLinkSource,
    /useComplianceActionLinkWebStyles\(themeColors\)/,
    'Compliance action link hover/focus CSS should receive active theme colors',
  );
  assert.match(
    actionLinkSource,
    /background-color: \$\{themeColors\.focusSoft\}/,
    'Secondary compliance link web focus background should use active theme colors',
  );
  assert.match(
    actionLinkSource,
    /secondaryLabel:\s*\{[\s\S]*color:\s*themeColors\.text/,
    'Secondary compliance link label should use the active text token',
  );
});

test('post-answer reward surfaces resolve semantic colors from the active theme', () => {
  for (const componentPath of PRO_LEARNING_THEME_SURFACES) {
    const source = read(componentPath);

    assert.match(
      source,
      /useThemeColors\(\)/,
      `${componentPath} should read the active theme color context`,
    );
    assert.match(
      source,
      /function createStyles\(themeColors: ThemeColors\)/,
      `${componentPath} should derive styles from ThemeColors`,
    );
    assert.match(
      source,
      /<Badge themeColors=\{themeColors\}/,
      `${componentPath} should pass active theme colors to reward badges`,
    );
    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
      `${componentPath} must not import the static light color singleton`,
    );
    assert.doesNotMatch(
      source,
      /\bcolors\./,
      `${componentPath} must not read static colors.* values`,
    );
  }

  for (const callerPath of POST_ANSWER_REWARD_CALLERS) {
    const source = read(callerPath);

    assert.match(
      source,
      /<PostAnswerRewardPanel[\s\S]*answerXp=\{[\s\S]*totalXp=\{totalXp\}/,
      `${callerPath} should render the themed post-answer reward panel with XP totals`,
    );
    assert.match(
      source,
      /calculateLevel\(totalXp\)/,
      `${callerPath} should pass the current level`,
    );
    assert.match(
      source,
      /calculateStreak\(answerDates\)/,
      `${callerPath} should pass the current answer streak`,
    );
  }
});

test('TopBarActions LanguagePicker GlobeIcon SearchIcon AudioIcon focusSoft avoid the static colors singleton', () => {
  for (const componentPath of HEADER_THEME_SURFACES) {
    const source = read(componentPath);

    assert.match(
      source,
      /useThemeColors\(\)/,
      `${componentPath} should read the active theme color context`,
    );
    assert.match(
      source,
      /function createStyles\(themeColors: ThemeColors\)/,
      `${componentPath} should derive styles from ThemeColors`,
    );
    assert.match(
      source,
      /themeColors\.focusSoft/,
      `${componentPath} should resolve focus feedback from ThemeColors`,
    );
    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
      `${componentPath} must not import the static light colors singleton`,
    );
    assert.doesNotMatch(
      source,
      /\bcolors\./,
      `${componentPath} must not read static colors.* values`,
    );
  }

  const topBarActionsSource = read('components/ui/TopBarActions.tsx');
  const languagePickerSource = read('components/ui/LanguagePicker.tsx');

  assert.match(topBarActionsSource, /useTopBarActionLinkWebStyles\(themeColors\)/);
  assert.match(topBarActionsSource, /background-color: \$\{themeColors\.focusSoft\}/);
  assert.match(topBarActionsSource, /<SearchIcon size=\{iconSize\} color=\{themeColors\.text\}/);
  assert.match(topBarActionsSource, /<AudioIcon size=\{iconSize\} color=\{themeColors\.text\}/);
  assert.match(
    languagePickerSource,
    /<GlobeIcon size=\{triggerIconSize\} color=\{themeColors\.textMuted\}/,
  );
  assert.match(
    languagePickerSource,
    /<CloseIcon size=\{closeIconSize\} color=\{themeColors\.textMuted\}/,
  );

  for (const iconPath of HEADER_THEME_ICONS) {
    const source = read(iconPath);

    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/\.\.\/lib\/theme['"]/,
      `${iconPath} must not import the static light colors singleton`,
    );
    assert.doesNotMatch(source, /\bcolors\./, `${iconPath} must not read colors.* values`);
    assert.match(source, /color: string/, `${iconPath} should receive an explicit icon color`);
  }
});

test('theme content validation parser keeps one token schema validator', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/validate-content.js'), 'utf8');
  const declarationCount = [...source.matchAll(/function validateThemeTokenSchema\(\)/g)].length;

  assert.equal(declarationCount, 1);
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ['--check', 'scripts/validate-content.js'], {
      cwd: ROOT,
      stdio: 'pipe',
    }),
  );
});
