const express = require('express');
const fs = require('fs');
const path = require('path');
const { broadcastPush } = require('../services/pushService');
const { SUBSCRIPTIONS_FILE } = require('../config');

// Real browser push endpoints only ever live on these origins. Restricting to
// this allowlist prevents /push/send from being used as an open SSRF relay
// via an attacker-supplied endpoint URL.
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.apple.com',
];

function isAllowedPushEndpoint(endpoint) {
  try {
    const { protocol, hostname } = new URL(endpoint);
    if (protocol !== 'https:') return false;
    return ALLOWED_PUSH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function createPushRouter(subscriptionsFile = SUBSCRIPTIONS_FILE) {
  const router = express.Router();

  function loadSubscriptions() {
    try {
      return JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8'));
    } catch {
      return {};
    }
  }

  function saveSubscriptions(subs) {
    fs.mkdirSync(path.dirname(subscriptionsFile), { recursive: true });
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subs, null, 2), 'utf8');
  }

  // POST /api/push/subscribe -- persist a browser's push subscription, keyed
  // by username, replacing any existing entry for the same endpoint.
  router.post('/push/subscribe', (req, res) => {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'subscription must include an endpoint' });
    }

    const username = req.user;
    if (!username) {
      return res.status(401).json({ error: 'authentication required' });
    }

    const subs = loadSubscriptions();
    const existing = subs[username] || [];
    const next = existing.filter((s) => s.endpoint !== subscription.endpoint);
    next.push(subscription);
    subs[username] = next;
    saveSubscriptions(subs);

    res.json({ ok: true });
  });

  router.post('/push/test', async (req, res) => {
    const username = req.user;
    if (!username) {
      return res.status(401).json({ error: 'authentication required' });
    }

    const subs = loadSubscriptions();
    const subscriptions = subs[username] || [];
    if (subscriptions.length === 0) {
      return res.status(400).json({ error: 'no push subscription on file' });
    }

    const results = await broadcastPush(subscriptions, {
      title: 'QA Brain',
      body: 'This is a test notification.',
    });

    res.json({ ok: true, sent: results.success, failed: results.failed });
  });

  router.post('/push/send', async (req, res) => {
    try {
      const { subscriptions, payload } = req.body;

      // Validation
      if (!Array.isArray(subscriptions)) {
        return res.status(400).json({ error: 'subscriptions must be an array' });
      }
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'payload must be an object' });
      }
      if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'subscriptions array is empty' });
      }

      // Validate subscription structure (must have endpoint and keys)
      for (const sub of subscriptions) {
        if (!sub.endpoint) {
          return res.status(400).json({ error: 'subscription missing endpoint' });
        }
        if (!isAllowedPushEndpoint(sub.endpoint)) {
          return res.status(400).json({ error: 'subscription endpoint is not a recognized push service' });
        }
        if (!sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
          return res.status(400).json({ error: 'subscription missing encryption keys' });
        }
      }

      // Broadcast
      const results = await broadcastPush(subscriptions, payload);

      res.json({
        success: true,
        summary: {
          sent: results.success,
          failed: results.failed,
          total: subscriptions.length,
        },
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (error) {
      console.error('[Push] Route error:', error);
      res.status(500).json({ error: 'internal server error' });
    }
  });

  return router;
}

module.exports = { createPushRouter };
