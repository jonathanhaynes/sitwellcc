var express = require('express'),
    router = express.Router(),
    ig = require('instagram-node').instagram(),
    PowerHouse = require('powerhouse-js'),
    moment = require('moment'),
    FB = require('fb');

ig.use({
  client_id: '25f9fc11c5474e69ae6220c1d5095f2d',
  client_secret: '43b4227a99c545dcab7cc0b7a7eaf566',
  access_token: '2399073333.25f9fc1.47ed772a4e2940acbfc7e2c54fc129ef'
});

router.get('/', function(req, res, next) {

  ig.tag_media_recent('sitwellcc', {'count': 20}, function(err, medias, pagination, remaining, limit) {
    var igMedia = [];

    PowerHouse.forEach(medias, function(media, i) {
      igMedia.push({'link': media.link, 'src': media.images.standard_resolution.url, 'caption': media.caption.text})
    });

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

    var fbMedia = [];

    FB.options({
      appId: '984371968323534',
      version: 'v2.5'
    });

    var dateNow = Math.round(new Date().getTime()/1000.0);

    FB.api(
      '/1076165799068349/',
      'GET',
      {
        "access_token" : "CAANZCRZCVZCr84BAM1q36ZBQOvEujS0Jjq1ZBavTXtIpDjZAQyLYwCZBovmrDHWIUmkGzPJsO5sdsM48HZAvBwebAJqIBhsBeEBnG9LxVHUdvaNVwGhQfXC9WHNbBzQ7GjrmjLrjZCuYYHXxmNXpZBCuB1C0T22WOfEqNqOxHn4rb6rmXZAaWaNjs1HH1PEfnpkSIsZD",
        "fields" : "events.limit(10).since(" + dateNow + ")"
      },
      function(response) {

        response.events.data.forEach(function(item, i){
          fbMedia.push({'title': item.name, 'description': linkify(item.description), 'link': 'https://www.facebook.com/events/' + item.id + '/', location: item.place.name, date: moment(item.start_time).format("dddd Do MMMM YYYY")});
        });

        res.render('pages/show', {
          title: 'Sunday Morning - Club Rides - Sitwell Cycling Club',
          name: 'Club Rides - Sunday Morning',
          content: 'sunday',
          facebook: fbMedia
        });

      }
    );

    function nth(d) {
      if(d>3 && d<21) return 'th'; // thanks kennebec
      switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
      }
    }

    function linkify(text) {
      if( !text ) return text;

      text = text.replace(/((https?\:\/\/|ftp\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,function(url){
        nice = url;
        if( url.match('^https?:\/\/') )
        {
          nice = nice.replace(/^https?:\/\//i,'')
        }
        else
          url = 'http://'+url;


        return '<a target="_blank" href="'+ url +'">'+ nice.replace(/^www./i,'') +'</a>';
      });

      return text;
    }

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
