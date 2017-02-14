// Copyright 2013-2017, University of Colorado Boulder

/**
 * TODO: doc
 *
 * TODO: unit tests
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var scenery = require( 'SCENERY/scenery' );
  var Vector2 = require( 'DOT/Vector2' );
  var PressListener = require( 'SCENERY/listeners/PressListener' );
  var TransformTracker = require( 'SCENERY/util/TransformTracker' );

  /**
   * TODO: doc
   */
  function DragListener( options ) {
    options = _.extend( {
      allowTouchSnag: false, // TODO: decide on appropriate default
      applyOffset: true,
      trackAncestors: false,
      translateNode: false,
      transform: null,
      locationProperty: null, // TODO doc
      mapLocation: null, // TODO: doc
      dragBounds: null, // TODO: support mutability for this type of thing (or support Property.<Bounds2>)
      start: null,
      end: null
    }, options );

    assert && assert( !options.mapLocation || !options.dragBounds,
      'mapLocation and dragBounds cannot both be provided, as they both handle mapping of the drag point' );

    PressListener.call( this, options );

    this._allowTouchSnag = options.allowTouchSnag;
    this._applyOffset = options.applyOffset;
    this._trackAncestors = options.trackAncestors;
    this._translateNode = options.translateNode;
    this._transform = options.transform;
    this._locationProperty = options.locationProperty;
    this._mapLocation = options.mapLocation;
    this._dragBounds = options.dragBounds;
    this._start = options.start;
    this._end = options.end;

    // TODO: scratch vectors?
    this.initialLocalPoint = null;
    this.parentPoint = new Vector2();
    this.modelPoint = new Vector2();

    this._transformTracker = null;
    this._transformTrackerListener = this.ancestorTransformed.bind( this );
  }

  scenery.register( 'DragListener', DragListener );

  inherit( PressListener, DragListener, {
    // TODO: Handle specifying the pressed trail, so this is done accurately?
    // Most general: pass in a predicate to identify the last node in the trail (if we have a trail)
    globalToParentPoint: function( globalPoint ) {
      return this.pressedTrail.globalToParentPoint( globalPoint );
    },

    parentToLocalPoint: function( parentPoint ) {
      // TODO: test scale/rotation on our dragged thing
      return this.pressedTrail.lastNode().parentToLocalPoint( parentPoint );
    },

    localToParentPoint: function( localPoint ) {
      // TODO: test scale/rotation on our dragged thing
      return this.pressedTrail.lastNode().localToParentPoint( localPoint );
    },

    parentToModelPoint: function( parentPoint ) {
      // TODO: override
      if ( this._transform ) {
        return this._transform.inversePosition2( parentPoint );
      }
      else {
        return parentPoint;
      }
    },

    modelToParentPoint: function( modelPoint ) {
      // TODO: override
      if ( this._transform ) {
        return this._transform.transformPosition2( modelPoint );
      }
      else {
        return modelPoint;
      }
    },

    // mark as overrideable
    mapModelPoint: function( modelPoint ) {
      if ( this._mapLocation ) {
        return this._mapLocation( modelPoint );
      }
      else if ( this._dragBounds ) {
        return this._dragBounds.closestPointTo( modelPoint );
      }
      else {
        return modelPoint;
      }
    },

    press: function( event ) {
      PressListener.prototype.press.call( this, event ); // TODO: do we need to delay notification with options release?

      this.attachTransformTracker();

      // TODO: scratch vectors
      this.initialLocalPoint = this.parentToLocalPoint( this.globalToParentPoint( this.pointer.point ) );

      this.reposition( this.pointer.point );

      this._start && this._start( event );
    },

    release: function( event ) {
      PressListener.prototype.release.call( this, event );

      this.detachTransformTracker();

      this._end && this._end( event );
    },

    drag: function( event ) {
      // NOTE: This is done first, before the drag listener is called
      this.reposition( this.pointer.point );

      //TODO ignore global moves that have zero length (Chrome might autofire, see https://code.google.com/p/chromium/issues/detail?id=327114)
      //TODO: should this apply in PressListener's drag?
      PressListener.prototype.drag.call( this, event );
    },

    // TODO: hardcode pointer.point?
    reposition: function( globalPoint ) {
      // TODO: scratch vectors, better codepath for minimizing computation
      var parentPointerPoint = this.globalToParentPoint( globalPoint );
      var parentLocalPoint = this.localToParentPoint( this.initialLocalPoint );
      var parentOriginPoint = this.localToParentPoint( new Vector2() ); // usually node.translation
      var parentOffset = parentOriginPoint.minus( parentLocalPoint );
      this.parentPoint = this._applyOffset ? parentPointerPoint.plus( parentOffset ) : parentPointerPoint;
      this.modelPoint = this.mapModelPoint( this.parentToModelPoint( this.parentPoint ) );
      this.parentPoint = this.modelToParentPoint( this.modelPoint ); // apply any mapping changes

      if ( this._translateNode ) {
        this.pressedTrail.lastNode().translation = this.parentPoint;
      }

      if ( this._locationProperty ) {
        this._locationProperty.value = this.modelPoint;
      }

      // TODO: consider other options to handle here
    },

    ancestorTransformed: function() {
      this.reposition( this.pointer.point );
    },

    touchenter: function( event ) {
      this.tryTouchSnag( event );
    },

    touchmove: function( event ) {
      this.tryTouchSnag( event );
    },

    tryTouchSnag: function( event ) {
      if ( this._allowTouchSnag ) {
        this.tryPress( event );
      }
    },

    attachTransformTracker: function() {
      if ( this._trackAncestors ) {
        this._transformTracker = new TransformTracker( this.pressedTrail.copy().removeDescendant() );
        this._transformTracker.addListener( this._transformTrackerListener );
      }
    },

    detachTransformTracker: function() {
      if ( this._transformTracker ) {
        this._transformTracker.removeListener( this._transformTrackerListener );
        this._transformTracker.dispose();
        this._transformTracker = null;
      }
    },

    dispose: function() {
      this.detachTransformTracker();

      PressListener.prototype.dispose.call( this );
    }

  } );

  return DragListener;
} );
