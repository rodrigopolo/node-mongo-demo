module.exports = function(mongoose, CONFIG){



	// mongoose models
	var models = {};

	// User model
	models.users = require(__dirname+'/mongo_models/user')(mongoose, CONFIG);

	return models;
}
