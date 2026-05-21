const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('shared compliance footer links keep token-sized mobile tap targets', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/ComplianceLinks.tsx'),
    'utf8',
  );

  assert.match(source, /accessibilityLabel=\{copy\.openLabel\(link\.label\)\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /alignItems: 'center'/);
  assert.match(source, /borderRadius: radius\.button/);
  assert.match(source, /display: 'flex'/);
  assert.match(source, /justifyContent: 'center'/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /minWidth: space\[6\]/);
  assert.match(source, /paddingHorizontal: space\[1\.5\]/);
  assert.match(source, /textAlign: 'center'/);
});
