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
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFileInfo: function (id, done, headers, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }

        this._request(['files', id], 'GET', done, null, null, null, headers, null, config);
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
       * @param {number} version - File version to download. Can be null (meaning get the latest).
       * @param {string} dest - Full path to where the file should be saved.
       * @param {getFileCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFile: function (id, version, dest, done, config) {
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
        var cbCalled = false;
        wr.on("error", function (err) {
          done(err);
        });
        wr.on("close", function (ex) {
          if (!cbCalled) {
            done();
          }
          cbCalled = true;
        });

        var opts = {};
        if (version) {
          opts.version = version;
        }

        this._request(['files', id, 'content'], 'GET', function (err) {
          if (err) {
            done(err);
            cbCalled = true;
          }
        }, opts, null, null, null, wr, config);
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
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      updateFile: function (id, fields, done, headers, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isObject(fields)) {
          return done(new Error('An fields object must be provided.'));
        }

        this._request(['files', id], 'PUT', done, null, fields, null, headers, null, config);
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
       * @param {?OptsUploadFile} opts - Request options.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      uploadFile: function (name, parent_id, opts, done, headers, config) {
        if (!_.isString(name) || !_.isNumber(parseInt(parent_id, 10))) {
          return done(new Error('Invalid params. Required - name: string, parent_id: number'));
        }

        opts = opts || {};
        opts.parent_id = parent_id;

        var data = fs.createReadStream(name);
        this._request(['files', 'content'], 'POST', done, null, opts, data, headers, null, config);
      },

      /**
       * Discards a file to the trash. The etag of the file can be included as an
       * {@linkcode header[If-Match]} header to prevent race conditions.
       * @summary Delete a file.
       * @see {@link https://developers.box.com/docs/#files-delete-a-file}
       * @param {number} id - The file's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      deleteFile: function (id, done, headers, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }

        this._request(['files', id], 'DELETE', done, null, null, null, headers, null, config);
      },

      /**
       * Options to set for {@link Connection#uploadFileNewVersion}.
       * @typedef {Object} OptsUploadFileNewVersion
       * @property {timestamp} [content_modified_at] - The time this file was last modified on the user’s machine.
       * @see {@link https://developers.box.com/docs/#files-upload-a-new-version-of-a-file}
       */

      /**
       * This method is used to upload a new version of an existing file in a user’s account.
       * An optional {@linkcode header[If-Match]} header can be included to ensure that client
       * only overwrites the file if it knows about the latest version. The filename on Box
       * will remain the same as the previous version.
       * @summary Upload a New Version of a File.
       * @see {@link https://developers.box.com/docs/#files-upload-a-new-version-of-a-file}
       * @param {string} name - The fully qualified path to the local file.
       * @param {number} id - The file's ID.
       * @param {?OptsUploadFileNewVersion} opts - Request options.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      uploadFileNewVersion: function (name, id, opts, done, headers, config) {
        if (!_.isString(name) || !_.isNumber(parseInt(id, 10))) {
          return done(new Error('Invalid params. Required - name: string, id: number'));
        }

        var data = fs.createReadStream(name);
        this._request(['files', id, 'content'], 'POST', done, null, opts, data, headers, null, config);
      },

      /**
       * If there are previous versions of this file, this method can be used to retrieve
       * metadata about the older versions.
       * @summary View Versions of a File.
       * @see {@link https://developers.box.com/docs/#files-view-versions-of-a-file}
       * @param {number} id - The file's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFileVersions: function (id, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }

        this._request(['files', id, 'versions'], 'GET', done, null, null, null, null, null, config);
      },

      /**
       * If there are previous versions of this file, this method can be used to promote one of the
       * older versions to the top of the stack. This actually mints a copy of the old version and
       * puts it on the top of the versions stack. The file will have the exact same contents, the
       * same SHA1/etag, and the same name as the original. Other properties such as comments do not
       * get updated to their former values.
       * @summary Promote an Old Version of a File.
       * @see {@link https://developers.box.com/docs/#files-promote-old-version}
       * @param {number} id - The file's ID.
       * @param {number} version - File version to promote.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      promoteFileVersion: function (id, version, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isEmpty(version) && !_.isNumber(parseInt(version, 10))) {
          return done(new Error('version must be a number.'));
        }

        var payload = {
          type: 'file_version',
          id: version
        };
        this._request(['files', id, 'versions', 'current'], 'POST', done, null, payload, null, null, null, config);
      },

      /**
       * Discards a specific file version to the trash.
       * @summary Delete an Old Version of a File.
       * @see {@link https://developers.box.com/docs/#files-delete-version}
       * @param {number} id - The file's ID.
       * @param {number} version - File version to promote.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestHeaders} [headers] - Additional headers.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      deleteFileVersion: function (id, version, done, headers, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isEmpty(version) && !_.isNumber(parseInt(version, 10))) {
          return done(new Error('version must be a number.'));
        }

        this._request(['files', id, 'versions', version], 'DELETE', done, null, null, null, headers, null, config);
      },

      /**
       * Used to create a copy of a file in another folder. The original version of the file will
       * not be altered.
       * @summary Copy a File.
       * @see {@link https://developers.box.com/docs/#files-copy-a-file}
       * @param {number} id - The file's ID.
       * @param {number} parent_id - The destination parent folder's ID.
       * @param {string} name - The destination file's name. Can be null.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      copyFile: function (id, parent_id, name, done, config) {
        if (!_.isNumber(parseInt(id, 10)) || !_.isNumber(parseInt(parent_id, 10))) {
          return done(new Error('Invalid params. Required - id: number, parent_id: number'));
        }

        var opts = {
          parent: {
            id: parent_id.toString()
          }
        };
        if (name) {
          opts.name = name;
        }

        this._request(['files', id, 'copy'], 'POST', done, null, opts, null, null, null, config);
      },

      /**
       * Options to pass to {@link Connection#getFileThumbnail}.
       * @external OptsGetFileThumbnail
       * @see {@link https://developers.box.com/docs/#files-get-a-thumbnail-for-a-file}
       */

      /**
       * Retrieves a thumbnail, or smaller image representation, of this file. Sizes of 32x32,
       * 64x64, 128x128, and 256x256 can be returned. Currently thumbnails are only available
       * in .png format and will only be generated for image file formats.
       * @summary Get a Thumbnail for a File.
       * @see {@link https://developers.box.com/docs/#files-get-a-thumbnail-for-a-file}
       * @param {number} id - The file's ID.
       * @param {external:OptsGetFileThumbnail} opts - Thumbnail options.
       * @param {string} dest - Full path to where the file should be saved.
       * @param {getFileCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFileThumbnail: function (id, opts, dest, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        if (!_.isString(dest)) {
          return done(new Error('destination must be a string.'));
        }

        var wr = fs.createWriteStream(dest);
        var cbCalled = false;
        wr.on("error", function (err) {
          done(err);
        });
        wr.on("close", function (ex) {
          if (!cbCalled) {
            done();
          }
          cbCalled = true;
        });

        this._request(['files', id, 'thumbnail.png'], 'GET', function (err) {
          if (err) {
            done(err);
            cbCalled = true;
          }
        }, opts, null, null, null, wr, config);
      },

      /**
       * Retrieves an item that has been moved to the trash.
       * @summary Get a Trashed File.
       * @see {@link https://developers.box.com/docs/#files-get-a-trashed-file}
       * @param {number} id - The folder's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getTrashedFile: function (id, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        this._request(['files', id, 'trash'], 'GET', done, null, null, null, null, null, config);
      },

      /**
       * Permanently deletes an item that is in the trash. The item will no longer exist in Box.
       * This action cannot be undone.
       * @summary Permanently Delete a Trashed File.
       * @see {@link https://developers.box.com/docs/#files-permanently-delete-a-trashed-file}
       * @param {number} id - The folder's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      deleteTrashedFile: function (id, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }
        this._request(['files', id, 'trash'], 'DELETE', done, null, null, null, null, null, config);
      },

      /**
       * Restores an item that has been moved to the trash. Default behavior is to restore the
       * item to the folder it was in before it was moved to the trash. If that parent folder
       * no longer exists or if there is now an item with the same name in that parent folder,
       * the new parent folder and/or new name will need to be included in the request.
       * @summary Restore a Trashed Item.
       * @see {@link https://developers.box.com/docs/#files-restore-a-trashed-item}
       * @param {number} id - The file's ID.
       * @param {?string} name - The file's name.
       * @param {number} parent_id - The parent folder's ID. Can be null.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      restoreTrashedFile: function (id, name, parent_id, done, config) {
        if ((name && !_.isString(name)) || (parent_id && !_.isNumber(parseInt(parent_id, 10)))) {
          return done(new Error('Invalid params. Required - name: string, parent_id: number'));
        }

        var opts = {};
        if (name) {
          opts.name = name;
        }
        if (parent_id) {
          opts.parent = {
            id: parent_id.toString()
          };
        }

        this._request(['files', id], 'POST', done, null, opts, null, null, null, config);
      },

      /**
       * Retrieves the comments on a particular file, if any exist.
       * @summary View the Comments on a File.
       * @see {@link https://developers.box.com/docs/#files-view-the-comments-on-a-file}
       * @param {number} id - The file's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFileComments: function (id, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }

        this._request(['files', id, 'comments'], 'GET', done, null, null, null, null, null, config);
      },

      /**
       * Retrieves all of the tasks for given file.
       * @summary Get the tasks for a file.
       * @see {@link https://developers.box.com/docs/#files-get-the-tasks-for-a-file}
       * @param {number} id - The file's ID.
       * @param {requestCallback} done - The callback to invoke (with possible errors) when the request returns.
       * @param {?RequestConfig} [config] - Configure the request behaviour.
       */
      getFileTasks: function (id, done, config) {
        if (!_.isNumber(parseInt(id, 10))) {
          return done(new Error('id must be specified.'));
        }

        this._request(['files', id, 'tasks'], 'GET', done, null, null, null, null, null, config);
      }
    });
};