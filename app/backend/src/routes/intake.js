const express = require('express');

function createIntakeRouter(provider) {
  const router = express.Router();

  router.post('/intake/extract', async (req, res) => {
    const { rawText, type } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'rawText is required' });
    }
    try {
      const extracted = await provider.extractFields(rawText, type || 'sop');
      res.json(extracted);
    } catch (err) {
      res.status(502).json({ error: 'AI extraction failed', detail: err.message });
    }
  });

  return router;
}

module.exports = { createIntakeRouter };
