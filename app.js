#!/usr/bin/env node

// Config file
var CONFIG = require('./config');

if(CONFIG.google_maps_key==''){
	console.log('ERROR: You have to fill your Google Maps API Key in the config.js file...\nF*king Google now requires an API Key even for demos.\nGo to the following web address:\n\nhttps://developers.google.com/maps/documentation/javascript/get-api-key\n\nAfter adding the key you can run the app.\n\n');
	process.exit(1)
}

// Dev or production
CONFIG.env = process.env.NODE_ENV || 'development';

// Mongoose instance
var mongoose = require('./lib/mongoose')(CONFIG);

// Mongoose models
var models = require('./lib/models')(mongoose, CONFIG);

// Authentication
var passport = require('./lib/passport')(models);

// Express web server
var app = require('./lib/express')(CONFIG, passport, mongoose);

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

// Places
require('./routes/places')(CONFIG, app, ensureAuthenticated, mongoose, models);


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

