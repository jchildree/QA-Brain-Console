const express = require('express');
const fs = require('fs');
const path = require('path');
const { listSops, moveRecord, unlinkRecord } = require('../vault');
const { isSafeFilename } = require('./records');

function createTrashRouter(RECORD_TYPES, TRASH_DIR) {
  const router = express.Router();
  const prefixToDir = Object.fromEntries(
    Object.values(RECORD_TYPES).map(({ idPrefix, dir }) => [idPrefix, dir]),
  );

  router.get('/trash', (req, res) => {
    res.json(listSops(TRASH_DIR));
  });

  router.post('/trash/:filename/restore', (req, res) => {
    const { filename } = req.params;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    const prefix = filename.split('-')[0];
    const destDir = prefixToDir[prefix];
    if (!destDir) {
      return res.status(400).json({ error: 'unknown record type' });
    }
    if (fs.existsSync(path.join(destDir, filename))) {
      return res.status(409).json({ error: 'a record with this filename already exists at the destination' });
    }
    try {
      moveRecord(TRASH_DIR, destDir, filename);
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: 'record not found in trash' });
    }
  });

  router.delete('/trash/:filename', (req, res) => {
    const { filename } = req.params;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    try {
      unlinkRecord(TRASH_DIR, filename);
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: 'record not found in trash' });
    }
  });

  return router;
}

module.exports = { createTrashRouter };
