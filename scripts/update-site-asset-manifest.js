#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultSiteDir = path.join(repoRoot, 'site');
const defaultManifestPath = path.join(defaultSiteDir, 'asset-manifest.json');
const manifestFileName = 'asset-manifest.json';

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function listSiteAssetFiles(siteDir, options = {}) {
  const files = [];
  const includeAsset =
    typeof options.includeAsset === 'function' ? options.includeAsset : () => true;

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativePath = normalizeRelativePath(path.relative(siteDir, absolutePath));
      if (relativePath === manifestFileName) continue;
      if (!includeAsset(relativePath)) continue;
      files.push(relativePath);
    }
  }

  walk(siteDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function isExternalReference(value) {
  return /^(?:https?:|data:|mailto:|tel:|#|javascript:)/i.test(value);
}

function normalizeAssetReference(value) {
  return value.replace(/[?#].*$/, '').replace(/^\.?\//, '');
}

function listIndexAssetReferences(siteDir) {
  const indexPath = path.join(siteDir, 'index.html');
  if (!fs.existsSync(indexPath)) return [];

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const references = Array.from(
    indexHtml.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/g),
    (match) => normalizeAssetReference(match[2]),
  )
    .filter(Boolean)
    .filter((referencePath) => !isExternalReference(referencePath));

  return [...new Set(references)].sort((a, b) => a.localeCompare(b));
}

function hashFile(absolutePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function buildAssetManifest(options = {}) {
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const assets = {};

  for (const relativePath of listSiteAssetFiles(siteDir, options)) {
    const absolutePath = path.join(siteDir, relativePath);
    assets[relativePath] = {
      bytes: fs.statSync(absolutePath).size,
      sha256: hashFile(absolutePath),
    };
  }

  return {
    version: 1,
    algorithm: 'sha256',
    generatedBy: 'scripts/update-site-asset-manifest.js',
    assets,
  };
}

function formatAssetManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function readManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function writeAssetManifest(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || defaultManifestPath);
  const manifest = buildAssetManifest(options);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, formatAssetManifest(manifest));
  return manifest;
}

function findManifestMismatches(expected, actual) {
  const mismatches = [];
  const expectedAssets = expected.assets || {};
  const actualAssets = actual.assets || {};
  const assetPaths = new Set([...Object.keys(expectedAssets), ...Object.keys(actualAssets)]);

  for (const assetPath of [...assetPaths].sort((a, b) => a.localeCompare(b))) {
    const expectedAsset = expectedAssets[assetPath];
    const actualAsset = actualAssets[assetPath];
    if (!expectedAsset) {
      mismatches.push(`${assetPath}: unexpected in committed manifest`);
      continue;
    }
    if (!actualAsset) {
      mismatches.push(`${assetPath}: missing from committed manifest`);
      continue;
    }
    if (expectedAsset.bytes !== actualAsset.bytes) {
      mismatches.push(
        `${assetPath}: bytes expected ${expectedAsset.bytes}, found ${actualAsset.bytes}`,
      );
    }
    if (expectedAsset.sha256 !== actualAsset.sha256) {
      mismatches.push(
        `${assetPath}: sha256 expected ${expectedAsset.sha256}, found ${actualAsset.sha256}`,
      );
    }
  }

  return mismatches;
}

function findReferencedAssetMismatches(siteDir, manifest) {
  const manifestAssets = manifest.assets || {};

  return listIndexAssetReferences(siteDir)
    .filter((referencePath) => !manifestAssets[referencePath])
    .map(
      (referencePath) =>
        `${referencePath}: referenced by index.html but missing from committed manifest`,
    );
}

function checkAssetManifest(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || defaultManifestPath);
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const expected = buildAssetManifest(options);

  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      manifestPath,
      mismatches: [`${path.relative(repoRoot, manifestPath)}: missing committed manifest`],
    };
  }

  const actual = readManifest(manifestPath);
  const mismatches = [
    ...findManifestMismatches(expected, actual),
    ...findReferencedAssetMismatches(siteDir, actual),
  ];
  return {
    ok: mismatches.length === 0,
    manifestPath,
    mismatches,
  };
}

function parseArgs(argv) {
  const options = { check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--site-dir') {
      options.siteDir = argv[++index];
    } else if (arg === '--manifest') {
      options.manifestPath = argv[++index];
    } else {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.check) {
    const result = checkAssetManifest(options);
    if (!result.ok) {
      console.error(
        `site asset manifest is stale: ${path.relative(repoRoot, result.manifestPath)}`,
      );
      for (const mismatch of result.mismatches) {
        console.error(`- ${mismatch}`);
      }
      console.error('Run `npm run update:site-asset-manifest` to refresh it.');
      process.exit(1);
    }
    console.log(`site asset manifest OK: ${path.relative(repoRoot, result.manifestPath)}`);
    return;
  }

  const manifest = writeAssetManifest(options);
  console.log(`wrote ${Object.keys(manifest.assets).length} site asset fingerprints`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

module.exports = {
  buildAssetManifest,
  checkAssetManifest,
  findManifestMismatches,
  findReferencedAssetMismatches,
  formatAssetManifest,
  listIndexAssetReferences,
  listSiteAssetFiles,
  writeAssetManifest,
};
