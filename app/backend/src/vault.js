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

function nextSequence(dir, prefix, dateStr, exclude = new Set()) {
  const idPattern = new RegExp(`^${prefix}-${dateStr}-(\\d{3})\\.md$`);
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const seqs = existing
    .map((f) => f.match(idPattern))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .concat([...exclude]);
  const next = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  return String(next).padStart(3, '0');
}

// ponytail: nextSequence + write isn't atomic across processes; retry on
// EEXIST instead of a lock file so two concurrent creates can't collide on
// the same id.
function createRecord(dir, idPrefix, frontmatter, body) {
  fs.mkdirSync(dir, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tried = new Set();
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const seq = nextSequence(dir, idPrefix, dateStr, tried);
    tried.add(Number(seq));
    const id = `${idPrefix}-${dateStr}-${seq}`;
    const filename = `${id}.md`;
    const fullFrontmatter = { ...frontmatter, id };
    const output = matter.stringify(body, fullFrontmatter);
    try {
      fs.writeFileSync(path.join(dir, filename), output, { encoding: 'utf8', flag: 'wx' });
      return { filename, frontmatter: fullFrontmatter };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
  throw new Error(`could not allocate a unique id for ${idPrefix}-${dateStr} after 50 attempts`);
}

function moveRecord(fromDir, toDir, filename) {
  fs.mkdirSync(toDir, { recursive: true });
  fs.renameSync(path.join(fromDir, filename), path.join(toDir, filename));
}

function unlinkRecord(dir, filename) {
  fs.unlinkSync(path.join(dir, filename));
}

module.exports = { listSops, readSop, writeSop, createRecord, moveRecord, unlinkRecord };
