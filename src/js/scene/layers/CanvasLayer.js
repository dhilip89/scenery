// Copyright 2002-2012, University of Colorado

/**
 * A layer in the scene graph. Each layer handles dirty-region handling separately,
 * and corresponds to a single canvas / svg element / DOM element in the main container.
 * Importantly, it does not contain rendered content from a subtree of the main
 * scene graph. It only will render a contiguous block of nodes visited in a depth-first
 * manner.
 *
 * @author Jonathan Olson
 */

var phet = phet || {};
phet.scene = phet.scene || {};
phet.scene.layers = phet.scene.layers || {};

(function(){
    var Bounds2 = phet.math.Bounds2;
    
    // assumes main is wrapped with JQuery
    phet.scene.layers.CanvasLayer = function( args ) {
        var main = args.main;
        var canvas = document.createElement( 'canvas' );
        canvas.width = main.width();
        canvas.height = main.height();
        $( canvas ).css( 'z-index', args.zIndex );
        $( canvas ).css( 'position', 'absolute' );
        args.zIndex += 1;
        
        // add this layer on top (importantly, the constructors of the layers are called in order)
        main.append( canvas );
        
        this.canvas = canvas;
        this.context = phet.canvas.initCanvas( canvas );
        
        this.isCanvasLayer = true;
        
        // initialize to fully dirty so we draw everything the first time
        this.dirtyBounds = Bounds2.EVERYTHING;
        
        this.fillStyle = null;
        this.strokeStyle = null;
        
        // filled in after construction by an external source (currently Scene.rebuildLayers).
        this.startNode = null;
        this.endNode = null;
    };
    
    var CanvasLayer = phet.scene.layers.CanvasLayer;
    
    CanvasLayer.prototype = {
        constructor: CanvasLayer,
        
        // called when rendering switches to this layer
        initialize: function( renderState ) {
            // first, switch to an identity matrix so we can apply the global coordinate clipping shapes
            this.context.setTransform( 1, 0, 0, 1, 0, 0 );
            
            // save now, so that we can clear the clipping shapes later
            this.context.save();
            
            // apply clipping shapes in the global coordinate frame
            _.each( renderState.clipShapes, function( shape ) {
                this.context.beginPath();
                shape.writeToContext( this.context );
                this.context.clip();
            } );
            
            // set the context's transform to the current transformation matrix
            var matrix = renderState.transform.matrix;
            this.context.setTransform(
                // inlined array entries
                matrix.entries[0],
                matrix.entries[1],
                matrix.entries[3],
                matrix.entries[4],
                matrix.entries[6],
                matrix.entries[7]
            );
            
            // reset the styles so that they are re-done
            this.fillStyle = null;
            this.strokeStyle = null;
        },
        
        // called when rendering switches away from this layer
        cooldown: function() {
            this.context.restore();
        },
        
        isDirty: function() {
            return !this.dirtyBounds.isEmpty();
        },
        
        // TODO: consider a stack-based model for transforms?
        applyTransformationMatrix: function( matrix ) {
            this.context.transform( 
                // inlined array entries
                matrix.entries[0],
                matrix.entries[1],
                matrix.entries[3],
                matrix.entries[4],
                matrix.entries[6],
                matrix.entries[7]
            );
        },
        
        pushClipShape: function( shape ) {
            // store the current state, since browser support for context.resetClip() is not yet in the stable browser versions
            this.context.save();
            
            // set up the clipping
            this.context.beginPath();
            shape.writeToContext( this.context );
            this.context.clip();
        },
        
        popClipShape: function() {
            this.context.restore();
        },
        
        markDirtyRegion: function( bounds ) {
            // TODO: for performance, consider more than just a single dirty bounding box
            this.dirtyBounds = this.dirtyBounds.union( bounds );
        },
        
        clearDirtyRegions: function() {
            this.dirtyBounds = Bounds2.NOTHING;
        },
        
        setFillStyle: function( style ) {
            if( this.fillStyle != style ) {
                this.fillStyle = style;
                this.context.fillStyle = style;
            }
        },
        
        setStrokeStyle: function( style ) {
            if( this.strokeStyle != style ) {
                this.strokeStyle = style;
                this.context.strokeStyle = style;
            }
        }
    };
})();


