const CACHE_NAME = 'biomedix-v1';
const urlsToCache = [
  '/app/home.html',
  '/app/profile.html',
  '/app/users.html',
  '/app/admin/dashboard.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/auth-check.js',
  '/js/notifications.js',
  '/js/pizza-selection.js',
  '/js/user-profile.js',
  '/js/firebase-config.js',
  '/js/admin/content-editor.js',
  '/js/admin/pizza-tracking.js',
  '/js/admin/notifications.js',
  '/js/admin/users.js',
  '/favicon.ico',
  '/icons/ikona(svitla).png',
  '/icons/logo.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // Cache local resources only, skip external CDN resources for now
        const localResources = urlsToCache.filter(url => !url.startsWith('https://cdn.jsdelivr.net'));
        return cache.addAll(localResources)
          .then(() => {
            // Try to cache external resources individually to avoid blocking install
            const externalResources = urlsToCache.filter(url => url.startsWith('https://cdn.jsdelivr.net'));
            return Promise.allSettled(
              externalResources.map(url => 
                fetch(url).then(response => cache.put(url, response)).catch(e => console.log('Failed to cache:', url, e))
              )
            );
          });
      })
      .catch(function(error) {
        console.log('Cache failed:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-http schemes (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              })
              .catch(function(error) {
                console.log('Failed to cache response:', error);
              });

            return response;
          }
        );
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', function(event) {
  console.log('Push message received:', event);
  
  let notificationData = {
    title: 'BioMedix TPM',
    body: 'New notification',
    icon: '/icons/ikona(svitla).png',
    badge: '/favicon.ico',
    tag: 'biomedix-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || notificationData.title;
      notificationData.body = data.body || data.message || notificationData.body;
      notificationData.tag = data.tag || notificationData.tag;
      notificationData.icon = data.icon || notificationData.icon;
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app
  event.waitUntil(
    clients.matchAll().then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/app/home.html' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/app/home.html');
      }
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

function syncNotifications() {
  // This would sync notifications when back online
  console.log('Syncing notifications...');
  return Promise.resolve();
}
