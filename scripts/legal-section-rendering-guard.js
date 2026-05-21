const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const React = require('react');
const ts = require('typescript');

const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');

function installTsxLoader({ transformLegalPageSource } = {}) {
  const previousTsxLoader = require.extensions['.tsx'];

  require.extensions['.tsx'] = function tsxLoader(module, filename) {
    let source = fs.readFileSync(filename, 'utf8');
    if (filename.replace(/\\/g, '/').endsWith('/components/compliance/LegalPage.tsx')) {
      source = transformLegalPageSource ? transformLegalPageSource(source) : source;
    }

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
    if (
      request === '../../lib/storage/settingsStore' ||
      request.endsWith('/lib/storage/settingsStore')
    ) {
      return { useSettingsStore: (selector) => selector({ language: 'sv' }) };
    }
    if (request === '../../lib/theme' || request.endsWith('/lib/theme')) {
      return {
        colors: {
          accent: 'accent',
          border: 'border',
          surface: 'surface',
          surfaceWarm: 'surfaceWarm',
          text: 'text',
          textMuted: 'textMuted',
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

  try {
    return callback();
  } finally {
    Module._load = originalLoad;
  }
}

function loadLegalPageModule({ repoRoot, transformLegalPageSource } = {}) {
  const legalPagePath = path.join(repoRoot, 'components/compliance/LegalPage.tsx');
  const restoreTsxLoader = installTsxLoader({ transformLegalPageSource });

  try {
    return withComponentStubs(() => {
      delete require.cache[legalPagePath];
      return require(legalPagePath);
    });
  } finally {
    restoreTsxLoader();
  }
}

function flattenRenderedChildren(children) {
  if (children == null || typeof children === 'boolean') return [];
  if (Array.isArray(children)) return children.flatMap(flattenRenderedChildren);
  if (children?.type === REACT_FRAGMENT_TYPE)
    return flattenRenderedChildren(children.props.children);
  return [children];
}

function collectUnsafeViewChildren(node, parentType) {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') {
    return parentType === 'View' || parentType === 'ScrollView'
      ? [`${parentType} contains direct raw text child ${JSON.stringify(String(node))}`]
      : [];
  }

  const children = flattenRenderedChildren(node.props?.children);
  return children.flatMap((child) => collectUnsafeViewChildren(child, node.type));
}

function renderExternalLink(LegalExternalLink, overrides = {}) {
  return LegalExternalLink({
    accessibilityLabel: overrides.accessibilityLabel ?? 'Open source',
    destination: overrides.destination ?? 'https://www.uhr.se/medborgarskapsprovet/',
    href: overrides.href ?? 'https://www.uhr.se/medborgarskapsprovet/',
    label: overrides.label ?? 'UHR source',
  });
}

function describeChildTypes(node) {
  return flattenRenderedChildren(node.props.children).map((child) => {
    if (child?.type === REACT_FRAGMENT_TYPE) return 'Fragment';
    return child?.type ?? typeof child;
  });
}

function assertNoUnsafeViewChildren(section) {
  assert.deepEqual(collectUnsafeViewChildren(section), []);
}

function runLegalSectionRenderingGuard({ repoRoot, transformLegalPageSource } = {}) {
  const failures = [];
  const summary = {
    legalSectionRenderingCasesValidated: 0,
    legalSectionWhitespaceTextValidated: false,
    legalSectionFragmentChildrenValidated: false,
    legalSectionRawTextUnderViewValidated: false,
    legalSectionRenderingParityValidated: false,
  };

  const resolvedRepoRoot = repoRoot ?? path.resolve(__dirname, '..');

  function validateCase(label, validate) {
    try {
      validate();
      summary.legalSectionRenderingCasesValidated += 1;
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
    }
  }

  const { LegalExternalLink, LegalSection } = loadLegalPageModule({
    repoRoot: resolvedRepoRoot,
    transformLegalPageSource,
  });

  validateCase('mixed text and link children', () => {
    const link = renderExternalLink(LegalExternalLink);
    const section = LegalSection({
      title: 'Sources',
      children: ['Read the source from ', link, ' accessed ', 2026],
    });

    assertNoUnsafeViewChildren(section);
    assert.deepEqual(describeChildTypes(section), ['Text', 'Text', 'Link', 'Text']);
  });

  validateCase('whitespace-only text children', () => {
    const link = renderExternalLink(LegalExternalLink, { label: 'Support' });
    const section = LegalSection({
      title: 'Support',
      children: ['   ', '\n\t', link, '  '],
    });

    assertNoUnsafeViewChildren(section);
    assert.deepEqual(describeChildTypes(section), ['Text', 'Link']);
    summary.legalSectionWhitespaceTextValidated = true;
  });

  validateCase('fragment-wrapped mixed children', () => {
    const link = renderExternalLink(LegalExternalLink, { label: 'Authority page' });
    const nestedFragment = React.createElement(
      React.Fragment,
      null,
      'Start ',
      React.createElement(React.Fragment, null, link, ' end'),
    );
    const section = LegalSection({
      title: 'Authority boundary',
      children: nestedFragment,
    });

    assertNoUnsafeViewChildren(section);
    assert.deepEqual(describeChildTypes(section), ['Text', 'Text', 'Link', 'Text']);
    summary.legalSectionFragmentChildrenValidated = true;
  });

  summary.legalSectionRawTextUnderViewValidated = failures.length === 0;
  summary.legalSectionRenderingParityValidated =
    failures.length === 0 &&
    summary.legalSectionRenderingCasesValidated === 3 &&
    summary.legalSectionWhitespaceTextValidated &&
    summary.legalSectionFragmentChildrenValidated &&
    summary.legalSectionRawTextUnderViewValidated;

  return {
    failures,
    summary,
  };
}

module.exports = {
  collectUnsafeViewChildren,
  flattenRenderedChildren,
  runLegalSectionRenderingGuard,
};
