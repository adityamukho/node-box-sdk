'use strict';

var request = require('request'),
	url = require('url'),
	_ = require('lodash'),
	querystring = require('querystring'),
	base = require('base-framework'),
	fs = require('fs'),
	path = require('path'),
	Monologue = require('monologue.js')(_),
	FormData = require('form-data');

/**
 * @class Connection
 * @classdesc The Connection object: One instance for each email id. Has {@link external:Monologue|Monologue} methods mixed in.
 * @param {Box} box - The Box object though which this connection is managed.
 * @param {string} email - The email account identifier to connect to.
 */
var Connection = base.createChild().addInstanceMethods(
	/** @lends Connection.prototype */
	{
		init: function (box, email) {
			this.email = email;
			this.csrf = Math.random().toString(36).slice(2);
			_.each(['host', 'port', 'log', 'client_id', 'client_secret'], function (key) {
				this[key] = box[key];
			}, this);
			return this;
		},

		/**
		 * The returned URL should be provided to the end user when running in standalone mode.
		 * @summary Get the authentication URL to manually navigate to.
		 * @returns {string} The authentication URL.
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
		 * Do not call this method directly.
		 * @summary Set the authentication tokens for this connection.
		 * @private
		 * @param {AuthTokens} tokens - The authentication tokens.
		 * @fires Connection#"tokens.set"
		 */
		_setTokens: function (tokens) {
			_.merge(this, tokens);
			/**
			 * Fires when access tokens have been set on this connection. Could be triggered more than once,
			 * so listeners must deregister after receiving the first event.
			 * Preferably use the {@link Connection#ready} method.
			 * @event Connection#"tokens.set"
			 * @type {AuthTokens}
			 * @see {@link Connection#ready}
			 */
			this.emit('tokens.set');
		},

		/**
		 * Do not  call this function directly.
		 * @summary Set the authentication tokens for this connection.
		 * @private
		 */
		_revokeAccess: function () {
			delete this.access_token;
		},

		/**
		 * Standard {@linkcode fields/limit/offset} options, used in several connection methods.
		 * @external OptsFLO
		 * @see {@link https://developers.box.com/docs/#folders-retrieve-a-folders-items}
		 */

		/**
		 * Headers to pass alongwith a request on a connection.
		 * @typedef {Object} RequestHeaders
		 * @property {string} [If-Match] - If-Match ETAG.
		 * @property {string} [If-None-Match] - If-None-Match ETAG.
		 * @property {string} [Retry-After] - Retry time in seconds.
		 * @see {@link https://developers.box.com/docs/#if-match}
		 */

		/**
		 * A Readable Stream.
		 * @external Readable
		 * @see {@link http://nodejs.org/api/stream.html#stream_class_stream_readable}
		 */

		/**
		 * A Writable Stream.
		 * @external Writable
		 * @see {@link http://nodejs.org/api/stream.html#stream_class_stream_writable}
		 */

		/**
		 * Called after a request is performed on a connection.
		 * @callback requestCallback
		 * @param {Error} [error] - Any error that occurred.
		 * @param {Object} body - The response body.
		 */

		/**
		 * Do not call this method directly.
		 * Use one of the wrapper API methods instead.
		 * @summary Perform an HTTP request on this connection.
		 * @private
		 * @param {(string | Array.<string>)} segments - The path segments to append to the API base URL.
		 * @param {string} method - The HTTP verb to use for this request.
		 * @param {requestCallback} callback - The callback to invoke (with possible errors) when the request returns.
		 * @param {?Object} [query] - A map of query parameters.
		 * @param {?Object} [payload] - The request payload.
		 * @param {?external:Readable} [data] - Readable stream representing file data to be uploaded.
		 * @param {?RequestHeaders} [headers] - Additional headers.
		 * @param {external:Writable} [pipe] - Writable stream representing file data to be saved.
		 */
		_request: function (segments, method, callback, query, payload, data, headers, pipe) {
			var methods = ['POST', 'GET', 'DELETE', 'PUT', 'OPTIONS'];
			if (!_.contains(methods, method)) {
				throw new Error('Unsupported method: ' + method);
			}

			var self = this,
				url;

			if (_.isString(segments)) {
				url = segments;
			} else if (data) {
				url = 'https://upload.box.com/api/2.0/' + segments.join('/');
			} else {
				url = 'https://www.box.com/api/2.0/' + segments.join('/');
			}

			var opts = {
				url: url,
				method: method,
				headers: {
					Authorization: 'Bearer ' + self.access_token
				}
			};

			if (data) {
				opts.json = true;
			} else {
				_.merge(opts, {
					json: (_.contains(['POST', 'PUT'], method)) ? payload : true,
					qs: query
				});
			}

			headers = headers || {};
			_.merge(opts.headers, headers);

			if (data) {
				var form = new FormData();

				form.append('filename', data);
				_.forIn(payload, function (value, key) {
					form.append(key, value);
				});

				form.getLength(function (err, length) {
					if (err) {
						return callback(err);
					}

					var r = request(opts, _handler);
					r._form = form;
					r.setHeader('content-length', length);
				});
			} else {
				if (pipe && method === 'GET') {
					opts.followRedirect = false;
				}
				request(opts, _handler);
			}

			function _handler(err, res, body) {
				if (err) {
					self.log.error(err);
					self.log.debug(res);
					self.log.debug(body);
				}

				switch (res.statusCode) {
				case 202:
				case 429:
					self.log.debug('Retry-After: %d', res.headers['retry-after']);
					_.delay(function () {
						self._request(segments, method, callback, query, payload, data, headers, pipe);
					}, res.headers['retry-after'] * 1000);
					break;

				case 401:
					self.log.info('Access token expired. Refreshing...');
					self._revokeAccess();
					var tokenParams = {
						client_id: self.client_id,
						client_secret: self.client_secret,
						grant_type: 'refresh_token',
						refresh_token: self.refresh_token
					},
						authUrl = 'https://www.box.com/api/oauth2/token';

					request.post({
						url: authUrl,
						form: tokenParams,
						json: true
					}, function (err, res, body) {
						if (err) {
							return callback(err);
						}
						if (res.statusCode === 200) {
							self.log.info('New tokens received.');
							self._setTokens(body);
							self._request(segments, method, callback, query, payload, data, headers, pipe);
						} else {
							callback(new Error(JSON.stringify(body)));
						}
					});
					break;

				case 302:
					request.get(res.headers.location, callback).pipe(pipe);
					break;

				case 301:
					opts.url = res.headers.location;
					request(opts, _handler);
					break;

				case 400:
				case 403:
				case 404:
				case 405:
				case 409:
				case 412:
					callback(new Error(JSON.stringify(body)));
					break;

				default:
					callback(err, body);
				}
			}
		},

		/**
		 * Wait for a connection to get ready.
		 * @param {optionalErrorCallback} callback - The callback with an optional err argument, to be invoked once ready.
		 */
		ready: function (callback) {
			if (this.access_token) {
				callback();
			} else {
				this.once('tokens.*', callback);
			}
		},

		/**
		 * Determine id the connection has been authenticated.
		 * @returns {boolean} True if authenticated.
		 */
		isAuthenticated: function () {
			return !_.isEmpty(this.access_token);
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