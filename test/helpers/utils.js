'use strict';

var assert = require("assert"),
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