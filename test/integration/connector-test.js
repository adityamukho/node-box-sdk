'use strict';

var assert = require("assert"),
  box_sdk = require('../..');

describe('Connection', function () {
  describe('Core', function () {
    var PORT = parseInt(process.env.ICT_PORT, 10) + 1,
      opts = {
        client_id: process.env.ICT_CLIENT_ID,
        client_secret: process.env.ICT_CLIENT_SECRET,
        port: PORT,
        'log-level': 'debug'
      },
      box, connection;

    before(function () {
      box = box_sdk.Box(opts, 'debug');
      connection = box.getConnection(process.env.ICT_EMAIL_ID);
    });

    it('should return a Connection instance', function () {
      assert(connection instanceof box_sdk.Connection);
    });

    it('should match the expected authURL', function () {
      assert.equal(connection.getAuthURL(),
        'https://www.box.com/api/oauth2/authorize?response_type=code&client_id=' + opts.client_id + '&state=' + connection.csrf + '&redirect_uri=http%3A%2F%2Flocalhost%3A' + PORT + '%2Fauthorize%3Fid%3D' + connection.email.replace('@', '%40'));
    });

    after(function (done) {
      box.stopServer(done);
    });
  });
});