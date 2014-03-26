var config = require('./config'),
	router = require('router'),
	http = require('http'),
	request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	querystring = require('querystring'),
	ejs = require('ejs'),
	fs = require('fs');

var config, log, eventEmitter,
	route = router(),
	connectors = {};

function registerConnection(Connection) {
	connectors[Connection.email] = Connection;
}

function Connection(conf) {
	config = conf,
	log = config.log,
	eventEmitter = config.eventEmitter;

	var base = require('base-framework');

	var Connection = base.createChild()
		.addInstanceMethods({
			init: function (email) {
				this.email = email;
				this.csrf = Math.random().toString(36).slice(2);
				registerConnection(this);
				return this;
			},
			connect: function (done) {
				var destination = {
					protocol: 'http',
					hostname: 'localhost',
					port: config.get('icarus').port,
					pathname: '/login',
					search: querystring.stringify({
						id: this.email,
					})
				}
				require('open')(url.format(destination));
				if (typeof done === 'function') {
					eventEmitter.once(self.email + 'tokensReceived', function () {
						done();
					});
				}
			},
			_tokens: function (response) {
				var self = this;
				_.forIn(response, function (value, key) {
					self[key] = value;
				});
				var authTokens = config.get('authTokens') || {};
				authTokens[self.email] = response;
				config.set('authTokens', authTokens);
				eventEmitter.emit(self.email + 'tokensReceived');
			},
			listFolders: function (level, done) {
				var self = this;
				request.get({
					url: 'https://www.box.com/api/2.0/folders/' + level,
					headers: {
						Authorization: 'Bearer ' + self.access_token
					},
					json: true
				}, function (err, res, body) {
					if (err) {
						log.error("%j", err);
						done(null);
					}
					done(body);
				});
			}
		});

	return Connection;
}

module.exports = Connection;