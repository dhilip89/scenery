// Copyright 2002-2012, University of Colorado

/**
 * A DOM-based layer in the scene graph. Each layer handles dirty-region handling separately,
 * and corresponds to a single canvas / svg element / DOM element in the main container.
 * Importantly, it does not contain rendered content from a subtree of the main
 * scene graph. It only will render a contiguous block of nodes visited in a depth-first
 * manner.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  "use strict";
  
  var assert = require( 'ASSERT/assert' )( 'scenery' );
  
  var Bounds2 = require( 'DOT/Bounds2' );
  
  var scenery = require( 'SCENERY/scenery' );
  
  var Layer = require( 'SCENERY/Layer' );
  var Trail = require( 'SCENERY/Trail' );
  
  var svgns = 'http://www.w3.org/2000/svg';
  var xlinkns = 'http://www.w3.org/1999/xlink';
  
  scenery.SVGLayer = function( args ) {
    var $main = args.$main;
    
    this.svg = document.createElementNS( svgns, 'svg' );
    this.g = document.createElementNS( svgns, 'g' );
    this.svg.appendChild( this.g );
    this.$svg = $( this.svg );
    this.svg.setAttribute( 'width', $main.width() );
    this.svg.setAttribute( 'height', $main.height() );
    this.svg.setAttribute( 'stroke-miterlimit', 10 ); // to match our Canvas brethren so we have the same default behavior
    this.$svg.css( 'position', 'absolute' );
    $main.append( this.svg );
    
    this.scene = args.scene;
    
    this.isSVGLayer = true;
    
    // maps trail ID => SVG self fragment (that displays shapes, text, etc.)
    this.idFragmentMap = {};
    
    // maps trail ID => SVG <g> that contains that node's self and everything under it
    this.idGroupMap = {};
    
    this.temporaryDebugFlagSoWeDontUpdateBoundariesMoreThanOnce = false;
    
    Layer.call( this, args );
  };
  var SVGLayer = scenery.SVGLayer;
  
  SVGLayer.prototype = _.extend( {}, Layer.prototype, {
    constructor: SVGLayer,
    
    applyGroup: function( node, group ) {
      if ( node.transform.isIdentity() ) {
        if ( group.hasAttribute( 'transform' ) ) {
          group.removeAttribute( 'transform' );
        }
      } else {
        group.setAttribute( 'transform', node.transform.getMatrix().svgTransform() );
      }
    },
    
    // FIXME: ordering of group trees is currently not guaranteed (this just appends right now, so they need to be ensured in the proper order)
    ensureGroupTree: function( trail ) {
      if ( !( trail.getUniqueId() in this.idGroupMap ) ) {
        var subtrail = new Trail( trail.rootNode() );
        var lastId = null;
        
        // walk a subtrail up from the root node all the way to the full trail, creating groups where necessary
        while ( subtrail.length <= trail.length ) {
          var id = subtrail.getUniqueId();
          if ( !( id in this.idGroupMap ) ) {
            var group = document.createElementNS( svgns, 'g' );
            this.applyGroup( subtrail.lastNode(), group );
            this.idGroupMap[id] = group;
            if ( lastId ) {
              // we have a parent group to which we need to be added
              // TODO: handle the ordering here if we ensure group trees!
              this.idGroupMap[lastId].appendChild( group );
            } else {
              // no parent, so append ourselves to the SVGLayer's master group
              this.g.appendChild( group );
            }
          }
          subtrail.addDescendant( trail.nodes[subtrail.length] );
          lastId = id;
        }
      }
    },
    
    updateBoundaries: function( entry ) {
      if ( this.temporaryDebugFlagSoWeDontUpdateBoundariesMoreThanOnce ) {
        throw new Error( 'temporaryDebugFlagSoWeDontUpdateBoundariesMoreThanOnce!' );
      }
      this.temporaryDebugFlagSoWeDontUpdateBoundariesMoreThanOnce = true;
      
      Layer.prototype.updateBoundaries.call( this, entry );
      
      var layer = this;
      
      // TODO: consider removing SVG fragments from our dictionary? if we burn through a lot of one-time fragments we will memory leak like crazy
      // TODO: handle updates. insertion is helpful based on the trail, as we can find where to insert nodes
      
      this.startPointer.eachTrailBetween( this.endPointer, function( trail ) {
        var node = trail.lastNode();
        var trailId = trail.getUniqueId();
        
        layer.ensureGroupTree( trail );
        
        if ( node.hasSelf() ) {
          var svgFragment = node.createSVGFragment();
          layer.idFragmentMap[trailId] = svgFragment;
          layer.idGroupMap[trailId].appendChild( svgFragment );
        }
      } );
    },
    
    render: function( scene, args ) {
      // nothing at all needed here, CSS transforms taken care of when dirty regions are notified
    },
    
    dispose: function() {
      this.$svg.detach();
    },
    
    markDirtyRegion: function( node, localBounds, transform, trail ) {
      // not necessary, SVG takes care of handling this (or would just redraw everything anyways)
    },
    
    transformChange: function( args ) {
      var node = args.node;
      var trail = args.trail;
      
      var group = this.idGroupMap[trail.getUniqueId()];
      
      // apply the transform to the group
      this.applyGroup( node, group );
    },
    
    // TODO: consider a stack-based model for transforms?
    applyTransformationMatrix: function( matrix ) {
      // nothing at all needed here
    },
    
    getContainer: function() {
      return this.svg;
    },
    
    // returns next zIndex in place. allows layers to take up more than one single zIndex
    reindex: function( zIndex ) {
      this.$svg.css( 'z-index', zIndex );
      this.zIndex = zIndex;
      return zIndex + 1;
    },
    
    pushClipShape: function( shape ) {
      // TODO: clipping
    },
    
    popClipShape: function() {
      // TODO: clipping
    },
    
    getSVGString: function() {
      // TODO: jQuery seems to be stripping namespaces, so figure that one out?
      return $( '<div>' ).append( this.$svg.clone() ).html();
      
      // also note:
      // var doc = document.implementation.createHTMLDocument("");
      // doc.write(html);
       
      // // You must manually set the xmlns if you intend to immediately serialize the HTML
      // // document to a string as opposed to appending it to a <foreignObject> in the DOM
      // doc.documentElement.setAttribute("xmlns", doc.documentElement.namespaceURI);
       
      // // Get well-formed markup
      // html = (new XMLSerializer).serializeToString(doc);
    },
    
    // TODO: note for DOM we can do https://developer.mozilla.org/en-US/docs/HTML/Canvas/Drawing_DOM_objects_into_a_canvas
    renderToCanvas: function( canvas, context, delayCounts ) {
      if ( window.canvg ) {
        delayCounts.increment();
        
        // TODO: if we are using CSS3 transforms, run that here
        canvg( canvas, this.getSVGString(), {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreDimensions: true,
          ignoreClear: true,
          renderCallback: function() {
            delayCounts.decrement();
          }
        } );
      } else {
        // will not work on Internet Explorer 9/10
        
        // TODO: very much not convinced that this is better than setting src of image
        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var raw = this.getSVGString();
        console.log( raw );
        var svg = new Blob( [ raw ] , { type: "image/svg+xml;charset=utf-8" } );
        var url = DOMURL.createObjectURL( svg );
        delayCounts.increment();
        img.onload = function() {
          context.drawImage( img, 0, 0 );
          // TODO: this loading is delayed!!! ... figure out a solution to potentially delay?
          DOMURL.revokeObjectURL( url );
          delayCounts.decrement();
        };
        img.src = url;
        
        throw new Error( 'this implementation hits Chrome bugs, won\'t work on IE9/10, etc. deprecated' );
      }
    },
    
    getName: function() {
      return 'svg';
    }
  } );
  
  return SVGLayer;
} );


