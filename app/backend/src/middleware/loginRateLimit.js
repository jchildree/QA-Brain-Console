const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// ponytail: in-memory map is fine for a single-process deploy; move to a
// shared store (redis) if this ever runs behind multiple instances.
function createLoginRateLimit({ windowMs = WINDOW_MS, maxAttempts = MAX_ATTEMPTS } = {}) {
  const attemptsByKey = new Map();

  return function loginRateLimit(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const entry = attemptsByKey.get(key);

    if (!entry || now - entry.firstAttemptAt > windowMs) {
      attemptsByKey.set(key, { count: 1, firstAttemptAt: now });
      return next();
    }

    if (entry.count >= maxAttempts) {
      const retryAfterSec = Math.ceil((entry.firstAttemptAt + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({ error: 'too many login attempts, try again later' });
    }

    entry.count += 1;
    next();
  };
}

module.exports = { createLoginRateLimit };
