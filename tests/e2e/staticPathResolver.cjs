const fs = require('node:fs');
const path = require('node:path');

function decodeStaticPathname(pathname) {
  try {
    return decodeURIComponent(pathname || '/');
  } catch {
    return '/';
  }
}

function isWithinRoot(root, filePath) {
  const relativePath = path.relative(root, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function resolveStaticRequestPath({ root, pathname, indexFile = 'index.html' }) {
  const decodedPath = decodeStaticPathname(pathname);
  const indexPath = path.join(root, indexFile);

  if (decodedPath.split(/[/\\]+/).includes('..')) {
    return indexPath;
  }

  const safePath = path.normalize(decodedPath).replace(/^\.\.(?:[/\\]|$)/, '');
  const requestedPath = path.join(root, safePath === '/' ? indexFile : safePath);

  if (
    isWithinRoot(root, requestedPath) &&
    fs.existsSync(requestedPath) &&
    fs.statSync(requestedPath).isFile()
  ) {
    return requestedPath;
  }

  return indexPath;
}

module.exports = {
  decodeStaticPathname,
  resolveStaticRequestPath,
};
