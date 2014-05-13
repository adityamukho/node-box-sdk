'use strict';

var assert = require("assert"),
  utils = require('../../../helpers/utils'),
  box_sdk = require('../../../..');

describe('Connection', function () {
  describe('Search', function () {
    var PORT = parseInt(process.env.ICT_PORT, 10) + 5,
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

    it('should return search results', function (done) {
      utils.prepSampleFile(connection, test_nbsdk_id, function (result) {
        var fname = result.entries[0].name;
        connection.search(fname, null, function (err, result) {
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