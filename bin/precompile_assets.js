var Mincer = require('mincer');

var env = new Mincer.Environment('./');
env.appendPath('assets/downloads');
env.appendPath('assets/images');
env.appendPath('assets/stylesheets');
env.appendPath('assets/javascripts');
env.appendPath('vendor/stylesheets');
env.appendPath('vendor/javascripts');

var manifest = new Mincer.Manifest(env, './build/assets');
manifest.compile(['*', '*/**'], function(err, data) {
  console.info('Finished precompile:');
  console.dir(data);
});