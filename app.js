// Config file
var CONFIG = require('./config');

// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

	if(CONFIG.express.forkallcpus){
	    // Count the machine's CPUs
	    var cpuCount = require('os').cpus().length;

	    // Create a worker for each CPU
	    for (var i = 0; i < cpuCount; i += 1) {
	        cluster.fork();
	    }
	}else{
		 cluster.fork();
	}


// Code to run if we're in a worker process
}else{


	// Mongoose instance
	var mongoose = require('./lib/mongoose')(CONFIG);

	// Mongoose models
	var models = require('./lib/models')(mongoose, CONFIG);

	// Authentication
	var passport = require('./lib/passport')(models);

	// Express web server
	var app = require('./lib/express')(CONFIG, passport);

	// Custom Express app locals
	require('./lib/app_locals')(app);

	// Simple route middleware to ensure user is authenticated.
	//   Use this route middleware on any resource that needs to be protected.  If
	//   the request is authenticated (typically via a persistent login session),
	//   the request will proceed.  Otherwise, the user will be redirected to the
	//   login page.
	function ensureAuthenticated(req, res, next){
		if (req.isAuthenticated()){
			return next();
		}
		res.redirect('/signin')
	}

	// Express routes

	// Public routes
	require('./routes/public')(CONFIG, app);

	// Passport routes
	require('./routes/passport')(CONFIG, app, passport);

	// User routes
	require('./routes/users')(CONFIG, app, ensureAuthenticated, models);


	// Redirect all trailing slashes gloablly in express 
	app.use(function(req, res, next) {
	    if (req.path.substr(-1) != '/' && req.path.length > 1) {
	        var query = req.url.slice(req.path.length);
	        res.redirect(301, req.path + '/' + query);
	    } else {
	        next();
	    }
	});

	// 404 error pages
	app.use(function(req, res, next){
		res.status(404);
		if (req.accepts('html')){
			res.render('public/404', {
				title: '404 - Not found',
				site: CONFIG.site,
				user: req.user,
				path: req.url
			});
			return;
		}
		if (req.accepts('json')){
			res.send({error: '404 - Not found'});
			return;
		}
		res.type('txt').send('404 - Not found');
	});

	// 500 error pages (temporary commented)
/*	app.use(function(err, req, res, next){
		res.status(err.status || 500);

		if (req.accepts('html')){
			res.render('public/500', {
				title: '500 - Server Error',
				site: CONFIG.site,
				user: req.user,
				path: req.url
			});
			return;
		}
		if (req.accepts('json')){
			res.send({error: '500 - Server Error'});
			return;
		}
		res.type('txt').send('500 - Server Error');

		// Check error on console.
		console.log(err);
	});*/


	// Start node server
	app.listen(3000, function(){
		console.log('Express server listening on port 3000');
	});

}