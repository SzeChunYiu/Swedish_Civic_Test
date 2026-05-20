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

test('semantic text tokens meet WCAG AA contrast on app surfaces', () => {
  const colors = readColorTokens();

  for (const [foreground, background] of REQUIRED_CONTRAST_PAIRS) {
    const ratio = contrastRatio(colors[foreground], colors[background]);
    assert.ok(
      ratio >= 4.5,
      `${foreground} on ${background} contrast ${ratio.toFixed(2)}:1 is below 4.5:1`,
    );
  }
});

test('disabled button tokens keep labels readable without wrapper opacity', () => {
  const appButtonSource = read('components/Button.tsx');
  const uiButtonSource = read('components/ui/Button.tsx');
  const colors = readColorTokens();

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
      /disabled:\s*\{[\s\S]*backgroundColor:\s*colors\.surfaceWarm[\s\S]*borderColor:\s*colors\.border[\s\S]*\}/,
      `${label} disabled state should use tokenized disabled surface and border`,
    );
    assert.match(
      source,
      /disabledLabel:\s*\{[\s\S]*color:\s*colors\.textMuted[\s\S]*\}/,
      `${label} disabled label should use the readable muted text token`,
    );
  }

  assert.ok(colors.textMuted, 'theme textMuted token should be present');
  assert.ok(colors.surfaceWarm, 'theme surfaceWarm token should be present');

  const disabledLabelContrast = contrastRatio(colors.textMuted, colors.surfaceWarm);
  assert.ok(
    disabledLabelContrast >= MIN_BODY_TEXT_CONTRAST,
    `disabled button label contrast ${disabledLabelContrast.toFixed(2)} should be at least ${MIN_BODY_TEXT_CONTRAST}:1`,
  );
});
