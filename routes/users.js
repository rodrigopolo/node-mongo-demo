module.exports = function(CONFIG, app, ensureAuthenticated, models){

	// Store the user roles in memory, it will be on DB later
	var user_roles = [
		{
			value: 1,
			text: 'Admin'
		}, {
			value: 2,
			text: 'Author'
		}, {
			value: 3,
			text: 'Contributor'
		}
	];

	// Store the user roles for the index
	var roles_arr={};
	for(k in user_roles){
		roles_arr[user_roles[k].value]=user_roles[k].text;
	}

	// Show the user creation form
	app.get('/users/create', ensureAuthenticated, function(req, res){
		res.render('users/detail', {
			title: 'Profile',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			form_action: '/users/create/',
			roles: user_roles,
			item: '',
			validation: '',
			error_msg: ''
		});
	});

	// Receive the new user form data
	app.post('/users/create', ensureAuthenticated, function(req, res, next){

		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'email',
			'password',
			'timezone',
			'role'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}

		// Show the user form again highlighting the errors
		if(has_errors){
			error_msg[0] = 'Please fill in all fields.';
			res.render('users/detail', {
				title: 'Profile',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/users/create/',
				roles: user_roles,
				item: req.body,
				validation: val_errors,
				error_msg: error_msg
			});
		}else{

			// Save the new user
			var usr = new models.users(req.body);
			usr.save(function(err){
				if(err){
					if(err.code==11000){
						// If user email already exist
						error_msg[0] = 'A user already exists with this email address.';
						val_errors.email = true;
					}else{
						// In an unkown error
						error_msg[0] = 'Unknown error, try again later.';
						console.log(err);
					}
					res.render('users/detail', {
						title: 'Profile',
						site: CONFIG.site,
						user: req.user,
						path: req.url,
						form_action: '/users/create/',
						roles: user_roles,
						item: req.body,
						validation: val_errors,
						error_msg: error_msg
					});
				} else {
					req.flash('success', 'User has been created.');
					res.redirect('/users/');
				}
			});
		}
	});

	// Show the edit form with the user data
	app.get('/users/edit/:id/', ensureAuthenticated, function(req, res, next){
		models.users.findOne({
			_id: req.params.id
		}, function(err, data){
			if(data){
				res.render('users/detail', {
					title: 'Edit',
					site: CONFIG.site,
					user: req.user,
					path: req.url,
					form_action: '/users/update/'+req.params.id+'/',
					roles: user_roles,
					item: data,
					validation: '',
					error_msg: ''
				});
			}else{
				// 404 - user not found on DB
				next();
			}
		});
	});

	// Receive the edited user form data
	app.post('/users/edit/:id/', ensureAuthenticated, function(req, res, next){

		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'email',
			//'password', // don't validate empty password, if empty: do not change, if filled: change.
			'timezone',
			'role'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}

		// Show the user form again highlighting the errors
		if(has_errors){
			error_msg[0] = 'Please fill in all fields.';
			res.render('users/detail', {
				title: 'Profile',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/users/update/'+req.params.id+'/',
				roles: user_roles,
				item: req.body,
				validation: val_errors,
				error_msg: error_msg
			});
		}else{
			// Find selected user
			models.users.findOne({
				_id: req.params.id
			}, function(err, user){
				if(user){
					// Modify values received from the form
					user.name = req.body.name;
					user.email = req.body.email;
					user.timezone = req.body.timezone;
					user.role = req.body.role;

					if(req.body.password){
						user.password = req.body.password;
					}

					// Save the user
					user.save(function(err){
						if(err){
							if(err.code==11001){
								// If user email already exist
								error_msg[0] = 'A user already exists with this email address.';
								val_errors.email = true;
							}else{
								// In an unkown error
								error_msg[0] = 'Unknown error, try again later.';
								console.log(err);
							}
							res.render('users/detail', {
								title: 'Profile',
								site: CONFIG.site,
								user: req.user,
								path: req.url,
								form_action: '/users/update/'+req.params.id+'/',
								roles: user_roles,
								item: req.body,
								validation: val_errors,
								error_msg: error_msg
							});
						} else {
							req.flash('success', '"'+user.name+'" has been updated.');
							res.redirect('/users/');
						}
					});

				}else{
					// 404 - user not found on DB
					next();
				}
			});
		}
	});

	// Delete users
	app.post('/users/delete/:id/', ensureAuthenticated, function(req, res){

		// Prevent deleting the users account
		if(req.user._id==req.params.id){
			res.redirect('/users/');
		}else{
			// First, check if the user exists
			models.users.findOne({
				_id: req.params.id
			}, function(err, user){
				// User exists
				if(user){
					// user removal
					user.remove(function (err, deleted_user){
						if(err){
							res.redirect('/users/');
						}else{
							req.flash('success', 'User "'+deleted_user.name+'"" has been deleted.');
							res.redirect('/users/');
						}
					});
				}else{
					// 404 - user not found on DB
					next();
				}
			});
		}

	});

	// Find users
	app.get('/users/find/:q/:page(\\d+)?/', ensureAuthenticated, function(req, res){
		console.log(req.params);
		res.render('users/index', {
			title: 'Profile',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			roles: roles_arr
		});
	});

	// Show the index page with pagination
	app.get('/users/:page(\\d+)?', ensureAuthenticated, function(req, res, next){
		var page = (req.params.page || 1)-1;
		var perPage = 10;
		models.users
			.find()
			.select('_id name email role')
			.sort({name: 'asc'})
			.limit(perPage)
			.skip(perPage * page)
			.exec(function(err, data){
				if(data.length<1){
					next();
				}else{
					models.users.count().exec(function(err, count){
						res.render('users/index', {
							title: 'Users',
							site: CONFIG.site,
							user: req.user,
							path: req.url,
							roles: roles_arr,
							users: data,
							page: (page+1),
							pages: Math.ceil(count / perPage),
							messages: req.flash('success')
						});
					});
				}
		});

	});
}
