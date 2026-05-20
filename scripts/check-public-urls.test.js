const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const { checkUrls } = require('./check-public-urls');

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

test('public URL checker verifies hosted app-ads text exactly', async () => {
  await withServer(
    (request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end(
        request.url === '/app-ads.txt'
          ? 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0\n'
          : 'ok',
      );
    },
    async (baseUrl) => {
      const appAdsUrl = `${baseUrl}/app-ads.txt`;
      const results = await checkUrls([`${baseUrl}/support`, appAdsUrl], {
        [appAdsUrl]: 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0\n',
      });

      assert.equal(results[0].ok, true);
      assert.equal(results[1].ok, true);
      assert.equal(results[1].actualText, null);
    },
  );
});

test('public URL checker rejects app-ads text drift', async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n');
    },
    async (baseUrl) => {
      const [result] = await checkUrls([`${baseUrl}/app-ads.txt`], {
        [`${baseUrl}/app-ads.txt`]: 'google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0\n',
      });

      assert.equal(result.ok, false);
      assert.match(result.actualText, /pub-0000000000000000/);
      assert.match(result.expectedText, /pub-2451892671779738/);
    },
  );
});
