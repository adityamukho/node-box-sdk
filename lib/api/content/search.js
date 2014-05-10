'use strict';

var async = require('async'),
  _ = require('lodash');

module.exports = function (Connection) {
  Connection.addInstanceMethods(
    /** @lends Connection.prototype */
    {
      /**
       * Provides a simple way of finding items that are accessible in a given user’s Box account.
       * @summary Search a user's account.
       * @see {@link https://developers.box.com/docs/#search}
       * @param {string} query - The search keyword.
       * @param {?external:OptsFLO} opts - Request options.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      search: function (query, opts, done, config) {
        if (!_.isString(query)) {
          return done(new Error('query must be a string.'));
        }

        opts = opts || {};
        opts.query = query;

        this._request(['search'], 'GET', done, opts, null, null, null, null, config);
      }
    });
};