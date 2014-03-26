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
	url = require('url');

var Box = base.createChild()
	.addInstanceMethods({
		init: function (host, port, client_id, client_secret) {
			this.connections = {};
			this.host = host;
			this.port = port;
			this.client_id = client_id;
			this.client_secret = client_secret;

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
					console.error("Error authenticating user - Error Code: %s, Error Description: %s", params.error,
						message);
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
							console.error("%j", err);
						}
						self.connections[params.id]._tokens(body);
					});
				}
			});

			var server = http.createServer(route);
			server.listen(port, host, function () {
				console.log('Box SDK listening at http://%s:%d', host, port);
			});
		},
		getConnection: function (email) {
			if (this.connections[email]) {
				return this.connections[email];
			}

			var connection = require('./connector')(email); //TODO
			this.connections[email] = connection;
			return connection;
		}
	});

exports.createBoxInstance = function () {
	var box = Object.create(Box.prototype);
	Box.apply(box, Array.prototype.slice.call(arguments, 0));
	return box;
};