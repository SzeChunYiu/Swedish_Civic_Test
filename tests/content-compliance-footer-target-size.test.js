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
  assert.match(source, /import \{ Platform, StyleSheet, Text, View \} from 'react-native';/);
  assert.match(source, /const complianceLinksClassName = 'compliance-footer-link';/);
  assert.match(source, /function useComplianceLinksWebStyles\(\)/);
  assert.match(source, /Platform\.OS !== 'web'/);
  assert.match(source, /className: complianceLinksClassName/);
  assert.match(source, /min-height: \$\{space\[6\]\}px;/);
  assert.match(source, /min-width: \$\{space\[6\]\}px;/);
  assert.match(source, /padding: \$\{space\[1\]\}px \$\{space\[1\.5\]\}px;/);
  assert.match(source, /alignItems: 'center'/);
  assert.match(source, /borderRadius: radius\.button/);
  assert.match(source, /display: 'flex'/);
  assert.match(source, /justifyContent: 'center'/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /minWidth: space\[6\]/);
  assert.match(source, /paddingHorizontal: space\[1\.5\]/);
  assert.match(source, /textAlign: 'center'/);
});
