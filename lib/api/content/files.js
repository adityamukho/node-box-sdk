'use strict';

var _ = require('lodash'),
  fs = require('fs');

module.exports = function (Connection) {
  Connection.addInstanceMethods(
    /** @lends Connection.prototype */
    {
      /**
       * Used to retrieve the metadata about a file.
       * @summary Get Information About a File.
       * @see {@link https://developers.box.com/docs/#files-get}
       * @param {number} id - The file's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {RequestHeaders} [headers] - Additional headers.
       */
      getFileInfo: function (id, done, headers) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        this._request(['files', id], 'get', done, null, null, null, headers);
      },

      /**
       * Called after a {@link Connection#getFile} is performed.
       * @callback getFileCallback
       * @param {Error} [error] - Any error that may have occurred.
       */

      /**
       * Retrieves the actual data of the file. An optional {@linkcode opts.version} parameter
       * can be set to download a previous version of the file.
       * @summary Download a File.
       * @see {@link https://developers.box.com/docs/#files-download-a-file}
       * @param {number} id - The file's ID.
       * @param {number} version - File version to download. Can be null (meaning get latest).
       * @param {string} dest - Full path to where the file should be saved.
       * @param {getFileCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {RequestHeaders} [headers] - Additional headers.
       */
      getFile: function (id, version, dest, done, headers) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isEmpty(version) && !_.isNumber(parseInt(version, 10))) {
          return done(new Error('version must be a number.'));
        }
        if (!_.isString(dest)) {
          return done(new Error('destination must be a string.'));
        }

        var wr = fs.createWriteStream(dest);
        wr.on("error", function (err) {
          done(err);
        });
        wr.on("close", function (ex) {
          done();
        });

        var opts = {};
        if (version) {
          opts.version = version;
        }

        this._request(['files', id, 'content'], 'get', function (err) {
          if (err) {
            done(err);
          }
        }, opts, null, null, headers, wr);
      },

      /**
       * Fields to set for {@link Connection#updateFile}.
       * @external FieldsUpdateFile
       * @see {@link https://developers.box.com/docs/#files-update-a-files-information}
       */

      /**
       * Used to update individual or multiple fields in the file object, including renaming the file,
       * changing it’s description, and creating a shared link for the file. To move a file, change
       * the ID of its parent folder. An optional {@linkcode header[If-Match]} header can be included
       * to ensure that client only updates the file if it knows about the latest version.
       * @summary Update a file’s information.
       * @see {@link https://developers.box.com/docs/#files-update-a-files-information}
       * @param {number} id - The file's ID.
       * @param {external:FieldsUpdateFile} fields - The fields to update.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {RequestHeaders} [headers] - Additional headers.
       */
      updateFile: function (id, fields, done, headers) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isObject(fields)) {
          return done(new Error('An fields object must be provided.'));
        }
        this._request(['files', id], 'put', done, null, fields, null, headers);
      },

      /**
       * Options to set for {@link Connection#uploadFile}.
       * @typedef {Object} OptsUploadFile
       * @property {timestamp} [content_created_at] - The time this file was created on the user’s machine.
       * @property {timestamp} [content_modified_at] - The time this file was last modified on the user’s machine.
       * @see {@link https://developers.box.com/docs/#files-upload-a-file}
       */

      /**
       * Use the Uploads API to allow users to add a new file. The user can then upload a file by
       * specifying the destination folder for the file. If the user provides a file name that
       * already exists in the destination folder, the user will receive an error. You can
       * optionally specify a {@linkcode header[Content-MD5]} header with the SHA1 hash of the file
       * to ensure that the file is not corrupted in transit.
       * @summary Upload a File.
       * @see {@link https://developers.box.com/docs/#files-upload-a-file}
       * @param {string} name - The fully qualified path to the local file.
       * @param {number} parent_id - The parent folder's ID.
       * @param {OptsUploadFile} opts - Request options. Can be null.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {RequestHeaders} [headers] - Additional headers.
       */
      uploadFile: function (name, parent_id, opts, done, headers) {
        if (!_.isString(name) || !_.isNumber(parseInt(parent_id, 10))) {
          return done(new Error('Invalid params. Required - name: string, parent_id: number'));
        }

        opts = opts || {};
        opts.parent_id = parent_id;

        var data = fs.createReadStream(name);
        this._request(['files', 'content'], 'post', done, null, opts, data, headers);
      },
    });
};