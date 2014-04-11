module.exports = function(CONFIG, app, passport){

	// Signin
	app.get('/signin', function(req, res){
		var msg = req.session.messages;
		req.session.messages=null;
		res.render('public/signin', {
			title: 'Signin',
			site: CONFIG.site,
			user: req.user, 
			path: req.url,
			message: msg
		});
	});

	// POST /signin
	//   This is an alternative implementation that uses a custom callback to
	//   acheive the same functionality.
	app.post('/signin', function(req, res, next){
		passport.authenticate('local', function(err, user, info){
			if (err){
				return next(err);
			}
			if (!user){
				req.session.messages =  [info.message];
				return res.redirect('/signin');
			}
			req.logIn(user, function(err){
				if (err){
					return next(err);
				}
				return res.redirect('/');
			});
		})(req, res, next);
	});

	// Signout
	app.get('/signout', function(req, res){
		req.logout();
		res.redirect('/');
	});
}