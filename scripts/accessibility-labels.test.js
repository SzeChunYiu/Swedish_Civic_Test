const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button|RouteLink)\b/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function collectOpeningTag(lines, startIndex) {
  let tag = '';
  for (let index = startIndex; index < lines.length; index += 1) {
    tag += `\n${lines[index]}`;
    if (lines[index].includes('>')) return tag;
  }
  return tag;
}

test('interactive elements expose explicit accessibility labels, roles, and states', () => {
  const offenders = [];

  for (const sourceDir of SOURCE_DIRS) {
    for (const filePath of walk(path.join(ROOT, sourceDir))) {
      const relPath = path.relative(ROOT, filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (!INTERACTIVE_TAG.test(line)) return;
        const tag = collectOpeningTag(lines, index);
        const isButtonImplementation = relPath === 'components/ui/Button.tsx';
        const isRouteLinkImplementation = relPath === 'components/ui/RouteLink.tsx';
        const tagName = (tag.match(/<(Pressable|Link|Button|RouteLink)\b/) || [])[1];
        if (!isButtonImplementation && !tag.includes('accessibilityLabel=')) {
          if (!isRouteLinkImplementation) {
            offenders.push(`${relPath}:${index + 1}: missing accessibilityLabel: ${line.trim()}`);
          }
        }
        if (tagName !== 'RouteLink' && !tag.includes('accessibilityRole=')) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityRole: ${line.trim()}`);
        }
        if (
          tagName === 'Link' &&
          !isRouteLinkImplementation &&
          !tag.includes('accessibilityRole="link"')
        ) {
          offenders.push(
            `${relPath}:${index + 1}: Link should use accessibilityRole="link": ${line.trim()}`,
          );
        }
        if (
          tagName === 'Pressable' &&
          (tag.includes('accessibilityRole="switch"') ||
            /accessibilityState=\{\{[^}]*checked:/.test(tag)) &&
          !tag.includes('aria-checked=')
        ) {
          offenders.push(
            `${relPath}:${index + 1}: missing aria-checked mirror for web false state: ${line.trim()}`,
          );
        }
        if (
          tagName === 'Pressable' &&
          /accessibilityState=\{\{[^}]*expanded:/.test(tag) &&
          !tag.includes('aria-expanded=')
        ) {
          offenders.push(
            `${relPath}:${index + 1}: missing aria-expanded mirror for web false state: ${line.trim()}`,
          );
        }
        if (
          (tag.includes('disabled=') || tag.includes('Selected') || tag.includes('Active')) &&
          !tag.includes('accessibilityState=')
        ) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityState: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test('internal route links use the shared tokenized RouteLink target', () => {
  const routeLinkSource = fs.readFileSync(path.join(ROOT, 'components/ui/RouteLink.tsx'), 'utf8');
  const migratedFiles = [
    'app/(tabs)/home.tsx',
    'app/(tabs)/learn.tsx',
    'app/(tabs)/mistakes.tsx',
    'app/about-the-test.tsx',
    'app/chapter/[chapterId].tsx',
    'app/onboarding.tsx',
    'app/quiz/[sessionId].tsx',
    'app/search.tsx',
    'app/settings.tsx',
    'components/compliance/ComplianceLinks.tsx',
    'components/compliance/LegalPage.tsx',
  ];

  assert.match(routeLinkSource, /accessibilityRole = 'link'/);
  assert.match(routeLinkSource, /minHeight: space\[6\]/);
  assert.match(routeLinkSource, /motion\.hoverScale/);
  assert.match(routeLinkSource, /motion\.pressedScale/);
  assert.match(routeLinkSource, /textDecorationLine: 'none'/);

  for (const relativePath of migratedFiles) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.match(source, /<RouteLink\b/, `${relativePath} should use RouteLink`);
    assert.doesNotMatch(source, /<Link\b/, `${relativePath} should not style Link directly`);
  }
});
