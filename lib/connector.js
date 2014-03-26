'use strict';

var request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	querystring = require('querystring'),
	base = require('base-framework'),
	Monologue = require('monologue.js')(_);

var Connection = base.createChild()
	.addInstanceMethods({
		init: function (box, email) {
			this.email = email;
			this.csrf = Math.random().toString(36).slice(2);
			_.each(['host', 'port', 'log', 'client_id'], function (key) {
				this[key] = box[key];
			}, this);
			return this;
		},
		getAuthURL: function () {
			if (this.auth_url) {
				return this.auth_url;
			}
			var self = this,
				destination = {
					protocol: 'https',
					host: 'www.box.com',
					pathname: '/api/oauth2/authorize',
					search: querystring.stringify({
						response_type: 'code',
						client_id: self.client_id,
						state: self.csrf,
						redirect_uri: 'http://' + self.host + ':' + self.port + '/authorize?id=' + self.email
					})
				};

			self.auth_url = url.format(destination);
			return self.auth_url;
		},
		setTokens: function (tokens) {
			_.merge(this, tokens);
			this.emit('tokens.set', tokens);
		},
		listFolders: function (level, done) {
			this.request(['folders', level], 'get', done);
		},
		// request(segments, method, callback); OR
		// request(segments, method, query, callback); OR
		// request(segments, method, null, payload, callback); OR
		// request(segments, method, query, payload, callback);
		request: function (segments, method, query, payload, callback) {
			if (_.isFunction(query)) {
				callback = query;
				query = null;
				payload = null;
			} else if (_.isFunction(payload)) {
				callback = payload;
				payload = null;
			}
			var self = this,
				opts = {
					url: 'https://www.box.com/api/2.0/' + segments.join('/'),
					headers: {
						Authorization: 'Bearer ' + self.access_token
					},
					json: true,
					//TODO
					qs: query,
					form: payload
				};
			request[method].call(request, opts, function (err, res, body) {
				callback(err, body);
			});
		}
	});

Monologue.mixin(Connection);

module.exports = Connection;