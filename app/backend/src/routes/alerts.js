const express = require('express');
const { computeAlerts } = require('../alerts');
const { RECORD_TYPES } = require('../config');

function createAlertsRouter() {
  const router = express.Router();

  let cachedAlerts = null;
  let cacheExpiry = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  router.get('/alerts', (req, res) => {
    const now = Date.now();

    // Invalidate cache if expired
    if (!cachedAlerts || !cacheExpiry || now > cacheExpiry) {
      cachedAlerts = computeAlerts(RECORD_TYPES);
      cacheExpiry = now + CACHE_TTL;
    }

    res.json(cachedAlerts);
  });

  return router;
}

module.exports = { createAlertsRouter };
