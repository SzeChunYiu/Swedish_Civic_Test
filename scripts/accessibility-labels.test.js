const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button)\b/;
const QUESTION_NAVIGATOR_SOURCE = path.join(ROOT, 'components', 'QuestionNavigator.tsx');

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
        const tagName = (tag.match(/<(Pressable|Link|Button)\b/) || [])[1];
        const isIntentionallyHidden =
          tag.includes('accessible={false}') &&
          tag.includes('importantForAccessibility="no-hide-descendants"');

        if (isIntentionallyHidden) return;

        if (!isButtonImplementation && !tag.includes('accessibilityLabel=')) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityLabel: ${line.trim()}`);
        }
        if (!tag.includes('accessibilityRole=')) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityRole: ${line.trim()}`);
        }
        if (tagName === 'Link' && !tag.includes('accessibilityRole="link"')) {
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

test('QuestionNavigator tabs keep token-sized touch targets', () => {
  const source = fs.readFileSync(QUESTION_NAVIGATOR_SOURCE, 'utf8');

  assert.match(source, /accessibilityRole="tab"/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
});

test('LanguagePicker menu rows expose menu-item state semantics', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'LanguagePicker.tsx'), 'utf8');

  assert.match(source, /accessibilityRole="menu"/);
  assert.match(source, /accessibilityRole="menuitem"/);
  assert.match(source, /aria-selected=\{selected\}/);
  assert.match(source, /aria-disabled=\{!opt\.available\}/);
  assert.match(source, /accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/);
  assert.doesNotMatch(
    source,
    /key=\{opt\.code\}[\s\S]*accessibilityRole="button"[\s\S]*accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/,
  );
});

test('NativeAdCard native summary and CTA are separate accessibility elements', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'components', 'monetization', 'NativeAdCard.native.tsx'),
    'utf8',
  );
  const copySource = fs.readFileSync(path.join(ROOT, 'lib', 'monetization', 'adCopy.ts'), 'utf8');

  assert.match(source, /<NativeAdView accessible=\{false\}/);
  assert.match(
    source,
    /<View\s+accessible\s+accessibilityHint=\{copy\.hint\}\s+accessibilityLabel=\{copy\.accessibilityLabel\}\s+accessibilityRole="summary"[\s\S]*?style=\{styles\.summary\}/,
  );
  assert.match(
    source,
    /<NativeAsset assetType=\{NativeAssetType\.CALL_TO_ACTION\}>\s*<Text\s+accessible\s+accessibilityHint=\{copy\.ctaHint\}\s+accessibilityLabel=\{copy\.ctaAccessibilityLabel\(nativeAd\.callToAction\)\}\s+accessibilityRole="button"\s+style=\{styles\.cta\}\s*>/,
  );
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.doesNotMatch(source, /<NativeAdView\s+accessible[\s>]/);
  assert.match(
    copySource,
    /ctaAccessibilityLabel: \(callToAction\) => `Annonsåtgärd: \$\{callToAction\}`/,
  );
  assert.match(
    copySource,
    /ctaAccessibilityLabel: \(callToAction\) => `Ad action: \$\{callToAction\}`/,
  );
  assert.match(copySource, /getNativeAdCardCopy/);
  assert.match(copySource, /live:\s*\{[\s\S]*?accessibilityLabel:\s*'Ad:/);
  assert.match(copySource, /test:\s*\{[\s\S]*?accessibilityLabel:\s*'Test native ad:/);
  assert.doesNotMatch(copySource, new RegExp(['Sponsrad', 'studieplacering'].join('\\s+'), 'i'));
});
