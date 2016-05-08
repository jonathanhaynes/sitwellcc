var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('pages/index', { title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016' });
});

router.get('/about', function(req, res, next) {
  res.render('pages/show', { title: 'About - Sitwell Cycling Club', name: 'About Sitwell Cycling Club' });
});

router.get('/about/constitution', function(req, res, next) {
  res.render('pages/show', { title: 'Rules & Constitution - Sitwell Cycling Club', name: 'Rules & Constitution' });
});

router.get('/contact', function(req, res, next) {
  res.render('pages/show', { title: 'Contact - Sitwell Cycling Club', name: 'Contact Sitwell Cycling Club' });
});

router.get('/membership', function(req, res, next) {
  res.render('pages/show', { title: 'Membership - Sitwell Cycling Club', name: 'Join us!' });
});

router.get('/supporters', function(req, res, next) {
  res.render('pages/show', { title: 'Supporters of the club - Sitwell Cycling Club', name: 'Supporters of the club' });
});

module.exports = router;
