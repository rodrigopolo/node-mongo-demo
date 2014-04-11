config = {
	site:{
		name: 'Project'
	},
	express:{
		forkallcpus: false
	},
	mongo: {
		host: 'localhost',
		port: 27017,
		db: 'flexo',
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
		secret: 'a4f8071f-c873-4447-8ee2',
		collection: 'site_sessions'
	},
	cookies: {
		expire: 2592000000 // 30 days.
	}
}

module.exports = config;

