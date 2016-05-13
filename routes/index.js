var express = require('express'),
    router = express.Router(),
    ig = require('instagram-node').instagram(),
    PowerHouse = require('powerhouse-js');


router.get('/', function(req, res, next) {
  ig.use({
    client_id: '25f9fc11c5474e69ae6220c1d5095f2d',
    client_secret: '43b4227a99c545dcab7cc0b7a7eaf566',
    access_token: '2399073333.25f9fc1.47ed772a4e2940acbfc7e2c54fc129ef'
  });

  ig.tag_media_recent('sitwellcc', {'count': 10}, function(err, medias, pagination, remaining, limit) {
    var igMedia = [];

    PowerHouse.forEach(medias, function(media, i) {
      igMedia.push({'link': media.link, 'src': media.images.standard_resolution.url, 'caption': media.caption.text})
    });

    console.log(igMedia);

    res.render('pages/index', {
      title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016',
      instagram: igMedia
    });

  });
});

router.get('/about', function(req, res, next) {
  res.render('pages/show', { title: 'About - Sitwell Cycling Club', name: 'About Sitwell Cycling Club', content: 'about' });
});

  router.get('/about/committee', function(req, res, next) {
    res.render('pages/show', { title: 'The Committee - Sitwell Cycling Club', name: 'The Committee', content: 'committee' });
  });

  router.get('/about/supporters', function(req, res, next) {
    res.render('pages/show', { title: 'Supporters of the club - Sitwell Cycling Club', name: 'Supporters of the club', content: 'supporters' });
  });

  router.get('/about/constitution', function(req, res, next) {
    res.render('pages/show', { title: 'Rules & Constitution - Sitwell Cycling Club', name: 'Sitwell Cycling Club (Sitwell CC) Rules and Constitution 2016', content: 'constitution' });
  });

router.get('/club-rides', function(req, res, next) {
  res.render('pages/show', { title: 'Club Rides - Sitwell Cycling Club', name: 'Club Rides', content: 'rides' });
});

  router.get('/club-rides/wednesday-evening', function(req, res, next) {
    res.render('pages/show', { title: 'Wednesday Evening - Club Rides - Sitwell Cycling Club', name: 'Club Rides - Wednesday Evening', content: 'wednesday' });
  });

  router.get('/club-rides/sunday-morning', function(req, res, next) {
    res.render('pages/show', { title: 'Sunday Morning - Club Rides - Sitwell Cycling Club', name: 'Club Rides - Sunday Morning', content: 'sunday' });
  });

router.get('/kit', function(req, res, next) {
  res.render('pages/show', { title: 'Kit - Sitwell Cycling Club', name: 'Kit', content: 'kit' });
});

router.get('/membership', function(req, res, next) {
  res.render('pages/show', { title: 'Membership - Sitwell Cycling Club', name: 'Join us!', content: 'membership' });
});

router.get('/news', function(req, res, next) {
  res.render('pages/show', { title: 'Club News - Sitwell Cycling Club', name: 'Club News', content: 'news' });
});

router.get('/contact', function(req, res, next) {
  res.render('pages/show', { title: 'Contact - Sitwell Cycling Club', name: 'Contact Sitwell Cycling Club', content: 'contact' });
});

module.exports = router;
