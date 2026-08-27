const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB

function createAttachmentsRouter(urlSlug, dir, provider) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 } });

  router.post(`/${urlSlug}/:filename/attachments`, (req, res, next) => {
    upload.single('evidence')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(413).json({ error: `upload rejected: ${err.message}` });
      }
      if (err) return next(err);
      next();
    });
  }, async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'evidence file is required' });
    }

    const recordBase = path.basename(req.params.filename, '.md');
    const attachDir = path.join(dir, 'attachments', recordBase);
    fs.mkdirSync(attachDir, { recursive: true });
    const safeName = path.basename(req.file.originalname);
    const destPath = path.join(attachDir, safeName);
    fs.writeFileSync(destPath, req.file.buffer);

    let extracted = null;
    let note = null;

    if (req.file.mimetype.startsWith('text/')) {
      try {
        extracted = await provider.extractFields(req.file.buffer.toString('utf8'), urlSlug);
      } catch (err) {
        note = `Extraction failed: ${err.message}`;
      }
    } else {
      note = 'Binary evidence attached; no automatic extraction for this file type';
    }

    const attachmentPath = ['attachments', recordBase, safeName].join('/');
    res.json({ attachmentPath, extracted, note });
  });

  return router;
}

module.exports = { createAttachmentsRouter };
