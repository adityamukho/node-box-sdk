var casper = require('casper').create();

casper.start(casper.cli.args[0], function () {
    this.fillSelectors('form[name="login_form"]', {
        'input[name="login"]': this.cli.args[1],
        'input[name="password"]': this.cli.args[2],
    }, true);
});

casper.then(function () {
    this.fillSelectors('form[name="consent_form"]', {}, true);
});

casper.then(function () {
    this.evaluateOrDie(function () {
        return /Authorization code received/.test(document.body.innerText);
    }, 'login failed');
});

casper.run(function () {
    this.echo('logged in').exit();
});