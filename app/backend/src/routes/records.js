const express = require('express');
const { listSops, readSop, writeSop, createRecord } = require('../vault');

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;

function isSafeFilename(filename) {
  return SAFE_FILENAME.test(filename) && !filename.includes('..');
}

function createRecordsRouter(urlSlug, idPrefix, dir) {
  const router = express.Router();

  router.get(`/${urlSlug}`, (req, res) => {
    res.json(listSops(dir));
  });

  router.get(`/${urlSlug}/:filename`, (req, res) => {
    if (!isSafeFilename(req.params.filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    try {
      res.json(readSop(dir, req.params.filename));
    } catch (err) {
      res.status(404).json({ error: 'record not found' });
    }
  });

  router.put(`/${urlSlug}/:filename`, (req, res) => {
    if (!isSafeFilename(req.params.filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    const { frontmatter, body } = req.body;
    writeSop(dir, req.params.filename, frontmatter, body);
    res.json({ ok: true });
  });

  router.post(`/${urlSlug}`, (req, res) => {
    const { frontmatter, body } = req.body;
    const created = createRecord(dir, idPrefix, frontmatter || {}, body || '');
    res.status(201).json(created);
  });

  return router;
}

module.exports = { createRecordsRouter };
