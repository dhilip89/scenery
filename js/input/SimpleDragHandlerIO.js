// Copyright 2016, University of Colorado Boulder

/**
 * IO type for SimpleDragHandler
 *
 * @author Sam Reid (PhET Interactive Simulations)
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
   * IO type for phet/tandem's SimpleDragHandler class.
   * @param {SimpleDragHandler} simpleDragHandler
   * @param {string} phetioID
   * @constructor
   */
  function SimpleDragHandlerIO( simpleDragHandler, phetioID ) {
    assert && assertInstanceOf( simpleDragHandler, phet.scenery.SimpleDragHandler );
    ObjectIO.call( this, simpleDragHandler, phetioID );
  }

  phetioInherit( ObjectIO, 'SimpleDragHandlerIO', SimpleDragHandlerIO, {}, {
    documentation: 'Drag listener for objects that can be dragged by the user.',
    events: [ 'dragStarted', 'dragged', 'dragEnded' ]
  } );

  scenery.register( 'SimpleDragHandlerIO', SimpleDragHandlerIO );

  return SimpleDragHandlerIO;
} );

