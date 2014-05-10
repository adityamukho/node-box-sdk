'use strict';

var assert = require("assert"),
  utils = require('../../../helpers/utils'),
  box_sdk = require('../../../..');

describe('Connection', function () {
  describe('Folders', function () {
    var PORT = parseInt(process.env.ICT_PORT, 10) + 2,
      opts = {
        client_id: process.env.ICT_CLIENT_ID,
        client_secret: process.env.ICT_CLIENT_SECRET,
        port: PORT,
      },
      box, connection, test_nbsdk_id;

    before(function (done) {
      box = box_sdk.Box(opts, 'debug');
      connection = box.getConnection(process.env.ICT_EMAIL_ID);

      utils.prepTestFolder(connection, function (err, tid) {
        if (err) {
          return done(err);
        }
        test_nbsdk_id = tid;
        done();
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
      utils.cleanup(connection, test_nbsdk_id);
      box.stopServer(done);
    });
  });
});