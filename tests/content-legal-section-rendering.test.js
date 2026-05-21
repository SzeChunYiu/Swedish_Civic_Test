const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');

const repoRoot = path.resolve(__dirname, '..');

function installTsxLoader() {
  const originalTsExtension = require.extensions['.ts'];
  const originalTsxExtension = require.extensions['.tsx'];

  const compileTsModule = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText;
    module._compile(transpiled, filename);
  };

  require.extensions['.ts'] = compileTsModule;
  require.extensions['.tsx'] = compileTsModule;

  return () => {
    if (originalTsExtension) {
      require.extensions['.ts'] = originalTsExtension;
    } else {
      delete require.extensions['.ts'];
    }

    if (originalTsxExtension) {
      require.extensions['.tsx'] = originalTsxExtension;
    } else {
      delete require.extensions['.tsx'];
    }
  };
}

function loadLegalPageModule() {
  const targetPath = path.join(repoRoot, 'components/compliance/LegalPage.tsx');
  delete require.cache[targetPath];

  const originalLoad = Module._load;
  const restoreTsxLoader = installTsxLoader();

  Module._load = function patchedLoad(request, parent, isMain) {
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

    if (request === './ComplianceActionLink') {
      return { ComplianceActionLink: 'ComplianceActionLink' };
    }

    if (request.endsWith('/lib/storage/settingsStore')) {
      return { useSettingsStore: (selector) => selector({ language: 'sv' }) };
    }

    if (request.endsWith('/lib/theme')) {
      const space = Object.assign([0, 4, 8, 12, 16, 20, 44], { hairline: 1 });
      return {
        colors: {
          accent: '#006aa7',
          border: '#dbe3ec',
          surface: '#ffffff',
          surfaceWarm: '#eaf0f7',
          text: '#0b1f33',
          textMuted: '#44586b',
        },
        radius: { card: 12 },
        space,
        typography: {
          bodyBold: { fontWeight: '600' },
          bodyTight: { lineHeight: 22 },
          navButton: { fontSize: 16, fontWeight: '600' },
          sectionTitle: { fontSize: 20 },
          subHeading: { fontSize: 24, letterSpacing: 0 },
        },
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(targetPath);
  } finally {
    Module._load = originalLoad;
    restoreTsxLoader();
  }
}

function collectLegalSectionNodes(node, nodes = []) {
  if (node == null || typeof node === 'boolean') return nodes;

  if (Array.isArray(node)) {
    node.forEach((child) => collectLegalSectionNodes(child, nodes));
    return nodes;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    nodes.push({ text: String(node), type: 'raw-text' });
    return nodes;
  }

  if (!React.isValidElement(node)) return nodes;

  if (node.type === 'Text') {
    nodes.push({ text: flattenText(node.props.children), type: 'Text' });
    return nodes;
  }

  if (node.type === 'LegalExternalLink') {
    nodes.push({ label: node.props.label, type: 'LegalExternalLink' });
    return nodes;
  }

  collectLegalSectionNodes(node.props.children, nodes);
  return nodes;
}

function flattenText(value) {
  if (value == null || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(flattenText).join('');
  if (React.isValidElement(value)) return flattenText(value.props.children);
  return String(value);
}

test('LegalSection ignores formatted whitespace-only children around links', () => {
  const { LegalSection } = loadLegalPageModule();
  const section = LegalSection({
    title: 'Public support page',
    children: [
      '\n        ',
      React.createElement(
        React.Fragment,
        null,
        '\n          ',
        'Send feedback through the public support page:',
        '\n          ',
        React.createElement('LegalExternalLink', { key: 'support', label: 'Open support' }),
        '\n        ',
      ),
      '\n      ',
    ],
  });

  const nodes = collectLegalSectionNodes(section);

  assert.deepEqual(nodes, [
    { text: 'Public support page', type: 'Text' },
    { text: 'Send feedback through the public support page:', type: 'Text' },
    { label: 'Open support', type: 'LegalExternalLink' },
  ]);
  assert.equal(
    nodes.some((node) => node.type === 'Text' && node.text.trim().length === 0),
    false,
  );
  assert.equal(
    nodes.some((node) => node.type === 'raw-text' && node.text.trim().length === 0),
    false,
  );
});

test('LegalSection preserves nested fragment text, numbers, and link order', () => {
  const { LegalSection, normalizeLegalSectionChildren } = loadLegalPageModule();
  const firstLink = React.createElement('LegalExternalLink', {
    key: 'first',
    label: 'First source',
  });
  const secondLink = React.createElement('LegalExternalLink', {
    key: 'second',
    label: 'Second source',
  });
  const children = [
    '\n',
    React.createElement(
      React.Fragment,
      null,
      'One',
      '\n  ',
      firstLink,
      React.createElement(React.Fragment, null, '\n', 2026, '\n', secondLink),
      '\n',
    ),
  ];

  assert.deepEqual(normalizeLegalSectionChildren(children), ['One', firstLink, 2026, secondLink]);

  const section = LegalSection({ title: 'Sources', children });
  assert.deepEqual(collectLegalSectionNodes(section), [
    { text: 'Sources', type: 'Text' },
    { text: 'One', type: 'Text' },
    { label: 'First source', type: 'LegalExternalLink' },
    { text: '2026', type: 'Text' },
    { label: 'Second source', type: 'LegalExternalLink' },
  ]);
});
