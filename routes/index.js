var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('pages/index', { title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016' });
});

module.exports = router;
