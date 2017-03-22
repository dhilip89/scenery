// Copyright 2016, University of Colorado Boulder

/**
 * Wrapper type for SCENERY ButtonListener (not SUN ButtonListener)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var scenery = require( 'SCENERY/scenery' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'ifphetio!PHET_IO/events/toEventOnEmit' );

  /**
   * @param {ButtonListener} buttonListener
   * @param {string} phetioID
   * @constructor
   */
  function TButtonListener( buttonListener, phetioID ) {
    TObject.call( this, buttonListener, phetioID );
    assertInstanceOf( buttonListener, phet.scenery.ButtonListener );

    toEventOnEmit( buttonListener.callbackEmitters.up.startedEmitter, buttonListener.callbackEmitters.up.endedEmitter, 'user', phetioID, TButtonListener, 'up' );
    toEventOnEmit( buttonListener.callbackEmitters.over.startedEmitter, buttonListener.callbackEmitters.over.endedEmitter, 'user', phetioID, TButtonListener, 'over' );
    toEventOnEmit( buttonListener.callbackEmitters.down.startedEmitter, buttonListener.callbackEmitters.down.endedEmitter, 'user', phetioID, TButtonListener, 'down' );
    toEventOnEmit( buttonListener.callbackEmitters.out.startedEmitter, buttonListener.callbackEmitters.out.endedEmitter, 'user', phetioID, TButtonListener, 'out' );
    toEventOnEmit( buttonListener.startedCallbacksForFireEmitter, buttonListener.endedCallbacksForFireEmitter, 'user', phetioID, TButtonListener, 'fire' );
  }

  phetioInherit( TObject, 'TButtonListener', TButtonListener, {}, {
    documentation: 'Button listener',
    events: [ 'up', 'over', 'down', 'out', 'fire' ]
  } );

  scenery.register( 'TButtonListener', TButtonListener );

  return TButtonListener;
} );