'use strict';

var assert = require("assert"),
  cp = require('child_process'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  fs = require('fs');

exports.runHeadlessClient = function (args, done) {
  args.unshift('--ssl-protocol=tlsv1');
  args.unshift('test/helpers/casper/login.js');
  var casper = cp.spawn('casperjs', args, {
    detached: false,
    stdio: 'inherit'
  });
  casper.on('exit', function (code) {
    assert.equal(code, 0);
    done();
  });
};

exports.uuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = (c === 'x') ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

exports.prepTestFolder = function (connection, done) {
  var self = this;
  var args = [connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD];

  this.runHeadlessClient(args, function () {
    connection.ready(function (err) {
      assert.ifError(err);
      connection.createFolder('test_nbsdk-' + self.uuid(), 0, function (err, result) {
        if (err) {
          return done(err);
        }
        done(null, result.id);
      });
    });
  });
};

exports.prepSampleFile = function (connection, test_nbsdk_id, done) {
  mkdirp.sync('test/.tmp');
  var self = this;
  var dest = 'test/.tmp/testfile-' + this.uuid();
  this.copyFile(__filename, dest, function (err) {
    assert.ifError(err);

    self.shasum(dest, function (d) {
      var headers = {
        'Content-MD5': d
      };

      connection.uploadFile(dest, test_nbsdk_id, null, function (err, result) {
        assert.ifError(err);
        done(result);
      }, headers);
    });
  });
};

exports.shasum = function (filename, done) {
  var shasum = crypto.createHash('sha1');
  var s = fs.createReadStream(filename);

  s.on('data', function (d) {
    shasum.update(d);
  });
  s.on('end', function () {
    var d = shasum.digest('hex');
    done(d);
  });
};

exports.cleanup = function (connection, test_nbsdk_id) {
  if (test_nbsdk_id) {
    connection.deleteFolder(test_nbsdk_id, {
      recursive: true
    }, function (err, result) {
      if (err) {
        console.error(err);
      }
    });
  }
  rimraf.sync('test/.tmp');
};

exports.copyFile = function (source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function (err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function (err) {
    done(err);
  });
  wr.on("close", function (ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
};