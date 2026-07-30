// Must run after requireAuth -- relies on req.userRole being set.
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'admin access required' });
  }
  next();
}

module.exports = { requireAdmin };
