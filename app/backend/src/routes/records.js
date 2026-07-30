const express = require('express');
const { listSops, readSop, writeSop, createRecord, moveRecord, ConflictError } = require('../vault');

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;

function isSafeFilename(filename) {
  return SAFE_FILENAME.test(filename) && !filename.includes('..');
}

function createRecordsRouter(urlSlug, idPrefix, dir, trashDir) {
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
    const { frontmatter, body, expectedHash } = req.body;
    const stamped = req.user ? { ...frontmatter, updated_by: req.user } : frontmatter;
    try {
      const { hash } = writeSop(dir, req.params.filename, stamped, body, expectedHash);
      res.json({ ok: true, hash });
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({ error: 'record changed on disk since it was loaded' });
      }
      throw err;
    }
  });

  router.post(`/${urlSlug}`, (req, res) => {
    const { frontmatter, body } = req.body;
    const stamped = req.user ? { ...frontmatter, created_by: req.user } : frontmatter;
    const created = createRecord(dir, idPrefix, stamped || {}, body || '');
    res.status(201).json(created);
  });

  router.delete(`/${urlSlug}/:filename`, (req, res) => {
    if (!isSafeFilename(req.params.filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    try {
      moveRecord(dir, trashDir, req.params.filename);
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: 'record not found' });
    }
  });

  return router;
}

module.exports = { createRecordsRouter, isSafeFilename };
