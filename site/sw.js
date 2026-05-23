const CACHE_PREFIX = 'almost-swedish-static';
const ASSET_MANIFEST_PATH = 'asset-manifest.json';
const CORE_ASSETS = ['.', 'index.html', ASSET_MANIFEST_PATH];
const ROUTE_LAZY_ASSETS = new Set(['ebook-tools.js', 'ebook.js']);
const STATIC_PWA_STATUS_MESSAGE = 'SMT_STATIC_PWA_STATUS';

let activeCacheName = null;

function sameOriginUrl(pathname) {
  return new URL(pathname, self.registration.scope);
}

function isLocalPath(pathname) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(String(pathname || ''));
}

async function hashText(value) {
  if (self.crypto?.subtle && typeof TextEncoder !== 'undefined') {
    const digest = await self.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return `fallback-${(hash >>> 0).toString(36)}-${value.length}`;
}

async function cacheNameForManifestText(manifestText) {
  const digest = await hashText(manifestText);
  return `${CACHE_PREFIX}-${digest.slice(0, 16)}`;
}

function isInstallPrecacheAssetPath(assetPath) {
  return isLocalPath(assetPath) && !ROUTE_LAZY_ASSETS.has(assetPath.replace(/^\.\//, ''));
}

function resolvePrecacheUrls(assetManifest) {
  const assetPaths = Object.keys(assetManifest?.assets || {}).filter(isInstallPrecacheAssetPath);
  const urls = [...CORE_ASSETS, ...assetPaths].map((assetPath) =>
    sameOriginUrl(assetPath).toString(),
  );

  return [...new Set(urls)].filter((assetUrl) => new URL(assetUrl).origin === self.location.origin);
}

async function readAssetManifest() {
  const response = await fetch(sameOriginUrl(ASSET_MANIFEST_PATH), {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    throw new Error(`asset manifest returned HTTP ${response.status}`);
  }
  const manifestText = await response.text();
  return {
    cacheName: await cacheNameForManifestText(manifestText),
    manifest: JSON.parse(manifestText),
  };
}

async function latestStaticCache() {
  if (activeCacheName) return caches.open(activeCacheName);

  const cacheNames = (await caches.keys()).filter((cacheName) =>
    cacheName.startsWith(`${CACHE_PREFIX}-`),
  );
  if (cacheNames.length === 0) return null;

  activeCacheName = cacheNames[cacheNames.length - 1];
  return caches.open(activeCacheName);
}

async function precacheAppShell() {
  const { cacheName, manifest } = await readAssetManifest();
  activeCacheName = cacheName;
  const cache = await caches.open(cacheName);
  await cache.addAll(resolvePrecacheUrls(manifest));
}

async function deleteStaleCaches() {
  const currentCacheName = activeCacheName || (await readAssetManifest()).cacheName;
  const cacheNames = await caches.keys();
  const staleCacheNames = cacheNames.filter(
    (cacheName) => cacheName.startsWith(`${CACHE_PREFIX}-`) && cacheName !== currentCacheName,
  );
  await Promise.all(staleCacheNames.map((cacheName) => caches.delete(cacheName)));
  return staleCacheNames;
}

async function broadcastStaticPwaStatus(status, cacheName) {
  const clientList = await self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  });
  await Promise.all(
    clientList.map((client) =>
      client.postMessage({
        type: STATIC_PWA_STATUS_MESSAGE,
        status,
        cacheName,
      }),
    ),
  );
}

function isSameOriginGet(request) {
  if (request.method !== 'GET') return false;
  return new URL(request.url).origin === self.location.origin;
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').toLowerCase().includes('text/html')
  );
}

async function cachedAppShell() {
  const cache = await latestStaticCache();
  if (!cache) return null;
  return (
    (await cache.match(sameOriginUrl('index.html').toString())) ||
    (await cache.match(sameOriginUrl('.').toString()))
  );
}

async function cacheNetworkResponse(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await latestStaticCache();
  if (!cache) return;
  await cache.put(request, response.clone());
}

async function networkFirstWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    await cacheNetworkResponse(request, response);
    return response;
  } catch (error) {
    const cache = await latestStaticCache();
    const cached = cache ? await cache.match(request) : null;
    if (cached) return cached;

    if (isNavigationRequest(request)) {
      const shell = await cachedAppShell();
      if (shell) return shell;
    }

    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const staleCacheNames = await deleteStaleCaches();
      await self.clients.claim();
      await broadcastStaticPwaStatus(
        staleCacheNames.length > 0 ? 'update-available' : 'offline-ready',
        activeCacheName,
      );
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (!isSameOriginGet(event.request)) return;
  event.respondWith(networkFirstWithCacheFallback(event.request));
});

self.__SMT_PWA_TEST__ = {
  cacheNameForManifestText,
  isInstallPrecacheAssetPath,
  resolvePrecacheUrls,
  STATIC_PWA_STATUS_MESSAGE,
};
