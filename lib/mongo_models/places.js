module.exports = function(mongoose) {
	var collection = 'places';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		name: { 
			type: String, 
			index: true
		},
		imgext: String,
		description: String,
		location: {
			'type': {
					type: String,
					required: true,
					enum: ['Point', 'LineString', 'Polygon'],
					default: 'Point'
				},
			coordinates: []
		},
		author: {
			type: ObjectId,
			ref: 'users'
		},
		last_edit_by: {
			type: ObjectId,
			ref: 'users'
		},
		created: {type: Date, default: Date.now},
		edited: {type: Date, default: Date.now}
	});

	schema.index({location: '2dsphere'});

	// schema.pre('save', function (next) {
	// 	if (this.isNew && Array.isArray(this.location) && 0 === this.location.length) {
	// 		this.location = undefined;
	// 	}
	// 	next();
	// });

	return mongoose.model(collection, schema);
};

