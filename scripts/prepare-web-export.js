#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const FAVICON_SOURCE = path.resolve(__dirname, '../assets/favicon.svg');
const FAVICON_FILE_NAME = 'favicon.svg';
const FAVICON_LINK = `<link href="${FAVICON_FILE_NAME}" rel="icon" type="image/svg+xml" />`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const check = args.includes('--check');
  const outputDir = args.find((arg) => arg !== '--check') ?? 'dist-web';
  return { check, outputDir };
}

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required web export file: ${filePath}`);
  }
}

function walkFiles(directory, predicate) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath, predicate));
    } else if (!predicate || predicate(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

function toRelativeBundlePath(bundlePath) {
  return bundlePath.replace(/^\/+/, '');
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractManifestString(source, fieldName) {
  const match = source.match(new RegExp(`${escapeRegExp(fieldName)}:\\s*['"]([^'"]+)['"]`));

  if (!match) {
    throw new Error(`Could not find ${fieldName} in router shell manifest`);
  }

  return match[1];
}

function extractMetaDescriptionForLanguage(source, language) {
  const match = source.match(
    new RegExp(
      `language:\\s*['"]${escapeRegExp(language)}['"][\\s\\S]*?description:\\s*['"]([^'"]+)['"]`,
    ),
  );

  if (!match) {
    throw new Error(`Could not find ${language} web meta description in router shell manifest`);
  }

  return match[1];
}

function readWebDocumentMetadata() {
  const manifest = fs.readFileSync(ROUTER_SHELL_MANIFEST_PATH, 'utf8');
  const language = extractManifestString(manifest, 'webLanguage');
  const description = extractMetaDescriptionForLanguage(manifest, language);

  return { description, language };
}

function createRuntimeLoader(bundlePath) {
  const relativeBundlePath = toRelativeBundlePath(bundlePath);
  return [
    `  <script ${HTML_LOADER_MARKER}>`,
    '    (function () {',
    '      var base = document.createElement("base");',
    '      base.href = window.location.protocol === "file:" ? "./" : "/";',
    '      document.head.appendChild(base);',
    '',
    '      var script = document.createElement("script");',
    `      script.src = ${JSON.stringify(relativeBundlePath)};`,
    '      script.defer = true;',
    '      document.body.appendChild(script);',
    '    })();',
    '  </script>',
  ].join('\n');
}

function ensureFaviconLink(html) {
  if (new RegExp(`<link[^>]+href=["']${FAVICON_FILE_NAME}["'][^>]+rel=["']icon["']`).test(html)) {
    return html;
  }

  return html.replace('</head>', `    ${FAVICON_LINK}\n  </head>`);
}

function rewriteHtml(html) {
  const htmlWithFavicon = ensureFaviconLink(html);
  if (htmlWithFavicon.includes(HTML_LOADER_MARKER)) {
    return htmlWithFavicon;
  }

  return htmlWithFavicon.replace(
    /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
    (_match, bundlePath) => createRuntimeLoader(bundlePath),
  );
}

function rewriteRootRelativeBundlePaths(source) {
  return source.replace(/(["'])\/(_expo|assets)\//g, '$1$2/');
}

function prepare(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  const faviconPath = path.join(outputDir, FAVICON_FILE_NAME);
  assertFile(indexPath);
  assertFile(FAVICON_SOURCE);

  const originalIndex = fs.readFileSync(indexPath, 'utf8');
  const preparedIndex = rewriteHtml(originalIndex);
  if (!preparedIndex.includes(HTML_LOADER_MARKER)) {
    throw new Error('Could not find Expo web bundle script in index.html');
  }

  fs.writeFileSync(indexPath, preparedIndex);
  fs.writeFileSync(fallbackPath, preparedIndex);
  fs.copyFileSync(FAVICON_SOURCE, faviconPath);

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    const rewritten = rewriteRootRelativeBundlePaths(source);
    if (rewritten !== source) {
      fs.writeFileSync(jsFile, rewritten);
    }
  }
}

function check(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  const faviconPath = path.join(outputDir, FAVICON_FILE_NAME);
  assertFile(indexPath);
  assertFile(fallbackPath);
  assertFile(faviconPath);

  const index = fs.readFileSync(indexPath, 'utf8');
  const fallback = fs.readFileSync(fallbackPath, 'utf8');
  if (index !== fallback) {
    throw new Error('404.html must match index.html for SPA fallback routing');
  }
  if (!index.includes(HTML_LOADER_MARKER)) {
    throw new Error('index.html is missing the web export runtime loader');
  }
  if (!index.includes(FAVICON_LINK)) {
    throw new Error('index.html is missing the local favicon link');
  }
  if (/src="\/_expo\//.test(index) || /href="\/_expo\//.test(index)) {
    throw new Error('index.html still contains root-relative Expo bundle URLs');
  }

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
  }
}

function main() {
  const { check: shouldCheck, outputDir } = parseArgs(process.argv);
  const resolvedOutputDir = path.resolve(process.cwd(), outputDir);
  if (shouldCheck) {
    check(resolvedOutputDir);
    console.log(`Web export artifact ready: ${outputDir}`);
    return;
  }

  prepare(resolvedOutputDir);
  check(resolvedOutputDir);
  console.log(`Prepared web export artifact: ${outputDir}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  check,
  prepare,
  ensureFaviconLink,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
};
