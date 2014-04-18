'use strict';

var request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	querystring = require('querystring'),
	base = require('base-framework'),
	fs = require('fs'),
	path = require('path'),
	Monologue = require('monologue.js')(_);

var Connection = base.createChild().addInstanceMethods({
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
	request: function (segments, method, callback, query, payload, data, headers) {
		var self = this,
			opts = {
				url: 'https://www.box.com/api/2.0/' + segments.join('/'),
				headers: {
					Authorization: 'Bearer ' + self.access_token
				},
				json: (_.contains(['post', 'put'], method)) ? payload : true,
				qs: query,
			};

		headers = headers || {};
		_.merge(opts.headers, headers);

		request[method].call(request, opts, function (err, res, body) {
			callback(err, body);
		});
	},
	ready: function (callback) {
		if (this.access_token) {
			callback();
		} else {
			this.once('tokens.set', callback);
		}
	}
});

//Load API Methods
(function loadAPI(fullpath) {
	var items = fs.readdirSync(fullpath);
	_.each(items, function (item) {
		var subpath = path.join(fullpath, item);
		var stats = fs.statSync(subpath);
		if (stats.isDirectory()) {
			loadAPI(subpath);
		} else if (stats.isFile() && item.match(/.*\.js$/)) {
			require(subpath)(Connection);
		}
	});
})(path.join(__dirname, 'api'));

Monologue.mixin(Connection);

module.exports = Connection;