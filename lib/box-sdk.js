/*
 * box-sdk
 * https://github.com/adityamukho/node-box-sdk
 *
 * Copyright (c) 2014 Aditya Mukhopadhyay
 * Licensed under the MIT license.
 */

'use strict';

var base = require('base-framework'),
	_ = require('lodash'),
	Log = require('log'),
	Connection = require('./connector');

var Box = base.createChild().addInstanceMethods({
	init: function (opts) {
		var self = this;

		self.connections = {};
		if (opts) {
			if (!opts.client_id) {
				throw new Error('Must specify a client_id');
			}
			if (!opts.client_secret) {
				throw new Error('Must specify a client_secret');
			}
			if (!_.isNumber(opts.port)) {
				throw new Error('Must specify a numeric port');
			}

			self.host = opts.host || 'localhost';
			self.log = new Log(opts['log-level'] || 'info');
			self.port = opts.port;
			self.client_id = opts.client_id;
			self.client_secret = opts.client_secret;

			var router = require('router'),
				http = require('http'),
				request = require('request'),
				url = require('url');

			var route = router();
			route.get('/authorize', function (req, res) {
				var params = url.parse(req.url, true).query;
				if (params.state !== self.connections[params.id].csrf) {
					params.error = 'forged_request';
					params.error_description = "This looks like a CSRF attack. Someone may be trying to access your account illegaly.";
				}
				if (params.error) {
					var message = params.error_description || "Unknown error";
					self.log.error("Error authenticating user - Error Code: %s, Error Description: %s", params.error, message);
					var ecode;
					switch (params.error) {
					case 'access_denied':
					case 'forged_request':
						ecode = 401;
						break;
					case 'invalid_request':
					case 'unsupported_response_type':
						ecode = 400;
						break;
					case 'server_error':
						ecode = 500;
						break;
					}
					res.writeHead(ecode, message);
					res.end('Error ' + ecode + ': ' + message);
				} else {
					res.writeHead(200);
					res.end("Authorization code received.");

					var tokenParams = {
						client_id: self.client_id,
						client_secret: self.client_secret,
						grant_type: 'authorization_code',
						code: params.code
					},
						authUrl = 'https://www.box.com/api/oauth2/token';

					request.post({
						url: authUrl,
						form: tokenParams,
						json: true
					}, function (err, res, body) {
						if (err) {
							self.log.error("%j", err);
						}
						self.connections[params.id].setTokens(body);
					});
				}
			});

			self.server = http.createServer(route);
			self.server.listen(self.port, self.host, function () {
				self.log.info('Box SDK listening at http://%s:%d', self.host, self.port);
			});
		}
	},
	getConnection: function (email) {
		if (this.connections[email]) {
			return this.connections[email];
		}

		var connection = new Connection(this, email);
		this.connections[email] = connection;
		if (!_.isEmpty(connection.access_token)) {
			_.defer(function () {
				connection.emit('tokens.set');
			});
		}
		return connection;
	},
	authenticate: function () {
		return _.bind(function (access_token, refresh_token, profile, done) {
			var email = profile.login,
				connection = this.getConnection(email);
			connection.setTokens({
				access_token: access_token,
				refresh_token: refresh_token
			});
			return done(null, profile);
		}, this);
	},
	stopServer: function (callback) {
		if (this.server) {
			this.log.debug('Stopping server...');
			try {
				this.server.close(callback);
			} catch (err) {
				this.log.error(err);
			}
		}
	}
});

exports.Box = Box;

module.exports = function (config) {
	config = config || {};
	return exports;
};