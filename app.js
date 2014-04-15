// Config file
var CONFIG = require('./config');

// Dev or production
CONFIG.env = process.env.NODE_ENV || 'development';

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
require('./routes/public')(CONFIG, app);

// Passport routes
require('./routes/passport')(CONFIG, app, models, passport);

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
  console.log('Express server listening on port: "' + server.address().port+'".');
});

