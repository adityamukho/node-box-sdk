'use strict';

var assert = require("assert"),
  _ = require('lodash'),
  cp = require('child_process');

exports.runHeadlessClient = function (args, done) {
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

exports.uuid = function (prefix) {
  prefix = prefix || 'test_';
  return _.uniqueId(prefix);
};

exports.prepTestFolder = function (connection, done) {
  var args = [connection.getAuthURL(), process.env.ICT_EMAIL_ID, process.env.ICT_PASSWORD];

  this.runHeadlessClient(args, function () {
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
            done(null, result.id);
          });
        } else {
          done(null, test_nbsdk.id);
        }
      });
    });
  });
};