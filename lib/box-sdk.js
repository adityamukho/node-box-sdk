/*
 * box-sdk
 * https://github.com/adityamukho/node-box-sdk
 *
 * Copyright (c) 2014 Aditya Mukhopadhyay
 * Licensed under the MIT license.
 */

'use strict';

var base = require('base-framework'),
	router = require('router'),
	http = require('http'),
	request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	Log = require('log'),
	Connection = require('./connector');

var log,
	Box = base.createChild()
		.addInstanceMethods({
			init: function (client_id, client_secret, port, host, customLog) {
				if (!client_id) {
					throw new Error('Must specify a client_id');
				}
				if (!client_secret) {
					throw new Error('Must specify a client_secret');
				}
				if (!_.isNumber(port)) {
					throw new Error('Must specify a numeric port');
				}

				this.host = host || 'localhost';
				this.log = customLog || log;
				this.port = port;
				this.client_id = client_id;
				this.client_secret = client_secret;
				this.connections = {};

				var route = router(),
					self = this;
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
							client_id: client_id,
							client_secret: client_secret,
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

				var server = http.createServer(route);
				server.listen(self.port, self.host, function () {
					self.log.info('Box SDK listening at http://%s:%d', self.host, self.port);
				});
			},
			getConnection: function (email) {
				if (this.connections[email]) {
					return this.connections[email];
				}

				var connection = new Connection(this, email);
				this.connections[email] = connection;
				_.defer(function () {
					if (!_.isEmpty(connection.access_token)) {
						connection.emit('tokens.set');
					}
				});
				return connection;
			}
		});

exports.Box = Box;

module.exports = function (config) {
	config = config || {};
	log = new Log(config['log-level'] || 'info');
	return exports;
};