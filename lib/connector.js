'use strict';

var request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	querystring = require('querystring'),
	base = require('base-framework'),
	fs = require('fs'),
	path = require('path'),
	Monologue = require('monologue.js')(_);

/**
 * @class Connection
 * @classdesc The Connection object: One instance for each email id. Has {@link external:Monologue|Monologue} methods mixed in.
 * @param {Box} box - The {@link Box} object though which this connection is managed.
 * @param {string} email - The email account identifier to connect to.
 */
var Connection = base.createChild().addInstanceMethods(
	/** @lends Connection.prototype */
	{
		init: function (box, email) {
			this.email = email;
			this.csrf = Math.random().toString(36).slice(2);
			_.each(['host', 'port', 'log', 'client_id'], function (key) {
				this[key] = box[key];
			}, this);
			return this;
		},

		/**
		 * The returned URL should be provided to the user when running in standalone mode.
		 * @summary Get the authentication URL to manually navigate to.
		 */
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

		/**
		 * Authentication token object for a connection.
		 * @typedef {Object} AuthTokens
		 * @property {string} access_token - The Access Token.
		 * @property {string} refresh_token - The Refresh Token.
		 * @property {number} [expires_in] - Optional lifetime value of access token in seconds.
		 * @property {Array} [restricted_to] - Optional (possibly) list of IP from which to grant access.
		 * @property {string} [token_type] - Optional. Value should normally be 'bearer'.
		 */

		/**
		 * Normally there is no need to call this function directly.
		 * @summary Set the authentication tokens for this connection.
		 * @protected
		 * @param {AuthTokens} tokens - The authentication tokens.
		 * @fires Connection#"tokens.set"
		 */
		setTokens: function (tokens) {
			_.merge(this, tokens);
			/**
			 * Fires when access tokens have been set on this connection. Could be triggered more than once,
			 * so listeners must deregister after receiving the first event.
			 * Preferably use the {@link Connection#ready} method.
			 * @event Connection#"tokens.set"
			 * @type {AuthTokens}
			 * @see {@link Connection#ready}
			 */
			this.emit('tokens.set', tokens);
		},

		/**
		 * Headers to pass alongwith a request on a connection.
		 * @typedef {Object} RequestHeaders
		 * @property {string} [If-Match] - If-Match ETAG.
		 * @property {string} [If-None-Match] - If-None-Match ETAG.
		 * @property {string} [Retry-After] - Retry time in seconds.
		 * @see {@link https://developers.box.com/docs/#if-match}
		 */

		/**
		 * An IncomingMessage object.
		 * @external IncomingMessage
		 * @see {@link http://nodejs.org/api/http.html#http_http_incomingmessage}
		 */

		/**
		 * Called after a request is performed on a connection.
		 * @callback requestCallback
		 * @param {Error} [error] - Any error that occurred while attempting to stop the server.
		 * @param {external:IncomingMessage} response - The response metadata.
		 * @param {*} body - The response body.
		 */

		/**
		 * Normally there is no need to call this function directly.
		 * Use one of the wrapper API methods instead.
		 * @summary Perform an HTTP request on this connection.
		 * @protected
		 * @param {Array} segments - The path segments to append to the API base URL.
		 * @param {string} method - The HTTP verb to use for this request.
		 * @param {requestCallback} callback - The callback to invoke (with possible errors) when the request returns.
		 * @param {Object} [query] - A map of query parameters. Can be null.
		 * @param {Object} [payload] - The request payload. Can be null.
		 * @param {*} [data] - Readable stream(s) representing file data to be uploaded. Can be null.
		 * @param {RequestHeaders} [headers] - Additional headers.
		 */
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

		/**
		 * Wait for a connection to get ready.
		 * @param {function} callback - The callback to invoke once ready.
		 */
		ready: function (callback) {
			if (this.access_token) {
				callback();
			} else {
				this.once('tokens.set', callback);
			}
		}
	});

//Load API Methods
(function loadAPI(mainpath) {
	var items = fs.readdirSync(mainpath);
	_.each(items, function (item) {
		var subpath = path.join(mainpath, item);
		var stats = fs.statSync(subpath);
		if (stats.isDirectory()) {
			loadAPI(subpath);
		} else if (stats.isFile() && item.match(/.*\.js$/)) {
			require(subpath)(Connection);
		}
	});
})(path.join(__dirname, 'api'));

/**
 * All {@link https://github.com/postaljs/monologue.js|Monologue} methods are mixed into the
 * {@link Connection} object.
 * @external Monologue
 * @see {@link https://github.com/postaljs/monologue.js}
 */
Monologue.mixin(Connection);

module.exports = Connection;