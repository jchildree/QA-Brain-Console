const express = require('express');
const request = require('supertest');
const { createParseRouter } = require('../src/routes/parse');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', createParseRouter());
  return app;
}

describe('POST /api/parse-frontmatter', () => {
  it('splits YAML frontmatter from the body', async () => {
    const rawText = '---\ntitle: Calibration drift\nfolder: Meetings\ntags:\n  - qc\nrelated_documents:\n  - SOP-1\n---\nDiscussed the drift on line 3.\n';
    const res = await request(makeApp()).post('/api/parse-frontmatter').send({ rawText });
    expect(res.status).toBe(200);
    expect(res.body.frontmatter).toEqual({
      title: 'Calibration drift',
      folder: 'Meetings',
      tags: ['qc'],
      related_documents: ['SOP-1'],
    });
    expect(res.body.body).toBe('Discussed the drift on line 3.');
  });

  it('returns empty frontmatter and the full text as body when there is no frontmatter block', async () => {
    const res = await request(makeApp()).post('/api/parse-frontmatter').send({ rawText: 'Just plain text, no frontmatter.' });
    expect(res.status).toBe(200);
    expect(res.body.frontmatter).toEqual({});
    expect(res.body.body).toBe('Just plain text, no frontmatter.');
  });

  it('returns 400 when rawText is missing', async () => {
    const res = await request(makeApp()).post('/api/parse-frontmatter').send({});
    expect(res.status).toBe(400);
  });
});
