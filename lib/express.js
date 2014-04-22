module.exports = function(CONFIG, passport){

	var express = require('express');
	var flash = require('connect-flash');

	// MongoDB session store
	var MongoStore = require('connect-mongo')(express);

	var app = express();


	if(CONFIG.express.behind_proxy){
		app.enable('trust proxy');
	}

	app.set('views', __dirname + '/../views');
	app.set('view engine', 'ejs');
	app.engine('ejs', require('ejs-locals'));

	if(CONFIG.env == 'development'){
		app.use(express.logger('dev'));
	}else{
		app.use(express.logger());
	}


	app.use(express.cookieParser());
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());

	// MongoDB session store
	app.use(express.session({
		secret: CONFIG.sessions.secret,
		store: new MongoStore({
			db: CONFIG.mongo.db,
			collection: CONFIG.sessions.collection,
			host: CONFIG.mongo.host,
			port: CONFIG.mongo.port,
			auto_reconnect: true
		})
	}));

	// connect-flash for messages
	app.use(flash());

	// Remember Me middleware
	app.use( function (req, res, next){
		if ( req.method == 'POST' && req.url == '/signin' ){
			if ( req.body.rememberme ){
				req.session.cookie.maxAge = CONFIG.cookies.expire;
			} else {
				req.session.cookie.expires = false;
			}
		}
		next();
	});
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions.
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.static(CONFIG.express.public_dir));


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

	// Log errors on console
	app.use(function(err, req, res, next){
		console.error(err.stack);
		next(err);
	});

	// XHR error response
	app.use(function(err, req, res, next){
		if (req.xhr) {
			res.send(500, { error: '500 - Internal Server Error' });
		} else {
			next(err);
		}
	});

	// HTML error response
	app.use(function(err, req, res, next){
		res.render('public/500', {
			title: '500 - Internal Server Error',
			site: CONFIG.site,
			user: req.user,
			path: req.url
		});
	});

	

	

	

	return app;
}