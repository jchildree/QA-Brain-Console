const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGING_DAYS = 30; // CAP/incident draft/in-review aging threshold
const WARNING_WINDOW_DAYS = 7; // SOPs due within N days get medium alert

function computeAlerts(recordTypes) {
  const alerts = [];
  const now = new Date();

  for (const [slug, { dir, urlSlug }] of Object.entries(recordTypes)) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data: frontmatter } = matter(raw);
      const id = frontmatter.id || file.replace(/\.md$/, '');

      // SOP: check review_date
      if (slug === 'sop') {
        if (frontmatter.status !== 'Approved') continue;
        if (!frontmatter.review_date) continue;

        const reviewDate = new Date(frontmatter.review_date);
        const daysUntil = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
          alerts.push({
            id,
            type: 'SOP',
            urlSlug,
            reason: `SOP review overdue since ${reviewDate.toISOString().split('T')[0]}`,
            dueDate: frontmatter.review_date,
            severity: 'high',
          });
        } else if (daysUntil <= WARNING_WINDOW_DAYS) {
          alerts.push({
            id,
            type: 'SOP',
            urlSlug,
            reason: `SOP review due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            dueDate: frontmatter.review_date,
            severity: 'medium',
          });
        }
      }

      // CAP: check created date
      if (slug === 'cap') {
        if (!['Draft', 'In Review'].includes(frontmatter.status)) continue;
        if (!frontmatter.created) continue;

        const createdDate = new Date(frontmatter.created);
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (ageInDays > AGING_DAYS) {
          alerts.push({
            id,
            type: 'CAP',
            urlSlug,
            reason: `CAP open for ${ageInDays} days (created ${frontmatter.created})`,
            dueDate: frontmatter.created,
            severity: 'medium',
          });
        }
      }

      // INCIDENT: check created date (same logic as CAP)
      if (slug === 'incident') {
        if (!['Draft', 'In Review'].includes(frontmatter.status)) continue;
        if (!frontmatter.created) continue;

        const createdDate = new Date(frontmatter.created);
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (ageInDays > AGING_DAYS) {
          alerts.push({
            id,
            type: 'INCIDENT',
            urlSlug,
            reason: `Incident open for ${ageInDays} days (created ${frontmatter.created})`,
            dueDate: frontmatter.created,
            severity: 'medium',
          });
        }
      }

      // CHANGE, AUDIT, TRAINING, MEETING: no rules yet -- stubbed
    }
  }

  // Sort: severity (high > medium > low), then dueDate (soonest first)
  const severityRank = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

module.exports = { computeAlerts, AGING_DAYS, WARNING_WINDOW_DAYS };
