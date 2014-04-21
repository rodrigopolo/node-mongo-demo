module.exports = function(mongoose, CONFIG){

	// mongoose models
	var models = {};

	// User model
	models.users = require(__dirname+'/mongo_models/users')(mongoose, CONFIG);
	models.places = require(__dirname+'/mongo_models/places')(mongoose, CONFIG);

	return models;

}
