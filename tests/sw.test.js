'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SW_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

/* A tiny in-memory stand-in for the CacheStorage API surface that sw.js uses. */
function makeCaches(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, new Map(Object.entries(v))]));
  const keyOf = (req) => (typeof req === 'string' ? req : req.url);

  function cacheFor(name) {
    if (!store.has(name)) store.set(name, new Map());
    const map = store.get(name);
    return {
      addAll: (assets) => { assets.forEach((a) => map.set(a, { body: `cached:${a}` })); return Promise.resolve(); },
      put: (req, res) => { map.set(keyOf(req), res); return Promise.resolve(); },
      match: (req) => Promise.resolve(map.get(keyOf(req))),
    };
  }

  return {
    store,
    open: (name) => Promise.resolve(cacheFor(name)),
    keys: () => Promise.resolve([...store.keys()]),
    delete: (name) => Promise.resolve(store.delete(name)),
    match: (req) => {
      for (const map of store.values()) {
        if (map.has(keyOf(req))) return Promise.resolve(map.get(keyOf(req)));
      }
      return Promise.resolve(undefined);
    },
  };
}

/* Load sw.js in a fresh sandbox and return the captured event handlers plus the
   mocked globals so each test starts from a clean slate. */
function loadServiceWorker({ caches, fetch, seed } = {}) {
  const handlers = {};
  const clients = { claim: () => { clients.claimed = true; return Promise.resolve(); }, claimed: false };
  const cacheStorage = caches || makeCaches(seed);

  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: () => { self.skipped = true; return Promise.resolve(); },
    skipped: false,
    clients,
    caches: cacheStorage,
  };

  const sandbox = { self, caches: cacheStorage, fetch, Promise, console };
  vm.runInNewContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

  return { handlers, self, caches: cacheStorage };
}

function fakeEvent(extra = {}) {
  const evt = {
    waitUntil: (p) => { evt.waited = p; },
    respondWith: (p) => { evt.responded = p; },
    ...extra,
  };
  return evt;
}

test('install handler pre-caches all assets and skips waiting', async () => {
  const { handlers, self, caches } = loadServiceWorker();
  const evt = fakeEvent();

  handlers.install(evt);
  await evt.waited;

  const cached = caches.store.get('bean-diary-v4');
  assert.ok(cached, 'current cache is created');
  for (const asset of ['index.html', 'core.js', 'app.js', 'styles.css']) {
    assert.ok(cached.has(asset), `${asset} is pre-cached`);
  }
  assert.equal(self.skipped, true);
});

test('activate handler deletes stale caches and keeps the current one', async () => {
  const { handlers, self, caches } = loadServiceWorker({
    seed: { 'bean-diary-v3': { 'index.html': {} }, 'bean-diary-v4': { 'index.html': {} } },
  });
  const evt = fakeEvent();

  handlers.activate(evt);
  await evt.waited;

  assert.equal(caches.store.has('bean-diary-v3'), false, 'old cache removed');
  assert.equal(caches.store.has('bean-diary-v4'), true, 'current cache kept');
  assert.equal(self.clients.claimed, true);
});

test('fetch handler ignores non-GET requests', () => {
  const { handlers } = loadServiceWorker();
  const evt = fakeEvent({ request: { method: 'POST', url: '/save' } });

  handlers.fetch(evt);

  assert.equal(evt.responded, undefined, 'respondWith is never called');
});

test('fetch handler returns the network response and caches a copy (online)', async () => {
  const networkRes = { body: 'fresh', clone: () => ({ body: 'fresh-copy' }) };
  const fetch = () => Promise.resolve(networkRes);
  const { handlers, caches } = loadServiceWorker({ fetch });
  const evt = fakeEvent({ request: { method: 'GET', url: '/index.html' } });

  handlers.fetch(evt);
  const res = await evt.responded;

  assert.equal(res, networkRes, 'the live network response is served');
  const cached = await caches.match({ url: '/index.html' });
  assert.deepEqual(cached, { body: 'fresh-copy' }, 'a clone is written to the cache');
});

test('fetch handler falls back to the cached copy when offline', async () => {
  const fetch = () => Promise.reject(new Error('offline'));
  const { handlers } = loadServiceWorker({
    fetch,
    seed: { 'bean-diary-v4': { '/index.html': { body: 'stale' } } },
  });
  const evt = fakeEvent({ request: { method: 'GET', url: '/index.html' } });

  handlers.fetch(evt);
  const res = await evt.responded;

  assert.deepEqual(res, { body: 'stale' });
});

test('fetch handler falls back to index.html for uncached navigations when offline', async () => {
  const fetch = () => Promise.reject(new Error('offline'));
  const { handlers } = loadServiceWorker({
    fetch,
    seed: { 'bean-diary-v4': { 'index.html': { body: 'app shell' } } },
  });
  const evt = fakeEvent({ request: { method: 'GET', url: '/some/deep/route' } });

  handlers.fetch(evt);
  const res = await evt.responded;

  assert.deepEqual(res, { body: 'app shell' }, 'the app shell is served as a fallback');
});
