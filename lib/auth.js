'use strict';
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const User = require('./models/User');

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err);
  }
});

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'Unknown user' });
    const match = await user.comparePassword(password);
    return done(null, match ? user : false, match ? null : { message: 'Invalid password' });
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
