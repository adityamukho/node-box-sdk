'use strict';

var assert = require("assert"),
  utils = require('../helpers/utils'),
  box_sdk = require('../..');

describe('Box', function () {
  var PORT = parseInt(process.env.ICT_PORT, 10);

  describe('Standalone', function () {
    var box, opts;

    before(function () {
      opts = {
        client_id: process.env.ICT_CLIENT_ID,
        client_secret: process.env.ICT_CLIENT_SECRET,
        port: PORT,
      };
    });

    it('should return a Box instance', function () {
      assert.doesNotThrow(function () {
        box = box_sdk.Box(opts, 'debug');
      });

      assert(box instanceof box_sdk.Box);
    });

    it('should have a running server on port ' + PORT, function (done) {
      var http = require('http');
      http.get('http://localhost:' + PORT + '/authorize', function (res) {
        assert(res.statusCode);
        done();
      }).on('error', function (err) {
        assert.fail(err, 'no error', 'error connecting to server', '!=');
        done();
      });
    });

    it('should authorize a connection', function (done) {
      var connection = box.getConnection(process.env.ICT_EMAIL_ID);

      var args = [connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD];
      utils.runHeadlessClient(args, function () {
        connection.ready(function (err) {
          assert.ifError(err);
          assert(connection.access_token);
          done();
        });
      });
    });

    after(function (done) {
      box.stopServer(done);
    });
  });

  describe('Middleware', function () {
    var app;

    it('should configure a BoxStrategy', function () {
      assert.doesNotThrow(function () {
        app = require('../helpers/express/app.js');
      });
    });

    it('should authorize a connection', function (done) {
      var connection = app.box.getConnection(process.env.ICT_EMAIL_ID);
      var args = [
        'http://127.0.0.1:' + PORT + '/auth/box',
        process.env.ICT_EMAIL_ID,
        process.env.ICT_PASSWORD
      ];
      utils.runHeadlessClient(args, function () {
        connection.ready(function (err) {
          assert.ifError(err);
          assert(connection.access_token);
          done();
        });
      });
    });

    after(function () {
      app.stopServer();
    });
  });
});