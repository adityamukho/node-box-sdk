var assert = require("assert");
var box_sdk = require('../..');

describe('Box', function () {
  var box, opts,
    PORT = 9999;

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

    var cp = require('child_process');
    var casper = cp.spawn('casperjs', ['test/helpers/login.js', connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD], {
      detached: false,
      stdio: 'inherit'
    });
    casper.on('exit', function () {
      done();
    });

  });

  after(function (done) {
    box.stopServer(done);
  });
});