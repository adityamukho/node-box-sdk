# node-box-sdk [![Build Status](https://secure.travis-ci.org/adityamukho/node-box-sdk.png?branch=master)](http://travis-ci.org/adityamukho/node-box-sdk)

Node.js client for Box Content API.

**THIS MODULE IS UNDER CONSTRUCTION.**

## Getting Started
Install the module with: `npm install box-sdk`

```javascript
var box_sdk = require('box-sdk')({
	'log-level': 'debug'
});
//OR
var box_sdk = require('box-sdk')();

var box = box_sdk.Box('client_id', 'client_secret', port, [host], [customLogger]);
var connection = box.getConnection('some.email@example.com');

//Navigate user to the auth URL
console.log(connection.getAuthURL());

connection.on('tokens.set', function (data, envelope) {
	connection.listFolders(0, function (err, result) {
		if (err) {
			console.error(err);
		}
		console.dir(result);
	});
});
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Aditya Mukhopadhyay  
Licensed under the MIT license.
