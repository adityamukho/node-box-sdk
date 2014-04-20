var express = require('express'),
  passport = require('passport'),
  util = require('util'),
  BoxStrategy = require('passport-box').Strategy,
  box_sdk = require('../../..');

var BOX_CLIENT_ID = process.env.ICT_CLIENT_ID;
var BOX_CLIENT_SECRET = process.env.ICT_CLIENT_SECRET;
var PORT = parseInt(process.env.ICT_PORT);

var box = box_sdk.Box();

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new BoxStrategy({
  clientID: BOX_CLIENT_ID,
  clientSecret: BOX_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:" + PORT + "/auth/box/callback"
}, box.authenticate()));

var app = express();

// configure Express
app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({
    secret: 'keyboard cat'
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function (req, res) {
  res.render('index', req.user);
});

app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', {
    user: req.user
  });
});

app.get('/login', function (req, res) {
  res.render('login', {
    user: req.user
  });
});

app.get('/auth/box',
  passport.authenticate('box'),
  function (req, res) {
    // The request will be redirected to Box for authentication, so this
    // function will not be called.
  });

app.get('/auth/box/callback',
  passport.authenticate('box', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    res.redirect('/');
  });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(PORT);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}