const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const COLOR_LITERAL = /#[0-9a-fA-F]{6}|rgba?\(/;
const SPACING_LITERAL = /\b(?:padding(?:Horizontal|Vertical)?|marginTop|gap|borderRadius):\s*\d/;
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
          TYPOGRAPHY_LITERAL.test(line)
        ) {
          offenders.push(`${relPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test('theme content validation locks semantic color contrast pairs', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/validate-content.js'), 'utf8');

  assert.match(source, /const MINIMUM_AA_CONTRAST_RATIO = 4\.5;/);
  assert.match(source, /const EXPECTED_THEME_CONTRAST_PAIRS = \[/);
  assert.match(source, /\{ foreground: 'textDisclaimer', background: 'surface' \}/);
  assert.match(source, /\{ foreground: 'textPlaceholder', background: 'surface' \}/);
  assert.match(source, /\{ foreground: 'surface', background: 'success' \}/);
  assert.match(source, /\{ foreground: 'success', background: 'successSoft' \}/);
  assert.match(source, /\{ foreground: 'surface', background: 'warning' \}/);
  assert.match(source, /\{ foreground: 'warning', background: 'warningSoft' \}/);
  assert.match(source, /themeContrastPairsValidated === EXPECTED_THEME_CONTRAST_PAIRS\.length/);
  assert.match(source, /themeContrastValidated/);
});
