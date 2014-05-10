'use strict';

var assert = require("assert"),
  utils = require('../../../helpers/utils'),
  box_sdk = require('../../../..');

describe('Connection', function () {
  describe('Events', function () {
    this.timeout(120000);

    var PORT = parseInt(process.env.ICT_PORT, 10) + 4,
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

    it('should emit remote events', function (done) {
      connection.startLongPolling();
      var evtReceived = false,
        doneCalled = false;
      connection.on('polling.event.#', function (data) {
        assert(data);
        console.log('Received event: %s: %s', data.event_id, data.event_type);
        evtReceived = true;
      });
      connection.on('polling.end', _done);
      connection.on('polling.error', function (err) {
        assert.fail(err);
      });
      connection.createFolder(utils.uuid(), test_nbsdk_id, function (err, result) {
        utils.prepSampleFile(connection, result.id, function () {
          setTimeout(function () {
            connection.stopLongPolling();
            if (!evtReceived) {
              _done(new Error('No events received'));
            } else {
              _done();
            }
          }, 30000);
        });
      });

      function _done(err) {
        if (!doneCalled) {
          done(err);
          doneCalled = true;
        }
      }
    });

    after(function (done) {
      utils.cleanup(connection, test_nbsdk_id);
      box.stopServer(done);
    });
  });
});