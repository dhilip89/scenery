// Copyright 2016, University of Colorado Boulder

/**
 * IO type for Font
 *
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var scenery = require( 'SCENERY/scenery' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );

  /**
   * @constructor
   * IO type for phet/scenery's Font class
   * @param {Font} font - An instance of a phet.scenery.Font type
   * @param {string} phetioID - Full name of this font instance
   */
  function FontIO( font, phetioID ) {
    assert && assertInstanceOf( font, phet.scenery.Font );
    ObjectIO.call( this, font, phetioID );
  }

  phetioInherit( ObjectIO, 'FontIO', FontIO, {}, {

    // Info from Font.js
    documentation: 'Font handling for text drawing. Options: <br>' +
                   'style: normal      // normal | italic | oblique <br>' +
                   'variant: normal    // normal | small-caps <br>' +
                   'weight: normal     // normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 <br>' +
                   'stretch: normal    // normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded <br>' +
                   'size: 10px         // absolute-size | relative-size | length | percentage -- unitless number interpreted as px. absolute suffixes: cm, mm, in, pt, pc, px. relative suffixes: em, ex, ch, rem, vw, vh, vmin, vmax. <br>' +
                   'lineHeight: normal // normal | number | length | percentage -- NOTE: Canvas spec forces line-height to normal <br>' +
                   'family: sans-serif // comma-separated list of families, including generic families (serif, sans-serif, cursive, fantasy, monospace). ideally escape with double-quotes',


    /**
     * Encodes a Font instance to a state.
     * Serialize this font's configuration to an options object
     * @param {Font} instance
     * @returns {Object}
     */
    toStateObject: function( font ) {
      assert && assertInstanceOf( font, phet.scenery.Font );
      return {
        style: font.getStyle(),
        variant: font.getVariant(),
        weight: font.getWeight(),
        stretch: font.getStretch(),
        size: font.getSize(),
        lineHeight: font.getLineHeight(),
        family: font.getFamily()
      };
    },

    /**
     * Decodes a state into a Font.
     * Use stateObject as the Font constructor's options argument
     * @param {Object} stateObject
     * @returns {Font}
     */
    fromStateObject: function( stateObject ) {
      return new phet.scenery.Font( stateObject );
    },
  } );

  scenery.register( 'FontIO', FontIO );

  return FontIO;
} );
