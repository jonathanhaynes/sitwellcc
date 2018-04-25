const express = require('express'),
    router = express.Router(),
    PowerHouse = require('powerhouse-js'),
    moment = require('moment'),
    sm = require('sitemap')
    crypto = require('crypto');

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

const ebAPI = (req, res, next) => {

  const request = require('request');
  const ebMedia = [];

  const options = {
    url: `https://www.eventbriteapi.com/v3/organizers/${process.env.EB_ORGANIZER_ID}/events/?status=live`,
    headers: {
      'Authorization': `Bearer ${process.env.EB_ACCESS_TOKEN}`,
    }
  };

  request(options, (error, response, data) => {
    if (!error && response.statusCode == 200) {
      console.log(JSON.parse(data).events[0]);

      JSON.parse(data).events.forEach((item, i) => {
        const filteredDrescription = removeDisclaimer(item.description.text);

        ebMedia.push({
          'id': item.id,
          'title': item.name.html != null ? item.name.html : '',
          'description': filteredDrescription != null ? filteredDrescription : '',
          'full_date': item.start.local != null ? item.start.local : '',
          'date': item.start.local != null ? {day: moment(item.start.local).format("dddd"), date: moment(item.start.local).format("Do"), month: moment(item.start.local).format("MMMM"), year: moment(item.start.local).format("YYYY")} : '',
          'time': item.start.local != null ? moment(item.start.local).format("h:mma") : ''
        });
      });

      req.ebMedia = ebMedia;
      next();
    }
  });

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
};

const ebAPISort = (req) => {
  for (var i = req.ebMedia.length -1; i >= 0; i--) {
    if (!req.ebMedia[i].date.day.startsWith(req.weekDay)) {
      req.ebMedia.splice(i, 1);
    }
  }

  return req.fbMedia;
};

const ebDateChange = (req) => {
  for (var i = 0; i < req.ebMedia.length; i++) {
    req.ebMedia[i].date.date = moment(req.ebMedia[i].full_date).format("D");
    req.ebMedia[i].date.month = moment(req.ebMedia[i].full_date).format("MMM");
  }

  return req.ebMedia;
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
      theTime = {
        'a' : '9.00',
        'b' : '9.30'
      };
      break;
    default:
      theTime = {
        'a': '8.00',
        'b': '8.30'
      };
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
  number : '63',
  date : '01/02/2018'
};

router.get('/', ebAPI);
router.get('/', igAPI);
router.get('/', ghostAPI);
router.get('/', (req, res, next) => {

  res.locals.meta = {
    title: 'Sitwell Cycling Club, Whiston, Rotherham - Founded 2016',
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!'
  };

  res.render('pages/index', {
    active: 'home',
    eventbrite: req.ebMedia,
    instagram: req.igMedia,
    ghost: req.ghostMedia,
    members: members
  });
});

router.get('/about', ebAPI);
router.get('/about', igAPI);
router.get('/about', (req, res, next) => {

  res.locals.meta = {
    title: 'About - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Rotherham\'s newest cycle club serving Whiston, Rotherham and the surrounding areas. We\'re a not-for-profit, volunteer run organisation registered to British Cycling.',
    name: 'Sitwell Cycling Club, Whiston, Rotherham',
    content: 'about'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'about',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
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

  router.get('/about/welfare', (req, res, next) => {
    res.locals.meta = {
      title: 'Welfare and Safeguarding - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'The welfare and safeguarding of our members is something we take very seriously at Sitwell Cycling Club.',
      name: 'Welfare and Safeguarding',
      content: 'welfare'
    };

    res.render('pages/show', {
      active: 'about'
    });
  });

  router.get('/about/road-captains', ebAPI);
  router.get('/about/road-captains', igAPI);
  router.get('/about/road-captains', function(req, res, next) {
    res.locals.meta = {
      title: 'Road Captains - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Road Captain is the term used to describe our ride leaders. They\'re experienced, fit members of the club with basic first-aid training who are on-hand to provide guidance and assist members and guests when out on the road.',
      name: 'Road Captains',
      content: 'captains'
    };

    ebDateChange(req);

    res.render('pages/show', {
      active: 'about',
      eventbrite: req.ebMedia,
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

router.get('/club-rides', ebAPI);
router.get('/club-rides', igAPI);
router.get('/club-rides', (req, res, next) => {
  res.locals.meta = {
    title: 'Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Club rides take place every Wednesday evening, occasional Saturday mornings and every Sunday morning. The meeting place is on the corner of Turner Lane and High Street, Whiston.',
    name: 'Club Rides',
    content: 'rides'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'club-rides',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
  });
});

router.get('/club-rides/chaingang-tuesday', ebAPI);
router.get('/club-rides/chaingang-tuesday', igAPI);
router.get('/club-rides/chaingang-tuesday', (req, res, next) => {
  res.locals.meta = {
    title: 'Chaingang Tuesday - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Chaingang Tuesday rides depart from the corner of Europa Court and Europa Link, Tinsley at 7:30pm prompt.',
    name: 'Club Rides - Chaingang Tuesday',
    content: 'tuesday'
  };

  req.weekDay = 'Tuesday';
  ebAPISort(req);

  res.render('pages/show', {
    active: 'club-rides',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
  });
});

  router.get('/club-rides/wing-it-wednesday', ebAPI);
  router.get('/club-rides/wing-it-wednesday', igAPI);
  router.get('/club-rides/wing-it-wednesday', (req, res, next) => {
    res.locals.meta = {
      title: 'Wing it Wednesday™ - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Wing it Wednesday™ rides depart from the corner of Turner Lane and High Street, Whiston at 7:30pm prompt.',
      name: 'Club Rides - Wing it Wednesday™',
      content: 'wednesday'
    };

    req.weekDay = 'Wednesday';
    ebAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      eventbrite: req.ebMedia,
      instagram: req.igMedia
    });
  });

  router.get('/club-rides/saturday-saunter', ebAPI);
  router.get('/club-rides/saturday-saunter', igAPI);
  router.get('/club-rides/saturday-saunter', (req, res, next) => {
    res.locals.meta = {
      title: 'Saturday Saunter - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Saturday Saunter rides depart from the corner of Turner Lane and High Street, Whiston at 9:00am prompt.',
      name: 'Club Rides - Saturday Saunter',
      content: 'saturday'
    };

    req.weekDay = 'Saturday';
    ebAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      eventbrite: req.ebMedia,
      instagram: req.igMedia
    });
  });

  router.get('/club-rides/sunday-cafe-run', ebAPI);
  router.get('/club-rides/sunday-cafe-run', igAPI);
  router.get('/club-rides/sunday-cafe-run', (req, res, next) => {

    res.locals.meta = {
      title: 'Sunday Café Run - Club Rides - Sitwell Cycling Club, Whiston, Rotherham',
      description: `Sunday Café Run rides depart from the corner of Turner Lane and High Street, Whiston at ${whatSundayTime(req)}am prompt.`,
      name: 'Club Rides - Sunday Café Run',
      content: 'sunday'
    };

    req.weekDay = 'Sunday';
    ebAPISort(req);

    res.render('pages/show', {
      active: 'club-rides',
      eventbrite: req.ebMedia,
      instagram: req.igMedia,
      time: whatSundayTime(req)
    });

  });

  router.get('/club-rides/sportives-races', ebAPI);
  router.get('/club-rides/sportives-races', igAPI);
  router.get('/club-rides/sportives-races', (req, res, next) => {

    res.locals.meta = {
      title: 'Sportives & Races - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'Our members love a good sportive or race as much as the next person.',
      name: 'Sportives & Races',
      content: 'sportives-races'
    };

    ebDateChange(req);

    res.render('pages/show', {
      active: 'club-rides',
      eventbrite: req.ebMedia,
      instagram: req.igMedia,
    });

  });

router.get('/kit', ebAPI);
router.get('/kit', igAPI);
router.get('/kit', (req, res, next) => {
  res.locals.meta = {
    title: 'Kit - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Akuma Cycling is our manufacturer of choice. They have a great range of items including casual wear and are very competitive on price. Kit is only available to club members - join us today!',
    name: 'Kit',
    content: 'kit'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'kit',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
  });
});

router.get('/membership', ebAPI);
router.get('/membership', igAPI);
router.get('/membership', (req, res, next) => {
  res.locals.meta = {
    title: 'Membership - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'We are always on the look out for new members. If you want to be part of Rotherham\'s newest club please get in touch for details.',
    name: 'Join us!',
    content: 'membership'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'membership',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
  });
});

router.get('/membership/juniors', ebAPI);
router.get('/membership/juniors', igAPI);
router.get('/membership/juniors', (req, res, next) => {
  res.locals.meta = {
    title: 'Juniors - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'We are always on the look out for new members. If you want to be part of Rotherham\'s newest club please get in touch for details.',
    name: 'Juniors',
    content: 'juniors'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'membership',
    eventbrite: req.ebMedia,
    instagram: req.igMedia
  });
});

  router.get('/membership/discounts', ebAPI);
  router.get('/membership/discounts', igAPI);
  router.get('/membership/discounts', (req, res, next) => {
    res.locals.meta = {
      title: 'Discounts - Sitwell Cycling Club, Whiston, Rotherham',
      description: 'One of the benefits of joining Sitwell Cycling Club is the great discounts we have to offer.',
      name: 'Discounts for club members',
      content: 'discounts'
    };

    ebDateChange(req);

    res.render('pages/show', {
      active: 'membership',
      eventbrite: req.ebMedia,
      instagram: req.igMedia
    });
  });

router.get('/news', ebAPI);
router.get('/news', ghostAPI);
router.get('/news', (req, res, next) => {
  res.locals.meta = {
    title: 'Club News - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!',
    name: 'Club News',
    content: 'news'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'news',
    eventbrite: req.ebMedia,
    ghostMedia: req.ghostMedia,
    ghostMeta: req.ghostMeta
  });
});

  router.get('/news/:slug', ebAPI);
  router.get('/news/:slug', igAPI);
  router.get('/news/:slug', (req, res, next) => {
    res.ghostLimit = 'all';
    next();
  });
  router.get('/news/:slug', ghostAPI);
  router.get('/news/:slug', (req, res, next) => {
    req.ghostSlug = req.params.slug;
    ghostAPISearch(req);

    ebDateChange(req);

    res.locals.meta = {
      title: `${req.ghostMediaPost[0].title} - Club News - Sitwell Cycling Club, Whiston, Rotherham`,
      description: req.ghostMediaPost[0].description.split('\n')[0],
      name: req.ghostMediaPost[0].title,
      content: 'article'
    };

    res.render('pages/show', {
      active: 'news',
      eventbrite: req.ebMedia,
      instagram: req.igMedia,
      ghostMediaPost: req.ghostMediaPost,
      ghostMedia: req.ghostMedia
    });
  });

router.get('/contact', ebAPI);
router.get('/contact', (req, res, next) => {
  res.locals.meta = {
    title: 'Contact - Sitwell Cycling Club, Whiston, Rotherham',
    description: 'Founded January 2016. Rotherham\'s newest cycling club serving Whiston and the surrounding areas. Come and join us for a club ride on Wednesday evenings, Saturday mornings or Sunday mornings. Show us your stripes!',
    name: 'Contact Sitwell Cycling Club',
    content: 'contact'
  };

  ebDateChange(req);

  res.render('pages/show', {
    active: 'contact',
    eventbrite: req.ebMedia
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
