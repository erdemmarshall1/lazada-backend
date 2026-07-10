/* Custom service worker (injectManifest mode).
   vite-plugin-pwa injects the precache manifest at `self.__WB_MANIFEST`.
   Plain Cache API only — no workbox imports required. */

const CACHE = 'theoutnet-wholesale-v1';
const RUNTIME_CACHE = 'theoutnet-wholesale-runtime-v1';
const OFFLINE_URL = '/offline.html';
const MANIFEST = self.__WB_MANIFEST || [];

const PRODUCT_PATTERN = /\/(goods-detail|searchgoods|store-detail|main)\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, ...MANIFEST.map((m) => m.url)]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (/(^\/(main|home|api|uploads)\/)|(\/socket\.io\/)/.test(url.pathname)) return;

  // Navigation requests: network-first with runtime cache + offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const runtimeCached = await caches.match(req, { cacheName: RUNTIME_CACHE });
          return runtimeCached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Product / content pages: cache-first, refresh in background.
  if (PRODUCT_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(req, { cacheName: RUNTIME_CACHE }).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

// Periodic background sync for data refresh.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(refreshContent());
  }
});

const refreshContent = async () => {
  const keys = await caches.keys();
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = (await cache.keys()).filter((r) => PRODUCT_PATTERN.test(new URL(r.url).pathname));
  await Promise.allSettled(
    requests.map(async (req) => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone());
      } catch { /* offline, skip */ }
    })
  );
};

// Web Push delivery.
self.addEventListener('push', (event) => {
  let data = { title: 'Notification', body: '', url: '/' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) { /* ignore parse errors */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body || data.message || '',
      data: { url: data.url || '/' },
      icon: '/img/outnet-logo.png',
      badge: '/img/outnet-logo.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
