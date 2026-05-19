#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';

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
  const withRuntimeLoader = html.includes(HTML_LOADER_MARKER)
    ? html
    : html.replace(
        /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
        (_match, bundlePath) => createRuntimeLoader(bundlePath),
      );
  return rewriteRootRelativeHtmlAssetPaths(withRuntimeLoader);
}

function rewriteRootRelativeHtmlAssetPaths(source) {
  return source.replace(/\b(src|href)=(["'])\/(_expo|assets)\//g, '$1=$2$3/');
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
  if (/\b(?:src|href)=["']\/(?:_expo|assets)\//.test(index)) {
    throw new Error('index.html still contains root-relative exported asset URLs');
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
  rewriteHtml,
  rewriteRootRelativeHtmlAssetPaths,
  rewriteRootRelativeBundlePaths,
};
