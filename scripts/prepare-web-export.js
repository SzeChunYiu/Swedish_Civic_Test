#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const WEB_DOCUMENT_TITLE = 'Almost Swedish';
const WEB_DOCUMENT_DESCRIPTION =
  'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.';
const WEB_BRAND_META_TAGS = [
  `<meta name="application-name" content="${WEB_DOCUMENT_TITLE}" />`,
  `<meta name="apple-mobile-web-app-title" content="${WEB_DOCUMENT_TITLE}" />`,
  `<meta name="description" content="${WEB_DOCUMENT_DESCRIPTION}" />`,
  `<meta property="og:site_name" content="${WEB_DOCUMENT_TITLE}" />`,
  `<meta property="og:title" content="${WEB_DOCUMENT_TITLE}" />`,
  `<meta property="og:description" content="${WEB_DOCUMENT_DESCRIPTION}" />`,
];

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
  const withBrandMetadata = ensureBrandMetadata(html);

  if (withBrandMetadata.includes(HTML_LOADER_MARKER)) {
    return withBrandMetadata;
  }

  return withBrandMetadata.replace(
    /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
    (_match, bundlePath) => createRuntimeLoader(bundlePath),
  );
}

function ensureHeadEntry(html, markerPattern, tag) {
  if (markerPattern.test(html)) {
    return html;
  }

  return html.replace(/<\/head>/, `    ${tag}\n  </head>`);
}

function ensureBrandMetadata(html) {
  let rewritten = html;
  if (/<title>[\s\S]*?<\/title>/.test(rewritten)) {
    rewritten = rewritten.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${WEB_DOCUMENT_TITLE}</title>`,
    );
  } else {
    rewritten = ensureHeadEntry(
      rewritten,
      /<title>[\s\S]*?<\/title>/,
      `<title>${WEB_DOCUMENT_TITLE}</title>`,
    );
  }

  for (const tag of WEB_BRAND_META_TAGS) {
    const keyMatch = tag.match(/(?:name|property)="([^"]+)"/);
    const key = keyMatch?.[1];
    if (!key) continue;
    const markerPattern = new RegExp(`<meta\\s+(?:name|property)=["']${key}["'][^>]*>`);
    rewritten = ensureHeadEntry(rewritten, markerPattern, tag);
  }

  return rewritten;
}

function rewriteRootRelativeBundlePaths(source) {
  return source.replace(/(["'])\/(_expo|assets)\//g, '$1$2/');
}

function prepare(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  assertFile(indexPath);

  const originalIndex = fs.readFileSync(indexPath, 'utf8');
  const preparedIndex = rewriteHtml(originalIndex);
  if (preparedIndex === originalIndex && !preparedIndex.includes(HTML_LOADER_MARKER)) {
    throw new Error('Could not find Expo web bundle script in index.html');
  }

  fs.writeFileSync(indexPath, preparedIndex);
  fs.writeFileSync(fallbackPath, preparedIndex);

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
  assertFile(indexPath);
  assertFile(fallbackPath);

  const index = fs.readFileSync(indexPath, 'utf8');
  const fallback = fs.readFileSync(fallbackPath, 'utf8');
  if (index !== fallback) {
    throw new Error('404.html must match index.html for SPA fallback routing');
  }
  if (!index.includes(HTML_LOADER_MARKER)) {
    throw new Error('index.html is missing the web export runtime loader');
  }
  if (/src="\/_expo\//.test(index) || /href="\/_expo\//.test(index)) {
    throw new Error('index.html still contains root-relative Expo bundle URLs');
  }
  if (!index.includes(`<title>${WEB_DOCUMENT_TITLE}</title>`)) {
    throw new Error(`index.html must include <title>${WEB_DOCUMENT_TITLE}</title>`);
  }
  for (const tag of WEB_BRAND_META_TAGS) {
    if (!index.includes(tag)) {
      throw new Error(`index.html missing web brand metadata: ${tag}`);
    }
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
  ensureBrandMetadata,
  prepare,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
};
