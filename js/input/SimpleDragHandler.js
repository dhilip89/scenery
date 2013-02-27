// Copyright 2002-2012, University of Colorado

/**
 * Basic dragging for a node.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  "use strict";
  
  var assert = require( 'ASSERT/assert' )( 'scenery' );
  
  var Matrix3 = require( 'DOT/Matrix3' );
  
  var scenery = require( 'SCENERY/scenery' );
  
  /*
   * Allowed options: {
   *    allowTouchSnag: false // allow touch swipes across an object to pick it up,
   *    start: null           // if non-null, called when a drag is started. start( finger, trail, event )
   *    drag: null            // if non-null, called when the user moves something with a drag (not a start or end event).
   *                                                                         drag( finger, trail, event )
   *    end: null             // if non-null, called when a drag is ended.   end( finger, trail, event )
   *    translate:            // if this exists, translate( { delta: _, oldPosition: _, position: _ } ) will be called instead of directly translating the node
   * }
   */
  scenery.SimpleDragHandler = function( options ) {
    var handler = this;
    
    this.options = _.extend( {
      allowTouchSnag: false,
    }, options );
    
    this.dragging              = false;     // whether a node is being dragged with this handler
    this.finger                = null;      // the finger doing the current dragging
    this.trail                 = null;      // stores the path to the node that is being dragged
    this.transform             = null;      // transform of the trail to our node (but not including our node, so we can prepend the deltas)
    this.node                  = null;      // the node that we are handling the drag for
    this.lastDragPoint         = null;      // the location of the drag at the previous event (so we can calculate a delta)
    this.startTransformMatrix  = null;      // the node's transform at the start of the drag, so we can reset on a touch cancel
    this.mouseButton           = undefined; // tracks which mouse button was pressed, so we can handle that specifically
    // TODO: consider mouse buttons as separate fingers?
    
    // if an ancestor is transformed, pin our node
    this.transformListener = {
      transform: function( args ) {
        if ( !handler.trail.isExtensionOf( args.trail, true ) ) {
          return;
        }
        
        var newMatrix = args.trail.getTransform().getMatrix();
        var oldMatrix = handler.transform.getMatrix();
        
        // if A was the trail's old transform, B is the trail's new transform, we need to apply (B^-1 A) to our node
        handler.node.prependMatrix( newMatrix.inverted().timesMatrix( oldMatrix ) );
        
        // store the new matrix so we can do deltas using it now
        handler.transform.set( newMatrix );
      }
    };
    
    // this listener gets added to the finger when it starts dragging our node
    this.dragListener = {
      // mouse/touch up
      up: function( event ) {
        assert && assert( event.finger === handler.finger );
        if ( !event.finger.isMouse || event.domEvent.button === handler.mouseButton ) {
          handler.endDrag( event );
        }
      },
      
      // touch cancel
      cancel: function( event ) {
        assert && assert( event.finger === handler.finger );
        handler.endDrag( event );
        
        // since it's a cancel event, go back!
        handler.node.setMatrix( handler.startTransformMatrix );
      },
      
      // mouse/touch move
      move: function( event ) {
        assert && assert( event.finger === handler.finger );
        
        var delta = handler.transform.inverseDelta2( handler.finger.point.minus( handler.lastDragPoint ) );
        
        // move by the delta between the previous point, using the precomputed transform
        // prepend the translation on the node, so we can ignore whatever other transform state the node has
        if ( handler.options.translate ) {
          var translation = handler.node.transform.getMatrix().translation();
          handler.options.translate( {
            delta: delta,
            oldPosition: translation,
            position: translation.plus( delta )
          } );
        } else {
          handler.node.translate( delta, true );
        }
        handler.lastDragPoint = handler.finger.point;
        
        if ( handler.options.drag ) {
          // TODO: consider adding in a delta to the listener
          // TODO: add the position in to the listener
          handler.options.drag( handler.finger, handler.trail, event ); // new position (old position?) delta
        }
      }
    };
  };
  var SimpleDragHandler = scenery.SimpleDragHandler;
  
  SimpleDragHandler.prototype = {
    constructor: SimpleDragHandler,
    
    startDrag: function( event ) {
      // set a flag on the finger so it won't pick up other nodes
      event.finger.dragging = true;
      event.finger.addInputListener( this.dragListener );
      event.trail.rootNode().addEventListener( this.transformListener );
      
      // set all of our persistent information
      this.dragging = true;
      this.finger = event.finger;
      this.trail = event.trail.subtrailTo( event.currentTarget, true );
      this.transform = this.trail.getTransform();
      this.node = event.currentTarget;
      this.lastDragPoint = event.finger.point;
      this.startTransformMatrix = event.currentTarget.getMatrix();
      this.mouseButton = event.domEvent.button; // should be undefined for touch events
      
      if ( this.options.start ) {
        this.options.start( event.finger, this.trail, event );
      }
    },
    
    endDrag: function( event ) {
      this.finger.dragging = false;
      this.finger.removeInputListener( this.dragListener );
      this.trail.rootNode().removeEventListener( this.transformListener );
      this.dragging = false;
      
      if ( this.options.end ) {
        this.options.end( event );
      }
    },
    
    tryToSnag: function( event ) {
      // only start dragging if the finger isn't dragging anything, we aren't being dragged, and if it's a mouse it's button is down
      if ( !this.dragging && !event.finger.dragging ) {
        this.startDrag( event );
      }
    },
    
    /*---------------------------------------------------------------------------*
    * events called from the node input listener
    *----------------------------------------------------------------------------*/
    
    // mouse/touch down on this node
    down: function( event ) {
      this.tryToSnag( event );
    },
    
    // touch enters this node
    touchenter: function( event ) {
      // allow touches to start a drag by moving "over" this node
      if ( this.options.allowTouchSnag ) {
        this.tryToSnag( event );
      }
    }
  };
  
  return SimpleDragHandler;
} );


