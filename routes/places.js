module.exports = function(CONFIG, app, ensureAuthenticated, mongoose, models){








	// Show the place creation form
	app.get('/places/create', ensureAuthenticated, function(req, res, next){
		res.render('places/detail', {
			title: 'Places - Edit',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			form_action: '/places/create/',
			item: '',
			validation: '',
			error_msg: ''
		});
	});

	// Receive the new place form data
	app.post('/places/create', ensureAuthenticated, function(req, res, next){
		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'image',
			'description'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}
		if(req.body.location.coordinates){
			req.body.location.coordinates = JSON.parse(req.body.location.coordinates);
		}else{
			val_errors['location'] = 'Set a point or path.'
			has_errors = true;
		}

		// Show the user form again highlighting the errors
		if(has_errors){
			error_msg[0] = 'Please fill in all fields.';
			res.render('places/detail', {
				title: 'Places - Create',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/places/create/',
				item: req.body,
				validation: val_errors,
				error_msg: error_msg
			});
		}else{

			// Save the new user
			var now = new Date();
			var place = new models.places({
				name: req.body.name,
				image: req.body.image,
				description: req.body.description,
				location: {
					type: req.body.location.type,
					coordinates: req.body.location.coordinates
				},
				author: req.user._id,
				created: now,
				last_edit_by: req.user._id,
				edited: now
			});

			place.save(function(err){
				if(err){
					if(err.code==11000){
						// If user email already exist
						error_msg[0] = 'Duplicate entry.';
						val_errors.email = true;
					}else{
						// In an unkown error
						error_msg[0] = 'Unknown error, try again later.';
						console.log(err);
					}
					res.render('places/detail', {
						title: 'Places - Create',
						site: CONFIG.site,
						user: req.user,
						path: req.url,
						form_action: '/places/create/',
						item: req.body,
						validation: val_errors,
						error_msg: error_msg
					});
				} else {
					req.flash('success', 'Place has been created.');
					res.redirect('/places/');
				}
			});
		}
	});

	// Show the edit form with the place data
	app.get('/places/edit/:id/', ensureAuthenticated, function(req, res, next){
		models.places.findOne({
			_id: req.params.id
		}, function(err, data){
			if(data){
				res.render('places/detail', {
					title: 'Places - Edit',
					site: CONFIG.site,
					user: req.user,
					path: req.url,
					form_action: '/places/update/'+req.params.id+'/',
					item: data,
					validation: '',
					error_msg: ''
				});
			}else{
				// 404 - place not found on DB
				next();
			}
		});
	});

	// Receive the edited place form data
	app.post('/places/edit/:id/', ensureAuthenticated, function(req, res, next){
		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'image',
			'description'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}

		if(req.body.location.coordinates){
			req.body.location.coordinates = JSON.parse(req.body.location.coordinates);
		}else{
			val_errors['location'] = 'Set a point or path.'
			has_errors = true;
		}

		// Show the place form again highlighting the errors
		if(has_errors){
			error_msg[0] = 'Please fill in all fields.';
			res.render('places/detail', {
				title: 'Places - Edit',
				site: CONFIG.site,
				user: req.user,
				path: req.url,
				form_action: '/places/update/'+req.params.id+'/',
				item: req.body,
				validation: val_errors,
				error_msg: error_msg
			});
		}else{
			// Find selected place
			models.places.findOne({
				_id: req.params.id
			}, function(err, place){
				if(place){

					// Modify values received from the form
					place.name = req.body.name;
					place.image = req.body.image;
					place.description = req.body.description;
					place.last_edit_by = req.user._id;
					place.edited = new Date();
					place.location.type = req.body.location.type;
					place.location.coordinates = req.body.location.coordinates;


					// Save the place
					place.save(function(err){
						if(err){
							if(err.code==11001){
								// 
								error_msg[0] = 'Duplicate entry.';
							}else{
								// In an unkown error
								error_msg[0] = 'Unknown error, try again later.';
								console.log(err);
							}
							res.render('places/detail', {
								title: 'Places - Edit',
								site: CONFIG.site,
								user: req.user,
								path: req.url,
								form_action: '/places/update/'+req.params.id+'/',
								item: req.body,
								validation: val_errors,
								error_msg: error_msg
							});
						} else {
							req.flash('success', '"'+place.name+'" has been updated.');
							res.redirect('/places/');
						}
					});

				}else{
					// 404 - place not found on DB
					console.log('???');
					next();
				}
			});
		}
	});

	// Delete places
	app.post('/places/delete/:id/', ensureAuthenticated, function(req, res){

		// First, check if the place exists
		models.places.findOne({
			_id: req.params.id
		}, function(err, place){
			// Place exists
			if(place){

				// place removal
				place.remove(function(err, deleted_place){
					if(err){
						res.redirect('/places/');
					}else{
						req.flash('success', 'User "'+deleted_place.name+'"" has been deleted.');
						res.redirect('/places/');
					}
				});

			}else{
				// 404 - place not found on DB
				next();
			}
		});

	});

	// Show the index page with pagination
	var places_list = function(req, res, next){
		var find = {};
		if(req.body.search){
			var look_for = new RegExp(req.body.search, 'i');
			find['$or'] = [ {'name': look_for}, {'description': look_for}];
		}
		var page = (req.params.page || 1)-1;
		var perPage = 10;
		models.places
			.find(find)
			.populate('author')
			.select('_id name author edited created')
			.sort({name: 'asc'})
			.limit(perPage)
			.skip(perPage * page)
			.exec(function(err, data){
				if(data.length<1){
					next();
				}else{
					models.places.find(find).count().exec(function(err, count){
						res.render('places/index', {
							title: 'Places',
							site: CONFIG.site,
							user: req.user,
							path: req.url,
							places: data,
							search: req.body.search,
							page: (page+1),
							pages: Math.ceil(count / perPage),
							messages: req.flash('success')
						});
					});
				}
		});
	}

	app.get('/places/:page(\\d+)?', ensureAuthenticated, places_list);
	app.post('/places/:page(\\d+)?', ensureAuthenticated, places_list);

	// Look for the closes place - test 5767
	// app.get('/xxx', ensureAuthenticated, function(req, res){	
	// 	models.places.geoNear({
	// 		type: "Point", 
	// 		coordinates: [-90.51773048428025, 14.59463146905357]
	// 	}, {
	// 		spherical: true, 
	// 		//maxDistance: 10000 / 6378137, 
	// 		distanceMultiplier: 1
	// 	}).then(function(doc){
	// 		res.json({
	// 			result: "ok",
	// 			doc: doc
	// 		});
	// 	});
	// });
}