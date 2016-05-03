PowerHouse.ready(function () {

  /**
   * Attach FastClick to the body
   */
  FastClick.attach(document.body);

  /**
   * Initialise inlineSVG
   */
  loadJS('/assets/libraries/inlineSVG.js', function () {
    inlineSVG.init();
  });

  /**
   * Initialise placeholders for browsers that don't support them.
   */
  if (!Modernizr.placeholder) {
    loadJS('/assets/libraries/placeholders.js');
  }

  /**
   * Initialise LazySizes
   */
  loadJS('/assets/libraries/lazysizes.js');

  /**
   * Initialise Cookie Disclaimer
   */
  CookieDisclaimer.init({
    template: '/assets/templates/cookie-banner.html'
  });

  /**
   * Initialise Picturefill
   */
  picturefill();

});
