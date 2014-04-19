'use strict';

var box_sdk = require('../lib/box-sdk.js');

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
      client_id: process.env.ICT_CLIENT_ID,
      client_secret: process.env.ICT_CLIENT_SECRET,
      port: 9999
    },
      box = box_sdk.Box(opts);
    test.deepEqual([box.client_id, box.client_secret, box.port], Object.keys(opts).map(function (key) {
      return opts[key];
    }), 'should be ' + JSON.stringify(opts));
    test.done();
    console.dir(opts);
  },
};