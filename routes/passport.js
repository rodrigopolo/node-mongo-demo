module.exports = function(CONFIG, app, models, passport){

	// Signin
	app.get('/signin', function(req, res){
		res.render('public/signin', {
			title: 'Sign in',
			site: CONFIG.site,
			user: req.user, 
			path: req.url,
			email: req.flash('email'),
			scsmsg: req.flash('success'),
			errmsg: req.flash('error')
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
				req.flash('email', req.body.email);
				req.flash('error', [info.message]);
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

	// Show the reset form
	app.get('/users/reset/', function(req, res){
		res.render('public/reset', {
			title: 'Password Reset',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			errmsg: req.flash('error'),
			email: req.flash('email')
		});
	});

	// Reset token
	app.post('/users/reset/', function(req, res){
		models.users.findOne({
			email: req.body.email
		}, function(err, user){
			if(user){

				user.generateResetToken(function(err,data){

					data.save(function(err){
						if(err){
							req.flash('error', 'Internal error.');
							res.redirect('/signin');
						} else {
							var recurl = req.protocol+"://"+req.get('host')+'/users/reset/'+data.resetToken+'/';
							CONFIG.mailer.transport.sendMail({
								from: CONFIG.mailer.recovery, // sender address
								to: data.email, // list of receivers
								subject: "Reset your password", // Subject line
								text: "A request to reset the password was received, to reset your password, click on the following URL or copy-paste it into your browser:\n"+recurl,
								html: '<p>A request to reset the password was received, to reset your password, click on the following URL or copy-paste it into your browser:</p>\n<p><a href="'+recurl+'">'+recurl+'</a></p>'
							}, function(error, response){
								if(error){
									console.log(error);
								}else{
									//console.log("Message sent: " + response.message);
									req.flash('success', 'Email sent.');
									req.flash('email', req.body.email);
									res.redirect('/signin');
								}
							});


						}
					});
				});


			}else{
				req.flash('email', req.body.email);
				req.flash('error', 'User does not exists.');
				res.redirect('/users/reset/');
			}
		});
	});

	// Show the reset pass form
	app.get('/users/reset/:token/', function(req, res){

		models.users.findOne({
			resetToken: req.params.token
		}, function (err, user) {

			if(user){
				if (user.resetTokenDate < Date.now() - (2 * 3600000)) {
					req.flash('error', 'Token expired');
					res.redirect('/signin');
				} else {
					res.render('public/newpass', {
						title: 'Password Reset',
						site: CONFIG.site,
						user: req.user,
						path: req.url,
						form_action: '/users/reset/'+req.params.token+'/'
					});
				}

			}else{
				res.redirect('/signin');
			}
		});
	});

	// Show the reset pass form
	app.post('/users/reset/:token/', function(req, res){

		models.users.findOne({
			resetToken: req.params.token
		}, function (err, user) {

			if(user && req.body.password){
				
				user.password = req.body.password;
				user.resetToken = '';

				user.save(function(err){
					if(err){
						res.redirect('/signin');
					} else {
						req.flash('success', 'Password changed.');
						req.flash('email', user.email);
						res.redirect('/signin');
					}
				});
			}else{
				res.redirect('/signin');
			}
		});
	});
}