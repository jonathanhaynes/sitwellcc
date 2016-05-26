var express = require('express'),
    router = express.Router(),
    PowerHouse = require('powerhouse-js');



var igAPI = function(req, res, next) {

  var ig = require('instagram-node').instagram();

  ig.use({
    client_id: '25f9fc11c5474e69ae6220c1d5095f2d',
    client_secret: '43b4227a99c545dcab7cc0b7a7eaf566',
    access_token: '2399073333.25f9fc1.47ed772a4e2940acbfc7e2c54fc129ef'
  });

  var igMedia = [];

  ig.tag_media_recent('sitwellcc', {'count': 20}, function(err, medias, pagination, remaining, limit) {

    PowerHouse.forEach(medias, function(media, i) {
      igMedia.push({
        'link': media.link, 
        'src': media.images.standard_resolution.url, 
        'caption': media.caption.text
      });
    });

    req.igMedia = igMedia;
    next();
  });
};

var fbAPI = function (req, res, next) {

  var fb = require('fb');

  fb.options({
    appId: '984371968323534',
    version: 'v2.5'
  });

  var dateNow = Math.round(new Date().getTime()/1000.0),
      moment = require('moment'),
      fbMedia = [];

  fb.api(
    '/1076165799068349/',
    'GET',
    {
      "access_token" : "CAANZCRZCVZCr84BAM1q36ZBQOvEujS0Jjq1ZBavTXtIpDjZAQyLYwCZBovmrDHWIUmkGzPJsO5sdsM48HZAvBwebAJqIBhsBeEBnG9LxVHUdvaNVwGhQfXC9WHNbBzQ7GjrmjLrjZCuYYHXxmNXpZBCuB1C0T22WOfEqNqOxHn4rb6rmXZAaWaNjs1HH1PEfnpkSIsZD",
      "fields" : "events.since(" + dateNow + ")"
    },
    function(response) {

      var filteredFbMedia = response.events.data.sort(dynamicSort('start_time'));

      filteredFbMedia.forEach(function(item, i){
        fbMedia.push({
          'title': item.name,
          'description': linkify(item.description),
          'link': 'https://www.facebook.com/events/' + item.id + '/',
          'location': item.place.name,
          'date': moment(item.start_time).format("dddd Do MMMM YYYY")
        });
      });

      req.fbMedia = fbMedia;
      next();
    }
  );

  function dynamicSort(property) {
    var sortOrder = 1;

    if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    return function (a,b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
  }

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
        nice = nice.replace(/^https?:\/\//i,'');
      }
      else
        url = 'http://'+url;


      return '<a target="_blank" href="'+ url +'">'+ nice.replace(/^www./i,'') +'</a>';
    });

    return text;
  }
};

router.get('/', igAPI);
router.get('/', function(req, res, next) {

  res.locals.meta = {
    title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016',
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on a Wednesday evening or Sunday morning. For the good times.'
  };

  res.render('pages/index', {
    instagram: req.igMedia
  });
});

router.get('/about', igAPI);
router.get('/about', function(req, res, next) { 

  res.locals.meta = {
    title: 'About - Sitwell Cycling Club', 
    description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
    name: 'About Sitwell Cycling Club', 
    content: 'about'
  };

  res.render('pages/show', {
     instagram: req.igMedia
  });
  
});

  router.get('/about/committee', function(req, res, next) {
    res.locals.meta = {
      title: 'The Committee - Sitwell Cycling Club',
      description: 'The Sitwell Cycling Club Committee is a group of volunteer members who run the club. They generally meet on the first Monday of every month to discuss matters relating to the club and it\'s membership.',
      name: 'The Committee',
      content: 'committee' 
    };

    res.render('pages/show');
  });

  router.get('/about/supporters', function(req, res, next) {
    res.locals.meta = {
      title: 'Supporters of the club - Sitwell Cycling Club',
      description: '',
      name: 'Supporters of the club',
      content: 'supporters' 
    };

    res.render('pages/show');
  });

  router.get('/about/constitution', function(req, res, next) {
    res.locals.meta = {
      title: 'Rules & Constitution - Sitwell Cycling Club',
      description: '',
      name: 'Sitwell Cycling Club (Sitwell CC) Rules and Constitution 2016',
      content: 'constitution' 
    };

    res.render('pages/show');
  });

router.get('/club-rides', igAPI);
router.get('/club-rides', function(req, res, next) {
  res.locals.meta = {
    title: 'Club Rides - Sitwell Cycling Club',
    description: 'Club rides take place on Wednesday evenings and Sunday mornings. The meeting place is on the corner of Turner Lane and High Street, Whiston.',
    name: 'Club Rides',
    content: 'rides' 
  };

  res.render('pages/show', {
     instagram: req.igMedia
  });
});

  router.get('/club-rides/wednesday-evening', igAPI);
  router.get('/club-rides/wednesday-evening', function(req, res, next) {
    res.locals.meta = {
      title: 'Wednesday Evening - Club Rides - Sitwell Cycling Club',
      description: 'Wednesday evening rides depart from the corner of Turner Lane and High Street, Whiston at 7:30pm prompt.',
      name: 'Club Rides - Wednesday Evening',
      content: 'wednesday' 
    };

    res.render('pages/show', {
       instagram: req.igMedia
    });
  });

  router.get('/club-rides/sunday-morning', fbAPI);
  router.get('/club-rides/sunday-morning', igAPI);
  router.get('/club-rides/sunday-morning', function(req, res, next) {

    res.locals.meta = {
      title: 'Sunday Morning - Club Rides - Sitwell Cycling Club',
      description: 'Sunday morning rides depart from the corner of Turner Lane and High Street, Whiston at 8.00am prompt.',
      name: 'Club Rides - Sunday Morning',
      content: 'sunday'
    };

    res.render('pages/show', {
      facebook: req.fbMedia,
      instagram: req.igMedia
    });

  });

router.get('/kit', igAPI);
router.get('/kit', function(req, res, next) {
  res.locals.meta = {
    title: 'Kit - Sitwell Cycling Club', 
    description: 'Akuma Cycling is our manufacturer of choice. They have a great range of items including casual wear and are very competitive on price. Kit is only available to club members - join us today!', 
    name: 'Kit', 
    content: 'kit' 
  };

  res.render('pages/show', {
     instagram: req.igMedia
  });
});

router.get('/membership', igAPI);
router.get('/membership', function(req, res, next) {
  res.locals.meta = {
    title: 'Membership - Sitwell Cycling Club', 
    description: 'We are always on the look out for new members. If you want to be part of Rotherham\'s newest club please get in touch for details.', 
    name: 'Join us!', 
    content: 'membership' 
  };

  res.render('pages/show', {
     instagram: req.igMedia
  });
});

router.get('/news', function(req, res, next) {
  res.locals.meta = {
    title: 'Club News - Sitwell Cycling Club', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on a Wednesday evening or Sunday morning. For the good times.', 
    name: 'Club News', 
    content: 'news' 
  };

  res.render('pages/show');
});

router.get('/contact', function(req, res, next) {
  res.locals.meta = {
    title: 'Contact - Sitwell Cycling Club', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on a Wednesday evening or Sunday morning. For the good times.', 
    name: 'Contact Sitwell Cycling Club', 
    content: 'contact' 
  };

  res.render('pages/show');
});

router.get('/cookies', function(req, res, next) {
  res.locals.meta = {
    title: 'Cookie Policy - Sitwell Cycling Club', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on a Wednesday evening or Sunday morning. For the good times.', 
    name: 'Cookie Policy', 
    content: 'cookies' 
  };

  res.render('pages/show');
});

module.exports = router;
