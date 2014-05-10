'use strict';

var assert = require("assert"),
  utils = require('../../../helpers/utils'),
  sizeOf = require('image-size'),
  box_sdk = require('../../../..');

describe('Connection', function () {
  describe('Files', function () {
    var PORT = parseInt(process.env.ICT_PORT, 10) + 3,
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

    it('should return a file\'s info', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var fid = result.entries[0].id;
        connection.getFileInfo(fid, function (err, result) {
          assert.ifError(err);
          assert.equal(result.id, fid);
          assert.equal(result.type, 'file');

          done();
        });
      });
    });

    it('should download a file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var dest = 'test/.tmp/testfile-' + utils.uuid();
        connection.getFile(result.entries[0].id, null, dest, function (err) {
          assert.ifError(err);
          utils.shasum(dest, function (digest) {
            assert.equal(digest, result.entries[0].sha1);
            done();
          });
        });
      });
    });

    it('should create a file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        assert(result.entries instanceof Array);
        assert.notEqual(result.entries.length, 0);
        assert.equal(result.entries[0].type, 'file');

        done();
      });
    });

    it('should update a file', function (done) {
      var fields = {
        description: utils.uuid()
      };

      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.updateFile(result.entries[0].id, fields, function (err, result) {
          assert.ifError(err);
          assert.equal(result.type, 'file');
          assert.equal(result.description, fields.description);

          done();
        });
      });
    });

    it('should delete a file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.deleteFile(result.entries[0].id, function (err) {
          assert.ifError(err);

          done();
        });
      });
    });

    it('should create a new file version', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var dest = 'test/.tmp/testfile-' + utils.uuid();
        utils.copyFile(__filename, dest, function (err) {
          assert.ifError(err);
          connection.uploadFileNewVersion(dest, result.entries[0].id, null, function (err, result) {
            assert.ifError(err);
            assert(result.entries instanceof Array);
            assert.notEqual(result.entries.length, 0);
            assert.equal(result.entries[0].type, 'file');

            done();
          });
        });
      });
    });

    it('should return the file\'s versions', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.getFileVersions(result.entries[0].id, function (err, result) {
          assert.ifError(err);
          assert(result.entries instanceof Array);
          done();
        });
      });
    });

    it('should return an old version of the file');
    it('should promote an older version of the file');
    it('should delete an older version of the file');

    it('should copy a file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.copyFile(result.entries[0].id, test_nbsdk_id, utils.uuid(), function (err, result) {
          assert.ifError(err);
          assert.equal(result.type, 'file');

          done();
        });
      });
    });

    it('should download a thumbnail of the file', function (done) {
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        assert.ifError(err);

        var imgFile = 'test/samples/banana.png';
        utils.shasum(imgFile, function (d) {
          var headers = {
            'Content-MD5': d
          };

          connection.uploadFile(imgFile, result.id, null, function (err, result) {
            assert.ifError(err);

            var dest = 'test/.tmp/testfile-' + utils.uuid() + '.png';
            connection.getFileThumbnail(result.entries[0].id, {
              min_height: 32,
              min_width: 32
            }, dest, function (err) {
              assert.ifError(err);

              sizeOf(dest, function (err, dimensions) {
                assert.ifError(err);
                assert.equal(dimensions.width, 32);
                assert.equal(dimensions.height, 32);

                done();
              });
            });
          }, headers);
        });
      });
    });

    it('should restore a trashed file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var fid = result.entries[0].id;
        connection.deleteFile(fid, function (err) {
          assert.ifError(err);
          connection.restoreTrashedFile(fid, null, null, function (err, result) {
            assert.ifError(err);
            assert.equal(result.type, 'file');
            assert.equal(result.id, fid);
            done();
          });
        });
      });
    });

    it('should permanently delete a trashed file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var fid = result.entries[0].id;
        connection.deleteFile(fid, function (err) {
          assert.ifError(err);
          connection.deleteTrashedFile(fid, function (err) {
            assert.ifError(err);
            done();
          });
        });
      });
    });

    it('should return a trashed file', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var fid = result.entries[0].id;
        connection.deleteFile(fid, function (err) {
          assert.ifError(err);
          connection.getTrashedFile(fid, function (err, result) {
            assert.ifError(err);
            assert.equal(result.type, 'file');
            assert.equal(result.id, fid);
            done();
          });
        });
      });
    });

    it('should return a file\'s comments', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.getFileComments(result.entries[0].id, function (err, result) {
          assert.ifError(err);
          assert(result.entries instanceof Array);

          done();
        });
      });
    });

    it('should return a file\'s tasks', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        connection.getFileTasks(result.entries[0].id, function (err, result) {
          assert.ifError(err);
          assert(result.entries instanceof Array);

          done();
        });
      });
    });

    after(function (done) {
      utils.cleanup(connection, test_nbsdk_id);
      box.stopServer(done);
    });
  });
});