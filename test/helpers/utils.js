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

exports.uuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = (c === 'x') ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};