'use strict';

var Mincer = require('mincer'),
    child_process = require('child_process'),
    fs = require('fs'),
    async = require('async'),
    wrench = require('wrench');

// remove existing manifest/assets if it exists
if (fs.existsSync('./public/assets')) {
  wrench.rmdirSyncRecursive('./public/assets');
}

var env = new Mincer.Environment('./');

child_process.exec('node-sass assets/stylesheets/main.scss --output-style compressed assets/compiled-stylesheets/main.css', function(err, stdout, stderr) {
  if (err) console.log(err);

  env.appendPath('assets/downloads');
  env.appendPath('assets/images');
  env.appendPath('assets/compiled-stylesheets');
  env.appendPath('assets/javascripts');
  env.appendPath('vendor/stylesheets');
  env.appendPath('vendor/javascripts');

  var manifest = new Mincer.Manifest(env, './public/assets');

  manifest.compile(['*', '*/**'], function(err, data) {
    if (err) console.log(err);
    console.info('Finished precompile:');
    console.dir(data);
  });

  child_process.exec('node-sass assets/stylesheets/print.scss --output-style compressed assets/compiled-stylesheets/print.css', function(err, stdout, stderr) {
    if (err) console.log(err);

    child_process.exec('rm -rf assets/compiled-stylesheets/', function(err, stdout, stderr) {
      if (err) console.log(err);
    });
  });
});