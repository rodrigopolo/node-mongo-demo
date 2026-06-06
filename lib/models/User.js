'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const schema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  timezone:       Number,
  role:           Number,
  resetToken:     String,
  resetTokenDate: Date
});

schema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

schema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

schema.methods.generateResetToken = async function () {
  const buf = await crypto.randomBytes(32);
  this.resetToken = buf.toString('base64url');
  this.resetTokenDate = new Date();
  return this;
};

const User = mongoose.model('users', schema);

// Create default admin on first run
User.countDocuments().then(count => {
  if (count > 0) return;
  return new User({
    name:     process.env.DEFAULT_ADMIN_NAME     || 'Admin',
    email:    process.env.DEFAULT_ADMIN_EMAIL    || 'admin@example.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'changeme',
    timezone: 0,
    role:     1
  }).save();
}).then(user => {
  if (user) console.log('Default admin created:', user.email);
}).catch(err => console.error('Error creating default admin:', err));

module.exports = User;
