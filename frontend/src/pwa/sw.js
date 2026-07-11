self.__WB_DISABLE_DEV_LOGS = true;

const CACHE = 'theoutnet-wholesale-v2';
const RUNTIME_CACHE = 'theoutnet-wholesale-runtime-v2';
const IMAGE_CACHE = 'theoutnet-wholesale-images-v2';
const API_CACHE = 'theoutnet-wholesale-api-v2';
const OFFLINE_URL = '/offline.html';
const MANIFEST = self.__WB_MANIFEST || [];

const PRODUCT_PATTERN = /\/(goods-detail|searchgoods|store-detail|main)\//;
const IMAGE_PATTERN = /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(\?.*)?$/;
const FONT_PATTERN = /\.(woff2?|ttf|otf|eot)(\?.*)?$/;

const API_CACHE_PATTERNS = [
  /\/main\/index\/init/,
  /\/home\/category\/list/,
  /\/home\/product\/getList/,
  /\/home\/product\/detail/,
];

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
            .filter((k) => k !== CACHE && k !== RUNTIME_CACHE && k !== IMAGE_CACHE && k !== API_CACHE)
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

  if (/(\/socket\.io\/)/.test(url.pathname)) return;

  if (IMAGE_PATTERN.test(url.pathname)) {
    event.respondWith(imageStrategy(req));
    return;
  }

  if (FONT_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(req, CACHE));
    return;
  }

  const isApiPattern = API_CACHE_PATTERNS.some((p) => p.test(url.pathname));
  if (isApiPattern) {
    event.respondWith(networkFirstStrategy(req, API_CACHE, 120));
    return;
  }

  if (/(^\/(main|home|api|uploads)\/)/.test(url.pathname)) {
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(req, RUNTIME_CACHE, 60));
    return;
  }

  if (PRODUCT_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstThenNetworkStrategy(req, RUNTIME_CACHE));
    return;
  }

  event.respondWith(cacheFirstStrategy(req, CACHE));
});

function cacheFirstStrategy(req, cacheName) {
  return caches.match(req).then((cached) => {
    if (cached) return cached;
    return fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(req, copy));
      }
      return res;
    });
  });
}

function networkFirstStrategy(req, cacheName, ttlSeconds) {
  return fetch(req)
    .then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(cacheName).then((c) => {
          const headers = new Headers(copy.headers);
          headers.append('sw-cache-timestamp', String(Date.now()));
          const responseWithTimestamp = new Response(copy.body, {
            status: copy.status,
            statusText: copy.statusText,
            headers,
          });
          c.put(req, responseWithTimestamp);
        });
      }
      return res;
    })
    .catch(async () => {
      const cached = await caches.match(req);
      if (cached) {
        const timestamp = cached.headers.get('sw-cache-timestamp');
        if (timestamp && (Date.now() - Number(timestamp)) / 1000 < ttlSeconds) {
          return cached;
        }
      }
      const runtimeCached = await caches.match(req, { cacheName });
      if (runtimeCached) return runtimeCached;
      if (req.mode === 'navigate') {
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
      }
      return cached || caches.match(OFFLINE_URL);
    });
}

function cacheFirstThenNetworkStrategy(req, cacheName) {
  return caches.match(req, { cacheName }).then((cached) => {
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  });
}

function imageStrategy(req) {
  return caches.open(IMAGE_CACHE).then((cache) => {
    return cache.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          cache.put(req, res.clone());
        }
        return res;
      }).catch(() => {
        return caches.match(OFFLINE_URL);
      });
    });
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(refreshContent());
  }
});

const refreshContent = async () => {
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = (await cache.keys()).filter((r) => PRODUCT_PATTERN.test(new URL(r.url).pathname));
  await Promise.allSettled(
    requests.map(async (req) => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone());
      } catch { /* skip */ }
    })
  );
};

self.addEventListener('push', (event) => {
  let data = { title: 'THE OUTNET', body: '', url: '/' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) { /* ignore */ }
  const title = data.title || 'THE OUTNET';
  const options = {
    body: data.body || data.message || '',
    data: { url: data.url || '/' },
    icon: '/img/outnet-logo.png',
    badge: '/img/outnet-logo.png',
    vibrate: [200, 100, 200],
    tag: 'theoutnet-notification',
    renotify: true,
    requireInteraction: true,
    silent: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === target && 'focus' in client) {
          return client.focus();
        }
      }
      for (const client of clients) {
        if ('navigate' in client) {
          return client.navigate(target).then(() => client.focus());
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
