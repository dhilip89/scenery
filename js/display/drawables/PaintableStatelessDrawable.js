// Copyright 2016, University of Colorado Boulder

/**
 * A mixin to drawables for Paintable nodes that does not store the fill/stroke state, as it just needs to track
 * dirtyness overall.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var scenery = require( 'SCENERY/scenery' );
  var PaintObserver = require( 'SCENERY/display/PaintObserver' );

  var PaintableStatelessDrawable = {
    mixin: function( drawableType ) {
      var proto = drawableType.prototype;

      proto.initializePaintableStateless = function( renderer, instance ) {
        this.fillCallback = this.fillCallback || this.markDirtyFill.bind( this );
        this.strokeCallback = this.strokeCallback || this.markDirtyStroke.bind( this );
        this.fillObserver = this.fillObserver || new PaintObserver( 'fill', this.fillCallback );
        this.strokeObserver = this.strokeObserver || new PaintObserver( 'stroke', this.strokeCallback );

        this.fillObserver.initialize( instance.node );
        this.strokeObserver.initialize( instance.node );

        return this;
      };

      proto.disposePaintableStateless = function() {
        this.fillObserver.clean();
        this.strokeObserver.clean();
      };

      proto.markDirtyFill = function() {
        this.markPaintDirty();
        this.fillObserver.update(); // TODO: look into having the fillObserver be notified of Node changes as our source
      };

      proto.markDirtyStroke = function() {
        this.markPaintDirty();
        this.strokeObserver.update(); // TODO: look into having the strokeObserver be notified of Node changes as our source
      };

      proto.markDirtyLineWidth = function() {
        this.markPaintDirty();
      };

      proto.markDirtyLineOptions = function() {
        this.markPaintDirty();
      };

      proto.markDirtyCachedPaints = function() {
        this.markPaintDirty();
      };
    }
  };

  scenery.register( 'PaintableStatelessDrawable', PaintableStatelessDrawable );

  return PaintableStatelessDrawable;
} );