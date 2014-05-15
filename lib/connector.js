'use strict';

var request = require('request'),
  url = require('url'),
  _ = require('lodash'),
  querystring = require('querystring'),
  base = require('base-framework'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  Monologue = require('monologue.js')(_),
  FormData = require('form-data');

/**
 * @class Connection
 * @classdesc The Connection object: One instance for each email id. Has {@link external:Monologue|Monologue}
 * methods mixed in.
 * @param {Box} box - The Box object though which this connection is managed.
 * @param {string} email - The email account identifier to connect to.
 */
var Connection = base.createChild().addInstanceMethods(
  /** @lends Connection.prototype */
  {
    init: function (box, email) {
      this.email = email;
      this.csrf = Math.random().toString(36).slice(2);
      this.concurrency = 7;

      _.each(['host', 'port', 'log', 'client_id', 'client_secret'], function (key) {
        this[key] = box[key];
      }, this);

      this.queue = async.queue(function (task, cb) {
        var r = request(task.opts, function (err, res, body) {
          task.handler(err, res, body);
          cb();
        });
        if (task.form) {
          r._form = task.form;
        }
        if (task['content-length']) {
          r.setHeader('content-length', task['content-length']);
        }
      }, this.concurrency);

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
     * @see {@link https://developers.box.com/docs/#if-match}
     */

    /**
     * Options to configure the behaviour of the request itself.
     * @typedef {Object} RequestConfig
     * @property {number} [timeout] - The response timeout in milliseconds. Defaults to {@linkcode 120000}.
     * @property {number} [num_retries] - The number of retries to attempt before giving up. {@linkcode 0}
     * implies no retries. A negative number implies unlimited retries.
     * @property {number} [ebackoff] - Initial backoff interval in milliseconds. The request dispatcher will
     * wait for this interval before attempting a retry. The interval is doubled on each successive retry.
     * Defaults to {@linkcode 1000}.
     */

    /**
     * A Readable Stream.
     * @external Readable
     * @see {@link http://nodejs.org/api/stream.html#stream_class_stream_readable}
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
     * @param {?RequestConfig} [config] - Configure the request behaviour.
     */
    _request: function (segments, method, callback, query, payload, data, headers, pipe, config) {
      //Self-invocation with the same params should work transparently for the caller.
      var methods = ['POST', 'GET', 'DELETE', 'PUT', 'OPTIONS'];
      if (!_.contains(methods, method)) {
        throw new Error('Unsupported method: ' + method);
      }

      var self = this,
        url;

      config = _.merge({
        timeout: 120000,
        num_retries: 3,
        ebackoff: 1000
      }, config || {});

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
        },
        timeout: config.timeout
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

          // var r = request(opts, _handler);
          // r._form = form;
          // r.setHeader('content-length', length);
          self.queue.push({
            opts: opts,
            handler: _handler,
            form: form,
            'content-length': length
          });
        });
      } else {
        if (pipe && method === 'GET') {
          opts.followRedirect = false;
        }
        // request(opts, _handler);
        self.queue.push({
          opts: opts,
          handler: _handler
        });
      }

      function _handler(err, res, body) {
        if (err) {
          if (config.num_retries === 0) {
            return callback(err);
          }

          var ebck = config.ebackoff;

          config.num_retries--;
          config.ebackoff *= 2;
          self.log.debug('Waiting %d milliseconds before retrying...', ebck);

          return _.delay(function () {
            self._request(segments, method, callback, query, payload, data, headers, pipe, config);
          }, ebck);
        }

        switch (res.statusCode) {
        case 200:
          if (pipe) {
            pipe.end(new Buffer(body, 'binary'));
          } else {
            callback(err, body);
          }
          break;

        case 202:
        case 429:
          var wait = res.headers['retry-after'] * 1000 + _.random(0, 10000);
          self.log.debug('Status: %d, Retry-After: %d', res.statusCode, res.headers['retry-after']);
          self.log.debug('Waiting %d milliseconds before retrying...', wait);
          _.delay(function () {
            self._request(segments, method, callback, query, payload, data, headers, pipe, config);
          }, wait);
          break;

        case 301:
          opts.url = res.headers.location;
          // request(opts, _handler);
          self.queue.push({
            opts: opts,
            handler: _handler
          });
          break;

        case 302:
          request.get(res.headers.location, callback).pipe(pipe);
          break;

        case 400:
        case 403:
        case 404:
        case 405:
        case 409:
        case 412:
          callback(new Error(JSON.stringify(body)));
          break;

        case 401:
          //First check if stale access tokens still exist, and only then refresh.
          //Prevents multiple refreshes.
          if (self.isAuthenticated()) {
            self.log.debug('Access token expired. Refreshing...');
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
                self.log.debug('New tokens received.');
                self._setTokens(body);
                self._request(segments, method, callback, query, payload, data, headers, pipe, config);
              } else {
                callback(new Error(JSON.stringify(body)));
              }
            });
          } else {
            self.ready(function () {
              self._request(segments, method, callback, query, payload, data, headers, pipe, config);
            });
          }
          break;

        default:
          callback(err, body);
        }
      }
    },

    /**
     * Wait for a connection to get ready.
     * @param {optionalErrorCallback} callback - The callback with an optional err argument,
     * to be invoked once ready.
     */
    ready: function (callback) {
      if (this.isAuthenticated()) {
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
    },

    /**
     * A connection starts with a default concurrency of {@linkcode 7}. Note that long-polling will consume a
     * request from the request pool, so it is generally not a good idea to set this to less than {@linkcode 2}.
     * @summary Set the maximum concurrent requests that this connection will process.
     * @param {number} concurrency - The number of concurrent requests.
     * @throws {RangeError} Concurrency must be an integer > {@linkcode 0}.
     */
    setConcurrency: function (concurrency) {
      if (concurrency < 1) {
        throw new RangeError('Concurrency must be an integer > 0');
      }
      this.queue.concurrency = Math.floor(concurrency);
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