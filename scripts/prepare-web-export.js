#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const repoRoot = path.resolve(__dirname, '..');

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

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

function extractMetaTag(source, name) {
  const tags = source.match(/<meta\b[\s\S]*?\/?>/g) ?? [];
  const namePattern = new RegExp(`\\bname=["']${escapeRegExp(name)}["']`);

  return tags.find((tag) => namePattern.test(tag));
}

function extractQuotedMetaContent(source, name) {
  const tag = extractMetaTag(source, name);
  const match = tag?.match(/\bcontent=["']([^"']+)["']/);

  return match?.[1];
}

function readCanvasColor(rootDir = repoRoot) {
  const colorsSource = fs.readFileSync(path.join(rootDir, 'lib/theme/colors.ts'), 'utf8');
  const match = colorsSource.match(/const\s+canvas\s*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    throw new Error('Could not read colors.canvas from lib/theme/colors.ts');
  }

  return match[1];
}

function readWebShellContract(rootDir = repoRoot) {
  const htmlSource = fs.readFileSync(path.join(rootDir, 'app/+html.tsx'), 'utf8');
  const language = htmlSource.match(/<html\b[^>]*\blang=["']([^"']+)["']/)?.[1];
  const viewport = extractQuotedMetaContent(htmlSource, 'viewport');
  const description = extractQuotedMetaContent(htmlSource, 'description');
  const themeColorTag = extractMetaTag(htmlSource, 'theme-color');
  const themeColor = /\bcontent=\{colors\.canvas\}/.test(themeColorTag ?? '')
    ? readCanvasColor(rootDir)
    : extractQuotedMetaContent(htmlSource, 'theme-color');

  if (!language || !viewport || !description || !themeColor) {
    throw new Error('Could not read the web shell metadata contract from app/+html.tsx');
  }

  return {
    description,
    language,
    themeColor,
    viewport,
  };
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

function upsertHtmlLanguage(html, language) {
  return html.replace(/<html\b([^>]*)>/i, (match, attributes) => {
    if (/\blang=/.test(attributes)) {
      return `<html${attributes.replace(/\s+lang=(["'])[^"']*\1/i, ` lang="${language}"`)}>`;
    }

    return `<html${attributes} lang="${language}">`;
  });
}

function insertBeforeHeadClose(html, tag) {
  if (!/<\/head>/i.test(html)) {
    throw new Error('Could not find </head> in index.html');
  }

  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function upsertMetaTag(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtmlAttribute(content)}">`;
  const existingTagPattern = new RegExp(
    `<meta\\b(?=[^>]*\\bname=(["'])${escapeRegExp(name)}\\1)[^>]*>`,
    'i',
  );

  if (existingTagPattern.test(html)) {
    return html.replace(existingTagPattern, tag);
  }

  return insertBeforeHeadClose(html, tag);
}

function applyWebShellHeadContract(html, contract = readWebShellContract()) {
  return [
    ['viewport', contract.viewport],
    ['description', contract.description],
    ['theme-color', contract.themeColor],
  ].reduce(
    (nextHtml, [name, content]) => upsertMetaTag(nextHtml, name, content),
    upsertHtmlLanguage(html, contract.language),
  );
}

function getHtmlLanguage(html) {
  return html.match(/<html\b[^>]*\blang=(["'])([^"']+)\1/i)?.[2];
}

function getHtmlMetaContent(html, name) {
  const tag = extractMetaTag(html, name);
  return tag?.match(/\bcontent=(["'])([^"']*)\1/i)?.[2];
}

function assertWebShellHeadContract(html, contract = readWebShellContract()) {
  if (getHtmlLanguage(html) !== contract.language) {
    throw new Error(`index.html must use lang="${contract.language}"`);
  }
  for (const [name, content] of [
    ['viewport', contract.viewport],
    ['description', contract.description],
    ['theme-color', contract.themeColor],
  ]) {
    if (getHtmlMetaContent(html, name) !== content) {
      throw new Error(`index.html must include ${name} metadata from app/+html.tsx`);
    }
  }
}

function prepare(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  assertFile(indexPath);

  const originalIndex = fs.readFileSync(indexPath, 'utf8');
  const rewrittenIndex = rewriteHtml(originalIndex);
  if (rewrittenIndex === originalIndex && !rewrittenIndex.includes(HTML_LOADER_MARKER)) {
    throw new Error('Could not find Expo web bundle script in index.html');
  }
  const preparedIndex = applyWebShellHeadContract(rewrittenIndex);

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
  assertWebShellHeadContract(index);

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
  applyWebShellHeadContract,
  assertWebShellHeadContract,
  check,
  prepare,
  readWebShellContract,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
};
