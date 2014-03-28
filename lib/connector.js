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

//API Methods
Connection.addInstanceMethods({
	getFolderInfo: function (id, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		this.request(['folders', id], 'get', done, null, null, null, headers);
	},
	getFolderItems: function (id, opts, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		this.request(['folders', id, 'items'], 'get', done, _.pick(opts, 'limit', 'offset'), null, null, headers);
	},
	createFolder: function (name, parent_id, done, headers) {
		if (!_.isString(name) || !_.isNumber(parent_id)) {
			return done(new Error('Invalid params. Required - name: string, parent_id: number'));
		}
		this.request(['folders'], 'post', done, null, {
			name: name,
			parent: {
				id: parent_id.toString()
			}
		}, null, headers);
	},
	updateFolder: function (id, fields, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		if (!_.isObject(fields)) {
			return done(new Error('An fields object must be provided.'));
		}
		this.request(['folders', id], 'put', done, null, fields, null, headers);
	},
	deleteFolder: function (id, opts, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		this.request(['folders', id], 'delete', done, _.pick(opts, 'recursive'), null, null, headers);
	},
	copyFolder: function (id, parent_id, opts, done, headers) {
		if (!_.isNumber(id) || !_.isNumber(parent_id)) {
			return done(new Error('Invalid params. Required - id: number, parent_id: number'));
		}
		this.request(['folders', id, 'copy'], 'post', done, null, _.merge({
			parent: {
				id: parent_id.toString()
			}
		}, opts), null, headers);
	},
	folderSharedLink: function (id, opts, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		this.request(['folders', id], 'put', done, null, {
			shared_link: opts
		}, null, headers);
	},
	getFolderCollaborations: function (id, done, headers) {
		if (!_.isNumber(id)) {
			return done(new Error('id must be specified.'));
		}
		this.request(['folders', id, 'collaborations'], 'get', done, null, null, null, headers);
	}
});

Monologue.mixin(Connection);

module.exports = Connection;