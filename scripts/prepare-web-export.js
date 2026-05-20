#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const FAVICON_FILE_NAME = 'favicon.svg';
const FAVICON_SOURCE = path.join(__dirname, '..', 'assets', FAVICON_FILE_NAME);
const ROUTER_SHELL_MANIFEST_PATH = path.join(
  __dirname,
  '..',
  'lib',
  'scaffold',
  'routerShellManifest.ts',
);

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

function rewriteHtml(html) {
  if (html.includes(HTML_LOADER_MARKER)) {
    return html;
  }

  return html.replace(
    /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
    (_match, bundlePath) => createRuntimeLoader(bundlePath),
  );
}

function rewriteRootRelativeBundlePaths(source) {
  return source.replace(/(["'])\/(_expo|assets)\//g, '$1$2/');
}

function ensureHtmlLanguage(html, language) {
  const escapedLanguage = escapeHtmlAttribute(language);
  return html.replace(/<html\b([^>]*)>/i, (match, attributes) => {
    if (/\slang=/.test(attributes)) {
      return match.replace(/\slang=(["'])[^"']*\1/i, ` lang="${escapedLanguage}"`);
    }
    return `<html${attributes} lang="${escapedLanguage}">`;
  });
}

function ensureMetaDescription(html, description) {
  const escapedDescription = escapeHtmlAttribute(description);
  const descriptionMeta = `<meta name="description" content="${escapedDescription}">`;

  if (/<meta\b[^>]*\bname=(["'])description\1[^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*\bname=(["'])description\1[^>]*>/i, (match) =>
      /\bcontent=/.test(match)
        ? match.replace(/\scontent=(["'])[^"']*\1/i, ` content="${escapedDescription}"`)
        : match.replace(/>$/, ` content="${escapedDescription}">`),
    );
  }

  return html.replace(/<head>/i, `<head>\n  ${descriptionMeta}`);
}

function applyWebDocumentMetadata(html, metadata) {
  return ensureMetaDescription(ensureHtmlLanguage(html, metadata.language), metadata.description);
}

function prepare(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  const faviconPath = path.join(outputDir, FAVICON_FILE_NAME);
  assertFile(indexPath);
  assertFile(FAVICON_SOURCE);

  const originalIndex = fs.readFileSync(indexPath, 'utf8');
  const preparedIndex = applyWebDocumentMetadata(
    rewriteHtml(originalIndex),
    readWebDocumentMetadata(),
  );
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
  const metadata = readWebDocumentMetadata();
  if (index !== fallback) {
    throw new Error('404.html must match index.html for SPA fallback routing');
  }
  if (!new RegExp(`<html\\b[^>]*\\blang="${escapeRegExp(metadata.language)}"`).test(index)) {
    throw new Error(`index.html must declare lang="${metadata.language}"`);
  }
  if (!index.includes(`content="${escapeHtmlAttribute(metadata.description)}"`)) {
    throw new Error('index.html must include the configured web meta description');
  }
  if (!index.includes(HTML_LOADER_MARKER)) {
    throw new Error('index.html is missing the web export runtime loader');
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
  applyWebDocumentMetadata,
  prepare,
  readWebDocumentMetadata,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
};
