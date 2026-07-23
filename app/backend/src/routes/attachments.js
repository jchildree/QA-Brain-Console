const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

function createAttachmentsRouter(urlSlug, dir, provider) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  router.post(`/${urlSlug}/:filename/attachments`, upload.single('evidence'), async (req, res) => {
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

    res.json({ attachmentPath: destPath, extracted, note });
  });

  return router;
}

module.exports = { createAttachmentsRouter };
