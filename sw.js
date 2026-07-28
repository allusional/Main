/* Offline cache for Bean Diary. Bump CACHE when files change. */
const CACHE = 'bean-diary-v3';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

/* addAll() rejects without saying which asset failed, so cache one by one. */
async function precache() {
  const cache = await caches.open(CACHE);
  const results = await Promise.allSettled(ASSETS.map((a) => cache.add(a)));
  const failed = ASSETS.filter((_, i) => results[i].status === 'rejected');
  if (failed.length) {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`[sw] could not cache ${ASSETS[i]}`, r.reason);
    });
    throw new Error(`Precache failed for: ${failed.join(', ')}`);
  }
  await self.skipWaiting();
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache());
});

async function cleanupCaches() {
  const keys = await caches.keys();
  const stale = keys.filter((k) => k !== CACHE);
  const results = await Promise.allSettled(stale.map((k) => caches.delete(k)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[sw] could not delete cache ${stale[i]}`, r.reason);
  });
  await self.clients.claim();
}

self.addEventListener('activate', (e) => {
  e.waitUntil(cleanupCaches());
});

async function cachePut(request, response) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch (err) {
    console.error(`[sw] could not cache response for ${request.url}`, err);
  }
}

/* Network-first: always try to fetch the latest when online, fall back to the
   cached copy only when offline. This guarantees updates show up promptly. */
async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok && new URL(request.url).protocol.startsWith('http')) {
      cachePut(request, res.clone());
    }
    return res;
  } catch (networkErr) {
    const hit = (await caches.match(request)) || (await caches.match('index.html'));
    if (hit) return hit;
    console.error(`[sw] offline and nothing cached for ${request.url}`, networkErr);
    return new Response('Bean Diary is offline and this resource is not cached.', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(networkFirst(e.request));
});
