PowerHouse.ready(function () {

  /**
   * Attach FastClick to the body
   */
  FastClick.attach(document.body);

  /**
   * Initialise inlineSVG
   */
  loadJS(inlineSVGSrc, function () {
    inlineSVG.init();
  });

  /**
   * Initialise LazySizes
   */
  loadJS(lazysizesSrc);

  /**
   * Initialise Picturefill
   */
  picturefill();

  document.querySelector('.btn--menu').addEventListener('click', toggleMenu);

});

const toggleMenu = function() {
  document.querySelector('.primary-nav').classList.toggle('is-visible');
};
