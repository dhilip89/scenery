// Copyright 2015, University of Colorado Boulder

/**
 * An accessible peer controls the appearance of an accessible Node's instance in the parallel DOM.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Jesse Greenberg
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Poolable = require( 'PHET_CORE/Poolable' );
  var Events = require( 'AXON/Events' );
  var scenery = require( 'SCENERY/scenery' );
  var Display = require( 'SCENERY/display/Display' );

  var globalId = 1;

  /**
   * Constructor.
   *
   * @param  {AccessibleInstance} accessibleInstance
   * @param  {DOMElement} domElement - The main DOM element used for this peer.
   * @param  {Object} options
   * @constructor
   */
  function AccessiblePeer( accessibleInstance, domElement, options ) {
    this.initializeAccessiblePeer( accessibleInstance, domElement, options );
  }

  scenery.register( 'AccessiblePeer', AccessiblePeer );

  inherit( Events, AccessiblePeer, {

    /**
     * @param {AccessibleInstance} accessibleInstance
     * @param {DOMElement} domElement - The main DOM element used for this peer.
     * @param {Object} [options]
     */
    initializeAccessiblePeer: function( accessibleInstance, domElement, options ) {
      var self = this;

      options = _.extend( {
        parentContainerElement: null, // a parent container for this peer and potential siblings
        childContainerElement: null // an child container element where nested elements can be placed
      }, options );

      Events.call( this ); // TODO: is Events worth mixing in by default? Will we need to listen to events?

      assert && assert( !this.id || this.disposed, 'If we previously existed, we need to have been disposed' );

      // unique ID
      this.id = this.id || globalId++;

      // @public
      this.accessibleInstance = accessibleInstance;
      this.domElement = domElement;
      this.display = accessibleInstance.display;
      this.trail = accessibleInstance.trail;

      // @private - descendent of domElement that can be used to hold nested children
      this.childContainerElement = options.childContainerElement ? options.childContainerElement : ( this.childContainerElement || null );

      // @private - a parent element that can contain this domElement and other siblings
      this.parentContainerElement = options.parentContainerElement ? options.parentContainerElement : ( this.parentContainerElement || null );
      if ( this.parentContainerElement ) {
        var peerDOMElement = this.domElement;

        // The first child of the parent container element should be the peer dom element
        // if undefined, the insertBefore method will insert the peerDOMElement as the first child
        var firstChild = this.parentContainerElement.children[ 0 ];

        // the peer should now be positioned relative to the parent container
        this.domElement = this.parentContainerElement;
        this.domElement.insertBefore( peerDOMElement, firstChild );
      }

      this.disposed = false;

      // @private - listener for the focus event, to be disposed
      self.focusEventListener = function( event ) {
        if ( event.target === self.domElement ) {
          Display.focus = {
            display: accessibleInstance.display,
            trail: accessibleInstance.trail
          };
        }
      };
      this.domElement.addEventListener( 'focus', self.focusEventListener );

      // @private - listener for the blur event, to be disposed
      self.blurEventListener = function( event ) {
        if ( event.target === self.domElement ) {
          Display.focus = null;
        }
      };
      this.domElement.addEventListener( 'blur', self.blurEventListener );

      return this;
    },

    getChildContainerElement: function() {
      return this.childContainerElement || this.domElement;
    },

    dispose: function() {
      this.disposed = true;

      this.domElement.removeEventListener( 'blur', this.blurEventListener );
      this.domElement.removeEventListener( 'focus', this.focusEventListener );

      // for now
      this.freeToPool && this.freeToPool();
    }
  } );

  // TODO: evaluate pooling, and is it OK to pool only some peers?
  AccessiblePeer.Poolable = {
    mixin: function( selfDrawableType ) {
      // for pooling, allow <AccessiblePeerType>.createFromPool( accessibleInstance ) and accessiblePeer.freeToPool().
      // Creation will initialize the peer to an initial state.
      Poolable.mixin( selfDrawableType, {
        defaultFactory: function() {
          return new selfDrawableType();
        },
        constructorDuplicateFactory: function( pool ) {
          return function( accessibleInstance ) {
            if ( pool.length ) {
              return pool.pop().initialize( accessibleInstance );
            }
            else {
              return new selfDrawableType( accessibleInstance );
            }
          };
        }
      } );
    }
  };

  return AccessiblePeer;
} );
