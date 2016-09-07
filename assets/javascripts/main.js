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

});
