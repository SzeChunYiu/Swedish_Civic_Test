const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { checkAppAdsFile, checkUrls, firstSellerLine, parseArgs } = require('./check-public-urls');

const repoRoot = path.resolve(__dirname, '..');
const sellerLine = 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0';

function withServer(handler, callback) {
  const server = http.createServer(handler);
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        resolve(await callback(`http://127.0.0.1:${port}`));
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

function writeLocalAppAds(contents = `# local app-ads fixture\n${sellerLine}\n`) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'public-url-app-ads-'));
  const localFile = path.join(tmpDir, 'app-ads.txt');
  fs.writeFileSync(localFile, contents);
  return localFile;
}

function runNodeScript(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/check-public-urls.js', ...args], {
      cwd: repoRoot,
      env: { ...process.env, PUBLIC_URL_CHECK_TIMEOUT_MS: '1000' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

test('public URL checker passes reachable 2xx URLs', async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
    },
    async (baseUrl) => {
      const [result] = await checkUrls([`${baseUrl}/support`]);
      assert.equal(result.ok, true);
      assert.equal(result.status, 200);
    },
  );
});

test('public URL checker compares hosted app-ads seller line without fetching option tokens', async () => {
  const requestedPaths = [];
  const localFile = writeLocalAppAds();

  await withServer(
    (request, response) => {
      requestedPaths.push(new URL(request.url, 'http://127.0.0.1').pathname);
      if (request.url === '/support' || request.url === '/privacy') {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
        return;
      }
      if (request.url === '/app-ads.txt') {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end(`# hosted app-ads fixture\n${sellerLine}\n`);
        return;
      }
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('missing');
    },
    async (baseUrl) => {
      const result = await runNodeScript([
        `${baseUrl}/support`,
        `${baseUrl}/privacy`,
        '--expect-app-ads-file',
        `${baseUrl}/app-ads.txt`,
        localFile,
      ]);

      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /OK .*\/support \(HTTP 200\)/);
      assert.match(result.stdout, /OK .*\/privacy \(HTTP 200\)/);
      assert.match(result.stdout, /app-ads seller line matches/);
      assert.doesNotMatch(result.stdout, /--expect-app-ads-file/);
    },
  );

  assert.deepEqual(requestedPaths, ['/support', '/privacy', '/app-ads.txt']);
});

test('public URL checker rejects missing or mismatched hosted app-ads seller line', async () => {
  const localFile = writeLocalAppAds();

  await withServer(
    (request, response) => {
      if (request.url === '/mismatch-app-ads.txt') {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n');
        return;
      }
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('missing');
    },
    async (baseUrl) => {
      const mismatch = await checkAppAdsFile({
        hostedUrl: `${baseUrl}/mismatch-app-ads.txt`,
        localFile,
      });
      assert.equal(mismatch.ok, false);
      assert.equal(mismatch.status, 200);
      assert.match(mismatch.error, /seller line mismatch/i);

      const missing = await checkAppAdsFile({
        hostedUrl: `${baseUrl}/missing-app-ads.txt`,
        localFile,
      });
      assert.equal(missing.ok, false);
      assert.equal(missing.status, 404);
    },
  );
});

test('public URL checker parses app-ads expectation without treating option fields as URLs', () => {
  const parsed = parseArgs([
    'https://example.test/support',
    '--expect-app-ads-file',
    'https://example.test/app-ads.txt',
    'publishing/public-site/app-ads.txt',
  ]);

  assert.deepEqual(parsed.urls, ['https://example.test/support']);
  assert.deepEqual(parsed.appAdsExpectation, {
    hostedUrl: 'https://example.test/app-ads.txt',
    localFile: 'publishing/public-site/app-ads.txt',
  });
  assert.equal(firstSellerLine(`# comment\n\n ${sellerLine} \n`), sellerLine);
});

test('public URL checker fails unreachable or non-2xx URLs', async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(500, { 'content-type': 'text/plain' });
      response.end('nope');
    },
    async (baseUrl) => {
      const [result] = await checkUrls([`${baseUrl}/privacy`]);
      assert.equal(result.ok, false);
      assert.equal(result.status, 500);
    },
  );
});
