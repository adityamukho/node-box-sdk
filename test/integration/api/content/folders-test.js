'use strict';

var assert = require("assert"),
  utils = require('../../../helpers/utils'),
  _ = require('lodash'),
  box_sdk = require('../../../..');

describe('Connection', function () {
  describe('Folders', function () {
    var PORT = parseInt(process.env.ICT_PORT, 10) + 2,
      opts = {
        client_id: process.env.ICT_CLIENT_ID,
        client_secret: process.env.ICT_CLIENT_SECRET,
        port: PORT,
        'log-level': 'debug'
      },
      box, connection, test_nbsdk_id;

    before(function (done) {
      box = box_sdk.Box(opts);
      connection = box.getConnection(process.env.ICT_EMAIL_ID);
      var args = [connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD];
      utils.runHeadlessClient(args, function () {
        connection.ready(function () {
          connection.getFolderItems(0, null, function (err, result) {
            if (err) {
              return done(err);
            }
            var test_nbsdk = _.find(result.entries, {
              name: 'test_nbsdk'
            });
            if (_.isEmpty(test_nbsdk)) {
              connection.createFolder('test_nbsdk', 0, function (err, result) {
                if (err) {
                  return done(err);
                }
                test_nbsdk_id = result.id;
                done();
              });
            } else {
              test_nbsdk_id = test_nbsdk.id;
              done();
            }
          });
        });
      });
    });

    it('should return a folder\'s info', function (done) {
      connection.getFolderInfo(0, function (err, result) {
        assert.ifError(err);
        assert.equal(result.id, 0);
        assert.equal(result.type, 'folder');

        done();
      });
    });

    it('should return a folder\'s items', function (done) {
      connection.getFolderItems(0, null, function (err, result) {
        assert.ifError(err);
        assert(result.entries instanceof Array);

        done();
      });
    });

    it('should create a folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        assert.equal(result.type, 'folder');
        done();
      });
    });

    it('should update a folder', function (done) {
      var fields = {
        description: utils.uuid()
      };
      connection.updateFolder(test_nbsdk_id, fields, function (err, result) {
        assert.ifError(err);
        assert.equal(result.type, 'folder');
        assert.equal(result.description, fields.description);
        done();
      });
    });

    it('should delete a folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        connection.deleteFolder(result.id, null, function (err, result) {
          assert.ifError(err);
          done();
        });
      });

    });

    it('should copy a folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        var name = utils.uuid();
        connection.copyFolder(result.id, test_nbsdk_id, name, function (err, result) {
          assert.ifError(err);
          assert.equal(result.type, 'folder');
          assert.equal(result.parent.id, test_nbsdk_id);
          assert.equal(result.name, name);
          done();
        });
      });
    });

    it('should create a shared link to a folder', function (done) {
      var opts = {
        'can_download': 'open'
      };
      connection.folderSharedLink(test_nbsdk_id, opts, function (err, result) {
        assert.ifError(err);
        assert.equal(result.type, 'folder');
        assert.equal(result.shared_link.permissions.can_download, true);
        done();
      });
    });

    it('should return folder\'s collaborations', function (done) {
      connection.getFolderCollaborations(test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        assert(result.entries instanceof Array);
        done();
      });
    });

    it('should return items in trash', function (done) {
      connection.getTrashedItems(null, function (err, result) {
        assert.ifError(err);
        assert(result.entries instanceof Array);
        done();
      });
    });

    it('should return a trashed folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        var fid = result.id;
        connection.deleteFolder(fid, null, function (err, result) {
          assert.ifError(err);
          connection.getTrashedFolder(fid, function (err, result) {
            assert.ifError(err);
            assert.equal(result.type, 'folder');
            assert.equal(result.id, fid);
            done();
          });
        });
      });
    });

    it('should permanently delete a trashed folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        var fid = result.id;
        connection.deleteFolder(fid, null, function (err, result) {
          assert.ifError(err);
          connection.deleteTrashedFolder(fid, function (err, result) {
            assert.ifError(err);
            done();
          });
        });
      });
    });

    it('should restore a trashed folder', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);
        var fid = result.id;
        connection.deleteFolder(fid, null, function (err, result) {
          assert.ifError(err);
          connection.restoreTrashedFolder(fid, null, null, function (err, result) {
            assert.ifError(err);
            assert.equal(result.type, 'folder');
            assert.equal(result.id, fid);
            done();
          });
        });
      });
    });

    after(function (done) {
      if (test_nbsdk_id) {
        connection.deleteFolder(test_nbsdk_id, {
          recursive: true
        }, function (err, result) {
          if (err) {
            console.error(err);
          }
        });
      }
      box.stopServer(done);
    });
  });
});