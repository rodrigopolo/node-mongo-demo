var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');

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
	app.post('/places/create', ensureAuthenticated, fileUploads, function(req, res, next){


		var img = null;
		if(req.body.files.image){
			img = req.body.files.image;
			if(img.type!='image/png' && img.type!='image/jpeg'){
				fs.unlinkSync(img.path);
				img = null;
			}
		}


		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'description'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}
		


		if(req.body.coordinates){
			req.body.coordinates = JSON.parse(req.body.coordinates);
		}else{
			val_errors['location'] = 'Set a point or path.'
			has_errors = true;
		}

		if(!img){
			val_errors['image'] = 'Set a point or path.'
			has_errors = true;
		}

		// Show the user form again highlighting the errors
		if(has_errors){
			fs.unlinkSync(img.path);
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
				imgext: img.ext,
				description: req.body.description,
				location: {
					type: req.body.type,
					coordinates: req.body.coordinates
				},
				author: req.user._id,
				created: now,
				last_edit_by: req.user._id,
				edited: now
			});

			place.save(function(err,new_place){
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
				
					// Move the file to the public folder and set the name as the ID
					moveFile(img.path, CONFIG.express.public_dir+'/img/places/'+new_place._id+img.ext,function(err){
						if(err){
							console.log(err);
						}
						req.flash('success', 'Place has been created.');
						res.redirect('/places/');
					});


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
				data.type = data.location.type;
				data.coordinates = data.location.coordinates;
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
	app.post('/places/edit/:id/', ensureAuthenticated, fileUploads, function(req, res, next){


		var img = null;
		if(req.body.files.image){
			img = req.body.files.image;
			if(img.type!='image/png' && img.type!='image/jpeg'){
				fs.unlinkSync(img.path);
				img = null;
			}
		}


		// Check for errors on POST data
		var val_errors={};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'description'
		]
		for(k in check){
			if(!(req.body[check[k]])){
				val_errors[check[k]]=true;
				has_errors = true;
			}
		}

		if(req.body.coordinates){
			req.body.coordinates = JSON.parse(req.body.coordinates);
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

					if(img){
						// Move the file to the public folder and set the name as the ID
						moveFile(img.path, CONFIG.express.public_dir+'/img/places/'+place._id+img.ext,function(err){
							if(err){
								console.log(err);
							}
						});
						place.imgext = img.ext;
					}
					
					// Modify values received from the form
					place.name = req.body.name;
					place.description = req.body.description;
					place.last_edit_by = req.user._id;
					place.edited = new Date();
					place.location.type = req.body.type,
					place.location.coordinates = req.body.coordinates


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
						fs.unlinkSync(CONFIG.express.public_dir+'/img/places/'+deleted_place._id+deleted_place.imgext);
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

	function fileUploads(req, res, next){
		var form = new multiparty.Form({ 
			autoFiles: true,
			uploadDir: __dirname + '/../tmp'
			//,maxFilesSize: 5242880
		});
		form.parse(req, function(err, fields, files){
			// if(err){
			// 	res.writeHead(200, {'content-type': 'text/plain'});
			// 	res.end("invalid request: " + err.message);
			// 	return;
			// }
			var form_files = {};
			for(k in files){
				for(m in files[k]){
					if(files[k][m].size<1){
						fs.unlinkSync(files[k][m].path);
					}else{
						form_files[k] = {
							name: files[k][m].originalFilename,
							type: files[k][m].headers['content-type'],
							path: files[k][m].path,
							size: files[k][m].size,
							ext: files[k][m].originalFilename.substr(files[k][m].originalFilename.lastIndexOf('.'))
						};
					}
				}
			}
			for(k in fields){
				fields[k] = fields[k][0]
			}
						req.body = fields;
			req.body.files = form_files;
			next();
		});
	}

	function moveFile(source, target, callback) {
		//console.log('De: '+source+"\n A: "+target);
		fs.rename(source, target, function (err) {
			if (!err){
				callback();
			} else {
				var is = fs.createReadStream(source);
				var os = fs.createWriteStream(target);
				is.on('end', function (err) {
					if (!err) {
						fs.unlink(source, callback);
					} else {
						callback(err);
					}
				});
				is.pipe(os);
			}
		});
	};

}