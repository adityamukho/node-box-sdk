'use strict';

var assert = require("assert");

var box_sdk = require('../..');

describe('Box', function () {
  var PORT = parseInt(process.env.ICT_PORT, 10);

  describe('Standalone', function () {
    var box, opts;

    before(function () {
      opts = {
        client_id: process.env.ICT_CLIENT_ID,
        client_secret: process.env.ICT_CLIENT_SECRET,
        port: PORT,
        'log-level': 'debug'
      };
    });

    it('should return a Box instance', function () {
      assert.doesNotThrow(function () {
        box = box_sdk.Box(opts);
      });
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

      assert.equal(connection.getAuthURL(),
        'https://www.box.com/api/oauth2/authorize?response_type=code&client_id=' + opts.client_id + '&state=' + connection.csrf + '&redirect_uri=http%3A%2F%2Flocalhost%3A9999%2Fauthorize%3Fid%3D' + connection.email.replace('@', '%40'));

      var args = [connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD];
      runHeadlessClient(args, function () {
        connection.ready(function () {
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
      runHeadlessClient(args, function () {
        connection.ready(function () {
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

function runHeadlessClient(args, done) {
  var cp = require('child_process');
  args.unshift('test/helpers/casper/login.js');
  var casper = cp.spawn('casperjs', args, {
    detached: false,
    stdio: 'inherit'
  });
  casper.on('exit', function (code) {
    assert.equal(code, 0);
    done();
  });
}