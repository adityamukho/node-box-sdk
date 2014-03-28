'use strict';

var box_sdk = require('../lib/box-sdk.js')();

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['Box'] = {
  setUp: function (done) {
    // setup here
    done();
  },
  'no args': function (test) {
    test.expect(1);
    // tests here
    var opts = {
      client_id: 'olo6rh4kzryu7festxnbva3sqae5ne99',
      client_secret: '5CzFpCuFKUu6L3qgAN31oRAICXmTxJ5Q',
      port: 9999
    },
      boxProto = Object.create(box_sdk.Box.prototype),
      box = box_sdk.Box.call(boxProto, opts, false);
    test.deepEqual([box.client_id, box.client_secret, box.port], Object.keys(opts).map(function (key) {
      return opts[key];
    }), 'should be ' + JSON.stringify(opts));
    test.done();
  },
};