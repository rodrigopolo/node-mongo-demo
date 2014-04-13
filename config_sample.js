config = {
	site:{
		name: 'Project'
	},
	express:{
		forkallcpus: false,
		port: 3000, // Can be overwritten in console by typing: PORT=1234 node app.js
		behind_proxy: false
	},
	mongo: {
		host: 'localhost',
		port: 27017,
		db: 'demo',
		options: {
			server: {
				auto_reconnect: true,
				poolSize: 10,
				socketOptions: {
					keepAlive: 1
				}
			},
			db: {
				numberOfRetries: 10,
				retryMiliSeconds: 1000
			}
		}
	},
	default_user: {
		name: 'User', 
		email: 'user@example.com', 
		password: 'pass',
		timezone: (new Date().getTimezoneOffset()/-60), // this takes the default server timezone
		role: 1
	},
	sessions: {
		secret: 'Some secret', // Create your own large unguessable string 
		collection: 'site_sessions'
	},
	cookies: {
		expire: 2592000000 // 30 days.
	}
}


// Mailer, for password recovery
// Check other transports: https://github.com/andris9/Nodemailer
var nodemailer = require("nodemailer");
config.mailer = {
	recovery: "Example.com <password@example.com>",
	transport: nodemailer.createTransport("SMTP",{
		service: "Gmail",
		auth: {
			user: "user@gmail.com",
			pass: "password"
		}
	})
}


module.exports = config;
