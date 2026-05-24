const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createStaticServer, resolveStaticRequestPath } = require('./check-web-export-resources');

function makeExportRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'web-export-resources-'));
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><body>OK</body></html>');
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets', 'app.js'), 'console.log("ok");');
  fs.writeFileSync(path.join(root, 'assets', 'style.css'), 'body { color: black; }');
  fs.writeFileSync(path.join(root, 'assets', 'data.json'), '{"ok":true}');
  fs.writeFileSync(
    path.join(root, 'assets', 'icon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" />',
  );
  fs.mkdirSync(path.join(root, 'icons'), { recursive: true });
  fs.writeFileSync(path.join(root, 'icons', 'pwa-icon-192.png'), 'png');

  return root;
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function request(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathname }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ body, headers: res.headers, statusCode: res.statusCode }));
    });
    req.on('error', reject);
  });
}

test('web export resource resolver rejects malformed and traversal paths fail-closed', () => {
  const root = makeExportRoot();

  try {
    assert.deepEqual(resolveStaticRequestPath(root, '/%E0%A4%A'), { error: 'malformed-path' });
    assert.deepEqual(resolveStaticRequestPath(root, '/../package.json'), { error: 'forbidden' });
    assert.deepEqual(resolveStaticRequestPath(root, '/..%2Fpackage.json'), { error: 'forbidden' });
    assert.equal(
      resolveStaticRequestPath(root, '/assets/app.js').filePath,
      path.join(root, 'assets', 'app.js'),
    );
    assert.equal(resolveStaticRequestPath(root, '/').filePath, path.join(root, 'index.html'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('web export resource smoke server handles malformed paths without crashing', async () => {
  const root = makeExportRoot();
  const { missingRequests, server } = createStaticServer(root);

  try {
    const port = await listen(server);
    const malformed = await request(port, '/%E0%A4%A');
    const traversal = await request(port, '/..%2Fpackage.json');
    const favicon = await request(port, '/favicon.ico');
    const missing = await request(port, '/assets/missing.js');

    assert.equal(malformed.statusCode, 400);
    assert.equal(malformed.headers['content-type'], 'text/plain; charset=utf-8');
    assert.equal(malformed.body, 'bad request');
    assert.equal(traversal.statusCode, 403);
    assert.equal(favicon.statusCode, 200);
    assert.equal(favicon.headers['content-type'], 'image/png');
    assert.equal(missing.statusCode, 404);
    assert.deepEqual(missingRequests, ['/assets/missing.js']);
  } finally {
    await close(server);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('web export resource smoke server preserves valid asset content types', async () => {
  const root = makeExportRoot();
  const { missingRequests, server } = createStaticServer(root);

  try {
    const port = await listen(server);

    assert.equal((await request(port, '/')).headers['content-type'], 'text/html; charset=utf-8');
    assert.equal(
      (await request(port, '/assets/app.js')).headers['content-type'],
      'text/javascript; charset=utf-8',
    );
    assert.equal(
      (await request(port, '/assets/style.css')).headers['content-type'],
      'text/css; charset=utf-8',
    );
    assert.equal(
      (await request(port, '/assets/data.json')).headers['content-type'],
      'application/json; charset=utf-8',
    );
    assert.equal(
      (await request(port, '/assets/icon.svg')).headers['content-type'],
      'image/svg+xml; charset=utf-8',
    );
    assert.deepEqual(missingRequests, []);
  } finally {
    await close(server);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
