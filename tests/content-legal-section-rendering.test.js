const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadLegalPageModule() {
  const originalLoad = Module._load;
  const originalTsxExtension = require.extensions['.tsx'];

  Module._load = function loadWithStubs(request, parent, isMain) {
    if (request === 'expo-router') {
      return { Link: 'Link' };
    }

    if (request === 'react-native') {
      return {
        ScrollView: 'ScrollView',
        StyleSheet: { create: (styles) => styles },
        Text: 'Text',
        View: 'View',
      };
    }

    if (
      request === '../../lib/storage/settingsStore' ||
      request.endsWith('/lib/storage/settingsStore')
    ) {
      return { useSettingsStore: () => 'sv' };
    }

    if (request === '../../lib/theme' || request.endsWith('/lib/theme')) {
      return {
        colors: {
          accent: '#006aa7',
          border: '#d5dce3',
          surface: '#f5f7fa',
          surfaceWarm: '#ffffff',
          text: '#17202a',
          textMuted: '#4b5563',
        },
        radius: { card: 8 },
        space: {
          1: 8,
          1.25: 10,
          1.75: 14,
          2: 16,
          2.25: 18,
          3: 24,
          6: 48,
          hairline: 1,
        },
        typography: {
          bodyBold: { fontWeight: '700' },
          bodyTight: { lineHeight: 22 },
          navButton: { fontSize: 15, fontWeight: '600' },
          sectionTitle: { fontSize: 18 },
          subHeading: { fontSize: 24, letterSpacing: 0 },
        },
      };
    }

    if (
      request === './ComplianceActionLink' ||
      request.endsWith('/components/compliance/ComplianceActionLink')
    ) {
      return { ComplianceActionLink: 'ComplianceActionLink' };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  require.extensions['.tsx'] = function tsxLoader(module, filename) {
    const source = require('node:fs').readFileSync(filename, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    module._compile(transpiled.outputText, filename);
  };

  try {
    const legalPagePath = path.join(repoRoot, 'components/compliance/LegalPage.tsx');
    delete require.cache[legalPagePath];
    return require(legalPagePath);
  } finally {
    Module._load = originalLoad;
    if (originalTsxExtension) {
      require.extensions['.tsx'] = originalTsxExtension;
    } else {
      delete require.extensions['.tsx'];
    }
  }
}

function flattenChildren(children) {
  if (children == null || typeof children === 'boolean') return [];
  if (Array.isArray(children)) return children.flatMap(flattenChildren);
  return [children];
}

function assertNoRawTextUnderView(node) {
  if (node == null || typeof node === 'boolean') return;
  if (typeof node === 'string' || typeof node === 'number') return;

  const children = flattenChildren(node.props?.children);
  if (node.type === 'View' || node.type === 'ScrollView') {
    const rawChild = children.find(
      (child) => typeof child === 'string' || typeof child === 'number',
    );
    assert.equal(rawChild, undefined, `${node.type} must not contain direct raw text children`);
  }

  for (const child of children) {
    assertNoRawTextUnderView(child);
  }
}

test('LegalSection groups mixed text and external links into native-safe children', () => {
  const { LegalExternalLink, LegalSection } = loadLegalPageModule();
  const link = LegalExternalLink({
    accessibilityLabel: 'Open UHR source',
    destination: 'https://www.uhr.se/medborgarskapsprovet/',
    href: 'https://www.uhr.se/medborgarskapsprovet/',
    label: 'UHR source',
  });

  const section = LegalSection({
    title: 'Sources',
    children: ['Read the source from ', link, ' accessed ', 2026],
  });
  const directChildren = flattenChildren(section.props.children);

  assert.deepEqual(
    directChildren.map((child) => child?.type ?? typeof child),
    ['Text', 'Text', 'Link', 'Text'],
  );
  assertNoRawTextUnderView(section);
});
