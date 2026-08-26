// Email digest content: finds overdue records (past review_date, not Obsolete)
// across all record types and renders them into a simple HTML list.
// MVP heuristic only -- does not yet filter by record ownership/department per
// user; every opted-in user currently gets the same vault-wide overdue list.
const { listSops } = require('./vault');
const { RECORD_TYPES } = require('./config');

// Fetch overdue/due-soon records for a given user.
// Simple heuristic: review_date in the past and status !== Obsolete.
function getOverdueRecordsForUser(username) {
  const overdue = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const [type, { dir }] of Object.entries(RECORD_TYPES)) {
    if (type === 'notes') continue; // notes have no review_date
    try {
      const records = listSops(dir);
      records.forEach((rec) => {
        if (!rec.review_date) return; // no review date set
        if (rec.review_date < today && rec.status !== 'Obsolete') {
          overdue.push({ ...rec, type });
        }
      });
    } catch (err) {
      // dir may not exist yet; skip
    }
  }

  return overdue.sort((a, b) => a.review_date.localeCompare(b.review_date));
}

function buildDigestHtml(username, overdueRecords) {
  if (overdueRecords.length === 0) {
    return `<p>No overdue records.</p><p style="color:#888;font-size:12px">QA Brain digest for ${username}.</p>`;
  }
  let html = `<h2>Overdue Records for ${username}</h2><ul>`;
  overdueRecords.forEach((rec) => {
    html += `<li><strong>[${rec.type}]</strong> ${rec.id}: ${rec.title || rec.filename} (due ${rec.review_date})</li>`;
  });
  html += `</ul><p style="color:#888;font-size:12px">QA Brain -- this is an automated digest. To stop receiving it, disable email digests in your account preferences.</p>`;
  return html;
}

module.exports = { getOverdueRecordsForUser, buildDigestHtml };
