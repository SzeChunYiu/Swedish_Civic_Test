const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const THEME_TOKEN_FOCUS_ARGS = ['scripts/validate-content.js', '--focus-theme-token-schema'];

test('theme token schema validates the exported design-token catalog', () => {
  const output = execFileSync(process.execPath, THEME_TOKEN_FOCUS_ARGS, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const themeIndex = fs.readFileSync(path.join(repoRoot, 'lib/theme/index.ts'), 'utf8');
  const shadowSource = fs.readFileSync(path.join(repoRoot, 'lib/theme/shadows.ts'), 'utf8');
  const spacingSource = fs.readFileSync(path.join(repoRoot, 'lib/theme/spacing.ts'), 'utf8');

  assert.equal(summary.themeColorTokensValidated, 39);
  assert.equal(summary.themeSpaceTokensValidated, 25);
  assert.equal(summary.themeRadiusTokensValidated, 9);
  assert.equal(summary.themeTypographyTokensValidated, 22);
  assert.equal(summary.themeShadowTokensValidated, 2);
  assert.equal(summary.themeMotionTokensValidated, 7);
  assert.ok(summary.themeBorderWidthTokenFilesValidated > 0);
  assert.equal(summary.themeBorderWidthTokenParityValidated, true);
  assert.equal(summary.themeContrastPairsValidated, 22);
  assert.equal(summary.themeContrastPairsAAValidated, true);
  assert.equal(summary.themeDarkColorTokensValidated, 39);
  assert.equal(summary.themeDarkContrastPairsValidated, 22);
  assert.equal(summary.themeDarkContrastPairsAAValidated, true);
  assert.equal(summary.themeTokenSchemaValidated, true);
  assert.match(spacingSource, /hairline:\s*1,/);
  assert.match(spacingSource, /divider:\s*2,/);
  assert.match(
    themeIndex,
    /export \{[\s\S]*colors[\s\S]*colorsForThemeMode[\s\S]*\} from '\.\/colors';/,
  );
  assert.match(themeIndex, /export \{[\s\S]*darkColors[\s\S]*\} from '\.\/colors';/);
  assert.match(
    themeIndex,
    /export \{ flagColors, SWEDISH_FLAG_BLUE, SWEDISH_FLAG_GOLD \} from '\.\/flag';/,
  );
  assert.match(themeIndex, /export \{ space \} from '\.\/spacing';/);
  assert.match(themeIndex, /export \{ typography \} from '\.\/typography';/);
});

test('theme token schema rejects raw app border width literals', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Card.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('borderWidth: space.hairline,', 'borderWidth: StyleSheet.hairlineWidth,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme border width tokens required: .*components\/ui\/Card\.tsx.*borderWidth: StyleSheet\.hairlineWidth/,
  );
});

test('semantic hairline token is reserved for border widths', () => {
  const sourceRoots = ['app', 'components'];
  const nonBorderHairlinePattern =
    /\b(?:gap|height|padding(?:Horizontal|Vertical)?|width):\s*space\.hairline\b/;
  const offenders = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.(?:ts|tsx)$/.test(entry.name)) continue;
      const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      fs.readFileSync(fullPath, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (nonBorderHairlinePattern.test(line)) {
            offenders.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          }
        });
    }
  }

  for (const sourceRoot of sourceRoots) {
    walk(path.join(repoRoot, sourceRoot));
  }

  assert.deepEqual(
    offenders,
    [],
    'use space.divider for intentional 2px layout/divider sizing; reserve space.hairline for border widths',
  );
});

test('search and language controls keep 2px divider layout token separate from hairline borders', () => {
  const searchSource = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const languageToggleSource = fs.readFileSync(
    path.join(repoRoot, 'components/ui/LanguageToggle.tsx'),
    'utf8',
  );

  assert.match(searchSource, /height:\s*space\.divider/);
  assert.match(searchSource, /width:\s*space\.divider/);
  assert.match(languageToggleSource, /padding:\s*space\.divider/);
  assert.match(settingsSource, /gap:\s*space\.divider/);
  assert.match(searchSource, /borderWidth:\s*space\.hairline/);
  assert.match(languageToggleSource, /borderWidth:\s*space\.hairline/);
});

test('theme token schema rejects spacing token drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/spacing.ts')) {
    return originalReadFileSync.call(this, filePath, ...args).replace('1: 8,', '1: -8,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /theme space\.1 expected 8, found -8/);
});

test('theme token schema rejects hairline border token drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/spacing.ts')) {
    return originalReadFileSync.call(this, filePath, ...args).replace('hairline: 1,', 'hairline: 2,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /theme space\.hairline expected 1, found 2/);
});

test('theme token schema rejects divider spacing token drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/spacing.ts')) {
    return originalReadFileSync.call(this, filePath, ...args).replace('divider: 2,', 'divider: 1,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /theme space\.divider expected 2, found 1/);
});

test('theme token schema rejects control radius token drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/radius.ts')) {
    return originalReadFileSync.call(this, filePath, ...args).replace('const button = 12;', 'const button = 16;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /theme radius\.button expected 12, found 16/);
});

test('theme token schema rejects black or opacity-masked shadows', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/shadows.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("const whisperShadowColor = '#0b1f33';", "const whisperShadowColor = 'rgba(0, 0, 0, 0.04)';")
      .replace('shadowOpacity: 0.06,', 'shadowOpacity: 1,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.card\.shadowColor must use the navy whisper shadow #0b1f33/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.card\.shadowOpacity must be a whisper value no higher than 0\.08/,
  );
});

test('theme token schema rejects heavy shadow geometry', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/shadows.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('shadowOffset: { width: 0, height: 8 },', 'shadowOffset: { width: 0, height: 23 },')
      .replace('shadowRadius: 24,', 'shadowRadius: 52,')
      .replace('elevation: 2,', 'elevation: 3,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.deep\.shadowOffset\.height must be between 0 and 8/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.deep\.shadowRadius must be no higher than 24/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.deep\.elevation must be no higher than 2/,
  );
});

test('theme token schema rejects missing web box shadow tokens', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/shadows.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("boxShadow: '0px 6px 20px rgba(11, 31, 51, 0.06)',", "boxShadow: 'none',");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme shadows\.card\.boxShadow must match tokenized web shadow 0px 6px 20px rgba\(11, 31, 51, 0\.06\)/,
  );
});

test('theme token schema rejects low contrast semantic text pairs', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/colors.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("const warning = '#9a5c00'", "const warning = '#c77700'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme contrast warning on warningSoft ratio [0-9.]+:1 below 4\.5:1/,
  );
});

test('theme token schema rejects negative letter spacing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/typography.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('letterSpacing: 0,', 'letterSpacing: -0.1,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-theme-token-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /theme typography\.displayHero\.letterSpacing must be a non-negative bounded number/,
  );
});
