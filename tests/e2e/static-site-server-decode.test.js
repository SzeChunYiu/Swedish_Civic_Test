const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { resolveStaticRequestPath } = require('./staticPathResolver.cjs');
const { createRequestHandler } = require('./serve-dist-web.cjs');

const repoRoot = path.resolve(__dirname, '../..');

function createStaticFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sct-static-server-'));
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), '<main id="app">shell</main>');
  fs.writeFileSync(path.join(root, 'assets/app.js'), 'window.__fixture = true;');
  fs.writeFileSync(path.join(root, 'data.json'), '{"ok":true}');
  return root;
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

async function withServer(handler, callback) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    await callback(address.port);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function requestPath(port, pathname) {
  return new Promise((resolve, reject) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        path: pathname,
        port,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () =>
          resolve({
            body,
            contentType: response.headers['content-type'],
            statusCode: response.statusCode,
          }),
        );
      },
    );
    request.on('error', reject);
  });
}

test('static path resolver falls back to the app shell for malformed URL escapes', () => {
  const root = createStaticFixture();
  try {
    const resolvedPath = resolveStaticRequestPath({
      pathname: '/%E0%A4%A',
      root,
    });

    assert.equal(resolvedPath, path.join(root, 'index.html'));
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('static path resolver serves valid assets and blocks traversal outside the root', () => {
  const root = createStaticFixture();
  try {
    assert.equal(
      resolveStaticRequestPath({ pathname: '/assets/app.js', root }),
      path.join(root, 'assets/app.js'),
    );
    assert.equal(
      resolveStaticRequestPath({ pathname: '/../assets/app.js', root }),
      path.join(root, 'index.html'),
    );
    assert.equal(
      resolveStaticRequestPath({ pathname: '/%2e%2e/assets/app.js', root }),
      path.join(root, 'index.html'),
    );
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('dist-web request handler fails closed for malformed request paths', async () => {
  const root = createStaticFixture();
  try {
    await withServer(createRequestHandler({ listenPort: 0, outputDir: root }), async (port) => {
      const malformed = await requestPath(port, '/%E0%A4%A');
      assert.equal(malformed.statusCode, 200);
      assert.match(malformed.contentType, /text\/html/);
      assert.match(malformed.body, /id="app"/);

      const asset = await requestPath(port, '/assets/app.js');
      assert.equal(asset.statusCode, 200);
      assert.match(asset.contentType, /text\/javascript/);
      assert.match(asset.body, /__fixture/);
    });
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('static e2e servers use the shared fail-closed path resolver', () => {
  const serverFiles = [
    'tests/e2e/staticSiteServer.ts',
    'tests/e2e/serve-dist-web.cjs',
    'tests/e2e/static-i18n-extras-language-selector.spec.ts',
    'tests/e2e/static-site-settings-segment-state.spec.ts',
    'tests/e2e/static-mock-timed-practice-copy.spec.ts',
  ];

  for (const file of serverFiles) {
    const source = readSource(file);
    assert.match(source, /resolveStaticRequestPath/, `${file} should use the shared resolver`);
    assert.doesNotMatch(
      source,
      /decodeURIComponent\(url\.pathname\)/,
      `${file} should not decode request paths inline`,
    );
  }
});
