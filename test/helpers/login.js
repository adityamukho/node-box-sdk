var casper = require('casper').create({
    waitTimeout: 15000,
    stepTimeout: 15000,
    verbose: true,
    viewportSize: {
        width: 1400,
        height: 768
    },
    onWaitTimeout: function () {
        logConsole('Wait TimeOut Occured');
        this.capture('xWait_timeout.png');
        this.exit();
    },
    onStepTimeout: function () {
        logConsole('Step TimeOut Occured');
        this.capture('xStepTimeout.png');
        this.exit();
    }
});

casper.on('remote.message', function (msg) {
    logConsole('***remote message caught***: ' + msg);
});

casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4');

casper.start(casper.cli.args[0], function () {
    this.fillSelectors('form[name="login_form"]', {
        'input[name="login"]': casper.cli.args[1],
        'input[name="password"]': casper.cli.args[2],
    }, true);
});

casper.then(function () {
    this.fillSelectors('form[name="consent_form"]', {}, true);
});

casper.then(function (response) {
    this.evaluateOrDie(function () {
        return /Authorization code received/.test(document.body.innerText);
    }, 'login failed');
});

casper.run(function () {
    this.echo('logged in').exit();
});