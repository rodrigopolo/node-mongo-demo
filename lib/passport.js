module.exports = function(models){
	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;

	// Passport session setup.
	//   To support persistent login sessions, Passport needs to be able to
	//   serialize users into and deserialize users out of the session.
	passport.serializeUser(function(user, done){
		done(null, {email: user.email, password: user.password});
	});

	passport.deserializeUser(function(user, done){
		models.users.findOne(user, function (err, user){
			done(err, user);
		});
	});


	// Use the LocalStrategy within Passport.
	//   Strategies in passport require a `verify` function, which accept
	//   credentials (in this case, a email and password), and invoke a callback
	//   with a user object.
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},function(email, password, done){
		models.users.findOne({email: email}, function(err, user){
			if (err){
				return done(err);
			}
			if (!user){
				return done(null, false, {message: 'Unknown user '+email});
			}
			user.comparePassword(password, function(err, isMatch){
				if (err){
					return done(err);
				}
				if(isMatch){
					return done(null, user);
				}else{
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
	}));

	return passport;
}