'use strict';

var _ = require('lodash');

module.exports = function (Connection) {
  Connection.addInstanceMethods(
    /** @lends Connection.prototype */
    {
      /**
       * ISO 8601 Language Code, used in search parameters.
       * @external ISO8601
       * @see {@link http://en.wikipedia.org/wiki/ISO_8601}
       */

      /**
       * Options and parameters for search.
       * @typedef {Object} OptsSearch
       * @property {string} [scope] - The scope for which you want to limit your search to. Can be
       * {@linkcode user_content} for a search limited to only the current user or {@linkcode enterprise_content}
       * for the entire enterprise.
       * @property {string} [file_extensions] - Limit searches to specific file extensions like
       * {@linkcode pdf,png,doc}. Requires one or a set of comma delimited file extensions.
       * @property {external:ISO8601} [created_at_range] - The date for when the item was created. Specify the date
       * range by using ISO-8601 variables separated by a comma: {@linkcode from_date,to_date}. Trailing
       * {@linkcode from_date,} and leading {@linkcode ,to_date commas} are also accepted, where the current date
       * and earliest known date will be designated respectively.
       * @property {external:ISO8601} [updated_at_range] - The date for when the item was updated. Specify the date
       * range by using ISO-8601 variables separated by a comma: {@linkcode from_date,to_date}. Trailing
       * {@linkcode from_date,} and leading {@linkcode ,to_date commas} are also accepted, where the current date
       * and earliest known date will be designated respectively.
       * @property {number} [size_range] - Filter by a file size range. Specify the file size range in bytes
       * separated by a comma: {@linkcode lower_bound_size,upper_bound_size}, where 1MB is equivalent to 1000000
       * bytes. Trailing {@linkcode lower_bound_size,} and leading {@linkcode ,upper_bound_size} commas are also
       * accepted as parameters.
       * @property {string} [owner_user_ids] - Search by item owners. Requires one or a set of comma delimited
       * user_ids.
       * @property {string} [ancestor_folder_ids] - Limit searches to specific parent folders. Requires one or a
       * set of comma delimited folder_ids: {@linkcode folder_id_1,folder_id_2,...}. Parent folder results will
       * also include items within subfolders.
       * @property {string} [content_types] - Limit searches to specific Box designated content types. Can be
       * {@linkcode name}, {@linkcode description}, {@linkcode file_content}, {@linkcode comments}, or
       * {@linkcode tags}. Requires one or a set of comma delimited content_types.
       * @property {string} [type] - The type you want to return in your search. Can be {@linkcode file},
       * {@linkcode folder}, or {@linkcode web_link}.
       * @property {number} [limit] - Number of search results to return. Default: 30, Max :200.
       * @property {number} [offset] - The search result at which to start the response. Default: 0.
       * @see {@link https://developers.box.com/docs/#search}
       */

      /**
       * Provides a simple way of finding items that are accessible in a given user’s Box account.
       * @summary Search a user's account.
       * @see {@link https://developers.box.com/docs/#search}
       * @param {string} query - The search keyword.
       * @param {?OptsSearch} opts - Additional search options.
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