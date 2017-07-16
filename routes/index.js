const express = require('express'),
    router = express.Router(),
    PowerHouse = require('powerhouse-js'),
    moment = require('moment'),
    sm = require('sitemap');

const igAPI = (req, res, next) => {

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

const fbAPI = (req, res, next) => {

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

      filteredFbMedia.forEach((item, i) => {

        const filteredDisclaimer = removeDisclaimer(item.description);

        fbMedia.push({
          'title': item.name != null ? item.name : '',
          'description': filteredDisclaimer != null ? linkify(filteredDisclaimer).replace(/\n/gi, '<br>') : '',
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

  var removeDisclaimer = (theDescription) => {
    const filtered = theDescription.indexOf('----');
    theDescription = theDescription.substring(0, filtered != -1 ? filtered : theDescription.length);

    return theDescription;
  };

  var dynamicSort = (property) => {
    var sortOrder = 1;

    if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    return (a,b) => {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
  };

  var nth = (d) => {
    if(d>3 && d<21) return 'th'; // thanks kennebec
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  var linkify = (text) => {
    if( !text ) return text;

    text = text.replace(/((https?\:\/\/|ftp\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, (url) => {
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
  };
};

const fbAPISort = (req) => {
  for (var i = req.fbMedia.length -1; i >= 0; i--) {
    if (!req.fbMedia[i].date.day.startsWith(req.weekDay)) {
      req.fbMedia.splice(i, 1);
    }
  }

  return req.fbMedia;
};

const fbDateChange = (req) => {
  for (var i = 0; i < req.fbMedia.length; i++) {
    req.fbMedia[i].date.date = moment(req.fbMedia[i].full_date).format("D");
    req.fbMedia[i].date.month = moment(req.fbMedia[i].full_date).format("MMM");
  }

  return req.fbMedia;
};

const whatDay = (req) => {
  return moment(new Date().getDay()).format('dddd');
};

const whatSundayTime = (req) => {
  const theMonthToday = moment(new Date()).format("MMMM");
  
  var theTime;

  switch (theMonthToday) {
    case 'November':
    case 'December':
    case 'January':
    case 'February':
    case 'March':
      theTime = '9.00';
      break;
    default:
      theTime = '8.00';
  }

  return theTime;
};

const ghostAPI = (req, res, next) => {
  const request = require('request');

  const ghostLimit = res.ghostLimit != null ? res.ghostLimit : 10;

  const options = {
    url: `http://blog.sitwell.cc/ghost/api/v0.1/posts/?limit=${ghostLimit}&client_id=ghost-frontend&client_secret=${process.env.GHOST_CLIENT_SECRET}`,
    headers: {
      'Referer': 'http://www.sitwell.cc'
    }
  };
  
  const ghostMedia = [];

  request(options, (error, response, data) => {    
    if (!error && response.statusCode == 200) {

      // meta: { pagination: { page: 1, limit: 20, pages: 2, total: 35, next: 2, prev: null } } }

      JSON.parse(data).posts.forEach((item, i) => {
        ghostMedia.push({
          'title': item.title,
          'link': `/news/${item.slug}`,
          'image': 'http://blog.sitwell.cc' + item.image,
          'description': item.html,
          'published_at': item.published_at,
          'updated_at': item.updated_at
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

const ghostAPISearch = (req) => {
  const whatPage = (object) => {
    if (('title' in object) && (object.link === `/news/${req.ghostSlug}`)) {
      return object;
    }
  };

  req.ghostMediaPost = req.ghostMedia.filter(whatPage);
  return req.ghostSlug;
};

const twitterAPI = (req, res, next) => {
  const twitterFetcher = require('twitter-fetcher');

  console.log(twitterFetcher);

  const twitterConfig = {
    "profile": {"screenName": 'sitwellcc'},
    "dataOnly": true,
    "customCallback": twitterMediaPopulate
  };

  twitterFetcher.fetch(twitterConfig);

  const twitterMedia = [];

  const twitterMediaPopulate = (item) => {

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

const sitemapAPI = (req, res, next) => {
  const routerStack = router.stack;

  const sitemapData = [],
        filteredSitemapData = [];

  routerStack.forEach((item, i) => {
    sitemapData.push(item.route.path);
  });

  const ghostMedia = req.ghostMedia;

  ghostMedia.forEach((item, i) => {
    sitemapData.push(item.link);
  });

  for(var i = sitemapData.length-1; i--;){
    if (sitemapData[i] === '/sitemap.xml') sitemapData.splice(i, 1);
    if (sitemapData[i] === '/news/:slug') sitemapData.splice(i, 1);
  }

  removeArrayDuplicates(sitemapData).forEach((item, i) => {
    filteredSitemapData.push({
      url: item,
      changefreq: 'monthly'
    });
  });

  const sitemap = sm.createSitemap ({
    hostname: 'http://www.sitwell.cc',
    cacheTime: 600000,
    urls: filteredSitemapData
  });

  req.sitemap = sitemap;
  next();
};

const removeArrayDuplicates = (a) => {
   return Array.from(new Set(a));
};

const members = {
  number : '54',
  date : '15/07/2017'
};

router.get('/', fbAPI);
router.get('/', igAPI);
router.get('/', ghostAPI);
router.get('/', (req, res, next) => {

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
router.get('/about', (req, res, next) => { 

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

  router.get('/about/committee', (req, res, next) => {
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

  router.get('/about/road-captains', fbAPI);
  router.get('/about/road-captains', igAPI);
  router.get('/about/road-captains', function(req, res, next) {
    res.locals.meta = {
      title: 'Road Captains - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Road Captain is the term used to describe our ride leaders. They\'re experienced, fit members of the club with basic first-aid training who are on-hand to provide guidance and assist members and guests when out on the road.',
      name: 'Road Captains',
      content: 'captains' 
    };

    fbDateChange(req);

    res.render('pages/show', {
      active: 'about',
      facebook: req.fbMedia,
      instagram: req.igMedia,
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

  router.get('/about/constitution', (req, res, next) => {
    res.locals.meta = {
      title: 'Constitution - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.', 
      name: 'Sitwell Cycling Club (Sitwell CC, SCC) Constitution',
      content: 'constitution' 
    };

    res.render('pages/show', {
      active: 'about'
    });
  });

router.get('/club-rides', fbAPI);
router.get('/club-rides', igAPI);
router.get('/club-rides', (req, res, next) => {
  res.locals.meta = {
    title: 'Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Club rides take place every Wing it Wednesday™, occasional Saturday mornings and every Sunday Café Run. The meeting place is on the corner of Turner Lane and High Street, Whiston.',
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

  router.get('/club-rides/wing-it-wednesday', fbAPI);
  router.get('/club-rides/wing-it-wednesday', igAPI);
  router.get('/club-rides/wing-it-wednesday', (req, res, next) => {
    res.locals.meta = {
      title: 'Wing it Wednesday™ - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Wing it Wednesday™ rides depart from the corner of Turner Lane and High Street, Whiston at 7:30pm prompt.',
      name: 'Club Rides - Wing it Wednesday™',
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

  router.get('/club-rides/saturday-saunter', fbAPI);
  router.get('/club-rides/saturday-saunter', igAPI);
  router.get('/club-rides/saturday-saunter', (req, res, next) => {
    res.locals.meta = {
      title: 'Saturday Saunter - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Saturday Saunter rides depart from the corner of Turner Lane and High Street, Whiston at 9:00am prompt.',
      name: 'Club Rides - Saturday Saunter',
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

  router.get('/club-rides/sunday-cafe-run', fbAPI);
  router.get('/club-rides/sunday-cafe-run', igAPI);
  router.get('/club-rides/sunday-cafe-run', (req, res, next) => {

    res.locals.meta = {
      title: 'Sunday Café Run - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: `Sunday Café Run rides depart from the corner of Turner Lane and High Street, Whiston at ${whatSundayTime(req)}am prompt.`,
      name: 'Club Rides - Sunday Café Run',
      content: 'sunday'
    };

    req.weekDay = 'Sunday';
    fbAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      facebook: req.fbMedia,
      instagram: req.igMedia,
      time: whatSundayTime(req)
    });

  });

  router.get('/club-rides/sportives-races', fbAPI);
  router.get('/club-rides/sportives-races', igAPI);
  router.get('/club-rides/sportives-races', (req, res, next) => {

    res.locals.meta = {
      title: 'Sportives & Races - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Our members love a good sportive or race as much as the next person.',
      name: 'Sportives & Races',
      content: 'sportives-races'
    };

    fbDateChange(req);

    res.render('pages/show', {
      active: 'club-rides',
      facebook: req.fbMedia,
      instagram: req.igMedia,
    });

  });

router.get('/kit', fbAPI);
router.get('/kit', igAPI);
router.get('/kit', (req, res, next) => {
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
router.get('/membership', (req, res, next) => {
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
  router.get('/membership/discounts', (req, res, next) => {
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
router.get('/news', (req, res, next) => {
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
  router.get('/news/:slug', (req, res, next) => {
    res.ghostLimit = 'all';
    next();
  });
  router.get('/news/:slug', ghostAPI);
  router.get('/news/:slug', (req, res, next) => {
    req.ghostSlug = req.params.slug;
    ghostAPISearch(req);

    fbDateChange(req);

    res.locals.meta = {
      title: `${req.ghostMediaPost[0].title} - Club News - Sitwell Cycling Club, Whiston, Rotherham`, 
      description: req.ghostMediaPost[0].description.split('\n')[0], 
      name: req.ghostMediaPost[0].title, 
      content: 'article' 
    };

    res.render('pages/show', {
      active: 'news',
      facebook: req.fbMedia,
      instagram: req.igMedia,
      ghostMediaPost: req.ghostMediaPost,
      ghostMedia: req.ghostMedia
    });
  });

router.get('/contact', fbAPI);
router.get('/contact', (req, res, next) => {
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

router.get('/cookies', (req, res, next) => {
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

router.get('/thankyou', (req, res, next) => {
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

router.get('/sitemap.xml', (req, res, next) => {
  res.ghostLimit = 'all';
  next();
});
router.get('/sitemap.xml', ghostAPI);
router.get('/sitemap.xml', sitemapAPI);
router.get('/sitemap.xml', (req, res, next) => {
  req.sitemap.toXML( function (err, xml) {
      if (err) {
        return res.status(500).end();
      }
      res.header('Content-Type', 'application/xml');
      res.send( xml );
  });
});

module.exports = router;
