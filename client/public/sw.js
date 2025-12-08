const CACHE_VERSION = 'v7';
const CACHE_NAME = `sts-taxrepair-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sts-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
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
  
  if (request.method !== 'GET') return;

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
    const offlinePage = await caches.match('/');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('You are offline', { 
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
