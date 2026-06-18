// أكاديمية نبض - Service Worker v15.0 (Push Notifications + Sound Forwarding)
// يدعم الإشعارات الفورية حتى عند إغلاق التطبيق
// يقوم بإعادة توجيه إشعارات Push للعملاء المفتوحين لتشغيل الصوت
//
// v15.0: Bumped version to force all clients to update after the
// "bulletproof auth page" fix. The auth page now uses ONLY inline styles
// with direct CSS variable references — no color-mix(), no oklab, no
// gradients, no opacity modifiers, no backdrop-filter, no blur filters.
// This guarantees identical rendering on every WebView.

const SW_VERSION = 'v15.0';

// Install - delete ALL old caches immediately, skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Install', SW_VERSION);
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => self.skipWaiting())
  );
});

// Activate - claim ALL clients immediately, force them to refresh
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate', SW_VERSION);
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => self.clients.claim()).then(() => {
      // Notify all open clients that a new SW version is active so they
      // can trigger a hard reload if needed.
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
      });
    })
  );
});

// IMPORTANT: Do NOT add a fetch handler!
// This lets the browser handle all requests normally.

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    });
  }
  if (event.data && event.data.type === 'UNREGISTER') {
    self.registration.unregister();
  }
  // Handle version check
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// ─── Push Event Handler ─────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', SW_VERSION);

  let data = {
    title: 'أكاديمية نبض',
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'nabd-notification',
    url: '/',
    type: 'info',
    sound: true,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notifType = data.type || 'info';

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || `nabd-${Date.now()}`,
    dir: 'rtl',
    lang: 'ar',
    silent: false,  // IMPORTANT: false = OS plays default notification sound
    requireInteraction: false,
    data: {
      url: data.url || '/',
      type: notifType,
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200, 100, 200],
    actions: getActionsForType(notifType),
  };

  event.waitUntil(
    (async () => {
      // 1. Show browser notification (works when app is closed)
      await self.registration.showNotification(data.title, options);

      // 2. Forward push data to ALL open client windows for sound playback
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          payload: {
            title: data.title,
            body: data.body,
            type: notifType,
            url: data.url || '/',
            tag: data.tag,
            sound: data.sound !== false,
            timestamp: Date.now(),
          },
        });
      }
    })()
  );
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'payment':
      return [
        { action: 'view', title: 'عرض التفاصيل' },
        { action: 'dismiss', title: 'تجاهل' },
      ];
    case 'gift':
      return [
        { action: 'view', title: 'عرض الهدية' },
        { action: 'dismiss', title: 'تجاهل' },
      ];
    case 'community':
      return [
        { action: 'view', title: 'عرض المنشور' },
        { action: 'dismiss', title: 'تجاهل' },
      ];
    case 'enrollment':
      return [
        { action: 'view', title: 'بدء الدورة' },
        { action: 'dismiss', title: 'لاحقاً' },
      ];
    default:
      return [
        { action: 'view', title: 'عرض' },
        { action: 'dismiss', title: 'تجاهل' },
      ];
  }
}

// ─── Notification Click Handler ─────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.action);

  event.notification.close();

  if (event.action === 'dismiss') return;

  const notifData = event.notification.data || {};
  const url = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
            notifType: notifData.type,
          });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ─── Notification Close Handler ─────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed', event.notification.tag);
});

// ─── Push Subscription Change Handler ───────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
    });
  });
});
