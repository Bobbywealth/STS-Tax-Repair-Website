const CACHE_VERSION = 'v10';
const CACHE_NAME = `sts-taxrepair-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sts-runtime-${CACHE_VERSION}`;
const SYNC_TAG = 'sync-data';
const PERIODIC_SYNC_TAG = 'periodic-content-sync';
const PERIODIC_SYNC_URLS = ['/api/sync', '/api/notifications'];
const QUEUE_DB = 'sts-sync-queue';
const QUEUE_STORE = 'requests';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-64x64.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/screenshots/mobile.png',
  '/screenshots/desktop.png',
  '/client-login',
  '/client-portal',
  '/client-portal/documents',
  '/client-portal/messages'
];

const APP_SHELL_ROUTES = [
  '/',
  '/client-login',
  '/client-portal',
  '/client-portal/documents',
  '/client-portal/messages',
  '/offline.html'
];

const CACHE_STRATEGIES = {
  networkFirst: ['api'],
  cacheFirst: ['fonts.googleapis.com', 'fonts.gstatic.com', '.woff', '.woff2', '.ttf'],
  staleWhileRevalidate: ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico']
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then((cache) => {
        console.log('[SW] Caching app shell routes');
        return cache.addAll(APP_SHELL_ROUTES.filter(Boolean));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sts-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Removing old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

function isApiRequest(url) {
  return url.includes('/api/');
}

function shouldCacheFirst(url) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => url.includes(pattern));
}

function shouldStaleWhileRevalidate(url) {
  return CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => url.includes(pattern));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    event.respondWith(handleNonGetRequest(request));
    return;
  }

  const url = new URL(request.url);

  // Navigation requests (page loads) - always network first for SPA
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // API calls - network first
  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Fonts - cache first (they don't change)
  if (shouldCacheFirst(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Images only - stale while revalidate
  if (shouldStaleWhileRevalidate(request.url)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Everything else (JS, CSS, HTML) - network first for freshness
  event.respondWith(networkFirstWithOfflineFallback(request));
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueuedRequests());
  }

  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(runPeriodicSync());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(runPeriodicSync());
  }
});

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Network request failed for API:', request.url);
    return new Response(
      JSON.stringify({ 
        error: 'You are offline. Please check your connection.',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first failed:', request.url);
    return new Response('Resource not available offline', { status: 503 });
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && response.status !== 206) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Fetch failed:', request.url, error);
      return cachedResponse;
    });

  return cachedResponse || fetchPromise;
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Try offline page first, then root page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    const rootPage = await caches.match('/');
    if (rootPage) {
      return rootPage;
    }
    return new Response('You are offline. Please check your connection.', { 
      status: 503, 
      headers: { 'Content-Type': 'text/html' } 
    });
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'STS TaxRepair', body: 'New notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'New notification from STS TaxRepair',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'sts-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'STS TaxRepair', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

async function handleNonGetRequest(request) {
  const fetchClone = request.clone();
  const queueClone = request.clone();

  try {
    return await fetch(fetchClone);
  } catch (error) {
    console.log('[SW] Queueing request for background sync:', request.url);
    if (self.registration?.sync) {
      await queueRequest(queueClone);
      await self.registration.sync.register(SYNC_TAG);
    }

    return new Response(
      JSON.stringify({
        queued: true,
        offline: true,
        message: 'Request queued. We will retry when you are back online.'
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueRequest(request) {
  const db = await openQueueDb();
  const bodyBuffer = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.arrayBuffer()
    : null;
  const headers = Array.from(request.headers.entries());

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const addRequest = store.add({
      url: request.url,
      method: request.method,
      headers,
      body: bodyBuffer ? Array.from(new Uint8Array(bodyBuffer)) : null,
      timestamp: Date.now()
    });

    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
    tx.oncomplete = () => db.close();
  });
}

async function replayQueuedRequests() {
  const db = await openQueueDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const queued = await readAllQueuedRequests(store);

  for (const entry of queued) {
    const { key, value } = entry;
    const bodyBuffer = value.body ? new Uint8Array(value.body).buffer : undefined;
    const headers = new Headers(value.headers || []);
    const requestInit = {
      method: value.method,
      headers,
      credentials: 'include'
    };

    if (bodyBuffer && value.method !== 'GET' && value.method !== 'HEAD') {
      requestInit.body = bodyBuffer;
    }

    try {
      await fetch(value.url, requestInit);
      store.delete(key);
    } catch (error) {
      console.log('[SW] Retry failed for', value.url, error);
    }
  }

  tx.oncomplete = () => db.close();
}

function readAllQueuedRequests(store) {
  return new Promise((resolve, reject) => {
    const items = [];
    const cursor = store.openCursor();

    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        items.push({ key: c.key, value: c.value });
        c.continue();
      } else {
        resolve(items);
      }
    };

    cursor.onerror = () => reject(cursor.error);
  });
}

async function runPeriodicSync() {
  for (const url of PERIODIC_SYNC_URLS) {
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(url, response.clone());
      }
    } catch (error) {
      console.log('[SW] Periodic sync failed for', url, error);
    }
  }
}
