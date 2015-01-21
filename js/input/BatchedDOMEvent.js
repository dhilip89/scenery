// Copyright 2002-2014, University of Colorado Boulder


/**
 * Pooled structure to record batched events efficiently. How it calls the callback is based on the type
 * (pointer/mspointer/touch/mouse). There is one BatchedDOMEvent for each DOM Event (not for each touch).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var PoolableMixin = require( 'PHET_CORE/PoolableMixin' );
  var scenery = require( 'SCENERY/scenery' );

  scenery.BatchedDOMEvent = function BatchedDOMEvent( domEvent, type, callback ) {
    assert && assert( domEvent, 'for some reason, there is no DOM event?' );

    // called multiple times due to pooling, this should be re-entrant
    this.domEvent = domEvent;
    this.type = type;
    this.callback = callback;
  };
  var BatchedDOMEvent = scenery.BatchedDOMEvent;

  // enum for type
  BatchedDOMEvent.POINTER_TYPE = 1;
  BatchedDOMEvent.MS_POINTER_TYPE = 2;
  BatchedDOMEvent.TOUCH_TYPE = 3;
  BatchedDOMEvent.MOUSE_TYPE = 4;
  BatchedDOMEvent.KEY_TYPE = 5; //TODO: Or are Keys Pointers, as they were in previous sceneries?

  inherit( Object, BatchedDOMEvent, {
    run: function( input ) {
      var domEvent = this.domEvent;
      var callback = this.callback;

      // process whether anything under the pointers changed before running additional input events
      sceneryEventLog && sceneryEventLog( 'validatePointers from batched event' );
      input.validatePointers();
      if ( input.logEvents ) { input.eventLog.push( 'validatePointers();' ); }

      //OHTWO TODO: switch?
      if ( this.type === BatchedDOMEvent.POINTER_TYPE ) {
        callback.call( input, domEvent.pointerId, domEvent.pointerType, input.pointFromEvent( domEvent ), domEvent );
      }
      else if ( this.type === BatchedDOMEvent.MS_POINTER_TYPE ) {
        callback.call( input, domEvent.pointerId, scenery.Input.msPointerType( domEvent ), input.pointFromEvent( domEvent ), domEvent );
      }
      else if ( this.type === BatchedDOMEvent.TOUCH_TYPE ) {
        for ( var i = 0; i < domEvent.changedTouches.length; i++ ) {
          // according to spec (http://www.w3.org/TR/touch-events/), this is not an Array, but a TouchList
          var touch = domEvent.changedTouches.item( i );

          callback.call( input, touch.identifier, input.pointFromEvent( touch ), domEvent );
        }
      }
      else if ( this.type === BatchedDOMEvent.MOUSE_TYPE ) {
        callback.call( input, input.pointFromEvent( domEvent ), domEvent );
      }
      else if ( this.type === BatchedDOMEvent.KEY_TYPE ) { //TODO: or should keys be handled with the other Pointers?
        callback.call( input, domEvent );
      }
      else {
        throw new Error( 'bad type value: ' + this.type );
      }
    },

    dispose: function() {
      // clear our references
      this.domEvent = null;
      this.callback = null;
      this.freeToPool();
    }
  } );

  BatchedDOMEvent.fromPointerEvent = function( domEvent, pointFromEvent ) {
    return BatchedDOMEvent.createFromPool( domEvent, pointFromEvent( domEvent ), domEvent.pointerId );
  };

  /* jshint -W064 */
  PoolableMixin( BatchedDOMEvent, {
    constructorDuplicateFactory: function( pool ) {
      return function( domEvent, type, callback ) {
        if ( pool.length ) {
          var result = pool.pop();
          BatchedDOMEvent.call( result, domEvent, type, callback );
          return result;
        }
        else {
          return new BatchedDOMEvent( domEvent, type, callback );
        }
      };
    }
  } );

  return BatchedDOMEvent;
} );