const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB

function createEvidenceRouter(recordTypes, unlinkedDir) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_BYTES } });

  router.get('/evidence', (req, res) => {
    const results = [];

    for (const [type, { dir, urlSlug }] of Object.entries(recordTypes)) {
      const attachmentsRoot = path.join(dir, 'attachments');
      if (!fs.existsSync(attachmentsRoot)) continue;

      const recordDirs = fs.readdirSync(attachmentsRoot);
      for (const recordBase of recordDirs) {
        const recordAttachDir = path.join(attachmentsRoot, recordBase);
        if (!fs.statSync(recordAttachDir).isDirectory()) continue;

        const files = fs.readdirSync(recordAttachDir);
        for (const attachmentFilename of files) {
          results.push({
            type,
            urlSlug,
            recordFilename: `${recordBase}.md`,
            attachmentFilename,
          });
        }
      }
    }

    // Unlinked evidence -- uploaded but not yet attached to a record.
    if (unlinkedDir && fs.existsSync(unlinkedDir)) {
      for (const attachmentFilename of fs.readdirSync(unlinkedDir)) {
        if (!fs.statSync(path.join(unlinkedDir, attachmentFilename)).isFile()) continue;
        results.push({
          type: 'unlinked',
          urlSlug: '',
          recordFilename: null,
          attachmentFilename,
        });
      }
    }

    res.json(results);
  });

  router.post('/evidence/unlinked', (req, res, next) => {
    upload.array('evidence')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(413).json({ error: `upload rejected: ${err.message}` });
      }
      if (err) return next(err);
      next();
    });
  }, (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'evidence file is required' });
    }
    fs.mkdirSync(unlinkedDir, { recursive: true });
    const saved = [];
    for (const file of req.files) {
      const safeName = path.basename(file.originalname);
      fs.writeFileSync(path.join(unlinkedDir, safeName), file.buffer);
      saved.push(safeName);
    }
    res.json({ saved });
  });

  return router;
}

module.exports = { createEvidenceRouter };
