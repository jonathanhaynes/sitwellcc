'use strict';

var express = require('express'),
    env = process.env.NODE_ENV,
    connectMincer = require('connect-mincer'),
    Mincer = require('mincer'),
    browserify = require('browserify-middleware');

var app = express();

var routes = require('./routes/index');
var users = require('./routes/users');

//provide browserified versions of all the files in a directory
app.use('/assets/javascripts', browserify(__dirname + '/assets/javascripts/source'));

// set up connect-mincer middleware
var mincer = new connectMincer({
  // you can, optionally, pass in your own required Mincer class, so long as it is >= 0.5.0
  mincer: Mincer,
  root: __dirname,
  production: env === 'production' || env === 'staging',
  // uncomment to have view helpers generate urls of the form: //assets.example.com/assets/...
  // assetHost: '//assets.example.com',
  // you'll probably want to get this from a environment-specific config, e.g:
  // assetHost: config.get('asset_host')
  mountPoint: '/assets',
  manifestFile: __dirname + '/public/assets/manifest.json',
  paths: [
    'assets/images',
    'assets/stylesheets',
    'assets/javascripts',
    'vendor/stylesheets',
    'vendor/javascripts'
  ],
  // precompiling can take a long time: when testing, you may want to turn it off
  precompile: env !== 'test'
});

mincer.environment.registerHelper('version', function() {
  return require(__dirname + 'package.json').version;
});

// the main connectMincer middleware, which sets up a Mincer Environment and provides view helpers
app.use(mincer.assets());

if (env === 'production' || env === 'staging') {
  // in production, use the connect static() middleware to serve resources. In a real deployment
  // you'd probably not want this, and would use nginx (or similar) instead
  app.use(express.static(__dirname + '/public'));
} else {
  // in dev, just use the normal server which recompiles assets as needed
  app.use('/assets', mincer.createServer());
}

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.info('Express app started on ' + app.get('port'));
});
