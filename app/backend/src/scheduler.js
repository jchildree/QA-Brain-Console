// Cron-scheduled email digest job. Runs on DIGEST_SCHEDULE (default daily
// 9 AM), sends each opted-in user their overdue-records digest via email.js.
// No-op (with a warning) if DIGEST_SCHEDULE is unset or SMTP isn't configured
// -- email.js.sendEmail already falls back to an offline console log.
const cron = require('node-cron');
const { DIGEST_SCHEDULE, USERS_FILE } = require('./config');
const { loadUsers } = require('./users');
const { getOverdueRecordsForUser, buildDigestHtml } = require('./digest');
const { sendEmail } = require('./email');

async function runDigestJob() {
  console.log('[Scheduler] Running digest job...');
  const users = loadUsers(USERS_FILE);
  const optedIn = users.filter((u) => u.emailOptIn && u.email);

  for (const user of optedIn) {
    try {
      const overdue = getOverdueRecordsForUser(user.username);
      if (overdue.length > 0) {
        const html = buildDigestHtml(user.username, overdue);
        await sendEmail(user.email, `QA Brain Digest: ${overdue.length} overdue records`, html);
        console.log(`[Scheduler] Sent digest to ${user.email}`);
      }
    } catch (err) {
      console.error(`[Scheduler] Error sending digest to ${user.username}:`, err);
    }
  }
}

function startScheduler() {
  if (!DIGEST_SCHEDULE) {
    console.warn('WARNING: DIGEST_SCHEDULE not set. Digest job not scheduled.');
    return;
  }
  cron.schedule(DIGEST_SCHEDULE, runDigestJob);
  console.log(`[Scheduler] Digest job scheduled: ${DIGEST_SCHEDULE}`);
}

module.exports = { startScheduler, runDigestJob };
