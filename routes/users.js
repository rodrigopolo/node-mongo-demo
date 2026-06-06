'use strict';
const express = require('express');
const router = express.Router();
const User = require('../lib/models/User');
const { ensureAuthenticated, requireRole } = require('../middleware/auth');

const ROLES = [
  { value: 1, text: 'Admin' },
  { value: 2, text: 'Author' },
  { value: 3, text: 'Contributor' }
];

// List users — Admin (1) and Author (2) only
router.get('/', ensureAuthenticated, requireRole(2), async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1) - 1;
    const perPage = 10;
    const search  = req.query.search || '';

    const find = {};
    if (search) {
      const re = new RegExp(search, 'i');
      find.$or = [{ name: re }, { email: re }];
    }
    // Authors can only see contributors and below
    if (req.user.role === 2) find.role = { $gte: 2 };

    const [users, total] = await Promise.all([
      User.find(find).select('_id name email role').sort({ name: 1 }).limit(perPage).skip(perPage * page),
      User.countDocuments(find)
    ]);

    res.json({ users, page: page + 1, pages: Math.ceil(total / perPage), total, roles: ROLES });
  } catch (err) {
    next(err);
  }
});

// Get one user
router.get('/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetToken -resetTokenDate');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isSelf  = req.user._id.toString() === req.params.id;
    const canView = req.user.role === 1 || isSelf || (req.user.role === 2 && user.role > 2);
    if (!canView) return res.status(403).json({ error: 'Forbidden' });

    res.json({ ...user.toObject(), roles: ROLES });
  } catch (err) {
    next(err);
  }
});

// Create user — Author+ only
router.post('/', ensureAuthenticated, requireRole(2), async (req, res, next) => {
  try {
    const { name, email, password, timezone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const newUser = new User({ name, email, password, timezone: timezone || 0 });
    // Non-admins may only create contributors
    newUser.role = req.user.role > 1 ? 3 : parseInt(role) || 3;

    await newUser.save();
    res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    next(err);
  }
});

// Update user
router.put('/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isSelf   = req.user._id.toString() === req.params.id;
    const canEdit  = req.user.role === 1 || isSelf || (req.user.role === 2 && user.role > 2);
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const { name, email, password, timezone, role } = req.body;
    if (name)              user.name     = name;
    if (email)             user.email    = email;
    if (timezone != null)  user.timezone = timezone;
    if (password)          user.password = password;
    if (role && req.user.role === 1) user.role = parseInt(role);

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    next(err);
  }
});

// Delete user
router.delete('/:id', ensureAuthenticated, requireRole(2), async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const canDelete = req.user.role === 1 || (req.user.role === 2 && user.role > 2);
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await user.deleteOne();
    res.json({ message: `User "${user.name}" deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
