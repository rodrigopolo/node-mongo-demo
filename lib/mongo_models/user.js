module.exports = function(mongoose, CONFIG) {

	var bcrypt = require('bcrypt');
	var SALT_WORK_FACTOR = 10;

	var collection = 'users';
	var Schema = mongoose.Schema;
	var schema = new Schema({
			name: {
					type: String,
					required: true
			},
			email: {
					type: String,
					required: true,
					unique: true
			},
			password: {
					type: String,
					required: true
			},
			timezone: Number,
			role: Number
	});

	schema.pre('save', function(next) {
		var user = this;
		if(!user.isModified('password')){
			return next();
		}
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if(err){
				return next(err);
			}
			bcrypt.hash(user.password, salt, function(err, hash) {
				if(err){
					return next(err);
				}
				user.password = hash;
				next();
			});
		});
	});

	// Password verification
	schema.methods.comparePassword = function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
			if(err){
				return cb(err);
			}
			cb(null, isMatch);
		});
	};

	

	// collection instance
	var coll = mongoose.model(collection, schema);

	// creation of the default main user
	coll.count({},function(err,c){
		if(err){
			console.log(err);
		}else{
			if(c < 1){
				var usr = new coll(CONFIG.default_user);
				usr.save(function(err) {
					if(err) {
						console.log(err);
					} else {
						console.log('Default user created.');
					}
				});
			}
		}
	});

	return coll;
};


