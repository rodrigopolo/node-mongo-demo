module.exports = function(CONFIG, passport){

	var express = require('express');
	var flash = require('connect-flash');
	var MongoStore = require('connect-mongo')(express);

	var app = express();

	// configure Express
	app.configure(function(){
		app.set('views', __dirname + '/../views');
		app.set('view engine', 'ejs');
		app.engine('ejs', require('ejs-locals'));
		app.use(express.logger('dev'));
		app.use(express.cookieParser());
		app.use(express.json());
		app.use(express.urlencoded());
		app.use(express.methodOverride());

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
		// persistent login sessions (recommended).
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(app.router);
		app.use(express.static(__dirname + '/../public'));
	});

	return app;
}