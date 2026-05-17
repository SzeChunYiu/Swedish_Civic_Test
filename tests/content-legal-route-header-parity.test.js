const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedLegalRoutes = [
  {
    file: 'app/disclaimer.tsx',
    requiredSnippets: [
      'const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = disclaimerCopy[language];',
      'Ansvarsfriskrivning',
      'Oberoende studieverktyg',
      'Disclaimer',
      'Independent study tool',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.practiceContent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Disclaimer',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Independent study tool', 'Practice content', 'Use with source material'],
  },
  {
    file: 'app/privacy.tsx',
    title: 'Privacy policy',
    sections: [
      'No account required',
      'Local progress storage',
      'Ads and purchases',
      'Ad consent',
      'Provider processing',
    ],
  },
  {
    file: 'app/terms.tsx',
    title: 'Terms of use',
    sections: ['Study purpose', 'No guarantee', 'Respect source material'],
  },
  {
    file: 'app/sources.tsx',
    title: 'Sources',
    sections: ['Primary study material', 'Question references', 'Authority boundaries'],
  },
  {
    file: 'app/support.tsx',
    title: 'Support and feedback',
    sections: [
      'What to report',
      'No personal data',
      'Independent study tool',
      'Public support page',
    ],
  },
];

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('legal, source, and support routes stay on shared accessible header path', () => {
  const summary = parseValidationSummary();
  const legalPage = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/LegalPage.tsx'),
    'utf8',
  );

  assert.equal(summary.legalRouteHeadersValidated, 23);
  assert.equal(summary.legalRouteHeaderParityValidated, true);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);

  for (const expectedRoute of expectedLegalRoutes) {
    const routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    assert.match(routeSource, /LegalPage, LegalSection/);
    if (expectedRoute.requiredSnippets) {
      for (const snippet of expectedRoute.requiredSnippets) {
        assert.match(routeSource, new RegExp(escapeRegExp(snippet)));
      }
    }
    assert.match(
      routeSource,
      expectedRoute.titlePattern ??
        new RegExp(`<LegalPage\\s+title="${escapeRegExp(expectedRoute.title)}"`),
    );

    for (const [sectionIndex, sectionTitle] of expectedRoute.sections.entries()) {
      assert.match(
        routeSource,
        expectedRoute.sectionPatterns?.[sectionIndex] ??
          new RegExp(`<LegalSection\\s+title="${escapeRegExp(sectionTitle)}"`),
      );
    }
  }
});

test('legal route header parity rejects shared legal section header drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/compliance/LegalPage.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>',
        '<Text style={styles.sectionTitle}>',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /legal route shared heading components must expose accessibilityRole="header"/,
  );
});
