/* EHI F1 service worker: offline support without any build-time dependency.
   - pages and /data/* : network first (always fresh after a new race), cached copy when offline
   - /assets/* (hashed build files): cache first
   - images, fonts, other static files: show cached copy, refresh in the background
   Bump VERSION to force every phone to drop old caches. */
const VERSION = 'v1';
const CACHE = `ehi-f1-${VERSION}`;
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ehi-f1-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function put(req, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const c = await caches.open(CACHE);
    await c.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req, fallbackKey) {
  try {
    return await put(req, await fetch(req, { cache: 'no-cache' }));
  } catch (err) {
    const hit = (await caches.match(req)) || (fallbackKey && (await caches.match(fallbackKey)));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  return hit || put(req, await fetch(req));
}

async function staleWhileRevalidate(req) {
  const hit = await caches.match(req);
  const refresh = fetch(req).then((res) => put(req, res)).catch(() => hit);
  return hit || refresh;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js' || url.pathname.startsWith('/api/')) return;
    if (req.mode === 'navigate') return event.respondWith(networkFirst(req, '/'));
    if (url.pathname.startsWith('/data/')) return event.respondWith(networkFirst(req));
    if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(req));
    return event.respondWith(staleWhileRevalidate(req));
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return event.respondWith(staleWhileRevalidate(req));
  }
});
