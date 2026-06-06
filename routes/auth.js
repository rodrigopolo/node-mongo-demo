'use strict';
const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const User = require('../lib/models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// Get current logged-in user
router.get('/me', ensureAuthenticated, (req, res) => {
  const { _id, name, email, role, timezone } = req.user;
  res.json({ _id, name, email, role, timezone });
});

// Sign in
router.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Authentication failed' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      const { _id, name, email, role, timezone } = user;
      res.json({ _id, name, email, role, timezone });
    });
  })(req, res, next);
});

// Sign out
router.post('/signout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Signed out' });
  });
});

// Request password reset email
router.post('/reset', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Always return the same message to avoid user enumeration
    const msg = { message: 'If that email is registered, a reset link has been sent.' };
    if (!user) return res.json(msg);

    await user.generateResetToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset.html?token=${user.resetToken}`;

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your password',
        text: `Reset link (expires in 2 hours): ${resetUrl}`,
        html: `<p>Reset link (expires in 2 hours):<br><a href="${resetUrl}">${resetUrl}</a></p>`
      });
    } else {
      // Dev mode: log the URL instead of sending email
      console.log('[dev] Password reset URL for', user.email, ':', resetUrl);
    }

    res.json(msg);
  } catch (err) {
    next(err);
  }
});

// Validate reset token
router.get('/reset/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({ resetToken: req.params.token });
    if (!user || user.resetTokenDate < Date.now() - 2 * 3600000) {
      return res.status(400).json({ error: 'Token is invalid or expired' });
    }
    res.json({ valid: true, email: user.email });
  } catch (err) {
    next(err);
  }
});

// Submit new password
router.post('/reset/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({ resetToken: req.params.token });
    if (!user || user.resetTokenDate < Date.now() - 2 * 3600000) {
      return res.status(400).json({ error: 'Token is invalid or expired' });
    }
    if (!req.body.password) return res.status(400).json({ error: 'Password is required' });

    user.password = req.body.password;
    user.resetToken = '';
    user.resetTokenDate = null;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
