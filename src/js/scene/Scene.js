// Copyright 2002-2012, University of Colorado

/**
 * Main scene
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

var scenery = scenery || {};

(function(){
  "use strict";
  
  scenery.Scene = function( main ) {
    var that = this;
    
    // TODO: support changing the root
    this.root = new scenery.Node();
    this.root.scene = this;
    
    // main layers in a scene
    this.layers = [];
    
    // listeners that will be triggered by input events if they are not handled by the associated finger or on the trail
    this.inputListeners = [];
    
    // UI DOM layer for DOM elements that need to be interacted with
    this.uiLayer = new scenery.DOMLayer( {
      scene: this,
      main: main
    } );
    
    this.main = main;
    
    this.sceneBounds = new phet.math.Bounds2( 0, 0, main.width(), main.height() );
    
    // default to a canvas layer type, but this can be changed
    this.preferredLayerType = scenery.LayerType.Canvas;
    
    applyCSSHacks( main );
    
    // note, arguments to the functions are mutable. don't destroy them
    this.eventListener = {
      insertChild: function( args ) {
        var parent = args.parent;
        var child = args.child;
        var index = args.index;
        var trail = args.trail;
      },
      
      removeChild: function( args ) {
        var parent = args.parent;
        var child = args.child;
        var index = args.index;
        var trail = args.trail;
      },
      
      dirtyBounds: function( args ) {
        var node = args.node;
        var localBounds = args.bounds;
        var transform = args.transform;
        var trail = args.trail;
      },
      
      layerRefresh: function( args ) {
        var node = args.node;
        var trail = args.trail;
      }
    };
    
    this.root.addEventListener( this.eventListener );
  };

  var Scene = scenery.Scene;
  
  function fullRender( node, state ) {
    node.enterState( state );
    
    if ( node._visible ) {
      node.renderSelf( state );
      
      var children = node.children;
      
      // check if we need to filter the children we render, and ignore nodes with few children (but allow 2, since that may prevent branches)
      if ( state.childRestrictedBounds && children.length > 1 ) {
        var localRestrictedBounds = node.globalToLocalBounds( state.childRestrictedBounds );
        
        // don't filter if every child is inside the bounds
        if ( !localRestrictedBounds.containsBounds( node.parentToLocalBounds( node._bounds ) ) ) {
          children = node.getChildrenWithinBounds( localRestrictedBounds );
        }
      }
      
      _.each( children, function( child ) {
        fullRender( child, state );
      } );
    }
    
    node.exitState( state );
  }

  Scene.prototype = {
    constructor: Scene,
    
    fullRenderCore: function() {
      
    },
    
    rebuildLayers: function() {
      // remove all of our tracked layers from the container, so we can fill it with fresh layers
      this.disposeLayers();
      
      var state = new scenery.LayerState();
      var layerEntries = state.buildLayers( new scenery.TrailPointer( this.root, true ), new scenery.TrailPointer( this.root, false ), null );
      
      throw new Error( 'rebuildLayers unimplemented' );
    },
    
    disposeLayers: function() {
      var scene = this;
      
      _.each( this.layers.slice( 0 ), function( layer ) {
        layer.dispose();
        scene.layers.splice( _.indexOf( scene.layers, layer ), 1 ); // TODO: better removal code!
      } );
    },
    
    layerLookup: function( trail ) {
      // TODO: add tree form for optimization
      
      phet.assert( !( trail.isEmpty() || trail.nodes[0] !== this.root ), 'layerLookup root matches' );
      
      if ( this.layers.length === 0 ) {
        throw new Error( 'no layers in the scene' );
      }
      
      for ( var i = 0; i < this.layers.length; i++ ) {
        var layer = this.layers[i];
        if ( trail.compare( layer.endPath ) !== 1 ) {
          return layer;
        }
      }
      
      throw new Error( 'node not contained in a layer' );
    },
    
    renderScene: function() {
      // validating bounds, similar to Piccolo2d
      this.root.validateBounds();
      // no paint validation needed, since we render everything
      this.refreshLayers();
      
      var state = new scenery.RenderState( this );
      fullRender( this.root, state );
      state.finish(); // handle cleanup for the last layer
      
      _.each( this.layers, function( layer ) {
        layer.resetDirtyRegions();
      } );
    },
    
    updateScene: function( args ) {
      // validating bounds, similar to Piccolo2d
      this.root.validateBounds();
      this.root.validatePaint();
      
      // if the layer structure needs to be changed due to nodes above layers being changed, do so
      this.refreshLayers();
      
      var scene = this;
      
      _.each( this.layers, function( layer ) {
        // don't repaint clean layers
        if ( layer.isDirty() ) {
          var dirtyBounds = layer.getDirtyBounds();
          var visibleDirtyBounds = layer.getDirtyBounds().intersection( scene.sceneBounds );
          
          if ( !visibleDirtyBounds.isEmpty() ) {
            scene.updateLayer( layer, args );
          }
        }
      } );
    },
    
    updateLayer: function( layer, args ) {
      // TODO: only render in dirty rectangles (modify state and checks?)
      var state = new scenery.RenderState( this );
      
      // switches to (and initializes) the layer
      var dirtyBounds = layer.getDirtyBounds();
      var visibleDirtyBounds = layer.getDirtyBounds().intersection( this.sceneBounds );
      layer.prepareDirtyRegions();
      state.pushClipShape( scenery.Shape.bounds( visibleDirtyBounds ) );
      state.childRestrictedBounds = visibleDirtyBounds;
      state.switchToLayer( layer );
      state.multiLayerRender = false; // don't allow it to switch layers at the start / end nodes
      
      if ( layer.startNode === layer.endNode ) {
        // the node and all of its descendants can just be rendered
        var node = layer.startNode;
        
        // walk up from the root to the node, applying transforms, clips, etc.
        _.each( node.getAncestors(), function( ancestor ) {
          ancestor.enterState( state );
          
          if ( !ancestor._visible ) {
            return; // completely bail
          }
        } );
        
        // then render the node and its children
        fullRender( node, state );
        
        // cooldown on the layer. we don't have to walk the state back down to the root
        state.finish();
      } else {
        this.partialUpdateLayer( state, layer, args );
      }
      
      // we are done rendering, so reset the layer's dirty regions
      layer.resetDirtyRegions();
    },
    
    partialUpdateLayer: function( state, layer, args ) {
      var startPath = layer.startNode.getPathToRoot();
      var endPath = layer.endNode.getPathToRoot();
      
      var minLength = Math.min( startPath.length, endPath.length );
      
      var depth;
      
      // run through parts that are the same start and end, since everything we want is under here
      for ( depth = 0; depth < minLength; depth++ ) {
        // bail on the first difference
        if ( startPath[depth] !== endPath[depth] ) {
          break;
        }
        
        if ( !startPath[depth]._visible ) {
          return; // none of our layer visible, bail
        }
        
        // apply transforms, clips, etc. that wouldn't be applied later
        // -2, since we will start rendering at [depth-1], and this will include everything
        if ( depth > 2 ) {
          startPath[depth-2].enterState( state );
        }
      }
      
      // now, our depth is the index of the first difference between startPath and endPath.
      
      /* Rendering partial contents under this node, with depth indexing into the startPath/endPath.
       *
       * Since we want to render just a single layer (and only nodes inside that layer), we need to handle children in one of three cases:
       * a) outside of bounds (none of child or its descendants in our layer):
       *      don't render it at all
       * b) at a boundary (some of the child or its descendants are in our layer):
       *      continue our recursive partial render through this child, but ONLY if the boundary is compatible (low bound <==> beforeRender, high bound <==> afterRender)
       * c) inside of bounds (all of the child and descendants are in our layer):
       *      render it like normally for greater efficiency
       *
       * Our startPath and endPath are the paths in the scene-graph from the root to both the nodes that mark the start and end of our layer.
       * Any node that is rendered must have a path that is essentially "between" these two.
       *
       * Depth is masked as a parameter here from the outside scope.
       */
      function recursivePartialRender( node, depth, hasLowBound, hasHighBound ) {
        if ( !hasLowBound && !hasHighBound ) {
          // if there are no bounds restrictions on children, just do a straight rendering
          fullRender( node, state );
          return;
        }
        
        // we are now assured that startPath[depth] !== endPath[depth], so each child is either high-bounded or low-bounded
        
        node.enterState( state );
    
        if ( node._visible ) {
          if ( !hasLowBound ) {
            node.renderSelf( state );
          }
          
          var passedLowBound = !hasLowBound;
          
          // check to see if we need to filter what children are rendered based on restricted bounds
          var localRestrictedBounds;
          var filterChildren = false;
          if ( state.childRestrictedBounds && node.children.length > 1 ) {
            localRestrictedBounds = node.globalToLocalBounds( state.childRestrictedBounds );
            
            // don't filter if all children will be inside the bounds
            filterChildren = !localRestrictedBounds.containsBounds( node.parentToLocalBounds( node._bounds ) );
          }
          
          // uses a classic for loop so we can bail out early
          for ( var i = 0; i < node.children.length; i++ ) {
            var child = node.children[i];
            
            if ( filterChildren && !localRestrictedBounds.intersectsBounds( child._bounds ) ) {
              continue;
            }
            
            // due to the calling conditions, we should be assured that startPath[depth] !== endPath[depth]
            
            if ( !passedLowBound ) {
              // if we haven't passed the low bound, it MUST exist, and we are either (a) not rendered, or (b) low-bounded
              
              if ( startPath[depth] === child ) {
                // only recursively render if the switch is "before" the node
                if ( startPath[depth]._layerBeforeRender === layer ) {
                  recursivePartialRender( child, depth + 1, startPath.length !== depth, false ); // if it has a low-bound, it can't have a high bound
                }
              
                // for later children, we have passed the low bound.
                passedLowBound = true;
              }
              
              // either way, go on to the next nodes
              continue;
            }
            
            if ( hasHighBound && endPath[depth] === child ) {
              // only recursively render if the switch is "after" the node
              if ( endPath[depth]._layerAfterRender === layer ) {
                // high-bounded here
                recursivePartialRender( child, depth + 1, false, endPath.length !== depth ); // if it has a high-bound, it can't have a low bound
              }
              
              // don't render any more children, since we passed the high bound
              break;
            }
            
            // we should now be in-between both the high and low bounds with no further restrictions, so just carry out the rendering
            fullRender( child, state );
          }
        }
        
        node.exitState( state );
      }
      
      recursivePartialRender( startPath[depth-1], depth, startPath.length !== depth, endPath.length !== depth );
      
      // for layer cooldown
      state.finish();
    },
    
    // attempt to render everything currently visible in the scene to an external canvas. allows copying from canvas layers straight to the other canvas
    // delayCounts will have increment() and decrement() called on it if asynchronous completion is needed.
    renderToCanvas: function( canvas, context, delayCounts ) {
      context.clearRect( 0, 0, canvas.width, canvas.height );
      _.each( this.layers, function( layer ) {
        layer.renderToCanvas( canvas, context, delayCounts );
      } );
    },
    
    // handles creation and adds it to our internal list
    createLayer: function( Constructor, args ) {
      var layer = new Constructor( args );
      this.layers.push( layer );
      return layer;
    },
    
    resize: function( width, height ) {
      this.main.width( width );
      this.main.height( height );
      this.sceneBounds = new phet.math.Bounds2( 0, 0, width, height );
      this.rebuildLayers();
    },
    
    // called on the root node when any layer-relevant changes are made
    // TODO: add flags for this to happen, and call during renderFull. set flags on necessary functions
    oldRebuildLayers: function() {
      // a few variables for the closurelayer
      var main = this.main;
      var scene = this;
      
      // used so we can give each layer a "start" and "end" node
      var lastLayer = null;
      
      // mutable layer arguments (since z-indexing needs to be increased, etc.)
      var layerArgs = {
        main: main,
        scene: this
      };
      
      // remove everything from our container, so we can fill it in with fresh layers
      this.clearLayers();
      
      function layerChange( node, layerType, isBeforeRender ) {
        // the previous layer ends at this node, so mark that down
        lastLayer.endNode = node;
        
        // create the new layer, and give it the proper node reference
        var newLayer = scene.createLayer( layerType, layerArgs );
        if ( isBeforeRender ) {
          node._layerBeforeRender = newLayer;
        } else {
          node._layerAfterRender = newLayer;
        }
        
        // mark this node as the beginning of the layer
        newLayer.startNode = node;
        
        // hook the layers together so they know about each other
        lastLayer.nextLayer = newLayer;
        newLayer.previousLayer = lastLayer;
        
        // and prepare for the next call
        lastLayer = newLayer;
      }
      
      // for handling layers in depth-first fashion
      function recursiveRebuild( node, baseLayerType ) {
        var hasLayer = node._layerType !== null;
        if ( !hasLayer ) {
          // sanity checks, in case a layerType was removed
          node._layerBeforeRender = null;
          node._layerAfterRender = null;
        } else {
          // layers created in order, later
          
          // change the base layer type for the layer children
          // baseLayerType = node._layerType;
        }
        
        // for stacking, add the "before" layer before recursion
        if ( hasLayer ) {
          layerChange( node, node._layerType, true );
        }
        
        // let the node know what layer it's self will render inside of
        node._layerReference = lastLayer;
        
        // handle layers for children
        _.each( node.children, function( child ) {
          recursiveRebuild( child, baseLayerType );
        } );
        
        // and the "after" layer after recursion, on top of any child layers
        if ( hasLayer ) {
          layerChange( node, baseLayerType, false );
        }
      }
      
      // get the layer constructor
      var rootLayerType = this.root._layerType;
      
      // create the first layer (will be the only layer if no other nodes have a layerType)
      var startingLayer = scene.createLayer( rootLayerType, layerArgs );
      
      // no "after" layer needed for the root, since nothing is rendered after it
      this.root._layerBeforeRender = startingLayer;
      this.root._layerAfterRender = null;
      
      startingLayer.startNode = this.root;
      lastLayer = startingLayer;
      this.root._layerReference = startingLayer;
      
      // step through the recursion
      _.each( this.root.children, function( child ) {
        recursiveRebuild( child, rootLayerType );
      } );
      
      lastLayer.endNode = this.root;
      
      this.reindexLayers();
    },
    
    // after layer changes, the layers should have their zIndex updated
    reindexLayers: function() {
      var index = 1;
      _.each( this.layers, function( layer ) {
        // layers increment indices as needed
        index = layer.reindex( index );
      } );
      
      // place the UI layer on top
      index = this.uiLayer.reindex( index );
    },
    
    getUILayer: function() {
      return this.uiLayer;
    },
    
    layersDirtyUnder: function( node ) {
      if ( !this.dirtyLayerPath ) {
        this.dirtyLayerPath = node.getPathToRoot();
      } else {
        var nodePath = node.getPathToRoot();
        var maxIndex = Math.min( nodePath.length, this.dirtyLayerPath.length );
        for ( var i = 0; i < maxIndex; i++ ) {
          // cut the dirty layer path off before the first discrepancy
          if ( nodePath[i] !== this.dirtyLayerPath[i] ) {
            this.dirtyLayerPath = _.first( this.dirtyLayerPath, i );
            break;
          }
        }
      }
    },
    
    refreshLayers: function() {
      // no layers dirty here
      if ( !this.dirtyLayerPath ) {
        return;
      }
      
      // TODO: THIS FUNCTION: refreshLayers
      
      /*
        PSEUDOCODE:
        
        identify pre,post layers
        remove [pre+1,post] from scene
        if content:
          relayer starting with pre
        reassign "post" nodes to last content layer (could be pre, if so check if post==pre => reassignment not necessary)
        reattach pre <==> pre+1, last <==> post.next, and set up before/after handling
        reindex
      */
      
      // TODO: ensure that "valley" layers are created, even if currently unnecessary. this allows more efficient insertChild handling
      this.rebuildLayers();
      
      // reset the dirty layer path
      this.dirtyLayerPath = null;
    },
    
    addInputListener: function( listener ) {
      phet.assert( !_.contains( this.inputListeners, listener ) );
      
      this.inputListeners.push( listener );
    },
    
    removeInputListener: function( listener ) {
      var index = _.indexOf( this.inputListeners, listener );
      phet.assert( index !== -1 );
      
      this.inputListeners.splice( index, 1 );
    },
    
    getInputListeners: function() {
      return this.inputListeners.slice( 0 ); // defensive copy
    },
    
    initializeStandaloneEvents: function() {
      var element = this.main[0];
      this.initializeEvents( {
        preventDefault: true,
        listenerTarget: element,
        pointFromEvent: function( evt ) {
          var mainBounds = element.getBoundingClientRect();
          return new phet.math.Vector2( evt.clientX - mainBounds.left, evt.clientY - mainBounds.top );
        }
      } );
    },
    
    initializeFullscreenEvents: function() {
      this.initializeEvents( {
        preventDefault: true,
        listenerTarget: document,
        pointFromEvent: function( evt ) {
          return new phet.math.Vector2( evt.pageX, evt.pageY );
        }
      } );
    },
    
    initializeEvents: function( parameters ) {
      var scene = this;
      
      // TODO: come up with more parameter names that have the same string length, so it looks creepier
      var pointFromEvent = parameters.pointFromEvent;
      var listenerTarget = parameters.listenerTarget;
      var preventDefault = parameters.preventDefault;
      
      var input = new scenery.Input( scene );
      
      $( listenerTarget ).on( 'mousedown', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        input.mouseDown( pointFromEvent( evt ), evt );
      } );
      $( listenerTarget ).on( 'mouseup', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        input.mouseUp( pointFromEvent( evt ), evt );
      } );
      $( listenerTarget ).on( 'mousemove', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        input.mouseMove( pointFromEvent( evt ), evt );
      } );
      $( listenerTarget ).on( 'mouseover', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        input.mouseOver( pointFromEvent( evt ), evt );
      } );
      $( listenerTarget ).on( 'mouseout', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        input.mouseOut( pointFromEvent( evt ), evt );
      } );

      function forEachChangedTouch( evt, callback ) {
        for ( var i = 0; i < evt.changedTouches.length; i++ ) {
          // according to spec (http://www.w3.org/TR/touch-events/), this is not an Array, but a TouchList
          var touch = evt.changedTouches.item( i );
          
          callback( touch.identifier, pointFromEvent( touch ) );
        }
      }

      $( listenerTarget ).on( 'touchstart', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        forEachChangedTouch( evt, function( id, point ) {
          input.touchStart( id, point, evt );
        } );
      } );
      $( listenerTarget ).on( 'touchend', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        forEachChangedTouch( evt, function( id, point ) {
          input.touchEnd( id, point, evt );
        } );
      } );
      $( listenerTarget ).on( 'touchmove', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        forEachChangedTouch( evt, function( id, point ) {
          input.touchMove( id, point, evt );
        } );
      } );
      $( listenerTarget ).on( 'touchcancel', function( jEvent ) {
        var evt = jEvent.originalEvent;
        if ( preventDefault ) { jEvent.preventDefault(); }
        forEachChangedTouch( evt, function( id, point ) {
          input.touchCancel( id, point, evt );
        } );
      } );
    },
    
    resizeOnWindowResize: function() {
      var scene = this;
      
      var resizer = function () {
        scene.resize( window.innerWidth, window.innerHeight );
      };
      $( window ).resize( resizer );
      resizer();
    }
  };
  
  function applyCSSHacks( main ) {
    // some css hacks (inspired from https://github.com/EightMedia/hammer.js/blob/master/hammer.js)
    (function() {
      var prefixes = [ '-webkit-', '-moz-', '-ms-', '-o-', '' ];
      var properties = {
        userSelect: 'none',
        touchCallout: 'none',
        touchAction: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
      };
      
      _.each( prefixes, function( prefix ) {
        _.each( properties, function( propertyValue, propertyName ) {
          main.css( prefix + propertyName, propertyValue );
        } );
      } );
    })();
  }
})();
