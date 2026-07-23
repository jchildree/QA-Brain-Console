const express = require('express');
const fs = require('fs');
const path = require('path');

function createEvidenceRouter(recordTypes) {
  const router = express.Router();

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

    res.json(results);
  });

  return router;
}

module.exports = { createEvidenceRouter };
