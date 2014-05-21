// Copyright 2002-2014, University of Colorado

/**
 * Handles a visual SVG layer of drawables.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';
  
  var inherit = require( 'PHET_CORE/inherit' );
  var Poolable = require( 'PHET_CORE/Poolable' );
  var cleanArray = require( 'PHET_CORE/cleanArray' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var scenery = require( 'SCENERY/scenery' );
  var FittedBlock = require( 'SCENERY/display/FittedBlock' );
  var SVGGroup = require( 'SCENERY/display/SVGGroup' );
  
  scenery.SVGBlock = function SVGBlock( display, renderer, transformRootInstance, filterRootInstance ) {
    this.initialize( display, renderer, transformRootInstance, filterRootInstance );
  };
  var SVGBlock = scenery.SVGBlock;
  
  inherit( FittedBlock, SVGBlock, {
    initialize: function( display, renderer, transformRootInstance, filterRootInstance ) {
      this.initializeFittedBlock( display, renderer, transformRootInstance );
      
      this.filterRootInstance = filterRootInstance;
      
      this.dirtyGroups = cleanArray( this.dirtyGroups );
      this.dirtyDrawables = cleanArray( this.dirtyDrawables );
      
      if ( !this.domElement ) {
        // main SVG element
        this.svg = document.createElementNS( scenery.svgns, 'svg' );
        // this.svg.setAttribute( 'width', width );
        // this.svg.setAttribute( 'height', height );
        this.svg.setAttribute( 'stroke-miterlimit', 10 ); // to match our Canvas brethren so we have the same default behavior
        this.svg.style.position = 'absolute';
        this.svg.style.left = '0';
        this.svg.style.top = '0';
        // this.svg.style.clip = 'rect(0px,' + width + 'px,' + height + 'px,0px)';
        this.svg.style['pointer-events'] = 'none';
        
        // the <defs> block that we will be stuffing gradients and patterns into
        this.defs = document.createElementNS( scenery.svgns, 'defs' );
        this.svg.appendChild( this.defs );
        
        this.baseTransformGroup = document.createElementNS( scenery.svgns, 'g' );
        this.svg.appendChild( this.baseTransformGroup );
        
        this.domElement = this.svg;
      }
      
      // reset what layer fitting can do
      this.svg.style.transform = ''; // no transform
      this.baseTransformGroup.setAttribute( 'transform', '' ); // no base transform
      
      var instanceClosestToRoot = transformRootInstance.trail.nodes.length > filterRootInstance.trail.nodes.length ? filterRootInstance : transformRootInstance;
      
      this.rootGroup = SVGGroup.createFromPool( this, instanceClosestToRoot, null );
      this.baseTransformGroup.appendChild( this.rootGroup.svgGroup );
      
      // TODO: dirty list of nodes (each should go dirty only once, easier than scanning all?)
      
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( 'initialized #' + this.id );
      
      return this;
    },
    
    markDirtyGroup: function( block ) {
      this.dirtyGroups.push( block );
      this.markDirty();
    },
    
    markDirtyDrawable: function( drawable ) {
      sceneryLayerLog && sceneryLayerLog.dirty && sceneryLayerLog.dirty( 'markDirtyDrawable on SVGBlock#' + this.id + ' with ' + drawable.toString() );
      this.dirtyDrawables.push( drawable );
      this.markDirty();
    },
    
    update: function() {
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( 'update #' + this.id );
      
      if ( this.dirty && !this.disposed ) {
        this.dirty = false;
        
        //OHTWO TODO: call here!
        while ( this.dirtyGroups.length ) {
          this.dirtyGroups.pop().update();
        }
        while ( this.dirtyDrawables.length ) {
          this.dirtyDrawables.pop().update();
        }
        
        // checks will be done in updateFit() to see whether it is needed
        this.updateFit();
      }
    },
    
    dispose: function() {
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( 'dispose #' + this.id );
      
      // make it take up zero area, so that we don't use up excess memory
      this.svg.setAttribute( 'width', 0 );
      this.svg.setAttribute( 'height', 0 );
      
      // clear references
      this.filterRootInstance = null;
      cleanArray( this.dirtyGroups );
      cleanArray( this.dirtyDrawables );
      
      this.baseTransformGroup.removeChild( this.rootGroup.svgGroup );
      this.rootGroup.dispose();
      this.rootGroup = null;
      
      FittedBlock.prototype.dispose.call( this );
    },
    
    addDrawable: function( drawable ) {
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( '#' + this.id + '.addDrawable ' + drawable.toString() );
      
      FittedBlock.prototype.addDrawable.call( this, drawable );
      
      SVGGroup.addDrawable( this, drawable );
      drawable.updateDefs( this.defs );
    },
    
    removeDrawable: function( drawable ) {
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( '#' + this.id + '.removeDrawable ' + drawable.toString() );
      
      SVGGroup.removeDrawable( this, drawable );
      drawable.parentDrawable = null;
      
      FittedBlock.prototype.removeDrawable.call( this, drawable );
      
      // NOTE: we don't unset the drawable's defs here, since it will either be disposed (will clear it)
      // or will be added to another SVGBlock (which will overwrite it)
    },
    
    notifyInterval: function( firstDrawable, lastDrawable ) {
      sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( '#' + this.id + '.notifyInterval ' + firstDrawable.toString() + ' to ' + lastDrawable.toString() );
      
      FittedBlock.prototype.notifyInterval.call( this, firstDrawable, lastDrawable );
    },
    
    toString: function() {
      return 'SVGBlock#' + this.id + ' ' + FittedBlock.fitString[this.fit];
    }
  } );
  
  /* jshint -W064 */
  Poolable( SVGBlock, {
    constructorDuplicateFactory: function( pool ) {
      return function( display, renderer, transformRootInstance, filterRootInstance ) {
        if ( pool.length ) {
          sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( 'new from pool' );
          return pool.pop().initialize( display, renderer, transformRootInstance, filterRootInstance );
        } else {
          sceneryLayerLog && sceneryLayerLog.SVGBlock && sceneryLayerLog.SVGBlock( 'new from constructor' );
          return new SVGBlock( display, renderer, transformRootInstance, filterRootInstance );
        }
      };
    }
  } );
  
  return SVGBlock;
} );
