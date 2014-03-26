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

exports['Client'] = {
  setUp: function (done) {
    // setup here
    done();
  },
  'no args': function (test) {
    test.expect(1);
    // tests here
    var opts = ['localhost', 9999, 'askljdfas', 'asdjf'];
    var box = box_sdk.createBoxInstance.apply(box_sdk, opts);
    test.deepEqual([box.host, box.port, box.client_id, box.client_secret], opts, 'should be ' + JSON.stringify(opts));
    test.done();
  },
};