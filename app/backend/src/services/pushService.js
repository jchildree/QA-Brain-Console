const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = require('../config');

function initializePushService() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('Push service disabled: VAPID keys not configured.');
    return;
  }

  webpush.setVapidDetails(
    'mailto:example@domain.com', // Subject (arbitrary; can be hardcoded or use app name)
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function broadcastPush(subscriptions, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('Push service disabled; skipping broadcast.');
    return { success: 0, failed: 0, errors: [] };
  }

  const results = { success: 0, failed: 0, errors: [] };
  const payloadStr = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payloadStr);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        subscription: sub.endpoint?.substring(0, 50), // log endpoint prefix only
        error: error.message,
      });

      // 410 Gone = subscription is invalid/expired, can be removed silently
      // 400 Bad Request = likely malformed subscription
      if (error.statusCode === 410) {
        console.info(`[Push] Subscription expired: ${sub.endpoint}`);
      } else {
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, error.message);
      }
    }
  }

  return results;
}

module.exports = { initializePushService, broadcastPush };
