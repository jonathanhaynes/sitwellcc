'use strict';

var express = require('express'),
    env = process.env.NODE_ENV,
    connectMincer = require('connect-mincer'),
    Mincer = require('mincer'),
    expressLayouts = require('express-ejs-layouts'),
    autoprefixer = require('autoprefixer'),
    dotenv = require('dotenv').config();

var app = express();

var routes = require('./routes/index');

// set up connect-mincer middleware
var mincer = new connectMincer({
  // you can, optionally, pass in your own required Mincer class, so long as it is >= 0.5.0
  mincer: Mincer,
  root: __dirname,
  production: env === 'production' || env === 'staging',
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

mincer.environment.enable('autoprefixer');

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

app.set('view engine', 'ejs');
app.set('layout', 'layouts/application');

app.use(expressLayouts);

app.use(function(req, res, next) {
  if (req.url.substr(-1) == '/' && req.url.length > 1) {
    var query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

app.use('/', routes);

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.locals.meta = {
      title: '404 Page Not Found - Sitwell Cycling Club', 
      description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
      name: '404 Page Not Found'
    };

    res.render('pages/404', {
      active: '',
      url: req.url
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.use(function(err, req, res, next) {
  res.status(500);

  res.locals.meta = {
    title: '500 Error - Sitwell Cycling Club', 
    description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
    name: '500 Error'
  };

  const error = app.get('env') === 'development' ? err : '';

  res.render('pages/500', {
    active: '',
    error: error,
    url: req.url
  });
  return;
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function() {
  console.info('Express app started on ' + app.get('port'));
});
