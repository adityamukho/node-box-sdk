var _ = require('lodash');

module.exports = function (Connection) {
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
      this.request(['folders', id, 'items'], 'get', done, opts, null, null, headers);
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
      this.request(['folders', id], 'delete', done, opts, null, null, headers);
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
    },
    getTrashedItems: function (opts, done, headers) {
      this.request(['folders', 'trash', 'items'], 'get', done, opts, null, null, headers);
    },
    getTrashedFolder: function (id, done, headers) {
      if (!_.isNumber(id)) {
        return done(new Error('id must be specified.'));
      }
      this.request(['folders', id, 'trash'], 'get', done, null, null, null, headers);
    }
  });
}