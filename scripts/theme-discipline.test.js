const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const COLOR_LITERAL = /#[0-9a-fA-F]{6}|rgba?\(/;
const SPACING_LITERAL = /\b(?:padding(?:Horizontal|Vertical)?|marginTop|gap|borderRadius):\s*\d/;
const BORDER_WIDTH_LITERAL =
  /\bborder(?:Top|Right|Bottom|Left)?Width:\s*(?:StyleSheet\.hairlineWidth|\d)/;
const TYPOGRAPHY_LITERAL =
  /\b(?:fontSize|lineHeight|letterSpacing):\s*-?\d|\bfontWeight:\s*['\"]\d/;
const MIN_BODY_TEXT_CONTRAST = 4.5;
const REQUIRED_CONTRAST_PAIRS = [
  ['text', 'surface'],
  ['text', 'canvas'],
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
  ['success', 'surface'],
  ['success', 'successSoft'],
  ['warning', 'surface'],
  ['warning', 'warningSoft'],
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

test('app and component styles use theme tokens instead of literal colors, spacing, or typography', () => {
  const offenders = [];

  for (const sourceDir of SOURCE_DIRS) {
    for (const filePath of walk(path.join(ROOT, sourceDir))) {
      const relPath = path.relative(ROOT, filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (
          COLOR_LITERAL.test(line) ||
          SPACING_LITERAL.test(line) ||
          BORDER_WIDTH_LITERAL.test(line) ||
          TYPOGRAPHY_LITERAL.test(line)
        ) {
          offenders.push(`${relPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test('theme discipline rejects negative literal typography drift', () => {
  assert.equal(TYPOGRAPHY_LITERAL.test('letterSpacing: -0.2,'), true);
  assert.equal(
    TYPOGRAPHY_LITERAL.test('letterSpacing: typography.cardTitle.letterSpacing,'),
    false,
  );
});

test('app and component border widths use named theme tokens', () => {
  for (const rawWidth of [
    'borderWidth: StyleSheet.hairlineWidth,',
    'borderWidth: 1,',
    'borderTopWidth: 0,',
    'borderBottomWidth: 2,',
  ]) {
    assert.match(rawWidth, BORDER_WIDTH_LITERAL);
  }

  for (const tokenizedWidth of ['borderWidth: space.hairline,', 'borderTopWidth: space[0],']) {
    assert.doesNotMatch(tokenizedWidth, BORDER_WIDTH_LITERAL);
  }
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
  const appButtonSource = read('components/Button.tsx');
  const uiButtonSource = read('components/ui/Button.tsx');

  for (const [label, source] of [
    ['app Button', appButtonSource],
    ['ui Button', uiButtonSource],
  ]) {
    assert.doesNotMatch(
      source,
      /disabled:\s*\{\s*opacity\s*:/,
      `${label} disabled state should not dim child labels with wrapper opacity`,
    );
    assert.match(
      source,
      /disabled:\s*\{[\s\S]*backgroundColor:\s*(?:colors|themeColors)\.surfaceWarm[\s\S]*borderColor:\s*(?:colors|themeColors)\.border[\s\S]*\}/,
      `${label} disabled state should use tokenized disabled surface and border`,
    );
    assert.match(
      source,
      /disabledLabel:\s*\{[\s\S]*color:\s*(?:colors|themeColors)\.textMuted[\s\S]*\}/,
      `${label} disabled label should use the readable muted text token`,
    );
  }

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
  const appButtonSource = read('components/Button.tsx');
  const uiButtonSource = read('components/ui/Button.tsx');
  const searchSource = read('app/search.tsx');
  const settingsSource = read('app/settings.tsx');

  assert.match(appButtonSource, /base:\s*\{[^}]*borderRadius:\s*radius\.button/);
  assert.match(uiButtonSource, /button:\s*\{[^}]*borderRadius:\s*radius\.button/);
  assert.match(searchSource, /searchInput:\s*\{[^}]*borderRadius:\s*radius\.input/);
  assert.match(settingsSource, /importInput:\s*\{[^}]*borderRadius:\s*radius\.input/);
  assert.match(settingsSource, /secondaryButton:\s*\{[^}]*borderRadius:\s*radius\.button/);
  assert.match(settingsSource, /outlineButton:\s*\{[^}]*borderRadius:\s*radius\.button/);

  assert.doesNotMatch(appButtonSource, /base:\s*\{[^}]*borderRadius:\s*radius\.card/);
  assert.doesNotMatch(uiButtonSource, /button:\s*\{[^}]*borderRadius:\s*radius\.card/);
  assert.doesNotMatch(searchSource, /searchInput:\s*\{[^}]*borderRadius:\s*radius\.card/);
  assert.doesNotMatch(settingsSource, /importInput:\s*\{[^}]*borderRadius:\s*radius\.card/);
});

function assertUtilityRouteThemeContract(source, routeLabel) {
  assert.match(source, /useColorScheme/, `${routeLabel} should read the system color scheme`);
  assert.match(
    source,
    /useAccessibilityStore/,
    `${routeLabel} should read the persisted accessibility theme mode`,
  );
  assert.match(
    source,
    /colorsForThemeMode\(themeMode, systemColorScheme\)/,
    `${routeLabel} should resolve theme colors through colorsForThemeMode`,
  );
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\);/,
    `${routeLabel} should derive its StyleSheet from resolved theme colors`,
  );
  assert.match(
    source,
    /function createStyles\(themeColors: ThemeColors\)/,
    `${routeLabel} should type its dynamic theme stylesheet`,
  );
  assert.match(
    source,
    /<ScreenShell[\s\S]*themeColors=\{themeColors\}/,
    `${routeLabel} should pass theme colors to the shared shell`,
  );
  assert.match(
    source,
    /<Card[\s\S]*themeColors=\{themeColors\}/,
    `${routeLabel} should pass theme colors to shared cards`,
  );
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bcolors\b[^}]*\} from '\.\.\/lib\/theme';/,
    `${routeLabel} should not import static light color tokens`,
  );
  assert.doesNotMatch(
    source,
    /\bcolors\./,
    `${routeLabel} should not reference static light color tokens`,
  );
}

test('search and citizenship utility routes resolve colors from persisted theme mode', () => {
  assertUtilityRouteThemeContract(read('app/search.tsx'), 'search route');
  assertUtilityRouteThemeContract(
    read('app/citizenship-requirements.tsx'),
    'citizenship requirements route',
  );
});

function assertSourceAffordanceThemeContract(relativePath, componentLabel) {
  const source = read(relativePath);

  assert.match(
    source,
    /themeColors\?: ThemeColors/,
    `${componentLabel} should expose a typed themeColors override`,
  );
  assert.match(
    source,
    /useResolvedThemeColors\(themeColors\)/,
    `${componentLabel} should resolve persisted theme colors through the shared hook`,
  );
  assert.match(
    source,
    /createStyles\(resolvedThemeColors\)/,
    `${componentLabel} should build styles from resolved theme colors`,
  );
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bcolors\b[^}]*\} from ['"][^'"]*lib\/theme['"]/,
    `${componentLabel} should not import static light color tokens`,
  );
  assert.doesNotMatch(
    source,
    /\bcolors\./,
    `${componentLabel} should not reference static light color tokens`,
  );
}

test('source-boundary affordances resolve persisted dark theme colors', () => {
  assertSourceAffordanceThemeContract('components/DisclaimerBanner.tsx', 'DisclaimerBanner');
  assertSourceAffordanceThemeContract('components/quiz/SourceCitation.tsx', 'SourceCitation');
  assertSourceAffordanceThemeContract(
    'components/quiz/QuestionSourceCitation.tsx',
    'QuestionSourceCitation',
  );
  assertSourceAffordanceThemeContract('components/quiz/ProvenanceBadge.tsx', 'ProvenanceBadge');

  const hookSource = read('components/useResolvedThemeColors.ts');
  assert.match(hookSource, /useAccessibilityStore/, 'theme hook should read persisted theme mode');
  assert.match(hookSource, /useColorScheme/, 'theme hook should honor system color scheme');
  assert.match(
    hookSource,
    /colorsForThemeMode\(themeMode, systemColorScheme\)/,
    'theme hook should use shared theme token resolver',
  );

  const questionDisclaimerSource = read('components/quiz/QuestionDisclaimer.tsx');
  assert.match(
    questionDisclaimerSource,
    /themeColors\?: ThemeColors/,
    'QuestionDisclaimer should accept a typed themeColors prop',
  );
  assert.match(
    questionDisclaimerSource,
    /<DisclaimerBanner[\s\S]*themeColors=\{themeColors\}/,
    'QuestionDisclaimer should forward route theme colors to DisclaimerBanner',
  );

  assert.match(
    read('app/search.tsx'),
    /<ProvenanceBadge[\s\S]*themeColors=\{themeColors\}/,
    'Search should pass resolved route colors to the provenance badge',
  );
  assert.match(
    read('app/citizenship-requirements.tsx'),
    /<QuestionDisclaimer themeColors=\{themeColors\}/,
    'Citizenship requirements should pass resolved route colors to the disclaimer',
  );
});

test('utility route theme contract rejects static route-local colors', () => {
  const mutatedSearchSource = read('app/search.tsx')
    .replace(
      "import { colorsForThemeMode, radius, space, typography } from '../lib/theme';",
      "import { colors, colorsForThemeMode, radius, space, typography } from '../lib/theme';",
    )
    .replace('color: themeColors.text,', 'color: colors.text,');

  assert.throws(
    () => assertUtilityRouteThemeContract(mutatedSearchSource, 'search route'),
    /static light color tokens/,
  );
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
