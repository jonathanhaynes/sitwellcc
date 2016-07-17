'use strict';

var express = require('express'),
    env = process.env.NODE_ENV,
    connectMincer = require('connect-mincer'),
    Mincer = require('mincer'),
    expressLayouts = require('express-ejs-layouts'),
    autoprefixer = require('autoprefixer'),
    ghost = require('ghost');

// var api = require('instagram-node').instagram();

var app = express();

ghost().then(function (ghostServer) { 
  app.use(ghostServer.config.paths.subdir, ghostServer.rootApp);
  ghostServer.start(app);
}); - See more at: http://blog.codeply.com/2015/03/26/ghost-blog-on-node-express-4/#sthash.jL6b0kSK.dpuf

var routes = require('./routes/index');

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
    'assets/downloads',
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

mincer.environment.enable('autoprefixer')

// the main connectMincer middleware, which sets up a Mincer Environment and provides view helpers
app.use(mincer.assets());

if (env === 'production' || env === 'staging') {
  // in production, use the connect static() middleware to serve resources. In a real deployment
  // you'd probably not want this, and would use nginx (or similar) instead
  app.use(express.static(__dirname + '/public'));

} else {
  // in dev, just use the normal server which recompiles assets as needed
  // app.use('/assets/stylesheets', postcssMiddleware({
  //   plugins: [autoprefixer({ browsers: ['last 2 versions'] })]
  // }));
  app.use('/assets', mincer.createServer());
}

app.set('view engine', 'ejs');
app.set('layout', 'layouts/application');

app.use(expressLayouts);

app.use('/', routes);

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
    if (err.status === 404) {
      res.status(404);
      res.render('pages/error', { title: '404 Page Not Found - Sitwell Cycling Club', name: '404 Page Not Found', message: err.message, error: err });
    } else {
      res.status(500);
      res.render('pages/error', { title: '500 Error - Sitwell Cycling Club', name: '500 Error', message: err.message, error: err });
    }
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  if (err.status === 404) {
      res.status(404);
      res.render('pages/error', { title: '404 Page Not Found - Sitwell Cycling Club', name: '404 Page Not Found', message: err.message, error: err });
    } else {
      res.status(500);
      res.render('pages/error', { title: '500 Error - Sitwell Cycling Club', name: '500 Error', message: err.message, error: err });
    }
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function() {
  console.info('Express app started on ' + app.get('port'));
});
