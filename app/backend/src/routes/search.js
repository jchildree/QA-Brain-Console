const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function createSearchRouter(recordTypes) {
  const router = express.Router();

  router.get('/search', (req, res) => {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q) {
      return res.status(400).json({ error: 'q is required' });
    }

    const results = [];

    for (const [type, { dir, urlSlug }] of Object.entries(recordTypes)) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const filename of files) {
        const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
        const { data, content } = matter(raw);
        const haystack = `${JSON.stringify(data)}\n${content}`.toLowerCase();
        if (haystack.includes(q)) {
          results.push({ type, urlSlug, filename, id: data.id, status: data.status, ...data });
        }
      }
    }

    res.json(results);
  });

  return router;
}

module.exports = { createSearchRouter };
