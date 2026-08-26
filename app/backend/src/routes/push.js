const express = require('express');
const { broadcastPush } = require('../services/pushService');

function createPushRouter() {
  const router = express.Router();

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
