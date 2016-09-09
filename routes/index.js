const express = require('express'),
    router = express.Router(),
    PowerHouse = require('powerhouse-js'),
    moment = require('moment');

const igAPI = function(req, res, next) {

  const ig = require('instagram-node').instagram();

  ig.use({
    client_id: process.env.IG_CLIENT_ID,
    client_secret: process.env.IG_CLIENT_SECRET,
    access_token: process.env.IG_ACCESS_TOKEN
  });

  const igMedia = [];

  ig.tag_media_recent('sitwellcc', {'count': 7}, function(err, medias, pagination, remaining, limit) {

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

const fbAPI = function (req, res, next) {

  const fb = require('fb');

  fb.options({
    appId: process.env.FB_APP_ID,
    version: 'v2.5'
  });

  const dateNow = Math.round(new Date().getTime()/1000.0),
      fbMedia = [];

  fb.api(
    '/1076165799068349/',
    'GET',
    {
      "access_token" : process.env.FB_ACCESS_TOKEN,
      "fields" : "events.since(" + dateNow + ")"
    },
    function(response) {

      var filteredFbMedia = response.events.data.sort(dynamicSort('start_time'));

      filteredFbMedia.forEach(function(item, i){
        fbMedia.push({
          'title': item.name != null ? item.name : '',
          'description': item.description != null ? linkify(item.description).replace(/\n/gi, '<br>') : '',
          'link': item.id != null ? 'https://www.facebook.com/events/' + item.id + '/' : '',
          'location': item.place != null ? item.place.name : '',
          'full_date': item.start_time != null ? item.start_time : '',
          'date': item.start_time != null ? {day: moment(item.start_time).format("dddd"), date: moment(item.start_time).format("Do"), month: moment(item.start_time).format("MMMM"), year: moment(item.start_time).format("YYYY")} : '',
          'time': item.start_time != null ? moment(item.start_time).format("h:mma") : ''
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

const fbAPISort = function(req) {
  for (var i = req.fbMedia.length -1; i >= 0; i--) {
    if (!req.fbMedia[i].date.day.startsWith(req.weekDay)) {
      req.fbMedia.splice(i, 1);
    }
  }

  return req.fbMedia;
};

const fbDateChange = function(req) {
  for (var i = 0; i < req.fbMedia.length; i++) {
    req.fbMedia[i].date.date = moment(req.fbMedia[i].full_date).format("D");
    req.fbMedia[i].date.month = moment(req.fbMedia[i].full_date).format("MMM");
  }

  return req.fbMedia;
};

const whatDay = function(req) {
  
  const theDayToday = new Date().getDay();

  var dayofTheWeek;    

  switch(theDayToday) {
    case 0:
      dayofTheWeek = "Sunday";
      break;
    case 1:
      dayofTheWeek = "Monday";
      break;
    case 2:
      dayofTheWeek = "Tuesday";
      break;
    case 3:
      dayofTheWeek = "Wednesday";
      break;
    case 4:
      dayofTheWeek = "Thursday";
      break;
    case 5:
      dayofTheWeek = "Friday";
      break;
    case 6:
      dayofTheWeek = "Saturday";
      break;
    default:
      dayofTheWeek = "Invalid day";
  }
  return dayofTheWeek;
};

const ghostAPI = function(req, res, next) {
  const request = require('request');

  var options = {
    url: `http://blog.sitwell.cc/ghost/api/v0.1/posts/?limit=10&client_id=ghost-frontend&client_secret=${process.env.GHOST_CLIENT_SECRET}`,
    headers: {
      'Referer': 'http://www.sitwell.cc'
    }
  };
  
  const ghostMedia = [];

  request(options, function (error, response, data) {    
    if (!error && response.statusCode == 200) {

      // meta: { pagination: { page: 1, limit: 20, pages: 2, total: 35, next: 2, prev: null } } }

      JSON.parse(data).posts.forEach(function(item, i) {
        ghostMedia.push({
          'title': item.title,
          'link': `/news/${item.slug}`,
          'image': 'http://www.sitwell.cc/' + item.image,
          'description': item.html
        });
      });
      
      req.ghostMedia = ghostMedia;
      req.ghostMeta = {
        'page': JSON.parse(data).meta.pagination.page,
        'next': JSON.parse(data).meta.pagination.next,
        'prev': JSON.parse(data).meta.pagination.prev
      };
      next();
    }
  });
};

const ghostAPISearch = function(req) {
  function whatPage(object) {
    if (('title' in object) && (object.link === `/news/${req.ghostSlug}`)) {
      return object;
    }
  }

  req.ghostMedia = req.ghostMedia.filter(whatPage);
  return req.ghostSlug;
};

const twitterAPI = function(req, res, next) {
  const twitterFetcher = require('twitter-fetcher');

  console.log(twitterFetcher);

  const twitterConfig = {
    "profile": {"screenName": 'sitwellcc'},
    "dataOnly": true,
    "customCallback": twitterMediaPopulate
  };

  twitterFetcher.fetch(twitterConfig);

  const twitterMedia = [];

  function twitterMediaPopulate(item) {

    console.log(item);

    // twitterMedia.push({
    //   'content': item[0].tweet,
    //   'link': item[0].permalinkURL,
    //   'image': item[0].image != null ? item[0].image : '',
    //   'author': item[0].author,
    //   'time': item[0].time
    // });

    // req.twitterMedia = twitterMedia;
    next();
  };
};

const members = {
  number : '27',
  date : '01/09/2016'
};

router.get('/', fbAPI);
router.get('/', igAPI);
router.get('/', ghostAPI);
router.get('/', function(req, res, next) {

  res.locals.meta = {
    title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016',
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!'
  };

  fbDateChange(req);

  res.render('pages/index', {
    active: 'home',
    facebook: req.fbMedia,
    instagram: req.igMedia,
    ghost: req.ghostMedia,
    members: members
  });
});

router.get('/about', fbAPI);
router.get('/about', igAPI);
router.get('/about', function(req, res, next) { 

  res.locals.meta = {
    title: 'About - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
    name: 'Sitwell Cycling Club, Whiston, Rotherham', 
    content: 'about'
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'about',
    facebook: req.fbMedia,
    instagram: req.igMedia,
    members: members
  });
  
});

  router.get('/about/committee', function(req, res, next) {
    res.locals.meta = {
      title: 'The Committee - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'The Sitwell Cycling Club Committee is a group of volunteer members who run the club. They generally meet on the first Monday of every month to discuss matters relating to the club and it\'s membership.',
      name: 'The Committee',
      content: 'committee' 
    };

    res.render('pages/show', {
      active: 'about'
    });
  });

  router.get('/about/sponsors', function(req, res, next) {
    res.locals.meta = {
      title: 'Sponsorship FAQs - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
      name: 'Sponsorship FAQs',
      content: 'sponsors' 
    };

    res.render('pages/show', {
      active: 'about',
      members: members
    });
  });

  router.get('/about/constitution', function(req, res, next) {
    res.locals.meta = {
      title: 'Rules & Constitution - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
      name: 'Sitwell Cycling Club (Sitwell CC) Rules and Constitution',
      content: 'constitution' 
    };

    res.render('pages/show', {
      active: 'about'
    });
  });

router.get('/club-rides', fbAPI);
router.get('/club-rides', igAPI);
router.get('/club-rides', function(req, res, next) {
  res.locals.meta = {
    title: 'Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Club rides take place every Wednesday evening, occasional Saturday mornings and every Sunday morning. The meeting place is on the corner of Turner Lane and High Street, Whiston.',
    name: 'Club Rides',
    content: 'rides' 
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'club-rides',
    facebook: req.fbMedia,
    instagram: req.igMedia
  });
});

  router.get('/club-rides/wednesday-evening', fbAPI);
  router.get('/club-rides/wednesday-evening', igAPI);
  router.get('/club-rides/wednesday-evening', function(req, res, next) {
    res.locals.meta = {
      title: 'Wednesday Evening - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Wednesday evening rides depart from the corner of Turner Lane and High Street, Whiston at 7:30pm prompt.',
      name: 'Club Rides - Wednesday Evening',
      content: 'wednesday' 
    };

    req.weekDay = 'Wednesday';
    fbAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      facebook: req.fbMedia,
      instagram: req.igMedia
    });
  });

  router.get('/club-rides/saturday-morning', fbAPI);
  router.get('/club-rides/saturday-morning', igAPI);
  router.get('/club-rides/saturday-morning', function(req, res, next) {
    res.locals.meta = {
      title: 'Saturday Morning - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Saturday morning rides depart from the corner of Turner Lane and High Street, Whiston at 9:30am prompt.',
      name: 'Club Rides - Saturday Morning',
      content: 'saturday' 
    };

    req.weekDay = 'Saturday';
    fbAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      facebook: req.fbMedia,
      instagram: req.igMedia
    });
  });

  router.get('/club-rides/sunday-morning', fbAPI);
  router.get('/club-rides/sunday-morning', igAPI);
  router.get('/club-rides/sunday-morning', function(req, res, next) {

    res.locals.meta = {
      title: 'Sunday Morning - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Sunday morning rides depart from the corner of Turner Lane and High Street, Whiston at 8.00am prompt.',
      name: 'Club Rides - Sunday Morning',
      content: 'sunday'
    };

    req.weekDay = 'Sunday';
    fbAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      facebook: req.fbMedia,
      instagram: req.igMedia
    });

  });

router.get('/kit', fbAPI);
router.get('/kit', igAPI);
router.get('/kit', function(req, res, next) {
  res.locals.meta = {
    title: 'Kit - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Akuma Cycling is our manufacturer of choice. They have a great range of items including casual wear and are very competitive on price. Kit is only available to club members - join us today!', 
    name: 'Kit', 
    content: 'kit' 
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'kit',
    facebook: req.fbMedia,
    instagram: req.igMedia
  });
});

router.get('/membership', fbAPI);
router.get('/membership', igAPI);
router.get('/membership', function(req, res, next) {
  res.locals.meta = {
    title: 'Membership - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'We are always on the look out for new members. If you want to be part of Rotherham\'s newest club please get in touch for details.', 
    name: 'Join us!', 
    content: 'membership' 
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'membership',
    facebook: req.fbMedia,
    instagram: req.igMedia
  });
});

  router.get('/membership/discounts', fbAPI);
  router.get('/membership/discounts', igAPI);
  router.get('/membership/discounts', function(req, res, next) {
    res.locals.meta = {
      title: 'Discounts - Sitwell Cycling Club, Whiston, Rotherham', 
      description: 'One of the benefits of joining Sitwell Cycling Club is the great discounts we have to offer.', 
      name: 'Discounts for club members', 
      content: 'discounts' 
    };

    fbDateChange(req);

    res.render('pages/show', {
      active: 'membership',
      facebook: req.fbMedia,
      instagram: req.igMedia
    });
  });

router.get('/news', fbAPI);
router.get('/news', ghostAPI);
router.get('/news', function(req, res, next) {
  res.locals.meta = {
    title: 'Club News - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!', 
    name: 'Club News', 
    content: 'news' 
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'news',
    facebook: req.fbMedia,
    ghostMedia: req.ghostMedia,
    ghostMeta: req.ghostMeta
  });
});

  router.get('/news/:slug', fbAPI);
  router.get('/news/:slug', igAPI);
  router.get('/news/:slug', ghostAPI);
  router.get('/news/:slug', function(req, res, next) {
    req.ghostSlug = req.params.slug;
    ghostAPISearch(req);

    fbDateChange(req);

    res.locals.meta = {
      title: `${req.ghostMedia[0].title} - Club News - Sitwell Cycling Club, Whiston, Rotherham`, 
      description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!', 
      name: req.ghostMedia[0].title, 
      content: 'article' 
    };

    res.render('pages/show', {
      active: 'news',
      facebook: req.fbMedia,
      instagram: req.igMedia,
      ghost: req.ghostMedia
    });
  });

router.get('/contact', fbAPI);
router.get('/contact', function(req, res, next) {
  res.locals.meta = {
    title: 'Contact - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!', 
    name: 'Contact Sitwell Cycling Club', 
    content: 'contact' 
  };

  fbDateChange(req);

  res.render('pages/show', {
    active: 'contact',
    facebook: req.fbMedia
  });
});

router.get('/cookies', function(req, res, next) {
  res.locals.meta = {
    title: 'Cookie Policy - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!', 
    name: 'Cookie Policy', 
    content: 'cookies' 
  };

  res.render('pages/show', {
    active: ''
  });
});

router.get('/thankyou', function(req, res, next) {
  res.locals.meta = {
    title: 'Thankyou - Sitwell Cycling Club, Whiston, Rotherham', 
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!', 
    name: 'Thankyou', 
    content: 'thankyou' 
  };

  res.render('pages/show', {
    active: ''
  });
});

module.exports = router;
