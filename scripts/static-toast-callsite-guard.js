#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_TOAST_FILES = Object.freeze([
  'site/app.js',
  'site/extras.js',
  'site/signin.js',
  'site/purchase.js',
  'site/ebook-tools.js',
]);
const TOAST_CALLEE_PATTERN = /(?:\bfx|\b(?:window\.)?smtFx)\s*\.\s*toast\s*\(/g;
const TRUSTED_HTML_PATTERN = /\btrustedHtml\s*:\s*true\b/;

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function readBalancedCall(source, openParenIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openParenIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(openParenIndex, index + 1);
    }
  }

  return null;
}

function findStaticToastCallSites(source, file = '<inline>') {
  const calls = [];
  TOAST_CALLEE_PATTERN.lastIndex = 0;

  for (const match of source.matchAll(TOAST_CALLEE_PATTERN)) {
    const openParenIndex = match.index + match[0].lastIndexOf('(');
    const callSource = readBalancedCall(source, openParenIndex);
    if (!callSource) {
      calls.push({
        callSource: '',
        file,
        line: lineNumberForIndex(source, match.index),
        trustedHtml: false,
        unterminated: true,
      });
      continue;
    }

    calls.push({
      callSource,
      file,
      line: lineNumberForIndex(source, match.index),
      trustedHtml: TRUSTED_HTML_PATTERN.test(callSource),
      unterminated: false,
    });
  }

  return calls;
}

function collectStaticToastCallSites({ root = repoRoot, files = DEFAULT_TOAST_FILES } = {}) {
  return files.flatMap((file) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    return findStaticToastCallSites(source, file);
  });
}

function assertStaticToastCallSitesSafe({ root = repoRoot, files = DEFAULT_TOAST_FILES } = {}) {
  const calls = collectStaticToastCallSites({ root, files });
  const unsafeCalls = calls.filter((call) => call.trustedHtml || call.unterminated);

  assert.deepEqual(
    unsafeCalls.map((call) => `${call.file}:${call.line}`),
    [],
    'static toast calls must stay text-safe and must not opt into trustedHtml',
  );

  return calls;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  test('static toast scanner preserves the reviewed call-site inventory', () => {
    const calls = assertStaticToastCallSitesSafe();

    assert.equal(calls.length, 18);
    assert.deepEqual(
      Object.fromEntries(
        DEFAULT_TOAST_FILES.map((file) => [
          file,
          calls.filter((call) => call.file === file).length,
        ]),
      ),
      {
        'site/app.js': 1,
        'site/extras.js': 11,
        'site/signin.js': 3,
        'site/purchase.js': 1,
        'site/ebook-tools.js': 2,
      },
    );
  });

  test('static toast scanner rejects multiline trustedHtml call sites', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'static-toast-callsite-'));
    const file = 'fixture.js';
    fs.writeFileSync(
      path.join(tmpRoot, file),
      [
        'function demo(window) {',
        '  window.smtFx.toast(',
        "    '<strong>unsafe</strong>',",
        '    {',
        '      duration: 1000,',
        '      trustedHtml: true,',
        '    },',
        '  );',
        '}',
        '',
      ].join('\n'),
    );

    assert.throws(
      () => assertStaticToastCallSitesSafe({ root: tmpRoot, files: [file] }),
      /trustedHtml/,
    );
  });

  test('static toast scanner accepts multiline text-safe call sites', () => {
    const source = [
      'function demo(fx, message) {',
      '  fx.toast(',
      '    message,',
      '    {',
      "      flavor: 'win',",
      '      duration: 1000,',
      '    },',
      '  );',
      '}',
    ].join('\n');

    const calls = findStaticToastCallSites(source, 'inline.js');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].trustedHtml, false);
    assert.equal(calls[0].unterminated, false);
  });
}

module.exports = {
  DEFAULT_TOAST_FILES,
  assertStaticToastCallSitesSafe,
  collectStaticToastCallSites,
  findStaticToastCallSites,
};
