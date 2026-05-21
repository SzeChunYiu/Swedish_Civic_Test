const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const routeCtaContracts = [
  {
    file: 'app/about-the-test.tsx',
    requiredComponent: 'ComplianceActionLink',
    requiredSnippets: [
      'href="/citizenship-requirements"',
      'href="/practice"',
      'href="/home"',
      'variant="primary"',
    ],
  },
  {
    file: 'app/citizenship-requirements.tsx',
    requiredComponent: 'ComplianceActionLink',
    requiredSnippets: ['href="/practice"', 'href="/about-the-test"', 'variant="primary"'],
  },
  {
    file: 'app/support.tsx',
    requiredComponent: 'LegalExternalLink',
    requiredSnippets: [
      'href={PUBLIC_SUPPORT_URL}',
      'destination={PUBLIC_SUPPORT_URL}',
      'label={copy.openSupportPageAccessibilityLabel}',
    ],
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertRouteCtaContract(
  { file, requiredComponent, requiredSnippets },
  source = read(file),
) {
  assert.match(
    source,
    new RegExp(`import \\{[^}]*${requiredComponent}[^}]*\\}`),
    `${file} should import ${requiredComponent}`,
  );
  assert.match(
    source,
    new RegExp(`<${requiredComponent}\\b`),
    `${file} should render ${requiredComponent}`,
  );
  assert.doesNotMatch(source, /<Link\b/, `${file} should not render route-local Link CTAs`);
  assert.doesNotMatch(
    source,
    /\b(?:primaryLink|secondaryLink|externalLink):\s*\{/,
    `${file} should not keep route-local CTA link styles`,
  );

  for (const snippet of requiredSnippets) {
    assert.ok(source.includes(snippet), `${file} should include ${snippet}`);
  }
}

test('legal route CTAs use shared action/external link components', () => {
  for (const contract of routeCtaContracts) {
    assertRouteCtaContract(contract);
  }

  const legalPage = read('components/compliance/LegalPage.tsx');
  assert.match(legalPage, /import \{ Link \} from 'expo-router';/);
  assert.match(legalPage, /import \{ ComplianceActionLink \} from '\.\/ComplianceActionLink';/);
  assert.match(legalPage, /export function LegalExternalLink/);
  assert.match(legalPage, /<ComplianceActionLink[\s\S]*href=\{backHref\}/);
  assert.match(legalPage, /<Link[\s\S]*style=\{styles\.externalLink\}/);
  assert.match(legalPage, /<Link[\s\S]*target="_blank"/);
});

test('legal route CTA guard rejects route-local styled Link regressions', () => {
  const source = read('app/about-the-test.tsx')
    .replace(/<ComplianceActionLink/, '<Link')
    .replace(/<\/ComplianceActionLink>/, '</Link>')
    .concat('\nconst styles = { primaryLink: {} };\n');

  assert.throws(
    () => assertRouteCtaContract(routeCtaContracts[0], source),
    /should not render route-local Link CTAs|should not keep route-local CTA link styles/,
  );
});
