module.exports = function(CONFIG, app){

	// Home
	app.get('/', function(req, res){
		res.render('public/index', {
			title: 'Home',
			site: CONFIG.site,
			user: req.user,
			path: req.url
		});
	});

	// About
	app.get('/about', function(req, res){
		res.render('public/about', {
			title: 'About',
			site: CONFIG.site,
			user: req.user,
			path: req.url
		});
	});
}