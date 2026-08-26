// Handle incoming push events
self.addEventListener('push', (event) => {
  // Parse the push event payload (assumed to be JSON)
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback: use plain text as title if JSON parsing fails
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const { title = 'Alert', body = '', icon = '/favicon.svg', badge = '/favicon.svg', record } = data;

  const options = {
    body,
    icon,
    badge,
    // Store record data so we can access it in notificationclick
    data: { record },
    // Make it persistent (iOS/some browsers require this)
    tag: record?.id || 'notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const record = event.notification.data?.record;
  if (!record || !record.type || !record.id) {
    // No record data, just open the home page
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
    return;
  }

  // Build the target URL based on record type and ID
  const recordType = record.type.toLowerCase();
  const targetUrl = `/${recordType}/${record.id}`;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to find and focus an existing window with this record open
      for (const client of clientList) {
        if (client.url.includes(targetUrl)) {
          return client.focus();
        }
      }

      // If not found, open a new tab with the record
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
