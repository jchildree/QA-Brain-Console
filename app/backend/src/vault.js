const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function listSops(sopDir) {
  return fs
    .readdirSync(sopDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(sopDir, f), 'utf8');
      const { data } = matter(raw);
      return { ...data, filename: f };
    })
    .filter((record) => Boolean(record.id));
}

function readSop(sopDir, filename) {
  const filePath = path.join(sopDir, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { frontmatter: data, body: content, filename };
}

function writeSop(sopDir, filename, frontmatter, body) {
  const filePath = path.join(sopDir, filename);
  const output = matter.stringify(body, frontmatter);
  fs.writeFileSync(filePath, output, 'utf8');
}

function nextSequence(dir, prefix, dateStr) {
  const idPattern = new RegExp(`^${prefix}-${dateStr}-(\\d{3})\\.md$`);
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const seqs = existing
    .map((f) => f.match(idPattern))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  const next = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  return String(next).padStart(3, '0');
}

function createRecord(dir, idPrefix, frontmatter, body) {
  fs.mkdirSync(dir, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = nextSequence(dir, idPrefix, dateStr);
  const id = `${idPrefix}-${dateStr}-${seq}`;
  const filename = `${id}.md`;
  const fullFrontmatter = { ...frontmatter, id };
  writeSop(dir, filename, fullFrontmatter, body);
  return { filename, frontmatter: fullFrontmatter };
}

module.exports = { listSops, readSop, writeSop, createRecord };
