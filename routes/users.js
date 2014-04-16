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
		checkRole(req, res, 2, function(){
			res.render('users/detail', {
				title: 'User- Create',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/users/create/',
				roles: user_roles,
				item: '',
				self: false,
				validation: '',
				error_msg: ''
			});
		});
	});

	// Receive the new user form data
	app.post('/users/create', ensureAuthenticated, function(req, res, next){
		checkRole(req, res, 2, function(){
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
					title: 'User - Create',
					site: CONFIG.site,
					user: req.user,
					path: req.url,
					form_action: '/users/create/',
					roles: user_roles,
					item: req.body,
					self: false,
					validation: val_errors,
					error_msg: error_msg
				});
			}else{

				// Save the new user
				var usr = new models.users(req.body);

				if(req.user.role>1){
					usr.role = 3;
				}

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
							title: 'User - Create',
							site: CONFIG.site,
							user: req.user,
							path: req.url,
							form_action: '/users/create/',
							roles: user_roles,
							item: req.body,
							self: false,
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
	});

	// Show the edit form with the user data
	app.get('/users/edit/:id/', ensureAuthenticated, function(req, res, next){
		models.users.findOne({
			_id: req.params.id
		}, function(err, data){
			if(data){
				if(
					(req.user.role==2 && data.role>2)		// Author can edit contrib only
					|| req.user.role==1						// admin can edit everything
					|| req.user._id == data._id.toString()	// is editing himself
				){
					res.render('users/detail', {
						title: 'User - Edit',
						site: CONFIG.site,
						user: req.user,
						path: req.url,
						form_action: '/users/update/'+req.params.id+'/',
						roles: user_roles,
						item: data,
						self: (data._id.toString() == req.user._id),
						validation: '',
						error_msg: ''
					});
				}else{
					forbiddenRes(req,res);
				}
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
			'timezone'
			//'role' // don't validate role, users can't change their own role.
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
				title: 'User - Edit',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/users/update/'+req.params.id+'/',
				roles: user_roles,
				item: req.body,
				self: req.body.role, // validate if is defined
				validation: val_errors,
				error_msg: error_msg
			});
		}else{
			// Find selected user
			models.users.findOne({
				_id: req.params.id
			}, function(err, user){
				if(user){
					if(
						(req.user.role==2 && user.role>2)		// Author can edit contrib only
						|| req.user.role==1						// admin can edit everything
						|| req.user._id == user._id.toString()	// is editing himself
					){
						// Modify values received from the form
						user.name = req.body.name;
						user.email = req.body.email;
						user.timezone = req.body.timezone;

						if(req.body.role){
							user.role = req.body.role;
						}

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
									title: 'User - Edit',
									site: CONFIG.site,
									user: req.user,
									path: req.url,
									form_action: '/users/update/'+req.params.id+'/',
									roles: user_roles,
									item: req.body,
									self: req.body.role, // validate if is defined
									validation: val_errors,
									error_msg: error_msg
								});
							} else {
								req.flash('success', '"'+user.name+'" has been updated.');
								res.redirect('/users/');
							}
						});
					}else{
						forbiddenRes(req,res);
					}
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
					if(
						(req.user.role==2 && user.role>2)		// Author can delete contrib only
						|| req.user.role==1						// admin can delete everything
					){
						// user removal
						user.remove(function(err, deleted_user){
							if(err){
								res.redirect('/users/');
							}else{
								req.flash('success', 'User "'+deleted_user.name+'"" has been deleted.');
								res.redirect('/users/');
							}
						});
					}else{
						forbiddenRes(req,res);
					}
				}else{
					// 404 - user not found on DB
					next();
				}
			});
		}
	});

	// Show the index page with pagination
	var user_list = function(req, res, next){

		checkRole(req, res, 2, function(){
		
			var find = {};
			if(req.body.search){
				var look_for = new RegExp(req.body.search, 'i');
				find['$or'] = [ {'name': look_for}, {'email': look_for}];
			}

			if(req.user.role==2){
				find.role = {$gte:2};
			}

			var page = (req.params.page || 1)-1;
			var perPage = 10;
			models.users
				.find(find)
				.select('_id name email role')
				.sort({name: 'asc'})
				.limit(perPage)
				.skip(perPage * page)
				.exec(function(err, data){
					if(data.length<1){
						next();
					}else{
						models.users.find(find).count().exec(function(err, count){
							res.render('users/index', {
								title: 'Users',
								site: CONFIG.site,
								user: req.user,
								path: req.url,
								roles: roles_arr,
								users: data,
								search: req.body.search,
								page: (page+1),
								pages: Math.ceil(count / perPage),
								messages: req.flash('success')
							});
						});
					}
			});

		});

	}

	app.get('/users/:page(\\d+)?', ensureAuthenticated, user_list);
	app.post('/users/:page(\\d+)?', ensureAuthenticated, user_list);

	function checkRole(req, res, role, cb){
		if(req.user.role<=role){
			cb();
		}else{
			forbiddenRes(req,res);
		}
	}

	function forbiddenRes(req,res){
		res.status(403);
		res.render('public/403', {
			title: '403 - Forbidden',
			site: CONFIG.site,
			user: req.user,
			path: req.url
		});
	}

}
