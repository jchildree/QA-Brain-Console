const express = require('express');
const matter = require('gray-matter');

// Splits raw text with YAML frontmatter (---\nkey: value\n---\nbody) into its
// parts -- used by bulk folder import so dropped .md files with existing
// frontmatter land in the right note fields instead of one big blob of text.
function createParseRouter() {
  const router = express.Router();

  router.post('/parse-frontmatter', (req, res) => {
    const { rawText } = req.body;
    if (typeof rawText !== 'string') {
      return res.status(400).json({ error: 'rawText is required' });
    }
    const { data, content } = matter(rawText);
    res.json({ frontmatter: data, body: content.trim() });
  });

  return router;
}

module.exports = { createParseRouter };
