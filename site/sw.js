const CACHE_PREFIX = 'almost-swedish-static';
const ASSET_MANIFEST_PATH = 'asset-manifest.json';
const CORE_ASSETS = ['.', 'index.html', ASSET_MANIFEST_PATH];

let activeCacheName = null;
let activeAssetManifest = null;

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

function readAssetCachePolicy(assetManifest, assetPath) {
  const cachePolicy = assetManifest?.assets?.[assetPath]?.cachePolicy;
  return cachePolicy && typeof cachePolicy === 'object' && !Array.isArray(cachePolicy)
    ? cachePolicy
    : {};
}

function isInstallPrecacheAssetPath(assetPath, assetManifest) {
  if (!isLocalPath(assetPath)) return false;
  return readAssetCachePolicy(assetManifest, assetPath).installPrecache !== false;
}

function shouldRuntimeCacheAssetPath(assetPath, assetManifest) {
  if (!isLocalPath(assetPath)) return true;
  return readAssetCachePolicy(assetManifest, assetPath).runtimeCache !== false;
}

function resolvePrecacheUrls(assetManifest) {
  const assetPaths = Object.keys(assetManifest?.assets || {}).filter((assetPath) =>
    isInstallPrecacheAssetPath(assetPath, assetManifest),
  );
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
  activeAssetManifest = manifest;
  const cache = await caches.open(cacheName);
  await cache.addAll(resolvePrecacheUrls(manifest));
}

async function deleteStaleCaches() {
  const currentCacheName = activeCacheName || (await readAssetManifest()).cacheName;
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(
        (cacheName) => cacheName.startsWith(`${CACHE_PREFIX}-`) && cacheName !== currentCacheName,
      )
      .map((cacheName) => caches.delete(cacheName)),
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
  if (!shouldRuntimeCacheRequest(request)) return;
  const cache = await latestStaticCache();
  if (!cache) return;
  await cache.put(request, response.clone());
}

function requestAssetPath(request) {
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) {
    return null;
  }

  const relativePath = requestUrl.pathname.slice(scopeUrl.pathname.length).replace(/^\/+/, '');
  return relativePath || '.';
}

function shouldRuntimeCacheRequest(request) {
  const assetPath = requestAssetPath(request);
  if (!assetPath || !activeAssetManifest) return true;
  return shouldRuntimeCacheAssetPath(assetPath, activeAssetManifest);
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
  event.waitUntil(deleteStaleCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (!isSameOriginGet(event.request)) return;
  event.respondWith(networkFirstWithCacheFallback(event.request));
});

self.__SMT_PWA_TEST__ = {
  cacheNameForManifestText,
  cacheNetworkResponse,
  isInstallPrecacheAssetPath,
  requestAssetPath,
  resolvePrecacheUrls,
  setActiveAssetManifest(manifest) {
    activeAssetManifest = manifest;
  },
  shouldRuntimeCacheAssetPath,
  shouldRuntimeCacheRequest,
};
