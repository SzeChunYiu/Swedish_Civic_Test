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
