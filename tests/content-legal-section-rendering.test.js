const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const legalPagePath = path.join(repoRoot, 'components/compliance/LegalPage.tsx');

function installTsxLoader() {
  const previousTsxLoader = require.extensions['.tsx'];

  require.extensions['.tsx'] = function tsxLoader(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    });

    module._compile(output.outputText, filename);
  };

  return () => {
    if (previousTsxLoader) {
      require.extensions['.tsx'] = previousTsxLoader;
    } else {
      delete require.extensions['.tsx'];
    }
  };
}

function withComponentStubs(callback) {
  const originalLoad = Module._load;

  Module._load = function loadStubbedModule(request, parent, isMain) {
    if (request === 'expo-router') return { Link: 'Link' };
    if (request === 'react-native') {
      return {
        ScrollView: 'ScrollView',
        StyleSheet: { create: (styles) => styles },
        Text: 'Text',
        View: 'View',
      };
    }
    if (request === '../../lib/storage/settingsStore') {
      return { useSettingsStore: (selector) => selector({ language: 'sv' }) };
    }
    if (request === '../../lib/theme') {
      return {
        colors: {
          accent: 'accent',
          border: 'border',
          surface: 'surface',
          surfaceWarm: 'surfaceWarm',
          text: 'text',
          textMuted: 'textMuted',
        },
        radius: { card: 12 },
        space: { 1: 8, 1.25: 10, 1.75: 14, 2: 16, 2.25: 18, 3: 24, 6: 48, hairline: 1 },
        typography: {
          bodyBold: { fontWeight: '700' },
          bodyTight: { lineHeight: 22 },
          navButton: { fontSize: 16, fontWeight: '600' },
          sectionTitle: { fontSize: 20 },
          subHeading: { fontSize: 24, letterSpacing: 0 },
        },
      };
    }
    if (request === './ComplianceActionLink')
      return { ComplianceActionLink: 'ComplianceActionLink' };

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return callback();
  } finally {
    Module._load = originalLoad;
  }
}

function loadLegalPage() {
  const restoreTsxLoader = installTsxLoader();
  delete require.cache[legalPagePath];

  try {
    return withComponentStubs(() => require(legalPagePath));
  } finally {
    restoreTsxLoader();
  }
}

function childrenOf(node) {
  const children = node?.props?.children;
  if (children == null) return [];
  return Array.isArray(children) ? children.flatMap((child) => child) : [children];
}

function flattenChildren(children) {
  return children.flatMap((child) => (Array.isArray(child) ? flattenChildren(child) : [child]));
}

function findUnsafeViewChildren(node, React) {
  const unsafe = [];

  function visit(current) {
    if (current == null || typeof current === 'boolean') return;
    if (typeof current === 'string' || typeof current === 'number') return;
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    const directChildren = flattenChildren(childrenOf(current));

    if (current.type === 'View') {
      directChildren.forEach((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          unsafe.push(`raw ${typeof child} under View`);
        } else if (child?.type === React.Fragment) {
          unsafe.push('Fragment under View');
        }
      });
    }

    directChildren.forEach(visit);
  }

  visit(node);
  return unsafe;
}

test('LegalSection normalizes mixed direct children into native-safe paragraphs and links', () => {
  const React = require('react');
  const { LegalExternalLink, LegalSection } = loadLegalPage();
  const link = React.createElement(LegalExternalLink, {
    accessibilityLabel: 'Open source',
    destination: 'uhr.se',
    href: 'https://www.uhr.se',
    label: 'UHR',
  });

  const section = LegalSection({
    title: 'Sources',
    children: ['Read ', link, ' before practicing.', 2026],
  });

  assert.deepEqual(findUnsafeViewChildren(section, React), []);
});

test('LegalSection recursively flattens Fragment-wrapped mixed children before rendering', () => {
  const React = require('react');
  const { LegalExternalLink, LegalSection } = loadLegalPage();
  const link = React.createElement(LegalExternalLink, {
    accessibilityLabel: 'Open support',
    destination: 'example.se',
    href: 'https://example.se',
    label: 'Support',
  });
  const nestedFragment = React.createElement(
    React.Fragment,
    null,
    'Start ',
    React.createElement(React.Fragment, null, link, ' end'),
  );

  const section = LegalSection({
    title: 'Support',
    children: nestedFragment,
  });

  assert.deepEqual(findUnsafeViewChildren(section, React), []);
});

test('LegalSection source keeps a recursive Fragment child normalizer', () => {
  const source = fs.readFileSync(legalPagePath, 'utf8');

  assert.match(source, /import \{ Children, Fragment, isValidElement \} from 'react';/);
  assert.match(source, /function flattenSectionChildren\(children: ReactNode\)/);
  assert.match(source, /isFragmentChild\(child\)/);
  assert.match(source, /flattenSectionChildren\(child\.props\.children\)/);
  assert.match(source, /function flushParagraph\(/);
  assert.doesNotMatch(source, /function renderSectionChildren[\s\S]*return children;/);
});
