'use strict';

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

function requireRole(maxRole) {
  return (req, res, next) => {
    if (req.user && req.user.role <= maxRole) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { ensureAuthenticated, requireRole };
