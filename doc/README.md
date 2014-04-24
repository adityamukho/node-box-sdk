## Node Box SDK
https://github.com/adityamukho/node-box-sdk

Node.js client for the [Box.com Content API](https://developers.box.com/docs/).

**THIS MODULE IS UNDER CONSTRUCTION!!**

## Getting Started
Install the module with: `npm install box-sdk`

### Running _Standalone_

```
var box_sdk = require('box-sdk');

//Default host: localhost
var box = box_sdk.Box('client id', 'client secret', port /*, host, logLevel */);
var connection = box.getConnection('some.email@example.com');

//Navigate user to the auth URL
console.log(connection.getAuthURL());

connection.ready(function () {
  connection.getFolderItems(0, {limit: 1}, function (err, result) {
    if (err) {
      console.error(JSON.stringify(err.context_info));
    }
    console.dir(result);
  });
});
```

### Running with Passport authentication under Express
**Note:** For a complete express example, look under `test/helpers/express`.
```
var express = require('express'),
  passport = require('passport'),
  BoxStrategy = require('passport-box').Strategy,
  box_sdk = require('../../..');

...

var box = box_sdk.Box();

...

passport.use(new BoxStrategy({
  clientID: BOX_CLIENT_ID,
  clientSecret: BOX_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:" + PORT + "/auth/box/callback"
}, box.authenticate()));

...

var app = express();

...

app.get('/auth/box', passport.authenticate('box'), function (req, res) {});

app.get('/auth/box/callback',
  passport.authenticate('box', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    res.redirect('/');
  });
```

### Testing
Before running your tests locally, copy `test/env.json.example` to `test/env.json` and fill in correct values for the environment variables to be imported during testing.

Run all tests with:
```bash
$ grunt mochaTest
```

The files under `test/integration` are completely self-contained, and hence can be run independently. For example:
```bash
$ grunt mochaTest --target=./test/integration/api/content/folders-test.js
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Licensed under the MIT license.
