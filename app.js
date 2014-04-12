// Config file
var CONFIG = require('./config');

// Include the cluster module
var cluster = require('cluster');

/*cluster.on('exit', function (worker) {
	// Replace the dead worker
	console.log('Worker ' + worker.id + ' died, respawn.');
	cluster.fork();
});*/

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
	function ensureAuthenticated(req, res, next){
		if (req.isAuthenticated()){
			return next();
		}
		res.redirect('/signin')
	}

	/**
	 * Express routes
	 **/

	// Public routes
	require('./routes/public')(CONFIG, app, cluster);

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

	// Server port
	app.set('port', process.env.PORT || CONFIG.express.port);

	// Start server
	var server = app.listen(app.get('port'), function() {
	  console.log('Express server listening on port: "' + server.address().port+'" and running on worker: "'+cluster.worker.id+'".');
	});

}